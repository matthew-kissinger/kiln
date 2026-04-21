/**
 * Claude-backed Kiln code generator
 *
 * Headless wrapper over the Claude Agent SDK that mirrors the server's
 * packages/server/src/services/claude.ts generateKilnCode path. Intentionally
 * duplicated for the core spike so there's no cross-package runtime dep.
 * W2 dedupes this with the server implementation.
 */

import { query } from '@anthropic-ai/claude-agent-sdk';

import {
  buildUserPrompt,
  getSystemPrompt,
  type KilnGenerateRequest,
  type RenderMode,
} from './prompt';
import { validate } from './validation';

// =============================================================================
// Types
// =============================================================================

export interface KilnGenerateResult {
  success: boolean;
  code?: string;
  effectCode?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  sessionId?: string;
  error?: string;
}

const KILN_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    code: {
      type: 'string',
      description:
        'JavaScript code with const meta, function build(), and optionally function animate()',
    },
    effectCode: {
      type: 'string',
      description: 'TSL shader code (for tsl/both modes only)',
    },
  },
  required: ['code'],
};

// =============================================================================
// Public API
// =============================================================================

/**
 * Generate Kiln code (LLM only, no rendering). Mirrors the server's
 * generateKilnCode semantics: validates GLB output and retries once with
 * feedback if validation fails.
 */
export async function generateKilnCode(
  request: KilnGenerateRequest
): Promise<KilnGenerateResult> {
  try {
    const userPrompt = buildUserPrompt(request);
    const systemPrompt = getSystemPrompt(request.mode);

    const result = await runStructuredQuery(userPrompt, systemPrompt, request.mode);

    if (!result.success) return result;

    // Validate GLB code
    if (result.code && request.mode !== 'tsl') {
      const validation = validate(result.code);
      if (!validation.valid) {
        return retryWithFeedback(request, result.code, validation.errors);
      }
    }

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

// =============================================================================
// Internal
// =============================================================================

async function runStructuredQuery(
  userPrompt: string,
  systemPrompt: string,
  _mode: RenderMode
): Promise<KilnGenerateResult> {
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 300_000);

  try {
    const q = query({
      prompt: userPrompt,
      options: {
        abortController,
        model: 'claude-opus-4-6',
        systemPrompt,
        maxTurns: 3,
        outputFormat: {
          type: 'json_schema',
          schema: KILN_OUTPUT_SCHEMA,
        },
        permissionMode: 'bypassPermissions',
        allowDangerouslySkipPermissions: true,
      },
    });

    for await (const message of q) {
      if (message.type === 'result' && message.subtype === 'success') {
        if (message.structured_output) {
          const output = message.structured_output as { code: string; effectCode?: string };
          return {
            success: true,
            code: output.code,
            effectCode: output.effectCode,
            sessionId: message.session_id,
          };
        }
        return parseResultText(message.result, message.session_id);
      }
      if (message.type === 'result' && message.subtype?.startsWith('error')) {
        const errors = (message as Record<string, unknown>).errors;
        return {
          success: false,
          error: Array.isArray(errors) ? errors.join('; ') : 'Generation failed',
        };
      }
      if (message.type === 'auth_status' && message.error) {
        return {
          success: false,
          error: `Auth failed: ${message.error}. Run "claude auth login".`,
        };
      }
    }

    return { success: false, error: 'No result received from query' };
  } finally {
    clearTimeout(timeout);
  }
}

async function retryWithFeedback(
  request: KilnGenerateRequest,
  failedCode: string,
  errors: string[]
): Promise<KilnGenerateResult> {
  const retryPrompt = `Previous attempt had validation errors:
${errors.map((e) => `- ${e}`).join('\n')}

Failed code:
\`\`\`javascript
${failedCode}
\`\`\`

Fix these issues and regenerate. Remember: NO imports, NO exports, use rotation:/position: not value: in keyframes.`;

  const systemPrompt = getSystemPrompt(request.mode);

  try {
    return await runStructuredQuery(retryPrompt, systemPrompt, request.mode);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Retry failed: ${message}` };
  }
}

function parseResultText(result: string, sessionId?: string): KilnGenerateResult {
  if (!result) return { success: false, error: 'Empty result text' };

  // Try JSON first.
  try {
    const parsed = JSON.parse(result);
    if (parsed.code) {
      return {
        success: true,
        code: parsed.code,
        effectCode: parsed.effectCode,
        sessionId,
      };
    }
  } catch {
    // Not JSON - fall through to code fence extraction.
  }

  const geoMatch = result.match(
    /```(?:geometry|typescript|javascript|js)?\n?([\s\S]*?function build[\s\S]*?)```/
  );
  if (geoMatch?.[1]) {
    const effectMatch = result.match(
      /```(?:effect|typescript)\n?(import[\s\S]*?export \{ material \}[\s\S]*?)```/
    );
    return {
      success: true,
      code: geoMatch[1].trim(),
      effectCode: effectMatch?.[1]?.trim(),
      sessionId,
    };
  }

  return { success: true, code: result.trim(), sessionId };
}

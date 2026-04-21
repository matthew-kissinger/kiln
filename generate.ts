/**
 * Claude-backed Kiln code generator
 *
 * Headless wrapper over the Claude Agent SDK. Drives prompt -> code
 * generation (via structured JSON output) and the companion refactor flows:
 * - generateKilnCode  — primary generate path with validate+retry
 * - editKilnCode      — generate with an `existingCode` edit target
 * - compactCode       — code-golf pass via Haiku
 * - refactorCode      — structured edit with geometry + effect targeting
 *
 * Replaces the duplicate implementation that previously lived in
 * packages/server/src/services/claude.ts; the server now delegates to
 * these entry points.
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

export interface RefactorRequest {
  instruction: string;
  geometryCode?: string;
  effectCode?: string;
  target: 'geometry' | 'effect' | 'both';
}

/** Per-call tunables for the Opus generate path. */
export interface KilnGenerateCallOptions {
  /** Abort milliseconds (default 720_000 = 12 min). */
  timeoutMs?: number;
  /** Override the model (default `claude-opus-4-7`). */
  model?: string;
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
// Defaults
// =============================================================================

// Claude Opus can take 2-5 minutes on coordinate-heavy prompts (guard
// towers, vehicles) and has occasionally stretched past 8 min in testing.
// Default 12 min gives the compound-prompt path breathing room.
const DEFAULT_QUERY_TIMEOUT_MS = 720_000;

/** The pinned Opus generation model. Bump in one place. */
const DEFAULT_OPUS_MODEL = 'claude-opus-4-7';

/** The pinned Haiku compaction model. */
const DEFAULT_HAIKU_MODEL = 'claude-haiku-4-5-20251001';

/**
 * The `@anthropic-ai/claude-agent-sdk` spawns a nested Claude Code process
 * and refuses to run when `CLAUDECODE` or `CLAUDE_CODE_ENTRYPOINT` are set
 * in the parent env — which is exactly the case when anything in this repo
 * is invoked from a Claude Code session (tests, subagents, manual dev).
 *
 * We strip them unconditionally before every SDK query so the kiln.*
 * entry points "just work" regardless of how they're called. If a future
 * consumer needs the markers preserved, they can set them again in their
 * own child process.
 */
function stripClaudeCodeNestingMarkers(): void {
  delete process.env['CLAUDECODE'];
  delete process.env['CLAUDE_CODE_ENTRYPOINT'];
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Generate Kiln code (LLM only, no rendering). Validates GLB output and
 * retries once with feedback if validation fails.
 */
export async function generateKilnCode(
  request: KilnGenerateRequest,
  opts: KilnGenerateCallOptions = {}
): Promise<KilnGenerateResult> {
  stripClaudeCodeNestingMarkers();

  try {
    const userPrompt = buildUserPrompt(request);
    const systemPrompt = getSystemPrompt(request.mode);

    const result = await runStructuredQuery(userPrompt, systemPrompt, request.mode, opts);

    if (!result.success) return result;

    // Validate GLB code
    if (result.code && request.mode !== 'tsl') {
      const validation = validate(result.code);
      if (!validation.valid) {
        return retryWithFeedback(request, result.code, validation.errors, opts);
      }
    }

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

/**
 * Edit existing Kiln code with an instruction. Delegates to
 * `generateKilnCode` with the existing code wired in as context.
 */
export async function editKilnCode(
  currentCode: string,
  editRequest: string,
  mode: RenderMode = 'glb',
  opts: KilnGenerateCallOptions = {}
): Promise<KilnGenerateResult> {
  return generateKilnCode(
    {
      prompt: editRequest,
      mode,
      category: 'prop',
      existingCode: currentCode,
    },
    opts
  );
}

/**
 * Compact a bloated Kiln code string via Haiku.
 * Code golf: minimize characters while producing identical visual output.
 */
export async function compactCode(
  code: string,
  opts: KilnGenerateCallOptions = {}
): Promise<KilnGenerateResult> {
  stripClaudeCodeNestingMarkers();

  const abortController = new AbortController();
  const timeoutMs = opts.timeoutMs ?? DEFAULT_QUERY_TIMEOUT_MS;
  const timeout = setTimeout(() => abortController.abort(), timeoutMs);

  try {
    const q = query({
      prompt: `Code golf this Three.js code - minimize characters while producing IDENTICAL visual output.

- Shorten variable names
- Remove whitespace and comments
- Inline simple expressions
- Reuse identical materials/geometries
- Keep EXACT same visual result

\`\`\`typescript
${code}
\`\`\`

Output minified code only.`,
      options: {
        abortController,
        model: opts.model ?? DEFAULT_HAIKU_MODEL,
        maxTurns: 1,
        permissionMode: 'bypassPermissions',
        allowDangerouslySkipPermissions: true,
      },
    });

    let result = '';
    for await (const message of q) {
      if (message.type === 'assistant' && message.message?.content) {
        for (const block of message.message.content) {
          if (block.type === 'text') {
            result += block.text;
          }
        }
      }
    }

    // Extract code from markdown fences if present
    const codeMatch = result.match(/```(?:typescript|ts|javascript|js)?\n?([\s\S]*?)\n?```/);
    if (codeMatch?.[1]) {
      result = codeMatch[1];
    }

    return { success: true, code: result.trim() };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Refactor existing code (geometry, effect, or both) against an instruction.
 * Preserves asset character; structured output keeps the client's downstream
 * rendering path stable.
 */
export async function refactorCode(
  request: RefactorRequest,
  opts: KilnGenerateCallOptions = {}
): Promise<KilnGenerateResult> {
  stripClaudeCodeNestingMarkers();

  const abortController = new AbortController();
  const timeoutMs = opts.timeoutMs ?? DEFAULT_QUERY_TIMEOUT_MS;
  const timeout = setTimeout(() => abortController.abort(), timeoutMs);

  try {
    const codeContext: string[] = [];
    if (request.geometryCode) {
      codeContext.push(
        `## Current Geometry Code\n\`\`\`typescript\n${request.geometryCode}\n\`\`\``
      );
    }
    if (request.effectCode) {
      codeContext.push(
        `## Current Effect Code\n\`\`\`typescript\n${request.effectCode}\n\`\`\``
      );
    }

    const outputInstructions =
      request.target === 'both'
        ? 'Update BOTH geometry and effect code'
        : request.target === 'geometry'
        ? 'Update only the geometry code'
        : 'Update only the effect code';

    const prompt = `${codeContext.join('\n\n')}

## Refactor Instructions
${request.instruction}

## Task
${outputInstructions}`;

    const systemPrompt = `You are refactoring existing 3D asset code.
Preserve the asset's character and style while applying the requested changes.
Keep working code - only modify what's necessary for the refactor.`;

    const q = query({
      prompt,
      options: {
        abortController,
        model: opts.model ?? DEFAULT_OPUS_MODEL,
        systemPrompt,
        maxTurns: 1,
        outputFormat: {
          type: 'json_schema',
          schema: KILN_OUTPUT_SCHEMA,
        },
        permissionMode: 'bypassPermissions',
        allowDangerouslySkipPermissions: true,
      },
    });

    let sessionId: string | undefined;

    for await (const message of q) {
      if (message.type === 'result' && message.subtype === 'success') {
        sessionId = message.session_id;
        if (message.structured_output) {
          const output = message.structured_output as {
            code: string;
            effectCode?: string;
          };
          return {
            success: true,
            code: output.code,
            effectCode: output.effectCode,
            sessionId,
          };
        }
        return parseResultText(message.result, sessionId);
      }
      if (message.type === 'result' && message.subtype?.startsWith('error')) {
        const errMsg = (message as Record<string, unknown>).errors;
        return {
          success: false,
          error: Array.isArray(errMsg) ? errMsg.join('; ') : 'Refactor failed',
        };
      }
      if (message.type === 'auth_status' && message.error) {
        return {
          success: false,
          error: `Auth failed: ${message.error}. Run "claude auth login".`,
        };
      }
    }

    return { success: false, error: 'No result received from refactor query' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  } finally {
    clearTimeout(timeout);
  }
}

// =============================================================================
// Internal
// =============================================================================

async function runStructuredQuery(
  userPrompt: string,
  systemPrompt: string,
  _mode: RenderMode,
  opts: KilnGenerateCallOptions
): Promise<KilnGenerateResult> {
  const abortController = new AbortController();
  const timeoutMs = opts.timeoutMs ?? DEFAULT_QUERY_TIMEOUT_MS;
  const timeout = setTimeout(() => abortController.abort(), timeoutMs);

  try {
    const q = query({
      prompt: userPrompt,
      options: {
        abortController,
        model: opts.model ?? DEFAULT_OPUS_MODEL,
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
  errors: string[],
  opts: KilnGenerateCallOptions
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
    return await runStructuredQuery(retryPrompt, systemPrompt, request.mode, opts);
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

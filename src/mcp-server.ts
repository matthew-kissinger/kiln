#!/usr/bin/env bun
/**
 * Stdio adapter for the shared program-aware tool registry.
 * The CLI entry uses a persistent local source store. Embedded callers can inject
 * their own store and renderer; schemas and image extraction stay in the registry.
 */
import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { AsyncLocalStorage } from 'node:async_hooks';

import {
  createKilnProgramToolRegistry,
  type KilnToolDef,
  type KilnToolContext,
} from './tools/registry';
import { buildRenderPort, resolveRenderMode } from './cli-render-mode';
import { localProgramStore } from './program-store-node';
import { createPackagedLocalToolContext } from './local-runtime';

/** Server identity reported in the MCP handshake. */
export const MCP_SERVER_NAME = 'kiln';
export const MCP_SERVER_VERSION = '0.6.0';

/** One MCP content block. Mirrors the SDK's `CallToolResult['content']` element. */
type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; data: string; mimeType: string };

/**
 * The structurally-typed subset of the SDK's `CallToolResult` this file produces.
 *
 * Declared locally rather than imported so `runTool` stays usable by callers that
 * are not holding an SDK type (the parity test drives it directly), while still
 * being assignable to what `registerTool` accepts.
 *
 * A type alias, not an interface, and that is load-bearing: the SDK's
 * `CallToolResult` carries an index signature for protocol passthrough fields, and
 * TypeScript grants an implicit index signature to type aliases but not to
 * interfaces. As an interface this fails to satisfy the handler's return type, and
 * the compiler reports it as an unrelated schema-overload error.
 */
export type KilnToolResult = {
  content: ContentBlock[];
  isError?: boolean;
};

/** Use the shared program-aware definitions, including standalone validation. */
export function kilnMcpToolDefs(context: KilnToolContext = {}): KilnToolDef[] {
  return createKilnProgramToolRegistry(context);
}

/**
 * Run one def and shape its output as MCP content.
 *
 * Defs carrying a `media`/`mediaMulti` extractor return images, which is the whole
 * point of `kiln_render`: the calling agent must literally see the render, not a
 * description of it. The JSON that accompanies an image has its embedded base64
 * stripped by the extractor, so pixels are never double-encoded onto the wire.
 */
export async function runTool(def: KilnToolDef, args: unknown): Promise<KilnToolResult> {
  const output = await def.run(args);

  const multi = def.mediaMulti?.(output);
  if (multi) {
    return {
      content: [
        ...multi.pngs.map(
          (png): ContentBlock => ({
            type: 'image',
            data: Buffer.from(png).toString('base64'),
            mimeType: 'image/png',
          }),
        ),
        { type: 'text', text: JSON.stringify(multi.json, null, 2) },
      ],
    };
  }

  const media = def.media?.(output);
  if (media) {
    return {
      content: [
        {
          type: 'image',
          data: Buffer.from(media.png).toString('base64'),
          mimeType: 'image/png',
        },
        { type: 'text', text: JSON.stringify(media.json, null, 2) },
      ],
    };
  }

  // A def may render its own text when the default JSON would repeat itself.
  const asText = def.text?.(output);
  if (asText !== undefined) return { content: [{ type: 'text', text: asText }] };

  return { content: [{ type: 'text', text: JSON.stringify(output, null, 2) }] };
}

/** Build the server, registering every def from the registry. */
export function createKilnMcpServer(context: KilnToolContext = {}): McpServer {
  const server = new McpServer({ name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION });
  const requests = new AsyncLocalStorage<AbortSignal>();
  const requestContext: KilnToolContext = {
    ...context,
    evaluationControls: () => {
      const configured = context.evaluationControls?.() ?? {};
      const signal = requests.getStore();
      return {
        ...configured,
        ...(signal
          ? { signal: configured.signal ? AbortSignal.any([signal, configured.signal]) : signal }
          : {}),
      };
    },
  };

  for (const def of kilnMcpToolDefs(requestContext)) {
    server.registerTool(
      def.name,
      {
        description: def.description,
        // The registry's zod schema, passed straight through as Standard Schema.
        // The SDK advertises the derived JSON Schema and validates arguments, so
        // there is no second copy of the schema anywhere in this file. No cast:
        // a cast here would silently decouple the advertised schema from the
        // registry's, which is the one thing this file exists not to do.
        inputSchema: def.inputSchema,
      },
      async (args: unknown, request): Promise<KilnToolResult> => {
        try {
          return await requests.run(request.mcpReq.signal, () => runTool(def, args));
        } catch (err) {
          // A tool error is a result, not a transport failure: the calling agent
          // should see the message and correct its program rather than lose the
          // session.
          return {
            isError: true,
            content: [
              { type: 'text' as const, text: err instanceof Error ? err.message : String(err) },
            ],
          };
        }
      },
    );
  }

  return server;
}

if (import.meta.main) {
  const mode = resolveRenderMode(process.env['KILN_RENDER'] ?? 'auto');
  // Resolved once, before the first connection: probing a render service per
  // connection would put a network round trip in front of every client attach.
  const context = await createPackagedLocalToolContext(
    await buildRenderPort(mode, process.env['KILN_RENDER_PORT_URL']),
  );
  context.programStore = localProgramStore();
  // stdout is the MCP transport; diagnostics must never touch it.
  console.error(`kiln MCP server on stdio (${mode})`);
  void serveStdio(() => createKilnMcpServer(context));
}

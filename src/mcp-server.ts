#!/usr/bin/env bun
/**
 * Kiln stdio MCP server — the second transport over `tools/registry.ts`.
 *
 * This exists so any MCP client (Claude Code, Codex CLI, Cursor, ...) can drive the
 * Kiln tool surface directly, with the HOST's model as the author. That is the
 * inverse of how the hosted product worked, where a single `generate` operation ran
 * the engine's own agent loop server-side; see docs/history/production-architecture.md.
 *
 * The one invariant: tool names, descriptions, and schemas come from the registry and
 * nowhere else. `agent/tools.ts` (in-process Strands) and this file are skins over the
 * same defs, and `mcp-parity.test.ts` asserts they agree. Hand-writing a definition
 * here would quietly break the claim the repository makes about itself.
 *
 * Registry defs carry zod schemas, and MCP SDK v2 accepts them directly as Standard
 * Schema: the SDK derives the advertised JSON Schema and validates arguments before
 * a handler runs. Nothing here converts or restates a schema, which is exactly why
 * the two transports cannot drift.
 *
 * There is deliberately no `kiln_submit` here. Submit exists in the in-process loop to
 * give the model an unambiguous terminal action; over MCP the host agent already has
 * the program text and writes the file itself.
 */
import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';

import {
  createKilnToolRegistry,
  createKilnRenderViewsDef,
  createKilnInspectDef,
  createKilnScreenshotAnimationDef,
  createKilnViewInteriorDef,
  type KilnToolDef,
  type KilnToolContext,
} from './tools/registry';
import { buildRenderPort, resolveRenderMode } from './cli-render-mode';

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

/**
 * The defs this transport exposes.
 *
 * Every entry comes from a factory in `tools/registry.ts` — nothing here is
 * hand-written, which is the invariant `mcp-parity.test.ts` exists to hold.
 *
 * The composition mirrors the production unified surface rather than the frozen
 * four-tool bench baseline, for one concrete reason: the baseline's
 * `kiln_screenshot` is CPU-only by construction. Its schema is frozen, it takes no
 * capture config, and it never consults `viewRenderPort`. `createKilnRenderViewsDef`
 * is the def that collapses metrics and views into one call, routes to the GPU when
 * the scene actually needs PBR shading, and reports `viewFidelity` so the agent
 * knows whether it may judge material from the picture. Shipping the baseline pair
 * here would mean shipping a surface on which the render port can never fire.
 *
 * `kiln_validate` stays standalone because, unlike the in-process unified surface,
 * there is no draft buffer over MCP to fold validation into — the host agent holds
 * the program text itself.
 */
export function kilnMcpToolDefs(context: KilnToolContext = {}): KilnToolDef[] {
  const registry = createKilnToolRegistry(context);
  const byName = (name: string): KilnToolDef => {
    const def = registry.find((d) => d.name === name);
    if (!def) throw new Error(`kilnMcpToolDefs: missing registry tool ${name}`);
    return def;
  };
  return [
    byName('kiln_list_primitives'),
    byName('kiln_validate'),
    createKilnRenderViewsDef(context),
    createKilnScreenshotAnimationDef(context),
    createKilnViewInteriorDef(context),
    createKilnInspectDef(context),
  ];
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

  return { content: [{ type: 'text', text: JSON.stringify(output, null, 2) }] };
}

/** Build the server, registering every def from the registry. */
export function createKilnMcpServer(context: KilnToolContext = {}): McpServer {
  const server = new McpServer({ name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION });

  for (const def of kilnMcpToolDefs(context)) {
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
      async (args: unknown): Promise<KilnToolResult> => {
        try {
          return await runTool(def, args);
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
  const context = await buildRenderPort(mode, process.env['KILN_RENDER_PORT_URL']);
  // stdout is the MCP transport; diagnostics must never touch it.
  console.error(`kiln MCP server on stdio (${mode})`);
  void serveStdio(() => createKilnMcpServer(context));
}

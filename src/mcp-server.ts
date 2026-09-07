#!/usr/bin/env bun
/**
 * Stdio adapter for the shared program-aware tool registry.
 * The CLI entry uses a persistent local source store. Embedded callers can inject
 * their own store and renderer; schemas and image extraction stay in the registry.
 */
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/server';
import { localAssetLibrary } from './assets-node';
import { readAssetResource, type AssetLink } from './assets-resources';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { AsyncLocalStorage } from 'node:async_hooks';

import {
  createKilnProgramToolRegistry,
  KILN_ASSET_WIDGET_URI,
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
  | AssetLink
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
  structuredContent?: Record<string, unknown>;
  _meta?: Record<string, unknown>;
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

  const resources = (output as { resources?: AssetLink[] } | null)?.resources ?? [];
  const payload = resources.length ? { ...(output as object), resources: undefined } : output;
  return {
    content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }, ...resources],
    ...(def.ui
      ? {
          structuredContent: output as Record<string, unknown>,
          _meta: await def.ui.data(output),
        }
      : {}),
  };
}

/** Build the server, registering every def from the registry. */
export function createKilnMcpServer(context: KilnToolContext = {}): McpServer {
  const server = new McpServer({
    name: MCP_SERVER_NAME,
    version: MCP_SERVER_VERSION,
  });
  server.registerResource(
    'kiln-asset-viewer',
    KILN_ASSET_WIDGET_URI,
    {
      description: 'Interactive Kiln asset viewer and downloads',
      mimeType: 'text/html;profile=mcp-app',
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'text/html;profile=mcp-app',
          text: await (await import('./asset-widget')).readAssetWidgetHtml(),
          _meta: {
            ui: {
              prefersBorder: true,
              csp: { connectDomains: [], resourceDomains: [] },
            },
            'openai/widgetDescription':
              'Inspect the saved 3D asset and download its GLB or editable bundle.',
            'openai/widgetPrefersBorder': true,
          },
        },
      ],
    }),
  );
  if (context.assetLibrary) {
    server.registerResource(
      'asset-file',
      new ResourceTemplate('kiln://assets/{collection}/{asset}/{revision}/{file}', {
        list: undefined,
      }),
      {
        description: 'Exact saved GLB, editable source, preview, manifest, or portable bundle.',
      },
      async (uri) => {
        const file = await readAssetResource(context.assetLibrary!, uri.href);
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: file.mimeType,
              ...(file.name.endsWith('.json') || file.name.endsWith('.js')
                ? { text: new TextDecoder().decode(file.bytes) }
                : { blob: Buffer.from(file.bytes).toString('base64') }),
            },
          ],
        };
      },
    );
  }
  const requests = new AsyncLocalStorage<AbortSignal>();
  const requestContext: KilnToolContext = {
    ...context,
    evaluationControls: () => {
      const configured = context.evaluationControls?.() ?? {};
      const signal = requests.getStore();
      return {
        ...configured,
        ...(signal
          ? {
              signal: configured.signal ? AbortSignal.any([signal, configured.signal]) : signal,
            }
          : {}),
      };
    },
  };

  for (const def of kilnMcpToolDefs(requestContext)) {
    server.registerTool(
      def.name,
      {
        description: def.description,
        annotations: def.annotations,
        ...(def.ui
          ? {
              _meta: {
                ui: { resourceUri: def.ui.resourceUri },
                'openai/outputTemplate': def.ui.resourceUri,
                'openai/widgetAccessible': true,
              },
            }
          : {}),
        // The registry's zod schema, passed straight through as Standard Schema.
        // The SDK advertises the derived JSON Schema and validates arguments, so
        // there is no second copy of the schema anywhere in this file. No cast:
        // a cast here would silently decouple the advertised schema from the
        // registry's, which is the one thing this file exists not to do.
        inputSchema: def.inputSchema,
        ...(def.outputSchema ? { outputSchema: def.outputSchema } : {}),
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
              {
                type: 'text' as const,
                text: err instanceof Error ? err.message : String(err),
              },
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
  context.assetLibrary = localAssetLibrary();
  const deliveryBase = process.env['KILN_ASSET_DOWNLOAD_BASE_URL'];
  if (deliveryBase) {
    const base = new URL(deliveryBase);
    if (
      base.protocol !== 'https:' &&
      !(base.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname))
    )
      throw new Error('Asset download base must use HTTPS or loopback HTTP');
    context.assetDownloadUrls = async (collection, assetId, revisionId) =>
      Object.fromEntries(
        ['asset.glb', 'editable.zip', 'source.kiln.js', 'preview.png', 'manifest.json'].map(
          (file) => [
            file,
            new URL(
              `files/${collection}/${assetId}/${revisionId}/${file}?download`,
              base.href.endsWith('/') ? base.href : `${base.href}/`,
            ).href,
          ],
        ),
      );
  }
  // stdout is the MCP transport; diagnostics must never touch it.
  console.error(`kiln MCP server on stdio (${mode})`);
  void serveStdio(() => createKilnMcpServer(context));
}

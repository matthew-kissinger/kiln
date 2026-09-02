/**
 * The repository's central claim, as a test.
 *
 * README says: "One tool definition, two transports. The in-process Strands skin and
 * the MCP server both iterate it, so tool names and schemas cannot drift apart."
 *
 * If someone hand-writes a tool in either skin, that sentence becomes false. These
 * tests are what stop that from happening quietly.
 */
import { describe, expect, it } from 'bun:test';
import { Client, InMemoryTransport } from '@modelcontextprotocol/client';

import {
  createKilnToolRegistry,
  createKilnRenderViewsDef,
  createKilnInspectDef,
  createKilnScreenshotAnimationDef,
  createKilnViewInteriorDef,
} from './tools/registry';
import { makeKilnTools, KILN_SUBMIT_TOOL_NAME } from './agent/tools';
import { runTool, kilnMcpToolDefs, createKilnMcpServer } from './mcp-server';

/**
 * List the tool surface the way a client sees it, over a real linked transport.
 *
 * Deliberately not a projection helper of our own: SDK v2 derives the advertised
 * JSON Schema from the registry's zod schema itself, so the only assertion worth
 * making is against what the SDK actually puts on the wire. A test against our own
 * converter would have been a test of the converter, not of the surface.
 */
async function listToolsOverMcp(): Promise<{ name: string; description?: string; inputSchema: unknown }[]> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createKilnMcpServer();
  const client = new Client({ name: 'kiln-parity', version: '0' });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  try {
    const { tools } = await client.listTools();
    return tools;
  } finally {
    await client.close();
    await server.close();
  }
}

describe('tool surface parity across transports', () => {
  it('the MCP skin advertises its defs verbatim', async () => {
    const defs = kilnMcpToolDefs();
    const advertised = await listToolsOverMcp();

    expect(advertised.map((t) => t.name)).toEqual(defs.map((d) => d.name));
    for (let i = 0; i < defs.length; i++) {
      // Descriptions are model-facing surface area. A skin that paraphrases is a
      // skin that has drifted.
      expect(advertised[i]!.description).toBe(defs[i]!.description);
    }
  });

  it('every MCP def is a registry factory def, not a hand-written one', () => {
    // The claim is "one tool definition, two transports". It survives only while
    // no skin authors a def of its own, so compare against the factories rather
    // than against a list of names someone could edit to match.
    const factories = [
      ...createKilnToolRegistry(),
      createKilnRenderViewsDef(),
      createKilnScreenshotAnimationDef(),
      createKilnViewInteriorDef(),
      createKilnInspectDef(),
    ];
    const canonical = new Map(factories.map((d) => [d.name, d.description]));

    for (const def of kilnMcpToolDefs()) {
      expect(canonical.has(def.name)).toBe(true);
      expect(def.description).toBe(canonical.get(def.name) ?? '<missing>');
    }
  });

  it('the MCP surface is composed for GPU capability, not the frozen baseline', () => {
    // The baseline's kiln_screenshot never consults viewRenderPort, so shipping it
    // over MCP would mean shipping a surface the render port can never reach. This
    // pins the deliberate substitution: unified kiln_render instead of the
    // baseline's metrics-only kiln_render plus CPU-only kiln_screenshot.
    expect(kilnMcpToolDefs().map((d) => d.name)).toEqual([
      'kiln_list_primitives',
      'kiln_validate',
      'kiln_render',
      'kiln_screenshot_animation',
      'kiln_view_interior',
      'kiln_inspect',
    ]);

    const mcpRender = kilnMcpToolDefs().find((d) => d.name === 'kiln_render')!;
    expect(mcpRender.description).toBe(createKilnRenderViewsDef().description);
    // The substituted def is the one that can actually return an image.
    expect(mcpRender.media).toBeDefined();
    expect(kilnMcpToolDefs().map((d) => d.name)).not.toContain('kiln_screenshot');
  });

  it('both skins share the list/validate defs verbatim', () => {
    const registry = createKilnToolRegistry();
    const mcp = new Map(kilnMcpToolDefs().map((d) => [d.name, d.description]));
    const strands = new Map(
      makeKilnTools({}, {}).map((t) => {
        const tool = t as { name: string; description?: string };
        return [tool.name, tool.description];
      }),
    );

    for (const name of ['kiln_list_primitives', 'kiln_validate']) {
      const def = registry.find((d) => d.name === name)!;
      expect(mcp.get(name)).toBe(def.description);
      expect(strands.get(name)).toBe(def.description);
    }
  });

  it("the in-process generate surface keeps the baseline plus a terminal submit", () => {
    // Unchanged by the MCP recomposition: the engine's own loop still runs the
    // frozen baseline, and still needs an unambiguous stopping action.
    const baseline = new Set(createKilnToolRegistry().map((d) => d.name));
    const names = makeKilnTools({}, {}).map((t) => (t as { name: string }).name);
    for (const b of baseline) expect(names).toContain(b);
    expect(names.filter((n) => !baseline.has(n)).sort()).toEqual([
      'kiln_screenshot_animation',
      KILN_SUBMIT_TOOL_NAME,
    ]);
  });

  it('every exposed schema reaches the client as usable JSON Schema', async () => {
    // The SDK derives these from the registry's zod schemas. A def whose schema
    // failed to convert would still register and would still be listed — it would
    // just arrive with nothing a client could fill in, which is worse than a crash.
    for (const tool of await listToolsOverMcp()) {
      const schema = tool.inputSchema as { type?: string; properties?: object };
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
    }
  });

  it('the MCP render def returns an image block, not a description of one', async () => {
    const def = kilnMcpToolDefs().find((d) => d.name === 'kiln_render');
    expect(def).toBeDefined();

    const code = `
const meta = { name: 'ParityCube', category: 'prop' };
function build() {
  const root = createRoot('ParityCube');
  createPart('Body', boxGeo(1, 1, 1), gameMaterial(0x808080), { position: [0, 0.5, 0], parent: root });
  return root;
}
`;
    const result = await runTool(def!, { code });
    const kinds = result.content.map((c) => c.type);
    expect(kinds).toContain('image');
    expect(kinds).toContain('text');

    const image = result.content.find((c) => c.type === 'image') as { data: string };
    // A PNG, base64-encoded: the agent literally sees the render.
    expect(Buffer.from(image.data, 'base64').subarray(1, 4).toString('ascii')).toBe('PNG');
  });

  it('a failing tool call is an error result, not a thrown transport failure', async () => {
    const def = kilnMcpToolDefs().find((d) => d.name === 'kiln_render');
    const result = await runTool(def!, { code: 'this is not valid kiln source' }).catch(
      () => undefined,
    );
    // Either the def handled it and returned content, or runTool surfaced it — what
    // must never happen is an unhandled rejection killing the MCP session.
    expect(result).toBeDefined();
  });
});

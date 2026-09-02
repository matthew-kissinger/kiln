/**
 * The whole point of the tool registry, in one file.
 *
 * `createKilnToolRegistry` is the single source of truth for Kiln's tool surface.
 * This example drives it from a Strands agent in-process; `src/mcp-server.ts` drives
 * the same defs over stdio MCP. Nothing here is Kiln-specific plumbing — swap the
 * agent framework and the registry still works, which is the property that makes
 * this port to another harness roughly this long.
 *
 *   bun run examples/strands-harness.ts "a weathered wooden crate"
 *
 * Requires `@strands-agents/sdk` (an optional peer) and a provider key.
 */
import { Agent } from '@strands-agents/sdk';

import { makeKilnTools } from '../src/agent/tools';
import type { PbrRenderPort } from '../src/composer/render-port';

/**
 * Seam one: the in-loop view renderer.
 *
 * Absent means every render stays on the CPU rasterizer — the engine never opens a
 * socket itself. A host supplies the HTTP adapter, auth, and configuration; the
 * engine's `captureViewsViaPort` keeps sole ownership of the deadline, PNG
 * validation, grid composition, and the never-throw fallback. Returning `ok: false`
 * here is not an error path, it is the designed degrade.
 */
const stubPort: PbrRenderPort = async () => ({
  ok: false,
  rendererId: 'stub:no-gpu',
});

// Seam two, `viewRenderTimeoutMs`, is deliberately separate. This deadline bounds
// ONE in-loop call, which blocks the agent mid-thought, so it is far shorter than
// the deadline a host would use for a post-loop artifact sheet that nothing waits
// on. Collapsing the two onto a single value is the mistake this API exists to
// prevent.
const sink: { code?: string } = {};
const tools = makeKilnTools(sink, {
  viewRenderPort: stubPort,
  viewRenderTimeoutMs: 6_000,
});

const agent = new Agent({
  model: process.env['KILN_MODEL'] ?? 'anthropic/claude-opus-4-6',
  systemPrompt:
    'You generate exportable 3D game assets as Kiln programs. List the primitives, ' +
    'write the program, validate it, render it, LOOK at the six-view sheet, fix what ' +
    'you see, then call kiln_submit with the final code.',
  tools: tools as never,
  name: 'kiln-harness-example',
});

const prompt = process.argv[2] ?? 'a weathered wooden crate';
await agent.invoke(prompt);

// `kiln_submit` is the terminal action: it writes the model's final program into the
// sink rather than returning it through the transcript. Over MCP there is no submit,
// because there the host agent already holds the program text.
if (!sink.code) throw new Error('agent finished without calling kiln_submit');
console.log(sink.code);

/**
 * Native Strands generation with shared Kiln reference tools.
 * bun run examples/strands-harness.ts "a weathered wooden crate"
 *
 * Set KILN_MODEL and the selected provider's key. The optional Strands and
 * provider dependencies are required only for this harness.
 */
import { runKilnAgent } from '../src/agent/run';
import { makeKilnModel, resolveKilnAgentModel } from '../src/agent/providers';
import type { PbrRenderPort } from '../src/composer/render-port';

const modelId = process.env['KILN_MODEL'];
if (!modelId) throw new Error('Set KILN_MODEL to the provider/model route you want to use.');
const model = await makeKilnModel(resolveKilnAgentModel(modelId));

// A host may inject local or remote rendering. The engine owns deadlines, reply
// validation and truthful CPU degradation; no socket is opened by this stub.
const viewRenderPort: PbrRenderPort = async () => ({ ok: false, rendererId: 'stub:no-gpu' });
const result = await runKilnAgent({
  model,
  prompt: process.argv[2] ?? 'a weathered wooden crate',
  viewRenderPort,
  // An in-loop deadline is independent of any later artifact-sheet deadline.
  viewRenderTimeoutMs: 6_000,
  // SDK caps are checked between turns; they are not hard spending limits.
  limits: { turns: 30 },
});

// The native kiln_finish tool selects exact reviewed bytes. The host decides
// where to deliver them; a capped partial checkpoint is not a finished result.
if (result.completion !== 'finished') throw new Error(result.error ?? 'Generation unfinished.');
console.log(result.code);

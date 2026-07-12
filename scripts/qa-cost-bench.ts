/**
 * H-40(4): per-render QA cost benchmark.
 *
 * Measures what the asset-quality program adds to EVERY mid-loop render
 * (kiln_render runs the full renderSceneToGLB pipeline each call):
 *
 *   1. Registry-rule cost — renderGLB timed under KILN_QA_MODE=observe (all
 *      rules evaluate, nothing throws) vs KILN_QA_MODE=off (rules skipped).
 *      observe-vs-off isolates rule execution without throw-path asymmetry;
 *      enforce evaluates the identical rule set (only dispositions differ).
 *   2. Khronos validation cost — validateFinalGlbBytes timed in isolation.
 *      NOTE: Khronos runs UNCONDITIONALLY in the render path (render.ts) —
 *      KILN_QA_MODE=off does NOT remove it, so it is measured separately.
 *
 * Decision rule (hardening plan A5): QA overhead > 1.5s p95 per render →
 * file a follow-up to cache/skip Khronos on mid-loop renders; otherwise close
 * H-40(4) as "measured, acceptable".
 *
 * Run: cd kiln && bun scripts/qa-cost-bench.ts
 */
import { performance } from 'node:perf_hooks';

import { createAssetIntentV1, type AssetCategory } from '../src/contracts';
import { renderGLB } from '../src/render';
import { validateFinalGlbBytes } from '../src/qa/gltf';

const ITERATIONS = 6;

interface Fixture {
  name: string;
  category: AssetCategory;
  code: string;
}

const FIXTURES: Fixture[] = [
  {
    name: 'chest',
    category: 'prop',
    code: `
const meta = { name: 'BenchChest', category: 'prop' };
function build() {
  const root = createRoot('BenchChest');
  createPart('Base', boxGeo(1, 0.4, 0.8), gameMaterial(0x8B4513), { position: [0, 0.2, 0], parent: root });
  const lidPivot = createPivot('Lid', [0, 0.4, -0.35], root);
  createPart('LidMesh', boxGeo(1, 0.15, 0.8), gameMaterial(0x8B4513), { position: [0, 0.075, 0.35], parent: lidPivot });
  createPart('Lock', sphereGeo(0.05, 6, 4), gameMaterial(0xffcc00, { metalness: 0.8 }), { position: [0, 0.3, 0.4], parent: root });
  return root;
}
`,
  },
  {
    name: 'cart',
    category: 'vehicle',
    code: `
const meta = { name: 'BenchCart', category: 'vehicle' };
function build() {
  const root = createRoot('BenchCart');
  createPart('Body', boxGeo(1.6, 0.3, 0.9), gameMaterial(0x7B5B3A), { position: [0, 0.55, 0], parent: root });
  const wheels = [[-0.55, -0.35], [-0.55, 0.35], [0.55, -0.35], [0.55, 0.35]];
  for (let i = 0; i < wheels.length; i++) {
    const [x, z] = wheels[i];
    const pivot = createPivot('Joint_Wheel' + (i + 1), [x, 0.25, z], root);
    createPart('Wheel' + (i + 1), cylinderGeo(0.25, 0.25, 0.12, 10), gameMaterial(0x333333), {
      rotation: [90, 0, 0], parent: pivot,
    });
  }
  return root;
}
`,
  },
  {
    name: 'hut',
    category: 'architecture',
    code: `
const meta = { name: 'BenchHut', category: 'architecture' };
function build() {
  const root = createRoot('BenchHut');
  createPart('WallLeft', boxGeo(2, 1.6, 0.1), gameMaterial(0xB0A080), { position: [0, 0.8, -1], parent: root });
  createPart('WallRight', boxGeo(2, 1.6, 0.1), gameMaterial(0xB0A080), { position: [0, 0.8, 1], parent: root });
  createPart('WallBack', boxGeo(0.1, 1.6, 2), gameMaterial(0xB0A080), { position: [-1, 0.8, 0], parent: root });
  createPart('WallFrontA', boxGeo(0.1, 1.6, 0.6), gameMaterial(0xB0A080), { position: [1, 0.8, -0.7], parent: root });
  createPart('WallFrontB', boxGeo(0.1, 1.6, 0.6), gameMaterial(0xB0A080), { position: [1, 0.8, 0.7], parent: root });
  createPart('Floor', boxGeo(2, 0.08, 2), gameMaterial(0x8a7a60), { position: [0, 0.04, 0], parent: root });
  createPart('Roof', coneGeo(1.7, 0.9, 4), gameMaterial(0x6B3B2A), { position: [0, 2.05, 0], rotation: [0, 45, 0], parent: root });
  return root;
}
`,
  },
  {
    name: 'figure',
    category: 'character',
    code: `
const meta = { name: 'BenchFigure', category: 'character' };
function build() {
  const root = createRoot('BenchFigure');
  createPart('Torso', boxGeo(0.5, 0.7, 0.3), gameMaterial(0x4A6B8A), { position: [0, 1.05, 0], parent: root });
  createPart('Head', sphereGeo(0.18, 8, 6), gameMaterial(0xD9B48F), { position: [0, 1.6, 0], parent: root });
  const legL = createPivot('Joint_LegL', [0, 0.7, -0.15], root);
  createPart('LegLMesh', boxGeo(0.22, 0.7, 0.18), gameMaterial(0x39424E), { position: [0, -0.35, 0], parent: legL });
  const legR = createPivot('Joint_LegR', [0, 0.7, 0.15], root);
  createPart('LegRMesh', boxGeo(0.22, 0.7, 0.18), gameMaterial(0x39424E), { position: [0, -0.35, 0], parent: legR });
  const armL = createPivot('Joint_ArmL', [0, 1.32, -0.33], root);
  createPart('ArmLMesh', boxGeo(0.18, 0.6, 0.14), gameMaterial(0x4A6B8A), { position: [0, -0.3, 0], parent: armL });
  const armR = createPivot('Joint_ArmR', [0, 1.32, 0.33], root);
  createPart('ArmRMesh', boxGeo(0.18, 0.6, 0.14), gameMaterial(0x4A6B8A), { position: [0, -0.3, 0], parent: armR });
  return root;
}
`,
  },
  {
    name: 'rocks',
    category: 'environment',
    code: `
const meta = { name: 'BenchRocks', category: 'environment' };
function build() {
  const root = createRoot('BenchRocks');
  createPart('RockA', sphereGeo(0.6, 7, 5), gameMaterial(0x777a70), { position: [0, 0.45, 0], parent: root });
  createPart('RockB', sphereGeo(0.4, 6, 4), gameMaterial(0x6a6d64), { position: [0.8, 0.3, 0.3], parent: root });
  createPart('RockC', sphereGeo(0.25, 6, 4), gameMaterial(0x82857b), { position: [-0.6, 0.2, -0.4], parent: root });
  const trunk = createPart('Trunk', cylinderGeo(0.08, 0.1, 0.9, 6), gameMaterial(0x6B4A2F), { position: [-0.2, 0.45, 0.9], parent: root });
  createPart('Canopy', coneGeo(0.5, 1.1, 7), gameMaterial(0x3F6B3A), { position: [-0.2, 1.4, 0.9], parent: root });
  return root;
}
`,
  },
];

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return Number.NaN;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (pos - lo);
}

async function timeRender(fixture: Fixture, iterations: number): Promise<number[]> {
  const intent = createAssetIntentV1({ category: fixture.category });
  const samples: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    await renderGLB(fixture.code, { intent });
    samples.push(performance.now() - t0);
  }
  return samples.sort((a, b) => a - b);
}

async function main(): Promise<void> {
  const rows: string[] = [];
  rows.push(
    '| fixture | category | observe p50/p95 (ms) | off p50/p95 (ms) | rule cost p50/p95 (ms) | khronos p50/p95 (ms) |',
  );
  rows.push('|---|---|---|---|---|---|');

  for (const fixture of FIXTURES) {
    const intent = createAssetIntentV1({ category: fixture.category });

    // Warm-up + fixture sanity: the program must complete under observe.
    process.env['KILN_QA_MODE'] = 'observe';
    let bytes: Uint8Array;
    try {
      const warm = await renderGLB(fixture.code, { intent });
      bytes = warm.glb;
    } catch (err) {
      console.error(
        `fixture ${fixture.name} (${fixture.category}) failed to render: ${err instanceof Error ? err.message : String(err)}`,
      );
      rows.push(`| ${fixture.name} | ${fixture.category} | RENDER FAILED | — | — | — |`);
      continue;
    }

    process.env['KILN_QA_MODE'] = 'observe';
    const observe = await timeRender(fixture, ITERATIONS);
    process.env['KILN_QA_MODE'] = 'off';
    await timeRender(fixture, 1); // warm the off path
    const off = await timeRender(fixture, ITERATIONS);
    delete process.env['KILN_QA_MODE'];

    // Isolated Khronos cost (runs unconditionally in the render path).
    const khronos: number[] = [];
    await validateFinalGlbBytes(bytes); // warm the WASM validator
    for (let i = 0; i < ITERATIONS; i++) {
      const t0 = performance.now();
      await validateFinalGlbBytes(bytes);
      khronos.push(performance.now() - t0);
    }
    khronos.sort((a, b) => a - b);

    const fmt = (samples: number[]) =>
      `${quantile(samples, 0.5).toFixed(0)} / ${quantile(samples, 0.95).toFixed(0)}`;
    const ruleCostP50 = quantile(observe, 0.5) - quantile(off, 0.5);
    const ruleCostP95 = quantile(observe, 0.95) - quantile(off, 0.95);
    rows.push(
      `| ${fixture.name} | ${fixture.category} | ${fmt(observe)} | ${fmt(off)} | ${ruleCostP50.toFixed(0)} / ${ruleCostP95.toFixed(0)} | ${fmt(khronos)} |`,
    );
  }

  console.log(`\nQA cost benchmark — ${ITERATIONS} iterations/arm, bun ${Bun.version}\n`);
  console.log(rows.join('\n'));
  console.log(
    '\nrule cost = observe − off (registry rules only); khronos runs unconditionally in BOTH modes.',
  );
}

await main();

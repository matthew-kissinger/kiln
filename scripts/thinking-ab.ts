/**
 * H-43/B1: Gemini 3.5 Flash thinking A/B — API-default (dynamic, level
 * 'medium') vs explicit thinkingLevel 'high' — over the five bench prompts +
 * three city staples. Local in-process agent loop on the unified tool surface
 * (prod parity), live GEMINI_API_KEY. n=8/arm is DIRECTIONAL for quality;
 * latency/cost deltas are the reliable readout (feeds the D-4 owner decision:
 * flipping the default changes default-path cost).
 *
 * Run: cd kiln && GEMINI_API_KEY=... bun scripts/thinking-ab.ts [--conc 3]
 * Spend: ~16 gemini-3.5-flash agent runs (~$1-3 total).
 */
import { performance } from 'node:perf_hooks';

import { makeKilnModel } from '../src/agent/providers';
import { runKilnAgent } from '../src/agent/run';
import { assessProgramGrade } from '../src/agent/grade-refine';
import { createAssetIntentV1, type AssetCategory } from '../src/contracts';

const PROMPTS: Array<{ key: string; category: AssetCategory; prompt: string }> = [
  { key: 'chest', category: 'prop', prompt: 'a weathered pirate treasure chest with iron bands, lid slightly open, gold coins spilling out' },
  { key: 'wrxwagon', category: 'vehicle', prompt: 'a 2002 Subaru WRX wagon with a spoiler' },
  { key: 'ranger', category: 'character', prompt: 'a hooded desert ranger with a walking staff, satchel, and layered cloth wraps' },
  { key: 'lighthouse', category: 'architecture', prompt: 'a small cliffside lighthouse with a spiral exterior stair and a glowing lantern room' },
  { key: 'archway', category: 'environment', prompt: 'an ancient mossy stone archway wrapped in flowering vines, cracked but standing' },
  { key: 'stall', category: 'prop', prompt: 'a wooden market stall with a striped awning and crates of vegetables' },
  { key: 'well', category: 'prop', prompt: 'a round stone well with a wooden crank, rope, and hanging bucket' },
  { key: 'lamp', category: 'prop', prompt: 'a cast-iron street lamp with a hexagonal glass lantern head' },
];

type Arm = 'default' | 'high';
const ARMS: Arm[] = ['default', 'high'];

interface RunRow {
  arm: Arm;
  key: string;
  ok: boolean;
  salvaged?: string;
  steps: number;
  latencyS: number;
  inTok: number;
  outTok: number;
  grade?: string;
  tris?: number;
  materials?: number;
  error?: string;
}

const apiKey = process.env['GEMINI_API_KEY']?.trim();
if (!apiKey) {
  console.error('GEMINI_API_KEY required');
  process.exit(1);
}

async function runOne(arm: Arm, p: (typeof PROMPTS)[number]): Promise<RunRow> {
  const model = makeKilnModel(
    {
      provider: 'google',
      model: 'gemini-3.5-flash',
      maxTokens: 65536,
      ...(arm === 'high' ? { thinking: 'high' } : {}),
    },
    { apiKey },
  );
  const t0 = performance.now();
  const row: RunRow = { arm, key: p.key, ok: false, steps: 0, latencyS: 0, inTok: 0, outTok: 0 };
  try {
    const agent = await runKilnAgent({
      model,
      prompt: p.prompt,
      category: p.category,
      toolSurface: 'unified',
      agentName: `thinking-ab-${arm}-${p.key}`,
    });
    row.latencyS = (performance.now() - t0) / 1000;
    row.steps = agent.steps;
    row.inTok = agent.usage?.inputTokens ?? 0;
    row.outTok = agent.usage?.outputTokens ?? 0;
    if (agent.salvaged) row.salvaged = agent.salvaged;
    if (!agent.code) {
      row.error = agent.error ?? 'no code';
      return row;
    }
    const assess = await assessProgramGrade(agent.code, {
      intent: createAssetIntentV1({ category: p.category }),
    });
    row.ok = assess.ok;
    if (!assess.ok) row.error = (assess.error ?? '').slice(0, 120);
    if (assess.report) {
      row.grade = assess.report.grade;
      row.tris = assess.report.metrics.triangles;
      row.materials = assess.report.metrics.uniqueMaterials;
    }
  } catch (err) {
    row.latencyS = (performance.now() - t0) / 1000;
    row.error = (err instanceof Error ? err.message : String(err)).slice(0, 160);
  }
  return row;
}

function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return Number.NaN;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  return sorted[lo]! + (sorted[Math.ceil(pos)]! - sorted[lo]!) * (pos - lo);
}

async function main(): Promise<void> {
  const concArg = process.argv.indexOf('--conc');
  const conc = concArg >= 0 ? Number.parseInt(process.argv[concArg + 1] ?? '3', 10) : 3;

  const jobs: Array<{ arm: Arm; p: (typeof PROMPTS)[number] }> = [];
  for (const p of PROMPTS) for (const arm of ARMS) jobs.push({ arm, p });

  const rows: RunRow[] = [];
  let next = 0;
  async function worker(): Promise<void> {
    for (;;) {
      const i = next++;
      if (i >= jobs.length) return;
      const { arm, p } = jobs[i]!;
      console.error(`[${i + 1}/${jobs.length}] ${arm} · ${p.key} ...`);
      const row = await runOne(arm, p);
      console.error(
        `  -> ${row.ok ? 'ok' : `FAIL(${row.error})`} grade=${row.grade ?? '-'} steps=${row.steps} ${row.latencyS.toFixed(0)}s ${row.outTok} outTok${row.salvaged ? ` salvaged=${row.salvaged}` : ''}`,
      );
      rows.push(row);
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, conc) }, worker));

  console.log('\n## H-43 thinking A/B — gemini-3.5-flash, unified surface, n=8/arm\n');
  console.log('| arm | key | ok | grade | tris | mats | steps | latency s | in tok | out tok | note |');
  console.log('|---|---|---|---|---|---|---|---|---|---|---|');
  for (const r of rows.sort((a, b) => a.key.localeCompare(b.key) || a.arm.localeCompare(b.arm))) {
    console.log(
      `| ${r.arm} | ${r.key} | ${r.ok ? 'ok' : 'FAIL'} | ${r.grade ?? '-'} | ${r.tris ?? '-'} | ${r.materials ?? '-'} | ${r.steps} | ${r.latencyS.toFixed(0)} | ${r.inTok} | ${r.outTok} | ${r.salvaged ?? r.error ?? ''} |`,
    );
  }

  console.log('\n| arm | ok | grades | steps p50 | latency p50 s | latency p95 s | out-tok p50 | out-tok total |');
  console.log('|---|---|---|---|---|---|---|---|');
  for (const arm of ARMS) {
    const a = rows.filter((r) => r.arm === arm);
    const lat = a.map((r) => r.latencyS).sort((x, y) => x - y);
    const steps = a.map((r) => r.steps).sort((x, y) => x - y);
    const out = a.map((r) => r.outTok).sort((x, y) => x - y);
    const grades = a
      .map((r) => r.grade ?? '?')
      .sort()
      .join('');
    console.log(
      `| ${arm} | ${a.filter((r) => r.ok).length}/${a.length} | ${grades} | ${quantile(steps, 0.5).toFixed(0)} | ${quantile(lat, 0.5).toFixed(0)} | ${quantile(lat, 0.95).toFixed(0)} | ${quantile(out, 0.5).toFixed(0)} | ${out.reduce((s, v) => s + v, 0)} |`,
    );
  }
}

await main();

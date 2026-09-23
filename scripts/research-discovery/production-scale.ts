/** Separate processes isolate retained index memory from earlier benchmark allocations. */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { listDiscoveryEntries } from '../../src/discovery/catalog';
import { createLexicalDiscoveryIndex } from '../../src/discovery/lexical-index';

const catalog = listDiscoveryEntries();
const workerSize = process.argv[2] === '--size' ? Number(process.argv[3]) : undefined;
if (workerSize !== undefined) {
  if (!Number.isSafeInteger(workerSize) || workerSize < 1 || workerSize > 10_000)
    throw new Error('Invalid benchmark size');
  if (typeof globalThis.gc !== 'function') throw new Error('Run with --expose-gc');
  const documents = Array.from({ length: workerSize }, (_, n) => {
    const entry = structuredClone(catalog[n % catalog.length]!);
    entry.name = `${entry.name}Growth${n}`;
    entry.id = `${entry.kind}:${entry.name}`;
    return entry;
  });
  globalThis.gc();
  const before = process.memoryUsage();
  const began = performance.now();
  const index = createLexicalDiscoveryIndex(documents);
  const initializeMs = performance.now() - began;
  globalThis.gc();
  const after = process.memoryUsage();
  const queryMs = [];
  for (let n = 0; n < 100; n++) {
    const start = performance.now();
    await index.search('put supports evenly around a circle');
    queryMs.push(performance.now() - start);
  }
  const sorted = [...queryMs].sort((a, b) => a - b);
  console.log(
    JSON.stringify({
      entries: workerSize,
      initializeMs,
      heapDeltaBytes: after.heapUsed - before.heapUsed,
      rssDeltaBytes: after.rss - before.rss,
      queryP95Ms: sorted[94],
      queryMs,
      before,
      after,
    }),
  );
} else {
  const measurements = [];
  for (const size of [catalog.length, 500, 1_000]) {
    for (let repetition = 0; repetition < 5; repetition++) {
      const child = spawnSync(
        process.execPath,
        ['--expose-gc', process.argv[1]!, '--size', String(size)],
        { encoding: 'utf8', windowsHide: true, timeout: 30_000 },
      );
      if (child.status !== 0) throw new Error(child.stderr || String(child.error));
      measurements.push({ repetition, ...JSON.parse(child.stdout) });
    }
  }
  const summary = [...new Set(measurements.map((m) => m.entries))].map((entries) => {
    const group = measurements.filter((m) => m.entries === entries);
    return {
      entries,
      maxInitializeMs: Math.max(...group.map((m) => m.initializeMs)),
      maxHeapDeltaBytes: Math.max(...group.map((m) => m.heapDeltaBytes)),
      maxRssDeltaBytes: Math.max(...group.map((m) => m.rssDeltaBytes)),
      maxQueryP95Ms: Math.max(...group.map((m) => m.queryP95Ms)),
    };
  });
  const report = {
    version: 'kiln.discovery-isolated-scale.v1',
    runtime: process.versions,
    platform: process.platform,
    arch: process.arch,
    cpu: cpus()[0]?.model,
    catalogSha256: createHash('sha256').update(JSON.stringify(catalog)).digest('hex'),
    measurements,
    summary,
    limitations: [
      'Synthetic catalog copies measure resource growth, not semantic relevance.',
      'Each sample has its own process, with GC before and after index construction.',
      'Memory deltas exclude the catalog and imported modules; they describe retained index overhead.',
      'RSS deltas are allocator observations, not peak memory; query timing includes the first query.',
      'A single Windows desktop does not establish low-power or cross-platform acceptance.',
    ],
  };
  const filename = `results-scale-${process.versions.bun ? 'bun' : 'node'}.json`;
  writeFileSync(new URL(filename, import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ filename, summary }));
}

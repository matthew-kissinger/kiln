import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus } from 'node:os';
import { createDiscovery, listDiscoveryEntries } from '../../src/discovery';

const here = new URL('./', import.meta.url);
const catalog = listDiscoveryEntries();
const source = JSON.stringify(catalog);
const run = createDiscovery();
const queryFiles = ['queries.json', 'queries-independent.json'];
const rows = [];
for (const file of queryFiles) {
  const bytes = readFileSync(new URL(file, here));
  const parsed = JSON.parse(bytes.toString('utf8'));
  for (const judgment of Array.isArray(parsed) ? parsed : parsed.queries) {
    const started = performance.now();
    const output = await run({ query: judgment.query, limit: 5 });
    const firstMs = performance.now() - started;
    const timings = [];
    for (let repeat = 0; repeat < 20; repeat++) {
      const start = performance.now();
      await run({ query: judgment.query, limit: 5 });
      timings.push(performance.now() - start);
    }
    timings.sort((a, b) => a - b);
    const found = output.entries.map((entry) => entry.name);
    const relevant = new Set(judgment.relevant);
    const rank = found.findIndex((name) => relevant.has(name));
    rows.push({
      ...judgment,
      split: judgment.split ?? 'independent-observed',
      found,
      recallAt5: relevant.size
        ? found.filter((name) => relevant.has(name)).length / relevant.size
        : null,
      reciprocalRank: rank < 0 ? 0 : 1 / (rank + 1),
      firstMs,
      warmP95Ms: timings[18],
      responseBytes: Buffer.byteLength(JSON.stringify(output)),
    });
  }
}
const summary = [...new Set(rows.map((row) => row.split))].map((split) => {
  const group = rows.filter((row) => row.split === split);
  const supported = group.filter((row) => row.recallAt5 !== null);
  return {
    split,
    recallAt5: supported.reduce((sum, row) => sum + row.recallAt5!, 0) / supported.length,
    mrrAt5: supported.reduce((sum, row) => sum + row.reciprocalRank, 0) / supported.length,
    unsupportedWithCandidates: group.filter((row) => row.recallAt5 === null && row.found.length)
      .length,
    maxResponseBytes: Math.max(...group.map((row) => row.responseBytes)),
  };
});
const report = {
  version: 'kiln.discovery-production-experiment.v1',
  runtime: process.versions,
  cpu: cpus()[0]?.model,
  platform: process.platform,
  arch: process.arch,
  catalogSha256: createHash('sha256').update(source).digest('hex'),
  catalogEntries: catalog.length,
  gcAvailable: typeof globalThis.gc === 'function',
  summary,
  scalabilityReceipt: `results-scale-${process.versions.bun ? 'bun' : 'node'}.json`,
  rows,
  limitations: [
    'All judgments were observed before this integration; this is regression evidence, not a fresh holdout.',
    'Growth entries are synthetic copies and say nothing about relevance as the catalog expands.',
    'Index timings exclude module imports and whole CLI startup.',
    'One desktop CPU host, not low-power or cross-platform qualification.',
  ],
};
const filename = process.versions.bun
  ? 'results-production-bun.json'
  : 'results-production-node.json';
writeFileSync(new URL(filename, here), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ filename, summary }));

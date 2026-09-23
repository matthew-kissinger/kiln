import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { create, insert, search } from '@orama/orama';
import { Document } from 'flexsearch';
import MiniSearch from 'minisearch';
import { listHelperSpecs } from '../../src/discovery/helper-specs';
import { discoveryIntents, discoveryTokens } from '../../src/discovery/intents';

// Research only. Run with Bun from any cwd; dependencies stay in this directory.
const independent = process.argv.includes('--independent');
const queriesText = readFileSync(
  new URL(independent ? './queries-independent.json' : './queries.json', import.meta.url),
  'utf8',
);
const judgments = independent ? JSON.parse(queriesText) : JSON.parse(queriesText).queries;
const split = independent
  ? 'independent'
  : process.argv.includes('--heldout')
    ? 'heldout'
    : 'development';
const selected = independent ? judgments : judgments.filter((q) => q.split === split);
const retired = new Set(['cloneGeometry', 'cloneMaterial', 'validateAsset', 'panelRemapV']);
const source = listHelperSpecs().filter((entry) => !retired.has(entry.name));
const normalize = (text: string) => discoveryTokens(text).join(' ');
const documents = source.map((entry) => ({
  id: entry.name,
  name: normalize(entry.name),
  intent: normalize((discoveryIntents[entry.name] ?? []).join(' ')),
  description: normalize(entry.description),
  family: normalize(entry.category),
}));
const weights = { name: 4, intent: 3, description: 1, family: 0.5 };
const fields = Object.keys(weights);
const backends: Array<{
  name: string;
  initializeMs: number;
  query: (query: string) => Promise<string[]>;
}> = [];
let start = performance.now();
const orama = create({
  schema: { name: 'string', intent: 'string', description: 'string', family: 'string' },
});
for (const doc of documents) await insert(orama, doc);
backends.push({
  name: 'orama-3.1.18',
  initializeMs: performance.now() - start,
  query: async (query) =>
    (
      await search(orama, {
        term: normalize(query),
        boost: weights,
        threshold: 1,
        tolerance: 1,
        limit: 5,
      })
    ).hits.map((hit) => hit.id),
});
start = performance.now();
const mini = new MiniSearch({
  fields,
  tokenize: (text) => text.split(' ').filter(Boolean),
  searchOptions: { boost: weights, combineWith: 'OR', prefix: true, fuzzy: 0.2 },
});
mini.addAll(documents);
backends.push({
  name: 'minisearch-7.2.0',
  initializeMs: performance.now() - start,
  query: async (query) =>
    mini
      .search(normalize(query))
      .slice(0, 5)
      .map((hit) => String(hit.id)),
});
start = performance.now();
const flex = new Document({ tokenize: 'forward', document: { id: 'id', index: fields } });
for (const doc of documents) flex.add(doc);
backends.push({
  name: 'flexsearch-0.8.212-weighted-rrf',
  initializeMs: performance.now() - start,
  query: async (query) => {
    const results = flex.search(normalize(query), { limit: 20, suggest: true });
    const scores = new Map<string, number>();
    for (const group of results) {
      for (const [rank, id] of group.result.entries())
        scores.set(
          String(id),
          (scores.get(String(id)) ?? 0) + weights[group.field] / (60 + rank + 1),
        );
    }
    return [...scores]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 5)
      .map(([id]) => id);
  },
});
backends.unshift({
  name: 'current-substring-baseline',
  initializeMs: 0,
  query: async (query) => {
    const tokens = query.toLowerCase().split(/\s+/);
    return source
      .filter((entry) =>
        tokens.every((token) =>
          `${entry.name} ${entry.category} ${entry.description} ${entry.signature} ${entry.example} ${entry.promptNotes ?? ''}`
            .toLowerCase()
            .includes(token),
        ),
      )
      .slice(0, 5)
      .map((entry) => entry.name);
  },
});
const rows = [];
for (const backend of backends) {
  const results = [];
  for (const judgment of selected) {
    start = performance.now();
    const found = await backend.query(judgment.query);
    const firstQueryMs = performance.now() - start;
    const times: number[] = [];
    for (let i = 0; i < 20; i++) {
      start = performance.now();
      await backend.query(judgment.query);
      times.push(performance.now() - start);
    }
    times.sort((a, b) => a - b);
    const relevant = new Set(judgment.relevant);
    const rank = found.findIndex((id) => relevant.has(id));
    results.push({
      ...judgment,
      found,
      recallAt5: relevant.size
        ? found.filter((id) => relevant.has(id)).length / relevant.size
        : null,
      reciprocalRank: rank < 0 ? 0 : 1 / (rank + 1),
      unsupportedReturned: relevant.size === 0 && found.length > 0,
      firstQueryMs,
      medianWarmMs: times[10],
      responseBytes: Buffer.byteLength(JSON.stringify(found)),
    });
  }
  const supported = results.filter((row) => row.relevant.length > 0);
  rows.push({
    name: backend.name,
    initializeMs: backend.initializeMs,
    recallAt5: supported.reduce((sum, row) => sum + row.recallAt5, 0) / supported.length,
    mrrAt5: supported.reduce((sum, row) => sum + row.reciprocalRank, 0) / supported.length,
    unsupportedQueriesReturningResults: results.filter((row) => row.unsupportedReturned).length,
    results,
  });
}
const report = {
  version: 'kiln.retrieval-benchmark.v1',
  split,
  runtime: process.versions,
  platform: process.platform,
  catalogSize: documents.length,
  judgmentsSha256: createHash('sha256').update(queriesText).digest('hex'),
  documentsSha256: createHash('sha256').update(JSON.stringify(documents)).digest('hex'),
  limitations: [
    'Single Windows host; first query excludes module import cost.',
    'Shared preprocessing/weights, native matching differs. FlexSearch combines field ranks with weighted RRF.',
    'No unsupported-query abstention layer or exact lookup bypass. These are candidate retrievers, not finished Discovery.',
    'Neural challengers and independently judged blind queries remain unrun. No default selected.',
  ],
  rows,
};
const destination = new URL(`./results-${split}.json`, import.meta.url);
writeFileSync(destination, `${JSON.stringify(report, null, 2)}\n`);
console.log(
  JSON.stringify(
    { split, catalogSize: documents.length, rows: rows.map(({ results, ...summary }) => summary) },
    null,
    2,
  ),
);

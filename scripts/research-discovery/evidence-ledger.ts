/** Repository-only evidence census. It inventories proof without inferring quality from use. */
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { parse } from 'acorn';
import { simple } from 'acorn-walk';
import { listDiscoveryEntries } from '../../src/discovery/catalog';
import { sourceBindings } from '../../src/source-bindings';

const root = resolve(import.meta.dir, '../..');
const evidenceRoot = resolve(process.argv[2] ?? '');
if (!process.argv[2]) throw new Error('Pass the retained dogfood evidence directory.');
const catalog = listDiscoveryEntries();
const sha = (text: string | Uint8Array) => createHash('sha256').update(text).digest('hex');
const json = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const historical = json(join(root, 'docs/reviews/2026-09-21-catalog-census.json'));
const ledger = json(join(root, 'docs/plans/2026-09-21-implementation-ledger.json'));
const destination = ledger.checkpoint.supplementaryGates.destination;
const imports =
  destination?.status === 'checkout-qualified-bounded' ? json(destination.receipt) : undefined;
const importedSources = imports
  ? (json(destination.preparation).rows as { name: string; sourceSha256: string }[])
  : [];
if (imports && (!imports.passed || imports.runtime !== ledger.checkpoint.runtimeIdentity))
  throw new Error('Destination evidence does not qualify the selected runtime.');
const testLog = readFileSync(ledger.checkpoint.testLog, 'utf8');
if (!testLog.includes('0 fail') || !testLog.includes('Coverage gate passed'))
  throw new Error('A completed checkout gate is required.');
if (
  !testLog.includes(
    '(pass) every published recipe example executes in the authoring sandbox and exports cleanly',
  )
)
  throw new Error('Recipe execution evidence is absent from the selected gate.');

function walk(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}
const testFiles = [...walk(join(root, 'src')), ...walk(join(root, 'scripts'))]
  .filter((path) => /\.test\.[cm]?[jt]s$/.test(path))
  .map((path) => ({
    path: relative(root, path).replaceAll('\\', '/'),
    text: readFileSync(path, 'utf8'),
  }));
const helpers = new Set(catalog.filter((e) => e.kind !== 'recipe').map((e) => e.name));
const ids = new Set(catalog.map((e) => e.id));

/** Direct identifier calls only. Local declarations/parameters are conservatively excluded. */
function calls(text: string): string[] {
  const file = parse(text, {
    ecmaVersion: 'latest',
    sourceType: 'script',
    allowAwaitOutsideFunction: true,
  });
  const local = sourceBindings(file).allNames,
    found = new Set<string>();
  simple(file, {
    CallExpression(node) {
      if (
        node.callee.type === 'Identifier' &&
        helpers.has(node.callee.name) &&
        !local.has(node.callee.name)
      )
        found.add(node.callee.name);
    },
  });
  return [...found].sort();
}

type StageEvidence = {
  trial: string;
  stage: number;
  source: string;
  sha256: string;
  summary: string;
  helpers: string[];
  requestedIds: string[];
  review: string;
};
const stages: StageEvidence[] = [];
const excluded: string[] = [];
for (const entry of readdirSync(evidenceRoot, { withFileTypes: true })
  .filter((e) => e.isDirectory() && /^main-\d+-/.test(e.name))
  .sort((a, b) => a.name.localeCompare(b.name))) {
  const workspace = join(evidenceRoot, entry.name),
    evidence = join(evidenceRoot, `evidence-${entry.name}`);
  if (
    ![0, 1, 2].every(
      (stage) =>
        existsSync(join(workspace, `stage-${stage}.kiln.js`)) &&
        existsSync(join(evidence, `stage-${stage}-summary.json`)),
    )
  ) {
    excluded.push(entry.name);
    continue;
  }
  for (const stage of [0, 1, 2]) {
    const summaryPath = join(evidence, `stage-${stage}-summary.json`),
      summary = json(summaryPath),
      source = join(workspace, `stage-${stage}.kiln.js`);
    if (summary.process.exitCode !== 0 || summary.process.timedOut)
      throw new Error(`Nonterminal or failed stage: ${summaryPath}`);
    const code = readFileSync(source, 'utf8'),
      sourceHash = sha(code);
    if (summary.files['kiln.js'].sha256 !== sourceHash)
      throw new Error(`Source hash mismatch: ${source}`);
    const requestedIds = new Set<string>();
    const events = createInterface({
      input: createReadStream(join(evidence, `stage-${stage}-events.jsonl`)),
      crlfDelay: Infinity,
    });
    for await (const line of events) {
      if (!line.includes('kiln_discover') && !line.includes('--id')) continue;
      let event: {
        type: string;
        part: {
          tool: string;
          state: {
            input?: { ids?: string[]; command?: string };
            metadata?: {
              metadata?: { toolCalls?: { tool: string; input?: { ids?: string[] } }[] };
            };
          };
        };
      };
      try {
        event = JSON.parse(line);
      } catch {
        continue;
      }
      if (event.type !== 'tool_use') continue;
      const part = event.part,
        state = part.state;
      const toolCalls = [
        ...(state.metadata?.metadata?.toolCalls ?? []),
        { tool: part.tool, input: state.input },
      ];
      for (const call of toolCalls)
        if (/kiln_discover$/.test(call.tool))
          for (const id of call.input?.ids ?? []) if (ids.has(id)) requestedIds.add(id);
      const command = state.input?.command;
      if (typeof command === 'string' && /\bdiscover\b/.test(command))
        for (const match of command.matchAll(/--id\s+["']?((?:recipe|operation|assembly):[\w-]+)/g))
          if (ids.has(match[1]!)) requestedIds.add(match[1]!);
    }
    stages.push({
      trial: entry.name,
      stage,
      source,
      sha256: sourceHash,
      summary: summaryPath,
      helpers: calls(code),
      requestedIds: [...requestedIds].sort(),
      review: 'docs/reviews/2026-09-22-opencode-main-campaign.md',
    });
  }
}
if (stages.length !== ledger.checkpoint.supplementaryGates.mainCampaign.completedMain * 3)
  throw new Error(
    'Completed-source inventory differs from the recorded campaign. Reconcile before regenerating.',
  );

const entries = catalog.map((entry) => {
  const old = historical.helpers.find((h: { name: string }) => h.name === entry.name);
  const pattern = new RegExp(
    `(?<![A-Za-z0-9_$])${(entry.kind === 'recipe' ? entry.id : entry.name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![A-Za-z0-9_$])`,
  );
  const observed = stages.filter((s) => entry.kind !== 'recipe' && s.helpers.includes(entry.name));
  return {
    id: entry.id,
    name: entry.name,
    kind: entry.kind,
    stability: entry.stability,
    tests: {
      lexicalReferences: testFiles.filter((f) => pattern.test(f.text)).map((f) => f.path),
      referenceMeaning: 'Mentions including strings/comments; not verified per-helper assertions.',
      ...(entry.kind === 'recipe'
        ? {
            executedCatalogExample: {
              test: 'src/discovery/recipes.test.ts',
              gate: ledger.checkpoint.testLog,
              checks:
                'Sandbox execution, GLB export and zero validator errors; additional material/rig assertions where applicable. No image or destination acceptance.',
            },
          }
        : {}),
    },
    examples: {
      catalogExample:
        entry.kind === 'recipe'
          ? 'executable full program'
          : 'contract snippet; not necessarily standalone',
      historicalMain: old?.exampleFiles ?? [],
      historicalSite: old?.siteExampleFiles ?? [],
      historicalRevision: historical.revision,
      historicalMeaning:
        'Copied from the existing historical census only. Unvetted showcase call references; no new gallery inspection or quality claim. Trees overlap.',
    },
    agentUse: {
      sourceCallSites: observed.map((s) => ({
        trial: s.trial,
        stage: s.stage,
        source: s.source,
        sha256: s.sha256,
      })),
      discoveryIdRequests: stages
        .filter((s) => s.requestedIds.includes(entry.id))
        .map((s) => ({
          trial: s.trial,
          stage: s.stage,
          trace: join(evidenceRoot, `evidence-${s.trial}`, `stage-${s.stage}-events.jsonl`),
        })),
      meaning:
        'Calls in delivered source, not per-call runtime instrumentation; requests do not prove retrieval success or recipe adoption. Indirect/aliased/property calls and conservatively shadowed identifiers may be missed.',
    },
    visualReview: {
      associatedArtifactStages: observed.map((s) => `${s.trial}/stage-${s.stage}`),
      report: 'docs/reviews/2026-09-22-opencode-main-campaign.md',
      meaning:
        'Asset-level review association only. Findings and failures remain in the campaign; not isolated helper acceptance or golden examples.',
    },
    destinationImport: {
      evidence: importedSources
        .filter((r) => observed.some((s) => s.sha256 === r.sourceSha256))
        .map((r) => ({
          asset: r.name,
          sourceSha256: r.sourceSha256,
          report: destination.report,
          receipt: destination.receipt,
          consumer: destination.consumer,
        })),
      status: importedSources.some((r) => observed.some((s) => s.sha256 === r.sourceSha256))
        ? 'associated-asset-import-qualified'
        : 'not-qualified-for-current-candidate',
      meaning:
        'Only actual destination imports of exact observed source revisions are associated. Asset-level bounded qualification is not isolated helper or appearance acceptance. No evidence for an entry does not negate other destination results.',
    },
    limitations: entry.limitations,
  };
});
const output = {
  version: 'kiln.entry-evidence.v1',
  runtime: ledger.checkpoint.runtimeIdentity,
  catalogSha256: sha(JSON.stringify(catalog)),
  gate: ledger.checkpoint.testLog,
  evidenceRoot,
  completedAuthorings: stages.length / 3,
  stages: stages.map(({ helpers, requestedIds, ...s }) => s),
  excluded,
  meaning:
    'Bounded evidence inventory, not a quality score. Zero means no evidence found by this method, never proof of nonuse. Refresh after campaign completion and destination qualification.',
  entries,
};
const path = join(root, 'docs/reviews/2026-09-23-entry-evidence.json');
writeFileSync(path, `${JSON.stringify(output, null, 2)}\n`);
console.log(
  JSON.stringify({
    path,
    entries: entries.length,
    recipes: entries.filter((e) => e.kind === 'recipe').length,
    completedAuthorings: output.completedAuthorings,
    helpersWithObservedCalls: entries.filter((e) => e.agentUse.sourceCallSites.length).length,
    entriesWithDiscoveryRequests: entries.filter((e) => e.agentUse.discoveryIdRequests.length)
      .length,
  }),
);

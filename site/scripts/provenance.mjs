import { createHash } from 'node:crypto';

/** Sidecar credits preserve byte-exact model source and refuse stale attribution. */
export function recordedExampleCredit(source, record) {
  if (!record) return null;
  if (record.sourceHash !== createHash('sha256').update(source).digest('hex'))
    throw new Error('Recorded example source hash does not match.');
  if (
    typeof record.model !== 'string' ||
    typeof record.harness !== 'string' ||
    typeof record.provenance?.attribution !== 'string'
  )
    throw new Error('Incomplete recorded example credit.');
  return {
    model: record.model,
    harness: record.harness,
    authoredDate: record.authoredDate,
    provenance: { ...exampleProvenance(source), ...record.provenance },
  };
}

/** Preserve author declarations without presenting them as an isolation audit. */
export function exampleProvenance(source) {
  const explicit = /^\/\/ Authored by:/m.test(source);
  const noExamples = /no access to this repository|No example asset or engine implementation/i.test(
    source,
  );
  return {
    attribution: explicit
      ? 'Source-header credit'
      : 'Historical collection attribution; no model header',
    sourceAccess: noExamples
      ? 'Source header declares no repository implementation or finished examples supplied'
      : 'Not recorded',
    inheritedContext: 'Not independently recorded; source-header declarations only',
    startingExample: noExamples ? 'None supplied, according to source header' : 'Not recorded',
    humanIntervention: /^\/\/ Maintainer revision:/m.test(source)
      ? source.match(/^\/\/ Maintainer revision: (.+)$/m)[1]
      : /reviewer feedback/i.test(source)
        ? 'Reviewer feedback; revisions by the credited model'
        : /Not a line of it is hand-authored/i.test(source)
          ? 'Header declares no hand-authored source; other intervention not recorded'
          : 'Not recorded',
    reviewFidelity: /Geometry reviewed during authoring/i.test(source)
      ? 'Geometry during authoring; material-faithful gallery review performed separately'
      : /looked at its own six-view contact sheet/i.test(source)
        ? 'Six-view review declared; renderer fidelity not recorded'
        : 'Not recorded',
    poster:
      'Archival gallery render. Its exact source revision and renderer settings were not recorded with the image.',
  };
}

/** Exact-poster claims apply only to this generated source, GLB and PNG trio. */
export function verifyRecordedPoster(record, source, artifact, image) {
  const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
  if (
    record.sourceHash !== hash(source) ||
    record.artifactHash !== hash(artifact) ||
    record.imageHash !== hash(image)
  )
    throw new Error('Recorded poster is stale; regenerate it from the current gallery GLB.');
}

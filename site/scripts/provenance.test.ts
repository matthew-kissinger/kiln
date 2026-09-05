import { describe, expect, test } from 'bun:test';
import { exampleProvenance } from './provenance.mjs';

describe('gallery attribution boundaries', () => {
  test('missing author records remain unknown rather than becoming clean-room evidence', () => {
    const p = exampleProvenance('const meta = {};');
    expect(p.attribution).toBe('Historical collection attribution; no model header');
    expect(p.sourceAccess).toBe('Not recorded');
    expect(p.humanIntervention).toBe('Not recorded');
  });
  test('preserves stated isolation and reviewer input without claiming an independent audit', () => {
    const p = exampleProvenance(
      '// Authored by: muse, via opencode.\n// No example asset or engine implementation was supplied as authoring context.\n// Refined by the same model using source references after reviewer feedback.\n// Geometry reviewed during authoring; material-faithful gallery render reviewed separately.',
    );
    expect(p.attribution).toBe('Source-header credit');
    expect(p.sourceAccess).toContain('declares');
    expect(p.humanIntervention).toContain('Reviewer');
    expect(p.reviewFidelity).toContain('Geometry');
  });
});

test('recorded gallery credit is bound to exact source bytes', async () => {
  const { recordedExampleCredit } = await import('./provenance.mjs');
  const { createHash } = await import('node:crypto');
  const code = 'const meta = {};';
  const record = {
    sourceHash: createHash('sha256').update(code).digest('hex'),
    model: 'GPT-6 Astra',
    harness: 'Codex',
    authoredDate: '2026-09-05',
    provenance: { attribution: 'Recorded model run' },
  };
  expect(recordedExampleCredit(code, record).model).toBe('GPT-6 Astra');
  expect(() => recordedExampleCredit(code + ' ', record)).toThrow('source');
});

test('recorded exact poster refuses a changed source, artifact or image', async () => {
  const { verifyRecordedPoster } = await import('./provenance.mjs');
  const { createHash } = await import('node:crypto');
  const hash = (x: string) => createHash('sha256').update(x).digest('hex');
  const r = { sourceHash: hash('source'), artifactHash: hash('glb'), imageHash: hash('png') };
  expect(() => verifyRecordedPoster(r, 'source', 'glb', 'png')).not.toThrow();
  for (const bytes of [
    ['changed', 'glb', 'png'],
    ['source', 'changed', 'png'],
    ['source', 'glb', 'changed'],
  ])
    expect(() => verifyRecordedPoster(r, ...bytes)).toThrow('poster');
});

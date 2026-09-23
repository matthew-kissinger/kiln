/** Pure edit-buffer behavior used by immutable program edits. */
import { describe, test, expect } from 'bun:test';
import { KilnDraftBuffer, KilnDraftBuffer as KilnEditBuffer } from '../edit-buffer';

const SEED = `const meta = { name: 'crate' };
function build() {
  const root = createRoot();
  const body = createPart('Body', boxGeo(1, 1, 1), gameMaterial('#8a5a2b'));
  root.add(body);
  return root;
}`;

test('apply replaces a unique span and records the edit', () => {
  const buf = new KilnEditBuffer(SEED);
  const r = buf.apply({ oldString: 'boxGeo(1, 1, 1)', newString: 'boxGeo(2, 1, 1)' });
  expect(r.ok).toBe(true);
  if (r.ok) {
    expect(r.occurrences).toBe(1);
    expect(r.newBytes).toBe(buf.code.length);
  }
  expect(buf.code).toContain('boxGeo(2, 1, 1)');
  expect(buf.code).not.toContain('boxGeo(1, 1, 1)');
  expect(buf.edits).toHaveLength(1);
  expect(buf.edits[0]).toEqual({
    oldString: 'boxGeo(1, 1, 1)',
    newString: 'boxGeo(2, 1, 1)',
    replaceAll: false,
    occurrences: 1,
  });
});

test('apply errors (no mutation) when oldString is not found', () => {
  const buf = new KilnEditBuffer(SEED);
  const r = buf.apply({ oldString: 'sphereGeo(3)', newString: 'boxGeo(3,3,3)' });
  expect(r.ok).toBe(false);
  if (!r.ok) {
    expect(r.error).toContain('not found');
    expect(r.hint).toBeDefined();
  }
  expect(buf.code).toBe(SEED);
  expect(buf.edits).toHaveLength(0);
});

test('apply errors on an ambiguous (multi-match) oldString unless replaceAll', () => {
  const src = 'a = 1;\nb = 1;\nc = 1;';
  const buf = new KilnEditBuffer(src);
  const r = buf.apply({ oldString: '1', newString: '2' });
  expect(r.ok).toBe(false);
  if (!r.ok) {
    expect(r.occurrences).toBe(3);
    expect(r.error).toContain('3 times');
  }
  expect(buf.code).toBe(src); // unchanged

  const r2 = buf.apply({ oldString: '1', newString: '2', replaceAll: true });
  expect(r2.ok).toBe(true);
  if (r2.ok) expect(r2.occurrences).toBe(3);
  expect(buf.code).toBe('a = 2;\nb = 2;\nc = 2;');
  expect(buf.edits[0]?.replaceAll).toBe(true);
});

test('apply rejects an identical or empty oldString', () => {
  const buf = new KilnEditBuffer(SEED);
  expect(buf.apply({ oldString: 'createRoot()', newString: 'createRoot()' }).ok).toBe(false);
  expect(buf.apply({ oldString: '', newString: 'x' }).ok).toBe(false);
  expect(buf.code).toBe(SEED);
});

test('apply treats newString literally - no $ / $& substitution', () => {
  const buf = new KilnEditBuffer('label = PRICE;');
  const r = buf.apply({ oldString: 'PRICE', newString: '$5 for $& and $1' });
  expect(r.ok).toBe(true);
  expect(buf.code).toBe('label = $5 for $& and $1;');
});

test('view returns the raw buffer and a line count that tracks edits', () => {
  const buf = new KilnEditBuffer(SEED);
  const v = buf.view();
  expect(v.code).toBe(SEED);
  expect(v.lines).toBe(SEED.split('\n').length);
  buf.apply({
    oldString: '  return root;\n',
    newString: '  root.add(createPart("Lid", boxGeo(1,1,1)));\n  return root;\n',
  });
  expect(buf.view().lines).toBe(buf.code.split('\n').length);
});

describe('draft replacement primitive', () => {
  test('seeds empty by default', () => {
    const buf = new KilnDraftBuffer();
    expect(buf.code).toBe('');
    expect(buf.edits).toHaveLength(0);
  });
  test('draft replaces the whole buffer and is NOT recorded as an edit', () => {
    const buf = new KilnDraftBuffer();
    const r = buf.draft(SEED);
    expect(r.ok).toBe(true);
    expect(r.bytes).toBe(SEED.length);
    expect(r.lines).toBe(SEED.split('\n').length);
    expect(buf.code).toBe(SEED);
    expect(buf.edits).toHaveLength(0); // drafting is authoring, not a diff step
  });
  test('draft then surgical edit: edit is recorded, draft is not', () => {
    const buf = new KilnDraftBuffer();
    buf.draft(SEED);
    const r = buf.apply({ oldString: 'boxGeo(1, 1, 1)', newString: 'boxGeo(2, 1, 1)' });
    expect(r.ok).toBe(true);
    expect(buf.code).toContain('boxGeo(2, 1, 1)');
    expect(buf.edits).toHaveLength(1);
  });
});

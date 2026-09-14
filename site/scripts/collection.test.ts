import { expect, test } from 'bun:test';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { PUBLIC_EXAMPLES, isPublicExample } from './collection.mjs';

test('public gallery excludes archived examples and teaching programs', () => {
  for (const name of ['tidal-observatory', 'fire-lookout-tower', 'crate', 'well']) expect(isPublicExample(name)).toBe(false);
  for (const name of ['bench-refractor', 'orbital-station', 'abyssal-surveyor']) expect(isPublicExample(name)).toBe(true);
});

test('publishing is an explicit allowlist rather than an implicit file scan', () => {
  expect(isPublicExample('new-unreviewed-asset')).toBe(false);
  expect(PUBLIC_EXAMPLES).toHaveLength(80);
  expect(new Set(PUBLIC_EXAMPLES).size).toBe(PUBLIC_EXAMPLES.length);
  const selected = readdirSync(resolve(import.meta.dir, '../../examples'))
    .filter((name) => name.endsWith('.kiln.js'))
    .map((name) => name.slice(0, -'.kiln.js'.length))
    .filter(isPublicExample)
    .sort();
  expect(selected).toEqual([...PUBLIC_EXAMPLES].sort());
});

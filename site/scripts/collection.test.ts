import { expect, test } from 'bun:test';
import { isPublicExample } from './collection.mjs';

test('public gallery excludes archived examples and teaching programs', () => {
  for (const name of ['tidal-observatory', 'fire-lookout-tower', 'crate', 'well']) expect(isPublicExample(name)).toBe(false);
  for (const name of ['bench-refractor', 'orbital-station', 'abyssal-surveyor']) expect(isPublicExample(name)).toBe(true);
});

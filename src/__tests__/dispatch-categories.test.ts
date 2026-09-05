/**
 * The dispatcher's category list is a copy, and copies rot.
 *
 * `scripts/dispatch-asset.mjs` runs before anything is built -- it is the thing
 * that drives a foreign CLI at a clean sandbox -- so it cannot import this
 * package's TypeScript. It therefore keeps its own literal array of the seven
 * categories, and rejects anything outside it so a typo fails in the first
 * second instead of producing an asset filed under nothing. This test is the
 * seam that keeps that array honest.
 *
 * The flag exists because its absence was measurable: every asset the
 * dispatcher had ever produced came back `category: 'prop'`, because the brief
 * said so in a string literal. The engine has carried per-category guidance the
 * whole time and nothing was reaching it.
 */

import { describe, expect, it } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { ASSET_CATEGORIES } from '../contracts';

const script = readFile(join(import.meta.dir, '../../scripts/dispatch-asset.mjs'), 'utf8');

describe('dispatch-asset.mjs category contract', () => {
  it('mirrors ASSET_CATEGORIES exactly', async () => {
    const src = await script;
    const line = /const ASSET_CATEGORIES = \[([^\]]+)\]/.exec(src);
    expect(line).not.toBeNull();
    const mirrored = [...line![1]!.matchAll(/'([a-z]+)'/g)].map((m) => m[1]);
    expect(mirrored).toEqual([...ASSET_CATEGORIES]);
  });

  it('has a brief for every category', async () => {
    const src = await script;
    const block = /const CATEGORY_BRIEF = \{([\s\S]*?)\n\};/.exec(src);
    expect(block).not.toBeNull();
    const keys = [...block![1]!.matchAll(/^ {2}([a-z]+):/gm)].map((m) => m[1]);
    // `prop` is deliberately empty -- it is the default and the base skill
    // already describes it -- but it still has to be present, so that adding a
    // category to the contract without a brief fails here rather than silently
    // dispatching with no guidance.
    expect([...keys].sort()).toEqual([...ASSET_CATEGORIES].sort());
  });

  it('puts the chosen category into the meta line it asks for', async () => {
    const src = await script;
    // Assembled rather than written out, because a literal `${...}` inside a
    // plain string is exactly what the linter is right to be suspicious of.
    const interpolated = ['category:', " '$", '{category}', "' };"].join('');
    expect(src).toContain(interpolated);
    expect(src).not.toContain("category: 'prop' };");
  });
});

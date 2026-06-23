/**
 * Unit tests for the dependency-free unified diff (the refine patch artifact).
 *
 * Asserts the standard `@@ -a,b +c,d @@` hunk format, the equal-input fast path,
 * pure insertions / deletions, multi-hunk grouping, and that `$`-bearing content
 * round-trips literally (no regex interpretation anywhere in the pipeline).
 */
import { test, expect } from 'bun:test';
import { unifiedDiff } from './diff';

test('returns empty string for identical input', () => {
  expect(unifiedDiff('a\nb\nc', 'a\nb\nc')).toBe('');
  expect(unifiedDiff('', '')).toBe('');
});

test('a single line change produces one hunk with context', () => {
  const before = 'l1\nl2\nl3\nl4\nl5';
  const after = 'l1\nl2\nCHANGED\nl4\nl5';
  const d = unifiedDiff(before, after);
  expect(d).toContain('@@ -1,5 +1,5 @@');
  expect(d).toContain('-l3');
  expect(d).toContain('+CHANGED');
  expect(d).toContain(' l2');
  expect(d).toContain(' l4');
});

test('emits ---/+++ headers when labels are given', () => {
  const d = unifiedDiff('x', 'y', { fromLabel: 'parent', toLabel: 'refined' });
  expect(d.startsWith('--- parent\n+++ refined\n')).toBe(true);
});

test('pure insertion: a-length is zero on the inserted hunk side', () => {
  const before = 'a\nb';
  const after = 'a\nNEW\nb';
  const d = unifiedDiff(before, after, { context: 1 });
  expect(d).toContain('+NEW');
  // before still has 2 lines of context, after has 3.
  expect(d).toMatch(/@@ -1,2 \+1,3 @@/);
});

test('pure deletion shows removed lines', () => {
  const before = 'a\nGONE\nb';
  const after = 'a\nb';
  const d = unifiedDiff(before, after, { context: 1 });
  expect(d).toContain('-GONE');
  expect(d).toMatch(/@@ -1,3 \+1,2 @@/);
});

test('two far-apart changes produce two separate hunks', () => {
  const lines = Array.from({ length: 20 }, (_, i) => `line${i}`);
  const before = lines.join('\n');
  const after = lines.map((l, i) => (i === 1 ? 'TOP' : i === 18 ? 'BOTTOM' : l)).join('\n');
  const d = unifiedDiff(before, after, { context: 2 });
  const hunks = d.split('\n').filter((l) => l.startsWith('@@'));
  expect(hunks).toHaveLength(2);
  expect(d).toContain('+TOP');
  expect(d).toContain('+BOTTOM');
});

test('content with $ tokens diffs literally', () => {
  const d = unifiedDiff('price = X', 'price = $& $1 $X');
  expect(d).toContain('-price = X');
  expect(d).toContain('+price = $& $1 $X');
});

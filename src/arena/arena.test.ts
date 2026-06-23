/**
 * Tests for the pure Kiln Arena ranking math — Bradley-Terry strength fitting +
 * adaptive pair sampling. Relocated with the implementation from kiln-bench so
 * the math is regression-covered in core (the single source of truth).
 */
import { test, expect } from 'bun:test';
import { fitBradleyTerry, type Vote } from './bradley-terry';
import { pickNextPair } from './adaptive';

test('bradley-terry recovers a clear ordering from synthetic votes', () => {
  // Ground truth strength: a > b > c. Generate votes consistent with that.
  const votes: Vote[] = [];
  const win = (w: string, l: string, n: number) => {
    for (let i = 0; i < n; i++) votes.push({ winner: w, loser: l });
  };
  // a dominates b and c; b beats c. A few upsets keep it well-conditioned.
  win('a', 'b', 8);
  win('b', 'a', 2);
  win('a', 'c', 9);
  win('c', 'a', 1);
  win('b', 'c', 7);
  win('c', 'b', 3);

  const result = fitBradleyTerry(votes);
  const order = result.items.map((i) => i.id);

  expect(order).toEqual(['a', 'b', 'c']);
  expect(result.converged).toBe(true);

  // Elo scores should be strictly decreasing and finite.
  const [a, b, c] = result.items;
  expect(a!.score).toBeGreaterThan(b!.score);
  expect(b!.score).toBeGreaterThan(c!.score);
  for (const it of result.items) {
    expect(Number.isFinite(it.score)).toBe(true);
    expect(Number.isFinite(it.stdErr)).toBe(true);
    expect(it.stdErr).toBeGreaterThan(0);
  }
});

test('bradley-terry is deterministic', () => {
  const votes: Vote[] = [
    { winner: 'x', loser: 'y' },
    { winner: 'x', loser: 'z' },
    { winner: 'y', loser: 'z' },
  ];
  const r1 = fitBradleyTerry(votes);
  const r2 = fitBradleyTerry(votes);
  expect(r1.items.map((i) => [i.id, i.score])).toEqual(r2.items.map((i) => [i.id, i.score]));
});

test('bradley-terry handles undefeated/winless extremes without NaN strengths', () => {
  // p beats everyone, r loses to everyone.
  const votes: Vote[] = [
    { winner: 'p', loser: 'q' },
    { winner: 'p', loser: 'r' },
    { winner: 'q', loser: 'r' },
  ];
  const result = fitBradleyTerry(votes);
  const order = result.items.map((i) => i.id);
  expect(order).toEqual(['p', 'q', 'r']);
  for (const it of result.items) {
    expect(Number.isNaN(it.strength)).toBe(false);
    expect(it.strength).toBeGreaterThan(0);
  }
});

test('bradley-terry seeds unvoted ids at neutral strength', () => {
  const result = fitBradleyTerry([{ winner: 'a', loser: 'b' }], { ids: ['a', 'b', 'lonely'] });
  const lonely = result.items.find((i) => i.id === 'lonely');
  expect(lonely).toBeDefined();
  expect(lonely!.games).toBe(0);
  expect(lonely!.strength).toBeGreaterThan(0);
  expect(Number.isNaN(lonely!.stdErr)).toBe(true); // no info -> not estimable
});

test('pickNextPair returns null for fewer than two items', () => {
  expect(pickNextPair([], [])).toBeNull();
  expect(pickNextPair(['only'], [])).toBeNull();
});

test('pickNextPair prefers an uncompared pair over a heavily-compared one', () => {
  const items = ['a', 'b', 'c'];
  // a vs b compared many times; a vs c and b vs c never compared.
  const votes: Vote[] = [];
  for (let i = 0; i < 10; i++) votes.push({ winner: 'a', loser: 'b' });

  const pair = pickNextPair(items, votes);
  expect(pair).not.toBeNull();
  const key = [pair!.a, pair!.b].sort().join(' ');
  expect(key).not.toBe('a b'); // must avoid the saturated pair
});

test('pickNextPair returns a valid, ordered, distinct pair', () => {
  const items = ['m', 'n', 'o', 'p'];
  const pair = pickNextPair(items, [{ winner: 'm', loser: 'n' }])!;
  expect(pair.a).not.toBe(pair.b);
  expect(items).toContain(pair.a);
  expect(items).toContain(pair.b);
  // canonical ordering (a < b over sorted ids)
  expect(pair.a < pair.b).toBe(true);
});

test('pickNextPair is deterministic given identical inputs', () => {
  const items = ['a', 'b', 'c', 'd'];
  const votes: Vote[] = [
    { winner: 'a', loser: 'b' },
    { winner: 'c', loser: 'd' },
  ];
  const p1 = pickNextPair(items, votes);
  const p2 = pickNextPair(items, votes);
  expect(p1).toEqual(p2);
});

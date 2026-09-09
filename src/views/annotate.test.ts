import { expect, test } from 'bun:test';
import { annotateViewCell, stampAxisGnomon } from './annotate';
import { stampLabel } from './pose';

const dir = [1, 0, 0] as const;
const cell = (size: number) => new Uint8Array(size * size * 3).fill(180);

test('tiny port cells preserve the legacy clipped annotation instead of dropping it', () => {
  for (const size of [4, 8, 10]) {
    const actual = cell(size);
    const expected = cell(size);
    annotateViewCell(actual, size, { name: 'FRONT', dir });
    stampLabel(expected, size, size, 2, 2, 'FRONT', 2);
    stampAxisGnomon(expected, size, dir);
    expect(Buffer.compare(actual, expected)).toBe(0);
    expect(Buffer.compare(actual, cell(size))).not.toBe(0);
  }
});

test('short camera names retain existing pixels at each supported cell size', () => {
  for (const size of [128, 256, 384, 1024]) {
    const actual = cell(size);
    const expected = cell(size);
    const scale = Math.max(2, Math.round(size / 96));
    annotateViewCell(actual, size, { name: 'FRONT', dir });
    stampLabel(expected, size, size, scale, scale, 'FRONT', scale);
    stampAxisGnomon(expected, size, dir);
    expect(Buffer.compare(actual, expected)).toBe(0);
  }
});

test('reported long custom camera label fits completely without clipping', () => {
  const size = 256;
  const name = 'Resolute initial / bow quarter';
  const actual = cell(size);
  const expected = cell(size);
  annotateViewCell(actual, size, { name, dir });
  stampLabel(expected, size, size, 3, 3, name, 2);
  stampAxisGnomon(expected, size, dir);
  expect(Buffer.compare(actual, expected)).toBe(0);
});

test('long names wrap at legible scale two within three corner rows', () => {
  const size = 128;
  const actual = cell(size);
  const expected = cell(size);
  annotateViewCell(actual, size, { name: 'FORWARD CAMERA WITH VERY LONG CUSTOM VIEW', dir });
  stampLabel(expected, size, size, 2, 2, 'FORWARD CAMERA', 2);
  stampLabel(expected, size, size, 2, 16, 'WITH VERY LONG', 2);
  stampLabel(expected, size, size, 2, 30, 'CUSTOM VIEW', 2);
  stampAxisGnomon(expected, size, dir);
  expect(Buffer.compare(actual, expected)).toBe(0);
});

test('pathological names split oversized words and end in visible ellipsis', () => {
  const size = 128;
  const name = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.repeat(5);
  const actual = cell(size);
  const expected = cell(size);
  const view = { name, dir };
  annotateViewCell(actual, size, view);
  stampLabel(expected, size, size, 2, 2, name.slice(0, 15), 2);
  stampLabel(expected, size, size, 2, 16, name.slice(15, 30), 2);
  stampLabel(expected, size, size, 2, 30, `${name.slice(30, 42)}...`, 2);
  stampAxisGnomon(expected, size, dir);
  expect(Buffer.compare(actual, expected)).toBe(0);
  expect(view.name).toBe(name);
  for (let y = 0; y < 48; y++)
    for (let x = size - 2; x < size; x++) expect(actual[(y * size + x) * 3]).toBe(180);
  // Label stays in the corner strip; it cannot grow down over the subject.
  for (let y = 44; y < 70; y++)
    for (let x = 0; x < size; x++) expect(actual[(y * size + x) * 3]).toBe(180);
});

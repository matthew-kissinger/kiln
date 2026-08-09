import { createHash } from 'node:crypto';
import { describe, expect, test } from 'bun:test';
import {
  createHeightfieldArtifactV1,
  decodeHeightfieldArtifactV1,
  encodeHeightfieldArtifactV1,
  hashHeightfieldArtifactV1,
  HEIGHTFIELD_QUANTIZATION_STEP,
  heightfieldGround,
  heightfieldMeshDataV1,
  stampHeightfieldArtifactV1,
} from './terrain';
import { flatGround } from './ground';

describe('HeightfieldArtifactV1', () => {
  test('is deterministic by seed and hashes the exact canonical bytes', async () => {
    const input = {
      seed: 42,
      origin: [-4, -4] as [number, number],
      cellSize: 2,
      width: 5,
      height: 5,
      baseHeight: 1,
      amplitude: 3,
      frequency: 0.2,
    };
    const a = createHeightfieldArtifactV1(input);
    const b = createHeightfieldArtifactV1(input);
    const c = createHeightfieldArtifactV1({ ...input, seed: 43 });
    expect(encodeHeightfieldArtifactV1(a)).toEqual(encodeHeightfieldArtifactV1(b));
    expect(a.heights).not.toEqual(c.heights);
    expect(
      a.heights.every((height) => Number.isInteger(height / HEIGHTFIELD_QUANTIZATION_STEP)),
    ).toBe(true);
    const expected = createHash('sha256').update(encodeHeightfieldArtifactV1(a)).digest('hex');
    expect(await hashHeightfieldArtifactV1(a)).toBe(expected);
    expect(decodeHeightfieldArtifactV1(encodeHeightfieldArtifactV1(a))).toEqual(a);
  });

  test('samples bilinear height, clamped edges, and normalized terrain normals', () => {
    const artifact = {
      schemaVersion: 'kiln.heightfield.v1' as const,
      seed: 1,
      origin: [10, 20] as [number, number],
      cellSize: 2,
      width: 2,
      height: 2,
      baseHeight: 0,
      amplitude: 0,
      frequency: 1,
      stamps: [],
      heights: [0, 2, 4, 6],
    };
    const sampler = heightfieldGround(artifact);
    expect(sampler.heightAt(11, 21)).toBe(3);
    expect(sampler.heightAt(-100, -100)).toBe(0);
    expect(sampler.heightAt(100, 100)).toBe(6);
    const normal = sampler.normalAt(11, 21);
    expect(Math.hypot(...normal)).toBeCloseTo(1, 12);
    expect(normal[1]).toBeGreaterThan(0);
    expect(flatGround(9).normalAt(0, 0)).toEqual([0, 1, 0]);
    const mesh = heightfieldMeshDataV1(artifact);
    expect(mesh.positions).toEqual([10, 0, 20, 12, 2, 20, 10, 4, 22, 12, 6, 22]);
    expect(mesh.indices).toEqual([0, 2, 1, 1, 2, 3]);
    expect(mesh.normals).toHaveLength(12);
  });

  test('applies bounded road, path, and pad stamps without mutating the source', () => {
    const source = createHeightfieldArtifactV1({
      seed: 1,
      origin: [0, 0],
      cellSize: 1,
      width: 7,
      height: 7,
      baseHeight: 5,
      amplitude: 0,
      frequency: 1,
    });
    const stamped = stampHeightfieldArtifactV1(source, [
      {
        kind: 'road',
        points: [
          [0, 3],
          [6, 3],
        ],
        halfWidth: 0.6,
        targetHeight: 1,
      },
      {
        kind: 'path',
        points: [
          [3, 0],
          [3, 6],
        ],
        halfWidth: 0.4,
        targetHeight: 2,
      },
      { kind: 'pad', center: [5, 5], halfExtents: [0.75, 0.75], targetHeight: 3 },
    ]);
    expect(source.heights.every((height) => height === 5)).toBe(true);
    const sampler = heightfieldGround(stamped);
    expect(sampler.heightAt(1, 3)).toBe(1);
    expect(sampler.heightAt(3, 1)).toBe(2);
    expect(sampler.heightAt(5, 5)).toBe(3);
    expect(stamped.stamps).toHaveLength(3);
  });

  test('fails closed on unknown versions, invalid dimensions, and non-positive stamp extents', () => {
    expect(() =>
      createHeightfieldArtifactV1({
        seed: 1,
        origin: [0, 0],
        cellSize: 1,
        width: 258,
        height: 2,
        baseHeight: 0,
        amplitude: 1,
        frequency: 1,
      }),
    ).toThrow();
    expect(() =>
      decodeHeightfieldArtifactV1(
        new TextEncoder().encode(JSON.stringify({ schemaVersion: 'kiln.heightfield.v2' })),
      ),
    ).toThrow();
    const flat = createHeightfieldArtifactV1({
      seed: 1,
      origin: [0, 0],
      cellSize: 1,
      width: 2,
      height: 2,
      baseHeight: 0,
      amplitude: 0,
      frequency: 1,
    });
    expect(() =>
      stampHeightfieldArtifactV1(flat, [
        { kind: 'pad', center: [0, 0], halfExtents: [0, 1], targetHeight: 0 },
      ]),
    ).toThrow();
  });
});

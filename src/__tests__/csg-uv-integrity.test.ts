/**
 * T2.4 — UV integrity across CSG.
 *
 * Two separable claims, and the tests are split along that line:
 *
 * 1. **The guards.** Every case here was measured as a SILENT failure before
 *    the guard existed — an empty operand absorbed without comment, a disjoint
 *    intersect shipping a zero-triangle mesh, a ragged triangle list coming
 *    back as manifold's bare "Not manifold". The assertions check the message
 *    names the cause, because the agent's only channel is that string.
 *
 * 2. **The unwrap is actually usable.** A boolean destroys UVs; the contract is
 *    that `autoUnwrap` on the result gives you a texturable atlas. That is
 *    worth measuring rather than assuming, so the matrix below checks UV range,
 *    finiteness, coverage and area distortion for union / diff / intersect /
 *    hull with textured operands.
 */

import { describe, expect, it } from 'bun:test';
import * as THREE from 'three';
import { boolDiff, boolIntersect, boolUnion, hull } from '../solids';
import { autoUnwrap } from '../uv';
import { boxGeo, cylinderGeo, gameMaterial } from '../primitives';

const mat = () => gameMaterial(0x8899aa);
function box(size = 1, at: [number, number, number] = [0, 0, 0]): THREE.Mesh {
  const m = new THREE.Mesh(boxGeo(size, size, size), mat());
  m.position.set(...at);
  m.updateMatrixWorld(true);
  return m;
}

// =============================================================================
// The guards — every one of these used to pass in silence
// =============================================================================

describe('CSG operand guards', () => {
  it('an operand with no meshes is named, not absorbed', async () => {
    // Measured before the guard: union returned the body unchanged, diff
    // returned the body unchanged, and intersect returned a ZERO-triangle mesh.
    // Three different wrong answers, no error in any of them.
    const empty = new THREE.Group();
    await expect(boolUnion('U', box(), empty)).rejects.toThrow(
      /boolUnion operand 2: contributes no triangles/,
    );
    await expect(boolDiff('D', box(), empty)).rejects.toThrow(
      /boolDiff cutter 1: contributes no triangles/,
    );
    await expect(boolIntersect('I', box(), empty)).rejects.toThrow(
      /boolIntersect operand b: contributes no triangles/,
    );
    await expect(hull('H', box(), empty)).rejects.toThrow(
      /hull operand 2: contributes no triangles/,
    );
  });

  it('the message tells the model what the realistic cause is', async () => {
    // An empty Group is what you get when the parts were never added to it.
    await expect(boolUnion('U', box(), new THREE.Group())).rejects.toThrow(
      /empty Group, or a part that was never added to it/,
    );
  });

  it('a ragged triangle list names the mesh, not "Not manifold"', async () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(4 * 3), 3));
    const bad = new THREE.Mesh(g, mat());
    bad.name = 'HandBuilt';
    await expect(boolUnion('U', box(), bad)).rejects.toThrow(
      /mesh "HandBuilt" has 4 vertices, which is not a whole number of triangles/,
    );
  });
});

describe('CSG result guards', () => {
  it('a disjoint intersect throws instead of shipping an invisible part', async () => {
    await expect(boolIntersect('I', box(), box(1, [10, 0, 0]))).rejects.toThrow(
      /the result is empty \(zero triangles\).*do not overlap/s,
    );
  });

  it('a cutter that swallows the body throws with that as the hint', async () => {
    await expect(boolDiff('D', box(1), box(5))).rejects.toThrow(/removed the entire body/);
  });

  it('a legitimate empty-ish operation still succeeds when it makes a solid', async () => {
    // Guard rails must not reject ordinary work: overlapping solids, a cutter
    // that removes part of a body, and a hull over a scatter all still pass.
    const carved = await boolDiff('D', box(2), box(0.5, [0.9, 0, 0]));
    expect(carved.geometry.getAttribute('position')!.count).toBeGreaterThan(0);
    const merged = await boolUnion('U', box(1), box(1, [0.5, 0, 0]));
    expect(merged.geometry.getAttribute('position')!.count).toBeGreaterThan(0);
    const wrapped = await hull('H', box(0.4, [-1, 0, 0]), box(0.4, [1, 0, 0]));
    expect(wrapped.geometry.getAttribute('position')!.count).toBeGreaterThan(0);
  });
});

describe('autoUnwrap guards', () => {
  it('an empty geometry says so instead of returning zero vertices', async () => {
    // Measured: xatlas accepts an empty mesh and returns an empty atlas without
    // complaint, so this used to come back with 0 vertices and no uv attribute
    // and only failed later, as a texture that never appeared.
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(0), 3));
    g.setIndex(new THREE.BufferAttribute(new Uint32Array(0), 1));
    await expect(autoUnwrap(g)).rejects.toThrow(/has no triangles/);
  });

  it('a ragged index list is rejected', async () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
    g.setIndex(new THREE.BufferAttribute(new Uint32Array([0, 1]), 1));
    await expect(autoUnwrap(g)).rejects.toThrow(/not a whole number of triangles/);
  });
});

// =============================================================================
// The matrix — a boolean destroys UVs, and unwrapping the result restores them
// =============================================================================

/** Per-triangle 3D area and UV area, for the distortion measure below. */
function triangleAreas(geo: THREE.BufferGeometry): { world: number[]; uv: number[] } {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const uv = geo.getAttribute('uv') as THREE.BufferAttribute;
  const idx = geo.getIndex();
  const count = idx ? idx.count : pos.count;
  const at = (i: number) => (idx ? (idx.getX(i) as number) : i);
  const world: number[] = [];
  const uvArea: number[] = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  for (let t = 0; t < count; t += 3) {
    const i0 = at(t);
    const i1 = at(t + 1);
    const i2 = at(t + 2);
    a.fromBufferAttribute(pos, i0);
    b.fromBufferAttribute(pos, i1);
    c.fromBufferAttribute(pos, i2);
    world.push(b.clone().sub(a).cross(c.clone().sub(a)).length() / 2);
    const u0 = uv.getX(i0);
    const v0 = uv.getY(i0);
    const u1 = uv.getX(i1);
    const v1 = uv.getY(i1);
    const u2 = uv.getX(i2);
    const v2 = uv.getY(i2);
    uvArea.push(Math.abs((u1 - u0) * (v2 - v0) - (u2 - u0) * (v1 - v0)) / 2);
  }
  return { world, uv: uvArea };
}

/**
 * Documented stretch tolerance (T2.4 accept criterion).
 *
 * The measure is per-triangle texel density — UV area over world area —
 * normalized by the mesh median, so a uniformly-scaled atlas scores 1.0
 * everywhere and a triangle at 4.0 samples texels twice as densely per unit of
 * surface, in each direction, as the median.
 *
 * Set from measurement, not from a guess. Across this matrix:
 *
 * | case                          | worst / median |
 * |-------------------------------|----------------|
 * | union                         | 1.002          |
 * | diff                          | 1.009          |
 * | intersect                     | 1.000          |
 * | hull                          | 1.008          |
 * | plate with a cylindrical bore | 1.108          |
 *
 * xatlas turns out to pack these at essentially uniform density, so the honest
 * ceiling is close to 1, not the "charts scale independently, expect a long
 * tail" figure I would have picked without running it. 2.0 leaves real headroom
 * for the curved-cut-face case while still failing on an actual regression — an
 * 8x ceiling would have passed no matter how badly the unwrap degraded.
 */
const MAX_DENSITY_RATIO = 2;

function densitySpread(geo: THREE.BufferGeometry): number {
  const { world, uv } = triangleAreas(geo);
  const density: number[] = [];
  for (let i = 0; i < world.length; i++) {
    const w = world[i]!;
    // Zero-area triangles carry no texture and cannot be stretched.
    if (w < 1e-9) continue;
    density.push(uv[i]! / w);
  }
  density.sort((x, y) => x - y);
  const median = density[Math.floor(density.length / 2)] ?? 1;
  if (median <= 0) return Number.POSITIVE_INFINITY;
  return (density[density.length - 1] ?? 0) / median;
}

describe('post-CSG unwrap, textured operands', () => {
  const cases: Array<[string, () => Promise<THREE.Mesh>]> = [
    ['union', () => boolUnion('U', box(1), box(1, [0.6, 0, 0]))],
    ['diff', () => boolDiff('D', box(2), box(0.6, [0.8, 0.2, 0]))],
    ['intersect', () => boolIntersect('I', box(1.4), box(1.4, [0.5, 0.3, 0]))],
    ['hull', () => hull('H', box(0.5, [-0.8, 0, 0]), box(0.5, [0.8, 0.4, 0]))],
    [
      'diff with a cylinder cutter',
      () => {
        const body = new THREE.Mesh(boxGeo(2, 0.4, 2), mat());
        const bore = new THREE.Mesh(cylinderGeo(0.3, 0.3, 2, 24), mat());
        bore.updateMatrixWorld(true);
        return boolDiff('Plate', body, bore);
      },
    ],
  ];

  for (const [label, build] of cases) {
    it(`${label}: the boolean drops UVs and the unwrap gives usable ones back`, async () => {
      const result = await build();

      // The documented semantic, pinned: positions and normals survive, uv does not.
      expect(result.geometry.getAttribute('position')).toBeTruthy();
      expect(result.geometry.getAttribute('uv')).toBeUndefined();

      const unwrapped = await autoUnwrap(result.geometry);
      const uv = unwrapped.getAttribute('uv') as THREE.BufferAttribute;
      expect(uv).toBeTruthy();

      // Finite, in the unit square. A NaN here is the failure that renders as a
      // texture collapsed to a single texel.
      const arr = uv.array as ArrayLike<number>;
      let min = Number.POSITIVE_INFINITY;
      let max = Number.NEGATIVE_INFINITY;
      for (let i = 0; i < uv.count * 2; i++) {
        const v = arr[i]!;
        expect(Number.isFinite(v)).toBe(true);
        if (v < min) min = v;
        if (v > max) max = v;
      }
      expect(min).toBeGreaterThanOrEqual(0);
      expect(max).toBeLessThanOrEqual(1);
      // The atlas is actually used, not collapsed into a corner.
      expect(max - min).toBeGreaterThan(0.5);

      // Topology survives: the unwrap re-splits vertices along seams, so vertex
      // count may rise, but triangle count must not change.
      const trisIn = result.geometry.getIndex()
        ? result.geometry.getIndex()!.count / 3
        : result.geometry.getAttribute('position')!.count / 3;
      const trisOut = unwrapped.getIndex()!.count / 3;
      expect(trisOut).toBe(trisIn);
      expect(unwrapped.getAttribute('position')!.count).toBeGreaterThanOrEqual(
        result.geometry.getAttribute('position')!.count,
      );

      expect(densitySpread(unwrapped)).toBeLessThan(MAX_DENSITY_RATIO);
    });
  }

  it('the atlas is not necessarily square — read width/height, not resolution', async () => {
    // Measured: a CSG'd box at resolution 1024 packs into 917x1085. A baker that
    // allocated resolution x resolution would sample the wrong texels on one
    // axis, which reads as a subtle uniform stretch rather than an obvious break.
    const merged = await boolUnion('U', box(1), box(1, [0.6, 0, 0]));
    const unwrapped = await autoUnwrap(merged.geometry, { resolution: 1024 });
    const atlas = unwrapped.userData['atlas'] as {
      width: number;
      height: number;
      atlasCount: number;
    };
    expect(atlas.width).toBeGreaterThan(0);
    expect(atlas.height).toBeGreaterThan(0);
    expect(atlas.atlasCount).toBeGreaterThanOrEqual(1);
    expect(atlas.width <= 1024 || atlas.height <= 1024).toBe(true);
  });

  it('a chain of booleans stays unwrappable, and unwrapping early is wasted', async () => {
    // The documented workflow: unwrap AFTER the last boolean. This proves the
    // "wasted" half — an atlas built mid-chain does not survive the next op.
    const first = await boolUnion('A', box(1), box(1, [0.6, 0, 0]));
    first.geometry = await autoUnwrap(first.geometry);
    expect(first.geometry.getAttribute('uv')).toBeTruthy();

    const second = await boolDiff('B', first, box(0.3, [0.3, 0.4, 0]));
    expect(second.geometry.getAttribute('uv')).toBeUndefined();

    second.geometry = await autoUnwrap(second.geometry);
    expect(second.geometry.getAttribute('uv')).toBeTruthy();
    expect(densitySpread(second.geometry)).toBeLessThan(MAX_DENSITY_RATIO);
  });
});

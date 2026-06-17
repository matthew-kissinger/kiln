import { describe, expect, test } from 'bun:test';
import sharp from 'sharp';
import {
  coverage,
  rasterizeView,
  renderViewGrid,
  renderCodeViewGrid,
  renderInteriorGrid,
  hideNodeInScene,
  SIX_VIEWS,
} from '../index';
import { encodePng } from '../png';
import { executeKilnCode } from '../../render';

const BOX_CODE = `
const meta = { name: 'test-box', category: 'prop' };
function build() {
  const root = createRoot('Root');
  createPart('Mesh_Box', boxGeo(1, 1, 1), gameMaterial('#ff0000'), { parent: root, position: [0, 0.5, 0] });
  return root;
}
`;

// Elongated along +X (correct kiln frame for a "forward" asset).
const LONG_X_CODE = `
const meta = { name: 'long-x', category: 'prop' };
function build() {
  const root = createRoot('Root');
  createPart('Mesh_Body', boxGeo(4, 0.5, 0.5), gameMaterial('#00ff00'), { parent: root, position: [0, 0.25, 0] });
  return root;
}
`;

// Same shape elongated along +Z (the classic wrong-axis failure).
const LONG_Z_CODE = `
const meta = { name: 'long-z', category: 'prop' };
function build() {
  const root = createRoot('Root');
  createPart('Mesh_Body', boxGeo(0.5, 0.5, 4), gameMaterial('#00ff00'), { parent: root, position: [0, 0.25, 0] });
  return root;
}
`;

describe('rasterizeView', () => {
  test('renders a centered box with substantial coverage from every view', async () => {
    const { root } = await executeKilnCode(BOX_CODE);
    for (const view of SIX_VIEWS) {
      const rgb = rasterizeView(root, view.dir, { size: 128 });
      const cov = coverage(rgb, 128);
      // The box is framed at ~90% of the cell; a cube face should fill a lot of it.
      expect(cov).toBeGreaterThan(0.3);
      expect(cov).toBeLessThan(1);
    }
  });

  test('is deterministic', async () => {
    const { root } = await executeKilnCode(BOX_CODE);
    const a = rasterizeView(root, [0.7, 0.5, 0.7], { size: 64 });
    const b = rasterizeView(root, [0.7, 0.5, 0.7], { size: 64 });
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(true);
  });

  test('lighting differentiates faces (flat lambert, not silhouette fill)', async () => {
    const { root } = await executeKilnCode(BOX_CODE);
    // 3/4 view sees three faces of the cube with different lambert terms.
    const rgb = rasterizeView(root, [0.7, 0.5, 0.7], { size: 128 });
    const reds = new Set<number>();
    for (let i = 0; i < 128 * 128; i++) {
      const r = rgb[i * 3]!;
      if (r !== 26) reds.add(r); // skip background
    }
    expect(reds.size).toBeGreaterThanOrEqual(2);
  });

  test('orientation is distinguishable: +X vs +Z elongation swap Front/Right profiles', async () => {
    // For the X-elongated asset, the Front view (camera on +X) sees the small
    // square end; the Right view (camera on +Z) sees the long profile.
    // The Z-elongated asset swaps them. Framing is per-view extent-fit, so the
    // long profile fills the frame width while the end-on view leaves the
    // cell mostly square — compare aspect by occupied-row/col extents.
    const occupiedAspect = (rgb: Uint8Array, size: number): number => {
      let minX = size, maxX = -1, minY = size, maxY = -1;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const i = (y * size + x) * 3;
          if (rgb[i] !== 26 || rgb[i + 1] !== 26 || rgb[i + 2] !== 26) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      return (maxX - minX + 1) / (maxY - minY + 1);
    };

    const { root: rx } = await executeKilnCode(LONG_X_CODE);
    const { root: rz } = await executeKilnCode(LONG_Z_CODE);
    const front = SIX_VIEWS[0]!.dir;
    const right = SIX_VIEWS[1]!.dir;

    // X-long: front view is end-on (aspect ~1), right view is wide (aspect >> 1).
    expect(occupiedAspect(rasterizeView(rx, front, { size: 128 }), 128)).toBeLessThan(2);
    expect(occupiedAspect(rasterizeView(rx, right, { size: 128 }), 128)).toBeGreaterThan(3);
    // Z-long: swapped.
    expect(occupiedAspect(rasterizeView(rz, front, { size: 128 }), 128)).toBeGreaterThan(3);
    expect(occupiedAspect(rasterizeView(rz, right, { size: 128 }), 128)).toBeLessThan(2);
  });

  test('empty scene renders pure background', async () => {
    const { root } = await executeKilnCode(`
      const meta = { name: 'empty' };
      function build() { return createRoot('Root'); }
    `);
    const rgb = rasterizeView(root, [1, 0, 0], { size: 32 });
    expect(coverage(rgb, 32)).toBe(0);
  });
});

describe('encodePng', () => {
  test('round-trips through a real decoder', async () => {
    const size = 16;
    const rgb = new Uint8Array(size * size * 3);
    for (let i = 0; i < size * size; i++) {
      rgb[i * 3] = i % 256;
      rgb[i * 3 + 1] = (i * 7) % 256;
      rgb[i * 3 + 2] = (i * 13) % 256;
    }
    const png = encodePng(rgb, size, size);
    const decoded = await sharp(png).raw().toBuffer({ resolveWithObject: true });
    expect(decoded.info.width).toBe(size);
    expect(decoded.info.height).toBe(size);
    expect(decoded.info.channels).toBe(3);
    expect(Buffer.from(rgb).equals(decoded.data)).toBe(true);
  });

  test('rejects wrong buffer size', () => {
    expect(() => encodePng(new Uint8Array(10), 4, 4)).toThrow();
  });
});

describe('renderViewGrid / renderCodeViewGrid', () => {
  test('produces a valid 3x2 grid PNG with all six views', async () => {
    const result = await renderCodeViewGrid(BOX_CODE, { size: 64 });
    expect(result.views).toEqual(['Front', 'Right', 'Back', 'Left', 'Top', '3/4']);
    expect(result.width).toBe(3 * 64 + 4 * 4);
    expect(result.height).toBe(2 * 64 + 3 * 4);
    const meta = await sharp(result.png).metadata();
    expect(meta.width).toBe(result.width);
    expect(meta.height).toBe(result.height);
    expect(meta.format).toBe('png');
  });

  test('renderViewGrid accepts a pre-built sandbox scene root', async () => {
    const { root } = await executeKilnCode(BOX_CODE);
    const result = await renderViewGrid(root, { size: 32 });
    expect(result.png.length).toBeGreaterThan(100);
  });
});

// A roof group (named 'Roof') of child meshes — the rasterizer culls per-mesh, so
// this proves hideNodeInScene recurses into descendants (hiding only the group would
// leave the meshes drawn).
const ROOF_ONLY_CODE = `
const meta = { name: 'roof-only', category: 'architecture' };
function build() {
  const root = createRoot('Root');
  createRoofPlanes('Roof', gameMaterial('#888888'), { width: 4, depth: 4, height: 1.2, parent: root });
  return root;
}
`;

// A hollow room (walls Shell_Wall<Side>) under a separable 'Roof' group.
const BUILDING_CODE = `
const meta = { name: 'hut', category: 'architecture' };
function build() {
  const root = createRoot('Hut');
  const mat = gameMaterial('#caa472');
  room('Shell', mat, { width: 4, depth: 4, height: 2.8, parent: root });
  const roof = createRoofPlanes('Roof', mat, { width: 4, depth: 4, height: 1.2, parent: root });
  roof.root.position.set(0, 2.8, 0);
  return root;
}
`;

describe('hideNodeInScene', () => {
  test('hides the matched node AND its descendant meshes (per-mesh cull)', async () => {
    const { root } = await executeKilnCode(ROOF_ONLY_CODE);
    const dir: [number, number, number] = [0.7, 0.5, 0.7];
    expect(coverage(rasterizeView(root, dir, { size: 64, backfaceCull: false }), 64)).toBeGreaterThan(0.1);
    const hidden = hideNodeInScene(root, 'Roof');
    expect(hidden).toBeGreaterThanOrEqual(1);
    // If only the group's .visible flipped (not its child meshes), coverage would stay > 0.
    expect(coverage(rasterizeView(root, dir, { size: 64, backfaceCull: false }), 64)).toBe(0);
  });

  test('returns 0 when nothing matches', async () => {
    const { root } = await executeKilnCode(ROOF_ONLY_CODE);
    expect(hideNodeInScene(root, 'Nonexistent')).toBe(0);
  });
});

describe('renderInteriorGrid', () => {
  test('returns three roof-off views with the roof + near walls hidden for a room()', async () => {
    const { root } = await executeKilnCode(BUILDING_CODE);
    const grid = await renderInteriorGrid(root, { size: 64 });
    expect(grid.views).toEqual(['Floor plan', 'Dollhouse', 'Eye-level']);
    expect(grid.roofsHidden).toBeGreaterThanOrEqual(1);
    expect(grid.wallsHidden).toBeGreaterThanOrEqual(1); // Front + Right cut for the eye-level cell
    expect(grid.width).toBe(3 * 64 + 4 * 4); // single row, 3 cols
    expect(grid.height).toBe(64 + 2 * 4);
    const meta = await sharp(grid.png).metadata();
    expect(meta.format).toBe('png');
    expect(meta.width).toBe(grid.width);
    expect(meta.height).toBe(grid.height);
  });

  test('degrades gracefully on a non-building (no Roof, no walls) but still returns three views', async () => {
    const { root } = await executeKilnCode(BOX_CODE);
    const grid = await renderInteriorGrid(root, { size: 48 });
    expect(grid.views).toHaveLength(3);
    expect(grid.roofsHidden).toBe(0);
    expect(grid.wallsHidden).toBe(0);
    expect(grid.png.length).toBeGreaterThan(100);
  });
});

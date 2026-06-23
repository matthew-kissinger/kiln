/**
 * Pure-CPU orthographic rasterizer for Kiln scene graphs.
 *
 * Why this exists: the agent loop needs to SEE its asset (kiln_screenshot)
 * but no GPU/browser renderer is available everywhere the loop runs — the
 * kiln-studio agent-runtime container ships without a browser
 * (PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1) and Playwright is unsupported under
 * Bun on Windows (see imposter/bake.ts). headless-gl is WebGL1-only while
 * three >= r163 requires WebGL2. So: a dependency-free scanline z-buffer
 * rasterizer over the executed scene. Flat lambert, base color only — enough
 * fidelity for silhouette / proportion / orientation / contact QA, which is
 * what the vision loop checks.
 *
 * Scene access is strictly duck-typed (`.isMesh`, `matrixWorld.elements`,
 * position attribute arrays) because sandbox-created objects live in a
 * different module realm — see executeKilnCode in ../render.ts.
 *
 * Lighting matches scripts/visual-audit.ts: key directional light from
 * [1.5, 2, 1] at 1.1 plus 0.25 ambient. Back-face culling is strict (like
 * the offline audit grid) so inverted winding shows up as missing faces.
 */

export interface ViewSpec {
  name: string;
  /** Direction from model center toward the camera (kiln frame: +X fwd, +Y up, +Z right). */
  dir: [number, number, number];
}

/** Same six views as the offline audit grid (scripts/visual-audit.ts). */
export const SIX_VIEWS: ViewSpec[] = [
  { name: 'Front', dir: [1, 0, 0] },
  { name: 'Right', dir: [0, 0, 1] },
  { name: 'Back', dir: [-1, 0, 0] },
  { name: 'Left', dir: [0, 0, -1] },
  { name: 'Top', dir: [0, 1, 0.0001] },
  { name: '3/4', dir: [0.7, 0.5, 0.7] },
];

export interface RasterOptions {
  /** Square output size in pixels per view. Default 256. */
  size?: number;
  /** Cull triangles facing away from the camera. Default true (reveals winding bugs). */
  backfaceCull?: boolean;
  /**
   * Fixed world-space AABB to frame the camera to, instead of the scene's own
   * bounds. Used by the animation grid so every sampled frame shares one framing —
   * otherwise per-frame auto-framing re-centers the model and HIDES root travel
   * (a sideways/forward-sliding walk would look stationary). The scene's own
   * geometry is still drawn; only the camera center/zoom come from this box.
   */
  frameBounds?: { min: [number, number, number]; max: [number, number, number] };
}

const BG: [number, number, number] = [26, 26, 26]; // #1a1a1a, matches audit grid
const AMBIENT = 0.25;
const KEY_INTENSITY = 1.1;
const KEY_DIR = normalize([1.5, 2, 1]);

type Vec3 = [number, number, number];

function normalize(v: number[]): Vec3 {
  const len = Math.hypot(v[0]!, v[1]!, v[2]!) || 1;
  return [v[0]! / len, v[1]! / len, v[2]! / len];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** Minimal duck-typed views of the Three.js objects we read. */
interface DuckAttribute {
  array: ArrayLike<number>;
  itemSize: number;
  count: number;
}
interface DuckGeometry {
  getAttribute(name: string): DuckAttribute | undefined;
  index: DuckAttribute | null;
}
interface DuckMaterial {
  color?: { r: number; g: number; b: number };
  visible?: boolean;
}
interface DuckMesh {
  isMesh?: boolean;
  visible?: boolean;
  geometry?: DuckGeometry;
  material?: DuckMaterial | DuckMaterial[];
  matrixWorld?: { elements: ArrayLike<number> };
}
interface DuckObject3D {
  visible?: boolean;
  updateMatrixWorld?(force?: boolean): void;
  traverse?(cb: (obj: unknown) => void): void;
}

interface Tri {
  // World-space vertices, flattened [x0,y0,z0, x1,y1,z1, x2,y2,z2]
  v: Float64Array;
  color: [number, number, number];
}

/** Collect world-space triangles + base colors from a (possibly cross-realm) scene. */
function collectTriangles(root: DuckObject3D): { tris: Tri[]; bbox: { min: Vec3; max: Vec3 } } {
  root.updateMatrixWorld?.(true);

  const tris: Tri[] = [];
  const min: Vec3 = [Infinity, Infinity, Infinity];
  const max: Vec3 = [-Infinity, -Infinity, -Infinity];

  root.traverse?.((obj) => {
    const mesh = obj as DuckMesh;
    if (!mesh.isMesh || mesh.visible === false) return;
    const geo = mesh.geometry;
    const pos = geo?.getAttribute?.('position');
    if (!geo || !pos || pos.itemSize !== 3) return;

    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    // Multi-material groups are rare in kiln output; first material's color is
    // a sufficient approximation for QA views.
    const c = mats[0]?.color;
    const color: [number, number, number] = c
      ? [clamp01(c.r), clamp01(c.g), clamp01(c.b)]
      : [0.7, 0.7, 0.7];

    const m = mesh.matrixWorld?.elements;
    if (!m) return;

    const arr = pos.array;
    const world = new Float64Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const x = arr[i * 3]!;
      const y = arr[i * 3 + 1]!;
      const z = arr[i * 3 + 2]!;
      const wx = m[0]! * x + m[4]! * y + m[8]! * z + m[12]!;
      const wy = m[1]! * x + m[5]! * y + m[9]! * z + m[13]!;
      const wz = m[2]! * x + m[6]! * y + m[10]! * z + m[14]!;
      world[i * 3] = wx;
      world[i * 3 + 1] = wy;
      world[i * 3 + 2] = wz;
      if (wx < min[0]) min[0] = wx;
      if (wy < min[1]) min[1] = wy;
      if (wz < min[2]) min[2] = wz;
      if (wx > max[0]) max[0] = wx;
      if (wy > max[1]) max[1] = wy;
      if (wz > max[2]) max[2] = wz;
    }

    const pushTri = (a: number, b: number, c2: number) => {
      const v = new Float64Array(9);
      v[0] = world[a * 3]!;
      v[1] = world[a * 3 + 1]!;
      v[2] = world[a * 3 + 2]!;
      v[3] = world[b * 3]!;
      v[4] = world[b * 3 + 1]!;
      v[5] = world[b * 3 + 2]!;
      v[6] = world[c2 * 3]!;
      v[7] = world[c2 * 3 + 1]!;
      v[8] = world[c2 * 3 + 2]!;
      tris.push({ v, color });
    };

    const index = geo.index;
    if (index) {
      const ia = index.array;
      for (let i = 0; i + 2 < index.count; i += 3) {
        pushTri(ia[i]!, ia[i + 1]!, ia[i + 2]!);
      }
    } else {
      for (let i = 0; i + 2 < pos.count; i += 3) {
        pushTri(i, i + 1, i + 2);
      }
    }
  });

  if (!Number.isFinite(min[0])) {
    return { tris, bbox: { min: [0, 0, 0], max: [0, 0, 0] } };
  }
  return { tris, bbox: { min, max } };
}

function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

/**
 * Linear -> sRGB encode (the renderer's output transform). Material colors read
 * off the scene are linear-sRGB (Three.js color management converts hex strings
 * on construction), and lighting math happens in linear space — without this
 * encode the views come out far darker than the Three.js-rendered audit grids.
 */
function linearToSrgb(c: number): number {
  const v = clamp01(c);
  return v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
}

/**
 * Render one orthographic view of the scene to an RGB pixel buffer
 * (size*size*3 bytes, row-major from the top-left).
 */
export function rasterizeView(
  root: unknown,
  dir: [number, number, number],
  opts: RasterOptions = {},
): Uint8Array {
  const size = opts.size ?? 256;
  const cull = opts.backfaceCull ?? true;
  const { tris, bbox } = collectTriangles(root as DuckObject3D);

  const out = new Uint8Array(size * size * 3);
  for (let i = 0; i < size * size; i++) {
    out[i * 3] = BG[0];
    out[i * 3 + 1] = BG[1];
    out[i * 3 + 2] = BG[2];
  }
  if (tris.length === 0) return out;

  // Camera basis: z points from target toward the camera (three.js convention).
  const z = normalize(dir);
  const upHint: Vec3 = Math.abs(z[1]) > 0.99 ? [0, 0, -1] : [0, 1, 0];
  const x = normalize(cross(upHint, z));
  const y = cross(z, x);

  // Framing box: a caller-supplied fixed AABB (animation grid — keeps the camera
  // steady so root travel is visible) or the scene's own bounds (static views).
  const frameMin = opts.frameBounds ? opts.frameBounds.min : bbox.min;
  const frameMax = opts.frameBounds ? opts.frameBounds.max : bbox.max;
  const center: Vec3 = [
    (frameMin[0] + frameMax[0]) / 2,
    (frameMin[1] + frameMax[1]) / 2,
    (frameMin[2] + frameMax[2]) / 2,
  ];

  // Project the 8 framing-box corners to find the framing extent for this view.
  let ext = 1e-6;
  for (let ci = 0; ci < 8; ci++) {
    const px = (ci & 1 ? frameMax[0] : frameMin[0]) - center[0];
    const py = (ci & 2 ? frameMax[1] : frameMin[1]) - center[1];
    const pz = (ci & 4 ? frameMax[2] : frameMin[2]) - center[2];
    const p: Vec3 = [px, py, pz];
    ext = Math.max(ext, Math.abs(dot(p, x)), Math.abs(dot(p, y)));
  }
  const scale = (size * 0.45) / ext; // 90% of the half-size — small margin
  const half = size / 2;

  const zbuf = new Float64Array(size * size).fill(-Infinity);

  const sx = new Float64Array(3);
  const sy = new Float64Array(3);
  const sz = new Float64Array(3);

  for (const tri of tris) {
    // World-space face normal (flat shading; robust under non-uniform scale).
    const e1: Vec3 = [tri.v[3]! - tri.v[0]!, tri.v[4]! - tri.v[1]!, tri.v[5]! - tri.v[2]!];
    const e2: Vec3 = [tri.v[6]! - tri.v[0]!, tri.v[7]! - tri.v[1]!, tri.v[8]! - tri.v[2]!];
    const n = cross(e1, e2);
    const nLen = Math.hypot(n[0], n[1], n[2]);
    if (nLen < 1e-12) continue;
    const N: Vec3 = [n[0] / nLen, n[1] / nLen, n[2] / nLen];

    const facing = dot(N, z);
    if (cull && facing <= 0) continue;

    // Project to screen space.
    for (let i = 0; i < 3; i++) {
      const px = tri.v[i * 3]! - center[0];
      const py = tri.v[i * 3 + 1]! - center[1];
      const pz = tri.v[i * 3 + 2]! - center[2];
      const p: Vec3 = [px, py, pz];
      sx[i] = half + dot(p, x) * scale;
      sy[i] = half - dot(p, y) * scale;
      sz[i] = dot(p, z);
    }

    // Flat lambert with the audit-grid light rig, in linear space, then the
    // sRGB output transform (matching what a Three.js renderer would write).
    const lambert = Math.max(0, dot(N, KEY_DIR));
    const lit = Math.min(1, AMBIENT + KEY_INTENSITY * lambert);
    const r = Math.round(linearToSrgb(tri.color[0] * lit) * 255);
    const g = Math.round(linearToSrgb(tri.color[1] * lit) * 255);
    const b = Math.round(linearToSrgb(tri.color[2] * lit) * 255);

    // Rasterize via edge functions.
    const minX = Math.max(0, Math.floor(Math.min(sx[0]!, sx[1]!, sx[2]!)));
    const maxX = Math.min(size - 1, Math.ceil(Math.max(sx[0]!, sx[1]!, sx[2]!)));
    const minY = Math.max(0, Math.floor(Math.min(sy[0]!, sy[1]!, sy[2]!)));
    const maxY = Math.min(size - 1, Math.ceil(Math.max(sy[0]!, sy[1]!, sy[2]!)));
    if (minX > maxX || minY > maxY) continue;

    const ax = sx[0]!,
      ay = sy[0]!,
      bx2 = sx[1]!,
      by = sy[1]!,
      cx = sx[2]!,
      cy = sy[2]!;
    const area = (bx2 - ax) * (cy - ay) - (by - ay) * (cx - ax);
    if (Math.abs(area) < 1e-9) continue;
    const invArea = 1 / area;

    for (let py = minY; py <= maxY; py++) {
      for (let px = minX; px <= maxX; px++) {
        const cxp = px + 0.5;
        const cyp = py + 0.5;
        const w0 = ((bx2 - ax) * (cyp - ay) - (by - ay) * (cxp - ax)) * invArea;
        const w1 = ((cx - bx2) * (cyp - by) - (cy - by) * (cxp - bx2)) * invArea;
        const w2 = 1 - w0 - w1;
        // Accept either winding on screen (back-face culling already happened
        // in world space) — check all barycentrics share the area's sign space.
        if (w0 < 0 || w1 < 0 || w2 < 0) continue;
        // Barycentric weights map: w0 → vertex C, w1 → vertex A, w2 → vertex B
        // for this edge-function arrangement; depth interpolation just needs a
        // consistent convex combination, so order doesn't matter for QA views.
        const depth = w1 * sz[0]! + w2 * sz[1]! + w0 * sz[2]!;
        const pi = py * size + px;
        if (depth <= zbuf[pi]!) continue;
        zbuf[pi] = depth;
        out[pi * 3] = r;
        out[pi * 3 + 1] = g;
        out[pi * 3 + 2] = b;
      }
    }
  }

  return out;
}

/** World-space AABB of a (possibly sandbox-created) scene's drawable geometry.
 *  Reuses the rasterizer's own triangle collection so the box matches exactly what
 *  gets drawn. Empty scenes report a zero box. Used by the animation grid to union
 *  bounds across posed frames into one steady camera framing. */
export function measureBounds(root: unknown): {
  min: [number, number, number];
  max: [number, number, number];
} {
  const { bbox } = collectTriangles(root as DuckObject3D);
  return { min: [...bbox.min], max: [...bbox.max] };
}

/** Fraction of non-background pixels — used by tests and occupancy checks. */
export function coverage(rgb: Uint8Array, size: number): number {
  let filled = 0;
  for (let i = 0; i < size * size; i++) {
    if (rgb[i * 3] !== BG[0] || rgb[i * 3 + 1] !== BG[1] || rgb[i * 3 + 2] !== BG[2]) filled++;
  }
  return filled / (size * size);
}

/**
 * Hide a named subtree from the rasterizer so a view can see past it (lift a roof,
 * cut away a near wall). CRITICAL: `collectTriangles` culls per-MESH on `.visible`
 * and does NOT honor ancestor-group visibility — but kiln parts/walls/roofs are
 * nested GROUPS, so hiding only the matched group would leave its child meshes
 * drawn. This therefore sets `.visible = false` on each matched node AND every
 * descendant.
 *
 * `match` is either a string (case-insensitive exact match OR startsWith — so
 * "Roof" also lifts "Roof_Ridge") or a predicate over the node name. Returns the
 * number of matched subtree roots hidden (0 → nothing matched; the caller decides
 * whether to warn). Pure helper; mutates `.visible` on the passed scene.
 */
export function hideNodeInScene(
  root: unknown,
  match: string | ((name: string) => boolean),
): number {
  const test =
    typeof match === 'function'
      ? match
      : (name: string) => {
          const t = match.toLowerCase();
          const n = name.toLowerCase();
          return n === t || n.startsWith(t);
        };
  let hidden = 0;
  const r = root as DuckObject3D;
  r.traverse?.((obj) => {
    const node = obj as { name?: string; traverse?(cb: (o: unknown) => void): void };
    if (!node.name || !test(node.name)) return;
    hidden++;
    // Flip the matched node and its whole subtree (the per-mesh cull means hiding
    // just the group is not enough — the leaf meshes must be invisible).
    node.traverse?.((d) => {
      (d as { visible?: boolean }).visible = false;
    });
  });
  return hidden;
}

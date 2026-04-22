/**
 * Kiln CSG primitives — manifold-3d wrapper
 *
 * Boolean operations (union / diff / intersect) and convex hull for the
 * Kiln primitive set, backed by Google's manifold-3d WASM library. The
 * library guarantees topologically-manifold output which matters for GLB
 * integrity (non-manifold geometry breaks many downstream tools).
 *
 * These primitives bridge Three.js BufferGeometry <-> Manifold Mesh.
 * Operations are synchronous once the WASM module is loaded (first call
 * pays the ~100ms init cost; subsequent calls are fast).
 *
 * Agents use these to:
 *   - carve holes: boolDiff(body, cutter)
 *   - merge parts: boolUnion(a, b, c)
 *   - keep overlap: boolIntersect(a, b)
 *   - wrap loosely: hull(parts)
 *
 * Limitations:
 *   - Input geometry should be watertight / manifold. sphereGeo's polar
 *     singularity can produce degenerate triangles that manifold trims.
 *   - Only position data survives — normals and UVs are regenerated.
 *   - Material is inherited from the first operand.
 */

import * as THREE from 'three';

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { ManifoldToplevel, Manifold, Mesh } from 'manifold-3d';

// Lazy-init singleton. First call to any CSG op awaits init; subsequent
// calls are O(bridge cost) only.
let _module: ManifoldToplevel | null = null;
let _initPromise: Promise<ManifoldToplevel> | null = null;

async function getManifoldModule(): Promise<ManifoldToplevel> {
  if (_module) return _module;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    const mod = (await import('manifold-3d')) as unknown as {
      default: (opts?: Record<string, unknown>) => Promise<ManifoldToplevel>;
    };
    const m = await mod.default();
    m.setup();
    _module = m;
    return m;
  })();

  return _initPromise;
}

/**
 * Convert a Three.js Mesh/Object3D to a Manifold Mesh (world-space).
 * Flattens any scene subtree into a single merged manifold.
 */
function threeToManifold(src: THREE.Object3D, ManifoldCls: typeof Manifold, MeshCls: typeof Mesh): Manifold {
  src.updateMatrixWorld(true);

  const positions: number[] = [];
  const indices: number[] = [];

  const tmpVec = new THREE.Vector3();
  let vertexOffset = 0;

  src.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const geo = child.geometry as THREE.BufferGeometry;
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute | undefined;
    if (!posAttr) return;

    const matrix = child.matrixWorld;

    for (let i = 0; i < posAttr.count; i++) {
      tmpVec.fromBufferAttribute(posAttr, i).applyMatrix4(matrix);
      positions.push(tmpVec.x, tmpVec.y, tmpVec.z);
    }

    const idx = geo.getIndex();
    if (idx) {
      for (let i = 0; i < idx.count; i++) {
        indices.push((idx.getX(i) as number) + vertexOffset);
      }
    } else {
      // Non-indexed: generate sequential triangles
      for (let i = 0; i < posAttr.count; i++) {
        indices.push(i + vertexOffset);
      }
    }

    vertexOffset += posAttr.count;
  });

  const mesh = new MeshCls({
    numProp: 3,
    vertProperties: new Float32Array(positions),
    triVerts: new Uint32Array(indices),
  });
  mesh.merge();

  return ManifoldCls.ofMesh(mesh);
}

/**
 * Convert a Manifold result back to a Three.js Mesh with the given material.
 *
 * Default is **flat shading** (one normal per triangle, hard faceted edges)
 * — that's what most mechanical CSG parts (gears, vending machines, carved
 * boxes) want. `computeVertexNormals` on an indexed mesh averages normals
 * across adjacent faces and turns hard edges into smooth blobs.
 *
 * Pass `smooth: true` for organic CSG results (like hulled rocks) where
 * averaged normals read better.
 */
function manifoldToThree(
  m: Manifold,
  material: THREE.Material,
  name: string,
  opts: { smooth?: boolean } = {}
): THREE.Mesh {
  const mesh = m.getMesh();
  const numProp = mesh.numProp;
  const verts = mesh.vertProperties;
  const tris = mesh.triVerts;

  // Extract xyz from interleaved vertProperties
  const positions = new Float32Array((verts.length / numProp) * 3);
  for (let i = 0, o = 0; i < verts.length; i += numProp, o += 3) {
    positions[o] = verts[i] as number;
    positions[o + 1] = verts[i + 1] as number;
    positions[o + 2] = verts[i + 2] as number;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setIndex(new THREE.BufferAttribute(new Uint32Array(tris), 1));

  if (opts.smooth) {
    geo.computeVertexNormals();
  } else {
    // Flat: duplicate verts per triangle so each face gets its own normal.
    const flat = geo.toNonIndexed();
    flat.computeVertexNormals();
    const out = new THREE.Mesh(flat, material);
    out.name = name;
    return out;
  }

  const out = new THREE.Mesh(geo, material);
  out.name = name;
  return out;
}

/**
 * Pull a `{smooth}` options object off the end of a variadic part list.
 * Detects a plain object with `smooth` that's NOT an Object3D, so calls
 * like `boolUnion('X', a, b, { smooth: true })` still type-check.
 */
function splitPartsAndOpts(
  parts: Array<THREE.Object3D | { smooth?: boolean }>
): { parts: THREE.Object3D[]; opts: { smooth?: boolean } } {
  if (parts.length === 0) return { parts: [], opts: {} };
  const last = parts[parts.length - 1];
  if (
    last &&
    typeof last === 'object' &&
    !(last instanceof THREE.Object3D) &&
    ('smooth' in last)
  ) {
    return {
      parts: parts.slice(0, -1) as THREE.Object3D[],
      opts: last as { smooth?: boolean },
    };
  }
  return { parts: parts as THREE.Object3D[], opts: {} };
}

function materialOf(src: THREE.Object3D, fallback: THREE.Material): THREE.Material {
  if (src instanceof THREE.Mesh) return src.material as THREE.Material;
  let found: THREE.Material | null = null;
  src.traverse((c) => {
    if (!found && c instanceof THREE.Mesh) found = c.material as THREE.Material;
  });
  return found ?? fallback;
}

// =============================================================================
// Public primitives
// =============================================================================

/**
 * Boolean union: combine two or more parts into one watertight mesh.
 * Inherits material from the first operand.
 *
 * Default shading is **flat** (hard faceted edges) — pass
 * `{ smooth: true }` as the last arg for averaged smooth normals.
 *
 * @example
 * const merged = await boolUnion('Hull', body, turret, barrel);
 * const blob   = await boolUnion('Blob', a, b, c, { smooth: true });
 */
export async function boolUnion(
  name: string,
  ...partsAndOpts: Array<THREE.Object3D | { smooth?: boolean }>
): Promise<THREE.Mesh> {
  const { parts, opts } = splitPartsAndOpts(partsAndOpts);
  if (parts.length < 2) {
    throw new Error('boolUnion requires at least two parts');
  }
  const mod = await getManifoldModule();
  const manifolds = parts.map((p) => threeToManifold(p, mod.Manifold, mod.Mesh));
  const result = mod.Manifold.union(manifolds);
  const mat = materialOf(parts[0]!, new THREE.MeshStandardMaterial());
  const mesh = manifoldToThree(result, mat, `Mesh_${name}`, opts);
  manifolds.forEach((m) => m.delete());
  result.delete();
  return mesh;
}

/**
 * Boolean difference: subtract `cutter` parts from `body`.
 * Use to carve windows, buttons, grip panels, bolt holes.
 *
 * Default shading is **flat** (hard faceted edges). Pass
 * `{ smooth: true }` as the last arg for averaged smooth normals.
 *
 * @example
 * const gear = await boolDiff('Gear', cylinder, ...teethCutters);
 */
export async function boolDiff(
  name: string,
  body: THREE.Object3D,
  ...cuttersAndOpts: Array<THREE.Object3D | { smooth?: boolean }>
): Promise<THREE.Mesh> {
  const { parts: cutters, opts } = splitPartsAndOpts(cuttersAndOpts);
  if (cutters.length < 1) {
    throw new Error('boolDiff requires at least one cutter');
  }
  const mod = await getManifoldModule();
  const bodyM = threeToManifold(body, mod.Manifold, mod.Mesh);
  const cutterM = cutters.map((c) => threeToManifold(c, mod.Manifold, mod.Mesh));
  const cutterUnion =
    cutterM.length === 1 ? (cutterM[0] as Manifold) : mod.Manifold.union(cutterM);
  const result = bodyM.subtract(cutterUnion);
  const mat = materialOf(body, new THREE.MeshStandardMaterial());
  const mesh = manifoldToThree(result, mat, `Mesh_${name}`, opts);
  bodyM.delete();
  cutterM.forEach((m) => m.delete());
  if (cutterM.length > 1) cutterUnion.delete();
  result.delete();
  return mesh;
}

/**
 * Boolean intersection: keep only the overlapping volume.
 * Less commonly used in game assets, but handy for complex trim cuts.
 *
 * Default shading is **flat**; pass `{ smooth: true }` for averaged normals.
 */
export async function boolIntersect(
  name: string,
  a: THREE.Object3D,
  b: THREE.Object3D,
  opts: { smooth?: boolean } = {}
): Promise<THREE.Mesh> {
  const mod = await getManifoldModule();
  const aM = threeToManifold(a, mod.Manifold, mod.Mesh);
  const bM = threeToManifold(b, mod.Manifold, mod.Mesh);
  const result = aM.intersect(bM);
  const mat = materialOf(a, new THREE.MeshStandardMaterial());
  const mesh = manifoldToThree(result, mat, `Mesh_${name}`, opts);
  aM.delete();
  bM.delete();
  result.delete();
  return mesh;
}

/**
 * Convex hull: tightest convex mesh enclosing all points of the inputs.
 * Good for simplifying collision volumes or wrapping a cluster of parts.
 *
 * Hulls are typically **smooth-shaded** (they're wrapping-shapes, not
 * mechanical), so this default is `smooth: true`. Override with
 * `{ smooth: false }` for a faceted look.
 */
export async function hull(
  name: string,
  ...partsAndOpts: Array<THREE.Object3D | { smooth?: boolean }>
): Promise<THREE.Mesh> {
  const { parts, opts } = splitPartsAndOpts(partsAndOpts);
  if (parts.length < 1) {
    throw new Error('hull requires at least one part');
  }
  const mod = await getManifoldModule();
  const manifolds = parts.map((p) => threeToManifold(p, mod.Manifold, mod.Mesh));
  const result =
    manifolds.length === 1 ? (manifolds[0] as Manifold).hull() : mod.Manifold.hull(manifolds);
  const mat = materialOf(parts[0]!, new THREE.MeshStandardMaterial());
  const mesh = manifoldToThree(result, mat, `Mesh_${name}`, { smooth: opts.smooth ?? true });
  manifolds.forEach((m) => m.delete());
  if (manifolds.length > 1) result.delete();
  return mesh;
}

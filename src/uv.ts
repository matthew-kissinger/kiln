/**
 * Kiln UV unwrapping — Wave 3A
 *
 * Auto-generates UV coordinates for an arbitrary BufferGeometry using
 * xatlas (Witness engine alum, C++ → WASM via xatlasjs). Output is a new
 * BufferGeometry — the input is not mutated.
 *
 * Why UVs matter for Kiln: once we support textures (Wave 3B+) and
 * projection painting (Wave 3D), every mesh needs a well-packed UV atlas
 * or projected textures will overlap / stretch. `autoUnwrap` is the step
 * that makes our CSG / subdivide / curveToMesh outputs texture-ready.
 *
 * Runs headlessly in Node via `xatlasjs/dist/node`. Lazy init so the
 * WASM isn't paid for in scenes that don't use textures.
 */

import * as THREE from 'three';

// Lazy xatlas init — pays ~100-200ms on first call, then free.
let _xatlasReady: Promise<unknown> | null = null;

type XatlasApi = {
  loaded: boolean;
  createAtlas(): void;
  addMesh(
    indexes: Uint16Array | Uint32Array,
    vertices: Float32Array,
    normals: Float32Array | null,
    coords: Float32Array | null,
    meshObj: string,
    useNormals: boolean,
    useCoords: boolean,
    scale: number,
  ): { meshId: number } | null;
  generateAtlas(
    chartOptions: Record<string, unknown>,
    packOptions: Record<string, unknown>,
    destroyMesh: boolean,
  ): {
    width: number;
    height: number;
    atlasCount: number;
    meshCount: number;
    meshes: Array<{
      mesh: string;
      vertex: {
        vertices: Float32Array | number[];
        normals?: Float32Array | number[];
        coords?: Float32Array | number[];
        coords1?: Float32Array | number[];
      };
      index?: Uint32Array | number[];
      oldIndexes: Uint32Array | number[];
    }>;
  };
  destroyAtlas(): void;
};

async function getXatlas(): Promise<XatlasApi> {
  if (!_xatlasReady) {
    _xatlasReady = (async () => {
      // xatlasjs publishes a Node-friendly emscripten build under dist/node.
      const apiSpecifier = 'xatlasjs/dist/node/api.mjs';
      const xatlasSpecifier = 'xatlasjs/dist/node/xatlas.js';
      const apiMod = (await import(apiSpecifier)) as unknown as {
        Api: (
          createModule: unknown,
        ) => new (
          onLoad: () => void,
          locateFile: unknown,
          onProgress: unknown,
        ) => XatlasApi;
      };
      const xatlasMod = (await import(xatlasSpecifier)) as unknown as {
        default?: unknown;
      };
      const create = xatlasMod.default ?? xatlasMod;
      const ApiCtor = apiMod.Api(create);
      return new Promise<XatlasApi>((resolve) => {
        const xa = new ApiCtor(() => resolve(xa), null as never, null as never);
      });
    })();
  }
  return _xatlasReady as Promise<XatlasApi>;
}

export interface AutoUnwrapOptions {
  /** Atlas texture resolution (power-of-2). Default 1024. */
  resolution?: number;
  /** Padding between charts in texels. Default 2. */
  padding?: number;
  /** Bake surface normals when determining seams. Default false (faster). */
  useNormals?: boolean;
}

/**
 * Generate a UV atlas for a BufferGeometry.
 *
 * The output geometry has a fresh `uv` attribute ready for texture
 * sampling, and (usually) a different vertex count than the input: xatlas
 * duplicates vertices along UV seams so each shell gets its own chart.
 *
 * Returns a *new* BufferGeometry; the input is left untouched.
 *
 * @example
 * const raw = boxGeo(1, 2, 1);
 * const unwrapped = await autoUnwrap(raw, { resolution: 1024, padding: 2 });
 * const crate = new THREE.Mesh(unwrapped, woodPBR);
 */
export async function autoUnwrap(
  geometry: THREE.BufferGeometry,
  opts: AutoUnwrapOptions = {},
): Promise<THREE.BufferGeometry> {
  const xa = await getXatlas();

  // xatlas needs an indexed BufferGeometry. Convert if necessary.
  const src = geometry.index ? geometry : toIndexed(geometry);
  const posAttr = src.getAttribute('position') as THREE.BufferAttribute | undefined;
  const normAttr = src.getAttribute('normal') as THREE.BufferAttribute | undefined;
  const idxAttr = src.getIndex();
  if (!posAttr || !idxAttr) {
    throw new Error('autoUnwrap: geometry requires position attribute and an index');
  }
  // T2.4: measured — xatlas accepts an empty mesh and returns an empty atlas
  // without complaint, so a zero-triangle geometry used to come back with zero
  // vertices and NO uv attribute, and the failure only surfaced later as a
  // texture that would not appear. The realistic upstream cause is a CSG result
  // that collapsed to nothing.
  if (idxAttr.count === 0 || posAttr.count === 0) {
    throw new Error(
      'autoUnwrap: geometry has no triangles. Nothing can be unwrapped — check the operation that produced it (an empty CSG result is the usual cause).',
    );
  }
  if (idxAttr.count % 3 !== 0) {
    throw new Error(
      `autoUnwrap: geometry has ${idxAttr.count} indices, which is not a whole number of triangles.`,
    );
  }

  xa.createAtlas();

  const useNormals = Boolean(opts.useNormals && normAttr);
  const indexArray =
    idxAttr.array instanceof Uint32Array
      ? idxAttr.array
      : new Uint32Array(idxAttr.array as ArrayLike<number>);

  const addRes = xa.addMesh(
    indexArray,
    new Float32Array(posAttr.array),
    useNormals && normAttr ? new Float32Array(normAttr.array) : null,
    null,
    'kiln-mesh',
    useNormals,
    false,
    1,
  );
  if (!addRes) {
    xa.destroyAtlas();
    throw new Error('autoUnwrap: xatlas.addMesh failed (non-manifold or degenerate geometry?)');
  }

  const result = xa.generateAtlas(
    {},
    { resolution: opts.resolution ?? 1024, padding: opts.padding ?? 2 },
    true,
  );

  const mesh = result.meshes[0];
  if (!mesh) {
    xa.destroyAtlas();
    throw new Error('autoUnwrap: xatlas returned no meshes');
  }

  const out = new THREE.BufferGeometry();
  out.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(mesh.vertex.vertices), 3),
  );
  if (mesh.vertex.normals) {
    out.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(mesh.vertex.normals), 3));
  }
  if (mesh.vertex.coords1) {
    out.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(mesh.vertex.coords1), 2));
  }
  if (mesh.index) {
    out.setIndex(new THREE.BufferAttribute(new Uint32Array(mesh.index), 1));
  }

  // Atlas metadata lives on userData so downstream tools (texture baking,
  // projection painting) can sample the atlas resolution.
  //
  // T2.4 — read `width`/`height`, do NOT assume `resolution` squared. `resolution`
  // is an upper bound xatlas packs within, not the atlas it returns: a CSG'd box
  // at resolution 1024 measured 917x1085. A baker that allocated a square
  // `resolution x resolution` target would sample the wrong texels along one
  // axis, which reads as a subtle uniform stretch rather than an obvious break.
  out.userData['atlas'] = {
    width: result.width,
    height: result.height,
    atlasCount: result.atlasCount,
  };

  if (!out.getAttribute('normal')) out.computeVertexNormals();
  repairZeroNormals(out);

  // xatlas can pack every chart and still hand back a mesh with no coords1 when
  // the input degenerates. Better to say so than to return a geometry whose
  // missing `uv` only shows up as an untextured surface much later.
  if (!out.getAttribute('uv')) {
    xa.destroyAtlas();
    throw new Error(
      'autoUnwrap: xatlas produced no UV coordinates for this geometry (degenerate or zero-area triangles?).',
    );
  }

  xa.destroyAtlas();
  return out;
}

/**
 * Convert a non-indexed BufferGeometry to an indexed one via naive
 * sequential indexing. Sufficient for xatlas input (it re-indexes anyway
 * during chart generation).
 */
function toIndexed(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
  const indices = new Uint32Array(posAttr.count);
  for (let i = 0; i < posAttr.count; i++) indices[i] = i;
  const out = geo.clone();
  out.setIndex(new THREE.BufferAttribute(indices, 1));
  return out;
}

/**
 * Replace any zero-length or non-finite normal with one derived from the faces
 * that use it.
 *
 * A CSG result routinely carries a few zero-area triangles -- Manifold produces
 * them where cutters meet a curved surface at a shallow angle. They are
 * invisible, they survive the atlas, and `computeVertexNormals` cannot give
 * them a direction: the cross product of two collinear edges is the zero
 * vector, so every vertex touched only by such triangles ends up at (0, 0, 0).
 * glTF rejects that (`GLTF_ACCESSOR_VECTOR3_NON_UNIT`), so an asset that looks
 * finished fails export. Measured on a torus shell cut to an arc: 118 of 662.
 *
 * Only the broken normals are rebuilt, from the non-degenerate faces around
 * them. Rebuilding the whole attribute would be no more correct and would throw
 * away the normals xatlas already carried through correctly.
 */
function repairZeroNormals(geo: THREE.BufferGeometry): void {
  const normal = geo.getAttribute('normal') as THREE.BufferAttribute | undefined;
  const position = geo.getAttribute('position') as THREE.BufferAttribute | undefined;
  const index = geo.getIndex();
  if (!normal || !position || !index) return;

  const broken = new Set<number>();
  for (let i = 0; i < normal.count; i++) {
    const x = normal.getX(i);
    const y = normal.getY(i);
    const z = normal.getZ(i);
    if (!Number.isFinite(x + y + z) || Math.hypot(x, y, z) < 1e-6) broken.add(i);
  }
  if (broken.size === 0) return;

  const acc = new Float32Array(normal.count * 3);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const face = new THREE.Vector3();
  const edge = new THREE.Vector3();
  for (let t = 0; t + 2 < index.count; t += 3) {
    const tri = [index.getX(t), index.getX(t + 1), index.getX(t + 2)];
    if (!tri.some((i) => broken.has(i))) continue;
    a.fromBufferAttribute(position, tri[0]!);
    b.fromBufferAttribute(position, tri[1]!);
    c.fromBufferAttribute(position, tri[2]!);
    // Area-weighted, which is what the cross product already gives: a sliver
    // triangle should not pull the normal of the vertex it happens to touch.
    face.subVectors(c, a);
    edge.subVectors(b, a);
    face.crossVectors(edge, face);
    for (const i of tri) {
      if (!broken.has(i)) continue;
      const o = i * 3;
      acc[o] = acc[o]! + face.x;
      acc[o + 1] = acc[o + 1]! + face.y;
      acc[o + 2] = acc[o + 2]! + face.z;
    }
  }

  for (const i of broken) {
    face.set(acc[i * 3]!, acc[i * 3 + 1]!, acc[i * 3 + 2]!);
    // A vertex used only by degenerate triangles has no direction to recover.
    // Any unit vector satisfies the validator; +Y is the least surprising.
    if (face.lengthSq() < 1e-20) face.set(0, 1, 0);
    else face.normalize();
    normal.setXYZ(i, face.x, face.y, face.z);
  }
  normal.needsUpdate = true;
}

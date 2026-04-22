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
    scale: number
  ): { meshId: number } | null;
  generateAtlas(
    chartOptions: Record<string, unknown>,
    packOptions: Record<string, unknown>,
    destroyMesh: boolean
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
        Api: (createModule: unknown) => new (
          onLoad: () => void,
          locateFile: unknown,
          onProgress: unknown
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
  opts: AutoUnwrapOptions = {}
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
    1
  );
  if (!addRes) {
    xa.destroyAtlas();
    throw new Error('autoUnwrap: xatlas.addMesh failed (non-manifold or degenerate geometry?)');
  }

  const result = xa.generateAtlas(
    {},
    { resolution: opts.resolution ?? 1024, padding: opts.padding ?? 2 },
    true
  );

  const mesh = result.meshes[0];
  if (!mesh) {
    xa.destroyAtlas();
    throw new Error('autoUnwrap: xatlas returned no meshes');
  }

  const out = new THREE.BufferGeometry();
  out.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(mesh.vertex.vertices), 3)
  );
  if (mesh.vertex.normals) {
    out.setAttribute(
      'normal',
      new THREE.BufferAttribute(new Float32Array(mesh.vertex.normals), 3)
    );
  }
  if (mesh.vertex.coords1) {
    out.setAttribute(
      'uv',
      new THREE.BufferAttribute(new Float32Array(mesh.vertex.coords1), 2)
    );
  }
  if (mesh.index) {
    out.setIndex(new THREE.BufferAttribute(new Uint32Array(mesh.index), 1));
  }

  // Atlas metadata lives on userData so downstream tools (texture baking,
  // projection painting) can sample the atlas resolution.
  out.userData['atlas'] = {
    width: result.width,
    height: result.height,
    atlasCount: result.atlasCount,
  };

  if (!out.getAttribute('normal')) out.computeVertexNormals();

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

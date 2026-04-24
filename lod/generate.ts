/**
 * LOD chain generator — meshoptimizer-backed decimation.
 *
 * Produces N simplified copies of a source GLB at descending tri ratios.
 * Each level is returned as its own Buffer so the caller can write them as
 * `lod0.glb`, `lod1.glb`, ... per the TIJ pipeline's directory contract.
 *
 * Pipeline per level:
 *   1. Re-read source GLB (fresh Document — transforms are destructive).
 *   2. weld() — collapse duplicate verts so simplify has something to collapse.
 *   3. simplify() with the requested ratio + error threshold.
 *   4. prune() — remove unused accessors/textures the simplifier orphaned.
 *   5. dedup() — merge identical materials, textures, accessors.
 *
 * Skinned (rigged) meshes: simplify preserves JOINTS_0 / WEIGHTS_0 vertex
 * attributes, so bone animation continues to work. Animations are unchanged
 * because the skeleton node graph is untouched. Quality at ratios ≤ 0.1 on
 * characters can degrade silhouette — the gallery is the final arbiter.
 */

import { readFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';

import { NodeIO, type Document } from '@gltf-transform/core';
import { simplify, weld, prune, dedup } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';

export interface GenerateLODChainOptions {
  /** Target ratios of vertices to keep, one per LOD level. Default [1.0, 0.5, 0.25, 0.1]. */
  ratios?: number[];
  /** Max permitted error as a fraction of mesh radius. Default 0.01. */
  errorThreshold?: number;
  /** Lock topological borders — use for tiled terrain. Default false. */
  lockBorder?: boolean;
}

export interface LODLevel {
  /** Index in the chain (0 = highest detail, N-1 = lowest). */
  level: number;
  /** Target ratio passed to meshopt. */
  ratio: number;
  /** Serialized GLB bytes for this level. */
  glb: Buffer;
  /** Total triangle count in this level (post-decimation). */
  triangles: number;
  /** Byte length of the GLB. */
  bytes: number;
}

export interface GenerateLODChainResult {
  lods: LODLevel[];
  source: {
    triangles: number;
    bytes: number;
  };
}

export async function generateLODChain(
  input: Buffer | string,
  opts: GenerateLODChainOptions = {},
): Promise<GenerateLODChainResult> {
  const ratios = opts.ratios ?? [1.0, 0.5, 0.25, 0.1];
  const errorThreshold = opts.errorThreshold ?? 0.01;
  const lockBorder = opts.lockBorder ?? false;

  // meshoptimizer ships WASM — gate on ready before first use.
  await MeshoptSimplifier.ready;

  const io = new NodeIO();
  const srcBuf = typeof input === 'string' ? readFileSync(input) : input;
  const srcDoc = await io.readBinary(srcBuf);
  const srcTris = countTriangles(srcDoc);

  const lods: LODLevel[] = [];
  for (let level = 0; level < ratios.length; level++) {
    const ratio = ratios[level]!;
    // Fresh Document per level — @gltf-transform transforms mutate in place.
    const doc = await io.readBinary(srcBuf);

    if (ratio < 1.0) {
      await doc.transform(
        weld(),
        simplify({
          simplifier: MeshoptSimplifier,
          ratio,
          error: errorThreshold,
          lockBorder,
        }),
        prune(),
        dedup(),
      );
    }

    const bytes = await io.writeBinary(doc);
    const glb = Buffer.from(bytes);
    lods.push({
      level,
      ratio,
      glb,
      triangles: countTriangles(doc),
      bytes: glb.byteLength,
    });
  }

  return {
    lods,
    source: { triangles: srcTris, bytes: srcBuf.byteLength },
  };
}

export function countTriangles(doc: Document): number {
  let tris = 0;
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const index = prim.getIndices();
      if (index) {
        tris += index.getCount() / 3;
      } else {
        const pos = prim.getAttribute('POSITION');
        if (pos) tris += pos.getCount() / 3;
      }
    }
  }
  return Math.round(tris);
}

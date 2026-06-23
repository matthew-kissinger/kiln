/**
 * Photogrammetry cleanup — preset composition for raw scans.
 *
 * Poly Haven tier-C plants come in at 50k–300k triangles with 2K–4K PBR
 * texture stacks. That's fine for offline imposter bakes but unusable as
 * runtime geometry. This module collapses them to a bake-ready state:
 *
 *   1. weld — merge coincident verts.
 *   2. simplify — meshopt decimation to a target triangle budget.
 *   3. textureCompress — resize diffuse/normal/roughness to <=1K, encode PNG.
 *   4. dedup + prune — drop anything orphaned by the above.
 *
 * Gated per proposal §P6 — only run when tier-C quality beats the Poly Pizza
 * shortlist in the validation gallery. For Poly Pizza sources, skip this
 * module entirely; they're already sub-5k-tri PSX-style meshes.
 */

import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';

import { NodeIO } from '@gltf-transform/core';
import { dedup, prune, simplify, textureCompress, weld } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';

import { countTriangles } from '../lod/generate';

export interface CleanupPhotogrammetryOptions {
  /** Target post-decimation triangle count. Default 10000. */
  targetTriangles?: number;
  /** Max texture dimension (w = h). Default 1024. */
  textureSize?: number;
  /**
   * Max permitted error as a fraction of mesh radius. Higher tolerates more
   * distortion — photogrammetry is noisy so 0.02 is a safe default.
   */
  errorThreshold?: number;
}

export interface CleanupPhotogrammetryResult {
  glb: Buffer;
  meta: {
    sourceTriangles: number;
    targetTriangles: number;
    ratio: number;
    textureSize: number;
    sourceBytes: number;
    bytes: number;
  };
}

export async function cleanupPhotogrammetry(
  input: Buffer | string,
  opts: CleanupPhotogrammetryOptions = {},
): Promise<CleanupPhotogrammetryResult> {
  const targetTris = opts.targetTriangles ?? 10_000;
  const textureSize = opts.textureSize ?? 1024;
  const errorThreshold = opts.errorThreshold ?? 0.02;

  await MeshoptSimplifier.ready;

  const io = new NodeIO();
  const srcBuf = typeof input === 'string' ? readFileSync(input) : input;
  const doc = await io.readBinary(srcBuf);
  const srcTris = countTriangles(doc);

  // Compute the ratio to hit targetTris. If source is already smaller, skip
  // decimation (ratio = 1.0 is a no-op).
  const ratio = srcTris > 0 ? Math.min(1, targetTris / srcTris) : 1;

  await doc.transform(
    weld(),
    simplify({
      simplifier: MeshoptSimplifier,
      ratio,
      error: errorThreshold,
      lockBorder: false,
    }),
    textureCompress({
      encoder: sharp,
      targetFormat: 'png',
      resize: [textureSize, textureSize],
    }),
    dedup(),
    prune(),
  );

  const outBytes = await io.writeBinary(doc);
  const glb = Buffer.from(outBytes);
  const finalTris = countTriangles(doc);

  return {
    glb,
    meta: {
      sourceTriangles: srcTris,
      targetTriangles: finalTris,
      ratio,
      textureSize,
      sourceBytes: srcBuf.byteLength,
      bytes: glb.byteLength,
    },
  };
}

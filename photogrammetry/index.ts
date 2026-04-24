/**
 * kiln/photogrammetry — cleanup pass for raw photogrammetry GLBs.
 *
 *   import { kiln } from '@pixel-forge/core';
 *   const { glb, meta } = await kiln.cleanupPhotogrammetry(scanGlb, {
 *     targetTriangles: 8000,
 *     textureSize: 1024,
 *   });
 */

export { cleanupPhotogrammetry } from './cleanup';
export type {
  CleanupPhotogrammetryOptions,
  CleanupPhotogrammetryResult,
} from './cleanup';

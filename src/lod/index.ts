/**
 * kiln/lod — meshopt-backed LOD chain generator.
 *
 *   import { kiln } from '@pixel-forge/core';
 *   const { lods, source } = await kiln.generateLODChain(glb, {
 *     ratios: [1.0, 0.5, 0.25, 0.1],
 *   });
 *   for (const lod of lods) writeFileSync(`lod${lod.level}.glb`, lod.glb);
 */

export { generateLODChain, countTriangles } from './generate';
export type {
  GenerateLODChainOptions,
  GenerateLODChainResult,
  LODLevel,
} from './generate';

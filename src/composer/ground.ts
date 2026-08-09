/**
 * Ground sampler — the terrain seam that keeps layout heightmap-agnostic.
 *
 * Flat today; a heightmap / heightfield implements the same `heightAt` contract
 * tomorrow and every placement drops onto the terrain with zero layout changes.
 * This is the single abstraction that stops the composer being locked to a flat
 * disc.
 */
export interface GroundSampler {
  /** World-space terrain height at (x, z). */
  heightAt(x: number, z: number): number;
  /** World-space upward surface normal. Flat and canonical heightfields provide it. */
  normalAt?(x: number, z: number): [number, number, number];
}

/** Constant-height ground (the default, y = 0). */
export const flatGround = (
  y = 0,
): GroundSampler & { normalAt(x: number, z: number): [number, number, number] } => ({
  heightAt: () => y,
  normalAt: () => [0, 1, 0],
});

/** Mark a sampler as terrain — the heightmap seam. Identity today (a heightfield
 *  is just a `GroundSampler`); exists so a scene program reads `heightmap(fn)`
 *  symmetrically with `flat()`, and gives one place to add caching later. */
export const heightmap = (sampler: GroundSampler): GroundSampler => sampler;

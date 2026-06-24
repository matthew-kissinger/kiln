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
}

/** Constant-height ground (the default, y = 0). */
export const flatGround = (y = 0): GroundSampler => ({ heightAt: () => y });

/** Mark a sampler as terrain — the heightmap seam. Identity today (a heightfield
 *  is just a `GroundSampler`); exists so a scene program reads `heightmap(fn)`
 *  symmetrically with `flat()`, and gives one place to add caching later. */
export const heightmap = (sampler: GroundSampler): GroundSampler => sampler;

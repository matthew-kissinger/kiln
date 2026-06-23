/**
 * `@pixel-forge/core/kiln/arena` — pure, deterministic ranking math for the Kiln
 * Arena: Bradley-Terry strength fitting + active (adaptive) pair sampling.
 *
 * Relocated from packages/kiln-bench/src/arena (2026-06) so both the bench and
 * the Kiln Studio app single-source the same implementation. Zero dependencies,
 * no I/O — same votes in, same ranking out.
 *
 * - {@link fitBradleyTerry} — fit latent strengths + Elo scores from pairwise votes
 * - {@link pickNextPair}    — choose the most informative next matchup to vote on
 */
export { fitBradleyTerry } from './bradley-terry';
export type {
  Vote,
  ItemStrength,
  BradleyTerryResult,
  BradleyTerryOptions,
} from './bradley-terry';

export { pickNextPair } from './adaptive';
export type { Pair, PickNextPairOptions } from './adaptive';

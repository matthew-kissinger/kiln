/**
 * Bradley-Terry model — fit latent "strengths" from pairwise win/loss votes.
 *
 * Given votes of the form {winner, loser}, we fit a strength parameter pi_i per
 * item such that P(i beats j) = pi_i / (pi_i + pi_j). We solve for the MLE with
 * the classic Zermelo iterative algorithm (a minorization-maximization update):
 *
 *   pi_i  <-  W_i / sum_{j != i} ( n_ij / (pi_i + pi_j) )
 *
 * where W_i is the number of wins for item i and n_ij is the number of
 * comparisons between i and j. This is deterministic, has no learning rate, and
 * converges monotonically for connected comparison graphs.
 *
 * We report each item's strength, an Elo-scaled score (so numbers are familiar
 * to humans), and an approximate standard error derived from the diagonal of the
 * inverse Fisher information of the log-strength parameters.
 *
 * Pure + deterministic: same votes in -> same ranking out. No I/O.
 *
 * Relocated from packages/kiln-bench/src/arena (2026-06) so the bench and the
 * Kiln Studio app single-source the same ranking math.
 */

/** A single pairwise human judgement: `winner` was preferred over `loser`. */
export interface Vote {
  winner: string;
  loser: string;
}

/** Per-item result, sorted strongest-first by the ranking() helper. */
export interface ItemStrength {
  id: string;
  /** Raw Bradley-Terry strength (positive, geometric-mean-normalized to 1). */
  strength: number;
  /** Elo-scaled score (400 / ln(10) * log(strength), centered on `eloBase`). */
  score: number;
  /** Approximate standard error of the Elo score (NaN if not estimable). */
  stdErr: number;
  /** Total comparisons this item participated in. */
  games: number;
  /** Wins for this item. */
  wins: number;
}

export interface BradleyTerryResult {
  items: ItemStrength[];
  /** Number of MM iterations actually run. */
  iterations: number;
  /** True if the update converged within tolerance before the cap. */
  converged: boolean;
}

export interface BradleyTerryOptions {
  /** Include these ids even if they have no votes (strength stays neutral). */
  ids?: readonly string[];
  /** Max minorization-maximization iterations. Default 1000. */
  maxIterations?: number;
  /** Convergence tolerance on max log-strength delta. Default 1e-9. */
  tolerance?: number;
  /** Elo center for the scaled score. Default 1500. */
  eloBase?: number;
}

const ELO_SCALE = 400 / Math.LN10; // ~173.7; converts ln-strength to Elo points.

/**
 * Fit Bradley-Terry strengths from pairwise votes via the Zermelo MM algorithm.
 * Returns items sorted strongest-first.
 */
export function fitBradleyTerry(
  votes: readonly Vote[],
  options: BradleyTerryOptions = {},
): BradleyTerryResult {
  const maxIterations = options.maxIterations ?? 1000;
  const tolerance = options.tolerance ?? 1e-9;
  const eloBase = options.eloBase ?? 1500;

  // Collect the universe of ids (from votes + any explicitly seeded ids).
  const idSet = new Set<string>(options.ids ?? []);
  for (const v of votes) {
    idSet.add(v.winner);
    idSet.add(v.loser);
  }
  const ids = [...idSet].sort(); // sort -> deterministic indexing
  const n = ids.length;
  const index = new Map<string, number>();
  ids.forEach((id, i) => index.set(id, i));

  // Pairwise comparison counts and per-item win/game tallies.
  // pairCount[i][j] = number of comparisons between i and j (symmetric).
  const pairCount: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  const wins = new Array<number>(n).fill(0);
  const games = new Array<number>(n).fill(0);

  for (const v of votes) {
    const w = index.get(v.winner);
    const l = index.get(v.loser);
    if (w === undefined || l === undefined || w === l) continue;
    wins[w]! += 1;
    games[w]! += 1;
    games[l]! += 1;
    pairCount[w]![l]! += 1;
    pairCount[l]![w]! += 1;
  }

  // Strengths in linear space, start uniform at 1.
  const pi = new Array<number>(n).fill(1);

  let iterations = 0;
  let converged = n <= 1; // trivially converged with 0 or 1 item

  for (let iter = 0; iter < maxIterations && !converged; iter++) {
    iterations = iter + 1;
    let maxDelta = 0;

    // MM update. Items with no wins cannot get a finite MLE (strength -> 0);
    // we hold them at a tiny floor so the rest of the system stays well-defined.
    const next = new Array<number>(n).fill(0);
    for (let i = 0; i < n; i++) {
      if (games[i] === 0) {
        next[i] = pi[i]!; // untouched, stays neutral
        continue;
      }
      let denom = 0;
      for (let j = 0; j < n; j++) {
        const nij = pairCount[i]![j]!;
        if (nij === 0) continue;
        denom += nij / (pi[i]! + pi[j]!);
      }
      // wins[i] may be 0 -> raw MLE strength 0 (a winless item). Floor it to a
      // tiny positive value so log-space math stays finite and the item still
      // ranks last rather than blowing up to -Infinity Elo.
      const raw = denom > 0 ? wins[i]! / denom : pi[i]!;
      next[i] = Math.max(raw, 1e-6);
    }

    // Normalize to geometric mean 1 over items that actually played, so the
    // scale is fixed and comparable across runs.
    normalizeGeometric(next, games);

    for (let i = 0; i < n; i++) {
      const a = Math.max(pi[i]!, 1e-12);
      const b = Math.max(next[i]!, 1e-12);
      const d = Math.abs(Math.log(b) - Math.log(a));
      if (d > maxDelta) maxDelta = d;
      pi[i] = next[i]!;
    }

    if (maxDelta < tolerance) converged = true;
  }

  const stdErrs = approxStdErr(pi, pairCount, games);

  const items: ItemStrength[] = ids.map((id, i) => {
    const strength = pi[i]!;
    const score = eloBase + ELO_SCALE * Math.log(Math.max(strength, 1e-12));
    return {
      id,
      strength,
      score,
      stdErr: stdErrs[i]!,
      games: games[i]!,
      wins: wins[i]!,
    };
  });

  // Strongest first; tie-break by id for determinism.
  items.sort((a, b) => b.strength - a.strength || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  return { items, iterations, converged };
}

/** Normalize strengths so the geometric mean over *played* items equals 1. */
function normalizeGeometric(pi: number[], games: readonly number[]): void {
  let logSum = 0;
  let count = 0;
  for (let i = 0; i < pi.length; i++) {
    if (games[i]! > 0 && pi[i]! > 0) {
      logSum += Math.log(pi[i]!);
      count += 1;
    }
  }
  if (count === 0) return;
  const factor = Math.exp(-logSum / count);
  for (let i = 0; i < pi.length; i++) pi[i] = pi[i]! * factor;
}

/**
 * Approximate standard error of each item's Elo score.
 *
 * Parameterize by beta_i = ln(pi_i). The Fisher information for Bradley-Terry is
 *   I_ii = sum_{j} n_ij * p_ij * (1 - p_ij)
 *   I_ij = -n_ij * p_ij * (1 - p_ij)   (i != j)
 * where p_ij = pi_i / (pi_i + pi_j). The information matrix is rank-deficient by
 * one (overall scale is unidentifiable), so we invert a per-item 1-D
 * approximation: Var(beta_i) ~= 1 / I_ii. SE on the Elo scale is ELO_SCALE * SE(beta).
 *
 * This is a cheap, well-behaved approximation — good enough to surface "this
 * item has barely been compared, trust its rank less" in the UI.
 */
function approxStdErr(
  pi: readonly number[],
  pairCount: readonly number[][],
  games: readonly number[],
): number[] {
  const n = pi.length;
  const out = new Array<number>(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    if (games[i] === 0) continue;
    let info = 0;
    for (let j = 0; j < n; j++) {
      const nij = pairCount[i]![j]!;
      if (nij === 0) continue;
      const pij = pi[i]! / (pi[i]! + pi[j]!);
      info += nij * pij * (1 - pij);
    }
    if (info > 0) out[i] = ELO_SCALE * Math.sqrt(1 / info);
  }
  return out;
}

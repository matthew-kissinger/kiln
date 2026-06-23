/**
 * Active sampling for the Kiln Arena.
 *
 * Given the candidate items and the votes collected so far, pick the *next* pair
 * to show a human so each vote is maximally informative. The heuristic:
 *
 *   1. Prefer pairs we've never compared (or compared least) — coverage.
 *   2. Among those, prefer pairs whose Bradley-Terry strengths are *closest*
 *      (the outcome is genuinely uncertain, so the vote is most informative).
 *   3. Boost pairs where the combined uncertainty (std err) is high — items we
 *      haven't pinned down yet.
 *
 * Pure + deterministic given the same inputs. No I/O.
 */
import { fitBradleyTerry, type Vote, type ItemStrength } from './bradley-terry';

export interface Pair {
  a: string;
  b: string;
}

export interface PickNextPairOptions {
  /**
   * Weight on closeness of strengths (default 1). Higher -> prefer "toss-up"
   * matchups more aggressively.
   */
  closenessWeight?: number;
  /** Weight on combined std-err / uncertainty (default 1). */
  uncertaintyWeight?: number;
  /**
   * Weight discouraging repeat comparisons (default 4). Each prior comparison
   * of a pair subtracts this much from its score.
   */
  repeatPenalty?: number;
}

/**
 * Select the most informative next pair to vote on. Returns `null` if fewer than
 * two items exist.
 */
export function pickNextPair(
  items: readonly string[],
  votes: readonly Vote[],
  options: PickNextPairOptions = {},
): Pair | null {
  const closenessWeight = options.closenessWeight ?? 1;
  const uncertaintyWeight = options.uncertaintyWeight ?? 1;
  const repeatPenalty = options.repeatPenalty ?? 4;

  const ids = [...new Set(items)].sort();
  if (ids.length < 2) return null;

  // Comparison counts per unordered pair, keyed canonically.
  const pairCounts = new Map<string, number>();
  for (const v of votes) {
    const key = pairKey(v.winner, v.loser);
    pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
  }

  // Current strength estimates (seed all ids so brand-new items appear).
  const fit = fitBradleyTerry(votes, { ids });
  const byId = new Map<string, ItemStrength>();
  for (const it of fit.items) byId.set(it.id, it);

  // Normalize uncertainty: missing/NaN std err -> treat as maximally uncertain.
  let maxStdErr = 0;
  for (const it of fit.items) {
    if (Number.isFinite(it.stdErr) && it.stdErr > maxStdErr) maxStdErr = it.stdErr;
  }
  const stdErrOf = (id: string): number => {
    const it = byId.get(id);
    if (!it || !Number.isFinite(it.stdErr)) return maxStdErr > 0 ? maxStdErr : 1;
    return it.stdErr;
  };
  const scoreOf = (id: string): number => byId.get(id)?.score ?? 0;

  // Scale closeness against the observed score spread so weights are comparable.
  let minScore = Infinity;
  let maxScore = -Infinity;
  for (const it of fit.items) {
    if (it.score < minScore) minScore = it.score;
    if (it.score > maxScore) maxScore = it.score;
  }
  const scoreSpread = maxScore - minScore || 1;
  const stdErrScale = maxStdErr > 0 ? maxStdErr : 1;

  let best: Pair | null = null;
  let bestScore = -Infinity;

  // Iterate all unordered pairs deterministically (i < j over sorted ids).
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i]!;
      const b = ids[j]!;
      const seen = pairCounts.get(pairKey(a, b)) ?? 0;

      // Closeness in [0,1]: 1 when strengths are identical.
      const closeness = 1 - Math.min(1, Math.abs(scoreOf(a) - scoreOf(b)) / scoreSpread);
      // Combined uncertainty in [0,~2].
      const uncertainty = (stdErrOf(a) + stdErrOf(b)) / stdErrScale;

      const informativeness =
        closenessWeight * closeness +
        uncertaintyWeight * uncertainty -
        repeatPenalty * seen;

      // Tie-break deterministically: earlier (a,b) in sorted order wins.
      if (informativeness > bestScore) {
        bestScore = informativeness;
        best = { a, b };
      }
    }
  }

  return best;
}

/** Canonical unordered-pair key. */
function pairKey(x: string, y: string): string {
  return x < y ? `${x} ${y}` : `${y} ${x}`;
}

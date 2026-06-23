/**
 * Animation-clip resolver for animated imposters.
 *
 * Real character GLBs use inconsistent clip names — a soldier might call
 * its stand-still pose "Idle", "Attacking_Idle", "Idle_Gun", "Idle_Neutral",
 * and a Blender export typically prefixes them with "CharacterArmature|".
 * The baker needs a deterministic way to pick ONE clip per logical target.
 *
 * Resolution rules (per target):
 *   1. Exact case-insensitive match on the normalized (no armature prefix) name.
 *   2. First alias in the target's priority list that matches any clip.
 *   3. null — clip is missing; caller decides whether to skip or fall back.
 *
 * This module is pure — no Three.js import, no file I/O. Consumers pass in
 * a flat list of clip names (from gltf.animations) and get back a map of
 * target -> resolved clip name.
 */

/** Logical clip targets the animated imposter baker cares about. */
export type ClipTarget = 'idle' | 'walking' | 'running' | 'shoot' | 'death';

/** Priority-ordered candidate names for each target. First match wins. */
export const CLIP_ALIASES: Record<ClipTarget, string[]> = {
  idle: [
    'Idle',
    'Idle_Gun',
    'Idle_Neutral',
    'Attacking_Idle',
    'Idle_Shoot',
    'Idle_Hold',
  ],
  walking: [
    'Walk',
    'Walk_Gun',
    'Walking',
    'Walk_Forward',
  ],
  running: [
    'Run',
    'Run_Gun',
    'Running',
  ],
  shoot: [
    // Prefer dedicated shoot clips, then stationary gun-ready, then melee.
    'Gun_Shoot',
    'Shoot',
    'Idle_Gun_Shoot',
    'Run_Shoot',
    'Idle_Shoot',
    'Attack',
    'Slash',
    'Stab',
    'Punch',
    'Punch_Right',
    'Idle_Gun_Pointing',
  ],
  death: [
    'Death',
    'Die',
    'HitRecieve',   // Quaternius misspells "Receive"
    'HitReact',
  ],
};

export interface ResolvedClip {
  target: ClipTarget;
  /** Actual clip name in the GLB (post armature-prefix strip). Null = missing. */
  resolved: string | null;
  /** The raw clip name with any armature prefix kept, for AnimationMixer.clipAction lookup. */
  rawName: string | null;
  /** Which alias matched. "exact" = exact case-insensitive target name. */
  matchedBy: 'exact' | 'alias' | 'fallback' | 'missing';
  /** If the matcher fell through to a best-guess, note what target was missing and what was used. */
  fallbackFor?: ClipTarget;
  /** If the fallback was a specific source clip, keep the requested raw name for traceability. */
  fallbackRawName?: string;
}

export interface ClipResolutionReport {
  /** Map from logical target -> resolved clip (or null). */
  clips: Partial<Record<ClipTarget, ResolvedClip>>;
  /** Targets that had no match at all, after aliases were exhausted. */
  missing: ClipTarget[];
  /** Clip names present in the GLB that we did NOT map. Useful for debugging. */
  unmapped: string[];
}

/**
 * Normalize a clip name by stripping common exporter prefixes.
 * "CharacterArmature|Walk" -> "Walk"
 * "CharacterArmature|CharacterArmature|Idle" -> "Idle"
 */
export function normalizeClipName(raw: string): string {
  let s = raw;
  // Strip repeated "Name|" prefixes until none left.
  while (s.includes('|')) s = s.slice(s.indexOf('|') + 1);
  return s;
}

/**
 * Resolve the requested targets against a GLB's clip list.
 *
 * @param clipNames - flat list of clip names from gltf.animations (raw, including any "Armature|" prefixes).
 * @param targets  - which logical clips the caller wants.
 */
export function resolveClips(clipNames: string[], targets: ClipTarget[]): ClipResolutionReport {
  const report: ClipResolutionReport = {
    clips: {},
    missing: [],
    unmapped: [],
  };

  // Build a lookup { normalized-lower: raw-name } for case-insensitive match.
  // Last-write-wins on duplicates — Quaternius exports often have the same
  // clip twice (with and without armature prefix). Either form works for
  // AnimationMixer.clipAction once you have the raw.
  const byNorm = new Map<string, string>();
  for (const raw of clipNames) {
    const norm = normalizeClipName(raw).toLowerCase();
    if (!byNorm.has(norm)) byNorm.set(norm, raw);
  }

  const consumed = new Set<string>();

  for (const target of targets) {
    const aliases = CLIP_ALIASES[target];
    let resolved: ResolvedClip | null = null;

    // 1. Exact target name (e.g. target='idle' matches clip 'Idle').
    const exactHit = byNorm.get(target.toLowerCase());
    if (exactHit) {
      resolved = {
        target,
        resolved: normalizeClipName(exactHit),
        rawName: exactHit,
        matchedBy: 'exact',
      };
    }

    // 2. Alias hits (preserves priority order).
    if (!resolved) {
      for (const alias of aliases) {
        const hit = byNorm.get(alias.toLowerCase());
        if (hit) {
          resolved = {
            target,
            resolved: normalizeClipName(hit),
            rawName: hit,
            matchedBy: 'alias',
          };
          break;
        }
      }
    }

    if (resolved) {
      report.clips[target] = resolved;
      consumed.add(resolved.resolved!.toLowerCase());
    } else {
      report.missing.push(target);
      report.clips[target] = {
        target,
        resolved: null,
        rawName: null,
        matchedBy: 'missing',
      };
    }
  }

  for (const [norm, raw] of byNorm) {
    if (!consumed.has(norm)) report.unmapped.push(raw);
  }

  return report;
}

/**
 * Apply a fallback strategy to a resolution report — promotes a different
 * target's clip into a missing slot. Common pattern: 'shoot' fell through
 * but 'idle' was found -> use idle as a stationary-pose stand-in for the
 * shoot target.
 *
 * Returns a NEW report with the fallbacks applied. Original report is
 * not mutated.
 */
export function applyClipFallbacks(
  report: ClipResolutionReport,
  fallbacks: Partial<Record<ClipTarget, ClipTarget>>,
): ClipResolutionReport {
  const next: ClipResolutionReport = {
    clips: { ...report.clips },
    missing: [...report.missing],
    unmapped: [...report.unmapped],
  };
  for (const [targetStr, donorTarget] of Object.entries(fallbacks) as [ClipTarget, ClipTarget][]) {
    const target = targetStr;
    const current = next.clips[target];
    if (current && current.resolved) continue;
    const donor = next.clips[donorTarget];
    if (!donor || !donor.resolved) continue;
    next.clips[target] = {
      target,
      resolved: donor.resolved,
      rawName: donor.rawName,
      matchedBy: 'fallback',
      fallbackFor: donorTarget,
    };
    const mIdx = next.missing.indexOf(target);
    if (mIdx >= 0) next.missing.splice(mIdx, 1);
  }
  return next;
}

export function applyRawClipFallbacks(
  report: ClipResolutionReport,
  clipNames: string[],
  fallbacks: Array<{ target: ClipTarget; rawName: string }>,
): ClipResolutionReport {
  const next: ClipResolutionReport = {
    clips: { ...report.clips },
    missing: [...report.missing],
    unmapped: [...report.unmapped],
  };
  const byRaw = new Map<string, string>();
  const byNorm = new Map<string, string>();
  for (const raw of clipNames) {
    byRaw.set(raw.toLowerCase(), raw);
    byNorm.set(normalizeClipName(raw).toLowerCase(), raw);
  }

  for (const fallback of fallbacks) {
    const current = next.clips[fallback.target];
    if (current?.resolved) continue;

    const hit =
      byRaw.get(fallback.rawName.toLowerCase()) ??
      byNorm.get(normalizeClipName(fallback.rawName).toLowerCase());
    if (!hit) continue;

    const normalized = normalizeClipName(hit);
    next.clips[fallback.target] = {
      target: fallback.target,
      resolved: normalized,
      rawName: hit,
      matchedBy: 'fallback',
      fallbackRawName: fallback.rawName,
    };

    const missingIdx = next.missing.indexOf(fallback.target);
    if (missingIdx >= 0) next.missing.splice(missingIdx, 1);

    const unmappedIdx = next.unmapped.findIndex(
      (raw) => raw === hit || normalizeClipName(raw).toLowerCase() === normalized.toLowerCase(),
    );
    if (unmappedIdx >= 0) next.unmapped.splice(unmappedIdx, 1);
  }

  return next;
}

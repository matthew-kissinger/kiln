/**
 * M1b — grade-aware refine loop helpers (plan/05 §3.2).
 *
 * The grader (`metrics.ts`) already computes the instanceability signal on every
 * bake; M1a made the deterministic `optimize:'auto'` consolidation the default.
 * This module closes the remaining loop: after the agent finalizes, the run
 * assesses the program's POST-consolidation grade (the grade the shipped GLB
 * will actually carry), and when it lands below B for a reason the model can
 * fix by authoring — material sprawl or texture sprawl, NOT a deliberate
 * transparency demotion — `runKilnAgent` feeds one bounded consolidation turn
 * back before emitting.
 *
 * Pure helpers: the trigger decision and the feedback message are plain
 * functions so the injection logic is unit-testable without a live model.
 */
import { WebIO } from '@gltf-transform/core';

import type { AssetCategory, AssetIntentV1 } from '../contracts';
import type { InstanceabilityGrade, InstanceabilityReport } from '../metrics';
import { AssetQaBlockedError } from '../qa/run';
import {
  resolveEvaluatorPortV1,
  type EvaluatorExecutionProfileV1,
  type EvaluatorPortV1,
} from '../evaluator';

/** Grades at or above this never trigger a refine turn. */
export const GRADE_REFINE_TARGET: InstanceabilityGrade = 'B';

/** Minimum model-call headroom under the step cap a refine round needs
 *  (edit → render → finalize, plus slack for a retry). */
export const GRADE_REFINE_MIN_HEADROOM = 4;

const GRADE_ORDER: InstanceabilityGrade[] = ['A', 'B', 'C', 'D', 'F'];

/** Rank a grade for comparison: lower is better (A=0 … F=4). Unknown ranks worst. */
export function gradeRank(grade: string): number {
  const at = GRADE_ORDER.indexOf(grade as InstanceabilityGrade);
  return at === -1 ? GRADE_ORDER.length : at;
}

/** Deterministic post-bake assessment of a Kiln program. */
export interface ProgramGradeAssessment {
  /** False when the program failed to execute/bake (error carries why). */
  ok: boolean;
  /** True when the program EXECUTES AND RENDERS but enforce-mode QA rejected
   *  the result (`AssetQaBlockedError`) — distinct from a broken program, so
   *  salvage callers can surface the block reason instead of a render error
   *  (and `KILN_QA_MODE=observe` revives salvage entirely). */
  qaBlocked?: boolean;
  /** The post-`auto`-consolidation instanceability report, when computable. */
  report?: InstanceabilityReport;
  /** Human-readable labels for the baked GLB's distinct materials (name when
   *  set, else the sRGB base-color hex) — the "offending material list". */
  materialLabels?: string[];
  error?: string;
}

/** Encode one linear color channel to sRGB 0-255. */
function srgb255(linear: number): number {
  const v = linear <= 0.0031308 ? linear * 12.92 : 1.055 * linear ** (1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(v * 255)));
}

/** List distinct material labels from baked GLB bytes (best-effort; [] on parse failure). */
async function listMaterialLabels(glb: Uint8Array): Promise<string[]> {
  try {
    const doc = await new WebIO().readBinary(glb);
    const labels = new Set<string>();
    for (const material of doc.getRoot().listMaterials()) {
      const name = material.getName();
      if (name) {
        labels.add(name);
        continue;
      }
      const [r, g, b] = material.getBaseColorFactor();
      const hex = [r ?? 0, g ?? 0, b ?? 0]
        .map((c) => srgb255(c).toString(16).padStart(2, '0'))
        .join('');
      labels.add(`#${hex}`);
    }
    return [...labels];
  } catch {
    return [];
  }
}

/**
 * Render + grade a program exactly as the final bake will (grade-aware `auto`
 * consolidation, matching `generateKilnAsset` and the Studio web-tier re-bake),
 * so the refine trigger keys on the grade the asset actually ships with.
 * Deterministic CPU work; never throws.
 */
export async function assessProgramGrade(
  code: string,
  opts: {
    intent?: AssetIntentV1;
    category?: AssetCategory;
    evaluatorPort?: EvaluatorPortV1;
    evaluatorProfile?: EvaluatorExecutionProfileV1;
  } = {},
): Promise<ProgramGradeAssessment> {
  try {
    const { evaluatorPort, evaluatorProfile, ...renderOptions } = opts;
    const render = await resolveEvaluatorPortV1(
      evaluatorPort,
      evaluatorProfile ?? 'trusted-local',
    ).render(code, { optimize: 'auto', ...renderOptions });
    const report = render.meta.instanceability;
    // Metrics computation failing is non-fatal everywhere else — same here: the
    // program is valid, there is just no grade signal to act on.
    if (!report) return { ok: true };
    const materialLabels = await listMaterialLabels(new Uint8Array(render.glb));
    return { ok: true, report, ...(materialLabels.length ? { materialLabels } : {}) };
  } catch (err) {
    return {
      ok: false,
      ...(err instanceof AssetQaBlockedError ? { qaBlocked: true } : {}),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export interface GradeRefineTrigger {
  /** The run's gradeRefine option ('auto' triggers; anything else never does). */
  mode: 'auto' | 'off';
  /** Post-bake assessment report (undefined = no signal, never triggers). */
  report: InstanceabilityReport | undefined;
  /** Model calls used so far in this run. */
  steps: number;
  /** The run's hard step cap (0 = uncapped). */
  maxSteps: number;
}

/**
 * Decide whether to spend ONE bounded refine turn on the grade. Triggers only
 * when every hold is clear:
 *   - gradeRefine is 'auto' and a report exists;
 *   - the grade is below B;
 *   - the cause is consolidation-fixable — material sprawl (>3 distinct) or
 *     texture sprawl (>4). A transparency-only demotion (glass caps at C by
 *     design) is a design choice, not an authoring defect: no turn is spent;
 *   - the step budget leaves at least {@link GRADE_REFINE_MIN_HEADROOM} calls.
 */
export function shouldGradeRefine(trigger: GradeRefineTrigger): boolean {
  if (trigger.mode !== 'auto') return false;
  const report = trigger.report;
  if (!report) return false;
  if (gradeRank(report.grade) <= gradeRank(GRADE_REFINE_TARGET)) return false;
  const m = report.metrics;
  if (m.uniqueMaterials <= 3 && m.textureCount <= 4) return false;
  if (trigger.maxSteps > 0 && trigger.maxSteps - trigger.steps < GRADE_REFINE_MIN_HEADROOM) {
    return false;
  }
  return true;
}

export interface GradeRefineMessageArgs {
  report: InstanceabilityReport;
  /** Offending material labels from {@link assessProgramGrade}. */
  materialLabels?: string[];
  /** Terminal verb for the active surface: kiln_finalize (unified) or kiln_submit (current). */
  finalizeVerb: 'kiln_finalize' | 'kiln_submit';
  /** Surface-appropriate edit instruction (e.g. 'kiln_edit (or kiln_draft to rewrite)'). */
  editHint: string;
}

/**
 * The concise feedback turn fed back to the model: grade, material stats, the
 * offender list, and a tightly-bounded consolidation directive. Engineered so
 * the model consolidates materials WITHOUT redesigning the asset.
 */
export function buildGradeRefineMessage(args: GradeRefineMessageArgs): string {
  const { report } = args;
  const m = report.metrics;
  const lines: string[] = [
    '[Automated grade check — not a user message.] Your finalized asset grades ' +
      `${report.grade} for instanceability (${report.summary}). The grade keys on ` +
      `distinct-material count: A needs 1, B needs 3 or fewer; you have ${m.uniqueMaterials}.`,
  ];
  if (m.textureCount > 4) {
    lines.push(
      `It also carries ${m.textureCount} textures (more than 4 demotes the grade — ` +
        'share or drop textures where parts can reuse one).',
    );
  }
  if (args.materialLabels?.length) {
    lines.push(`Distinct materials: ${args.materialLabels.join(', ')}.`);
  }
  lines.push(
    'Make ONE bounded consolidation pass now — do NOT redesign the asset:',
    '1. Collapse near-duplicate colors/materials so parts share ONE material per color ' +
      'family (target 3 or fewer distinct materials). Preserve the silhouette, geometry, ' +
      'and overall color read.',
    `2. Apply the smallest change that achieves it: ${args.editHint}.`,
    `3. Call kiln_render once to confirm the material count dropped, then call ${args.finalizeVerb} again.`,
  );
  return lines.join('\n');
}

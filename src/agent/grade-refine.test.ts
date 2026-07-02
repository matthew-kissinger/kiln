/**
 * M1b grade-aware refine helpers — the deterministic trigger + feedback message.
 *
 * `shouldGradeRefine` is the injection gate runKilnAgent consults after the
 * model finalizes: below-B AND consolidation-fixable AND budget headroom. These
 * tests pin every hold (mode off, missing report, already >= B, transparency-only
 * demotion, exhausted step budget) plus the message contents the model acts on.
 * `assessProgramGrade` is exercised against the known-good fixture program (a
 * real CPU bake — no model, no network) and a garbage program.
 */
import { describe, expect, test } from 'bun:test';

import type { InstanceabilityMetrics, InstanceabilityReport } from '../metrics';
import { KNOWN_GOOD_CODE } from '../__tests__/fixtures';
import {
  assessProgramGrade,
  buildGradeRefineMessage,
  GRADE_REFINE_MIN_HEADROOM,
  gradeRank,
  shouldGradeRefine,
} from './grade-refine';

function report(
  over: Partial<InstanceabilityMetrics> & { grade?: string } = {},
): InstanceabilityReport {
  const { grade, ...metricsOver } = over;
  const metrics: InstanceabilityMetrics = {
    uniqueGeometries: 5,
    uniqueMaterials: 8,
    drawCalls: 12,
    textureCount: 0,
    skinned: false,
    transparentMaterials: 0,
    triangles: 900,
    ...metricsOver,
  };
  return {
    grade: (grade ?? 'D') as InstanceabilityReport['grade'],
    summary: `${grade ?? 'D'} — ${metrics.uniqueMaterials} mat / ${metrics.uniqueGeometries} geo / ${metrics.drawCalls} draws, opaque`,
    reasons: [`${metrics.uniqueMaterials} materials`],
    metrics,
  };
}

describe('gradeRank', () => {
  test('orders A best to F worst; unknown ranks worst of all', () => {
    expect(gradeRank('A')).toBeLessThan(gradeRank('B'));
    expect(gradeRank('B')).toBeLessThan(gradeRank('C'));
    expect(gradeRank('C')).toBeLessThan(gradeRank('D'));
    expect(gradeRank('D')).toBeLessThan(gradeRank('F'));
    expect(gradeRank('?')).toBeGreaterThan(gradeRank('F'));
  });
});

describe('shouldGradeRefine', () => {
  const base = { mode: 'auto' as const, steps: 8, maxSteps: 40 };

  test('triggers on a below-B material-sprawl grade with budget headroom', () => {
    expect(shouldGradeRefine({ ...base, report: report({ grade: 'D', uniqueMaterials: 8 }) })).toBe(
      true,
    );
    expect(shouldGradeRefine({ ...base, report: report({ grade: 'C', uniqueMaterials: 5 }) })).toBe(
      true,
    );
  });

  test('triggers on texture sprawl even when materials are lean', () => {
    const r = report({ grade: 'C', uniqueMaterials: 2, textureCount: 6 });
    expect(shouldGradeRefine({ ...base, report: r })).toBe(true);
  });

  test('never triggers at or above the B target', () => {
    expect(shouldGradeRefine({ ...base, report: report({ grade: 'A', uniqueMaterials: 1 }) })).toBe(
      false,
    );
    expect(shouldGradeRefine({ ...base, report: report({ grade: 'B', uniqueMaterials: 3 }) })).toBe(
      false,
    );
  });

  test('skips a transparency-only demotion (glass caps at C by design)', () => {
    const r = report({
      grade: 'C',
      uniqueMaterials: 2,
      transparentMaterials: 1,
      textureCount: 0,
    });
    expect(shouldGradeRefine({ ...base, report: r })).toBe(false);
  });

  test("mode 'off' and a missing report never trigger", () => {
    expect(shouldGradeRefine({ ...base, mode: 'off', report: report() })).toBe(false);
    expect(shouldGradeRefine({ ...base, report: undefined })).toBe(false);
  });

  test('respects the step budget: needs MIN_HEADROOM calls under the cap', () => {
    const r = report({ grade: 'D' });
    const cap = 40;
    const tooDeep = cap - GRADE_REFINE_MIN_HEADROOM + 1;
    expect(shouldGradeRefine({ mode: 'auto', report: r, steps: tooDeep, maxSteps: cap })).toBe(
      false,
    );
    const justEnough = cap - GRADE_REFINE_MIN_HEADROOM;
    expect(shouldGradeRefine({ mode: 'auto', report: r, steps: justEnough, maxSteps: cap })).toBe(
      true,
    );
  });

  test('an uncapped run (maxSteps 0) has unlimited headroom', () => {
    expect(shouldGradeRefine({ mode: 'auto', report: report(), steps: 500, maxSteps: 0 })).toBe(
      true,
    );
  });
});

describe('buildGradeRefineMessage', () => {
  test('carries grade, material count/target, offenders, and the surface verbs', () => {
    const msg = buildGradeRefineMessage({
      report: report({ grade: 'D', uniqueMaterials: 8 }),
      materialLabels: ['#8b4513', '#8b4713', '#ffcc00'],
      finalizeVerb: 'kiln_finalize',
      editHint: 'kiln_edit for targeted swaps (or kiln_draft to rewrite)',
    });
    expect(msg).toContain('grades D');
    expect(msg).toContain('you have 8');
    expect(msg).toContain('3 or fewer');
    expect(msg).toContain('#8b4513, #8b4713, #ffcc00');
    expect(msg).toContain('kiln_render');
    expect(msg).toContain('kiln_finalize');
    expect(msg).toContain('kiln_edit');
    // The convergence guard: one pass, no redesign.
    expect(msg).toMatch(/ONE bounded consolidation pass/);
    expect(msg).toMatch(/do NOT redesign/i);
  });

  test('mentions texture sprawl only when textures exceed the demotion threshold', () => {
    const sprawl = buildGradeRefineMessage({
      report: report({ grade: 'C', uniqueMaterials: 2, textureCount: 6 }),
      finalizeVerb: 'kiln_submit',
      editHint: 'rewrite the program with the consolidated materials',
    });
    expect(sprawl).toContain('6 textures');
    expect(sprawl).toContain('kiln_submit');

    const lean = buildGradeRefineMessage({
      report: report({ grade: 'D', textureCount: 0 }),
      finalizeVerb: 'kiln_submit',
      editHint: 'rewrite the program with the consolidated materials',
    });
    expect(lean).not.toContain('textures');
  });
});

describe('assessProgramGrade', () => {
  test('grades the known-good program post-auto-consolidation', async () => {
    const assess = await assessProgramGrade(KNOWN_GOOD_CODE);
    expect(assess.ok).toBe(true);
    expect(assess.report).toBeDefined();
    // TestChest is lean (2 distinct materials after dedup) — at/above the B bar,
    // so a real run would NOT trigger a refine turn on it.
    expect(['A', 'B']).toContain(assess.report!.grade);
    expect(shouldGradeRefine({ mode: 'auto', report: assess.report, steps: 5, maxSteps: 40 })).toBe(
      false,
    );
    // The offender list is derived from the baked GLB's materials.
    expect(assess.materialLabels?.length ?? 0).toBeGreaterThan(0);
  });

  test('a program that does not build comes back ok:false, never throws', async () => {
    const assess = await assessProgramGrade('this is not a kiln program');
    expect(assess.ok).toBe(false);
    expect(assess.error).toBeDefined();
  });
});

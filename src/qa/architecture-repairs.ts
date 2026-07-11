import type { QaFinding } from './types';

export const ARCHITECTURE_REPAIR_CODES = [
  'ARCH_ROOF_AXIS',
  'ARCH_OPEN_GABLE',
  'ARCH_RIDGE_GAP',
  'ARCH_ENVELOPE_GAP',
  'ARCH_BLOCKED_PORTAL',
] as const;

export type ArchitectureRepairCode = (typeof ARCHITECTURE_REPAIR_CODES)[number];

export interface ArchitectureRepairRecipe {
  code: ArchitectureRepairCode;
  repairText: string;
  viewHints: readonly string[];
}

/**
 * Stable, localized repair recipes shared by category QA and the bounded repair
 * loop. Each recipe names the semantic surface to edit and the diagnostic view
 * that proves the edit, rather than asking the model to broadly "fix the asset".
 */
export const ARCHITECTURE_REPAIR_RECIPES: Readonly<
  Record<ArchitectureRepairCode, ArchitectureRepairRecipe>
> = Object.freeze({
  ARCH_ROOF_AXIS: Object.freeze({
    code: 'ARCH_ROOF_AXIS',
    repairText:
      'Edit only the reported roof slope or panel: keep the declared ridge axis fixed, mirror the two slope frames, and rotate panel span 90 degrees in roof-local space so it runs ridge-to-eave. Recheck both gable elevations and the top wireframe.',
    viewHints: Object.freeze([
      'architecture.gable.positive',
      'architecture.gable.negative',
      'generic.top.wireframe',
    ]),
  }),
  ARCH_OPEN_GABLE: Object.freeze({
    code: 'ARCH_OPEN_GABLE',
    repairText:
      'Add or complete only the reported roof.gable end panel. Its projected triangle must cover the full wall-top-to-ridge cross-section and meet both slopes; preserve intentional openings and the opposite end.',
    viewHints: Object.freeze([
      'architecture.gable.positive',
      'architecture.gable.negative',
      'generic.front.semantic-overlay',
    ]),
  }),
  ARCH_RIDGE_GAP: Object.freeze({
    code: 'ARCH_RIDGE_GAP',
    repairText:
      'Move only the reported slope high edge in its roof-local downhill direction until both high edges share the declared ridge line within tolerance. Do not change footprint, pitch, eaves, or overhang.',
    viewHints: Object.freeze([
      'architecture.gable.positive',
      'architecture.gable.negative',
      'generic.top.depth-contact',
    ]),
  }),
  ARCH_ENVELOPE_GAP: Object.freeze({
    code: 'ARCH_ENVELOPE_GAP',
    repairText:
      'At the reported wall-boundary samples, align the roof underside to the wall top plate within tolerance. Preserve the declared exterior overhang and do not close sides marked as an open pavilion.',
    viewHints: Object.freeze([
      'architecture.cutaway.dollhouse',
      'generic.front.depth-contact',
      'generic.right.depth-contact',
    ]),
  }),
  ARCH_BLOCKED_PORTAL: Object.freeze({
    code: 'ARCH_BLOCKED_PORTAL',
    repairText:
      'Remove or split only the reported blocker inside the opening clearance prism so the tagged exterior portal connects to the interior at the requested width, height, and depth. A painted door on a solid wall is not an opening.',
    viewHints: Object.freeze([
      'architecture.portal.eye',
      'architecture.cutaway.plan',
      'generic.front.depth-contact',
    ]),
  }),
});

export function architectureRepairRecipe(code: string): ArchitectureRepairRecipe | undefined {
  return (ARCHITECTURE_REPAIR_RECIPES as Readonly<Record<string, ArchitectureRepairRecipe>>)[code];
}

/** Apply the canonical recipe without discarding finding-specific localization. */
export function withArchitectureRepair(finding: QaFinding): QaFinding {
  const recipe = architectureRepairRecipe(finding.code);
  if (!recipe) return finding;
  return {
    ...finding,
    repairText: finding.repairText ?? recipe.repairText,
    viewHints: [...new Set([...(finding.viewHints ?? []), ...recipe.viewHints])],
  };
}

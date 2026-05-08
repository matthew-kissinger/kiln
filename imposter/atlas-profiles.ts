/**
 * Atlas profile rules for static (lat-lon / hemi-y) imposter bakes.
 *
 * Profiles define the maximum tile size, angle count, and whether a normal
 * aux layer is required for a given imposter "tier" (ground cover vs canopy
 * etc). Originally lived inline in scripts/validate-tij-vegetation-package.ts;
 * lifted to core in W6 so non-TIJ consumers can reuse the same contract.
 *
 * Species-to-profile mapping stays in the consumer (e.g. TIJ vegetation
 * pipeline) — profiles describe the *bake contract*, not the catalog.
 */

export const ATLAS_PROFILES = {
  'ground-compact': { maxTileSize: 256, maxAngles: 8, normalRequired: false },
  'mid-balanced': { maxTileSize: 512, maxAngles: 16, normalRequired: true },
  'canopy-balanced': { maxTileSize: 512, maxAngles: 32, normalRequired: true },
  'canopy-hero': { maxTileSize: 1024, maxAngles: 32, normalRequired: true },
} as const;

export type AtlasProfileName = keyof typeof ATLAS_PROFILES;
export type AtlasProfileLimits = (typeof ATLAS_PROFILES)[AtlasProfileName];

export const ATLAS_PROFILE_NAMES = Object.keys(ATLAS_PROFILES) as AtlasProfileName[];

export function isAtlasProfileName(value: unknown): value is AtlasProfileName {
  return typeof value === 'string' && value in ATLAS_PROFILES;
}

/**
 * Subset of static-imposter sidecar fields the profile cares about.
 * Accepts unknown so callers can pass JSON-parsed metadata directly.
 */
export interface AtlasProfileMetaInput {
  tileSize?: unknown;
  angles?: unknown;
  auxLayers?: unknown;
  normalSpace?: unknown;
}

export type AtlasProfileViolationField =
  | 'tileSize'
  | 'angles'
  | 'normal-aux-layer'
  | 'normal-space';

export interface AtlasProfileViolation {
  field: AtlasProfileViolationField;
  message: string;
}

export interface AtlasProfileValidationResult {
  ok: boolean;
  profile: AtlasProfileName;
  limits: AtlasProfileLimits;
  violations: AtlasProfileViolation[];
}

/**
 * Validates an imposter sidecar (or atlas metadata) against the named profile.
 * Returns { ok, violations[] } so callers can render their own error format.
 *
 * Read-only. Does not throw — invalid profile names produce a violation list
 * with `ok: false`. Pass a real `AtlasProfileName` (typed) and you'll get a
 * clean limits echo on success.
 */
export function validateAgainstAtlasProfile(
  meta: AtlasProfileMetaInput,
  profile: AtlasProfileName,
): AtlasProfileValidationResult {
  const limits = ATLAS_PROFILES[profile];
  const violations: AtlasProfileViolation[] = [];

  if (typeof meta.tileSize === 'number' && meta.tileSize > limits.maxTileSize) {
    violations.push({
      field: 'tileSize',
      message: `tileSize=${meta.tileSize} exceeds profile ${profile} max ${limits.maxTileSize}`,
    });
  }
  if (typeof meta.angles === 'number' && meta.angles > limits.maxAngles) {
    violations.push({
      field: 'angles',
      message: `angles=${meta.angles} exceeds profile ${profile} max ${limits.maxAngles}`,
    });
  }
  if (limits.normalRequired) {
    const aux = Array.isArray(meta.auxLayers) ? (meta.auxLayers as unknown[]) : [];
    if (!aux.includes('normal')) {
      violations.push({
        field: 'normal-aux-layer',
        message: `profile ${profile} requires the 'normal' aux layer`,
      });
    }
    if (meta.normalSpace !== 'capture-view') {
      violations.push({
        field: 'normal-space',
        message: `profile ${profile} requires normalSpace='capture-view' (got ${String(meta.normalSpace)})`,
      });
    }
  }

  return {
    ok: violations.length === 0,
    profile,
    limits,
    violations,
  };
}

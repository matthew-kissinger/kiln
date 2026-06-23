import { existsSync, readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import sharp from 'sharp';

import {
  isAtlasProfileName,
  validateAgainstAtlasProfile,
  type AtlasProfileName,
  type AtlasProfileValidationResult,
  type AtlasProfileViolation,
} from './atlas-profiles';
import { ImposterMetaSchema, type ImposterAuxLayer, type ImposterMeta } from './schema';

export interface ImposterValidationIssue {
  field: string;
  message: string;
}

export interface ValidateImposterOptions {
  profile?: AtlasProfileName;
  checkFiles?: boolean;
}

export interface ImposterValidationResult {
  ok: boolean;
  sidecarPath: string;
  meta: ImposterMeta | null;
  issues: ImposterValidationIssue[];
  profile?: AtlasProfileValidationResult;
}

export async function validateImposterSidecar(
  sidecarPathInput: string,
  opts: ValidateImposterOptions = {},
): Promise<ImposterValidationResult> {
  const sidecarPath = resolve(sidecarPathInput);
  const issues: ImposterValidationIssue[] = [];

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(sidecarPath, 'utf-8'));
  } catch (err) {
    return {
      ok: false,
      sidecarPath,
      meta: null,
      issues: [{ field: 'sidecar', message: err instanceof Error ? err.message : String(err) }],
    };
  }

  const parsed = ImposterMetaSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      sidecarPath,
      meta: null,
      issues: parsed.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'sidecar',
        message: issue.message,
      })),
    };
  }

  const meta = parsed.data;
  validateBbox(meta, issues);
  if (meta.angles !== meta.tilesX * meta.tilesY) {
    issues.push({
      field: 'angles',
      message: 'angles must match tilesX * tilesY',
    });
  }

  let profile: AtlasProfileValidationResult | undefined;
  if (opts.profile) {
    if (!isAtlasProfileName(opts.profile)) {
      issues.push({ field: 'profile', message: `unknown atlas profile: ${opts.profile}` });
    } else {
      profile = validateAgainstAtlasProfile(meta, opts.profile);
      for (const violation of profile.violations) {
        issues.push(profileViolationToIssue(violation));
      }
    }
  }

  if (opts.checkFiles !== false) {
    await validatePngFiles(sidecarPath, meta, issues);
  }

  return {
    ok: issues.length === 0,
    sidecarPath,
    meta,
    issues,
    ...(profile ? { profile } : {}),
  };
}

function validateBbox(meta: ImposterMeta, issues: ImposterValidationIssue[]): void {
  const { min, max } = meta.bbox;
  for (let axis = 0; axis < 3; axis++) {
    const lo = min[axis]!;
    const hi = max[axis]!;
    if (!(hi >= lo)) {
      issues.push({
        field: `bbox.${axis}`,
        message: 'bbox max must be greater than or equal to min',
      });
    }
  }
}

async function validatePngFiles(
  sidecarPath: string,
  meta: ImposterMeta,
  issues: ImposterValidationIssue[],
): Promise<void> {
  const base = sidecarPath.replace(new RegExp(`${escapeRegExp(extname(sidecarPath))}$`), '');
  const expected = { width: meta.atlasWidth, height: meta.atlasHeight };
  await validatePng(`${base}.png`, 'albedo', expected, issues);
  for (const layer of meta.auxLayers) {
    if (layer === 'albedo') continue;
    await validatePng(`${base}.${layer}.png`, layer, expected, issues);
  }
}

async function validatePng(
  filePath: string,
  layer: ImposterAuxLayer,
  expected: { width: number; height: number },
  issues: ImposterValidationIssue[],
): Promise<void> {
  if (!existsSync(filePath)) {
    issues.push({ field: `auxLayers.${layer}`, message: `missing PNG: ${filePath}` });
    return;
  }
  const meta = await sharp(filePath).metadata();
  if (meta.width !== expected.width || meta.height !== expected.height) {
    issues.push({
      field: `auxLayers.${layer}`,
      message: `PNG dimensions ${meta.width}x${meta.height} do not match sidecar ${expected.width}x${expected.height}`,
    });
  }
}

function profileViolationToIssue(violation: AtlasProfileViolation): ImposterValidationIssue {
  return {
    field: `profile.${violation.field}`,
    message: violation.message,
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

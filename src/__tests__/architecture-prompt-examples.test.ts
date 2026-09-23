import { bindLegacyFixtureRequirements } from './helpers/requirements-fixture';
import { describe, expect, test } from 'bun:test';

import { createAssetIntentV1 } from '../contracts';
import {
  ARCHITECTURE_RIDGE_X_SCAFFOLD,
  ARCHITECTURE_RIDGE_Z_SCAFFOLD,
} from './helpers/architecture-fixtures';
import type { AssetRequirementsQaReportV2 } from '../qa/requirements-report';
import { renderGLB } from '../render';

const CANONICAL_ARCHITECTURE_CODES = new Set([
  'ARCH_ROOF_AXIS',
  'ARCH_OPEN_GABLE',
  'ARCH_RIDGE_GAP',
  'ARCH_ENVELOPE_GAP',
  'ARCH_BLOCKED_PORTAL',
]);

function architectureIntent(
  ridgeAxis: 'x' | 'z',
  spanX: number,
  spanZ: number,
  wallHeight: number,
  rise: number,
  overhang: number,
) {
  const halfRun = (ridgeAxis === 'x' ? spanZ : spanX) / 2;
  return createAssetIntentV1({
    category: 'architecture',
    capabilities: ['enterable', 'grounded', 'navigable'],
    bounds: { x: spanX, y: wallHeight, z: spanZ, units: 'm' },
    architecture: {
      subtype: 'building',
      enterable: true,
      footprint: { spanX, spanZ },
      wallHeight,
      scaleMode: 'realistic',
      roof: {
        type: 'gable',
        ridgeAxis,
        rise,
        pitchDegrees: Math.atan2(rise, halfRun) * (180 / Math.PI),
        overhang,
        closedEnds: true,
      },
      portal: {
        width: ridgeAxis === 'x' ? 1.1 : 1.2,
        height: ridgeAxis === 'x' ? 2.1 : 2.2,
        depth: 0.15,
      },
    },
  });
}

describe('ARCH-017 historical executable roof fixtures', () => {
  for (const fixture of [
    {
      name: 'ridge +X',
      code: ARCHITECTURE_RIDGE_X_SCAFFOLD,
      intent: architectureIntent('x', 8, 6, 3, 1.6, 0.4),
    },
    {
      name: 'ridge +Z',
      code: ARCHITECTURE_RIDGE_Z_SCAFFOLD,
      intent: architectureIntent('z', 7, 10, 3.2, 1.8, 0.45),
    },
  ]) {
    test(`${fixture.name} compiles, renders, and passes exact architecture QA`, async () => {
      const rendered = await renderGLB(fixture.code, {
        requirements: bindLegacyFixtureRequirements(fixture.intent),
      });
      expect(rendered.glb.subarray(0, 4).toString()).toBe('glTF');
      const report = rendered.meta.qaReport as AssetRequirementsQaReportV2;
      expect(report.rules.find((rule) => rule.id === 'ARCHITECTURE_PROFILE')?.status).toBe(
        'evaluated',
      );
      expect(report.dimensions.exportIntegrity.status).toBe('pass');
      // Historical briefs include obligations beyond the measured roof checks.
      expect(report.acceptance).toBe('incomplete');
      expect(report.dimensions.exportIntegrity.metrics?.['gltfErrors']).toBe(0);
      const canonicalFindings = Object.values(report.dimensions)
        .flatMap((dimension) => dimension.findings)
        .filter((finding) => CANONICAL_ARCHITECTURE_CODES.has(finding.code));
      expect(canonicalFindings).toEqual([]);
    });
  }
});

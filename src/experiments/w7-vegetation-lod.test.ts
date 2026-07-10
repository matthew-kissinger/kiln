import { describe, expect, test } from 'bun:test';

import { runW7VegetationLodExperiment, w7VegetationLodReportSha256 } from './w7-vegetation-lod';

describe('VEG-020 independent semantic LOD parity/cost gate', () => {
  test('closes when metadata is stripped and hidden alternates still render for default consumers', async () => {
    const first = await runW7VegetationLodExperiment();
    const repeat = await runW7VegetationLodExperiment();
    expect(first.providerCalls).toBe(0);
    expect(first.externalSpendUsd).toBe(0);
    expect(first.gate).toMatchObject({
      validatorClean: true,
      byteStable: true,
      metadataRoundTripWhenVisible: false,
      defaultConsumerSingleActiveLod: false,
      hiddenAlternatesSurviveExport: true,
      hiddenAlternatesRemainInactive: false,
      passed: false,
      disposition: 'DONE_GATE_CLOSED',
    });
    expect(first.defaultVisibleCandidate.recordedGroupIds).toEqual([]);
    expect(first.defaultVisibleCandidate.presentGroupIds).toEqual([]);
    expect(first.defaultVisibleCandidate.roundTripTriangles).toBeGreaterThan(
      first.baseline.roundTripTriangles,
    );
    expect(first.hiddenAlternateCandidate.recordedGroupIds).toEqual([]);
    expect(first.hiddenAlternateCandidate.presentGroupIds).toEqual([]);
    expect(first.hiddenAlternateCandidate.metadataTargetsComplete).toBe(false);
    expect(first.ratios.hiddenTrianglesToBaseline).toBeGreaterThan(1);
    expect(w7VegetationLodReportSha256(first)).toBe(w7VegetationLodReportSha256(repeat));
  }, 30_000);
});

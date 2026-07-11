import { describe, expect, test } from 'bun:test';
import type * as THREE from 'three';

import { renderSceneToGLB } from '../render';
import { W1_KNOWN_BAD_CORPUS, type CorpusFixturePayload } from './corpus';
import { validateFinalGlbBytes } from './gltf';
import { inspectSceneMaterials } from './material';
import { gltfReportFindings } from './run';

const buildById = async (id: string): Promise<CorpusFixturePayload> => {
  const fixture = W1_KNOWN_BAD_CORPUS.find((candidate) => candidate.id === id);
  if (!fixture) throw new Error(`Missing fixture ${id}`);
  return fixture.build();
};

describe('W1 known-bad executable corpus', () => {
  test('every failure has one reciprocal valid control and stable expected codes', () => {
    const byId = new Map(W1_KNOWN_BAD_CORPUS.map((fixture) => [fixture.id, fixture]));
    const failures = W1_KNOWN_BAD_CORPUS.filter((fixture) => fixture.kind === 'failure');
    expect(failures).toHaveLength(8);

    for (const failure of failures) {
      const control = byId.get(failure.pairId);
      expect(failure.implementation).toBe('active');
      expect(control?.implementation).toBe('active');
      expect(control?.kind).toBe('control');
      expect(control?.pairId).toBe(failure.id);
      expect(control?.expectedCodes).toEqual([]);
      expect(failure.expectedCodes.length).toBeGreaterThan(0);
      for (const code of failure.expectedCodes) expect(code).toMatch(/^[A-Z][A-Z0-9_]*$/);
    }
  });

  test('reserves the complete requested W1 failure surface', () => {
    expect(
      W1_KNOWN_BAD_CORPUS.filter((fixture) => fixture.kind === 'failure').map(
        (fixture) => fixture.id,
      ),
    ).toEqual([
      'invalid-glb',
      'floating-part',
      'sideways-vehicle',
      'inverted-limb',
      'open-gable',
      'rotated-roof-panels',
      'wheel-chassis-penetration',
      'bad-foliage-card',
    ]);
  });

  test('executes every builder into finite renderable geometry or concrete GLB bytes', async () => {
    for (const fixture of W1_KNOWN_BAD_CORPUS) {
      const payload = await fixture.build();
      expect(payload.intent.category).toBe(fixture.category);
      expect(Object.keys(payload.measurements).length).toBeGreaterThan(0);
      if (payload.kind === 'glb') {
        expect(payload.glbBytes.byteLength).toBeGreaterThan(0);
        const report = await validateFinalGlbBytes(payload.glbBytes, `${fixture.id}.glb`);
        expect(report.issues.numErrors > 0).toBe(fixture.kind === 'failure');
        if (fixture.kind === 'failure') {
          expect(
            gltfReportFindings(report, payload.intent.qaProfile).map((finding) => finding.code),
          ).toEqual([...fixture.expectedCodes]);
        }
        continue;
      }

      let renderableCount = 0;
      let allFinite = true;
      payload.scene.traverse((node) => {
        const mesh = node as THREE.Mesh;
        if (!mesh.isMesh) return;
        const position = mesh.geometry.getAttribute('position');
        if (!position || position.count === 0) return;
        renderableCount++;
        for (const value of position.array) {
          if (!Number.isFinite(value)) allFinite = false;
        }
      });
      expect(renderableCount).toBeGreaterThan(0);
      expect(allFinite).toBe(true);
    }
  });

  test('valid control scenes serialize to Khronos-clean GLBs', async () => {
    for (const fixture of W1_KNOWN_BAD_CORPUS.filter((candidate) => candidate.kind === 'control')) {
      const payload = await fixture.build();
      if (payload.kind !== 'scene') continue;
      const rendered = await renderSceneToGLB(payload.scene, { intent: payload.intent });
      expect(rendered.gltfValidation.issues.numErrors).toBe(0);
    }
  });

  test('pairs encode reciprocal measured states, including active foliage QA', async () => {
    expect((await buildById('floating-part')).measurements['contactGapMeters']).toBeGreaterThan(0);
    expect((await buildById('attached-part-control')).measurements['contactGapMeters']).toBe(0);
    expect((await buildById('sideways-vehicle')).measurements['dominantLengthAxis']).toBe('z');
    expect((await buildById('forward-vehicle-control')).measurements['dominantLengthAxis']).toBe(
      'x',
    );
    expect((await buildById('inverted-limb')).measurements['jointOrder']).toBe(
      'Joint_Hip>Joint_Ankle>Joint_Knee',
    );
    expect((await buildById('ordered-limb-control')).measurements['jointOrder']).toBe(
      'Joint_Hip>Joint_Knee>Joint_Ankle',
    );
    expect((await buildById('open-gable')).measurements['gableClosureCount']).toBe(1);
    expect((await buildById('closed-gable-control')).measurements['gableClosureCount']).toBe(2);
    expect((await buildById('rotated-roof-panels')).measurements['panelSpanAxis']).toBe('x');
    expect((await buildById('aligned-roof-panels-control')).measurements['panelSpanAxis']).toBe(
      'z',
    );
    expect(
      (await buildById('wheel-chassis-penetration')).measurements['wheelChassisOverlapMeters'],
    ).toBeGreaterThan(0);
    expect(
      (await buildById('wheel-clearance-control')).measurements['wheelChassisOverlapMeters'],
    ).toBe(0);

    const badFoliage = await buildById('bad-foliage-card');
    const validFoliage = await buildById('valid-foliage-card-control');
    if (badFoliage.kind !== 'scene' || validFoliage.kind !== 'scene') {
      throw new Error('Foliage corpus fixtures must be scenes.');
    }
    expect(
      inspectSceneMaterials({ intent: badFoliage.intent, scene: badFoliage.scene }).map(
        (finding) => finding.code,
      ),
    ).toContain('MAT_FOLIAGE_CARD_CONTRACT');
    expect(
      inspectSceneMaterials({ intent: validFoliage.intent, scene: validFoliage.scene }),
    ).toEqual([]);
  });
});

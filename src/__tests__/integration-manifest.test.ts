import { describe, expect, test } from 'bun:test';
import { WebIO } from '@gltf-transform/core';

import { createRoot, boxGeo, createPart, gameMaterial } from '../primitives';
import { composeSceneGLB, inspectGlbIntegration, renderSceneToGLB } from '../render';

describe('GLB integration contract', () => {
  test('writes an explicit default scene and returns a deterministic integration manifest', async () => {
    const root = createRoot('IntegrationProbe');
    createPart('OffsetBody', boxGeo(2, 4, 6), gameMaterial(0x445566), {
      position: [1, 2, -3],
      parent: root,
    });

    const rendered = await renderSceneToGLB(root, {
      sceneName: 'Integration Scene',
      role: 'prop',
    });
    const document = await new WebIO().readBinary(rendered.bytes);

    expect(document.getRoot().getDefaultScene()?.getName()).toBe('Integration Scene');
    expect(rendered.integrationManifest).toEqual(
      expect.objectContaining({
        schemaVersion: 'kiln.integration-manifest.v1',
        artifactSha256: expect.stringMatching(/^[a-f0-9]{64}$/),
        units: 'm',
        axes: { forward: '+X', up: '+Y', right: '+Z' },
        defaultScene: { index: 0, name: 'Integration Scene' },
        requestedRole: 'prop',
        visualQa: 'not_assessed',
      }),
    );
    expect(rendered.integrationManifest.bounds.min).toEqual([0, 0, -6]);
    expect(rendered.integrationManifest.bounds.max).toEqual([2, 4, 0]);
    expect(rendered.integrationManifest.bounds.size).toEqual([2, 4, 6]);
    expect(rendered.integrationManifest.ground.offsetToGround).toBeCloseTo(0, 8);
    expect(rendered.integrationManifest.ground.grounded).toBe(true);
    expect(rendered.integrationManifest.structuralQa.hasDefaultScene).toBe(true);
    expect(rendered.integrationManifest.structuralQa.finiteBounds).toBe(true);

    expect(await inspectGlbIntegration(rendered.bytes, { requestedRole: 'prop' })).toEqual(
      rendered.integrationManifest,
    );
  });

  test('reports the offset needed to ground a floating artifact', async () => {
    const root = createRoot('FloatingProbe');
    createPart('FloatingBody', boxGeo(1, 2, 1), gameMaterial(0x778899), {
      position: [0, 4, 0],
      parent: root,
    });

    const rendered = await renderSceneToGLB(root, { role: 'poi' });
    expect(rendered.integrationManifest.bounds.min[1]).toBeCloseTo(3, 8);
    expect(rendered.integrationManifest.ground.offsetToGround).toBeCloseTo(-3, 8);
    expect(rendered.integrationManifest.ground.grounded).toBe(false);
  });

  test('composed artifacts also declare their default scene', async () => {
    const root = createRoot('ComposeProbe');
    createPart('Body', boxGeo(1, 1, 1), gameMaterial(0x223344), { parent: root });
    const part = await renderSceneToGLB(root);
    const composed = await composeSceneGLB([
      {
        bytes: part.bytes,
        transform: { pos: [0, 0, 0], rotDeg: [0, 0, 0], scale: [1, 1, 1] },
      },
    ]);

    const document = await new WebIO().readBinary(composed.bytes);
    expect(document.getRoot().getDefaultScene()?.getName()).toBe('Scene');
  });
});

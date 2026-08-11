import { describe, expect, test } from 'bun:test';
import {
  DEFAULT_PRESENTATION_PARAMETERS_V1,
  canonicalPresentationDocumentV1Json,
  createDefaultPresentationDocumentV1,
  createDefaultPresentationParametersV1,
  parsePresentationDocumentV1,
  parsePresentationParametersV1,
} from './index';

const WORLD_SHA256 = `sha256:${'a'.repeat(64)}` as const;

describe('default PresentationDocumentV1', () => {
  test('owns one strict, bounded, ordered neutral inspection presentation', () => {
    const parameters = createDefaultPresentationParametersV1();

    expect(parameters).toEqual(DEFAULT_PRESENTATION_PARAMETERS_V1);
    expect(parameters).not.toBe(DEFAULT_PRESENTATION_PARAMETERS_V1);
    expect(parsePresentationParametersV1(parameters)).toEqual(parameters);
    expect(parameters).toMatchObject({
      schemaVersion: 'kiln.presentation.v1',
      grid: { columns: 3, rows: 1, cellWidth: 512, cellHeight: 512 },
      lightingPresetId: 'neutral-studio-v1',
      receiptPolicy: {
        requirePerCameraOutputSha256: true,
        requireOutputSetSha256: true,
      },
    });
    expect(parameters.cameras.map(({ id, cell }) => ({ id, cell }))).toEqual([
      { id: 'front-right', cell: { column: 0, row: 0 } },
      { id: 'front-left', cell: { column: 1, row: 0 } },
      { id: 'rear-overview', cell: { column: 2, row: 0 } },
    ]);
    expect(parameters.cameras).toHaveLength(3);
    expect(parameters.cameras.every((camera) => camera.aspect === 1)).toBe(true);
  });

  test('returns fresh parameters while the exported default remains deeply frozen', () => {
    expect(Object.isFrozen(DEFAULT_PRESENTATION_PARAMETERS_V1)).toBe(true);
    expect(Object.isFrozen(DEFAULT_PRESENTATION_PARAMETERS_V1.grid)).toBe(true);
    expect(Object.isFrozen(DEFAULT_PRESENTATION_PARAMETERS_V1.cameras)).toBe(true);
    expect(Object.isFrozen(DEFAULT_PRESENTATION_PARAMETERS_V1.cameras[0])).toBe(true);
    expect(Object.isFrozen(DEFAULT_PRESENTATION_PARAMETERS_V1.cameras[0]?.position)).toBe(true);

    const first = createDefaultPresentationParametersV1();
    first.cameras[0]!.position[0] = 999;
    const second = createDefaultPresentationParametersV1();
    expect(second.cameras[0]!.position[0]).not.toBe(999);
    expect(second).toEqual(DEFAULT_PRESENTATION_PARAMETERS_V1);
  });

  test('binds the canonical document to exact world or GLB bytes deterministically', () => {
    const worldA = createDefaultPresentationDocumentV1({
      kind: 'world',
      sha256: WORLD_SHA256,
    });
    const worldB = createDefaultPresentationDocumentV1({
      kind: 'world',
      sha256: WORLD_SHA256,
    });
    const glb = createDefaultPresentationDocumentV1({
      kind: 'glb',
      sha256: WORLD_SHA256,
    });

    expect(parsePresentationDocumentV1(worldA)).toEqual(worldA);
    expect(worldA).toEqual(worldB);
    expect(worldA).not.toBe(worldB);
    expect(worldA.artifactBinding).toEqual({ kind: 'world', sha256: WORLD_SHA256 });
    expect(glb.artifactBinding.kind).toBe('glb');
    expect(canonicalPresentationDocumentV1Json(worldA)).toBe(
      canonicalPresentationDocumentV1Json(worldB),
    );
  });

  test('rejects malformed artifact bindings at the factory boundary', () => {
    expect(() =>
      createDefaultPresentationDocumentV1({ kind: 'world', sha256: 'not-a-hash' }),
    ).toThrow();
    expect(() =>
      createDefaultPresentationDocumentV1({
        kind: 'world',
        sha256: WORLD_SHA256,
        path: '../escape.glb',
      }),
    ).toThrow();
  });
});

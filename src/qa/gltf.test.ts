import { describe, expect, test } from 'bun:test';

import { createAssetIntentV1 } from '../contracts';
import { appendFinalGltfQa, gltfReportFindings } from './run';
import { createAssetQaReportV1 } from './types';
import { validateFinalGlbBytes } from './gltf';

/**
 * A complete glTF document whose POSITION accessor declares 24 bytes of data
 * inside a 12-byte bufferView. This is more specific than a malformed-header
 * fixture: the container parses, then Khronos rejects the accessor contract.
 */
const INVALID_ACCESSOR_GLTF = new TextEncoder().encode(
  JSON.stringify({
    asset: { version: '2.0' },
    buffers: [
      {
        byteLength: 12,
        uri: 'data:application/octet-stream;base64,AAAAAAAAAAAAAAAA',
      },
    ],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 12, target: 34962 }],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 2,
        type: 'VEC3',
        min: [0, 0, 0],
        max: [1, 1, 1],
      },
    ],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    nodes: [{ mesh: 0 }],
    scenes: [{ nodes: [0] }],
    scene: 0,
  }),
);

describe('Khronos final-byte conformance fixtures', () => {
  test('ignores only exact KTX2 validator limitations on a required BasisU artifact', () => {
    const report = {
      issues: {
        numErrors: 0,
        numWarnings: 3,
        numInfos: 1,
        numHints: 0,
        messages: [
          {
            code: 'VALUE_NOT_IN_LIST',
            message: "Invalid value 'image/ktx2'. Valid values are ('image/jpeg', 'image/png').",
            severity: 1,
            pointer: '/images/0/mimeType',
          },
          {
            code: 'IMAGE_UNRECOGNIZED_FORMAT',
            message: 'Image format not recognized.',
            severity: 1,
            pointer: '/images/0',
          },
          {
            code: 'ACCESSOR_INVALID_FLOAT',
            message: 'Accessor contains an invalid float.',
            severity: 1,
            pointer: '/accessors/0',
          },
        ],
      },
      info: { extensionsRequired: ['KHR_texture_basisu'] },
    };

    expect(gltfReportFindings(report, 'prop.default')).toEqual([
      expect.objectContaining({ code: 'GLTF_ACCESSOR_INVALID_FLOAT', disposition: 'warn' }),
    ]);
    const intent = createAssetIntentV1({ category: 'prop' });
    const finalReport = appendFinalGltfQa(
      intent,
      createAssetQaReportV1(intent, { evaluatedDimensions: ['categoryReadiness'] }),
      report,
    );
    expect(finalReport.dimensions.exportIntegrity.metrics).toMatchObject({
      gltfErrors: 0,
      gltfWarnings: 1,
    });
  });

  test('does not suppress lookalike KTX2 warnings without the exact extension and pointers', () => {
    const base = {
      issues: {
        numErrors: 0,
        numWarnings: 2,
        numInfos: 0,
        numHints: 0,
        messages: [
          {
            code: 'VALUE_NOT_IN_LIST',
            message: "Invalid value 'image/ktx2'. Valid values are ('image/jpeg', 'image/png').",
            severity: 1,
            pointer: '/materials/0/mimeType',
          },
          {
            code: 'IMAGE_UNRECOGNIZED_FORMAT',
            message: 'Image format not recognized.',
            severity: 1,
            pointer: '/images/not-an-index',
          },
        ],
      },
      info: { extensionsRequired: ['KHR_texture_basisu'] },
    };
    expect(gltfReportFindings(base, 'prop.default')).toHaveLength(2);
    expect(gltfReportFindings({ ...base, info: {} }, 'prop.default')).toHaveLength(2);
  });

  test('localizes a parsed but out-of-bounds accessor as a deterministic blocker', async () => {
    const validation = await validateFinalGlbBytes(INVALID_ACCESSOR_GLTF, 'invalid-accessor.gltf');
    expect(validation.issues.numErrors).toBeGreaterThan(0);
    expect(validation.issues.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'ACCESSOR_TOO_LONG',
          severity: 0,
          pointer: '/accessors/0',
        }),
      ]),
    );

    const findings = gltfReportFindings(validation, 'universal');
    expect(findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'GLTF_ACCESSOR_TOO_LONG',
          disposition: 'block',
          affected: { nodePath: '/accessors/0' },
        }),
      ]),
    );

    const intent = createAssetIntentV1({ category: 'prop' });
    const finalReport = appendFinalGltfQa(
      intent,
      createAssetQaReportV1(intent, { evaluatedDimensions: ['categoryReadiness'] }),
      validation,
    );
    expect(finalReport.disposition).toBe('block');
  });
});

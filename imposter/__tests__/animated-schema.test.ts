/**
 * Animated imposter sidecar schema tests.
 */

import { describe, expect, test } from 'bun:test';

import {
  ANIMATED_IMPOSTER_KIND,
  ANIMATED_IMPOSTER_SCHEMA_VERSION,
  AnimatedImposterMetaSchema,
  type AnimatedImposterMeta,
} from '../animated-schema';

const VALID: AnimatedImposterMeta = {
  version: ANIMATED_IMPOSTER_SCHEMA_VERSION,
  kind: ANIMATED_IMPOSTER_KIND,
  source: {
    path: 'characters/nva.glb',
    bytes: 4_200_000,
    tris: 12_000,
    skinned: true,
    animationClips: ['CharacterArmature|Idle', 'CharacterArmature|Walk'],
  },
  bbox: {
    min: [-0.5, 0, -0.4],
    max: [0.5, 1.8, 0.4],
    worldSize: 1.8,
    yOffset: 0.9,
  },
  projection: 'orthographic',
  view: {
    layout: 'octahedral',
    directionEncoding: 'octahedral',
    grid: { x: 6, y: 6, count: 36 },
    tileSize: 96,
    framesPerClip: 8,
  },
  clips: [
    {
      target: 'idle',
      resolved: 'Idle',
      rawName: 'CharacterArmature|Idle',
      matchedBy: 'exact',
      frameCount: 8,
      durationSec: 1,
    },
    {
      target: 'walking',
      resolved: 'Walk',
      rawName: 'CharacterArmature|Walk',
      matchedBy: 'alias',
      frameCount: 8,
      durationSec: 1,
    },
  ],
  textures: {
    layout: 'array',
    color: {
      uri: 'nva-albedo.ktx2',
      format: 'r8-palette-index',
      width: 576,
      height: 576,
      layers: 16,
      bytes: 5_308_416,
      colorSpace: 'srgb',
    },
    palette: {
      uri: 'nva-palette.png',
      width: 128,
      rows: 1,
      bytes: 512,
    },
  },
  runtime: {
    renderer: 'webgl2',
    primitive: 'instanced-quad',
    material: 'ShaderMaterial',
    textureMode: 'data-array-texture',
    attributes: ['frameOffset', 'clip', 'variant', 'yaw', 'paletteRow'],
  },
  storage: {
    colorBytes: 5_308_416,
    paletteBytes: 512,
    totalRawBytes: 5_308_928,
    envelopeBytes: 31_457_280,
    fitsEnvelope: true,
  },
  validation: {
    warnings: [
      {
        code: 'ANIMATED_IMPOSTER_CLIP_FALLBACK',
        severity: 'warning',
        message: 'shoot used idle fallback in this debug bake',
      },
    ],
  },
};

describe('AnimatedImposterMetaSchema', () => {
  test('accepts the animated octahedral sidecar contract', () => {
    expect(AnimatedImposterMetaSchema.parse(VALID)).toEqual(VALID);
  });

  test('round-trips through JSON', () => {
    const decoded = AnimatedImposterMetaSchema.parse(JSON.parse(JSON.stringify(VALID)));
    expect(decoded).toEqual(VALID);
  });

  test('accepts source attachments for baked weapons', () => {
    const withAttachment = {
      ...VALID,
      source: {
        ...VALID.source,
        attachments: [
          {
            id: 'ak47',
            kind: 'weapon',
            sourcePath: 'tmp/weapon-rig-lab/weapons/ak47.glb',
            bytes: 67_588,
            hash: '1fab1876b236f1cf2c5759cb7e669c5badf7fc4195fd6640c35f46c515c43ce8',
          },
        ],
      },
    };
    expect(AnimatedImposterMetaSchema.parse(withAttachment).source.attachments?.[0]?.id).toBe('ak47');
  });

  test('rejects the static imposter kind', () => {
    const bad = { ...VALID, kind: 'imposter' };
    expect(() => AnimatedImposterMetaSchema.parse(bad)).toThrow();
  });

  test('rejects mismatched grid counts', () => {
    const bad = {
      ...VALID,
      view: {
        ...VALID.view,
        grid: { ...VALID.view.grid, count: 35 },
      },
    };
    expect(() => AnimatedImposterMetaSchema.parse(bad)).toThrow();
  });

  test('rejects color dimensions that do not match grid and tile size', () => {
    const bad = {
      ...VALID,
      textures: {
        ...VALID.textures,
        color: { ...VALID.textures.color, width: 512 },
      },
    };
    expect(() => AnimatedImposterMetaSchema.parse(bad)).toThrow();
  });

  test('rejects layer counts that do not match clip frames', () => {
    const bad = {
      ...VALID,
      textures: {
        ...VALID.textures,
        color: { ...VALID.textures.color, layers: 15 },
      },
    };
    expect(() => AnimatedImposterMetaSchema.parse(bad)).toThrow();
  });

  test('requires the WebGL runtime attributes needed by the first slice', () => {
    const bad = {
      ...VALID,
      runtime: {
        ...VALID.runtime,
        attributes: ['frameOffset', 'clip', 'variant', 'yaw'],
      },
    };
    expect(() => AnimatedImposterMetaSchema.parse(bad)).toThrow();
  });

  test('keeps texture array and packed atlas runtime modes explicit', () => {
    const bad = {
      ...VALID,
      runtime: {
        ...VALID.runtime,
        textureMode: 'packed-2d-atlas',
      },
    };
    expect(() => AnimatedImposterMetaSchema.parse(bad)).toThrow();
  });

  test('accepts packed 2D atlas fallback dimensions', () => {
    const packed = {
      ...VALID,
      textures: {
        ...VALID.textures,
        layout: 'atlas',
        color: {
          ...VALID.textures.color,
          uri: 'nva-albedo-packed.png',
          width: 576 * 4,
          height: 576 * 4,
          framesX: 4,
          framesY: 4,
        },
      },
      runtime: {
        ...VALID.runtime,
        textureMode: 'packed-2d-atlas',
      },
    };
    expect(() => AnimatedImposterMetaSchema.parse(packed)).not.toThrow();
  });

  test('packed 2D atlas fallback requires frame grid metadata', () => {
    const bad = {
      ...VALID,
      textures: {
        ...VALID.textures,
        layout: 'atlas',
      },
      runtime: {
        ...VALID.runtime,
        textureMode: 'packed-2d-atlas',
      },
    };
    expect(() => AnimatedImposterMetaSchema.parse(bad)).toThrow();
  });
});

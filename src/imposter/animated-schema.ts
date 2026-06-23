/**
 * Animated octahedral imposter sidecar and pre-bake contract.
 *
 * Version 2 is intentionally separate from the static imposter v1 schema:
 * one array layer is one animation frame containing the full octahedral view grid.
 */

import { z } from 'zod';

export const ANIMATED_IMPOSTER_SCHEMA_VERSION = 2 as const;
export const ANIMATED_IMPOSTER_KIND = 'animated-octahedral-imposter' as const;
export const ANIMATED_IMPOSTER_DEFAULT_ENVELOPE_BYTES = 30 * 1024 * 1024;

export const AnimatedClipTargetSchema = z.enum(['idle', 'walking', 'running', 'shoot', 'death']);
export const AnimatedImposterTextureFormatSchema = z.enum(['r8-palette-index', 'rgba8']);
export const AnimatedImposterTextureLayoutSchema = z.enum(['array', 'atlas']);
export const AnimatedImposterTextureModeSchema = z.enum(['data-array-texture', 'packed-2d-atlas']);
export const AnimatedImposterRuntimeAttributeSchema = z.enum([
  'frameOffset',
  'clip',
  'variant',
  'yaw',
  'paletteRow',
  'lodAlpha',
]);

export const AnimatedImposterWarningSchema = z
  .object({
    code: z.string().min(1),
    severity: z.enum(['info', 'warning', 'error']),
    message: z.string().min(1),
    fixHint: z.string().min(1).optional(),
  })
  .strict();

const Vec3Schema = z.tuple([z.number(), z.number(), z.number()]);

const AnimatedAttachmentMetaSchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum(['weapon']),
    sourcePath: z.string().optional(),
    bytes: z.number().int().nonnegative(),
    hash: z.string().optional(),
  })
  .strict();

const AnimatedClipMetaSchema = z
  .object({
    target: AnimatedClipTargetSchema,
    resolved: z.string().nullable(),
    rawName: z.string().nullable(),
    matchedBy: z.enum(['exact', 'alias', 'fallback', 'missing']),
    fallbackFor: AnimatedClipTargetSchema.optional(),
    fallbackRawName: z.string().optional(),
    frameCount: z.number().int().nonnegative(),
    durationSec: z.number().positive().optional(),
  })
  .strict();

const AnimatedTextureLayerSchema = z
  .object({
    uri: z.string().min(1),
    format: AnimatedImposterTextureFormatSchema,
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    layers: z.number().int().positive(),
    framesX: z.number().int().positive().optional(),
    framesY: z.number().int().positive().optional(),
    bytes: z.number().int().nonnegative(),
    colorSpace: z.enum(['srgb', 'linear']),
  })
  .strict();

export const AnimatedImposterMetaSchema = z
  .object({
    version: z.literal(ANIMATED_IMPOSTER_SCHEMA_VERSION),
    kind: z.literal(ANIMATED_IMPOSTER_KIND),
    source: z
      .object({
        path: z.string().optional(),
        bytes: z.number().int().nonnegative(),
        tris: z.number().int().nonnegative(),
        skinned: z.boolean(),
        hash: z.string().optional(),
        animationClips: z.array(z.string()),
        attachments: z.array(AnimatedAttachmentMetaSchema).optional(),
      })
      .strict(),
    bbox: z
      .object({
        min: Vec3Schema,
        max: Vec3Schema,
        worldSize: z.number().positive(),
        yOffset: z.number(),
      })
      .strict(),
    projection: z.literal('orthographic'),
    view: z
      .object({
        layout: z.literal('octahedral'),
        directionEncoding: z.literal('octahedral'),
        grid: z
          .object({
            x: z.number().int().positive(),
            y: z.number().int().positive(),
            count: z.number().int().positive(),
          })
          .strict(),
        tileSize: z.number().int().positive(),
        framesPerClip: z.number().int().positive(),
      })
      .strict(),
    clips: z.array(AnimatedClipMetaSchema).min(1),
    textures: z
      .object({
        layout: AnimatedImposterTextureLayoutSchema,
        color: AnimatedTextureLayerSchema,
        palette: z
          .object({
            uri: z.string().min(1),
            width: z.number().int().positive(),
            rows: z.number().int().positive(),
            bytes: z.number().int().nonnegative(),
          })
          .strict()
          .optional(),
        normal: AnimatedTextureLayerSchema.optional(),
        depth: AnimatedTextureLayerSchema.optional(),
      })
      .strict(),
    runtime: z
      .object({
        renderer: z.literal('webgl2'),
        primitive: z.literal('instanced-quad'),
        material: z.literal('ShaderMaterial'),
        textureMode: AnimatedImposterTextureModeSchema,
        attributes: z.array(AnimatedImposterRuntimeAttributeSchema).min(1),
      })
      .strict(),
    storage: z
      .object({
        colorBytes: z.number().int().nonnegative(),
        normalBytes: z.number().int().nonnegative().optional(),
        depthBytes: z.number().int().nonnegative().optional(),
        paletteBytes: z.number().int().nonnegative().optional(),
        totalRawBytes: z.number().int().nonnegative(),
        envelopeBytes: z.number().int().positive(),
        fitsEnvelope: z.boolean(),
      })
      .strict(),
    validation: z
      .object({
        warnings: z.array(AnimatedImposterWarningSchema),
      })
      .strict(),
  })
  .strict()
  .superRefine((meta, ctx) => {
    const grid = meta.view.grid;
    if (grid.count !== grid.x * grid.y) {
      ctx.addIssue({
        code: 'custom',
        path: ['view', 'grid', 'count'],
        message: 'grid.count must equal grid.x * grid.y',
      });
    }

    const expectedLayerWidth = grid.x * meta.view.tileSize;
    const expectedLayerHeight = grid.y * meta.view.tileSize;

    const expectedLayers = meta.clips.reduce((sum, clip) => sum + clip.frameCount, 0);
    if (meta.textures.color.layers !== expectedLayers) {
      ctx.addIssue({
        code: 'custom',
        path: ['textures', 'color', 'layers'],
        message: 'color texture layers must equal the sum of clip frame counts',
      });
    }

    if (meta.textures.layout === 'array') {
      if (meta.textures.color.width !== expectedLayerWidth) {
        ctx.addIssue({
          code: 'custom',
          path: ['textures', 'color', 'width'],
          message: 'array color texture width must equal grid.x * tileSize',
        });
      }
      if (meta.textures.color.height !== expectedLayerHeight) {
        ctx.addIssue({
          code: 'custom',
          path: ['textures', 'color', 'height'],
          message: 'array color texture height must equal grid.y * tileSize',
        });
      }
      if (meta.textures.color.framesX !== undefined || meta.textures.color.framesY !== undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['textures', 'color'],
          message: 'array color textures must not set framesX or framesY',
        });
      }
    } else {
      const framesX = meta.textures.color.framesX;
      const framesY = meta.textures.color.framesY;
      if (framesX === undefined || framesY === undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['textures', 'color'],
          message: 'packed atlas color texture requires framesX and framesY',
        });
      } else {
        if (meta.textures.color.width !== expectedLayerWidth * framesX) {
          ctx.addIssue({
            code: 'custom',
            path: ['textures', 'color', 'width'],
            message: 'packed atlas color texture width must equal frameAtlasWidth * framesX',
          });
        }
        if (meta.textures.color.height !== expectedLayerHeight * framesY) {
          ctx.addIssue({
            code: 'custom',
            path: ['textures', 'color', 'height'],
            message: 'packed atlas color texture height must equal frameAtlasHeight * framesY',
          });
        }
        if (framesX * framesY < expectedLayers) {
          ctx.addIssue({
            code: 'custom',
            path: ['textures', 'color'],
            message: 'packed atlas frame grid must have capacity for every layer',
          });
        }
      }
    }

    const requiredAttributes = ['frameOffset', 'clip', 'variant', 'yaw', 'paletteRow'] as const;
    for (const attr of requiredAttributes) {
      if (!meta.runtime.attributes.includes(attr)) {
        ctx.addIssue({
          code: 'custom',
          path: ['runtime', 'attributes'],
          message: `runtime.attributes must include ${attr}`,
        });
      }
    }

    if (meta.runtime.textureMode === 'data-array-texture' && meta.textures.layout !== 'array') {
      ctx.addIssue({
        code: 'custom',
        path: ['runtime', 'textureMode'],
        message: 'data-array-texture runtime mode requires textures.layout=array',
      });
    }
    if (meta.runtime.textureMode === 'packed-2d-atlas' && meta.textures.layout !== 'atlas') {
      ctx.addIssue({
        code: 'custom',
        path: ['runtime', 'textureMode'],
        message: 'packed-2d-atlas runtime mode requires textures.layout=atlas',
      });
    }

    const expectedTotal =
      meta.storage.colorBytes +
      (meta.storage.normalBytes ?? 0) +
      (meta.storage.depthBytes ?? 0) +
      (meta.storage.paletteBytes ?? 0);
    if (meta.storage.totalRawBytes !== expectedTotal) {
      ctx.addIssue({
        code: 'custom',
        path: ['storage', 'totalRawBytes'],
        message: 'storage.totalRawBytes must equal the sum of texture and palette bytes',
      });
    }
    if (meta.storage.fitsEnvelope !== meta.storage.totalRawBytes <= meta.storage.envelopeBytes) {
      ctx.addIssue({
        code: 'custom',
        path: ['storage', 'fitsEnvelope'],
        message: 'storage.fitsEnvelope must match totalRawBytes <= envelopeBytes',
      });
    }
  });

export const AnimatedImposterPreBakeInputSchema = z
  .object({
    source: z
      .object({
        path: z.string().optional(),
        bytes: z.number().int().nonnegative(),
        tris: z.number().int().nonnegative(),
        skinned: z.boolean(),
        clipNames: z.array(z.string()),
        manifest: z
          .object({
            path: z.string().optional(),
            expectedBytes: z.number().int().nonnegative().optional(),
            actualBytes: z.number().int().nonnegative().optional(),
            expectedHash: z.string().optional(),
            actualHash: z.string().optional(),
          })
          .strict()
          .optional(),
      })
      .strict(),
    clipTargets: z.array(AnimatedClipTargetSchema).min(1),
    clipFallbacks: z
      .array(
        z
          .object({
            target: AnimatedClipTargetSchema,
            donor: AnimatedClipTargetSchema.optional(),
            rawName: z.string().min(1).optional(),
          })
          .strict()
          .refine((value) => Boolean(value.donor) !== Boolean(value.rawName), {
            message: 'clip fallback must set exactly one of donor or rawName',
          }),
      )
      .default([]),
    viewGrid: z
      .object({
        x: z.number().int().positive(),
        y: z.number().int().positive(),
      })
      .strict(),
    tileSize: z.number().int().positive(),
    framesPerClip: z.number().int().positive(),
    textureFormat: AnimatedImposterTextureFormatSchema.default('r8-palette-index'),
    textureLayout: AnimatedImposterTextureLayoutSchema.default('array'),
    includeNormal: z.boolean().default(false),
    includeDepth: z.boolean().default(false),
    paletteWidth: z.number().int().positive().default(128),
    paletteRows: z.number().int().positive().default(1),
    envelopeBytes: z.number().int().positive().default(ANIMATED_IMPOSTER_DEFAULT_ENVELOPE_BYTES),
  })
  .strict();

export type AnimatedClipTarget = z.infer<typeof AnimatedClipTargetSchema>;
export type AnimatedImposterTextureFormat = z.infer<typeof AnimatedImposterTextureFormatSchema>;
export type AnimatedImposterTextureLayout = z.infer<typeof AnimatedImposterTextureLayoutSchema>;
export type AnimatedImposterTextureMode = z.infer<typeof AnimatedImposterTextureModeSchema>;
export type AnimatedImposterRuntimeAttribute = z.infer<typeof AnimatedImposterRuntimeAttributeSchema>;
export type AnimatedImposterWarning = z.infer<typeof AnimatedImposterWarningSchema>;
export type AnimatedImposterMeta = z.infer<typeof AnimatedImposterMetaSchema>;
export type AnimatedImposterPreBakeInput = z.input<typeof AnimatedImposterPreBakeInputSchema>;
export type AnimatedImposterPreBakeConfig = z.output<typeof AnimatedImposterPreBakeInputSchema>;

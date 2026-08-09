/** Zod authoring schema around the dependency-free canonical terrain runtime. */
import { z } from 'zod';
import { HEIGHTFIELD_ARTIFACT_V1_SCHEMA_VERSION } from './terrain-runtime';

const finite = z.number().finite();
const vec2 = z.tuple([finite, finite]);
const positiveVec2 = z.tuple([finite.positive(), finite.positive()]);

export const TerrainStampV1Schema = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.enum(['road', 'path']),
      points: z.array(vec2).min(2).max(128),
      halfWidth: finite.positive(),
      targetHeight: finite,
    })
    .strict(),
  z
    .object({
      kind: z.literal('pad'),
      center: vec2,
      halfExtents: positiveVec2,
      targetHeight: finite,
    })
    .strict(),
]);

export const HeightfieldArtifactV1Schema = z
  .object({
    schemaVersion: z.literal(HEIGHTFIELD_ARTIFACT_V1_SCHEMA_VERSION),
    seed: z.number().int().safe(),
    origin: vec2,
    cellSize: finite.positive(),
    width: z.number().int().min(2).max(257),
    height: z.number().int().min(2).max(257),
    baseHeight: finite,
    amplitude: finite.nonnegative(),
    frequency: finite.positive(),
    stamps: z.array(TerrainStampV1Schema).max(64),
    heights: z.array(finite).max(257 * 257),
  })
  .strict()
  .superRefine((artifact, ctx) => {
    if (artifact.heights.length !== artifact.width * artifact.height) {
      ctx.addIssue({
        code: 'custom',
        path: ['heights'],
        message: `expected ${artifact.width * artifact.height} row-major samples`,
      });
    }
  });

export * from './terrain-runtime';

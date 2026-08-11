import { z } from 'zod';
import { worldAabbFromLocal, type Aabb, type Vec3 } from './overlap';
import {
  assertNoPrototypeKeys,
  canonicalContractJson,
  sha256ContractBytes,
} from './contract-utils';

export const COLLIDER_POLICY_V1_SCHEMA_VERSION = 'kiln.collider-policy.v1' as const;
export const COLLIDER_ARTIFACT_V1_SCHEMA_VERSION = 'kiln.collider-artifact.v1' as const;

const finite = z.number().finite();
const vec3 = z.tuple([finite, finite, finite]);
const sha256 = z.string().regex(/^sha256:[0-9a-f]{64}$/);
const id = z
  .string()
  .min(1)
  .max(256)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/);
const bounds = z
  .object({ min: vec3, max: vec3 })
  .strict()
  .superRefine((value, ctx) => {
    for (let axis = 0; axis < 3; axis++) {
      if (value.min[axis]! > value.max[axis]!) {
        ctx.addIssue({ code: 'custom', path: ['min', axis], message: 'min must not exceed max' });
      }
    }
  });

const policyCommon = {
  transformFrame: z.literal('asset-local'),
};

export const ColliderPolicyV1Schema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('none'), ...policyCommon }).strict(),
  z.object({ kind: z.literal('bounds'), ...policyCommon }).strict(),
  z
    .object({
      kind: z.literal('authored-submesh'),
      ...policyCommon,
      nodeNames: z.array(id).min(1).max(64),
    })
    .strict()
    .superRefine((value, ctx) => {
      if (new Set(value.nodeNames).size !== value.nodeNames.length) {
        ctx.addIssue({ code: 'custom', path: ['nodeNames'], message: 'nodeNames must be unique' });
      }
    }),
  z
    .object({
      kind: z.literal('generated-mesh'),
      ...policyCommon,
      method: z.literal('bounds-box'),
    })
    .strict(),
]);

const primitive = z
  .object({
    nodeName: id,
    positions: z.array(finite).max(196_608),
    indices: z.array(z.number().int().nonnegative()).max(196_608),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.positions.length < 9 || value.positions.length % 3 !== 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['positions'],
        message: 'positions must contain 3D vertices',
      });
    }
    if (value.indices.length < 3 || value.indices.length % 3 !== 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['indices'],
        message: 'indices must contain triangles',
      });
    }
    const vertexCount = value.positions.length / 3;
    if (value.indices.some((index) => index >= vertexCount)) {
      ctx.addIssue({ code: 'custom', path: ['indices'], message: 'index exceeds vertex count' });
    }
  });

export const ColliderArtifactV1Schema = z
  .object({
    schemaVersion: z.literal(COLLIDER_ARTIFACT_V1_SCHEMA_VERSION),
    transformFrame: z.literal('asset-local'),
    sourceArtifactSha256: sha256,
    policy: ColliderPolicyV1Schema,
    bounds,
    primitives: z.array(primitive).max(64),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (new Set(value.primitives.map((entry) => entry.nodeName)).size !== value.primitives.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['primitives'],
        message: 'primitive nodeName must be unique',
      });
    }
    if (value.policy.kind === 'none' && value.primitives.length !== 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['primitives'],
        message: 'none policy has no primitives',
      });
    }
    if (value.policy.kind !== 'none' && value.primitives.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['primitives'],
        message: 'collider policy requires geometry',
      });
    }
    if (value.primitives.length) {
      const derived = boundsOfPrimitives(value.primitives);
      if (
        derived.min.some((entry, axis) => entry !== value.bounds.min[axis]) ||
        derived.max.some((entry, axis) => entry !== value.bounds.max[axis])
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['bounds'],
          message: 'bounds must exactly enclose collider vertices',
        });
      }
    }
  });

export type ColliderPolicyV1 = z.infer<typeof ColliderPolicyV1Schema>;
export type ColliderArtifactV1 = z.infer<typeof ColliderArtifactV1Schema>;

export interface AuthoredColliderSubmeshV1 {
  nodeName: string;
  positions: readonly number[];
  indices: readonly number[];
}

export interface CompileColliderArtifactV1Input {
  sourceArtifactSha256: `sha256:${string}`;
  bounds: Aabb;
  authoredSubmeshes?: readonly AuthoredColliderSubmeshV1[];
}

export class ColliderCompileError extends Error {
  constructor(
    readonly code:
      | 'COLLIDER_AUTHORED_SUBMESH_MISSING'
      | 'COLLIDER_AUTHORED_SUBMESH_INVALID'
      | 'COLLIDER_BUDGET_EXCEEDED',
    message: string,
  ) {
    super(`${code}: ${message}`);
    this.name = 'ColliderCompileError';
  }
}

export function parseColliderPolicyV1(input: unknown): ColliderPolicyV1 {
  assertNoPrototypeKeys(input);
  return ColliderPolicyV1Schema.parse(input);
}

export function parseColliderArtifactV1(input: unknown): ColliderArtifactV1 {
  assertNoPrototypeKeys(input);
  return ColliderArtifactV1Schema.parse(input);
}

function boxPrimitive(value: Aabb) {
  const [x0, y0, z0] = value.min;
  const [x1, y1, z1] = value.max;
  return {
    nodeName: 'generated:bounds-box',
    positions: [
      x0,
      y0,
      z0,
      x1,
      y0,
      z0,
      x1,
      y1,
      z0,
      x0,
      y1,
      z0,
      x0,
      y0,
      z1,
      x1,
      y0,
      z1,
      x1,
      y1,
      z1,
      x0,
      y1,
      z1,
    ],
    indices: [
      0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 3, 7, 6, 3, 6, 2, 0, 4, 7, 0, 7, 3, 1,
      2, 6, 1, 6, 5,
    ],
  };
}

function boundsOfPrimitives(primitives: readonly { positions: readonly number[] }[]): Aabb {
  const min: Vec3 = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
  const max: Vec3 = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];
  for (const primitive of primitives) {
    for (let offset = 0; offset < primitive.positions.length; offset += 3) {
      for (let axis = 0; axis < 3; axis++) {
        min[axis] = Math.min(min[axis]!, primitive.positions[offset + axis]!);
        max[axis] = Math.max(max[axis]!, primitive.positions[offset + axis]!);
      }
    }
  }
  return { min, max };
}

export function compileColliderArtifactV1(
  policyInput: unknown,
  input: CompileColliderArtifactV1Input,
): ColliderArtifactV1 {
  const policy = parseColliderPolicyV1(policyInput);
  const parsedBounds = bounds.parse(input.bounds);
  const sourceArtifactSha256 = sha256.parse(input.sourceArtifactSha256);
  let primitives: Array<{ nodeName: string; positions: number[]; indices: number[] }> = [];
  if (policy.kind === 'bounds' || policy.kind === 'generated-mesh') {
    primitives = [boxPrimitive(parsedBounds)];
  } else if (policy.kind === 'authored-submesh') {
    const available = new Map(
      (input.authoredSubmeshes ?? []).map((entry) => [entry.nodeName, entry]),
    );
    const missing = policy.nodeNames.filter((nodeName) => !available.has(nodeName));
    if (missing.length) {
      throw new ColliderCompileError(
        'COLLIDER_AUTHORED_SUBMESH_MISSING',
        `missing authored collider node(s): ${missing.join(', ')}`,
      );
    }
    try {
      primitives = [...policy.nodeNames].sort().map((nodeName) => {
        const source = available.get(nodeName)!;
        return primitive.parse({
          nodeName,
          positions: [...source.positions],
          indices: [...source.indices],
        });
      });
    } catch (error) {
      throw new ColliderCompileError(
        'COLLIDER_AUTHORED_SUBMESH_INVALID',
        error instanceof Error ? error.message : String(error),
      );
    }
  }
  const vertexCount = primitives.reduce((sum, entry) => sum + entry.positions.length / 3, 0);
  const triangleCount = primitives.reduce((sum, entry) => sum + entry.indices.length / 3, 0);
  if (vertexCount > 65_536 || triangleCount > 65_536) {
    throw new ColliderCompileError(
      'COLLIDER_BUDGET_EXCEEDED',
      'collider exceeds 65,536 vertices/triangles',
    );
  }
  const artifactBounds = primitives.length ? boundsOfPrimitives(primitives) : parsedBounds;
  return parseColliderArtifactV1({
    schemaVersion: COLLIDER_ARTIFACT_V1_SCHEMA_VERSION,
    transformFrame: 'asset-local',
    sourceArtifactSha256,
    policy,
    bounds: artifactBounds,
    primitives,
  });
}

export function canonicalColliderArtifactV1Json(input: unknown): string {
  return canonicalContractJson(parseColliderArtifactV1(input));
}

export function encodeColliderArtifactV1(input: unknown): Uint8Array {
  return new TextEncoder().encode(canonicalColliderArtifactV1Json(input));
}

export function decodeColliderArtifactV1(bytes: Uint8Array): ColliderArtifactV1 {
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  const artifact = parseColliderArtifactV1(JSON.parse(text));
  if (canonicalColliderArtifactV1Json(artifact) !== text) {
    throw new TypeError('collider artifact bytes are not canonical');
  }
  return artifact;
}

export function hashColliderArtifactV1(input: unknown): Promise<`sha256:${string}`> {
  return sha256ContractBytes(encodeColliderArtifactV1(input));
}

export interface ColliderWorldTransformV1 {
  position: Vec3;
  rotationYDeg: number;
  uniformScale: number;
}

export function worldColliderAabbV1(input: unknown, transform: ColliderWorldTransformV1): Aabb {
  const artifact = parseColliderArtifactV1(input);
  if (
    !Number.isFinite(transform.rotationYDeg) ||
    !Number.isFinite(transform.uniformScale) ||
    transform.uniformScale <= 0
  ) {
    throw new TypeError('collider transform must have finite rotation and positive scale');
  }
  if (
    transform.position.length !== 3 ||
    transform.position.some((entry) => !Number.isFinite(entry))
  ) {
    throw new TypeError('collider transform position must be finite');
  }
  return worldAabbFromLocal(
    artifact.bounds.min,
    artifact.bounds.max,
    transform.position,
    transform.rotationYDeg,
    transform.uniformScale,
  );
}

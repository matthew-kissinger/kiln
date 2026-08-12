import { z } from 'zod';
import {
  hashHeightfieldArtifactV1,
  heightfieldGround,
  type HeightfieldArtifactV1,
} from './terrain';
import {
  hashColliderArtifactV1,
  parseColliderArtifactV1,
  worldColliderAabbV1,
  type ColliderArtifactV1,
} from './collision';
import { worldAabbFromLocal, type Aabb } from './overlap';
import { canonicalContractJson, assertNoPrototypeKeys, sha256ContractJson } from './contract-utils';
import { hashWorldDocumentV2, parseWorldDocumentV2, type WorldDocumentV2 } from './world-document';

export const REACHABILITY_DOCUMENT_V1_SCHEMA_VERSION = 'kiln.reachability.v1' as const;
export const REACHABILITY_REPORT_V1_SCHEMA_VERSION = 'kiln.reachability-report.v1' as const;

const finite = z.number().finite();
const vec2 = z.tuple([finite, finite]);
const id = z.string().min(1).max(256);
const endpoint = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('spawn'), id }).strict(),
  z.object({ kind: z.literal('socket'), id }).strict(),
  z.object({ kind: z.literal('point'), position: z.tuple([finite, finite, finite]) }).strict(),
]);

export const ReachabilityDocumentV1Schema = z
  .object({
    schemaVersion: z.literal(REACHABILITY_DOCUMENT_V1_SCHEMA_VERSION),
    grid: z
      .object({
        origin: vec2,
        cellSize: finite.positive(),
        width: z.number().int().min(2).max(512),
        height: z.number().int().min(2).max(512),
      })
      .strict(),
    agent: z
      .object({
        radius: finite.nonnegative().max(100),
        maxStepHeight: finite.nonnegative().max(100),
        maxSlopeDeg: finite.min(0).max(89.9),
      })
      .strict(),
    budget: z
      .object({
        maxVisitedCells: z.number().int().min(1).max(262_144),
        maxColliderTests: z.number().int().min(1).max(10_000_000),
      })
      .strict(),
    criticalPaths: z
      .array(z.object({ id, from: endpoint, to: endpoint }).strict())
      .min(1)
      .max(32),
  })
  .strict()
  .superRefine((document, ctx) => {
    if (document.grid.width * document.grid.height > 262_144) {
      ctx.addIssue({ code: 'custom', path: ['grid'], message: 'grid exceeds 262,144 cells' });
    }
    if (
      new Set(document.criticalPaths.map((path) => path.id)).size !== document.criticalPaths.length
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['criticalPaths'],
        message: 'critical path ids must be unique',
      });
    }
  });

export type ReachabilityDocumentV1 = z.infer<typeof ReachabilityDocumentV1Schema>;

export type ReachabilityIssueCodeV1 =
  | 'ENDPOINT_UNKNOWN'
  | 'ENDPOINT_OUTSIDE_GRID'
  | 'ENDPOINT_BLOCKED'
  | 'PATH_UNREACHABLE'
  | 'VISIT_BUDGET_EXCEEDED'
  | 'COLLIDER_TEST_BUDGET_EXCEEDED'
  | 'COLLIDER_ARTIFACT_REQUIRED'
  | 'COLLIDER_ARTIFACT_HASH_MISMATCH'
  | 'TERRAIN_ARTIFACT_REQUIRED'
  | 'TERRAIN_ARTIFACT_HASH_MISMATCH';

export interface ReachabilityIssueV1 {
  code: ReachabilityIssueCodeV1;
  message: string;
  pathId?: string;
  endpoint?: 'from' | 'to';
  objectId?: string;
}

export interface ReachabilityPathResultV1 {
  id: string;
  status: 'reachable' | 'blocked' | 'unreachable' | 'budget-exceeded';
  cells: Array<[number, number]>;
  visitedCells: number;
}

export interface ReachabilityReportV1 {
  schemaVersion: typeof REACHABILITY_REPORT_V1_SCHEMA_VERSION;
  worldSha256: `sha256:${string}`;
  requestSha256: `sha256:${string}`;
  valid: boolean;
  visitedCells: number;
  colliderTests: number;
  paths: ReachabilityPathResultV1[];
  issues: ReachabilityIssueV1[];
}

export interface ReachabilityArtifactsV1 {
  collidersByRefId?: Readonly<Record<string, ColliderArtifactV1>>;
  heightfield?: HeightfieldArtifactV1;
}

export function parseReachabilityDocumentV1(input: unknown): ReachabilityDocumentV1 {
  assertNoPrototypeKeys(input);
  return ReachabilityDocumentV1Schema.parse(input);
}

export function canonicalReachabilityDocumentV1Json(input: unknown): string {
  return canonicalContractJson(parseReachabilityDocumentV1(input));
}

interface ResolvedEndpoint {
  position: [number, number, number];
  clearanceRadius: number;
}

function resolveEndpoint(
  world: WorldDocumentV2,
  value: ReachabilityDocumentV1['criticalPaths'][number]['from'],
): ResolvedEndpoint | undefined {
  if (value.kind === 'point') return { position: [...value.position], clearanceRadius: 0 };
  if (value.kind === 'spawn') {
    const spawn = world.spawns.find((entry) => entry.id === value.id);
    return spawn
      ? { position: [...spawn.position], clearanceRadius: spawn.clearanceRadius }
      : undefined;
  }
  const socket = world.authored.sockets.find((entry) => entry.id === value.id);
  return socket
    ? { position: [...socket.position], clearanceRadius: socket.clearanceRadius ?? 0 }
    : undefined;
}

function circleIntersectsAabb(x: number, z: number, radius: number, box: Aabb): boolean {
  const nearestX = Math.max(box.min[0], Math.min(x, box.max[0]));
  const nearestZ = Math.max(box.min[2], Math.min(z, box.max[2]));
  return Math.hypot(x - nearestX, z - nearestZ) <= radius;
}

async function resolveColliders(
  world: WorldDocumentV2,
  artifacts: ReachabilityArtifactsV1,
  issues: ReachabilityIssueV1[],
): Promise<Aabb[]> {
  const assets = new Map(world.assets.map((asset) => [asset.refId, asset]));
  const collisionRefs = new Map(world.collisionArtifacts.map((entry) => [entry.refId, entry]));
  const boxes: Aabb[] = [];
  for (const object of world.objects) {
    if (object.collision?.policy === 'none') continue;
    if (object.collision?.policy === 'artifact') {
      const ref = collisionRefs.get(object.collision.artifactRefId)!;
      const supplied = artifacts.collidersByRefId?.[ref.refId];
      if (!supplied) {
        issues.push({
          code: 'COLLIDER_ARTIFACT_REQUIRED',
          message: `collider artifact "${ref.refId}" is required`,
          objectId: object.id,
        });
        continue;
      }
      const artifact = parseColliderArtifactV1(supplied);
      const actualHash = await hashColliderArtifactV1(artifact);
      if (actualHash !== `sha256:${ref.artifact.sha256}`) {
        issues.push({
          code: 'COLLIDER_ARTIFACT_HASH_MISMATCH',
          message: `collider artifact "${ref.refId}" hash mismatch`,
          objectId: object.id,
        });
        continue;
      }
      boxes.push(worldColliderAabbV1(artifact, object.transform));
      continue;
    }
    const asset = assets.get(object.assetRefId)!;
    boxes.push(
      worldAabbFromLocal(
        asset.bounds.min,
        asset.bounds.max,
        object.transform.position,
        object.transform.rotationYDeg,
        object.transform.uniformScale,
      ),
    );
  }
  return boxes;
}

function cellOf(
  position: readonly number[],
  document: ReachabilityDocumentV1,
): [number, number] | undefined {
  const column = Math.round((position[0]! - document.grid.origin[0]) / document.grid.cellSize);
  const row = Math.round((position[2]! - document.grid.origin[1]) / document.grid.cellSize);
  return column >= 0 && row >= 0 && column < document.grid.width && row < document.grid.height
    ? [column, row]
    : undefined;
}

function cellPosition(cell: [number, number], document: ReachabilityDocumentV1): [number, number] {
  return [
    document.grid.origin[0] + cell[0] * document.grid.cellSize,
    document.grid.origin[1] + cell[1] * document.grid.cellSize,
  ];
}

export async function validateWorldReachabilityV1(
  worldInput: unknown,
  documentInput: unknown,
  artifacts: ReachabilityArtifactsV1 = {},
): Promise<ReachabilityReportV1> {
  const world = parseWorldDocumentV2(worldInput);
  const document = parseReachabilityDocumentV1(documentInput);
  const issues: ReachabilityIssueV1[] = [];
  const boxes = await resolveColliders(world, artifacts, issues);
  let terrainHeight = (_x: number, _z: number): number =>
    world.terrain.kind === 'flat' ? world.terrain.height : 0;
  let terrainNormalY = (_x: number, _z: number): number => 1;
  if (world.terrain.kind === 'heightfield') {
    if (!artifacts.heightfield) {
      issues.push({
        code: 'TERRAIN_ARTIFACT_REQUIRED',
        message: 'heightfield artifact is required for reachability',
      });
    } else if (
      (await hashHeightfieldArtifactV1(artifacts.heightfield)) !== world.terrain.artifact.sha256
    ) {
      issues.push({
        code: 'TERRAIN_ARTIFACT_HASH_MISMATCH',
        message: 'heightfield artifact hash mismatch',
      });
    } else {
      const ground = heightfieldGround(artifacts.heightfield);
      terrainHeight = ground.heightAt;
      terrainNormalY = (x, z) => ground.normalAt(x, z)[1];
    }
  }

  let colliderTests = 0;
  let visitedCells = 0;
  let colliderBudgetReported = false;
  const blockedAt = (x: number, z: number, radius: number): boolean => {
    for (const box of boxes) {
      if (colliderTests >= document.budget.maxColliderTests) {
        if (!colliderBudgetReported) {
          issues.push({
            code: 'COLLIDER_TEST_BUDGET_EXCEEDED',
            message: 'collider test budget exhausted',
          });
          colliderBudgetReported = true;
        }
        return true;
      }
      colliderTests += 1;
      if (circleIntersectsAabb(x, z, radius, box)) return true;
    }
    const slopeDeg = Math.acos(Math.max(-1, Math.min(1, terrainNormalY(x, z)))) * (180 / Math.PI);
    return slopeDeg > document.agent.maxSlopeDeg;
  };

  const paths: ReachabilityPathResultV1[] = [];
  for (const path of document.criticalPaths) {
    const from = resolveEndpoint(world, path.from);
    const to = resolveEndpoint(world, path.to);
    let endpointFailure = false;
    for (const [name, endpointValue, endpointSpec] of [
      ['from', from, path.from],
      ['to', to, path.to],
    ] as const) {
      if (!endpointValue) {
        issues.push({
          code: 'ENDPOINT_UNKNOWN',
          message: `${name} endpoint "${endpointSpec.kind === 'point' ? 'point' : endpointSpec.id}" is unknown`,
          pathId: path.id,
          endpoint: name,
        });
        endpointFailure = true;
        continue;
      }
      const cell = cellOf(endpointValue.position, document);
      if (!cell) {
        issues.push({
          code: 'ENDPOINT_OUTSIDE_GRID',
          message: `${name} endpoint is outside grid`,
          pathId: path.id,
          endpoint: name,
        });
        endpointFailure = true;
        continue;
      }
      if (
        blockedAt(
          endpointValue.position[0],
          endpointValue.position[2],
          Math.max(document.agent.radius, endpointValue.clearanceRadius),
        )
      ) {
        issues.push({
          code: 'ENDPOINT_BLOCKED',
          message: `${name} endpoint is blocked`,
          pathId: path.id,
          endpoint: name,
        });
        endpointFailure = true;
      }
    }
    if (endpointFailure || !from || !to) {
      paths.push({ id: path.id, status: 'blocked', cells: [], visitedCells: 0 });
      continue;
    }
    const start = cellOf(from.position, document)!;
    const goal = cellOf(to.position, document)!;
    const key = (cell: [number, number]) => `${cell[0]}:${cell[1]}`;
    const queue: Array<[number, number]> = [start];
    const previous = new Map<string, [number, number] | undefined>([[key(start), undefined]]);
    let cursor = 0;
    let pathVisits = 0;
    let exceeded = false;
    while (cursor < queue.length) {
      if (visitedCells >= document.budget.maxVisitedCells) {
        issues.push({
          code: 'VISIT_BUDGET_EXCEEDED',
          message: 'visited-cell budget exhausted',
          pathId: path.id,
        });
        exceeded = true;
        break;
      }
      const current = queue[cursor++]!;
      visitedCells += 1;
      pathVisits += 1;
      if (current[0] === goal[0] && current[1] === goal[1]) break;
      const [x, z] = cellPosition(current, document);
      const currentHeight = terrainHeight(x, z);
      for (const [dx, dz] of [
        [1, 0],
        [0, 1],
        [-1, 0],
        [0, -1],
      ] as const) {
        const next: [number, number] = [current[0] + dx, current[1] + dz];
        if (
          next[0] < 0 ||
          next[1] < 0 ||
          next[0] >= document.grid.width ||
          next[1] >= document.grid.height ||
          previous.has(key(next))
        )
          continue;
        const [nextX, nextZ] = cellPosition(next, document);
        if (Math.abs(terrainHeight(nextX, nextZ) - currentHeight) > document.agent.maxStepHeight)
          continue;
        if (blockedAt(nextX, nextZ, document.agent.radius)) continue;
        previous.set(key(next), current);
        queue.push(next);
      }
    }
    if (exceeded) {
      paths.push({ id: path.id, status: 'budget-exceeded', cells: [], visitedCells: pathVisits });
      continue;
    }
    if (!previous.has(key(goal))) {
      issues.push({
        code: 'PATH_UNREACHABLE',
        message: `critical path "${path.id}" is unreachable`,
        pathId: path.id,
      });
      paths.push({ id: path.id, status: 'unreachable', cells: [], visitedCells: pathVisits });
      continue;
    }
    const cells: Array<[number, number]> = [];
    for (
      let current: [number, number] | undefined = goal;
      current;
      current = previous.get(key(current))
    ) {
      cells.push(current);
    }
    cells.reverse();
    paths.push({ id: path.id, status: 'reachable', cells, visitedCells: pathVisits });
  }
  return {
    schemaVersion: REACHABILITY_REPORT_V1_SCHEMA_VERSION,
    worldSha256: await hashWorldDocumentV2(world),
    requestSha256: await sha256ContractJson(document),
    valid: issues.length === 0 && paths.every((path) => path.status === 'reachable'),
    visitedCells,
    colliderTests,
    paths,
    issues,
  };
}

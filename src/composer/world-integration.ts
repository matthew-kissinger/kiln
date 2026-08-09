/** Pure deterministic authoring and validation operations for Composer V2 world primitives. */
import { worldAabbFromLocal } from './overlap';
import {
  parseWorldDocumentV2,
  reconcileWorldDocumentV2Objects,
  type WorldDocumentV2,
  type WorldObjectV2,
  type WorldPathV2,
  type WorldSocketV2,
  type WorldSpawnV2,
  type WorldTerrainV2,
  type WorldZoneV2,
} from './world-document';

export type WorldIntegrationIssueCode =
  | 'socket-incompatible'
  | 'socket-over-capacity'
  | 'socket-transform-mismatch'
  | 'reserved-zone-occupied'
  | 'portal-clearance-blocked'
  | 'spawn-clearance-blocked';

export interface WorldIntegrationIssueV2 {
  code: WorldIntegrationIssueCode;
  message: string;
  objectId?: string;
  socketId?: string;
  zoneId?: string;
  spawnId?: string;
}

const compareId = (a: { id: string }, b: { id: string }): number =>
  a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

function replaceAuthored(
  input: unknown,
  authored: Partial<WorldDocumentV2['authored']>,
): WorldDocumentV2 {
  const world = parseWorldDocumentV2(input);
  return parseWorldDocumentV2({ ...world, authored: { ...world.authored, ...authored } });
}

/** Full deterministic replacement; input ordering cannot alter the world hash. */
export function setWorldZonesV2(input: unknown, zones: readonly WorldZoneV2[]): WorldDocumentV2 {
  return assertWorldIntegrationValid(replaceAuthored(input, { zones: [...zones].sort(compareId) }));
}

/** Full deterministic replacement; input ordering cannot alter the world hash. */
export function setWorldPathsV2(input: unknown, paths: readonly WorldPathV2[]): WorldDocumentV2 {
  return replaceAuthored(input, { paths: [...paths].sort(compareId) });
}

/**
 * Full deterministic replacement. Attachments to removed sockets are cleared,
 * making socket occupancy a derived property with no dangling persisted state.
 */
export function setWorldSocketsV2(
  input: unknown,
  sockets: readonly WorldSocketV2[],
): WorldDocumentV2 {
  const world = parseWorldDocumentV2(input);
  const sorted = [...sockets].sort(compareId);
  const ids = new Set(sorted.map((socket) => socket.id));
  const objects = world.objects.map((object) => {
    if (!object.socketId || ids.has(object.socketId)) return object;
    const { socketId: _removed, ...detached } = object;
    return detached;
  });
  return assertWorldIntegrationValid(
    parseWorldDocumentV2({
      ...world,
      objects,
      authored: { ...world.authored, sockets: sorted },
    }),
  );
}

/** Full deterministic replacement; input ordering cannot alter the world hash. */
export function setWorldSpawnsV2(input: unknown, spawns: readonly WorldSpawnV2[]): WorldDocumentV2 {
  const world = parseWorldDocumentV2(input);
  return assertWorldIntegrationValid(
    parseWorldDocumentV2({ ...world, spawns: [...spawns].sort(compareId) }),
  );
}

/** Replace terrain without changing any other canonical world state. */
export function setWorldTerrainV2(input: unknown, terrain: WorldTerrainV2): WorldDocumentV2 {
  const world = parseWorldDocumentV2(input);
  return parseWorldDocumentV2({ ...world, terrain });
}

interface Footprint {
  object: WorldObjectV2;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

function footprints(world: WorldDocumentV2): Footprint[] {
  const assets = new Map(world.assets.map((asset) => [asset.refId, asset]));
  return world.objects.map((object) => {
    const asset = assets.get(object.assetRefId)!;
    const box = worldAabbFromLocal(
      asset.bounds.min,
      asset.bounds.max,
      object.transform.position,
      object.transform.rotationYDeg,
      object.transform.uniformScale,
    );
    return {
      object,
      minX: box.min[0],
      maxX: box.max[0],
      minZ: box.min[2],
      maxZ: box.max[2],
    };
  });
}

function boxIntersectsCircle(box: Footprint, center: [number, number], radius: number): boolean {
  const x = Math.max(box.minX, Math.min(box.maxX, center[0]));
  const z = Math.max(box.minZ, Math.min(box.maxZ, center[1]));
  return (x - center[0]) ** 2 + (z - center[1]) ** 2 <= radius * radius;
}

function boxIntersectsZone(box: Footprint, zone: WorldZoneV2): boolean {
  if (zone.shape.type === 'circle') {
    return boxIntersectsCircle(box, zone.shape.center, zone.shape.radius);
  }
  return !(
    box.maxX < zone.shape.center[0] - zone.shape.halfExtents[0] ||
    box.minX > zone.shape.center[0] + zone.shape.halfExtents[0] ||
    box.maxZ < zone.shape.center[1] - zone.shape.halfExtents[1] ||
    box.minZ > zone.shape.center[1] + zone.shape.halfExtents[1]
  );
}

/** Validate compatibility/occupancy and reserved, portal, and spawn clearance. */
export function validateWorldIntegrationV2(input: unknown): WorldIntegrationIssueV2[] {
  const world = parseWorldDocumentV2(input);
  const issues: WorldIntegrationIssueV2[] = [];
  const assets = new Map(world.assets.map((asset) => [asset.refId, asset]));
  const sockets = new Map(world.authored.sockets.map((socket) => [socket.id, socket]));
  const occupancy = new Map<string, WorldObjectV2[]>();
  for (const object of world.objects) {
    if (!object.socketId) continue;
    const socket = sockets.get(object.socketId)!;
    const asset = assets.get(object.assetRefId)!;
    const compatible = (asset.tags ?? []).some((tag) => socket.compatibilityTags.includes(tag));
    if (!compatible) {
      issues.push({
        code: 'socket-incompatible',
        message: `object "${object.id}" is incompatible with socket "${socket.id}"`,
        objectId: object.id,
        socketId: socket.id,
      });
    }
    if (
      object.transform.position.some((value, index) => value !== socket.position[index]) ||
      object.transform.rotationYDeg !== socket.rotationYDeg
    ) {
      issues.push({
        code: 'socket-transform-mismatch',
        message: `object "${object.id}" is not aligned to socket "${socket.id}"`,
        objectId: object.id,
        socketId: socket.id,
      });
    }
    const occupants = occupancy.get(socket.id) ?? [];
    occupants.push(object);
    occupancy.set(socket.id, occupants);
  }
  for (const socket of world.authored.sockets) {
    const occupants = occupancy.get(socket.id) ?? [];
    if (occupants.length > socket.capacity) {
      issues.push({
        code: 'socket-over-capacity',
        message: `socket "${socket.id}" has ${occupants.length} occupants but capacity ${socket.capacity}`,
        socketId: socket.id,
      });
    }
  }

  const boxes = footprints(world);
  for (const zone of world.authored.zones) {
    for (const box of boxes) {
      if (boxIntersectsZone(box, zone)) {
        const code =
          zone.kind === 'reserved'
            ? 'reserved-zone-occupied'
            : zone.kind === 'portal-clearance'
              ? 'portal-clearance-blocked'
              : 'spawn-clearance-blocked';
        issues.push({
          code,
          message: `object "${box.object.id}" occupies ${zone.kind} zone "${zone.id}"`,
          objectId: box.object.id,
          zoneId: zone.id,
        });
      }
    }
  }
  for (const socket of world.authored.sockets) {
    if (socket.kind !== 'portal') continue;
    for (const box of boxes) {
      if (box.object.socketId === socket.id) continue;
      if (
        boxIntersectsCircle(box, [socket.position[0], socket.position[2]], socket.clearanceRadius!)
      ) {
        issues.push({
          code: 'portal-clearance-blocked',
          message: `object "${box.object.id}" blocks portal "${socket.id}"`,
          objectId: box.object.id,
          socketId: socket.id,
        });
      }
    }
  }
  for (const spawn of world.spawns) {
    for (const box of boxes) {
      if (boxIntersectsCircle(box, [spawn.position[0], spawn.position[2]], spawn.clearanceRadius)) {
        issues.push({
          code: 'spawn-clearance-blocked',
          message: `object "${box.object.id}" blocks spawn "${spawn.id}"`,
          objectId: box.object.id,
          spawnId: spawn.id,
        });
      }
    }
  }
  return issues.sort((a, b) => {
    const left = `${a.code}:${a.objectId ?? ''}:${a.socketId ?? ''}:${a.zoneId ?? ''}:${a.spawnId ?? ''}`;
    const right = `${b.code}:${b.objectId ?? ''}:${b.socketId ?? ''}:${b.zoneId ?? ''}:${b.spawnId ?? ''}`;
    return left < right ? -1 : left > right ? 1 : 0;
  });
}

export interface SnapWorldObjectToSocketV2Input {
  objectId: string;
  socketId: string;
}

/** Raised when a candidate would persist blocked reserved/portal/spawn space. */
export class WorldIntegrationValidationError extends Error {
  readonly issues: WorldIntegrationIssueV2[];

  constructor(issues: WorldIntegrationIssueV2[]) {
    super(
      `world integration validation failed: ${issues.map((issue) => issue.message).join('; ')}`,
    );
    this.name = 'WorldIntegrationValidationError';
    this.issues = issues;
  }
}

function assertWorldIntegrationValid(world: WorldDocumentV2): WorldDocumentV2 {
  const issues = validateWorldIntegrationV2(world);
  if (issues.length) throw new WorldIntegrationValidationError(issues);
  return world;
}

function clearInvalidSocketAttachments(world: WorldDocumentV2): WorldDocumentV2 {
  const sockets = new Map(world.authored.sockets.map((socket) => [socket.id, socket]));
  const assets = new Map(world.assets.map((asset) => [asset.refId, asset]));
  const occupancy = new Map<string, number>();
  const objects = [...world.objects].sort(compareId).map((object) => {
    if (!object.socketId) return object;
    const socket = sockets.get(object.socketId);
    const asset = assets.get(object.assetRefId)!;
    const compatible =
      socket != null && (asset.tags ?? []).some((tag) => socket.compatibilityTags.includes(tag));
    const aligned =
      socket != null &&
      object.transform.position.every((value, index) => value === socket.position[index]) &&
      object.transform.rotationYDeg === socket.rotationYDeg;
    const used = socket ? (occupancy.get(socket.id) ?? 0) : 0;
    if (!socket || !compatible || !aligned || used >= socket.capacity) {
      const { socketId: _removed, ...detached } = object;
      return detached;
    }
    occupancy.set(socket.id, used + 1);
    return object;
  });
  return parseWorldDocumentV2({ ...world, objects });
}

/**
 * Merge a freshly-authored/migrated agent candidate into its canonical parent.
 * Parent terrain, authored primitives, spawns, runtime policy, and world
 * provenance remain authoritative. Retained ids use locked reconciliation
 * semantics; new ids adopt candidate role/group/provenance. Invalid/dangling
 * socket occupancy is detached deterministically before final clearance checks.
 */
export function reconcileWorldDocumentV2Candidate(
  current: unknown,
  candidateInput: unknown,
): WorldDocumentV2 {
  const parent = parseWorldDocumentV2(current);
  const candidate = parseWorldDocumentV2(candidateInput);
  const parentIds = new Set(parent.objects.map((object) => object.id));
  const candidateAssets = new Map(candidate.assets.map((asset) => [asset.refId, asset]));
  let merged = reconcileWorldDocumentV2Objects(parent, {
    objects: candidate.objects.map((object) => {
      const asset = candidateAssets.get(object.assetRefId)!;
      return {
        id: object.id,
        generationId: asset.generationId,
        position: object.transform.position,
        rotationYDeg: object.transform.rotationYDeg,
        uniformScale: object.transform.uniformScale,
      };
    }),
    assets: candidate.assets.map(({ refId: _refId, ...asset }) => asset),
    environment: candidate.environment,
  });
  const candidateObjects = new Map(candidate.objects.map((object) => [object.id, object]));
  merged = parseWorldDocumentV2({
    ...merged,
    objects: merged.objects.map((object) => {
      if (parentIds.has(object.id)) return object;
      const authored = candidateObjects.get(object.id)!;
      return {
        ...object,
        role: authored.role,
        provenance: authored.provenance,
        ...(authored.groupId ? { groupId: authored.groupId } : {}),
        ...(authored.collision ? { collision: authored.collision } : {}),
      };
    }),
  });
  merged = clearInvalidSocketAttachments(merged);
  const issues = validateWorldIntegrationV2(merged);
  if (issues.length) throw new WorldIntegrationValidationError(issues);
  return merged;
}

/** Snap one object exactly to a compatible socket, failing before any mutation. */
export function snapWorldObjectToSocketV2(
  input: unknown,
  request: SnapWorldObjectToSocketV2Input,
): WorldDocumentV2 {
  const world = parseWorldDocumentV2(input);
  const index = world.objects.findIndex((object) => object.id === request.objectId);
  if (index < 0) throw new Error(`unknown object "${request.objectId}"`);
  const socket = world.authored.sockets.find((candidate) => candidate.id === request.socketId);
  if (!socket) throw new Error(`unknown socket "${request.socketId}"`);
  const object = world.objects[index]!;
  const asset = world.assets.find((candidate) => candidate.refId === object.assetRefId)!;
  if (!(asset.tags ?? []).some((tag) => socket.compatibilityTags.includes(tag))) {
    throw new Error(`object "${object.id}" is incompatible with socket "${socket.id}"`);
  }
  const occupied = world.objects.filter(
    (candidate) => candidate.id !== object.id && candidate.socketId === socket.id,
  ).length;
  if (occupied >= socket.capacity) throw new Error(`socket "${socket.id}" is at capacity`);
  const objects = [...world.objects];
  objects[index] = {
    ...object,
    socketId: socket.id,
    transform: {
      ...object.transform,
      position: [...socket.position],
      rotationYDeg: socket.rotationYDeg,
    },
  };
  return assertWorldIntegrationValid(parseWorldDocumentV2({ ...world, objects }));
}

export interface SampleWorldPathV2Options {
  spacing: number;
  startDistance?: number;
  includeEnd?: boolean;
  maxSamples?: number;
}

export interface WorldPathSampleV2 {
  distance: number;
  position: [number, number, number];
  tangent: [number, number, number];
  rotationYDeg: number;
}

interface PathSegment {
  start: [number, number, number];
  end: [number, number, number];
  length: number;
  cumulative: number;
  tangent: [number, number, number];
}

function pathSegments(path: WorldPathV2): { segments: PathSegment[]; total: number } {
  const segments: PathSegment[] = [];
  let cumulative = 0;
  for (let index = 1; index < path.points.length; index++) {
    const start = path.points[index - 1]!;
    const end = path.points[index]!;
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const dz = end[2] - start[2];
    const length = Math.hypot(dx, dy, dz);
    if (length === 0) continue;
    segments.push({
      start,
      end,
      length,
      cumulative,
      tangent: [dx / length, dy / length, dz / length],
    });
    cumulative += length;
  }
  if (!segments.length) throw new Error(`path "${path.id}" has zero length`);
  return { segments, total: cumulative };
}

function sampleAtDistance(
  segments: PathSegment[],
  total: number,
  requested: number,
): WorldPathSampleV2 {
  const distance = Math.max(0, Math.min(total, requested));
  const segment = segments.find(
    (candidate, index) =>
      distance < candidate.cumulative + candidate.length || index === segments.length - 1,
  )!;
  const t = Math.max(0, Math.min(1, (distance - segment.cumulative) / segment.length));
  const position: [number, number, number] = [
    segment.start[0] + (segment.end[0] - segment.start[0]) * t,
    segment.start[1] + (segment.end[1] - segment.start[1]) * t,
    segment.start[2] + (segment.end[2] - segment.start[2]) * t,
  ];
  return {
    distance,
    position,
    tangent: [...segment.tangent],
    rotationYDeg: Math.atan2(-segment.tangent[2], segment.tangent[0]) * (180 / Math.PI),
  };
}

/** Sample a path at stable arc-length intervals; segment-boundary ties use the next segment. */
export function sampleWorldPathV2(
  path: WorldPathV2,
  options: SampleWorldPathV2Options,
): WorldPathSampleV2[] {
  if (!Number.isFinite(options.spacing) || options.spacing <= 0)
    throw new Error('path spacing must be positive');
  const start = options.startDistance ?? 0;
  if (!Number.isFinite(start) || start < 0)
    throw new Error('path startDistance must be non-negative');
  const maxSamples = options.maxSamples ?? 200;
  if (!Number.isInteger(maxSamples) || maxSamples < 1 || maxSamples > 200)
    throw new Error('maxSamples must be an integer from 1 to 200');
  const { segments, total } = pathSegments(path);
  if (start > total) return [];
  const distances: number[] = [];
  for (
    let distance = start;
    distance <= total && distances.length < maxSamples;
    distance = start + distances.length * options.spacing
  ) {
    distances.push(distance);
  }
  if ((options.includeEnd ?? true) && distances.length < maxSamples && distances.at(-1) !== total)
    distances.push(total);
  return distances.map((distance) => sampleAtDistance(segments, total, distance));
}

export interface AlignWorldObjectsToPathV2Input {
  pathId: string;
  objectIds: readonly string[];
  spacing: number;
  startDistance?: number;
}

/** Align existing objects in caller order to path arc length and tangent; socket bindings clear. */
export function alignWorldObjectsToPathV2(
  input: unknown,
  request: AlignWorldObjectsToPathV2Input,
): WorldDocumentV2 {
  const world = parseWorldDocumentV2(input);
  if (
    request.objectIds.length > 200 ||
    new Set(request.objectIds).size !== request.objectIds.length
  )
    throw new Error('objectIds must be unique and bounded to 200');
  const path = world.authored.paths.find((candidate) => candidate.id === request.pathId);
  if (!path) throw new Error(`unknown path "${request.pathId}"`);
  const samples = sampleWorldPathV2(path, {
    spacing: request.spacing,
    startDistance: request.startDistance,
    includeEnd: false,
    maxSamples: Math.max(1, request.objectIds.length),
  });
  if (samples.length < request.objectIds.length)
    throw new Error('path is too short for requested alignment');
  const byId = new Map(world.objects.map((object) => [object.id, object]));
  for (const id of request.objectIds) if (!byId.has(id)) throw new Error(`unknown object "${id}"`);
  const updates = new Map(request.objectIds.map((id, index) => [id, samples[index]!]));
  const objects = world.objects.map((object) => {
    const sample = updates.get(object.id);
    if (!sample) return object;
    const { socketId: _socketId, ...detached } = object;
    return {
      ...detached,
      transform: {
        ...object.transform,
        position: sample.position,
        rotationYDeg: sample.rotationYDeg,
      },
    };
  });
  return assertWorldIntegrationValid(parseWorldDocumentV2({ ...world, objects }));
}

export interface FillWorldPathV2Input {
  pathId: string;
  templateObjectId: string;
  idPrefix: string;
  count: number;
  spacing: number;
  startDistance?: number;
}

/** Deterministically repeat one canonical object along path arc length and tangent. */
export function fillWorldPathV2(input: unknown, request: FillWorldPathV2Input): WorldDocumentV2 {
  const world = parseWorldDocumentV2(input);
  if (!Number.isInteger(request.count) || request.count < 1 || request.count > 64)
    throw new Error('path fill count must be 1..64');
  if (world.objects.length + request.count > 200)
    throw new Error('path fill exceeds 200-object world limit');
  if (!request.idPrefix || request.idPrefix.length > 240)
    throw new Error('path fill idPrefix must be 1..240 characters');
  const template = world.objects.find((object) => object.id === request.templateObjectId);
  if (!template) throw new Error(`unknown template object "${request.templateObjectId}"`);
  const path = world.authored.paths.find((candidate) => candidate.id === request.pathId);
  if (!path) throw new Error(`unknown path "${request.pathId}"`);
  const samples = sampleWorldPathV2(path, {
    spacing: request.spacing,
    startDistance: request.startDistance,
    includeEnd: false,
    maxSamples: request.count,
  });
  if (samples.length < request.count) throw new Error('path is too short for requested fill');
  const existingIds = new Set(world.objects.map((object) => object.id));
  const additions = samples.slice(0, request.count).map((sample, index): WorldObjectV2 => {
    const id = `${request.idPrefix}#${index}`;
    if (existingIds.has(id)) throw new Error(`path fill object id already exists: "${id}"`);
    return {
      id,
      assetRefId: template.assetRefId,
      transform: {
        position: sample.position,
        rotationYDeg: sample.rotationYDeg,
        uniformScale: template.transform.uniformScale,
      },
      role: template.role,
      ...(template.groupId ? { groupId: template.groupId } : {}),
      ...(template.collision ? { collision: template.collision } : {}),
      provenance: {
        sourceStatementId: `path:${path.id}:${id}`.slice(0, 256),
        ...(template.provenance.sourcePrompt
          ? { sourcePrompt: template.provenance.sourcePrompt }
          : {}),
        ...(template.provenance.parentGenerationId
          ? { parentGenerationId: template.provenance.parentGenerationId }
          : {}),
        ...(template.provenance.activeAsset
          ? { activeAsset: template.provenance.activeAsset }
          : {}),
      },
    };
  });
  return assertWorldIntegrationValid(
    parseWorldDocumentV2({
      ...world,
      objects: [...world.objects, ...additions].sort(compareId),
    }),
  );
}

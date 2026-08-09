/**
 * Canonical dependency-free heightfield runtime.
 *
 * This file is intentionally self-contained: no Node, Zod, THREE, or import-time
 * I/O. Hosts may copy its exact source through an identity-checked vendor step so
 * browser/server/Engine consumers execute one implementation.
 */
export const HEIGHTFIELD_RUNTIME_SOURCE_VERSION = 'kiln.heightfield-runtime.v1' as const;
export const HEIGHTFIELD_ARTIFACT_V1_SCHEMA_VERSION = 'kiln.heightfield.v1' as const;
/** Heights use nearest-step rounding to 1/1024 world unit; negative zero canonicalizes to zero. */
export const HEIGHTFIELD_QUANTIZATION_STEP = 1 / 1024;

export function quantizeHeightfieldSample(value: number): number {
  const quantized =
    Math.round(value / HEIGHTFIELD_QUANTIZATION_STEP) * HEIGHTFIELD_QUANTIZATION_STEP;
  return Object.is(quantized, -0) ? 0 : quantized;
}

export type HeightfieldVec2 = [number, number];
export type HeightfieldVec3 = [number, number, number];

export type TerrainStampV1 =
  | { kind: 'road' | 'path'; points: HeightfieldVec2[]; halfWidth: number; targetHeight: number }
  | { kind: 'pad'; center: HeightfieldVec2; halfExtents: HeightfieldVec2; targetHeight: number };

export interface HeightfieldArtifactV1 {
  schemaVersion: typeof HEIGHTFIELD_ARTIFACT_V1_SCHEMA_VERSION;
  seed: number;
  origin: HeightfieldVec2;
  cellSize: number;
  width: number;
  height: number;
  baseHeight: number;
  amplitude: number;
  frequency: number;
  stamps: TerrainStampV1[];
  heights: number[];
}

export interface CreateHeightfieldArtifactV1Input {
  seed: number;
  origin: HeightfieldVec2;
  cellSize: number;
  width: number;
  height: number;
  baseHeight: number;
  amplitude: number;
  frequency: number;
  stamps?: readonly TerrainStampV1[];
}

export interface TerrainSampler {
  heightAt(x: number, z: number): number;
  normalAt(x: number, z: number): HeightfieldVec3;
}

export interface HeightfieldMeshDataV1 {
  /** XYZ triples in canonical row-major grid order. */
  positions: number[];
  /** XYZ triples from the canonical sampler at each vertex. */
  normals: number[];
  /** Upward-wound triangle indices, two triangles per grid cell. */
  indices: number[];
}

const own = (value: object, key: string): boolean => Object.hasOwn(value, key);

function fail(path: string, message: string): never {
  throw new TypeError(`${path}: ${message}`);
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value))
    fail(path, 'expected object');
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[], path: string): void {
  const allowed = new Set(keys);
  for (const key of Object.keys(value))
    if (!allowed.has(key)) fail(`${path}.${key}`, 'unknown key');
  for (const key of keys) if (!own(value, key)) fail(`${path}.${key}`, 'required');
}

function finite(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) fail(path, 'expected finite number');
  return value;
}

function positive(value: unknown, path: string): number {
  const parsed = finite(value, path);
  if (parsed <= 0) fail(path, 'expected positive number');
  return parsed;
}

function safeInteger(value: unknown, path: string, min?: number, max?: number): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value))
    fail(path, 'expected safe integer');
  if (min != null && value < min) fail(path, `expected at least ${min}`);
  if (max != null && value > max) fail(path, `expected at most ${max}`);
  return value;
}

function vec2(value: unknown, path: string, positiveOnly = false): HeightfieldVec2 {
  if (!Array.isArray(value) || value.length !== 2) fail(path, 'expected [x,z]');
  const result: HeightfieldVec2 = [finite(value[0], `${path}[0]`), finite(value[1], `${path}[1]`)];
  if (positiveOnly && (result[0] <= 0 || result[1] <= 0))
    fail(path, 'expected positive components');
  return result;
}

function parseStamp(value: unknown, path: string): TerrainStampV1 {
  const input = record(value, path);
  const kind = input.kind;
  if (kind === 'pad') {
    exactKeys(input, ['kind', 'center', 'halfExtents', 'targetHeight'], path);
    return {
      kind,
      center: vec2(input.center, `${path}.center`),
      halfExtents: vec2(input.halfExtents, `${path}.halfExtents`, true),
      targetHeight: quantizeHeightfieldSample(finite(input.targetHeight, `${path}.targetHeight`)),
    };
  }
  if (kind !== 'road' && kind !== 'path') fail(`${path}.kind`, 'expected road, path, or pad');
  exactKeys(input, ['kind', 'points', 'halfWidth', 'targetHeight'], path);
  if (!Array.isArray(input.points) || input.points.length < 2 || input.points.length > 128) {
    fail(`${path}.points`, 'expected 2..128 points');
  }
  return {
    kind,
    points: input.points.map((point, index) => vec2(point, `${path}.points[${index}]`)),
    halfWidth: positive(input.halfWidth, `${path}.halfWidth`),
    targetHeight: quantizeHeightfieldSample(finite(input.targetHeight, `${path}.targetHeight`)),
  };
}

/** Strict fail-closed parser and clone for serialized/runtime consumers. */
export function parseHeightfieldArtifactV1(value: unknown): HeightfieldArtifactV1 {
  const input = record(value, 'heightfield');
  exactKeys(
    input,
    [
      'schemaVersion',
      'seed',
      'origin',
      'cellSize',
      'width',
      'height',
      'baseHeight',
      'amplitude',
      'frequency',
      'stamps',
      'heights',
    ],
    'heightfield',
  );
  if (input.schemaVersion !== HEIGHTFIELD_ARTIFACT_V1_SCHEMA_VERSION) {
    fail('heightfield.schemaVersion', `expected ${HEIGHTFIELD_ARTIFACT_V1_SCHEMA_VERSION}`);
  }
  const width = safeInteger(input.width, 'heightfield.width', 2, 257);
  const height = safeInteger(input.height, 'heightfield.height', 2, 257);
  if (!Array.isArray(input.stamps) || input.stamps.length > 64)
    fail('heightfield.stamps', 'expected at most 64 stamps');
  if (!Array.isArray(input.heights) || input.heights.length !== width * height) {
    fail('heightfield.heights', `expected ${width * height} row-major samples`);
  }
  const amplitude = finite(input.amplitude, 'heightfield.amplitude');
  if (amplitude < 0) fail('heightfield.amplitude', 'expected non-negative number');
  return {
    schemaVersion: HEIGHTFIELD_ARTIFACT_V1_SCHEMA_VERSION,
    seed: safeInteger(input.seed, 'heightfield.seed'),
    origin: vec2(input.origin, 'heightfield.origin'),
    cellSize: positive(input.cellSize, 'heightfield.cellSize'),
    width,
    height,
    baseHeight: finite(input.baseHeight, 'heightfield.baseHeight'),
    amplitude,
    frequency: positive(input.frequency, 'heightfield.frequency'),
    stamps: input.stamps.map((stamp, index) => parseStamp(stamp, `heightfield.stamps[${index}]`)),
    heights: input.heights.map((sample, index) =>
      quantizeHeightfieldSample(finite(sample, `heightfield.heights[${index}]`)),
    ),
  };
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value === 'boolean' || typeof value === 'string')
    return JSON.stringify(value);
  if (typeof value === 'number') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (typeof value === 'object') {
    const entry = value as Record<string, unknown>;
    return `{${Object.keys(entry)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(entry[key])}`)
      .join(',')}}`;
  }
  throw new TypeError(`unsupported canonical JSON value: ${typeof value}`);
}

function hashLattice(seed: number, x: number, z: number): number {
  let value = seed | 0;
  value ^= Math.imul(x | 0, 0x9e3779b1);
  value ^= Math.imul(z | 0, 0x85ebca77);
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b);
  value ^= value >>> 16;
  return (value >>> 0) / 0xffffffff;
}

const smooth = (value: number): number => value * value * (3 - 2 * value);

function valueNoise(seed: number, x: number, z: number): number {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const tx = smooth(x - x0);
  const tz = smooth(z - z0);
  const top = hashLattice(seed, x0, z0) * (1 - tx) + hashLattice(seed, x0 + 1, z0) * tx;
  const bottom = hashLattice(seed, x0, z0 + 1) * (1 - tx) + hashLattice(seed, x0 + 1, z0 + 1) * tx;
  return top * (1 - tz) + bottom * tz;
}

export function createHeightfieldArtifactV1(
  input: CreateHeightfieldArtifactV1Input,
): HeightfieldArtifactV1 {
  const seed = safeInteger(input.seed, 'input.seed');
  const origin = vec2(input.origin, 'input.origin');
  const cellSize = positive(input.cellSize, 'input.cellSize');
  const width = safeInteger(input.width, 'input.width', 2, 257);
  const height = safeInteger(input.height, 'input.height', 2, 257);
  const baseHeight = finite(input.baseHeight, 'input.baseHeight');
  const amplitude = finite(input.amplitude, 'input.amplitude');
  if (amplitude < 0) fail('input.amplitude', 'expected non-negative number');
  const frequency = positive(input.frequency, 'input.frequency');
  const candidate: HeightfieldArtifactV1 = {
    schemaVersion: HEIGHTFIELD_ARTIFACT_V1_SCHEMA_VERSION,
    seed,
    origin,
    cellSize,
    width,
    height,
    baseHeight,
    amplitude,
    frequency,
    stamps: [],
    heights: Array.from({ length: width * height }, (_, index) => {
      const column = index % width;
      const row = Math.floor(index / width);
      const x = origin[0] + column * cellSize;
      const z = origin[1] + row * cellSize;
      return quantizeHeightfieldSample(
        baseHeight + amplitude * (valueNoise(seed, x * frequency, z * frequency) * 2 - 1),
      );
    }),
  };
  const parsed = parseHeightfieldArtifactV1(candidate);
  return input.stamps?.length ? stampHeightfieldArtifactV1(parsed, input.stamps) : parsed;
}

function squaredDistanceToSegment(
  x: number,
  z: number,
  start: HeightfieldVec2,
  end: HeightfieldVec2,
): number {
  const dx = end[0] - start[0];
  const dz = end[1] - start[1];
  const lengthSquared = dx * dx + dz * dz;
  const t =
    lengthSquared === 0
      ? 0
      : Math.max(0, Math.min(1, ((x - start[0]) * dx + (z - start[1]) * dz) / lengthSquared));
  const nearestX = start[0] + dx * t;
  const nearestZ = start[1] + dz * t;
  return (x - nearestX) ** 2 + (z - nearestZ) ** 2;
}

function stampContains(stamp: TerrainStampV1, x: number, z: number): boolean {
  if (stamp.kind === 'pad') {
    return (
      Math.abs(x - stamp.center[0]) <= stamp.halfExtents[0] &&
      Math.abs(z - stamp.center[1]) <= stamp.halfExtents[1]
    );
  }
  const radiusSquared = stamp.halfWidth * stamp.halfWidth;
  return stamp.points
    .slice(1)
    .some(
      (point, index) =>
        squaredDistanceToSegment(x, z, stamp.points[index]!, point) <= radiusSquared,
    );
}

export function stampHeightfieldArtifactV1(
  source: unknown,
  stampValues: readonly TerrainStampV1[],
): HeightfieldArtifactV1 {
  const artifact = parseHeightfieldArtifactV1(source);
  const stamps = stampValues.map((stamp, index) => parseStamp(stamp, `stamps[${index}]`));
  if (artifact.stamps.length + stamps.length > 64)
    fail('stamps', 'heightfield supports at most 64 stamps');
  const heights = [...artifact.heights];
  for (const stamp of stamps) {
    for (let row = 0; row < artifact.height; row++) {
      for (let column = 0; column < artifact.width; column++) {
        const x = artifact.origin[0] + column * artifact.cellSize;
        const z = artifact.origin[1] + row * artifact.cellSize;
        if (stampContains(stamp, x, z)) heights[row * artifact.width + column] = stamp.targetHeight;
      }
    }
  }
  return parseHeightfieldArtifactV1({
    ...artifact,
    stamps: [...artifact.stamps, ...stamps],
    heights,
  });
}

/** Exact canonical UTF-8 bytes bound by the world terrain artifact SHA-256. */
export function encodeHeightfieldArtifactV1(source: unknown): Uint8Array {
  return new TextEncoder().encode(canonicalJson(parseHeightfieldArtifactV1(source)));
}

function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.byteLength !== right.byteLength) return false;
  for (let index = 0; index < left.byteLength; index++) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

/** Decode only the one canonical byte representation bound by the artifact SHA-256. */
export function decodeHeightfieldArtifactV1(bytes: Uint8Array): HeightfieldArtifactV1 {
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  const artifact = parseHeightfieldArtifactV1(JSON.parse(text));
  if (!bytesEqual(bytes, encodeHeightfieldArtifactV1(artifact))) {
    throw new TypeError('heightfield bytes are not canonical');
  }
  return artifact;
}

export async function hashHeightfieldArtifactV1(source: unknown): Promise<string> {
  const bytes = encodeHeightfieldArtifactV1(source);
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
  const digest = new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', buffer));
  return [...digest].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function heightfieldGround(source: unknown): TerrainSampler {
  const artifact = parseHeightfieldArtifactV1(source);
  const maxX = artifact.origin[0] + (artifact.width - 1) * artifact.cellSize;
  const maxZ = artifact.origin[1] + (artifact.height - 1) * artifact.cellSize;
  const clamp = (value: number, min: number, max: number): number =>
    Math.max(min, Math.min(max, value));
  const heightAt = (worldX: number, worldZ: number): number => {
    const x = (clamp(worldX, artifact.origin[0], maxX) - artifact.origin[0]) / artifact.cellSize;
    const z = (clamp(worldZ, artifact.origin[1], maxZ) - artifact.origin[1]) / artifact.cellSize;
    const x0 = Math.floor(x);
    const z0 = Math.floor(z);
    const x1 = Math.min(artifact.width - 1, x0 + 1);
    const z1 = Math.min(artifact.height - 1, z0 + 1);
    const tx = x - x0;
    const tz = z - z0;
    const top =
      artifact.heights[z0 * artifact.width + x0]! * (1 - tx) +
      artifact.heights[z0 * artifact.width + x1]! * tx;
    const bottom =
      artifact.heights[z1 * artifact.width + x0]! * (1 - tx) +
      artifact.heights[z1 * artifact.width + x1]! * tx;
    return top * (1 - tz) + bottom * tz;
  };
  const normalAt = (x: number, z: number): HeightfieldVec3 => {
    const left = clamp(x - artifact.cellSize, artifact.origin[0], maxX);
    const right = clamp(x + artifact.cellSize, artifact.origin[0], maxX);
    const down = clamp(z - artifact.cellSize, artifact.origin[1], maxZ);
    const up = clamp(z + artifact.cellSize, artifact.origin[1], maxZ);
    const dx = right === left ? 0 : (heightAt(right, z) - heightAt(left, z)) / (right - left);
    const dz = up === down ? 0 : (heightAt(x, up) - heightAt(x, down)) / (up - down);
    const length = Math.hypot(dx, 1, dz);
    return [-dx / length, 1 / length, -dz / length];
  };
  return { heightAt, normalAt };
}

/** Canonical renderer-neutral mesh buffers; consumers only choose GPU buffer types/materials. */
export function heightfieldMeshDataV1(source: unknown): HeightfieldMeshDataV1 {
  const artifact = parseHeightfieldArtifactV1(source);
  const sampler = heightfieldGround(artifact);
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row < artifact.height; row++) {
    for (let column = 0; column < artifact.width; column++) {
      const x = artifact.origin[0] + column * artifact.cellSize;
      const z = artifact.origin[1] + row * artifact.cellSize;
      positions.push(x, artifact.heights[row * artifact.width + column]!, z);
      normals.push(...sampler.normalAt(x, z));
    }
  }
  for (let row = 0; row < artifact.height - 1; row++) {
    for (let column = 0; column < artifact.width - 1; column++) {
      const a = row * artifact.width + column;
      const b = a + 1;
      const c = a + artifact.width;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  return { positions, normals, indices };
}

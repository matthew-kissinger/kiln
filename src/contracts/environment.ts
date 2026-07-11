import type { AssetIntentV1 } from './asset';

export const ENVIRONMENT_SUBTYPES = [
  'terrain-tile',
  'rock-cliff',
  'cave',
  'road-path',
  'shoreline',
  'wall-gate',
  'bridge',
  'set-dressing-cluster',
  'custom',
] as const;
export type EnvironmentSubtype = (typeof ENVIRONMENT_SUBTYPES)[number];

export const ENVIRONMENT_SOCKET_TYPES = [
  'environment.tile.x-negative',
  'environment.tile.x-positive',
  'environment.tile.z-negative',
  'environment.tile.z-positive',
  'environment.road.start',
  'environment.road.end',
  'environment.bridge.start',
  'environment.bridge.end',
  'environment.wall.left',
  'environment.wall.right',
  'environment.gate.left',
  'environment.gate.right',
  'environment.scatter-zone',
] as const;
export type EnvironmentSocketType = (typeof ENVIRONMENT_SOCKET_TYPES)[number];

export interface EnvironmentIntentProfileV1 {
  schemaVersion: 1;
  subtype: EnvironmentSubtype;
  tileable: boolean;
  navigable: boolean;
}

function normalizeEnvironmentSubtype(value: string | undefined): EnvironmentSubtype {
  const normalized = (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[ _/]+/g, '-');
  if (normalized === 'terrain' || normalized === 'tile' || normalized === 'terrain-tile') {
    return 'terrain-tile';
  }
  if (normalized === 'rock' || normalized === 'cliff' || normalized === 'rock-cliff') {
    return 'rock-cliff';
  }
  if (normalized === 'cave' || normalized === 'cave-entrance') return 'cave';
  if (normalized === 'road' || normalized === 'path' || normalized === 'road-path') {
    return 'road-path';
  }
  if (normalized === 'shore' || normalized === 'shoreline') return 'shoreline';
  if (normalized === 'wall' || normalized === 'gate' || normalized === 'wall-gate') {
    return 'wall-gate';
  }
  if (normalized === 'bridge') return 'bridge';
  if (
    normalized === 'cluster' ||
    normalized === 'set-dressing' ||
    normalized === 'set-dressing-cluster'
  ) {
    return 'set-dressing-cluster';
  }
  return 'custom';
}

/** Canonical ENV-001 profile derived only from closure-owned intent. */
export function resolveEnvironmentIntentProfile(
  intent: AssetIntentV1,
): EnvironmentIntentProfileV1 | undefined {
  if (intent.category !== 'environment') return undefined;
  return {
    schemaVersion: 1,
    subtype: normalizeEnvironmentSubtype(intent.subtype),
    tileable: intent.capabilities.includes('tileable'),
    navigable: intent.capabilities.includes('navigable'),
  };
}

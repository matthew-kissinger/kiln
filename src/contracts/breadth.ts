/**
 * Dependency-free contracts for the remaining W7 category breadth.
 *
 * These values are deliberately JSON-shaped so Studio, SDK and engine-free
 * consumers can validate the same payload without importing Three.js.
 */

export const VFX_SUBTYPES = [
  'billboard',
  'beam',
  'trail',
  'aura',
  'portal',
  'impact',
  'volume-like',
  'runtimeShader',
] as const;
export type VfxSubtype = (typeof VFX_SUBTYPES)[number];

export const VFX_PORTABILITY_MODES = ['portable', 'sidecar'] as const;
export type VfxPortabilityMode = (typeof VFX_PORTABILITY_MODES)[number];

export const VFX_AXIS_DIRECTIONS = ['+X', '-X', '+Y', '-Y', '+Z', '-Z'] as const;
export type VfxAxisDirection = (typeof VFX_AXIS_DIRECTIONS)[number];

export const VFX_FACING_MODES = ['none', 'camera-spherical', 'camera-y-axis', 'fixed'] as const;
export type VfxFacingMode = (typeof VFX_FACING_MODES)[number];

export const VFX_PLAYBACK_POLICIES = ['static', 'loop', 'oneShot'] as const;
export type VfxPlaybackPolicy = (typeof VFX_PLAYBACK_POLICIES)[number];

export const VFX_RUNTIME_DRIVERS = ['none', 'clip', 'timeUniform'] as const;
export type VfxRuntimeDriver = (typeof VFX_RUNTIME_DRIVERS)[number];

export const VFX_ENDPOINT_BEHAVIORS = ['none', 'matchStart', 'holdLast', 'disappear'] as const;
export type VfxEndpointBehavior = (typeof VFX_ENDPOINT_BEHAVIORS)[number];

export type VfxTransparencyMode = 'opaque' | 'mask' | 'blend';

export interface VfxFacingIntentV1 {
  /** Explicit trusted intent may gate; inferred facing remains advisory. */
  source: 'explicit' | 'inferred';
  mode: VfxFacingMode;
  normalAxis?: VfxAxisDirection;
  directionAxis?: VfxAxisDirection;
}

export interface VfxAnimationIntentV1 {
  playback: VfxPlaybackPolicy;
  durationSeconds: number;
  endpointBehavior: VfxEndpointBehavior;
  driver: VfxRuntimeDriver;
  clipName?: string;
  timeUniformName?: string;
}

export interface VfxRuntimeSidecarV1 {
  kind: 'tsl';
  id: string;
  version: string;
}

/** Trusted VFX construction/runtime requirements resolved before model execution. */
export interface VfxIntentV1 {
  schemaVersion: 1;
  subtype: VfxSubtype;
  portability: VfxPortabilityMode;
  transparency: VfxTransparencyMode;
  doubleSided: boolean;
  facing: VfxFacingIntentV1;
  animation: VfxAnimationIntentV1;
  sidecar?: VfxRuntimeSidecarV1;
}

export interface VfxIntentV1Input {
  schemaVersion?: 1;
  subtype?: VfxSubtype;
  portability?: VfxPortabilityMode;
  transparency?: VfxTransparencyMode;
  doubleSided?: boolean;
  facing?: Partial<VfxFacingIntentV1>;
  animation?: Partial<VfxAnimationIntentV1>;
  sidecar?: Partial<VfxRuntimeSidecarV1>;
}

export interface BreadthValidationIssue {
  code: string;
  path: string;
  message: string;
}

export interface BreadthValidationResult<T> {
  valid: boolean;
  value?: T;
  issues: BreadthValidationIssue[];
}

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const trimmed = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value === value.trim();

const enumValue = <T extends readonly string[]>(values: T, value: unknown): value is T[number] =>
  typeof value === 'string' && (values as readonly string[]).includes(value);

const finitePositive = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

const finiteNonNegative = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

function cloneVfxIntentV1(value: VfxIntentV1): VfxIntentV1 {
  return {
    schemaVersion: 1,
    subtype: value.subtype,
    portability: value.portability,
    transparency: value.transparency,
    doubleSided: value.doubleSided,
    facing: { ...value.facing },
    animation: { ...value.animation },
    ...(value.sidecar ? { sidecar: { ...value.sidecar } } : {}),
  };
}

/** Validate the closure-owned VFX contract and its portable/sidecar boundary. */
export function validateVfxIntentV1(value: unknown): BreadthValidationResult<VfxIntentV1> {
  const issues: BreadthValidationIssue[] = [];
  if (!record(value)) {
    return {
      valid: false,
      issues: [{ code: 'EXPECTED_OBJECT', path: '', message: 'VfxIntentV1 must be an object.' }],
    };
  }
  if (value.schemaVersion !== 1) {
    issues.push({
      code: 'UNSUPPORTED_SCHEMA_VERSION',
      path: 'schemaVersion',
      message: 'schemaVersion must be 1.',
    });
  }
  if (!enumValue(VFX_SUBTYPES, value.subtype)) {
    issues.push({
      code: 'INVALID_VFX_SUBTYPE',
      path: 'subtype',
      message: `subtype must be one of ${VFX_SUBTYPES.join(', ')}.`,
    });
  }
  if (!enumValue(VFX_PORTABILITY_MODES, value.portability)) {
    issues.push({
      code: 'INVALID_VFX_PORTABILITY',
      path: 'portability',
      message: 'portability must be portable or sidecar.',
    });
  }
  if (
    value.transparency !== 'opaque' &&
    value.transparency !== 'mask' &&
    value.transparency !== 'blend'
  ) {
    issues.push({
      code: 'INVALID_VFX_TRANSPARENCY',
      path: 'transparency',
      message: 'transparency must be opaque, mask, or blend.',
    });
  }
  if (typeof value.doubleSided !== 'boolean') {
    issues.push({
      code: 'INVALID_VFX_SIDEDNESS',
      path: 'doubleSided',
      message: 'doubleSided must be boolean.',
    });
  }

  if (!record(value.facing)) {
    issues.push({ code: 'INVALID_VFX_FACING', path: 'facing', message: 'facing is required.' });
  } else {
    if (value.facing.source !== 'explicit' && value.facing.source !== 'inferred') {
      issues.push({
        code: 'INVALID_VFX_FACING_SOURCE',
        path: 'facing.source',
        message: 'facing.source must be explicit or inferred.',
      });
    }
    if (!enumValue(VFX_FACING_MODES, value.facing.mode)) {
      issues.push({
        code: 'INVALID_VFX_FACING_MODE',
        path: 'facing.mode',
        message: `facing.mode must be one of ${VFX_FACING_MODES.join(', ')}.`,
      });
    }
    for (const field of ['normalAxis', 'directionAxis'] as const) {
      if (
        value.facing[field] !== undefined &&
        !enumValue(VFX_AXIS_DIRECTIONS, value.facing[field])
      ) {
        issues.push({
          code: 'INVALID_VFX_AXIS',
          path: `facing.${field}`,
          message: `${field} must use a signed Kiln axis.`,
        });
      }
    }
    if (
      value.subtype === 'billboard' &&
      value.facing.mode !== 'camera-spherical' &&
      value.facing.mode !== 'camera-y-axis'
    ) {
      issues.push({
        code: 'VFX_BILLBOARD_FACING_REQUIRED',
        path: 'facing.mode',
        message: 'A billboard must declare spherical or Y-axis camera facing.',
      });
    }
    if (
      (value.subtype === 'beam' || value.subtype === 'trail') &&
      value.facing.directionAxis === undefined
    ) {
      issues.push({
        code: 'VFX_DIRECTION_REQUIRED',
        path: 'facing.directionAxis',
        message: 'Beam and trail effects must declare a signed direction axis.',
      });
    }
  }

  if (!record(value.animation)) {
    issues.push({
      code: 'INVALID_VFX_ANIMATION',
      path: 'animation',
      message: 'animation is required, including an explicit static policy.',
    });
  } else {
    if (!enumValue(VFX_PLAYBACK_POLICIES, value.animation.playback)) {
      issues.push({
        code: 'INVALID_VFX_PLAYBACK',
        path: 'animation.playback',
        message: `playback must be one of ${VFX_PLAYBACK_POLICIES.join(', ')}.`,
      });
    }
    if (!finiteNonNegative(value.animation.durationSeconds)) {
      issues.push({
        code: 'INVALID_VFX_DURATION',
        path: 'animation.durationSeconds',
        message: 'durationSeconds must be finite and non-negative.',
      });
    }
    if (!enumValue(VFX_ENDPOINT_BEHAVIORS, value.animation.endpointBehavior)) {
      issues.push({
        code: 'INVALID_VFX_ENDPOINT',
        path: 'animation.endpointBehavior',
        message: `endpointBehavior must be one of ${VFX_ENDPOINT_BEHAVIORS.join(', ')}.`,
      });
    }
    if (!enumValue(VFX_RUNTIME_DRIVERS, value.animation.driver)) {
      issues.push({
        code: 'INVALID_VFX_DRIVER',
        path: 'animation.driver',
        message: `driver must be one of ${VFX_RUNTIME_DRIVERS.join(', ')}.`,
      });
    }
    if (value.animation.playback === 'static') {
      if (
        value.animation.durationSeconds !== 0 ||
        value.animation.driver !== 'none' ||
        value.animation.endpointBehavior !== 'none'
      ) {
        issues.push({
          code: 'INVALID_VFX_STATIC_POLICY',
          path: 'animation',
          message: 'Static effects require duration 0, driver none, and endpoint none.',
        });
      }
    } else {
      if (!finitePositive(value.animation.durationSeconds)) {
        issues.push({
          code: 'VFX_ANIMATION_DURATION_REQUIRED',
          path: 'animation.durationSeconds',
          message: 'Animated effects require a positive duration.',
        });
      }
      if (value.animation.driver === 'none') {
        issues.push({
          code: 'VFX_ANIMATION_DRIVER_REQUIRED',
          path: 'animation.driver',
          message: 'Animated effects require a clip or time-uniform driver.',
        });
      }
      if (
        value.animation.playback === 'loop' &&
        value.animation.endpointBehavior !== 'matchStart'
      ) {
        issues.push({
          code: 'VFX_LOOP_ENDPOINT_REQUIRED',
          path: 'animation.endpointBehavior',
          message: 'Looping effects must declare matchStart endpoint behavior.',
        });
      }
      if (
        value.animation.playback === 'oneShot' &&
        value.animation.endpointBehavior !== 'holdLast' &&
        value.animation.endpointBehavior !== 'disappear'
      ) {
        issues.push({
          code: 'VFX_ONESHOT_ENDPOINT_REQUIRED',
          path: 'animation.endpointBehavior',
          message: 'One-shot effects must hold the last state or disappear.',
        });
      }
    }
    if (value.animation.driver === 'clip' && !trimmed(value.animation.clipName)) {
      issues.push({
        code: 'VFX_CLIP_NAME_REQUIRED',
        path: 'animation.clipName',
        message: 'Clip-driven VFX requires a non-empty clipName.',
      });
    }
    if (value.animation.driver === 'timeUniform' && !trimmed(value.animation.timeUniformName)) {
      issues.push({
        code: 'VFX_TIME_UNIFORM_REQUIRED',
        path: 'animation.timeUniformName',
        message: 'Time-uniform VFX requires a non-empty timeUniformName.',
      });
    }
  }

  if (value.sidecar !== undefined) {
    if (
      !record(value.sidecar) ||
      value.sidecar.kind !== 'tsl' ||
      !trimmed(value.sidecar.id) ||
      !trimmed(value.sidecar.version)
    ) {
      issues.push({
        code: 'INVALID_VFX_SIDECAR',
        path: 'sidecar',
        message: 'sidecar requires kind tsl plus non-empty id and version.',
      });
    }
  }
  if (value.portability === 'portable' && value.sidecar !== undefined) {
    issues.push({
      code: 'VFX_PORTABLE_SIDECAR_CONFLICT',
      path: 'sidecar',
      message: 'Portable VFX cannot require a runtime shader sidecar.',
    });
  }
  if (value.portability === 'sidecar' && value.sidecar === undefined) {
    issues.push({
      code: 'VFX_SIDECAR_REQUIRED',
      path: 'sidecar',
      message: 'Sidecar VFX requires a versioned runtime sidecar descriptor.',
    });
  }
  if (value.subtype === 'runtimeShader' && value.portability !== 'sidecar') {
    issues.push({
      code: 'VFX_RUNTIME_SHADER_NOT_PORTABLE',
      path: 'portability',
      message: 'runtimeShader is an explicit nonportable sidecar subtype.',
    });
  }

  if (issues.length > 0) return { valid: false, issues };
  return { valid: true, value: cloneVfxIntentV1(value as unknown as VfxIntentV1), issues };
}

export const ASSET_SCOPES = ['single', 'cluster', 'modularSet', 'packMember'] as const;
export type AssetScope = (typeof ASSET_SCOPES)[number];

export interface AssetScopeIntentV1 {
  schemaVersion: 1;
  scope: AssetScope;
  /** True only when the user/product explicitly required the scope. */
  explicit: boolean;
}

export interface AssetScopeObservationV1 {
  topLevelAssetRoots: number;
  reusableMemberCount: number;
  sceneDressingRoles: string[];
}

export interface AssetScopeAssessmentV1 {
  schemaVersion: 1;
  requested: AssetScope;
  observed: 'single' | 'cluster';
  status: 'pass' | 'flagged';
  code?: 'ASSET_SCOPE_ACCIDENTAL_DIORAMA' | 'ASSET_SCOPE_EXPLICIT_SINGLE_CLUSTER';
  /** S-class signal only; default QA remains observe/warn, never a blocker. */
  explicitSingleViolation: boolean;
  evidence: string[];
}

export function assessAssetScopeV1(
  intent: AssetScopeIntentV1,
  observation: AssetScopeObservationV1,
): AssetScopeAssessmentV1 {
  const observed =
    observation.topLevelAssetRoots > 1 || observation.reusableMemberCount > 1
      ? 'cluster'
      : 'single';
  const dressing = [...new Set(observation.sceneDressingRoles.filter(trimmed))].sort();
  const accidentalDiorama = dressing.length > 0 && intent.scope !== 'cluster';
  const explicitSingleViolation =
    intent.scope === 'single' && intent.explicit && observed === 'cluster';
  const flagged = accidentalDiorama || explicitSingleViolation;
  return {
    schemaVersion: 1,
    requested: intent.scope,
    observed,
    status: flagged ? 'flagged' : 'pass',
    ...(flagged
      ? {
          code: explicitSingleViolation
            ? ('ASSET_SCOPE_EXPLICIT_SINGLE_CLUSTER' as const)
            : ('ASSET_SCOPE_ACCIDENTAL_DIORAMA' as const),
        }
      : {}),
    explicitSingleViolation,
    evidence: [
      `topLevelAssetRoots=${observation.topLevelAssetRoots}`,
      `reusableMemberCount=${observation.reusableMemberCount}`,
      ...(dressing.length > 0 ? [`sceneDressingRoles=${dressing.join(',')}`] : []),
    ],
  };
}

export type ModularVector3 = [number, number, number];
export type ModularQuaternion = [number, number, number, number];

export const KILN_DEFAULT_MODULAR_GRID: ModularVector3 = Object.freeze([1, 1, 1]) as ModularVector3;

/** Trusted request-side modular units/grid; artifact sockets remain engine-derived evidence. */
export interface ModularIntentV1 {
  schemaVersion: 1;
  units: 'm';
  grid: ModularVector3;
}

export interface ModularIntentV1Input {
  schemaVersion?: 1;
  units?: 'm';
  grid?: ModularVector3;
}

export interface ModularSocketContractV1 {
  id: string;
  pieceId: string;
  type: string;
  compatibleTypes: string[];
  frame: {
    translation: ModularVector3;
    rotation: ModularQuaternion;
  };
  allowedRotationsDegrees: number[];
}

export interface ModularKitContractV1 {
  schemaVersion: 1;
  units: 'm';
  grid: ModularVector3;
  sockets: ModularSocketContractV1[];
}

export interface ModularJoinObservationV1 {
  aSocketId: string;
  bSocketId: string;
  aWorldPosition: ModularVector3;
  bWorldPosition: ModularVector3;
  aWorldNormal: ModularVector3;
  bWorldNormal: ModularVector3;
  relativeRotationDegrees: number;
  toleranceMeters?: number;
  normalToleranceDegrees?: number;
}

export interface ModularJoinResultV1 {
  schemaVersion: 1;
  pass: boolean;
  compatible: boolean;
  rotationAllowed: boolean;
  gridAligned: boolean;
  seamMeters: number;
  overlapMeters: number;
  lateralOffsetMeters: number;
  normalErrorDegrees: number;
  toleranceMeters: number;
  codes: string[];
}

const finiteTuple = (value: unknown, length: number): value is number[] =>
  Array.isArray(value) &&
  value.length === length &&
  value.every((component) => typeof component === 'number' && Number.isFinite(component));

const stable = (value: number): number => Math.round(value * 1_000_000) / 1_000_000;

function normalizeVector(value: ModularVector3): ModularVector3 {
  const length = Math.hypot(...value);
  if (length <= 1e-9) throw new TypeError('Socket normals must be non-zero.');
  return [value[0] / length, value[1] / length, value[2] / length];
}

const dot = (a: ModularVector3, b: ModularVector3): number =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

const subtract = (a: ModularVector3, b: ModularVector3): ModularVector3 => [
  a[0] - b[0],
  a[1] - b[1],
  a[2] - b[2],
];

const multiply = (value: ModularVector3, scalar: number): ModularVector3 => [
  value[0] * scalar,
  value[1] * scalar,
  value[2] * scalar,
];

const length = (value: ModularVector3): number => Math.hypot(...value);

const normalizedDegrees = (value: number): number => {
  const normalized = ((value % 360) + 360) % 360;
  return Object.is(normalized, -0) ? 0 : normalized;
};

export function validateModularKitContractV1(
  value: unknown,
): BreadthValidationResult<ModularKitContractV1> {
  const issues: BreadthValidationIssue[] = [];
  if (!record(value)) {
    return {
      valid: false,
      issues: [
        { code: 'EXPECTED_OBJECT', path: '', message: 'ModularKitContractV1 must be an object.' },
      ],
    };
  }
  if (value.schemaVersion !== 1) {
    issues.push({
      code: 'UNSUPPORTED_SCHEMA_VERSION',
      path: 'schemaVersion',
      message: 'schemaVersion must be 1.',
    });
  }
  if (value.units !== 'm') {
    issues.push({
      code: 'INVALID_MODULAR_UNITS',
      path: 'units',
      message: 'Modular kit units must be meters.',
    });
  }
  if (!finiteTuple(value.grid, 3) || value.grid.some((component) => component <= 0)) {
    issues.push({
      code: 'INVALID_MODULAR_GRID',
      path: 'grid',
      message: 'grid must contain three positive meter steps.',
    });
  }
  const sockets = Array.isArray(value.sockets) ? value.sockets : [];
  if (!Array.isArray(value.sockets) || sockets.length < 2) {
    issues.push({
      code: 'INVALID_MODULAR_SOCKETS',
      path: 'sockets',
      message: 'A modular kit requires at least two sockets.',
    });
  }
  const ids = new Set<string>();
  for (const [index, socket] of sockets.entries()) {
    const path = `sockets[${index}]`;
    if (!record(socket)) {
      issues.push({ code: 'INVALID_MODULAR_SOCKET', path, message: `${path} must be an object.` });
      continue;
    }
    for (const field of ['id', 'pieceId', 'type'] as const) {
      if (!trimmed(socket[field])) {
        issues.push({
          code: 'INVALID_MODULAR_SOCKET_FIELD',
          path: `${path}.${field}`,
          message: `${field} is required.`,
        });
      }
    }
    if (trimmed(socket.id)) {
      if (ids.has(socket.id))
        issues.push({
          code: 'DUPLICATE_MODULAR_SOCKET',
          path: `${path}.id`,
          message: `Duplicate socket ${socket.id}.`,
        });
      ids.add(socket.id);
    }
    if (!Array.isArray(socket.compatibleTypes) || !socket.compatibleTypes.every(trimmed)) {
      issues.push({
        code: 'INVALID_MODULAR_COMPATIBILITY',
        path: `${path}.compatibleTypes`,
        message: 'compatibleTypes must contain strings.',
      });
    }
    if (
      !record(socket.frame) ||
      !finiteTuple(socket.frame.translation, 3) ||
      !finiteTuple(socket.frame.rotation, 4)
    ) {
      issues.push({
        code: 'INVALID_MODULAR_FRAME',
        path: `${path}.frame`,
        message: 'Socket frame requires finite translation and quaternion.',
      });
    } else if (Math.abs(Math.hypot(...socket.frame.rotation) - 1) > 1e-6) {
      issues.push({
        code: 'NON_UNIT_MODULAR_FRAME',
        path: `${path}.frame.rotation`,
        message: 'Socket frame quaternion must be normalized.',
      });
    }
    if (
      !Array.isArray(socket.allowedRotationsDegrees) ||
      socket.allowedRotationsDegrees.length === 0 ||
      !socket.allowedRotationsDegrees.every(
        (angle) => typeof angle === 'number' && Number.isFinite(angle),
      )
    ) {
      issues.push({
        code: 'INVALID_MODULAR_ROTATIONS',
        path: `${path}.allowedRotationsDegrees`,
        message: 'At least one finite allowed rotation is required.',
      });
    }
  }
  if (issues.length > 0) return { valid: false, issues };
  const contract = value as unknown as ModularKitContractV1;
  return {
    valid: true,
    value: {
      schemaVersion: 1,
      units: 'm',
      grid: [...contract.grid],
      sockets: contract.sockets.map((socket) => ({
        ...socket,
        compatibleTypes: [...socket.compatibleTypes],
        allowedRotationsDegrees: [...socket.allowedRotationsDegrees],
        frame: {
          translation: [...socket.frame.translation],
          rotation: [...socket.frame.rotation],
        },
      })),
    },
    issues,
  };
}

/** Exact two-piece snap evidence. Correct fixtures have zero seam and overlap within tolerance. */
export function evaluateModularJoinV1(
  kit: ModularKitContractV1,
  observation: ModularJoinObservationV1,
): ModularJoinResultV1 {
  const validated = validateModularKitContractV1(kit);
  if (!validated.valid)
    throw new TypeError('Cannot evaluate a join against an invalid modular kit.');
  const a = kit.sockets.find((socket) => socket.id === observation.aSocketId);
  const b = kit.sockets.find((socket) => socket.id === observation.bSocketId);
  if (!a || !b) throw new TypeError('Join observation references an unknown socket.');
  const toleranceMeters = observation.toleranceMeters ?? 0.0001;
  const normalToleranceDegrees = observation.normalToleranceDegrees ?? 0.1;
  if (!finiteNonNegative(toleranceMeters) || !finiteNonNegative(normalToleranceDegrees)) {
    throw new TypeError('Join tolerances must be finite and non-negative.');
  }
  const aNormal = normalizeVector(observation.aWorldNormal);
  const bNormal = normalizeVector(observation.bWorldNormal);
  const delta = subtract(observation.bWorldPosition, observation.aWorldPosition);
  const axial = dot(delta, aNormal);
  const lateral = length(subtract(delta, multiply(aNormal, axial)));
  const seamMeters = Math.max(0, axial);
  const overlapMeters = Math.max(0, -axial);
  const normalCosine = Math.max(-1, Math.min(1, dot(aNormal, bNormal)));
  const normalErrorDegrees = Math.abs(180 - (Math.acos(normalCosine) * 180) / Math.PI);
  const compatible = a.compatibleTypes.includes(b.type) && b.compatibleTypes.includes(a.type);
  const angle = normalizedDegrees(observation.relativeRotationDegrees);
  const rotationAllowed = [a, b].every((socket) =>
    socket.allowedRotationsDegrees.some(
      (allowed) => Math.abs(normalizedDegrees(allowed) - angle) <= 1e-6,
    ),
  );
  const gridAligned = [observation.aWorldPosition, observation.bWorldPosition].every((position) =>
    position.every((component, index) => {
      const step = kit.grid[index]!;
      return Math.abs(component / step - Math.round(component / step)) <= 1e-6;
    }),
  );
  const codes: string[] = [];
  if (!compatible) codes.push('MOD_SOCKET_INCOMPATIBLE');
  if (!rotationAllowed) codes.push('MOD_ROTATION_NOT_ALLOWED');
  if (!gridAligned) codes.push('MOD_GRID_MISALIGNED');
  if (seamMeters > toleranceMeters || lateral > toleranceMeters) codes.push('MOD_JOIN_SEAM');
  if (overlapMeters > toleranceMeters) codes.push('MOD_JOIN_OVERLAP');
  if (normalErrorDegrees > normalToleranceDegrees) codes.push('MOD_SOCKET_NORMAL_MISMATCH');
  return {
    schemaVersion: 1,
    pass: codes.length === 0,
    compatible,
    rotationAllowed,
    gridAligned,
    seamMeters: stable(seamMeters),
    overlapMeters: stable(overlapMeters),
    lateralOffsetMeters: stable(lateral),
    normalErrorDegrees: stable(normalErrorDegrees),
    toleranceMeters,
    codes,
  };
}

export const REFERENCE_QA_RUN_MODES = ['bench', 'flagged', 'sample'] as const;
export type ReferenceQaRunMode = (typeof REFERENCE_QA_RUN_MODES)[number];

export interface ReferenceViewAssumptionV1 {
  id: string;
  targetViewId: string;
  projection: 'perspective' | 'orthographic' | 'unknown';
  mirrored: boolean;
  materialVisibility: 'full' | 'partial' | 'unknown';
}

export interface ReferenceAgreementSampleV1 {
  assumptionId: string;
  silhouetteIntersectionPixels: number;
  silhouetteUnionPixels: number;
  meanMaterialDeltaE?: number;
}

export interface ReferenceAgreementReportV1 {
  schemaVersion: 1;
  scheduled: boolean;
  runMode?: ReferenceQaRunMode;
  silhouetteAgreement: number | null;
  materialAgreement: number | null;
  structuralReadiness: 'pass' | 'warn' | 'block' | 'notEvaluated';
  evaluatedViews: string[];
  insufficientEvidenceViews: string[];
  assumptionIssues: string[];
  disposition: 'observe';
  repairEligible: false;
}

export function shouldRunReferenceQa(value: unknown): value is ReferenceQaRunMode {
  return enumValue(REFERENCE_QA_RUN_MODES, value);
}

export function validateReferenceViewAssumptionsV1(
  value: unknown,
): BreadthValidationResult<ReferenceViewAssumptionV1[]> {
  const issues: BreadthValidationIssue[] = [];
  if (!Array.isArray(value) || value.length === 0) {
    return {
      valid: false,
      issues: [
        {
          code: 'REFERENCE_VIEWS_REQUIRED',
          path: 'assumptions',
          message: 'At least one reference-view assumption is required.',
        },
      ],
    };
  }
  const ids = new Set<string>();
  for (const [index, assumption] of value.entries()) {
    const path = `assumptions[${index}]`;
    if (!record(assumption)) {
      issues.push({ code: 'INVALID_REFERENCE_VIEW', path, message: `${path} must be an object.` });
      continue;
    }
    for (const field of ['id', 'targetViewId'] as const) {
      if (!trimmed(assumption[field])) {
        issues.push({
          code: 'INVALID_REFERENCE_VIEW_FIELD',
          path: `${path}.${field}`,
          message: `${field} must be a trimmed non-empty string.`,
        });
      }
    }
    if (trimmed(assumption.id)) {
      if (ids.has(assumption.id)) {
        issues.push({
          code: 'DUPLICATE_REFERENCE_VIEW_ID',
          path: `${path}.id`,
          message: `Duplicate reference-view assumption ${assumption.id}.`,
        });
      }
      ids.add(assumption.id);
    }
    if (!['perspective', 'orthographic', 'unknown'].includes(String(assumption.projection))) {
      issues.push({
        code: 'INVALID_REFERENCE_PROJECTION',
        path: `${path}.projection`,
        message: 'projection must be perspective, orthographic, or unknown.',
      });
    }
    if (typeof assumption.mirrored !== 'boolean') {
      issues.push({
        code: 'INVALID_REFERENCE_MIRRORED',
        path: `${path}.mirrored`,
        message: 'mirrored must be boolean.',
      });
    }
    if (!['full', 'partial', 'unknown'].includes(String(assumption.materialVisibility))) {
      issues.push({
        code: 'INVALID_REFERENCE_MATERIAL_VISIBILITY',
        path: `${path}.materialVisibility`,
        message: 'materialVisibility must be full, partial, or unknown.',
      });
    }
  }
  if (issues.length > 0) return { valid: false, issues };
  return {
    valid: true,
    value: (value as ReferenceViewAssumptionV1[]).map((assumption) => ({ ...assumption })),
    issues,
  };
}

/**
 * Score reference agreement only for Bench, flagged, or sampled work. Silhouette
 * and material agreement remain separate from structural readiness and cannot
 * trigger a hard failure or automatic repair.
 */
export function scoreReferenceAgreementV1(input: {
  runMode: unknown;
  assumptions: readonly ReferenceViewAssumptionV1[];
  samples: readonly ReferenceAgreementSampleV1[];
  structuralReadiness: ReferenceAgreementReportV1['structuralReadiness'];
}): ReferenceAgreementReportV1 {
  const validatedAssumptions = validateReferenceViewAssumptionsV1(input.assumptions);
  const assumptions = validatedAssumptions.value ?? [];
  if (!shouldRunReferenceQa(input.runMode)) {
    return {
      schemaVersion: 1,
      scheduled: false,
      silhouetteAgreement: null,
      materialAgreement: null,
      structuralReadiness: input.structuralReadiness,
      evaluatedViews: [],
      insufficientEvidenceViews: assumptions.map((assumption) => assumption.id).sort(),
      assumptionIssues: validatedAssumptions.issues.map((issue) => issue.code),
      disposition: 'observe',
      repairEligible: false,
    };
  }
  const assumptionIds = new Set(assumptions.map((assumption) => assumption.id));
  const silhouette: number[] = [];
  const material: number[] = [];
  const evaluatedViews: string[] = [];
  for (const sample of input.samples) {
    if (!assumptionIds.has(sample.assumptionId)) continue;
    if (
      !finiteNonNegative(sample.silhouetteIntersectionPixels) ||
      !finitePositive(sample.silhouetteUnionPixels) ||
      sample.silhouetteIntersectionPixels > sample.silhouetteUnionPixels
    ) {
      continue;
    }
    silhouette.push(sample.silhouetteIntersectionPixels / sample.silhouetteUnionPixels);
    if (finiteNonNegative(sample.meanMaterialDeltaE)) {
      material.push(Math.max(0, 1 - Math.min(100, sample.meanMaterialDeltaE) / 100));
    }
    evaluatedViews.push(sample.assumptionId);
  }
  const evaluated = [...new Set(evaluatedViews)].sort();
  const insufficient = assumptions
    .map((assumption) => assumption.id)
    .filter((id) => !evaluated.includes(id))
    .sort();
  const mean = (values: number[]): number | null =>
    values.length > 0
      ? stable(values.reduce((sum, value) => sum + value, 0) / values.length)
      : null;
  return {
    schemaVersion: 1,
    scheduled: true,
    runMode: input.runMode,
    silhouetteAgreement: mean(silhouette),
    materialAgreement: mean(material),
    structuralReadiness: input.structuralReadiness,
    evaluatedViews: evaluated,
    insufficientEvidenceViews: insufficient,
    assumptionIssues: validatedAssumptions.issues.map((issue) => issue.code),
    disposition: 'observe',
    repairEligible: false,
  };
}

/**
 * Deterministic local-space geometry relation probes.
 *
 * These probes deliberately operate on oriented boxes and explicit rigid
 * frames. They do not collapse assets into global AABBs, so a shared parent
 * transform, a rotated assembly, or a narrow diagonal part retains its true
 * relationship. Evidence is always localized in the reference box's frame.
 */

export type ProbeVector3 = [number, number, number];
export type ProbeQuaternion = [number, number, number, number];
export type ProbeLocalAxis = 'x' | 'y' | 'z';

export interface ProbeLocalFrame3 {
  id: string;
  origin: ProbeVector3;
  xAxis: ProbeVector3;
  yAxis: ProbeVector3;
  zAxis: ProbeVector3;
}

export interface OrientedProbeBox3 {
  id: string;
  frame: ProbeLocalFrame3;
  halfExtents: ProbeVector3;
}

export type GeometryRelation =
  | 'contact'
  | 'containment'
  | 'clearance'
  | 'concentricity'
  | 'alignment'
  | 'coverage'
  | 'penetration';

export interface LocalizedProbePoint {
  label: string;
  position: ProbeVector3;
}

export interface GeometryProbeEvidence {
  subjectId: string;
  referenceId: string;
  coordinateSpace: 'reference-local';
  referenceFrameId: string;
  /** Direction expressed in the reference frame. */
  axis?: ProbeVector3;
  axisLabel?: string;
  points: LocalizedProbePoint[];
}

export interface GeometryProbeResult {
  relation: GeometryRelation;
  pass: boolean;
  /** Stable scalar output. All distances are meters and angles are degrees. */
  measurements: Record<string, number>;
  evidence: GeometryProbeEvidence;
}

export interface ContactProbeOptions {
  maxSeparation?: number;
  maxPenetration?: number;
}

export interface ContainmentProbeOptions {
  tolerance?: number;
}

export interface ClearanceProbeOptions {
  minimumClearance: number;
  /** Optional directed reference-local clearance, useful for headroom or a wheel well. */
  axis?: ProbeLocalAxis;
  direction?: 1 | -1;
  tolerance?: number;
}

export interface AlignmentProbeOptions {
  subjectAxis?: ProbeLocalAxis;
  referenceAxis?: ProbeLocalAxis;
  allowOpposite?: boolean;
  maxAngleDegrees?: number;
  maxLateralOffset?: number;
}

export interface ConcentricityProbeOptions extends AlignmentProbeOptions {
  maxRadialOffset?: number;
}

export interface CoverageProbeOptions {
  /** Face normal in the reference box's local frame. */
  normalAxis?: ProbeLocalAxis;
  minimumRatio?: number;
  tolerance?: number;
}

export interface PenetrationProbeOptions {
  maxDepth?: number;
  tolerance?: number;
}

interface ProjectionInterval {
  min: number;
  max: number;
}

interface SatResult {
  separation: number;
  penetration: number;
  axisWorld: ProbeVector3;
  axisLabel: string;
}

type Point2 = [number, number];

const EPSILON = 1e-10;
const DEFAULT_TOLERANCE = 1e-6;

const finiteVector = (value: readonly number[]): boolean =>
  value.length === 3 && value.every((component) => Number.isFinite(component));

const add = (a: readonly number[], b: readonly number[]): ProbeVector3 => [
  a[0]! + b[0]!,
  a[1]! + b[1]!,
  a[2]! + b[2]!,
];

const subtract = (a: readonly number[], b: readonly number[]): ProbeVector3 => [
  a[0]! - b[0]!,
  a[1]! - b[1]!,
  a[2]! - b[2]!,
];

const scale = (value: readonly number[], amount: number): ProbeVector3 => [
  value[0]! * amount,
  value[1]! * amount,
  value[2]! * amount,
];

const dot = (a: readonly number[], b: readonly number[]): number =>
  a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;

const cross = (a: readonly number[], b: readonly number[]): ProbeVector3 => [
  a[1]! * b[2]! - a[2]! * b[1]!,
  a[2]! * b[0]! - a[0]! * b[2]!,
  a[0]! * b[1]! - a[1]! * b[0]!,
];

const length = (value: readonly number[]): number => Math.hypot(value[0]!, value[1]!, value[2]!);

const normalize = (value: readonly number[]): ProbeVector3 => {
  const magnitude = length(value);
  if (magnitude <= EPSILON) throw new TypeError('Cannot normalize a zero-length probe axis.');
  return scale(value, 1 / magnitude);
};

const stable = (value: number): number => {
  if (Math.abs(value) < 1e-10) return 0;
  return Number(value.toFixed(9));
};

const stableVector = (value: readonly number[]): ProbeVector3 => [
  stable(value[0]!),
  stable(value[1]!),
  stable(value[2]!),
];

const assertNonNegative = (value: number, name: string): void => {
  if (!Number.isFinite(value) || value < 0) {
    throw new TypeError(`${name} must be a finite non-negative number.`);
  }
};

const axes = (frame: ProbeLocalFrame3): [ProbeVector3, ProbeVector3, ProbeVector3] => [
  frame.xAxis,
  frame.yAxis,
  frame.zAxis,
];

const axisIndex = (axis: ProbeLocalAxis): 0 | 1 | 2 => (axis === 'x' ? 0 : axis === 'y' ? 1 : 2);

const axisVector = (frame: ProbeLocalFrame3, axis: ProbeLocalAxis): ProbeVector3 =>
  axes(frame)[axisIndex(axis)];

/** Build a checked right-handed orthonormal frame. */
export function createProbeLocalFrame3(input: ProbeLocalFrame3): ProbeLocalFrame3 {
  if (!input.id.trim()) throw new TypeError('Probe frame ID must be non-empty.');
  if (!finiteVector(input.origin)) throw new TypeError('Probe frame origin must be finite.');
  const basis = [input.xAxis, input.yAxis, input.zAxis] as const;
  for (const [index, value] of basis.entries()) {
    if (!finiteVector(value) || Math.abs(length(value) - 1) > 1e-6) {
      throw new TypeError(`Probe frame axis ${index} must be finite and normalized within 1e-6.`);
    }
  }
  if (
    Math.abs(dot(input.xAxis, input.yAxis)) > 1e-6 ||
    Math.abs(dot(input.xAxis, input.zAxis)) > 1e-6 ||
    Math.abs(dot(input.yAxis, input.zAxis)) > 1e-6 ||
    dot(cross(input.xAxis, input.yAxis), input.zAxis) < 1 - 1e-6
  ) {
    throw new TypeError('Probe frame axes must be orthonormal and right-handed.');
  }
  return {
    id: input.id,
    origin: stableVector(input.origin),
    xAxis: stableVector(input.xAxis),
    yAxis: stableVector(input.yAxis),
    zAxis: stableVector(input.zAxis),
  };
}

/** Convenience constructor for a rigid frame from a unit quaternion. */
export function probeLocalFrameFromQuaternion(
  id: string,
  origin: ProbeVector3,
  quaternion: ProbeQuaternion,
): ProbeLocalFrame3 {
  if (!quaternion.every((component) => Number.isFinite(component))) {
    throw new TypeError('Probe frame quaternion must be finite.');
  }
  const quaternionLength = Math.hypot(...quaternion);
  if (Math.abs(quaternionLength - 1) > 1e-6) {
    throw new TypeError('Probe frame quaternion must be normalized within 1e-6.');
  }
  const [x, y, z, w] = quaternion;
  const xx = x * x;
  const yy = y * y;
  const zz = z * z;
  const xy = x * y;
  const xz = x * z;
  const yz = y * z;
  const wx = w * x;
  const wy = w * y;
  const wz = w * z;
  return createProbeLocalFrame3({
    id,
    origin,
    xAxis: [1 - 2 * (yy + zz), 2 * (xy + wz), 2 * (xz - wy)],
    yAxis: [2 * (xy - wz), 1 - 2 * (xx + zz), 2 * (yz + wx)],
    zAxis: [2 * (xz + wy), 2 * (yz - wx), 1 - 2 * (xx + yy)],
  });
}

export function createOrientedProbeBox3(input: OrientedProbeBox3): OrientedProbeBox3 {
  if (!input.id.trim()) throw new TypeError('Oriented probe box ID must be non-empty.');
  if (!finiteVector(input.halfExtents) || input.halfExtents.some((extent) => extent <= 0)) {
    throw new TypeError('Oriented probe box half-extents must be finite and greater than zero.');
  }
  return {
    id: input.id,
    frame: createProbeLocalFrame3(input.frame),
    halfExtents: stableVector(input.halfExtents),
  };
}

export function worldPointToProbeLocal(
  frame: ProbeLocalFrame3,
  worldPoint: ProbeVector3,
): ProbeVector3 {
  const offset = subtract(worldPoint, frame.origin);
  return stableVector([
    dot(offset, frame.xAxis),
    dot(offset, frame.yAxis),
    dot(offset, frame.zAxis),
  ]);
}

export function probeLocalPointToWorld(
  frame: ProbeLocalFrame3,
  localPoint: ProbeVector3,
): ProbeVector3 {
  return stableVector(
    add(
      frame.origin,
      add(
        scale(frame.xAxis, localPoint[0]),
        add(scale(frame.yAxis, localPoint[1]), scale(frame.zAxis, localPoint[2])),
      ),
    ),
  );
}

function worldVectorToProbeLocal(frame: ProbeLocalFrame3, worldVector: ProbeVector3): ProbeVector3 {
  return stableVector([
    dot(worldVector, frame.xAxis),
    dot(worldVector, frame.yAxis),
    dot(worldVector, frame.zAxis),
  ]);
}

function corners(box: OrientedProbeBox3): ProbeVector3[] {
  const boxAxes = axes(box.frame);
  const result: ProbeVector3[] = [];
  for (let bits = 0; bits < 8; bits++) {
    let point: ProbeVector3 = [...box.frame.origin];
    for (let dimension = 0; dimension < 3; dimension++) {
      const sign = bits & (1 << dimension) ? 1 : -1;
      point = add(point, scale(boxAxes[dimension]!, sign * box.halfExtents[dimension]!));
    }
    result.push(stableVector(point));
  }
  return result;
}

function projection(box: OrientedProbeBox3, axisWorld: ProbeVector3): ProjectionInterval {
  const center = dot(box.frame.origin, axisWorld);
  const radius = axes(box.frame).reduce(
    (total, boxAxis, index) => total + Math.abs(dot(boxAxis, axisWorld)) * box.halfExtents[index]!,
    0,
  );
  return { min: center - radius, max: center + radius };
}

function orientFromReferenceToSubject(
  axisWorld: ProbeVector3,
  subject: OrientedProbeBox3,
  reference: OrientedProbeBox3,
): ProbeVector3 {
  return dot(subtract(subject.frame.origin, reference.frame.origin), axisWorld) < 0
    ? scale(axisWorld, -1)
    : axisWorld;
}

function candidateSatAxes(
  subject: OrientedProbeBox3,
  reference: OrientedProbeBox3,
): Array<{ axis: ProbeVector3; label: string }> {
  const subjectAxes = axes(subject.frame);
  const referenceAxes = axes(reference.frame);
  const candidates: Array<{ axis: ProbeVector3; label: string }> = [];
  const pushUnique = (rawAxis: ProbeVector3, label: string): void => {
    if (length(rawAxis) <= EPSILON) return;
    const axis = normalize(rawAxis);
    if (candidates.some((candidate) => Math.abs(dot(candidate.axis, axis)) > 1 - 1e-9)) return;
    candidates.push({ axis, label });
  };
  for (let index = 0; index < 3; index++) {
    pushUnique(referenceAxes[index]!, `reference.${(['x', 'y', 'z'] as const)[index]}`);
  }
  for (let index = 0; index < 3; index++) {
    pushUnique(subjectAxes[index]!, `subject.${(['x', 'y', 'z'] as const)[index]}`);
  }
  for (let subjectIndex = 0; subjectIndex < 3; subjectIndex++) {
    for (let referenceIndex = 0; referenceIndex < 3; referenceIndex++) {
      pushUnique(
        cross(subjectAxes[subjectIndex]!, referenceAxes[referenceIndex]!),
        `cross.subject.${(['x', 'y', 'z'] as const)[subjectIndex]}.reference.${
          (['x', 'y', 'z'] as const)[referenceIndex]
        }`,
      );
    }
  }
  return candidates;
}

function sat(subject: OrientedProbeBox3, reference: OrientedProbeBox3): SatResult {
  let maximumSeparation = -Infinity;
  let separatingAxis: ProbeVector3 = reference.frame.xAxis;
  let separatingLabel = 'reference.x';
  let minimumOverlap = Infinity;
  let overlapAxis: ProbeVector3 = reference.frame.xAxis;
  let overlapLabel = 'reference.x';

  for (const candidate of candidateSatAxes(subject, reference)) {
    const subjectProjection = projection(subject, candidate.axis);
    const referenceProjection = projection(reference, candidate.axis);
    const gap = Math.max(
      subjectProjection.min - referenceProjection.max,
      referenceProjection.min - subjectProjection.max,
    );
    if (gap > maximumSeparation) {
      maximumSeparation = gap;
      separatingAxis = candidate.axis;
      separatingLabel = candidate.label;
    }
    const overlap =
      Math.min(subjectProjection.max, referenceProjection.max) -
      Math.max(subjectProjection.min, referenceProjection.min);
    if (overlap < minimumOverlap) {
      minimumOverlap = overlap;
      overlapAxis = candidate.axis;
      overlapLabel = candidate.label;
    }
  }

  if (maximumSeparation > 0) {
    return {
      separation: stable(maximumSeparation),
      penetration: 0,
      axisWorld: orientFromReferenceToSubject(separatingAxis, subject, reference),
      axisLabel: separatingLabel,
    };
  }
  return {
    separation: 0,
    penetration: stable(Math.max(0, minimumOverlap)),
    axisWorld: orientFromReferenceToSubject(overlapAxis, subject, reference),
    axisLabel: overlapLabel,
  };
}

function supportPoint(box: OrientedProbeBox3, direction: ProbeVector3): ProbeVector3 {
  let point: ProbeVector3 = [...box.frame.origin];
  axes(box.frame).forEach((boxAxis, index) => {
    const projectionValue = dot(boxAxis, direction);
    if (Math.abs(projectionValue) <= EPSILON) return;
    point = add(point, scale(boxAxis, Math.sign(projectionValue) * box.halfExtents[index]!));
  });
  return stableVector(point);
}

function evidence(
  subject: OrientedProbeBox3,
  reference: OrientedProbeBox3,
  points: LocalizedProbePoint[],
  axisWorld?: ProbeVector3,
  axisLabel?: string,
): GeometryProbeEvidence {
  return {
    subjectId: subject.id,
    referenceId: reference.id,
    coordinateSpace: 'reference-local',
    referenceFrameId: reference.frame.id,
    ...(axisWorld ? { axis: worldVectorToProbeLocal(reference.frame, axisWorld) } : {}),
    ...(axisLabel ? { axisLabel } : {}),
    points,
  };
}

function satEvidencePoints(
  subject: OrientedProbeBox3,
  reference: OrientedProbeBox3,
  axisWorld: ProbeVector3,
): LocalizedProbePoint[] {
  return [
    {
      label: `${reference.id}.support`,
      position: worldPointToProbeLocal(reference.frame, supportPoint(reference, axisWorld)),
    },
    {
      label: `${subject.id}.support`,
      position: worldPointToProbeLocal(
        reference.frame,
        supportPoint(subject, scale(axisWorld, -1)),
      ),
    },
  ];
}

/** Contact passes only near the surface: both a visible gap and deep overlap fail. */
export function probeOrientedContact(
  subject: OrientedProbeBox3,
  reference: OrientedProbeBox3,
  options: ContactProbeOptions = {},
): GeometryProbeResult {
  const maxSeparation = options.maxSeparation ?? DEFAULT_TOLERANCE;
  const maxPenetration = options.maxPenetration ?? DEFAULT_TOLERANCE;
  assertNonNegative(maxSeparation, 'maxSeparation');
  assertNonNegative(maxPenetration, 'maxPenetration');
  const relation = sat(subject, reference);
  return {
    relation: 'contact',
    pass: relation.separation <= maxSeparation && relation.penetration <= maxPenetration,
    measurements: {
      separation: relation.separation,
      penetration: relation.penetration,
      signedDistance: relation.separation > 0 ? relation.separation : stable(-relation.penetration),
      maxSeparation,
      maxPenetration,
    },
    evidence: evidence(
      subject,
      reference,
      satEvidencePoints(subject, reference, relation.axisWorld),
      relation.axisWorld,
      relation.axisLabel,
    ),
  };
}

export function probeOrientedContainment(
  subject: OrientedProbeBox3,
  reference: OrientedProbeBox3,
  options: ContainmentProbeOptions = {},
): GeometryProbeResult {
  const tolerance = options.tolerance ?? DEFAULT_TOLERANCE;
  assertNonNegative(tolerance, 'tolerance');
  let maximumOutsideDistance = 0;
  let minimumInteriorMargin = Infinity;
  const localized = corners(subject).map((corner, index) => ({
    label: `${subject.id}.corner.${index}`,
    position: worldPointToProbeLocal(reference.frame, corner),
  }));
  const outside: LocalizedProbePoint[] = [];
  for (const point of localized) {
    const overflow = point.position.map((component, index) =>
      Math.max(0, Math.abs(component) - reference.halfExtents[index]!),
    );
    const outsideDistance = Math.hypot(...overflow);
    maximumOutsideDistance = Math.max(maximumOutsideDistance, outsideDistance);
    minimumInteriorMargin = Math.min(
      minimumInteriorMargin,
      ...point.position.map(
        (component, index) => reference.halfExtents[index]! - Math.abs(component),
      ),
    );
    if (outsideDistance > tolerance) outside.push(point);
  }
  const mostExposed = [...localized].sort((a, b) => {
    const aOverflow = Math.max(
      ...a.position.map((value, index) => Math.abs(value) - reference.halfExtents[index]!),
    );
    const bOverflow = Math.max(
      ...b.position.map((value, index) => Math.abs(value) - reference.halfExtents[index]!),
    );
    return bOverflow - aOverflow || a.label.localeCompare(b.label);
  })[0]!;
  return {
    relation: 'containment',
    pass: maximumOutsideDistance <= tolerance,
    measurements: {
      maximumOutsideDistance: stable(maximumOutsideDistance),
      minimumInteriorMargin: stable(minimumInteriorMargin),
      tolerance,
      outsideCornerCount: outside.length,
    },
    evidence: evidence(subject, reference, outside.length > 0 ? outside : [mostExposed]),
  };
}

export function probeOrientedClearance(
  subject: OrientedProbeBox3,
  reference: OrientedProbeBox3,
  options: ClearanceProbeOptions,
): GeometryProbeResult {
  const tolerance = options.tolerance ?? DEFAULT_TOLERANCE;
  assertNonNegative(options.minimumClearance, 'minimumClearance');
  assertNonNegative(tolerance, 'tolerance');

  let clearance: number;
  let penetration: number;
  let probeAxis: ProbeVector3;
  let axisLabel: string;
  if (options.axis) {
    const direction = options.direction ?? 1;
    probeAxis = scale(axisVector(reference.frame, options.axis), direction);
    axisLabel = `reference.${options.axis}${direction === -1 ? '.negative' : '.positive'}`;
    const subjectProjection = projection(subject, probeAxis);
    const referenceProjection = projection(reference, probeAxis);
    const signedClearance = subjectProjection.min - referenceProjection.max;
    clearance = stable(Math.max(0, signedClearance));
    penetration = stable(Math.max(0, -signedClearance));
  } else {
    const relation = sat(subject, reference);
    clearance = relation.separation;
    penetration = relation.penetration;
    probeAxis = relation.axisWorld;
    axisLabel = relation.axisLabel;
  }

  return {
    relation: 'clearance',
    pass: clearance + tolerance >= options.minimumClearance && penetration <= tolerance,
    measurements: {
      clearance,
      penetration,
      minimumClearance: options.minimumClearance,
      tolerance,
    },
    evidence: evidence(
      subject,
      reference,
      satEvidencePoints(subject, reference, probeAxis),
      probeAxis,
      axisLabel,
    ),
  };
}

function angleBetweenAxes(
  subjectAxis: ProbeVector3,
  referenceAxis: ProbeVector3,
  allowOpposite: boolean,
): number {
  let cosine = Math.max(
    -1,
    Math.min(
      1,
      allowOpposite ? Math.abs(dot(subjectAxis, referenceAxis)) : dot(subjectAxis, referenceAxis),
    ),
  );
  if (Math.abs(1 - cosine) < 1e-8) cosine = 1;
  if (Math.abs(-1 - cosine) < 1e-8) cosine = -1;
  return stable((Math.acos(cosine) * 180) / Math.PI);
}

function lateralOffset(
  subject: OrientedProbeBox3,
  reference: OrientedProbeBox3,
  referenceAxis: ProbeVector3,
): number {
  const offset = subtract(subject.frame.origin, reference.frame.origin);
  const axial = scale(referenceAxis, dot(offset, referenceAxis));
  return stable(length(subtract(offset, axial)));
}

export function probeOrientedAlignment(
  subject: OrientedProbeBox3,
  reference: OrientedProbeBox3,
  options: AlignmentProbeOptions = {},
): GeometryProbeResult {
  const subjectAxisName = options.subjectAxis ?? 'x';
  const referenceAxisName = options.referenceAxis ?? 'x';
  const maxAngleDegrees = options.maxAngleDegrees ?? 1;
  const maxLateralOffset = options.maxLateralOffset ?? DEFAULT_TOLERANCE;
  assertNonNegative(maxAngleDegrees, 'maxAngleDegrees');
  assertNonNegative(maxLateralOffset, 'maxLateralOffset');
  const subjectAxis = axisVector(subject.frame, subjectAxisName);
  const referenceAxis = axisVector(reference.frame, referenceAxisName);
  const angleDegrees = angleBetweenAxes(subjectAxis, referenceAxis, options.allowOpposite ?? false);
  const offset = lateralOffset(subject, reference, referenceAxis);
  const localizedCenter = worldPointToProbeLocal(reference.frame, subject.frame.origin);
  return {
    relation: 'alignment',
    pass: angleDegrees <= maxAngleDegrees && offset <= maxLateralOffset,
    measurements: { angleDegrees, lateralOffset: offset, maxAngleDegrees, maxLateralOffset },
    evidence: evidence(
      subject,
      reference,
      [
        { label: `${reference.id}.center`, position: [0, 0, 0] },
        { label: `${subject.id}.center`, position: localizedCenter },
      ],
      referenceAxis,
      `reference.${referenceAxisName}`,
    ),
  };
}

export function probeOrientedConcentricity(
  subject: OrientedProbeBox3,
  reference: OrientedProbeBox3,
  options: ConcentricityProbeOptions = {},
): GeometryProbeResult {
  const subjectAxisName = options.subjectAxis ?? 'x';
  const referenceAxisName = options.referenceAxis ?? 'x';
  const maxRadialOffset = options.maxRadialOffset ?? DEFAULT_TOLERANCE;
  const maxAngleDegrees = options.maxAngleDegrees ?? 1;
  assertNonNegative(maxRadialOffset, 'maxRadialOffset');
  assertNonNegative(maxAngleDegrees, 'maxAngleDegrees');
  const subjectAxis = axisVector(subject.frame, subjectAxisName);
  const referenceAxis = axisVector(reference.frame, referenceAxisName);
  const offset = subtract(subject.frame.origin, reference.frame.origin);
  const axialOffset = stable(dot(offset, referenceAxis));
  const radialOffset = stable(length(subtract(offset, scale(referenceAxis, axialOffset))));
  const angleDegrees = angleBetweenAxes(subjectAxis, referenceAxis, options.allowOpposite ?? true);
  return {
    relation: 'concentricity',
    pass: radialOffset <= maxRadialOffset && angleDegrees <= maxAngleDegrees,
    measurements: {
      radialOffset,
      axialOffset,
      angleDegrees,
      maxRadialOffset,
      maxAngleDegrees,
    },
    evidence: evidence(
      subject,
      reference,
      [
        { label: `${reference.id}.axisOrigin`, position: [0, 0, 0] },
        {
          label: `${subject.id}.axisOrigin`,
          position: worldPointToProbeLocal(reference.frame, subject.frame.origin),
        },
      ],
      referenceAxis,
      `reference.${referenceAxisName}`,
    ),
  };
}

function cross2(origin: Point2, a: Point2, b: Point2): number {
  return (a[0] - origin[0]) * (b[1] - origin[1]) - (a[1] - origin[1]) * (b[0] - origin[0]);
}

function convexHull(points: Point2[]): Point2[] {
  const unique = [
    ...new Map(points.map((point) => [`${stable(point[0])},${stable(point[1])}`, point])).values(),
  ]
    .map((point): Point2 => [stable(point[0]), stable(point[1])])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (unique.length <= 2) return unique;
  const lower: Point2[] = [];
  for (const point of unique) {
    while (lower.length >= 2 && cross2(lower.at(-2)!, lower.at(-1)!, point) <= EPSILON) lower.pop();
    lower.push(point);
  }
  const upper: Point2[] = [];
  for (let index = unique.length - 1; index >= 0; index--) {
    const point = unique[index]!;
    while (upper.length >= 2 && cross2(upper.at(-2)!, upper.at(-1)!, point) <= EPSILON) upper.pop();
    upper.push(point);
  }
  lower.pop();
  upper.pop();
  return [...lower, ...upper];
}

function clipPolygon(
  polygon: Point2[],
  coordinate: 0 | 1,
  boundary: number,
  keepGreater: boolean,
): Point2[] {
  if (polygon.length === 0) return [];
  const result: Point2[] = [];
  const inside = (point: Point2): boolean =>
    keepGreater ? point[coordinate] >= boundary - EPSILON : point[coordinate] <= boundary + EPSILON;
  let previous = polygon.at(-1)!;
  let previousInside = inside(previous);
  for (const current of polygon) {
    const currentInside = inside(current);
    if (currentInside !== previousInside) {
      const denominator = current[coordinate] - previous[coordinate];
      const t =
        Math.abs(denominator) <= EPSILON ? 0 : (boundary - previous[coordinate]) / denominator;
      result.push([
        stable(previous[0] + (current[0] - previous[0]) * t),
        stable(previous[1] + (current[1] - previous[1]) * t),
      ]);
    }
    if (currentInside) result.push(current);
    previous = current;
    previousInside = currentInside;
  }
  return result;
}

function polygonArea(polygon: Point2[]): number {
  if (polygon.length < 3) return 0;
  let twiceArea = 0;
  for (let index = 0; index < polygon.length; index++) {
    const current = polygon[index]!;
    const next = polygon[(index + 1) % polygon.length]!;
    twiceArea += current[0] * next[1] - current[1] * next[0];
  }
  return Math.abs(twiceArea) / 2;
}

export function probeOrientedCoverage(
  subject: OrientedProbeBox3,
  reference: OrientedProbeBox3,
  options: CoverageProbeOptions = {},
): GeometryProbeResult {
  const normalAxis = options.normalAxis ?? 'y';
  const minimumRatio = options.minimumRatio ?? 0.99;
  const tolerance = options.tolerance ?? DEFAULT_TOLERANCE;
  if (!Number.isFinite(minimumRatio) || minimumRatio < 0 || minimumRatio > 1) {
    throw new TypeError('minimumRatio must be between zero and one.');
  }
  assertNonNegative(tolerance, 'tolerance');
  const normalIndex = axisIndex(normalAxis);
  const planeIndices = ([0, 1, 2] as const).filter((index) => index !== normalIndex) as [
    0 | 1 | 2,
    0 | 1 | 2,
  ];
  const projected = convexHull(
    corners(subject).map((corner) => {
      const local = worldPointToProbeLocal(reference.frame, corner);
      return [local[planeIndices[0]], local[planeIndices[1]]];
    }),
  );
  let covered = projected;
  for (const planeDimension of [0, 1] as const) {
    const extent = reference.halfExtents[planeIndices[planeDimension]]!;
    covered = clipPolygon(covered, planeDimension, -extent, true);
    covered = clipPolygon(covered, planeDimension, extent, false);
  }
  const targetArea =
    4 * reference.halfExtents[planeIndices[0]]! * reference.halfExtents[planeIndices[1]]!;
  const projectedArea = polygonArea(projected);
  const coveredArea = Math.min(targetArea, polygonArea(covered));
  const coverageRatio = targetArea <= EPSILON ? 0 : coveredArea / targetArea;
  const localCenter = worldPointToProbeLocal(reference.frame, subject.frame.origin);
  const evidencePoints: LocalizedProbePoint[] = covered.map((point, index) => {
    const position: ProbeVector3 = [0, 0, 0];
    position[planeIndices[0]] = point[0];
    position[planeIndices[1]] = point[1];
    position[normalIndex] = 0;
    return { label: `coveredPolygon.${index}`, position };
  });
  return {
    relation: 'coverage',
    pass: coverageRatio + tolerance >= minimumRatio,
    measurements: {
      coverageRatio: stable(coverageRatio),
      coveredArea: stable(coveredArea),
      uncoveredArea: stable(Math.max(0, targetArea - coveredArea)),
      projectedArea: stable(projectedArea),
      targetArea: stable(targetArea),
      normalOffset: stable(Math.abs(localCenter[normalIndex])),
      minimumRatio,
      tolerance,
    },
    evidence: evidence(
      subject,
      reference,
      evidencePoints,
      axisVector(reference.frame, normalAxis),
      `reference.${normalAxis}`,
    ),
  };
}

export function probeOrientedPenetration(
  subject: OrientedProbeBox3,
  reference: OrientedProbeBox3,
  options: PenetrationProbeOptions = {},
): GeometryProbeResult {
  const maxDepth = options.maxDepth ?? 0;
  const tolerance = options.tolerance ?? DEFAULT_TOLERANCE;
  assertNonNegative(maxDepth, 'maxDepth');
  assertNonNegative(tolerance, 'tolerance');
  const relation = sat(subject, reference);
  return {
    relation: 'penetration',
    pass: relation.penetration <= maxDepth + tolerance,
    measurements: {
      penetrationDepth: relation.penetration,
      separation: relation.separation,
      maxDepth,
      tolerance,
    },
    evidence: evidence(
      subject,
      reference,
      satEvidencePoints(subject, reference, relation.axisWorld),
      relation.axisWorld,
      relation.axisLabel,
    ),
  };
}

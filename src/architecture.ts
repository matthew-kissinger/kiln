/** Correct-by-construction architecture scaffolds in Kiln's +X/+Y/+Z frame. */
import * as THREE from 'three';

import {
  stampSemanticMetadataV1,
  type SemanticLocalFrameV1,
  type SemanticRelationshipV1,
} from './contracts';

export type RidgeAxis = 'x' | 'z';
export type RoofSide = 'positive' | 'negative';

export interface GableRoofOptions {
  /** Exact footprint extent along world/local X, in meters. */
  spanX: number;
  /** Exact footprint extent along world/local Z, in meters. */
  spanZ: number;
  /** Ridge rise above the wall bearing line. Supply rise or pitchDegrees. */
  rise?: number;
  /** Pitch from horizontal. Supply pitchDegrees or rise. */
  pitchDegrees?: number;
  overhang?: number;
  ridgeAxis?: RidgeAxis;
  thickness?: number;
  parent?: THREE.Object3D;
}

export interface RoofFaceDimensions {
  alongRidge: number;
  downhill: number;
  thickness: number;
}

/**
 * A face-owned rigid frame. Local +X is ridge tangent, +Y is outward normal,
 * and +Z is downhill. World properties are getters, so parent transforms made
 * after construction cannot stale them.
 */
export interface RoofFaceFrame {
  side: RoofSide;
  ridgeAxis: RidgeAxis;
  roofRoot: THREE.Object3D;
  localToRoof: THREE.Matrix4;
  readonly localToWorld: THREE.Matrix4;
  readonly ridgeTangent: THREE.Vector3;
  readonly downhillDirection: THREE.Vector3;
  readonly outwardNormal: THREE.Vector3;
  readonly ridgeStart: THREE.Vector3;
  readonly ridgeEnd: THREE.Vector3;
  readonly eaveStart: THREE.Vector3;
  readonly eaveEnd: THREE.Vector3;
  dimensions: RoofFaceDimensions;
}

export interface GableRoofResult {
  root: THREE.Object3D;
  slopes: [THREE.Object3D, THREE.Object3D];
  faces: [RoofFaceFrame, RoofFaceFrame];
  rise: number;
  pitchDegrees: number;
}

export interface RoofPlanesOptions {
  /** Compatibility name for spanZ. */
  width: number;
  /** Compatibility name for spanX. */
  depth: number;
  /** Compatibility rise from the outer eave to the ridge. */
  height: number;
  overhang?: number;
  ridgeAxis?: RidgeAxis;
  thickness?: number;
  parent?: THREE.Object3D;
}

export interface GableOpening {
  id?: string;
  offset?: number;
  bottom?: number;
  width: number;
  height: number;
}

export interface GableEndPanelOptions {
  span: number;
  rise: number;
  thickness?: number;
  ridgeAxis?: RidgeAxis;
  side?: RoofSide;
  openings?: readonly GableOpening[];
  parent?: THREE.Object3D;
}

export interface GableEndPanelResult {
  root: THREE.Object3D;
  geometry: THREE.BufferGeometry;
  openings: THREE.Object3D[];
}

export type ShellWall = 'front' | 'back' | 'left' | 'right';

export interface GableShellOpening {
  id?: string;
  wall: ShellWall;
  kind?: 'door' | 'window';
  offset?: number;
  width?: number;
  height?: number;
  sill?: number;
  depth?: number;
}

export interface GableShellMaterials {
  wall: THREE.Material;
  roof: THREE.Material;
  floor?: THREE.Material;
  gable?: THREE.Material;
}

export interface GableShellOptions extends GableRoofOptions {
  wallHeight?: number;
  wallThickness?: number;
  floorThickness?: number;
  closedEnds?: boolean;
  enterable?: boolean;
  openings?: readonly GableShellOpening[];
  gableOpenings?: Partial<Record<RoofSide, readonly GableOpening[]>>;
}

export interface GableShellResult {
  root: THREE.Object3D;
  walls: Record<ShellWall, THREE.Object3D>;
  floor: THREE.Object3D;
  roof: GableRoofResult;
  gables: [THREE.Object3D, THREE.Object3D] | [];
  openings: THREE.Object3D[];
}

export type RoofSurfaceLayoutKind = 'panels' | 'shingles' | 'seams' | 'corrugations';

export interface RoofSurfaceLayoutOptions {
  face: RoofFaceFrame;
  kind: RoofSurfaceLayoutKind;
  parent?: THREE.Object3D;
  panelWidth?: number;
  rowHeight?: number;
  spacing?: number;
  thickness?: number;
}

export interface RoofSurfaceLayoutResult {
  root: THREE.Object3D;
  items: THREE.Object3D[];
}

const DEG = Math.PI / 180;
const EPSILON = 1e-7;

function positive(value: number, name: string): number {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be finite and > 0`);
  return value;
}

function nonNegative(value: number, name: string): number {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} must be finite and >= 0`);
  return value;
}

function roleMetadata(
  roles: readonly string[],
  relationships: readonly SemanticRelationshipV1[] = [],
  frames: readonly SemanticLocalFrameV1[] = [],
) {
  return { roles, relationships, frames, sockets: [] };
}

function relationship(kind: string, target: string): SemanticRelationshipV1 {
  return { kind, target, targetType: 'role' };
}

function setTransform(object: THREE.Object3D, matrix: THREE.Matrix4): void {
  matrix.decompose(object.position, object.quaternion, object.scale);
}

function resolvePitch(
  halfRun: number,
  rise: number | undefined,
  pitchDegrees: number | undefined,
): { rise: number; pitchDegrees: number } {
  positive(halfRun, 'roof half-run');
  if (rise === undefined && pitchDegrees === undefined) pitchDegrees = 30;
  if (pitchDegrees !== undefined) {
    if (!Number.isFinite(pitchDegrees) || pitchDegrees <= 0 || pitchDegrees >= 89) {
      throw new RangeError('pitchDegrees must be finite, > 0, and < 89');
    }
  }
  if (rise !== undefined) positive(rise, 'rise');
  const resolvedPitch = pitchDegrees ?? Math.atan2(rise!, halfRun) / DEG;
  const resolvedRise = rise ?? Math.tan(resolvedPitch * DEG) * halfRun;
  const expected = Math.tan(resolvedPitch * DEG) * halfRun;
  if (Math.abs(resolvedRise - expected) > Math.max(EPSILON, expected * 1e-6)) {
    throw new RangeError('rise and pitchDegrees disagree for the requested footprint');
  }
  return { rise: resolvedRise, pitchDegrees: resolvedPitch };
}

interface ResolvedRoofProfile {
  spanX: number;
  spanZ: number;
  ridgeAxis: RidgeAxis;
  overhang: number;
  thickness: number;
  rise: number;
  pitchDegrees: number;
  ridgeY: number;
  eaveY: number;
}

function resolveRoofProfile(options: GableRoofOptions): ResolvedRoofProfile {
  const spanX = positive(options.spanX, 'spanX');
  const spanZ = positive(options.spanZ, 'spanZ');
  const ridgeAxis = options.ridgeAxis ?? 'x';
  const overhang = nonNegative(options.overhang ?? 0.3, 'overhang');
  const thickness = positive(options.thickness ?? 0.08, 'thickness');
  const halfRun = (ridgeAxis === 'x' ? spanZ : spanX) / 2;
  const pitch = resolvePitch(halfRun, options.rise, options.pitchDegrees);
  return {
    spanX,
    spanZ,
    ridgeAxis,
    overhang,
    thickness,
    ...pitch,
    ridgeY: pitch.rise,
    eaveY: -Math.tan(pitch.pitchDegrees * DEG) * overhang,
  };
}

function buildFace(
  roofRoot: THREE.Object3D,
  profile: ResolvedRoofProfile,
  sideSign: 1 | -1,
): RoofFaceFrame {
  const side: RoofSide = sideSign > 0 ? 'positive' : 'negative';
  const halfFoot = (profile.ridgeAxis === 'x' ? profile.spanZ : profile.spanX) / 2;
  const horizontalRun = halfFoot + profile.overhang;
  const verticalRun = profile.ridgeY - profile.eaveY;
  const downhillLength = Math.hypot(horizontalRun, verticalRun);
  const alongRidge =
    (profile.ridgeAxis === 'x' ? profile.spanX : profile.spanZ) + profile.overhang * 2;
  const downhill =
    profile.ridgeAxis === 'x'
      ? new THREE.Vector3(0, -verticalRun, sideSign * horizontalRun).normalize()
      : new THREE.Vector3(sideSign * horizontalRun, -verticalRun, 0).normalize();
  const tangent =
    profile.ridgeAxis === 'x'
      ? new THREE.Vector3(sideSign, 0, 0)
      : new THREE.Vector3(0, 0, -sideSign);
  const normal = downhill.clone().cross(tangent).normalize();
  const localToRoof = new THREE.Matrix4().makeBasis(tangent, normal, downhill);
  localToRoof.setPosition(0, profile.ridgeY, 0);

  const world = (): THREE.Matrix4 => {
    roofRoot.updateWorldMatrix(true, false);
    return roofRoot.matrixWorld.clone().multiply(localToRoof);
  };
  const direction = (axis: THREE.Vector3): THREE.Vector3 =>
    axis.clone().transformDirection(world());
  const point = (x: number, z: number): THREE.Vector3 =>
    new THREE.Vector3(x, 0, z).applyMatrix4(world());

  return {
    side,
    ridgeAxis: profile.ridgeAxis,
    roofRoot,
    localToRoof,
    get localToWorld() {
      return world();
    },
    get ridgeTangent() {
      return direction(new THREE.Vector3(1, 0, 0));
    },
    get downhillDirection() {
      return direction(new THREE.Vector3(0, 0, 1));
    },
    get outwardNormal() {
      return direction(new THREE.Vector3(0, 1, 0));
    },
    get ridgeStart() {
      return point(-alongRidge / 2, 0);
    },
    get ridgeEnd() {
      return point(alongRidge / 2, 0);
    },
    get eaveStart() {
      return point(-alongRidge / 2, downhillLength);
    },
    get eaveEnd() {
      return point(alongRidge / 2, downhillLength);
    },
    dimensions: { alongRidge, downhill: downhillLength, thickness: profile.thickness },
  };
}

function buildRoof(
  name: string,
  material: THREE.Material,
  profile: ResolvedRoofProfile,
  parent?: THREE.Object3D,
): GableRoofResult {
  const root = new THREE.Object3D();
  root.name = name;
  if (parent) parent.add(root);
  stampSemanticMetadataV1(
    root,
    roleMetadata(['roof.assembly'], [relationship('separable-from', 'architecture.shell.gable')]),
  );

  const faces = [buildFace(root, profile, 1), buildFace(root, profile, -1)] as const;
  const buildSlope = (face: RoofFaceFrame): THREE.Object3D => {
    const geometry = new THREE.BoxGeometry(
      face.dimensions.alongRidge,
      profile.thickness,
      face.dimensions.downhill,
    );
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `Mesh_${name}_${face.side}`;
    const center = new THREE.Matrix4().makeTranslation(
      0,
      -profile.thickness / 2,
      face.dimensions.downhill / 2,
    );
    setTransform(mesh, face.localToRoof.clone().multiply(center));
    const coveredWall =
      profile.ridgeAxis === 'x'
        ? face.side === 'positive'
          ? 'wall.right'
          : 'wall.left'
        : face.side === 'positive'
          ? 'wall.front'
          : 'wall.back';
    stampSemanticMetadataV1(
      mesh,
      roleMetadata(
        [`roof.slope.${face.side}`],
        [
          relationship(
            'adjacent-to',
            `roof.slope.${face.side === 'positive' ? 'negative' : 'positive'}`,
          ),
          relationship('coverage-of', coveredWall),
          relationship('separable-from', 'architecture.shell.gable'),
        ],
        [
          { id: 'surface', translation: [0, profile.thickness / 2, 0], rotation: [0, 0, 0, 1] },
          {
            id: 'ridge',
            translation: [0, profile.thickness / 2, -face.dimensions.downhill / 2],
            rotation: [0, 0, 0, 1],
          },
          {
            id: 'eave',
            translation: [0, profile.thickness / 2, face.dimensions.downhill / 2],
            rotation: [0, 0, 0, 1],
          },
        ],
      ),
    );
    root.add(mesh);
    return mesh;
  };
  const slopes: [THREE.Object3D, THREE.Object3D] = [buildSlope(faces[0]), buildSlope(faces[1])];
  return {
    root,
    slopes,
    faces: [faces[0], faces[1]],
    rise: profile.rise,
    pitchDegrees: profile.pitchDegrees,
  };
}

/** Explicit-axis, wall-bearing gable roof. */
export function createGableRoof(
  name: string,
  material: THREE.Material,
  options: GableRoofOptions,
): GableRoofResult {
  return buildRoof(name, material, resolveRoofProfile(options), options.parent);
}

/** Tested compatibility wrapper: width maps to spanZ and depth maps to spanX. */
export function createRoofPlanes(
  name: string,
  material: THREE.Material,
  options: RoofPlanesOptions,
): GableRoofResult {
  const ridgeAxis = options.ridgeAxis ?? 'x';
  const overhang = nonNegative(options.overhang ?? 0.3, 'overhang');
  const halfFoot =
    (ridgeAxis === 'x' ? positive(options.width, 'width') : positive(options.depth, 'depth')) / 2;
  const totalRun = halfFoot + overhang;
  const height = positive(options.height, 'height');
  const pitchDegrees = Math.atan2(height, totalRun) / DEG;
  const profile = resolveRoofProfile({
    spanX: options.depth,
    spanZ: options.width,
    ridgeAxis,
    overhang,
    thickness: options.thickness,
    rise: Math.tan(pitchDegrees * DEG) * halfFoot,
  });
  // Legacy API defined the outer eave at Y=0 and ridge at Y=height.
  profile.ridgeY = height;
  profile.eaveY = 0;
  profile.pitchDegrees = pitchDegrees;
  return buildRoof(name, material, profile, options.parent);
}

function openingFitsTriangle(
  opening: Required<Omit<GableOpening, 'id'>>,
  span: number,
  rise: number,
): boolean {
  const half = span / 2;
  const left = opening.offset - opening.width / 2;
  const right = opening.offset + opening.width / 2;
  const top = opening.bottom + opening.height;
  const maxAt = (u: number) => rise * (1 - Math.abs(u) / half);
  return (
    left > -half && right < half && opening.bottom >= 0 && top < Math.min(maxAt(left), maxAt(right))
  );
}

/** Exact extruded triangular gable panel with optional rectangular holes. */
export function createGableEndPanel(
  name: string,
  material: THREE.Material,
  options: GableEndPanelOptions,
): GableEndPanelResult {
  const span = positive(options.span, 'span');
  const rise = positive(options.rise, 'rise');
  const thickness = positive(options.thickness ?? 0.15, 'thickness');
  const ridgeAxis = options.ridgeAxis ?? 'x';
  const side = options.side ?? 'positive';
  const half = span / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-half, 0);
  shape.lineTo(half, 0);
  shape.lineTo(0, rise);
  shape.closePath();

  const normalized = (options.openings ?? []).map((opening) => ({
    id: opening.id,
    offset: opening.offset ?? 0,
    bottom: opening.bottom ?? 0.25,
    width: positive(opening.width, 'opening.width'),
    height: positive(opening.height, 'opening.height'),
  }));
  for (const opening of normalized) {
    if (!openingFitsTriangle(opening, span, rise))
      throw new RangeError('gable opening must fit strictly inside the triangular boundary');
    const left = opening.offset - opening.width / 2;
    const right = opening.offset + opening.width / 2;
    const bottom = opening.bottom;
    const top = bottom + opening.height;
    const hole = new THREE.Path();
    hole.moveTo(left, bottom);
    hole.lineTo(left, top);
    hole.lineTo(right, top);
    hole.lineTo(right, bottom);
    hole.closePath();
    shape.holes.push(hole);
  }

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
    steps: 1,
  });
  geometry.translate(0, 0, -thickness / 2);
  if (ridgeAxis === 'x') geometry.rotateY(-Math.PI / 2);
  geometry.computeVertexNormals();
  const root = new THREE.Mesh(geometry, material);
  root.name = `Mesh_${name}`;
  stampSemanticMetadataV1(
    root,
    roleMetadata(
      [`roof.gable.${side}`],
      [
        relationship('adjacent-to', 'roof.slope.positive'),
        relationship('adjacent-to', 'roof.slope.negative'),
        relationship(
          'coverage-of',
          ridgeAxis === 'x'
            ? side === 'positive'
              ? 'wall.front'
              : 'wall.back'
            : side === 'positive'
              ? 'wall.right'
              : 'wall.left',
        ),
        relationship('separable-from', 'architecture.shell.gable'),
      ],
      [
        { id: 'base', translation: [0, 0, 0], rotation: [0, 0, 0, 1] },
        {
          id: 'apex',
          translation: ridgeAxis === 'x' ? [0, rise, 0] : [0, rise, 0],
          rotation: [0, 0, 0, 1],
        },
      ],
    ),
  );
  const markers = normalized.map((opening, index) => {
    const marker = new THREE.Object3D();
    marker.name = `Opening_${name}_${opening.id ?? index + 1}`;
    marker.position.set(
      ridgeAxis === 'z' ? opening.offset : 0,
      opening.bottom + opening.height / 2,
      ridgeAxis === 'x' ? opening.offset : 0,
    );
    marker.scale.set(
      ridgeAxis === 'x' ? thickness : opening.width,
      opening.height,
      ridgeAxis === 'x' ? opening.width : thickness,
    );
    stampSemanticMetadataV1(
      marker,
      roleMetadata(
        [`opening.gable.${side}.${opening.id ?? index + 1}`],
        [relationship('cutout-of', `roof.gable.${side}`)],
      ),
    );
    root.add(marker);
    return marker;
  });
  if (options.parent) options.parent.add(root);
  return { root, geometry, openings: markers };
}

function wallRunAxis(wall: ShellWall): RidgeAxis {
  return wall === 'front' || wall === 'back' ? 'z' : 'x';
}

function wallNeighbors(wall: ShellWall): [ShellWall, ShellWall] {
  return wall === 'front' || wall === 'back' ? ['left', 'right'] : ['front', 'back'];
}

function createShellWall(
  name: string,
  wall: ShellWall,
  material: THREE.Material,
  length: number,
  height: number,
  thickness: number,
  openings: readonly GableShellOpening[],
): { root: THREE.Object3D; openings: THREE.Object3D[] } {
  const axis = wallRunAxis(wall);
  const root = new THREE.Object3D();
  root.name = `${name}_Wall_${wall}`;
  const neighbors = wallNeighbors(wall);
  stampSemanticMetadataV1(
    root,
    roleMetadata(
      [`wall.${wall}`],
      [
        relationship('adjacent-to', `wall.${neighbors[0]}`),
        relationship('adjacent-to', `wall.${neighbors[1]}`),
        relationship('adjacent-to', 'floor'),
      ],
    ),
  );

  const sorted = openings
    .map((opening, index) => ({
      ...opening,
      id: opening.id ?? `${opening.kind ?? 'door'}-${index + 1}`,
      kind: opening.kind ?? 'door',
      offset: opening.offset ?? 0,
      width: positive(opening.width ?? (opening.kind === 'window' ? 1 : 1.1), 'opening.width'),
      height: positive(opening.height ?? (opening.kind === 'window' ? 1 : 2.1), 'opening.height'),
      sill: opening.kind === 'window' ? nonNegative(opening.sill ?? 1, 'opening.sill') : 0,
      depth: positive(opening.depth ?? thickness, 'opening.depth'),
    }))
    .sort((a, b) => a.offset - b.offset);
  if (sorted.length > 1)
    throw new RangeError('the minimal gable shell supports at most one opening per wall');

  const panel = (suffix: string, lo: number, hi: number, y0: number, y1: number): void => {
    if (hi - lo <= EPSILON || y1 - y0 <= EPSILON) return;
    const geometry =
      axis === 'x'
        ? new THREE.BoxGeometry(hi - lo, y1 - y0, thickness)
        : new THREE.BoxGeometry(thickness, y1 - y0, hi - lo);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `Mesh_${name}_${wall}_${suffix}`;
    mesh.position.set(
      axis === 'x' ? (lo + hi) / 2 : 0,
      (y0 + y1) / 2,
      axis === 'z' ? (lo + hi) / 2 : 0,
    );
    root.add(mesh);
  };
  const markers: THREE.Object3D[] = [];
  const opening = sorted[0];
  if (!opening) panel('solid', -length / 2, length / 2, 0, height);
  else {
    const left = opening.offset - opening.width / 2;
    const right = opening.offset + opening.width / 2;
    const top = opening.sill + opening.height;
    if (left <= -length / 2 || right >= length / 2 || top >= height)
      throw new RangeError(`opening on wall.${wall} must fit strictly inside the wall boundary`);
    panel('left', -length / 2, left, 0, height);
    panel('right', right, length / 2, 0, height);
    panel('lintel', left, right, top, height);
    if (opening.sill > 0) panel('sill', left, right, 0, opening.sill);
    const marker = new THREE.Object3D();
    marker.name = `Opening_${wall}_${opening.id}`;
    marker.position.set(
      axis === 'x' ? opening.offset : 0,
      opening.sill + opening.height / 2,
      axis === 'z' ? opening.offset : 0,
    );
    marker.scale.set(
      axis === 'x' ? opening.width : opening.depth,
      opening.height,
      axis === 'z' ? opening.width : opening.depth,
    );
    stampSemanticMetadataV1(
      marker,
      roleMetadata(
        [`opening.${wall}.${opening.kind}`],
        [
          relationship('cutout-of', `wall.${wall}`),
          relationship(
            opening.kind === 'door' ? 'portal-through' : 'aperture-through',
            `wall.${wall}`,
          ),
        ],
        [{ id: 'clearance', translation: [0, 0, 0], rotation: [0, 0, 0, 1] }],
      ),
    );
    root.add(marker);
    markers.push(marker);
  }
  return { root, openings: markers };
}

/** Closed-by-default room, floor, two roof slopes, and two exact gable ends. */
export function createGableShell(
  name: string,
  materials: GableShellMaterials,
  options: GableShellOptions,
): GableShellResult {
  const spanX = positive(options.spanX, 'spanX');
  const spanZ = positive(options.spanZ, 'spanZ');
  const wallHeight = positive(options.wallHeight ?? 2.8, 'wallHeight');
  const wallThickness = positive(options.wallThickness ?? 0.15, 'wallThickness');
  const floorThickness = positive(options.floorThickness ?? 0.1, 'floorThickness');
  const ridgeAxis = options.ridgeAxis ?? 'x';
  const closedEnds = options.closedEnds ?? true;
  const enterable = options.enterable ?? true;
  const shellOpenings =
    options.openings ?? (enterable ? [{ wall: 'front' as const, kind: 'door' as const }] : []);
  const root = new THREE.Object3D();
  root.name = name;
  if (options.parent) options.parent.add(root);
  stampSemanticMetadataV1(
    root,
    roleMetadata(
      ['architecture.shell.gable'],
      [relationship('contains', 'floor'), relationship('contains', 'roof.assembly')],
    ),
  );

  const wallSpecs: Record<ShellWall, { length: number; position: [number, number, number] }> = {
    front: { length: spanZ, position: [spanX / 2, 0, 0] },
    back: { length: spanZ, position: [-spanX / 2, 0, 0] },
    left: { length: spanX, position: [0, 0, -spanZ / 2] },
    right: { length: spanX, position: [0, 0, spanZ / 2] },
  };
  const walls = {} as Record<ShellWall, THREE.Object3D>;
  const openingMarkers: THREE.Object3D[] = [];
  for (const wall of ['front', 'back', 'left', 'right'] as const) {
    const built = createShellWall(
      name,
      wall,
      materials.wall,
      wallSpecs[wall].length,
      wallHeight,
      wallThickness,
      shellOpenings.filter((opening) => opening.wall === wall),
    );
    built.root.position.set(...wallSpecs[wall].position);
    root.add(built.root);
    walls[wall] = built.root;
    openingMarkers.push(...built.openings);
  }
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(spanX, floorThickness, spanZ),
    materials.floor ?? materials.wall,
  );
  floor.name = `Mesh_${name}_Floor`;
  floor.position.y = -floorThickness / 2;
  stampSemanticMetadataV1(
    floor,
    roleMetadata(
      ['floor'],
      ['front', 'back', 'left', 'right'].map((wall) => relationship('adjacent-to', `wall.${wall}`)),
    ),
  );
  root.add(floor);

  const roof = createGableRoof('Roof', materials.roof, {
    ...options,
    spanX,
    spanZ,
    ridgeAxis,
    parent: root,
  });
  roof.root.position.y = wallHeight;
  let gables: [THREE.Object3D, THREE.Object3D] | [] = [];
  if (closedEnds) {
    const gableMaterial = materials.gable ?? materials.wall;
    const span = ridgeAxis === 'x' ? spanZ : spanX;
    const ridgeSpan = ridgeAxis === 'x' ? spanX : spanZ;
    const positiveEnd = createGableEndPanel(`${name}_Gable_positive`, gableMaterial, {
      span,
      rise: roof.rise,
      thickness: wallThickness,
      ridgeAxis,
      side: 'positive',
      openings: options.gableOpenings?.positive,
      parent: roof.root,
    });
    const negativeEnd = createGableEndPanel(`${name}_Gable_negative`, gableMaterial, {
      span,
      rise: roof.rise,
      thickness: wallThickness,
      ridgeAxis,
      side: 'negative',
      openings: options.gableOpenings?.negative,
      parent: roof.root,
    });
    const coordinate = ridgeSpan / 2;
    positiveEnd.root.position.set(
      ridgeAxis === 'x' ? coordinate : 0,
      0,
      ridgeAxis === 'z' ? coordinate : 0,
    );
    negativeEnd.root.position.set(
      ridgeAxis === 'x' ? -coordinate : 0,
      0,
      ridgeAxis === 'z' ? -coordinate : 0,
    );
    gables = [positiveEnd.root, negativeEnd.root];
    openingMarkers.push(...positiveEnd.openings, ...negativeEnd.openings);
  }
  return { root, walls, floor, roof, gables, openings: openingMarkers };
}

/** Matrix-driven roof-local panels, shingles, seams, or corrugations. */
export function createRoofSurfaceLayout(
  name: string,
  material: THREE.Material,
  options: RoofSurfaceLayoutOptions,
): RoofSurfaceLayoutResult {
  const parent = options.parent ?? options.face.roofRoot;
  const root = new THREE.Object3D();
  root.name = name;
  parent.add(root);
  stampSemanticMetadataV1(
    root,
    roleMetadata(
      [`roof.surface.${options.kind}`],
      [relationship('coverage-of', `roof.slope.${options.face.side}`)],
    ),
  );
  root.updateWorldMatrix(true, false);
  const faceToRoot = root.matrixWorld.clone().invert().multiply(options.face.localToWorld);
  const thickness = positive(options.thickness ?? 0.025, 'thickness');
  const along = options.face.dimensions.alongRidge;
  const downhill = options.face.dimensions.downhill;
  const specs: Array<{ width: number; length: number; x: number; z: number }> = [];

  if (options.kind === 'panels') {
    const count = Math.max(1, Math.ceil(along / positive(options.panelWidth ?? 0.9, 'panelWidth')));
    const width = along / count;
    for (let i = 0; i < count; i++)
      specs.push({
        width: width * 0.98,
        length: downhill,
        x: -along / 2 + width * (i + 0.5),
        z: downhill / 2,
      });
  } else if (options.kind === 'shingles') {
    const rowHeight = positive(options.rowHeight ?? 0.32, 'rowHeight');
    const tileWidth = positive(options.panelWidth ?? 0.42, 'panelWidth');
    const rows = Math.max(1, Math.ceil(downhill / rowHeight));
    const columns = Math.max(1, Math.ceil(along / tileWidth));
    for (let row = 0; row < rows; row++) {
      const length = Math.min(rowHeight * 1.08, downhill);
      for (let column = 0; column < columns; column++) {
        const offset = row % 2 === 0 ? 0 : tileWidth / 2;
        const x = -along / 2 + tileWidth * (column + 0.5) + offset;
        if (x + tileWidth / 2 <= along / 2 + EPSILON)
          specs.push({
            width: tileWidth * 0.96,
            length,
            x,
            z: Math.min(downhill - length / 2, row * rowHeight + length / 2),
          });
      }
    }
  } else {
    const spacing = positive(options.spacing ?? (options.kind === 'seams' ? 0.6 : 0.18), 'spacing');
    const count = Math.max(2, Math.floor(along / spacing) + 1);
    const width = options.kind === 'seams' ? 0.025 : 0.018;
    for (let i = 0; i < count; i++)
      specs.push({
        width,
        length: downhill,
        x: -along / 2 + (along * i) / (count - 1),
        z: downhill / 2,
      });
  }

  const items = specs.map((spec, index) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(spec.width, thickness, spec.length),
      material,
    );
    mesh.name = `Mesh_${name}_${index + 1}`;
    const local = new THREE.Matrix4().makeTranslation(spec.x, thickness / 2 + 0.002, spec.z);
    setTransform(mesh, faceToRoot.clone().multiply(local));
    root.add(mesh);
    return mesh;
  });
  return { root, items };
}

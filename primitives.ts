/**
 * Kiln Primitives Library
 *
 * High-level helpers for 3D asset creation.
 * Claude generates code using these primitives to keep files small.
 *
 * Copied from packages/client/src/lib/kiln/primitives.ts as the canonical
 * source in @pixel-forge/core. The headless variant in scripts/export-glb.ts
 * was verified structurally identical; the two have been reconciled here.
 */

import * as THREE from 'three';

type Vec3Tuple = [number, number, number];

function vectorToTuple(v: THREE.Vector3): Vec3Tuple {
  return [v.x, v.y, v.z];
}

// =============================================================================
// Geometry Helpers
// =============================================================================

/**
 * Creates the root Object3D for an asset.
 */
export function createRoot(name: string): THREE.Object3D {
  const root = new THREE.Object3D();
  root.name = name;
  return root;
}

/**
 * Creates a pivot (empty Object3D) for skeletal animation.
 * Pivots are the joints that get animated; meshes are children.
 */
export function createPivot(
  name: string,
  position: [number, number, number] = [0, 0, 0],
  parent?: THREE.Object3D
): THREE.Object3D {
  const pivot = new THREE.Object3D();
  pivot.name = `Joint_${name}`;
  pivot.position.set(...position);
  if (parent) parent.add(pivot);
  return pivot;
}

/**
 * Creates a mesh with automatic pivot wrapping for animation.
 * The mesh is automatically added to `parent` if provided.
 *
 * Returns the added Object3D (mesh or pivot) for reference.
 * NOTE: Do NOT call .add() on the return value - it's already added!
 */
export function createPart(
  name: string,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  options: {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
    pivot?: boolean; // Wrap in pivot for animation
    parent?: THREE.Object3D;
  } = {}
): THREE.Object3D {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = `Mesh_${name}`;

  if (options.position) mesh.position.set(...options.position);
  if (options.rotation) mesh.rotation.set(
    THREE.MathUtils.degToRad(options.rotation[0]),
    THREE.MathUtils.degToRad(options.rotation[1]),
    THREE.MathUtils.degToRad(options.rotation[2]),
  );
  if (options.scale) mesh.scale.set(...options.scale);

  if (options.pivot) {
    const pivot = new THREE.Object3D();
    pivot.name = `Joint_${name}`;
    pivot.add(mesh);
    mesh.position.set(0, 0, 0); // Reset - pivot controls position
    if (options.position) pivot.position.set(...options.position);
    if (options.parent) options.parent.add(pivot);
    return pivot; // Return the pivot (the animatable node)
  }

  if (options.parent) options.parent.add(mesh);
  return mesh; // Return the mesh
}

// =============================================================================
// Common Shapes (game-ready low-poly)
// =============================================================================

export function capsuleGeo(
  radius: number,
  height: number,
  segments = 6
): THREE.CapsuleGeometry {
  return new THREE.CapsuleGeometry(radius, height, 2, segments);
}

export function capsuleXGeo(
  radius: number,
  length: number,
  segments = 6
): THREE.CapsuleGeometry {
  const geo = capsuleGeo(radius, length, segments);
  geo.rotateZ(-Math.PI / 2);
  return geo;
}

export function capsuleZGeo(
  radius: number,
  length: number,
  segments = 6
): THREE.CapsuleGeometry {
  const geo = capsuleGeo(radius, length, segments);
  geo.rotateX(Math.PI / 2);
  return geo;
}

export function cylinderGeo(
  radiusTop: number,
  radiusBottom: number,
  height: number,
  segments = 8
): THREE.CylinderGeometry {
  return new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments);
}

export function cylinderXGeo(
  radiusTop: number,
  radiusBottom: number,
  length: number,
  segments = 8
): THREE.CylinderGeometry {
  const geo = cylinderGeo(radiusTop, radiusBottom, length, segments);
  geo.rotateZ(-Math.PI / 2);
  return geo;
}

export function cylinderZGeo(
  radiusTop: number,
  radiusBottom: number,
  length: number,
  segments = 8
): THREE.CylinderGeometry {
  const geo = cylinderGeo(radiusTop, radiusBottom, length, segments);
  geo.rotateX(Math.PI / 2);
  return geo;
}

export function boxGeo(
  width: number,
  height: number,
  depth: number
): THREE.BoxGeometry {
  return new THREE.BoxGeometry(width, height, depth);
}

export function sphereGeo(
  radius: number,
  widthSegments = 8,
  heightSegments = 6
): THREE.SphereGeometry {
  return new THREE.SphereGeometry(radius, widthSegments, heightSegments);
}

export function coneGeo(
  radius: number,
  height: number,
  segments = 8
): THREE.ConeGeometry {
  return new THREE.ConeGeometry(radius, height, segments);
}

export function coneXGeo(
  radius: number,
  length: number,
  segments = 8
): THREE.ConeGeometry {
  const geo = coneGeo(radius, length, segments);
  geo.rotateZ(-Math.PI / 2);
  return geo;
}

export function coneZGeo(
  radius: number,
  length: number,
  segments = 8
): THREE.ConeGeometry {
  const geo = coneGeo(radius, length, segments);
  geo.rotateX(Math.PI / 2);
  return geo;
}

// Y-axis aliases. The base geometries (`cylinderGeo`, `capsuleGeo`, `coneGeo`)
// are already Y-axis by default, but LLMs see `*XGeo` / `*ZGeo` and infer a
// matching `*YGeo` sibling. Rather than argue the naming, we accept the
// symmetric form and route it to the base implementation. No behavior change
// for existing code.
export const cylinderYGeo = cylinderGeo;
export const capsuleYGeo = capsuleGeo;
export const coneYGeo = coneGeo;

export function torusGeo(
  radius: number,
  tube: number,
  radialSegments = 8,
  tubularSegments = 12
): THREE.TorusGeometry {
  return new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments);
}

export function planeGeo(
  width: number,
  height: number,
  widthSegments = 1,
  heightSegments = 1
): THREE.PlaneGeometry {
  return new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);
}

/**
 * Flat box sized for surface-attached decals: red stars on fuselages, hull
 * numbers, stamps, dome windows on no-texture vehicles. Returns a very thin
 * {@link THREE.BoxGeometry} so the decal has depth and is visibly attached
 * to its host surface — unlike a bare {@link planeGeo} which renders as a
 * disconnected 2-tri quad when it drifts away from a parent mesh.
 *
 * Always place the returned geometry with `position` + `rotation` on the
 * host surface via `createPart`. Keep `depth` as small as 0.005 for
 * paper-thin decals, or bump to 0.05 for raised plates / badges.
 *
 * ```ts
 * // Red star on the fuselage side.
 * const star = decalBox(0.18, 0.18, 0.01);
 * createPart('Mesh_StarPort', star, gameMaterial(0xc61f2a), {
 *   position: [0.4, 0.6, 0.41], // on +Z fuselage surface
 *   rotation: [0, 0, 0],
 *   parent: fuselage,
 * });
 * ```
 */
export function decalBox(
  width: number,
  height: number,
  depth: number = 0.01,
): THREE.BoxGeometry {
  const d = Math.max(depth, 0.002);
  return new THREE.BoxGeometry(width, height, d);
}

// =============================================================================
// Billboard / imposter primitives
// =============================================================================

export interface FoliageCardOptions {
  /** Quad width in world units. */
  width?: number;
  /** Quad height in world units. */
  height?: number;
  /**
   * Vertical pivot as a fraction of height: 0 = bottom, 0.5 = center, 1 = top.
   * Foliage usually wants 0 so the card plants on the ground.
   */
  yPivot?: number;
}

/**
 * Double-sided quad for foliage / vegetation cards. Y-up facing +Z by default.
 * The pivot is placed at `yPivot * height` below the quad center — set 0 to
 * have the card root on the ground plane.
 *
 * Use with an alpha-tested material for leaves and billboard plants.
 */
export function foliageCardGeo(opts: FoliageCardOptions = {}): THREE.PlaneGeometry {
  const w = opts.width ?? 1;
  const h = opts.height ?? 1;
  const yPivot = opts.yPivot ?? 0;
  const geom = new THREE.PlaneGeometry(w, h);
  // Shift so the pivot offset becomes the local origin.
  geom.translate(0, h * (0.5 - yPivot), 0);
  return geom;
}

export interface CrossedQuadsOptions {
  width?: number;
  height?: number;
  /** Number of intersecting planes. 2 = X-cross, 3 = triple-star. Default 2. */
  planes?: 2 | 3;
  /** Y pivot fraction of height (see foliageCardGeo). Default 0. */
  yPivot?: number;
}

/**
 * Two or three planes intersecting along the Y axis — the classic "bush" or
 * "cross-billboard" near-field vegetation primitive. Cheaper than real
 * geometry, denser-looking than a single foliage card from any angle.
 */
export function crossedQuadsGeo(opts: CrossedQuadsOptions = {}): THREE.BufferGeometry {
  const w = opts.width ?? 1;
  const h = opts.height ?? 1;
  const planes = opts.planes ?? 2;
  const yPivot = opts.yPivot ?? 0;

  const geometries: THREE.PlaneGeometry[] = [];
  for (let i = 0; i < planes; i++) {
    const angle = (i / planes) * Math.PI;
    const quad = new THREE.PlaneGeometry(w, h);
    quad.translate(0, h * (0.5 - yPivot), 0);
    quad.rotateY(angle);
    geometries.push(quad);
  }

  // Merge into one BufferGeometry — deterministic + cheaper at draw time.
  const out = new THREE.BufferGeometry();
  const posCount = geometries.reduce(
    (sum, g) => sum + (g.attributes.position?.count ?? 0),
    0,
  );
  const positions = new Float32Array(posCount * 3);
  const normals = new Float32Array(posCount * 3);
  const uvs = new Float32Array(posCount * 2);
  const indices: number[] = [];
  let vOffset = 0;
  for (const g of geometries) {
    const p = g.attributes.position!;
    const n = g.attributes.normal!;
    const uv = g.attributes.uv!;
    for (let i = 0; i < p.count; i++) {
      positions[(vOffset + i) * 3] = p.getX(i);
      positions[(vOffset + i) * 3 + 1] = p.getY(i);
      positions[(vOffset + i) * 3 + 2] = p.getZ(i);
      normals[(vOffset + i) * 3] = n.getX(i);
      normals[(vOffset + i) * 3 + 1] = n.getY(i);
      normals[(vOffset + i) * 3 + 2] = n.getZ(i);
      uvs[(vOffset + i) * 2] = uv.getX(i);
      uvs[(vOffset + i) * 2 + 1] = uv.getY(i);
    }
    const idx = g.index!;
    for (let i = 0; i < idx.count; i++) {
      indices.push(idx.getX(i) + vOffset);
    }
    vOffset += p.count;
  }
  out.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  out.setIndex(indices);
  return out;
}

export interface OctaGridPlaneOptions {
  /** Atlas tile grid X. */
  tilesX: number;
  /** Atlas tile grid Y. */
  tilesY: number;
  /** Quad width in world units. Default 1. */
  width?: number;
  /** Quad height in world units. Default 1. */
  height?: number;
  /** 0 = bottom pivot, 0.5 = center, 1 = top. Default 0. */
  yPivot?: number;
}

/**
 * Atlas-ready billboard quad — same geometry as foliageCardGeo but the UV
 * rect is [0, 1/tilesX]×[1 - 1/tilesY, 1] so a shader using viewDir->tileIdx
 * can offset the UVs per-instance to sample the right imposter tile.
 *
 * The returned geometry has its UVs pre-scaled to cover exactly one tile.
 * The shader (TIJ billboard material) is expected to add (tileX/tilesX,
 * tileY/tilesY) to each vertex's UV at draw time.
 */
export function octaGridPlane(opts: OctaGridPlaneOptions): THREE.PlaneGeometry {
  const w = opts.width ?? 1;
  const h = opts.height ?? 1;
  const yPivot = opts.yPivot ?? 0;
  const geom = new THREE.PlaneGeometry(w, h);
  geom.translate(0, h * (0.5 - yPivot), 0);

  // Scale UVs so the quad covers one tile-sized rect in the top-left corner.
  const uv = geom.attributes.uv!;
  const du = 1 / opts.tilesX;
  const dv = 1 / opts.tilesY;
  for (let i = 0; i < uv.count; i++) {
    uv.setX(i, uv.getX(i) * du);
    // Top row — start at 1 - dv so the default samples the top-left tile.
    uv.setY(i, 1 - dv + uv.getY(i) * dv);
  }
  uv.needsUpdate = true;
  return geom;
}

export interface WingGeometryOptions {
  span?: number;
  rootChord?: number;
  tipChord?: number;
  sweep?: number;
  thickness?: number;
  dihedral?: number;
}

/**
 * Trapezoid aircraft wing panel.
 *
 * Coordinate contract: +X forward, +Y up, +Z right. The root edge sits at
 * local Z=0 and the panel extends toward +Z. Positive sweep moves the tip aft
 * along -X. Positive dihedral raises the tip along +Y.
 */
export function wingGeo(options: WingGeometryOptions = {}): THREE.BufferGeometry {
  const span = options.span ?? 1;
  const rootChord = options.rootChord ?? 0.6;
  const tipChord = options.tipChord ?? rootChord * 0.5;
  const sweep = options.sweep ?? 0;
  const thickness = options.thickness ?? 0.04;
  const dihedral = options.dihedral ?? 0;

  const rootLead = rootChord / 2;
  const rootTrail = -rootChord / 2;
  const tipLead = rootLead - sweep;
  const tipTrail = tipLead - tipChord;
  const halfThickness = thickness / 2;

  const vertices = new Float32Array([
    rootLead, halfThickness, 0,
    rootTrail, halfThickness, 0,
    tipLead, dihedral + halfThickness, span,
    tipTrail, dihedral + halfThickness, span,
    rootLead, -halfThickness, 0,
    rootTrail, -halfThickness, 0,
    tipLead, dihedral - halfThickness, span,
    tipTrail, dihedral - halfThickness, span,
  ]);

  const indices = [
    0, 3, 2, 0, 1, 3, // top
    4, 6, 7, 4, 7, 5, // bottom
    0, 2, 6, 0, 6, 4, // leading edge
    1, 5, 7, 1, 7, 3, // trailing edge
    0, 4, 5, 0, 5, 1, // root cap
    2, 3, 7, 2, 7, 6, // tip cap
  ];

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export interface WingPairOptions extends WingGeometryOptions {
  rootX?: number;
  rootY?: number;
  /** Fuselage half-width / root offset. Roots attach at +/-rootZ. */
  rootZ: number;
  parent?: THREE.Object3D;
}

export function createWingPair(
  name: string,
  material: THREE.Material,
  options: WingPairOptions
): { right: THREE.Object3D; left: THREE.Object3D } {
  const { parent, rootX = 0, rootY = 0, rootZ, ...wingOptions } = options;
  const rightGeo = wingGeo(wingOptions);
  const leftGeo = wingGeo(wingOptions);
  leftGeo.scale(1, 1, -1);
  leftGeo.computeVertexNormals();

  return {
    right: createPart(`${name}Right`, rightGeo, material, {
      position: [rootX, rootY, rootZ],
      parent,
    }),
    left: createPart(`${name}Left`, leftGeo, material, {
      position: [rootX, rootY, -rootZ],
      parent,
    }),
  };
}

export interface BeamBetweenOptions {
  segments?: number;
  parent?: THREE.Object3D;
}

export function beamBetween(
  name: string,
  start: Vec3Tuple,
  end: Vec3Tuple,
  radius: number,
  material: THREE.Material,
  options: BeamBetweenOptions = {}
): THREE.Object3D {
  const a = new THREE.Vector3(...start);
  const b = new THREE.Vector3(...end);
  const direction = b.clone().sub(a);
  const length = direction.length();

  if (length <= 1e-4) {
    throw new Error(
      `beamBetween("${name}"): start and end must be different points (got start=[${start.join(',')}], end=[${end.join(',')}], delta=${length.toExponential(2)}). Pick two distinct endpoints or switch to cylinderGeo with an explicit length + position.`,
    );
  }

  const mesh = new THREE.Mesh(
    cylinderGeo(radius, radius, length, options.segments ?? 8),
    material
  );
  mesh.name = `Mesh_${name}`;
  mesh.position.copy(a.add(b).multiplyScalar(0.5));
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize()
  );

  if (options.parent) options.parent.add(mesh);
  return mesh;
}

export interface LadderOptions {
  bottom: Vec3Tuple;
  top: Vec3Tuple;
  material: THREE.Material;
  width?: number;
  rungCount?: number;
  railRadius?: number;
  rungRadius?: number;
  segments?: number;
  widthAxis?: 'x' | 'z';
  parent?: THREE.Object3D;
}

export function createLadder(
  name: string,
  options: LadderOptions
): { leftRail: THREE.Object3D; rightRail: THREE.Object3D; rungs: THREE.Object3D[] } {
  const {
    bottom,
    top,
    material,
    width = 0.42,
    rungCount = 6,
    railRadius = 0.025,
    rungRadius = 0.02,
    segments = 6,
    widthAxis = 'x',
    parent,
  } = options;

  const bottomVec = new THREE.Vector3(...bottom);
  const topVec = new THREE.Vector3(...top);
  const offset =
    widthAxis === 'x'
      ? new THREE.Vector3(width / 2, 0, 0)
      : new THREE.Vector3(0, 0, width / 2);

  const leftBottom = bottomVec.clone().sub(offset);
  const leftTop = topVec.clone().sub(offset);
  const rightBottom = bottomVec.clone().add(offset);
  const rightTop = topVec.clone().add(offset);

  const leftRail = beamBetween(
    `${name}LeftRail`,
    vectorToTuple(leftBottom),
    vectorToTuple(leftTop),
    railRadius,
    material,
    { parent, segments }
  );
  const rightRail = beamBetween(
    `${name}RightRail`,
    vectorToTuple(rightBottom),
    vectorToTuple(rightTop),
    railRadius,
    material,
    { parent, segments }
  );

  const rungs: THREE.Object3D[] = [];
  for (let i = 0; i < rungCount; i++) {
    const t = (i + 1) / (rungCount + 1);
    const center = bottomVec.clone().lerp(topVec, t);
    rungs.push(
      beamBetween(
        `${name}Rung${i + 1}`,
        vectorToTuple(center.clone().sub(offset)),
        vectorToTuple(center.clone().add(offset)),
        rungRadius,
        material,
        { parent, segments }
      )
    );
  }

  return { leftRail, rightRail, rungs };
}

// =============================================================================
// Materials
// =============================================================================

export function gameMaterial(
  color: number | string,
  options: {
    metalness?: number;
    roughness?: number;
    emissive?: number | string;
    emissiveIntensity?: number;
    flatShading?: boolean;
  } = {}
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: options.metalness ?? 0,
    roughness: options.roughness ?? 0.8,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 1,
    flatShading: options.flatShading ?? true,
  });
}

export function basicMaterial(
  color: number | string,
  options: { transparent?: boolean; opacity?: number } = {}
): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
  });
}

export function glassMaterial(
  color: number | string,
  options: { opacity?: number; roughness?: number; metalness?: number } = {}
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    transparent: true,
    opacity: options.opacity ?? 0.35,
    roughness: options.roughness ?? 0.1,
    metalness: options.metalness ?? 0,
    side: THREE.DoubleSide,
  });
}

export function lambertMaterial(
  color: number | string,
  options: { flatShading?: boolean; emissive?: number | string } = {}
): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({
    color,
    flatShading: options.flatShading ?? true,
    emissive: options.emissive ?? 0x000000,
  });
}

// =============================================================================
// Animation Helpers
// =============================================================================

/**
 * Keyframe interpolation mode.
 * - LINEAR: default, smooth transitions between keyframes.
 * - STEP: discrete, hold value until next keyframe (good for robotic/mechanical motion).
 */
export type TrackInterpolation = 'LINEAR' | 'STEP';

function threeInterpolation(mode?: TrackInterpolation): THREE.InterpolationModes {
  return mode === 'STEP' ? THREE.InterpolateDiscrete : THREE.InterpolateLinear;
}

export function rotationTrack(
  jointName: string,
  keyframes: Array<{ time: number; rotation: [number, number, number] }>,
  interpolation?: TrackInterpolation
): THREE.QuaternionKeyframeTrack {
  const times: number[] = [];
  const values: number[] = [];
  const euler = new THREE.Euler();
  const quat = new THREE.Quaternion();

  for (const kf of keyframes) {
    times.push(kf.time);
    euler.set(
      THREE.MathUtils.degToRad(kf.rotation[0]),
      THREE.MathUtils.degToRad(kf.rotation[1]),
      THREE.MathUtils.degToRad(kf.rotation[2])
    );
    quat.setFromEuler(euler);
    values.push(quat.x, quat.y, quat.z, quat.w);
  }

  return new THREE.QuaternionKeyframeTrack(
    `${jointName}.quaternion`,
    times,
    values,
    threeInterpolation(interpolation)
  );
}

export function positionTrack(
  jointName: string,
  keyframes: Array<{ time: number; position: [number, number, number] }>,
  interpolation?: TrackInterpolation
): THREE.VectorKeyframeTrack {
  const times: number[] = [];
  const values: number[] = [];

  for (const kf of keyframes) {
    times.push(kf.time);
    values.push(...kf.position);
  }

  return new THREE.VectorKeyframeTrack(
    `${jointName}.position`,
    times,
    values,
    threeInterpolation(interpolation)
  );
}

export function scaleTrack(
  jointName: string,
  keyframes: Array<{ time: number; scale: [number, number, number] }>,
  interpolation?: TrackInterpolation
): THREE.VectorKeyframeTrack {
  const times: number[] = [];
  const values: number[] = [];

  for (const kf of keyframes) {
    times.push(kf.time);
    values.push(...kf.scale);
  }

  return new THREE.VectorKeyframeTrack(
    `${jointName}.scale`,
    times,
    values,
    threeInterpolation(interpolation)
  );
}

export function createClip(
  name: string,
  duration: number,
  tracks: THREE.KeyframeTrack[]
): THREE.AnimationClip {
  return new THREE.AnimationClip(name, duration, tracks);
}

// =============================================================================
// Common Animation Patterns
// =============================================================================

export function idleBreathing(
  bodyJoint: string,
  duration = 2,
  amount = 0.02
): THREE.AnimationClip {
  const y = 0;
  return createClip('Idle', duration, [
    positionTrack(bodyJoint, [
      { time: 0, position: [0, y, 0] },
      { time: duration / 2, position: [0, y + amount, 0] },
      { time: duration, position: [0, y, 0] },
    ]),
  ]);
}

export function bobbingAnimation(
  rootName: string,
  duration = 2,
  height = 0.1
): THREE.AnimationClip {
  return createClip('Bob', duration, [
    positionTrack(rootName, [
      { time: 0, position: [0, 0, 0] },
      { time: duration / 2, position: [0, height, 0] },
      { time: duration, position: [0, 0, 0] },
    ]),
  ]);
}

export function spinAnimation(
  jointName: string,
  duration = 2,
  axis: 'x' | 'y' | 'z' = 'y'
): THREE.AnimationClip {
  const rotation: [number, number, number] = [0, 0, 0];
  const idx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
  const rotations: Array<{ time: number; rotation: [number, number, number] }> =
    [];

  for (let i = 0; i <= 4; i++) {
    const r: [number, number, number] = [...rotation];
    r[idx] = (i * 90) % 360;
    rotations.push({ time: (i * duration) / 4, rotation: r });
  }

  return createClip('Spin', duration, [rotationTrack(jointName, rotations)]);
}

// =============================================================================
// Utilities
// =============================================================================

// =============================================================================
// Instancing / Reuse (Wave 1B)
// =============================================================================

/**
 * Returns the same BufferGeometry reference — explicit no-op clone that
 * signals intent to reuse geometry across multiple parts. gltf-transform
 * will dedupe on export, but authoring with the shared ref keeps memory
 * low at render time too.
 *
 * For 4 wheels on a truck: build one `cylinderGeo(...)`, pass it through
 * `cloneGeometry` to each `createPart` call. Four meshes, one geometry.
 */
export function cloneGeometry(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  return geo;
}

/**
 * Shared material reference. See `cloneGeometry` for the pattern.
 */
export function cloneMaterial(mat: THREE.Material): THREE.Material {
  return mat;
}

/**
 * Creates a new Object3D that reuses an existing part's geometry+material
 * at a new transform. The cheapest way to replicate a part (wheel, bolt,
 * window, fence-post) without duplicating GPU-side data.
 *
 * If `source` is a pivot (from `createPivot` or `createPart` with
 * `pivot: true`), the instance replicates the first Mesh child's geometry.
 *
 * Automatically adds to `parent` when provided (mirrors createPart).
 */
export function createInstance(
  name: string,
  source: THREE.Object3D,
  options: {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
    parent?: THREE.Object3D;
  } = {}
): THREE.Object3D {
  const sourceMesh =
    source instanceof THREE.Mesh
      ? source
      : (source.children.find((c) => c instanceof THREE.Mesh) as THREE.Mesh | undefined);

  if (!sourceMesh) {
    throw new Error(
      `createInstance("${name}"): source "${source.name}" has no Mesh to clone from`
    );
  }

  const mesh = new THREE.Mesh(sourceMesh.geometry, sourceMesh.material);
  mesh.name = `Mesh_${name}`;

  if (options.position) mesh.position.set(...options.position);
  if (options.rotation)
    mesh.rotation.set(
      THREE.MathUtils.degToRad(options.rotation[0]),
      THREE.MathUtils.degToRad(options.rotation[1]),
      THREE.MathUtils.degToRad(options.rotation[2])
    );
  if (options.scale) mesh.scale.set(...options.scale);

  if (options.parent) options.parent.add(mesh);
  return mesh;
}

// =============================================================================
// Introspection
// =============================================================================

export function countTriangles(root: THREE.Object3D): number {
  let count = 0;
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const geometry = child.geometry;
      if (geometry.index) {
        count += geometry.index.count / 3;
      } else {
        const position = geometry.getAttribute('position');
        if (position) count += position.count / 3;
      }
    }
  });
  return Math.floor(count);
}

export function countMaterials(root: THREE.Object3D): number {
  const materials = new Set<THREE.Material>();
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => materials.add(m));
      } else {
        materials.add(child.material);
      }
    }
  });
  return materials.size;
}

export function getJointNames(root: THREE.Object3D): string[] {
  const joints: string[] = [];
  root.traverse((child) => {
    if (child.name.startsWith('Joint_')) {
      joints.push(child.name);
    }
  });
  return joints;
}

/**
 * Validates asset against category guidelines.
 * Returns warnings for guidance but doesn't block on limits.
 */
export function validateAsset(
  root: THREE.Object3D,
  category: 'character' | 'prop' | 'vfx' | 'environment'
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const guidelines = {
    character: { suggestedTris: 5000, suggestedMats: 8 },
    prop: { suggestedTris: 3000, suggestedMats: 6 },
    vfx: { suggestedTris: 2000, suggestedMats: 4 },
    environment: { suggestedTris: 15000, suggestedMats: 12 },
  };

  const limits = guidelines[category];
  const tris = countTriangles(root);
  const mats = countMaterials(root);

  if (tris > limits.suggestedTris) {
    warnings.push(`High triangle count: ${tris} (suggested: ${limits.suggestedTris})`);
  }

  if (mats > limits.suggestedMats) {
    warnings.push(`High material count: ${mats} (suggested: ${limits.suggestedMats})`);
  }

  return { valid: true, errors, warnings };
}

/**
 * The full sandbox globals used when executing Kiln code. Kept in one place
 * so render.ts and any future evaluator share the same surface area as what
 * the LLM expects.
 *
 * Pass `usage` to tally how many times each primitive was invoked by the
 * agent-generated `build()` call. The counter lives on the caller's object
 * so render.ts can stash it into `render.meta.primitiveUsage` for
 * downstream analysis. When omitted, wrapping is skipped (zero overhead).
 */
export function buildSandboxGlobals(
  usage?: Record<string, number>
): Record<string, unknown> {
  // CSG ops are async — the executor awaits build() so agents can
  // `await boolDiff(...)` inside build().
  //
  // Lazy-required at call-time so the Three.js-only path doesn't pay the
  // manifold WASM init unless an agent actually uses CSG.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const solids = require('./solids') as typeof import('./solids');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ops = require('./ops') as typeof import('./ops');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const uv = require('./uv') as typeof import('./uv');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const textures = require('./textures') as typeof import('./textures');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const gears = require('./gears') as typeof import('./gears');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const uvShapes = require('./uv-shapes') as typeof import('./uv-shapes');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const THREE = require('three') as typeof import('three');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wrap = <F extends (...args: any[]) => any>(name: string, fn: F): F => {
    if (!usage) return fn;
    const wrapped = (...args: Parameters<F>): ReturnType<F> => {
      usage[name] = (usage[name] ?? 0) + 1;
      return fn(...args);
    };
    return wrapped as F;
  };

  return {
    createRoot: wrap('createRoot', createRoot),
    createPivot: wrap('createPivot', createPivot),
    createPart: wrap('createPart', createPart),
    capsuleGeo: wrap('capsuleGeo', capsuleGeo),
    capsuleXGeo: wrap('capsuleXGeo', capsuleXGeo),
    capsuleYGeo: wrap('capsuleYGeo', capsuleYGeo),
    capsuleZGeo: wrap('capsuleZGeo', capsuleZGeo),
    cylinderGeo: wrap('cylinderGeo', cylinderGeo),
    cylinderXGeo: wrap('cylinderXGeo', cylinderXGeo),
    cylinderYGeo: wrap('cylinderYGeo', cylinderYGeo),
    cylinderZGeo: wrap('cylinderZGeo', cylinderZGeo),
    boxGeo: wrap('boxGeo', boxGeo),
    sphereGeo: wrap('sphereGeo', sphereGeo),
    coneGeo: wrap('coneGeo', coneGeo),
    coneXGeo: wrap('coneXGeo', coneXGeo),
    coneYGeo: wrap('coneYGeo', coneYGeo),
    coneZGeo: wrap('coneZGeo', coneZGeo),
    torusGeo: wrap('torusGeo', torusGeo),
    planeGeo: wrap('planeGeo', planeGeo),
    decalBox: wrap('decalBox', decalBox),
    foliageCardGeo: wrap('foliageCardGeo', foliageCardGeo),
    crossedQuadsGeo: wrap('crossedQuadsGeo', crossedQuadsGeo),
    octaGridPlane: wrap('octaGridPlane', octaGridPlane),
    wingGeo: wrap('wingGeo', wingGeo),
    createWingPair: wrap('createWingPair', createWingPair),
    beamBetween: wrap('beamBetween', beamBetween),
    createLadder: wrap('createLadder', createLadder),
    gameMaterial: wrap('gameMaterial', gameMaterial),
    basicMaterial: wrap('basicMaterial', basicMaterial),
    glassMaterial: wrap('glassMaterial', glassMaterial),
    lambertMaterial: wrap('lambertMaterial', lambertMaterial),
    rotationTrack: wrap('rotationTrack', rotationTrack),
    positionTrack: wrap('positionTrack', positionTrack),
    scaleTrack: wrap('scaleTrack', scaleTrack),
    createClip: wrap('createClip', createClip),
    spinAnimation: wrap('spinAnimation', spinAnimation),
    bobbingAnimation: wrap('bobbingAnimation', bobbingAnimation),
    idleBreathing: wrap('idleBreathing', idleBreathing),
    cloneGeometry: wrap('cloneGeometry', cloneGeometry),
    cloneMaterial: wrap('cloneMaterial', cloneMaterial),
    createInstance: wrap('createInstance', createInstance),
    // CSG (async)
    boolUnion: wrap('boolUnion', solids.boolUnion),
    boolDiff: wrap('boolDiff', solids.boolDiff),
    boolIntersect: wrap('boolIntersect', solids.boolIntersect),
    hull: wrap('hull', solids.hull),
    // Array/mirror/subdivide/curve ops
    arrayLinear: wrap('arrayLinear', ops.arrayLinear),
    arrayRadial: wrap('arrayRadial', ops.arrayRadial),
    mirror: wrap('mirror', ops.mirror),
    subdivide: wrap('subdivide', ops.subdivide),
    mergeVertices: wrap('mergeVertices', ops.mergeVertices),
    curveToMesh: wrap('curveToMesh', ops.curveToMesh),
    lathe: wrap('lathe', ops.lathe),
    bezierCurve: wrap('bezierCurve', ops.bezierCurve),
    // UV (async)
    autoUnwrap: wrap('autoUnwrap', uv.autoUnwrap),
    // Shape-aware unwraps (sync — preserve built-in directional UVs)
    boxUnwrap: wrap('boxUnwrap', uvShapes.boxUnwrap),
    cylinderUnwrap: wrap('cylinderUnwrap', uvShapes.cylinderUnwrap),
    planeUnwrap: wrap('planeUnwrap', uvShapes.planeUnwrap),
    // Parametric primitives
    gearGeo: wrap('gearGeo', gears.gearGeo),
    bladeGeo: wrap('bladeGeo', gears.bladeGeo),
    // Textures + PBR (loadTexture is async)
    loadTexture: wrap('loadTexture', textures.loadTexture),
    pbrMaterial: wrap('pbrMaterial', textures.pbrMaterial),
    countTriangles: wrap('countTriangles', countTriangles),
    countMaterials: wrap('countMaterials', countMaterials),
    getJointNames: wrap('getJointNames', getJointNames),
    validateAsset: wrap('validateAsset', validateAsset),
    // THREE namespace is exposed so agents can `new THREE.Mesh(geo, mat)`
    // as operands to CSG and other ops that expect Object3D inputs.
    THREE,
    Math, console,
  };
}

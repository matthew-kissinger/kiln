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
import { createJointChain } from './character';
import {
  createGableEndPanel,
  createGableRoof,
  createGableShell,
  createRoofPlanes as createRoofPlanesExplicit,
  createRoofSurfaceLayout,
} from './architecture';
import * as gears from './gears';
import * as ops from './ops';
import * as profile from './profile';
import * as solids from './solids';
import * as proceduralTextures from './procedural-texture';
import * as textures from './textures';
import type { TextureResolver } from './texture-resolver';
import { compilePortableMaterialSpecV2 } from './portable-material-runtime';
import { createVehicleFrame, createWheelAssembly, createWheelGeometrySet } from './vehicle';
import {
  stampSemanticMetadataV1,
  type AssetCategory,
  type SemanticMetadataV1,
  type SemanticMetadataV1Input,
} from './contracts';
import * as uv from './uv';
import * as uvShapes from './uv-shapes';

export {
  createGableEndPanel,
  createGableRoof,
  createGableShell,
  createRoofSurfaceLayout,
} from './architecture';
export type {
  GableEndPanelOptions,
  GableRoofOptions,
  GableShellOptions,
  RoofFaceFrame,
  RoofSurfaceLayoutOptions,
} from './architecture';
export { createJointChain } from './character';
export type {
  CreateJointChainOptionsV1,
  JointChainResultV1,
  JointChainSegmentV1,
} from './character';
export {
  createVehicleFrame,
  createWheelAssembly,
  createWheelGeometrySet,
} from './vehicle';
export { materialRecipe } from './material-recipe-runtime';
export type { ApplyMaterialRecipeOptions } from './material-recipe-runtime';
export type { MaterialRecipeId, MaterialRecipeOverridesV1 } from './material-recipes';
export { compilePortableMaterialSpecV2 } from './portable-material-runtime';
export {
  MAX_PORTABLE_MATERIAL_TEXELS,
  MAX_PORTABLE_MATERIAL_TEXTURES,
  MAX_PROCEDURAL_LAYERS,
  MAX_PROCEDURAL_SIZE,
  PORTABLE_MATERIAL_SPEC_VERSION,
  PROCEDURAL_TEXTURE_SPEC_VERSION,
  ProceduralTextureError,
  canonicalProceduralTextureJsonV2,
  canonicalizePortableMaterialSpecV2,
  canonicalizeProceduralTextureSpecV2,
  compileProceduralTextureSpecV2,
  hashProceduralTextureSpecV2,
  migrateProceduralTextureSpecV1,
} from './procedural-texture';
export type {
  CanonicalPortableMaterialSpecV2,
  CanonicalProceduralTextureSpecV2,
  PortableMaterialSpecV2,
  ProceduralLayer,
  ProceduralTextureSpec,
  ProceduralTextureSpecV1,
  ProceduralTextureSpecV2,
} from './procedural-texture';
export type {
  VehicleFrameOptions,
  VehicleFrameResult,
  WheelAssemblyOptions,
  WheelAssemblyResult,
  WheelGeometrySet,
  WheelMaterialSet,
} from './vehicle';

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
  parent?: THREE.Object3D,
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
    /** Versioned roles/relationships/local frames/sockets stamped on the returned
     * helper node and preserved in glTF node extras. */
    semantic?: SemanticMetadataV1 | SemanticMetadataV1Input;
  } = {},
): THREE.Object3D {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = `Mesh_${name}`;

  if (options.position) mesh.position.set(...options.position);
  if (options.rotation)
    mesh.rotation.set(
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
    if (options.semantic) stampSemanticMetadataV1(pivot, options.semantic);
    return pivot; // Return the pivot (the animatable node)
  }

  if (options.parent) options.parent.add(mesh);
  if (options.semantic) stampSemanticMetadataV1(mesh, options.semantic);
  return mesh; // Return the mesh
}

// =============================================================================
// Common Shapes (game-ready low-poly)
// =============================================================================

export function capsuleGeo(radius: number, height: number, segments = 6): THREE.CapsuleGeometry {
  return new THREE.CapsuleGeometry(radius, height, 2, segments);
}

export function capsuleXGeo(radius: number, length: number, segments = 6): THREE.CapsuleGeometry {
  const geo = capsuleGeo(radius, length, segments);
  geo.rotateZ(-Math.PI / 2);
  return geo;
}

export function capsuleZGeo(radius: number, length: number, segments = 6): THREE.CapsuleGeometry {
  const geo = capsuleGeo(radius, length, segments);
  geo.rotateX(Math.PI / 2);
  return geo;
}

export function cylinderGeo(
  radiusTop: number,
  radiusBottom: number,
  height: number,
  segments = 8,
): THREE.CylinderGeometry {
  return new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments);
}

export function cylinderXGeo(
  radiusTop: number,
  radiusBottom: number,
  length: number,
  segments = 8,
): THREE.CylinderGeometry {
  const geo = cylinderGeo(radiusTop, radiusBottom, length, segments);
  geo.rotateZ(-Math.PI / 2);
  return geo;
}

export function cylinderZGeo(
  radiusTop: number,
  radiusBottom: number,
  length: number,
  segments = 8,
): THREE.CylinderGeometry {
  const geo = cylinderGeo(radiusTop, radiusBottom, length, segments);
  geo.rotateX(Math.PI / 2);
  return geo;
}

export function boxGeo(width: number, height: number, depth: number): THREE.BoxGeometry {
  return new THREE.BoxGeometry(width, height, depth);
}

export function sphereGeo(
  radius: number,
  widthSegments = 8,
  heightSegments = 6,
): THREE.SphereGeometry {
  return new THREE.SphereGeometry(radius, widthSegments, heightSegments);
}

export function coneGeo(radius: number, height: number, segments = 8): THREE.ConeGeometry {
  return new THREE.ConeGeometry(radius, height, segments);
}

export function coneXGeo(radius: number, length: number, segments = 8): THREE.ConeGeometry {
  const geo = coneGeo(radius, length, segments);
  geo.rotateZ(-Math.PI / 2);
  return geo;
}

export function coneZGeo(radius: number, length: number, segments = 8): THREE.ConeGeometry {
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

/**
 * Frame-first cylinder. Builds a Y-up cylinder of `height` at the origin,
 * orients its axis to `normal`, and translates the center to `center`. Use
 * this when the cylinder needs to point along a non-cardinal axis — struts
 * inside CSG operands, antennas off a tilted surface, anything where the
 * `*XGeo` / `*ZGeo` variants don't fit.
 *
 * `radiusTop === radiusBottom` for plain tubes; pass different values for a
 * tapered/conical body without reaching for `coneGeo`.
 *
 * The returned geometry has its position pre-baked. You can pass it straight
 * to `new THREE.Mesh(...)` without further rotation.
 */
export function cylinderOnAxis(
  center: Vec3Tuple,
  normal: Vec3Tuple,
  radiusBottom: number,
  height: number,
  options: { radiusTop?: number; segments?: number } = {},
): THREE.CylinderGeometry {
  const radiusTop = options.radiusTop ?? radiusBottom;
  const segments = options.segments ?? 8;
  const geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments);

  const n = new THREE.Vector3(normal[0], normal[1], normal[2]);
  const len = n.length();
  if (len < 1e-6) {
    throw new Error(
      `cylinderOnAxis: normal must be a non-zero vector (got [${normal.join(',')}]).`,
    );
  }
  n.divideScalar(len);

  // Quaternion from Y to normal.
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
  geo.applyQuaternion(q);
  geo.translate(center[0], center[1], center[2]);
  return geo;
}

/**
 * Tapered cone helper that exposes the bottom + top radius. The default Y-up
 * `coneGeo` is apex-only (top radius locked at 0); for truncated/frustum
 * shapes — soda cans, pylon caps, lampshades — pass a non-zero
 * `radiusTop`. When `radiusTop === 0` it matches `coneGeo` exactly; when
 * `radiusTop === radiusBottom` it matches `cylinderGeo`.
 *
 * `axis` selects the orientation:
 *   - `'y'` (default) — apex/cap on +Y, matches `coneGeo`
 *   - `'x'` — pre-rotated along +X, matches the `coneXGeo` family
 *   - `'z'` — pre-rotated along +Z
 */
export function taperConeGeo(
  radiusBottom: number,
  radiusTop: number,
  height: number,
  axis: 'x' | 'y' | 'z' = 'y',
  segments = 8,
): THREE.CylinderGeometry {
  const geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments);
  if (axis === 'x') geo.rotateZ(-Math.PI / 2);
  else if (axis === 'z') geo.rotateX(Math.PI / 2);
  return geo;
}

export function torusGeo(
  radius: number,
  tube: number,
  radialSegments = 8,
  tubularSegments = 12,
): THREE.TorusGeometry {
  return new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments);
}

export function planeGeo(
  width: number,
  height: number,
  widthSegments = 1,
  heightSegments = 1,
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
export function decalBox(width: number, height: number, depth: number = 0.01): THREE.BoxGeometry {
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
  geom.userData['kilnGeometryRole'] = 'foliageCard';
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
  const posCount = geometries.reduce((sum, g) => sum + (g.attributes.position?.count ?? 0), 0);
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
  out.userData['kilnGeometryRole'] = 'foliageCard';
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
 * local Z=0 and the panel extends toward +Z.
 *
 * **Parameter units (READ THIS — these are NOT angles):**
 * - `sweep` is the **X-displacement of the tip leading edge in world units**
 *   (positive = tip moves aft along -X). NOT an angle in degrees/radians.
 * - `dihedral` is the **Y-displacement of the tip in world units**
 *   (positive = tip rises). NOT an angle. For most aircraft you want a
 *   small value like 0.05–0.1 — a value of 1 with span=2 gives a 45°
 *   gull-wing, almost certainly wrong unless explicitly designing one.
 * - `span` is wing length in world units (root to tip).
 * - `rootChord` / `tipChord` / `thickness` are all world units.
 *
 * Quick reference: a real-aircraft-looking wing has dihedral roughly 2–7%
 * of span (e.g. span=4, dihedral=0.1 to 0.25).
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
    rootLead,
    halfThickness,
    0,
    rootTrail,
    halfThickness,
    0,
    tipLead,
    dihedral + halfThickness,
    span,
    tipTrail,
    dihedral + halfThickness,
    span,
    rootLead,
    -halfThickness,
    0,
    rootTrail,
    -halfThickness,
    0,
    tipLead,
    dihedral - halfThickness,
    span,
    tipTrail,
    dihedral - halfThickness,
    span,
  ]);

  const indices = [
    0,
    3,
    2,
    0,
    1,
    3, // top
    4,
    6,
    7,
    4,
    7,
    5, // bottom
    0,
    2,
    6,
    0,
    6,
    4, // leading edge
    1,
    5,
    7,
    1,
    7,
    3, // trailing edge
    0,
    4,
    5,
    0,
    5,
    1, // root cap
    2,
    3,
    7,
    2,
    7,
    6, // tip cap
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
  options: WingPairOptions,
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
  options: BeamBetweenOptions = {},
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

  const mesh = new THREE.Mesh(cylinderGeo(radius, radius, length, options.segments ?? 8), material);
  mesh.name = `Mesh_${name}`;
  mesh.position.copy(a.add(b).multiplyScalar(0.5));
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());

  if (options.parent) options.parent.add(mesh);
  return mesh;
}

/**
 * Snap a part into contact with a host: translate `part` by the minimal
 * world-space vector that closes the gap between its bounding box and the
 * host's, plus a small `overlap` along the dominant gap axis (or the forced
 * `axis`). The cure for "Floating parts" warnings — instead of eyeballing a
 * corrective offset, attach the part and let the geometry resolve contact.
 *
 * If the boxes already touch or overlap, the part is left in place.
 * Returns `part` for chaining.
 */
export function snapTo(
  part: THREE.Object3D,
  host: THREE.Object3D,
  options: { axis?: 'x' | 'y' | 'z'; overlap?: number } = {},
): THREE.Object3D {
  const overlap = options.overlap ?? 0.02;
  // Boxes in world space (works mid-build; matrices may be stale otherwise).
  part.updateMatrixWorld(true);
  host.updateMatrixWorld(true);
  const a = new THREE.Box3().setFromObject(part);
  const b = new THREE.Box3().setFromObject(host);
  if (a.isEmpty() || b.isEmpty()) return part;

  const delta = new THREE.Vector3();
  for (const axis of ['x', 'y', 'z'] as const) {
    if (a.min[axis] > b.max[axis]) delta[axis] = b.max[axis] - a.min[axis];
    else if (a.max[axis] < b.min[axis]) delta[axis] = b.min[axis] - a.max[axis];
  }
  if (delta.lengthSq() === 0) return part; // already in contact

  const dominant =
    options.axis ??
    (['x', 'y', 'z'] as const).reduce<'x' | 'y' | 'z'>(
      (d, axis) => (Math.abs(delta[axis]) > Math.abs(delta[d]) ? axis : d),
      'x',
    );
  if (delta[dominant] !== 0) delta[dominant] += Math.sign(delta[dominant]) * overlap;
  else delta[dominant] = -overlap; // forced axis had no gap — bias into the host

  // Convert the world delta into the part's parent space (handles rotated or
  // scaled ancestors) by mapping two world points.
  const parent = part.parent;
  if (parent) {
    const p0 = new THREE.Vector3();
    part.getWorldPosition(p0);
    const p1 = p0.clone().add(delta);
    const l0 = parent.worldToLocal(p0.clone());
    const l1 = parent.worldToLocal(p1.clone());
    part.position.add(l1.sub(l0));
  } else {
    part.position.add(delta);
  }
  part.updateMatrixWorld(true);
  return part;
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
  options: LadderOptions,
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
    widthAxis === 'x' ? new THREE.Vector3(width / 2, 0, 0) : new THREE.Vector3(0, 0, width / 2);

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
    { parent, segments },
  );
  const rightRail = beamBetween(
    `${name}RightRail`,
    vectorToTuple(rightBottom),
    vectorToTuple(rightTop),
    railRadius,
    material,
    { parent, segments },
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
        { parent, segments },
      ),
    );
  }

  return { leftRail, rightRail, rungs };
}

// =============================================================================
// Building / architecture helpers
// =============================================================================
//
// Enterable buildings are HOLLOW shells: thin walls around real interior space,
// real doorway gaps, a separable roof. These helpers make that correct-by-
// construction so the agent cannot accidentally fill the volume, forget the
// doorway, or mirror the roof slopes the wrong way. Openings are composed from
// box segments (jambs + lintel + sill), never CSG — solid opaque overlaps are
// robust where thin boolean cutters are fragile.

export interface WallOpening {
  /** 'door' reaches the floor; 'window' is inset at `sill` height. */
  kind?: 'door' | 'window';
  /** Center of the opening along the wall length axis (0 = centered). */
  offset?: number;
  /** Opening width along the wall length axis. */
  width?: number;
  /** Opening height. */
  height?: number;
  /** Window sill height above the wall base (ignored for doors). */
  sill?: number;
}

export interface WallWithOpeningOptions {
  /** Wall length along its run axis. */
  length: number;
  /** Wall height (Y). Base sits at local Y=0. */
  height: number;
  /** Wall thickness along the perpendicular horizontal axis. */
  thickness: number;
  /** Which horizontal axis the wall runs along. Default 'z'. */
  axis?: 'x' | 'z';
  /** A single door/window cut. Omit for a solid wall. */
  opening?: WallOpening;
  parent?: THREE.Object3D;
}

/**
 * A single wall panel — optionally with one rectangular door/window cut —
 * composed from solid box segments (two side panels + a lintel, plus a sill
 * apron for a window). Runs along `axis`, base at local Y=0, centered on the
 * length axis. Returns the wall container so the caller can position it.
 */
export function wallWithOpening(
  name: string,
  material: THREE.Material,
  options: WallWithOpeningOptions,
): THREE.Object3D {
  const { length, height, thickness, axis = 'z', opening, parent } = options;
  const group = new THREE.Object3D();
  group.name = name;
  const overlap = 0.02;

  const panel = (
    suffix: string,
    lenStart: number,
    lenEnd: number,
    yLo: number,
    yHi: number,
  ): void => {
    const segLen = lenEnd - lenStart;
    const segH = yHi - yLo;
    if (segLen <= 1e-4 || segH <= 1e-4) return;
    const lenC = (lenStart + lenEnd) / 2;
    const yC = (yLo + yHi) / 2;
    const geo = axis === 'z' ? boxGeo(thickness, segH, segLen) : boxGeo(segLen, segH, thickness);
    const pos: [number, number, number] = axis === 'z' ? [0, yC, lenC] : [lenC, yC, 0];
    createPart(`${name}${suffix}`, geo, material, { position: pos, parent: group });
  };

  if (!opening) {
    panel('', -length / 2, length / 2, 0, height);
  } else {
    const ow = opening.width ?? (opening.kind === 'window' ? 1.0 : 1.1);
    const oh = opening.height ?? (opening.kind === 'window' ? 1.0 : 2.1);
    const off = opening.offset ?? 0;
    const left = off - ow / 2;
    const right = off + ow / 2;
    const sill = opening.kind === 'window' ? Math.max(opening.sill ?? 1.0, 0) : 0;
    const top = Math.min(sill + oh, height);
    panel('_L', -length / 2, left, 0, height); // full-height side panels
    panel('_R', right, length / 2, 0, height);
    panel('_Lintel', left - overlap, right + overlap, top, height); // above the gap
    if (sill > 0) panel('_Sill', left - overlap, right + overlap, 0, sill); // below a window
  }

  if (parent) parent.add(group);
  return group;
}

export interface RoomOpening extends WallOpening {
  /** Which wall the opening cuts. `front` faces +X. */
  wall: 'front' | 'back' | 'left' | 'right';
}

export interface RoomOptions {
  /** Side-to-side extent along Z. */
  width?: number;
  /** Front-to-back extent along X (front faces +X). */
  depth?: number;
  /** Wall height (Y). */
  height?: number;
  wallThickness?: number;
  /** Lay a floor slab. Default true. */
  floor?: boolean;
  floorThickness?: number;
  /** Per-wall openings. Defaults to a centered door on the front wall, so the
   *  room is ENTERABLE by default. */
  openings?: RoomOpening[];
  parent?: THREE.Object3D;
}

/**
 * A hollow, enterable room: four thin walls + a floor, sized so a humanoid fits
 * (defaults: 2.8m ceiling, a centered 1.1×2.1m front door). The keystone of an
 * architecture asset — the agent builds onto/around it (roof via
 * {@link createRoofPlanes}, fixtures as separate parts) but cannot ship a solid
 * block or a sealed box. `front` faces +X; the floor top sits at the ground.
 */
export function room(
  name: string,
  material: THREE.Material,
  options: RoomOptions = {},
): {
  root: THREE.Object3D;
  walls: Record<'front' | 'back' | 'left' | 'right', THREE.Object3D>;
  floor: THREE.Object3D | null;
} {
  const {
    width = 4,
    depth = 4,
    height = 2.8,
    wallThickness = 0.15,
    floor = true,
    floorThickness = 0.1,
    parent,
  } = options;
  const openings = options.openings ?? [{ wall: 'front', kind: 'door' }];
  const root = new THREE.Object3D();
  root.name = name;

  const openingFor = (wall: RoomOpening['wall']): WallOpening | undefined => {
    const found = openings.find((op) => op.wall === wall);
    if (!found) return undefined;
    const { wall: _wall, ...rest } = found;
    return rest;
  };

  const wall = (
    suffix: string,
    len: number,
    axis: 'x' | 'z',
    pos: [number, number, number],
    which: RoomOpening['wall'],
  ): THREE.Object3D => {
    const op = openingFor(which);
    const w = wallWithOpening(`${name}_Wall${suffix}`, material, {
      length: len,
      height,
      thickness: wallThickness,
      axis,
      ...(op ? { opening: op } : {}),
      parent: root,
    });
    w.position.set(...pos);
    return w;
  };

  const walls = {
    front: wall('Front', width, 'z', [depth / 2, 0, 0], 'front'),
    back: wall('Back', width, 'z', [-depth / 2, 0, 0], 'back'),
    left: wall('Left', depth, 'x', [0, 0, -width / 2], 'left'),
    right: wall('Right', depth, 'x', [0, 0, width / 2], 'right'),
  };

  let floorObj: THREE.Object3D | null = null;
  if (floor) {
    floorObj = createPart(`${name}_Floor`, boxGeo(depth, floorThickness, width), material, {
      position: [0, floorThickness / 2, 0],
      parent: root,
    });
  }

  if (parent) parent.add(root);
  return { root, walls, floor: floorObj };
}

export interface RoofPlanesOptions {
  /** Footprint extent along Z. */
  width: number;
  /** Footprint extent along X. */
  depth: number;
  /** Ridge height above the eave (local Y=0). */
  height: number;
  /** Eave overhang past the footprint on every side. Default 0.3. */
  overhang?: number;
  /** Axis the ridge line runs along; slopes fall toward the perpendicular
   *  horizontal axis. Default 'x'. */
  ridgeAxis?: 'x' | 'z';
  /** Roof-plane thickness. Default 0.08. */
  thickness?: number;
  parent?: THREE.Object3D;
}

/**
 * A pitched roof: two thin sloped planes meeting at one ridge and falling
 * DOWN-AND-OUTWARD (opposite tilts — the cure for the recurring mirrored-slope
 * defect), footprint-matched with an eave overhang. Built with the eave at
 * local Y=0 and the ridge at Y=`height`, so the caller drops it onto the walls
 * at Y=wallHeight. Returns a named group (e.g. `Roof`) the engine can lift to
 * reveal the interior.
 */
export function createRoofPlanes(
  name: string,
  material: THREE.Material,
  options: RoofPlanesOptions,
): { root: THREE.Object3D; slopes: [THREE.Object3D, THREE.Object3D] } {
  const result = createRoofPlanesExplicit(name, material, options);
  result.slopes[0].name = `Mesh_${name}A`;
  result.slopes[1].name = `Mesh_${name}B`;
  for (let index = 0; index < result.slopes.length; index++) {
    const normal = new THREE.Vector3().setFromMatrixColumn(result.faces[index]!.localToRoof, 1);
    result.slopes[index]!.position.addScaledVector(normal, (options.thickness ?? 0.08) / 2);
  }
  // Preserve the legacy, opposite-sign X Euler readout for ridge-X callers.
  // The explicit face frame reverses the negative face's ridge tangent to stay
  // right-handed, whose equivalent default Euler representation differs by PI.
  if ((options.ridgeAxis ?? 'x') === 'x') {
    const halfRun = options.width / 2 + (options.overhang ?? 0.3);
    const angle = Math.atan2(options.height, halfRun);
    result.slopes[1].rotation.set(-angle, Math.PI, 0);
  }
  return result;
}

export interface StairsOptions {
  /** Number of steps. Default 8. */
  steps?: number;
  /** Total vertical climb. */
  totalRise: number;
  /** Total horizontal run along `axis`. */
  totalRun: number;
  /** Tread width along the perpendicular horizontal axis. */
  width: number;
  /** Direction the flight climbs toward. Default 'x'. */
  axis?: 'x' | 'z';
  treadThickness?: number;
  /** Add a vertical riser face under each tread. Default true. */
  riser?: boolean;
  parent?: THREE.Object3D;
}

/**
 * A straight flight of stairs: box treads (with optional risers) climbing
 * `totalRise` over `totalRun` from local origin toward +`axis`. Connects storeys
 * (the multi-storey toggle) or makes porch/entry steps. Steps are named
 * `Step_1..N` for engine use.
 */
export function createStairs(
  name: string,
  material: THREE.Material,
  options: StairsOptions,
): { root: THREE.Object3D; steps: THREE.Object3D[] } {
  const {
    steps = 8,
    totalRise,
    totalRun,
    width,
    axis = 'x',
    treadThickness = 0.08,
    riser = true,
    parent,
  } = options;
  if (steps < 1) {
    throw new Error(`createStairs("${name}"): steps must be >= 1 (got ${steps}).`);
  }
  if (Math.abs(totalRise) < 1e-4 || Math.abs(totalRun) < 1e-4) {
    throw new Error(
      `createStairs("${name}"): totalRise and totalRun must be non-zero (got rise=${totalRise}, run=${totalRun}).`,
    );
  }
  const root = new THREE.Object3D();
  root.name = name;
  const stepRise = totalRise / steps;
  const stepRun = totalRun / steps;
  const stepList: THREE.Object3D[] = [];

  for (let i = 0; i < steps; i++) {
    const topY = (i + 1) * stepRise;
    const alongC = (i + 0.5) * stepRun;
    const treadGeo =
      axis === 'x'
        ? boxGeo(stepRun, treadThickness, width)
        : boxGeo(width, treadThickness, stepRun);
    const treadPos: [number, number, number] =
      axis === 'x'
        ? [alongC, topY - treadThickness / 2, 0]
        : [0, topY - treadThickness / 2, alongC];
    stepList.push(
      createPart(`${name}Step${i + 1}`, treadGeo, material, { position: treadPos, parent: root }),
    );

    if (riser) {
      const front = i * stepRun;
      const riserGeo =
        axis === 'x'
          ? boxGeo(treadThickness, stepRise, width)
          : boxGeo(width, stepRise, treadThickness);
      const riserPos: [number, number, number] =
        axis === 'x'
          ? [front + treadThickness / 2, topY - stepRise / 2, 0]
          : [0, topY - stepRise / 2, front + treadThickness / 2];
      createPart(`${name}Riser${i + 1}`, riserGeo, material, { position: riserPos, parent: root });
    }
  }

  if (parent) parent.add(root);
  return { root, steps: stepList };
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
  } = {},
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
  options: { transparent?: boolean; opacity?: number } = {},
): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
  });
}

export function glassMaterial(
  color: number | string,
  options: { opacity?: number; roughness?: number; metalness?: number } = {},
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
  options: { flatShading?: boolean; emissive?: number | string } = {},
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
  interpolation?: TrackInterpolation,
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
      THREE.MathUtils.degToRad(kf.rotation[2]),
    );
    quat.setFromEuler(euler);
    values.push(quat.x, quat.y, quat.z, quat.w);
  }

  return new THREE.QuaternionKeyframeTrack(
    `${jointName}.quaternion`,
    times,
    values,
    threeInterpolation(interpolation),
  );
}

export function positionTrack(
  jointName: string,
  keyframes: Array<{ time: number; position: [number, number, number] }>,
  interpolation?: TrackInterpolation,
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
    threeInterpolation(interpolation),
  );
}

export function scaleTrack(
  jointName: string,
  keyframes: Array<{ time: number; scale: [number, number, number] }>,
  interpolation?: TrackInterpolation,
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
    threeInterpolation(interpolation),
  );
}

export function createClip(
  name: string,
  duration: number,
  tracks: THREE.KeyframeTrack[],
): THREE.AnimationClip {
  return new THREE.AnimationClip(name, duration, tracks);
}

// =============================================================================
// Common Animation Patterns
// =============================================================================

export function idleBreathing(bodyJoint: string, duration = 2, amount = 0.02): THREE.AnimationClip {
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
  height = 0.1,
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
  axis: 'x' | 'y' | 'z' = 'y',
): THREE.AnimationClip {
  const rotation: [number, number, number] = [0, 0, 0];
  const idx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
  const rotations: Array<{ time: number; rotation: [number, number, number] }> = [];

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
  } = {},
): THREE.Object3D {
  // Duck-typed `.isMesh` — sandbox-created meshes belong to a different
  // module realm than this file's THREE import. See render.ts comment.
  const isMesh = (o: THREE.Object3D | undefined): o is THREE.Mesh =>
    !!(o as { isMesh?: boolean })?.isMesh;
  const sourceMesh = isMesh(source)
    ? source
    : (source.children.find(isMesh) as THREE.Mesh | undefined);

  if (!sourceMesh) {
    throw new Error(`createInstance("${name}"): source "${source.name}" has no Mesh to clone from`);
  }

  const mesh = new THREE.Mesh(sourceMesh.geometry, sourceMesh.material);
  mesh.name = `Mesh_${name}`;

  if (options.position) mesh.position.set(...options.position);
  if (options.rotation)
    mesh.rotation.set(
      THREE.MathUtils.degToRad(options.rotation[0]),
      THREE.MathUtils.degToRad(options.rotation[1]),
      THREE.MathUtils.degToRad(options.rotation[2]),
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
    if ((child as { isMesh?: boolean }).isMesh) {
      const meshChild = child as THREE.Mesh;
      const geometry = meshChild.geometry;
      if (geometry.index) {
        count += geometry.index.count / 3;
      } else {
        const position = geometry.getAttribute('position');
        if (position) count += position.count / 3;
      }
    } else if ((child as { isSprite?: boolean }).isSprite) {
      // The canonical GLB bridge materializes every Three.js Sprite as one
      // semantic camera-facing quad.
      count += 2;
    }
  });
  return Math.floor(count);
}

export function countMaterials(root: THREE.Object3D): number {
  const materials = new Set<THREE.Material>();
  root.traverse((child) => {
    if ((child as { isMesh?: boolean }).isMesh) {
      const meshChild = child as THREE.Mesh;
      if (Array.isArray(meshChild.material)) {
        meshChild.material.forEach((material) => {
          materials.add(material);
        });
      } else {
        materials.add(meshChild.material);
      }
    } else if ((child as { isSprite?: boolean }).isSprite) {
      materials.add((child as THREE.Sprite).material);
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
 *
 * There is no triangle advisory here, deliberately. This function used to warn
 * above a per-category `suggestedTris` (a prop was scolded at 3,001 triangles),
 * and a model that calls it while iterating reads that warning as an instruction
 * to remove detail. Triangle count is not a runtime cost driver — draw calls
 * are, which is what the material advisory below actually measures — so the
 * triangle line cost real asset quality and bought nothing.
 *
 * `countTriangles` is still exported and still reported in render metrics. It is
 * information, not a verdict.
 */
export function validateAsset(
  root: THREE.Object3D,
  category: AssetCategory,
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Distinct-material count drives draw calls and the instanceability grade,
  // which is a real cost. Unlike triangles, this one is worth saying out loud.
  const suggestedMats: Record<AssetCategory, number> = {
    character: 8,
    prop: 6,
    vfx: 4,
    environment: 12,
    architecture: 12,
    vegetation: 8,
    vehicle: 10,
  };

  const mats = countMaterials(root);
  const matLimit = suggestedMats[category];

  if (mats > matLimit) {
    warnings.push(`High material count: ${mats} (suggested: ${matLimit})`);
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
export interface SandboxGlobalsOptions {
  /** Host-owned closed resolver. Generated code receives only the bound
   *  loadApprovedTexture(resourceId) closure, never this object. */
  textureResolver?: TextureResolver;
}

export function buildSandboxGlobals(
  usage?: Record<string, number>,
  options: SandboxGlobalsOptions = {},
): Record<string, unknown> {
  // CSG ops remain lazy at their own call sites, so importing the wrapper here
  // is safe for Node ESM builds and still avoids manifold WASM init unless used.

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wrap = <F extends (...args: any[]) => any>(name: string, fn: F): F => {
    if (!usage) return fn;
    const wrapped = (...args: Parameters<F>): ReturnType<F> => {
      usage[name] = (usage[name] ?? 0) + 1;
      return fn(...args);
    };
    return wrapped as F;
  };

  // -- Lazy mesh cache (per-sandbox, not a process global) ---------------
  //
  // Pattern adapted from chili3d's lazy-mesher: each parametric geometry is
  // memoised on stringified args, so repeated calls inside a single build()
  // return the same BufferGeometry reference. gltf-transform deduplicates
  // on export but agents that don't reach for cloneGeometry/createInstance
  // still get the win for free.
  //
  // Contract: callers must NOT mutate returned geometries. The existing
  // primitive surface already follows this — every helper returns a fresh
  // object today, and any caller that wants to mutate uses cloneGeometry
  // first (already a no-op-by-design signal). With caching enabled, that
  // signal becomes load-bearing: mutating a cached geometry corrupts every
  // subsequent caller.
  //
  // Each cached geometry is also stamped with a `kilnRanges` entry on its
  // userData (B3 — sub-shape mapping). The renderer ignores it (gltf-
  // transform doesn't serialise userData), but downstream tooling — a
  // future click-to-edit interaction in the gallery viewer — can map a
  // clicked triangle back to the primitive call that produced it.
  const geoCache = new Map<string, THREE.BufferGeometry>();
  let _kilnCallSeq = 0;
  const stampKilnRange = (name: string, geo: THREE.BufferGeometry) => {
    const idx = geo.getIndex();
    const triCount = idx ? idx.count / 3 : (geo.getAttribute('position')?.count ?? 0) / 3;
    const callId = ++_kilnCallSeq;
    geo.userData = {
      ...(geo.userData ?? {}),
      kilnRanges: [
        {
          name: `${name}#${callId}`,
          start: 0,
          count: Math.floor(triCount),
        },
      ],
    };
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cacheGeo = <F extends (...args: any[]) => THREE.BufferGeometry>(name: string, fn: F): F => {
    const memoFn = (...args: Parameters<F>): THREE.BufferGeometry => {
      let key: string;
      try {
        key = `${name}::${JSON.stringify(args)}`;
      } catch {
        // Args weren't JSON-stringifiable (circular ref, BufferGeometry,
        // etc.) — bypass the cache rather than throw, but still tag the
        // result with kilnRanges so downstream inspection works.
        const result = fn(...args);
        stampKilnRange(name, result);
        return result;
      }
      const hit = geoCache.get(key);
      if (hit) return hit;
      const result = fn(...args);
      stampKilnRange(name, result);
      geoCache.set(key, result);
      return result;
    };
    return memoFn as F;
  };
  // Compose: usage tracking (outer) + memoisation (inner). A cache hit
  // still ticks the usage counter so the telemetry reflects what the
  // agent wrote, not what was recomputed.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wrapGeo = <F extends (...args: any[]) => THREE.BufferGeometry>(name: string, fn: F): F =>
    wrap(name, cacheGeo(name, fn));

  const loadApprovedTexture = (...args: unknown[]): Promise<THREE.DataTexture> => {
    if (args.length !== 1 || typeof args[0] !== 'string') {
      return Promise.reject(
        new TypeError('loadApprovedTexture accepts exactly one approved resource ID string'),
      );
    }
    if (!options.textureResolver) {
      return Promise.reject(new Error('loadApprovedTexture: no host TextureResolver is installed'));
    }
    return options.textureResolver.loadApprovedTexture(args[0]);
  };

  const sandboxMaterialRecipe = (...args: unknown[]): Promise<THREE.MeshStandardMaterial> => {
    if (args.length < 1 || args.length > 2 || typeof args[0] !== 'string') {
      return Promise.reject(
        new TypeError(
          'materialRecipe accepts an approved recipe ID and optional bounded overrides',
        ),
      );
    }
    if (!options.textureResolver) {
      return Promise.reject(new Error('materialRecipe: no host TextureResolver is installed'));
    }
    return options.textureResolver.materialRecipe(args[0], args[1]);
  };

  return {
    createRoot: wrap('createRoot', createRoot),
    createPivot: wrap('createPivot', createPivot),
    createJointChain: wrap('createJointChain', createJointChain),
    createVehicleFrame: wrap('createVehicleFrame', createVehicleFrame),
    createWheelGeometrySet: wrap('createWheelGeometrySet', createWheelGeometrySet),
    createWheelAssembly: wrap('createWheelAssembly', createWheelAssembly),
    createPart: wrap('createPart', createPart),
    capsuleGeo: wrapGeo('capsuleGeo', capsuleGeo),
    capsuleXGeo: wrapGeo('capsuleXGeo', capsuleXGeo),
    capsuleYGeo: wrapGeo('capsuleYGeo', capsuleYGeo),
    capsuleZGeo: wrapGeo('capsuleZGeo', capsuleZGeo),
    cylinderGeo: wrapGeo('cylinderGeo', cylinderGeo),
    cylinderXGeo: wrapGeo('cylinderXGeo', cylinderXGeo),
    cylinderYGeo: wrapGeo('cylinderYGeo', cylinderYGeo),
    cylinderZGeo: wrapGeo('cylinderZGeo', cylinderZGeo),
    boxGeo: wrapGeo('boxGeo', boxGeo),
    sphereGeo: wrapGeo('sphereGeo', sphereGeo),
    coneGeo: wrapGeo('coneGeo', coneGeo),
    coneXGeo: wrapGeo('coneXGeo', coneXGeo),
    coneYGeo: wrapGeo('coneYGeo', coneYGeo),
    coneZGeo: wrapGeo('coneZGeo', coneZGeo),
    taperConeGeo: wrapGeo('taperConeGeo', taperConeGeo),
    cylinderOnAxis: wrapGeo('cylinderOnAxis', cylinderOnAxis),
    torusGeo: wrapGeo('torusGeo', torusGeo),
    planeGeo: wrapGeo('planeGeo', planeGeo),
    decalBox: wrapGeo('decalBox', decalBox),
    foliageCardGeo: wrapGeo('foliageCardGeo', foliageCardGeo),
    crossedQuadsGeo: wrapGeo('crossedQuadsGeo', crossedQuadsGeo),
    octaGridPlane: wrapGeo('octaGridPlane', octaGridPlane),
    wingGeo: wrapGeo('wingGeo', wingGeo),
    createWingPair: wrap('createWingPair', createWingPair),
    beamBetween: wrap('beamBetween', beamBetween),
    createLadder: wrap('createLadder', createLadder),
    snapTo: wrap('snapTo', snapTo),
    room: wrap('room', room),
    wallWithOpening: wrap('wallWithOpening', wallWithOpening),
    createRoofPlanes: wrap('createRoofPlanes', createRoofPlanes),
    createGableRoof: wrap('createGableRoof', createGableRoof),
    createGableEndPanel: wrap('createGableEndPanel', createGableEndPanel),
    createGableShell: wrap('createGableShell', createGableShell),
    createRoofSurfaceLayout: wrap('createRoofSurfaceLayout', createRoofSurfaceLayout),
    createStairs: wrap('createStairs', createStairs),
    gameMaterial: wrap('gameMaterial', gameMaterial),
    materialRecipe: wrap('materialRecipe', sandboxMaterialRecipe),
    compilePortableMaterialSpecV2: wrap(
      'compilePortableMaterialSpecV2',
      compilePortableMaterialSpecV2,
    ),
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
    // Bevel / extrude / revolve (async — same manifold WASM as the CSG ops).
    // NOT wrapGeo: these return a Promise, and the geometry memo/kilnRanges
    // stamp in wrapGeo operates on a BufferGeometry synchronously.
    roundedBoxGeo: wrap('roundedBoxGeo', profile.roundedBoxGeo),
    extrudeProfile: wrap('extrudeProfile', profile.extrudeProfile),
    revolveProfile: wrap('revolveProfile', profile.revolveProfile),
    circleProfile: wrap('circleProfile', profile.circleProfile),
    // Array/mirror/subdivide/curve ops
    arrayLinear: wrap('arrayLinear', ops.arrayLinear),
    arrayRadial: wrap('arrayRadial', ops.arrayRadial),
    mirror: wrap('mirror', ops.mirror),
    subdivide: wrap('subdivide', ops.subdivide),
    mergeVertices: wrap('mergeVertices', ops.mergeVertices),
    curveToMesh: wrap('curveToMesh', ops.curveToMesh),
    pipeAlongPath: wrap('pipeAlongPath', ops.pipeAlongPath),
    lathe: wrap('lathe', ops.lathe),
    revolveGeo: wrap('revolveGeo', ops.revolveGeo),
    bezierCurve: wrap('bezierCurve', ops.bezierCurve),
    // UV (async)
    autoUnwrap: wrap('autoUnwrap', uv.autoUnwrap),
    // Shape-aware unwraps (sync — preserve built-in directional UVs)
    boxUnwrap: wrap('boxUnwrap', uvShapes.boxUnwrap),
    cylinderUnwrap: wrap('cylinderUnwrap', uvShapes.cylinderUnwrap),
    planeUnwrap: wrap('planeUnwrap', uvShapes.planeUnwrap),
    panelRemapV: wrap('panelRemapV', uvShapes.panelRemapV),
    // Parametric primitives
    gearGeo: wrapGeo('gearGeo', gears.gearGeo),
    bladeGeo: wrapGeo('bladeGeo', gears.bladeGeo),
    // Closed approved textures. Paths, URLs, bytes, hashes, and resolver
    // objects are intentionally not accepted by this one-argument closure.
    loadApprovedTexture: wrap('loadApprovedTexture', loadApprovedTexture),
    // Procedural textures (sync — no I/O, so no await)
    proceduralTexture: wrap('proceduralTexture', proceduralTextures.proceduralTexture),
    normalMapFromHeight: wrap('normalMapFromHeight', proceduralTextures.normalMapFromHeight),
    pbrMaterial: wrap('pbrMaterial', textures.pbrMaterial),
    foliageMaterial: wrap('foliageMaterial', textures.foliageMaterial),
    countTriangles: wrap('countTriangles', countTriangles),
    countMaterials: wrap('countMaterials', countMaterials),
    getJointNames: wrap('getJointNames', getJointNames),
    validateAsset: wrap('validateAsset', validateAsset),
    // THREE namespace is exposed so agents can `new THREE.Mesh(geo, mat)`
    // as operands to CSG and other ops that expect Object3D inputs.
    THREE,
    Math,
    console,
  };
}

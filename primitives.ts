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

export function cylinderGeo(
  radiusTop: number,
  radiusBottom: number,
  height: number,
  segments = 8
): THREE.CylinderGeometry {
  return new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments);
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

export function rotationTrack(
  jointName: string,
  keyframes: Array<{ time: number; rotation: [number, number, number] }>
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
    values
  );
}

export function positionTrack(
  jointName: string,
  keyframes: Array<{ time: number; position: [number, number, number] }>
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
    values
  );
}

export function scaleTrack(
  jointName: string,
  keyframes: Array<{ time: number; scale: [number, number, number] }>
): THREE.VectorKeyframeTrack {
  const times: number[] = [];
  const values: number[] = [];

  for (const kf of keyframes) {
    times.push(kf.time);
    values.push(...kf.scale);
  }

  return new THREE.VectorKeyframeTrack(`${jointName}.scale`, times, values);
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
 * The full sandbox globals used when executing Kiln code. Kept in one place
 * so render.ts and any future evaluator share the same surface area as what
 * the LLM expects.
 */
export function buildSandboxGlobals(): Record<string, unknown> {
  return {
    createRoot, createPivot, createPart,
    capsuleGeo, cylinderGeo, boxGeo, sphereGeo, coneGeo, torusGeo, planeGeo,
    gameMaterial, basicMaterial, glassMaterial, lambertMaterial,
    rotationTrack, positionTrack, scaleTrack, createClip,
    spinAnimation, bobbingAnimation, idleBreathing,
    Math, console,
  };
}

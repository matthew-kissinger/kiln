/**
 * Kiln Scene Introspection (W3b.1)
 *
 * Executes generated Kiln code headlessly, walks the resulting Three.js scene,
 * and returns a structured report agents can use to debug generation output.
 *
 * Typical use:
 *
 * ```ts
 * const result = await kiln.inspect(code);
 * if (result.boundingBox.min[1] > 0.1) {
 *   // Asset floats above ground - feed back to Claude.
 * }
 * ```
 *
 * Pure function: no file I/O, no WebGL, no GLB bytes.
 */

import * as THREE from 'three';

import { executeKilnCode, inspectGeneratedAnimation } from './render';

// =============================================================================
// Types
// =============================================================================

export type Vec3Tuple = [number, number, number];

export interface InspectNamedPart {
  /** Three.js Object3D name (e.g. `"Joint_LeftWheel"`, `"Mesh_Barrel"`). */
  name: string;
  /** Rough classification derived from name + object type. */
  type: 'pivot' | 'mesh' | 'group';
  /** Local position (relative to parent). */
  position: Vec3Tuple;
}

export interface InspectAnimationTrack {
  /** Clip the track belongs to. */
  clipName: string;
  /** Node name the track targets (e.g. `"Joint_LeftWheel"`). */
  targetName: string;
  /** Which transform channel the track drives. */
  property: 'rotation' | 'position' | 'scale';
  /** Whether `targetName` resolves to a node in the scene graph. */
  targetResolved: boolean;
}

export interface InspectBoundingBox {
  min: Vec3Tuple;
  max: Vec3Tuple;
  size: Vec3Tuple;
}

export interface InspectResult {
  /** Total triangle count across every mesh in the scene graph. */
  triangles: number;
  /** Unique material count (by reference equality). */
  materials: number;
  /** World-space bounding box of the full scene. */
  boundingBox: InspectBoundingBox;
  /** All named pivots, meshes, and groups in traversal order. */
  namedParts: InspectNamedPart[];
  /** Every animation channel, with resolution flags so agents can spot typos. */
  animationTracks: InspectAnimationTrack[];
  /** Primitive helper names referenced in the source code. */
  primitivesUsed: string[];
  /** Non-fatal issues (e.g. tracks targeting unknown nodes). */
  warnings: string[];
  /** `meta` block extracted from the code. */
  meta: Record<string, unknown>;
}

// =============================================================================
// Primitive detection
// =============================================================================

/**
 * Names of every primitive helper exposed in the Kiln sandbox. Kept in sync
 * with `buildSandboxGlobals` by hand — the catalog is tiny and any drift
 * surfaces immediately in `listPrimitives()` tests.
 */
const KNOWN_PRIMITIVE_NAMES = [
  'createRoot',
  'createPivot',
  'createPart',
  'capsuleGeo',
  'capsuleXGeo',
  'capsuleYGeo',
  'capsuleZGeo',
  'cylinderGeo',
  'cylinderXGeo',
  'cylinderYGeo',
  'cylinderZGeo',
  'boxGeo',
  'sphereGeo',
  'coneGeo',
  'coneXGeo',
  'coneYGeo',
  'coneZGeo',
  'torusGeo',
  'planeGeo',
  'decalBox',
  'wingGeo',
  'createWingPair',
  'beamBetween',
  'createLadder',
  'gameMaterial',
  'basicMaterial',
  'glassMaterial',
  'lambertMaterial',
  'rotationTrack',
  'positionTrack',
  'scaleTrack',
  'createClip',
  'idleBreathing',
  'bobbingAnimation',
  'spinAnimation',
  'countTriangles',
  'countMaterials',
  'getJointNames',
  'validateAsset',
] as const;

function detectPrimitivesUsed(code: string): string[] {
  const seen = new Set<string>();
  for (const name of KNOWN_PRIMITIVE_NAMES) {
    // Match `name(` as a word boundary — avoids picking up substrings inside
    // other identifiers.
    const re = new RegExp(`\\b${name}\\s*\\(`);
    if (re.test(code)) seen.add(name);
  }
  return Array.from(seen).sort();
}

// =============================================================================
// Scene walk
// =============================================================================

function classifyNode(obj: THREE.Object3D): 'pivot' | 'mesh' | 'group' {
  if (obj instanceof THREE.Mesh) return 'mesh';
  if (obj.name.startsWith('Joint_')) return 'pivot';
  return 'group';
}

function collectNamedParts(root: THREE.Object3D): InspectNamedPart[] {
  const parts: InspectNamedPart[] = [];
  root.traverse((obj) => {
    if (!obj.name) return;
    parts.push({
      name: obj.name,
      type: classifyNode(obj),
      position: [obj.position.x, obj.position.y, obj.position.z],
    });
  });
  return parts;
}

function countTris(root: THREE.Object3D): number {
  let count = 0;
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const geometry = child.geometry;
    if (!geometry) return;
    if (geometry.index) {
      count += geometry.index.count / 3;
    } else {
      const position = geometry.getAttribute('position');
      if (position) count += position.count / 3;
    }
  });
  return Math.floor(count);
}

function countUniqueMaterials(root: THREE.Object3D): number {
  const materials = new Set<THREE.Material>();
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    if (Array.isArray(child.material)) {
      for (const m of child.material) materials.add(m);
    } else if (child.material) {
      materials.add(child.material);
    }
  });
  return materials.size;
}

function computeBoundingBox(root: THREE.Object3D): InspectBoundingBox {
  // Ensure world matrices are fresh before measuring — otherwise nested
  // pivots can misreport bounds when positions were set after the last
  // auto-update. executeKilnCode hands us a detached tree, so we drive
  // updates explicitly.
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);

  // If the scene has no geometry at all (pivots-only), Box3 stays at +Inf /
  // -Inf. Collapse to the origin so downstream consumers get finite numbers.
  if (!isFinite(box.min.x) || !isFinite(box.max.x)) {
    return {
      min: [0, 0, 0],
      max: [0, 0, 0],
      size: [0, 0, 0],
    };
  }

  const size = new THREE.Vector3();
  box.getSize(size);

  return {
    min: [box.min.x, box.min.y, box.min.z],
    max: [box.max.x, box.max.y, box.max.z],
    size: [size.x, size.y, size.z],
  };
}

function collectAnimationTracks(
  root: THREE.Object3D,
  clips: THREE.AnimationClip[]
): InspectAnimationTrack[] {
  const tracks: InspectAnimationTrack[] = [];
  if (clips.length === 0) return tracks;

  const nodeNames = new Set<string>();
  root.traverse((obj) => {
    if (obj.name) nodeNames.add(obj.name);
  });

  for (const clip of clips) {
    for (const track of clip.tracks) {
      const dotIdx = track.name.lastIndexOf('.');
      if (dotIdx === -1) continue;
      const targetName = track.name.substring(0, dotIdx);
      const rawProp = track.name.substring(dotIdx + 1);

      // Three.js stores rotation tracks as `.quaternion` on the track name
      // but agents think of them as `rotation`. Normalize for the report.
      let property: 'rotation' | 'position' | 'scale';
      if (rawProp === 'quaternion' || rawProp === 'rotation') {
        property = 'rotation';
      } else if (rawProp === 'position') {
        property = 'position';
      } else if (rawProp === 'scale') {
        property = 'scale';
      } else {
        continue; // unsupported channel — surfaced via warnings instead
      }

      tracks.push({
        clipName: clip.name,
        targetName,
        property,
        targetResolved: nodeNames.has(targetName),
      });
    }
  }

  return tracks;
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Execute Kiln code and return a structured inspection report.
 *
 * @throws {Error} if the code can't be executed (same errors as
 *                 {@link executeKilnCode}).
 */
export async function inspect(code: string): Promise<InspectResult> {
  const { meta, root, clips } = await executeKilnCode(code);

  const primitivesUsed = detectPrimitivesUsed(code);
  const namedParts = collectNamedParts(root);
  const triangles = countTris(root);
  const materials = countUniqueMaterials(root);
  const boundingBox = computeBoundingBox(root);
  const animationTracks = collectAnimationTracks(root, clips);
  const warnings = inspectGeneratedAnimation(root, clips);

  return {
    triangles,
    materials,
    boundingBox,
    namedParts,
    animationTracks,
    primitivesUsed,
    warnings,
    meta: meta as Record<string, unknown>,
  };
}

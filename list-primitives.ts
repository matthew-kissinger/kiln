/**
 * Kiln Primitive Catalog (W3b.2)
 *
 * Self-describing inventory of every helper function the Kiln sandbox
 * exposes to generated code. Agents call `kiln.listPrimitives()` to
 * discover the surface without reading `primitives.ts` directly.
 *
 * The list is hand-authored rather than JSDoc-parsed — the catalog is
 * small (25 entries) and hand-authoring gives cleaner `signature` /
 * `example` strings than we'd get from TS AST extraction. Drift is caught
 * by `__tests__/list-primitives.test.ts` which asserts every entry
 * matches a real sandbox global.
 */

export interface PrimitiveSpec {
  /** Function name as it appears in the sandbox. */
  name: string;
  /** Human-readable signature (`"boxGeo(w: number, h: number, d: number)"`). */
  signature: string;
  /** Return type description (`"THREE.BufferGeometry"`). */
  returns: string;
  /** One-sentence summary of what the primitive does. */
  description: string;
  /** Idiomatic usage snippet agents can splice directly into generated code. */
  example: string;
  /** High-level grouping for filtering in agent UIs. */
  category: 'geometry' | 'material' | 'structure' | 'animation' | 'utility';
}

const PRIMITIVES: PrimitiveSpec[] = [
  // ---------------------------------------------------------------------------
  // Structure
  // ---------------------------------------------------------------------------
  {
    name: 'createRoot',
    signature: 'createRoot(name: string)',
    returns: 'THREE.Object3D',
    category: 'structure',
    description: 'Creates the root Object3D for an asset. Call first in build().',
    example: "const root = createRoot('FuelDrum');",
  },
  {
    name: 'createPivot',
    signature: 'createPivot(name: string, position?: [x, y, z], parent?: Object3D)',
    returns: 'THREE.Object3D (prefixed `Joint_`)',
    category: 'structure',
    description:
      'Creates an empty pivot node for skeletal animation. Name is auto-prefixed with `Joint_`.',
    example: "const hip = createPivot('Hip', [0, 1, 0], root);",
  },
  {
    name: 'createPart',
    signature:
      'createPart(name, geometry, material, opts?: { position, rotation, scale, pivot, parent })',
    returns: 'THREE.Object3D (mesh or wrapping pivot)',
    category: 'structure',
    description:
      'Creates a mesh, optionally wrapped in a pivot, and attaches it to `opts.parent`.',
    example:
      "createPart('Barrel', cylinderGeo(0.1, 0.1, 1), gameMaterial(0x556b2f), { position: [0, 0.5, 0], parent: root });",
  },

  // ---------------------------------------------------------------------------
  // Geometry
  // ---------------------------------------------------------------------------
  {
    name: 'boxGeo',
    signature: 'boxGeo(width: number, height: number, depth: number)',
    returns: 'THREE.BoxGeometry',
    category: 'geometry',
    description: '6-face box. 12 tris regardless of size. Cheapest geometry.',
    example: 'const geo = boxGeo(1, 0.5, 2);',
  },
  {
    name: 'sphereGeo',
    signature: 'sphereGeo(radius: number, widthSegments?: 8, heightSegments?: 6)',
    returns: 'THREE.SphereGeometry',
    category: 'geometry',
    description:
      'UV sphere. Default 8x6 segments = 84 tris. Bump segments for smoother curves.',
    example: 'const geo = sphereGeo(0.5, 12, 8);',
  },
  {
    name: 'cylinderGeo',
    signature:
      'cylinderGeo(radiusTop: number, radiusBottom: number, height: number, segments?: 8)',
    returns: 'THREE.CylinderGeometry',
    category: 'geometry',
    description:
      'Y-axis cylinder. Use radiusTop != radiusBottom for cones / tapered pieces.',
    example: 'const geo = cylinderGeo(0.25, 0.25, 1, 12);',
  },
  {
    name: 'capsuleGeo',
    signature: 'capsuleGeo(radius: number, height: number, segments?: 6)',
    returns: 'THREE.CapsuleGeometry',
    category: 'geometry',
    description: 'Stadium shape (cylinder with hemispherical caps). Good for limbs.',
    example: 'const geo = capsuleGeo(0.1, 0.5, 6);',
  },
  {
    name: 'coneGeo',
    signature: 'coneGeo(radius: number, height: number, segments?: 8)',
    returns: 'THREE.ConeGeometry',
    category: 'geometry',
    description: 'Y-axis cone (pointed up). Use for spikes, roofs, projectiles.',
    example: 'const geo = coneGeo(0.3, 0.8, 8);',
  },
  {
    name: 'torusGeo',
    signature:
      'torusGeo(radius: number, tube: number, radialSegments?: 8, tubularSegments?: 12)',
    returns: 'THREE.TorusGeometry',
    category: 'geometry',
    description: 'Donut shape. For rings, tyres, barrel ribs.',
    example: 'const geo = torusGeo(0.4, 0.04, 8, 16);',
  },
  {
    name: 'planeGeo',
    signature:
      'planeGeo(width: number, height: number, widthSegments?: 1, heightSegments?: 1)',
    returns: 'THREE.PlaneGeometry',
    category: 'geometry',
    description: 'Flat quad. Faces +Z by default. Rotate to use as ground / decal.',
    example: 'const geo = planeGeo(4, 4);',
  },

  // ---------------------------------------------------------------------------
  // Materials
  // ---------------------------------------------------------------------------
  {
    name: 'gameMaterial',
    signature:
      'gameMaterial(color, opts?: { metalness, roughness, emissive, emissiveIntensity, flatShading })',
    returns: 'THREE.MeshStandardMaterial',
    category: 'material',
    description:
      'Flat-shaded PBR material. Default for game-ready low-poly. Use for 95% of parts.',
    example: "const mat = gameMaterial(0x8b7355, { roughness: 0.9 });",
  },
  {
    name: 'basicMaterial',
    signature: 'basicMaterial(color, opts?: { transparent, opacity })',
    returns: 'THREE.MeshBasicMaterial',
    category: 'material',
    description: 'Unlit flat material. For UI / effects where lighting is baked in.',
    example: "const mat = basicMaterial(0xffffff, { transparent: true, opacity: 0.5 });",
  },
  {
    name: 'glassMaterial',
    signature: 'glassMaterial(color, opts?: { opacity, roughness, metalness })',
    returns: 'THREE.MeshStandardMaterial',
    category: 'material',
    description: 'Semi-transparent double-sided material. Panels need ~0.05 offset to avoid z-fighting.',
    example: 'const mat = glassMaterial(0x66ccff, { opacity: 0.3 });',
  },
  {
    name: 'lambertMaterial',
    signature: 'lambertMaterial(color, opts?: { flatShading, emissive })',
    returns: 'THREE.MeshLambertMaterial',
    category: 'material',
    description: 'Cheaper than gameMaterial. No metalness/roughness. Use when PBR is overkill.',
    example: "const mat = lambertMaterial(0x2a4d14, { flatShading: true });",
  },

  // ---------------------------------------------------------------------------
  // Animation — keyframe tracks
  // ---------------------------------------------------------------------------
  {
    name: 'rotationTrack',
    signature:
      'rotationTrack(jointName: string, keyframes: Array<{ time, rotation: [xDeg, yDeg, zDeg] }>)',
    returns: 'THREE.QuaternionKeyframeTrack',
    category: 'animation',
    description:
      'Rotation track in degrees, auto-converted to quaternions. Joint name must include `Joint_` prefix.',
    example:
      "rotationTrack('Joint_Lid', [{ time: 0, rotation: [0, 0, 0] }, { time: 1, rotation: [90, 0, 0] }]);",
  },
  {
    name: 'positionTrack',
    signature:
      'positionTrack(jointName: string, keyframes: Array<{ time, position: [x, y, z] }>)',
    returns: 'THREE.VectorKeyframeTrack',
    category: 'animation',
    description: 'Position track in world units. Always use `position:` not `value:` in keyframes.',
    example:
      "positionTrack('Joint_Body', [{ time: 0, position: [0, 0, 0] }, { time: 1, position: [0, 0.1, 0] }]);",
  },
  {
    name: 'scaleTrack',
    signature:
      'scaleTrack(jointName: string, keyframes: Array<{ time, scale: [x, y, z] }>)',
    returns: 'THREE.VectorKeyframeTrack',
    category: 'animation',
    description: 'Uniform or per-axis scale track.',
    example:
      "scaleTrack('Joint_Chest', [{ time: 0, scale: [1, 1, 1] }, { time: 1, scale: [1.1, 1.1, 1.1] }]);",
  },
  {
    name: 'createClip',
    signature: 'createClip(name: string, duration: number, tracks: KeyframeTrack[])',
    returns: 'THREE.AnimationClip',
    category: 'animation',
    description: 'Collects tracks into a named clip. Returned from animate().',
    example: "return [createClip('Open', 1, [rotationTrack('Joint_Lid', [...])])];",
  },

  // ---------------------------------------------------------------------------
  // Animation — presets
  // ---------------------------------------------------------------------------
  {
    name: 'idleBreathing',
    signature: 'idleBreathing(bodyJoint: string, duration?: 2, amount?: 0.02)',
    returns: 'THREE.AnimationClip',
    category: 'animation',
    description: 'Gentle Y-axis bob. For NPC idle states.',
    example: "return [idleBreathing('Joint_Body')];",
  },
  {
    name: 'bobbingAnimation',
    signature: 'bobbingAnimation(rootName: string, duration?: 2, height?: 0.1)',
    returns: 'THREE.AnimationClip',
    category: 'animation',
    description: 'Floating / bobbing loop for pickups and effects.',
    example: "return [bobbingAnimation('Joint_Root', 1.5, 0.08)];",
  },
  {
    name: 'spinAnimation',
    signature: "spinAnimation(jointName: string, duration?: 2, axis?: 'x' | 'y' | 'z')",
    returns: 'THREE.AnimationClip',
    category: 'animation',
    description: '360° rotation over `duration` around `axis`.',
    example: "return [spinAnimation('Joint_Rotor', 0.5, 'y')];",
  },

  // ---------------------------------------------------------------------------
  // Utility
  // ---------------------------------------------------------------------------
  {
    name: 'countTriangles',
    signature: 'countTriangles(root: Object3D)',
    returns: 'number',
    category: 'utility',
    description: 'Sums triangle count across every mesh in the subtree.',
    example: "meta.tris = countTriangles(root);",
  },
  {
    name: 'countMaterials',
    signature: 'countMaterials(root: Object3D)',
    returns: 'number',
    category: 'utility',
    description: 'Unique material count (by reference) across the subtree.',
    example: 'const mats = countMaterials(root);',
  },
  {
    name: 'getJointNames',
    signature: 'getJointNames(root: Object3D)',
    returns: 'string[]',
    category: 'utility',
    description: 'All node names beginning with `Joint_`. Use to sanity-check animation targets.',
    example: "const joints = getJointNames(root);",
  },
  {
    name: 'validateAsset',
    signature: "validateAsset(root: Object3D, category: 'character' | 'prop' | 'vfx' | 'environment')",
    returns: '{ valid, errors, warnings }',
    category: 'utility',
    description: 'Warns on category-appropriate triangle / material budgets.',
    example: "const v = validateAsset(root, 'prop');",
  },
];

/**
 * Return the full catalog of primitives available in the Kiln sandbox.
 *
 * Cheap: returns a pre-built static array (a new clone, so callers can
 * mutate freely without corrupting internal state).
 */
export function listPrimitives(): PrimitiveSpec[] {
  return PRIMITIVES.map((p) => ({ ...p }));
}

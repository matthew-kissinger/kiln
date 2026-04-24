/**
 * Kiln Primitive Catalog (W3b.2)
 *
 * Self-describing inventory of every helper function the Kiln sandbox
 * exposes to generated code. Agents call `kiln.listPrimitives()` to
 * discover the surface without reading `primitives.ts` directly.
 *
 * The list is hand-authored rather than JSDoc-parsed — the catalog is
 * small and hand-authoring gives cleaner `signature` /
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
  category:
    | 'geometry'
    | 'material'
    | 'structure'
    | 'animation'
    | 'utility'
    | 'instancing'
    | 'csg'
    | 'arrays'
    | 'mesh-ops'
    | 'curves'
    | 'uv'
    | 'textures';
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
  {
    name: 'beamBetween',
    signature:
      'beamBetween(name, start: [x,y,z], end: [x,y,z], radius, material, opts?: { segments, parent })',
    returns: 'THREE.Object3D (prefixed `Mesh_`)',
    category: 'structure',
    description:
      'Creates a cylindrical rail/strut exactly between two endpoints. Use for braces, gun barrels, skid struts, cables, and scaffolding.',
    example:
      "beamBetween('SkidBraceA', [0.8, 0.3, 0.7], [0.8, 1.0, 0.45], 0.025, black, { parent: root });",
  },
  {
    name: 'createLadder',
    signature:
      "createLadder(name, { bottom, top, material, width?, rungCount?, railRadius?, rungRadius?, widthAxis?, parent? })",
    returns: '{ leftRail: Object3D, rightRail: Object3D, rungs: Object3D[] }',
    category: 'structure',
    description:
      'Builds two continuous rails plus evenly-spaced rungs. Use this instead of loose boxes for ladders.',
    example:
      "createLadder('TowerLadder', { bottom: [0,0,0], top: [0,2.2,0], width: 0.45, rungCount: 7, material: steel, parent: root });",
  },
  {
    name: 'createWingPair',
    signature:
      'createWingPair(name, material, { rootZ, span, rootChord, tipChord, sweep?, thickness?, dihedral?, rootX?, rootY?, parent? })',
    returns: '{ right: Object3D, left: Object3D }',
    category: 'structure',
    description:
      'Creates mirrored trapezoid aircraft wings with roots attached at +/-rootZ. Use for aircraft wings and helicopter stub wings.',
    example:
      "createWingPair('MainWing', olive, { rootX: 0, rootY: 1.0, rootZ: 0.42, span: 2.4, rootChord: 0.9, tipChord: 0.35, sweep: 0.25, dihedral: 0.08, parent: root });",
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
    name: 'cylinderYGeo',
    signature:
      'cylinderYGeo(radiusTop: number, radiusBottom: number, height: number, segments?: 8)',
    returns: 'THREE.CylinderGeometry',
    category: 'geometry',
    description:
      'Alias for cylinderGeo — a Y-axis cylinder. Provided because the sandbox exposes cylinderXGeo / cylinderZGeo and the symmetric Y form is commonly reached for.',
    example: 'const geo = cylinderYGeo(0.25, 0.25, 1, 12);',
  },
  {
    name: 'cylinderXGeo',
    signature:
      'cylinderXGeo(radiusTop: number, radiusBottom: number, length: number, segments?: 8)',
    returns: 'THREE.CylinderGeometry',
    category: 'geometry',
    description:
      'Cylinder pre-rotated to run along +X/-X. Use for fuselages, cannons, barrels, axles, and forward-facing tubes.',
    example: 'const geo = cylinderXGeo(0.1, 0.1, 1.2, 12);',
  },
  {
    name: 'cylinderZGeo',
    signature:
      'cylinderZGeo(radiusTop: number, radiusBottom: number, length: number, segments?: 8)',
    returns: 'THREE.CylinderGeometry',
    category: 'geometry',
    description:
      'Cylinder pre-rotated to run along +Z/-Z. Use for side-mounted weapons, rails, crossbars, and pipes.',
    example: 'const geo = cylinderZGeo(0.08, 0.08, 0.9, 10);',
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
    name: 'capsuleYGeo',
    signature: 'capsuleYGeo(radius: number, height: number, segments?: 6)',
    returns: 'THREE.CapsuleGeometry',
    category: 'geometry',
    description: 'Alias for capsuleGeo — a Y-axis capsule. Provided for symmetry with capsuleXGeo / capsuleZGeo.',
    example: 'const geo = capsuleYGeo(0.1, 0.5, 6);',
  },
  {
    name: 'capsuleXGeo',
    signature: 'capsuleXGeo(radius: number, length: number, segments?: 6)',
    returns: 'THREE.CapsuleGeometry',
    category: 'geometry',
    description:
      'Capsule pre-rotated to run along +X/-X. Use for aircraft bodies, rounded vehicle hulls, and missiles.',
    example: 'const geo = capsuleXGeo(0.35, 2.4, 10);',
  },
  {
    name: 'capsuleZGeo',
    signature: 'capsuleZGeo(radius: number, length: number, segments?: 6)',
    returns: 'THREE.CapsuleGeometry',
    category: 'geometry',
    description:
      'Capsule pre-rotated to run along +Z/-Z. Use for lateral pods, floats, and side tanks.',
    example: 'const geo = capsuleZGeo(0.18, 1.1, 8);',
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
    name: 'coneYGeo',
    signature: 'coneYGeo(radius: number, height: number, segments?: 8)',
    returns: 'THREE.ConeGeometry',
    category: 'geometry',
    description: 'Alias for coneGeo — a Y-axis cone (point +Y). Provided for symmetry with coneXGeo / coneZGeo.',
    example: 'const geo = coneYGeo(0.3, 0.8, 8);',
  },
  {
    name: 'coneXGeo',
    signature: 'coneXGeo(radius: number, length: number, segments?: 8)',
    returns: 'THREE.ConeGeometry',
    category: 'geometry',
    description:
      'Cone pre-rotated so its point faces +X. Use for noses, rockets, shells, and forward-facing tips.',
    example: 'const geo = coneXGeo(0.18, 0.45, 12);',
  },
  {
    name: 'coneZGeo',
    signature: 'coneZGeo(radius: number, length: number, segments?: 8)',
    returns: 'THREE.ConeGeometry',
    category: 'geometry',
    description:
      'Cone pre-rotated so its point faces +Z. Use for side-facing projectiles and tips.',
    example: 'const geo = coneZGeo(0.12, 0.35, 10);',
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
    description:
      'Flat quad for TEXTURED surfaces (ground, signs, walls with albedo maps). For solid-color decals like red stars, hull numbers, stamps, or window cutouts on no-texture assets use decalBox — a bare planeGeo without a texture will render as a disconnected 2-tri square and get flagged as a stray plane.',
    example: 'const geo = planeGeo(4, 4);',
  },
  {
    name: 'decalBox',
    signature: 'decalBox(width: number, height: number, depth?: 0.01)',
    returns: 'THREE.BoxGeometry',
    category: 'geometry',
    description:
      'Thin box for solid-color surface decals: red stars, hull numbers, stamps, no-texture windows. Unlike planeGeo, has real depth so it visibly attaches to its host surface. Must be placed on a surface with position + rotation.',
    example:
      "const star = decalBox(0.18, 0.18, 0.01);\ncreatePart('Mesh_StarPort', star, gameMaterial(0xc61f2a), { position: [0.4, 0.6, 0.41], parent: fuselage });",
  },
  {
    name: 'wingGeo',
    signature:
      'wingGeo(opts?: { span, rootChord, tipChord, sweep, thickness, dihedral })',
    returns: 'THREE.BufferGeometry',
    category: 'geometry',
    description:
      'Trapezoid wing panel. Local root edge is at Z=0, span extends toward +Z, positive sweep moves the tip aft along -X.',
    example:
      'const geo = wingGeo({ span: 2.2, rootChord: 0.8, tipChord: 0.3, sweep: 0.25, dihedral: 0.08 });',
  },
  {
    name: 'gearGeo',
    signature:
      'gearGeo(opts?: { teeth?: 12, rootRadius?: 0.8, tipRadius?: 1.0, boreRadius?: 0.2, height?: 0.3, toothWidthFrac?: 0.5 })',
    returns: 'THREE.BufferGeometry',
    category: 'geometry',
    description:
      'Parametric gear: disc with N additive teeth around the rim and a center bore. Flat-shaded hard edges. Built directly (no CSG), so cheap.',
    example:
      "const g = gearGeo({ teeth: 16, tipRadius: 1.0, boreRadius: 0.15, height: 0.25 });\ncreatePart('Gear', g, gameMaterial(0x909090, { metalness: 0.8 }), { parent: root });",
  },
  {
    name: 'bladeGeo',
    signature:
      'bladeGeo(opts?: { length?: 1.5, baseWidth?: 0.1, thickness?: 0.015, tipLength?: 0.25, edgeBevel?: 0 })',
    returns: 'THREE.BufferGeometry',
    category: 'geometry',
    description:
      'Parametric sword blade: rectangular base tapering to a point over tipLength. edgeBevel > 0 pinches the cross-section toward a diamond ridge.',
    example:
      "const b = bladeGeo({ length: 1.6, baseWidth: 0.09, tipLength: 0.3, edgeBevel: 0.5 });\ncreatePart('Blade', b, steel, { position: [0, 0, 0], parent: root });",
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
  // Instancing (Wave 1B) — reuse geometry + material across many parts
  // ---------------------------------------------------------------------------
  {
    name: 'cloneGeometry',
    signature: 'cloneGeometry(geo: BufferGeometry)',
    returns: 'THREE.BufferGeometry (same ref)',
    category: 'instancing',
    description:
      'Returns the same geometry reference. Use it as a signal that you are intentionally sharing geometry across multiple parts; gltf-transform dedupes on export.',
    example: 'const wheelGeo = cylinderGeo(0.4, 0.4, 0.2, 12);',
  },
  {
    name: 'cloneMaterial',
    signature: 'cloneMaterial(mat: Material)',
    returns: 'THREE.Material (same ref)',
    category: 'instancing',
    description: 'Shared material reference. See cloneGeometry.',
    example: 'const rubberMat = gameMaterial(0x1a1a1a, { roughness: 0.95 });',
  },
  {
    name: 'createInstance',
    signature:
      'createInstance(name, source, opts?: { position, rotation, scale, parent })',
    returns: 'THREE.Object3D',
    category: 'instancing',
    description:
      'Creates a new mesh reusing an existing part\'s geometry + material at a new transform. Cheapest way to replicate wheels / bolts / fence posts / windows.',
    example:
      "const wheelFL = createPart('WheelFL', wheelGeo, rubberMat, { position: [-0.8, 0.3, 1.2], parent: root });\ncreateInstance('WheelFR', wheelFL, { position: [0.8, 0.3, 1.2], parent: root });\ncreateInstance('WheelRL', wheelFL, { position: [-0.8, 0.3, -1.2], parent: root });\ncreateInstance('WheelRR', wheelFL, { position: [0.8, 0.3, -1.2], parent: root });",
  },

  // ---------------------------------------------------------------------------
  // CSG / Boolean ops (Wave 2A) — async, backed by manifold-3d
  // ---------------------------------------------------------------------------
  // IMPORTANT: build() must be `async` and the call must use `await` because
  // these ops are WASM-backed. The executor awaits build() transparently.
  {
    name: 'boolUnion',
    signature: 'await boolUnion(name: string, ...parts: Object3D[], opts?: { smooth?: false })',
    returns: 'Promise<THREE.Mesh>',
    category: 'csg',
    description:
      'Merges two or more parts into one watertight manifold mesh. Default flat shading (hard edges) — pass { smooth: true } as last arg for averaged normals on organic merges.',
    example:
      "const body = new THREE.Mesh(boxGeo(2, 1, 1), steel);\nconst turret = new THREE.Mesh(cylinderGeo(0.3, 0.3, 0.4, 16), steel);\nturret.position.y = 0.5;\nconst hull = await boolUnion('Hull', body, turret);",
  },
  {
    name: 'boolDiff',
    signature: 'await boolDiff(name: string, body: Object3D, ...cutters: Object3D[], opts?: { smooth?: false })',
    returns: 'Promise<THREE.Mesh>',
    category: 'csg',
    description:
      'Subtracts cutters from a body (holes, button recesses, window slots). Default flat shading for sharp mechanical edges.',
    example:
      "const body = new THREE.Mesh(cylinderGeo(1, 1, 0.3, 32), steel);\nconst teeth = [...]; // 8 radially-arrayed box meshes\nconst gear = await boolDiff('Gear', body, ...teeth);  // hard-edged",
  },
  {
    name: 'boolIntersect',
    signature: 'await boolIntersect(name: string, a: Object3D, b: Object3D, opts?: { smooth?: false })',
    returns: 'Promise<THREE.Mesh>',
    category: 'csg',
    description:
      'Keeps only the volume where both operands overlap. Default flat shading.',
    example:
      "const lens = await boolIntersect('Lens', boxMesh, sphereMesh);",
  },
  {
    name: 'hull',
    signature: 'await hull(name: string, ...parts: Object3D[], opts?: { smooth?: true })',
    returns: 'Promise<THREE.Mesh>',
    category: 'csg',
    description:
      'Tightest convex mesh enclosing all input points. Default smooth shading (rocks, collision volumes). Pass { smooth: false } for a faceted look.',
    example:
      "const rockChunks = [...]; // scattered box meshes\nconst rock = await hull('Rock', ...rockChunks);",
  },

  // ---------------------------------------------------------------------------
  // Arrays / mirror (Wave 2B) — replicate a source part with shared geo/mat
  // ---------------------------------------------------------------------------
  {
    name: 'arrayLinear',
    signature:
      'arrayLinear(namePrefix, source, count, offset: [x,y,z], parent?)',
    returns: 'THREE.Object3D[]',
    category: 'arrays',
    description:
      'Places N copies of `source` along a constant offset vector. Copies share geometry + material via createInstance.',
    example:
      "const post = createPart('Post0', cylinderGeo(0.05,0.05,1.5,6), wood, { position: [0,0.75,0], parent: root });\narrayLinear('Post', post, 10, [0.5, 0, 0], root);",
  },
  {
    name: 'arrayRadial',
    signature:
      "arrayRadial(namePrefix, source, count, axis?: 'x'|'y'|'z', parent?)",
    returns: 'THREE.Object3D[]',
    category: 'arrays',
    description:
      "Places N copies of `source` around the given axis. Source's local rotation is oriented outward. Perfect for gear teeth, radial bolts, circle of columns.",
    example:
      "const bolt = createPart('Bolt0', cylinderGeo(0.02,0.02,0.1,6), steel, { position: [1,0,0], parent: root });\narrayRadial('Bolt', bolt, 8, 'y', root);",
  },
  {
    name: 'mirror',
    signature: "mirror(name, source, axis: 'x'|'y'|'z', parent?)",
    returns: 'THREE.Object3D',
    category: 'arrays',
    description:
      "Reflects source across the plane whose normal is `axis`. Uses negative scale (winding flip handled by viewers).",
    example: "mirror('WingR', wingL, 'x', root);",
  },

  // ---------------------------------------------------------------------------
  // Mesh ops (Wave 2B)
  // ---------------------------------------------------------------------------
  {
    name: 'subdivide',
    signature:
      'subdivide(geometry: BufferGeometry, iterations?: 1, opts?: { split, uvSmooth, preserveEdges, flatOnly, weld })',
    returns: 'THREE.BufferGeometry',
    category: 'mesh-ops',
    description:
      'Loop subdivision. Each iteration ~4x the triangle count and smooths the surface. Non-indexed input is auto-welded via mergeVertices (weld: false to skip). Use 1 for mild smoothing, 2 for organic shapes.',
    example: "const smoothRock = subdivide(boxGeo(1, 1, 1), 2);",
  },
  {
    name: 'mergeVertices',
    signature: 'mergeVertices(geometry: BufferGeometry, tolerance?: 1e-4)',
    returns: 'THREE.BufferGeometry',
    category: 'mesh-ops',
    description:
      "Welds coincident vertices into shared, indexed ones. Three's primitives emit disconnected per-face strips — call this before subdividing, deforming, or smooth-shading so shared corners move once.",
    example:
      "// Weld before random deformation so corners drift together:\nconst base = mergeVertices(boxGeo(1, 1, 1));\nconst pos = base.getAttribute('position');\nfor (let i = 0; i < pos.count; i++) pos.setXYZ(i, pos.getX(i) + jitter(), pos.getY(i) + jitter(), pos.getZ(i) + jitter());\nconst rock = subdivide(base, 2);",
  },

  // ---------------------------------------------------------------------------
  // Curves (Wave 2B)
  // ---------------------------------------------------------------------------
  {
    name: 'curveToMesh',
    signature:
      'curveToMesh(points: [x,y,z][], radius, tubularSegs?: 32, radialSegs?: 8, closed?: false)',
    returns: 'THREE.BufferGeometry',
    category: 'curves',
    description:
      "Sweeps a circular profile along a path. Equivalent to Blender's Curve to Mesh node with a circle profile. Use for pipes, cables, tubular frames.",
    example:
      "const pipe = curveToMesh([[0,0,0],[0,1,0],[1,1,0],[1,2,0]], 0.1);",
  },
  {
    name: 'lathe',
    signature: 'lathe(profile: [x,y][], segments?: 12)',
    returns: 'THREE.BufferGeometry',
    category: 'curves',
    description:
      'Surface of revolution. Spins a 2D profile around the Y axis. For bottles, vases, wheels, turned wood parts.',
    example:
      "const vase = lathe([[0.1,0],[0.3,0.5],[0.2,1],[0.1,1.2]], 16);",
  },
  {
    name: 'bezierCurve',
    signature: 'bezierCurve(controlPoints: [x,y,z][], samples?: 32)',
    returns: '[x,y,z][]',
    category: 'curves',
    description:
      "Samples a quadratic (3 ctrl pts) or cubic (4 ctrl pts) Bézier into a point list you can feed into curveToMesh.",
    example:
      "const path = bezierCurve([[0,0,0],[1,2,0],[3,2,0],[4,0,0]], 24);\nconst geo = curveToMesh(path, 0.1);",
  },

  // ---------------------------------------------------------------------------
  // UV (Wave 3A) — async, WASM-backed via xatlasjs
  // ---------------------------------------------------------------------------
  {
    name: 'autoUnwrap',
    signature:
      'await autoUnwrap(geometry: BufferGeometry, opts?: { resolution?: 1024, padding?: 2, useNormals?: false })',
    returns: 'Promise<THREE.BufferGeometry>',
    category: 'uv',
    description:
      "xatlas-based UV atlas for ANY geometry (CSG output, subdivided, deformed). Output is a packed atlas with arbitrary per-chart rotation — use for non-tileable baked textures. For directional tileable textures on box/cylinder/plane primitives, prefer the shape-aware unwraps below.",
    example:
      "const unwrapped = await autoUnwrap(someCsgResult, { resolution: 1024 });\nconst mesh = new THREE.Mesh(unwrapped, bakedPbr);",
  },
  {
    name: 'boxUnwrap',
    signature: 'boxUnwrap(geometry: BufferGeometry)',
    returns: 'THREE.BufferGeometry',
    category: 'uv',
    description:
      "Preserves BoxGeometry's built-in per-face UVs — every face maps [0,1] with consistent orientation. Use for crates/blocks with a tileable texture. Sync; no WASM cost.",
    example:
      "const crate = boxUnwrap(boxGeo(1, 1, 1));\nconst mesh = new THREE.Mesh(crate, pbrMaterial({ albedo: planksTex }));",
  },
  {
    name: 'cylinderUnwrap',
    signature: 'cylinderUnwrap(geometry: BufferGeometry)',
    returns: 'THREE.BufferGeometry',
    category: 'uv',
    description:
      "Preserves CylinderGeometry's built-in UVs: u wraps around the axis (horizontal texture features ring the cylinder), v runs up the height. Caps use circle-in-square. Sync; no WASM cost.",
    example:
      "const barrel = cylinderUnwrap(cylinderGeo(0.5, 0.5, 1.2, 24));\nconst mesh = new THREE.Mesh(barrel, pbrMaterial({ albedo: bandsTex }));",
  },
  {
    name: 'planeUnwrap',
    signature: 'planeUnwrap(geometry: BufferGeometry)',
    returns: 'THREE.BufferGeometry',
    category: 'uv',
    description:
      "Projects xy-extent of the bbox to [0,1]. Use for signs/decals/posters where you want ONE readable texture and no edge-face bleeding. Sync.",
    example:
      "const sign = planeUnwrap(planeGeo(1, 0.6));\nconst mesh = new THREE.Mesh(sign, pbrMaterial({ albedo: kilnTextTex }));",
  },

  // ---------------------------------------------------------------------------
  // Textures + PBR (Wave 3B)
  // ---------------------------------------------------------------------------
  {
    name: 'loadTexture',
    signature: 'await loadTexture(source: string | Buffer | Uint8Array)',
    returns: 'Promise<THREE.DataTexture>',
    category: 'textures',
    description:
      'Loads a PNG/JPG/WebP image into a Three.js Texture. Stashes the encoded bytes on userData.encoded so GLB export is lossless.',
    example:
      "const wood = await loadTexture('./textures/oak-albedo.png');",
  },
  {
    name: 'pbrMaterial',
    signature:
      'pbrMaterial({ albedo?, normal?, roughness?, metalness?, emissive?, aoMap? })',
    returns: 'THREE.MeshStandardMaterial',
    category: 'material',
    description:
      'Full PBR material. Each slot can be a hex color/scalar or a Texture loaded via loadTexture. Exports as glTF pbrMetallicRoughness.',
    example:
      "const wood = await loadTexture('./oak.png');\nconst crate = pbrMaterial({ albedo: wood, roughness: 0.85, metalness: 0 });",
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

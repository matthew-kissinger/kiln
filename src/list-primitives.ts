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
  /**
   * Extra imperative guidance surfaced verbatim in model-facing renderings of
   * the catalog (system prompt API section, skill reference). Use for footguns
   * the description alone does not make actionable.
   */
  promptNotes?: string;
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

// T2.4 — the CSG/UV rule (every boolean destroys UVs; unwrap after, never
// before) applies to all four boolean entries, so it lives once as the `csg`
// entry in CATEGORY_NOTES in prompt-api.ts rather than four times here.

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
    name: 'createJointChain',
    signature:
      'createJointChain(name, segments: { role, offset, aliases?, side?, localForwardAxis?, localBendAxis?, endEffector?, contact? }[], opts?: { parent?, parentRole? })',
    returns: '{ root, end, nodes, byRole, descriptors }',
    category: 'structure',
    description:
      'Creates one body-plan-neutral deterministic Joint_* chain with explicit parent edges, rest frames, local axes, end effectors, contacts, and semantic metadata.',
    example:
      "const leg = createJointChain('LegL', [{ role: 'hip.left', offset: [0, 1, -0.2], side: 'left' }, { role: 'knee.left', offset: [0, -0.5, 0], side: 'left' }, { role: 'ankle.left', offset: [0, -0.5, 0], side: 'left', endEffector: true, contact: true }], { parent: root });",
    promptNotes:
      'Use only the resolved body-plan graph. Offsets are local to the previous joint; contact end effectors must land at world Y=0.',
  },
  {
    name: 'createVehicleFrame',
    signature:
      'createVehicleFrame(name, opts?: { chassis?, axles?, seats?, contacts?, steering?, propulsion?, parent? })',
    returns: '{ root, chassis, axles, seats, contacts, steering, propulsion }',
    category: 'structure',
    description:
      'Creates a canonical +X-forward/+Y-up/+Z-right vehicle frame with typed semantic sockets for chassis, support, steering, and propulsion.',
    example:
      "const frame = createVehicleFrame('CarFrame', { axles: [{ id: 'front', position: [1.2, 0.45, 0] }, { id: 'rear', position: [-1.2, 0.45, 0] }], parent: root });",
    promptNotes:
      'Generated vehicles keep +X as front. Boats and other non-wheeled subtypes use declared support/propulsion sockets, not wheel rules.',
  },
  {
    name: 'createWheelGeometrySet',
    signature: 'createWheelGeometrySet(radius: number, width: number)',
    returns: '{ tire, rim, hub } shared THREE.BufferGeometry set',
    category: 'instancing',
    description:
      'Creates one reusable +Z-axle tire/rim/hub geometry set for instanced wheel assemblies.',
    example: 'const wheelGeo = createWheelGeometrySet(0.45, 0.22);',
  },
  {
    name: 'createWheelAssembly',
    signature:
      'createWheelAssembly(name, { tire, rim, hub? }, { radius, width, side, index, position?, rimRadius?, hubRadius?, steering?, loadBearing?, geometries?, parent? })',
    returns:
      '{ root, steeringPivot?, spinPivot, tire, rim, hub, contact, radius, width, side, index, spinAxis }',
    category: 'structure',
    description:
      'Creates one axle-centered wheel pivot containing concentric tire/rim/hub roles, a contact marker, +Z spin frame, and optional steering pivot.',
    example:
      "createWheelAssembly('FrontLeft', { tire: rubber, rim: metal }, { radius: 0.45, width: 0.22, side: 'left', index: 'front', position: [1.2, 0.45, -0.9], steering: true, geometries: wheelGeo, parent: frame.root });",
    promptNotes:
      'Keep tire, rim, and hub descendants concentric at the axle pivot. Reuse one geometry set across matching wheels.',
  },
  {
    name: 'createPart',
    signature:
      'createPart(name, geometry, material, opts?: { position, rotation: [xDeg, yDeg, zDeg], scale, pivot, parent })',
    returns: 'THREE.Object3D (mesh or wrapping pivot)',
    category: 'structure',
    description:
      'Creates a mesh, optionally wrapped in a pivot, and attaches it to `opts.parent`. `rotation` is in DEGREES (like rotationTrack), NOT radians: [0, 0, 90] is a quarter turn; [0, 0, 1.57] is a no-op.',
    example:
      "createPart('Barrel', cylinderGeo(0.1, 0.1, 1), gameMaterial(0x556b2f), { position: [0, 0.5, 0], rotation: [0, 0, 90], parent: root });",
    promptNotes:
      'AUTO-ADDS to opts.parent. NEVER call parent.add(createPart(...)) — pass { parent } instead. rotation is DEGREES — writing radians (e.g. 0.785 or Math.PI/4) silently produces ~zero rotation.',
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
    name: 'snapTo',
    signature:
      "snapTo(part: Object3D, host: Object3D, opts?: { axis?: 'x'|'y'|'z', overlap?: 0.02 })",
    returns: 'THREE.Object3D (the part, for chaining)',
    category: 'structure',
    description:
      'Translates `part` by the minimal vector that brings its bounding box into contact with `host` (plus a small overlap). The direct cure for a "Floating parts" warning — attach the part instead of eyeballing a corrective offset. No-op if they already touch.',
    example:
      "const scope = createPart('Scope', cylinderXGeo(0.04, 0.04, 0.3), steel, { parent: root, position: [0.1, 0.32, 0] });\nsnapTo(scope, receiver);",
  },
  {
    name: 'createLadder',
    signature:
      'createLadder(name, { bottom, top, material, width?, rungCount?, railRadius?, rungRadius?, widthAxis?, parent? })',
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
  {
    name: 'room',
    signature:
      "room(name, material, { width?, depth?, height?, wallThickness?, floor?, floorThickness?, openings?: [{ wall: 'front'|'back'|'left'|'right', kind?: 'door'|'window', offset?, width?, height?, sill? }], parent? })",
    returns: '{ root: Object3D, walls: { front, back, left, right }, floor: Object3D | null }',
    category: 'structure',
    description:
      'Builds a HOLLOW, enterable room: four thin walls + a floor, human-scaled (defaults: 2.8m ceiling, a centered 1.1x2.1m front door so it is enterable by default). `front` faces +X; the floor sits on the ground. The keystone of an architecture asset — add a roof with createRoofPlanes and fixtures as separate parts.',
    example:
      "const { root: hut } = room('Hut', wood, { width: 5, depth: 4, height: 2.8, openings: [{ wall: 'front', kind: 'door' }, { wall: 'right', kind: 'window' }], parent: root });",
    promptNotes:
      'Use for any building the player enters. Do NOT model a building as a solid block — room() guarantees real interior space and a doorway gap. Pass openings to add windows / side doors.',
  },
  {
    name: 'wallWithOpening',
    signature:
      "wallWithOpening(name, material, { length, height, thickness, axis?: 'x'|'z', opening?: { kind?: 'door'|'window', offset?, width?, height?, sill? }, parent? })",
    returns: 'THREE.Object3D (wall container)',
    category: 'structure',
    description:
      'A single wall panel with an optional real door/window cut, composed from solid box segments (side panels + lintel + window sill) — no CSG. Base at local Y=0, centered on the run axis. Use to compose custom building layouts or interior dividing walls beyond the default room().',
    example:
      "wallWithOpening('Partition', plaster, { length: 4, height: 2.8, thickness: 0.12, axis: 'x', opening: { kind: 'door', offset: 0.5 }, parent: root });",
  },
  {
    name: 'createRoofPlanes',
    signature:
      "createRoofPlanes(name, material, { width, depth, height, overhang?, ridgeAxis?: 'x'|'z', thickness?, parent? })",
    returns: '{ root: Object3D, slopes: [Object3D, Object3D] }',
    category: 'structure',
    description:
      'A pitched roof: two thin slopes meeting at one ridge and falling DOWN-AND-OUTWARD (opposite tilts — never mirrored the same way), footprint-matched with an eave overhang. Eave at local Y=0, ridge at Y=height, so position the group at Y=wallHeight. Returns a named group (e.g. `Roof`) the engine can lift to reveal the interior.',
    example:
      "const { root: roof } = createRoofPlanes('Roof', shingle, { width: 5, depth: 4, height: 1.6, overhang: 0.4, ridgeAxis: 'x', parent: root });\nroof.position.y = 2.8;",
    promptNotes:
      'The two slopes must fall AWAY from each other from the ridge — createRoofPlanes does this for you. Drop it onto the walls (position.y = wall height).',
  },
  {
    name: 'createGableRoof',
    signature:
      "createGableRoof(name, material, { spanX, spanZ, rise?, pitchDegrees?, overhang?, ridgeAxis?: 'x'|'z', thickness?, parent? })",
    returns:
      '{ root, slopes: [Object3D, Object3D], faces: [RoofFaceFrame, RoofFaceFrame], rise, pitchDegrees }',
    category: 'structure',
    description:
      'Explicit-axis gable roof using unambiguous footprint spans. Each face owns a rigid frame with ridge tangent, outward normal, downhill direction, ridge/eave endpoints, dimensions, and a live local-to-world transform.',
    example:
      "const roof = createGableRoof('Roof', shingles, { spanX: 8, spanZ: 5, pitchDegrees: 35, overhang: 0.35, ridgeAxis: 'x', parent: root });",
    promptNotes:
      'Prefer this over width/depth roof math. ridgeAxis is the direction of the ridge; roof panels run along each returned face downhill direction.',
  },
  {
    name: 'createGableEndPanel',
    signature:
      "createGableEndPanel(name, material, { span, rise, thickness?, ridgeAxis?: 'x'|'z', side?: 'positive'|'negative', openings?: [{ id?, offset?, bottom?, width, height }], parent? })",
    returns: '{ root, geometry, openings }',
    category: 'structure',
    description:
      'Exact thick triangular end closure for a gable roof, with optional rectangular openings cut from the geometry and semantic boundary metadata.',
    example:
      "createGableEndPanel('FrontGable', siding, { span: 5, rise: 1.8, ridgeAxis: 'x', side: 'positive', parent: root });",
  },
  {
    name: 'createGableShell',
    signature:
      "createGableShell(name, { wall, roof, floor?, gable? }, { spanX, spanZ, wallHeight?, rise?, pitchDegrees?, overhang?, ridgeAxis?: 'x'|'z', thickness?, wallThickness?, floorThickness?, closedEnds?, enterable?, openings?, gableOpenings?, parent? })",
    returns: '{ root, walls, floor, roof, gables, openings }',
    category: 'structure',
    description:
      'Closed-by-default, correct-by-construction gable building: hollow room, floor, two opposing roof slopes, two complete gable ends, and a real front doorway when enterable.',
    example:
      "const house = createGableShell('House', { wall: plaster, roof: shingles }, { spanX: 8, spanZ: 5, wallHeight: 2.8, pitchDegrees: 35, ridgeAxis: 'x', parent: root });",
    promptNotes:
      'Use for complete gable buildings. It stamps wall, floor, slope, gable, opening, adjacency, coverage, and separability semantics for deterministic QA and roof-off views.',
  },
  {
    name: 'createRoofSurfaceLayout',
    signature:
      "createRoofSurfaceLayout(name, material, { face, kind: 'panels'|'shingles'|'seams'|'corrugations', parent?, panelWidth?, rowHeight?, spacing?, thickness? })",
    returns: '{ root, items: Object3D[] }',
    category: 'structure',
    description:
      'Places roof-local panels, shingles, seams, or corrugations from a returned RoofFaceFrame, so repeated elements run ridge-to-eave for either ridge axis without manual Euler rotations.',
    example:
      "for (const face of roof.faces) createRoofSurfaceLayout('Panels_' + face.side, metal, { face, kind: 'panels', parent: roof.root });",
    promptNotes:
      'Always pass the face object returned by createGableRoof/createGableShell. Never infer the panel rotation from world axes.',
  },
  {
    name: 'createStairs',
    signature:
      "createStairs(name, material, { steps?, totalRise, totalRun, width, axis?: 'x'|'z', treadThickness?, riser?, parent? })",
    returns: '{ root: Object3D, steps: Object3D[] }',
    category: 'structure',
    description:
      'A straight flight of stairs: box treads (with optional risers) climbing totalRise over totalRun from local origin toward +axis. Use for porch/entry steps or to connect storeys in a multi-storey building.',
    example:
      "createStairs('Porch', stone, { steps: 4, totalRise: 0.6, totalRun: 1.0, width: 1.4, axis: 'x', parent: root });",
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
    description: 'UV sphere. Default 8x6 segments = 84 tris. Bump segments for smoother curves.',
    example: 'const geo = sphereGeo(0.5, 12, 8);',
  },
  {
    name: 'cylinderGeo',
    signature: 'cylinderGeo(radiusTop: number, radiusBottom: number, height: number, segments?: 8)',
    returns: 'THREE.CylinderGeometry',
    category: 'geometry',
    description: 'Y-axis cylinder. Use radiusTop != radiusBottom for cones / tapered pieces.',
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
    name: 'cylinderOnAxis',
    signature:
      'cylinderOnAxis(center: [x,y,z], normal: [x,y,z], radiusBottom: number, height: number, opts?: { radiusTop?, segments? })',
    returns: 'THREE.CylinderGeometry',
    category: 'geometry',
    description:
      'Frame-first cylinder: position + axis specified directly, no post-hoc rotation. Use when the cylinder needs to point along a non-cardinal direction (struts inside CSG operands, antennas off a tilted surface). For cardinal axes prefer the terser cylinderXGeo / cylinderYGeo / cylinderZGeo helpers.',
    example: 'const strut = cylinderOnAxis([0.5, 0.7, 0], [1, 1, 0.3], 0.05, 0.9);',
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
    description:
      'Alias for capsuleGeo — a Y-axis capsule. Provided for symmetry with capsuleXGeo / capsuleZGeo.',
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
    description:
      'Alias for coneGeo — a Y-axis cone (point +Y). Provided for symmetry with coneXGeo / coneZGeo.',
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
    name: 'taperConeGeo',
    signature:
      "taperConeGeo(radiusBottom: number, radiusTop: number, height: number, axis?: 'x'|'y'|'z', segments?: 8)",
    returns: 'THREE.CylinderGeometry',
    category: 'geometry',
    description:
      'Truncated cone (frustum) — exposes both bottom and top radius. radiusTop=0 matches coneGeo, radiusTop=radiusBottom matches cylinderGeo. Use for pylon caps, soda cans, lampshades, anything tapered that does not come to a point. axis selects orientation (default Y).',
    example: 'const cap = taperConeGeo(0.3, 0.18, 0.4);  // frustum',
  },
  {
    name: 'torusGeo',
    signature: 'torusGeo(radius: number, tube: number, radialSegments?: 8, tubularSegments?: 12)',
    returns: 'THREE.TorusGeometry',
    category: 'geometry',
    description: 'Donut shape. For rings, tyres, barrel ribs.',
    example: 'const geo = torusGeo(0.4, 0.04, 8, 16);',
  },
  {
    name: 'planeGeo',
    signature: 'planeGeo(width: number, height: number, widthSegments?: 1, heightSegments?: 1)',
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
    promptNotes:
      'Offset at least 0.01 outside the host surface to avoid z-fighting (a 0.8-wide hull has faces at z=±0.4, so place the decal at z=±0.41).',
  },
  {
    name: 'foliageCardGeo',
    signature: 'foliageCardGeo(opts?: { width?, height?, yPivot?: 0..1 })',
    returns: 'THREE.PlaneGeometry',
    category: 'geometry',
    description:
      'Single-quad foliage card with a configurable Y pivot. yPivot=0 plants the quad on the ground. Pair with an alpha-tested material and a leaf/plant sprite.',
    example:
      "const leaves = await materialRecipe('kiln.material.leaf.v1');\nconst quad = foliageCardGeo({ width: 4, height: 6, yPivot: 0 });\ncreatePart('Mesh_Fern', quad, leaves, { parent: root });",
  },
  {
    name: 'crossedQuadsGeo',
    signature: 'crossedQuadsGeo(opts?: { width?, height?, planes?: 2 | 3, yPivot? })',
    returns: 'THREE.BufferGeometry',
    category: 'geometry',
    description:
      'Cross-billboard bush primitive: 2 or 3 planes intersecting along the Y axis. Reads as a dense plant from any angle, cheaper than real geometry.',
    example:
      "const leaves = await materialRecipe('kiln.material.leaf.v1');\nconst bush = crossedQuadsGeo({ width: 2, height: 2, planes: 3 });\ncreatePart('Mesh_Bush', bush, leaves, { parent: root });",
  },
  {
    name: 'octaGridPlane',
    signature: 'octaGridPlane({ tilesX, tilesY, width?, height?, yPivot? })',
    returns: 'THREE.PlaneGeometry',
    category: 'geometry',
    description:
      'Atlas-ready billboard quad. UVs are pre-scaled to cover one tile of a tilesX×tilesY atlas; the consumer shader adds per-instance tile offsets at draw time.',
    example: 'const card = octaGridPlane({ tilesX: 4, tilesY: 4, width: 6, height: 6 });',
  },
  {
    name: 'wingGeo',
    signature: 'wingGeo(opts?: { span, rootChord, tipChord, sweep, thickness, dihedral })',
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
    description: 'Flat-shaded PBR material. Default for game-ready low-poly. Use for 95% of parts.',
    example: 'const mat = gameMaterial(0x8b7355, { roughness: 0.9 });',
  },
  {
    name: 'materialRecipe',
    signature:
      'await materialRecipe(recipeId, overrides?: { baseColor?, roughness?, metalness?, opacity?, alphaCutoff?, doubleSided?, emissiveColor?, emissiveIntensity?, textureResources? })',
    returns: 'Promise<THREE.MeshStandardMaterial>',
    category: 'material',
    description:
      'Resolves a versioned portable bark/leaf/wood/stone/rubber/painted-metal/cloth/skin/glass/emissive recipe to standard glTF PBR.',
    example:
      "const bark = await materialRecipe('kiln.material.bark.v1', { baseColor: '#6b4328' });",
    promptNotes:
      'Use only listed kiln.material.*.v1 IDs and approved kiln.texture.* resource IDs. Leaf is MASK, glass is BLEND, and host file paths are forbidden.',
  },
  {
    name: 'compilePortableMaterialSpecV2',
    signature:
      "await compilePortableMaterialSpecV2({ schemaVersion: 2, model: 'pbrMetallicRoughness', name?, baseColor?, roughness?, metalness?, emissive?, emissiveIntensity?, alphaMode?, alphaCutoff?, doubleSided?, textures?: { baseColor?, normal?, metallicRoughness?, emissive?, occlusion? } })",
    returns: 'Promise<THREE.MeshStandardMaterial>',
    category: 'material',
    description:
      'Compiles the strict portable material contract. Texture refs are either typed procedural V2 specs or closed approved kiln.texture.* IDs; paths, URLs, raw textures, callbacks, and shader source are rejected.',
    example:
      "const steel = await compilePortableMaterialSpecV2({ schemaVersion: 2, model: 'pbrMetallicRoughness', roughness: 0.45, metalness: 0.85, textures: { metallicRoughness: { kind: 'procedural', spec: { schemaVersion: 2, usage: 'metallicRoughness', size: 64, layers: [{ op: 'solid', color: 0x0080cc }] } } } });",
    promptNotes:
      'Use metallicRoughness as one packed G=roughness/B=metalness map. Every procedural ref usage must match its slot; resource refs must be approved for that exact slot.',
  },
  {
    name: 'basicMaterial',
    signature: 'basicMaterial(color, opts?: { transparent, opacity })',
    returns: 'THREE.MeshBasicMaterial',
    category: 'material',
    description: 'Unlit flat material. For UI / effects where lighting is baked in.',
    example: 'const mat = basicMaterial(0xffffff, { transparent: true, opacity: 0.5 });',
  },
  {
    name: 'glassMaterial',
    signature: 'glassMaterial(color, opts?: { opacity, roughness, metalness })',
    returns: 'THREE.MeshStandardMaterial',
    category: 'material',
    description:
      'Semi-transparent double-sided material. Panels need ~0.05 offset to avoid z-fighting.',
    example: 'const mat = glassMaterial(0x66ccff, { opacity: 0.3 });',
  },
  {
    name: 'lambertMaterial',
    signature: 'lambertMaterial(color, opts?: { flatShading, emissive })',
    returns: 'THREE.MeshLambertMaterial',
    category: 'material',
    description: 'Cheaper than gameMaterial. No metalness/roughness. Use when PBR is overkill.',
    example: 'const mat = lambertMaterial(0x2a4d14, { flatShading: true });',
  },

  // ---------------------------------------------------------------------------
  // Animation — keyframe tracks
  // ---------------------------------------------------------------------------
  {
    name: 'rotationTrack',
    signature:
      "rotationTrack(jointName: string, keyframes: Array<{ time, rotation: [xDeg, yDeg, zDeg] }>, interp?: 'LINEAR' | 'STEP')",
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
      "positionTrack(jointName: string, keyframes: Array<{ time, position: [x, y, z] }>, interp?: 'LINEAR' | 'STEP')",
    returns: 'THREE.VectorKeyframeTrack',
    category: 'animation',
    description: 'Position track in world units. Always use `position:` not `value:` in keyframes.',
    example:
      "positionTrack('Joint_Body', [{ time: 0, position: [0, 0, 0] }, { time: 1, position: [0, 0.1, 0] }]);",
  },
  {
    name: 'scaleTrack',
    signature:
      "scaleTrack(jointName: string, keyframes: Array<{ time, scale: [x, y, z] }>, interp?: 'LINEAR' | 'STEP')",
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
      'createInstance(name, source, opts?: { position, rotation: [xDeg, yDeg, zDeg], scale, parent })',
    returns: 'THREE.Object3D',
    category: 'instancing',
    description:
      "Creates a new mesh reusing an existing part's geometry + material at a new transform. Cheapest way to replicate wheels / bolts / fence posts / windows. `rotation` is in DEGREES, like createPart.",
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
    signature:
      'await boolDiff(name: string, body: Object3D, ...cutters: Object3D[], opts?: { smooth?: false })',
    returns: 'Promise<THREE.Mesh>',
    category: 'csg',
    description:
      'Subtracts cutters from a body (holes, button recesses, window slots). Default flat shading for sharp mechanical edges.',
    example:
      "const body = new THREE.Mesh(cylinderGeo(1, 1, 0.3, 32), steel);\nconst teeth = [...]; // 8 radially-arrayed box meshes\nconst gear = await boolDiff('Gear', body, ...teeth);  // hard-edged",
  },
  {
    name: 'roundedBoxGeo',
    signature:
      "await roundedBoxGeo(width: number, height: number, depth: number, radius: number, opts?: { style?: 'round' | 'chamfer', segments?: 12, smooth?: boolean })",
    returns: 'Promise<THREE.BufferGeometry>',
    category: 'csg',
    description:
      'A box with all twelve edges rounded (or chamfered) at the EXACT outer size requested — roundedBoxGeo(1, 1, 1, 0.1) measures 1x1x1, it does not grow. Use it anywhere boxGeo reads too sharp: consoles, crates, appliances, handheld props, machined blocks.',
    promptNotes:
      "Real objects almost never have perfectly sharp box edges, and a small radius is the single cheapest upgrade to how manufactured an asset looks. Prefer this over boxGeo for anything moulded, cast, or machined. Keep radius small relative to the box (5-10% of the smallest dimension); radius must be less than half the smallest dimension or the call throws. style: 'chamfer' reads as machined metal, 'round' as moulded plastic. This is async — build() must be async and the call must use await.",
    example:
      "const geo = await roundedBoxGeo(1.2, 0.6, 0.8, 0.05);\ncreatePart('Console', geo, plastic, { position: [0, 0.3, 0], parent: root });",
  },
  {
    name: 'extrudeProfile',
    signature:
      "await extrudeProfile(profile: [number, number][], opts?: { depth?: 1, holes?: [number, number][][], bevel?: 0, bevelStyle?: 'round' | 'chamfer', segments?: 12, twist?: 0, taper?: number | [number, number], divisions?: number, axis?: 'x' | 'y' | 'z', center?: true, smooth?: false })",
    returns: 'Promise<THREE.BufferGeometry>',
    category: 'csg',
    description:
      'Sweeps a closed 2D outline into a watertight solid, with optional holes, corner rounding/chamfering, twist, and taper. The way to build any cross-section that is not a box or a cylinder: L-brackets, I-beams, gaskets, washers, star and gear plates, signage, extruded trim.',
    promptNotes:
      "The bevel rounds the edges PARALLEL to the sweep axis (the profile corners) — the two flat caps stay sharp. For a box rounded on all twelve edges use roundedBoxGeo instead. Holes are subtracted, so their winding order does not matter. A bevel larger than half the outline's narrowest feature throws rather than silently returning an empty solid. Output is manifold, so it feeds straight into boolUnion / boolDiff / boolIntersect. Async — await it inside an async build().",
    example:
      "// L-bracket, inner AND outer corners filleted\nconst outline = [[0, 0], [2, 0], [2, 0.4], [0.4, 0.4], [0.4, 2], [0, 2]];\nconst geo = await extrudeProfile(outline, { depth: 0.5, bevel: 0.06 });\ncreatePart('Bracket', geo, steel, { parent: root });",
  },
  {
    name: 'revolveProfile',
    signature:
      "await revolveProfile(profile: [number, number][], opts?: { segments?: 24, angle?: 360, bevel?: 0, bevelStyle?: 'round' | 'chamfer', bevelSegments?: 12, axis?: 'x' | 'y' | 'z', smooth?: true })",
    returns: 'Promise<THREE.BufferGeometry>',
    category: 'csg',
    description:
      'Revolves a closed 2D outline around an axis into a watertight SOLID, optionally rounding the profile corners first. Bottles, tanks, pressure vessels, wheels, turned wood, domes, buttons, pills.',
    promptNotes:
      'Use this instead of lathe/revolveGeo whenever the result must survive a boolean or needs a rounded rim — lathe and revolveGeo build an open surface, this builds a closed solid. Profile convention matches lathe: x is distance from the axis, y is position along it, and only the x >= 0 side is used. Async — await it inside an async build().',
    example:
      "// capsule tank with a rounded rim, then carve a port into it\nconst profile = [[0, -0.5], [0.4, -0.5], [0.4, 0.5], [0, 0.5]];\nconst body = await revolveProfile(profile, { bevel: 0.08, segments: 32 });\nconst tank = await boolDiff('Tank', createPart('B', body, steel), portCutter);",
  },
  {
    name: 'circleProfile',
    signature: 'circleProfile(radius: number, segments?: 24, center?: [number, number])',
    returns: '[number, number][]',
    category: 'csg',
    description:
      'Builds a closed circular outline for extrudeProfile / revolveProfile, so you never hand-write the trigonometry. Synchronous.',
    example:
      'const washer = await extrudeProfile(circleProfile(1), {\n  depth: 0.1,\n  holes: [circleProfile(0.4), circleProfile(0.1, 16, [0.7, 0])],\n});',
  },
  {
    name: 'boolIntersect',
    signature:
      'await boolIntersect(name: string, a: Object3D, b: Object3D, opts?: { smooth?: false })',
    returns: 'Promise<THREE.Mesh>',
    category: 'csg',
    description: 'Keeps only the volume where both operands overlap. Default flat shading.',
    example: "const lens = await boolIntersect('Lens', boxMesh, sphereMesh);",
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
    signature: 'arrayLinear(namePrefix, source, count, offset: [x,y,z], parent?)',
    returns: 'THREE.Object3D[]',
    category: 'arrays',
    description:
      'Places N copies of `source` along a constant offset vector. Copies share geometry + material via createInstance.',
    example:
      "const post = createPart('Post0', cylinderGeo(0.05,0.05,1.5,6), wood, { position: [0,0.75,0], parent: root });\narrayLinear('Post', post, 10, [0.5, 0, 0], root);",
  },
  {
    name: 'arrayRadial',
    signature: "arrayRadial(namePrefix, source, count, axis?: 'x'|'y'|'z', parent?)",
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
      'Reflects source across the plane whose normal is `axis`. Uses negative scale (winding flip handled by viewers).',
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
    example: 'const smoothRock = subdivide(boxGeo(1, 1, 1), 2);',
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
    example: 'const pipe = curveToMesh([[0,0,0],[0,1,0],[1,1,0],[1,2,0]], 0.1);',
  },
  {
    name: 'pipeAlongPath',
    signature:
      'pipeAlongPath(points: [x,y,z][], radius: number, opts?: { bendRadius?: 0, closed?: false, tubularSegments?: 32, radialSegments?: 8 })',
    returns: 'THREE.BufferGeometry',
    category: 'curves',
    description:
      'Path-driven swept circle with optional bend smoothing. Generalises beamBetween (point-to-point) and curveToMesh (raw spline) into one helper. bendRadius>0 inserts interpolated waypoints near interior corners so the spline reads as a rounded turn instead of pinching to the control point.',
    example:
      'const cable = pipeAlongPath([[0, 0.5, 0], [1, 0.5, 0], [1, 0.5, 2]], 0.02, { bendRadius: 0.1 });',
  },
  {
    name: 'lathe',
    signature: 'lathe(profile: [x,y][], segments?: 12)',
    returns: 'THREE.BufferGeometry',
    category: 'curves',
    description:
      'Surface of revolution. Spins a 2D profile around the Y axis. For bottles, vases, wheels, turned wood parts.',
    example: 'const vase = lathe([[0.1,0],[0.3,0.5],[0.2,1],[0.1,1.2]], 16);',
  },
  {
    name: 'revolveGeo',
    signature:
      'revolveGeo(profile: [x,y][], opts?: { angle?: 2π, axis?: [x,y,z]=[0,1,0], segments?: 12 })',
    returns: 'THREE.BufferGeometry',
    category: 'curves',
    description:
      'Surface of revolution with explicit axis + sweep angle. Generalises lathe — use it when you need a partial sweep (half-dome, 90° wedge) or revolution around a non-Y axis. Profile convention is identical to lathe: x = radial distance, y = position along the axis.',
    example:
      '// Half-dome (180° sweep around +Y):\nconst quarter = [...Array(8)].map((_, i) => { const t = (i/7)*Math.PI/2; return [Math.cos(t), Math.sin(t)] as [number, number]; });\nconst dome = revolveGeo(quarter, { angle: Math.PI });',
  },
  {
    name: 'bezierCurve',
    signature: 'bezierCurve(controlPoints: [x,y,z][], samples?: 32)',
    returns: '[x,y,z][]',
    category: 'curves',
    description:
      'Samples a quadratic (3 ctrl pts) or cubic (4 ctrl pts) Bézier into a point list you can feed into curveToMesh.',
    example:
      'const path = bezierCurve([[0,0,0],[1,2,0],[3,2,0],[4,0,0]], 24);\nconst geo = curveToMesh(path, 0.1);',
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
      'xatlas-based UV atlas for ANY geometry (CSG output, subdivided, deformed). Output is a packed atlas with arbitrary per-chart rotation — use for non-tileable baked textures. For directional tileable textures on box/cylinder/plane primitives, prefer the shape-aware unwraps below.',
    example:
      'const unwrapped = await autoUnwrap(someCsgResult, { resolution: 1024 });\nconst mesh = new THREE.Mesh(unwrapped, bakedPbr);',
  },
  {
    name: 'boxUnwrap',
    signature: 'boxUnwrap(geometry: BufferGeometry)',
    returns: 'THREE.BufferGeometry',
    category: 'uv',
    description:
      "Preserves BoxGeometry's built-in per-face UVs — every face maps [0,1] with consistent orientation. Use for crates/blocks with a tileable texture. Sync; no WASM cost.",
    example:
      'const crate = boxUnwrap(boxGeo(1, 1, 1));\nconst mesh = new THREE.Mesh(crate, pbrMaterial({ albedo: planksTex }));',
  },
  {
    name: 'cylinderUnwrap',
    signature: 'cylinderUnwrap(geometry: BufferGeometry)',
    returns: 'THREE.BufferGeometry',
    category: 'uv',
    description:
      "Preserves CylinderGeometry's built-in UVs: u wraps around the axis (horizontal texture features ring the cylinder), v runs up the height. Caps use circle-in-square. Sync; no WASM cost.",
    example:
      'const barrel = cylinderUnwrap(cylinderGeo(0.5, 0.5, 1.2, 24));\nconst mesh = new THREE.Mesh(barrel, pbrMaterial({ albedo: bandsTex }));',
  },
  {
    name: 'planeUnwrap',
    signature: 'planeUnwrap(geometry: BufferGeometry)',
    returns: 'THREE.BufferGeometry',
    category: 'uv',
    description:
      'Projects xy-extent of the bbox to [0,1]. Use for signs/decals/posters where you want ONE readable texture and no edge-face bleeding. Sync.',
    example:
      'const sign = planeUnwrap(planeGeo(1, 0.6));\nconst mesh = new THREE.Mesh(sign, pbrMaterial({ albedo: kilnTextTex }));',
  },
  {
    name: 'panelRemapV',
    signature: 'panelRemapV(geo, vScale=0.30, vOffset=0, uScale=1, uOffset=0)',
    returns: 'THREE.BufferGeometry',
    category: 'uv',
    description:
      'Scales an existing UV attribute so a small mesh samples a sub-region of a SHARED texture. Replaces the broken texture.clone() pattern (Three.js Texture.clone() runs JSON.stringify on userData, mangling encoded PNG bytes — panelRemapV avoids that by remapping UVs on the geometry instead). Typical use: multi-zone albedo where v=0..0.30 is plain panel and v=0.30..1 has windows/markings — small parts call panelRemapV(unwrap(geo), 0.30) to sample only the clean strip.',
    example:
      'const cowlGeo = panelRemapV(cylinderUnwrap(capsuleXGeo(0.45, 1.0)), 0.30);\nconst cowl = new THREE.Mesh(cowlGeo, bodyMat); // SAME bodyMat as fuselage, no clone needed',
  },

  // ---------------------------------------------------------------------------
  // Textures + PBR (Wave 3B)
  // ---------------------------------------------------------------------------
  {
    name: 'loadApprovedTexture',
    signature: 'await loadApprovedTexture(resourceId)',
    returns: 'Promise<THREE.DataTexture>',
    category: 'textures',
    description:
      'Loads one approved kiln.texture.* resource ID through the host-injected closed resolver. The registry fixes bytes, MIME, usage, dimensions, hash, and deadline; paths, URLs, byte arrays, resolver objects, hashes, and options are rejected.',
    example: "const bark = await loadApprovedTexture('kiln.texture.bark-brown-01-albedo.v1');",
    promptNotes:
      'Use only a concrete resource ID listed in material capabilities; never invent one. Prefer materialRecipe when a recipe already binds the family, or proceduralTexture V2 for authored surfaces. NEVER texture.clone() a loaded texture (clone() corrupts encoded bytes and breaks GLB export).',
  },
  {
    name: 'proceduralTexture',
    signature:
      "proceduralTexture({ schemaVersion: 2, size?: 4..1024 pow2, usage?, name?, layers: [{ op: 'solid'|'checker'|'stripes'|'gradient'|'bricks'|'noise', ...params, blend?: 'normal'|'multiply'|'screen'|'overlay', opacity?: 0..1 }] })",
    returns: 'THREE.DataTexture (tiling, sRGB or linear per usage)',
    category: 'textures',
    description:
      'Builds a tiling texture from a bounded layer stack — no image file needed. Layers composite bottom-first. Noise is seeded and tileable, so the same spec always produces the same bytes and a repeating material shows no seam. Baked to PNG and embedded in the GLB automatically.',
    example:
      "const bark = proceduralTexture({ schemaVersion: 2, size: 256, usage: 'albedo', name: 'Bark', layers: [{ op: 'solid', color: 0x5a4632 }, { op: 'noise', colorA: 0x3d2f21, colorB: 0x7a6248, scale: 6, octaves: 4, blend: 'overlay' }] });",
    promptNotes:
      'Sync — no await. Strict V2 JSON boundary: unknown/prototype keys, callbacks, paths, URLs, and shader source are rejected. Prefer this over approved resources for describable surfaces. Max 8 layers, power-of-two size up to 1024. Only the six listed ops exist.',
  },
  {
    name: 'normalMapFromHeight',
    signature: 'normalMapFromHeight(source: THREE.Texture, { strength?: number, name?: string })',
    returns: 'THREE.DataTexture (linear normal map)',
    category: 'textures',
    description:
      "Derives a tangent-space normal map from the source texture's brightness, treating it as height. The cheap way to get real PBR surface relief out of a procedural albedo. Wraps at the edges, so a tiling source gives a tiling normal map.",
    example:
      "const bark = proceduralTexture({ schemaVersion: 2, usage: 'albedo', layers: [{ op: 'noise', colorA: 0x3d2f21, colorB: 0x7a6248, scale: 6, octaves: 4 }] });\nconst mat = pbrMaterial({ albedo: bark, normal: normalMapFromHeight(bark, { strength: 4 }) });",
    promptNotes:
      'strength 1 is subtle, 4-8 reads clearly at normal viewing distance. Output is always linear data — never assign it to an albedo/emissive slot.',
  },
  {
    name: 'pbrMaterial',
    signature:
      'pbrMaterial({ albedo?, normal?, roughness?, metalness?, metallicRoughness?, emissive?, aoMap?, alphaMode?, alphaCutoff?, doubleSided? })',
    returns: 'THREE.MeshStandardMaterial',
    category: 'material',
    description:
      'Portable glTF PBR material. Use an explicit packed metallicRoughness texture (G=roughness, B=metalness); separate data maps are rejected instead of silently dropping a channel. Supports OPAQUE/MASK/BLEND and double-sided output.',
    example:
      "const wood = proceduralTexture({ schemaVersion: 2, usage: 'albedo', layers: [{ op: 'noise', colorA: 0x4f301c, colorB: 0x9a6b3e, scale: 8, octaves: 3, seed: 4 }] });\nconst crate = pbrMaterial({ albedo: wood, roughness: 0.85, metalness: 0 });",
  },
  {
    name: 'foliageMaterial',
    signature: 'foliageMaterial(albedo, { alphaCutoff?, roughness?, doubleSided? })',
    returns: 'THREE.MeshStandardMaterial',
    category: 'material',
    description:
      'Portable foliage material that defaults to glTF MASK, cutoff 0.5, rough nonmetal, and double-sided. Use an alpha-bearing albedo texture.',
    example: "const mat = await materialRecipe('kiln.material.leaf.v1');",
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
    example: 'meta.tris = countTriangles(root);',
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
    example: 'const joints = getJointNames(root);',
  },
  {
    name: 'validateAsset',
    signature:
      "validateAsset(root: Object3D, category: 'character' | 'prop' | 'vfx' | 'environment' | 'architecture' | 'vegetation' | 'vehicle')",
    returns: '{ valid, errors, warnings }',
    category: 'utility',
    description:
      'Warns on high distinct-material count (draw calls). No triangle limit; detail is free.',
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

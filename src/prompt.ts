/**
 * Kiln System Prompts & User Prompt Builders
 *
 * Canonical source in @pixel-forge/core. Was previously duplicated in
 * `packages/shared/kiln-prompts.ts`; that file has been retired in favor of
 * this one. Server imports via `@pixel-forge/core/kiln` (the route wrapper
 * re-exports through `services/claude`).
 *
 * The GLB system prompt is decomposed into named sections so each piece can
 * be reviewed, tested, and reused independently. The <api> enumeration is
 * GENERATED at load time from the primitive catalog (list-primitives.ts via
 * prompt-api.ts) — adding a primitive to the catalog updates the prompt, the
 * kiln_list_primitives tool, and the skill reference together. Hand-written
 * pedagogy (idioms, attachment rules, worked examples) stays hand-authored
 * around that enumeration.
 */

import { listPrimitives } from './list-primitives';
import { renderApiSection } from './prompt-api';
import { KILN_ASSET_FRAME, type AssetCategory, type AssetIntentV1 } from './contracts';
import { characterBodyPlanRecipe } from './character';
import { MATERIAL_RECIPE_PROMPT_CONTEXT_V1 } from './material-recipe-prompt';
import { vegetationSubtypePromptContext } from './vegetation-prompt';
import { vehicleSubtypeRecipe } from './vehicle';
import { renderAssetScopePrompt, renderVfxBreadthPrompt } from './breadth-prompt';
import { buildPropEnvironmentSemanticGuidance } from './qa/prop-environment-prompt';

export type { AssetCategory } from './contracts';

export type RenderMode = 'glb' | 'tsl' | 'both';
export type AssetStyle = 'low-poly' | 'stylized' | 'voxel' | 'detailed' | 'realistic';

// =============================================================================
// Style Templates
// =============================================================================

export const STYLE_TEMPLATES: Record<AssetStyle, string> = {
  'low-poly': `## Style: Low-Poly
Generate assets with a low-poly aesthetic:
- Use 6-8 segments for cylinders, spheres, cones
- Flat shading enabled (flatShading: true)
- Minimal detail, geometric forms
- Bold, solid colors
- No small decorative elements
- Chunky proportions`,

  stylized: `## Style: Stylized Cartoon
Generate assets with a stylized cartoon aesthetic:
- Use 12-16 segments for smoother curves
- Exaggerated proportions (big heads, small bodies for characters)
- Bright, saturated colors
- Smooth shading for organic forms
- Can include small decorative details
- Playful, whimsical shapes`,

  voxel: `## Style: Voxel
Generate assets with a voxel/Minecraft-like aesthetic:
- Use ONLY box geometry (boxGeo)
- No spheres, cylinders, or curved shapes
- Build forms from stacked/arranged cubes
- Grid-aligned positions (use 0.25 or 0.5 unit increments)
- Flat shading always
- Blocky proportions`,

  detailed: `## Style: Detailed
Generate assets with more geometric detail:
- Use 24-32 segments for smooth surfaces
- Include small decorative elements (buttons, rivets, trim)
- Layered construction with multiple parts
- Subtle color variations
- Can use metallic/roughness for PBR looks
- Realistic proportions`,

  realistic: `## Style: Realistic
Generate assets with realistic proportions and detail:
- Use 32-64 segments for very smooth surfaces
- Accurate real-world proportions
- Multiple materials with PBR properties (metalness, roughness)
- Include fine details (seams, edges, bevels)
- Subtle color gradients
- Higher triangle budgets allowed`,
};

// =============================================================================
// GLB System Prompt — named sections
// =============================================================================

export const KILN_PROMPT_HEADER = `You are an expert procedural 3D asset generator. Create game-ready models with character and style.

CRITICAL: NO import/export statements. Code runs in a sandbox with primitives as globals.`;

export const KILN_FILE_FORMAT = `<file-format>
const meta = { name: "AssetName", category: "prop", role: "prop" };
// role = how the asset sits in a scene (drives composition layout). One of:
// "ground" | "building" | "wonder" | "poi" | "prop" | "fill" | "vehicle".

// build() may be sync OR async. Mark it async if you use any CSG op
// (boolUnion / boolDiff / boolIntersect / hull) or any bevel/sweep op
// (roundedBoxGeo / extrudeProfile / revolveProfile) because those await WASM.
function build() {               // simple, no CSG
  const root = createRoot("AssetName");
  return root;
}

// OR when using CSG:
async function build() {         // use this form when any await is needed
  const root = createRoot("AssetName");
  const body = new THREE.Mesh(boxGeo(1,1,1), steel);
  const hole = new THREE.Mesh(cylinderGeo(0.2, 0.2, 2, 16), steel);
  const pierced = await boolDiff("Pierced", body, hole);
  root.add(pierced);
  return root;
}

function animate(root) {         // optional
  return [clip1, clip2];
}
</file-format>`;

export const KILN_COORDINATE_CONTRACT = `<coordinate-contract>
World coordinates are strict:
- ${KILN_ASSET_FRAME.forward} = forward / nose / muzzle direction
- ${KILN_ASSET_FRAME.up} = up
- ${KILN_ASSET_FRAME.right} = asset right side
- Ground rests at Y=${KILN_ASSET_FRAME.groundY}

Vehicles, aircraft, weapons, boats, and buildings must follow this frame. If a
part points forward, build it along +X. If a part spans left/right, build it
along Z. Do not make each asset invent its own forward axis.
</coordinate-contract>`;

/**
 * Hand-authored usage idioms that close out the <api> section — the patterns
 * the enumeration alone cannot teach (multi-step pipelines, WRONG/RIGHT pairs).
 */
export const KILN_API_IDIOMS = `// Usage idioms:
// createPart auto-adds to its parent:
//   WRONG: parent.add(createPart(...))  // DO NOT DO THIS
//   RIGHT: createPart("Name", geo, mat, { parent: parentObj });  // auto-adds
// Repeated parts (4 wheels, 10 posts, 12 bolts) — build one, instance the rest:
//   const wheelFL = createPart("WheelFL", wheelGeo, rubberMat, { position: [...], parent: root });
//   createInstance("WheelFR", wheelFL, { position: [...], parent: root });
//   GLB exports these as true mesh instances — one geometry, many nodes.
// Textured asset pipeline:
//   1. Build a geometry (boxGeo / CSG / subdivide / curveToMesh / etc)
//   2. \`await autoUnwrap(geo)\` → adds a uv attribute
//   3. \`await loadTexture(path)\` → load albedo/normal/etc PNG
//   4. \`pbrMaterial({ albedo: tex, ... })\` → build PBR material
//   5. new THREE.Mesh(unwrappedGeo, mat) → attach to scene
// THREE namespace is exposed — use \`new THREE.Mesh(geo, mat)\` when an op needs a
// Mesh input (like CSG operands) without attaching it to the scene.
// animate() must return an ARRAY of clips:
//   function animate(root) { return [clip1, clip2]; }`;

/**
 * The <api> section: the generated catalog enumeration (single source of
 * truth: list-primitives.ts) followed by the hand-authored idioms.
 */
export const KILN_API_SECTION = `<api>
${renderApiSection(listPrimitives())}

${KILN_API_IDIOMS}
</api>`;

/**
 * The <api> section for the unified tool surface: identical to {@link KILN_API_SECTION}
 * but with each primitive's example folded in (`includeExamples`). This replaces the
 * dropped kiln_list_primitives tool — the per-primitive examples now ride in the (cached)
 * prompt instead of a round-trip. Used only when toolSurface:'unified'.
 */
export const KILN_API_SECTION_UNIFIED = `<api>
${renderApiSection(listPrimitives(), { includeExamples: true })}

${KILN_API_IDIOMS}
</api>`;

export const KILN_ARCHITECTURE = `<architecture>
Use Pivot+Mesh pattern for animated parts:
- Joint_* = pivot node (animate this) - created by createPivot or createPart with pivot:true
- Mesh_* = geometry node (child of pivot)

For animations, track names must use "Joint_" prefix:
- createPivot("Body", ...) creates "Joint_Body" - animate with rotationTrack("Joint_Body", ...)
- createPart("Wheel", ..., {pivot: true}) creates "Joint_Wheel" - animate it
</architecture>`;

export const KILN_QUALITY = `<quality>
- Give your asset personality and character
- Use appropriate level of detail for the category
- Colors should be cohesive and intentional
- Animations should feel natural and loop seamlessly
- Name parts descriptively (Body, LeftArm, Wheel)
</quality>`;

export const KILN_ATTACHMENT_RULES = `<attachment-rules>
- Use cylinderXGeo / capsuleXGeo / coneXGeo for forward-facing bodies, barrels,
  aircraft fuselages, missiles, and weapon muzzles. Do not hand-rotate Y-axis
  cylinders unless you have a specific reason.
- Use cylinderZGeo / capsuleZGeo / coneZGeo for side-facing rails, pods, floats,
  and crossbars.
- Use cylinderOnAxis(center, normal, radius, height) ONLY when the cylinder
  needs to point along a non-cardinal direction (oblique struts, antennae off
  a tilted face). For X/Y/Z-aligned parts the terser *XGeo / *YGeo / *ZGeo
  helpers stay preferred.
- Use taperConeGeo(rBottom, rTop, height) for truncated/frustum shapes (soda
  cans, lampshades, pylon caps). coneGeo only does pointed cones.
- Use pipeAlongPath(points, radius, { bendRadius }) for cables, hoses,
  rigging, multi-segment piping. beamBetween is point-to-point only.
- Use revolveGeo(profile, { angle, axis }) for partial sweeps (half-domes,
  90° wedges) or revolution around non-Y axes. lathe stays for full Y-axis
  revolutions.
- Use beamBetween() for struts, braces, cables, skid supports, scaffolding, and
  diagonal rails. Endpoints must touch the parts they connect to.
- Use createLadder() for ladders. A ladder must have two continuous rails and
  repeated rungs spanning between those rails. Do not fake ladders with random
  boxes.
- Use createWingPair() for aircraft wings and helicopter stub wings. Set rootZ
  to the fuselage half-width so the wing roots touch the body. Wings must not
  float near the body, pass through the centerline, or angle as detached planks.
- Any visually-attached part should overlap or touch its parent by about 0.02
  units. Floating parts are invalid even if the named-parts check passes.
- Low triangle count is not the goal by itself. Spend triangles where silhouette
  matters: cockpits, wheels, rotors, wings, organic rocks, and curved aircraft.
</attachment-rules>`;

export const KILN_RULES = `<rules>
- Colors as hex: 0xff0000
- Coordinates: +X forward, +Y up, +Z right, ground at Y=0
- Animate pivots only (Joint_* names)
- Loops: end keyframe = start keyframe
- Track names: "Joint_Name" format (must exist in scene)
- animate() MUST return an ARRAY: return [clip]
- createClip needs 3 args: createClip(name, duration, tracks)
- NO "export" statements - just define meta, build, animate
- Output ONLY valid JavaScript code (no TypeScript types)
- NEVER call .add() on createPart result - it auto-adds to parent
- createPart/createInstance rotation is in DEGREES, not radians. rotation: [0,0,90] is a quarter turn; rotation: [0,0,0.785] is invisible. Never pass Math.PI-based values to the rotation option (direct THREE properties like group.rotation.z stay radians)
- Z-FIGHTING PREVENTION: No two mesh faces may be coplanar or near-coplanar. All decorative geometry (decals, markings, edge strips, reinforcements, trim) must be fully outside the parent mesh - never intersecting or flush. Offset at least 0.01 from the nearest surface. If a box is 0.6 wide (edges at x=+-0.3), place edge trim at x=+-0.31, NOT x=+-0.29. Minimum 0.01 thickness for flat parts.
- ROOFS AND TENTS: the two gable slopes MIRROR each other (+angle / -angle) and their top edges meet at the ridge. Every slope must extend PAST its wall line so the eave hangs below the wall top with real overhang - a panel that stops flush at the wall reads as a lid propped on the box. A panel perpendicular to its roof plane is wrong: its thin axis must align with the roof NORMAL, not the slope direction.
- CLOSED CIRCLES: barrels, drums, and towers built from staves/planks must close the full circumference - each stave TANGENT to the circle (rotate by its own angle), never radial fins with gaps. Do not carve groove detail with many thin CSG cutters (booleans blow up on thin blades); use lathe facets or thin proud surface strips instead.
- GROUND: only intentionally below-grade parts (earth mounds, footings, piles, keels/rudders) may dip below Y=0. Functional surface parts - wheels, tails, missiles, furniture, equipment - must stay at or above it; if a tilted assembly buries one end, raise or re-pivot it.
</rules>`;

export const KILN_ANIMATION_FORMAT = `<critical-animation-format>
WRONG: { time: 0, value: [0,0,0] }
RIGHT: { time: 0, rotation: [0,0,0] } for rotationTrack (degrees)
RIGHT: { time: 0, position: [0,0,0] } for positionTrack
</critical-animation-format>`;

/**
 * What to verify in the kiln_screenshot grid before submitting — ties the
 * vision loop to concrete, per-view checks instead of "look at it".
 */
export const KILN_VISUAL_QA = `<visual-qa>
Before kiln_submit, call kiln_screenshot and check each view deliberately:
- Front (camera on +X): the nose/muzzle/face should point AT you. If you see
  a side profile here, the asset is built sideways — rebuild along +X.
  Wheels/discs read edge-on here and as circles from the side — a circle seen
  from the front means the disc faces the wrong axis.
- Right (+Z): the long profile. Check silhouette: proportions, ground contact
  at the bottom edge, nothing important missing. Roof slopes must DRAPE — the
  eave line drops below the wall top with visible overhang; a roofline flush
  with the walls reads as a flap propped open. Nothing functional should hang
  below the ground line (cross-check kiln_render bbox.min[1]: below -0.05 is
  only OK for intentional earthworks, piles, or keels).
- Back / Left: symmetry with their opposites; no missing or one-sided parts.
- Top (+Y): left/right symmetry; wings/axles/rails centered on the body.
- 3/4: part CONTACT. Look for gaps where parts should touch (struts, ladder
  rails, wing roots, attachments). A visible gap means a floating part — fix
  the position or call snapTo(part, host), then screenshot again. Cylindrical
  stave assemblies (barrels, drums) must look CLOSED — daylight through the
  wall means staves are rotated radial instead of tangent.
If any view looks wrong, fix the code and re-screenshot before submitting.
If this is an ANIMATED CHARACTER, also call kiln_screenshot_animation on your key clips
before submitting — at least the walk and the main attack — from the right (side) camera,
and check the MOTION (a static screenshot cannot):
- Walk: legs swing forward and back in the side view (one forward while the other is back),
  feet stepping; the body must NOT slide or sway sideways. Knees bend so the lower leg goes
  BACK behind the thigh, never forward.
- Attack/strike: swings down and FORWARD through the front and finishes in front — never
  winds up or ends BEHIND the back; a held weapon stays in the hand and follows the arc.
- Block/guard: the shield or arm comes UP toward the front — the body does not step backward.
If unresolvedTracks comes back non-empty, the clip is frozen because a track targets a joint
that doesn't exist — fix the joint name. Fix any motion defect and screenshot the clip again.
</visual-qa>`;

/**
 * The visual-qa section for the unified tool surface: same per-view checks as
 * {@link KILN_VISUAL_QA}, but phrased for the collapsed kiln_render (which SHOWS
 * the six views) and the kiln_finalize terminal verb instead of
 * kiln_screenshot + kiln_submit.
 */
export const KILN_VISUAL_QA_UNIFIED = `<visual-qa>
After kiln_render you SEE the six views (metrics ride alongside the image). Before kiln_finalize, check each view deliberately:
- Front (camera on +X): the nose/muzzle/face should point AT you. If you see
  a side profile here, the asset is built sideways — rebuild along +X.
  Wheels/discs read edge-on here and as circles from the side — a circle seen
  from the front means the disc faces the wrong axis.
- Right (+Z): the long profile. Check silhouette: proportions, ground contact
  at the bottom edge, nothing important missing. Roof slopes must DRAPE — the
  eave line drops below the wall top with visible overhang; a roofline flush
  with the walls reads as a flap propped open. Nothing functional should hang
  below the ground line (cross-check the kiln_render bbox.min[1]: below -0.05 is
  only OK for intentional earthworks, piles, or keels).
- Back / Left: symmetry with their opposites; no missing or one-sided parts.
- Top (+Y): left/right symmetry; wings/axles/rails centered on the body.
- 3/4: part CONTACT. Look for gaps where parts should touch (struts, ladder
  rails, wing roots, attachments). A visible gap means a floating part — fix
  the position or call snapTo(part, host), then render again. Cylindrical
  stave assemblies (barrels, drums) must look CLOSED — daylight through the
  wall means staves are rotated radial instead of tangent.
If any view looks wrong, fix the code (kiln_edit or kiln_draft) and re-render before finalizing.
If a view reveals a suspect REGION — a floating part, a bad joint, a wrong proportion — call
kiln_inspect with that part's name for a single framed close-up before editing; prefer it over
re-reading the whole grid for fine detail. An unresolved name returns the list of part names to
retry with. If surrounding geometry blocks the part from every angle, pass isolate:true to hide
everything else.
If this is an ANIMATED CHARACTER, also call kiln_screenshot_animation on your key clips
before finalizing — at least the walk and the main attack — from the right (side) camera,
and check the MOTION (the static render cannot show it):
- Walk: legs swing forward and back in the side view (one forward while the other is back),
  feet stepping; the body must NOT slide or sway sideways. Knees bend so the lower leg goes
  BACK behind the thigh, never forward.
- Attack/strike: swings down and FORWARD through the front and finishes in front — never
  winds up or ends BEHIND the back; a held weapon stays in the hand and follows the arc.
- Block/guard: the shield or arm comes UP toward the front — the body does not step backward.
If unresolvedTracks comes back non-empty, the clip is frozen because a track targets a joint
that doesn't exist — fix the joint name. Fix any motion defect and re-render the clip again.
If this is a BUILDING, also call kiln_view_interior before finalizing — it lifts the roof and shows
three roof-off views the exterior six cannot, and you check the INSIDE:
- Floor plan (top-down): the floor area is open and walkable — no solid block filling the interior,
  no stray wall partitioning it unless intended.
- Dollhouse (3/4 cutaway): built-in fixtures (hearth, counter, shelves) rest ON the floor, not
  floating or sunk through it; the walls enclose a real volume with standing headroom.
- Eye-level (looking in through the doorway, near walls removed): the doorway is a REAL gap you
  could walk through (not a panel), and no glass or wall is buried inside a solid mass.
If roofsHidden comes back 0 no roof could be lifted — build the roof with a roof primitive
(createRoofPlanes / createGableRoof), which tags it so the tool finds it whatever it is named. Fix any
sealed, buried, or floating interior and view it again.
</visual-qa>`;

export const KILN_EXAMPLES = `<example name="animated-chest">
const meta = { name: "Chest", category: "prop" };

function build() {
  const root = createRoot("Chest");

  // Base - no animation needed, no pivot
  createPart("Base", boxGeo(1, 0.4, 0.8), gameMaterial(0x8B4513), {
    position: [0, 0.2, 0],
    parent: root
  });

  // Lid - needs animation, so use createPivot + createPart
  const lidPivot = createPivot("Lid", [0, 0.4, -0.35], root);
  createPart("LidMesh", boxGeo(1, 0.15, 0.8), gameMaterial(0x8B4513), {
    position: [0, 0.075, 0.35],
    parent: lidPivot
  });

  return root;
}

function animate(root) {
  // Animate Joint_Lid (created by createPivot("Lid", ...))
  return [createClip("Open", 2, [
    rotationTrack("Joint_Lid", [
      {time: 0, rotation: [0, 0, 0]},
      {time: 1, rotation: [-60, 0, 0]},  // degrees!
      {time: 2, rotation: [0, 0, 0]}
    ])
  ])];
}
</example>

<example name="gear-with-csg">
// Gear = cylinder body - 8 radially-arrayed cutter boxes - center hole.
// NOTE: build() is async because boolDiff awaits WASM.
const meta = { name: "Gear", category: "prop" };

async function build() {
  const root = createRoot("Gear");
  const steel = gameMaterial(0xb0b0b0, { metalness: 0.8, roughness: 0.3 });

  // Body disc (not added to root — will be consumed by boolDiff)
  const body = new THREE.Mesh(cylinderGeo(1, 1, 0.3, 32), steel);

  // 8 teeth cutters around the rim, detached from scene
  const cutters = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const c = new THREE.Mesh(boxGeo(0.4, 0.4, 0.4), steel);
    c.position.set(Math.cos(a) * 1.1, 0, Math.sin(a) * 1.1);
    cutters.push(c);
  }

  // Center shaft hole
  const hole = new THREE.Mesh(cylinderGeo(0.25, 0.25, 0.5, 16), steel);

  const gear = await boolDiff("Gear", body, ...cutters, hole);
  root.add(gear);
  return root;
}
</example>

<example name="textured-crate">
// A unit-cube crate with a wood albedo texture.
// autoUnwrap adds UVs so the texture maps cleanly; pbrMaterial wraps the
// texture into a MeshStandardMaterial that exports as glTF PBR.
const meta = { name: "Crate", category: "prop" };

async function build() {
  const root = createRoot("Crate");
  const wood = await loadTexture('./war-assets/textures/wood-planks.png');
  const mat = pbrMaterial({ albedo: wood, roughness: 0.88, metalness: 0 });
  const geo = await autoUnwrap(boxGeo(1, 1, 1), { resolution: 1024 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = "Mesh_Crate";
  root.add(mesh);
  return root;
}
</example>

<example name="fence-with-array">
// Linear + radial arrays share geometry across many instances.
const meta = { name: "Fence", category: "environment" };

function build() {
  const root = createRoot("Fence");
  const wood = gameMaterial(0x8b6f3d, { roughness: 0.9 });

  // One post, then 9 instances along +X (10 posts total, 0.5 apart)
  const post0 = createPart("Post0", cylinderGeo(0.05, 0.05, 1.2, 6), wood, {
    position: [0, 0.6, 0],
    parent: root
  });
  arrayLinear("Post", post0, 10, [0.5, 0, 0], root);

  // Two horizontal rails across the length
  createPart("RailTop", boxGeo(4.6, 0.08, 0.06), wood, {
    position: [2.25, 0.95, 0],
    parent: root
  });
  createPart("RailBot", boxGeo(4.6, 0.08, 0.06), wood, {
    position: [2.25, 0.35, 0],
    parent: root
  });

  return root;
}
</example>

<example name="attached-watchtower-leg-braces">
// Attachment discipline: beamBetween for braces whose ENDPOINTS lie on the
// parts they connect; snapTo to resolve contact instead of eyeballing offsets.
const meta = { name: "TowerBase", category: "environment" };

function build() {
  const root = createRoot("TowerBase");
  const wood = gameMaterial(0x7a5a38, { roughness: 0.9 });

  // Platform 2.0 up; four legs from the ground to the platform underside.
  const platform = createPart("Platform", boxGeo(1.6, 0.12, 1.6), wood, {
    position: [0, 2.0, 0], parent: root
  });
  for (const [x, z] of [[0.7, 0.7], [0.7, -0.7], [-0.7, 0.7], [-0.7, -0.7]]) {
    createPart("Leg", cylinderGeo(0.07, 0.09, 2.0, 6), wood, {
      position: [x, 1.0, z], parent: root
    });
  }

  // Cross braces: endpoints ON the leg surfaces, so they visibly connect.
  const dark = gameMaterial(0x5a4128, { roughness: 0.9 });
  beamBetween("BraceA", [0.7, 0.3, 0.7], [-0.7, 1.5, 0.7], 0.035, dark, { parent: root });
  beamBetween("BraceB", [-0.7, 0.3, 0.7], [0.7, 1.5, 0.7], 0.035, dark, { parent: root });

  // A lamp that must TOUCH the platform underside: place it close, then let
  // snapTo close the remaining gap (no z-fighting math by hand).
  const lamp = createPart("Lamp", sphereGeo(0.09, 8, 6), gameMaterial(0xffc864, { emissive: 0xa86a1e }), {
    position: [0.5, 1.78, 0.5], parent: root
  });
  snapTo(lamp, platform);

  return root;
}
</example>`;

/** Ordered sections of the GLB system prompt (exported for tests/ablation). */
export const KILN_SYSTEM_PROMPT_SECTIONS: ReadonlyArray<readonly [string, string]> = [
  ['header', KILN_PROMPT_HEADER],
  ['file-format', KILN_FILE_FORMAT],
  ['coordinate-contract', KILN_COORDINATE_CONTRACT],
  ['api', KILN_API_SECTION],
  ['architecture', KILN_ARCHITECTURE],
  ['quality', KILN_QUALITY],
  ['attachment-rules', KILN_ATTACHMENT_RULES],
  ['rules', KILN_RULES],
  ['animation-format', KILN_ANIMATION_FORMAT],
  ['visual-qa', KILN_VISUAL_QA],
  ['examples', KILN_EXAMPLES],
];

export const KILN_SYSTEM_PROMPT = KILN_SYSTEM_PROMPT_SECTIONS.map(([, s]) => s).join('\n\n');

export const KILN_TSL_SYSTEM_PROMPT = `You are an expert shader artist. Create stunning real-time visual effects using Three.js TSL.

<file-format>
import { MeshStandardNodeMaterial } from 'three/webgpu';
import { color, float, vec3, time, positionWorld, normalWorld, cameraPosition, Fn } from 'three/tsl';

const material = new MeshStandardNodeMaterial();

// Configure shader nodes
material.colorNode = ...;
material.emissiveNode = ...;
material.opacityNode = ...;

export { material };
</file-format>

<api>
// Types
float(n), vec2(x,y), vec3(x,y,z), vec4(x,y,z,w), color(0xhex)

// Geometry inputs
positionLocal, positionWorld, normalLocal, normalWorld, uv()
cameraPosition, time, deltaTime

// Operations (method chaining)
.add(n), .sub(n), .mul(n), .div(n)
.sin(), .cos(), .abs(), .pow(n), .sqrt()
.dot(v), .cross(v), .normalize(), .length()
.mix(a,b), .smoothstep(min,max), .clamp(min,max), .saturate()
.oneMinus() // = 1.0 - x

// Functions
Fn(() => { return nodeExpression; })  // Define reusable shader function

// Material properties
material.colorNode, material.emissiveNode, material.opacityNode
material.metalnessNode, material.roughnessNode
material.normalNode, material.positionNode
</api>

<patterns>
// Fresnel (rim glow)
const fresnel = cameraPosition.sub(positionWorld).normalize().dot(normalWorld).abs().oneMinus().pow(3);

// Pulse
const pulse = time.mul(2).sin().mul(0.5).add(0.5);

// Color gradient by height
const gradient = positionLocal.y.smoothstep(-1, 1);
</patterns>

<quality>
- Effects should enhance the geometry, not overpower it
- Use subtle animations (avoid jarring flashes)
- Combine multiple effects (fresnel + pulse + gradient)
- Colors should complement the base geometry
</quality>

<rules>
- Method chaining: time.mul(2).sin() NOT sin(time * 2)
- Always export { material }
- Output ONLY valid JavaScript code
</rules>

## TSL Basics

### Method Chaining (not operators)
\`\`\`javascript
// GLSL: sin(time * 2.0) * 0.5 + 0.5
// TSL:
time.mul(2.0).sin().mul(0.5).add(0.5)
\`\`\`

### Core Types
\`\`\`javascript
float(1.0)           // Scalar
vec2(x, y)           // 2D vector
vec3(x, y, z)        // 3D vector
color(0xff0000)      // RGB from hex
\`\`\`

### Geometry Nodes
\`\`\`javascript
positionLocal        // Model space position
positionWorld        // World space position
normalWorld          // World space normal
cameraPosition       // Camera world position
uv()                 // UV coordinates
time                 // Seconds since start
\`\`\`

### Material Properties
\`\`\`javascript
material.colorNode = color(0xff0000);
material.emissiveNode = color(0x00ffff).mul(intensity);
material.opacityNode = float(0.8);
material.transparent = true;
\`\`\`

## Common Patterns

### Fresnel (rim glow)
\`\`\`javascript
const fresnel = Fn(() => {
  const viewDir = cameraPosition.sub(positionWorld).normalize();
  const nDotV = normalWorld.dot(viewDir).saturate();
  return float(1.0).sub(nDotV).pow(3.0);
});
material.emissiveNode = color(0x00ffff).mul(fresnel());
\`\`\`

### Pulse
\`\`\`javascript
const pulse = time.mul(2.0).sin().mul(0.5).add(0.5);
material.emissiveNode = color(0xff0000).mul(pulse);
\`\`\`

## Rules
1. Output ONLY code, no explanations or markdown
2. Always import from three/webgpu and three/tsl
3. Use method chaining for all operations
4. Export the material for runtime use

Generate complete, working code.`;

export const KILN_BOTH_SYSTEM_PROMPT = `You generate TWO code files: geometry + shader effect.

CRITICAL: geometry code has NO IMPORTS and NO EXPORTS. Just define meta, build, animate.

OUTPUT FORMAT (MANDATORY):
\`\`\`geometry
const meta = { name: "Name", category: "prop" };

function build() {
  const root = createRoot("Name");
  // createPart AUTO-ADDS to parent - NEVER call .add() on it!
  createPart("Body", boxGeo(1, 1, 1), gameMaterial(0x4488ff), {
    position: [0, 0.5, 0],
    parent: root
  });
  return root;
}

function animate(root) {
  // Track names must match Joint_* names created by createPivot
  return [bobbingAnimation(root.name, 2, 0.1)];
}
\`\`\`

\`\`\`effect
import { MeshStandardNodeMaterial } from 'three/webgpu';
import { color, float, time } from 'three/tsl';
const material = new MeshStandardNodeMaterial();
material.colorNode = color(0xff0000);
export { material };
\`\`\`

GEOMETRY (no imports, no exports, globals available):
createRoot(name) - creates root Object3D
createPivot(name, [x,y,z], parent) - creates Joint_name pivot, returns it
createPart(name, geo, mat, {position, rotation, scale, parent, pivot}) - AUTO-ADDS to parent!
  NEVER: root.add(createPart(...))  // WRONG!
  ALWAYS: createPart("Name", geo, mat, { parent: root })  // RIGHT!
  rotation is DEGREES, not radians: [0,0,90] = quarter turn; [0,0,1.57] does nothing.
  (Same for createInstance. Only direct THREE access like obj.rotation.z uses radians.)

boxGeo, sphereGeo, cylinderGeo, coneGeo, capsuleGeo, torusGeo, planeGeo
gameMaterial(0xcolor, {metalness, roughness, emissive, flatShading})
glassMaterial(0xcolor, {opacity, roughness, metalness}) - transparent canopy/windows
rotationTrack("Joint_Name", [{time, rotation:[x,y,z]}]) - degrees, NOT value!
positionTrack("Joint_Name", [{time, position:[x,y,z]}]) - NOT value!
createClip(name, duration, tracks) - 3 args!
spinAnimation("Joint_Name", duration, axis), bobbingAnimation(rootName, duration, height)

TSL (with imports/exports):
float(n), vec3(x,y,z), color(0xhex)
time, positionWorld, normalWorld, cameraPosition
Method chaining: time.mul(2).sin().add(0.5)

RULES:
1. Output BOTH \`\`\`geometry AND \`\`\`effect blocks
2. No text/explanations outside code blocks
3. Effect enhances the geometry visually (glow, pulse, fresnel, etc)
4. NEVER call .add() on createPart return value - it auto-adds to parent`;

// =============================================================================
// Prompt Helpers
// =============================================================================

/**
 * The trimmed <api> stub: instead of the full generated enumeration, a ~15
 * line category map plus an explicit instruction to discover signatures via
 * the kiln_list_primitives tool. The ablation arm for measuring whether the
 * full enumeration earns its tokens (kiln-bench prompt axis).
 */
export const KILN_API_SECTION_TRIMMED = `<api>
The sandbox exposes ~70 primitive helpers as globals (no imports), grouped:
- Scene & structure: createRoot, createPivot, createPart (AUTO-ADDS to parent —
  never call parent.add on its result), beamBetween, createLadder,
  createWingPair, snapTo
- Geometry: boxGeo, sphereGeo, cylinder/capsule/cone in Y (default) + X + Z
  axis variants, taperConeGeo, torusGeo, planeGeo (textured only), decalBox,
  wingGeo, gearGeo, bladeGeo, billboard cards
- Materials: gameMaterial, glassMaterial, lambertMaterial, basicMaterial, pbrMaterial
- Repetition: createInstance, arrayLinear, arrayRadial, mirror
- CSG (async build() required): boolUnion, boolDiff, boolIntersect, hull
- Bevel & sweeps (async build() required): roundedBoxGeo (all 12 edges rounded
  or chamfered, exact outer size — prefer over boxGeo for anything moulded,
  cast, or machined), extrudeProfile (any 2D outline -> solid, with holes,
  corner bevel, twist, taper), revolveProfile (solid lathe with a bevelled
  rim), circleProfile (sync outline helper)
- Mesh ops & curves: subdivide, mergeVertices, curveToMesh, pipeAlongPath, lathe, revolveGeo
- UV + textures: autoUnwrap, boxUnwrap, cylinderUnwrap, planeUnwrap, panelRemapV, loadTexture
- Animation: rotationTrack/positionTrack/scaleTrack (keys are "rotation"/"position"/"scale",
  NOT "value"), createClip, spinAnimation, bobbingAnimation, idleBreathing

IMPORTANT: call the kiln_list_primitives tool BEFORE writing any code to get
exact signatures, defaults, and idiomatic examples for the helpers you plan to
use. THREE is also exposed (new THREE.Mesh(geo, mat) for CSG operands).
</api>`;

export interface GetSystemPromptOptions {
  /**
   * How much of the primitive catalog rides in the system prompt:
   * 'full' (default) embeds the complete generated enumeration; 'trimmed'
   * sends the ~15-line stub above and relies on the kiln_list_primitives
   * tool for discovery. Bench-measured via the prompt axis.
   */
  apiSurface?: 'full' | 'trimmed';
  /**
   * Which agent tool surface the prompt is written for: 'current' (default)
   * matches the kiln_screenshot + kiln_submit verbs; 'unified' folds the
   * per-primitive examples into <api> (the dropped kiln_list_primitives tool's
   * signal) and swaps the visual-qa verbs to kiln_render + kiln_finalize.
   * INCOMPATIBLE with apiSurface:'trimmed' (the trimmed stub points at the
   * removed kiln_list_primitives tool) — 'unified' takes precedence.
   */
  toolSurface?: 'current' | 'unified';
}

export function getSystemPrompt(mode: RenderMode, opts: GetSystemPromptOptions = {}): string {
  if (mode === 'tsl') return KILN_TSL_SYSTEM_PROMPT;
  if (mode === 'both') return KILN_BOTH_SYSTEM_PROMPT;
  // Unified tool surface: fold per-primitive examples into <api> and swap the
  // verb-bearing visual-qa section. Takes precedence over apiSurface:'trimmed'
  // (the trimmed stub references the removed kiln_list_primitives tool).
  if (opts.toolSurface === 'unified') {
    return KILN_SYSTEM_PROMPT_SECTIONS.map(([name, s]) => {
      if (name === 'api') return KILN_API_SECTION_UNIFIED;
      if (name === 'visual-qa') return KILN_VISUAL_QA_UNIFIED;
      return s;
    }).join('\n\n');
  }
  if (opts.apiSurface === 'trimmed') {
    return KILN_SYSTEM_PROMPT_SECTIONS.map(([name, s]) =>
      name === 'api' ? KILN_API_SECTION_TRIMMED : s,
    ).join('\n\n');
  }
  return KILN_SYSTEM_PROMPT;
}

/**
 * Prepended to the system prompt when refining an existing asset (existingCode set).
 * Frames the model as an editor working on top of the unchanged Kiln conventions, so
 * it preserves the asset's character and changes only what the Edit Request asks. The
 * task-level know-how (primitives, orientation, attachment) still comes from
 * `getSystemPrompt`; this is an additive directive, not a replacement.
 */
export const KILN_REFINE_DIRECTIVE = `You are MODIFYING an existing Kiln asset, not building a new one from scratch. The user message gives you the Original Request that created the asset, its Current Code, and an Edit Request. Keep the asset's established character, proportions, and structure; change ONLY what the Edit Request asks for. Re-validate and re-render the edited program with the kiln tools, then submit it with kiln_submit.`;

/**
 * Prepended to the system prompt when refining in EDIT mode (existingCode set and the
 * caller chose surgical edits). Supersedes {@link KILN_REFINE_DIRECTIVE}: it carries the
 * same modify-not-rebuild framing plus the edit-tool mechanics. The model works on a live
 * working buffer seeded with the Current Code and changes it in place with `kiln_edit`,
 * rather than re-emitting the whole program. The full-rewrite path stays available as an
 * escape hatch (submit a complete program) so edit mode is never strictly worse.
 */
export const KILN_EDIT_DIRECTIVE = `You are EDITING an existing Kiln asset in place, not rebuilding it. A working buffer holds the Current Code shown in the user message. Use the kiln_edit tool to make the SMALLEST set of changes that satisfy the Edit Request: replace an exact span (oldString) with newString. Each oldString must match the current buffer verbatim - call kiln_view to read it (the text is raw, with no line-number prefixes). Keep everything the Edit Request does not mention byte-for-byte unchanged. After your edits, re-validate and re-render the buffer with the kiln tools, then call kiln_submit (omit its code argument to submit the working buffer). If an edit cannot be anchored after a couple of tries, you may submit a complete corrected program instead.`;

/**
 * The unified-surface counterparts of {@link KILN_REFINE_DIRECTIVE} and
 * {@link KILN_EDIT_DIRECTIVE}. Same modify-not-rebuild framing, but the working
 * buffer IS the unified surface (already seeded with the Current Code) and the
 * terminal verb is kiln_finalize, not kiln_submit. Used only when
 * toolSurface:'unified'.
 */
export const KILN_REFINE_DIRECTIVE_UNIFIED = `You are MODIFYING an existing Kiln asset, not building a new one from scratch. The user message gives you the Original Request that created the asset, its Current Code, and an Edit Request. Your working buffer is already seeded with the Current Code. Keep the asset's established character, proportions, and structure; change ONLY what the Edit Request asks for — use kiln_edit for small changes, or kiln_draft to rewrite the whole program. Every buffer write returns a static validation report — fix any errors it lists, re-render the buffer with kiln_render, then call kiln_finalize.`;

export const KILN_EDIT_DIRECTIVE_UNIFIED = `You are EDITING an existing Kiln asset in place, not rebuilding it. Your working buffer is already seeded with the Current Code shown in the user message. Use the kiln_edit tool to make the SMALLEST set of changes that satisfy the Edit Request: replace an exact span (oldString) with newString. Each oldString must match the current buffer verbatim - call kiln_view to read it (the text is raw, with no line-number prefixes). Keep everything the Edit Request does not mention byte-for-byte unchanged. Every successful edit returns a static validation report - fix any errors it lists, re-render the buffer with kiln_render, then call kiln_finalize. If an edit cannot be anchored after a couple of tries, call kiln_draft to rewrite the whole program instead.`;

export interface AssetBudget {
  maxTriangles?: number;
  maxMaterials?: number;
}

export interface KilnGenerateRequest {
  prompt: string;
  mode: RenderMode;
  category: AssetCategory;
  /** Closure-owned normalized intent; used only for resolved, category-specific guidance. */
  intent?: AssetIntentV1;
  style?: AssetStyle;
  budget?: AssetBudget;
  includeAnimation?: boolean;
  existingCode?: string;
  /** The asset's original generation prompt. When refining (existingCode set) it
   *  is rendered as a "## Original Request" section ahead of the code so the model
   *  knows the asset's intent, not just its source. Ignored for fresh generation. */
  originalPrompt?: string;
  referenceImageUrl?: string;
  /**
   * A complete Kiln program rendered as a "## Reference Asset (style anchor)"
   * section — the model studies its idioms (proportions, segment counts,
   * attachment patterns, palette discipline) and builds the NEW asset in the
   * same style. Fresh generation only: suppressed when `existingCode` is set
   * (a refine already anchors on the parent's source).
   *
   * Token cost: a typical canonical program adds ~5-15k input tokens per run;
   * prompt caching absorbs most of it on repeated batch use.
   */
  exemplarCode?: string;
}

/**
 * Category-gated guidance appended to the user prompt on fresh generation.
 * Parallel to Kiln Studio's `composeAgentPrompt` (which carries `character`),
 * but core-owned so it reaches EVERY consumer — CLI, batch/TIJ, bench, editor,
 * AND the deployed agent runtime (category already crosses the AgentCore wire).
 * Keep the two maps disjoint by category so a directive is injected exactly
 * once: studio owns `character`; core owns `architecture`.
 */
/** Complete executable architecture programs embedded only in fresh architecture requests. */
export const ARCHITECTURE_RIDGE_X_SCAFFOLD = `const meta = { name: 'RidgeXHouse', category: 'architecture' };
function build() {
  const root = createRoot('RidgeXHouse');
  const wall = gameMaterial(0xd8c4a0, { roughness: 0.9 });
  const roof = gameMaterial(0x7a3e35, { roughness: 0.82 });
  const shell = createGableShell('House', { wall, roof }, {
    spanX: 8, spanZ: 6, wallHeight: 3, rise: 1.6, overhang: 0.4,
    ridgeAxis: 'x', closedEnds: true, enterable: true, parent: root,
    openings: [{ id: 'front-door', wall: 'front', kind: 'door', width: 1.1, height: 2.1 }],
  });
  for (const face of shell.roof.faces) {
    createRoofSurfaceLayout('RoofPanels_' + face.side, roof, {
      face, kind: 'panels', panelWidth: 0.8, parent: shell.roof.root,
    });
  }
  return root;
}`;

export const ARCHITECTURE_RIDGE_Z_SCAFFOLD = `const meta = { name: 'RidgeZHouse', category: 'architecture' };
function build() {
  const root = createRoot('RidgeZHouse');
  const wall = gameMaterial(0xc9b895, { roughness: 0.92 });
  const roof = gameMaterial(0x40566e, { roughness: 0.8 });
  const shell = createGableShell('House', { wall, roof }, {
    spanX: 7, spanZ: 10, wallHeight: 3.2, rise: 1.8, overhang: 0.45,
    ridgeAxis: 'z', closedEnds: true, enterable: true, parent: root,
    openings: [{ id: 'front-door', wall: 'front', kind: 'door', width: 1.2, height: 2.2 }],
  });
  for (const face of shell.roof.faces) {
    createRoofSurfaceLayout('RoofPanels_' + face.side, roof, {
      face, kind: 'panels', panelWidth: 0.8, parent: shell.roof.root,
    });
  }
  return root;
}`;

export const ARCHITECTURE_PANEL_DIRECTION_ANTI_EXAMPLE = `// WRONG: stepping panels along face.ridgeTangent turns their long dimension along the ridge
// and leaves open strips from ridge to eave. Do not hand-place or rotate roof panels this way.
// CORRECT: pass the owned face frame to createRoofSurfaceLayout; it repeats panel widths along
// the ridge while every panel's long dimension runs downhill from ridge to eave.
createRoofSurfaceLayout('RoofPanels', roofMaterial, {
  face, kind: 'panels', panelWidth: 0.8, parent: face.roofRoot,
});`;

export const ARCHITECTURE_CONTEXT = `This is a BUILDING the player can go INSIDE. Build it HOLLOW: thin walls enclosing real
interior space with a floor — never a solid block. Its foundation rests flat on the ground,
and the main entrance faces forward so the front reads clearly.

Give it true human architectural scale: a doorway tall and wide enough for a person to walk
through, windows at standing height, and a ceiling high enough to stand under with headroom.
The building's mass should dwarf a single doorway.

Cut REAL openings into the walls — a doorway is an actual gap you could pass through, not a
panel painted on a wall; windows are inset panes or holes flush with the wall surface. Never
float a pane in front of a wall or bury glass inside a solid block, and never seal the entrance.

Walls meet squarely at the corners with no gaps. Prefer createGableShell(...) for a hollow floor,
four walls with real openings, a separable Roof assembly, two correctly opposed slopes, and closed
gable ends. Set ridgeAxis explicitly from the requested +X/+Z frame. Use createRoofSurfaceLayout(...)
with each returned face instead of guessing Euler rotations or panel directions.

## Correct scaffold — ridge along +X

\`\`\`js
${ARCHITECTURE_RIDGE_X_SCAFFOLD}
\`\`\`

## Correct scaffold — ridge along +Z

\`\`\`js
${ARCHITECTURE_RIDGE_Z_SCAFFOLD}
\`\`\`

## Roof-panel direction anti-example

\`\`\`js
${ARCHITECTURE_PANEL_DIRECTION_ANTI_EXAMPLE}
\`\`\`

Spend detail where a building reads: the roofline and eaves, a framed door, window sills or
mullions, a chimney, a porch or entry overhang, a foundation course, corner posts, trim — and
built-in fixtures (a hearth, a counter, shelving). Leave the floor space open for furniture to
be placed later. room(...), wallWithOpening(...), createRoofPlanes(...), and createStairs(...)
remain compatibility helpers for non-gable or custom construction.

Before you finalize, call kiln_view_interior and check the roof-off views: the interior is open
and walkable (no solid fill, no interior wall left buried in a mass), the doorway is a real gap
you could pass through, and any built-in fixtures rest on the floor. Fix anything sealed, buried,
or floating, then view the interior again.`;

/** PROP build context — make movable parts distinct and correctly hinged so they
 *  read well statically AND can be animated about their real pivot. */
export const PROP_CONTEXT =
  'This is a PROP. Build any part that can move — a lid, door, drawer, hatch, wheel, gear, lever, ' +
  'handle, or hinge — as its OWN distinct piece seated at its real hinge or axle, never fused into the ' +
  'body. A chest or box lid hinges along its BACK TOP edge; a door swings on its side jamb; a wheel or ' +
  'gear turns on its axle; a lever or handle pivots at its base. If you animate it, put a createPivot ' +
  'exactly at that hinge or axle line, parent only the moving mesh under the joint, and leave the static ' +
  'body unpivoted so just the part moves — not the whole object.';

/** ENVIRONMENT build context — sway-prone pieces as separate, base-anchored parts. */
export const ENVIRONMENT_CONTEXT =
  'This is an ENVIRONMENT element. Build sway-prone or moving pieces — foliage, fronds, grass tufts, ' +
  'branches, flags, banners, vines, or water — as separate parts anchored at their base. If you animate ' +
  'them, pivot at the base or anchor (a flag at its mast edge, a frond at its stalk, grass at the ground) ' +
  'with a gentle, looping sway; when several elements move, offset their phase so they do not all swing ' +
  'in lockstep.';

/** VEG-018 organic construction guidance. Branch/canopy/frond experiments are
 * deliberately absent: until their gates pass, vegetation uses existing primitives. */
export const VEGETATION_CONTEXT = `This is a STANDALONE VEGETATION asset in the canonical +Y-up frame.
Build only the requested plant or fungus: do not add a terrain disk, soil mound, rocks, pot, planter,
grass skirt, or display plate unless the request explicitly includes it. Add semantic roles for the
trunk/stem/root support, canopy or foliage clusters, and one vegetation.contact.ground marker at
asset-local Y=0. Prefer a nonrendering local frame on the support mesh, for example
\`semantic: { roles: ['vegetation.trunk', 'vegetation.contact.ground'], frames:
[{ id: 'ground-contact', translation: [0, -trunkHeight / 2, 0], rotation: [0, 0, 0, 1] }] }\`.
Seat visible support material on that plane without floating or burying it.

Use the current general primitives for branches, canopy masses/cards, and fronds. Keep every branch
or frond base embedded into its parent, decrease branch radii toward tips, and verify foliage from
front, right, top, and three-quarter views. Deliberately bare/dead growth has no missing-foliage
requirement. In portable PBR/textured modes, use two to six restrained foliage value roles (for
example cooler inner leaves and slightly lighter outer leaves); in flatOptimized mode, keep one
coherent foliage role so material consolidation remains intentional.`;

/** VFX build context — emitter-like parts driven by transform on Joint_ pivots. */
export const VFX_CONTEXT =
  'This is a VFX / effect asset. Build the moving or emitting elements — pulses, rings, sparks, swirls, ' +
  'beams, or shards — as distinct parts. If you animate them, drive the motion through Joint_ pivots ' +
  '(spin, orbit, pulse, or scale) about a sensible center, and keep every loop seamless (the end pose ' +
  'matches the start) so it reads as a continuous effect.';

/**
 * Per-category context appended to fresh-generation prompts by
 * {@link buildUserPrompt}. Core owns every category whose guidance reaches all
 * consumers (CLI / batch / bench / editor / the deployed runtime) — `architecture`
 * (its primitives are core helpers) plus `prop` / `vfx` / `environment` (their
 * moving-part rig guidance). `character` deliberately stays studio-side (the studio
 * prepends CHARACTER_CONTEXT into the prompt string before the wire).
 */
export const CATEGORY_CONTEXT: Partial<Record<AssetCategory, string>> = {
  architecture: ARCHITECTURE_CONTEXT,
  prop: PROP_CONTEXT,
  environment: ENVIRONMENT_CONTEXT,
  vegetation: VEGETATION_CONTEXT,
  vfx: VFX_CONTEXT,
};

export function buildUserPrompt(request: KilnGenerateRequest): string {
  const parts: string[] = [];

  // Add style template if specified
  if (request.style && STYLE_TEMPLATES[request.style]) {
    parts.push(STYLE_TEMPLATES[request.style]);
    parts.push('');
  }

  // Budget constraints
  if (request.budget) {
    parts.push('## Constraints');
    if (request.budget.maxTriangles) {
      parts.push(`- Triangle budget: ${request.budget.maxTriangles}`);
    }
    if (request.budget.maxMaterials) {
      parts.push(`- Material limit: ${request.budget.maxMaterials}`);
    }
    parts.push('');
  }

  // Style anchor (fresh generation only — a refine anchors on the parent).
  if (request.exemplarCode && !request.existingCode) {
    parts.push(
      `## Reference Asset (style anchor)\n\nStudy this finished Kiln program: its proportions, segment counts, attachment patterns, naming, and palette discipline define the style to match. Build the NEW asset requested below in the same style — do NOT copy or reproduce the reference asset itself.\n\n\`\`\`javascript\n${request.exemplarCode}\n\`\`\``,
    );
    parts.push('');
  }

  // Main request
  if (request.existingCode) {
    // Refine framing: Original Request (intent) -> Current Code (source) -> Edit Request.
    const editSections: string[] = [];
    if (request.originalPrompt) {
      editSections.push(`## Original Request\n\n${request.originalPrompt}`);
    }
    editSections.push(`## Current Code\n\n\`\`\`typescript\n${request.existingCode}\n\`\`\``);
    editSections.push(`## Edit Request\n\n${request.prompt}`);
    parts.push(editSections.join('\n\n'));
  } else {
    parts.push(`## Task\n\nCreate a ${request.category}: ${request.prompt}`);
    // Category-gated guidance (fresh generation only). Studio injects character
    // context into the prompt string before the wire; core injects the rest here
    // so every consumer — including the deployed runtime — gets it once.
    const categoryContext = CATEGORY_CONTEXT[request.category];
    if (categoryContext) parts.push(`\n${categoryContext}`);
    if (request.intent) {
      parts.push(
        `\n## Resolved Asset Scope\n${renderAssetScopePrompt(request.intent.scope, request.intent.modular)}`,
      );
      const semanticGuidance = buildPropEnvironmentSemanticGuidance(request.intent);
      if (semanticGuidance) parts.push(`\n${semanticGuidance}`);
    }
    if (request.category === 'character' && request.intent?.character) {
      const character = request.intent.character;
      const clips = character.clips.length
        ? character.clips.map((clip) => `${clip.name}:${clip.playback}`).join(', ')
        : 'none requested';
      parts.push(
        `\n## Resolved Character Contract\n${characterBodyPlanRecipe(character.bodyPlan)}\n` +
          `Grounded: ${character.grounded}; locomotion: ${character.locomotion}; gait: ${character.gait}; ` +
          `root motion: ${character.rootMotion}; clips: ${clips}; held item: ` +
          `${character.heldItem.required ? `required at ${character.heldItem.attachmentRole}` : 'none'}.`,
      );
    }
    if (request.category === 'vehicle' && request.intent?.vehicle) {
      const vehicle = request.intent.vehicle;
      parts.push(
        `\n## Resolved Vehicle Contract\n${vehicleSubtypeRecipe(vehicle)}\n` +
          `Wheel assemblies: ${vehicle.wheelCount}; axles: ${vehicle.axleCount}; steering: ` +
          `${vehicle.steering}; animation assemblies: ` +
          `${vehicle.animationAssemblies.join(', ') || 'none requested'}.`,
      );
    }
    if (request.category === 'vegetation' && request.intent?.vegetation) {
      const vegetation = request.intent.vegetation;
      const materialGuidance =
        request.intent.material.mode === 'flatOptimized'
          ? 'Use one coherent foliage value role.'
          : 'Use two to six restrained foliage value roles and evaluate material coherence separately from structure.';
      parts.push(
        `\n## Resolved Vegetation Contract\nGrowth form: ${vegetation.subtype}; state: ` +
          `${vegetation.growthState}; canopy profile: ${vegetation.canopyProfile}; standalone: ` +
          `${vegetation.standalone}; grounded: ${vegetation.grounded}. ${materialGuidance}`,
      );
      parts.push(vegetationSubtypePromptContext(request.intent));
    }
    if (request.category === 'vfx' && request.intent?.vfx) {
      parts.push(`\n## Resolved VFX Contract\n${renderVfxBreadthPrompt(request.intent.vfx)}`);
    }
    if (
      request.intent?.material.mode === 'pbrRecipe' ||
      request.intent?.material.mode === 'texturedHero'
    ) {
      parts.push(`\n${MATERIAL_RECIPE_PROMPT_CONTEXT_V1}`);
    }
  }

  // Animation instructions — only for fresh generation. When editing existing code
  // the Edit Request governs whether animation changes, so forcing either block
  // would fight the instruction (e.g. "add a spin" vs a "## No Animation" directive).
  if (!request.existingCode) {
    if (request.includeAnimation !== false) {
      parts.push(`
## Animation Requirements
Include an animate() function that returns an array of AnimationClips.
Use createPivot() for parts that need animation, then animate them with rotationTrack/positionTrack.
Track names MUST match pivot names exactly (e.g., createPivot("Lid",...) -> rotationTrack("Joint_Lid",...)).
Make animations loop seamlessly (end keyframe = start keyframe values).`);
    } else {
      parts.push(`
## No Animation
Do NOT include an animate() function. Only create the static geometry in build().`);
    }
  }

  parts.push('\n\nGenerate the complete code.');

  return parts.join('\n');
}

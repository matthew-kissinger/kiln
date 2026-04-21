/**
 * Kiln System Prompts & User Prompt Builders
 *
 * Copied from packages/shared/kiln-prompts.ts for the core spike so the
 * headless pipeline has no run-time dependency on the shared package's
 * prompt content. Duplication is intentional - W2 will dedupe once the
 * editor migration lands.
 *
 * Local types mirror @pixel-forge/shared api-types so we stay additive.
 */

export type RenderMode = 'glb' | 'tsl' | 'both';
export type AssetCategory = 'character' | 'prop' | 'vfx' | 'environment';
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

  'stylized': `## Style: Stylized Cartoon
Generate assets with a stylized cartoon aesthetic:
- Use 12-16 segments for smoother curves
- Exaggerated proportions (big heads, small bodies for characters)
- Bright, saturated colors
- Smooth shading for organic forms
- Can include small decorative details
- Playful, whimsical shapes`,

  'voxel': `## Style: Voxel
Generate assets with a voxel/Minecraft-like aesthetic:
- Use ONLY box geometry (boxGeo)
- No spheres, cylinders, or curved shapes
- Build forms from stacked/arranged cubes
- Grid-aligned positions (use 0.25 or 0.5 unit increments)
- Flat shading always
- Blocky proportions`,

  'detailed': `## Style: Detailed
Generate assets with more geometric detail:
- Use 24-32 segments for smooth surfaces
- Include small decorative elements (buttons, rivets, trim)
- Layered construction with multiple parts
- Subtle color variations
- Can use metallic/roughness for PBR looks
- Realistic proportions`,

  'realistic': `## Style: Realistic
Generate assets with realistic proportions and detail:
- Use 32-64 segments for very smooth surfaces
- Accurate real-world proportions
- Multiple materials with PBR properties (metalness, roughness)
- Include fine details (seams, edges, bevels)
- Subtle color gradients
- Higher triangle budgets allowed`
};

// =============================================================================
// System Prompt (GLB mode - spike only cares about this)
// =============================================================================

export const KILN_SYSTEM_PROMPT = `You are an expert procedural 3D asset generator. Create game-ready models with character and style.

CRITICAL: NO import/export statements. Code runs in a sandbox with primitives as globals.

<file-format>
const meta = { name: "AssetName", category: "prop" };

function build() {
  const root = createRoot("AssetName");
  // Build scene graph with pivots and meshes
  return root;
}

function animate(root) {
  // Return animation clips (optional)
  return [clip1, clip2];
}
</file-format>

<api>
// Scene (no imports needed - globals)
createRoot(name: string): Object3D
createPivot(name: string, position: [x,y,z], parent: Object3D): Object3D
createPart(name, geo, mat, opts): void  // AUTO-ADDS to parent! Do NOT call .add() on it

// createPart usage - it automatically adds to parent:
createPart("Name", geometry, material, { position: [x,y,z], parent: parentObj });
// WRONG: parent.add(createPart(...))  // DO NOT DO THIS
// RIGHT: createPart("Name", geo, mat, { parent: parentObj });  // auto-adds

// Geometry
boxGeo(width, height, depth)
sphereGeo(radius, widthSegs=8, heightSegs=6)
cylinderGeo(radiusTop, radiusBot, height, segments=8)
coneGeo(radius, height, segments=8)
capsuleGeo(radius, height, segments=6)
torusGeo(radius, tube, radialSegs=8, tubularSegs=12)
planeGeo(width, height, widthSegs=1, heightSegs=1)

// Materials
gameMaterial(0xcolor, {metalness?, roughness?, emissive?, flatShading?})
lambertMaterial(0xcolor, {flatShading?, emissive?})
glassMaterial(0xcolor, {opacity?, roughness?, metalness?})  // transparent, DoubleSide - cockpits, windows

// Animation - IMPORTANT: keyframes use "rotation" or "position" keys, NOT "value"
rotationTrack(jointName: string, keyframes: [{time, rotation: [x,y,z]}])  // rotation in DEGREES
positionTrack(jointName: string, keyframes: [{time, position: [x,y,z]}])
createClip(name: string, duration: number, tracks: Track[])
spinAnimation(jointName, duration, axis: 'x'|'y'|'z')  // returns a clip
bobbingAnimation(rootName, duration, height)           // returns a clip

// animate() must return an ARRAY of clips
function animate(root) { return [clip1, clip2]; }
</api>

<architecture>
Use Pivot+Mesh pattern for animated parts:
- Joint_* = pivot node (animate this) - created by createPivot or createPart with pivot:true
- Mesh_* = geometry node (child of pivot)

For animations, track names must use "Joint_" prefix:
- createPivot("Body", ...) creates "Joint_Body" - animate with rotationTrack("Joint_Body", ...)
- createPart("Wheel", ..., {pivot: true}) creates "Joint_Wheel" - animate it
</architecture>

<quality>
- Give your asset personality and character
- Use appropriate level of detail for the category
- Colors should be cohesive and intentional
- Animations should feel natural and loop seamlessly
- Name parts descriptively (Body, LeftArm, Wheel)
</quality>

<rules>
- Colors as hex: 0xff0000
- Y-up, ground at Y=0
- Animate pivots only (Joint_* names)
- Loops: end keyframe = start keyframe
- Track names: "Joint_Name" format (must exist in scene)
- animate() MUST return an ARRAY: return [clip]
- createClip needs 3 args: createClip(name, duration, tracks)
- NO "export" statements - just define meta, build, animate
- Output ONLY valid JavaScript code (no TypeScript types)
- NEVER call .add() on createPart result - it auto-adds to parent
- Z-FIGHTING PREVENTION: No two mesh faces may be coplanar or near-coplanar. All decorative geometry (decals, markings, edge strips, reinforcements, trim) must be fully outside the parent mesh - never intersecting or flush. Offset at least 0.01 from the nearest surface. If a box is 0.6 wide (edges at x=+-0.3), place edge trim at x=+-0.31, NOT x=+-0.29. Minimum 0.01 thickness for flat parts.
</rules>

<critical-animation-format>
WRONG: { time: 0, value: [0,0,0] }
RIGHT: { time: 0, rotation: [0,0,0] } for rotationTrack (degrees)
RIGHT: { time: 0, position: [0,0,0] } for positionTrack
</critical-animation-format>

<example>
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
</example>`;

// =============================================================================
// Prompt Helpers
// =============================================================================

export interface AssetBudget {
  maxTriangles?: number;
  maxMaterials?: number;
}

export interface KilnGenerateRequest {
  prompt: string;
  mode: RenderMode;
  category: AssetCategory;
  style?: AssetStyle;
  budget?: AssetBudget;
  includeAnimation?: boolean;
  existingCode?: string;
  referenceImageUrl?: string;
}

export function getSystemPrompt(mode: RenderMode): string {
  // Spike only supports GLB mode; tsl/both fall back to GLB so future callers
  // don't throw. W2 will pull the real TSL / Both prompts.
  void mode;
  return KILN_SYSTEM_PROMPT;
}

export function buildUserPrompt(request: KilnGenerateRequest): string {
  const parts: string[] = [];

  if (request.style && STYLE_TEMPLATES[request.style]) {
    parts.push(STYLE_TEMPLATES[request.style]);
    parts.push('');
  }

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

  if (request.existingCode) {
    parts.push(`## Current Code\n\n\`\`\`typescript\n${request.existingCode}\n\`\`\`\n\n## Edit Request\n\n${request.prompt}`);
  } else {
    parts.push(`## Task\n\nCreate a ${request.category}: ${request.prompt}`);
  }

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

  parts.push('\n\nGenerate the complete code.');

  return parts.join('\n');
}

import { KILN_ASSET_FRAME } from '../contracts';
import { STYLE_TEMPLATES, type AssetStyle } from '../authoring-style';
import type { RequirementsContext } from '../requirements-context';

/** Compact native bootstrap. Domain recipes and signatures come from Discovery. */
export const NATIVE_SYSTEM_PROMPT = `You build and refine exportable 3D assets using Kiln.
The built-in kiln-native-workflow skill explains this harness and repair workflow; consult it when needed. When configured, kiln-modeling-references lists technical documents available through kiln_skill_resource. Read only documents needed for the current step. Reuse loaded contracts and reference spans; use nextOffset for unread continuations instead of reading the same prefix again. The native terminal is kiln_finish; the host delivers its retained source and GLB.
Use kiln_discover to find relevant geometry, parts, recipes, materials and helpers. Search ordinary descriptive words; fetch unfamiliar contracts together with ids from the results. Start building once the next construction step is supported; return to Discovery for a specific missing capability or repair. Recipes guide construction and do not restrict what you can build. No category declaration is required.
The source defines const meta = { name: "AssetName" } and function build() returning a root from createRoot. Use async build() for awaited geometry helpers. Optional animate(root) returns an ARRAY of animation clips. Documented helpers and THREE are sandbox globals; do not import/export, access host globals/network/files, use eval/Function or constructor chains.
The canonical frame is ${KILN_ASSET_FRAME.forward} forward, ${KILN_ASSET_FRAME.up} up, ${KILN_ASSET_FRAME.right} right. Ground datum is Y=${KILN_ASSET_FRAME.groundY}. Follow the user's intended placement and host requirements. createPart(name, geometry, material, {parent, position, rotation, scale}) attaches to parent itself; its rotation option is degrees, direct THREE rotations are radians.
Build and inspect a complete first candidate, then improve specific defects. Keep its programRef distinct from any diagnostic experiment. Use a small experiment when it answers a concrete uncertainty, apply the result to the asset, and return to reviewing that asset before further experiments. The latest successful render may be a probe, not the requested deliverable.
Send new source through kiln_render to execute and view it; use kiln_validate separately when syntax or sandbox legality is uncertain. Reuse the returned immutable programRef. kiln_source reads exact source for edit anchors. kiln_edit applies atomic exact-string replacements to a specific revision and returns a NEW programRef. Failed edits leave the original revision intact. A whole-source rewrite is a new revision through kiln_render.
kiln_validate checks syntax/sandbox only. kiln_render builds the asset, reports QA and part paths, and shows images. Inspect proportions, silhouette, part contact and openings; use kiln_inspect, animation or interior views when useful. Check viewFidelity: geometry-flat images cannot prove materials. QA acceptance and visual judgment are separate; unresolved requested checks remain incomplete. Fix actionable problems, render the corrected revision, and review its results.
Finish with kiln_finish({programRef}) ALONE in its tool batch, selecting an exact successfully rendered revision. The returned artifact is exactly that evaluated revision. Do not emit source as a final text answer. Never claim that an older image reviews a newer revision. Do not add unrelated scenery or enforce recipe assumptions that conflict with the brief.`;

export function nativeUserPrompt(options: {
  prompt: string;
  requirements: RequirementsContext;
  existingProgramRef?: string;
  originalPrompt?: string;
  style?: AssetStyle;
  includeAnimation?: boolean;
  exemplarCode?: string;
  inputImage?: unknown;
  requiredProceduralTextureUsages?: readonly string[];
}): string {
  const parts = [options.prompt.trim() || 'Build the asset shown in the attached reference.'];
  if (options.existingProgramRef)
    parts.push(
      `Refine the retained revision ${options.existingProgramRef}. Read it with kiln_source; preserve features unrelated to the requested changes.`,
      ...(options.originalPrompt ? [`Original request: ${options.originalPrompt}`] : []),
    );
  else if (options.exemplarCode)
    parts.push(
      `Style reference source (do not confuse it with the requested asset):\n${options.exemplarCode}`,
    );
  if (options.style) parts.push(STYLE_TEMPLATES[options.style]);
  if (options.includeAnimation) parts.push('Include and review animation that suits the brief.');
  if (options.inputImage)
    parts.push(
      'A reference image is attached. Compare shape, proportions and attachments first; do not turn its lighting or backdrop into asset geometry.',
    );
  if (options.requiredProceduralTextureUsages?.length)
    parts.push(
      `Required baked procedural texture usages: ${options.requiredProceduralTextureUsages.join(', ')}. Bind each through pbrMaterial and verify the material contract in render results.`,
    );
  parts.push(
    `Host requirements (source metadata cannot change these):\n${JSON.stringify(options.requirements)}`,
  );
  return parts.join('\n\n');
}

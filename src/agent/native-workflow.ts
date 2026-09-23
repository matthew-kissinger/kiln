import { Skill } from '@strands-agents/sdk/vended-plugins/skills';

export const NATIVE_WORKFLOW_SKILL_NAME = 'kiln-native-workflow';

/** Harness-owned guidance, deliberately outside the shared workspace skills. */
export function nativeWorkflowSkill(): Skill {
  return new Skill({
    name: NATIVE_WORKFLOW_SKILL_NAME,
    description:
      'Understand the built-in Kiln Strands harness: retained source revisions, tool-result recovery, image review and exact-artifact completion. Consult when the native workflow is unclear or a repair loop stalls.',
    instructions: `# Native Kiln workflow

You are the asset author inside Kiln's Strands loop. The host supplies the brief, requirements, tools and output handling. Core tools provide no shell or general workspace file reader. Additional host tools, if present, have their own contracts. Geometry/material knowledge comes from kiln_discover and configured technical references; this skill does not define alternate helpers or modeling categories.

## Discover and construct
Use ordinary-language Discovery queries to choose relevant operations. Search results are summaries; fetch the selected unfamiliar contracts with ids, including execution mode, return type and example. Reuse contracts already loaded. When configured, kiln-modeling-references lists technical documents and kiln_skill_resource reads them. kiln_source reads YOUR retained program by programRef. A programRef is never a skill resource path.

Send new source through kiln_render to build and view it, or kiln_validate when checking syntax first. Validation alone does not execute geometry or establish an artifact. The first default render supplies views and real part paths; choose local captures from those paths. An unavailable part path should not be guessed from the source name.

Keep the deliverable's current programRef separate from a diagnostic probe. A focused experiment can resolve an uncertain helper, material or mapping behavior; use its result to improve the asset, then review the asset again. Repeated syntax checks or a sequence of isolated experiments do not advance the deliverable by themselves. If a detail remains blocked, retain the working asset and explain that limitation rather than presenting the probe as the requested result.

## Recover using the result that failed
An input-schema error means correct that tool's arguments. An execution rejection means repair source using the diagnostic and relevant helper contract. A QA blocker means address the reported asset requirement. Changing camera settings cannot fix a source execution rejection or missing geometry data. When no repair diagnostic identifies the cause, check the source and exact contracts instead of repeatedly submitting the same revision.

kiln_edit is an atomic batch against one immutable revision. If ok is false, none of its replacements were applied: keep that programRef and use failedEdit plus kiln_source to obtain the exact anchor. Prefer a small changed span over copying unrelated code into a replacement. If ok is true, retain the NEW programRef even when render.ok is false; the source changed but its build still needs repair. Do not reintroduce an already repaired defect by rewriting from an older revision. A deliberate whole-source rewrite is allowed through kiln_render when that is clearer.

## Review and finish
Inspect the actual returned images and viewFidelity, then use relevant part, interior, motion or numeric inspection for the brief. A failed render has no image to review. Structural acceptance and visual quality are separate. Review edit preservation evidence, including separate animation changes, before claiming unrelated features were preserved. Inspect protected subtrees or remaining pages where needed. For requested repeating motion, loopClosure reports endpoint gaps; closed endpoints alone do not prove smooth motion. Disclose unverified checks.

Select the exact reviewed programRef with kiln_finish({programRef}), alone in its tool batch. The host returns that retained source and GLB and handles delivery. If a blocker persists, report it honestly; plain text, a syntax-valid program or an older render is not a finished asset.
`,
  });
}

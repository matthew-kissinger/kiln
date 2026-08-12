/**
 * Prompt builder coverage (W7.3)
 *
 * `buildUserPrompt()` carries several conditional branches (style
 * template, budget block, existing-code edit framing, no-animation
 * flag) that weren't exercised by the spike test. `getSystemPrompt()`
 * also has three modes - GLB, TSL, BOTH - and only one was hit before.
 */

import { describe, expect, test } from 'bun:test';

import {
  buildUserPrompt,
  getSystemPrompt,
  STYLE_TEMPLATES,
  KILN_SYSTEM_PROMPT,
  KILN_TSL_SYSTEM_PROMPT,
  KILN_BOTH_SYSTEM_PROMPT,
  KILN_REFINE_DIRECTIVE,
  ARCHITECTURE_CONTEXT,
  ARCHITECTURE_RIDGE_X_SCAFFOLD,
  ARCHITECTURE_RIDGE_Z_SCAFFOLD,
  ARCHITECTURE_PANEL_DIRECTION_ANTI_EXAMPLE,
  PROP_CONTEXT,
  ENVIRONMENT_CONTEXT,
  VEGETATION_CONTEXT,
  VFX_CONTEXT,
  KILN_API_SECTION,
  KILN_API_SECTION_UNIFIED,
  KILN_VISUAL_QA_UNIFIED,
  KILN_REFINE_DIRECTIVE_UNIFIED,
  KILN_EDIT_DIRECTIVE_UNIFIED,
  KILN_COORDINATE_CONTRACT,
  KILN_AUTHORING_STRATEGY,
  KILN_REFERENCE_IMAGE_DIRECTIVE,
  KILN_REFERENCE_IMAGE_DIRECTIVE_UNIFIED,
} from '../prompt';
import { KILN_ASSET_FRAME, createAssetIntentV1 } from '../contracts';

describe('getSystemPrompt', () => {
  test('coordinate prompt derives from the canonical engine frame', () => {
    expect(KILN_COORDINATE_CONTRACT).toContain(`${KILN_ASSET_FRAME.forward} = forward`);
    expect(KILN_COORDINATE_CONTRACT).toContain(`${KILN_ASSET_FRAME.up} = up`);
    expect(KILN_COORDINATE_CONTRACT).toContain(`${KILN_ASSET_FRAME.right} = asset right`);
    expect(KILN_COORDINATE_CONTRACT).toContain(`Y=${KILN_ASSET_FRAME.groundY}`);
  });

  test('returns the GLB prompt for mode=glb', () => {
    expect(getSystemPrompt('glb')).toBe(KILN_SYSTEM_PROMPT);
  });

  test('coordinates the new geometry and portable material vocabulary without prescribing every asset', () => {
    expect(KILN_AUTHORING_STRATEGY).toContain('roundedBoxGeo');
    expect(KILN_AUTHORING_STRATEGY).toContain('extrudeProfile');
    expect(KILN_AUTHORING_STRATEGY).toContain('revolveProfile');
    expect(KILN_AUTHORING_STRATEGY).toContain(
      'proceduralTexture({ schemaVersion: 2, ... }) is the strict portable texture DSL',
    );
    expect(KILN_AUTHORING_STRATEGY).toContain(
      'no callbacks, shader source, URLs, filesystem paths',
    );
    expect(KILN_AUTHORING_STRATEGY).toContain('baked into the GLB');
    expect(KILN_AUTHORING_STRATEGY).toContain('Do not replace a simple primitive');
    expect(getSystemPrompt('glb')).toContain(KILN_AUTHORING_STRATEGY);
  });

  test('returns the TSL prompt for mode=tsl', () => {
    expect(getSystemPrompt('tsl')).toBe(KILN_TSL_SYSTEM_PROMPT);
  });

  test('returns the combined prompt for mode=both', () => {
    expect(getSystemPrompt('both')).toBe(KILN_BOTH_SYSTEM_PROMPT);
  });
});

describe('STYLE_TEMPLATES', () => {
  test('exposes a non-empty template for every supported style', () => {
    for (const style of ['low-poly', 'stylized', 'voxel', 'detailed', 'realistic'] as const) {
      expect(STYLE_TEMPLATES[style]).toBeDefined();
      expect(STYLE_TEMPLATES[style].length).toBeGreaterThan(20);
    }
  });
});

describe('buildUserPrompt', () => {
  test('includes the chosen style template at the top of the prompt', () => {
    const prompt = buildUserPrompt({
      prompt: 'thing',
      mode: 'glb',
      category: 'prop',
      style: 'voxel',
    });
    expect(prompt).toContain(STYLE_TEMPLATES['voxel']);
    // Style block must be before the task block.
    expect(prompt.indexOf(STYLE_TEMPLATES['voxel'])).toBeLessThan(prompt.indexOf('## Task'));
  });

  test('emits budget constraints when budget is provided', () => {
    const prompt = buildUserPrompt({
      prompt: 'thing',
      mode: 'glb',
      category: 'prop',
      budget: { maxTriangles: 1500, maxMaterials: 4 },
    });
    expect(prompt).toContain('## Constraints');
    expect(prompt).toContain('Triangle budget: 1500');
    expect(prompt).toContain('Material limit: 4');
  });

  test('skips budget block when no budget set', () => {
    const prompt = buildUserPrompt({ prompt: 'p', mode: 'glb', category: 'prop' });
    expect(prompt).not.toContain('## Constraints');
  });

  test('emits an Edit Request framing when existingCode is provided', () => {
    const prompt = buildUserPrompt({
      prompt: 'add a hat',
      mode: 'glb',
      category: 'character',
      existingCode: 'const meta = {};',
    });
    expect(prompt).toContain('## Current Code');
    expect(prompt).toContain('## Edit Request');
    expect(prompt).toContain('add a hat');
    expect(prompt).toContain('const meta = {};');
    // No "Create a ..." framing when editing.
    expect(prompt).not.toContain('## Task');
  });

  test('emits the standard Task framing when there is no existingCode', () => {
    const prompt = buildUserPrompt({
      prompt: 'red barrel',
      mode: 'glb',
      category: 'prop',
    });
    expect(prompt).toContain('## Task');
    expect(prompt).toContain('Create a prop: red barrel');
  });

  test('appends the architecture directive on a fresh architecture generation', () => {
    const prompt = buildUserPrompt({
      prompt: 'a stone watchtower',
      mode: 'glb',
      category: 'architecture',
    });
    expect(prompt).toContain('Create a architecture: a stone watchtower');
    expect(prompt).toContain(ARCHITECTURE_CONTEXT);
    // Guidance comes after the task line.
    expect(prompt.indexOf('## Task')).toBeLessThan(prompt.indexOf(ARCHITECTURE_CONTEXT));
  });

  test('the architecture directive names the interior-QA tool + the Roof part', () => {
    expect(ARCHITECTURE_CONTEXT).toContain('kiln_view_interior');
    expect(ARCHITECTURE_CONTEXT).toContain('Roof');
  });

  test('architecture context carries exactly one executable scaffold per ridge axis and one panel anti-example', () => {
    expect(ARCHITECTURE_CONTEXT.split(ARCHITECTURE_RIDGE_X_SCAFFOLD)).toHaveLength(2);
    expect(ARCHITECTURE_CONTEXT.split(ARCHITECTURE_RIDGE_Z_SCAFFOLD)).toHaveLength(2);
    expect(ARCHITECTURE_CONTEXT.split(ARCHITECTURE_PANEL_DIRECTION_ANTI_EXAMPLE)).toHaveLength(2);
    expect(ARCHITECTURE_RIDGE_X_SCAFFOLD).toContain("ridgeAxis: 'x'");
    expect(ARCHITECTURE_RIDGE_Z_SCAFFOLD).toContain("ridgeAxis: 'z'");
    expect(ARCHITECTURE_PANEL_DIRECTION_ANTI_EXAMPLE).toContain('WRONG:');
    expect(ARCHITECTURE_PANEL_DIRECTION_ANTI_EXAMPLE).toContain('ridge to eave');
  });

  test('does not append the architecture directive for other categories', () => {
    const prompt = buildUserPrompt({ prompt: 'a barrel', mode: 'glb', category: 'prop' });
    expect(prompt).not.toContain(ARCHITECTURE_CONTEXT);
    expect(prompt).not.toContain(ARCHITECTURE_RIDGE_X_SCAFFOLD);
    expect(prompt).not.toContain(ARCHITECTURE_RIDGE_Z_SCAFFOLD);
  });

  test('CHAR-031 injects only the resolved character body-plan recipe', () => {
    const dog = buildUserPrompt({
      prompt: 'a dog',
      mode: 'glb',
      category: 'character',
      intent: createAssetIntentV1({ category: 'character', subtype: 'quadruped' }),
    });
    expect(dog).toContain('Resolved body plan: QUADRUPED');
    expect(dog).not.toContain('Resolved body plan: BIPED');
    expect(dog).not.toContain('Resolved body plan: SERPENTINE');

    const serpent = buildUserPrompt({
      prompt: 'a serpent',
      mode: 'glb',
      category: 'character',
      intent: createAssetIntentV1({ category: 'character', subtype: 'serpentine' }),
    });
    expect(serpent).toContain('Resolved body plan: SERPENTINE');
    expect(serpent.toLowerCase()).not.toContain('knee');
  });

  test('appends the per-category rig context for prop / environment / vfx', () => {
    const prop = buildUserPrompt({ prompt: 'a treasure chest', mode: 'glb', category: 'prop' });
    expect(prop).toContain(PROP_CONTEXT);
    expect(prop.indexOf('## Task')).toBeLessThan(prop.indexOf(PROP_CONTEXT));
    const env = buildUserPrompt({ prompt: 'a palm frond', mode: 'glb', category: 'environment' });
    expect(env).toContain(ENVIRONMENT_CONTEXT);
    const vfx = buildUserPrompt({ prompt: 'a magic pulse ring', mode: 'glb', category: 'vfx' });
    expect(vfx).toContain(VFX_CONTEXT);
    // Each category gets only its own block, never another's.
    expect(prop).not.toContain(VFX_CONTEXT);
    expect(env).not.toContain(PROP_CONTEXT);
  });

  test('injects trusted W7 scope, modular grid, and VFX contracts into fresh prompts only', () => {
    const modularIntent = createAssetIntentV1({
      category: 'environment',
      subtype: 'modular-wall',
      scope: { scope: 'modularSet', explicit: true },
      modular: { grid: [2, 1, 2], units: 'm' },
    });
    const modular = buildUserPrompt({
      prompt: 'a modular stone wall kit',
      mode: 'glb',
      category: 'environment',
      intent: modularIntent,
    });
    expect(modular).toContain('## Resolved Asset Scope');
    expect(modular).toContain('trusted 2x1x2 m grid');
    expect(modular).toContain('reciprocal compatibleTypes');
    expect(modular).toContain('explicit allowedRotationsDegrees');
    expect(modular).toContain('Do not encode the grid in arbitrary userData');

    const vfxIntent = createAssetIntentV1({ category: 'vfx', subtype: 'billboard' });
    const vfx = buildUserPrompt({
      prompt: 'soft smoke billboard',
      mode: 'glb',
      category: 'vfx',
      intent: vfxIntent,
    });
    expect(vfx).toContain('## Resolved VFX Contract');
    expect(vfx).toContain('portability=portable');
    expect(vfx).toContain('mode=camera-spherical');
    expect(vfx).toContain('real alpha data');
    expect(vfx).toContain('vfx.effect.surface.<card|beam|trail|volume|core>');

    const refine = buildUserPrompt({
      prompt: 'make the stones darker',
      mode: 'glb',
      category: 'environment',
      intent: modularIntent,
      existingCode: 'function build() { return createRoot("WallKit"); }',
    });
    expect(refine).not.toContain('## Resolved Asset Scope');
    expect(refine).not.toContain('trusted 2x1x2 m grid');
  });

  test('VEG-018 injects only resolved vegetation structure and material-mode guidance', () => {
    const rich = buildUserPrompt({
      prompt: 'a lush oak',
      mode: 'glb',
      category: 'vegetation',
      intent: createAssetIntentV1({
        category: 'vegetation',
        vegetation: { subtype: 'tree', growthState: 'lush' },
        material: { mode: 'pbrRecipe' },
      }),
    });
    expect(rich).toContain(VEGETATION_CONTEXT);
    expect(rich).toContain('Growth form: tree; state: lush; canopy profile: broadleaf');
    expect(rich).toContain('two to six restrained foliage value roles');
    expect(rich).toContain("materialRecipe('kiln.material.leaf.v1'");
    expect(rich).not.toContain('taperedBranchGeo');

    const optimized = buildUserPrompt({
      prompt: 'an optimized shrub',
      mode: 'glb',
      category: 'vegetation',
      intent: createAssetIntentV1({
        category: 'vegetation',
        vegetation: { subtype: 'shrub' },
        material: { mode: 'flatOptimized' },
      }),
    });
    expect(optimized).toContain('Use one coherent foliage value role.');
    expect(optimized).not.toContain('## Portable material recipes');
  });

  test('per-category rig context is dropped when refining (existingCode set)', () => {
    const prompt = buildUserPrompt({
      prompt: 'open the lid',
      mode: 'glb',
      category: 'prop',
      existingCode: 'function build() { return createRoot("Chest"); }',
    });
    expect(prompt).not.toContain(PROP_CONTEXT);
    expect(prompt).toContain('## Edit Request');
  });

  test('does not append the architecture directive when refining (existingCode set)', () => {
    const prompt = buildUserPrompt({
      prompt: 'add a second floor',
      mode: 'glb',
      category: 'architecture',
      existingCode: 'function build() { return createRoot("Tower"); }',
    });
    expect(prompt).not.toContain(ARCHITECTURE_CONTEXT);
    expect(prompt).not.toContain(ARCHITECTURE_RIDGE_X_SCAFFOLD);
    expect(prompt).not.toContain(ARCHITECTURE_RIDGE_Z_SCAFFOLD);
    expect(prompt).toContain('## Edit Request');
  });

  test('prepends an Original Request section (intent -> code -> edit order) when refining', () => {
    const prompt = buildUserPrompt({
      prompt: 'make the barrel taller',
      mode: 'glb',
      category: 'prop',
      existingCode: 'const meta = {};',
      originalPrompt: 'a wooden barrel',
    });
    // All three refine sections are present...
    expect(prompt).toContain('## Original Request');
    expect(prompt).toContain('## Current Code');
    expect(prompt).toContain('## Edit Request');
    // ...the original intent and the edit instruction are both carried...
    expect(prompt).toContain('a wooden barrel');
    expect(prompt).toContain('make the barrel taller');
    // ...and they appear in intent -> code -> edit order, with no fresh-gen framing.
    expect(prompt.indexOf('## Original Request')).toBeLessThan(prompt.indexOf('## Current Code'));
    expect(prompt.indexOf('## Current Code')).toBeLessThan(prompt.indexOf('## Edit Request'));
    expect(prompt).not.toContain('## Task');
  });

  test('omits the Original Request section when refining without originalPrompt', () => {
    const prompt = buildUserPrompt({
      prompt: 'add a hat',
      mode: 'glb',
      category: 'character',
      existingCode: 'const meta = {};',
    });
    expect(prompt).not.toContain('## Original Request');
    expect(prompt).toContain('## Current Code');
    expect(prompt).toContain('## Edit Request');
  });

  test('ignores originalPrompt entirely for fresh generation (no existingCode)', () => {
    const prompt = buildUserPrompt({
      prompt: 'red barrel',
      mode: 'glb',
      category: 'prop',
      originalPrompt: 'should be ignored',
    });
    expect(prompt).not.toContain('## Original Request');
    expect(prompt).not.toContain('should be ignored');
    expect(prompt).toContain('## Task');
    expect(prompt).toContain('Create a prop: red barrel');
  });

  test('omits both animation blocks when refining so the edit request governs', () => {
    // includeAnimation defaults to "on", but a refine must not force an animate()
    // function onto an asset the edit did not ask to animate (and vice versa).
    const prompt = buildUserPrompt({
      prompt: 'make the lid open',
      mode: 'glb',
      category: 'prop',
      existingCode: 'function build() { return createRoot("x"); }',
      originalPrompt: 'a treasure chest',
    });
    expect(prompt).not.toContain('## Animation Requirements');
    expect(prompt).not.toContain('## No Animation');
  });

  test('emits the No Animation block when includeAnimation=false', () => {
    const prompt = buildUserPrompt({
      prompt: 'static prop',
      mode: 'glb',
      category: 'prop',
      includeAnimation: false,
    });
    expect(prompt).toContain('## No Animation');
    expect(prompt).not.toContain('Animation Requirements');
  });

  test('emits the Animation Requirements block by default', () => {
    const prompt = buildUserPrompt({
      prompt: 'animated prop',
      mode: 'glb',
      category: 'prop',
    });
    expect(prompt).toContain('## Animation Requirements');
  });
});

describe('KILN_REFINE_DIRECTIVE', () => {
  test('is a non-empty editor-framing directive that points at the refine sections', () => {
    expect(KILN_REFINE_DIRECTIVE.length).toBeGreaterThan(40);
    expect(KILN_REFINE_DIRECTIVE).toContain('MODIFYING');
    expect(KILN_REFINE_DIRECTIVE).toContain('Edit Request');
    expect(KILN_REFINE_DIRECTIVE).toContain('kiln_submit');
  });
});

describe('unified tool surface prompt', () => {
  test('toolSurface:unified swaps in the examples-folded api and the unified visual-qa', () => {
    const unified = getSystemPrompt('glb', { toolSurface: 'unified' });
    expect(unified).not.toBe(KILN_SYSTEM_PROMPT);
    expect(unified).toContain(KILN_API_SECTION_UNIFIED);
    expect(unified).toContain(KILN_VISUAL_QA_UNIFIED);
    // The non-examples api block and the legacy verb sentence are gone.
    expect(unified).not.toContain(KILN_API_SECTION);
    expect(unified).not.toContain('Before kiln_submit, call kiln_screenshot');
  });

  test('the unified visual-qa nudges the interior view for buildings', () => {
    expect(KILN_VISUAL_QA_UNIFIED).toContain('kiln_view_interior');
    expect(KILN_VISUAL_QA_UNIFIED).toContain('BUILDING');
  });

  test('the unified vision loop explains bounded captures and object-relative orbit inspection', () => {
    expect(KILN_VISUAL_QA_UNIFIED).toContain('default 3x2 capture');
    expect(KILN_VISUAL_QA_UNIFIED).toContain('bounded custom capture.cells');
    expect(KILN_VISUAL_QA_UNIFIED).toContain('azimuthDeg/elevationDeg');
    expect(KILN_VISUAL_QA_UNIFIED).toContain('object-relative angle');
  });

  test('unified takes precedence over apiSurface:trimmed (which points at the removed list tool)', () => {
    expect(getSystemPrompt('glb', { toolSurface: 'unified', apiSurface: 'trimmed' })).toBe(
      getSystemPrompt('glb', { toolSurface: 'unified' }),
    );
  });

  test('default (current) surface is unchanged', () => {
    expect(getSystemPrompt('glb')).toBe(KILN_SYSTEM_PROMPT);
    expect(getSystemPrompt('glb', { toolSurface: 'current' })).toBe(KILN_SYSTEM_PROMPT);
  });

  test('unified directives use kiln_finalize / kiln_render, never kiln_submit / kiln_screenshot', () => {
    expect(KILN_REFINE_DIRECTIVE_UNIFIED).toContain('kiln_finalize');
    expect(KILN_REFINE_DIRECTIVE_UNIFIED).toContain('MODIFYING');
    expect(KILN_REFINE_DIRECTIVE_UNIFIED).not.toContain('kiln_submit');
    expect(KILN_REFINE_DIRECTIVE_UNIFIED).not.toContain('kiln_screenshot');

    expect(KILN_EDIT_DIRECTIVE_UNIFIED).toContain('kiln_finalize');
    expect(KILN_EDIT_DIRECTIVE_UNIFIED).toContain('kiln_edit');
    expect(KILN_EDIT_DIRECTIVE_UNIFIED).toContain('kiln_draft');
    expect(KILN_EDIT_DIRECTIVE_UNIFIED).not.toContain('kiln_submit');
    expect(KILN_EDIT_DIRECTIVE_UNIFIED).not.toContain('kiln_screenshot');
  });
});

describe('reference-image grounding', () => {
  test('requires comparison-driven iteration in both tool vocabularies', () => {
    for (const directive of [
      KILN_REFERENCE_IMAGE_DIRECTIVE,
      KILN_REFERENCE_IMAGE_DIRECTIVE_UNIFIED,
    ]) {
      expect(directive).toContain('primary visual evidence');
      expect(directive).toContain('silhouette and proportions');
      expect(directive).toContain('part attachment/contact');
      expect(directive).toContain('material boundaries and surface-detail scale');
      expect(directive).toContain('highest-impact visible mismatch');
      expect(directive).toContain('lighting, backdrop, or camera distortion');
    }
    expect(KILN_REFERENCE_IMAGE_DIRECTIVE).toContain('kiln_screenshot');
    expect(KILN_REFERENCE_IMAGE_DIRECTIVE_UNIFIED).toContain('kiln_render');
    expect(KILN_REFERENCE_IMAGE_DIRECTIVE_UNIFIED).toContain('kiln_inspect');
  });
});

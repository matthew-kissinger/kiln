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
} from '../prompt';

describe('getSystemPrompt', () => {
  test('returns the GLB prompt for mode=glb', () => {
    expect(getSystemPrompt('glb')).toBe(KILN_SYSTEM_PROMPT);
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

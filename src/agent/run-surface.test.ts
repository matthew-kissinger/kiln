/**
 * Tool-surface resolution + assembly (the flag-gating seam of runKilnAgent).
 * buildAgentTools is a pure function of (surface, opts), so the exact tool sets
 * each surface exposes are unit-testable without a live model. resolveToolSurface
 * covers the option > env > default('current') precedence.
 *
 * Imports from ./surface (not ./run) on purpose: generate.test.ts mock.modules
 * './run', and these helpers must stay reachable in a shared test process.
 */
import { describe, expect, test } from 'bun:test';

import { buildAgentTools, resolveToolSurface, type ToolBuildOptions } from './surface';
import type { SubmitSink, EditSink, UnifiedSink } from './tools';

function freshSinks() {
  return {
    sink: {} as SubmitSink,
    editSink: { edits: [] } as EditSink,
    unifiedSink: { edits: [] } as UnifiedSink,
  };
}

const base: ToolBuildOptions = {};
const names = (tools: ReturnType<typeof buildAgentTools>) => tools.map((t) => t.name);

const UNIFIED = [
  'kiln_draft',
  'kiln_view',
  'kiln_edit',
  'kiln_validate',
  'kiln_render',
  'kiln_screenshot_animation',
  'kiln_view_interior',
  'kiln_finalize',
];
const CURRENT_GEN = [
  'kiln_list_primitives',
  'kiln_validate',
  'kiln_render',
  'kiln_screenshot',
  'kiln_screenshot_animation',
  'kiln_submit',
];
const CURRENT_EDIT = [
  'kiln_list_primitives',
  'kiln_view',
  'kiln_edit',
  'kiln_validate',
  'kiln_render',
  'kiln_screenshot',
  'kiln_screenshot_animation',
  'kiln_submit',
];

describe('buildAgentTools', () => {
  test('unified surface -> the eight buffer tools (fresh generate, empty seed)', () => {
    expect(names(buildAgentTools('unified', base, freshSinks()))).toEqual(UNIFIED);
  });

  test('unified surface -> the same eight tools when refining (seeded buffer)', () => {
    const opts = { ...base, existingCode: 'const meta = {};', refineMode: 'edit' as const };
    expect(names(buildAgentTools('unified', opts, freshSinks()))).toEqual(UNIFIED);
  });

  test('current surface, fresh generate -> the five generate tools', () => {
    expect(names(buildAgentTools('current', base, freshSinks()))).toEqual(CURRENT_GEN);
  });

  test('current surface, refine in edit mode -> the seven edit-mode tools', () => {
    const opts = { ...base, existingCode: 'const meta = {};', refineMode: 'edit' as const };
    expect(names(buildAgentTools('current', opts, freshSinks()))).toEqual(CURRENT_EDIT);
  });

  test('current surface, refine in rewrite mode -> the five generate tools (no edit tools)', () => {
    const opts = { ...base, existingCode: 'const meta = {};', refineMode: 'rewrite' as const };
    expect(names(buildAgentTools('current', opts, freshSinks()))).toEqual(CURRENT_GEN);
  });
});

describe('resolveToolSurface', () => {
  test('an explicit option always wins', () => {
    expect(resolveToolSurface('unified')).toBe('unified');
    expect(resolveToolSurface('current')).toBe('current');
  });

  test('falls back to KILN_TOOL_SURFACE env, defaulting to current', () => {
    const prev = process.env.KILN_TOOL_SURFACE;
    try {
      delete process.env.KILN_TOOL_SURFACE;
      expect(resolveToolSurface()).toBe('current');
      process.env.KILN_TOOL_SURFACE = 'unified';
      expect(resolveToolSurface()).toBe('unified');
      process.env.KILN_TOOL_SURFACE = 'current';
      expect(resolveToolSurface()).toBe('current');
      process.env.KILN_TOOL_SURFACE = 'nonsense';
      expect(resolveToolSurface()).toBe('current'); // anything but 'unified' is current
    } finally {
      if (prev === undefined) delete process.env.KILN_TOOL_SURFACE;
      else process.env.KILN_TOOL_SURFACE = prev;
    }
  });
});

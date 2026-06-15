/**
 * Tool-surface resolution + assembly — the flag-gating seam of the Kiln agent.
 *
 * Split out from run.ts so the pure (surface, opts) -> tools mapping is unit-
 * testable in isolation, and so a test that `mock.module('./run')`s the agent
 * loop (generate.test.ts) does not also stub these helpers.
 */
import type { Tool } from '@strands-agents/sdk';

import {
  makeKilnTools,
  makeKilnEditTools,
  makeKilnUnifiedTools,
  type SubmitSink,
  type EditSink,
  type UnifiedSink,
} from './tools';

/** Which agent tool surface drives the loop. 'current' = today's
 *  list/validate/render/screenshot/submit (+ edit tools in edit-mode refine);
 *  'unified' = the buffer-based draft/view/edit/validate/render/finalize six. */
export type KilnToolSurface = 'current' | 'unified';

/** How a refine applies its change: whole-program re-emission, or surgical edits. */
export type RefineMode = 'rewrite' | 'edit';

/** The subset of run options the tool assembly reads. */
export interface ToolBuildOptions {
  existingCode?: string;
  refineMode?: RefineMode;
}

/** Per-run sinks for the three tool factories (only one is read, by surface). */
export interface AgentSinks {
  sink: SubmitSink;
  editSink: EditSink;
  unifiedSink: UnifiedSink;
}

/**
 * Resolve the tool surface at call time: the explicit option wins, else the
 * KILN_TOOL_SURFACE env var ('unified' opts in), else the safe default 'current'.
 */
export function resolveToolSurface(opt?: KilnToolSurface): KilnToolSurface {
  if (opt) return opt;
  return process.env.KILN_TOOL_SURFACE === 'unified' ? 'unified' : 'current';
}

/**
 * Build the base kiln tool list for a run (before extraTools are appended).
 * Pure function of (surface, opts):
 *   - unified  -> the 6 buffer tools (empty seed for generate, existingCode for refine)
 *   - current  -> the 5 generate tools, or the 7 edit-mode tools when refining in edit mode
 */
export function buildAgentTools(
  surface: KilnToolSurface,
  opts: ToolBuildOptions,
  sinks: AgentSinks,
): Tool[] {
  if (surface === 'unified') {
    return makeKilnUnifiedTools({
      ...(opts.existingCode ? { seedCode: opts.existingCode } : {}),
      sink: sinks.unifiedSink,
    });
  }
  const editMode = Boolean(opts.existingCode) && opts.refineMode === 'edit';
  return editMode
    ? makeKilnEditTools({ seedCode: opts.existingCode!, sink: sinks.editSink })
    : makeKilnTools(sinks.sink);
}

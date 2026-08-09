/**
 * In-process Kiln tool skin for the agnostic Strands agent foundation.
 *
 * Adapts the shared `kilnToolRegistry` (kiln/tools/registry) into Strands
 * `tool()` instances that run in the same Node realm as the agent loop, plus a
 * terminal `kiln_submit` tool the agent calls once to record its final program.
 * The registry is the single source of truth for tool names/descriptions/schemas,
 * so any other transport (e.g. an MCP skin) stays byte-for-byte consistent.
 *
 * An explicit submit tool is preferred over `structuredOutputSchema` because the
 * latter's coexistence with a full tool set is provider-dependent; a submit tool
 * is unambiguous and works across every provider.
 *
 * Three factories: {@link makeKilnTools} (the library-default `current` generate
 * surface), {@link makeKilnEditTools} (the `current` surgical-refine surface), and
 * {@link makeKilnUnifiedTools} (the buffer-based `unified` surface, selected
 * via KILN_TOOL_SURFACE='unified' — what Kiln Studio runs in prod). The first two
 * stay byte-identical so the bench baseline does not move.
 */
import { tool, ImageBlock, JsonBlock, type Tool, type JSONValue } from '@strands-agents/sdk';
import { z } from 'zod';
import type { CaptureConfig } from '../views/capture';

import {
  createKilnToolRegistry,
  createKilnInspectDef,
  createKilnRenderViewsDef,
  createKilnScreenshotAnimationDef,
  createKilnViewInteriorDef,
  inspectBufferInput,
  renderViewsBufferInput,
  type KilnToolContext,
  type KilnToolDef,
} from '../tools/registry';

/** Name of the terminal tool the agent calls to record its final program. */
export const KILN_SUBMIT_TOOL_NAME = 'kiln_submit';

/**
 * A mutable sink the `kiln_submit` tool writes the final code into. Create one
 * per run, pass it to {@link makeKilnTools}, and read `.code` after invoke.
 */
export interface SubmitSink {
  code?: string;
}

const submitInput = z.object({
  code: z
    .string()
    .describe(
      'The complete, final Kiln program (defines `meta` + `build()`, optional `animate()`). ' +
        'Call this exactly once when you are done to record your answer.',
    ),
});

/**
 * Convert a registry `run()` output into the tool-callback return value. Defs with
 * a `mediaMulti` extractor (kiln_screenshot_animation in perFrame mode) return
 * [ImageBlock×N, JsonBlock]; defs with a `media` extractor (kiln_screenshot, the
 * animation grid) return [ImageBlock, JsonBlock] so the model literally sees the
 * render; everything else passes the JSON output through unchanged. The array of
 * content blocks is a valid (if untyped) Strands callback return — the SDK's
 * tool-result coercion passes block arrays through as-is — so it is cast past
 * JSONValue.
 */
function withVisualObservation(json: unknown, visualObservation: JSONValue): JSONValue {
  if (json && typeof json === 'object' && !Array.isArray(json)) {
    return { ...(json as Record<string, JSONValue>), visualObservation } as JSONValue;
  }
  return { result: json as JSONValue, visualObservation } as JSONValue;
}

async function observedMediaResult(
  def: KilnToolDef,
  pngs: readonly Uint8Array[],
  json: unknown,
  context: KilnToolContext,
): Promise<JSONValue> {
  try {
    const value = await context.renderObservationPort!({
      toolName: def.name,
      pngs,
      json,
      ...(context.intent ? { intent: context.intent } : {}),
      ...(context.generationCallBudget
        ? { generationCallBudget: context.generationCallBudget }
        : {}),
    });
    return [
      new JsonBlock({
        json: withVisualObservation(json, { ok: true, value } as JSONValue),
      }),
    ] as unknown as JSONValue;
  } catch {
    return [
      new JsonBlock({
        json: withVisualObservation(json, {
          ok: false,
          reason: 'observer-unavailable',
        } as JSONValue),
      }),
    ] as unknown as JSONValue;
  }
}

async function toCallbackResult(
  def: KilnToolDef,
  output: unknown,
  context: KilnToolContext = {},
): Promise<JSONValue> {
  const multi = def.mediaMulti?.(output);
  if (multi) {
    if (context.renderObservationPort) {
      return observedMediaResult(def, multi.pngs, multi.json, context);
    }
    return [
      ...multi.pngs.map((png) => new ImageBlock({ format: 'png', source: { bytes: png } })),
      new JsonBlock({ json: multi.json as JSONValue }),
    ] as unknown as JSONValue;
  }
  const media = def.media?.(output);
  if (media) {
    if (context.renderObservationPort) {
      return observedMediaResult(def, [media.png], media.json, context);
    }
    return [
      new ImageBlock({ format: 'png', source: { bytes: media.png } }),
      new JsonBlock({ json: media.json as JSONValue }),
    ] as unknown as JSONValue;
  }
  return output as JSONValue;
}

/** Schema for the buffer-aware animation tool (omits `code` — it reads the working
 *  buffer). Used by the edit + unified refine surfaces. */
const animationBufferInput = z.object({
  clip: z.string().describe('The animation clip to view, by name (e.g. "walk", "attack").'),
  camera: z
    .string()
    .optional()
    .describe('Camera angle: right (default), front, back, left, top, or three-quarter.'),
  perFrame: z
    .boolean()
    .optional()
    .describe('Return separate high-res frames instead of one grid. Default false.'),
});

/** Build a buffer-aware kiln_screenshot_animation tool that runs against `getCode()`
 *  (the working buffer) instead of a `code` argument. Same behavior as the registry
 *  def otherwise; image transports attach the frame(s) via toCallbackResult. */
function makeBufferAnimationTool(
  getCode: () => string,
  def: KilnToolDef,
  context: KilnToolContext = {},
): Tool {
  return tool({
    name: def.name,
    description: `${def.description} Operates on your current working buffer (omit code).`,
    inputSchema: animationBufferInput,
    callback: async (input) => {
      const i = input as { clip: string; camera?: string; perFrame?: boolean };
      return toCallbackResult(
        def,
        await def.run({
          code: getCode(),
          clip: i.clip,
          ...(i.camera ? { camera: i.camera } : {}),
          ...(i.perFrame ? { perFrame: true } : {}),
        }),
        context,
      );
    },
  });
}

function toStrandsTool(def: KilnToolDef, context: KilnToolContext = {}): Tool {
  return tool({
    name: def.name,
    description: def.description,
    inputSchema: def.inputSchema as z.ZodType,
    callback: async (input) => toCallbackResult(def, await def.run(input), context),
  });
}

/**
 * Build the in-process tool list for an agent: the kiln registry tools
 * (list_primitives / validate / render / screenshot) plus the terminal
 * `kiln_submit` tool.
 *
 * @param sink - Receives the submitted final code. Read `sink.code` after invoke.
 */
export function makeKilnTools(sink: SubmitSink, context: KilnToolContext = {}): Tool[] {
  const kilnTools = createKilnToolRegistry(context).map((def) => toStrandsTool(def, context));
  // kiln_screenshot_animation rides alongside the four registry tools (it takes a
  // `code` arg like them) so a from-scratch animated build can SEE its motion.
  const animationTool = toStrandsTool(createKilnScreenshotAnimationDef(context), context);
  const submitTool: Tool = tool({
    name: KILN_SUBMIT_TOOL_NAME,
    description:
      'Submit your FINAL Kiln program. Call this exactly once, after you have ' +
      'validated and rendered your code, to record the answer. The argument ' +
      '`code` must be the complete program (meta + build(), optional animate()).',
    inputSchema: submitInput,
    callback: (input) => {
      sink.code = input.code;
      return { ok: true, recorded: true, bytes: input.code.length };
    },
  });
  return [...kilnTools, animationTool, submitTool];
}

// =============================================================================
// Edit-mode tool skin (surgical refine)
// =============================================================================
//
// An alternative to whole-program re-emission for REFINING an existing asset.
// Instead of re-typing the full program through `kiln_submit`, the model edits a
// working buffer seeded with the parent's code via `kiln_edit` (exact-string
// replace, like Claude Code's Edit tool). Unchanged code is guaranteed byte-for-
// byte stable, and the sequence of edits becomes a first-class diff artifact.
//
// Used only when refining in edit mode (existingCode set + refineMode='edit');
// the from-scratch generate path keeps `makeKilnTools` unchanged.

/** One applied `kiln_edit` call, recorded for provenance / the diff trace. */
export interface EditRecord {
  oldString: string;
  newString: string;
  replaceAll: boolean;
  /** How many occurrences this edit actually replaced. */
  occurrences: number;
}

/** Result of a single `kiln_edit` application (never thrown - returned to the model). */
export type EditResult =
  | { ok: true; occurrences: number; newBytes: number }
  | { ok: false; error: string; occurrences?: number; hint?: string };

/**
 * A mutable sink the edit tools write into. Create one per run with `edits: []`,
 * pass it to {@link makeKilnEditTools}, and after invoke read `.code` (the final
 * working buffer) and `.edits` (the applied edit trace).
 */
export interface EditSink {
  code?: string;
  edits: EditRecord[];
}

/**
 * The in-memory working copy of the program being authored or refined. Pure
 * string ops - no Strands / THREE involvement - so it is trivially unit-testable
 * on its own.
 *
 * Two ways to write it: {@link draft} replaces the whole buffer (the authoring
 * verb — generate starts from an empty buffer and drafts the first program),
 * and {@link apply} does a surgical exact-string edit (recorded in `edits` for
 * the refine diff). Seed defaults to empty for the from-scratch generate path;
 * pass the parent's code to seed a refine.
 */
export class KilnDraftBuffer {
  private buf: string;
  readonly edits: EditRecord[] = [];

  constructor(seedCode: string = '') {
    this.buf = seedCode;
  }

  /** The current working code. */
  get code(): string {
    return this.buf;
  }

  /** Current line count. */
  get lineCount(): number {
    return this.buf.split('\n').length;
  }

  /** Read the current buffer (raw text - exactly what `apply` matches against). */
  view(): { code: string; lines: number } {
    return { code: this.buf, lines: this.lineCount };
  }

  /**
   * Replace the entire working buffer (the authoring verb). NOT recorded as an
   * edit — drafting is wholesale authoring, not a surgical diff step. The refine
   * diff is always computed from the seed to the final buffer, so a draft is
   * captured there regardless.
   */
  draft(code: string): { ok: true; bytes: number; lines: number } {
    this.buf = code;
    return { ok: true, bytes: this.buf.length, lines: this.lineCount };
  }

  /** Apply one exact-string replacement. Mirrors the Edit tool's contract. */
  apply(input: { oldString: string; newString: string; replaceAll?: boolean }): EditResult {
    const { oldString, newString } = input;
    const replaceAll = input.replaceAll ?? false;

    if (oldString.length === 0) {
      return { ok: false, error: 'oldString must not be empty.' };
    }
    if (oldString === newString) {
      return {
        ok: false,
        error: 'oldString and newString are identical - there is nothing to change.',
      };
    }

    const occurrences = this.buf.split(oldString).length - 1;
    if (occurrences === 0) {
      return {
        ok: false,
        error: 'oldString was not found in the current code.',
        hint: 'Call kiln_view and copy an exact span (including whitespace and indentation) to edit.',
      };
    }
    if (occurrences > 1 && !replaceAll) {
      return {
        ok: false,
        occurrences,
        error: `oldString matched ${occurrences} times, so the edit is ambiguous.`,
        hint: 'Add surrounding context to make oldString unique, or set replaceAll:true to change every occurrence.',
      };
    }

    // Replace WITHOUT going through String.prototype.replace(string, string):
    // that interprets `$&` / `$1` etc. in newString. Index/splice and split/join
    // are literal.
    if (replaceAll) {
      this.buf = this.buf.split(oldString).join(newString);
    } else {
      const at = this.buf.indexOf(oldString);
      this.buf = this.buf.slice(0, at) + newString + this.buf.slice(at + oldString.length);
    }

    const applied = replaceAll ? occurrences : 1;
    this.edits.push({ oldString, newString, replaceAll, occurrences: applied });
    return { ok: true, occurrences: applied, newBytes: this.buf.length };
  }
}

/** Back-compat alias: the edit-mode refine path and external importers (kiln-studio
 *  mock, tests) still refer to this as `KilnEditBuffer`. Same class. */
export { KilnDraftBuffer as KilnEditBuffer };

const viewInput = z.object({});

const editInput = z.object({
  oldString: z
    .string()
    .describe(
      'The exact text to replace, copied verbatim from the current code (no line-number prefixes). ' +
        'Must be unique in the buffer unless replaceAll is true.',
    ),
  newString: z.string().describe('The replacement text. Must differ from oldString.'),
  replaceAll: z
    .boolean()
    .optional()
    .describe('Replace every occurrence instead of requiring a unique match. Default false.'),
});

const bufferCodeInput = z.object({
  code: z
    .string()
    .optional()
    .describe('Kiln source to check. Omit to use the current working buffer (your edited code).'),
});

const submitEditInput = z.object({
  code: z
    .string()
    .optional()
    .describe(
      'The complete final program. Omit to submit the current working buffer (your applied edits) - ' +
        'recommended. Pass a full program only to replace the buffer wholesale.',
    ),
});

/**
 * Build the edit-mode tool list for a refine run: list_primitives (as-is),
 * `kiln_view` + `kiln_edit` over a working buffer seeded with `seedCode`, plus
 * `kiln_validate` / `kiln_render` / `kiln_screenshot` / `kiln_submit` that
 * default to the buffer when their `code` arg is omitted. The buffer's live edit trace is shared into
 * `sink.edits`; `sink.code` tracks the latest buffer (so an un-submitted run
 * still captures the edits).
 */
export function makeKilnEditTools(
  opts: { seedCode: string; sink: EditSink } & KilnToolContext,
): Tool[] {
  const buffer = new KilnDraftBuffer(opts.seedCode);
  opts.sink.edits = buffer.edits; // share the live trace
  const registry = createKilnToolRegistry(opts);
  const animationDef = createKilnScreenshotAnimationDef(opts);

  const find = (name: string): KilnToolDef => {
    const def = registry.find((d) => d.name === name);
    if (!def) throw new Error(`makeKilnEditTools: missing registry tool ${name}`);
    return def;
  };
  const validateDef = find('kiln_validate');
  const renderDef = find('kiln_render');
  const screenshotDef = find('kiln_screenshot');

  const listTool = toStrandsTool(find('kiln_list_primitives'), opts);

  const viewTool: Tool = tool({
    name: 'kiln_view',
    description:
      'Read the current working code (the asset you are editing). Returns the full raw source and ' +
      'its line count. kiln_edit matches against exactly this text - copy spans from here.',
    inputSchema: viewInput,
    callback: () => buffer.view() as JSONValue,
  });

  const editTool: Tool = tool({
    name: 'kiln_edit',
    description:
      'Make a surgical change to the working code: replace an exact span (oldString) with newString. ' +
      'oldString must appear verbatim in the current code (call kiln_view first) and be unique unless ' +
      'replaceAll is set. Make the smallest edits that satisfy the request; do not rewrite the whole ' +
      'program. Returns { ok, occurrences, newBytes } or { ok:false, error, hint }.',
    inputSchema: editInput,
    callback: (input) => {
      const r = buffer.apply(input);
      if (r.ok) opts.sink.code = buffer.code; // capture the live buffer even if submit is skipped
      return r as JSONValue;
    },
  });

  const validateTool: Tool = tool({
    name: 'kiln_validate',
    description: `${validateDef.description} Omit code to validate the current working buffer.`,
    inputSchema: bufferCodeInput,
    callback: async (input) =>
      (await validateDef.run({
        code: (input as { code?: string }).code ?? buffer.code,
      })) as JSONValue,
  });

  const renderTool: Tool = tool({
    name: 'kiln_render',
    description: `${renderDef.description} Omit code to render the current working buffer.`,
    inputSchema: bufferCodeInput,
    callback: async (input) =>
      (await renderDef.run({
        code: (input as { code?: string }).code ?? buffer.code,
      })) as JSONValue,
  });

  const screenshotTool: Tool = tool({
    name: 'kiln_screenshot',
    description: `${screenshotDef.description} Omit code to screenshot the current working buffer.`,
    inputSchema: bufferCodeInput,
    callback: async (input) =>
      toCallbackResult(
        screenshotDef,
        await screenshotDef.run({ code: (input as { code?: string }).code ?? buffer.code }),
        opts,
      ),
  });

  // Buffer-aware motion view: a refine that touches an animated character can SEE
  // the clip move and confirm the edit didn't break it.
  const animationTool = makeBufferAnimationTool(() => buffer.code, animationDef, opts);

  const submitTool: Tool = tool({
    name: KILN_SUBMIT_TOOL_NAME,
    description:
      'Submit your FINAL edited Kiln program. Call this exactly once after your edits validate and ' +
      'render. Omit code to submit the current working buffer (recommended); pass a complete program ' +
      'only to replace the buffer wholesale (the rewrite escape hatch).',
    inputSchema: submitEditInput,
    callback: (input) => {
      const code = (input as { code?: string }).code ?? buffer.code;
      opts.sink.code = code;
      return {
        ok: true,
        recorded: true,
        bytes: code.length,
        edits: buffer.edits.length,
      } as JSONValue;
    },
  });

  return [
    listTool,
    viewTool,
    editTool,
    validateTool,
    renderTool,
    screenshotTool,
    animationTool,
    submitTool,
  ];
}

// =============================================================================
// Unified tool surface (KILN_TOOL_SURFACE='unified')
// =============================================================================
//
// One buffer-based surface that unifies the from-scratch generate path and the
// refine path behind a single working buffer. Core tools:
//
//   kiln_draft    write/replace the whole buffer (authoring + capture point);
//                 the result carries the buffer's static-validation report
//   kiln_view     read the current buffer (anchors edits)
//   kiln_edit     surgical exact-string replace on the buffer; a successful edit
//                 also carries the static-validation report
//   kiln_render   execute ONCE -> metrics + the six-view image (render+screenshot)
//   kiln_finalize terminal: lock in the current buffer as the answer (arg-less)
//
// There is NO standalone kiln_validate here (A1): every buffer write already
// runs the same static check and returns it inline, so a separate validate
// round-trip only cost a model call. The legacy `current` surfaces keep theirs.
//
// The program is HELD in the buffer, so capture is unambiguous (the final buffer)
// rather than "whichever copy landed in kiln_submit". Generate seeds an empty
// buffer; refine seeds the parent's code. `kiln_list_primitives` is dropped — the
// primitive catalog (incl. examples) lives in the cached system prompt instead.
//
// Selected via KILN_TOOL_SURFACE='unified' — the production surface for Kiln
// Studio. The legacy `makeKilnTools` / `makeKilnEditTools` surfaces stay
// byte-identical for the library-default `current` surface and the bench baseline.

/**
 * A mutable sink the unified tools write into. Create one per run with
 * `edits: []`, pass it to {@link makeKilnUnifiedTools}, and after invoke read
 * `.code` (the final working buffer), `.edits` (the applied surgical-edit trace),
 * and `.finalized` (whether kiln_finalize fired).
 */
export interface UnifiedSink {
  code?: string;
  edits: EditRecord[];
  finalized?: boolean;
  /** True after at least one successful unified render. This distinguishes a
   * successful default-layout render from a run that never produced a view. */
  rendered?: boolean;
  /** Capture requested by the most recent successful unified render. Undefined
   * means that render used the standard 3x2 layout. */
  capture?: CaptureConfig;
}

/**
 * A live render candidate surfaced out-of-band from the unified `kiln_render`
 * tool: the working-buffer code at this render plus its six-view grid PNG
 * (base64). Emitted in addition to — never instead of — what the agent sees.
 * Consumers (the runtime/web tier) shape it into a streamed thumbnail and a
 * rebakeable version so the user can watch the build and "pick a version".
 */
export interface KilnRenderCandidate {
  /** The exact program in the working buffer at this render. */
  code: string;
  /** The six-view grid PNG, base64 (the same image the agent inspected). */
  pngBase64: string;
  /** Triangle count at this render, when known. */
  tris?: number;
}

const draftInput = z.object({
  code: z
    .string()
    .describe('The complete Kiln program (defines `meta` + `build()`, optional `animate()`).'),
});

/**
 * Build the unified buffer surface over a working buffer seeded with `seedCode`
 * (empty for generate, the parent's code for refine). The buffer's live edit
 * trace is shared into `sink.edits`; `sink.code` tracks the latest buffer after
 * every draft/edit (so an un-finalized run still captures the work). `kiln_edit`
 * failures point at `kiln_draft` as the always-reliable rewrite escape hatch.
 */
export function makeKilnUnifiedTools(
  opts: {
    seedCode?: string;
    sink: UnifiedSink;
    /** Best-effort sink for live render candidates (one per successful kiln_render).
     *  Lets the host surface a filmstrip of intermediate renders + pick a version.
     *  Never affects the agent's view; sink errors are swallowed. */
    onCandidate?: (c: KilnRenderCandidate) => void;
  } & KilnToolContext,
): Tool[] {
  const buffer = new KilnDraftBuffer(opts.seedCode ?? '');
  opts.sink.edits = buffer.edits; // share the live trace

  const registry = createKilnToolRegistry(opts);
  const validateDef = registry.find((d) => d.name === 'kiln_validate');
  if (!validateDef) throw new Error('makeKilnUnifiedTools: missing registry tool kiln_validate');
  const renderViewsDef = createKilnRenderViewsDef(opts);
  const animationDef = createKilnScreenshotAnimationDef(opts);
  const interiorDef = createKilnViewInteriorDef(opts);

  // A1: the unified surface has no standalone kiln_validate tool — every buffer
  // write (kiln_draft / a successful kiln_edit) runs the registry's static check
  // on the fresh buffer and returns it inline, so the model still sees every
  // validation error/warning without spending a tool round-trip on it.
  const validateBuffer = async () =>
    (await validateDef.run({ code: buffer.code })) as {
      valid: boolean;
      errors: string[];
      warnings: string[];
    };

  const draftTool: Tool = tool({
    name: 'kiln_draft',
    description:
      'Write the complete Kiln program into your working buffer. This is how you author — call it first ' +
      'to lay down your program, and call it again any time to rewrite it wholesale. The argument `code` ' +
      'is the full program (meta + build(), optional animate()). For small fixes prefer kiln_edit. ' +
      'Returns { ok, bytes, lines, validation } — validation is the static check of the drafted buffer ' +
      '({ valid, errors, warnings }); fix any errors before rendering.',
    inputSchema: draftInput,
    callback: async (input) => {
      const r = buffer.draft((input as { code: string }).code);
      opts.sink.code = buffer.code; // capture the live buffer even if finalize is skipped
      return { ...r, validation: await validateBuffer() } as JSONValue;
    },
  });

  const viewTool: Tool = tool({
    name: 'kiln_view',
    description:
      'Read the current working code (the program you are building). Returns the full raw source and ' +
      'its line count. kiln_edit matches against exactly this text - copy spans from here.',
    inputSchema: viewInput,
    callback: () => buffer.view() as JSONValue,
  });

  const editTool: Tool = tool({
    name: 'kiln_edit',
    description:
      'Make a surgical change to the working code: replace an exact span (oldString) with newString. ' +
      'oldString must appear verbatim in the current code (call kiln_view first) and be unique unless ' +
      'replaceAll is set. Make the smallest edits that satisfy the request; do not rewrite the whole ' +
      'program. If an edit cannot anchor, fall back to kiln_draft to rewrite. Returns ' +
      '{ ok, occurrences, newBytes, validation } (validation is the static check of the edited buffer) ' +
      'or { ok:false, error, hint }.',
    inputSchema: editInput,
    callback: async (input) => {
      const r = buffer.apply(
        input as { oldString: string; newString: string; replaceAll?: boolean },
      );
      if (r.ok) {
        opts.sink.code = buffer.code; // capture the live buffer even if finalize is skipped
        return { ...r, validation: await validateBuffer() } as JSONValue;
      }
      // Point the model at kiln_draft as the always-reliable escape hatch.
      const hint = r.hint
        ? `${r.hint} Or call kiln_draft to rewrite the whole program.`
        : 'Call kiln_draft to rewrite the whole program.';
      return { ...r, hint } as JSONValue;
    },
  });

  const renderTool: Tool = tool({
    name: 'kiln_render',
    description: `${renderViewsDef.description} Operates on your current working buffer: omit code; optional capture controls remain available.`,
    inputSchema: renderViewsBufferInput,
    callback: async (input) => {
      const i = input as { capture?: unknown };
      const out = await renderViewsDef.run({
        code: buffer.code,
        ...(i.capture !== undefined ? { capture: i.capture } : {}),
      });
      const rendered = out as { ok?: boolean };
      if (rendered.ok) {
        // Preserve only a validated, successful render request. A later default
        // render deliberately clears an earlier custom layout.
        opts.sink.rendered = true;
        opts.sink.capture = i.capture as CaptureConfig | undefined;
      }
      // Out-of-band: surface a SUCCESSFUL render as a live candidate (the working
      // buffer + the six-view image the agent just saw). Best-effort; a build
      // failure is image-free and not a candidate. Never changes the agent's view.
      if (opts.onCandidate) {
        const o = out as { ok?: boolean; pngBase64?: string; tris?: number };
        if (o.ok && o.pngBase64) {
          try {
            opts.onCandidate({
              code: buffer.code,
              pngBase64: o.pngBase64,
              ...(o.tris != null ? { tris: o.tris } : {}),
            });
          } catch {
            // candidate sink is best-effort
          }
        }
      }
      return toCallbackResult(renderViewsDef, out, opts);
    },
  });

  // Buffer-aware close-up: after kiln_render flags a suspect region, frame ONE
  // view to that part's bounds for detail a grid cell cannot show.
  const inspectDef = createKilnInspectDef();
  const inspectTool: Tool = tool({
    name: 'kiln_inspect',
    description: `${inspectDef.description} Operates on your current working buffer (no code argument).`,
    inputSchema: inspectBufferInput,
    callback: async (input) => {
      const i = input as {
        part?: string;
        view?: string;
        azimuthDeg?: number;
        elevationDeg?: number;
        zoom?: number;
        isolate?: boolean;
      };
      const out = await inspectDef.run({
        code: buffer.code,
        ...(i.part !== undefined ? { part: i.part } : {}),
        ...(i.view !== undefined ? { view: i.view } : {}),
        ...(i.azimuthDeg !== undefined ? { azimuthDeg: i.azimuthDeg } : {}),
        ...(i.elevationDeg !== undefined ? { elevationDeg: i.elevationDeg } : {}),
        ...(i.zoom !== undefined ? { zoom: i.zoom } : {}),
        ...(i.isolate !== undefined ? { isolate: i.isolate } : {}),
      });
      return toCallbackResult(inspectDef, out, opts);
    },
  });

  // Buffer-aware motion view: after drafting/editing an animated character, SEE a
  // clip move (sideways walk, reverse knee, backward swing, item not tracking).
  const animationTool = makeBufferAnimationTool(() => buffer.code, animationDef, opts);

  // Buffer-aware interior view: after drafting/editing a BUILDING, SEE inside it
  // (roof off — open floor, real doorway gap, fixtures grounded, nothing buried).
  const interiorTool: Tool = tool({
    name: 'kiln_view_interior',
    description: `${interiorDef.description} Operates on your current working buffer (omit code).`,
    inputSchema: z.object({
      nodeName: z
        .string()
        .optional()
        .describe(
          'Override: lift the roof by exact node name. Normally omit it — the roof is found by ' +
            'its semantic role whatever it is named.',
        ),
    }),
    callback: async (input) => {
      const n = (input as { nodeName?: string }).nodeName;
      const out = await interiorDef.run({
        code: buffer.code,
        ...(n ? { nodeName: n } : {}),
      });
      return toCallbackResult(interiorDef, out, opts);
    },
  });

  const finalizeTool: Tool = tool({
    name: 'kiln_finalize',
    description:
      'Lock in your current working buffer as the FINAL answer. Call this exactly once, after the render ' +
      'looks right across all six views. No argument — it finalizes exactly what you have drafted and ' +
      'edited. Returns { ok, recorded, bytes, edits }.',
    inputSchema: viewInput,
    callback: () => {
      opts.sink.code = buffer.code;
      opts.sink.finalized = true;
      return {
        ok: true,
        recorded: true,
        bytes: buffer.code.length,
        edits: buffer.edits.length,
      } as JSONValue;
    },
  });

  return [
    draftTool,
    viewTool,
    editTool,
    renderTool,
    inspectTool,
    animationTool,
    interiorTool,
    finalizeTool,
  ];
}

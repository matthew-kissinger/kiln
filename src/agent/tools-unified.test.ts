/**
 * Unit tests for the unified buffer surface (KilnDraftBuffer.draft +
 * makeKilnUnifiedTools). Mirrors tools-edit.test.ts: the buffer is pure string
 * ops (tested directly) and the factory is checked for its tool wiring,
 * capture into the sink, the inline validation on buffer writes (A1), the
 * kiln_draft escape-hatch hint, and the collapsed kiln_render media contract.
 */
import { describe, expect, test } from 'bun:test';
import { ImageBlock, JsonBlock } from '@strands-agents/sdk';

import { KilnDraftBuffer, KilnEditBuffer, makeKilnUnifiedTools, type UnifiedSink } from './tools';

const BOX_CODE = `
const meta = { name: 'test-box', category: 'prop' };
function build() {
  const root = createRoot('Root');
  createPart('Mesh_Box', boxGeo(1, 1, 1), gameMaterial('#ff0000'), { parent: root, position: [0, 0.5, 0] });
  return root;
}
`;

// Two named parts under one root — the shape kiln_inspect frames by name.
const TWO_PART_CODE = `
const meta = { name: 'test-hammer', category: 'prop' };
function build() {
  const root = createRoot('Hammer');
  createPart('Handle', boxGeo(0.2, 1.2, 0.2), gameMaterial('#8a5a2b'), { parent: root, position: [0, 0.6, 0] });
  createPart('Head', boxGeo(0.6, 0.3, 0.3), gameMaterial('#9aa0a6'), { parent: root, position: [0, 1.35, 0] });
  return root;
}
`;

// An enterable building: a hollow room (walls named Shell_Wall<Side>) under a
// separable roof group named 'Roof' — the shape kiln_view_interior lifts.
const BUILDING_CODE = `
const meta = { name: 'test-hut', category: 'architecture' };
function build() {
  const root = createRoot('Hut');
  const mat = gameMaterial('#caa472');
  room('Shell', mat, { width: 4, depth: 4, height: 2.8, parent: root });
  const roof = createRoofPlanes('Roof', mat, { width: 4, depth: 4, height: 1.2, parent: root });
  roof.root.position.set(0, 2.8, 0);
  return root;
}
`;

function findTool(tools: ReturnType<typeof makeKilnUnifiedTools>, name: string) {
  const t = tools.find((x) => x.name === name) as
    | { invoke(input: unknown): Promise<unknown> }
    | undefined;
  if (!t) throw new Error(`tool ${name} not found`);
  return t;
}

describe('KilnDraftBuffer', () => {
  test('seeds empty by default and KilnEditBuffer is the same class (alias)', () => {
    expect(KilnEditBuffer).toBe(KilnDraftBuffer);
    const buf = new KilnDraftBuffer();
    expect(buf.code).toBe('');
    expect(buf.edits).toHaveLength(0);
  });

  test('draft replaces the whole buffer and is NOT recorded as an edit', () => {
    const buf = new KilnDraftBuffer();
    const r = buf.draft(BOX_CODE);
    expect(r.ok).toBe(true);
    expect(r.bytes).toBe(BOX_CODE.length);
    expect(r.lines).toBe(BOX_CODE.split('\n').length);
    expect(buf.code).toBe(BOX_CODE);
    expect(buf.edits).toHaveLength(0); // drafting is authoring, not a diff step
  });

  test('draft then surgical edit: edit is recorded, draft is not', () => {
    const buf = new KilnDraftBuffer();
    buf.draft(BOX_CODE);
    const r = buf.apply({ oldString: 'boxGeo(1, 1, 1)', newString: 'boxGeo(2, 1, 1)' });
    expect(r.ok).toBe(true);
    expect(buf.code).toContain('boxGeo(2, 1, 1)');
    expect(buf.edits).toHaveLength(1);
  });
});

describe('makeKilnUnifiedTools', () => {
  test('exposes exactly the eight unified tools in order (incl. the close-up, motion + interior views)', () => {
    const sink: UnifiedSink = { edits: [] };
    const tools = makeKilnUnifiedTools({ sink });
    expect(tools.map((t) => t.name)).toEqual([
      'kiln_draft',
      'kiln_view',
      'kiln_edit',
      'kiln_render',
      'kiln_inspect',
      'kiln_screenshot_animation',
      'kiln_view_interior',
      'kiln_finalize',
    ]);
    // No legacy verbs leak into the unified surface (the static screenshot collapsed
    // into kiln_render; only the dedicated motion + interior views are added). A1:
    // there is no standalone kiln_validate — buffer writes validate inline.
    expect(tools.map((t) => t.name)).not.toContain('kiln_list_primitives');
    expect(tools.map((t) => t.name)).not.toContain('kiln_screenshot');
    expect(tools.map((t) => t.name)).not.toContain('kiln_submit');
    expect(tools.map((t) => t.name)).not.toContain('kiln_validate');
    expect(sink.edits).toHaveLength(0);
  });

  test('kiln_draft writes the buffer + captures into sink.code; kiln_view reads it back', async () => {
    const sink: UnifiedSink = { edits: [] };
    const tools = makeKilnUnifiedTools({ sink });
    const drafted = (await findTool(tools, 'kiln_draft').invoke({ code: BOX_CODE })) as {
      ok: boolean;
      bytes: number;
      validation: { valid: boolean; errors: string[]; warnings: string[] };
    };
    expect(drafted.ok).toBe(true);
    // A1: the draft result carries the static validation of the fresh buffer.
    expect(drafted.validation.valid).toBe(true);
    expect(drafted.validation.errors).toEqual([]);
    expect(sink.code).toBe(BOX_CODE); // captured even before finalize
    const viewed = (await findTool(tools, 'kiln_view').invoke({})) as {
      code: string;
      lines: number;
    };
    expect(viewed.code).toBe(BOX_CODE);
  });

  test('kiln_draft of a broken program surfaces the validation errors inline (A1)', async () => {
    const sink: UnifiedSink = { edits: [] };
    const tools = makeKilnUnifiedTools({ sink });
    const drafted = (await findTool(tools, 'kiln_draft').invoke({
      code: 'function build() { return 1; }', // no meta
    })) as { ok: boolean; validation: { valid: boolean; errors: string[] } };
    expect(drafted.ok).toBe(true); // the write itself succeeded
    expect(drafted.validation.valid).toBe(false);
    expect(drafted.validation.errors.length).toBeGreaterThan(0);
  });

  test('refine seed: kiln_edit updates sink.code; the shared edit trace records it', async () => {
    const sink: UnifiedSink = { edits: [] };
    const tools = makeKilnUnifiedTools({ seedCode: BOX_CODE, sink });
    const edited = (await findTool(tools, 'kiln_edit').invoke({
      oldString: 'boxGeo(1, 1, 1)',
      newString: 'boxGeo(2, 1, 1)',
    })) as { ok: boolean; validation: { valid: boolean; errors: string[] } };
    expect(edited.ok).toBe(true);
    // A1: a successful edit re-validates the edited buffer inline.
    expect(edited.validation.valid).toBe(true);
    expect(sink.code).toContain('boxGeo(2, 1, 1)');
    expect(sink.edits).toHaveLength(1); // live trace shared into the sink
  });

  test('a kiln_edit that breaks the program reports validation errors inline (A1)', async () => {
    const sink: UnifiedSink = { edits: [] };
    const tools = makeKilnUnifiedTools({ seedCode: BOX_CODE, sink });
    const edited = (await findTool(tools, 'kiln_edit').invoke({
      oldString: 'function build() {',
      newString: 'function broken() {',
    })) as { ok: boolean; validation: { valid: boolean; errors: string[] } };
    expect(edited.ok).toBe(true); // the string replace applied
    expect(edited.validation.valid).toBe(false);
    expect(edited.validation.errors.length).toBeGreaterThan(0);
  });

  test('a failed kiln_edit points the model at kiln_draft as the escape hatch', async () => {
    const sink: UnifiedSink = { edits: [] };
    const tools = makeKilnUnifiedTools({ seedCode: BOX_CODE, sink });
    const failed = (await findTool(tools, 'kiln_edit').invoke({
      oldString: 'sphereGeo(9)',
      newString: 'boxGeo(9,9,9)',
    })) as { ok: boolean; hint?: string };
    expect(failed.ok).toBe(false);
    expect(failed.hint).toContain('kiln_draft');
    expect(sink.edits).toHaveLength(0); // nothing applied
  });

  test('kiln_render returns [ImageBlock, JsonBlock] for a valid buffer', async () => {
    const sink: UnifiedSink = { edits: [] };
    const tools = makeKilnUnifiedTools({ seedCode: BOX_CODE, sink });
    const out = (await findTool(tools, 'kiln_render').invoke({})) as unknown[];
    expect(Array.isArray(out)).toBe(true);
    expect(out).toHaveLength(2);
    expect(out[0]).toBeInstanceOf(ImageBlock);
    expect(out[1]).toBeInstanceOf(JsonBlock);
    const json = (out[1] as JsonBlock).json as Record<string, unknown>;
    expect(json['ok']).toBe(true);
    expect(json['tris']).toBeGreaterThan(0); // metrics ride alongside the image
    expect('pngBase64' in json).toBe(false);
  });

  test('kiln_render exposes and honors the bounded capture contract on the working buffer', async () => {
    const sink: UnifiedSink = { edits: [] };
    const tools = makeKilnUnifiedTools({ seedCode: BOX_CODE, sink });
    const render = findTool(tools, 'kiln_render');
    const out = (await render.invoke({ capture: { preset: '1x1' } })) as unknown[];
    const json = (out[1] as JsonBlock).json as {
      capture?: { preset?: string; cols?: number; cells?: number };
    };
    expect(json.capture).toEqual({ preset: '1x1', cols: 1, cells: 1 });
    expect(sink.rendered).toBe(true);
    expect(sink.capture).toEqual({ preset: '1x1' });

    await render.invoke({});
    expect(sink.rendered).toBe(true);
    expect(sink.capture).toBeUndefined(); // a later successful default render wins
  });

  test('kiln_render on a broken buffer is image-free (plain JSON error)', async () => {
    const sink: UnifiedSink = { edits: [], capture: { preset: '2x2' } };
    const tools = makeKilnUnifiedTools({ seedCode: 'not a kiln program (', sink });
    const out = (await findTool(tools, 'kiln_render').invoke({})) as {
      ok: boolean;
      error?: string;
    };
    expect(Array.isArray(out)).toBe(false);
    expect(out.ok).toBe(false);
    expect(out.error).toBeDefined();
    expect(sink.rendered).toBeUndefined();
    expect(sink.capture).toEqual({ preset: '2x2' }); // failed renders never replace the last good layout
  });

  test('kiln_render emits a render candidate (buffer code + six-view png) via onCandidate', async () => {
    const sink: UnifiedSink = { edits: [] };
    const got: Array<{ code: string; pngBase64: string; tris?: number }> = [];
    const tools = makeKilnUnifiedTools({
      seedCode: BOX_CODE,
      sink,
      onCandidate: (c) => got.push(c),
    });
    await findTool(tools, 'kiln_render').invoke({});
    expect(got).toHaveLength(1);
    expect(got[0]!.code).toBe(BOX_CODE); // the exact working buffer
    expect(got[0]!.pngBase64.length).toBeGreaterThan(0); // the same image the agent saw
    expect(got[0]!.tris).toBeGreaterThan(0);
  });

  test('kiln_render on a broken buffer does NOT emit a candidate (image-free build)', async () => {
    const sink: UnifiedSink = { edits: [] };
    const got: unknown[] = [];
    const tools = makeKilnUnifiedTools({
      seedCode: 'not a kiln program (',
      sink,
      onCandidate: (c) => got.push(c),
    });
    await findTool(tools, 'kiln_render').invoke({});
    expect(got).toHaveLength(0); // a failed render has no image → no candidate
  });

  test('kiln_inspect frames a named part: [ImageBlock, JsonBlock] and the text names part + view', async () => {
    const sink: UnifiedSink = { edits: [] };
    const tools = makeKilnUnifiedTools({ seedCode: TWO_PART_CODE, sink });
    const out = (await findTool(tools, 'kiln_inspect').invoke({ part: 'head' })) as unknown[];
    expect(Array.isArray(out)).toBe(true);
    expect(out).toHaveLength(2);
    expect(out[0]).toBeInstanceOf(ImageBlock);
    expect(out[1]).toBeInstanceOf(JsonBlock);
    const json = (out[1] as JsonBlock).json as Record<string, unknown>;
    expect(json['ok']).toBe(true);
    // createPart prefixes mesh names: 'head' resolves (case-insensitive substring)
    // to the true scene-node name, which is what the model retries with.
    expect(json['part']).toBe('Mesh_Head');
    expect(json['view']).toBe('three-quarter'); // the default camera
    expect(json['framed']).toContain('Mesh_Head');
    expect(json['framed']).toContain('three-quarter');
    expect(json['width']).toBe(512);
    expect('pngBase64' in json).toBe(false); // image stripped by the media extractor
  });

  test('kiln_inspect exposes and honors object-relative orbit angles on the working buffer', async () => {
    const sink: UnifiedSink = { edits: [] };
    const tools = makeKilnUnifiedTools({ seedCode: TWO_PART_CODE, sink });
    const inspect = findTool(tools, 'kiln_inspect');
    const out = (await inspect.invoke({
      part: 'head',
      azimuthDeg: 125,
      elevationDeg: -20,
    })) as unknown[];
    const json = (out[1] as JsonBlock).json as Record<string, unknown>;
    expect(json['azimuthDeg']).toBeCloseTo(125, 1);
    expect(json['elevationDeg']).toBeCloseTo(-20, 1);
    expect(json['framed']).toContain('azimuth 125deg');
  });

  test('kiln_inspect on an unknown part returns the part list without throwing (image-free)', async () => {
    const sink: UnifiedSink = { edits: [] };
    const tools = makeKilnUnifiedTools({ seedCode: TWO_PART_CODE, sink });
    const out = (await findTool(tools, 'kiln_inspect').invoke({ part: 'Blade' })) as {
      ok: boolean;
      error?: string;
      availableParts?: string[];
    };
    expect(Array.isArray(out)).toBe(false); // no image on a miss
    expect(out.ok).toBe(false);
    expect(out.error).toContain('Blade');
    expect(out.availableParts).toContain('Mesh_Handle');
    expect(out.availableParts).toContain('Mesh_Head');
  });

  test('kiln_inspect isolate:true reaches the renderer and is reported back', async () => {
    const sink: UnifiedSink = { edits: [] };
    const tools = makeKilnUnifiedTools({ seedCode: TWO_PART_CODE, sink });
    const out = (await findTool(tools, 'kiln_inspect').invoke({
      part: 'head',
      isolate: true,
    })) as unknown[];
    expect(out[0]).toBeInstanceOf(ImageBlock);
    const json = (out[1] as JsonBlock).json as Record<string, unknown>;
    expect(json['isolated']).toBe(true);
    expect(json['framed']).toContain('nothing in this image occludes it');
  });

  test('kiln_inspect defaults to isolate:false and says so in the framing line', async () => {
    const sink: UnifiedSink = { edits: [] };
    const tools = makeKilnUnifiedTools({ seedCode: TWO_PART_CODE, sink });
    const out = (await findTool(tools, 'kiln_inspect').invoke({ part: 'head' })) as unknown[];
    const json = (out[1] as JsonBlock).json as Record<string, unknown>;
    expect(json['isolated']).toBe(false);
    expect(json['framed']).toContain('may occlude it');
  });

  test('kiln_inspect isolate:true without a part is a no-op, not an error', async () => {
    const sink: UnifiedSink = { edits: [] };
    const tools = makeKilnUnifiedTools({ seedCode: TWO_PART_CODE, sink });
    const out = (await findTool(tools, 'kiln_inspect').invoke({ isolate: true })) as unknown[];
    const json = (out[1] as JsonBlock).json as Record<string, unknown>;
    expect(json['ok']).toBe(true);
    expect(json['isolated']).toBe(false);
    expect(json['framed']).toContain('whole asset');
  });

  test('kiln_inspect with no part frames the whole asset in one view', async () => {
    const sink: UnifiedSink = { edits: [] };
    const tools = makeKilnUnifiedTools({ seedCode: TWO_PART_CODE, sink });
    const out = (await findTool(tools, 'kiln_inspect').invoke({ view: 'front' })) as unknown[];
    expect(Array.isArray(out)).toBe(true);
    expect(out[0]).toBeInstanceOf(ImageBlock);
    const json = (out[1] as JsonBlock).json as Record<string, unknown>;
    expect(json['ok']).toBe(true);
    expect('part' in json).toBe(false); // nothing singled out — whole-asset framing
    expect(json['view']).toBe('front');
    expect(json['framed']).toContain('whole asset');
  });

  test('kiln_view_interior returns [ImageBlock, JsonBlock] for a building buffer', async () => {
    const sink: UnifiedSink = { edits: [] };
    const tools = makeKilnUnifiedTools({ seedCode: BUILDING_CODE, sink });
    const out = (await findTool(tools, 'kiln_view_interior').invoke({})) as unknown[];
    expect(Array.isArray(out)).toBe(true);
    expect(out).toHaveLength(2);
    expect(out[0]).toBeInstanceOf(ImageBlock);
    expect(out[1]).toBeInstanceOf(JsonBlock);
    const json = (out[1] as JsonBlock).json as Record<string, unknown>;
    expect(json['ok']).toBe(true);
    expect(json['roofsHidden']).toBeGreaterThanOrEqual(1); // the 'Roof' group was lifted
    expect(json['wallsHidden']).toBeGreaterThanOrEqual(1); // near walls cut for the eye-level cell
    expect('pngBase64' in json).toBe(false); // image stripped by the media extractor
  });

  test('kiln_view_interior on a broken buffer is image-free (plain JSON error)', async () => {
    const sink: UnifiedSink = { edits: [] };
    const tools = makeKilnUnifiedTools({ seedCode: 'not a kiln program (', sink });
    const out = (await findTool(tools, 'kiln_view_interior').invoke({})) as {
      ok: boolean;
      error?: string;
    };
    expect(Array.isArray(out)).toBe(false);
    expect(out.ok).toBe(false);
    expect(out.error).toBeDefined();
  });

  test('kiln_view_interior lifts a semantically-roled roof that is NOT named "Roof"', async () => {
    const sink: UnifiedSink = { edits: [] };
    const lidCode = BUILDING_CODE.replace("createRoofPlanes('Roof'", "createRoofPlanes('Lid'");
    const tools = makeKilnUnifiedTools({ seedCode: lidCode, sink });
    const out = (await findTool(tools, 'kiln_view_interior').invoke({})) as unknown[];
    const json = (out[1] as JsonBlock).json as Record<string, unknown>;
    // createRoofPlanes stamps roof.* roles regardless of the node's name, so the
    // tool resolves the roof by role. The asset is already correct — there must
    // be no warning telling the model to rename anything.
    expect(json['roofsHidden']).toBe(1);
    expect((json['warnings'] as string[]).join(' ')).not.toContain('could not be lifted');
    expect((json['warnings'] as string[]).join(' ')).not.toContain('still occluded');
  });

  test('kiln_view_interior warns in explicit-override mode when the named node is absent', async () => {
    const sink: UnifiedSink = { edits: [] };
    const tools = makeKilnUnifiedTools({ seedCode: BUILDING_CODE, sink });
    const out = (await findTool(tools, 'kiln_view_interior').invoke({
      nodeName: 'Canopy',
    })) as unknown[];
    const json = (out[1] as JsonBlock).json as Record<string, unknown>;
    expect(json['roofsHidden']).toBe(0);
    const warnings = (json['warnings'] as string[]).join(' ');
    expect(warnings).toContain('Canopy');
    // The advice must point at the override, not at renaming the asset.
    expect(warnings).toContain('omit nodeName');
  });

  test('kiln_view_interior warns in semantic mode when no roof is resolvable at all', async () => {
    const sink: UnifiedSink = { edits: [] };
    const tools = makeKilnUnifiedTools({ seedCode: BOX_CODE, sink });
    const out = (await findTool(tools, 'kiln_view_interior').invoke({})) as unknown[];
    const json = (out[1] as JsonBlock).json as Record<string, unknown>;
    expect(json['roofsHidden']).toBe(0);
    const warnings = (json['warnings'] as string[]).join(' ');
    expect(warnings).toContain('No roof was found');
    expect(warnings).toContain('createRoofPlanes');
  });

  test('kiln_finalize captures the buffer and marks finalized', async () => {
    const sink: UnifiedSink = { edits: [] };
    const tools = makeKilnUnifiedTools({ sink });
    await findTool(tools, 'kiln_draft').invoke({ code: BOX_CODE });
    const fin = (await findTool(tools, 'kiln_finalize').invoke({})) as {
      ok: boolean;
      recorded: boolean;
      bytes: number;
    };
    expect(fin.ok).toBe(true);
    expect(fin.recorded).toBe(true);
    expect(sink.code).toBe(BOX_CODE);
    expect(sink.finalized).toBe(true);
  });
});

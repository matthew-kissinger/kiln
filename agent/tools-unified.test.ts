/**
 * Unit tests for the unified buffer surface (KilnDraftBuffer.draft +
 * makeKilnUnifiedTools). Mirrors tools-edit.test.ts: the buffer is pure string
 * ops (tested directly) and the factory is checked for its 6-tool wiring,
 * capture into the sink, the kiln_draft escape-hatch hint, and the collapsed
 * kiln_render media contract.
 */
import { describe, expect, test } from 'bun:test';
import { ImageBlock, JsonBlock } from '@strands-agents/sdk';

import {
  KilnDraftBuffer,
  KilnEditBuffer,
  makeKilnUnifiedTools,
  type UnifiedSink,
} from './tools';

const BOX_CODE = `
const meta = { name: 'test-box', category: 'prop' };
function build() {
  const root = createRoot('Root');
  createPart('Mesh_Box', boxGeo(1, 1, 1), gameMaterial('#ff0000'), { parent: root, position: [0, 0.5, 0] });
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
  test('exposes exactly the seven unified tools in order (incl. the animation view)', () => {
    const sink: UnifiedSink = { edits: [] };
    const tools = makeKilnUnifiedTools({ sink });
    expect(tools.map((t) => t.name)).toEqual([
      'kiln_draft',
      'kiln_view',
      'kiln_edit',
      'kiln_validate',
      'kiln_render',
      'kiln_screenshot_animation',
      'kiln_finalize',
    ]);
    // No legacy verbs leak into the unified surface (the static screenshot collapsed
    // into kiln_render; only the dedicated motion view kiln_screenshot_animation is added).
    expect(tools.map((t) => t.name)).not.toContain('kiln_list_primitives');
    expect(tools.map((t) => t.name)).not.toContain('kiln_screenshot');
    expect(tools.map((t) => t.name)).not.toContain('kiln_submit');
    expect(sink.edits).toHaveLength(0);
  });

  test('kiln_draft writes the buffer + captures into sink.code; kiln_view reads it back', async () => {
    const sink: UnifiedSink = { edits: [] };
    const tools = makeKilnUnifiedTools({ sink });
    const drafted = (await findTool(tools, 'kiln_draft').invoke({ code: BOX_CODE })) as {
      ok: boolean;
      bytes: number;
    };
    expect(drafted.ok).toBe(true);
    expect(sink.code).toBe(BOX_CODE); // captured even before finalize
    const viewed = (await findTool(tools, 'kiln_view').invoke({})) as { code: string; lines: number };
    expect(viewed.code).toBe(BOX_CODE);
  });

  test('refine seed: kiln_edit updates sink.code; the shared edit trace records it', async () => {
    const sink: UnifiedSink = { edits: [] };
    const tools = makeKilnUnifiedTools({ seedCode: BOX_CODE, sink });
    const edited = (await findTool(tools, 'kiln_edit').invoke({
      oldString: 'boxGeo(1, 1, 1)',
      newString: 'boxGeo(2, 1, 1)',
    })) as { ok: boolean };
    expect(edited.ok).toBe(true);
    expect(sink.code).toContain('boxGeo(2, 1, 1)');
    expect(sink.edits).toHaveLength(1); // live trace shared into the sink
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

  test('kiln_render on a broken buffer is image-free (plain JSON error)', async () => {
    const sink: UnifiedSink = { edits: [] };
    const tools = makeKilnUnifiedTools({ seedCode: 'not a kiln program (', sink });
    const out = (await findTool(tools, 'kiln_render').invoke({})) as { ok: boolean; error?: string };
    expect(Array.isArray(out)).toBe(false);
    expect(out.ok).toBe(false);
    expect(out.error).toBeDefined();
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

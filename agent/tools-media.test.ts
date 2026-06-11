/**
 * Strands tool skin: kiln_screenshot returns [ImageBlock, JsonBlock] so the
 * model literally sees the rendered views; plain tools keep their JSON output.
 */
import { describe, expect, test } from 'bun:test';
import { ImageBlock, JsonBlock } from '@strands-agents/sdk';

import { makeKilnTools, makeKilnEditTools, type SubmitSink, type EditSink } from './tools';

const BOX_CODE = `
const meta = { name: 'test-box', category: 'prop' };
function build() {
  const root = createRoot('Root');
  createPart('Mesh_Box', boxGeo(1, 1, 1), gameMaterial('#ff0000'), { parent: root, position: [0, 0.5, 0] });
  return root;
}
`;

function findTool(tools: ReturnType<typeof makeKilnTools>, name: string) {
  const t = tools.find((x) => x.name === name) as
    | { invoke(input: unknown): Promise<unknown> }
    | undefined;
  if (!t) throw new Error(`tool ${name} not found`);
  return t;
}

describe('makeKilnTools media handling', () => {
  test('exposes the four registry tools plus kiln_submit', () => {
    const sink: SubmitSink = {};
    const tools = makeKilnTools(sink);
    expect(tools.map((t) => t.name)).toEqual([
      'kiln_list_primitives',
      'kiln_validate',
      'kiln_render',
      'kiln_screenshot',
      'kiln_submit',
    ]);
  });

  test('kiln_screenshot returns [ImageBlock, JsonBlock] with the base64 stripped', async () => {
    const tools = makeKilnTools({});
    const out = (await findTool(tools, 'kiln_screenshot').invoke({ code: BOX_CODE })) as unknown[];
    expect(Array.isArray(out)).toBe(true);
    expect(out).toHaveLength(2);
    expect(out[0]).toBeInstanceOf(ImageBlock);
    expect((out[0] as ImageBlock).format).toBe('png');
    expect(out[1]).toBeInstanceOf(JsonBlock);
    const json = (out[1] as JsonBlock).json as Record<string, unknown>;
    expect(json['ok']).toBe(true);
    expect('pngBase64' in json).toBe(false);
  });

  test('kiln_screenshot on broken code falls back to the plain JSON error output', async () => {
    const tools = makeKilnTools({});
    const out = (await findTool(tools, 'kiln_screenshot').invoke({ code: 'nope(' })) as {
      ok: boolean;
      error?: string;
    };
    expect(Array.isArray(out)).toBe(false);
    expect(out.ok).toBe(false);
    expect(out.error).toBeDefined();
  });

  test('kiln_render keeps its plain JSON output (no media wrapping)', async () => {
    const tools = makeKilnTools({});
    const out = (await findTool(tools, 'kiln_render').invoke({ code: BOX_CODE })) as {
      ok: boolean;
      tris?: number;
    };
    expect(Array.isArray(out)).toBe(false);
    expect(out.ok).toBe(true);
    expect(out.tris).toBeGreaterThan(0);
  });
});

describe('makeKilnEditTools kiln_screenshot', () => {
  test('defaults to the working buffer and returns image blocks', async () => {
    const sink: EditSink = { edits: [] };
    const tools = makeKilnEditTools({ seedCode: BOX_CODE, sink });
    const out = (await findTool(
      tools as ReturnType<typeof makeKilnTools>,
      'kiln_screenshot',
    ).invoke({})) as unknown[];
    expect(Array.isArray(out)).toBe(true);
    expect(out[0]).toBeInstanceOf(ImageBlock);
    expect(out[1]).toBeInstanceOf(JsonBlock);
  });
});

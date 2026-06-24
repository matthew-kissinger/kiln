/**
 * Composer agent tools — the scene_* surface driven directly (no live model).
 *
 * Each Strands tool is an InvokableTool, so `.invoke(input)` runs its callback in
 * isolation. We assert the model mutates, the sink autosaves the serialized
 * program + evaluated scene, overlaps are surfaced (never dropped), and the two
 * image tools call the injected render port and return content blocks.
 */
import { describe, expect, test } from 'bun:test';
import type { Tool } from '@strands-agents/sdk';

import {
  type CatalogEntry,
  PlacementModel,
  type SceneRenderPort,
  type SceneRenderRequest,
} from '../composer';
import {
  type ComposerSink,
  makeSceneComposerTools,
  type SceneRenderCandidate,
} from '../composer/agent';

const asset = (id: string, w = 2, h = 3, d = 2): CatalogEntry => ({
  generationId: id,
  bbox: { min: [-w / 2, 0, -d / 2], max: [w / 2, h, d / 2] },
  name: id,
});

const PNG_B64 = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]).toString('base64');

function setup() {
  const model = new PlacementModel('Test', {
    seed: 7,
    catalog: [asset('well', 3, 4, 3), asset('crate', 1, 1, 1), asset('column', 1, 5, 1)],
  });
  const sink: ComposerSink = {};
  const candidates: SceneRenderCandidate[] = [];
  const calls: SceneRenderRequest[] = [];
  const render: SceneRenderPort = async (req) => {
    calls.push(req);
    return { ok: true, pngBase64: PNG_B64, tris: 123 };
  };
  const tools = makeSceneComposerTools({
    model,
    render,
    sink,
    onCandidate: (c) => candidates.push(c),
  });
  return { model, sink, candidates, calls, tools };
}

// biome-ignore lint/suspicious/noExplicitAny: tool returns are intentionally untyped here
type AnyResult = any;
interface Invokable {
  name: string;
  invoke: (input: unknown) => Promise<AnyResult>;
}
function call(tools: Tool[], name: string, input: unknown = {}): Promise<AnyResult> {
  const t = tools.find((x) => x.name === name) as unknown as Invokable | undefined;
  if (!t) throw new Error(`no tool "${name}"`);
  return t.invoke(input);
}

describe('surface', () => {
  test('exposes the 14 scene_* tools by name', () => {
    const { tools } = setup();
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual(
      [
        'scene_list_assets',
        'scene_view',
        'scene_validate',
        'scene_render',
        'scene_screenshot_camera',
        'scene_layout',
        'scene_place',
        'scene_cluster',
        'scene_ring',
        'scene_move',
        'scene_face',
        'scene_group',
        'scene_remove',
        'scene_finalize',
      ].sort(),
    );
  });
});

describe('read tools', () => {
  test('scene_list_assets returns the catalog with footprint sizes', async () => {
    const { tools } = setup();
    const r = await call(tools, 'scene_list_assets');
    expect(r.assets).toHaveLength(3);
    expect(r.assets.map((a: { generationId: string }) => a.generationId)).toContain('well');
    expect(r.assets[0].size).toHaveLength(3);
  });

  test('scene_view reflects the current program + counts', async () => {
    const { tools } = setup();
    await call(tools, 'scene_place', { asset: 'well', at: [0, 0], face: 'center', role: 'hero' });
    const r = await call(tools, 'scene_view');
    expect(r.program).toContain('s.place(');
    expect(r.placementCount).toBe(1);
    expect(r.overlapCount).toBe(0);
    expect(r.aliases).toContain('well');
  });
});

describe('place / cluster / ring mutate + autosave', () => {
  test('scene_place places one asset and autosaves the program', async () => {
    const { tools, sink } = setup();
    const r = await call(tools, 'scene_place', { asset: 'well', at: [10, -5], face: 'center' });
    expect(r.ok).toBe(true);
    expect(r.placements).toBe(1);
    expect(r.overlaps).toBe(0);
    expect(sink.program).toContain('s.place(');
    expect(sink.placements).toHaveLength(1);
  });

  test('scene_place with an unknown asset returns an in-band error + hint', async () => {
    const { tools } = setup();
    const r = await call(tools, 'scene_place', { asset: 'nope', at: [0, 0] });
    expect(r.ok).toBe(false);
    expect(r.hint).toContain('scene_list_assets');
  });

  test('scene_cluster scatters N overlap-free and serializes as one line', async () => {
    const { tools, sink } = setup();
    const r = await call(tools, 'scene_cluster', {
      asset: 'crate',
      around: [20, 0],
      count: 8,
      spread: 14,
    });
    expect(r.ok).toBe(true);
    expect(r.placements).toBe(8);
    expect(r.overlaps).toBe(0);
    expect(sink.program?.split('\n').filter((l) => l.includes('s.cluster('))).toHaveLength(1);
  });

  test('scene_ring places N on a circle, overlap-free', async () => {
    const { tools } = setup();
    const r = await call(tools, 'scene_ring', {
      asset: 'column',
      center: [0, 0],
      count: 8,
      radius: 16,
      faceOut: false,
    });
    expect(r.placements).toBe(8);
    expect(r.overlaps).toBe(0);
  });
});

describe('layout baseline', () => {
  test('scene_layout lays out the whole catalog overlap-free, returns aliases', async () => {
    const { tools } = setup();
    const r = await call(tools, 'scene_layout', { anchor: 'single' });
    expect(r.ok).toBe(true);
    expect(Array.isArray(r.alias)).toBe(true);
    expect(r.alias).toHaveLength(3);
    expect(r.overlaps).toBe(0);
  });
});

describe('edit ops + overlap surfacing', () => {
  test('an overlap is surfaced on mutation and via scene_validate, and scene_move resolves it', async () => {
    const { tools } = setup();
    await call(tools, 'scene_place', { asset: 'well', at: [0, 0], alias: 'w' });
    const collide = await call(tools, 'scene_place', { asset: 'crate', at: [0, 0], alias: 'c' });
    expect(collide.overlaps).toBeGreaterThan(0);
    expect(collide.hint).toContain('scene_validate');

    const v = await call(tools, 'scene_validate');
    expect(v.ok).toBe(false);
    expect(v.count).toBeGreaterThan(0);
    expect(v.overlaps[0].separation).toHaveLength(3);

    const moved = await call(tools, 'scene_move', { target: 'c', to: [60, 60] });
    expect(moved.ok).toBe(true);
    expect(moved.overlaps).toBe(0);
  });

  test('scene_face re-orients, scene_remove drops, scene_group binds + moves together', async () => {
    const { tools } = setup();
    await call(tools, 'scene_place', { asset: 'crate', at: [0, 0], alias: 'a' });
    await call(tools, 'scene_place', { asset: 'crate', at: [4, 0], alias: 'b' });

    const faced = await call(tools, 'scene_face', { target: 'a', face: 90 });
    expect(faced.ok).toBe(true);

    const grouped = await call(tools, 'scene_group', {
      targets: ['a', 'b'],
      name: 'pile',
      delta: [10, 0],
    });
    expect(grouped.ok).toBe(true);
    expect(grouped.members).toEqual(['a', 'b']);

    const removed = await call(tools, 'scene_remove', { target: 'b' });
    expect(removed.ok).toBe(true);
    expect(removed.placements).toBe(1);
  });

  test('an edit op on a missing target returns ok:false', async () => {
    const { tools } = setup();
    const r = await call(tools, 'scene_move', { target: 'ghost', delta: [1, 0] });
    expect(r.ok).toBe(false);
  });
});

describe('render tools call the port and return content blocks', () => {
  test('scene_render renders the whole scene, emits a candidate, returns [image, json]', async () => {
    const { tools, calls, candidates } = setup();
    await call(tools, 'scene_place', { asset: 'well', at: [0, 0] });
    const r = await call(tools, 'scene_render');
    expect(Array.isArray(r)).toBe(true);
    expect(r).toHaveLength(2); // 1 ImageBlock + 1 JsonBlock
    expect(calls).toHaveLength(1);
    expect(calls[0]!.placements).toHaveLength(1);
    expect(calls[0]!.cameras).toBeUndefined(); // 3 canonical angles = host default
    expect(candidates).toHaveLength(1);
    expect(candidates[0]!.pngBase64).toBe(PNG_B64);
    expect(candidates[0]!.program).toContain('s.place(');
  });

  test('scene_screenshot_camera passes the requested camera through', async () => {
    const { tools, calls } = setup();
    await call(tools, 'scene_place', { asset: 'well', at: [0, 0] });
    const r = await call(tools, 'scene_screenshot_camera', {
      position: [30, 20, 30],
      target: [0, 0, 0],
      fovDeg: 45,
    });
    expect(Array.isArray(r)).toBe(true);
    expect(calls[0]!.cameras).toHaveLength(1);
    expect(calls[0]!.cameras![0]).toEqual({
      position: [30, 20, 30],
      target: [0, 0, 0],
      fovDeg: 45,
    });
  });

  test('a render failure returns an in-band ok:false (no image)', async () => {
    const model = new PlacementModel('T', { catalog: [asset('well')] });
    const sink: ComposerSink = {};
    const render: SceneRenderPort = async () => ({ ok: false, error: 'boom' });
    const tools = makeSceneComposerTools({ model, render, sink });
    await call(tools, 'scene_place', { asset: 'well', at: [0, 0] });
    const r = await call(tools, 'scene_render');
    expect(Array.isArray(r)).toBe(false);
    expect(r.ok).toBe(false);
    expect(r.error).toBe('boom');
  });
});

describe('finalize', () => {
  test('scene_finalize flips the sink + returns the final program', async () => {
    const { tools, sink } = setup();
    await call(tools, 'scene_place', { asset: 'well', at: [0, 0], role: 'hero' });
    const r = await call(tools, 'scene_finalize');
    expect(r.ok).toBe(true);
    expect(r.program).toContain('export default s;');
    expect(sink.finalized).toBe(true);
  });
});

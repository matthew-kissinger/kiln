/** Native reference-tool media, inspection, material, and view-evidence contracts. */
import { describe, expect, test } from 'bun:test';
import { ImageBlock, JsonBlock } from '@strands-agents/sdk';
import { createHash } from 'node:crypto';
import { makeKilnNativeTools } from './tools';
import { MemoryProgramStore } from '../program-store';
import { ProgramArtifactStore } from '../tools/program-artifacts';
import type { KilnToolContext } from '../tools/registry';
import { resolveRequirementsContext } from '../requirements-context';
import { encodePng } from '../views';

async function fixture(code: string, context: KilnToolContext = {}) {
  const programStore = new MemoryProgramStore();
  const programRef = await programStore.put(code);
  const artifacts = new ProgramArtifactStore();
  const tools = makeKilnNativeTools({}, { ...context, programStore, programArtifacts: artifacts });
  return { tools, programRef, artifacts };
}
function findTool(tools: ReturnType<typeof makeKilnNativeTools>, name: string) {
  const tool = tools.find((candidate) => candidate.name === name);
  if (!tool) throw new Error(`Missing native tool ${name}`);
  return tool as unknown as { invoke(input: unknown): Promise<unknown> };
}

const BOX_CODE = `
const meta = { name: 'test-box', category: 'prop' };
function build() {
  const root = createRoot('Root');
  createPart('Mesh_Box', boxGeo(1, 1, 1), gameMaterial('#ff0000'), { parent: root, position: [0, 0.5, 0] });
  return root;
}
`;

const TEXTURED_BOX_CODE = `
const meta = { name: 'textured-box', category: 'prop' };
function build() {
  const root = createRoot('Root');
  const albedo = proceduralTexture({
    schemaVersion: 2,
    size: 8,
    usage: 'albedo',
    name: 'PaintedSteel',
    layers: [{ op: 'solid', color: 0x5b7088 }],
  });
  const normal = normalMapFromHeight(albedo, { strength: 2 });
  createPart('Mesh_Box', boxGeo(1, 1, 1), pbrMaterial({ albedo, normal }), {
    parent: root,
    position: [0, 0.5, 0],
  });
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

describe('native reference tools', () => {
  test('kiln_render returns [ImageBlock, JsonBlock] for a retained program', async () => {
    const { tools, programRef } = await fixture(BOX_CODE);
    const out = (await findTool(tools, 'kiln_render').invoke({ programRef })) as unknown[];
    expect(Array.isArray(out)).toBe(true);
    expect(out).toHaveLength(2);
    expect(out[0]).toBeInstanceOf(ImageBlock);
    expect(out[1]).toBeInstanceOf(JsonBlock);
    const json = (out[1] as JsonBlock).json as Record<string, unknown>;
    expect(json['ok']).toBe(true);
    expect(json['tris']).toBeGreaterThan(0); // metrics ride alongside the image
    expect('pngBase64' in json).toBe(false);
  });

  test('kiln_render fails closed with exact missing procedural texture usages', async () => {
    const { tools, programRef, artifacts } = await fixture(TEXTURED_BOX_CODE, {
      requiredProceduralTextureUsages: ['albedo', 'normal', 'metallicRoughness'],
    });
    const out = (await findTool(tools, 'kiln_render').invoke({ programRef })) as {
      ok: boolean;
      error?: string;
      materialContract?: { required: string[]; present: string[]; missing: string[] };
    };
    expect(Array.isArray(out)).toBe(false);
    expect(out.ok).toBe(false);
    expect(out.error).toContain('metallicRoughness');
    expect(out.materialContract).toEqual({
      required: ['albedo', 'normal', 'metallicRoughness'],
      present: ['albedo', 'normal'],
      missing: ['metallicRoughness'],
    });
    expect(artifacts.latest(resolveRequirementsContext())).toBeUndefined();
  });

  test('kiln_render accepts the exact required procedural usages and records current code', async () => {
    const { tools, programRef, artifacts } = await fixture(TEXTURED_BOX_CODE, {
      requiredProceduralTextureUsages: ['normal', 'albedo'],
    });
    const out = (await findTool(tools, 'kiln_render').invoke({ programRef })) as unknown[];
    expect(Array.isArray(out)).toBe(true);
    expect(artifacts.latest(resolveRequirementsContext())).toBeDefined();
    expect(artifacts.latest(resolveRequirementsContext())?.code).toBe(TEXTURED_BOX_CODE);
  });

  test('kiln_render exposes and honors the bounded capture contract on the retained program', async () => {
    const { tools, programRef, artifacts } = await fixture(BOX_CODE);
    const render = findTool(tools, 'kiln_render');
    const out = (await render.invoke({ programRef, capture: { preset: '1x1' } })) as unknown[];
    const json = (out[1] as JsonBlock).json as {
      capture?: { preset?: string; cols?: number; cells?: number; backdrop?: string };
    };
    expect(json.capture).toEqual({ preset: '1x1', cols: 1, cells: 1, backdrop: 'neutral' });
    expect(artifacts.latest(resolveRequirementsContext())).toBeDefined();
    expect(artifacts.latest(resolveRequirementsContext())?.captureSelection).toEqual({
      capture: { preset: '1x1' },
    });

    await render.invoke({ programRef });
    expect(artifacts.latest(resolveRequirementsContext())).toBeDefined();
    expect(artifacts.latest(resolveRequirementsContext())?.captureSelection).toEqual({}); // a later successful default render wins
  });

  test('kiln_render on a broken source is image-free (plain JSON error)', async () => {
    const { tools, programRef, artifacts } = await fixture('not a kiln program (');
    const out = (await findTool(tools, 'kiln_render').invoke({ programRef })) as {
      ok: boolean;
      error?: string;
    };
    expect(Array.isArray(out)).toBe(false);
    expect(out.ok).toBe(false);
    expect(out.error).toBeDefined();
    expect(artifacts.latest(resolveRequirementsContext())).toBeUndefined();
  });

  test('shares last faithful evidence across kiln_render then degraded kiln_inspect', async () => {
    const materialCode = TWO_PART_CODE.replace(
      "gameMaterial('#9aa0a6')",
      "gameMaterial('#9aa0a6', { metalness: 0.6 })",
    );
    let calls = 0;
    const { tools, programRef } = await fixture(materialCode, {
      viewRenderPort: async (request) => {
        calls++;
        if (calls > 1) return { ok: false, rendererId: 'gpu:test', error: 'device lost' };
        const size = request.size!;
        const png = new Uint8Array(encodePng(new Uint8Array(size * size * 3), size, size));
        return {
          ok: true,
          rendererId: 'gpu:test',
          viewsPng: request.viewDirs!.map(() => png),
          derivativeFidelity: {
            materialFaithful: true,
            inputGlbSha256: `sha256:${createHash('sha256').update(request.glb).digest('hex')}`,
          },
        };
      },
    });
    const render = (await findTool(tools, 'kiln_render').invoke({ programRef })) as unknown[];
    const inspect = (await findTool(tools, 'kiln_inspect').invoke({
      programRef,
      isolate: true,
    })) as unknown[];
    type EvidenceJson = {
      viewEvidence: {
        current: Record<string, unknown>;
        lastFaithful?: Record<string, unknown>;
      };
    };
    const renderJson = (render[1] as JsonBlock).json as unknown as EvidenceJson;
    const inspectJson = (inspect[1] as JsonBlock).json as unknown as EvidenceJson;

    expect(renderJson.viewEvidence.current).toMatchObject({
      sequence: 1,
      surface: 'kiln_render',
      materialFaithful: true,
    });
    expect(inspectJson.viewEvidence.current).toMatchObject({
      sequence: 2,
      surface: 'kiln_inspect',
      materialFaithful: false,
      degraded: true,
    });
    expect(inspectJson.viewEvidence.lastFaithful).toMatchObject({
      sequence: 1,
      surface: 'kiln_render',
      inputGlbSha256: renderJson.viewEvidence.current['inputGlbSha256'],
    });
  });

  test('kiln_inspect frames a named part: [ImageBlock, JsonBlock] and the text names part + view', async () => {
    const { tools, programRef } = await fixture(TWO_PART_CODE);
    const out = (await findTool(tools, 'kiln_inspect').invoke({
      programRef,
      part: 'head',
    })) as unknown[];
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

  test('kiln_inspect exposes and honors object-relative orbit angles on the retained program', async () => {
    const { tools, programRef } = await fixture(TWO_PART_CODE);
    const inspect = findTool(tools, 'kiln_inspect');
    const out = (await inspect.invoke({
      programRef,
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
    const { tools, programRef } = await fixture(TWO_PART_CODE);
    const out = (await findTool(tools, 'kiln_inspect').invoke({ programRef, part: 'Blade' })) as {
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
    const { tools, programRef } = await fixture(TWO_PART_CODE);
    const out = (await findTool(tools, 'kiln_inspect').invoke({
      programRef,
      part: 'head',
      isolate: true,
    })) as unknown[];
    expect(out[0]).toBeInstanceOf(ImageBlock);
    const json = (out[1] as JsonBlock).json as Record<string, unknown>;
    expect(json['isolated']).toBe(true);
    expect(json['framed']).toContain('nothing in this image occludes it');
  });

  test('kiln_inspect defaults to isolate:false and says so in the framing line', async () => {
    const { tools, programRef } = await fixture(TWO_PART_CODE);
    const out = (await findTool(tools, 'kiln_inspect').invoke({
      programRef,
      part: 'head',
    })) as unknown[];
    const json = (out[1] as JsonBlock).json as Record<string, unknown>;
    expect(json['isolated']).toBe(false);
    expect(json['framed']).toContain('may occlude it');
  });

  test('kiln_inspect isolate:true without a part is a no-op, not an error', async () => {
    const { tools, programRef } = await fixture(TWO_PART_CODE);
    const out = (await findTool(tools, 'kiln_inspect').invoke({
      programRef,
      isolate: true,
    })) as unknown[];
    const json = (out[1] as JsonBlock).json as Record<string, unknown>;
    expect(json['ok']).toBe(true);
    expect(json['isolated']).toBe(false);
    expect(json['framed']).toContain('whole asset');
  });

  test('kiln_inspect with no part frames the whole asset in one view', async () => {
    const { tools, programRef } = await fixture(TWO_PART_CODE);
    const out = (await findTool(tools, 'kiln_inspect').invoke({
      programRef,
      view: 'front',
    })) as unknown[];
    expect(Array.isArray(out)).toBe(true);
    expect(out[0]).toBeInstanceOf(ImageBlock);
    const json = (out[1] as JsonBlock).json as Record<string, unknown>;
    expect(json['ok']).toBe(true);
    expect('part' in json).toBe(false); // nothing singled out — whole-asset framing
    expect(json['view']).toBe('front');
    expect(json['framed']).toContain('whole asset');
  });

  test('kiln_view_interior returns [ImageBlock, JsonBlock] for a building revision', async () => {
    const { tools, programRef } = await fixture(BUILDING_CODE);
    const out = (await findTool(tools, 'kiln_view_interior').invoke({ programRef })) as unknown[];
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

  test('kiln_view_interior echoes the backdrop it painted, like every other image result', async () => {
    const { tools, programRef } = await fixture(BUILDING_CODE);
    const plain = (await findTool(tools, 'kiln_view_interior').invoke({ programRef })) as unknown[];
    const plainJson = (plain[1] as JsonBlock).json as { capture?: { backdrop?: string } };
    expect(plainJson.capture?.backdrop).toBe('neutral');
    const dark = (await findTool(tools, 'kiln_view_interior').invoke({
      programRef,
      capture: { version: 'kiln.capture.v1', backdrop: 'dark', shots: [{ name: 'Inside' }] },
    })) as unknown[];
    const darkJson = (dark[1] as JsonBlock).json as {
      ok?: boolean;
      capture?: { backdrop?: string };
    };
    expect(darkJson.ok).toBe(true);
    expect(darkJson.capture?.backdrop).toBe('dark');
  });

  test('kiln_view_interior on a broken source is image-free (plain JSON error)', async () => {
    const { tools, programRef } = await fixture('not a kiln program (');
    const out = (await findTool(tools, 'kiln_view_interior').invoke({ programRef })) as {
      ok: boolean;
      error?: string;
    };
    expect(Array.isArray(out)).toBe(false);
    expect(out.ok).toBe(false);
    expect(out.error).toBeDefined();
  });

  test('kiln_view_interior lifts a semantically-roled roof that is NOT named "Roof"', async () => {
    const lidCode = BUILDING_CODE.replace("createRoofPlanes('Roof'", "createRoofPlanes('Lid'");
    const { tools, programRef } = await fixture(lidCode);
    const out = (await findTool(tools, 'kiln_view_interior').invoke({ programRef })) as unknown[];
    const json = (out[1] as JsonBlock).json as Record<string, unknown>;
    // createRoofPlanes stamps roof.* roles regardless of the node's name, so the
    // tool resolves the roof by role. The asset is already correct — there must
    // be no warning telling the model to rename anything.
    expect(json['roofsHidden']).toBe(1);
    expect((json['warnings'] as string[]).join(' ')).not.toContain('could not be lifted');
    expect((json['warnings'] as string[]).join(' ')).not.toContain('still occluded');
  });

  test('kiln_view_interior warns in explicit-override mode when the named node is absent', async () => {
    const { tools, programRef } = await fixture(BUILDING_CODE);
    const out = (await findTool(tools, 'kiln_view_interior').invoke({
      programRef,
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
    const { tools, programRef } = await fixture(BOX_CODE);
    const out = (await findTool(tools, 'kiln_view_interior').invoke({ programRef })) as unknown[];
    const json = (out[1] as JsonBlock).json as Record<string, unknown>;
    expect(json['roofsHidden']).toBe(0);
    const warnings = (json['warnings'] as string[]).join(' ');
    expect(warnings).toContain('No roof was found');
    expect(warnings).toContain('createRoofPlanes');
  });
});
test('reference inspection forwards the shared exact camera shot', async () => {
  const { tools, programRef } = await fixture(BOX_CODE);
  const result = (await findTool(tools, 'kiln_inspect').invoke({
    programRef,
    shot: {
      camera: {
        type: 'explicit',
        projection: 'perspective',
        position: [3, 2, 3],
        target: [0, 0.5, 0],
      },
    },
  })) as unknown[];
  const json = (result.find((v) => v instanceof JsonBlock) as JsonBlock).json as Record<
    string,
    unknown
  >;
  expect(json.cameraShot).toMatchObject({ camera: { projection: 'perspective' } });
});

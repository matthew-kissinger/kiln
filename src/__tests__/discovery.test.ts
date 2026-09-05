import { describe, expect, it } from 'bun:test';
import { createKilnProgramToolRegistry, createKilnToolRegistry } from '../tools/registry';
import { createLocalToolContext } from '../local-runtime';

const discovery = () =>
  createKilnProgramToolRegistry().find((tool) => tool.name === 'kiln_list_primitives')!;
type Result = {
  primitives: { name: string; category: string }[];
  text: string;
  total: number;
  nextOffset: number | null;
  error?: string;
  categories: string[];
};

describe('progressive capability discovery', () => {
  it('groups exact signatures in requested order and reports every unknown name', async () => {
    const tool = discovery();
    const result = (await tool.run({ names: ['createPart', 'loftProfiles', 'boxGeo'] })) as Result;
    expect(result.primitives.map((p) => p.name)).toEqual(['createPart', 'loftProfiles', 'boxGeo']);
    expect(result.total).toBe(3);
    expect(result.nextOffset).toBeNull();
    expect(result.text.match(/^e\.g\./gm)).toHaveLength(3);
    expect(result.text.length).toBeLessThan(6000);
    const missing = (await tool.run({
      names: ['boxGeo', 'inventedMesh', 'unknownSurface'],
    })) as Result;
    expect(missing.error).toContain('inventedMesh');
    expect(missing.error).toContain('unknownSurface');
    expect(missing.primitives).toHaveLength(0);
    expect(
      ((await tool.run({ names: ['boxGeo'], category: 'geometry' })) as Result).error,
    ).toContain('alone');
    await expect(tool.run({ names: Array(7).fill('boxGeo') })).rejects.toThrow();
  });
  it('reports effective host limits and current camera/export support without confusing a cache wrapper for an external evaluator', async () => {
    const local = createLocalToolContext({}, { KILN_EVALUATOR_TIMEOUT_MS: '4321' });
    const tool = createKilnProgramToolRegistry(local).find(
      (t) => t.name === 'kiln_list_primitives',
    )!;
    const result = (await tool.run({ capabilities: true })) as {
      capabilities: {
        execution: { mode: string; deadlineMs?: number };
        camera: { version: string; maxShots: number };
        geometry: { materialGroups: boolean; attributes: string[] };
      };
      text: string;
    };
    expect(result.capabilities.execution.mode).toBe('subprocess');
    expect(result.capabilities.execution.deadlineMs).toBe(4321);
    expect(result.capabilities.camera.version).toBe('kiln.capture.v1');
    expect(result.capabilities.camera.maxShots).toBe(9);
    expect(result.capabilities.geometry.materialGroups).toBe(true);
    expect(result.capabilities.geometry.attributes).toContain('uv');
    expect(result.text.length).toBeLessThan(4000);
    const trusted = (await discovery().run({ capabilities: true })) as typeof result;
    expect(trusted.capabilities.execution.mode).toBe('trusted-local');
    expect(trusted.capabilities.execution.deadlineMs).toBeUndefined();
  });
  it('returns a compact complete overview and an exact lookup with a usable example', async () => {
    const tool = discovery();
    const overview = (await tool.run({})) as Result;
    expect(overview.primitives.length).toBeGreaterThan(50);
    expect(overview.text.length).toBeLessThan(12000);
    expect(overview.text).toContain('BufferGeometry');
    expect(overview.text).toContain('programRef');
    const selected = (await tool.run({ name: 'boxGeo' })) as Result;
    expect(selected.primitives.map((entry) => entry.name)).toEqual(['boxGeo']);
    expect(selected.text).toContain('e.g.');
    expect(selected.total).toBe(1);
    expect(selected.nextOffset).toBeNull();
  });

  it('searches descriptions and pages results without dropping or repeating entries', async () => {
    const tool = discovery();
    const first = (await tool.run({ category: 'geometry', query: 'geo', limit: 2 })) as Result;
    expect(first.primitives).toHaveLength(2);
    expect(first.nextOffset).toBe(2);
    const second = (await tool.run({
      category: 'geometry',
      query: 'geo',
      limit: 2,
      offset: first.nextOffset,
    })) as Result;
    expect(second.total).toBe(first.total);
    expect(
      second.primitives.every((entry) => !first.primitives.some((a) => a.name === entry.name)),
    ).toBe(true);
    const holes = (await tool.run({ query: 'holes', limit: 12 })) as Result;
    expect(holes.primitives.some((entry) => entry.name === 'extrudeProfile')).toBe(true);
  });

  it('explains invalid categories and missing names and bounds model-controlled input', async () => {
    const tool = discovery();
    const invalid = (await tool.run({ category: 'clay' })) as Result;
    expect(invalid.error).toContain('Unknown category');
    expect(invalid.categories).toContain('geometry');
    expect(invalid.text).toContain('geometry');
    const missing = (await tool.run({ name: 'inventedMesh' })) as Result;
    expect(missing.error).toContain('inventedMesh');
    expect(missing.text).toContain('query');
    await expect(tool.run({ limit: 100 })).rejects.toThrow();
    await expect(tool.run({ offset: -1 })).rejects.toThrow();
    await expect(tool.run({ accidentalField: true })).rejects.toThrow();
  });

  it('retains the historical baseline catalog shape', async () => {
    const old = createKilnToolRegistry().find((tool) => tool.name === 'kiln_list_primitives')!;
    const result = (await old.run({ category: 'geometry' })) as Result;
    expect(result.primitives.length).toBeGreaterThan(15);
    expect(result.text).toContain('e.g.');
  });

  it('reports the actual revision store usage without exporting stored source', async () => {
    const tools = createKilnProgramToolRegistry();
    const list = tools.find((t) => t.name === 'kiln_list_primitives')!;
    const validate = tools.find((t) => t.name === 'kiln_validate')!;
    const source = 'function build(){return createRoot("Usage");}';
    await validate.run({ code: source });
    await validate.run({ code: source });
    const result = (await list.run({ capabilities: true })) as {
      capabilities: { source: { storage: { entries: number; bytes: number; eviction: string } } };
      text: string;
    };
    expect(result.capabilities.source.storage).toMatchObject({
      entries: 1,
      bytes: Buffer.byteLength(source),
      eviction: 'none',
    });
    expect(result.text).not.toContain(source);
  });
});

import { describe, expect, it } from 'bun:test';
import { createCachedEvaluatorPort, MemoryBuildCache } from '../build-cache';
import { renderGLBInProcess } from '../render';
import type { EvaluatorPortV1 } from '../evaluator';
import { createKilnProgramToolRegistry } from '../tools/registry';
import { FileBuildCache } from '../build-cache-node';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const source =
  "const meta={name:'Post',category:'prop'}; function build(){const r=createRoot('Post');createPart('Body',boxGeo(1,2,1),gameMaterial(0x888888),{parent:r,position:[0,1,0]});return r;}";

describe('immutable build reuse', () => {
  it('reuses verified disk artifacts across cache instances and treats corruption as a miss', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'kiln-build-cache-'));
    try {
      const result = await renderGLBInProcess(source);
      const key = `sha256:${'a'.repeat(64)}`;
      const first = new FileBuildCache(directory);
      await first.put(key, result);
      const restored = await new FileBuildCache(directory).get(key);
      expect(restored?.artifactGlbSha256).toBe(result.artifactGlbSha256);
      expect(restored?.glb).toEqual(result.glb);
      const file = join(directory, `${key.slice(7)}.json`);
      const bytes = await readFile(file, 'utf8');
      await writeFile(file, bytes.replace('glbBase64', 'brokenBase64'));
      expect(await first.get(key)).toBeUndefined();
      await expect(first.get('../../source')).rejects.toThrow('cache key');
      const tiny = new FileBuildCache(directory, 1);
      await tiny.put(`sha256:${'b'.repeat(64)}`, result);
      expect(await tiny.get(`sha256:${'b'.repeat(64)}`)).toBeUndefined();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
  it('reuses evaluation for reference-based camera changes through public tools', async () => {
    let builds = 0;
    const evaluator: EvaluatorPortV1 = {
      render: async (code, options) => {
        builds++;
        return renderGLBInProcess(code, options);
      },
    };
    const tools = createKilnProgramToolRegistry({
      evaluatorPort: evaluator,
      evaluatorCacheIdentity: 'fixture-v1',
    });
    const render = tools.find((tool) => tool.name === 'kiln_render')!;
    const first = (await render.run({ code: source, capture: { preset: '1x1' } })) as {
      ok: boolean;
      programRef: string;
      buildCache?: { hit: boolean };
    };
    const second = (await render.run({
      programRef: first.programRef,
      capture: { preset: '2x1' },
    })) as typeof first;
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(builds).toBe(1);
    expect(second.buildCache?.hit).toBe(true);
  });
  it('coalesces builds and returns independent artifact bytes and metadata', async () => {
    let builds = 0;
    const evaluator: EvaluatorPortV1 = {
      render: async (code, options) => {
        builds++;
        return renderGLBInProcess(code, options);
      },
    };
    const port = createCachedEvaluatorPort(evaluator, {
      cache: new MemoryBuildCache(),
      identity: () => 'fixture-engine-1',
    });
    const [a, b] = await Promise.all([port.render(source), port.render(source)]);
    expect(builds).toBe(1);
    expect(a.glb).toEqual(b.glb);
    a.glb.fill(0);
    a.warnings.push('caller mutation');
    const c = await port.render(source);
    expect(c.glb).toEqual(b.glb);
    expect(c.warnings).not.toContain('caller mutation');
    expect(c.buildCache?.hit).toBe(true);
    expect(c.buildCache?.key).toMatch(/^sha256:/);
  });

  it('invalidates source, options and host identity and bypasses unknown dependencies', async () => {
    let builds = 0;
    let identity: string | undefined = 'engine-1';
    const evaluator: EvaluatorPortV1 = {
      render: async (code, options) => {
        builds++;
        return renderGLBInProcess(code, options);
      },
    };
    const port = createCachedEvaluatorPort(evaluator, {
      cache: new MemoryBuildCache(),
      identity: () => identity,
    });
    await port.render(source, { optimize: 'off' });
    await port.render(source, { optimize: 'off' });
    expect(builds).toBe(1);
    await port.render(source.replace('boxGeo(1,2,1)', 'boxGeo(1,3,1)'), { optimize: 'off' });
    await port.render(source, { optimize: 'auto' });
    identity = 'engine-2';
    await port.render(source, { optimize: 'off' });
    expect(builds).toBe(4);
    identity = undefined;
    await port.render(source);
    await port.render(source);
    expect(builds).toBe(6);
  });

  it('bounds memory and does not cache failures', async () => {
    let builds = 0;
    const evaluator: EvaluatorPortV1 = {
      render: async (code, options) => {
        builds++;
        return renderGLBInProcess(code, options);
      },
    };
    const cache = new MemoryBuildCache(1);
    const port = createCachedEvaluatorPort(evaluator, { cache, identity: () => 'test' });
    await port.render(source);
    await port.render(source);
    expect(builds).toBe(2);
    expect(cache.stats().bytes).toBe(0);
    await expect(port.render('bad {')).rejects.toThrow();
    await expect(port.render('bad {')).rejects.toThrow();
    expect(builds).toBe(4);
  });
});

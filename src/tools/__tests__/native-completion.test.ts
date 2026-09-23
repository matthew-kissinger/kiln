import { expect, test } from 'bun:test';
import { createKilnNativeToolRegistry, type KilnRenderViewsResult } from '../registry';
import type { ViewFidelityV1 } from '../../composer/render-port';
import { MemoryProgramStore } from '../../program-store';
import { ProgramArtifactStore, type NativeCompletion } from '../program-artifacts';
import { createAssetRequirementsStore } from '../../requirements-store';
import { createAssetRequirementsV1 } from '../../contracts/requirements';

const code = `const meta={name:'Reviewed cube'};
function build(){const r=createRoot('Cube');createPart('Body',boxGeo(1,1,1),gameMaterial('#778899'),{parent:r});return r;}`;
const capture = { preset: '1x1' as const };

function setup(maxEntries = 8) {
  const programStore = new MemoryProgramStore();
  const programArtifacts = new ProgramArtifactStore({ maxEntries });
  const completion: NativeCompletion = {};
  const context = { programStore, programArtifacts, cacheEvaluations: false };
  const defs = createKilnNativeToolRegistry(context, completion);
  const call = (name: string, input: unknown) => defs.find((d) => d.name === name)!.run(input);
  return { context, completion, call, defs };
}

test('native registry advertises only usable capabilities and a reference-only terminal', () => {
  const { defs } = setup();
  const names = defs.map((d) => d.name);
  expect(names).toContain('kiln_discover');
  expect(names).toContain('kiln_finish');
  expect(names).not.toContain('kiln_save');
  expect(names).not.toContain('kiln_submit');
  expect(defs.find((d) => d.name === 'kiln_finish')!.inputSchema.safeParse({ code }).success).toBe(
    false,
  );
});

test('finish requires reviewed source and returns its exact retained bytes without reevaluation', async () => {
  const { call, context, completion } = setup();
  const ref = await context.programStore.put(code);
  await expect(call('kiln_finish', { programRef: ref })).rejects.toThrow('render');
  const result = (await call('kiln_render', { programRef: ref, capture })) as KilnRenderViewsResult;
  expect(result.ok).toBe(true);
  const retained = context.programArtifacts.get(ref, result.requirements!);
  const originalBytes = Buffer.from(retained.rendered.glb);
  retained.rendered.glb.fill(0);
  const finished = (await call('kiln_finish', { programRef: ref })) as {
    artifactGlbSha256: string;
    acceptance: string;
    viewFidelity: ViewFidelityV1;
  };
  expect(finished.artifactGlbSha256).toBe(result.viewFidelity!.inputGlbSha256);
  expect(completion.artifact!.rendered.glb).toEqual(originalBytes);
  expect(completion.artifact!.code).toBe(code);
  expect(finished.acceptance).toBe('accepted');
  expect(finished.viewFidelity.exactArtifact).toBe(true);
});

test('eviction, changed binding, and edited but unreviewed revisions cannot finish', async () => {
  const { call, context } = setup(1);
  const first = await context.programStore.put(code);
  const changed = await context.programStore.put(code.replace('#778899', '#996633'));
  await call('kiln_render', { programRef: first, capture });
  await expect(call('kiln_finish', { programRef: changed })).rejects.toThrow('render');
  await call('kiln_render', { programRef: changed, capture });
  await expect(call('kiln_finish', { programRef: first })).rejects.toThrow('render');
  const requirements = createAssetRequirementsStore().host.bind(
    { taskId: 'new', lineageId: 'other' },
    createAssetRequirementsV1(),
    { actor: 'host', reason: 'Different brief', source: 'brief' },
  );
  const rebound = createKilnNativeToolRegistry({ ...context, requirements }, {});
  await expect(
    rebound.find((d) => d.name === 'kiln_finish')!.run({ programRef: changed }),
  ).rejects.toThrow('requirements');
});

test('retained diagnostic PNGs remain binary and detached from callers', async () => {
  const { call, context } = setup();
  const ref = await context.programStore.put(code);
  const review = (await call('kiln_render', { programRef: ref, capture })) as KilnRenderViewsResult;
  const artifact = context.programArtifacts.get(ref, review.requirements!);
  const png = Buffer.from(review.pngBase64!, 'base64');
  artifact.rendered.diagnosticViews = [
    {
      id: 'diagnostic',
      label: 'Diagnostic',
      cameraId: 'front',
      kind: 'skeleton',
      width: review.gridWidth!,
      height: review.gridHeight!,
      png,
      regions: [],
    },
  ];
  await context.programArtifacts.record(artifact);
  png.fill(0);
  const restored = context.programArtifacts.get(ref, review.requirements!);
  expect(Buffer.isBuffer(restored.rendered.diagnosticViews![0]!.png)).toBe(true);
  expect(restored.rendered.diagnosticViews![0]!.png.toString('base64')).toBe(review.pngBase64!);
});

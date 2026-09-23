import { expect, test } from 'bun:test';
import { createKilnProgramToolRegistry, type KilnInspectResult } from '../registry';
import { trustedInProcessEvaluatorPortV2 } from '../../evaluator';

const source =
  "const meta={name:'pair'};function build(){const r=createRoot('Root');createPart('A',boxGeo(1,1,1),gameMaterial('#8899aa'),{parent:r});return r;}";

test('shared registry comparison reuses its default store and works with exact shots', async () => {
  const registry = createKilnProgramToolRegistry({
    evaluatorPort: trustedInProcessEvaluatorPortV2,
  });
  const validate = registry.find((t) => t.name === 'kiln_validate')!;
  const inspect = registry.find((t) => t.name === 'kiln_inspect')!;
  const saved = (await validate.run({ code: source })) as { programRef: string };
  const output = (await inspect.run({
    code: source.replace('boxGeo(1,1,1)', 'boxGeo(2,1,1)'),
    compare: { programRef: saved.programRef },
    shot: { subject: { name: 'Mesh_A' }, camera: { type: 'orbit' } },
  })) as KilnInspectResult;
  expect(output.ok).toBe(true);
  expect(output.comparison!.before.bounds!.size).toEqual([1, 1, 1]);
  expect(output.comparison!.after.bounds!.size).toEqual([2, 1, 1]);
  expect(output.comparison!.changes.find((c) => c.name === 'Mesh_A')!.fields).toEqual([
    'geometry',
    'bounds',
  ]);
  expect(inspect.media!(output)!.png.length).toBeGreaterThan(100);
  const missing = (await inspect.run({
    code: source,
    compare: { programRef: 'p_000000000000' },
  })) as KilnInspectResult;
  expect(missing.ok).toBe(false);
  expect(missing.error).toContain('Program not found');
  expect(missing.comparison).toBeUndefined();
  expect(inspect.media!(missing)).toBeUndefined();
});

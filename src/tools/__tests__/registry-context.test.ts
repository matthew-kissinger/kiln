import { describe, expect, test } from 'bun:test';

import { createAssetIntentV1 } from '../../contracts';
import {
  createKilnRenderViewsDef,
  createKilnScreenshotAnimationDef,
  createKilnToolRegistry,
  createKilnViewInteriorDef,
  kilnToolRegistry,
} from '../registry';

const SIDEWAYS_FALSE_PROP_CODE = `
const meta = { name: 'sideways', category: 'prop' };
function build() {
  const root = createRoot('Root');
  const frame = createVehicleFrame('VehicleFrame', {
    axles: [
      { id: 'front', position: [0.3, 0.35, 0] },
      { id: 'rear', position: [-0.3, 0.35, 0] },
    ],
    parent: root,
  });
  createPart('Body', boxGeo(1, 0.7, 4), gameMaterial('#aa3333'), {
    parent: frame.root,
    position: [0, 0.5, 0],
  });
  const rubber = gameMaterial('#111111', { roughness: 0.95 });
  const metal = gameMaterial('#888888', { metalness: 0.8 });
  const geometries = createWheelGeometrySet(0.35, 0.18);
  for (const [index, x] of [['front', 0.3], ['rear', -0.3]]) {
    for (const [side, z] of [['left', -1.6], ['right', 1.6]]) {
      createWheelAssembly(index + side, { tire: rubber, rim: metal }, {
        radius: 0.35, width: 0.18, side, index,
        position: [x, 0.35, z], steering: index === 'front', geometries, parent: frame.root,
      });
    }
  }
  return root;
}
`;

const FALSE_PROP_BUDGET_CODE = `
const meta = { name: 'budget', category: 'prop' };
function build() {
  const root = createRoot('Root');
  for (let i = 0; i < 30; i++) {
    createPart('Part_' + i, sphereGeo(1, 32, 24), gameMaterial('#777777'), { parent: root });
  }
  return root;
}
`;

const find = (registry: ReturnType<typeof createKilnToolRegistry>, name: string) => {
  const def = registry.find((candidate) => candidate.name === name);
  if (!def) throw new Error(`Missing tool ${name}`);
  return def;
};

const warningStrings = (output: unknown): string[] =>
  ((output as { warnings?: string[] }).warnings ?? []).map(String);

describe('trusted tool context', () => {
  test('a dense asset draws no size advisory under any trusted category', async () => {
    // This used to assert that a trusted `prop` context produced a triangle
    // advisory the model's own false `meta.category` could not dodge. The
    // advisory is gone on purpose — it taught models to stop at the blockout
    // stage — so what is worth pinning now is the inverse: no category, trusted
    // or claimed, turns a heavy asset into a warning.
    const contexts = [
      find(createKilnToolRegistry({ category: 'vehicle' }), 'kiln_validate'),
      find(createKilnToolRegistry({ category: 'prop' }), 'kiln_validate'),
      find(createKilnToolRegistry(), 'kiln_validate'),
    ];

    for (const def of contexts) {
      const warnings = warningStrings(await def.run({ code: FALSE_PROP_BUDGET_CODE }));
      expect(warnings.some((warning) => warning.includes('TRI_BUDGET'))).toBe(false);
      expect(warnings.some((warning) => /triangle/i.test(warning))).toBe(false);
    }
  });

  test('intent is authoritative and render/screenshot paths receive vehicle context', async () => {
    const intent = createAssetIntentV1({ category: 'vehicle' });
    const registry = createKilnToolRegistry({ intent, category: 'prop' });

    for (const name of ['kiln_render', 'kiln_screenshot']) {
      const output = await find(registry, name).run({ code: SIDEWAYS_FALSE_PROP_CODE });
      expect(warningStrings(output).some((warning) => warning.includes('Orientation'))).toBe(true);
    }
  });

  test('collapsed render and dedicated view definitions share the closure context', async () => {
    const context = { intent: createAssetIntentV1({ category: 'vehicle' }) };
    const outputs = await Promise.all([
      createKilnRenderViewsDef(context).run({ code: SIDEWAYS_FALSE_PROP_CODE }),
      createKilnScreenshotAnimationDef(context).run({
        code: SIDEWAYS_FALSE_PROP_CODE,
        clip: 'missing',
      }),
      createKilnViewInteriorDef(context).run({ code: SIDEWAYS_FALSE_PROP_CODE }),
    ]);

    for (const output of outputs) {
      expect(warningStrings(output).some((warning) => warning.includes('Orientation'))).toBe(true);
    }
  });

  test('legacy registry export is neutral and never trusts source metadata', async () => {
    const output = await find(kilnToolRegistry, 'kiln_render').run({
      code: SIDEWAYS_FALSE_PROP_CODE.replace("category: 'prop'", "category: 'vehicle'"),
    });
    expect(warningStrings(output).some((warning) => warning.includes('Orientation'))).toBe(false);
  });
});

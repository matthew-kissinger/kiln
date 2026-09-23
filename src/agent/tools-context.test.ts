import { expect, test } from 'bun:test';
import { JsonBlock } from '@strands-agents/sdk';
import { makeKilnNativeTools } from './tools';
import { MemoryProgramStore } from '../program-store';
import { createAssetRequirementsV1 } from '../contracts/requirements';
import { createAssetRequirementsStore } from '../requirements-store';

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
    createWheelAssembly(index + 'Left', { tire: rubber, rim: metal }, {
      radius: 0.35, width: 0.18, side: 'left', index,
      position: [x, 0.35, -1.6], steering: index === 'front', geometries, parent: frame.root,
    });
    createWheelAssembly(index + 'Right', { tire: rubber, rim: metal }, {
      radius: 0.35, width: 0.18, side: 'right', index,
      position: [x, 0.35, 1.6], steering: index === 'front', geometries, parent: frame.root,
    });
  }
  return root;
}
`;

// Preserve the orientation obligation from the old category-context tests. This
// now checks the structured neutral rule and its evidence mode.
for (const operation of ['source', 'reference', 'edit'] as const) {
  test(`native ${operation} preserves host mobility requirements despite false source labels`, async () => {
    const requirements = createAssetRequirementsStore().host.bind(
      { taskId: 'mobility', lineageId: operation },
      createAssetRequirementsV1({
        requirements: {
          mobility: {
            state: 'requested',
            value: { wheelCount: 4, axleCount: 2, supportPolicy: 'grounded' },
          },
        },
      }),
      { actor: 'owner', reason: 'Requested wheeled vehicle', source: 'brief' },
    );
    const programStore = new MemoryProgramStore();
    const programRef = await programStore.put(SIDEWAYS_FALSE_PROP_CODE);
    const tools = makeKilnNativeTools({}, { requirements, programStore });
    const name = operation === 'edit' ? 'kiln_edit' : 'kiln_render';
    const input =
      operation === 'source'
        ? { code: SIDEWAYS_FALSE_PROP_CODE }
        : operation === 'reference'
          ? { programRef }
          : { programRef, edits: [{ oldString: '#aa3333', newString: '#bb4444' }] };
    const tool = tools.find((t) => t.name === name)! as unknown as {
      invoke(input: unknown): Promise<unknown>;
    };
    const result = (await tool.invoke(input)) as unknown[];
    const payload = (result.find((b) => b instanceof JsonBlock) as JsonBlock).json as Record<
      string,
      unknown
    >;
    const json = (operation === 'edit' ? payload.render : payload) as unknown as {
      requirements: { binding: unknown };
      qaReport: {
        dimensions: { requirementReadiness: { findings: { code: string; disposition: string }[] } };
      };
    };
    expect(json.requirements.binding).toEqual(requirements);
    expect(json.qaReport.dimensions.requirementReadiness.findings).toContainEqual(
      expect.objectContaining({ code: 'VEH_ORIENTATION_SIDEWAYS', disposition: 'observe' }),
    );
  });
}

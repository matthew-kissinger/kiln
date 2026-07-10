import { describe, expect, test } from 'bun:test';
import type { JsonBlock } from '@strands-agents/sdk';

import { createAssetIntentV1 } from '../contracts';
import { buildAgentTools, type AgentSinks } from './surface';

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

const sinks = (): AgentSinks => ({
  sink: {},
  editSink: { edits: [] },
  unifiedSink: { edits: [] },
});

function findTool(tools: ReturnType<typeof buildAgentTools>, name: string) {
  const found = tools.find((tool) => tool.name === name) as
    | { invoke(input: unknown): Promise<unknown> }
    | undefined;
  if (!found) throw new Error(`Missing agent tool ${name}`);
  return found;
}

describe('agent trusted tool context', () => {
  test('current surface binds requested category outside generated source', async () => {
    const tools = buildAgentTools('current', { category: 'vehicle' }, sinks());
    const output = (await findTool(tools, 'kiln_render').invoke({
      code: SIDEWAYS_FALSE_PROP_CODE,
    })) as { warnings: string[] };
    expect(output.warnings.some((warning) => warning.includes('Orientation'))).toBe(true);
  });

  test('unified surface binds full intent and carries it into collapsed render', async () => {
    const tools = buildAgentTools(
      'unified',
      {
        existingCode: SIDEWAYS_FALSE_PROP_CODE,
        intent: createAssetIntentV1({ category: 'vehicle' }),
      },
      sinks(),
    );
    const output = (await findTool(tools, 'kiln_render').invoke({})) as unknown[];
    const json = (output[1] as JsonBlock).json as { warnings: string[] };
    expect(json.warnings.some((warning) => warning.includes('Orientation'))).toBe(true);
  });

  test('edit surface preserves requested category for screenshot QA', async () => {
    const tools = buildAgentTools(
      'current',
      {
        existingCode: SIDEWAYS_FALSE_PROP_CODE,
        refineMode: 'edit',
        category: 'vehicle',
      },
      sinks(),
    );
    const output = (await findTool(tools, 'kiln_screenshot').invoke({})) as unknown[];
    const json = (output[1] as JsonBlock).json as { warnings: string[] };
    expect(json.warnings.some((warning) => warning.includes('Orientation'))).toBe(true);
  });
});

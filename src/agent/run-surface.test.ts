import { describe, expect, test } from 'bun:test';
import { makeKilnNativeTools } from './tools';
import type { InLoopViewRender, KilnToolContext, RenderObservationInput } from '../tools/registry';
const METAL_CODE = `
const meta = { name: 'metal-box', category: 'prop' };
function build() {
  const root = createRoot('Root');
  createPart('Body', boxGeo(1, 1, 1), gameMaterial('#c0c0c0', { metalness: 0.6 }), { parent: root });
  return root;
}
`;

function findTool(tools: ReturnType<typeof makeKilnNativeTools>, name: string) {
  const tool = tools.find((candidate) => candidate.name === name);
  if (!tool) throw new Error(`Missing native tool ${name}`);
  return tool as unknown as { invoke(input: unknown): Promise<unknown> };
}

describe('native host context forwarding', () => {
  test('threads the host render port, its short deadline, and tally callback into native kiln_render', async () => {
    const events: InLoopViewRender[] = [];
    const timeoutRequests: string[] = [];
    let portCalls = 0;
    const context: KilnToolContext = {
      viewRenderPort: () => {
        portCalls += 1;
        return new Promise(() => {});
      },
      viewRenderTimeoutMs: 5,
      viewRenderTimeoutContext: () => ({
        warmUpState: 'pending',
        remainingGenerationBudgetMs: 9,
        rendererDeadlineMs: 8,
      }),
      viewRenderTimeoutResolver: (request) => {
        timeoutRequests.push(request.requestKind);
        return 7;
      },
      onViewsRendered: (event) => events.push(event),
    };
    const tools = makeKilnNativeTools({}, context);

    const rendered = await findTool(tools, 'kiln_render').invoke({ code: METAL_CODE });

    expect(Array.isArray(rendered)).toBe(true);
    expect(portCalls).toBe(1);
    expect(timeoutRequests).toEqual(['in-loop-grid']);
    expect(events).toHaveLength(1);
    expect(events[0]?.neededPbr).toBe(true);
    expect(events[0]?.degraded).toBe(true);
    expect(events[0]?.degradedReason).toContain('timed out after 7ms');
  });

  test('threads a host visual observer into native kiln_render without returning pixels', async () => {
    const observed: RenderObservationInput[] = [];
    const context: KilnToolContext = {
      renderObservationPort: async (input) => {
        observed.push(input);
        return { schemaVersion: 1, verdict: 'ready', findings: [] };
      },
    };
    const tools = makeKilnNativeTools({}, context);

    const rendered = (await findTool(tools, 'kiln_render').invoke({
      code: METAL_CODE,
    })) as unknown[];

    expect(rendered).toHaveLength(1);
    expect(observed).toHaveLength(1);
    expect(observed[0]?.toolName).toBe('kiln_render');
  });
});

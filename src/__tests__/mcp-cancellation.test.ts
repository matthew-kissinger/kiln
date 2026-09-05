import { expect, it } from 'bun:test';
import { Client, InMemoryTransport } from '@modelcontextprotocol/client';
import { createKilnMcpServer } from '../mcp-server';
import { createLocalToolContext } from '../local-runtime';

it('propagates a real MCP cancellation to the worker and accepts a later valid request', async () => {
  const local = createLocalToolContext({}, { KILN_EVALUATOR_TIMEOUT_MS: '1200' });
  const evaluator = local.evaluatorPort!;
  let started!: () => void;
  const ready = new Promise<void>((resolve) => {
    started = resolve;
  });
  let completed!: (code: unknown) => void;
  const outcome = new Promise<unknown>((resolve) => {
    completed = resolve;
  });
  local.evaluatorPort = {
    async render(code, options, controls) {
      started();
      try {
        return await evaluator.render(code, options, controls);
      } catch (error) {
        completed((error as { code?: string }).code);
        throw error;
      }
    },
  };
  const [ct, st] = InMemoryTransport.createLinkedPair();
  const server = createKilnMcpServer(local);
  const client = new Client({ name: 'kiln-cancel-test', version: '0' });
  await Promise.all([server.connect(st), client.connect(ct)]);
  try {
    const controller = new AbortController();
    const request = client
      .callTool(
        {
          name: 'kiln_render',
          arguments: { code: 'function build(){while(true){}}', capture: { preset: '1x1' } },
        },
        { signal: controller.signal },
      )
      .catch((error) => error);
    await ready;
    controller.abort();
    await request;
    expect(await outcome).toBe('CANCELLED');
    const valid = await client.callTool({
      name: 'kiln_render',
      arguments: {
        code: "const meta={name:'Box'};function build(){const root=createRoot('Box');createPart('Body',boxGeo(1,1,1),gameMaterial('#aaaaaa'),{parent:root});return root;}",
        capture: { preset: '1x1' },
      },
    });
    expect(valid.isError).not.toBe(true);
    expect(valid.content.some((item) => item.type === 'image')).toBe(true);
  } finally {
    await client.close();
    await server.close();
  }
}, 10000);

import { expect, it } from 'bun:test';
import { Client, InMemoryTransport } from '@modelcontextprotocol/client';
import { createKilnMcpServer } from '../mcp-server';
import { createKilnProgramToolRegistry } from '../tools/registry';

it('reports numeric shot paths for a tagged capture instead of rejecting valid version fields', async () => {
  let builds = 0;
  const server = createKilnMcpServer({
    evaluatorPort: {
      async render() {
        builds++;
        throw new Error('invalid input reached evaluation');
      },
    },
  });
  const client = new Client({ name: 'capture-error-test', version: '0' });
  const [ct, st] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(st), client.connect(ct)]);
  try {
    const args = {
      code: 'function build(){}',
      capture: {
        version: 'kiln.capture.v1',
        shots: [
          {
            camera: {
              type: 'explicit',
              projection: 'orthographic',
              position: ['4.6', 3, 5],
              target: [0, '1.15', 0],
            },
          },
        ],
      },
    };
    const message = await client.callTool({ name: 'kiln_render', arguments: args }).then(
      (result) =>
        result.content
          .filter((c) => c.type === 'text')
          .map((c) => c.text)
          .join(' '),
      (error) => error.message as string,
    );
    expect(message).toContain('shots.0.camera.position.0');
    expect(message).toContain('shots.0.camera.target.1');
    expect(message).toContain('expected number');
    expect(message).not.toContain('Unrecognized keys: "version"');
    const original = {
      code: 'function build(){}',
      capture: {
        version: 'kiln.capture.v1',
        size: 900,
        output: 'separate',
        shots: [
          {
            camera: {
              type: 'explicit',
              projection: 'orthographic',
              position: ['4.6', '3.1', '5.2'],
              target: ['0', '1.15', '0'],
              halfHeight: 1.6,
            },
          },
        ],
      },
    };
    const originalMessage = await client
      .callTool({ name: 'kiln_render', arguments: original })
      .then(
        (result) =>
          result.content
            .filter((c) => c.type === 'text')
            .map((c) => c.text)
            .join(' '),
        (error) => error.message as string,
      );
    expect(originalMessage).toContain('shots.0.camera.position.0');
    expect(originalMessage).toContain('shots.0.camera.target.2');
    expect(originalMessage).not.toContain('Unrecognized keys: "version"');
    expect(builds).toBe(0);
    const schema = createKilnProgramToolRegistry().find(
      (d) => d.name === 'kiln_render',
    )!.inputSchema;
    expect(schema.safeParse(args).success).toBe(false);
    expect(
      schema.safeParse({
        ...args,
        capture: {
          ...args.capture,
          shots: [
            {
              camera: {
                type: 'explicit',
                projection: 'orthographic',
                position: [4.6, 3, 5],
                target: [0, 1.15, 0],
              },
            },
          ],
        },
      }).success,
    ).toBe(true);
    expect(
      schema.safeParse({ code: 'function build(){}', capture: { preset: '1x1' } }).success,
    ).toBe(true);
    const legacy = schema.safeParse({
      code: 'function build(){}',
      capture: { preset: '1x1', unknown: true },
    });
    expect(legacy.success).toBe(false);
    if (!legacy.success) expect(legacy.error.message).toContain('unknown');
  } finally {
    await client.close();
    await server.close();
  }
});

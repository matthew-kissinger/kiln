import { expect, test } from 'bun:test';
import { assertNodeRuntime, CORE_NODE_RANGE } from '../runtime-support.mjs';
import { readFileSync } from 'node:fs';

test('consumer metadata carries only the core Node compatibility range', () => {
  const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
  expect(pkg.engines).toEqual({ node: CORE_NODE_RANGE });
});

test('core runtime accepts compatibility branches without requiring maintainer patch pins', () => {
  for (const version of ['20.15.0', '20.20.2', '22.2.0', '22.23.2', '24.0.0', '26.0.0'])
    expect(() => assertNodeRuntime('core', version)).not.toThrow();
  for (const version of ['18.20.0', '20.14.0', '21.7.0', '22.1.0', '22.2.0-rc.1', 'invalid'])
    expect(() => assertNodeRuntime('core', version)).toThrow('Kiln CLI/MCP');
});

test('the optional native harness has a separate Node floor', () => {
  expect(() => assertNodeRuntime('agent', '20.20.2')).toThrow('optional Strands');
  expect(() => assertNodeRuntime('agent', '22.2.0')).not.toThrow();
});

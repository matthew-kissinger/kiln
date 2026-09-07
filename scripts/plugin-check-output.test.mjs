import { expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';

test('plugin checks keep stdout available for the package JSON receipt', () => {
  const result = spawnSync('node', ['scripts/test-plugin-package.mjs'], { encoding: 'utf8' });
  expect(result.status).toBe(0);
  expect(result.stdout.trim()).toBe('');
  expect(result.stderr).toContain('Plugin packaging passed');
});

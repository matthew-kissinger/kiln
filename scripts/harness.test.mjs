import { expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { HARNESSES, resolveBin } from './harness.mjs';

test('OpenCode uses the caller working directory without removed V1 flags', () => {
  const args = HARNESSES.opencode.argv({
    model: 'opencode/example-free',
    prompt: 'Build a curved leaf',
    sandbox: '/tmp/asset workspace',
  });
  expect(args).not.toContain('--dir');
  expect(args).toContain('--standalone');
  expect(args.at(-1)).toBe('Build a curved leaf');
});

test.skipIf(process.platform !== 'win32')(
  'explicit executable paths bypass the shell even with forward slashes and spaces',
  () => {
    const root = mkdtempSync(join(tmpdir(), 'kiln explicit binary '));
    try {
      const executable = join(root, 'fixture.exe');
      copyFileSync(process.execPath, executable);
      expect(resolveBin(executable.replaceAll('\\', '/'))).toEqual({
        cmd: resolve(executable),
        shell: false,
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  },
);

test.skipIf(process.platform !== 'win32')(
  'Windows resolution preserves PATH precedence when a later executable shadows a command shim',
  () => {
    const root = mkdtempSync(join(tmpdir(), 'kiln-harness-resolution-'));
    try {
      const first = join(root, 'current');
      const second = join(root, 'old');
      mkdirSync(first);
      mkdirSync(second);
      const name = 'kiln-path-regression';
      writeFileSync(join(first, `${name}.cmd`), '@echo current\r\n');
      copyFileSync(process.execPath, join(second, `${name}.exe`));
      const probe = join(root, 'probe.mjs');
      writeFileSync(
        probe,
        `import {resolveBin} from ${JSON.stringify(new URL('./harness.mjs', import.meta.url).href)}; console.log(JSON.stringify(resolveBin('${name}')));`,
      );
      const result = spawnSync(process.execPath, [probe], {
        env: { ...process.env, PATH: `${first};${second};${process.env.PATH}` },
        encoding: 'utf8',
        windowsHide: true,
      });
      expect(result.status).toBe(0);
      const resolved = JSON.parse(result.stdout);
      expect(resolved.shell).toBe(true);
      // where.exe expands 8.3 paths that Bun's realpath may retain. PATH
      // precedence is about the selected file, not its equivalent spelling.
      const actual = statSync(resolved.cmd, { bigint: true });
      const expected = statSync(join(first, `${name}.cmd`), { bigint: true });
      expect(actual.ino).toBeGreaterThan(0n);
      expect([actual.dev, actual.ino]).toEqual([expected.dev, expected.ino]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  },
);

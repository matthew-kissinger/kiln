import { expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const entry = resolve(import.meta.dir, '../cli.ts');
function invoke(args: string[]) {
  const cwd = mkdtempSync(join(tmpdir(), 'kiln-discovery-cli-'));
  try {
    const result = spawnSync(process.execPath, [entry, 'discover', ...args], {
      cwd,
      encoding: 'utf8',
      windowsHide: true,
      env: { ...process.env, KILN_RENDER: 'cpu' },
      timeout: 20_000,
    });
    expect(readdirSync(cwd)).toEqual([]);
    return result;
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
}

test('CLI discovery returns ranked JSON and performs no workspace writes', () => {
  const result = invoke(['--query', 'put supports around a circle', '--json']);
  expect(result.status).toBe(0);
  expect(result.stderr).toBe('');
  const json = JSON.parse(result.stdout);
  expect(json.version).toBe('kiln.discovery.v1');
  expect(json.entries.slice(0, 5).map((entry: { name: string }) => entry.name)).toContain(
    'arrayRadial',
  );
});

test('CLI capability inspection reports the selected renderer without creating a workspace', () => {
  const result = invoke(['--capabilities', '--json']);
  expect(result.status).toBe(0);
  expect(result.stderr).toBe('');
  expect(JSON.parse(result.stdout).capabilities.renderer).toMatchObject({
    mode: 'cpu',
    target: 'cpu',
    status: 'disabled',
    configured: false,
    required: false,
  });
});

test('CLI exact details preserve ordering and unknown IDs fail atomically', () => {
  const detail = invoke(['--id', 'copyGeometry', '--id', 'operation:boxGeo', '--json']);
  expect(detail.status).toBe(0);
  expect(JSON.parse(detail.stdout).entries.map((entry: { name: string }) => entry.name)).toEqual([
    'copyGeometry',
    'boxGeo',
  ]);
  const unknown = invoke(['--id', 'copyGeomtry', '--json']);
  expect(unknown.status).toBe(1);
  expect(JSON.parse(unknown.stdout).error.code).toBe('UNKNOWN_ID');
});

test('CLI rejects retired or contradictory selectors and exposes bounded human overview', () => {
  for (const args of [['--name', 'boxGeo'], ['--category=geometry'], ['--names=boxGeo']]) {
    const result = invoke(args);
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('--id');
    expect(result.stderr).toContain('--family');
  }
  for (const args of [
    ['--name', 'boxGeo'],
    ['--category', 'geometry'],
    ['--id', 'boxGeo', '--query', 'box'],
    ['--limit', '99'],
  ]) {
    const result = invoke(args);
    expect(result.status).toBe(2);
    expect(result.stderr.length).toBeGreaterThan(0);
  }
  const result = invoke([]);
  expect(result.status).toBe(0);
  expect(result.stdout).toContain('createPart(');
  expect(result.stdout.length).toBeLessThan(16_384);
});

import { expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const checker = new URL('./check-coverage.mjs', import.meta.url).pathname;

async function fixture(thresholds) {
  const directory = await mkdtemp(join(tmpdir(), 'kiln-coverage-'));
  await writeFile(
    join(directory, 'lcov.info'),
    [
      'TN:',
      'SF:src/example.ts',
      'FN:1,covered',
      'FNDA:1,covered',
      'FN:2,uncovered',
      'FNDA:0,uncovered',
      'FNF:2',
      'FNH:1',
      'DA:1,1',
      'DA:2,0',
      'LF:2',
      'LH:1',
      'end_of_record',
      '',
    ].join('\n'),
  );
  await writeFile(join(directory, 'thresholds.json'), JSON.stringify({ thresholds }));
  return directory;
}

test('aggregate coverage checker accepts coverage at the ratchet', async () => {
  const directory = await fixture({ functions: 50, lines: 50 });
  try {
    const result = spawnSync(
      process.execPath,
      [checker, join(directory, 'lcov.info'), join(directory, 'thresholds.json')],
      { encoding: 'utf8' },
    );

    expect(result.status, result.stderr || result.stdout).toBe(0);
    expect(result.stdout.trim()).toBe(
      'Coverage gate passed: functions 50.00% (minimum 50.00%), lines 50.00% (minimum 50.00%)',
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('aggregate coverage checker rejects coverage below either ratchet', async () => {
  const directory = await fixture({ functions: 50.01, lines: 50.01 });
  try {
    const result = spawnSync(
      process.execPath,
      [checker, join(directory, 'lcov.info'), join(directory, 'thresholds.json')],
      { encoding: 'utf8' },
    );

    expect(result.status).toBe(1);
    expect(result.stderr.trim()).toBe(
      'Coverage gate failed: functions 50.00% (minimum 50.01%), lines 50.00% (minimum 50.01%)',
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

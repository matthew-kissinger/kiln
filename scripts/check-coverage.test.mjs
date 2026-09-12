import { expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// URL#pathname keeps a leading slash before Windows drive letters ("/C:/...");
// fileURLToPath is the portable conversion.
const checker = fileURLToPath(new URL('./check-coverage.mjs', import.meta.url));

/** Two functions and two lines, half of each covered: a flat 50% in both metrics. */
async function fixture(thresholds, measuredBaseline = { functions: 100, lines: 100 }) {
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
  await writeFile(
    join(directory, 'thresholds.json'),
    JSON.stringify({ measuredBaseline, thresholds }),
  );
  return directory;
}

function run(directory) {
  return spawnSync(
    process.execPath,
    [checker, join(directory, 'lcov.info'), join(directory, 'thresholds.json')],
    { encoding: 'utf8' },
  );
}

test('aggregate coverage checker accepts coverage at the ratchet', async () => {
  const directory = await fixture({ functions: 50, lines: 50 });
  try {
    const result = run(directory);

    expect(result.status, result.stderr || result.stdout).toBe(0);
    expect(result.stdout.trim().split('\n')).toEqual([
      'Coverage gate passed: functions 50.00% (minimum 50.00%, 0 functions of slack), lines 50.00% (minimum 50.00%, 0 lines of slack)',
      'Recorded baseline: functions 100.00%, lines 100.00%',
    ]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('aggregate coverage checker rejects coverage below either ratchet', async () => {
  const directory = await fixture({ functions: 50.01, lines: 50.01 });
  try {
    const result = run(directory);

    expect(result.status).toBe(1);
    expect(result.stderr.trim().split('\n')[0]).toBe(
      'Coverage gate failed: functions 50.00% (minimum 50.01%, 1 function short), lines 50.00% (minimum 50.01%, 1 line short)',
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

// The number a person can act on. A shortfall in percent needs the LCOV totals to
// turn into work, and those are not in front of whoever tripped the gate.
test('a shortfall is reported in whole functions and lines, not only in percent', async () => {
  const directory = await fixture({ functions: 90, lines: 90 });
  try {
    const result = run(directory);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('1 function short');
    expect(result.stderr).toContain('1 line short');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

// The one mistake the coverage comparison cannot catch by itself: a threshold set
// above anything ever measured fails in whatever change runs next, and reads there
// as that change's regression.
test('a threshold above the recorded measured baseline is rejected as self-contradictory', async () => {
  const directory = await fixture({ functions: 50, lines: 50 }, { functions: 49, lines: 100 });
  try {
    const result = run(directory);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      'functions threshold 50% exceeds the recorded measured baseline 49%',
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('a thresholds file that records no measured baseline is rejected', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'kiln-coverage-'));
  try {
    await writeFile(join(directory, 'lcov.info'), 'FNF:1\nFNH:1\nLF:1\nLH:1\n');
    await writeFile(
      join(directory, 'thresholds.json'),
      JSON.stringify({ thresholds: { functions: 90, lines: 90 } }),
    );
    const result = run(directory);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('must record the measuredBaseline they were ratcheted from');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

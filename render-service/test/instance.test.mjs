import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import test from 'node:test';

import { buildHealthDocument } from '../src/health-contract.mjs';
import {
  describeInstance,
  fingerprintSourceDir,
  parseOwnerPid,
  processIsAlive,
  startOwnerWatch,
} from '../src/instance.mjs';

// Pure, like every other test in this directory: no GPU, no socket, no Dawn.

function scratch() {
  const dir = mkdtempSync(join(tmpdir(), 'kiln-instance-'));
  assert.ok(resolve(dir).startsWith(resolve(tmpdir()) + sep));
  return dir;
}

test('the source fingerprint is stable, and changes with content, name and length', () => {
  const dir = scratch();
  try {
    mkdirSync(join(dir, 'nested'));
    writeFileSync(join(dir, 'server.mjs'), 'one');
    writeFileSync(join(dir, 'nested', 'a.mjs'), 'aa');
    const first = fingerprintSourceDir(dir);
    assert.match(first, /^sha256:[0-9a-f]{64}$/);
    assert.equal(fingerprintSourceDir(dir), first);

    writeFileSync(join(dir, 'server.mjs'), 'two');
    const edited = fingerprintSourceDir(dir);
    assert.notEqual(edited, first);

    // Installed packages are not source: a `node_modules` under the tree is
    // ignored, so `npm install` does not read as an edit.
    mkdirSync(join(dir, 'node_modules', 'x'), { recursive: true });
    writeFileSync(join(dir, 'node_modules', 'x', 'index.js'), 'ignored');
    assert.equal(fingerprintSourceDir(dir), edited);

    writeFileSync(join(dir, 'nested', 'b.mjs'), 'aa');
    assert.notEqual(fingerprintSourceDir(dir), edited, 'a new file changes it');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('an owner pid is a positive integer or nothing', () => {
  assert.equal(parseOwnerPid('4242'), 4242);
  assert.equal(parseOwnerPid(undefined), undefined);
  assert.equal(parseOwnerPid(''), undefined);
  assert.equal(parseOwnerPid('0'), undefined);
  assert.equal(parseOwnerPid('-3'), undefined);
  assert.equal(parseOwnerPid('abc'), undefined);
});

test('this process is alive; a pid nothing has is not', () => {
  assert.equal(processIsAlive(process.pid), true);
  // The largest pid Windows or Linux will hand out is far below this.
  assert.equal(processIsAlive(2 ** 22 + 12345), false);
});

test('the owner watch fires once, when the owner is gone, and then stops polling', () => {
  const timers = [];
  let alive = true;
  const orphaned = [];
  const stop = startOwnerWatch({
    ownerPid: 77,
    isAlive: () => alive,
    onOrphaned: (pid) => orphaned.push(pid),
    intervalMs: 5,
    setTimer: (fn) => {
      const handle = { fn, cleared: false, unref: () => undefined };
      timers.push(handle);
      return handle;
    },
    clearTimer: (handle) => {
      handle.cleared = true;
    },
  });
  const tick = () => timers[0].fn();
  tick();
  tick();
  assert.deepEqual(orphaned, [], 'a live owner is left alone');
  alive = false;
  tick();
  tick();
  assert.deepEqual(orphaned, [77], 'fires exactly once');
  assert.equal(timers[0].cleared, true, 'and stops polling afterwards');
  stop();
});

test('the health document carries the instance block when one is given', () => {
  const gpuState = {
    rendererId: 'dawn-test:gpu:1',
    backend: 'test',
    summary: { device: 'test' },
  };
  const instance = describeInstance({
    pid: 123,
    ownerPid: undefined,
    startedAt: '2026-09-16T00:00:00.000Z',
    sourceDir: '/srv/render-service',
    sourceFingerprint: `sha256:${'a'.repeat(64)}`,
  });
  assert.deepEqual(buildHealthDocument(gpuState, false, instance).instance, {
    version: 'kiln.render-service-instance.v1',
    pid: 123,
    ownerPid: null,
    startedAt: '2026-09-16T00:00:00.000Z',
    sourceDir: '/srv/render-service',
    sourceFingerprint: `sha256:${'a'.repeat(64)}`,
  });
  // Without one the document is exactly what it was.
  assert.equal('instance' in buildHealthDocument(gpuState, false), false);
});

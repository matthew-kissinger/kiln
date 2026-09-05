import { expect, it } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

it('runs the packaged Node worker without a TypeScript loader and survives a runaway build', async () => {
  const repo = resolve(import.meta.dir, '../..');
  await mkdir(join(repo, 'tmp'), { recursive: true });
  const root = await mkdtemp(join(repo, 'tmp/node-worker-test-'));
  try {
    const entry = join(root, 'probe.ts');
    const box =
      "function build(){const r=createRoot('Root');createPart('Body',boxGeo(1,1,1),gameMaterial(0x888888),{parent:r});return r;}";
    await writeFile(
      entry,
      `import { renderGLBViaSubprocess } from ${JSON.stringify(join(repo, 'src/evaluator/subprocess.ts'))};
let deadline;
try { await renderGLBViaSubprocess('function build(){while(true){}}', {}, { deadlineMs: 3000 }); }
catch (error) { deadline = error.code; }
if (deadline !== 'DEADLINE_EXCEEDED') throw new Error('Expected deadline, received ' + deadline);
const controller = new AbortController();
const work = renderGLBViaSubprocess('function build(){while(true){}}', {}, { signal: controller.signal, deadlineMs: 3000 });
setTimeout(() => controller.abort(), 100);
let cancelled;
try { await work; } catch (error) { cancelled = error.code; }
if (cancelled !== 'CANCELLED') throw new Error('Expected cancellation, received ' + cancelled);
const result = await renderGLBViaSubprocess(${JSON.stringify(box)}, {}, { deadlineMs: 30000, maxHeapMb: 256 });
if (!result.glb.length) throw new Error('No recovery output');
console.log('node-worker-recovered');`,
    );
    for (const [input, name] of [
      [entry, 'probe.mjs'],
      ['src/evaluator/worker.ts', 'evaluator-worker.mjs'],
    ]) {
      const built = spawnSync(
        process.execPath,
        ['build', input!, '--target=node', '--packages=external', `--outfile=${join(root, name!)}`],
        { cwd: repo, encoding: 'utf8' },
      );
      expect(built.status).toBe(0);
    }
    const run = spawnSync('node', [join(root, 'probe.mjs')], {
      cwd: root,
      encoding: 'utf8',
      timeout: 40000,
    });
    expect(run.stderr).toBe('');
    expect(run.status).toBe(0);
    expect(run.stdout.trim()).toBe('node-worker-recovered');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 45000);

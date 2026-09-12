import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { FileProgramStore } from '../src/program-store-node';
import { ExperimentalProgramAliases } from '../src/experiments/program-aliases';

if (process.argv[2] === '--child') {
  const directory = process.argv[3]!,
    expected = process.argv[4]!,
    next = process.argv[5]!;
  const aliases = new ExperimentalProgramAliases(
    join(directory, 'aliases'),
    new FileProgramStore(join(directory, 'programs')),
  );
  try {
    await aliases.compareAndSet('bridge', expected, next);
    console.log(JSON.stringify({ status: 'updated' }));
  } catch (error) {
    const message = (error as Error).message;
    if (!message.includes('conflict') && !message.includes('busy')) throw error;
    console.log(JSON.stringify({ status: message.includes('conflict') ? 'conflict' : 'busy' }));
  }
} else {
  const directory = await mkdtemp(join(tmpdir(), 'kiln-alias-concurrency-'));
  try {
    const store = new FileProgramStore(join(directory, 'programs'));
    const aliases = new ExperimentalProgramAliases(join(directory, 'aliases'), store);
    const refs = await Promise.all(
      ['original', 'candidate-a', 'candidate-b'].map((code) => store.put(code)),
    );
    await aliases.compareAndSet('bridge', null, refs[0]!);
    // A child was killed here once on a Windows runner, reported as `Worker failed:` with
    // an empty stderr, which said nothing about why. The timings below exist because that
    // message could not distinguish a slow child from a dead one -- and the distinction
    // turned out to matter: the failing test took 123ms, so nothing was slow at all. The
    // cause was the lock's error handling, fixed in `isLockContention`.
    //
    // Kept anyway, because the per-child comparison is what made that readable. All eight
    // over the guard means the host is contended; one FAILED beside seven fast children
    // means a worker died, which points at the code rather than the runner. The receipt
    // also carries the slowest child on success, so a run at 60ms and a run at 9,000ms
    // stop looking identical while both pass.
    const spawnedAt = performance.now();
    const children = Array.from({ length: 8 }, (_, i) => {
      const child = Bun.spawn(
        [process.execPath, import.meta.path, '--child', directory, refs[0]!, refs[1 + (i % 2)]!],
        { stdout: 'pipe', stderr: 'pipe' },
      );
      let killedAfterMs: number | undefined;
      const timer = setTimeout(() => {
        killedAfterMs = Math.round(performance.now() - spawnedAt);
        child.kill();
      }, 10000);
      return (async () => {
        try {
          const [code, stdout, stderr] = await Promise.all([
            child.exited,
            new Response(child.stdout).text(),
            new Response(child.stderr).text(),
          ]);
          const elapsedMs = Math.round(performance.now() - spawnedAt);
          if (code !== 0) {
            const how =
              killedAfterMs === undefined
                ? `exited ${code} after ${elapsedMs}ms`
                : `killed by the hang guard after ${killedAfterMs}ms`;
            throw new Error(`Worker ${i} ${how}: ${stderr.trim() || '(no stderr)'}`);
          }
          return { ...(JSON.parse(stdout) as { status: string }), elapsedMs };
        } finally {
          clearTimeout(timer);
        }
      })();
    });
    const settled = await Promise.allSettled(children);
    // Every child's timing, including the healthy ones, because "one slow among seven
    // fast" and "all eight slow" are different diagnoses and only the comparison shows
    // which. Reported on the failure path, where it is the whole point.
    const failures = settled.filter((r) => r.status === 'rejected');
    if (failures.length > 0) {
      const timings = settled
        .map((r, i) => (r.status === 'fulfilled' ? `${i}:${r.value.elapsedMs}ms` : `${i}:FAILED`))
        .join(' ');
      throw new Error(
        `${failures.length} of 8 workers failed [${timings}]\n` +
          failures.map((r) => `  ${(r.reason as Error).message}`).join('\n'),
      );
    }
    const results = settled.map(
      (r) => (r as PromiseFulfilledResult<{ status: string; elapsedMs: number }>).value,
    );
    const slowestMs = Math.max(...results.map((r) => r.elapsedMs));
    const updated = results.filter((result) => result.status === 'updated').length;
    if (updated !== 1) throw new Error(`Expected one winner, received ${updated}`);
    const finalRef = await aliases.resolve('bridge');
    if (!refs.slice(1).includes(finalRef!)) throw new Error('Alias target is not a candidate');
    const immutableSources = await Promise.all(
      refs.map((ref) => new FileProgramStore(store.directory).get(ref)),
    );
    if (
      JSON.stringify(immutableSources) !==
      JSON.stringify(['original', 'candidate-a', 'candidate-b'])
    )
      throw new Error('Immutable sources changed');
    const receipt = {
      experiment: 'R0 project-local alias compare-and-set',
      processes: 8,
      // Headroom against the 10s hang guard, recorded on success too: a receipt showing
      // 90ms and one showing 9000ms both pass, and only this number tells them apart.
      slowestWorkerMs: slowestMs,
      updated,
      rejected: 7,
      rejectionKinds: [
        ...new Set(
          results.filter((result) => result.status !== 'updated').map((result) => result.status),
        ),
      ].sort(),
      immutableReferencesResolved: refs.length,
      originalSourcePreserved: true,
      finalAliasIsCandidate: true,
      usability: 'Not evaluated; clean-room model pilot required before stable adoption',
    };
    if (process.argv[2] !== '--check')
      await writeFile(
        resolve(import.meta.dir, '../docs/experiments/program-aliases-results.json'),
        `${JSON.stringify(receipt, null, 2)}\n`,
      );
    console.log(JSON.stringify(receipt, null, 2));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

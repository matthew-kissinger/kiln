/**
 * A one-shot CLI command that had to start the GPU render service itself must
 * also stop it when the command settles.
 *
 * The host module kills a service it started from an `exit` hook, which is the
 * right shape for the long-lived MCP server. For the CLI it was a deadlock by
 * construction: the child's piped stderr kept the event loop alive, so the
 * process never reached `exit`, so the hook that would have killed the child
 * never ran. `kiln render --render gpu` finished its work and then hung, with a
 * GPU process orphaned behind it, whenever no service was already listening.
 */
import { expect, it } from 'bun:test';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { writeFakeRenderService } from './helpers/fake-render-service';

/** A port nothing is listening on right now. */
async function freePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  const { port } = server.address() as AddressInfo;
  await new Promise<void>((done) => server.close(() => done()));
  return port;
}

async function listening(port: number): Promise<boolean> {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/health`, {
      signal: AbortSignal.timeout(1_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

it('stops a render service the CLI started once the command settles, instead of hanging on it', async () => {
  const base = resolve(import.meta.dir, '../../tmp');
  await mkdir(base, { recursive: true });
  const directory = await mkdtemp(join(base, 'cli-service-'));
  try {
    const built = await Bun.build({
      entrypoints: [resolve(import.meta.dir, '../cli.ts')],
      target: 'node',
      packages: 'external',
      outdir: directory,
      naming: 'cli.mjs',
    });
    expect(built.success).toBe(true);

    const service = await writeFakeRenderService(join(directory, 'render-service'));
    const port = await freePort();
    expect(await listening(port)).toBe(false);

    // Metalness above zero is what routes a scene to the render port.
    await writeFile(
      join(directory, 'source.js'),
      "const meta={name:'LifecycleFixture',category:'prop'};function build(){const root=createRoot('Root');createPart('Body',boxGeo(1,1,1),gameMaterial(0xc0c0c0,{metalness:0.9,roughness:0.3}),{parent:root});return root;}",
    );
    const env: Record<string, string | undefined> = {
      ...process.env,
      KILN_EVALUATOR_MODE: 'in-process',
      KILN_BUILD_CACHE: 'off',
      KILN_PROGRAM_STORE: join(directory, 'programs'),
      KILN_RENDER_SERVICE_DIR: service,
      KILN_RENDER_SERVICE_PORT: String(port),
    };
    delete env['KILN_RENDER'];
    delete env['KILN_RENDER_PORT_URL'];
    const started = Date.now();
    const run = Bun.spawnSync(
      [
        'node',
        join(directory, 'cli.mjs'),
        'render',
        'source.js',
        '--render',
        'gpu',
        '--views',
        'sheet.png',
      ],
      { cwd: directory, env, stdout: 'pipe', stderr: 'pipe', timeout: 45_000 },
    );
    const elapsed = Date.now() - started;
    // The command's own work takes seconds. Hitting the timeout is the hang.
    expect({ exitCode: run.exitCode, elapsed, stderr: run.stderr.toString() }).toMatchObject({
      exitCode: 0,
    });
    expect(elapsed).toBeLessThan(40_000);
    expect(run.stdout.toString()).toContain('fake-renderer');
    expect(await readdir(directory)).toContain('sheet.png');
    // The service the command started is gone with it. Killing is synchronous,
    // but the port can take a moment to close on Windows.
    let gone = false;
    for (let attempt = 0; attempt < 20 && !gone; attempt++) {
      gone = !(await listening(port));
      if (!gone) await new Promise((done) => setTimeout(done, 250));
    }
    expect(gone).toBe(true);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}, 90_000);

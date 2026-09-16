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

/**
 * A stand-in for render-service/: what `localRenderServiceState` needs to call
 * it ready, plus a server that answers `/health` and `/render` with one flat PNG
 * per requested view. `gpu` mode requires the GPU render to succeed, so the
 * answer has to pass the port's PNG validation; the pixels do not matter, the
 * process does.
 */
const FAKE_SERVER = `
import { createServer } from 'node:http';
import { crc32, deflateSync } from 'node:zlib';
const chunk = (type, data) => {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
};
const png = (size) => {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const raw = Buffer.alloc(size * (1 + size * 3), 0x80);
  for (let y = 0; y < size; y++) raw[y * (1 + size * 3)] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
};
createServer((req, res) => {
  let body = '';
  req.on('data', (piece) => {
    body += piece;
  });
  req.on('end', () => {
    res.writeHead(200, { 'content-type': 'application/json' });
    if (req.url === '/health') {
      res.end(JSON.stringify({ ok: true, rendererId: 'fake-renderer' }));
      return;
    }
    const request = body ? JSON.parse(body) : {};
    const count = (request.views ?? request.cameras ?? []).length;
    const size = request.size ?? request.width ?? 384;
    const views = Array.from({ length: count }, () => png(size).toString('base64'));
    res.end(JSON.stringify({ ok: true, rendererId: 'fake-renderer', views }));
  });
}).listen(Number(process.env.PORT), process.env.HOST ?? '127.0.0.1');
`;

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

    const service = join(directory, 'render-service');
    await mkdir(join(service, 'src'), { recursive: true });
    await mkdir(join(service, 'node_modules/webgpu'), { recursive: true });
    await mkdir(join(service, 'node_modules/three'), { recursive: true });
    await writeFile(join(service, 'package.json'), '{"name":"fake-render-service"}');
    await writeFile(join(service, 'src/register-hooks.mjs'), 'export {};');
    await writeFile(join(service, 'src/server.mjs'), FAKE_SERVER);
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

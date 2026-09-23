// Runnable package-layout research, not a replacement installer.
// node scripts/research-renderer/run.mjs --npm-cli <npm12.0.2/bin/npm-cli.js>
// Every installation is in a new temp directory. No repository dependencies change.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../..');
const args = process.argv.slice(2);
const npmCli = args[args.indexOf('--npm-cli') + 1];
if (!args.includes('--npm-cli') || !existsSync(npmCli))
  throw new Error('Pass a local npm 12.0.2 npm-cli.js with --npm-cli');
const work = mkdtempSync(join(tmpdir(), 'kiln-renderer-layout-'));
const output = args.includes('--output')
  ? resolve(args[args.indexOf('--output') + 1])
  : join(work, 'receipt.json');
const receipts = {
  version: 1,
  work,
  node: process.version,
  platform: process.platform,
  arch: process.arch,
  candidates: [],
  limitations: [
    'Single-host research prototypes, not full Kiln release qualification',
    'CPU marker only proves the research entrypoint avoids native import; installed engine CPU gate remains required',
  ],
};
const npmCache = join(work, 'npm-cache');
const put = (file, data) => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, typeof data === 'string' ? data : `${JSON.stringify(data, null, 2)}\n`);
};
const measured = (command, commandArgs, cwd, env = process.env) => {
  const began = performance.now();
  const result = spawnSync(command, commandArgs, {
    cwd,
    env,
    encoding: 'utf8',
    windowsHide: true,
    timeout: 180_000,
    maxBuffer: 4 * 1024 * 1024,
  });
  return {
    status: result.status,
    signal: result.signal,
    error: result.error?.message,
    ms: performance.now() - began,
    stdout: result.stdout,
    stderr: result.stderr,
  };
};
const npm = (commandArgs, cwd) =>
  measured(
    process.execPath,
    [npmCli, ...commandArgs, '--cache', npmCache, '--no-audit', '--no-fund'],
    cwd,
  );
const size = (path) =>
  statSync(path).isDirectory()
    ? readdirSync(path).reduce((sum, name) => sum + size(join(path, name)), 0)
    : statSync(path).size;
const version = measured(process.execPath, [npmCli, '--version'], work);
receipts.npm = version.stdout.trim();
if (receipts.npm !== '12.0.2') throw new Error(`Expected npm 12.0.2; got ${receipts.npm}`);
receipts.baseHead = measured('git', ['rev-parse', 'HEAD'], repo).stdout.trim();
const serviceSrc = join(repo, 'render-service/src');
const sourceHash = createHash('sha256');
for (const name of readdirSync(serviceSrc).sort())
  sourceHash.update(name).update(readFileSync(join(serviceSrc, name)));
receipts.serviceSourceSha256 = sourceHash.digest('hex');
const fixture = join(repo, 'render-service/test/fixtures/material-channels-v1.glb');
receipts.fixtureSha256 = createHash('sha256').update(readFileSync(fixture)).digest('hex');
const servicePackage = JSON.parse(readFileSync(join(repo, 'render-service/package.json')));
receipts.pinned = servicePackage.dependencies;
receipts.existingWebgpu = JSON.parse(
  readFileSync(join(repo, 'render-service/node_modules/webgpu/package.json')),
).version;

const createService = (dir, name, optionalNative) => {
  mkdirSync(dir, { recursive: true });
  cpSync(serviceSrc, join(dir, 'src'), { recursive: true });
  const dependencies = { pngjs: '7.0.0', three: servicePackage.dependencies.three };
  const native = { webgpu: servicePackage.dependencies.webgpu };
  put(join(dir, 'package.json'), {
    name,
    version: '0.0.0',
    private: true,
    type: 'module',
    files: ['src', 'cpu.mjs'],
    dependencies: { ...dependencies, ...(optionalNative ? {} : native) },
    ...(optionalNative ? { optionalDependencies: native } : {}),
  });
  put(join(dir, 'cpu.mjs'), 'export const cpuUsableWithoutNative = true;\n');
};
const pack = (dir) => {
  const result = npm(['pack', '--json', '--ignore-scripts'], dir);
  if (result.status !== 0) throw new Error(result.stderr);
  const parsed = JSON.parse(result.stdout);
  const meta = Array.isArray(parsed) ? parsed[0] : Object.values(parsed)[0];
  return {
    path: join(dir, meta.filename),
    bytes: meta.size,
    unpackedBytes: meta.unpackedSize,
    sha256: createHash('sha256')
      .update(readFileSync(join(dir, meta.filename)))
      .digest('hex'),
  };
};
for (const layout of ['main-optional-native', 'optional-runtime-companion']) {
  const candidate = { layout, installs: [] };
  receipts.candidates.push(candidate);
  const stage = join(work, `${layout}-source`);
  const name = `@kiln-research/${layout}`;
  let runtimeName = name;
  if (layout === 'main-optional-native') createService(stage, name, true);
  else {
    runtimeName = '@kiln-research/renderer-runtime';
    const runtimeStage = join(work, 'runtime-source');
    createService(runtimeStage, runtimeName, false);
    candidate.runtimeArchive = pack(runtimeStage);
    mkdirSync(stage, { recursive: true });
    put(join(stage, 'package.json'), {
      name,
      version: '0.0.0',
      private: true,
      type: 'module',
      files: ['cpu.mjs'],
      optionalDependencies: {
        [runtimeName]: `file:${candidate.runtimeArchive.path.replaceAll('\\', '/')}`,
      },
    });
    put(join(stage, 'cpu.mjs'), 'export const cpuUsableWithoutNative = true;\n');
  }
  candidate.archive = pack(stage);
  for (const variant of ['normal', 'scripts-disabled', 'optional-omitted', 'offline-reuse']) {
    const install = join(work, `${layout}-${variant}`);
    mkdirSync(install);
    put(join(install, 'package.json'), { private: true, type: 'module' });
    const extra =
      variant === 'scripts-disabled'
        ? ['--ignore-scripts']
        : variant === 'optional-omitted'
          ? ['--omit=optional']
          : variant === 'offline-reuse'
            ? ['--offline', '--ignore-scripts']
            : [];
    const result = npm(['install', candidate.archive.path, ...extra], install);
    const current = { variant, install, installation: result, installedBytes: size(install) };
    candidate.installs.push(current);
    const rootPackage = join(install, 'node_modules', name);
    current.cpuImport = measured(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `const m = await import(${JSON.stringify(`file:///${join(rootPackage, 'cpu.mjs').replaceAll('\\', '/')}`)}); console.log(m.cpuUsableWithoutNative);`,
      ],
      install,
    );
    const serviceDir = join(install, 'node_modules', runtimeName);
    current.serviceDir = serviceDir;
    if (result.status === 0)
      current.render = measured(
        process.execPath,
        [join(here, 'probe-renderer.mjs'), serviceDir, fixture],
        install,
      );
    put(output, receipts);
    console.log(
      JSON.stringify({
        layout,
        variant,
        installStatus: result.status,
        renderStatus: current.render?.status,
        elapsedMs: result.ms,
      }),
    );
  }
  const bunInstall = join(work, `${layout}-bun-scripts-disabled`);
  mkdirSync(bunInstall);
  put(join(bunInstall, 'package.json'), { private: true, type: 'module' });
  candidate.bun = measured('bun', ['add', candidate.archive.path, '--ignore-scripts'], bunInstall);
  candidate.bun.installedBytes = size(bunInstall);
  candidate.bun.render = measured(
    process.execPath,
    [join(here, 'probe-renderer.mjs'), join(bunInstall, 'node_modules', runtimeName), fixture],
    bunInstall,
  );
  put(output, receipts);
}
console.log(JSON.stringify({ receipt: output, work }));

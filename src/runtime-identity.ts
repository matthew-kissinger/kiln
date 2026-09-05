import { createHash } from 'node:crypto';
import { readFile, readdir, realpath, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, relative } from 'node:path';

type Package = {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  peerDependenciesMeta?: Record<string, { optional?: boolean }>;
};
export interface InstalledRuntimeIdentity {
  identity?: string;
  reason?: string;
  files: number;
  bytes: number;
}
const digest = (bytes: string | Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Host-only snapshot of the packaged worker and its actual installed dependency closure.
 * A version range or lockfile alone cannot identify what npm installed. Unknown inputs
 * disable disk reuse. Recreate the host after changing an installation while it runs.
 */
export async function installedRuntimeIdentity(
  root: string,
  limits: { maxBytes?: number; maxFiles?: number } = {},
): Promise<InstalledRuntimeIdentity> {
  let bytes = 0;
  let files = 0;
  const maxBytes = limits.maxBytes ?? 512 * 1024 * 1024;
  const maxFiles = limits.maxFiles ?? 40000;
  const manifest = async (directory: string): Promise<Package> =>
    JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'));
  let readers = 0;
  const waiting: Array<() => void> = [];
  const read = async (path: string) => {
    if (readers >= 24) await new Promise<void>((resolve) => waiting.push(resolve));
    else readers++;
    try {
      const info = await stat(path);
      if (++files > maxFiles || bytes + info.size > maxBytes)
        throw new Error('Installed runtime fingerprint exceeds its scan budget.');
      bytes += info.size;
      return await readFile(path);
    } finally {
      const next = waiting.shift();
      if (next) next();
      else readers--;
    }
  };
  try {
    const pkg = await manifest(root);
    if (pkg.name !== '@kiln/engine') throw new Error('Not a Kiln installation.');
    const build = JSON.parse(await readFile(join(root, 'dist', 'build.json'), 'utf8'));
    const worker = build.entries?.worker;
    if (
      build.schemaVersion !== 1 ||
      worker?.file !== 'evaluator-worker.mjs' ||
      !/^sha256:[a-f0-9]{64}$/.test(worker.identity)
    )
      throw new Error('No valid packaged worker identity.');
    const workerHash = `sha256:${digest(await read(join(root, 'dist', worker.file)))}`;
    if (worker.bundleHash !== workerHash)
      throw new Error('Packaged worker differs from its build manifest.');
    const records: Array<[string, string]> = [];
    const visited = new Map<string, string>();
    async function resolvePackage(parent: string, name: string) {
      const require = createRequire(join(parent, 'package.json'));
      // Resolve package roots without executing package code. Some packages do not
      // export package.json; their resolved entry still identifies their root.
      let found: string;
      try {
        found = require.resolve(`${name}/package.json`);
      } catch {
        try {
          found = require.resolve(name);
        } catch {
          // ESM-only packages may export neither package.json nor a require
          // condition. Node's package search roots still locate their manifest.
          for (const modules of require.resolve.paths(name) ?? []) {
            const candidate = join(modules, name);
            try {
              if ((await manifest(candidate)).name === name) return await realpath(candidate);
            } catch {}
          }
          throw new Error(`Cannot resolve installed dependency ${name}.`);
        }
      }
      let directory = dirname(found);
      for (;;) {
        try {
          if ((await manifest(directory)).name === name) return await realpath(directory);
        } catch {}
        const next = dirname(directory);
        if (next === directory) throw new Error(`Cannot identify installed dependency ${name}.`);
        directory = next;
      }
    }
    async function tree(directory: string, base: string): Promise<Array<[string, string]>> {
      const entries = (await readdir(directory, { withFileTypes: true })).sort((a, b) =>
        compare(a.name, b.name),
      );
      return (
        await Promise.all(
          entries.map(async (entry): Promise<Array<[string, string]>> => {
            if (entry.name === 'node_modules' || entry.name === '.git') return [];
            const path = join(directory, entry.name);
            // Package-level links are resolved above. Internal links can escape the
            // fingerprinted tree; declining persistence is safer than guessing.
            if (entry.isSymbolicLink())
              throw new Error('Dependency contains an untracked internal symlink.');
            if (entry.isDirectory()) return tree(path, base);
            if (entry.isFile())
              return [[relative(base, path).replaceAll('\\', '/'), digest(await read(path))]];
            throw new Error('Dependency contains a non-file runtime input.');
          }),
        )
      ).flat();
    }
    async function visit(directory: string, path: string) {
      const canonical = await realpath(directory);
      const previous = visited.get(canonical);
      if (previous) {
        records.push([path, `same-package:${previous}`]);
        return;
      }
      visited.set(canonical, path);
      const metadata = await manifest(canonical);
      records.push([path, digest(JSON.stringify(await tree(canonical, canonical)))]);
      await dependencies(canonical, metadata, path);
    }
    async function dependencies(directory: string, metadata: Package, prefix: string) {
      const names = [
        ...new Set([
          ...Object.keys(metadata.dependencies ?? {}),
          ...Object.keys(metadata.optionalDependencies ?? {}),
          ...Object.keys(metadata.peerDependencies ?? {}),
        ]),
      ].sort(compare);
      for (const name of names) {
        let child: string;
        try {
          child = await resolvePackage(directory, name);
        } catch {
          if (
            name in (metadata.optionalDependencies ?? {}) ||
            metadata.peerDependenciesMeta?.[name]?.optional
          ) {
            records.push([`${prefix}/${name}`, 'optional-absent']);
            continue;
          }
          throw new Error(`Cannot fingerprint missing installed dependency ${name}.`);
        }
        await visit(child, `${prefix}/${name}`);
      }
    }
    // Optional generation peers are deliberately outside the worker closure; the
    // packaged worker never imports them. All required package dependencies count.
    await dependencies(root, { ...pkg, peerDependencies: {} }, 'dependencies');
    const inputs = {
      version: 1,
      engine: pkg.version,
      workerHash,
      build: worker.identity,
      runtime: {
        node: process.versions.node,
        bun: process.versions.bun,
        modules: process.versions.modules,
        platform: process.platform,
        arch: process.arch,
      },
      dependencies: records,
    };
    return { identity: `sha256:${digest(JSON.stringify(inputs))}`, files, bytes };
  } catch (error) {
    return { reason: error instanceof Error ? error.message : String(error), files, bytes };
  }
}

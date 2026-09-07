import { readFile, writeFile, stat, mkdir, rename } from 'node:fs/promises';
import { basename, resolve, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { localAssetLibrary, collectionConfigPath } from './assets-node';
import { ASSET_LIMIT, assetIdSchema, decodeAssetBundle, encodeAssetBundle } from './assets';
import { localProgramStore } from './program-store-node';
import { programRefPattern, retainProgram } from './program-store';
import { createKilnProgramToolRegistry } from './tools/registry';
import { createPackagedLocalToolContext } from './local-runtime';
import { buildRenderPort, resolveRenderMode } from './cli-render-mode';
import { startAssetViewer } from './asset-viewer';

export const ASSET_USAGE = `
ASSETS & VIEWER
  kiln save <source.js|programRef> --name <name> [--collection project]
       [--asset <id> --parent <revision>] [--description <text>] [--tag <tag>]
  kiln collections                        list configured collection names
  kiln collections add <name> <directory>  remember a project or personal collection
  kiln assets [--collection project]      list saved revisions (JSON)
  kiln asset <id> <revision> [--collection project] [--restore]
  kiln export <id> <revision> --out asset.zip [--format bundle|glb|source]
  kiln import <asset.zip|asset.glb> [--collection project] [--name <name>]
  kiln view [collection-directory|asset.glb|asset.zip] [--port 4318]

KILN_COLLECTIONS is an optional JSON map of collection names to absolute folders.
Default: project -> <workspace>/assets/kiln. Existing source/render commands still work.
View prints a local browser URL and remains running until interrupted.
`;
export async function assetMain(argv: readonly string[]): Promise<number> {
  const command = argv[0];
  const positional: string[] = [];
  const flags: Record<string, string> = {};
  const tags: string[] = [];
  const allowed = new Set([
    'collection',
    'name',
    'asset',
    'parent',
    'description',
    'brief',
    'tag',
    'out',
    'format',
    'port',
    'render',
  ]);
  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === '--help' || arg === '-h') {
      console.log(ASSET_USAGE);
      return 0;
    }
    if (arg === '--restore') {
      flags.restore = 'true';
      continue;
    }
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = argv[++i];
      if (!allowed.has(key) || value === undefined) throw new Error(`Invalid option ${arg}`);
      if (key === 'tag') tags.push(value);
      else flags[key] = value;
    } else positional.push(arg);
  }
  const library = localAssetLibrary();
  const collection = flags.collection ?? 'project';
  const fileBytes = async (path: string) => {
    if ((await stat(path)).size > ASSET_LIMIT) throw new Error('File exceeds 64 MiB');
    return new Uint8Array(await readFile(path));
  };
  if (command === 'collections') {
    if (positional[0] === 'add') {
      if (process.env.KILN_COLLECTIONS)
        throw new Error(
          'KILN_COLLECTIONS overrides saved configuration. Unset it before changing workspace collections.',
        );
      const [, name, directory] = positional;
      if (!name || !directory) throw new Error('collections add requires name and directory');
      assetIdSchema.parse(name);
      const roots = Object.fromEntries(
        library.collections().map((c) => [c.id, library.directory(c.id)]),
      );
      if (roots[name] && roots[name] !== resolve(directory))
        throw new Error('Collection name already points to another directory');
      roots[name] = resolve(directory);
      const path = collectionConfigPath();
      await mkdir(dirname(path), { recursive: true });
      const temporary = `${path}.${randomUUID()}.tmp`;
      await writeFile(temporary, JSON.stringify(roots, null, 2), { flag: 'wx' });
      await rename(temporary, path);
      console.log(
        `Collection ${name}: ${roots[name]}. Restart running MCP/viewer processes to load it.`,
      );
    } else console.log(JSON.stringify({ collections: library.collections() }, null, 2));
  } else if (command === 'assets')
    console.log(JSON.stringify({ assets: await library.list(collection) }, null, 2));
  else if (command === 'save') {
    const input = positional[0];
    if (!input || !flags.name) throw new Error('save requires source/ref and --name');
    const store = localProgramStore();
    const programRef = programRefPattern.test(input)
      ? input
      : await retainProgram(store, new TextDecoder().decode(await fileBytes(input)));
    const context = await createPackagedLocalToolContext(
      await buildRenderPort(resolveRenderMode(flags.render ?? 'auto'), undefined),
    );
    const def = createKilnProgramToolRegistry({
      ...context,
      assetLibrary: library,
      programStore: store,
    }).find((d) => d.name === 'kiln_save')!;
    console.log(
      JSON.stringify(
        await def.run({
          collection,
          programRef,
          name: flags.name,
          assetId: flags.asset,
          parentRevision: flags.parent,
          description: flags.description,
          brief: flags.brief,
          tags,
        }),
        null,
        2,
      ),
    );
  } else if (command === 'asset' || command === 'export') {
    const [assetId, revisionId] = positional;
    if (!assetId || !revisionId) throw new Error(`${command} requires asset ID and revision ID`);
    const record = await library.read(collection, assetId, revisionId);
    if (command === 'asset') {
      if (flags.restore) {
        const source = record.files['source.kiln.js'];
        if (!source) throw new Error('Source unavailable');
        console.log(
          JSON.stringify(
            {
              asset: record.manifest,
              programRef: await retainProgram(
                localProgramStore(),
                new TextDecoder().decode(source),
              ),
            },
            null,
            2,
          ),
        );
      } else console.log(JSON.stringify(record.manifest, null, 2));
    } else {
      if (!flags.out) throw new Error('export requires --out');
      const format = flags.format ?? 'bundle';
      if (!['bundle', 'glb', 'source'].includes(format)) throw new Error('Unknown export format');
      const bytes =
        format === 'bundle'
          ? encodeAssetBundle([record])
          : record.files[format === 'glb' ? 'asset.glb' : 'source.kiln.js'];
      if (!bytes) throw new Error('Source unavailable');
      await writeFile(resolve(flags.out), bytes, { flag: 'wx' });
      console.log(`Saved ${resolve(flags.out)}`);
    }
  } else if (command === 'import') {
    const file = positional[0];
    if (!file) throw new Error('import requires a ZIP or GLB file');
    const bytes = await fileBytes(file);
    const assets = file.toLowerCase().endsWith('.glb')
      ? [await library.save(collection, { name: flags.name ?? basename(file, '.glb'), glb: bytes })]
      : await library.import(collection, decodeAssetBundle(bytes));
    console.log(JSON.stringify({ collection, assets }, null, 2));
  } else if (command === 'view') {
    let target = library;
    let standalone: { name: string; bytes: Uint8Array } | undefined;
    const file = positional[0];
    if (file) {
      if ((await stat(file)).isDirectory()) {
        const { FileAssetLibrary } = await import('./assets-node');
        target = new FileAssetLibrary({ project: resolve(file) });
      } else standalone = { name: basename(file), bytes: await fileBytes(file) };
    }
    const port = flags.port === undefined ? 4318 : Number(flags.port);
    if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid port');
    const viewer = await startAssetViewer(target, { port, standalone });
    console.log(`${viewer.url}${standalone ? '?open=standalone' : ''}`);
    console.log('Kiln viewer · local files · Ctrl+C to stop');
  }
  return 0;
}

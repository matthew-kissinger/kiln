#!/usr/bin/env node

import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { homedir, platform } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const SKIP_DIRECTORIES = new Set(['.git', 'node_modules']);
const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const usage = `Usage:
  node scripts/dogfood-gallery.mjs [--gallery-root PATH] ROOT [ROOT ...]

Imports saved Kiln revisions from one or more evaluation roots into the standard
user library. It never writes to examples/ or the public site gallery.
`;

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

export function defaultDogfoodGalleryRoot(
  env = process.env,
  home = homedir(),
  operatingSystem = platform(),
) {
  const dataRoot = env.XDG_DATA_HOME?.trim();
  if (dataRoot) return join(dataRoot, 'kiln', 'library');
  if (operatingSystem === 'darwin')
    return join(home, 'Library', 'Application Support', 'Kiln', 'library');
  if (operatingSystem === 'win32')
    return join(env.LOCALAPPDATA?.trim() || join(home, 'AppData', 'Local'), 'Kiln', 'library');
  return join(home, '.local', 'share', 'kiln', 'library');
}

export function assertLocalGalleryRoot(galleryRoot, repositoryRoot = REPOSITORY_ROOT) {
  const resolvedGalleryRoot = resolve(galleryRoot);
  const rel = relative(resolve(repositoryRoot), resolvedGalleryRoot);
  if (rel === '' || (rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel)))
    throw new Error('The local asset gallery must stay outside the repository.');
  return resolvedGalleryRoot;
}

function readManifest(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function titleFromFilename(filename) {
  return filename
    .replace(/\.kiln\.js$/u, '')
    .split(/[-_]+/u)
    .filter(Boolean)
    .map((word) => `${word[0].toUpperCase()}${word.slice(1)}`)
    .join(' ');
}

export function discoverSavedAssets(roots) {
  const found = [];
  const seen = new Set();
  const visit = (directory) => {
    let entries;
    try {
      if (existsSync(join(directory, '.git'))) return;
      entries = readdirSync(directory, { withFileTypes: true });
    } catch {
      return;
    }
    const hasRevisionManifest = entries.some(
      (entry) => entry.isFile() && entry.name === 'manifest.json',
    );
    const fileNames = new Set(entries.filter((entry) => entry.isFile()).map((entry) => entry.name));
    if (
      fileNames.has('record.json') &&
      fileNames.has('source.kiln.js') &&
      fileNames.has('asset.glb')
    ) {
      const recordPath = resolve(directory, 'record.json');
      const previewNames = [...fileNames]
        .filter((name) => /^preview(?:-[a-z0-9]+)?\.png$/u.test(name))
        .sort((left, right) =>
          left === 'preview.png' ? -1 : right === 'preview.png' ? 1 : left.localeCompare(right),
        );
      seen.add(recordPath);
      found.push({
        manifestPath: recordPath,
        revisionRoot: resolve(directory),
        sourcePath: resolve(directory, 'source.kiln.js'),
        glbPath: resolve(directory, 'asset.glb'),
        previewPath: previewNames[0] ? resolve(directory, previewNames[0]) : null,
        previewPaths: previewNames.map((name) => resolve(directory, name)),
        manifest: readManifest(recordPath),
      });
    }
    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRECTORIES.has(entry.name)) visit(path);
        continue;
      }
      if (entry.name !== 'manifest.json') continue;
      const normalized = path.replaceAll('\\', '/');
      if (!normalized.includes('/assets/kiln/')) continue;
      const sourcePath = join(directory, 'source.kiln.js');
      const glbPath = join(directory, 'asset.glb');
      if (!existsSync(sourcePath) || !existsSync(glbPath)) continue;
      const manifestPath = resolve(path);
      if (seen.has(manifestPath)) continue;
      seen.add(manifestPath);
      found.push({
        manifestPath,
        revisionRoot: resolve(directory),
        sourcePath: resolve(sourcePath),
        glbPath: resolve(glbPath),
        previewPath: existsSync(join(directory, 'preview.png'))
          ? resolve(join(directory, 'preview.png'))
          : null,
        previewPaths: existsSync(join(directory, 'preview.png'))
          ? [resolve(join(directory, 'preview.png'))]
          : [],
        manifest: readManifest(path),
      });
    }
    if (!hasRevisionManifest) {
      for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith('.kiln.js')) continue;
        const stem = entry.name.slice(0, -'.kiln.js'.length);
        const glbName = `${stem}.glb`;
        if (!fileNames.has(glbName)) continue;
        const sourcePath = resolve(directory, entry.name);
        if (seen.has(sourcePath)) continue;
        seen.add(sourcePath);
        const previewName = [
          `${stem}.png`,
          `${stem}-contact-sheet.png`,
          `${stem}.preview.png`,
          `${stem}-sheet.png`,
        ].find((name) => fileNames.has(name));
        found.push({
          manifestPath: null,
          revisionRoot: resolve(directory),
          sourcePath,
          glbPath: resolve(directory, glbName),
          previewPath: previewName ? resolve(directory, previewName) : null,
          previewPaths: previewName ? [resolve(directory, previewName)] : [],
          manifest: { name: titleFromFilename(entry.name) },
        });
      }
    }
  };
  for (const root of roots) visit(resolve(root));
  return found.sort((left, right) =>
    (left.manifestPath ?? left.sourcePath).localeCompare(right.manifestPath ?? right.sourcePath),
  );
}

function writeJsonAtomic(path, value) {
  const temporary = `${path}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  renameSync(temporary, path);
}

function copyExact(source, destination, expectedHash) {
  if (existsSync(destination)) {
    const actualHash = sha256(readFileSync(destination));
    if (actualHash !== expectedHash) throw new Error(`Local gallery collision at ${destination}.`);
    return;
  }
  copyFileSync(source, destination);
}

function uniqueObjects(values) {
  const seen = new Set();
  return values.filter((value) => {
    const key = JSON.stringify(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function readGalleryRecords(galleryRoot) {
  const records = [];
  if (!existsSync(galleryRoot)) return records;
  for (const asset of readdirSync(galleryRoot, { withFileTypes: true })) {
    if (!asset.isDirectory() || !/^[a-z][a-z0-9_-]{0,79}$/u.test(asset.name)) continue;
    const revisions = join(galleryRoot, asset.name, 'revisions');
    if (!existsSync(revisions)) continue;
    for (const revision of readdirSync(revisions, { withFileTypes: true })) {
      if (!revision.isDirectory() || !revision.name.startsWith('r_')) continue;
      const recordPath = join(revisions, revision.name, 'record.json');
      if (!existsSync(recordPath)) continue;
      const record = readManifest(recordPath);
      if (record) records.push(record);
    }
  }
  return records;
}

function rebuildIndexes(galleryRoot) {
  const records = readGalleryRecords(galleryRoot);
  records.sort((left, right) =>
    `${left.name}\0${left.entryId}`.localeCompare(`${right.name}\0${right.entryId}`),
  );
  writeJsonAtomic(join(galleryRoot, 'index.json'), {
    schema: 'kiln.local-asset-gallery.v1',
    publicGallery: false,
    publication: { state: 'local-only' },
    entries: records,
  });
  return records;
}

export function archiveSavedAssets({
  assets,
  galleryRoot = defaultDogfoodGalleryRoot(),
  provenance = null,
  importedAt = new Date().toISOString(),
}) {
  const resolvedGalleryRoot = assertLocalGalleryRoot(galleryRoot);
  mkdirSync(resolvedGalleryRoot, { recursive: true, mode: 0o700 });
  const entriesById = new Map();
  const identityToEntry = new Map(
    readGalleryRecords(resolvedGalleryRoot).map((record) => [
      `${record.files.source.sha256}\0${record.files.glb.sha256}`,
      record,
    ]),
  );
  for (const asset of assets) {
    const manifest = asset.manifest ?? readManifest(asset.manifestPath) ?? {};
    const sourceBytes = readFileSync(asset.sourcePath);
    const glbBytes = readFileSync(asset.glbPath);
    const sourceSha256 = sha256(sourceBytes);
    const glbSha256 = sha256(glbBytes);
    const identity = sha256(`${sourceSha256}\0${glbSha256}`).slice(0, 16);
    const contentKey = `${sourceSha256}\0${glbSha256}`;
    const existing = identityToEntry.get(contentKey);
    const validId = (value) => typeof value === 'string' && /^[a-z][a-z0-9_-]{0,79}$/u.test(value);
    const validRevisionId = (value) => validId(value) && value.startsWith('r_');
    let assetId =
      existing?.assetId ?? (validId(manifest.assetId) ? manifest.assetId : `a_${identity}`);
    let revisionId =
      existing?.revisionId ??
      (validRevisionId(manifest.revisionId) ? manifest.revisionId : `r_${identity}`);
    let relativeRoot = `${assetId}/revisions/${revisionId}`;
    let entryRoot = join(resolvedGalleryRoot, relativeRoot);
    const occupied = readManifest(join(entryRoot, 'record.json'));
    if (
      occupied &&
      `${occupied.files.source.sha256}\0${occupied.files.glb.sha256}` !== contentKey
    ) {
      assetId = `a_${identity}`;
      revisionId = `r_${identity}`;
      relativeRoot = `${assetId}/revisions/${revisionId}`;
      entryRoot = join(resolvedGalleryRoot, relativeRoot);
    }
    mkdirSync(entryRoot, { recursive: true, mode: 0o700 });
    copyExact(asset.sourcePath, join(entryRoot, 'source.kiln.js'), sourceSha256);
    copyExact(asset.glbPath, join(entryRoot, 'asset.glb'), glbSha256);
    const recordPath = join(entryRoot, 'record.json');
    const previous = existsSync(recordPath) ? readManifest(recordPath) : existing;
    let preview = previous?.files.preview ?? null;
    const previewAlternates = [...(previous?.files.previewAlternates ?? [])];
    for (const previewPath of asset.previewPaths ??
      (asset.previewPath ? [asset.previewPath] : [])) {
      const previewBytes = readFileSync(previewPath);
      const candidate = { sha256: sha256(previewBytes), bytes: previewBytes.byteLength };
      const primaryPath = join(entryRoot, 'preview.png');
      if (!existsSync(primaryPath) || preview?.sha256 === candidate.sha256) {
        copyExact(previewPath, primaryPath, candidate.sha256);
        preview = candidate;
      } else if (!previewAlternates.some((item) => item.sha256 === candidate.sha256)) {
        const name = `preview-${candidate.sha256.slice(0, 12)}.png`;
        copyExact(previewPath, join(entryRoot, name), candidate.sha256);
        previewAlternates.push({ ...candidate, name });
      }
    }
    const integration = manifest.build?.integration ?? {};
    const preferPreviousMetadata = !asset.manifestPath && previous;
    const attributionSource =
      manifest.attribution ??
      [
        ...(Array.isArray(manifest.provenance) ? manifest.provenance : []),
        ...(previous?.provenance ?? []),
        provenance,
      ].find((item) => item?.model || item?.harness || item?.author);
    const attribution = attributionSource
      ? Object.fromEntries(
          ['model', 'harness', 'author']
            .filter((key) => typeof attributionSource[key] === 'string')
            .map((key) => [key, attributionSource[key].slice(0, 200)]),
        )
      : undefined;
    const standardFiles = {
      'source.kiln.js': {
        sha256: `sha256:${sourceSha256}`,
        bytes: sourceBytes.byteLength,
      },
      'asset.glb': { sha256: `sha256:${glbSha256}`, bytes: glbBytes.byteLength },
      ...(preview
        ? {
            'preview.png': {
              sha256: `sha256:${preview.sha256}`,
              bytes: preview.bytes,
            },
          }
        : {}),
    };
    const createdAtCandidate = manifest.createdAt ?? previous?.firstImportedAt ?? importedAt;
    const createdAt = Number.isNaN(Date.parse(createdAtCandidate))
      ? importedAt
      : new Date(createdAtCandidate).toISOString();
    const viewFidelity =
      manifest.preview?.fidelity ?? manifest.viewFidelity ?? previous?.viewFidelity ?? null;
    const standardManifest = {
      version: 'kiln.asset.v1',
      assetId,
      revisionId,
      ...(validRevisionId(manifest.parentRevision)
        ? { parentRevision: manifest.parentRevision }
        : {}),
      name: String(
        preferPreviousMetadata
          ? previous.name
          : manifest.name || previous?.name || basename(asset.revisionRoot),
      ).slice(0, 200),
      tags: Array.isArray(manifest.tags)
        ? manifest.tags.filter((tag) => typeof tag === 'string').slice(0, 30)
        : [],
      createdAt,
      ...(manifest.description || previous?.description
        ? { description: String(manifest.description ?? previous.description).slice(0, 4000) }
        : {}),
      ...(manifest.brief || previous?.brief
        ? { brief: String(manifest.brief ?? previous.brief).slice(0, 8000) }
        : {}),
      ...(attribution && Object.keys(attribution).length ? { attribution } : {}),
      editable: true,
      files: standardFiles,
      ...(viewFidelity ? { preview: { fidelity: viewFidelity } } : {}),
    };
    const record = {
      schema: 'kiln.local-asset.v1',
      entryId: `${assetId}/${revisionId}`,
      relativeRoot,
      publicGallery: false,
      publication: { state: 'local-only' },
      name: standardManifest.name,
      assetId,
      revisionId,
      brief: standardManifest.brief ?? null,
      description: standardManifest.description ?? null,
      firstImportedAt: previous?.firstImportedAt ?? importedAt,
      lastSeenAt: importedAt,
      files: {
        source: { name: 'source.kiln.js', sha256: sourceSha256, bytes: sourceBytes.byteLength },
        glb: { name: 'asset.glb', sha256: glbSha256, bytes: glbBytes.byteLength },
        preview,
        previewAlternates,
      },
      metrics: {
        triangles: integration.renderMetrics?.triangles ?? previous?.metrics.triangles ?? null,
        drawCalls: integration.renderMetrics?.drawCalls ?? previous?.metrics.drawCalls ?? null,
        validatorErrors:
          integration.structuralQa?.validatorErrors ?? previous?.metrics.validatorErrors ?? null,
        validatorWarnings:
          integration.structuralQa?.validatorWarnings ??
          previous?.metrics.validatorWarnings ??
          null,
      },
      viewFidelity,
      originManifests: [
        ...new Set([...(previous?.originManifests ?? []), asset.manifestPath ?? asset.sourcePath]),
      ],
      provenance: uniqueObjects([
        ...(Array.isArray(manifest.provenance) ? manifest.provenance : []),
        ...(previous?.provenance ?? []),
        ...(provenance ? [provenance] : []),
      ]),
    };
    writeJsonAtomic(join(entryRoot, 'manifest.json'), standardManifest);
    writeJsonAtomic(recordPath, record);
    identityToEntry.set(contentKey, record);
    entriesById.set(record.entryId, record);
  }
  const records = rebuildIndexes(resolvedGalleryRoot);
  return {
    galleryRoot: resolvedGalleryRoot,
    entries: [...entriesById.values()],
    totalEntries: records.length,
  };
}

function parseCli(argv) {
  const roots = [];
  let galleryRoot = null;
  let help = false;
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--gallery-root') {
      const value = argv[++index];
      if (!value || value.startsWith('--')) throw new Error('--gallery-root needs a path.');
      galleryRoot = resolve(value);
    } else if (arg === '--help' || arg === '-h') help = true;
    else if (arg.startsWith('--')) throw new Error(`Unknown option: ${arg}`);
    else roots.push(resolve(arg));
  }
  if (!help && roots.length === 0) throw new Error('Supply at least one root to scan.');
  return { roots, galleryRoot, help };
}

async function main(argv) {
  const opts = parseCli(argv);
  if (opts.help) {
    process.stdout.write(usage);
    return;
  }
  const result = archiveSavedAssets({
    assets: discoverSavedAssets(opts.roots),
    galleryRoot: opts.galleryRoot ?? defaultDogfoodGalleryRoot(),
    provenance: { kind: 'recovered-local-dogfood' },
  });
  process.stdout.write(
    `${JSON.stringify({ ...result, entries: result.entries.map(({ entryId, name }) => ({ entryId, name })) }, null, 2)}\n`,
  );
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    await main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error.message}\n\n${usage}`);
    process.exitCode = 2;
  }
}

/// <reference lib="dom" />
import {
  ASSET_LIMIT,
  decodeAssetBundle,
  encodeAssetBundle,
  type AssetManifest,
  type AssetRecord,
} from '../assets';
import { createAssetStage } from './scene';

const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id)! as T;
const node = <K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, className?: string) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
};
type Entry = {
  collection: string;
  manifest: AssetManifest;
  local?: AssetRecord;
  loose?: Uint8Array;
};
let collections: { id: string; label: string }[] = [];
let entries: Entry[] = [];
const opened: Entry[] = [];
let currentCollection = '';
let chosen: Entry | undefined;
let stage: ReturnType<typeof createAssetStage> | undefined;
let detailGeneration = 0;
let listGeneration = 0;
let wire = false;
let paused = false;
const selected = new Set<string>();
const urls: string[] = [];
const thumbUrls: string[] = [];
const key = (entry: Entry) =>
  `${entry.collection}/${entry.manifest.assetId}/${entry.manifest.revisionId}`;
const message = (text: string) => {
  el('status').textContent = text;
};
const showError = (error: unknown) =>
  message(error instanceof Error ? error.message : String(error));
const blobUrl = (bytes: Uint8Array, mime: string, targets = urls) => {
  const url = URL.createObjectURL(new Blob([Uint8Array.from(bytes)], { type: mime }));
  targets.push(url);
  return url;
};
async function json(path: string) {
  const res = await fetch(path);
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? 'Request failed');
  return body;
}
async function bytes(entry: Entry, file: string) {
  if (entry.local) {
    const value = entry.local.files[file];
    if (!value) throw new Error('File unavailable');
    return value;
  }
  if (entry.loose && file === 'asset.glb') return entry.loose;
  const response = await fetch(`/files/${key(entry)}/${file}`);
  if (!response.ok) throw new Error((await response.json()).error ?? 'File unavailable');
  return new Uint8Array(await response.arrayBuffer());
}
function href(entry: Entry, file: string) {
  if (entry.local) {
    if (file === 'editable.zip')
      return blobUrl(encodeAssetBundle([entry.local]), 'application/zip');
    return blobUrl(
      entry.local.files[file]!,
      file.endsWith('.js') ? 'text/javascript' : 'model/gltf-binary',
    );
  }
  if (entry.loose) return blobUrl(entry.loose, 'model/gltf-binary');
  return `/files/${key(entry)}/${file}?download`;
}
function remember(name: string, value: string) {
  try {
    localStorage.setItem(name, value);
  } catch {
    /* Files remain usable when browser storage is unavailable. */
  }
}
function recalled(name: string) {
  try {
    return localStorage.getItem(name);
  } catch {
    return null;
  }
}
function collectionNav() {
  const nav = el('collections');
  nav.replaceChildren();
  for (const collection of [
    ...collections,
    ...(opened.length ? [{ id: 'opened-files', label: 'Opened files' }] : []),
  ]) {
    const button = node(
      'button',
      collection.label,
      currentCollection === collection.id ? 'active' : '',
    );
    button.onclick = () => void loadCollection(collection.id).catch(showError);
    nav.append(button);
  }
}
async function loadCollection(id: string) {
  const generation = ++listGeneration;
  currentCollection = id;
  selected.clear();
  collectionNav();
  message('');
  const loaded =
    id === 'opened-files'
      ? opened
      : (await json(`/api/assets?collection=${encodeURIComponent(id)}`)).assets.map(
          (manifest: AssetManifest) => ({ collection: id, manifest }),
        );
  if (generation !== listGeneration) return;
  entries = loaded;
  remember('kiln.collection', id);
  el('collection-title').textContent =
    id === 'opened-files' ? 'Opened files' : (collections.find((c) => c.id === id)?.label ?? id);
  el('collection-caption').textContent =
    id === 'opened-files'
      ? 'Previewed in your browser. Your original files stay untouched.'
      : 'Saved revisions, editable source, and everything ready to use.';
  renderCards();
}
function latestEntries() {
  const groups = new Map<string, Entry[]>();
  for (const entry of entries) {
    const id = entry.manifest.assetId;
    groups.set(id, [...(groups.get(id) ?? []), entry]);
  }
  return [...groups.values()].map((group) => {
    group.sort(
      (a, b) =>
        b.manifest.createdAt.localeCompare(a.manifest.createdAt) ||
        b.manifest.revisionId.localeCompare(a.manifest.revisionId),
    );
    return (
      group.find(
        (e) =>
          e.manifest.revisionId === recalled(`kiln.revision.${e.collection}.${e.manifest.assetId}`),
      ) ?? group[0]!
    );
  });
}
function renderCards() {
  for (const url of thumbUrls.splice(0)) URL.revokeObjectURL(url);
  const cards = el('cards');
  cards.replaceChildren();
  const query = el<HTMLInputElement>('search').value.toLowerCase();
  const shown = latestEntries().filter((e) =>
    `${e.manifest.name} ${e.manifest.tags.join(' ')}`.toLowerCase().includes(query),
  );
  el('count').textContent = `${shown.length} asset${shown.length === 1 ? '' : 's'}`;
  el<HTMLButtonElement>('export-selection').disabled = !selected.size;
  if (!shown.length) {
    const empty = node('div', undefined, 'empty');
    empty.append(
      node('b', query ? 'No matching assets' : 'Your next idea belongs here.'),
      node(
        'p',
        query
          ? 'Try another name or tag.'
          : 'Save an asset with your agent, or open a GLB or editable bundle.',
      ),
    );
    if (!query) empty.append(node('code', 'kiln save asset.kiln.js --name "My asset"'));
    cards.append(empty);
    return;
  }
  for (const entry of shown) {
    const manifest = entry.manifest;
    const card = node('article', undefined, 'card');
    const button = node('button', undefined, 'card-open');
    button.setAttribute('aria-label', `View ${manifest.name}`);
    button.onclick = () => void openDetail(entry).catch(showError);
    const thumb = node('div', undefined, 'thumb');
    if (manifest.files['preview.png']) {
      const img = node('img');
      img.loading = 'lazy';
      img.alt = manifest.name;
      img.src = entry.local
        ? blobUrl(entry.local.files['preview.png']!, 'image/png', thumbUrls)
        : `/files/${key(entry)}/preview.png`;
      img.onerror = () => {
        img.remove();
        thumb.textContent = '◇';
      };
      thumb.append(img);
    } else thumb.textContent = '◇';
    const content = node('div', undefined, 'card-content');
    content.append(node('span', manifest.name, 'card-title'));
    const revisions = entries.filter((e) => e.manifest.assetId === manifest.assetId);
    const parentIds = new Set(revisions.map((e) => e.manifest.parentRevision));
    const heads = revisions.filter((e) => !parentIds.has(e.manifest.revisionId));
    content.append(
      node(
        'span',
        `${manifest.editable ? 'Editable source' : 'Source unavailable'} · ${revisions.length} revision${revisions.length === 1 ? '' : 's'}${heads.length > 1 ? ` · ${heads.length} branches` : ''}`,
        'card-meta',
      ),
    );
    const tags = node('div', undefined, 'tags');
    for (const tag of manifest.tags) tags.append(node('span', tag, 'tag'));
    content.append(tags);
    button.append(thumb, content);
    card.append(button);
    if (!entry.loose) {
      const checkbox = node('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'selection';
      checkbox.checked = selected.has(key(entry));
      checkbox.setAttribute('aria-label', `Select ${manifest.name}`);
      checkbox.onchange = () => {
        if (checkbox.checked) selected.add(key(entry));
        else selected.delete(key(entry));
        el<HTMLButtonElement>('export-selection').disabled = !selected.size;
      };
      card.append(checkbox);
    }
    cards.append(card);
  }
}
async function openDetail(entry: Entry) {
  const generation = ++detailGeneration;
  chosen = entry;
  remember(
    `kiln.revision.${entry.collection}.${entry.manifest.assetId}`,
    entry.manifest.revisionId,
  );
  for (const url of urls.splice(0)) URL.revokeObjectURL(url);
  const dialog = el<HTMLDialogElement>('detail');
  if (!dialog.open) dialog.showModal();
  el('asset-name').textContent = entry.manifest.name;
  const revisions = el<HTMLSelectElement>('revisions');
  revisions.replaceChildren();
  for (const item of entries.filter((e) => e.manifest.assetId === entry.manifest.assetId)) {
    const option = node(
      'option',
      `${new Date(item.manifest.createdAt).toLocaleString()} · ${item.manifest.description || item.manifest.revisionId.slice(0, 10)}`,
    );
    option.value = item.manifest.revisionId;
    option.selected = item.manifest.revisionId === entry.manifest.revisionId;
    revisions.append(option);
  }
  revisions.onchange = () => {
    const next = entries.find(
      (e) =>
        e.manifest.assetId === entry.manifest.assetId && e.manifest.revisionId === revisions.value,
    );
    if (next) void openDetail(next).catch(showError);
  };
  el('asset-description').textContent =
    entry.manifest.description ??
    entry.manifest.brief ??
    (entry.manifest.editable
      ? 'Source travels with this revision. Download the editable bundle to continue elsewhere.'
      : 'This GLB has no saved Kiln source. You can view and use the model.');
  el('provenance').textContent = entry.loose
    ? 'Standalone GLB. No source or build provenance supplied.'
    : JSON.stringify(entry.manifest, null, 2);
  const downloads = el('downloads');
  downloads.replaceChildren();
  for (const [file, label] of [
    ['asset.glb', 'Download GLB'],
    ...(entry.manifest.editable ? [['source.kiln.js', 'Download source']] : []),
    ...(!entry.loose
      ? [
          [
            'editable.zip',
            entry.manifest.editable ? 'Download editable bundle' : 'Download asset bundle',
          ],
        ]
      : []),
  ]) {
    const link = node('a', label);
    link.href = href(entry, file!);
    link.download = `${entry.manifest.name.replace(/[^a-z0-9_-]/gi, '-')}${file === 'asset.glb' ? '.glb' : file === 'source.kiln.js' ? '.kiln.js' : '.zip'}`;
    downloads.append(link);
  }
  el<HTMLButtonElement>('refine').disabled = !entry.manifest.editable;
  el('asset-stats').replaceChildren();
  el('stage-status').textContent = 'Loading saved GLB…';
  wire = false;
  paused = false;
  el('wire').setAttribute('aria-pressed', 'false');
  el('play').textContent = 'Pause';
  const animation = el<HTMLSelectElement>('animation');
  animation.replaceChildren(new Option('Rest pose', ''));
  el<HTMLButtonElement>('play').disabled = true;
  try {
    stage ??= createAssetStage(el('stage'));
    const data = await bytes(entry, 'asset.glb');
    if (generation !== detailGeneration) return;
    const info = await stage.load(data);
    if (!info || generation !== detailGeneration) return;
    stage.wire(false);
    stage.lighting(el<HTMLSelectElement>('lighting').value);
    for (const [value, label] of [
      [info.triangles.toLocaleString(), 'triangles'],
      [info.meshes, 'meshes'],
      [info.materials, 'materials'],
      [`${(data.length / 1024).toFixed(0)} KB`, 'GLB'],
    ]) {
      const item = node('div');
      item.append(node('strong', String(value)), node('span', String(label)));
      el('asset-stats').append(item);
    }
    for (let i = 0; i < info.clips.length; i++)
      animation.append(new Option(info.clips[i], String(i)));
    el('stage-status').textContent = '';
  } catch (error) {
    if (generation === detailGeneration) {
      stage?.dispose();
      stage = undefined;
      el('stage-status').textContent =
        `3D preview unavailable: ${error instanceof Error ? error.message : error}. Downloads remain available.`;
    }
  }
}
async function openFiles(files: { name: string; bytes: Uint8Array }[]) {
  for (const file of files) {
    if (file.bytes.length > ASSET_LIMIT) throw new Error('File exceeds 64 MiB');
    if (file.name.toLowerCase().endsWith('.zip')) {
      for (const record of decodeAssetBundle(file.bytes)) {
        for (const [name, data] of Object.entries(record.files)) {
          const digest = Array.from(
            new Uint8Array(await crypto.subtle.digest('SHA-256', Uint8Array.from(data))),
          )
            .map((v) => v.toString(16).padStart(2, '0'))
            .join('');
          if (`sha256:${digest}` !== record.manifest.files[name]?.sha256)
            throw new Error(`Bundle integrity failure: ${name}`);
        }
        if (
          !opened.some(
            (e) =>
              e.manifest.revisionId === record.manifest.revisionId &&
              e.manifest.assetId === record.manifest.assetId,
          )
        )
          opened.push({ collection: 'opened-files', manifest: record.manifest, local: record });
      }
    } else {
      const id = `a_${crypto.randomUUID().replaceAll('-', '')}`;
      opened.push({
        collection: 'opened-files',
        loose: file.bytes,
        manifest: {
          version: 'kiln.asset.v1',
          assetId: id,
          revisionId: `r_${id}`,
          name: file.name.replace(/\.glb$/i, ''),
          tags: [],
          createdAt: new Date().toISOString(),
          editable: false,
          files: {},
        },
      });
    }
  }
  await loadCollection('opened-files');
}
el<HTMLInputElement>('open').onchange = async (event) => {
  try {
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    if (files.some((f) => f.size > ASSET_LIMIT)) throw new Error('File exceeds 64 MiB');
    await openFiles(
      await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          bytes: new Uint8Array(await file.arrayBuffer()),
        })),
      ),
    );
  } catch (error) {
    showError(error);
  }
};
el('refresh').onclick = () => void loadCollection(currentCollection).catch(showError);
el('search').oninput = renderCards;
el('close-detail').onclick = () => el<HTMLDialogElement>('detail').close();
el<HTMLDialogElement>('detail').addEventListener('close', () => {
  detailGeneration++;
  stage?.dispose();
  stage = undefined;
  for (const url of urls.splice(0)) URL.revokeObjectURL(url);
  renderCards();
});
el('frame').onclick = () => stage?.reset();
el('wire').onclick = () => {
  wire = !wire;
  stage?.wire(wire);
  el('wire').setAttribute('aria-pressed', String(wire));
};
el<HTMLSelectElement>('lighting').onchange = (event) =>
  stage?.lighting((event.target as HTMLSelectElement).value);
el<HTMLSelectElement>('animation').onchange = (event) => {
  const value = (event.target as HTMLSelectElement).value;
  stage?.clip(value === '' ? -1 : Number(value));
  el<HTMLButtonElement>('play').disabled = value === '';
};
el('play').onclick = () => {
  paused = !paused;
  stage?.pause(paused);
  el('play').textContent = paused ? 'Play' : 'Pause';
};
el('refine').onclick = async () => {
  if (!chosen) return;
  const manifest = chosen.manifest;
  const text = chosen.local
    ? `Import the downloaded editable bundle using kiln import <bundle.zip>. Restore asset ${manifest.assetId}, revision ${manifest.revisionId}, using kiln_assets action=restore. Read its source with kiln_source, refine it with kiln_edit, review the result, and save a child revision with kiln_save. Requested change: `
    : `Use kiln_assets with action=restore, collection=${chosen.collection}, assetId=${manifest.assetId}, revisionId=${manifest.revisionId}. Read the returned programRef with kiln_source, refine it with kiln_edit, review the result, and save with kiln_save using assetId=${manifest.assetId}, parentRevision=${manifest.revisionId}, collection=${chosen.collection}. Requested change: `;
  try {
    await navigator.clipboard.writeText(text);
    el('refine').textContent = 'Instructions copied';
  } catch {
    el('provenance').textContent = text;
    el('provenance').parentElement?.setAttribute('open', '');
  }
};
el('export-selection').onclick = () => {
  try {
    const link = node('a');
    if (currentCollection === 'opened-files')
      link.href = blobUrl(
        encodeAssetBundle(entries.filter((e) => selected.has(key(e))).map((e) => e.local!)),
        'application/zip',
      );
    else {
      const params = new URLSearchParams();
      for (const id of selected) params.append('revision', id);
      link.href = `/api/bundle?${params}`;
    }
    link.download = 'kiln-assets.zip';
    link.click();
  } catch (error) {
    showError(error);
  }
};
async function start() {
  collections = (await json('/api/collections')).collections;
  const remembered = recalled('kiln.collection');
  await loadCollection(
    collections.find((c) => c.id === remembered)?.id ?? collections[0]?.id ?? 'project',
  );
  if (new URLSearchParams(location.search).has('open')) {
    const response = await fetch('/api/standalone');
    if (!response.ok) throw new Error('File unavailable');
    await openFiles([
      {
        name: response.headers.get('Content-Type')?.includes('zip') ? 'asset.zip' : 'asset.glb',
        bytes: new Uint8Array(await response.arrayBuffer()),
      },
    ]);
    if (opened.length === 1) await openDetail(opened[0]!);
  }
}
void start().catch(showError);

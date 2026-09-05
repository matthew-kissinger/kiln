import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyRecordedPoster } from './provenance.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../public');
const hash = (value) => createHash('sha256').update(value).digest('hex');
const rows = JSON.parse(await readFile(join(root, 'assets/index.json'), 'utf8'));
for (const row of rows) {
  for (const [file, digest] of [
    [row.source, row.sourceHash],
    [row.file, row.artifactHash],
  ]) {
    if (
      !file ||
      !digest ||
      (!resolve(root, file).startsWith(`${root}\\`) && !resolve(root, file).startsWith(`${root}/`))
    )
      throw new Error(`Invalid asset path: ${row.name}`);
    if (hash(await readFile(join(root, file))) !== digest)
      throw new Error(`Asset hash mismatch: ${file}`);
  }
  await readFile(join(root, row.thumb));
  if (row.poster) await readFile(join(root, row.poster));
  const source = await readFile(join(root, row.source));
  const glb = await readFile(join(root, row.file));
  if (row.history) {
    if (row.history.revisions.filter((revision) => revision.current && revision.sourceHash === row.sourceHash).length !== 1)
      throw new Error(`History has no unique displayed source: ${row.name}`);
    for (const revision of row.history.revisions) {
      const path = resolve(root, revision.source);
      if (!path.startsWith(resolve(root, 'assets/history', row.name) + '/') && !path.startsWith(resolve(root, 'assets/history', row.name) + '\\'))
        throw new Error(`Invalid history download path: ${row.name}`);
      if (hash(await readFile(path)) !== revision.sourceHash)
        throw new Error(`History snapshot mismatch: ${revision.source}`);
    }
  }
  if (row.provenance?.posterReceipt) {
    verifyRecordedPoster(row.provenance.posterReceipt, source, glb, await readFile(resolve(root, '../../examples/renders', `${row.name}.png`)));
    const publicReceipt = JSON.parse(await readFile(join(root, 'assets', `${row.name}.poster.json`), 'utf8'));
    if (publicReceipt.artifactHash !== row.artifactHash || publicReceipt.sourceHash !== row.sourceHash) throw new Error(`Public poster record mismatch: ${row.name}`);
  }
  if (row.heroPoster) verifyRecordedPoster(row.heroPoster, source, glb, await readFile(resolve(root, '../examples', `${row.name}.poster.png`)));
}
const build = JSON.parse(await readFile(join(root, 'assets/build.json'), 'utf8'));
if (build.indexHash !== hash(await readFile(join(root, 'assets/index.json')))) throw new Error('Gallery index differs from its build receipt');
const demo = JSON.parse(await readFile(join(root, 'assets/edit-demo.json'), 'utf8'));
for (const row of demo.records) {
  if (
    `sha256:${hash(await readFile(join(root, `assets/workbench-${row.name}.kiln.js`)))}` !==
    row.programRef
  )
    throw new Error(`Demo source mismatch: ${row.name}`);
  if (hash(await readFile(join(root, `assets/workbench-${row.name}.glb`))) !== row.artifactHash)
    throw new Error(`Demo GLB mismatch: ${row.name}`);
}
const geometry = JSON.parse(await readFile(join(root, 'assets/geometry-demo.json'), 'utf8'));
for (const [file, digest] of [
  ['equation-canopy.kiln.js', geometry.programRef.replace('sha256:', '')],
  ['equation-canopy.glb', geometry.artifactHash],
  ['equation-canopy.png', geometry.imageHash],
]) {
  if (hash(await readFile(join(root, 'assets', file))) !== digest)
    throw new Error(`Geometry demo mismatch: ${file}`);
}
console.log(
  `Verified ${rows.length} source/GLB pairs, posters, and both source-edit demo revisions, and the geometry/camera example.`,
);

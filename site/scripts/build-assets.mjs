// Build the gallery's payload by running every checked-in program.
//
// The site does not ship a folder of GLBs somebody exported once. It runs
// `examples/*.kiln.js` through the same evaluator the test suite uses and keeps
// what comes out, so a program and the thing the page shows cannot drift apart:
// change the program, rebuild, and the model on the page is the new one. It is
// the same argument the README makes about the renders, applied to geometry.
//
//   bun scripts/build-assets.mjs          # from site/
//
// Everything on the card -- triangles, bounds, draw calls, material and texture
// counts -- is read off the engine's own integration manifest rather than
// counted again here, because a second implementation of a number is a second
// chance to disagree with the first.
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

import { readAuthorship, readCategory } from '../../scripts/authorship';
import { resolveEvaluatorPortV1 } from '../../src/evaluator/protocol';

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = resolve(SITE, '..');
const EXAMPLES = join(REPO, 'examples');
const RENDERS = join(EXAMPLES, 'renders');
const OUT = join(SITE, 'public', 'assets');
const THUMBS = join(SITE, 'public', 'thumbs');

// The two teaching examples are deliberately plain -- they exist to be read, not
// looked at -- and putting them in a gallery misrepresents both them and it.
const TEACHING = new Set(['crate', 'well']);

/** The one-line caption the README gives each asset, so both read alike. */
function captions(readme) {
  const out = new Map();
  const cell =
    /<a href="examples\/renders\/([a-z0-9-]+)\.png">.*?<br><sub>([^<]*)<\/sub>/gs;
  for (const m of readme.matchAll(cell)) if (!out.has(m[1])) out.set(m[1], m[2].trim());
  return out;
}

const readme = await readFile(join(REPO, 'README.md'), 'utf8');
const caption = captions(readme);

const names = (await readdir(EXAMPLES))
  .filter((f) => f.endsWith('.kiln.js'))
  .map((f) => basename(f, '.kiln.js'))
  .filter((n) => !TEACHING.has(n))
  .sort();

await rm(OUT, { recursive: true, force: true });
await rm(THUMBS, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
await mkdir(THUMBS, { recursive: true });

const evaluator = resolveEvaluatorPortV1(undefined, 'trusted-local');
const manifest = [];
let bytes = 0;

for (const name of names) {
  const src = await readFile(join(EXAMPLES, `${name}.kiln.js`), 'utf8');
  const author = readAuthorship(src);
  const r = await evaluator.render(src);
  await writeFile(join(OUT, `${name}.glb`), r.glb);
  bytes += r.glb.byteLength;

  const im = r.integrationManifest;
  manifest.push({
    name,
    file: `assets/${name}.glb`,
    thumb: `thumbs/${name}.webp`,
    bytes: r.glb.byteLength,
    // The category the program declares, not the one on the render result: that
    // field carries whatever the request asked for, and nothing asked here.
    category: readCategory(src),
    caption: caption.get(name) ?? '',
    model: author.display ?? author.model,
    harness: author.harness,
    cleanRoom: author.cleanRoom,
    tris: im.renderMetrics.triangles,
    drawCalls: im.renderMetrics.drawCalls,
    materials: im.renderMetrics.uniqueMaterials,
    textures: im.renderMetrics.textureCount,
    size: im.bounds.size.map((v) => Number(v.toFixed(2))),
    grounded: im.ground.grounded,
    // Loud rather than quiet: a program that starts warning is one the gallery
    // should stop flattering, and the number is on the card.
    warnings: r.warnings.length,
  });

  // The index shows the checked-in hero render and the stage shows the live
  // GLB, so the grid stays cheap: fifty 1000px PNGs is 3.6 MB of first paint,
  // and the same fifty at 560px of webp is a fifth of that.
  await sharp(join(RENDERS, `${name}.png`))
    .resize(560, 560, { fit: 'inside' })
    .webp({ quality: 82 })
    .toFile(join(THUMBS, `${name}.webp`));

  const w = r.warnings.length ? `  ${r.warnings.length} warnings` : '';
  console.log(`  ${name.padEnd(24)} ${String(im.renderMetrics.triangles).padStart(7)} tris${w}`);
}

await writeFile(join(OUT, 'index.json'), `${JSON.stringify(manifest, null, 2)}\n`);

const total = manifest.reduce((a, m) => a + m.tris, 0);
console.log(
  `\n${manifest.length} assets, ${total.toLocaleString('en-US')} triangles, ` +
    `${(bytes / 1024 / 1024).toFixed(1)} MB of GLB`,
);

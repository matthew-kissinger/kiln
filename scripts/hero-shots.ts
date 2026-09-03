/**
 * Render one beauty shot per hero example into `examples/renders/`.
 *
 * The README used to carry a single stitched contact-sheet collage. That was
 * the wrong artifact for two reasons: every asset got the same 380 px cell no
 * matter how much detail it had, and a reader who wanted to look closely at one
 * of them had no way to. So each hero now gets its own full-size PNG.
 *
 * This goes through the same PBR render port the `kiln render --views` path
 * uses, at a larger per-view size and with no cell label or axis gnomon, so the
 * output is a picture of the asset rather than a diagnostic sheet.
 *
 *   bun scripts/hero-shots.ts                 # every hero
 *   bun scripts/hero-shots.ts mech lunar-lander
 *   bun scripts/hero-shots.ts --size 1400 --cpu
 *
 * Renders come off the port as raw RGB PNGs -- 8 MB each at 1200 px, which is
 * not something to put ten of in a git history for a README to load. They are
 * downscaled once and re-encoded at full compression on the way out, which is
 * also a free supersample: a 1200 px render shown at 1000 px is antialiased.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

import { captureViewPngsViaPort } from '../src/agent/generate';
import { buildRenderPort } from '../src/cli-render-mode';
import { resolveEvaluatorPortV1 } from '../src/evaluator/protocol';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const EXAMPLES = join(REPO, 'examples');
const OUT_DIR = join(EXAMPLES, 'renders');

/**
 * The hero set, in the order the README presents them.
 *
 * Kept as an explicit list rather than a glob of `examples/*.kiln.js`, because
 * the examples directory also holds the small teaching programs (crate, well)
 * that are deliberately NOT heroes and should not appear in the gallery.
 */
const HEROES = [
  'field-gun',
  'diving-helmet',
  'penny-farthing',
  'street-lamp',
  'mech',
  'arcade-cabinet',
  'sushi-store',
  'cafe-racer',
  'beam-engine',
  'lunar-lander',
] as const;

/**
 * Slightly higher and further round than the contact sheet's 3/4 cell.
 *
 * The diagnostic 3/4 sits at [0.7, 0.5, 0.7] because it has to keep the front
 * readable next to five other cells. A single hero shot has no such duty, so it
 * can take the angle that actually flatters a silhouette: a touch more azimuth
 * to open up the side, a touch less elevation so the asset is not looked down
 * on. `zoom` is the frame padding — 1.06 leaves a hair of air at the edges.
 */
const HERO_DIR: [number, number, number] = [0.82, 0.44, 0.58];
const HERO_ZOOM = 1.06;

/** Width the shot is published at. Render size stays higher, for the downsample. */
const DISPLAY_PX = 1000;

function parseArgs(argv: string[]): { names: string[]; size: number; cpu: boolean } {
  const names: string[] = [];
  let size = 1200;
  let cpu = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === '--size') size = Number(argv[++i]);
    else if (a === '--cpu') cpu = true;
    else if (a.startsWith('-')) throw new Error(`unknown flag ${a}`);
    else names.push(a.replace(/\.kiln\.js$/, ''));
  }
  if (!Number.isFinite(size) || size < 64 || size > 4096) {
    throw new Error(`--size must be between 64 and 4096, got ${size}`);
  }
  return { names: names.length ? names : [...HEROES], size, cpu };
}

async function main(): Promise<void> {
  const { names, size, cpu } = parseArgs(process.argv.slice(2));
  await mkdir(OUT_DIR, { recursive: true });

  const context = await buildRenderPort(cpu ? 'cpu' : 'auto', undefined);
  if (!context.viewRenderPort) {
    // The CPU rasterizer is geometry-flat: it draws shape, not materials. That
    // is the right fallback for an in-loop diagnostic and the wrong one for a
    // gallery image, so say so rather than quietly shipping grey renders.
    console.warn('no GPU render port — shots will be geometry-flat, not material-faithful');
  }
  const evaluator = resolveEvaluatorPortV1(undefined, 'trusted-local');

  for (const name of names) {
    const src = join(EXAMPLES, `${name}.kiln.js`);
    const code = await readFile(src, 'utf8');
    const rendered = await evaluator.render(code);

    let png: Uint8Array | undefined;
    if (context.viewRenderPort) {
      const ported = await captureViewPngsViaPort(
        context.viewRenderPort,
        rendered.glb,
        context.viewRenderTimeoutMs ?? 120_000,
        [HERO_DIR],
        size,
      );
      if (ported.ok) png = ported.pngs[0];
      else console.warn(`  ${name}: port declined (${ported.reason}), falling back to CPU`);
    }
    if (!png) {
      const { renderGlbViewGrid } = await import('../src/views');
      const grid = await renderGlbViewGrid(rendered.glb, {
        capture: { preset: '1x1', cells: [{ azimuthDeg: 35, elevationDeg: 26, zoom: HERO_ZOOM }] },
      });
      png = grid.png;
    }

    const encoded = await sharp(Buffer.from(png))
      .resize(DISPLAY_PX)
      .png({ compressionLevel: 9, effort: 10 })
      .toBuffer();
    const out = join(OUT_DIR, `${name}.png`);
    await writeFile(out, encoded);
    console.log(
      `  ${basename(out)}  ${DISPLAY_PX}px  ${(encoded.byteLength / 1024).toFixed(0)} KB` +
        ` (from ${(png.byteLength / 1024 / 1024).toFixed(1)} MB raw)`,
    );
  }
}

await main();

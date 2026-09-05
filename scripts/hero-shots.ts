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
 *   bun scripts/hero-shots.ts mech cathedral
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
  'abyssal-surveyor',
  'bench-refractor',
  'research-vessel',
  'twisting-canopy',
  'field-gun',
  'cathedral',
  'mech',
  'diving-helmet',
  'cafe-racer',
  'penny-farthing',
  'sushi-store',
  'street-lamp',
  'arcade-cabinet',
  'robot-arm',
  'carousel',
  'ferris-wheel',
  'orrery',
  'longcase-clock',
  'radio-telescope',
  'anglerfish',
  'hot-air-balloon',
  'vending-machine',
  'gramophone',
  'typewriter',
  'lighthouse',
  'steam-locomotive',
  'windmill',
  'aircraft-carrier',
  'air-defense-radar',
  'fighter-jet',
  'comms-satellite',
  'victorian-greenhouse',
  'gothic-gatehouse',
  'cable-stayed-bridge',
  'fire-lookout-tower',
  'tram',
  'tugboat',
  'deep-sea-diver',
  'pumpjack',
  'drilling-rig',
  'harbour-crane',
  'crawler-crane',
  'excavator',
  'printing-press',
  'pipe-organ',
  'planetarium-projector',
  'astronomical-clock',
  'espresso-machine',
  'pinball-machine',
  'trebuchet',
  'orbital-station',
  'rigid-airship',
  'blast-furnace',
  'clock-tower',
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

/**
 * Per-asset camera, for the few subjects the shared angle does not suit.
 *
 * The default looks mostly down the +X axis, which is the right three-quarter
 * for almost everything because +X is the contract's forward. It is wrong for a
 * subject whose most important feature also points at +X: the gramophone's horn
 * is a 0.32 m bell on the +X axis, so from the shared angle it faces the lens
 * squarely and hides the turntable, the tonearm and the whole crane behind it.
 * Swinging round toward +Z puts the horn in profile, where its flare reads and
 * the deck is visible past it.
 *
 * This is a camera choice, not a retouch -- the render is still the program,
 * straight through the same port.
 */
const HERO_OVERRIDES: Record<string, { dir?: [number, number, number]; zoom?: number }> = {
  gramophone: { dir: [0.3, 0.4, 0.87], zoom: 1.02 },
  // Same problem, different subject: the fish is modelled nose-at-+X, so the
  // shared angle looks it straight in the mouth and a deep-sea anglerfish
  // becomes a dark oval with a light in front of it. Almost side-on is the only
  // view where the profile, the jaw line, the arched illicium and the fin rays
  // all read at once, which is why every plate ever drawn of one is in profile.
  anglerfish: { dir: [0.24, 0.3, 0.92], zoom: 1.04 },
  // A 332 m hull is four times as long as it is wide, so the shared angle leaves
  // it as a thin diagonal with the flight deck nearly edge-on. Swinging toward
  // the beam opens the deck out; dropping the elevation to 27 degrees is what
  // puts the ship back under it. From higher up the entire flank falls into the
  // shadow of its own overhang and a carrier reads as a black lozenge with
  // markings on it.
  'aircraft-carrier': { dir: [0.6, 0.42, 0.55], zoom: 1.0 },
};

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
  if (!context.viewRenderPort && !cpu) {
    // The CPU rasterizer is geometry-flat: it draws shape, not materials, which
    // is the right fallback for an in-loop diagnostic and the wrong one for a
    // gallery image. Warning and carrying on was worse than useless: the
    // detection probe is a health GET that times out whenever the service is
    // busy -- which it is whenever a dispatch batch is rendering through it --
    // so a transient miss silently replaced finished PBR heroes with grey ones,
    // and the only evidence was a line of scrollback. Refuse instead. `--cpu`
    // still says so deliberately, and KILN_RENDER_PORT_URL skips the probe.
    console.error(
      'no GPU render port reachable at http://127.0.0.1:8000.\n' +
        'Gallery shots must be material-faithful, and overwriting them with flat\n' +
        'CPU renders loses work that cannot be recovered from the tree.\n' +
        'Start the render service, or set KILN_RENDER_PORT_URL to skip the probe\n' +
        '(it is taken on trust), or pass --cpu if you really do want flat shots.',
    );
    process.exit(1);
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
        [HERO_OVERRIDES[name]?.dir ?? HERO_DIR],
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

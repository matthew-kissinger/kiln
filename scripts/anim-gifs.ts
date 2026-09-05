/**
 * Render one looping GIF per animated example into `examples/renders/`.
 *
 * A still cannot show that Kiln's animation path works, and the claim that a
 * model can write `animate()` and then watch its own motion deserves better
 * evidence than a sentence. This produces the loop itself.
 *
 *   bun scripts/anim-gifs.ts                   # every entry in GIFS
 *   bun scripts/anim-gifs.ts robot-arm
 *   bun scripts/anim-gifs.ts --frames 30 --fps 15 --display 460
 *
 * Two details matter more than they look like they should.
 *
 * The frames are sampled across [0, duration) rather than [0, duration]. A clip
 * loops, so its last keyframe is its first; sampling inclusively duplicates a
 * frame and puts a visible hitch at the seam of every repeat.
 *
 * And the framing is pinned by hand. The render port fits the camera to the
 * bounding box it is handed, which is right for a still and wrong for a
 * sequence: a robot arm's posed extent varies 63% across its cycle, so the
 * camera would zoom in and out as the arm reached, and the asset would appear
 * to breathe. Rather than skip those assets or change the port's contract, each
 * frame is corrected back onto one shared frame afterwards. That correction is
 * exact rather than approximate — see `refit` below.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

import { orthoHalfExtent, viewBasis } from '../render-service/src/framing.mjs';
import { captureViewPngsViaPort } from '../src/agent/generate';
import { buildRenderPort } from '../src/cli-render-mode';
import { resolveEvaluatorPortV1 } from '../src/evaluator/protocol';
import { renderSceneToGLB } from '../src/render';
import { loadGlbReviewScene } from '../src/views';
import { poseSceneAtTime, prepareClip } from '../src/views/pose';
import { measureBounds } from '../src/views/raster';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const EXAMPLES = join(REPO, 'examples');
const OUT_DIR = join(EXAMPLES, 'renders');

/**
 * Animated examples, with the clip each one is shown in.
 *
 * The longcase clock is deliberately absent. It animates — a two-second
 * pendulum swing — but the bob travels a few pixels in a frame sized for a
 * two-metre case, so the GIF reads as a still that occasionally flickers. It
 * stays in the gallery as a still, where it is one of the better ones.
 */
const GIFS: readonly { name: string; clip: string }[] = [
  { name: 'robot-arm', clip: 'PickAndPlace' },
  { name: 'carousel', clip: 'ride' },
  { name: 'orrery', clip: 'OrreryMotion' },
  { name: 'radio-telescope', clip: 'Scan' },
];

/** Matches the hero stills, so a GIF sits beside them without a jump in angle. */
const HERO_DIR: [number, number, number] = [0.82, 0.44, 0.58];

type Vec3 = [number, number, number];

interface Args {
  names: string[];
  frames: number;
  fps: number;
  size: number;
  display: number;
  cpu: boolean;
}

function parseArgs(argv: string[]): Args {
  const names: string[] = [];
  let frames = 24;
  let fps = 12;
  let size = 640;
  let display = 440;
  let cpu = false;
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i]!;
    if (flag === '--frames') frames = Number(argv[++i]);
    else if (flag === '--fps') fps = Number(argv[++i]);
    else if (flag === '--size') size = Number(argv[++i]);
    else if (flag === '--display') display = Number(argv[++i]);
    else if (flag === '--cpu') cpu = true;
    else if (flag.startsWith('-')) throw new Error(`unknown flag ${flag}`);
    else names.push(flag.replace(/\.kiln\.js$/, ''));
  }
  if (!Number.isFinite(frames) || frames < 2 || frames > 120) {
    throw new Error(`--frames must be between 2 and 120, got ${frames}`);
  }
  if (!Number.isFinite(fps) || fps < 1 || fps > 50) {
    throw new Error(`--fps must be between 1 and 50, got ${fps}`);
  }
  return { names, frames, fps, size, display, cpu };
}

/** Even samples across [0, duration) — the endpoint is the start of the loop. */
function loopTimes(duration: number, count: number): number[] {
  return Array.from({ length: count }, (_, i) => (i / count) * duration);
}

const centreOf = (min: readonly number[], max: readonly number[]): Vec3 => [
  (min[0]! + max[0]!) / 2,
  (min[1]! + max[1]!) / 2,
  (min[2]! + max[2]!) / 2,
];

/**
 * Put one frame back on the sequence's shared camera.
 *
 * The port renders a square covering ±`half` around that frame's own bounding
 * centre. The sequence wants a square covering ±`unionHalf` around the union
 * centre. Because the projection is orthographic and the fit is exact, the two
 * differ by exactly a uniform scale and a translation, both of which are known
 * here: the frame occupies `half / unionHalf` of the target, and its centre
 * belongs wherever the union centre projects it. Scaling and compositing is
 * therefore not an approximation of a fixed camera — it is the fixed camera.
 */
async function refit(
  png: Uint8Array,
  opts: {
    size: number;
    half: number;
    unionHalf: number;
    centre: Vec3;
    unionCentre: Vec3;
    dir: Vec3;
    background: { r: number; g: number; b: number };
  },
): Promise<Buffer> {
  const scale = opts.half / opts.unionHalf;
  const inner = Math.max(1, Math.round(opts.size * scale));

  const { right, up } = viewBasis(opts.dir) as { right: Vec3; up: Vec3 };
  const delta: Vec3 = [
    opts.centre[0] - opts.unionCentre[0],
    opts.centre[1] - opts.unionCentre[1],
    opts.centre[2] - opts.unionCentre[2],
  ];
  const pxPerUnit = opts.size / (2 * opts.unionHalf);
  const dx = (delta[0] * right[0] + delta[1] * right[1] + delta[2] * right[2]) * pxPerUnit;
  const dy = (delta[0] * up[0] + delta[1] * up[1] + delta[2] * up[2]) * pxPerUnit;

  // Screen y grows downward; the up axis grows upward.
  const left = Math.round(opts.size / 2 + dx - inner / 2);
  const top = Math.round(opts.size / 2 - dy - inner / 2);

  const scaled = await sharp(Buffer.from(png)).resize(inner, inner, { fit: 'fill' }).toBuffer();
  return sharp({
    create: { width: opts.size, height: opts.size, channels: 3, background: opts.background },
  })
    .composite([{ input: scaled, left, top }])
    .removeAlpha()
    .raw()
    .toBuffer();
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  await mkdir(OUT_DIR, { recursive: true });

  const chosen = args.names.length
    ? args.names.map((n) => GIFS.find((g) => g.name === n) ?? { name: n, clip: '' })
    : [...GIFS];

  const context = await buildRenderPort(args.cpu ? 'cpu' : 'auto', undefined);
  if (!context.viewRenderPort) {
    throw new Error('no GPU render port — a geometry-flat GIF is not worth publishing');
  }
  const evaluator = resolveEvaluatorPortV1(undefined, 'trusted-local');

  for (const { name, clip: wanted } of chosen) {
    const code = await readFile(join(EXAMPLES, `${name}.kiln.js`), 'utf8');
    const rendered = await evaluator.render(code);
    const { root, clips } = await loadGlbReviewScene(rendered.glb);
    const all = clips as unknown as { name: string }[];
    const clip = wanted
      ? (all.find((c) => c.name.toLowerCase().includes(wanted.toLowerCase())) ?? all[0])
      : all[0];
    if (!clip) {
      console.warn(`  ${name}: no animation clips, skipped`);
      continue;
    }

    const prepared = prepareClip(root as never, clip as never);
    const times = loopTimes(prepared.duration, args.frames);

    // Pass one: every frame's bounds, and their union.
    const perFrame: { min: Vec3; max: Vec3 }[] = [];
    const uMin: Vec3 = [Infinity, Infinity, Infinity];
    const uMax: Vec3 = [-Infinity, -Infinity, -Infinity];
    for (const t of times) {
      poseSceneAtTime(root as never, prepared, t);
      const b = measureBounds(root);
      const min = [b.min[0]!, b.min[1]!, b.min[2]!] as Vec3;
      const max = [b.max[0]!, b.max[1]!, b.max[2]!] as Vec3;
      perFrame.push({ min, max });
      for (let a = 0; a < 3; a++) {
        if (min[a]! < uMin[a]!) uMin[a] = min[a]!;
        if (max[a]! > uMax[a]!) uMax[a] = max[a]!;
      }
    }
    const unionHalf = orthoHalfExtent(uMin, uMax, HERO_DIR) as number;
    const unionCentre = centreOf(uMin, uMax);
    const tightest = Math.min(
      ...perFrame.map((f) => orthoHalfExtent(f.min, f.max, HERO_DIR) as number),
    );

    // Pass two: render each pose, then put it back on the shared camera.
    const stacked: Buffer[] = [];
    let background = { r: 0, g: 0, b: 0 };
    for (let i = 0; i < times.length; i++) {
      poseSceneAtTime(root as never, prepared, times[i]!);
      // Same re-serialization the review tools do, and the same reason it is
      // not a fresh asset submission: these bytes came out of this engine.
      const posed = await renderSceneToGLB(root as never, { derivative: true });
      const shot = await captureViewPngsViaPort(
        context.viewRenderPort,
        Uint8Array.from(posed.bytes),
        context.viewRenderTimeoutMs ?? 120_000,
        [HERO_DIR],
        args.size,
      );
      if (!shot.ok) throw new Error(`${name}: render port declined (${shot.reason})`);
      const png = shot.pngs[0]!;
      if (i === 0) {
        // The port paints a flat ground colour; sampling it keeps the padding
        // added below invisible rather than a guessed near-match.
        const corner = await sharp(Buffer.from(png))
          .extract({ left: 0, top: 0, width: 1, height: 1 })
          .removeAlpha()
          .raw()
          .toBuffer();
        background = { r: corner[0]!, g: corner[1]!, b: corner[2]! };
      }
      const frame = await refit(png, {
        size: args.size,
        half: orthoHalfExtent(perFrame[i]!.min, perFrame[i]!.max, HERO_DIR) as number,
        unionHalf,
        centre: centreOf(perFrame[i]!.min, perFrame[i]!.max),
        unionCentre,
        dir: HERO_DIR,
        background,
      });
      stacked.push(
        await sharp(frame, { raw: { width: args.size, height: args.size, channels: 3 } })
          .resize(args.display, args.display, { fit: 'fill' })
          .raw()
          .toBuffer(),
      );
    }

    const gif = await sharp(Buffer.concat(stacked), {
      raw: {
        width: args.display,
        height: args.display * times.length,
        channels: 3,
        pageHeight: args.display,
      },
    })
      .gif({ loop: 0, delay: Math.round(1000 / args.fps) })
      .toBuffer();

    const out = join(OUT_DIR, `${name}.gif`);
    await writeFile(out, gif);
    console.log(
      `  ${name}.gif  ${args.display}px  ${times.length} frames @ ${args.fps}fps  ` +
        `${(gif.byteLength / 1024).toFixed(0)} KB  ` +
        `(refit ${((1 - tightest / unionHalf) * 100).toFixed(0)}% at the tightest pose)`,
    );
  }
}

await main();

/**
 * Reference-comparison gate — T4.3
 *
 * When a generation was driven by a reference image, does the asset that came
 * out actually resemble it? This computes a deterministic silhouette + coarse
 * colour agreement between the reference photograph and a rendered view, and
 * reports disagreement as an observation.
 *
 * ## Why it takes rasters, not image files
 *
 * The reference is whatever the user supplied or Kiln generated — in practice a
 * JPEG. The rendered view is a PNG. Decoding JPEG needs a native codec, and the
 * agent-runtime container deliberately ships without native modules (see the
 * note in `views/png.ts`). Rather than pull sharp into a path that cannot have
 * it, this module takes two already-decoded RGB rasters and does its own
 * resampling. The caller that owns a decoder does the decoding.
 *
 * ## Segmentation: the contact shadow is the whole problem
 *
 * A reference photograph has no alpha. The subject is separated from the
 * backdrop by value, and every studio reference carries a soft contact shadow
 * under the subject: correct photography, and a low-contrast neutral region
 * physically attached to the subject's base. Thresholding on "differs from the
 * backdrop" reads that shadow as object on *every single reference*, inflating
 * coverage and dragging the silhouette down into a skirt the model never had.
 *
 * So the backdrop is not a colour, it is a band:
 *
 *  - the backdrop colour is the per-channel median of the border ring, which is
 *    backdrop by construction in both a product shot and a Kiln view grid;
 *  - a pixel is backdrop when it is near-neutral relative to that colour AND no
 *    more than {@link SHADOW_DEPTH_FRACTION} of the backdrop's luma darker.
 *
 * A soft shadow is near-neutral and mildly darker, so it lands in the band. A
 * genuinely dark object is either much darker or carries chroma, so it does
 * not. The fraction is relative rather than absolute so the same rule works on
 * a mid-grey photographic backdrop and on Kiln's near-black view background.
 *
 * ## Determinism
 *
 * Everything runs at a fixed working size with a box filter and integer pixel
 * addressing, so the same two rasters always produce the same numbers on any
 * machine. Nothing here samples, randomises, or reads the clock.
 *
 * ## Rule class
 *
 * `heuristic` / `observe`, matching T4.1 and T4.2. It is NOT `exact` — that is
 * reserved for rules already enforcing on frozen conformance evidence, however
 * precise the arithmetic here is. It must not be promoted past `observe` while
 * the `appearance`-class throw stands unreconciled: this rule compares a
 * photograph to a render, which is an appearance claim wearing geometry's
 * clothes, and promoting it before that distinction is settled would let a
 * lighting difference block an asset.
 */

import { KILN_ENGINE_QA_OWNER, type QaRule } from './registry';
import type { QaContext, QaFinding } from './types';

/** Working resolution for both rasters. Fixed so the metric is reproducible. */
export const REFERENCE_COMPARISON_WORK_SIZE = 96;

/**
 * Silhouette normalisation grid.
 *
 * Each mask is cropped to its own bounding box and fitted into this square
 * **with its aspect ratio preserved**, letterboxed on the short axis. Cropping
 * removes framing and camera distance, which differ on every generation and say
 * nothing about the asset. Keeping the aspect ratio is what is left, and it is
 * the whole signal: stretch each bounding box to fill the square instead, and
 * every solid rectangle becomes the same filled square, so a tall thin box
 * scores a perfect match against a wide flat one.
 */
export const SILHOUETTE_GRID = 64;

/**
 * How much darker than the backdrop a near-neutral pixel may be and still count
 * as backdrop, as a fraction of the backdrop's luma.
 *
 * 0.45 was chosen against the measured references: their contact shadows bottom
 * out around 60-70% of backdrop luma, and no subject in the set sits in that
 * band while also being neutral. Raising it starts eating dark grey objects;
 * lowering it lets the shadow back in.
 */
export const SHADOW_DEPTH_FRACTION = 0.45;

/** Maximum chroma distance from the backdrop for a pixel to be considered
 *  neutral-like, on a 0-255 scale. A shadow is grey; a blue object is not. */
export const BACKDROP_CHROMA_TOLERANCE = 18;

/** Below this silhouette agreement the shapes are reported as disagreeing. */
export const SILHOUETTE_IOU_OBSERVE = 0.55;

/** Below this colour agreement the palettes are reported as disagreeing. */
export const COLOR_AGREEMENT_OBSERVE = 0.5;

/**
 * RGB distance at which two mean colours read as unrelated.
 *
 * NOT the maximum possible distance (441, black to white). Normalising by that
 * puts red against green at 0.56 — nominal agreement — because real colours
 * never span the cube's diagonal. 160 is roughly where two hues stop looking
 * like variations of each other, so the 0-1 scale spans the range that occurs.
 */
export const COLOR_DISTANCE_SCALE = 160;

/** An RGB raster, 3 bytes per pixel, row-major, no padding. */
export interface RgbRasterV1 {
  data: Uint8Array;
  width: number;
  height: number;
}

export interface ReferenceComparisonSideV1 {
  /** Fraction of the working raster classified as subject, 0-1. */
  coverage: number;
  /** Per-channel backdrop colour the segmentation derived from the border ring. */
  backdrop: readonly [number, number, number];
  /** Mean subject colour, or the backdrop when nothing was classified as subject. */
  meanColor: readonly [number, number, number];
  /** Pixels rejected as contact shadow rather than counted as subject. Reported
   *  because a reference with none is either cut out or lit flat, and that
   *  changes how much the coverage numbers are worth. */
  shadowPixels: number;
}

export interface ReferenceComparisonEvidenceV1 {
  schemaVersion: 1;
  workSize: number;
  reference: ReferenceComparisonSideV1;
  rendered: ReferenceComparisonSideV1;
  /** Intersection over union of the two silhouettes, each cropped to its own
   *  bounding box and fitted aspect-preserving into {@link SILHOUETTE_GRID}. */
  silhouetteIoU: number;
  /** Symmetric coverage agreement: smaller coverage over larger, 0-1. */
  coverageRatio: number;
  /** Mean subject colours compared on the {@link COLOR_DISTANCE_SCALE}, 0-1. */
  colorAgreement: number;
}

/**
 * Cut one cell out of a Kiln view sheet.
 *
 * The comparison takes a single view; a sheet has up to nine subjects and a
 * lattice of gutters, and its silhouette is meaningless. The grid is a plain
 * even division — `views/grid.ts` lays cells out at exactly `width/cols` by
 * `height/rows` — so this is integer arithmetic, not detection.
 */
export function cropGridCell(
  sheet: RgbRasterV1,
  cols: number,
  rows: number,
  index = 0,
): RgbRasterV1 {
  if (cols < 1 || rows < 1) return sheet;
  const cellW = Math.floor(sheet.width / cols);
  const cellH = Math.floor(sheet.height / rows);
  if (cellW < 1 || cellH < 1) return sheet;
  const clamped = Math.min(Math.max(0, Math.floor(index)), cols * rows - 1);
  const ox = (clamped % cols) * cellW;
  const oy = Math.floor(clamped / cols) * cellH;
  const data = new Uint8Array(cellW * cellH * 3);
  for (let y = 0; y < cellH; y++) {
    const src = ((oy + y) * sheet.width + ox) * 3;
    data.set(sheet.data.subarray(src, src + cellW * 3), y * cellW * 3);
  }
  return { data, width: cellW, height: cellH };
}

function round4(value: number): number {
  return Math.round(value * 1e4) / 1e4;
}

function luma(r: number, g: number, b: number): number {
  // Integer-friendly Rec. 601. Exact coefficients matter less than stability.
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Box-filter resample to the working size.
 *
 * Every source pixel contributes to exactly one destination cell, so the result
 * does not depend on iteration order or on floating-point accumulation across
 * overlapping kernels — which a bilinear or Lanczos pass would.
 */
export function resampleRgb(source: RgbRasterV1, size: number): RgbRasterV1 {
  const out = new Uint8Array(size * size * 3);
  if (source.width === 0 || source.height === 0) return { data: out, width: size, height: size };
  for (let y = 0; y < size; y++) {
    const y0 = Math.floor((y * source.height) / size);
    const y1 = Math.max(y0 + 1, Math.floor(((y + 1) * source.height) / size));
    for (let x = 0; x < size; x++) {
      const x0 = Math.floor((x * source.width) / size);
      const x1 = Math.max(x0 + 1, Math.floor(((x + 1) * source.width) / size));
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      for (let sy = y0; sy < y1 && sy < source.height; sy++) {
        for (let sx = x0; sx < x1 && sx < source.width; sx++) {
          const i = (sy * source.width + sx) * 3;
          r += source.data[i] ?? 0;
          g += source.data[i + 1] ?? 0;
          b += source.data[i + 2] ?? 0;
          n++;
        }
      }
      const o = (y * size + x) * 3;
      out[o] = n > 0 ? Math.round(r / n) : 0;
      out[o + 1] = n > 0 ? Math.round(g / n) : 0;
      out[o + 2] = n > 0 ? Math.round(b / n) : 0;
    }
  }
  return { data: out, width: size, height: size };
}

/** Per-channel median of the one-pixel border ring. */
function borderMedian(raster: RgbRasterV1): [number, number, number] {
  const { width: w, height: h, data } = raster;
  const channels: number[][] = [[], [], []];
  const push = (x: number, y: number): void => {
    const i = (y * w + x) * 3;
    channels[0]!.push(data[i] ?? 0);
    channels[1]!.push(data[i + 1] ?? 0);
    channels[2]!.push(data[i + 2] ?? 0);
  };
  for (let x = 0; x < w; x++) {
    push(x, 0);
    if (h > 1) push(x, h - 1);
  }
  for (let y = 1; y < h - 1; y++) {
    push(0, y);
    if (w > 1) push(w - 1, y);
  }
  return channels.map((values) => {
    values.sort((a, b) => a - b);
    return values[Math.floor(values.length / 2)] ?? 0;
  }) as [number, number, number];
}

interface Segmentation {
  mask: Uint8Array;
  side: ReferenceComparisonSideV1;
}

/**
 * Split a working raster into subject and backdrop.
 *
 * Exported so the segmentation can be inspected on its own — the shadow rule is
 * the part most likely to need re-tuning against new references, and it is much
 * easier to argue about a mask than about an IoU it fed.
 */
export function segmentSubject(raster: RgbRasterV1): Segmentation {
  const backdrop = borderMedian(raster);
  const backdropLuma = luma(backdrop[0], backdrop[1], backdrop[2]);
  const shadowFloor = backdropLuma * (1 - SHADOW_DEPTH_FRACTION);
  const count = raster.width * raster.height;
  const mask = new Uint8Array(count);
  let subject = 0;
  let shadowPixels = 0;
  let sr = 0;
  let sg = 0;
  let sb = 0;

  for (let p = 0; p < count; p++) {
    const i = p * 3;
    const r = raster.data[i] ?? 0;
    const g = raster.data[i + 1] ?? 0;
    const b = raster.data[i + 2] ?? 0;
    const pixelLuma = luma(r, g, b);
    // Chroma distance = how far the pixel is from the backdrop AFTER matching
    // its brightness. A shadow is the backdrop with the light turned down, so
    // this is near zero for it and large for anything coloured.
    const scale = pixelLuma > 0 ? backdropLuma / pixelLuma : 0;
    const chroma = Math.hypot(
      r * scale - backdrop[0],
      g * scale - backdrop[1],
      b * scale - backdrop[2],
    );
    const neutral = chroma <= BACKDROP_CHROMA_TOLERANCE;
    const withinShadowBand = pixelLuma >= shadowFloor && pixelLuma <= backdropLuma;

    if (neutral && withinShadowBand) {
      // Backdrop or its shadow. Counted separately only when it is actually
      // darker, so a flat backdrop does not report phantom shadow.
      if (pixelLuma < backdropLuma - 1) shadowPixels++;
      continue;
    }
    if (neutral && pixelLuma > backdropLuma) {
      // A neutral highlight brighter than the backdrop is a specular on the
      // subject, not backdrop. Falls through to subject.
    }
    mask[p] = 1;
    subject++;
    sr += r;
    sg += g;
    sb += b;
  }

  const meanColor: [number, number, number] =
    subject > 0
      ? [Math.round(sr / subject), Math.round(sg / subject), Math.round(sb / subject)]
      : [backdrop[0], backdrop[1], backdrop[2]];

  return {
    mask,
    side: {
      coverage: round4(subject / Math.max(1, count)),
      backdrop,
      meanColor,
      shadowPixels,
    },
  };
}

/** Crop a mask to its bounding box and fit it, aspect preserved, onto a fixed
 *  square grid. See {@link SILHOUETTE_GRID} for why the aspect must survive. */
function normalizeSilhouette(mask: Uint8Array, size: number): Uint8Array {
  let minX = size;
  let minY = size;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (mask[y * size + x] !== 1) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  const out = new Uint8Array(SILHOUETTE_GRID * SILHOUETTE_GRID);
  if (maxX < 0) return out;
  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  // Fit the bounding box into a square of its own longest side, centred. The
  // padding is what carries the aspect ratio into the comparison.
  const span = Math.max(bw, bh);
  const padX = (span - bw) / 2;
  const padY = (span - bh) / 2;
  for (let y = 0; y < SILHOUETTE_GRID; y++) {
    const fy = (y * span) / SILHOUETTE_GRID - padY;
    for (let x = 0; x < SILHOUETTE_GRID; x++) {
      const fx = (x * span) / SILHOUETTE_GRID - padX;
      if (fx < 0 || fy < 0 || fx >= bw || fy >= bh) continue;
      const sx = minX + Math.floor(fx);
      const sy = minY + Math.floor(fy);
      out[y * SILHOUETTE_GRID + x] = mask[sy * size + sx] ?? 0;
    }
  }
  return out;
}

/**
 * Compare a reference photograph against one rendered view.
 *
 * Both rasters are resampled to {@link REFERENCE_COMPARISON_WORK_SIZE} first, so
 * the caller may pass whatever it has. Pass ONE view, not the whole grid — a
 * sheet of six cells has five subjects and a lattice of gutters, and its
 * silhouette means nothing.
 */
export function analyzeReferenceComparison(
  reference: RgbRasterV1,
  rendered: RgbRasterV1,
): ReferenceComparisonEvidenceV1 {
  const size = REFERENCE_COMPARISON_WORK_SIZE;
  const refSeg = segmentSubject(resampleRgb(reference, size));
  const renSeg = segmentSubject(resampleRgb(rendered, size));

  const refShape = normalizeSilhouette(refSeg.mask, size);
  const renShape = normalizeSilhouette(renSeg.mask, size);
  let intersection = 0;
  let union = 0;
  for (let i = 0; i < refShape.length; i++) {
    const a = refShape[i] === 1;
    const b = renShape[i] === 1;
    if (a && b) intersection++;
    if (a || b) union++;
  }

  const refCoverage = refSeg.side.coverage;
  const renCoverage = renSeg.side.coverage;
  const larger = Math.max(refCoverage, renCoverage);
  const distance = Math.hypot(
    refSeg.side.meanColor[0] - renSeg.side.meanColor[0],
    refSeg.side.meanColor[1] - renSeg.side.meanColor[1],
    refSeg.side.meanColor[2] - renSeg.side.meanColor[2],
  );

  return {
    schemaVersion: 1,
    workSize: size,
    reference: refSeg.side,
    rendered: renSeg.side,
    // An empty union means neither side found a subject. That is "nothing to
    // compare", not "perfect agreement", so it reports 0 and the rule below
    // treats an empty side as unmeasurable rather than as a failure.
    silhouetteIoU: union > 0 ? round4(intersection / union) : 0,
    coverageRatio: larger > 0 ? round4(Math.min(refCoverage, renCoverage) / larger) : 0,
    colorAgreement: round4(Math.max(0, 1 - distance / COLOR_DISTANCE_SCALE)),
  };
}

function isEvidence(value: unknown): value is ReferenceComparisonEvidenceV1 {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<ReferenceComparisonEvidenceV1>;
  return (
    candidate.schemaVersion === 1 &&
    typeof candidate.silhouetteIoU === 'number' &&
    typeof candidate.colorAgreement === 'number' &&
    typeof candidate.reference === 'object' &&
    typeof candidate.rendered === 'object'
  );
}

/**
 * Turn comparison evidence into findings.
 *
 * Exported separately from the rule so the post-render path — where the
 * rendered views only exist after the GLB is written — reports through exactly
 * the same code as the pre-export path, instead of growing a second opinion
 * about what disagreement means.
 */
export function referenceComparisonFindings(
  evidence: ReferenceComparisonEvidenceV1,
  profile: string,
): QaFinding[] {
  // Neither side found a subject: an all-backdrop reference or a view that came
  // back empty. Nothing was measured, and saying "0% agreement" about it would
  // be a fabricated result.
  if (evidence.reference.coverage <= 0 || evidence.rendered.coverage <= 0) return [];

  const findings: QaFinding[] = [];
  if (evidence.silhouetteIoU < SILHOUETTE_IOU_OBSERVE) {
    findings.push({
      code: 'REF_SILHOUETTE_AGREEMENT',
      disposition: 'observe',
      dimension: 'promptAlignment',
      profile,
      message:
        `The asset's outline agrees with the reference image on ${(evidence.silhouetteIoU * 100).toFixed(0)}% of ` +
        `its normalised silhouette. Shapes are compared after cropping each to its own bounding box, so this is ` +
        `about proportion and outline, not about framing or distance.`,
      measurement: {
        name: 'silhouetteIoU',
        actual: evidence.silhouetteIoU,
        threshold: SILHOUETTE_IOU_OBSERVE,
      },
      repairText:
        'Compare the reference against the rendered views and adjust the overall proportions — the outline is the part that disagrees, not the detail.',
    });
  }
  if (evidence.colorAgreement < COLOR_AGREEMENT_OBSERVE) {
    findings.push({
      code: 'REF_COLOR_AGREEMENT',
      disposition: 'observe',
      dimension: 'promptAlignment',
      profile,
      message:
        `The asset's average colour is far from the reference image's ` +
        `(agreement ${(evidence.colorAgreement * 100).toFixed(0)}%). This is a coarse whole-subject average, so it ` +
        `catches a wrong palette rather than a wrong detail.`,
      measurement: {
        name: 'colorAgreement',
        actual: evidence.colorAgreement,
        threshold: COLOR_AGREEMENT_OBSERVE,
      },
      repairText:
        'Set the base colours from the reference image rather than from the prompt wording, then re-render.',
    });
  }
  return findings;
}

/**
 * Report disagreement between a reference image and the rendered asset.
 *
 * `observe` with no promotion evidence. See the module header for why this one
 * must not be promoted at all while the `appearance`-class throw stands.
 */
export const REFERENCE_COMPARISON_QA_RULE: QaRule = Object.freeze({
  id: 'REF_COMPARISON',
  profile: 'reference.comparison',
  scope: { kind: 'universal' as const },
  ruleClass: 'heuristic',
  owner: KILN_ENGINE_QA_OWNER,
  defaultMode: 'observe',
  evaluate(context: QaContext): readonly QaFinding[] {
    const evidence = context.derivedEvidence?.['referenceComparison'];
    // Absent is the normal case: most generations have no reference image at
    // all. No evidence means no claim, never a clean result.
    if (!isEvidence(evidence)) return [];
    return referenceComparisonFindings(evidence, 'reference.comparison');
  },
});

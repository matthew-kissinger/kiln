/**
 * Reference-comparison metric — T4.3.
 *
 * The fixtures are generated rather than checked in as image files, on purpose:
 * a binary blob makes "why does this case have IoU 0.61" unanswerable, and the
 * interesting properties here are all about how the segmentation treats a
 * contact shadow, which is exactly the thing a hand-drawn raster can state
 * precisely and a photograph cannot.
 */
import { describe, expect, test } from 'bun:test';

import {
  BACKDROP_CHROMA_TOLERANCE,
  REFERENCE_COMPARISON_QA_RULE,
  REFERENCE_COMPARISON_WORK_SIZE,
  SILHOUETTE_IOU_OBSERVE,
  analyzeReferenceComparison,
  cropGridCell,
  referenceComparisonFindings,
  resampleRgb,
  segmentSubject,
  type RgbRasterV1,
} from './reference-comparison';
import type { QaContext } from './types';
import { createAssetIntentV1 } from '../contracts';

const SIZE = 128;

function blank(width: number, height: number, rgb: [number, number, number]): RgbRasterV1 {
  const data = new Uint8Array(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    data[i * 3] = rgb[0];
    data[i * 3 + 1] = rgb[1];
    data[i * 3 + 2] = rgb[2];
  }
  return { data, width, height };
}

function fillRect(
  raster: RgbRasterV1,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  rgb: [number, number, number],
): void {
  for (let y = Math.max(0, y0); y < Math.min(raster.height, y1); y++) {
    for (let x = Math.max(0, x0); x < Math.min(raster.width, x1); x++) {
      const i = (y * raster.width + x) * 3;
      raster.data[i] = rgb[0];
      raster.data[i + 1] = rgb[1];
      raster.data[i + 2] = rgb[2];
    }
  }
}

/** A studio reference: mid-grey seamless backdrop, one dark-red box, and the
 *  soft neutral contact shadow every real product shot has under the subject. */
function studioReference(withShadow = true): RgbRasterV1 {
  const raster = blank(SIZE, SIZE, [128, 128, 128]);
  if (withShadow) {
    // Two bands, 88% and 74% of backdrop luma — inside the measured range for a
    // soft shadow and, critically, neutral.
    fillRect(raster, 26, 84, 102, 96, [113, 113, 113]);
    fillRect(raster, 32, 84, 96, 92, [95, 95, 95]);
  }
  fillRect(raster, 40, 32, 88, 88, [150, 40, 40]);
  return raster;
}

/** A Kiln view: near-black background, the same box, no shadow. */
function renderedView(rgb: [number, number, number] = [150, 40, 40]): RgbRasterV1 {
  const raster = blank(SIZE, SIZE, [26, 26, 26]);
  fillRect(raster, 44, 36, 84, 84, rgb);
  return raster;
}

describe('segmentation', () => {
  test('rejects the contact shadow instead of counting it as the object', () => {
    const withShadow = segmentSubject(
      resampleRgb(studioReference(true), REFERENCE_COMPARISON_WORK_SIZE),
    );
    const without = segmentSubject(
      resampleRgb(studioReference(false), REFERENCE_COMPARISON_WORK_SIZE),
    );

    // This is the whole point of the rule. Counting the shadow inflates coverage
    // and hangs a skirt off the bottom of the silhouette on EVERY reference,
    // because correct studio lighting always produces one.
    expect(withShadow.side.coverage).toBeCloseTo(without.side.coverage, 2);
    expect(withShadow.side.shadowPixels).toBeGreaterThan(0);
    expect(without.side.shadowPixels).toBe(0);
  });

  test('keeps a genuinely dark object, which a shadow rule could easily eat', () => {
    const raster = blank(SIZE, SIZE, [128, 128, 128]);
    fillRect(raster, 40, 32, 88, 88, [18, 18, 18]);
    const seg = segmentSubject(resampleRgb(raster, REFERENCE_COMPARISON_WORK_SIZE));

    // Neutral and much darker than the backdrop: below the shadow floor, so it
    // is subject. The band has to be a band, not "anything darker".
    expect(seg.side.coverage).toBeGreaterThan(0.1);
  });

  test('keeps a coloured object at shadow brightness, because a shadow is grey', () => {
    const raster = blank(SIZE, SIZE, [128, 128, 128]);
    fillRect(raster, 40, 32, 88, 88, [40, 40, 150]);
    const seg = segmentSubject(resampleRgb(raster, REFERENCE_COMPARISON_WORK_SIZE));

    expect(seg.side.coverage).toBeGreaterThan(0.1);
    expect(seg.side.meanColor[2]).toBeGreaterThan(seg.side.meanColor[0]);
  });

  test('derives the backdrop from the border ring, not from a fixed colour', () => {
    const grey = segmentSubject(
      resampleRgb(studioReference(false), REFERENCE_COMPARISON_WORK_SIZE),
    );
    const dark = segmentSubject(resampleRgb(renderedView(), REFERENCE_COMPARISON_WORK_SIZE));

    expect(grey.side.backdrop[0]).toBe(128);
    // The same code has to work on a photographic mid-grey and on Kiln's own
    // near-black view background; a constant would only ever fit one of them.
    expect(dark.side.backdrop[0]).toBe(26);
  });

  test('reports an all-backdrop image as no subject rather than as full coverage', () => {
    const seg = segmentSubject(
      resampleRgb(blank(SIZE, SIZE, [128, 128, 128]), REFERENCE_COMPARISON_WORK_SIZE),
    );
    expect(seg.side.coverage).toBe(0);
  });
});

describe('comparison', () => {
  test('scores a matching shape and colour high on both axes', () => {
    const evidence = analyzeReferenceComparison(studioReference(), renderedView());

    expect(evidence.silhouetteIoU).toBeGreaterThan(0.9);
    expect(evidence.colorAgreement).toBeGreaterThan(0.9);
    expect(referenceComparisonFindings(evidence, 'p')).toEqual([]);
  });

  test('is unmoved by framing, because shapes are normalised to their own box', () => {
    const near = blank(SIZE, SIZE, [26, 26, 26]);
    fillRect(near, 14, 6, 114, 126, [150, 40, 40]);
    const evidence = analyzeReferenceComparison(studioReference(), near);

    // Same proportions, very different distance to camera. A metric that
    // compared raw masks would call this a shape failure on every generation
    // whose framing differs from the reference photograph — which is all of them.
    expect(evidence.silhouetteIoU).toBeGreaterThan(0.9);
    expect(evidence.coverageRatio).toBeLessThan(0.6);
  });

  test('flags a genuinely different outline', () => {
    const tall = blank(SIZE, SIZE, [26, 26, 26]);
    fillRect(tall, 58, 12, 72, 116, [150, 40, 40]);
    const evidence = analyzeReferenceComparison(studioReference(), tall);

    expect(evidence.silhouetteIoU).toBeLessThan(SILHOUETTE_IOU_OBSERVE);
    const findings = referenceComparisonFindings(evidence, 'p');
    expect(findings.map((f) => f.code)).toContain('REF_SILHOUETTE_AGREEMENT');
    expect(findings.every((f) => f.disposition === 'observe')).toBe(true);
  });

  test('flags a wrong palette while the outline still agrees', () => {
    const evidence = analyzeReferenceComparison(studioReference(), renderedView([30, 190, 60]));

    expect(evidence.silhouetteIoU).toBeGreaterThan(0.9);
    const codes = referenceComparisonFindings(evidence, 'p').map((f) => f.code);
    expect(codes).toEqual(['REF_COLOR_AGREEMENT']);
  });

  test('says nothing when one side has no subject at all', () => {
    const empty = blank(SIZE, SIZE, [26, 26, 26]);
    const evidence = analyzeReferenceComparison(studioReference(), empty);

    // A view that came back blank is a render problem, not a resemblance
    // problem. Reporting 0% agreement would be inventing a measurement from an
    // absence — the same mistake as counting an unmeasured run as degraded.
    expect(evidence.rendered.coverage).toBe(0);
    expect(referenceComparisonFindings(evidence, 'p')).toEqual([]);
  });

  test('is deterministic and independent of input resolution', () => {
    const a = analyzeReferenceComparison(studioReference(), renderedView());
    const b = analyzeReferenceComparison(studioReference(), renderedView());
    expect(a).toEqual(b);

    // Same scene drawn at half size. Fixed working size means the numbers move
    // only with the picture, not with how big the file happened to be.
    const small = blank(64, 64, [26, 26, 26]);
    fillRect(small, 22, 18, 42, 42, [150, 40, 40]);
    const scaled = analyzeReferenceComparison(studioReference(), small);
    expect(scaled.silhouetteIoU).toBeGreaterThan(0.85);
  });

  test('holds the tolerance constants it documents', () => {
    // Pinned so a future tweak is a deliberate edit with a test to update, not a
    // silent retune of every asset's reported agreement.
    expect(REFERENCE_COMPARISON_WORK_SIZE).toBe(96);
    expect(BACKDROP_CHROMA_TOLERANCE).toBe(18);
  });
});

describe('cropGridCell', () => {
  test('cuts one cell out of a sheet so the comparison sees one subject', () => {
    // A 3x2 sheet where every cell is a distinct flat colour, which makes a
    // wrong offset immediately obvious rather than subtly wrong.
    const sheet = blank(120, 80, [0, 0, 0]);
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        fillRect(sheet, c * 40, r * 40, (c + 1) * 40, (r + 1) * 40, [c * 40 + 10, r * 100 + 10, 0]);
      }
    }
    const first = cropGridCell(sheet, 3, 2, 0);
    expect([first.width, first.height]).toEqual([40, 40]);
    expect([first.data[0], first.data[1]]).toEqual([10, 10]);

    const last = cropGridCell(sheet, 3, 2, 5);
    expect([last.data[0], last.data[1]]).toEqual([90, 110]);
  });

  test('comparing against the whole sheet would be wrong, and the crop fixes it', () => {
    // Six copies of the subject plus five gutters is a different shape from one
    // subject, so the sheet scores badly against its own reference.
    const cell = renderedView();
    const sheet = blank(SIZE * 3, SIZE * 2, [26, 26, 26]);
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        for (let y = 0; y < SIZE; y++) {
          const src = y * SIZE * 3;
          const dst = ((r * SIZE + y) * sheet.width + c * SIZE) * 3;
          sheet.data.set(cell.data.subarray(src, src + SIZE * 3), dst);
        }
      }
    }
    const reference = studioReference();
    const whole = analyzeReferenceComparison(reference, sheet);
    const cropped = analyzeReferenceComparison(reference, cropGridCell(sheet, 3, 2, 0));

    expect(whole.silhouetteIoU).toBeLessThan(cropped.silhouetteIoU);
    expect(cropped.silhouetteIoU).toBeGreaterThan(0.9);
  });

  test('clamps an out-of-range index rather than reading past the sheet', () => {
    const sheet = blank(120, 80, [7, 7, 7]);
    expect(cropGridCell(sheet, 3, 2, 99).width).toBe(40);
    expect(cropGridCell(sheet, 0, 0, 0)).toBe(sheet);
  });
});

describe('the registered rule', () => {
  const intent = createAssetIntentV1({ category: 'prop', qaProfile: 'prop.default' });

  test('is heuristic and observe, and stays that way while appearance is unreconciled', () => {
    expect(REFERENCE_COMPARISON_QA_RULE.ruleClass).toBe('heuristic');
    expect(REFERENCE_COMPARISON_QA_RULE.defaultMode).toBe('observe');
    // No promotion authorization: this rule compares a photograph to a render,
    // which is an appearance claim, and the appearance-class throw is still
    // standing. Promotion needs that reconciled first.
    expect(REFERENCE_COMPARISON_QA_RULE.promotion).toBeUndefined();
  });

  test('says nothing when no reference image was involved', () => {
    const context: QaContext = { intent };
    expect(REFERENCE_COMPARISON_QA_RULE.evaluate(context)).toEqual([]);
  });

  test('ignores evidence that is not the shape it expects', () => {
    const context: QaContext = {
      intent,
      derivedEvidence: {
        source: 'engine-scene-analysis',
        referenceComparison: { silhouetteIoU: 0.1 },
      },
    };
    // A malformed or older-schema payload must not be read as a failing score.
    expect(REFERENCE_COMPARISON_QA_RULE.evaluate(context)).toEqual([]);
  });

  test('reports through the evidence seam when a comparison was made', () => {
    const tall = blank(SIZE, SIZE, [26, 26, 26]);
    fillRect(tall, 58, 12, 72, 116, [150, 40, 40]);
    const context: QaContext = {
      intent,
      derivedEvidence: {
        source: 'engine-scene-analysis',
        referenceComparison: analyzeReferenceComparison(studioReference(), tall),
      },
    };
    const findings = REFERENCE_COMPARISON_QA_RULE.evaluate(context);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.every((f) => f.dimension === 'promptAlignment')).toBe(true);
  });
});

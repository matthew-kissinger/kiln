/**
 * The backdrops every view producer paints behind an asset.
 *
 * Two producers make the same contact sheet — the CPU rasterizer here and the
 * host GPU render port — and for a while they disagreed: the render service
 * defaulted to `#202225` while the rasterizer painted `#1a1a1a`, so which
 * backdrop a run's sheet came back on depended on nothing but whether a
 * serverless worker happened to be warm. The first fix pinned both to the
 * near-black `#1a1a1a`, which kept them in agreement but read badly for dark
 * assets: a black-lacquer mech on a near-black sheet loses its silhouette, tail
 * and ground contact, which are the things the render tool asks the model to
 * review.
 *
 * The default is now the neutral studio grey. It was chosen by measurement over
 * the 86 checked-in examples plus a near-black test asset, scoring the WCAG
 * contrast ratio of every silhouette-edge pixel on the CPU rasterizer against
 * seven candidate colours. Near-black left 39.7% of edge pixels below 1.5:1 and
 * 76 of 87 assets with a tenth-percentile edge contrast under 1.5:1; `#aab1bc`
 * left 12.8% and 48. A lighter `#c8ccd2` was marginally better on average but
 * lost the near-white assets outright, and `#aab1bc` is already the value the
 * GPU studio preset was lit against, so choosing it also means a CPU fallback
 * sheet and a GPU sheet share one backdrop.
 *
 * The model may name one of three fixed backdrops per capture. Free-form colour
 * is deliberately not offered: cross-run comparability (arena, capture cache,
 * reference comparison) assumes two sheets of the same GLB differ only because
 * the asset does, and a backdrop close to the asset colour hides seams and gaps
 * from exactly the reviewer being judged on them.
 *
 * A dependency-free leaf so both the rasterizer and the port contract
 * (`composer/render-port`) can import it without either subpath pulling in the
 * other. `render-service/src/backdrops.mjs` carries the same table for the GPU
 * service; `src/views/__tests__/backdrop.test.ts` asserts the two agree.
 */

/** The bounded set of backdrops a capture may ask for. */
export type BackdropId = 'neutral' | 'dark' | 'light';

export const BACKDROP_IDS: readonly BackdropId[] = ['neutral', 'dark', 'light'] as const;

/** The backdrop every producer paints when a capture names none. */
export const DEFAULT_BACKDROP_ID: BackdropId = 'neutral';

export interface Backdrop {
  id: BackdropId;
  /** Row-major RGB the rasterizer clears each cell to. */
  rgb: readonly [number, number, number];
  /** The same colour as lowercase CSS hex, for hosts whose render request takes a string. */
  hex: string;
}

const define = (id: BackdropId, rgb: readonly [number, number, number]): Backdrop =>
  Object.freeze({
    id,
    rgb: Object.freeze([...rgb]) as readonly [number, number, number],
    hex: `#${rgb.map((c) => c.toString(16).padStart(2, '0')).join('')}`,
  });

export const BACKDROPS: Readonly<Record<BackdropId, Backdrop>> = Object.freeze({
  /** Studio grey: the measured best worst-case across dark and light assets. */
  neutral: define('neutral', [170, 177, 188]),
  /** The former default. For near-white or emissive assets that wash out on grey. */
  dark: define('dark', [26, 26, 26]),
  /** For near-black assets whose silhouette still merges with the neutral grey. */
  light: define('light', [223, 227, 232]),
});

export function isBackdropId(value: unknown): value is BackdropId {
  return typeof value === 'string' && (BACKDROP_IDS as readonly string[]).includes(value);
}

/** Resolve an optional backdrop id to its colours; omitted means the default. */
export function resolveBackdrop(id: BackdropId | undefined): Backdrop {
  if (id === undefined) return BACKDROPS[DEFAULT_BACKDROP_ID];
  if (!isBackdropId(id))
    throw new Error(
      `capture.backdrop must be one of ${BACKDROP_IDS.join(', ')} (got ${JSON.stringify(id)}).`,
    );
  return BACKDROPS[id];
}

/** The default backdrop's RGB. Kept for callers that predate the named table. */
export const GRID_BACKGROUND_RGB: readonly [number, number, number] =
  BACKDROPS[DEFAULT_BACKDROP_ID].rgb;

/** The default backdrop's hex. Kept for callers that predate the named table. */
export const GRID_BACKGROUND_HEX = BACKDROPS[DEFAULT_BACKDROP_ID].hex;

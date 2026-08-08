/**
 * The one backdrop every view producer paints behind an asset.
 *
 * Two producers make the same contact sheet — the CPU rasterizer here and the
 * host GPU render port — and for a while they disagreed: the render service
 * defaulted to `#202225` while the rasterizer painted `#1a1a1a`, so which
 * backdrop a run's sheet came back on depended on nothing but whether a
 * serverless worker happened to be warm. Studio patched it by mirroring the
 * literal in its port, with a note to fold it into a shared constant here.
 *
 * This is that constant. A dependency-free leaf so both the rasterizer and the
 * port contract (`composer/render-port`) can import it without either subpath
 * pulling in the other.
 */

/** Row-major RGB the rasterizer clears each cell to. */
export const GRID_BACKGROUND_RGB: readonly [number, number, number] = [26, 26, 26];

/** The same color as CSS hex, for hosts whose render request takes a string. */
export const GRID_BACKGROUND_HEX = '#1a1a1a';

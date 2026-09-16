/**
 * The named backdrops a render request may ask for, mirrored from the engine's
 * `src/views/background.ts`. The engine's `backdrop.test.ts` asserts the two
 * tables agree, so a change here without the matching engine change fails the
 * engine suite rather than shipping two producers that disagree.
 *
 * A request that names no backdrop gets `neutral`. The renderer clears to the
 * linear colour that its display transform turns into exactly these bytes
 * (`display-transform.mjs`), so a sheet rendered here and a CPU fallback sheet
 * share the backdrop pixel for pixel.
 */
export const BACKDROP_IDS = Object.freeze(['neutral', 'dark', 'light']);
export const DEFAULT_BACKDROP_ID = 'neutral';
export const BACKDROP_HEX = Object.freeze({
  neutral: '#aab1bc',
  dark: '#1a1a1a',
  light: '#dfe3e8',
});

export function isBackdropId(value) {
  return typeof value === 'string' && BACKDROP_IDS.includes(value);
}

export function backdropMessage(field) {
  return `${field} must be one of: ${BACKDROP_IDS.join(', ')}`;
}

/**
 * The two constants every page needs, in a module that imports nothing.
 *
 * They used to live in `App.tsx`, which was fine while only the leaves imported
 * them. Once `App` imported a page that read one of them at module scope, the
 * cycle became a `ReferenceError: Cannot access 'REPO' before initialization` at
 * first paint -- a blank screen, from an import graph rather than from any of
 * the code that looked responsible. A leaf module cannot participate in a cycle.
 */

export const REPO = 'https://github.com/matthew-kissinger/kiln';

/**
 * Relative to the document, not to the origin. The build sets a relative base so
 * one artifact serves correctly both from a custom domain at the root and from a
 * project page under a path, and the fetches have to follow the same rule or the
 * second case quietly 404s every GLB.
 */
export const asset = (path: string) => new URL(path, document.baseURI).href;

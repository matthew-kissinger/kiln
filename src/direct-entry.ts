import { realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Is this module the file the process was told to run?
 *
 * Deliberately decided here rather than delegated to `import.meta.main`. That
 * property is Bun's, and no Bun release has lowered it to something Node
 * evaluates correctly when a bundle is built with `--target=node`. Every
 * lowering seen so far emits `__require.main == __require.module`, where both
 * sides are `undefined` under Node ESM: the guard is always true, so a plain
 * `import` of the bundle starts the process's entry work. Bun 1.4 then stopped
 * emitting the `__require` helper that line still references, turning the same
 * expression into a `ReferenceError` before the server could speak a word.
 *
 * `process.argv[1]` needs no lowering and means the same thing on both runtimes.
 * Compare real paths on each side, because npm's Unix bin is a symlink and the
 * launcher is reached through it.
 */
export function isDirectEntry(moduleUrl: string): boolean {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(moduleUrl));
  } catch {
    return false;
  }
}

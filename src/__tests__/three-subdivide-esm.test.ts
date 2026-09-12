/**
 * `three-subdivide` must be imported through its ESM build, never the bare specifier.
 *
 * The package ships both an ESM build and a UMD/CommonJS one, and it has **no
 * `exports` map** -- so a bare `from 'three-subdivide'` resolves to `main`, which is
 * the UMD bundle, which does `require("three")`. three r186 deprecated that build and
 * now emits `THREE_CJS_DEPRECATED` on stderr when it loads, so the bare specifier put
 * a deprecation warning in front of every `kiln` CLI invocation. three has announced
 * the CJS build's removal, at which point the bare specifier stops working entirely.
 *
 * `three-subdivide@1.1.5` is the latest release, so there is no upstream fix to wait
 * for. The deep path is legal precisely BECAUSE the package declares no `exports`, and
 * that is also why the dependency is pinned exactly rather than by caret: a minor
 * release that added an `exports` map would make this path unresolvable, and a caret
 * range would take that release silently.
 *
 * This guards the whole tree rather than one file, because the first fix missed the
 * test that imports the same package -- which kept loading the CJS build and kept
 * firing the warning, while the production import looked corrected.
 */
import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// `fileURLToPath`, never `URL.pathname`: on Windows the latter yields
// `/D:/a/kiln/src/`, whose leading slash makes every fs call ENOENT.
const SRC = fileURLToPath(new URL('..', import.meta.url));
const ESM_BUILD = 'three-subdivide/build/index.module.js';
/** This file names the bad pattern in prose and in a regex, so it matches itself. */
const SELF = fileURLToPath(new URL(import.meta.url));

/** Every `.ts` under `src/`, so a new file cannot reintroduce the bare specifier. */
function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) sourceFiles(path, out);
    else if (path.endsWith('.ts')) out.push(path);
  }
  return out;
}

describe('three-subdivide is loaded as ESM', () => {
  test('no file imports the bare specifier, which resolves to the CommonJS build', () => {
    // Matches `from 'three-subdivide'` and `import('three-subdivide')` but not the
    // deep ESM path, and not prose mentions of the package name in comments.
    const bare = /(?:from|import\()\s*['"]three-subdivide['"]/u;
    const offenders = sourceFiles(SRC)
      .filter((file) => file !== SELF)
      .filter((file) => bare.test(readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });

  test('the files that do use it reach the ESM build', () => {
    const users = sourceFiles(SRC).filter((file) => readFileSync(file, 'utf8').includes(ESM_BUILD));
    expect(users.length).toBeGreaterThan(0);
  });

  test('the ESM build contains no require() call, which is the whole point', () => {
    const esm = readFileSync(
      fileURLToPath(
        new URL('../../node_modules/three-subdivide/build/index.module.js', import.meta.url),
      ),
      'utf8',
    );
    expect(esm).not.toMatch(/\brequire\s*\(/u);
  });

  test('the dependency is pinned exactly, so no minor can add an exports map under us', () => {
    const pkg = JSON.parse(
      readFileSync(fileURLToPath(new URL('../../package.json', import.meta.url)), 'utf8'),
    ) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    const range = { ...pkg.dependencies, ...pkg.devDependencies }['three-subdivide'];
    expect(range).toMatch(/^\d+\.\d+\.\d+$/u);
  });
});

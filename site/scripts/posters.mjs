/**
 * Where gallery poster images come from.
 *
 * They used to sit in `examples/renders/`: 108 MB of PNG that no tool in the
 * engine reads, carried in git history forever and downloaded twice by every
 * plugin install. They now live in R2 and are fetched on demand.
 *
 * What did not change is that these bytes are attested. `examples/<name>.provenance.json`
 * records the sha256 of the exact image the renderer emitted, and the gallery
 * build still checks it. So nothing here may transform an image: it fetches,
 * caches and hands back the original bytes.
 *
 * Set `KILN_POSTER_BASE` to a `file://` URL, or pre-populate `KILN_POSTER_CACHE`,
 * to build offline.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const base = process.env.KILN_POSTER_BASE ?? 'https://assets.kilnstudio.tools/renders';
const cache = process.env.KILN_POSTER_CACHE ?? join(SITE, '..', '.poster-cache');

/**
 * Absolute path to a locally cached copy of a poster, fetching it once if needed.
 * Returns a path rather than bytes because `sharp` reads files.
 */
export async function posterFile(name) {
  const file = join(cache, `${name}.png`);
  try {
    await readFile(file);
    return file;
  } catch {
    // Not cached yet; fall through to the network.
  }
  const url = `${base}/${name}.png`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Poster fetch failed (${response.status}): ${url}`);
  await mkdir(cache, { recursive: true });
  await writeFile(file, Buffer.from(await response.arrayBuffer()));
  return file;
}

/** The exact poster bytes, for hash comparison against a recorded receipt. */
export async function posterBytes(name) {
  return readFile(await posterFile(name));
}

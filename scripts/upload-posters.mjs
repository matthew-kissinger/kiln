/**
 * Publish rendered gallery images from `.posters/` to the R2 bucket that
 * `site/scripts/verify-assets.mjs` reads.
 *
 * The posters used to live in `examples/renders/`. That cost 117 MB of git
 * history for files no tool reads, and a plugin install paid for the repository
 * twice, so they moved to object storage. What did not change is that a poster's
 * bytes are attested: `examples/<name>.provenance.json` records the sha256 of the
 * exact PNG the renderer emitted. This script therefore uploads byte-for-byte,
 * never re-encoding, and refuses to publish an image whose hash disagrees with a
 * receipt that already exists for it.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(REPO, '.posters');
const BUCKET = process.env.KILN_POSTER_BUCKET ?? 'kiln-assets';
const PREFIX = process.env.KILN_POSTER_PREFIX ?? 'renders';
const TYPES = { '.png': 'image/png', '.gif': 'image/gif' };

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

const wrangler = (args) => {
  const run = spawnSync('wrangler', args, { encoding: 'utf8', windowsHide: true });
  if (run.status !== 0) throw new Error(`wrangler ${args[0]} ${args[1]} failed:\n${run.stderr || run.stdout}`);
  return run.stdout;
};

/** A receipt exists only for attested posters; GIFs and previews have none. */
async function recordedImageHash(name) {
  try {
    const side = JSON.parse(await readFile(join(REPO, 'examples', `${name}.provenance.json`), 'utf8'));
    return side.provenance?.posterReceipt?.imageHash ?? null;
  } catch {
    return null;
  }
}

let files;
try {
  files = (await readdir(SOURCE)).filter((f) => Object.keys(TYPES).some((e) => f.endsWith(e))).sort();
} catch {
  console.log(`Nothing to publish: ${SOURCE} does not exist. Render first with scripts/hero-shots.ts or scripts/anim-gifs.ts.`);
  process.exit(0);
}
if (files.length === 0) {
  console.log(`Nothing to publish: ${SOURCE} holds no PNG or GIF.`);
  process.exit(0);
}

const staging = await mkdtemp(join(tmpdir(), 'kiln-posters-'));
let published = 0;
try {
  for (const file of files) {
    const name = file.replace(/\.(png|gif)$/, '');
    const extension = file.slice(file.lastIndexOf('.'));
    const bytes = await readFile(join(SOURCE, file));
    const digest = sha(bytes);

    const recorded = extension === '.png' ? await recordedImageHash(name) : null;
    if (recorded && recorded !== digest)
      throw new Error(
        `${file} does not match its recorded poster receipt.\n  receipt: ${recorded}\n  file:    ${digest}\n` +
          'Publishing it would void the provenance claim. Re-record the receipt deliberately, or restore the attested image.',
      );

    const key = `${BUCKET}/${PREFIX}/${file}`;
    wrangler(['r2', 'object', 'put', key, '--file', join(SOURCE, file), '--content-type', TYPES[extension], '--remote']);

    // Read it back rather than trusting the upload: these bytes are the artifact.
    const roundTrip = join(staging, file);
    wrangler(['r2', 'object', 'get', key, '--remote', '--file', roundTrip]);
    const stored = sha(await readFile(roundTrip));
    if (stored !== digest) throw new Error(`${file} changed in transit.\n  local:  ${digest}\n  stored: ${stored}`);

    published += 1;
    console.log(`${file} ${digest}${recorded ? ' (matches receipt)' : ''}`);
  }
} finally {
  await rm(staging, { recursive: true, force: true });
}
console.log(`Published ${published} image${published === 1 ? '' : 's'} to ${BUCKET}/${PREFIX}, each verified byte-for-byte after upload.`);

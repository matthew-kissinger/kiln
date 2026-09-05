import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const text = (value) => typeof value === 'string' && value.trim().length > 0 && value.length <= 4000;
const digest = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);

/** Publish retained snapshots only when they agree with the displayed program. */
export async function buildExampleHistory(name, source, input, output) {
  if (!/^[a-z0-9-]+$/.test(name)) throw new Error('Invalid example history name');
  let record;
  try {
    record = JSON.parse(await readFile(join(input, 'history.json'), 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  }
  if (record.version !== 1 || !text(record.brief?.text) || !['recorded', 'summary'].includes(record.brief.kind))
    throw new Error('Invalid example history brief');
  if (record.currentSourceHash !== hash(source))
    throw new Error('Example history does not match the displayed source');
  if (!Array.isArray(record.revisions) || record.revisions.length < 1 || record.revisions.length > 16)
    throw new Error('Invalid example history revisions');

  const snapshots = [];
  const seen = new Set();
  for (const revision of record.revisions) {
    if (typeof revision.file !== 'string' || !/^[a-z0-9-]+\.kiln\.js$/.test(revision.file) || seen.has(revision.file))
      throw new Error('Invalid or repeated history snapshot filename');
    seen.add(revision.file);
    if (!text(revision.title) || !text(revision.description) || !digest(revision.sourceHash))
      throw new Error('Invalid history revision description or hash');
    const bytes = await readFile(join(input, revision.file));
    if (bytes.length > 1024 * 1024 || hash(bytes) !== revision.sourceHash)
      throw new Error('History snapshot hash does not match recorded source');
    snapshots.push({ revision, bytes });
  }
  if (snapshots.filter(({ revision }) => revision.sourceHash === record.currentSourceHash).length !== 1)
    throw new Error('History must contain exactly one displayed revision');

  // Validate every snapshot before writing any public output.
  const directory = join(output, 'history', name);
  await mkdir(directory, { recursive: true });
  for (const { revision, bytes } of snapshots)
    await writeFile(join(directory, revision.file), bytes);
  return {
    brief: { kind: record.brief.kind, text: record.brief.text },
    revisions: snapshots.map(({ revision }) => ({
      title: revision.title,
      description: revision.description,
      sourceHash: revision.sourceHash,
      source: `assets/history/${name}/${revision.file}`,
      current: revision.sourceHash === record.currentSourceHash,
    })),
  };
}

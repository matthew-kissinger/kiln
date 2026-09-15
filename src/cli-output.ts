import { randomUUID } from 'node:crypto';
import type { Stats } from 'node:fs';
import {
  chmod,
  lstat,
  mkdir,
  open,
  realpath,
  rename,
  stat,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { dirname, join } from 'node:path';

/**
 * Prepare the directories leading to a CLI destination.
 *
 * A destination the operator named is a statement of intent, not an assertion
 * that the path already exists. Refusing a missing parent is expensive out of
 * proportion to the mistake: by the time the CLI writes, the build has run and a
 * `programRef` is already on stdout, so the operator sees a successful render
 * followed by a bare ENOENT, with nothing in the message naming the parent
 * directory as the thing to fix. `recursive` also makes this a no-op for the
 * common case where the directory is already there.
 */
export async function prepareDestination(path: string): Promise<string> {
  await mkdir(dirname(path), { recursive: true });
  return path;
}

/**
 * Publish a complete replacement on the destination filesystem. Concurrent writers
 * use separate staging files; the last successful rename wins. This is per-file
 * replacement, not a multi-output transaction or a power-loss durability promise.
 */
export async function writeDestinationAtomic(
  path: string,
  data: Parameters<typeof writeFile>[1],
): Promise<void> {
  await prepareDestination(path);
  let existing: Stats | undefined;
  try {
    existing = await lstat(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  // Preserve writes through existing symlinks instead of replacing the link itself.
  // A dangling link fails safely rather than being silently replaced.
  if (existing?.isSymbolicLink()) {
    path = await realpath(path);
    existing = await stat(path);
  }
  const temporary = join(dirname(path), `.kiln-write-${randomUUID()}.tmp`);
  // Acquire ownership before entering cleanup: an exclusive-open failure must
  // never remove a file owned by another writer.
  const file = await open(temporary, 'wx', existing?.mode ?? 0o666);
  try {
    try {
      await writeFile(file, data);
    } catch (error) {
      await file.close().catch(() => {});
      throw error;
    }
    await file.close();
    if (existing?.isFile()) await chmod(temporary, existing.mode);
    await rename(temporary, path);
  } finally {
    // Preserve the original write/rename error; never unlink the destination.
    await unlink(temporary).catch(() => {});
  }
}

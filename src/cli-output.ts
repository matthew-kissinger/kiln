import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

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

import { open } from 'node:fs/promises';
import { resolve } from 'node:path';
import { assertNoLegacyRuntimePolicy, validateRequirementsBinding } from './requirements-context';
import type { RequirementsBinding } from './requirements-store';

export const CATEGORY_MIGRATION_MESSAGE =
  '--category was removed. Use descriptive labels in Discovery recipes; explicit execution requirements use --requirements <host-binding.json>. See docs/migration.md.';

/** An explicit CLI flag selects host policy. Merely importing an asset never calls this. */
export async function readHostRequirementsFile(path: string): Promise<RequirementsBinding> {
  const limit = 1024 * 1024;
  const file = await open(resolve(path), 'r');
  let input: unknown;
  try {
    const info = await file.stat();
    if (!info.isFile() || info.size > limit)
      throw new Error('--requirements requires a regular JSON file no larger than 1 MiB.');
    const buffer = Buffer.alloc(limit + 1);
    let total = 0;
    while (total < buffer.length) {
      const read = await file.read(buffer, total, buffer.length - total, null);
      if (read.bytesRead === 0) break;
      total += read.bytesRead;
    }
    if (total > limit) throw new Error('--requirements JSON exceeds 1 MiB.');
    try {
      input = JSON.parse(
        new TextDecoder('utf-8', { fatal: true }).decode(buffer.subarray(0, total)),
      );
    } catch {
      throw new Error('--requirements must contain valid UTF-8 JSON.');
    }
  } finally {
    await file.close();
  }
  if (input && typeof input === 'object') assertNoLegacyRuntimePolicy(input);
  return validateRequirementsBinding(input);
}

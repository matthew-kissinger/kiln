import { link, mkdir, readFile, readdir, stat, unlink, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join, resolve } from 'node:path';
import {
  assertProgramRef,
  MAX_PROGRAM_BYTES,
  programReference,
  type ProgramStore,
  type ProgramStoreStats,
} from './program-store';

/** Project-local, append-only snapshots. No eviction: a returned reference stays valid. */
export class FileProgramStore implements ProgramStore {
  constructor(readonly directory: string) {}

  async stats(): Promise<ProgramStoreStats> {
    let entries = 0;
    let bytes = 0;
    try {
      for (const entry of await readdir(this.directory, { withFileTypes: true })) {
        if (!entry.isFile() || !/^[a-f0-9]{64}\.js$/.test(entry.name)) continue;
        try {
          bytes += (await stat(join(this.directory, entry.name))).size;
          entries++;
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    return { entries, bytes, maxSourceBytes: MAX_PROGRAM_BYTES, eviction: 'none' };
  }

  async get(ref: string): Promise<string> {
    assertProgramRef(ref);
    const path = join(this.directory, `${ref.slice(7)}.js`);
    let code: string;
    try {
      if ((await stat(path)).size > MAX_PROGRAM_BYTES)
        throw new Error('Stored program exceeds the 1 MiB source limit.');
      code = await readFile(path, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT')
        throw new Error(
          `Program not found: ${ref}. Use the same KILN_PROGRAM_STORE or import the source again.`,
        );
      throw error;
    }
    if ((await programReference(code)) !== ref)
      throw new Error(`Program integrity check failed: ${ref}`);
    return code;
  }

  async put(code: string): Promise<string> {
    const ref = await programReference(code);
    await mkdir(this.directory, { recursive: true });
    const target = join(this.directory, `${ref.slice(7)}.js`);
    const temporary = join(this.directory, `.write-${randomUUID()}`);
    await writeFile(temporary, code, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
    try {
      // Linking publishes complete bytes atomically and cannot replace an existing revision.
      try {
        await link(temporary, target);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
        await this.get(ref);
      }
    } finally {
      await unlink(temporary);
    }
    return ref;
  }
}

export function localProgramStore(): FileProgramStore {
  return new FileProgramStore(resolve(process.env['KILN_PROGRAM_STORE'] ?? '.kiln/programs'));
}

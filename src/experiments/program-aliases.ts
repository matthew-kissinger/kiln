/** Offline prototype only: deliberately absent from the package's public exports/tools. */
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { assertProgramRef, type ProgramStore } from '../program-store';

/**
 * Whether a failed lock acquisition means "somebody else has it" rather than "broken".
 *
 * `mkdir` is the mutex, so POSIX answers this with `EEXIST` and nothing else. Windows has
 * a second way to say the same thing: directory deletion is not synchronous, and a
 * directory whose last handle has not closed sits in a pending-delete state where `mkdir`
 * on that name fails with `EPERM` or `EACCES` instead of `EEXIST`. Every release here runs
 * `rmdir(lock)` in a `finally`, so with eight processes contending, one arriving in that
 * window is ordinary contention -- and the original code rethrew it, killing the worker.
 *
 * Narrowed to Windows deliberately. On POSIX, `EPERM`/`EACCES` from `mkdir` means the
 * parent directory is not writable, and swallowing that would turn a real permission
 * problem into a misleading "busy".
 */
export function isLockContention(error: unknown, platform: string = process.platform): boolean {
  const code = (error as NodeJS.ErrnoException).code;
  if (code === 'EEXIST') return true;
  return platform === 'win32' && (code === 'EPERM' || code === 'EACCES');
}

export class ExperimentalProgramAliases {
  constructor(
    readonly directory: string,
    private readonly programs: ProgramStore,
  ) {}
  private path(name: string): string {
    if (!/^[a-z][a-z0-9-]{0,63}$/.test(name))
      throw new Error('Invalid alias: use a lowercase project-local name.');
    return join(this.directory, `${name}.json`);
  }
  async resolve(name: string): Promise<string | null> {
    const path = this.path(name);
    let text: string;
    try {
      text = await readFile(path, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
    let ref: string;
    try {
      const value = JSON.parse(text);
      if (value.version !== 1 || typeof value.ref !== 'string' || Object.keys(value).length !== 2)
        throw new Error();
      assertProgramRef(value.ref);
      ref = value.ref;
    } catch {
      throw new Error(`Alias corrupt: ${name}; original immutable sources remain separate.`);
    }
    await this.programs.get(ref);
    return ref;
  }
  async compareAndSet(name: string, expectedRef: string | null, nextRef: string): Promise<void> {
    const target = this.path(name);
    if (expectedRef !== null) assertProgramRef(expectedRef);
    assertProgramRef(nextRef);
    await this.programs.get(nextRef);
    await mkdir(this.directory, { recursive: true });
    const lock = `${target}.lock`;
    try {
      await mkdir(lock);
    } catch (error) {
      if (isLockContention(error))
        throw new Error(`Alias busy: ${name}; reread and retry explicitly.`);
      throw error;
    }
    const temporary = `${target}.${randomUUID()}.tmp`;
    try {
      const current = await this.resolve(name);
      if (current !== expectedRef)
        throw new Error(`Alias conflict: ${name}; expected ${expectedRef}, found ${current}.`);
      await writeFile(temporary, JSON.stringify({ version: 1, ref: nextRef }), {
        flag: 'wx',
        mode: 0o600,
      });
      await rename(temporary, target);
    } finally {
      // Cleanup must not decide what this call throws. `rmdir` has no `force`, and on
      // Windows it can fail with `EBUSY`/`EPERM` while a scanner or another process holds
      // the directory -- which in a `finally` would replace a precise `Alias conflict`
      // with an unrelated errno, or turn a successful write into a failure. The lock's
      // own name is what the next caller contends on, and `isLockContention` now treats a
      // lingering one as busy, so failing to remove it degrades rather than corrupts.
      await Promise.all([
        rm(temporary, { force: true }).catch(() => {}),
        rm(lock, { recursive: true, force: true }).catch(() => {}),
      ]);
    }
  }
}

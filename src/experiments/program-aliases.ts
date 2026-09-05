/** Offline prototype only: deliberately absent from the package's public exports/tools. */
import { mkdir, readFile, rename, rm, rmdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { assertProgramRef, type ProgramStore } from '../program-store';

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
      if ((error as NodeJS.ErrnoException).code === 'EEXIST')
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
      await Promise.all([rm(temporary, { force: true }), rmdir(lock)]);
    }
  }
}

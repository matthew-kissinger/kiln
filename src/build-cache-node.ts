import { createHash, randomUUID } from 'node:crypto';
import {
  mkdir,
  readFile,
  readdir,
  rename,
  stat,
  unlink,
  utimes,
  writeFile,
} from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { BuildCache } from './build-cache';
import type { RenderResult } from './render';
import { decodeEvaluatorResultV1, encodeRenderResultV1 } from './evaluator/protocol';

const keyPattern = /^sha256:[a-f0-9]{64}$/;
const filePattern = /^[a-f0-9]{64}\.json$/;
const digest = (text: string) => createHash('sha256').update(text).digest('hex');

/** Disposable local artifacts, separate from authoritative source snapshots. */
export class FileBuildCache implements BuildCache {
  readonly directory: string;
  constructor(
    directory: string,
    private readonly maxBytes = 128 * 1024 * 1024,
  ) {
    this.directory = resolve(directory);
    if (!Number.isSafeInteger(maxBytes) || maxBytes < 0 || maxBytes > 1024 * 1024 * 1024)
      throw new Error('File build cache size must be 0..1 GiB.');
  }
  private path(key: string) {
    if (!keyPattern.test(key)) throw new Error('Invalid build cache key.');
    return join(this.directory, `${key.slice(7)}.json`);
  }
  async get(key: string): Promise<RenderResult | undefined> {
    const path = this.path(key);
    try {
      const entry = await stat(path);
      if (entry.size > this.maxBytes || entry.size > 96 * 1024 * 1024) return undefined;
      const envelope = JSON.parse(await readFile(path, 'utf8')) as {
        version?: unknown;
        key?: unknown;
        payload?: unknown;
        checksum?: unknown;
      };
      if (
        envelope.version !== 1 ||
        envelope.key !== key ||
        typeof envelope.payload !== 'string' ||
        envelope.checksum !== digest(envelope.payload)
      )
        return undefined;
      const decoded = decodeEvaluatorResultV1(envelope.payload, 64 * 1024 * 1024);
      if (!decoded.ok) return undefined;
      // Host cache bookkeeping only; timestamps never enter geometry or identity.
      const now = new Date();
      await utimes(path, now, now).catch(() => {});
      return decoded.render;
    } catch {
      return undefined;
    }
  }
  async put(key: string, result: RenderResult): Promise<void> {
    const path = this.path(key);
    const payload = JSON.stringify(encodeRenderResultV1('cached-build', result));
    const bytes = JSON.stringify({ version: 1, key, payload, checksum: digest(payload) });
    if (Buffer.byteLength(bytes) > Math.min(this.maxBytes, 96 * 1024 * 1024)) return;
    await mkdir(this.directory, { recursive: true });
    const temporary = join(this.directory, `.write-${randomUUID()}`);
    await writeFile(temporary, bytes, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
    try {
      await rename(temporary, path);
    } finally {
      await unlink(temporary).catch(() => {});
    }
    await this.trim();
  }
  private async trim() {
    const entries = [];
    for (const name of await readdir(this.directory)) {
      if (!filePattern.test(name)) continue;
      const path = join(this.directory, name);
      try {
        const item = await stat(path);
        entries.push({ path, size: item.size, used: item.mtimeMs });
      } catch {
        /* another cache writer evicted it */
      }
    }
    let bytes = entries.reduce((sum, item) => sum + item.size, 0);
    entries.sort((a, b) => a.used - b.used || a.path.localeCompare(b.path));
    for (const entry of entries) {
      if (bytes <= this.maxBytes) break;
      await unlink(entry.path).catch(() => {});
      bytes -= entry.size;
    }
  }
}

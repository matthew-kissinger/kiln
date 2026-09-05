/** Immutable source snapshots. Storage is a host concern, separate from evaluation. */
export interface ProgramStore {
  put(code: string): Promise<string>;
  get(programRef: string): Promise<string>;
  stats?(): Promise<ProgramStoreStats>;
}

/** Point-in-time accounting; file counts do not imply an integrity scan. */
export interface ProgramStoreStats {
  entries: number;
  bytes: number;
  maxSourceBytes: number;
  maxBytes?: number;
  eviction: 'none';
}

export const MAX_PROGRAM_BYTES = 1024 * 1024;
export const programRefPattern = /^sha256:[a-f0-9]{64}$/;

export function assertProgramRef(ref: string): void {
  if (!programRefPattern.test(ref))
    throw new Error('Invalid program reference; use the full sha256 reference returned by Kiln.');
}

export async function programReference(code: string): Promise<string> {
  const bytes = new TextEncoder().encode(code);
  if (bytes.length > MAX_PROGRAM_BYTES) throw new Error('Program exceeds the 1 MiB source limit.');
  // Reject strings that would change when persisted as UTF-8 (unpaired surrogates).
  if (new TextDecoder('utf-8', { ignoreBOM: true }).decode(bytes) !== code)
    throw new Error('Program must be valid Unicode.');
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return `sha256:${Array.from(hash, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

export class MemoryProgramStore implements ProgramStore {
  private readonly programs = new Map<string, string>();
  constructor(private readonly maxBytes = 64 * 1024 * 1024) {}
  private bytes = 0;

  async put(code: string): Promise<string> {
    const ref = await programReference(code);
    if (!this.programs.has(ref)) {
      const size = new TextEncoder().encode(code).length;
      if (this.bytes + size > this.maxBytes)
        throw new Error('Program store is full; export your work and start a new store.');
      this.programs.set(ref, code);
      this.bytes += size;
    }
    return ref;
  }

  async stats(): Promise<ProgramStoreStats> {
    return {
      entries: this.programs.size,
      bytes: this.bytes,
      maxSourceBytes: MAX_PROGRAM_BYTES,
      maxBytes: this.maxBytes,
      eviction: 'none',
    };
  }

  async get(ref: string): Promise<string> {
    assertProgramRef(ref);
    const code = this.programs.get(ref);
    if (code === undefined)
      throw new Error(`Program not found: ${ref}. Import the source into this store again.`);
    return code;
  }
}

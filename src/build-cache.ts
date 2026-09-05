import { createHash } from 'node:crypto';
import type { EvaluatorPortV1 } from './evaluator';
import type { RenderResult } from './render';
import { EvaluatorPortError } from './evaluator/protocol';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

/** Conservative cache admission, not a sandbox or a proof for arbitrary JavaScript. */
function sourceHasAmbientInputs(code: string): boolean {
  let ambient = false;
  const property = (node: acorn.MemberExpression): string | undefined =>
    !node.computed && node.property.type === 'Identifier'
      ? node.property.name
      : node.computed && node.property.type === 'Literal' && typeof node.property.value === 'string'
        ? node.property.value
        : undefined;
  try {
    const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'script' });
    walk.ancestor(ast, {
      Identifier(node, _state, ancestors) {
        const parent = ancestors.at(-2);
        if (['Date', 'performance', 'crypto'].includes(node.name)) ambient = true;
        if (node.name === 'Math') {
          // Copying/destructuring/dynamically indexing Math can hide random().
          if (
            parent?.type !== 'MemberExpression' ||
            (parent as acorn.MemberExpression).object !== node
          )
            ambient = true;
          else {
            const name = property(parent as acorn.MemberExpression);
            if (!name || name === 'random') ambient = true;
          }
        }
      },
      MemberExpression(node, _state, ancestors) {
        if (
          node.object.type !== 'Identifier' ||
          node.object.name !== 'THREE' ||
          property(node) !== 'MathUtils'
        )
          return;
        const parent = ancestors.at(-2);
        if (
          parent?.type !== 'MemberExpression' ||
          (parent as acorn.MemberExpression).object !== node
        ) {
          ambient = true;
          return;
        }
        const name = property(parent as acorn.MemberExpression);
        if (
          !name ||
          ['randInt', 'randFloat', 'randFloatSpread', 'seededRandom', 'generateUUID'].includes(name)
        )
          ambient = true;
      },
    });
  } catch {
    return true;
  }
  return ambient;
}

export interface BuildCache {
  get(key: string): Promise<RenderResult | undefined>;
  put(key: string, result: RenderResult): Promise<void>;
}

function copy(result: RenderResult): RenderResult {
  return { ...structuredClone(result), glb: Buffer.from(result.glb) };
}

/** Host-owned LRU; source snapshots are deliberately not evicted with these disposable builds. */
export class MemoryBuildCache implements BuildCache {
  private readonly entries = new Map<string, { result: RenderResult; bytes: number }>();
  private bytes = 0;
  constructor(private readonly maxBytes = 64 * 1024 * 1024) {
    if (!Number.isSafeInteger(maxBytes) || maxBytes < 0)
      throw new Error('Build cache size must be a nonnegative integer.');
  }
  async get(key: string): Promise<RenderResult | undefined> {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    this.entries.delete(key);
    this.entries.set(key, entry);
    return copy(entry.result);
  }
  async put(key: string, result: RenderResult): Promise<void> {
    const { glb, ...metadata } = result;
    const size = glb.byteLength + Buffer.byteLength(JSON.stringify(metadata));
    if (size > this.maxBytes) return;
    const old = this.entries.get(key);
    if (old) {
      this.bytes -= old.bytes;
      this.entries.delete(key);
    }
    while (this.bytes + size > this.maxBytes) {
      const first = this.entries.keys().next().value;
      if (first === undefined) break;
      this.bytes -= this.entries.get(first)!.bytes;
      this.entries.delete(first);
    }
    this.entries.set(key, { result: copy(result), bytes: size });
    this.bytes += size;
  }
  stats() {
    return { entries: this.entries.size, bytes: this.bytes, maxBytes: this.maxBytes };
  }
}

/** Stable JSON for declared build inputs. Non-data dependencies require a separate host identity. */
function canonical(value: unknown): unknown {
  if (
    value === undefined ||
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean'
  )
    return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (Array.isArray(value)) return value.map(canonical);
  if (typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, v]) => [key, canonical(v)]),
    );
  throw new Error('Build input contains a non-data dependency.');
}

export function createCachedEvaluatorPort(
  evaluator: EvaluatorPortV1,
  options: { cache: BuildCache; identity(): string | undefined },
): EvaluatorPortV1 {
  const pending = new Map<string, Promise<{ result: RenderResult; shareable: boolean }>>();
  return {
    async render(code, renderOptions, controls) {
      const signal = controls?.signal;
      const checkCancelled = () => {
        if (signal?.aborted) throw new EvaluatorPortError('CANCELLED');
      };
      checkCancelled();
      const identity = options.identity();
      // A function-bearing resolver is not fingerprinted by JSON. The host can instead
      // inject it behind an evaluator whose identity accounts for those dependencies.
      if (!identity || renderOptions?.textureResolver || sourceHasAmbientInputs(code))
        return evaluator.render(code, renderOptions, controls);
      let serialized: string;
      try {
        // Fingerprint and evaluation must observe the same values even when the
        // caller edits its options while a disk cache lookup is in flight.
        renderOptions = structuredClone(renderOptions);
        const { signal: _signal, ...dataControls } = controls ?? {};
        const snapshotControls = structuredClone(dataControls);
        controls = { ...snapshotControls, ...(signal ? { signal } : {}) };
        serialized = JSON.stringify(
          canonical({ identity, code, options: renderOptions ?? {}, controls: snapshotControls }),
        );
      } catch {
        return evaluator.render(code, renderOptions, controls);
      }
      const key = `sha256:${createHash('sha256').update(serialized).digest('hex')}` as const;
      const cached = await options.cache.get(key).catch(() => undefined);
      checkCancelled();
      if (cached) return { ...cached, buildCache: { key, hit: true } };
      // A cancellable miss owns its worker. It may read completed artifacts, but
      // never shares an in-flight request whose owner could abort another caller.
      const existing = signal ? undefined : pending.get(key);
      if (existing) {
        const completed = await existing;
        if (!completed.shareable) return evaluator.render(code, renderOptions, controls);
        return { ...copy(completed.result), buildCache: { key, hit: true } };
      }
      const build = (async () => {
        const result = await evaluator.render(code, renderOptions, controls);
        checkCancelled();
        let snapshot: RenderResult;
        try {
          snapshot = copy(result);
        } catch {
          return { result, shareable: false };
        }
        // Failure of a disposable cache must not turn a successful build into a tool error.
        await options.cache.put(key, snapshot).catch(() => {});
        return { result: snapshot, shareable: true };
      })();
      if (!signal) pending.set(key, build);
      try {
        const completed = await build;
        checkCancelled();
        return completed.shareable
          ? { ...copy(completed.result), buildCache: { key, hit: false } }
          : completed.result;
      } finally {
        if (!signal) pending.delete(key);
      }
    },
  };
}

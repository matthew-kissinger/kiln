/**
 * Composer DSL — the clean, sugared scene-authoring surface.
 *
 * `serialize(model)` projects the structured PlacementModel to the diffable scene
 * PROGRAM (the version-controlled artifact). `scene()` / `asset()` / SceneBuilder
 * are the executable sugar that program is written in: assets are bound by
 * immutable generationId, hierarchy is visible, and a one-asset move is a one-line
 * diff. Pure — no THREE, no SDK. The agent mutates the model through tools; this
 * is the human-facing projection (and a real code-authoring API for scripts).
 */
import { flatGround, type GroundSampler } from './ground';
import { type Facing, facingToRotY, groundedPos, type Vec2 } from './layout';
import {
  type Bbox,
  type ClusterArgs,
  type LayoutArgs,
  type PlaceArgs,
  type PlaceExactArgs,
  PlacementModel,
  type RingArgs,
  type Statement,
} from './model';
import type { Vec3 } from './overlap';

// ── serialize: model → program text ──────────────────────────────────────────

const q = (s: string): string => JSON.stringify(s);
const n = (x: number): string => String(Math.round(x * 100) / 100);
const vec2 = (v: Vec2): string => `[${n(v[0])}, ${n(v[1])}]`;
const vec3 = (v: Vec3): string => `[${n(v[0])}, ${n(v[1])}, ${n(v[2])}]`;
const faceLit = (f: Facing): string =>
  typeof f === 'number' ? n(f) : Array.isArray(f) ? vec2(f) : q(f);

const opts = (parts: Array<[string, string | undefined]>): string =>
  parts
    .filter((p): p is [string, string] => p[1] !== undefined)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');

/** A valid, unique JS identifier for an asset var, derived from its name/id. */
function ident(base: string, used: Set<string>): string {
  const root =
    base
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/^[^a-z_]+/, '') || 'asset';
  let name = root;
  let i = 2;
  while (used.has(name)) name = `${root}_${i++}`;
  used.add(name);
  return name;
}

function stmtLine(st: Statement, v: string): string {
  const roleDefault: string = st.kind === 'cluster' ? 'fill' : 'support';
  const tail: Array<[string, string | undefined]> = [
    ['scale', st.scale !== 1 ? n(st.scale) : undefined],
    ['role', st.role !== roleDefault ? q(st.role) : undefined],
    ['alias', q(st.alias)],
    ['group', st.group ? q(st.group) : undefined],
  ];
  if (st.kind === 'place') {
    if (st.exact) {
      return `s.placeExact(${v}, { ${opts([['pos', vec3(st.exact.pos)], ['rotYDeg', n(st.exact.rotYDeg)], ...tail])} });`;
    }
    return `s.place(${v}, { ${opts([['at', vec2(st.at)], ['y', st.y != null ? n(st.y) : undefined], ['face', faceLit(st.face)], ...tail])} });`;
  }
  if (st.kind === 'cluster') {
    return `s.cluster(${v}, { ${opts([['around', vec2(st.around)], ['count', String(st.count)], ['spread', n(st.spread)], ['face', faceLit(st.face)], ...tail])} });`;
  }
  return `s.ring(${v}, { ${opts([['center', vec2(st.center)], ['count', String(st.count)], ['radius', n(st.radius)], ['faceOut', st.faceOut ? 'true' : undefined], ...tail])} });`;
}

/** Project a model to its scene PROGRAM — deterministic, diffable, executable. */
export function serialize(model: PlacementModel): string {
  const j = model.toJSON();
  const byGen = new Map(j.catalog.map((e) => [e.generationId, e]));
  const varOf = new Map<string, string>();
  const usedIdents = new Set<string>();
  const assetLines: string[] = [];
  for (const st of j.statements) {
    if (varOf.has(st.generationId)) continue;
    const e = byGen.get(st.generationId);
    if (!e) continue;
    const v = ident(e.name ?? st.generationId, usedIdents);
    varOf.set(st.generationId, v);
    assetLines.push(
      `const ${v} = asset(${q(v)}, ${q(st.generationId)}, { min: ${vec3(e.bbox.min)}, max: ${vec3(e.bbox.max)} });`,
    );
  }
  const stmtLines = j.statements.map((st) =>
    stmtLine(st, varOf.get(st.generationId) ?? '_unknown'),
  );
  return [
    `// === ${j.name} — composed scene program (serialized; edit via the composer) ===`,
    `const s = scene(${q(j.name)}, { ground: flat(), seed: ${j.seed} });`,
    '',
    ...assetLines,
    '',
    ...stmtLines,
    '',
    'export default s;',
  ].join('\n');
}

// ── builder: the executable sugar (scene/asset/...) ──────────────────────────

export interface AssetRef {
  alias: string;
  generationId: string;
  bbox: Bbox;
}

/** Bind a friendly local alias to an immutable generationId + its bbox (the
 *  provenance anchor every statement carries forward). */
export function asset(alias: string, generationId: string, bbox: Bbox): AssetRef {
  return { alias, generationId, bbox };
}

export interface SceneOpts {
  ground?: GroundSampler;
  seed?: number;
}

/** Fluent wrapper over a PlacementModel — the surface the serialized program is
 *  written in, and a real code-authoring API. */
export class SceneBuilder {
  readonly model: PlacementModel;

  constructor(name: string, sopts: SceneOpts = {}) {
    this.model = new PlacementModel(name, sopts);
  }

  private bind(ref: AssetRef): void {
    this.model.registerAsset({ generationId: ref.generationId, bbox: ref.bbox, name: ref.alias });
  }

  place(ref: AssetRef, p: PlaceArgs): this {
    this.bind(ref);
    this.model.addPlace(ref.generationId, { ...p, alias: p.alias ?? ref.alias });
    return this;
  }

  /** Verbatim placement (exact origin pos + Y-rotation, no grounding/recentre) — the
   *  look-preserving import surface. */
  placeExact(ref: AssetRef, p: PlaceExactArgs): this {
    this.bind(ref);
    this.model.addPlaceExact(ref.generationId, { ...p, alias: p.alias ?? ref.alias });
    return this;
  }

  cluster(ref: AssetRef, p: ClusterArgs): this {
    this.bind(ref);
    this.model.addCluster(ref.generationId, p);
    return this;
  }

  ring(ref: AssetRef, p: RingArgs): this {
    this.bind(ref);
    this.model.addRing(ref.generationId, p);
    return this;
  }

  layout(refs: AssetRef[], p?: LayoutArgs): this {
    for (const r of refs) this.bind(r);
    this.model.layout(
      refs.map((r) => r.generationId),
      p,
    );
    return this;
  }

  placements(): ReturnType<PlacementModel['placements']> {
    return this.model.placements();
  }

  serialize(): string {
    return serialize(this.model);
  }
}

export function scene(name: string, sopts: SceneOpts = {}): SceneBuilder {
  return new SceneBuilder(name, sopts);
}

// ── intent sugar (re-exported under DSL names) ───────────────────────────────

/** Flat ground at `y` (the program's `flat()`). */
export const flat = flatGround;
/** Resolve a facing intent to degrees (the program's `facing()`). */
export const facing = facingToRotY;
/** Ground an XZ point for an asset (no rotation) — the program's `grounded()`.
 *  `heightmap()` itself comes from the same barrel (re-exported by ground). */
export function grounded(xz: Vec2, bbox: Bbox, ground: GroundSampler, scale = 1): Vec3 {
  return groundedPos(bbox.min, bbox.max, scale, xz, 0, ground);
}

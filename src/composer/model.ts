/**
 * PlacementModel — the composer's structured source of truth.
 *
 * An ordered list of typed placement statements (place / cluster / ring) over a
 * catalog of selected assets. The agent's tools and a future in-viewport drag
 * mutate this ONE model through typed ops; `placements()` evaluates it to the
 * `Placement[]` the renderer/runtime consume, gated by `findPlacementOverlaps`;
 * `serialize()` (in dsl.ts) projects it to the clean, diffable scene program.
 *
 * Statements are addressable by a stable `alias` (or `stmtId`). `place` is one
 * asset; `cluster`/`ring` are atomic sugar that expand to N overlap-free
 * placements and serialize as a single line; `layout` is a baseline op that
 * EXPLODES into individual `place` statements so each is independently editable.
 *
 * Pure — no THREE, no @strands-agents/sdk. Wraps the engine layout primitives
 * (layoutScene / groundedPos / facingToRotY / findPlacementOverlaps). Terrain is
 * a GroundSampler, so a heightmap drops in with no model change.
 */
import { flatGround, type GroundSampler } from './ground';
import {
  type Facing,
  facingToRotY,
  type FacingPolicy,
  groundedPos,
  type LayoutItem,
  layoutScene,
  type Vec2,
  zonedCenters,
} from './layout';
import { findPlacementOverlaps, type OverlapViolation, type Vec3 } from './overlap';

export interface Bbox {
  min: Vec3;
  max: Vec3;
}

export interface CatalogEntry {
  generationId: string;
  bbox: Bbox;
  name?: string;
  tags?: string[];
}

export type Role = 'hero' | 'support' | 'fill';

/** One evaluated instance: a generation placed in the world, linked to its statement. */
export interface Placement {
  instanceId: string;
  generationId: string;
  pos: Vec3;
  rotYDeg: number;
  scale: number;
  stmtId: string;
}

export interface PlacementProvenance {
  generationId: string;
  stmtId: string;
  sourcePrompt?: string;
  parentGenerationId?: string;
}

export interface EvalResult {
  placements: Placement[];
  /** instanceId -> provenance (generationId + statement + optional source prompt). */
  provenance: Record<string, PlacementProvenance>;
  /** Empty when the scene is clean; non-empty pairs are surfaced, never dropped. */
  overlaps: OverlapViolation[];
}

interface Prov {
  sourcePrompt?: string;
  parentGenerationId?: string;
}

interface CommonStmt {
  stmtId: string;
  alias: string;
  generationId: string;
  role: Role;
  scale: number;
  group?: string;
  provenance?: Prov;
}
interface PlaceStmt extends CommonStmt {
  kind: 'place';
  at: Vec2;
  y?: number;
  face: Facing;
  /** Verbatim / origin-anchored override. When set, evaluation places the asset
   *  ORIGIN at exactly `pos` with exactly `rotYDeg` — it SKIPS grounding, facing,
   *  and the bbox-centre recentre that a normal `place` applies. This is what a
   *  look-preserving import (a legacy `Placement[]` → model) uses so a hand- or
   *  city-authored scene round-trips pixel-identically. `at`/`face` mirror it (the
   *  XZ + angle) so a normal reader still sees a sensible position. */
  exact?: { pos: Vec3; rotYDeg: number };
}
interface ClusterStmt extends CommonStmt {
  kind: 'cluster';
  around: Vec2;
  count: number;
  spread: number;
  face: Facing;
}
interface RingStmt extends CommonStmt {
  kind: 'ring';
  center: Vec2;
  count: number;
  radius: number;
  faceOut: boolean;
}
export type Statement = PlaceStmt | ClusterStmt | RingStmt;

export type OpResult = { ok: true; alias: string } | { ok: false; error: string; hint?: string };

export interface SceneModelJSON {
  name: string;
  seed: number;
  catalog: CatalogEntry[];
  statements: Statement[];
}

export interface PlaceArgs {
  at: Vec2;
  y?: number;
  face?: Facing;
  scale?: number;
  role?: Role;
  group?: string;
  alias?: string;
  provenance?: Prov;
}
export interface PlaceExactArgs {
  /** Exact asset-ORIGIN world position (no grounding / recentre applied). */
  pos: Vec3;
  /** Exact Y rotation in degrees (no facing resolution applied). */
  rotYDeg: number;
  scale?: number;
  role?: Role;
  group?: string;
  alias?: string;
  provenance?: Prov;
}
export interface ClusterArgs {
  around: Vec2;
  count: number;
  spread: number;
  face?: Facing;
  scale?: number;
  role?: Role;
  group?: string;
  alias?: string;
}
export interface RingArgs {
  center: Vec2;
  count: number;
  radius: number;
  faceOut?: boolean;
  scale?: number;
  role?: Role;
  group?: string;
  alias?: string;
}
export interface LayoutArgs {
  anchor?: 'single' | 'zonedCenters';
  spacing?: number;
  facing?: FacingPolicy;
  seed?: number;
  scale?: number;
  role?: Role;
}

const SCENE_CENTER: Vec2 = [0, 0];
const r1 = (n: number): number => Math.round(n * 10) / 10;
const round3 = (v: Vec3): Vec3 => [r1(v[0]), r1(v[1]), r1(v[2])];

/** Deterministic FNV-1a hash → per-statement seed (so two clusters scatter differently). */
function stableHash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const notFound = (t: string): OpResult => ({
  ok: false,
  error: `no placement "${t}"`,
  hint: 'list the current placements to see their aliases',
});

export class PlacementModel {
  readonly name: string;
  readonly seed: number;
  private readonly ground: GroundSampler;
  private readonly catalog = new Map<string, CatalogEntry>();
  private readonly stmts: Statement[] = [];
  private readonly byAlias = new Map<string, Statement>();
  private seq = 0;
  private groupSeq = 0;

  constructor(
    name: string,
    opts: { ground?: GroundSampler; seed?: number; catalog?: CatalogEntry[] } = {},
  ) {
    this.name = name;
    this.seed = opts.seed ?? 1;
    this.ground = opts.ground ?? flatGround(0);
    for (const e of opts.catalog ?? []) this.registerAsset(e);
  }

  /** Bind an asset (generationId + its asset-local bbox) into the catalog. */
  registerAsset(entry: CatalogEntry): void {
    this.catalog.set(entry.generationId, entry);
  }

  /** The selectable catalog (id, name, footprint, tags). */
  catalogList(): Array<{ generationId: string; name?: string; size: Vec3; tags?: string[] }> {
    return [...this.catalog.values()].map((e) => ({
      generationId: e.generationId,
      ...(e.name ? { name: e.name } : {}),
      size: [
        r1(e.bbox.max[0] - e.bbox.min[0]),
        r1(e.bbox.max[1] - e.bbox.min[1]),
        r1(e.bbox.max[2] - e.bbox.min[2]),
      ],
      ...(e.tags ? { tags: e.tags } : {}),
    }));
  }

  private requireAsset(generationId: string): CatalogEntry {
    const e = this.catalog.get(generationId);
    if (!e) throw new Error(`unknown asset "${generationId}" — register it in the catalog first`);
    return e;
  }

  private nextStmtId(): string {
    return `s${++this.seq}`;
  }

  private baseAlias(generationId: string): string {
    return this.catalog.get(generationId)?.name ?? generationId;
  }

  private makeAlias(base: string): string {
    const slug =
      base
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'asset';
    if (!this.byAlias.has(slug)) return slug;
    let n = 2;
    while (this.byAlias.has(`${slug}_${n}`)) n++;
    return `${slug}_${n}`;
  }

  private push(st: Statement): void {
    this.stmts.push(st);
    this.byAlias.set(st.alias, st);
  }

  private resolve(target: string): Statement | undefined {
    return this.byAlias.get(target) ?? this.stmts.find((s) => s.stmtId === target);
  }

  // ── add ops (return the new alias; throw on unknown asset) ──────────────────

  addPlace(generationId: string, a: PlaceArgs): string {
    this.requireAsset(generationId);
    const alias = this.makeAlias(a.alias ?? this.baseAlias(generationId));
    this.push({
      kind: 'place',
      stmtId: this.nextStmtId(),
      alias,
      generationId,
      role: a.role ?? 'support',
      scale: a.scale ?? 1,
      at: [a.at[0], a.at[1]],
      face: a.face ?? 'center',
      ...(a.y != null ? { y: a.y } : {}),
      ...(a.group ? { group: a.group } : {}),
      ...(a.provenance ? { provenance: a.provenance } : {}),
    });
    return alias;
  }

  /** Place an asset VERBATIM at an exact origin pos + Y-rotation (no grounding,
   *  facing, or bbox-centre recentre). The look-preserving import path. */
  addPlaceExact(generationId: string, a: PlaceExactArgs): string {
    this.requireAsset(generationId);
    const alias = this.makeAlias(a.alias ?? this.baseAlias(generationId));
    this.push({
      kind: 'place',
      stmtId: this.nextStmtId(),
      alias,
      generationId,
      role: a.role ?? 'support',
      scale: a.scale ?? 1,
      at: [a.pos[0], a.pos[2]],
      face: a.rotYDeg,
      exact: { pos: [a.pos[0], a.pos[1], a.pos[2]], rotYDeg: a.rotYDeg },
      ...(a.group ? { group: a.group } : {}),
      ...(a.provenance ? { provenance: a.provenance } : {}),
    });
    return alias;
  }

  addCluster(generationId: string, a: ClusterArgs): string {
    this.requireAsset(generationId);
    const alias = this.makeAlias(a.alias ?? `${this.baseAlias(generationId)}_cluster`);
    this.push({
      kind: 'cluster',
      stmtId: this.nextStmtId(),
      alias,
      generationId,
      role: a.role ?? 'fill',
      scale: a.scale ?? 1,
      around: [a.around[0], a.around[1]],
      count: Math.max(1, Math.floor(a.count)),
      spread: a.spread,
      face: a.face ?? 'center',
      ...(a.group ? { group: a.group } : {}),
    });
    return alias;
  }

  addRing(generationId: string, a: RingArgs): string {
    this.requireAsset(generationId);
    const alias = this.makeAlias(a.alias ?? `${this.baseAlias(generationId)}_ring`);
    this.push({
      kind: 'ring',
      stmtId: this.nextStmtId(),
      alias,
      generationId,
      role: a.role ?? 'support',
      scale: a.scale ?? 1,
      center: [a.center[0], a.center[1]],
      count: Math.max(1, Math.floor(a.count)),
      radius: a.radius,
      faceOut: a.faceOut ?? false,
      ...(a.group ? { group: a.group } : {}),
    });
    return alias;
  }

  /** Lay the given assets out into an overlap-free baseline, EXPLODED into one
   *  editable `place` statement each (at its centre, with its resolved facing). */
  layout(generationIds: string[], a: LayoutArgs = {}): string[] {
    const zones = zonedCenters(a.spacing ?? 95);
    const items: LayoutItem[] = generationIds.map((g, i) => {
      const e = this.requireAsset(g);
      return {
        id: `${g}::${i}`,
        localMin: e.bbox.min,
        localMax: e.bbox.max,
        scale: a.scale ?? 1,
        role: a.role ?? 'support',
        ...(a.anchor === 'zonedCenters' ? { zone: zones[i % zones.length]!.id } : {}),
      };
    });
    const res = layoutScene(items, {
      ...(a.anchor === 'zonedCenters' ? { anchors: zones } : {}),
      ground: this.ground,
      facing: a.facing ?? 'scene-in',
      seed: a.seed ?? this.seed,
    });
    return res.placements.map((p) => {
      const gen = p.id.slice(0, p.id.lastIndexOf('::'));
      return this.addPlace(gen, {
        at: p.centerXZ,
        face: p.rotYDeg,
        scale: p.scale,
        role: a.role ?? 'support',
      });
    });
  }

  // ── edit ops (return ok/error; target by alias or stmtId) ───────────────────

  move(target: string, m: { to?: Vec2; delta?: Vec2; scale?: number }): OpResult {
    const st = this.resolve(target);
    if (!st) return notFound(target);
    if (m.scale != null) st.scale = m.scale;
    const apply = (cur: Vec2): Vec2 =>
      m.to ? [m.to[0], m.to[1]] : m.delta ? [cur[0] + m.delta[0], cur[1] + m.delta[1]] : cur;
    if (st.kind === 'place') st.at = apply(st.at);
    else if (st.kind === 'cluster') st.around = apply(st.around);
    else st.center = apply(st.center);
    return { ok: true, alias: st.alias };
  }

  face(target: string, intent: Facing): OpResult {
    const st = this.resolve(target);
    if (!st) return notFound(target);
    if (st.kind === 'ring') st.faceOut = intent === 'out';
    else if (st.kind === 'cluster') st.face = intent === 'out' ? 'out' : 'center';
    else st.face = intent;
    return { ok: true, alias: st.alias };
  }

  /** Bind statements into a movable group, optionally nudging them together. */
  group(
    targets: string[],
    opts: { name?: string; delta?: Vec2; to?: Vec2 } = {},
  ): { ok: true; group: string; members: string[] } | { ok: false; error: string } {
    const sts = targets.map((t) => this.resolve(t)).filter((s): s is Statement => !!s);
    if (!sts.length) return { ok: false, error: 'no targets resolved' };
    const name = opts.name ?? `group_${++this.groupSeq}`;
    for (const st of sts) st.group = name;
    if (opts.delta || opts.to) {
      for (const st of sts)
        this.move(st.alias, {
          ...(opts.to ? { to: opts.to } : {}),
          ...(opts.delta ? { delta: opts.delta } : {}),
        });
    }
    return { ok: true, group: name, members: sts.map((s) => s.alias) };
  }

  remove(
    target: string,
  ): { ok: true; removed: string; remaining: number } | { ok: false; error: string } {
    const st = this.resolve(target);
    if (!st) return { ok: false, error: `no placement "${target}"` };
    this.stmts.splice(this.stmts.indexOf(st), 1);
    this.byAlias.delete(st.alias);
    return { ok: true, removed: st.alias, remaining: this.stmts.length };
  }

  statements(): readonly Statement[] {
    return this.stmts;
  }

  // ── evaluate ────────────────────────────────────────────────────────────────

  /** Expand every statement to world placements, then gate on footprint overlap. */
  placements(): EvalResult {
    const placements: Placement[] = [];
    const provenance: Record<string, PlacementProvenance> = {};
    const add = (st: Statement, instanceId: string, pos: Vec3, rotYDeg: number): void => {
      placements.push({
        instanceId,
        generationId: st.generationId,
        pos,
        rotYDeg,
        scale: st.scale,
        stmtId: st.stmtId,
      });
      provenance[instanceId] = {
        generationId: st.generationId,
        stmtId: st.stmtId,
        ...(st.provenance ?? {}),
      };
    };

    for (const st of this.stmts) {
      const e = this.catalog.get(st.generationId);
      if (!e) continue;
      const { min, max } = e.bbox;

      if (st.kind === 'place') {
        if (st.exact) {
          // Verbatim: origin + rotation exactly as imported (no grounding / recentre /
          // rounding — preserve the source look bit-for-bit).
          add(st, st.alias, [st.exact.pos[0], st.exact.pos[1], st.exact.pos[2]], st.exact.rotYDeg);
        } else {
          const rotY = Math.round(facingToRotY(st.face, st.at, SCENE_CENTER));
          const pos = round3(groundedPos(min, max, st.scale, st.at, rotY, this.ground));
          if (st.y != null) pos[1] = r1(st.y);
          add(st, st.alias, pos, rotY);
        }
      } else if (st.kind === 'ring') {
        for (let i = 0; i < st.count; i++) {
          const ang = (i / st.count) * Math.PI * 2;
          const cx = st.center[0] + st.radius * Math.cos(ang);
          const cz = st.center[1] + st.radius * Math.sin(ang);
          const target: Vec2 = st.faceOut
            ? [2 * cx - st.center[0], 2 * cz - st.center[1]]
            : st.center;
          const rotY = Math.round(facingToRotY(target, [cx, cz], SCENE_CENTER));
          add(
            st,
            `${st.alias}#${i}`,
            round3(groundedPos(min, max, st.scale, [cx, cz], rotY, this.ground)),
            rotY,
          );
        }
      } else {
        const items: LayoutItem[] = Array.from({ length: st.count }, (_, i) => ({
          id: `${st.alias}#${i}`,
          localMin: min,
          localMax: max,
          scale: st.scale,
          role: st.role,
        }));
        const res = layoutScene(items, {
          anchors: [{ id: st.alias, center: st.around }],
          ground: this.ground,
          facing: st.face === 'out' ? 'scene-out' : 'scene-in',
          gap: Math.max(1, st.spread / Math.max(2, st.count)),
          seed: this.seed + stableHash(st.stmtId),
        });
        for (const p of res.placements) add(st, p.id, p.pos, p.rotYDeg);
      }
    }

    const overlaps = findPlacementOverlaps(
      placements.map((p) => {
        const b = this.catalog.get(p.generationId)!.bbox;
        return {
          id: p.instanceId,
          localMin: b.min,
          localMax: b.max,
          pos: p.pos,
          rotYDeg: p.rotYDeg,
          scale: p.scale,
        };
      }),
    );
    return { placements, provenance, overlaps };
  }

  // ── persistence (structured machine round-trip; serialize() is the human view) ─

  toJSON(): SceneModelJSON {
    return JSON.parse(
      JSON.stringify({
        name: this.name,
        seed: this.seed,
        catalog: [...this.catalog.values()],
        statements: this.stmts,
      }),
    );
  }

  static fromJSON(j: SceneModelJSON, ground?: GroundSampler): PlacementModel {
    const m = new PlacementModel(j.name, {
      seed: j.seed,
      catalog: j.catalog,
      ...(ground ? { ground } : {}),
    });
    let maxSeq = 0;
    for (const st of j.statements) {
      m.push(st);
      const n = Number(st.stmtId.replace(/^s/, ''));
      if (Number.isFinite(n)) maxSeq = Math.max(maxSeq, n);
    }
    m.seq = maxSeq;
    return m;
  }
}

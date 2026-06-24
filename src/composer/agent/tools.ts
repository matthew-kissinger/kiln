/**
 * Scene-composer tool skin for the Strands agent loop — the `scene_*` surface.
 *
 * Sibling to the asset-gen `kiln_*` tools (../../agent/tools), but the unit of
 * work is a SCENE, not a single asset. Every tool mutates ONE structured
 * `PlacementModel` (the source of truth); after each successful mutation the
 * model is re-evaluated + re-serialized into a `ComposerSink` (continuous
 * autosave — a step-capped run still captures its work). The two image tools
 * (`scene_render` / `scene_screenshot_camera`) call the host `SceneRenderPort`
 * and return `[ImageBlock…, JsonBlock]` so the model literally SEES the scene.
 *
 * Pure orchestration over the composer core (model / dsl / overlap) + the SDK's
 * `tool()`. No THREE — rendering is the injected host port. Errors are in-band
 * `{ ok:false, error, hint }` (tools never throw at the model).
 *
 * Surface (14): read — scene_list_assets, scene_view, scene_validate,
 * scene_render, scene_screenshot_camera · mutate — scene_layout, scene_place,
 * scene_cluster, scene_ring, scene_move, scene_face, scene_group, scene_remove ·
 * commit — scene_finalize. (Extends the design doc's 12 with scene_cluster /
 * scene_ring so the agent can author the grouping primitives the program already
 * serializes.)
 */
import { ImageBlock, JsonBlock, type JSONValue, type Tool, tool } from '@strands-agents/sdk';
import { z } from 'zod';

import { serialize } from '../dsl';
import type { EvalResult, Placement, PlacementModel, PlacementProvenance } from '../model';
import type { OverlapViolation } from '../overlap';
import type { SceneRenderPort, SceneRenderResult } from '../render-port';

/**
 * A mutable sink the composer tools write into. Create one per run; after every
 * successful mutation it holds the latest serialized program + evaluated scene
 * (so an un-finalized / step-capped run still captures the work). `.finalized`
 * flips when `scene_finalize` fires.
 */
export interface ComposerSink {
  program?: string;
  placements?: Placement[];
  provenance?: Record<string, PlacementProvenance>;
  overlaps?: OverlapViolation[];
  finalized?: boolean;
}

/**
 * A live render candidate surfaced out-of-band from `scene_render`: the
 * serialized program at this render plus the grid PNG (base64) the agent saw.
 * Lets the host stream a filmstrip of intermediate scenes + "pick a version".
 * Emitted in addition to — never instead of — what the agent sees.
 */
export interface SceneRenderCandidate {
  program: string;
  pngBase64: string;
  tris?: number;
}

// ── shared zod fragments ──────────────────────────────────────────────────────

const vec2 = z.tuple([z.number(), z.number()]);
const vec3 = z.tuple([z.number(), z.number(), z.number()]);
const roleEnum = z.enum(['hero', 'support', 'fill']);
/** center (face the scene origin) · out (face away) · [x,z] (face a point) · degrees. */
const facing = z.union([z.literal('center'), z.literal('out'), vec2, z.number()]);
const empty = z.object({});

// ── render-result → content blocks ────────────────────────────────────────────

/** base64 PNG → the raw bytes an ImageBlock wants. */
const png = (b64: string): Uint8Array => new Uint8Array(Buffer.from(b64, 'base64'));

/** Turn a host render result into the tool-callback value: one ImageBlock per
 *  returned view (perCamera grid or single frame) + a JsonBlock of metadata, or a
 *  plain `{ok:false}` when the render failed. Block arrays are a valid (untyped)
 *  Strands callback return — cast past JSONValue, same as the kiln_* tools. */
function renderToCallback(res: SceneRenderResult): JSONValue {
  if (!res.ok) {
    return { ok: false, error: res.error ?? 'render failed' } as JSONValue;
  }
  const frames = res.perCameraBase64?.length
    ? res.perCameraBase64
    : res.pngBase64
      ? [res.pngBase64]
      : [];
  const json = {
    ok: true,
    views: frames.length,
    ...(res.tris != null ? { tris: res.tris } : {}),
  };
  return [
    ...frames.map((b64) => new ImageBlock({ format: 'png', source: { bytes: png(b64) } })),
    new JsonBlock({ json: json as JSONValue }),
  ] as unknown as JSONValue;
}

// ── shared mutation plumbing ──────────────────────────────────────────────────

/** A compact mutation receipt the model reads after every edit. */
interface MutationEcho {
  ok: true;
  alias?: string | string[];
  placements: number;
  overlaps: number;
  hint?: string;
}

export interface MakeComposerToolsOptions {
  /** The scene model the tools mutate (seeded with the selected catalog). */
  model: PlacementModel;
  /** Host renderer: placements (+ optional cameras) → PNG(s). */
  render: SceneRenderPort;
  /** Receives the serialized program + evaluated scene after each mutation. */
  sink: ComposerSink;
  /** Best-effort live render candidates (one per successful scene_render). */
  onCandidate?: (c: SceneRenderCandidate) => void;
}

/**
 * Build the in-process `scene_*` tool list for a composer run. Every mutator
 * shares one `capture()` that re-serializes + re-evaluates the model into the
 * sink and returns a `{ placements, overlaps }` receipt; a non-zero overlap count
 * carries a hint pointing at scene_validate → scene_move.
 */
export function makeSceneComposerTools(opts: MakeComposerToolsOptions): Tool[] {
  const { model, render, sink } = opts;

  /** Re-serialize + re-evaluate into the sink; the single autosave point. */
  const capture = (): EvalResult => {
    const ev = model.placements();
    sink.program = serialize(model);
    sink.placements = ev.placements;
    sink.provenance = ev.provenance;
    sink.overlaps = ev.overlaps;
    return ev;
  };

  /** Standard mutation receipt: capture, then echo counts (+ overlap nudge). */
  const echo = (alias?: string | string[]): MutationEcho => {
    const ev = capture();
    const overlaps = ev.overlaps.length;
    return {
      ok: true,
      ...(alias !== undefined ? { alias } : {}),
      placements: ev.placements.length,
      overlaps,
      ...(overlaps
        ? {
            hint: `${overlaps} footprint overlap(s) — call scene_validate for separation vectors, then scene_move to resolve.`,
          }
        : {}),
    };
  };

  /** Wrap an add op (which throws on an unknown asset) into an in-band result. */
  const guarded = (fn: () => string | string[]): JSONValue => {
    try {
      return echo(fn()) as unknown as JSONValue;
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        hint: 'Call scene_list_assets to see the generationIds available in this scene.',
      } as JSONValue;
    }
  };

  // ── read tools ──────────────────────────────────────────────────────────────

  const listAssetsTool: Tool = tool({
    name: 'scene_list_assets',
    description:
      'List the assets you can place in this scene — each generationId with its name, footprint ' +
      'size [w,h,d], and tags. These are the ONLY assets available; place them by generationId. ' +
      'Call this first to plan your composition.',
    inputSchema: empty,
    callback: () => ({ assets: model.catalogList() }) as JSONValue,
  });

  const viewTool: Tool = tool({
    name: 'scene_view',
    description:
      'Read the current scene: the serialized scene program (the diffable source of truth), the ' +
      'placement aliases, and the live placement / overlap counts. Use it to see what you have ' +
      'built before deciding the next move.',
    inputSchema: empty,
    callback: () => {
      const ev = model.placements();
      return {
        program: serialize(model),
        placementCount: ev.placements.length,
        overlapCount: ev.overlaps.length,
        aliases: model.statements().map((s) => s.alias),
      } as JSONValue;
    },
  });

  const validateTool: Tool = tool({
    name: 'scene_validate',
    description:
      'Check the scene for footprint overlaps. Returns each colliding pair (a, b) with a penetration ' +
      'depth and a `separation` vector [x,y,z] — pass its x and z to scene_move as a delta on one of ' +
      'the pair to push them apart. An empty list means the scene is clean.',
    inputSchema: empty,
    callback: () => {
      const { overlaps } = model.placements();
      return {
        ok: overlaps.length === 0,
        count: overlaps.length,
        overlaps,
      } as unknown as JSONValue;
    },
  });

  const renderTool: Tool = tool({
    name: 'scene_render',
    description:
      'Render the WHOLE scene from three canonical angles (a labelled grid) so you can SEE the ' +
      'composition: spacing, facing, groupings, silhouette, and any overlaps the numbers miss. ' +
      'Call it after a batch of placements/edits, judge it, then refine. No argument.',
    inputSchema: empty,
    callback: async () => {
      const res = await render({ placements: model.placements().placements });
      if (res.ok && opts.onCandidate) {
        const b64 = res.pngBase64 ?? res.perCameraBase64?.[0];
        if (b64) {
          try {
            opts.onCandidate({
              program: serialize(model),
              pngBase64: b64,
              ...(res.tris != null ? { tris: res.tris } : {}),
            });
          } catch {
            // candidate sink is best-effort
          }
        }
      }
      return renderToCallback(res);
    },
  });

  const screenshotTool: Tool = tool({
    name: 'scene_screenshot_camera',
    description:
      'Render the scene from ONE camera you specify — position [x,y,z] and the target [x,y,z] it ' +
      'looks at (optional fovDeg). Use it to inspect a specific vantage: a player entry view, a ' +
      'sightline down a row, or a close read of one cluster. Returns a single image.',
    inputSchema: z.object({
      position: vec3.describe('Camera position [x,y,z] in world units (+Y up).'),
      target: vec3.describe(
        'The point [x,y,z] the camera looks at (e.g. the scene centre [0,0,0]).',
      ),
      fovDeg: z.number().optional().describe('Vertical field of view in degrees (default ~50).'),
    }),
    callback: async (input) => {
      const i = input as {
        position: [number, number, number];
        target: [number, number, number];
        fovDeg?: number;
      };
      const res = await render({
        placements: model.placements().placements,
        cameras: [
          {
            position: i.position,
            target: i.target,
            ...(i.fovDeg != null ? { fovDeg: i.fovDeg } : {}),
          },
        ],
      });
      return renderToCallback(res);
    },
  });

  // ── mutate tools ──────────────────────────────────────────────────────────────

  const layoutTool: Tool = tool({
    name: 'scene_layout',
    description:
      'Lay out a set of assets into an overlap-free BASELINE, then refine by hand. Explodes into one ' +
      'editable placement per asset (each independently movable). Good as a first pass; omit `assets` ' +
      'to lay out the whole catalog. anchor "zonedCenters" spreads them across four districts + a ' +
      'centre; "single" packs them around the origin.',
    inputSchema: z.object({
      assets: z
        .array(z.string())
        .optional()
        .describe('generationIds to lay out (default: all in the catalog).'),
      anchor: z
        .enum(['single', 'zonedCenters'])
        .optional()
        .describe('Layout anchoring (default single).'),
      spacing: z.number().optional().describe('District spacing for zonedCenters (default 95).'),
      facing: z
        .enum(['scene-in', 'scene-out', 'zone-in', 'random', 'none'])
        .optional()
        .describe(
          'How laid-out assets face (default scene-in: toward the centre; zone-in: toward their ' +
            'district; scene-out: away; random / none).',
        ),
      seed: z.number().optional().describe('Layout seed (deterministic; default the scene seed).'),
      scale: z
        .number()
        .optional()
        .describe('Uniform scale applied to every laid-out asset (default 1).'),
      role: roleEnum.optional().describe('Role for the laid-out assets (default support).'),
    }),
    callback: (input) => {
      const i = input as {
        assets?: string[];
        anchor?: 'single' | 'zonedCenters';
        spacing?: number;
        facing?: 'scene-in' | 'scene-out' | 'zone-in' | 'random' | 'none';
        seed?: number;
        scale?: number;
        role?: 'hero' | 'support' | 'fill';
      };
      const ids = i.assets ?? model.catalogList().map((e) => e.generationId);
      return guarded(() =>
        model.layout(ids, {
          ...(i.anchor ? { anchor: i.anchor } : {}),
          ...(i.spacing != null ? { spacing: i.spacing } : {}),
          ...(i.facing ? { facing: i.facing } : {}),
          ...(i.seed != null ? { seed: i.seed } : {}),
          ...(i.scale != null ? { scale: i.scale } : {}),
          ...(i.role ? { role: i.role } : {}),
        }),
      );
    },
  });

  const placeTool: Tool = tool({
    name: 'scene_place',
    description:
      'Place ONE asset at a ground point [x,z] (the scene centre is [0,0]; assets are authored facing ' +
      '+X). Pick `face` deliberately: "center" to face the origin, "out" away from it, [x,z] to face a ' +
      'point, or degrees. `role` (hero/support/fill) signals intent. Returns the placement alias to ' +
      'address it later.',
    inputSchema: z.object({
      asset: z.string().describe('The generationId to place (from scene_list_assets).'),
      at: vec2.describe('Ground position [x,z] in world units.'),
      y: z
        .number()
        .optional()
        .describe('Explicit Y (default: grounded so the base sits on the terrain).'),
      face: facing.optional().describe('Facing intent (default "center").'),
      scale: z.number().optional().describe('Uniform scale (default 1).'),
      role: roleEnum.optional().describe('hero | support | fill (default support).'),
      group: z.string().optional().describe('Optional group name to bind this placement into.'),
      alias: z
        .string()
        .optional()
        .describe('A friendly alias to address this placement (default derived from the name).'),
    }),
    callback: (input) => {
      const i = input as {
        asset: string;
        at: [number, number];
        y?: number;
        face?: z.infer<typeof facing>;
        scale?: number;
        role?: 'hero' | 'support' | 'fill';
        group?: string;
        alias?: string;
      };
      return guarded(() =>
        model.addPlace(i.asset, {
          at: i.at,
          ...(i.y != null ? { y: i.y } : {}),
          ...(i.face !== undefined ? { face: i.face } : {}),
          ...(i.scale != null ? { scale: i.scale } : {}),
          ...(i.role ? { role: i.role } : {}),
          ...(i.group ? { group: i.group } : {}),
          ...(i.alias ? { alias: i.alias } : {}),
        }),
      );
    },
  });

  const clusterTool: Tool = tool({
    name: 'scene_cluster',
    description:
      'Scatter N copies of an asset around a point — overlap-free by construction. Use it for organic ' +
      'density: a cluster of crates, rocks, tents, debris. `spread` is the rough diameter. Serializes ' +
      'as a single line and is addressable as one unit (alias) or per-instance (alias#i).',
    inputSchema: z.object({
      asset: z.string().describe('The generationId to scatter.'),
      around: vec2.describe('Centre point [x,z] of the cluster.'),
      count: z.number().int().min(1).describe('How many copies.'),
      spread: z.number().describe('Approximate cluster diameter in world units.'),
      face: facing.optional().describe('Facing intent for the copies (default "center").'),
      scale: z.number().optional().describe('Uniform scale (default 1).'),
      role: roleEnum.optional().describe('hero | support | fill (default fill).'),
      group: z.string().optional().describe('Optional group name.'),
      alias: z.string().optional().describe('Alias for the cluster (default <name>_cluster).'),
    }),
    callback: (input) => {
      const i = input as {
        asset: string;
        around: [number, number];
        count: number;
        spread: number;
        face?: z.infer<typeof facing>;
        scale?: number;
        role?: 'hero' | 'support' | 'fill';
        group?: string;
        alias?: string;
      };
      return guarded(() =>
        model.addCluster(i.asset, {
          around: i.around,
          count: i.count,
          spread: i.spread,
          ...(i.face !== undefined ? { face: i.face } : {}),
          ...(i.scale != null ? { scale: i.scale } : {}),
          ...(i.role ? { role: i.role } : {}),
          ...(i.group ? { group: i.group } : {}),
          ...(i.alias ? { alias: i.alias } : {}),
        }),
      );
    },
  });

  const ringTool: Tool = tool({
    name: 'scene_ring',
    description:
      'Place N copies evenly on a circle of `radius` around a centre — overlap-free. Use it for ' +
      'deliberate radial structure: columns around a plaza, lanterns around a well, stones in a ' +
      'circle. `faceOut:true` turns the copies to face outward (default: face the centre).',
    inputSchema: z.object({
      asset: z.string().describe('The generationId to ring.'),
      center: vec2.describe('Centre point [x,z] of the ring.'),
      count: z.number().int().min(1).describe('How many copies on the circle.'),
      radius: z.number().describe('Ring radius in world units.'),
      faceOut: z
        .boolean()
        .optional()
        .describe('Face outward instead of toward the centre (default false).'),
      scale: z.number().optional().describe('Uniform scale (default 1).'),
      role: roleEnum.optional().describe('hero | support | fill (default support).'),
      group: z.string().optional().describe('Optional group name.'),
      alias: z.string().optional().describe('Alias for the ring (default <name>_ring).'),
    }),
    callback: (input) => {
      const i = input as {
        asset: string;
        center: [number, number];
        count: number;
        radius: number;
        faceOut?: boolean;
        scale?: number;
        role?: 'hero' | 'support' | 'fill';
        group?: string;
        alias?: string;
      };
      return guarded(() =>
        model.addRing(i.asset, {
          center: i.center,
          count: i.count,
          radius: i.radius,
          ...(i.faceOut != null ? { faceOut: i.faceOut } : {}),
          ...(i.scale != null ? { scale: i.scale } : {}),
          ...(i.role ? { role: i.role } : {}),
          ...(i.group ? { group: i.group } : {}),
          ...(i.alias ? { alias: i.alias } : {}),
        }),
      );
    },
  });

  const moveTool: Tool = tool({
    name: 'scene_move',
    description:
      'Move a placement (by alias or stmtId): `to` sets an absolute ground point [x,z], `delta` nudges ' +
      'it by [dx,dz] (pass scene_validate’s separation x,z here to resolve an overlap), and `scale` ' +
      'resets its scale. Targets a cluster/ring by its alias to move the whole group.',
    inputSchema: z.object({
      target: z.string().describe('The placement alias (or stmtId) to move.'),
      to: vec2.optional().describe('Absolute ground position [x,z].'),
      delta: vec2.optional().describe('Relative nudge [dx,dz] (e.g. a separation vector).'),
      scale: z.number().optional().describe('New uniform scale.'),
    }),
    callback: (input) => {
      const i = input as {
        target: string;
        to?: [number, number];
        delta?: [number, number];
        scale?: number;
      };
      const r = model.move(i.target, {
        ...(i.to ? { to: i.to } : {}),
        ...(i.delta ? { delta: i.delta } : {}),
        ...(i.scale != null ? { scale: i.scale } : {}),
      });
      return (r.ok ? echo(r.alias) : r) as unknown as JSONValue;
    },
  });

  const faceTool: Tool = tool({
    name: 'scene_face',
    description:
      'Re-orient a placement: "center" faces the scene origin, "out" faces away, [x,z] faces that ' +
      'point, or pass degrees. For a ring, "out"/"center" flips faceOut. Facing is how a scene reads ' +
      'as intentional — point heroes at the viewer, turn supporting rows to frame them.',
    inputSchema: z.object({
      target: z.string().describe('The placement alias (or stmtId) to re-orient.'),
      face: facing.describe('Facing intent: "center" | "out" | [x,z] | degrees.'),
    }),
    callback: (input) => {
      const i = input as { target: string; face: z.infer<typeof facing> };
      const r = model.face(i.target, i.face);
      return (r.ok ? echo(r.alias) : r) as unknown as JSONValue;
    },
  });

  const groupTool: Tool = tool({
    name: 'scene_group',
    description:
      'Bind several placements into a named group, optionally nudging (`delta`) or relocating (`to`) ' +
      'them together — so a courtyard, a market row, or a camp moves as one unit. Returns the group ' +
      'name and its members.',
    inputSchema: z.object({
      targets: z.array(z.string()).min(1).describe('Placement aliases (or stmtIds) to group.'),
      name: z.string().optional().describe('Group name (default group_N).'),
      delta: vec2.optional().describe('Move the whole group by [dx,dz].'),
      to: vec2.optional().describe('Move every member to [x,z].'),
    }),
    callback: (input) => {
      const i = input as {
        targets: string[];
        name?: string;
        delta?: [number, number];
        to?: [number, number];
      };
      const r = model.group(i.targets, {
        ...(i.name ? { name: i.name } : {}),
        ...(i.delta ? { delta: i.delta } : {}),
        ...(i.to ? { to: i.to } : {}),
      });
      if (!r.ok) return r as JSONValue;
      const ev = capture();
      return {
        ok: true,
        group: r.group,
        members: r.members,
        placements: ev.placements.length,
        overlaps: ev.overlaps.length,
      } as JSONValue;
    },
  });

  const removeTool: Tool = tool({
    name: 'scene_remove',
    description:
      'Remove a placement (by alias or stmtId) from the scene — for a cluster/ring this drops the ' +
      'whole group. Use it to declutter or swap an asset out. Returns the remaining placement count.',
    inputSchema: z.object({
      target: z.string().describe('The placement alias (or stmtId) to remove.'),
    }),
    callback: (input) => {
      const i = input as { target: string };
      const r = model.remove(i.target);
      if (!r.ok) return r as JSONValue;
      const ev = capture();
      return {
        ok: true,
        removed: r.removed,
        placements: ev.placements.length,
        overlaps: ev.overlaps.length,
      } as JSONValue;
    },
  });

  const finalizeTool: Tool = tool({
    name: 'scene_finalize',
    description:
      'Lock in the current scene as the FINAL composition. Call this exactly once, after scene_render ' +
      'reads as a cohesive, overlap-free, intentional scene. No argument — it finalizes exactly what ' +
      'you have placed. Returns the final program + placement/overlap counts.',
    inputSchema: empty,
    callback: () => {
      const ev = capture();
      sink.finalized = true;
      return {
        ok: true,
        recorded: true,
        placements: ev.placements.length,
        overlaps: ev.overlaps.length,
        program: sink.program,
      } as JSONValue;
    },
  });

  return [
    listAssetsTool,
    viewTool,
    validateTool,
    renderTool,
    screenshotTool,
    layoutTool,
    placeTool,
    clusterTool,
    ringTool,
    moveTool,
    faceTool,
    groupTool,
    removeTool,
    finalizeTool,
  ];
}

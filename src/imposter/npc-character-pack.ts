import { existsSync, statSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';

import { NodeIO, type Mesh } from '@gltf-transform/core';
import { z } from 'zod';

const NpcCharacterPackClipStatusSchema = z.enum(['reference', 'review', 'candidate', 'approved', 'rejected']);
const NpcCharacterPackTijStateSchema = z.enum([
  'idle',
  'patrolling',
  'alert',
  'engaging',
  'suppressing',
  'advancing',
  'retreating',
  'seeking_cover',
  'defending',
  'dead',
  'boarding',
  'in_vehicle',
  'dismounting',
]);

const NpcCharacterPackIssueSchema = z
  .object({
    code: z.string().min(1),
    severity: z.enum(['info', 'warning', 'error']),
    message: z.string().min(1),
    path: z.string().optional(),
    fixHint: z.string().optional(),
  })
  .strict();

const NpcCharacterPackOutputSchema = z
  .object({
    faction: z.string().min(1),
    clip: z.string().min(1),
    label: z.string().min(1),
    path: z.string().min(1),
    bytes: z.number().int().nonnegative(),
    tijStates: z.array(NpcCharacterPackTijStateSchema).min(1),
    status: NpcCharacterPackClipStatusSchema,
    primaryWeapon: z.string().min(1),
  })
  .strict();

const NpcCharacterPackSourceManifestSchema = z
  .object({
    id: z.string().min(1),
    createdFrom: z.record(z.string(), z.unknown()).default({}),
    policy: z
      .object({
        promoteToWarAssets: z.boolean(),
        recoil: z.string().min(1),
        excludedClips: z
          .array(
            z
              .object({
                id: z.string().min(1),
                reason: z.string().min(1),
              })
              .strict(),
          )
          .default([]),
      })
      .strict(),
    socketContract: z
      .object({
        characterForward: z.string().min(1),
        weaponForward: z.string().min(1),
        rightHandBone: z.string(),
        leftHandBone: z.string(),
        runtimeNotes: z.array(z.string()).default([]),
      })
      .strict(),
    factions: z.record(
      z.string().min(1),
      z
        .object({
          label: z.string().min(1),
          headgear: z.string().min(1),
          primaryWeapon: z.string().min(1),
        })
        .strict(),
    ),
    clips: z
      .array(
        z
          .object({
            id: z.string().min(1),
            label: z.string().min(1),
            tijStates: z.array(NpcCharacterPackTijStateSchema).min(1),
            status: NpcCharacterPackClipStatusSchema,
            note: z.string().min(1),
          })
          .strict(),
      )
      .min(1),
    outputs: z.array(NpcCharacterPackOutputSchema).min(1),
  })
  .strict();

const NpcCharacterPackPackagedEntrySchema = z
  .object({
    faction: z.string().min(1),
    factionLabel: z.string().min(1),
    clip: z.string().min(1),
    clipLabel: z.string().min(1),
    status: NpcCharacterPackClipStatusSchema,
    tijStates: z.array(NpcCharacterPackTijStateSchema).min(1),
    primaryWeapon: z.string().min(1),
    glb: z
      .object({
        uri: z.string().min(1),
        bytes: z.number().int().nonnegative(),
        hash: z.string().min(1).optional(),
      })
      .strict(),
    impostor: z
      .object({
        dir: z.string().min(1),
        sidecar: z.string().min(1),
        atlas: z.string().min(1),
        frameStrip: z.string().min(1),
        atlasHash: z.string().min(1).optional(),
        sidecarValid: z.boolean(),
        alphaCoverage: z.unknown().optional(),
        storage: z
          .object({
            colorBytes: z.number().int().nonnegative(),
            normalBytes: z.number().int().nonnegative().optional(),
            depthBytes: z.number().int().nonnegative().optional(),
            paletteBytes: z.number().int().nonnegative().optional(),
            totalRawBytes: z.number().int().nonnegative(),
            envelopeBytes: z.number().int().positive(),
            fitsEnvelope: z.boolean(),
          })
          .strict(),
        warnings: z.array(NpcCharacterPackIssueSchema),
      })
      .strict(),
  })
  .strict();

const NpcCharacterPackPackagedManifestSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.string().min(1),
    sourceManifest: z.string().min(1),
    generatedAt: z.string().min(1),
    promoteToWarAssets: z.boolean(),
    note: z.string().min(1),
    settings: z
      .object({
        viewGrid: z
          .object({
            x: z.number().int().positive(),
            y: z.number().int().positive(),
            count: z.number().int().positive(),
          })
          .strict(),
        tileSize: z.number().int().positive(),
        framesPerClip: z.number().int().positive(),
        textureLayout: z.string().min(1),
        textureFormat: z.string().min(1),
      })
      .strict(),
    socketContract: z
      .object({
        characterForward: z.string().min(1),
        weaponForward: z.string().min(1),
        rightHandBone: z.string(),
        leftHandBone: z.string(),
        runtimeNotes: z.array(z.string()).default([]),
      })
      .strict(),
    factions: z.record(
      z.string().min(1),
      z
        .object({
          label: z.string().min(1),
          headgear: z.string().min(1),
          primaryWeapon: z.string().min(1),
        })
        .strict(),
    ),
    clips: z
      .array(
        z
          .object({
            id: z.string().min(1),
            label: z.string().min(1),
            tijStates: z.array(NpcCharacterPackTijStateSchema).min(1),
            status: NpcCharacterPackClipStatusSchema,
            note: z.string().min(1),
          })
          .strict(),
      )
      .min(1),
    weapons: z.record(z.string(), z.unknown()).default({}),
    combinedGlbs: z
      .record(
        z.string().min(1),
        z
          .object({
            uri: z.string().min(1),
            bytes: z.number().int().nonnegative(),
            hash: z.string().min(1).optional(),
            animations: z.array(z.string()),
          })
          .strict(),
      )
      .default({}),
    entries: z.array(NpcCharacterPackPackagedEntrySchema).min(1),
    totals: z
      .object({
        entries: z.number().int().nonnegative(),
        glbBytes: z.number().int().nonnegative(),
        atlasPngBytes: z.number().int().nonnegative(),
        rawImpostorBytes: z.number().int().nonnegative(),
        warnings: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict();

export const NpcCharacterPackManifestSchema = z.union([
  NpcCharacterPackSourceManifestSchema,
  NpcCharacterPackPackagedManifestSchema,
]);

export type NpcCharacterPackManifest = z.infer<typeof NpcCharacterPackManifestSchema>;
export type NpcCharacterPackIssue = z.infer<typeof NpcCharacterPackIssueSchema>;
type NpcCharacterPackSourceManifest = z.infer<typeof NpcCharacterPackSourceManifestSchema>;
type NpcCharacterPackPackagedManifest = z.infer<typeof NpcCharacterPackPackagedManifestSchema>;

export interface NpcCharacterPackOutputMetrics {
  faction: string;
  clip: string;
  path: string;
  exists: boolean;
  expectedBytes: number;
  actualBytes?: number;
  triangles?: number;
  joints?: number;
  animations?: number;
  hasRightHandBone?: boolean;
  hasLeftHandBone?: boolean;
}

export interface NpcCharacterPackFactionMetrics {
  outputs: number;
  clips: number;
  maxBytes: number;
  maxTris: number;
  minJoints: number;
}

export interface NpcCharacterPackValidationReport {
  ok: boolean;
  manifest: NpcCharacterPackManifest | null;
  blockers: NpcCharacterPackIssue[];
  warnings: NpcCharacterPackIssue[];
  metrics: {
    factions: Record<string, NpcCharacterPackFactionMetrics>;
    outputs: NpcCharacterPackOutputMetrics[];
  };
}

export interface ValidateNpcCharacterPackOptions {
  rootDir?: string;
  checkFiles?: boolean;
  inspectGlbs?: boolean;
  productionClipIds?: string[];
}

const DEFAULT_PRODUCTION_CLIP_IDS = [
  'idle',
  'patrol_walk',
  'traverse_run',
  'walk_fight_forward',
  'death_fall_back',
];

export async function validateNpcCharacterPack(
  raw: unknown,
  opts: ValidateNpcCharacterPackOptions = {},
): Promise<NpcCharacterPackValidationReport> {
  const blockers: NpcCharacterPackIssue[] = [];
  const warnings: NpcCharacterPackIssue[] = [];
  const add = (issue: NpcCharacterPackIssue) => {
    if (issue.severity === 'error') blockers.push(issue);
    else warnings.push(issue);
  };

  const parsed = NpcCharacterPackManifestSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      manifest: null,
      blockers: [
        {
          code: 'NPC_CHARACTER_PACK_SCHEMA_INVALID',
          severity: 'error',
          message: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '),
          fixHint: 'Fix the character pack manifest shape before using it as a bake source.',
        },
      ],
      warnings: [],
      metrics: { factions: {}, outputs: [] },
    };
  }

  const rawManifest = parsed.data;
  const packagedManifest = isPackagedManifest(rawManifest) ? rawManifest : null;
  const manifest = normalizeManifest(rawManifest);
  const checkFiles = opts.checkFiles ?? false;
  const inspectGlbs = opts.inspectGlbs ?? checkFiles;
  const rootDir = opts.rootDir ?? process.cwd();
  const productionClipIds = opts.productionClipIds ?? DEFAULT_PRODUCTION_CLIP_IDS;
  const excludedClipIds = new Set(manifest.policy.excludedClips.map((clip) => clip.id));
  const factionIds = new Set(Object.keys(manifest.factions));
  const clipIds = new Set(manifest.clips.map((clip) => clip.id));
  const outputKeys = new Set<string>();
  const outputsByFaction = new Map<string, Set<string>>();
  const metrics: NpcCharacterPackValidationReport['metrics'] = {
    factions: Object.fromEntries(
      Object.keys(manifest.factions).map((faction) => [
        faction,
        { outputs: 0, clips: 0, maxBytes: 0, maxTris: 0, minJoints: Number.POSITIVE_INFINITY },
      ]),
    ),
    outputs: [],
  };

  if (packagedManifest) {
    validatePackagedManifest(packagedManifest, rootDir, checkFiles, add);
  }

  if (!manifest.socketContract.rightHandBone.trim()) {
    add({
      code: 'NPC_CHARACTER_PACK_RIGHT_HAND_BONE_MISSING',
      severity: 'error',
      message: 'socketContract.rightHandBone is required.',
      path: 'socketContract.rightHandBone',
      fixHint: 'Set the right hand bone used for weapon attachment.',
    });
  }

  if (!manifest.socketContract.leftHandBone.trim()) {
    add({
      code: 'NPC_CHARACTER_PACK_LEFT_HAND_BONE_MISSING',
      severity: 'error',
      message: 'socketContract.leftHandBone is required.',
      path: 'socketContract.leftHandBone',
      fixHint: 'Set the left hand bone used for weapon support.',
    });
  }

  for (const clip of manifest.clips) {
    if (excludedClipIds.has(clip.id)) {
      add({
        code: 'NPC_CHARACTER_PACK_EXCLUDED_CLIP_DECLARED',
        severity: 'warning',
        message: `Excluded clip ${clip.id} is still declared in clips.`,
        path: `clips.${clip.id}`,
        fixHint: 'Keep rejected actions out of the production clip list.',
      });
    }
  }

  for (const output of manifest.outputs) {
    const outputKey = `${output.faction}/${output.clip}`;
    const metric: NpcCharacterPackOutputMetrics = {
      faction: output.faction,
      clip: output.clip,
      path: output.path,
      exists: false,
      expectedBytes: output.bytes,
    };
    metrics.outputs.push(metric);

    if (outputKeys.has(outputKey)) {
      add({
        code: 'NPC_CHARACTER_PACK_DUPLICATE_OUTPUT',
        severity: 'error',
        message: `Duplicate output for ${outputKey}.`,
        path: `outputs.${outputKey}`,
        fixHint: 'Keep one GLB per faction and clip id.',
      });
    }
    outputKeys.add(outputKey);

    if (!factionIds.has(output.faction)) {
      add({
        code: 'NPC_CHARACTER_PACK_UNKNOWN_FACTION',
        severity: 'error',
        message: `Output references unknown faction ${output.faction}.`,
        path: `outputs.${outputKey}.faction`,
        fixHint: 'Add the faction to the manifest or remove the output.',
      });
    }

    if (!clipIds.has(output.clip)) {
      add({
        code: 'NPC_CHARACTER_PACK_UNKNOWN_CLIP',
        severity: 'error',
        message: `Output references unknown clip ${output.clip}.`,
        path: `outputs.${outputKey}.clip`,
        fixHint: 'Add the clip metadata to the manifest or remove the output.',
      });
    }

    if (excludedClipIds.has(output.clip)) {
      add({
        code: 'NPC_CHARACTER_PACK_EXCLUDED_CLIP_OUTPUT',
        severity: 'error',
        message: `Excluded clip ${output.clip} has an output for ${output.faction}.`,
        path: `outputs.${outputKey}`,
        fixHint: 'Do not bake or validate rejected production clips.',
      });
    }

    const faction = manifest.factions[output.faction];
    if (faction && output.primaryWeapon !== faction.primaryWeapon) {
      add({
        code: 'NPC_CHARACTER_PACK_WEAPON_MISMATCH',
        severity: 'warning',
        message: `${outputKey} uses ${output.primaryWeapon}, but faction default is ${faction.primaryWeapon}.`,
        path: `outputs.${outputKey}.primaryWeapon`,
        fixHint: 'Use the faction primary weapon unless this output is an intentional variant.',
      });
    }

    const factionClips = outputsByFaction.get(output.faction) ?? new Set<string>();
    factionClips.add(output.clip);
    outputsByFaction.set(output.faction, factionClips);

    if (metrics.factions[output.faction]) {
      const factionMetric = metrics.factions[output.faction]!;
      factionMetric.outputs += 1;
      factionMetric.clips = factionClips.size;
      factionMetric.maxBytes = Math.max(factionMetric.maxBytes, output.bytes);
    }

    if (checkFiles || inspectGlbs) {
      await inspectOutputGlb(output, metric, rootDir, inspectGlbs, manifest, add);
      if (metrics.factions[output.faction]) {
        const factionMetric = metrics.factions[output.faction]!;
        factionMetric.maxTris = Math.max(factionMetric.maxTris, metric.triangles ?? 0);
        factionMetric.minJoints = Math.min(factionMetric.minJoints, metric.joints ?? factionMetric.minJoints);
      }
    }
  }

  for (const factionId of factionIds) {
    const factionClips = outputsByFaction.get(factionId) ?? new Set<string>();
    if (factionClips.size === 0) {
      add({
        code: 'NPC_CHARACTER_PACK_FACTION_NO_OUTPUTS',
        severity: 'error',
        message: `Faction ${factionId} has no GLB outputs.`,
        path: `factions.${factionId}`,
        fixHint: 'Generate or remove the faction before baking animated impostors.',
      });
    }

    for (const clipId of productionClipIds) {
      if (!factionClips.has(clipId)) {
        add({
          code: 'NPC_CHARACTER_PACK_PRODUCTION_CLIP_MISSING',
          severity: 'error',
          message: `Faction ${factionId} is missing production clip ${clipId}.`,
          path: `outputs.${factionId}.${clipId}`,
          fixHint: 'Build the same approved production clip set for every faction.',
        });
      }
    }
  }

  for (const factionMetric of Object.values(metrics.factions)) {
    if (factionMetric.minJoints === Number.POSITIVE_INFINITY) factionMetric.minJoints = 0;
  }

  return {
    ok: blockers.length === 0,
    manifest,
    blockers,
    warnings,
    metrics,
  };
}

function isPackagedManifest(
  manifest: NpcCharacterPackManifest,
): manifest is NpcCharacterPackPackagedManifest {
  return 'entries' in manifest;
}

function normalizeManifest(manifest: NpcCharacterPackManifest): NpcCharacterPackSourceManifest {
  if (!isPackagedManifest(manifest)) return manifest;

  return {
    id: manifest.id,
    createdFrom: {
      sourceManifest: manifest.sourceManifest,
      schemaVersion: manifest.schemaVersion,
      generatedAt: manifest.generatedAt,
    },
    policy: {
      promoteToWarAssets: manifest.promoteToWarAssets,
      recoil: 'Runtime procedural.',
      excludedClips: manifest.clips
        .filter((clip) => clip.status === 'rejected')
        .map((clip) => ({ id: clip.id, reason: clip.note })),
    },
    socketContract: manifest.socketContract,
    factions: manifest.factions,
    clips: manifest.clips,
    outputs: manifest.entries.map((entry) => ({
      faction: entry.faction,
      clip: entry.clip,
      label: entry.clipLabel,
      path: entry.glb.uri,
      bytes: entry.glb.bytes,
      tijStates: entry.tijStates,
      status: entry.status,
      primaryWeapon: entry.primaryWeapon,
    })),
  };
}

function validatePackagedManifest(
  manifest: NpcCharacterPackPackagedManifest,
  rootDir: string,
  checkFiles: boolean,
  add: (issue: NpcCharacterPackIssue) => void,
): void {
  if (manifest.promoteToWarAssets) {
    add({
      code: 'NPC_CHARACTER_PACK_REVIEW_ONLY_VIOLATION',
      severity: 'error',
      message: 'Packaged NPC manifests must remain review-only.',
      path: 'promoteToWarAssets',
      fixHint: 'Set promoteToWarAssets=false and keep generated output under tmp/ until runtime import is approved.',
    });
  }

  if (manifest.totals.entries !== manifest.entries.length) {
    add({
      code: 'NPC_CHARACTER_PACK_TOTALS_DRIFT',
      severity: 'error',
      message: `totals.entries is ${manifest.totals.entries}, but entries contains ${manifest.entries.length}.`,
      path: 'totals.entries',
      fixHint: 'Regenerate the package manifest after rebuilding entries.',
    });
  }

  for (const [faction, combined] of Object.entries(manifest.combinedGlbs)) {
    if (!manifest.factions[faction]) {
      add({
        code: 'NPC_CHARACTER_PACK_UNKNOWN_COMBINED_FACTION',
        severity: 'error',
        message: `combinedGlbs contains unknown faction ${faction}.`,
        path: `combinedGlbs.${faction}`,
        fixHint: 'Remove the combined GLB or add the faction metadata.',
      });
    }
    if (checkFiles) {
      requirePackagedFile(add, `combinedGlbs.${faction}.uri`, combined.uri, rootDir);
    }
  }

  for (const entry of manifest.entries) {
    const key = `${entry.faction}/${entry.clip}`;
    if (!entry.impostor.sidecarValid) {
      add({
        code: 'NPC_CHARACTER_PACK_IMPOSTER_SIDECAR_INVALID',
        severity: 'error',
        message: `${key} animated imposter sidecar failed schema validation during packaging.`,
        path: `entries.${key}.impostor.sidecar`,
        fixHint: 'Fix the animated imposter sidecar before using this entry as a bake/runtime source.',
      });
    }
    if (!entry.impostor.storage.fitsEnvelope) {
      add({
        code: 'NPC_CHARACTER_PACK_IMPOSTER_STORAGE_OVER_BUDGET',
        severity: 'error',
        message: `${key} animated imposter exceeds the configured storage envelope.`,
        path: `entries.${key}.impostor.storage`,
        fixHint: 'Reduce view grid, frame count, tile size, or texture format before runtime import.',
      });
    }

    if (!checkFiles) continue;
    requirePackagedFile(add, `entries.${key}.glb.uri`, entry.glb.uri, rootDir);
    requirePackagedFile(add, `entries.${key}.impostor.sidecar`, entry.impostor.sidecar, rootDir);
    requirePackagedFile(add, `entries.${key}.impostor.atlas`, entry.impostor.atlas, rootDir);
    requirePackagedFile(add, `entries.${key}.impostor.frameStrip`, entry.impostor.frameStrip, rootDir);
  }
}

function requirePackagedFile(
  add: (issue: NpcCharacterPackIssue) => void,
  path: string,
  filePath: string,
  rootDir: string,
): void {
  const absPath = isAbsolute(filePath) ? filePath : resolve(rootDir, filePath);
  if (!existsSync(absPath)) {
    add({
      code: 'NPC_CHARACTER_PACK_FILE_MISSING',
      severity: 'error',
      message: `Packaged file is missing: ${filePath}.`,
      path,
      fixHint: 'Rebuild the package or fix the manifest path.',
    });
  }
}

async function inspectOutputGlb(
  output: z.infer<typeof NpcCharacterPackOutputSchema>,
  metric: NpcCharacterPackOutputMetrics,
  rootDir: string,
  inspectGlbs: boolean,
  manifest: NpcCharacterPackManifest,
  add: (issue: NpcCharacterPackIssue) => void,
): Promise<void> {
  const absPath = isAbsolute(output.path) ? output.path : resolve(rootDir, output.path);
  if (!existsSync(absPath)) {
    add({
      code: 'NPC_CHARACTER_PACK_OUTPUT_MISSING',
      severity: 'error',
      message: `Output GLB is missing: ${output.path}.`,
      path: `outputs.${output.faction}.${output.clip}.path`,
      fixHint: 'Rebuild the pack or fix the manifest path before baking.',
    });
    return;
  }

  metric.exists = true;
  metric.actualBytes = statSync(absPath).size;
  if (metric.actualBytes !== output.bytes) {
    add({
      code: 'NPC_CHARACTER_PACK_OUTPUT_BYTES_DRIFT',
      severity: 'warning',
      message: `${output.path} is ${metric.actualBytes} bytes, manifest expected ${output.bytes}.`,
      path: `outputs.${output.faction}.${output.clip}.bytes`,
      fixHint: 'Refresh the manifest after rebuilding GLBs.',
    });
  }

  if (!inspectGlbs) return;

  try {
    const doc = await new NodeIO().read(absPath);
    const root = doc.getRoot();
    metric.triangles = countTriangles(root.listMeshes());
    metric.animations = root.listAnimations().length;
    const jointNames = new Set(root.listSkins().flatMap((skin) => skin.listJoints().map((joint) => joint.getName())));
    const nodeNames = new Set(root.listNodes().map((node) => node.getName()));
    metric.joints = jointNames.size;
    metric.hasRightHandBone = jointNames.has(manifest.socketContract.rightHandBone) || nodeNames.has(manifest.socketContract.rightHandBone);
    metric.hasLeftHandBone = jointNames.has(manifest.socketContract.leftHandBone) || nodeNames.has(manifest.socketContract.leftHandBone);

    if (metric.triangles <= 0) {
      add({
        code: 'NPC_CHARACTER_PACK_OUTPUT_NO_TRIS',
        severity: 'error',
        message: `${output.path} has no renderable triangles.`,
        path: `outputs.${output.faction}.${output.clip}.path`,
        fixHint: 'Use a mesh-backed GLB output.',
      });
    }
    if (metric.joints <= 0) {
      add({
        code: 'NPC_CHARACTER_PACK_OUTPUT_NO_SKIN',
        severity: 'error',
        message: `${output.path} has no skin joints.`,
        path: `outputs.${output.faction}.${output.clip}.path`,
        fixHint: 'Use a skinned character GLB for animated impostor baking.',
      });
    }
    if (output.status !== 'reference' && (metric.animations ?? 0) <= 0) {
      add({
        code: 'NPC_CHARACTER_PACK_OUTPUT_NO_ANIMATION',
        severity: 'error',
        message: `${output.path} has no animation clips.`,
        path: `outputs.${output.faction}.${output.clip}.path`,
        fixHint: 'Select an animated clip GLB or mark this output as reference-only.',
      });
    }
    if (!metric.hasRightHandBone || !metric.hasLeftHandBone) {
      add({
        code: 'NPC_CHARACTER_PACK_HAND_BONES_NOT_FOUND',
        severity: 'error',
        message: `${output.path} does not expose both configured hand bones.`,
        path: `outputs.${output.faction}.${output.clip}.path`,
        fixHint: 'Set socketContract hand bone names to the exported skeleton names.',
      });
    }
  } catch (err) {
    add({
      code: 'NPC_CHARACTER_PACK_OUTPUT_INSPECT_FAILED',
      severity: 'error',
      message: `${output.path} could not be inspected: ${(err as Error).message}`,
      path: `outputs.${output.faction}.${output.clip}.path`,
      fixHint: 'Verify the path points to a valid GLB file.',
    });
  }
}

function countTriangles(meshes: Mesh[]): number {
  let tris = 0;
  for (const mesh of meshes) {
    for (const primitive of mesh.listPrimitives()) {
      tris += Math.floor((primitive.getIndices()?.getCount() ?? primitive.getAttribute('POSITION')?.getCount() ?? 0) / 3);
    }
  }
  return tris;
}

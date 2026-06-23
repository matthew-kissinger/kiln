import { describe, expect, test } from 'bun:test';

import {
  NpcCharacterPackManifestSchema,
  validateNpcCharacterPack,
} from '../npc-character-pack';

function makeManifest(): unknown {
  const clips = [
    ['idle', ['idle']],
    ['patrol_walk', ['patrolling']],
    ['traverse_run', ['seeking_cover']],
    ['walk_fight_forward', ['engaging', 'advancing']],
    ['death_fall_back', ['dead']],
  ] as const;

  return {
    id: 'test-pack',
    createdFrom: { base: 'test' },
    policy: {
      promoteToWarAssets: false,
      recoil: 'Runtime procedural.',
      excludedClips: [{ id: 'walk_forward_while_shooting', reason: 'Rejected in review.' }],
    },
    socketContract: {
      characterForward: '+Z',
      weaponForward: '+X',
      rightHandBone: 'RightHand',
      leftHandBone: 'LeftHand',
      runtimeNotes: ['Attach weapon at runtime.'],
    },
    factions: {
      nva: { label: 'NVA regular', headgear: 'pith-cap', primaryWeapon: 'ak47' },
    },
    clips: clips.map(([id, states]) => ({
      id,
      label: id,
      tijStates: states,
      status: 'candidate',
      note: 'Test clip.',
    })),
    outputs: clips.map(([id, states]) => ({
      faction: 'nva',
      clip: id,
      label: `nva ${id}`,
      path: `tmp/${id}.glb`,
      bytes: 1000,
      tijStates: states,
      status: 'candidate',
      primaryWeapon: 'ak47',
    })),
  };
}

function makePackagedManifest(): unknown {
  const source = makeManifest() as {
    id: string;
    socketContract: unknown;
    factions: unknown;
    clips: Array<{
      id: string;
      label: string;
      tijStates: string[];
      status: string;
      note: string;
    }>;
    outputs: Array<{
      faction: string;
      clip: string;
      label: string;
      path: string;
      bytes: number;
      tijStates: string[];
      status: string;
      primaryWeapon: string;
    }>;
  };

  return {
    schemaVersion: 1,
    id: source.id,
    sourceManifest: '../../source/manifest.json',
    generatedAt: '2026-04-28T00:00:00.000Z',
    promoteToWarAssets: false,
    note: 'Review-only package.',
    settings: {
      viewGrid: { x: 7, y: 7, count: 49 },
      tileSize: 96,
      framesPerClip: 8,
      textureLayout: 'atlas',
      textureFormat: 'rgba8-debug',
    },
    socketContract: source.socketContract,
    factions: source.factions,
    clips: source.clips,
    weapons: {},
    combinedGlbs: {
      nva: {
        uri: 'glb-combined/nva.glb',
        bytes: 2000,
        hash: 'abc',
        animations: source.clips.map((clip) => clip.id),
      },
    },
    entries: source.outputs.map((output) => ({
      faction: output.faction,
      factionLabel: 'NVA regular',
      clip: output.clip,
      clipLabel: output.label,
      status: output.status,
      tijStates: output.tijStates,
      primaryWeapon: output.primaryWeapon,
      glb: {
        uri: output.path,
        bytes: output.bytes,
        hash: 'abc',
      },
      impostor: {
        dir: `impostors/${output.faction}/${output.clip}`,
        sidecar: `impostors/${output.faction}/${output.clip}/animated-imposter.json`,
        atlas: `impostors/${output.faction}/${output.clip}/animated-albedo-packed.png`,
        frameStrip: `impostors/${output.faction}/${output.clip}/animated-frame-strip.png`,
        atlasHash: 'abc',
        sidecarValid: true,
        storage: {
          colorBytes: 100,
          totalRawBytes: 100,
          envelopeBytes: 1000,
          fitsEnvelope: true,
        },
        warnings: [],
      },
    })),
    totals: {
      entries: source.outputs.length,
      glbBytes: source.outputs.reduce((sum, output) => sum + output.bytes, 0),
      atlasPngBytes: 1000,
      rawImpostorBytes: 500,
      warnings: 0,
    },
  };
}

describe('NpcCharacterPackManifestSchema', () => {
  test('accepts the minimum TIJ character pack contract', () => {
    expect(() => NpcCharacterPackManifestSchema.parse(makeManifest())).not.toThrow();
  });

  test('accepts the packaged review bundle contract', () => {
    expect(() => NpcCharacterPackManifestSchema.parse(makePackagedManifest())).not.toThrow();
  });
});

describe('validateNpcCharacterPack', () => {
  test('accepts a complete manifest without filesystem checks', async () => {
    const report = await validateNpcCharacterPack(makeManifest(), { checkFiles: false });
    expect(report.ok).toBe(true);
    expect(report.blockers).toEqual([]);
    expect(report.metrics.factions.nva?.outputs).toBe(5);
    expect(report.metrics.factions.nva?.clips).toBe(5);
  });

  test('accepts a packaged review manifest without filesystem checks', async () => {
    const report = await validateNpcCharacterPack(makePackagedManifest(), { checkFiles: false });
    expect(report.ok).toBe(true);
    expect(report.blockers).toEqual([]);
    expect(report.metrics.factions.nva?.outputs).toBe(5);
  });

  test('blocks missing GLB files when file checks are enabled', async () => {
    const report = await validateNpcCharacterPack(makeManifest(), {
      checkFiles: true,
      inspectGlbs: false,
      rootDir: process.cwd(),
    });
    expect(report.ok).toBe(false);
    expect(report.blockers.map((issue) => issue.code)).toContain('NPC_CHARACTER_PACK_OUTPUT_MISSING');
  });

  test('blocks outputs for unknown factions', async () => {
    const manifest = makeManifest() as { outputs: Array<{ faction: string }> };
    manifest.outputs[0]!.faction = 'unknown';
    const report = await validateNpcCharacterPack(manifest, { checkFiles: false });
    expect(report.ok).toBe(false);
    expect(report.blockers.map((issue) => issue.code)).toContain('NPC_CHARACTER_PACK_UNKNOWN_FACTION');
  });

  test('blocks missing hand socket names', async () => {
    const manifest = makeManifest() as { socketContract: { rightHandBone: string; leftHandBone: string } };
    manifest.socketContract.rightHandBone = '';
    manifest.socketContract.leftHandBone = ' ';
    const report = await validateNpcCharacterPack(manifest, { checkFiles: false });
    expect(report.ok).toBe(false);
    expect(report.blockers.map((issue) => issue.code)).toContain('NPC_CHARACTER_PACK_RIGHT_HAND_BONE_MISSING');
    expect(report.blockers.map((issue) => issue.code)).toContain('NPC_CHARACTER_PACK_LEFT_HAND_BONE_MISSING');
  });

  test('reports invalid TIJ state mappings through the schema gate', async () => {
    const manifest = makeManifest() as { clips: Array<{ tijStates: string[] }> };
    manifest.clips[0]!.tijStates = ['dance'];
    const report = await validateNpcCharacterPack(manifest, { checkFiles: false });
    expect(report.ok).toBe(false);
    expect(report.blockers.map((issue) => issue.code)).toContain('NPC_CHARACTER_PACK_SCHEMA_INVALID');
  });

  test('blocks rejected clips from production outputs', async () => {
    const manifest = makeManifest() as {
      clips: Array<{ id: string; label: string; tijStates: string[]; status: string; note: string }>;
      outputs: Array<{ clip: string; label: string; path: string; tijStates: string[] }>;
    };
    manifest.clips.push({
      id: 'walk_forward_while_shooting',
      label: 'Rejected walk shoot',
      tijStates: ['engaging'],
      status: 'rejected',
      note: 'Rejected in review.',
    });
    manifest.outputs.push({
      ...manifest.outputs[0]!,
      clip: 'walk_forward_while_shooting',
      label: 'Rejected output',
      path: 'tmp/rejected.glb',
      tijStates: ['engaging'],
    });
    const report = await validateNpcCharacterPack(manifest, { checkFiles: false });
    expect(report.ok).toBe(false);
    expect(report.blockers.map((issue) => issue.code)).toContain('NPC_CHARACTER_PACK_EXCLUDED_CLIP_OUTPUT');
  });
});

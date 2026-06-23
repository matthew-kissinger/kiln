/**
 * Test fixtures for the Kiln spike.
 *
 * Three reference GLBs are used to validate the headless pipeline:
 *
 *   - Trivial:    weapons/m79.glb        (single-mesh-ish, small tri-count)
 *   - Medium:     structures/fuel-drum.glb (multi-mesh barrel with ribs)
 *   - Compound:   structures/guard-tower.glb (legs + cross-braces + ladder,
 *                                             cardinal-direction anchors)
 *
 * Prompts were extracted directly from the original generation scripts
 * (scripts/gen-weapons.py and scripts/gen-remaining.py) so we're measuring
 * prompt -> GLB fidelity, not prompt-crafting drift.
 *
 * war-assets/ lives outside the worktree (gitignored), so we resolve paths
 * against the root pixel-forge checkout. This keeps the spike runnable from
 * any worktree without copying binaries around.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve the main pixel-forge checkout from the worktree path. The
// worktree lives at <repo>/.claude/worktrees/<id>/, so four parents up
// from packages/core/src/kiln/__tests__/ puts us at the worktree root,
// and three more parents up goes to the main checkout.
const here = path.dirname(fileURLToPath(import.meta.url));
const worktreeRoot = path.resolve(here, '../../../../..');
// From worktree root: .claude/worktrees/<id>/ -> main repo root is three up.
const mainRepoRoot = path.resolve(worktreeRoot, '../../..');

export const WAR_ASSETS_DIR = process.env['WAR_ASSETS_DIR']
  ?? path.join(mainRepoRoot, 'war-assets');

export interface GlbFixture {
  label: 'trivial' | 'medium' | 'compound';
  slug: string;
  glbPath: string;
  prompt: string;
  category: 'prop' | 'character' | 'vfx' | 'environment';
  style: 'low-poly' | 'stylized' | 'voxel' | 'detailed' | 'realistic';
  includeAnimation: boolean;
  /** Notes on where the prompt came from. */
  promptSource: string;
}

export const FIXTURES: GlbFixture[] = [
  {
    label: 'trivial',
    slug: 'm79',
    glbPath: path.join(WAR_ASSETS_DIR, 'weapons', 'm79.glb'),
    category: 'prop',
    style: 'low-poly',
    includeAnimation: false,
    promptSource: 'scripts/gen-weapons.py (verbatim)',
    prompt:
      "M79 grenade launcher 'Thumper' - Vietnam War. Budget: 800 tris.\n\n" +
      'Coordinate system: barrel along +Z, Y is up. All parts connected.\n\n' +
      'BARREL: cylinderGeo(0.025, 0.025, 0.35, 8) dark 0x3a3a38 at [0, 0.03, 0.2] rotation [90,0,0]. Fat 40mm.\n' +
      'MUZZLE RING: torusGeo(0.025, 0.004, 6, 8) at [0, 0.03, 0.375].\n' +
      'RECEIVER: boxGeo(0.05, 0.06, 0.1) at [0, 0.03, 0.0] dark 0x3a3a38.\n' +
      'BARREL LATCH: boxGeo(0.015, 0.01, 0.015) at [0, 0.065, 0.05].\n' +
      'STOCK: boxGeo(0.035, 0.055, 0.25) wood 0x7B5B3A at [0, 0.01, -0.15] rotation [5,0,0].\n' +
      'BUTTPAD: boxGeo(0.035, 0.055, 0.015) dark 0x222222 at [0, 0.005, -0.28].\n' +
      'TRIGGER GUARD: boxGeo(0.003, 0.035, 0.06) at [0, -0.005, -0.01].\n' +
      'TRIGGER: boxGeo(0.003, 0.012, 0.005) at [0, -0.005, 0.0] metal 0x444444.\n' +
      'FRONT SIGHT: boxGeo(0.004, 0.01, 0.004) at [0, 0.06, 0.37].\n' +
      'REAR SIGHT: boxGeo(0.015, 0.015, 0.005) at [0, 0.065, 0.02].',
  },
  {
    label: 'medium',
    slug: 'fuel-drum',
    glbPath: path.join(WAR_ASSETS_DIR, 'structures', 'fuel-drum.glb'),
    category: 'prop',
    style: 'low-poly',
    includeAnimation: false,
    promptSource: 'scripts/gen-remaining.py (verbatim)',
    prompt:
      '55-gallon fuel drum - standard military fuel storage. Budget: 300 tris.\n\n' +
      'Coordinate: standing upright, Y up, ground Y=0.\n\n' +
      'DRUM: cylinderGeo(0.28, 0.28, 0.85, 12) olive 0x556B2F at [0, 0.425, 0]. Standard 55gal barrel.\n' +
      'TOP LID: cylinderGeo(0.27, 0.27, 0.02, 12) darker 0x4a5e28 at [0, 0.86, 0].\n' +
      'BOTTOM: cylinderGeo(0.27, 0.27, 0.02, 12) darker at [0, 0.01, 0].\n' +
      'TOP BUNG: cylinderGeo(0.03, 0.03, 0.02, 6) dark 0x333333 at [0.1, 0.87, 0].\n' +
      'RIBS: 2x torusGeo(0.28, 0.01, 8, 12) dark at [0, 0.3, 0] and [0, 0.6, 0]. Barrel ribs.\n' +
      'STENCIL STRIPE: boxGeo(0.3, 0.1, 0.01) white 0xCCCCCC at [0, 0.5, 0.28]. Label area.',
  },
  {
    label: 'compound',
    slug: 'guard-tower',
    glbPath: path.join(WAR_ASSETS_DIR, 'structures', 'guard-tower.glb'),
    category: 'environment',
    style: 'low-poly',
    includeAnimation: false,
    promptSource: 'scripts/gen-remaining.py (verbatim)',
    prompt:
      'Vietnam War firebase guard tower. Budget: 1500 tris.\n\n' +
      'Coordinate: front toward +Z, Y up, ground Y=0.\n\n' +
      'LEGS: 4x cylinderGeo(0.08, 0.08, 6.0, 4) wood 0x8B7355.\n' +
      '- [-1.1, 3.0, -1.1], [1.1, 3.0, -1.1], [-1.1, 3.0, 1.1], [1.1, 3.0, 1.1].\n' +
      'CROSS BRACES: 4x boxGeo(0.04, 0.04, 3.5) darker wood 0x6B5B3F diagonal between legs.\n' +
      'PLATFORM: boxGeo(2.5, 0.08, 2.5) wood at [0, 5.5, 0].\n' +
      'SANDBAG WALLS: 4 sides boxGeo at Y=6.0, 1.0m tall.\n' +
      '- Front: boxGeo(2.3, 1.0, 0.3) tan 0xc2a878 at [0, 6.0, 1.1].\n' +
      '- Back: same at [0, 6.0, -1.1].\n' +
      '- Left: boxGeo(0.3, 1.0, 2.0) at [-1.1, 6.0, 0].\n' +
      '- Right: same at [1.1, 6.0, 0].\n' +
      'ROOF: boxGeo(2.8, 0.05, 3.0) tin 0x888888 at [0, 7.05, 0] rotation [5,0,0].\n' +
      'LADDER RAILS: 2x boxGeo(0.04, 0.04, 6.5) wood at [-0.15, 3.0, 1.3] and [0.15, 3.0, 1.3] rotation [12,0,0].\n' +
      'LADDER RUNGS: 8x boxGeo(0.35, 0.03, 0.03) at intervals along ladder.\n' +
      'SEARCHLIGHT: cylinderGeo(0.12, 0.12, 0.15, 6) 0xaaaaaa at [1.0, 7.2, 1.0] rotation [90,0,0].',
  },
];

/**
 * A known-good hand-written Kiln code string used to exercise renderGLB
 * without needing the LLM. Exercises multi-mesh + materials + animation.
 */
export const KNOWN_GOOD_CODE = `
const meta = { name: 'TestChest', category: 'prop', tris: 24 };

function build() {
  const root = createRoot('TestChest');

  createPart('Base', boxGeo(1, 0.4, 0.8), gameMaterial(0x8B4513), {
    position: [0, 0.2, 0],
    parent: root,
  });

  const lidPivot = createPivot('Lid', [0, 0.4, -0.35], root);
  createPart('LidMesh', boxGeo(1, 0.15, 0.8), gameMaterial(0x8B4513), {
    position: [0, 0.075, 0.35],
    parent: lidPivot,
  });

  createPart('Lock', sphereGeo(0.05, 6, 4), gameMaterial(0xffcc00, { metalness: 0.8 }), {
    position: [0, 0.3, 0.4],
    parent: root,
  });

  return root;
}

function animate(root) {
  return [createClip('Open', 2, [
    rotationTrack('Joint_Lid', [
      { time: 0, rotation: [0, 0, 0] },
      { time: 1, rotation: [-60, 0, 0] },
      { time: 2, rotation: [0, 0, 0] },
    ]),
  ])];
}
`;

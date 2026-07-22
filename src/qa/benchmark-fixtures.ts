import { createAssetIntentV1, type AssetCategory, type AssetIntentV1 } from '../contracts';

export const ASSET_BENCHMARK_FIXTURE_SCHEMA_VERSION = 1 as const;
export const ASSET_BENCHMARK_FIXTURE_SET_VERSION = 'kiln.asset-benchmark-fixtures.v1' as const;

export interface AssetBenchmarkExecutionConfigV1 {
  schemaVersion: 1;
  mode: 'glb';
  style: 'detailed';
  includeAnimation: false;
  captureViews: true;
  toolSurface: 'unified';
}

export type AssetBenchmarkSemanticEvidence = 'deterministic' | 'visual' | 'deterministic+visual';

export interface AssetBenchmarkExpectedSemanticV1 {
  id: string;
  description: string;
  evidence: AssetBenchmarkSemanticEvidence;
  requiredRoles: readonly string[];
  viewIds: readonly string[];
}

export interface AssetBenchmarkAdversaryV1 {
  id: string;
  description: string;
  violatedSemantics: readonly string[];
}

export interface AssetBenchmarkFixtureV1 {
  schemaVersion: 1;
  setVersion: typeof ASSET_BENCHMARK_FIXTURE_SET_VERSION;
  id: string;
  category: AssetCategory;
  prompt: string;
  intent: AssetIntentV1;
  config: AssetBenchmarkExecutionConfigV1;
  expectedSemantics: readonly AssetBenchmarkExpectedSemanticV1[];
  adversaries: readonly AssetBenchmarkAdversaryV1[];
}

function deepFreeze<T>(value: T, seen = new Set<object>()): T {
  if (typeof value !== 'object' || value === null || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
}

const STATIC_DETAILED_CONFIG: AssetBenchmarkExecutionConfigV1 = deepFreeze({
  schemaVersion: 1,
  mode: 'glb',
  style: 'detailed',
  includeAnimation: false,
  captureViews: true,
  toolSurface: 'unified',
});

const semantic = (
  id: string,
  description: string,
  evidence: AssetBenchmarkSemanticEvidence,
  requiredRoles: readonly string[],
  viewIds: readonly string[],
): AssetBenchmarkExpectedSemanticV1 =>
  deepFreeze({
    id,
    description,
    evidence,
    requiredRoles: [...requiredRoles],
    viewIds: [...viewIds],
  });

const adversary = (
  id: string,
  description: string,
  violatedSemantics: readonly string[],
): AssetBenchmarkAdversaryV1 =>
  deepFreeze({ id, description, violatedSemantics: [...violatedSemantics] });

function fixture(
  value: Omit<AssetBenchmarkFixtureV1, 'schemaVersion' | 'setVersion' | 'config'>,
): AssetBenchmarkFixtureV1 {
  return deepFreeze({
    schemaVersion: ASSET_BENCHMARK_FIXTURE_SCHEMA_VERSION,
    setVersion: ASSET_BENCHMARK_FIXTURE_SET_VERSION,
    ...value,
    config: STATIC_DETAILED_CONFIG,
  });
}

export const RETRO_FUTURIST_RALLY_COUPE_BENCHMARK_FIXTURE_V1 = fixture({
  id: 'retro-futurist-rally-coupe',
  category: 'vehicle',
  prompt:
    'A generic retro-futurist rally coupe facing +X, with a compact readable cabin, four load-bearing wheels under pronounced arches, two aligned axles, front steering, generous suspension travel, and a planted rally stance. Use original bodywork with no manufacturer badges or copied production-car identity.',
  intent: createAssetIntentV1({
    category: 'vehicle',
    subtype: 'wheeled',
    capabilities: ['driveable'],
    requiredParts: [
      'cabin',
      'wheel.front.left',
      'wheel.front.right',
      'wheel.rear.left',
      'wheel.rear.right',
      'wheel arches',
    ],
    forbiddenExtras: ['manufacturer badge', 'trademarked bodywork'],
    material: { mode: 'pbrRecipe' },
    vehicle: {
      subtype: 'wheeled',
      supportAssemblies: ['wheel'],
      propulsionAssemblies: ['wheel'],
      wheelCount: 4,
      axleCount: 2,
      steering: 'front',
      supportPolicy: 'grounded',
      animationAssemblies: [],
    },
  }),
  expectedSemantics: [
    semantic(
      'vehicle-forward-orientation',
      'The coupe has one unambiguous nose and longitudinal body axis facing trusted +X.',
      'deterministic+visual',
      ['vehicle.frame', 'vehicle.chassis'],
      ['front', 'right', 'top'],
    ),
    semantic(
      'vehicle-cabin-readability',
      'The cabin reads as an attached occupied volume rather than decorative roof clutter.',
      'visual',
      ['vehicle.cabin'],
      ['front', 'three-quarter', 'right'],
    ),
    semantic(
      'vehicle-four-wheel-support',
      'Exactly four load-bearing wheel assemblies occupy unique front/rear and left/right corners.',
      'deterministic',
      ['wheel.front.left', 'wheel.front.right', 'wheel.rear.left', 'wheel.rear.right'],
      ['front', 'right', 'top'],
    ),
    semantic(
      'vehicle-rally-stance',
      'Wheel arches clear the tires and the chassis presents a planted wide-track rally stance.',
      'deterministic+visual',
      ['vehicle.chassis', 'vehicle.fender.front.left', 'vehicle.fender.front.right'],
      ['front', 'three-quarter'],
    ),
    semantic(
      'vehicle-front-steering',
      'Only the front axle owns steering pivots and every wheel spins around vehicle-local +Z.',
      'deterministic',
      ['steering.pivot.front.left', 'steering.pivot.front.right'],
      ['top', 'front'],
    ),
  ],
  adversaries: [
    adversary(
      'coupe-floating-decorative-wheels',
      'Four wheel-shaped decorations are present, but one or more do not carry support semantics or touch the ground plane.',
      ['vehicle-four-wheel-support', 'vehicle-rally-stance'],
    ),
    adversary(
      'coupe-bad-axles',
      'Wheel centers do not form two coherent front/rear axle pairs or their spin axes are not local +Z.',
      ['vehicle-four-wheel-support', 'vehicle-front-steering'],
    ),
    adversary(
      'coupe-rear-only-steering',
      'Steering pivots are attached to the rear axle while trusted intent requires front steering.',
      ['vehicle-front-steering'],
    ),
  ],
});

export const WINDSWEPT_JAPANESE_MAPLE_BENCHMARK_FIXTURE_V1 = fixture({
  id: 'windswept-japanese-maple',
  category: 'vegetation',
  prompt:
    'A standalone lush Japanese maple rooted at Y=0, shaped by persistent wind into a strongly asymmetric but balanced silhouette. Build a tapered trunk, a readable primary-to-secondary branching hierarchy, and several attached broadleaf foliage clusters; include no soil disk, planter, display base, unrelated rocks, or floating leaves.',
  intent: createAssetIntentV1({
    category: 'vegetation',
    subtype: 'tree',
    requiredParts: [
      'tapered trunk',
      'primary branches',
      'secondary branches',
      'attached foliage clusters',
    ],
    forbiddenExtras: ['soil disk', 'planter', 'display base', 'unrelated rocks', 'floating leaves'],
    material: { mode: 'pbrRecipe' },
    vegetation: {
      subtype: 'tree',
      growthState: 'lush',
      canopyProfile: 'broadleaf',
      standalone: true,
      grounded: true,
    },
  }),
  expectedSemantics: [
    semantic(
      'maple-grounded-tapered-trunk',
      'One tapered trunk owns the single standalone ground contact and narrows toward its crown.',
      'deterministic+visual',
      ['vegetation.contact.ground', 'vegetation.trunk'],
      ['front', 'right'],
    ),
    semantic(
      'maple-branch-hierarchy',
      'Primary branches attach to the trunk and secondary branches attach to a primary branch.',
      'deterministic',
      ['vegetation.branch.primary', 'vegetation.branch.secondary'],
      ['front', 'right', 'top'],
    ),
    semantic(
      'maple-windswept-canopy',
      'The canopy is intentionally asymmetric and directionally windswept without becoming disconnected.',
      'visual',
      ['vegetation.canopy'],
      ['front', 'right', 'top'],
    ),
    semantic(
      'maple-attached-foliage',
      'Every foliage cluster is attached to the declared branch graph and none floats independently.',
      'deterministic+visual',
      ['vegetation.foliage', 'vegetation.canopy.cluster'],
      ['front', 'right', 'top'],
    ),
    semantic(
      'maple-standalone-scope',
      'The asset contains the tree only, with no fake grounding base or unrelated scene dressing.',
      'deterministic',
      ['vegetation.contact.ground'],
      ['front', 'top'],
    ),
  ],
  adversaries: [
    adversary(
      'maple-sparse-canopy',
      'A lush-tree request contains too few or too-small foliage clusters to occupy its branch envelope.',
      ['maple-windswept-canopy', 'maple-attached-foliage'],
    ),
    adversary(
      'maple-repetitive-canopy',
      'Identical foliage blobs repeat on a radial grid and erase the requested windswept asymmetry.',
      ['maple-windswept-canopy'],
    ),
    adversary(
      'maple-disconnected-foliage',
      'One or more canopy clusters have no contact or semantic relationship to the branch graph.',
      ['maple-attached-foliage'],
    ),
    adversary(
      'maple-fake-grounding-base',
      'A soil disk, planter, display plinth, or unrelated rock is added to fake ground contact.',
      ['maple-standalone-scope', 'maple-grounded-tapered-trunk'],
    ),
  ],
});

export const STATIC_ORNATE_ENERGY_CROSSBOW_BENCHMARK_FIXTURE_V1 = fixture({
  id: 'static-ornate-energy-crossbow',
  category: 'prop',
  prompt:
    'A static ornate energy crossbow pointing along +X, with an attached stock and grip, mirrored bow limbs, a centered rail, and one taut luminous string or energy arc connecting both limb tips. Keep every assembly connected and readable, and add no display pedestal or implied firing animation.',
  intent: createAssetIntentV1({
    category: 'prop',
    subtype: 'energy-crossbow',
    requiredParts: ['stock', 'grip', 'limb.left', 'limb.right', 'energy string', 'rail'],
    forbiddenExtras: ['display pedestal'],
    material: { mode: 'pbrRecipe' },
  }),
  expectedSemantics: [
    semantic(
      'crossbow-forward-orientation',
      'The rail and firing direction point along trusted +X with the grip below and bow width along Z.',
      'deterministic+visual',
      ['prop.forward', 'weapon.rail'],
      ['front', 'right', 'top'],
    ),
    semantic(
      'crossbow-stock-grip-attachment',
      'Stock, grip, and rail form one connected central assembly.',
      'deterministic+visual',
      ['weapon.stock', 'weapon.grip', 'weapon.rail'],
      ['front', 'right'],
    ),
    semantic(
      'crossbow-limb-symmetry',
      'Left and right bow limbs are mirrored around the center rail and remain attached at the prod.',
      'deterministic+visual',
      ['weapon.limb.left', 'weapon.limb.right'],
      ['front', 'top'],
    ),
    semantic(
      'crossbow-energy-string-attachment',
      'One string or energy arc spans both limb tips and is centered on the rail.',
      'deterministic+visual',
      ['weapon.string.energy'],
      ['front', 'top'],
    ),
    semantic(
      'crossbow-static-contract',
      'The initial fixture contains no clips, animated pivots, or implied firing motion.',
      'deterministic',
      [],
      ['front'],
    ),
  ],
  adversaries: [
    adversary(
      'crossbow-asymmetric-limbs',
      'One bow limb differs materially in length, attachment, or tip placement from its reciprocal limb.',
      ['crossbow-limb-symmetry'],
    ),
    adversary(
      'crossbow-detached-energy-string',
      'The luminous string or energy arc floats near the bow without terminating at both limb tips.',
      ['crossbow-energy-string-attachment'],
    ),
    adversary(
      'crossbow-detached-central-assembly',
      'The grip, stock, or rail is visibly disconnected from the central body.',
      ['crossbow-stock-grip-attachment', 'crossbow-forward-orientation'],
    ),
    adversary(
      'crossbow-unrequested-pedestal-or-animation',
      'The result adds a display pedestal or animation despite the explicitly static single-prop contract.',
      ['crossbow-static-contract'],
    ),
  ],
});

export const PANTHEON_INSPIRED_ROTUNDA_BENCHMARK_FIXTURE_V1 = fixture({
  id: 'pantheon-inspired-rotunda',
  category: 'architecture',
  prompt:
    'A Pantheon-inspired original rotunda facing +X: one primary storey, a circular drum and navigable floor, a fixed hemispherical dome with a real bounded oculus, and an attached columned portico framing a clear exterior-to-interior entry. Preserve inspiration without claiming exact historical reproduction.',
  intent: createAssetIntentV1({
    category: 'architecture',
    subtype: 'rotunda',
    requiredParts: ['rotunda drum', 'navigable floor', 'dome', 'oculus', 'portico', 'clear entry'],
    forbiddenExtras: ['gable roof'],
    material: { mode: 'pbrRecipe' },
    architecture: {
      subtype: 'rotunda',
      storeyCount: 1,
      interiorMode: 'navigable',
      roofMode: 'fixed',
      footprint: { spanX: 12, spanZ: 12 },
      wallHeight: 6,
      scaleMode: 'realistic',
      roof: {
        type: 'dome',
        ridgeAxis: 'x',
        rise: 6,
        pitchDegrees: 0,
        overhang: 0,
        closedEnds: false,
      },
      portal: { width: 2.4, height: 3.6, depth: 0.5 },
    },
  }),
  expectedSemantics: [
    semantic(
      'rotunda-primary-volume',
      'One circular rotunda drum owns the single primary storey and a continuous navigable floor.',
      'deterministic+visual',
      ['architecture.shell.rotunda', 'floor.storey.1'],
      ['front', 'right', 'top', 'architecture.cutaway.dollhouse'],
    ),
    semantic(
      'rotunda-fixed-dome',
      'A fixed hemispherical dome covers the declared circular footprint and rise without gable fallback.',
      'deterministic+visual',
      ['roof.dome'],
      ['front', 'right', 'top'],
    ),
    semantic(
      'rotunda-real-oculus',
      'The oculus is a bounded opening through the dome rather than a decal or dark disk.',
      'deterministic+visual',
      ['opening.roof.oculus'],
      ['top', 'architecture.cutaway.dollhouse'],
    ),
    semantic(
      'rotunda-portico-clearance',
      'The attached portico frames the entry without columns, pediment, or steps blocking its clearance.',
      'deterministic+visual',
      ['architecture.portico', 'opening.front.door'],
      ['front', 'architecture.portal.eye'],
    ),
    semantic(
      'rotunda-navigable-entry',
      'A correctly sized exterior-to-interior portal reaches the navigable floor of the rotunda.',
      'deterministic',
      ['opening.front.door', 'architecture.interior.shell'],
      ['architecture.portal.eye', 'architecture.cutaway.dollhouse'],
    ),
  ],
  adversaries: [
    adversary(
      'rotunda-decal-oculus',
      'A dark circular decal is placed on an otherwise sealed dome instead of cutting a bounded opening.',
      ['rotunda-real-oculus'],
    ),
    adversary(
      'rotunda-sealed-entry',
      'A painted or decorative door occupies the claimed exterior-to-interior clearance.',
      ['rotunda-navigable-entry'],
    ),
    adversary(
      'rotunda-blocked-portico',
      'A portico column, stair, or pediment intersects the required entry clearance.',
      ['rotunda-portico-clearance', 'rotunda-navigable-entry'],
    ),
    adversary(
      'rotunda-missing-floor',
      'The drum and dome are present but the requested primary floor role is absent.',
      ['rotunda-primary-volume'],
    ),
    adversary(
      'rotunda-gable-fallback',
      'The requested dome is replaced with a generic gable roof.',
      ['rotunda-fixed-dome', 'rotunda-real-oculus'],
    ),
  ],
});

export const ASSET_BENCHMARK_FIXTURES_V1: readonly AssetBenchmarkFixtureV1[] = deepFreeze([
  RETRO_FUTURIST_RALLY_COUPE_BENCHMARK_FIXTURE_V1,
  WINDSWEPT_JAPANESE_MAPLE_BENCHMARK_FIXTURE_V1,
  STATIC_ORNATE_ENERGY_CROSSBOW_BENCHMARK_FIXTURE_V1,
  PANTHEON_INSPIRED_ROTUNDA_BENCHMARK_FIXTURE_V1,
]);

/** SHA-256 of JSON.stringify(ASSET_BENCHMARK_FIXTURES_V1), updated only with reviewed fixture changes. */
export const ASSET_BENCHMARK_FIXTURES_CANONICAL_SHA256 =
  '4b81caa8779fb6c2a4ff4abc2d7aa6bf2cd557c0c43bfcdb7a6dd8c81751ab4d' as const;

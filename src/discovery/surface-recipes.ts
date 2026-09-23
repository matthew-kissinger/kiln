import type { DiscoveryEntry } from './catalog-schema';

type RecipeEntry = Extract<DiscoveryEntry, { kind: 'recipe' }>;

/** Optional material/UV constructions. Neither recipe selects an asset category. */
export const surfaceRecipes: readonly RecipeEntry[] = [
  {
    version: 'kiln.catalog-entry.v1',
    id: 'recipe:foliage-cutout-v1',
    kind: 'recipe',
    name: 'Alpha-bearing foliage card',
    summary:
      'Bind an approved alpha-bearing albedo to a UV-mapped card with foliageMaterial. An executable cutout teaching fixture; adapt the card shape, placement and approved resource to the asset.',
    family: 'materials',
    tags: ['foliage', 'alpha', 'cutout', 'card', 'UV', 'double sided'],
    aliases: ['leaf mask', 'transparent leaf silhouette', 'plant billboard'],
    intents: ['make a leaf card with a cutout silhouette', 'bind alpha to foliage'],
    stability: 'experimental',
    related: [
      { id: 'operation:foliageCardGeo', relation: 'prerequisite' },
      { id: 'operation:foliageMaterial', relation: 'prerequisite' },
      { id: 'operation:loadApprovedTexture', relation: 'prerequisite' },
    ],
    references: ['src/material-recipes.ts', 'docs/geometry.md'],
    limitations: [
      'The bundled leaf-mask resource is a 4 by 4 placeholder. It demonstrates alpha delivery, not production foliage detail or a photorealistic leaf.',
      'MASK alone does not cut out an opaque texture. The albedo must contain alpha and the mesh must provide matching UVs.',
      'A card has no physical thickness. Double-sided rendering does not make a solid; destination filtering, mipmaps, shadows and alpha cutoff can change the silhouette.',
      'Raw THREE.DataTexture construction is not an authoring-sandbox route. Use an approved resource available in the current host; do not mutate resource pixels or provenance.',
    ],
    recipe: {
      prerequisites: [
        'operation:loadApprovedTexture',
        'operation:foliageCardGeo',
        'operation:foliageMaterial',
      ],
      steps: [
        'Check material capabilities for an approved alpha-bearing albedo, its availability, license and quality. The example uses the embedded teaching resource.',
        'Await loadApprovedTexture in async build, pass it to foliageMaterial, and bind the material to a card with UVs.',
        'Place cards with ordinary local roots and transforms. Add stems or geometric leaves only when the brief needs them; a billboard construction is optional.',
        'Inspect GPU views from both sides and at the intended distance. Check the exported alphaMode, cutoff, doubleSided, UVs and embedded texture in the destination.',
      ],
      example: `const meta = { name: 'FoliageCutoutTeachingCard' };
async function build() {
  const root = createRoot(meta.name);
  // Embedded 4x4 placeholder: replace with a suitable approved resource for delivery.
  const albedo = await loadApprovedTexture('kiln.texture.leaf-mask-albedo.v1');
  const leaf = foliageMaterial(albedo, { alphaCutoff: 0.5, roughness: 0.85, doubleSided: true });
  createPart('LeafCard', foliageCardGeo({ width: 0.6, height: 1, yPivot: 0 }), leaf, { parent: root });
  return root;
}`,
      adaptations: [
        'Change width, height and yPivot to match placement. For bent cards, preserve UVs when deforming the geometry and inspect the back face.',
        'A custom solid leaf or sampled surface is equally valid. Discover surface geometry and attached detail when a card is inappropriate.',
        'Replace the resource ID only with a host-approved resource that actually has alpha. Change cutoff deliberately and compare the final silhouette, not just the rectangular card bounds.',
      ],
      checks: [
        'A geometry-flat CPU view can confirm placement, but cannot establish the alpha-cut silhouette or material fidelity. Inspect viewFidelity and a GPU image.',
        'Reimport the GLB and verify both transparent and opaque texture samples survive. A nonempty texture binding alone is insufficient.',
        'Review the actual destination at near and far distances for edge loss, halos, backfaces and shadow behavior. Do not present the placeholder as final foliage.',
      ],
    },
  },
  {
    version: 'kiln.catalog-entry.v1',
    id: 'recipe:directional-sweep-v1',
    kind: 'recipe',
    name: 'Directional texture on a curved sweep',
    summary:
      'Use the sweep UVs to keep lengthwise stripes aligned through a bend. A diagnostic pattern for rails, stems, hoses or beams; adapt the material without replacing meaningful UVs with an arbitrarily rotated atlas.',
    family: 'materials',
    tags: ['UV', 'directional', 'sweep', 'stripes', 'grain', 'curved rail'],
    aliases: ['texture follows curve', 'lengthwise wood grain', 'striped hose'],
    intents: ['keep texture direction along a curved part', 'preserve UVs through a path edit'],
    stability: 'experimental',
    related: [
      { id: 'operation:sweepProfile', relation: 'prerequisite' },
      { id: 'operation:proceduralTexture', relation: 'prerequisite' },
      { id: 'operation:pbrMaterial', relation: 'prerequisite' },
    ],
    references: ['src/sweep.ts', 'docs/geometry.md'],
    limitations: [
      'The example uses a conspicuous diagnostic stripe pattern, not realistic wood grain. Material appearance needs GPU and destination review.',
      'Sweep side U follows the profile perimeter and V follows normalized path distance. End caps have separate planar UVs and need distinct treatment for convincing end grain.',
      'Normalized path UVs stretch with path length. Use an explicit repeat/UV scale tied to measured dimensions when physical texture scale must remain constant.',
      'Sweep frames and caps do not prove absence of self-intersection. Keep profile size appropriate to curvature and inspect tight bends and seams.',
    ],
    recipe: {
      prerequisites: [
        'operation:sweepProfile',
        'operation:proceduralTexture',
        'operation:pbrMaterial',
      ],
      steps: [
        'Sample the path at sufficient stations and sweep a simple profile using an explicit up reference.',
        'Keep the generated side UVs: U wraps around the profile; V progresses along path length. Choose a pattern varying across U for stripes that run along V.',
        'Bind the albedo using pbrMaterial. Rebuild from changed path parameters while retaining the intended UV convention.',
        'Inspect both bends, the UV seam and caps with GPU views; reimport and check texture direction in the intended destination.',
      ],
      example: `const meta = { name: 'DirectionalSweepTeachingPattern' };
const curveOffset = 0.2;
function build() {
  const root = createRoot(meta.name);
  const profile = Array.from({ length: 16 }, (_, i) => {
    const angle = 2 * Math.PI * i / 16;
    return [0.07 * Math.cos(angle), 0.07 * Math.sin(angle)];
  });
  const path = Array.from({ length: 33 }, (_, i) => {
    const t = i / 32;
    return [1.2 * t, 0.25, curveOffset * Math.sin(2 * Math.PI * t)];
  });
  const albedo = proceduralTexture({ schemaVersion: 2, size: 128, usage: 'albedo',
    layers: [{ op: 'stripes', colorA: 0x8a4b24, colorB: 0xe4bc70, count: 16, angleDeg: 0 }] });
  createPart('CurvedRail', sweepProfile(profile, path, { up: [0, 1, 0] }),
    pbrMaterial({ albedo, roughness: 0.7, metalness: 0 }), { parent: root });
  return root;
}`,
      adaptations: [
        'Change curveOffset to its negative to mirror the path while preserving length and UV scale; changing length requires a separate texture-density decision.',
        'Replace stripes with a suitable authored or approved directional texture. Match its direction to these UV axes rather than assuming all textures use the same convention.',
        'Use an atlas when you need independent baked surface detail. Its arbitrary chart rotations are a different contract from continuous directional tiling.',
      ],
      checks: [
        'Check the exported TEXCOORD_0 and texture binding, then inspect that stripes follow the path rather than running across it.',
        'Compare UVs, texture bytes and retained parts after a shape edit. GPU appearance and structural dimensions are separate evidence.',
        'Verify the destination preserves texture direction, seams and cap treatment at useful viewing distances; a CPU geometry sheet cannot establish these.',
      ],
    },
  },
];

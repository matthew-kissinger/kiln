import type { DiscoveryEntry } from './catalog-schema';

type RecipeEntry = Extract<DiscoveryEntry, { kind: 'recipe' }>;

export const structuralRecipes: readonly RecipeEntry[] = [
  {
    version: 'kiln.catalog-entry.v1',
    id: 'recipe:structural-bays-v1',
    kind: 'recipe',
    name: 'Editable structural bays and openings',
    summary:
      'Compose any number of storeys from independently placed bays with real wall apertures and replaceable recessed glazing. Resize one bay without scaling its neighbors; the example leaves a clear ground-level entry.',
    family: 'structure',
    tags: ['facade', 'bay', 'opening', 'storey', 'local frame', 'replacement'],
    aliases: [
      'stack editable facade bays and openings',
      'multi-level wall',
      'recessed window',
      'modular architecture',
    ],
    intents: [
      'resize one structural bay',
      'replace window infill independently',
      'build an open facade without a house preset',
    ],
    stability: 'experimental',
    related: [
      { id: 'assembly:wallWithOpening', relation: 'prerequisite' },
      { id: 'recipe:editable-assembly-v1', relation: 'companion' },
    ],
    references: ['src/primitives.ts', 'docs/geometry.md'],
    limitations: [
      'A teaching facade, not a complete building, load-bearing design or navigation certificate. Add floors, access, returns and support only when requested.',
      'The clear entry is intentionally unfilled. Adding doors, plinths, trim or collision meshes can obstruct it; check the finished passage, not just the aperture parameters.',
      'Glazing is a core glTF transparency approximation. Review GPU appearance and the intended destination; this example has no textures or physical refraction.',
    ],
    recipe: {
      prerequisites: [
        'assembly:wallWithOpening',
        'operation:createRoot',
        'operation:createPart',
        'operation:boxGeo',
        'operation:glassMaterial',
      ],
      steps: [
        'Choose storey heights and bay widths from the brief. Put placement on each bay root; author its wall and infill in bay-local coordinates.',
        'Use one front-plane datum: this example faces +Z at Z=0, with the wall in -thickness..0. Position glazing and trim relative to that plane once, avoiding a second parent offset.',
        'Create an actual opening, then give its replaceable infill its own root. Keep an entry free of full-width plinths and unrelated decorations.',
        'For a width edit, rebuild affected dimensions and reposition neighboring roots. For an infill swap, retain its root and replace only its children.',
      ],
      example: `const meta = { name: 'StructuralBays' };
const centerWidth = 3;
const storeys = 6;
const replaceCenterFourth = false;
function build() {
  const root = createRoot(meta.name);
  const wallMaterial = gameMaterial('#a87a64');
  const frameMaterial = gameMaterial('#cad0ca');
  const glass = glassMaterial('#83b4c3', { opacity: 0.45 });
  const widths = [2.5, centerWidth, 2.5], height = 3, thickness = 0.3;
  const totalWidth = widths.reduce((sum, width) => sum + width, 0);
  function infill(group, name, width, tall, divided) {
    if (divided) {
      for (const side of [-1, 1]) createPart(name + '_Pane' + side,
        boxGeo((width - 0.12) / 2, tall - 0.08, 0.02), glass,
        { parent: group, position: [side * (width - 0.04) / 4, tall / 2, -0.18] });
      createPart(name + '_Divider', boxGeo(0.04, tall, 0.05), frameMaterial,
        { parent: group, position: [0, tall / 2, -0.16] });
    } else createPart(name + '_Pane', boxGeo(width - 0.08, tall - 0.08, 0.02), glass,
      { parent: group, position: [0, tall / 2, -0.18] });
  }
  for (let level = 1; level <= storeys; level++) {
    const floor = createRoot('Storey_' + level);
    floor.position.y = (level - 1) * height;
    root.add(floor);
    let left = -totalWidth / 2;
    for (let bayIndex = 0; bayIndex < widths.length; bayIndex++) {
      const width = widths[bayIndex], name = 'Bay_' + level + '_' + bayIndex;
      const bay = createRoot(name);
      bay.position.x = left + width / 2;
      floor.add(bay);
      left += width;
      const entry = level === 1 && bayIndex === 1;
      const apertureWidth = entry ? 1.4 : width * 0.5;
      const apertureHeight = entry ? 2.4 : 1.6, sill = entry ? 0 : 0.8;
      const wall = wallWithOpening(name + '_Wall', wallMaterial, {
        length: width, height, thickness, axis: 'x',
        opening: { kind: entry ? 'door' : 'window', width: apertureWidth, height: apertureHeight, sill },
        parent: bay
      });
      wall.position.z = -thickness / 2;
      // Surround is outside the aperture, so the declared entry remains clear.
      for (const side of [-1, 1]) createPart(name + '_Jamb' + side,
        boxGeo(0.08, apertureHeight, 0.12), frameMaterial,
        { parent: bay, position: [side * (apertureWidth / 2 + 0.04), sill + apertureHeight / 2, 0] });
      createPart(name + '_Lintel', boxGeo(apertureWidth + 0.16, 0.08, 0.12), frameMaterial,
        { parent: bay, position: [0, sill + apertureHeight + 0.04, 0] });
      if (!entry) {
        const glazing = createRoot('Glazing_' + level + '_' + bayIndex);
        glazing.position.y = sill;
        bay.add(glazing);
        infill(glazing, name, apertureWidth, apertureHeight, false);
        if (replaceCenterFourth && level === 4 && bayIndex === 1) {
          glazing.clear();
          infill(glazing, name, apertureWidth, apertureHeight, true);
        }
      }
    }
  }
  return root;
}`,
      adaptations: [
        'Change centerWidth or storeys; there is no category or two-floor restriction. Preserve outer detailing by moving the outer roots rather than scaling the whole facade.',
        'Set replaceCenterFourth=true to swap one infill. For a balcony or roof, use a separate attachment root and an explicit physical interface; check neighbor contact after replacement.',
        'Remove bays or combine this open wall with other structures freely. For repeated identical hierarchies, discover replicateAssembly and its explicit resource/identity policies.',
      ],
      checks: [
        'Measure exported bay widths, storey heights and final passage clearance including trim. A wall opening alone does not prove usable access.',
        'Confirm recessed glazing lies inside the intended wall depth in world space; a parent offset applies to every child.',
        'Compare retained geometry, hierarchy and world transforms after a local swap, including with a rotated/scaled ancestor.',
      ],
    },
  },
  {
    version: 'kiln.catalog-entry.v1',
    id: 'recipe:open-tiered-seating-v1',
    kind: 'recipe',
    name: 'Open tiered seating sectors',
    summary:
      'Build an open arena or amphitheater from separately editable stepped sectors, reserving an entrance before placing geometry. Each sector has a local placement root; no enclosing roof, house layout or floor-count policy is implied.',
    family: 'structure',
    tags: ['arena', 'amphitheater', 'seating', 'tiers', 'open structure', 'entrance'],
    aliases: ['open arena tiered seating entrance', 'coliseum seating', 'stadium terraces'],
    intents: [
      'keep a path into an open structure',
      'replace one seating sector',
      'build tiered environment geometry',
    ],
    stability: 'experimental',
    related: [
      { id: 'operation:extrudeProfile', relation: 'prerequisite' },
      { id: 'recipe:structural-bays-v1', relation: 'companion' },
    ],
    references: ['src/profile.ts', 'docs/geometry.md'],
    limitations: [
      'Faceted solid tier blocks are a layout scaffold, not individual seats, a circulation plan, structural engineering or a collision/navigation certificate.',
      'The reserved entrance stays open only if later walls, trim, platforms and collision geometry also respect it. Evaluate the complete asset and requested approach route.',
      'Adjacent sectors meet on matching radial planes; coarse sectors approximate circular arcs with chords. The independent solids are not Boolean-unioned.',
    ],
    recipe: {
      prerequisites: ['operation:extrudeProfile', 'operation:createRoot', 'operation:createPart'],
      steps: [
        'Reserve an entrance sector before generating tiers. Define inner radius, row depth/rise and the open angular interval explicitly.',
        'Give each seating sector a root at its inner-edge midpoint. Use sector-local profiles so placement is carried by the root instead of baked world coordinates.',
        'Extrude individual tier footprints from ground to their requested top height. Keep sectors and rows separately addressable for edits.',
        'Inspect the exported entrance with all neighboring geometry present, then verify sector seams and unchanged neighbors after a replacement or omission.',
      ],
      example: `const meta = { name: 'OpenTieredSeating' };
const omittedSector = -1;
async function build() {
  const root = createRoot(meta.name);
  const stone = gameMaterial('#a6947c');
  const innerRadius = 6, rowDepth = 0.8, rowRise = 0.4, rows = 4;
  const sectors = 20, entranceDegrees = 60;
  const span = (360 - entranceDegrees) / sectors;
  const half = span * Math.PI / 360;
  // extrudeProfile(axis:'y') maps profile (u,v) to world-local (X,-Z).
  function point(radius, angle) {
    return [radius * Math.cos(angle) - innerRadius, -radius * Math.sin(angle)];
  }
  for (let sector = 0; sector < sectors; sector++) {
    if (sector === omittedSector) continue;
    const angle = (entranceDegrees / 2 + (sector + 0.5) * span) * Math.PI / 180;
    const group = createRoot('Sector_' + sector);
    group.position.set(innerRadius * Math.cos(angle), 0, innerRadius * Math.sin(angle));
    group.rotation.y = -angle; // Object3D rotation is radians.
    root.add(group);
    for (let row = 0; row < rows; row++) {
      const near = innerRadius + row * rowDepth, far = near + rowDepth;
      const footprint = [point(near, -half), point(far, -half), point(far, half), point(near, half)];
      const geometry = await extrudeProfile(footprint, { axis: 'y', depth: (row + 1) * rowRise, center: false });
      createPart('Sector_' + sector + '_Tier_' + row, geometry, stone, { parent: group });
    }
  }
  return root;
}`,
      adaptations: [
        'Change rows, rise, radius or the open angle to fit the brief. For a larger arc budget use smaller sectors; do not add floors or a roof unless requested.',
        'Set omittedSector=6 to remove one complete sector while preserving its neighbors. Build replacement geometry beneath that same placement root to retain its interface.',
        'Use createStairs for a straight access flight where needed; seating rise is not automatically a walkable stair or accessibility ramp. Check approach clearance and destination collision separately.',
      ],
      checks: [
        'Trace the approach through the final exported asset near the ground and at the requested clearance height. Decorative or structural additions must not silently close it.',
        'Verify exported sector roots carry placement, tier top heights match requested rise and adjoining radial endpoints agree.',
        'Inspect the inside, outside and underside; independent solids and plausible silhouettes alone do not prove all navigation or material requirements.',
      ],
    },
  },
];

// A small textured structure: the kind of thing people actually generate.
//
// Three real PBR materials with bound Poly Haven albedo/normal/ARM maps — brick
// stone, weathered wood, painted iron. On the CPU rasterizer this reads as three
// flat greys; the texture and normal detail only exist in a GPU render.
const meta = { name: 'StoneWell', category: 'environment', role: 'poi' };

async function build() {
  const root = createRoot('StoneWell');

  const stone = await materialRecipe('kiln.material.stone.v1', {
    textureResources: {
      baseColor: 'kiln.texture.brick-wall-albedo.v1',
      normal: 'kiln.texture.brick-wall-normal.v1',
      metallicRoughness: 'kiln.texture.brick-wall-arm.v1',
    },
  });
  // Every material carries a full albedo/normal/ARM stack, deliberately. A flat
  // baseColor here would render as plastic next to the textured curb -- and it
  // would undercut the point the contact sheet is making, since half the asset
  // would show no material information even on the GPU.
  // No baseColor tint on the textured materials: the recipe multiplies the tint
  // into the albedo, so a dark brown here crushes the plank texture to near-black
  // in the flat orthographic cells. Let the map carry the colour.
  const wood = await materialRecipe('kiln.material.wood.v1', {
    textureResources: {
      baseColor: 'kiln.texture.weathered-planks-albedo.v1',
      normal: 'kiln.texture.weathered-planks-normal.v1',
      metallicRoughness: 'kiln.texture.weathered-planks-arm.v1',
    },
  });
  // Iron stays untextured on purpose. The rusted-metal stack was tried here and
  // read as a glowing red bar on a part this thin -- worse than the flat metal it
  // replaced. Not every surface needs a map; the material story is carried by the
  // stone and the planks, and forcing a texture onto the windlass hurt the sheet.
  const iron = await materialRecipe('kiln.material.painted-metal.v1', {
    baseColor: '#3f4348',
    roughness: 0.42,
    metalness: 0.9,
  });

  // Curb: a ring of blocks, so the brick texture wraps a real surface.
  const R = 0.72;
  const SEGMENTS = 16;
  for (let i = 0; i < SEGMENTS; i++) {
    const a = (i / SEGMENTS) * Math.PI * 2;
    const block = createPart(`Curb_${i}`, boxGeo(0.30, 0.46, 0.30), stone, {
      position: [Math.cos(a) * R, 0.23, Math.sin(a) * R],
      parent: root,
    });
    block.rotation.y = -a;
    boxUnwrap(block.geometry);
  }

  // Base course, slightly proud, so the curb reads as sitting on something.
  const base = createPart('Base', cylinderGeo(R + 0.20, R + 0.20, 0.10, 24), stone, {
    position: [0, 0.05, 0],
    parent: root,
  });
  cylinderUnwrap(base.geometry);

  // Posts and crossbeam.
  const POST = R + 0.02;
  for (const sz of [-1, 1]) {
    createPart(`Post_${sz > 0 ? 'R' : 'L'}`, boxGeo(0.13, 1.30, 0.13), wood, {
      position: [0, 1.11, sz * POST],
      parent: root,
    });
  }
  createPart('Beam', boxGeo(0.13, 0.13, 2 * POST + 0.13), wood, {
    position: [0, 1.82, 0],
    parent: root,
  });

  // Windlass drum and crank — the metal that flat shading cannot show. The drum
  // is long enough to seat INTO both posts; short of that the connectivity gate
  // correctly reports it as floating.
  const drum = createPart('Windlass', cylinderXGeo(0.09, 0.09, 2 * POST - 0.06, 16), iron, {
    position: [0, 1.60, 0],
    parent: root,
  });
  drum.rotation.y = Math.PI / 2;
  createPart('CrankArm', boxGeo(0.05, 0.26, 0.05), iron, {
    position: [0, 1.47, POST + 0.14],
    parent: root,
  });
  createPart('CrankHandle', cylinderXGeo(0.035, 0.035, 0.20, 12), iron, {
    position: [0, 1.34, POST + 0.22],
    parent: root,
  });

  // Roof.
  for (const sz of [-1, 1]) {
    const panel = createPart(`Roof_${sz > 0 ? 'R' : 'L'}`, boxGeo(1.05, 0.05, 0.86), wood, {
      position: [0, 2.02, sz * 0.40],
      parent: root,
    });
    panel.rotation.x = sz * 0.42;
  }

  return root;
}

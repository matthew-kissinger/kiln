// A Mark V standard diving helmet.
//
// The field gun is a study in booleans, the street lamp in revolved profiles.
// This one is about MATERIAL: a tinned-copper breastplate, a spun brass bonnet,
// four dark glass lights and a rubber neck gasket, all on one object at close
// range. It is the strongest CPU-versus-GPU comparison in the repository,
// because on the flat rasterizer the brass, the tin, the rubber and the glass
// collapse into a single white shape, and every one of those distinctions is
// exactly what a viewer uses to recognize the object.
//
// Orientation follows the Kiln contract: +X is forward, so the faceplate looks
// down +X, the shoulders sit on +/-Z, and the air inlet and telephone gland are
// on the back quarters.
//
// Three things the first pass got wrong, each of which generalizes.
//
// 1. The breastplate was a circular solid of revolution and read as a LAMPSHADE.
//    A corselet is beaten to fit a torso: wider across the shoulders than it is
//    front to back. One non-uniform scale on the finished mesh fixes it, and it
//    is the single largest change in the whole asset. A perfectly circular plan
//    is the loudest tell that something was revolved rather than shaped.
// 2. The bottom hem was a flat circle. A corselet rests ON the shoulders, so the
//    hem is scalloped. The scallop is cut with a boolean through the hem bead as
//    well as the shell, which is why the bead is part of the same profile rather
//    than a separate revolve laid over the top -- a bead added afterwards sits
//    across the scallop and hides the thing that was worth cutting.
// 3. The lights were clear glass over a solid brass bonnet, so every port
//    rendered as a brass disc with a ring around it. A port looks dark because
//    the inside of a helmet is dark. That is a MATERIAL fact, and it is far
//    cheaper to say it in the glass tint than to hollow the bonnet with four
//    more booleans to expose an interior nobody will ever otherwise see.
// 4. The breastplate rendered as a grey and white CHEQUERBOARD. Not a texture
//    problem: boolDiff flat-shades by default, flat shading splits every vertex,
//    and autoUnwrap therefore gave every quad its own atlas chart sampling an
//    unrelated patch of albedo. Passing { smooth: true } to the boolean fixed it
//    outright. Worth knowing before spending an hour on the noise layers, which
//    is what happened here.
//
// What still falls short: the corselet is a body of revolution, so its plan is
// an ellipse rather than a torso. A real breastplate is beaten, with a distinct
// chest and back panel and shoulders that are not on any conic section. Getting
// that would mean lofting or deforming a shell rather than revolving one, which
// is a different construction than the one this example exists to show.
const meta = { name: 'DivingHelmet', category: 'prop', role: 'poi' };

async function build() {
  const root = createRoot('DivingHelmet');
  const uv = (g) => autoUnwrap(g, { resolution: 1024 });

  // The corselet is beaten wider across the shoulders than front to back. Every
  // part that belongs to the breastplate is placed through these two factors so
  // the flange, the studs and the shell stay on one ellipse.
  const SX = 0.86, SZ = 1.08;

  // ---------- Materials ----------
  // Spun brass, warm and bright, with verdigris pushed into the low-frequency
  // noise so the crevices read green the way a hundred-year-old helmet does.
  const brassAlbedo = proceduralTexture({
    schemaVersion: 2, size: 1024, usage: 'albedo', name: 'HelmetBrass',
    // Fine grain, deliberately. Coarse procedural noise on an autoUnwrap atlas
    // does not read as weathering, it reads as a CHEQUERBOARD: each chart gets a
    // different slab of a low-frequency blob and the chart seams become visible
    // as tiles. Anything below about scale 12 on an atlassed surface will do it.
    layers: [
      { op: 'solid', color: 0xb5813f },
      { op: 'noise', colorA: 0xa0713a, colorB: 0xc9964e, scale: 44, octaves: 4, seed: 3, blend: 'overlay', opacity: 0.50 },
      { op: 'noise', colorA: 0x6a7a58, colorB: 0xb5813f, scale: 16, octaves: 3, seed: 21, blend: 'multiply', opacity: 0.15 },
    ],
  });
  const brass = pbrMaterial({
    albedo: brassAlbedo, normal: normalMapFromHeight(brassAlbedo, { strength: 2.2 }),
    roughness: 0.30, metalness: 0.92,
  });

  // Tinned copper for the breastplate: the same metal under a lead-tin coat, so
  // it is cooler and duller than the bonnet without being a different substance.
  // The contrast is the point -- two metals a flat render cannot tell apart.
  const tinAlbedo = proceduralTexture({
    schemaVersion: 2, size: 512, usage: 'albedo', name: 'TinnedCopper',
    layers: [
      { op: 'solid', color: 0x9c9086 },
      { op: 'noise', colorA: 0x8a8078, colorB: 0xb0a69a, scale: 48, octaves: 4, seed: 11, blend: 'overlay', opacity: 0.55 },
      { op: 'noise', colorA: 0x7e766c, colorB: 0x9c9086, scale: 18, octaves: 3, seed: 29, blend: 'multiply', opacity: 0.18 },
    ],
  });
  // Warm grey, not cold. A cold grey plate under a copper bonnet separates into
  // two objects -- a lampshade with a ball on it -- because nothing in the scene
  // says they are the same metal. Tin over copper is warm, and that one shift is
  // what makes the breastplate and the bonnet read as one helmet.
  const tinned = pbrMaterial({
    albedo: tinAlbedo, normal: normalMapFromHeight(tinAlbedo, { strength: 1.2 }),
    roughness: 0.52, metalness: 0.68,
  });

  // Rubber for the neck gasket and the telephone boot. Dielectric, and dark
  // WITHOUT being metallic, which is the distinction that turns a dark part into
  // a black mirror when it is got wrong.
  const rubber = gameMaterial(0x1d1b19, { roughness: 0.88, metalness: 0.0 });
  // Dark glass, because the inside of a helmet is dark. See the header.
  const glass = glassMaterial(0x18262b, { opacity: 0.62, roughness: 0.05, metalness: 0 });

  // ---------- Breastplate ----------
  // One profile carries the shell, the rolled hem bead and the chest rib, so the
  // shoulder boolean cuts through all three together.
  const corseletSolid = new THREE.Mesh(await revolveProfile([
    // The hem bead and the chest rib are big steps on purpose. Smooth shading
    // averages a normal across the whole step, so a 12 mm bead that read clearly
    // under flat shading disappears into the curve once the shell is smoothed.
    // A feature that has to survive smoothing has to be built proud enough to.
    [0.000, 0.000], [0.222, 0.000], [0.246, 0.013], [0.248, 0.031],
    [0.230, 0.047], [0.218, 0.060], [0.208, 0.090], [0.228, 0.100],
    [0.228, 0.117], [0.204, 0.129], [0.190, 0.150], [0.178, 0.164],
    [0.176, 0.178], [0.140, 0.184], [0.128, 0.194], [0.126, 0.206],
    [0.000, 0.206],
  ], { segments: 64, axis: 'y', smooth: true }), tinned);

  // Two cylinders lying along X take a curved bite out of the hem exactly where
  // the shoulders go. The geometry here is worth being explicit about, because
  // the first attempt sat the cutters at radius 0.238 with radius 0.132 and they
  // removed EVERYTHING from z = 0.11 outward below y = 0.07 -- not a scallop but
  // an undercut, and the helmet read as a lampshade on a stand. A cutter tangent
  // to the hem removes a lens, and the lens is the scallop:
  //
  //   removal height h(z) = sqrt(R^2 - (z - Zc)^2) - c
  //
  // with Zc on the hem edge, R - c the rise at that edge, and the zero crossing
  // where the scallop should die out. R = 0.162, c = 0.117 gives a 45 mm rise at
  // z = 0.222 falling to nothing by z = 0.11.
  const shoulderCutters = [-1, 1].map((sz) => {
    const c = new THREE.Mesh(cylinderXGeo(0.162, 0.162, 1.10, 40), tinned);
    c.position.set(0, -0.117, sz * 0.222);
    return c;
  });
  // smooth: true is not cosmetic here, it is the fix for a chequerboard.
  // boolDiff defaults to FLAT shading for sharp mechanical edges, which splits
  // every vertex; autoUnwrap then cannot merge faces into charts, so each quad
  // becomes its own island and samples an unrelated patch of the albedo. On a
  // large curved metal shell that renders as literal grey and white TILES. Any
  // atlassed boolean result that is meant to read as one continuous surface
  // wants smooth: true.
  const corselet = await boolDiff('Corselet', corseletSolid, ...shoulderCutters, { smooth: true });
  corselet.name = 'Corselet';
  corselet.geometry = await uv(corselet.geometry);
  corselet.scale.set(SX, 1, SZ);
  root.add(corselet);

  // The four beckets the 40 lb front and back weights hung from. Placed on the
  // ellipse rather than on a circle, so they sit flush against the plate on all
  // four quarters instead of floating on two of them.
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const z = sz * 0.050;
      const xEllipse = 0.216 * SX * Math.sqrt(Math.max(0, 1 - (z / (0.216 * SZ)) ** 2));
      createPart(`Becket_${sx > 0 ? 'F' : 'B'}${sz > 0 ? 'R' : 'L'}`, torusGeo(0.018, 0.006, 8, 18), brass, {
        position: [sx * (xEllipse - 0.006), 0.106, z], parent: root,
      });
    }
  }

  // ---------- Neck ring and brail studs ----------
  // The bonnet does not bolt on: it drops onto an interrupted thread and locks
  // with an eighth of a turn. The twelve studs around the flange are the brail
  // bolts that clamped the diver's dress into the joint, and they follow the
  // same ellipse as the flange they stand on.
  createPart('NeckRing', await uv(await revolveProfile([
    [0.000, 0.198], [0.126, 0.198], [0.140, 0.210], [0.140, 0.232],
    [0.126, 0.242], [0.000, 0.242],
  ], { segments: 48, axis: 'y', bevel: 0.004 })), brass, { parent: root });

  createPart('NeckGasket', torusGeo(0.133, 0.012, 10, 40), rubber, { position: [0, 0.204, 0], parent: root });

  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const cx = Math.cos(a) * 0.152 * SX, cz = Math.sin(a) * 0.152 * SZ;
    createPart(`BrailStud_${i}`, cylinderGeo(0.011, 0.013, 0.042, 10), brass, {
      position: [cx, 0.182, cz], parent: root,
    });
    // The wing nut, oriented so its ears lie along the flange rather than
    // pointing in twelve arbitrary directions.
    const nut = createPart(`BrailNut_${i}`, boxGeo(0.036, 0.011, 0.013), brass, {
      position: [cx, 0.206, cz], parent: root,
    });
    nut.rotation.y = -a;
    createPart(`BrailNutBoss_${i}`, cylinderGeo(0.011, 0.011, 0.016, 8), brass, {
      position: [cx, 0.208, cz], parent: root,
    });
  }

  // ---------- Bonnet ----------
  // Spun, not moulded: the profile swells to its widest just above the face port
  // and then falls away in a continuous curve to the crown. A hemisphere sitting
  // on a cylinder is what this looks like when it is done wrong.
  createPart('Bonnet', await uv(await revolveProfile([
    [0.000, 0.230], [0.146, 0.230], [0.160, 0.256], [0.168, 0.294],
    [0.170, 0.336], [0.164, 0.382], [0.148, 0.428], [0.120, 0.470],
    [0.074, 0.502], [0.000, 0.516],
  ], { segments: 48, axis: 'y', smooth: true })), brass, { parent: root });

  // The seam where the two spinnings were brazed, and the rivet line on it.
  createPart('BonnetSeam', await uv(await revolveProfile([
    [0.000, 0.296], [0.168, 0.296], [0.179, 0.304], [0.179, 0.318],
    [0.168, 0.326], [0.000, 0.326],
  ], { segments: 48, axis: 'y', bevel: 0.003 })), brass, { parent: root });

  const rivet = createPart('Rivet0', sphereGeo(0.0085, 8, 6), brass, { position: [0.179, 0.311, 0], parent: root });
  arrayRadial('Rivet', rivet, 24, 'y', root);

  // ---------- Lights ----------
  // Four of them: the big face port on +X, one on each shoulder, and the top
  // light canted forward so the diver could look up. Each is a boss, a threaded
  // retaining ring, and glass set BEHIND the ring rather than flush with it --
  // the inset is what makes it read as a port instead of a painted circle.
  const port = (name, pos, axis, bossR, glassR, ringR, depth) => {
    const geoBoss = axis === 'x' ? cylinderXGeo(bossR, bossR, depth, 32)
      : axis === 'z' ? cylinderZGeo(bossR, bossR, depth, 28)
        : cylinderGeo(bossR, bossR, depth, 28);
    const geoGlass = axis === 'x' ? cylinderXGeo(glassR, glassR, 0.010, 32)
      : axis === 'z' ? cylinderZGeo(glassR, glassR, 0.008, 28)
        : cylinderGeo(glassR, glassR, 0.008, 28);
    // torusGeo lies in the XY plane with its hole on Z, so a port facing +X
    // needs a quarter turn about Y and one facing +Y a quarter turn about X.
    const ringRot = axis === 'x' ? [0, 90, 0] : axis === 'z' ? [0, 0, 0] : [90, 0, 0];
    const out = axis === 'x' ? [1, 0, 0] : axis === 'z' ? [0, 0, 1] : [0, 1, 0];
    const at = (d) => [pos[0] + out[0] * d, pos[1] + out[1] * d, pos[2] + out[2] * d];
    createPart(`${name}Boss`, geoBoss, brass, { position: pos, parent: root });
    createPart(`${name}Glass`, geoGlass, glass, { position: at(depth * 0.34), parent: root });
    createPart(`${name}Ring`, torusGeo(ringR, 0.012, 10, 32), brass, {
      position: at(depth * 0.52), rotation: ringRot, parent: root,
    });
  };

  port('FacePort', [0.166, 0.336, 0], 'x', 0.078, 0.067, 0.074, 0.054);
  port('PortLightR', [0, 0.352, 0.158], 'z', 0.050, 0.042, 0.047, 0.044);
  port('PortLightL', [0, 0.352, -0.158], 'z', 0.050, 0.042, 0.047, 0.044);
  port('TopLight', [0.048, 0.490, 0], 'y', 0.048, 0.040, 0.045, 0.044);

  // The face guard: a hinged brass cage over the front light, three bars in a
  // ring. Each bar length is derived from the ring radius, so the bars land ON
  // the ring instead of floating in front of the glass, which is where guessed
  // heights always put them.
  const GUARD_X = 0.200, GUARD_Y = 0.336, GUARD_R = 0.080;
  createPart('FaceGuardRing', torusGeo(GUARD_R, 0.008, 8, 32), brass, {
    position: [GUARD_X, GUARD_Y, 0], rotation: [0, 90, 0], parent: root,
  });
  [-0.045, 0, 0.045].forEach((z, i) => {
    const h = Math.sqrt(GUARD_R * GUARD_R - z * z);
    beamBetween(`FaceGuardBar_${i}`,
      [GUARD_X, GUARD_Y - h, z], [GUARD_X, GUARD_Y + h, z], 0.0055, brass, { parent: root });
  });

  // ---------- Fittings ----------
  // Air inlet on the back right: stub off the bonnet, elbow, riser, and the
  // non-return valve body that stopped the diver's air from siphoning back out
  // if the surface hose parted. Nothing about this helmet is decorative.
  beamBetween('AirInletStub', [-0.110, 0.296, 0.092], [-0.180, 0.314, 0.148], 0.022, brass, { parent: root });
  createPart('AirInletElbow', sphereGeo(0.027, 14, 10), brass, { position: [-0.186, 0.318, 0.154], parent: root });
  beamBetween('AirInletRiser', [-0.186, 0.318, 0.154], [-0.186, 0.402, 0.154], 0.019, brass, { parent: root });
  createPart('NonReturnBody', await uv(await roundedBoxGeo(0.052, 0.050, 0.046, 0.008)), brass, {
    position: [-0.186, 0.370, 0.154], parent: root,
  });
  createPart('AirInletCap', cylinderGeo(0.025, 0.020, 0.030, 14), brass, { position: [-0.186, 0.416, 0.154], parent: root });

  // Exhaust valve on the FRONT right cheek, with the knurled knob the diver
  // butted with his chin to vent. It started life on the back quarter at the
  // same height as the shoulder light, where the two merged into one lump from
  // every side view: a fitting has to be readable against its neighbours, not
  // merely correctly placed.
  beamBetween('ExhaustBody', [0.092, 0.266, 0.092], [0.142, 0.260, 0.142], 0.026, brass, { parent: root });
  createPart('ExhaustKnob', sphereGeo(0.032, 14, 10), brass, { position: [0.153, 0.258, 0.153], parent: root });
  createPart('ExhaustKnurl', torusGeo(0.032, 0.008, 8, 20), brass, {
    position: [0.153, 0.258, 0.153], rotation: [0, 45, 0], parent: root,
  });

  // Telephone gland on the back left, where the comms line entered.
  createPart('CommsGland', cylinderXGeo(0.026, 0.026, 0.058, 16), brass, { position: [-0.174, 0.290, -0.058], parent: root });
  createPart('CommsCap', cylinderXGeo(0.019, 0.030, 0.024, 16), brass, { position: [-0.210, 0.290, -0.058], parent: root });
  createPart('CommsBoot', cylinderXGeo(0.015, 0.019, 0.036, 12), rubber, { position: [-0.238, 0.290, -0.058], parent: root });

  return root;
}

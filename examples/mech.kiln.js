// A reverse-jointed industrial walker.
//
// Every other hero in this repository is a thing that exists, and the reference
// does the arguing. A mech has no reference photograph, so the only thing
// holding it together is INTERNAL CONSISTENCY: the joints have to be joints, the
// pistons have to shorten when the leg folds, the armour has to be panels with
// edges and fasteners rather than a shrink-wrap, and every plate has to look
// like it was bolted on by someone who could reach it.
//
// The technique this file exists for is orienting flat armour along a bone.
// beamBetween will run a cylinder between any two points, which is why limbs
// built from it read as pipe-cleaners. A mech needs flat plate, and a box only
// aligns to a bone if you rotate it. Both legs lie in a plane of constant Z, so
// the whole rotation collapses to one angle about Z:
//
//   rotZ = -atan2(dx, dy)
//
// measured from +Y, which is the axis a box's height runs along. That one line
// is what lets armour, hydraulics and hardpoints all be placed by naming two
// joint positions instead of by guessing Euler triples.
//
// Authored by: Claude Opus 5, via Claude Code. Every part below was written by the model itself,
// looking at its own renders through the Kiln tools and revising.
const meta = { name: 'Walker', category: 'vehicle', role: 'hero' };

async function build() {
  const root = createRoot('Walker');
  const uv = (g) => autoUnwrap(g, { resolution: 1024 });
  const D = Math.PI / 180;

  // ---------- Bone maths ----------
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const boneRot = (a, b) => -Math.atan2(b[0] - a[0], b[1] - a[1]) / D;
  // Point a fraction f along a bone, for hanging hardpoints off it.
  const along = (a, b, f) => [0, 1, 2].map((k) => a[k] + (b[k] - a[k]) * f);

  // ---------- Materials ----------
  const armorAlbedo = proceduralTexture({
    schemaVersion: 2, size: 1024, usage: 'albedo', name: 'ArmorPlate',
    layers: [
      { op: 'solid', color: 0x55604f },
      { op: 'noise', colorA: 0x424c3e, colorB: 0x6f7b67, scale: 40, octaves: 4, seed: 5, blend: 'overlay', opacity: 0.50 },
      { op: 'noise', colorA: 0x38402f, colorB: 0x55604f, scale: 14, octaves: 3, seed: 23, blend: 'multiply', opacity: 0.14 },
    ],
  });
  // Painted plate over armour steel. Paint is a DIELECTRIC: at high metalness
  // this whole machine becomes a dark mirror and every panel edge disappears.
  const armor = pbrMaterial({
    albedo: armorAlbedo, normal: normalMapFromHeight(armorAlbedo, { strength: 1.6 }),
    roughness: 0.52, metalness: 0.15,
  });

  const steelAlbedo = proceduralTexture({
    schemaVersion: 2, size: 512, usage: 'albedo', name: 'MachinedSteel',
    layers: [
      { op: 'solid', color: 0x8d939a },
      { op: 'noise', colorA: 0x767c83, colorB: 0xacb2b9, scale: 44, octaves: 3, seed: 11, blend: 'overlay', opacity: 0.50 },
    ],
  });
  // Bare machined steel: rams, joint pins, the gun. This is the material that
  // says which parts move.
  const steel = pbrMaterial({
    albedo: steelAlbedo, normal: normalMapFromHeight(steelAlbedo, { strength: 1.0 }),
    roughness: 0.28, metalness: 0.94,
  });

  // Caution striping, on the pelvis and the pod cover -- the two places a crew
  // chief would actually put it, because they are the two things that swing.
  const hazardAlbedo = proceduralTexture({
    schemaVersion: 2, size: 512, usage: 'albedo', name: 'Hazard',
    layers: [
      { op: 'stripes', colorA: 0xd6a11c, colorB: 0x1f1e1b, count: 7, angleDeg: 45 },
      { op: 'noise', colorA: 0x3a3830, colorB: 0xbcbcb2, scale: 30, octaves: 4, seed: 31, blend: 'overlay', opacity: 0.35 },
    ],
  });
  const hazard = pbrMaterial({
    albedo: hazardAlbedo, normal: normalMapFromHeight(hazardAlbedo, { strength: 1.2 }),
    roughness: 0.58, metalness: 0.10,
  });

  // A second, darker armour value. One paint colour over a five-metre machine
  // flattens it: every plate reads at the same tone and the silhouette does all
  // the work alone. Real vehicles are repainted in panels and the lower legs are
  // the parts that get scuffed and resprayed, so darkening those separates the
  // legs from the torso without inventing a fantasy colour.
  const armorDarkAlbedo = proceduralTexture({
    schemaVersion: 2, size: 1024, usage: 'albedo', name: 'ArmorPlateDark',
    layers: [
      { op: 'solid', color: 0x454f3a },
      { op: 'noise', colorA: 0x363f2c, colorB: 0x5a664f, scale: 40, octaves: 4, seed: 5, blend: 'overlay', opacity: 0.50 },
      { op: 'noise', colorA: 0x2c3323, colorB: 0x454f3a, scale: 14, octaves: 3, seed: 23, blend: 'multiply', opacity: 0.16 },
    ],
  });
  const armorDark = pbrMaterial({
    albedo: armorDarkAlbedo, normal: normalMapFromHeight(armorDarkAlbedo, { strength: 1.6 }),
    roughness: 0.54, metalness: 0.15,
  });

  const hose = gameMaterial(0x17171a, { roughness: 0.90, metalness: 0.0 });
  const canopy = glassMaterial(0x2b4f56, { opacity: 0.52, roughness: 0.05, metalness: 0 });
  const glow = gameMaterial(0x9ff0ff, { emissive: 0x3ad6ee, emissiveIntensity: 3.2, roughness: 0.40 });

  // ---------- Helpers ----------
  const plate = async (name, w, h, d, r, position, opts = {}) =>
    createPart(name, await uv(await roundedBoxGeo(w, h, d, r)), opts.mat ?? armor, {
      position, rotation: opts.rotation, parent: opts.parent ?? root,
    });

  // Armour laid ALONG a bone: sized to the bone length, centred on it, and
  // turned by the single Z angle derived above.
  const boneArmor = async (name, a, b, w, d, r, grow = 0.0, mat = armor) =>
    plate(name, w, dist(a, b) + grow, d, r, mid(a, b), { rotation: [0, 0, boneRot(a, b)], mat });

  // A ring of fasteners around a panel edge. Bolts are the cheapest thing in the
  // asset and they are most of what separates armour from a beveled cube.
  const boltRow = (name, from, to, count, r = 0.024) => {
    for (let i = 0; i < count; i++) {
      const f = count === 1 ? 0.5 : i / (count - 1);
      createPart(`${name}_${i}`, sphereGeo(r, 8, 6), steel, {
        position: [0, 1, 2].map((k) => from[k] + (to[k] - from[k]) * f), parent: root,
      });
    }
  };

  // ---------- Legs ----------
  // Digitigrade: the knee breaks FORWARD and high, the shin sweeps back, and the
  // ankle sits over the middle of a long foot. A mech with human knees reads as
  // a person in a costume.
  for (const sz of [-1, 1]) {
    const side = sz > 0 ? 'R' : 'L';
    const HIP = [0.00, 2.58, sz * 0.44];
    const KNEE = [0.48, 1.66, sz * 0.48];
    const ANKLE = [-0.04, 0.56, sz * 0.46];

    // Thigh: a steel ram inside a two-piece armour shell.
    beamBetween(`ThighRam_${side}`, HIP, KNEE, 0.085, steel, { parent: root });
    await boneArmor(`ThighPlate_${side}`, HIP, KNEE, 0.30, 0.40, 0.045, -0.18);
    await boneArmor(`ThighShoulder_${side}`, HIP, along(HIP, KNEE, 0.34), 0.38, 0.48, 0.06, 0.0);

    // Knee: a real pin joint, and an armour cap over it so the pin is not the
    // outermost thing on the leg.
    createPart(`KneePin_${side}`, cylinderZGeo(0.155, 0.155, 0.46, 20), steel, { position: KNEE, parent: root });
    await plate(`KneeCap_${side}`, 0.34, 0.36, 0.20, 0.05, [KNEE[0] + 0.10, KNEE[1] + 0.02, KNEE[2] + sz * 0.28], {
      rotation: [0, 0, -18], mat: armorDark,
    });

    // Shin. Darker paint below the knee, so the leg separates from the torso.
    beamBetween(`ShinRam_${side}`, KNEE, ANKLE, 0.075, steel, { parent: root });
    await boneArmor(`ShinPlate_${side}`, KNEE, ANKLE, 0.28, 0.42, 0.045, -0.16, armorDark);
    await boneArmor(`ShinGuard_${side}`, along(KNEE, ANKLE, 0.10), along(KNEE, ANKLE, 0.62), 0.16, 0.50, 0.04, 0.0, armorDark);

    // Hydraulics. Each is a sleeve on the fixed half and a bright rod on the
    // moving half, offset OUTBOARD of the armour so it is visible -- a piston
    // buried inside a limb is triangles nobody will ever see.
    const hipAnchor = [HIP[0] - 0.20, HIP[1] - 0.10, HIP[2] + sz * 0.34];
    const thighMid = along(HIP, KNEE, 0.58);
    const thighRamEnd = [thighMid[0] - 0.10, thighMid[1], thighMid[2] + sz * 0.34];
    beamBetween(`ThighPistonRod_${side}`, hipAnchor, thighRamEnd, 0.038, steel, { parent: root });
    await boneArmor(`ThighPistonBody_${side}`, hipAnchor, mid(hipAnchor, thighRamEnd), 0.10, 0.10, 0.03, 0.0, steel);

    const kneeAnchor = [KNEE[0] + 0.06, KNEE[1] - 0.14, KNEE[2] + sz * 0.36];
    const ankleAnchor = [ANKLE[0] + 0.02, ANKLE[1] + 0.16, ANKLE[2] + sz * 0.34];
    beamBetween(`ShinPistonRod_${side}`, kneeAnchor, ankleAnchor, 0.034, steel, { parent: root });
    await boneArmor(`ShinPistonBody_${side}`, kneeAnchor, mid(kneeAnchor, ankleAnchor), 0.09, 0.09, 0.028, 0.0, steel);

    // Hydraulic lines, sagging the way a hose does rather than running straight.
    const hosePath = bezierCurve([
      [HIP[0] - 0.28, HIP[1] - 0.16, HIP[2] + sz * 0.10],
      [KNEE[0] - 0.34, KNEE[1] + 0.42, KNEE[2] + sz * 0.06],
      [KNEE[0] - 0.10, KNEE[1] - 0.10, KNEE[2] + sz * 0.02],
      [ANKLE[0] - 0.10, ANKLE[1] + 0.20, ANKLE[2] + sz * 0.04],
    ], 26);
    createPart(`HydraulicLine_${side}`, curveToMesh(hosePath, 0.030, 26, 8), hose, { parent: root });

    // Ankle and foot. The foot is an extruded wedge, not a box: a walker that
    // carries eight tonnes needs a long toe and a heel spur, and the plan shape
    // is the only thing selling the weight.
    createPart(`AnklePin_${side}`, cylinderZGeo(0.125, 0.125, 0.40, 18), steel, {
      position: [ANKLE[0], ANKLE[1] - 0.06, ANKLE[2]], parent: root,
    });
    const footOutline = [
      [0.62, 0.00], [0.52, 0.19], [0.24, 0.27], [-0.16, 0.26],
      [-0.42, 0.17], [-0.46, 0.00], [-0.42, -0.17], [-0.16, -0.26],
      [0.24, -0.27], [0.52, -0.19],
    ];
    createPart(`Foot_${side}`, await uv(await extrudeProfile(footOutline, {
      depth: 0.28, axis: 'y', bevel: 0.035,
    })), armor, { position: [ANKLE[0] + 0.06, 0.14, ANKLE[2]], parent: root });
    // The ankle pin has to actually REACH the foot. Left as a pin floating over a
    // deck, the leg reads as two disconnected props -- the single most damaging
    // error in the first render. A real walker carries the load through a clevis:
    // two cheek plates straddling the pin, bolted down onto the foot deck.
    for (const cz of [-1, 1]) {
      await plate(`AnkleClevis_${side}${cz > 0 ? 'A' : 'B'}`, 0.34, 0.36, 0.07, 0.030,
        [ANKLE[0] + 0.01, 0.45, ANKLE[2] + cz * 0.185], { mat: steel });
    }
    // Load-bearing column down the middle, so the joint is not just two fins.
    beamBetween(`AnkleColumn_${side}`, [ANKLE[0], ANKLE[1] - 0.06, ANKLE[2]],
      [ANKLE[0] + 0.04, 0.26, ANKLE[2]], 0.105, steel, { parent: root });
    // Toe claws.
    for (const tz of [-1, 0, 1]) {
      createPart(`Toe_${side}${tz + 1}`, await uv(await roundedBoxGeo(0.26, 0.12, 0.17, 0.030)), steel, {
        position: [ANKLE[0] + 0.72, 0.075, ANKLE[2] + tz * 0.20], parent: root,
      });
    }
    createPart(`HeelSpur_${side}`, await uv(await roundedBoxGeo(0.20, 0.14, 0.26, 0.035)), steel, {
      position: [ANKLE[0] - 0.50, 0.085, ANKLE[2]], parent: root,
    });

    // Hip actuator housing.
    createPart(`HipPin_${side}`, cylinderZGeo(0.185, 0.185, 0.30, 20), steel, {
      position: [HIP[0], HIP[1], HIP[2] + sz * 0.06], parent: root,
    });
    await plate(`HipHousing_${side}`, 0.52, 0.50, 0.26, 0.06, [HIP[0], HIP[1], HIP[2] + sz * 0.20]);
  }

  // ---------- Pelvis and waist ----------
  await plate('Pelvis', 0.92, 0.62, 1.06, 0.09, [0, 2.62, 0]);
  // The caution panel goes on the swinging cover, not on a random flat.
  await plate('PelvisCover', 0.10, 0.40, 0.72, 0.03, [0.50, 2.56, 0], { mat: hazard });
  boltRow('PelvisBolt', [0.48, 2.80, -0.40], [0.48, 2.80, 0.40], 5);
  createPart('WaistRing', cylinderGeo(0.34, 0.34, 0.26, 24), steel, { position: [0, 3.03, 0], parent: root });
  createPart('WaistCollar', torusGeo(0.36, 0.045, 8, 28), steel, { position: [0, 3.14, 0], parent: root });

  // ---------- Torso ----------
  await plate('Torso', 1.02, 0.98, 1.26, 0.10, [0.02, 3.60, 0]);
  // Sloped glacis over the chest, because a flat vertical front is the one thing
  // no armoured machine has ever had.
  await plate('Glacis', 0.24, 0.86, 1.16, 0.05, [0.50, 3.62, 0], { rotation: [0, 0, 16] });
  boltRow('GlacisBoltT', [0.60, 3.98, -0.48], [0.60, 3.98, 0.48], 7, 0.022);
  boltRow('GlacisBoltB', [0.56, 3.24, -0.48], [0.56, 3.24, 0.48], 7, 0.022);

  // Reactor and heat sink on the back, with real fins.
  await plate('ReactorHousing', 0.44, 0.80, 0.98, 0.07, [-0.66, 3.58, 0]);
  for (let i = 0; i < 9; i++) {
    createPart(`HeatFin_${i}`, await uv(await roundedBoxGeo(0.16, 0.62, 0.05, 0.012)), steel, {
      position: [-0.90, 3.58, -0.40 + i * 0.10], parent: root,
    });
  }
  createPart('ReactorGlow', await uv(await roundedBoxGeo(0.06, 0.44, 0.72, 0.02)), glow, {
    position: [-0.86, 3.58, 0], parent: root,
  });

  // ---------- Cockpit ----------
  // The canopy is a real inset: frame first, glass behind it. Glass flush with
  // the hull reads as a painted rectangle.
  await plate('CanopyFrame', 0.14, 0.60, 0.86, 0.04, [0.62, 3.70, 0], { rotation: [0, 0, 16] });
  createPart('Canopy', await uv(await roundedBoxGeo(0.09, 0.48, 0.74, 0.03)), canopy, {
    position: [0.64, 3.70, 0], rotation: [0, 0, 16], parent: root,
  });
  createPart('CockpitGlow', await uv(await roundedBoxGeo(0.03, 0.30, 0.56, 0.01)), glow, {
    position: [0.55, 3.68, 0], rotation: [0, 0, 16], parent: root,
  });
  // Grab handle and the step a pilot uses to get in. Somebody has to board this.
  beamBetween('BoardingHandle', [0.66, 3.24, 0.44], [0.66, 3.06, 0.44], 0.022, steel, { parent: root });
  createPart('BoardingStep', await uv(await roundedBoxGeo(0.22, 0.06, 0.30, 0.02)), steel, {
    position: [0.56, 2.90, 0.44], parent: root,
  });

  // ---------- Sensor head ----------
  await plate('SensorHead', 0.52, 0.34, 0.72, 0.07, [0.16, 4.28, 0]);
  createPart('SensorNeck', cylinderGeo(0.14, 0.16, 0.20, 16), steel, { position: [0.16, 4.10, 0], parent: root });
  createPart('EyeSlit', await uv(await roundedBoxGeo(0.05, 0.10, 0.54, 0.02)), glow, {
    position: [0.43, 4.28, 0], parent: root,
  });
  await plate('EyeBrow', 0.16, 0.09, 0.62, 0.02, [0.40, 4.40, 0], { rotation: [0, 0, 22] });
  for (const sz of [-1, 1]) {
    beamBetween(`Antenna_${sz > 0 ? 'R' : 'L'}`,
      [-0.02, 4.42, sz * 0.26], [-0.16, 5.02, sz * 0.36], 0.014, steel, { parent: root });
    createPart(`AntennaTip_${sz > 0 ? 'R' : 'L'}`, sphereGeo(0.032, 10, 8), glow, {
      position: [-0.16, 5.02, sz * 0.36], parent: root,
    });
  }

  // ---------- Shoulders ----------
  for (const sz of [-1, 1]) {
    const side = sz > 0 ? 'R' : 'L';
    createPart(`ShoulderPin_${side}`, cylinderZGeo(0.20, 0.20, 0.34, 20), steel, {
      position: [0.04, 3.74, sz * 0.74], parent: root,
    });
    await plate(`Pauldron_${side}`, 0.78, 0.62, 0.38, 0.10, [0.04, 3.86, sz * 0.94], { rotation: [0, 0, -8] });
    boltRow(`PauldronBolt${side}`, [-0.26, 4.10, sz * 0.94], [0.30, 4.10, sz * 0.94], 4, 0.022);
  }

  // ---------- Right arm: autocannon ----------
  {
    const SH = [0.04, 3.66, 0.80];
    const ELBOW = [0.20, 2.98, 0.92];
    beamBetween('UpperArmRamR', SH, ELBOW, 0.085, steel, { parent: root });
    await boneArmor('UpperArmPlateR', SH, ELBOW, 0.30, 0.34, 0.05, -0.14);
    createPart('ElbowPinR', cylinderZGeo(0.135, 0.135, 0.34, 18), steel, { position: ELBOW, parent: root });

    await plate('GunBody', 0.92, 0.40, 0.38, 0.06, [0.58, 2.92, 0.92]);
    await plate('GunReceiver', 0.36, 0.30, 0.44, 0.05, [0.24, 2.92, 0.92], { mat: steel });
    // A bored barrel, not a rod with a dark cap on the end. The bore is a real
    // boolean, so it survives being looked at down the muzzle.
    // First pass made this too thin and it read as a grey pipe. A cannon that
    // fires something worth mounting on an eight-tonne chassis has a barrel you
    // can see from the side, so every radius here went up by about half.
    const barrelSolid = new THREE.Mesh(await revolveProfile([
      [0.000, 1.02], [0.155, 1.02], [0.146, 1.16], [0.112, 1.30],
      [0.106, 1.72], [0.132, 1.76], [0.132, 1.90], [0.000, 1.90],
    ], { segments: 32, axis: 'x', smooth: true }), steel);
    const bore = new THREE.Mesh(cylinderXGeo(0.062, 0.062, 1.10, 20), steel);
    bore.position.set(1.46, 0, 0);
    const barrel = await boolDiff('Barrel', barrelSolid, bore, { smooth: true });
    barrel.name = 'Barrel';
    barrel.geometry = await uv(barrel.geometry);
    barrel.position.set(0, 2.92, 0.92);
    root.add(barrel);
    // Vented cooling shroud. The ring of slots down the jacket is the detail
    // that actually says "autocannon" rather than "tube", and stacked rings
    // cost far less than boring twenty real holes through the barrel.
    for (let s = 0; s < 5; s++) {
      const sx = 1.16 + s * 0.105;
      createPart(`ShroudRing_${s}`, torusGeo(0.132, 0.020, 8, 20), steel, {
        position: [sx, 2.92, 0.92], rotation: [0, 90, 0], parent: root,
      });
    }
    // Muzzle brake ports.
    for (const bz of [-1, 1]) {
      createPart(`MuzzlePort_${bz > 0 ? 'R' : 'L'}`, await uv(await roundedBoxGeo(0.11, 0.06, 0.05, 0.014)), steel, {
        position: [1.84, 2.92, 0.92 + bz * 0.115], parent: root,
      });
    }
    // Ammo feed from the torso, as a chain of links rather than one grey tube.
    const feed = bezierCurve([
      [-0.10, 3.30, 0.62], [0.10, 3.16, 0.86], [0.16, 3.02, 0.94], [0.22, 2.98, 0.92],
    ], 16);
    createPart('AmmoFeed', curveToMesh(feed, 0.052, 16, 8), hose, { parent: root });
    createPart('FeedCollar', torusGeo(0.062, 0.016, 8, 16), steel, {
      position: [0.12, 3.14, 0.88], rotation: [40, 0, 30], parent: root,
    });
  }

  // ---------- Left arm: missile pod ----------
  {
    const SH = [0.04, 3.66, -0.80];
    const ELBOW = [0.18, 3.02, -0.92];
    beamBetween('UpperArmRamL', SH, ELBOW, 0.085, steel, { parent: root });
    await boneArmor('UpperArmPlateL', SH, ELBOW, 0.30, 0.34, 0.05, -0.14);
    createPart('ElbowPinL', cylinderZGeo(0.135, 0.135, 0.34, 18), steel, { position: ELBOW, parent: root });

    // Nine real tubes, bored through the block. Nine dark discs painted on a
    // face is the version of this that falls apart the moment the camera moves.
    const podSolid = new THREE.Mesh(await roundedBoxGeo(0.62, 0.72, 0.70, 0.06), armor);
    const tubes = [];
    for (let r = -1; r <= 1; r++) {
      for (let c = -1; c <= 1; c++) {
        const t = new THREE.Mesh(cylinderXGeo(0.088, 0.088, 0.80, 16), armor);
        t.position.set(0.10, r * 0.215, c * 0.215);
        tubes.push(t);
      }
    }
    const pod = await boolDiff('MissilePod', podSolid, ...tubes, { smooth: true });
    pod.name = 'MissilePod';
    pod.geometry = await uv(pod.geometry);
    pod.position.set(0.44, 2.98, -0.94);
    root.add(pod);

    await plate('PodCover', 0.09, 0.66, 0.16, 0.03, [0.76, 2.98, -1.34], { mat: hazard });
    for (const hy of [-1, 1]) {
      createPart(`PodHinge_${hy > 0 ? 'U' : 'D'}`, cylinderXGeo(0.030, 0.030, 0.16, 10), steel, {
        position: [0.74, 2.98 + hy * 0.28, -1.30], parent: root,
      });
    }
    boltRow('PodBolt', [0.12, 3.32, -1.24], [0.12, 2.64, -1.24], 4, 0.022);
  }

  return root;
}

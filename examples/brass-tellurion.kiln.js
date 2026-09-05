const meta = { name: 'brass-tellurion', category: 'prop', role: 'prop' };

function build() {
  const root = createRoot('BrassTellurion');

  // ---- materials: machined brass, dark enamel, steel, ocean, land, moon ----
  const brass = gameMaterial(0xc9972f, { metalness: 0.95, roughness: 0.32 });
  const brassBright = gameMaterial(0xe0b34e, { metalness: 1.0, roughness: 0.22 });
  const brassDark = gameMaterial(0x8a6420, { metalness: 0.9, roughness: 0.45 });
  const enamel = gameMaterial(0x11161d, { metalness: 0.25, roughness: 0.28 });
  const enamelBlue = gameMaterial(0x1b2a3a, { metalness: 0.3, roughness: 0.35 });
  const steel = gameMaterial(0x9aa2ab, { metalness: 0.95, roughness: 0.35 });
  const ocean = gameMaterial(0x1f4d6e, { metalness: 0.15, roughness: 0.55 });
  const land = gameMaterial(0x55642e, { metalness: 0.1, roughness: 0.8 });
  const moonMat = gameMaterial(0xcfd2d6, { metalness: 0.1, roughness: 0.7 });
  const ivory = gameMaterial(0xe8ddc2, { metalness: 0.05, roughness: 0.6 });

  // ---- dark enamel stepped base (offset plinth, asymmetric footprint) ----
  createPart('BasePlinth', cylinderGeo(0.46, 0.5, 0.09, 48), enamel, { position: [0, 0.045, 0], parent: root });
  createPart('BaseStep', cylinderGeo(0.40, 0.43, 0.06, 48), enamelBlue, { position: [-0.02, 0.12, 0.01], parent: root });
  createPart('BaseTop', cylinderGeo(0.375, 0.375, 0.03, 48), brassDark, { position: [-0.02, 0.165, 0.01], parent: root });
  // base molding ring
  createPart('BaseTrim', torusGeo(0.475, 0.014, 10, 64), brassBright, { position: [0, 0.09, 0], rotation: [90, 0, 0], parent: root });
  // small bun feet (3, asymmetric spacing)
  const footPos = [[0.34, 0], [-0.28, 0.24], [-0.24, -0.28]];
  for (let i = 0; i < footPos.length; i++) {
    createPart('Foot' + i, sphereGeo(0.045, 16, 12), brassDark, { position: [footPos[i][0], 0.045, footPos[i][1]], parent: root });
  }

  // ---- engraved dial ring + index markers on base top ----
  createPart('DialRing', torusGeo(0.315, 0.012, 8, 72), brassBright, { position: [-0.02, 0.182, 0.01], rotation: [90, 0, 0], parent: root });
  createPart('DialInner', torusGeo(0.248, 0.006, 8, 64), brass, { position: [-0.02, 0.182, 0.01], rotation: [90, 0, 0], parent: root });
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const long = i % 4 === 0;
    const r = 0.2815;
    const cx = -0.02 + Math.cos(a) * r, cz = 0.01 + Math.sin(a) * r;
    createPart('Tick' + i, boxGeo(long ? 0.03 : 0.016, 0.006, long ? 0.008 : 0.005), long ? brassBright : ivory,
      { position: [cx, 0.183, cz], rotation: [0, (-a * 180 / Math.PI), 0], parent: root });
  }
  // zodiac-like month blocks (12 ivory plates, one side emphasized)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const cx = -0.02 + Math.cos(a) * 0.215, cz = 0.01 + Math.sin(a) * 0.215;
    createPart('Month' + i, boxGeo(0.03, 0.004, 0.02), i === 3 ? brassBright : ivory,
      { position: [cx, 0.182, cz], rotation: [0, (-a * 180 / Math.PI) + 90, 0], parent: root });
  }

  // ---- precision gear train on base top (interlocking, offset cluster) ----
  const gearA = createPivot('GearA', [0.14, 0.228, 0.15], root);
  createPart('GearAMesh', gearGeo({ teeth: 36, rootRadius: 0.098, tipRadius: 0.115, boreRadius: 0.014, height: 0.036 }), brass, { parent: gearA });
  createPart('GearAHub', cylinderGeo(0.016, 0.016, 0.05, 16), steel, { parent: gearA });
  createPart('GearACap', sphereGeo(0.02, 12, 8), brassBright, { position: [0, 0.045, 0], parent: gearA });

  const gearB = createPivot('GearB', [-0.055, 0.228, 0.185], root);
  createPart('GearBMesh', gearGeo({ teeth: 24, rootRadius: 0.066, tipRadius: 0.078, boreRadius: 0.012, height: 0.036 }), brassBright, { parent: gearB });
  createPart('GearBHub', cylinderGeo(0.013, 0.013, 0.05, 12), steel, { parent: gearB });
  createPart('GearBCap', sphereGeo(0.016, 10, 8), brassBright, { position: [0, 0.028, 0], parent: gearB });

  const gearC = createPivot('GearC', [-0.185, 0.228, 0.075], root);
  createPart('GearCMesh', gearGeo({ teeth: 18, rootRadius: 0.050, tipRadius: 0.060, boreRadius: 0.010, height: 0.036 }), brassDark, { parent: gearC });
  createPart('GearCHub', cylinderGeo(0.011, 0.011, 0.05, 12), steel, { parent: gearC });
  createPart('GearCCap', sphereGeo(0.014, 10, 8), brassBright, { position: [0, 0.028, 0], parent: gearC });

  // small vertical pinion driving gear A from below crank shaft
  const pinion = createPivot('Pinion', [0.26, 0.228, 0.03], root);
  createPart('PinionMesh', gearGeo({ teeth: 12, rootRadius: 0.028, tipRadius: 0.035, boreRadius: 0.008, height: 0.03 }), steel, { parent: pinion });

  // ---- side crank (asymmetric, +X side) with turned handle ----
  beamBetween('CrankShaft', [0.26, 0.228, 0.03], [0.47, 0.228, 0.03], 0.011, steel, { parent: root });
  const crank = createPivot('Crank', [0.47, 0.228, 0.03], root);
  createPart('CrankArm', boxGeo(0.016, 0.10, 0.016), brass, { position: [0, -0.05, 0], parent: crank });
  createPart('CrankKnob', cylinderGeo(0.016, 0.016, 0.07, 16), enamel, { position: [0, -0.10, 0.035], rotation: [90, 0, 0], parent: crank });
  createPart('CrankBoss', sphereGeo(0.022, 12, 8), brassBright, { parent: crank });
  // crank support bracket
  beamBetween('CrankPost', [0.44, 0.03, 0.03], [0.44, 0.228, 0.03], 0.014, brassDark, { parent: root });

  // ---- tall offset column (rear-left), swept molding profile for machined look ----
  const colBase = [-0.10, 0.18, -0.26];
  createPart('ColumnFoot', cylinderGeo(0.075, 0.10, 0.05, 24), brassDark, { position: [colBase[0], 0.205, colBase[2]], parent: root });
  createPart('ColumnFlute', cylinderGeo(0.042, 0.058, 0.62, 24), brass, { position: [colBase[0], 0.53, colBase[2]], parent: root });
  createPart('ColumnCollarA', torusGeo(0.055, 0.012, 8, 32), brassBright, { position: [colBase[0], 0.30, colBase[2]], rotation: [90, 0, 0], parent: root });
  createPart('ColumnCollarB', torusGeo(0.048, 0.010, 8, 32), brassBright, { position: [colBase[0], 0.76, colBase[2]], rotation: [90, 0, 0], parent: root });
  // curved support arm sweeping from column top toward globe (custom curve sweep)
  const armPath = bezierCurve([
    [colBase[0], 0.82, colBase[2]],
    [-0.10, 1.02, -0.18],
    [-0.06, 1.10, -0.08],
    [-0.02, 1.12, -0.02]
  ], 24);
  createPart('SupportArm', curveToMesh(armPath, 0.024, 32, 12), brass, { parent: root });
  createPart('ArmFinial', sphereGeo(0.032, 14, 10), brassBright, { position: [colBase[0], 0.84, colBase[2]], parent: root });

  // ---- tilted Earth globe assembly (23.4 deg tilt, offset above column) ----
  const earthC = [-0.02, 1.12, -0.02];
  const tilt = createPivot('EarthTilt', earthC, root);
  tilt.rotation.z = -23.4 * Math.PI / 180;
  // axis rod through globe
  createPart('AxisRod', cylinderGeo(0.008, 0.008, 0.62, 12), steel, { position: [0, 0, 0], parent: tilt });
  createPart('AxisTipN', sphereGeo(0.016, 10, 8), brassBright, { position: [0, 0.31, 0], parent: tilt });
  createPart('AxisTipS', sphereGeo(0.013, 10, 8), brassDark, { position: [0, -0.31, 0], parent: tilt });

  const spin = createPivot('EarthSpin', [0, 0, 0], tilt);
  createPart('EarthOcean', sphereGeo(0.22, 48, 32), ocean, { parent: spin });
  // sculptural continents: raised flattened patches
  const conts = [
    { p: [0.085, 0.068, 0.136], s: [0.10, 0.028, 0.12], r: [20, 30, 10] },
    { p: [-0.11, 0.017, 0.119], s: [0.075, 0.028, 0.095], r: [-10, -40, 0] },
    { p: [-0.017, -0.085, -0.153], s: [0.105, 0.028, 0.085], r: [30, 10, -20] },
    { p: [0.017, 0.136, -0.102], s: [0.085, 0.026, 0.075], r: [0, 20, 30] },
    { p: [-0.136, -0.068, -0.051], s: [0.058, 0.026, 0.066], r: [10, 0, 40] }
  ];
  for (let i = 0; i < conts.length; i++) {
    createPart('Continent' + i, sphereGeo(1, 12, 8), land,
      { position: conts[i].p, rotation: conts[i].r, scale: conts[i].s, parent: spin });
  }
  // equator + tropic engraved rings (children of tilt so they stay aligned to axis)
  createPart('Equator', torusGeo(0.222, 0.004, 6, 64), brassBright, { position: [0, 0, 0], rotation: [90, 0, 0], parent: tilt });
  createPart('TropicN', torusGeo(0.203, 0.0025, 6, 56), brass, { position: [0, 0.087, 0], rotation: [90, 0, 0], parent: tilt });
  createPart('TropicS', torusGeo(0.203, 0.0025, 6, 56), brass, { position: [0, -0.087, 0], rotation: [90, 0, 0], parent: tilt });
  // meridian half-arc over globe
  const merPath = [];
  for (let i = 0; i <= 24; i++) {
    const t = (i / 24) * Math.PI;
    merPath.push([Math.cos(t) * 0.245, Math.sin(t) * 0.245, 0]);
  }
  createPart('Meridian', curveToMesh(merPath, 0.006, 32, 8), brassBright, { parent: tilt });

  // ---- lunar orbit mechanism: inclined brass ring + travelling moon arm ----
  // large inclined orbit ring centered on earth, held by one side bracket (asymmetric)
  const orbitTilt = createPivot('OrbitTilt', earthC, root);
  orbitTilt.rotation.x = 12 * Math.PI / 180;
  orbitTilt.rotation.z = 8 * Math.PI / 180;
  createPart('OrbitRing', torusGeo(0.42, 0.010, 10, 96), brassBright, { rotation: [90, 0, 0], parent: orbitTilt });
  createPart('OrbitRingInner', torusGeo(0.42, 0.004, 6, 96), brassDark, { rotation: [90, 0, 0], position: [0, -0.008, 0], parent: orbitTilt });
  // engraved index ticks along orbit ring (every 15 deg, alternating length)
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const cx = Math.cos(a) * 0.42, cz = Math.sin(a) * 0.42;
    createPart('OrbitTick' + i, boxGeo(i % 2 ? 0.008 : 0.014, 0.010, 0.006), i % 6 === 0 ? ivory : brass,
      { position: [cx, 0.004, cz], rotation: [0, (-a * 180 / Math.PI), 0], parent: orbitTilt });
  }
  // single support bracket from column arm to ring (creates strong asymmetry)
  beamBetween('RingBracket', [colBase[0], 0.86, colBase[2]], [-0.36, 1.02, -0.20], 0.012, brassDark, { parent: root });
  createPart('BracketClaw', boxGeo(0.05, 0.03, 0.04), brass, { position: [-0.36, 1.02, -0.20], rotation: [0, 30, 12], parent: root });

  // animated moon arm (rotates about earth center, in orbit plane)
  const moonArm = createPivot('MoonArm', [0, 0, 0], orbitTilt);
  beamBetween('MoonRod', [0, 0.012, 0], [0.42, 0.012, 0], 0.007, brass, { parent: moonArm });
  const moonCarrier = createPivot('MoonCarrier', [0.42, 0.012, 0], moonArm);
  createPart('MoonSphere', sphereGeo(0.055, 24, 18), moonMat, { parent: moonCarrier });
  createPart('MoonCap', sphereGeo(0.057, 16, 12), brassDark, { position: [0, -0.012, 0], scale: [1, 0.45, 1], parent: moonCarrier });
  createPart('MoonRim', torusGeo(0.058, 0.005, 8, 32), brassBright, { rotation: [90, 0, 0], parent: moonCarrier });
  // counterweight on opposite side of arm
  beamBetween('CounterRod', [0, 0.012, 0], [-0.16, 0.012, 0], 0.006, brassDark, { parent: moonArm });
  createPart('CounterWt', sphereGeo(0.032, 14, 10), brassDark, { position: [-0.16, 0.012, 0], parent: moonArm });
  createPart('CounterRing', torusGeo(0.032, 0.005, 6, 24), brass, { position: [-0.16, 0.012, 0], rotation: [90, 0, 0], parent: moonArm });

  // ---- phase pointer: thin hand from earth toward moon plane + sun pointer ----
  const phaseHand = createPivot('PhaseHand', earthC, root);
  beamBetween('PhaseRod', [0.22, 1.18, 0.05], [0.40, 1.24, 0.10], 0.005, steel, { parent: root });
  createPart('PhaseTip', coneGeo(0.012, 0.035, 12), brassBright, { position: [0.40, 1.24, 0.10], rotation: [0, 0, -60], parent: root });
  // small sun-ball on tall thin pointer opposite the moon side (asymmetric accent)
  beamBetween('SunStem', [-0.02, 0.18, 0.01], [-0.30, 0.78, 0.22], 0.008, brass, { parent: root });
  createPart('SunBall', sphereGeo(0.045, 20, 14), brassBright, { position: [-0.30, 0.80, 0.22], parent: root });
  createPart('SunCollar', torusGeo(0.045, 0.006, 6, 28), brassDark, { position: [-0.30, 0.755, 0.22], rotation: [90, 0, 0], parent: root });

  // ---- calendar index plaque on base front ----
  createPart('Plaque', boxGeo(0.20, 0.05, 0.012), brassDark, { position: [0.10, 0.055, 0.474], rotation: [-8, 0, 0], parent: root });
  createPart('PlaqueFace', boxGeo(0.18, 0.036, 0.004), ivory, { position: [0.10, 0.056, 0.480], rotation: [-8, 0, 0], parent: root });

  return root;
}

function animate(root) {
  const t = (time, rotation) => ({ time, rotation });
  return [
    createClip('Mechanism', 12, [
      rotationTrack('Joint_EarthSpin', [t(0, [0, 0, 0]), t(12, [0, 360, 0])]),
      rotationTrack('Joint_MoonArm', [t(0, [0, 0, 0]), t(12, [0, 360, 0])]),
      rotationTrack('Joint_MoonCarrier', [t(0, [0, 0, 0]), t(12, [0, 360, 0])]),
      rotationTrack('Joint_GearA', [t(0, [0, 0, 0]), t(12, [0, -180, 0])]),
      rotationTrack('Joint_GearB', [t(0, [0, 0, 0]), t(12, [0, 270, 0])]),
      rotationTrack('Joint_GearC', [t(0, [0, 0, 0]), t(12, [0, -360, 0])]),
      rotationTrack('Joint_Pinion', [t(0, [0, 0, 0]), t(12, [0, 540, 0])]),
      rotationTrack('Joint_Crank', [t(0, [0, 0, 0]), t(12, [0, 0, 360])])
    ])
  ];
}

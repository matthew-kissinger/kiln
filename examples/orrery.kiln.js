// Authored by: gemini-3.8-flash-medium, via agy.
//
// Written by the model itself through the Kiln MCP tools: it wrote the
// program, rendered it, looked at its own six-view contact sheet, and
// revised. Not a line of it is hand-authored.
//
// Refined later, in this repository, with `kiln_edit`: the sun was lowered
// into the plane of the planets, which is the one relationship an orrery
// exists to show.
// The attribution above is for the authoring run, which had none of this in
// scope. Both passes went through the same tools; only the second one could
// see the gallery it was going into.

const meta = { name: 'Orrery', category: 'prop' };

function build() {
  const root = createRoot('Orrery');

  // Materials (PBR brass, mahogany, and planet pigments)
  const mahogany = gameMaterial(0x3a170d, { roughness: 0.45, metalness: 0.05 });
  const darkWood = gameMaterial(0x220c06, { roughness: 0.50, metalness: 0.02 });
  const polishedBrass = gameMaterial(0xd8b04a, { roughness: 0.28, metalness: 0.88 });
  const agedBrass = gameMaterial(0x8a6b2e, { roughness: 0.45, metalness: 0.82 });
  const sunGold = gameMaterial(0xffc520, { roughness: 0.20, metalness: 0.50, emissive: 0xff9a00, emissiveIntensity: 0.35 });
  const mercuryMat = gameMaterial(0x887b73, { roughness: 0.75, metalness: 0.25 });
  const venusMat = gameMaterial(0xe2caa0, { roughness: 0.45, metalness: 0.15 });
  const earthMat = gameMaterial(0x1a4674, { roughness: 0.35, metalness: 0.10 });
  const moonMat = gameMaterial(0xdedede, { roughness: 0.85, metalness: 0.05 });
  const ivory = gameMaterial(0xf7f0df, { roughness: 0.30, metalness: 0.05 });

  // Gear helper: builds disc + radially arrayed spur teeth
  function buildGear(name, teeth, radius, height, mat, parent, opts = {}) {
    const toothWidth = (Math.PI * 2 * radius / teeth) * 0.45;
    const toothDepth = radius * 0.14;
    const rimRadius = radius - toothDepth * 0.4;

    const disc = createPart(`${name}_Disc`, cylinderGeo(rimRadius, rimRadius, height, Math.max(14, teeth)), mat, {
      position: opts.position || [0, 0, 0],
      rotation: opts.rotation,
      parent
    });

    if (opts.rim) {
      createPart(`${name}_RimBezel`, torusGeo(rimRadius * 0.82, height * 0.22, 8, 16), mat, {
        position: [0, 0, 0],
        rotation: [90, 0, 0],
        parent: disc
      });
    }

    const toothGeo = boxGeo(toothDepth, height, toothWidth);
    const tooth0 = createPart(`${name}_Tooth0`, toothGeo, mat, {
      position: [rimRadius + toothDepth * 0.4, 0, 0],
      parent: disc
    });
    arrayRadial(`${name}_Tooth`, tooth0, teeth, 'y', disc);
    return disc;
  }

  // ---------------------------------------------------------------------------
  // Base: Mahogany Stand & Brass Accents (Ground sits on Y=0)
  // ---------------------------------------------------------------------------
  const baseGroup = new THREE.Object3D();
  baseGroup.name = 'BaseStructure';
  root.add(baseGroup);

  // 4 Brass feet touching ground at Y=0 (ball radius 0.03, centered at Y=0.03)
  const footPositions = [
    [0.46, 0.03, 0.46],
    [-0.46, 0.03, 0.46],
    [-0.46, 0.03, -0.46],
    [0.46, 0.03, -0.46]
  ];
  for (let i = 0; i < footPositions.length; i++) {
    const [fx, fy, fz] = footPositions[i];
    createPart(`FootBall_${i}`, sphereGeo(0.03, 14, 10), polishedBrass, {
      position: [fx, fy, fz],
      parent: baseGroup
    });
    createPart(`FootPad_${i}`, cylinderGeo(0.035, 0.04, 0.02, 14), agedBrass, {
      position: [fx, fy + 0.025, fz],
      parent: baseGroup
    });
    createPart(`FootScroll_${i}`, torusGeo(0.026, 0.007, 8, 14), polishedBrass, {
      position: [fx * 0.92, fy + 0.04, fz * 0.92],
      rotation: [45, 0, 45],
      parent: baseGroup
    });
  }

  // Stepped mahogany plinth
  createPart('BasePlinthLow', cylinderGeo(0.68, 0.72, 0.05, 26), darkWood, {
    position: [0, 0.055, 0],
    parent: baseGroup
  });
  createPart('BaseTorus', torusGeo(0.68, 0.018, 8, 24), polishedBrass, {
    position: [0, 0.08, 0],
    rotation: [90, 0, 0],
    parent: baseGroup
  });
  createPart('BasePlinthMid', cylinderGeo(0.64, 0.66, 0.05, 26), mahogany, {
    position: [0, 0.105, 0],
    parent: baseGroup
  });
  createPart('BasePlinthUpper', cylinderGeo(0.58, 0.62, 0.04, 26), mahogany, {
    position: [0, 0.15, 0],
    parent: baseGroup
  });
  createPart('BaseDeck', cylinderGeo(0.54, 0.56, 0.03, 26), darkWood, {
    position: [0, 0.185, 0],
    parent: baseGroup
  });

  // Brass Calendar / Zodiac Ring on deck
  createPart('CalendarDialPlate', cylinderGeo(0.52, 0.52, 0.008, 26), agedBrass, {
    position: [0, 0.204, 0],
    parent: baseGroup
  });
  createPart('CalendarDialRim', torusGeo(0.51, 0.010, 8, 24), polishedBrass, {
    position: [0, 0.21, 0],
    rotation: [90, 0, 0],
    parent: baseGroup
  });
  createPart('CalendarInnerRim', torusGeo(0.42, 0.008, 8, 24), polishedBrass, {
    position: [0, 0.21, 0],
    rotation: [90, 0, 0],
    parent: baseGroup
  });

  // 12 Zodiac hour studs around dial
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI * 2) / 12;
    const mx = Math.cos(angle) * 0.465;
    const mz = Math.sin(angle) * 0.465;
    createPart(`ZodiacStud_${i}`, cylinderGeo(0.008, 0.008, 0.015, 10), ivory, {
      position: [mx, 0.215, mz],
      parent: baseGroup
    });
  }

  // 4 Cardinal pointer markings on dial
  const cardinals = [[0.44, 0], [-0.44, 0], [0, 0.44], [0, -0.44]];
  for (let i = 0; i < cardinals.length; i++) {
    const [cx, cz] = cardinals[i];
    createPart(`CardinalPointer_${i}`, boxGeo(0.03, 0.006, 0.015), polishedBrass, {
      position: [cx, 0.212, cz],
      parent: baseGroup
    });
  }

  // ---------------------------------------------------------------------------
  // Central Mechanism Frame (Clockwork Cage)
  // ---------------------------------------------------------------------------
  const mechGroup = new THREE.Object3D();
  mechGroup.name = 'MechanismFrame';
  root.add(mechGroup);

  createPart('PillarBoss', cylinderGeo(0.18, 0.22, 0.04, 22), polishedBrass, {
    position: [0, 0.22, 0],
    parent: mechGroup
  });
  createPart('PillarBaseCollar', cylinderGeo(0.12, 0.16, 0.03, 22), agedBrass, {
    position: [0, 0.255, 0],
    parent: mechGroup
  });

  const pillarCoords = [
    [0.10, 0.10],
    [-0.10, 0.10],
    [-0.10, -0.10],
    [0.10, -0.10]
  ];
  for (let i = 0; i < pillarCoords.length; i++) {
    const [px, pz] = pillarCoords[i];
    createPart(`PillarBase_${i}`, cylinderGeo(0.025, 0.03, 0.02, 12), polishedBrass, {
      position: [px, 0.28, pz],
      parent: mechGroup
    });
    createPart(`PillarShaft_${i}`, cylinderGeo(0.016, 0.016, 0.14, 12), agedBrass, {
      position: [px, 0.36, pz],
      parent: mechGroup
    });
    createPart(`PillarTop_${i}`, cylinderGeo(0.03, 0.025, 0.02, 12), polishedBrass, {
      position: [px, 0.44, pz],
      parent: mechGroup
    });
  }

  createPart('MechPlateUpper', cylinderGeo(0.19, 0.19, 0.015, 22), polishedBrass, {
    position: [0, 0.46, 0],
    parent: mechGroup
  });

  // Central Spindle and turned decorative sleeves
  // Shortened with the sun. At 0.90 the spindle topped out at Y=1.37 to meet a
  // sun cradled at 1.34; with the sun brought down into the planet plane the
  // same rod would run straight up through the sphere and out of the top.
  createPart('CentralSpindle', cylinderGeo(0.022, 0.022, 0.72, 18), polishedBrass, {
    position: [0, 0.83, 0],
    parent: mechGroup
  });
  createPart('SpindleMidCollar', cylinderGeo(0.036, 0.036, 0.025, 18), agedBrass, {
    position: [0, 0.98, 0],
    parent: mechGroup
  });
  createPart('SpindleMidBezel', torusGeo(0.038, 0.007, 8, 18), polishedBrass, {
    position: [0, 1.15, 0],
    rotation: [90, 0, 0],
    parent: mechGroup
  });

  // Fixed central base gear
  buildGear('FixedBaseGear', 26, 0.155, 0.022, agedBrass, mechGroup, {
    position: [0, 0.48, 0],
    rim: true
  });

  // Secondary idler shaft & gears
  createPart('IdlerShaft', cylinderGeo(0.010, 0.010, 0.38, 10), polishedBrass, {
    position: [0.12, 0.65, 0.08],
    parent: mechGroup
  });
  buildGear('IdlerGear1', 16, 0.075, 0.018, agedBrass, mechGroup, {
    position: [0.12, 0.54, 0.08]
  });
  buildGear('IdlerGear2', 14, 0.065, 0.018, agedBrass, mechGroup, {
    position: [0.12, 0.66, 0.08]
  });
  buildGear('IdlerGear3', 12, 0.055, 0.018, agedBrass, mechGroup, {
    position: [0.12, 0.78, 0.08]
  });

  // ---------------------------------------------------------------------------
  // Winding Crank Mechanism (Moving joint Joint_Crank)
  // ---------------------------------------------------------------------------
  createPart('CrankBracket', boxGeo(0.09, 0.035, 0.04), agedBrass, {
    position: [0.14, 0.36, 0],
    parent: mechGroup
  });
  createPart('CrankBearing', boxGeo(0.05, 0.05, 0.06), agedBrass, {
    position: [0.18, 0.36, 0],
    parent: mechGroup
  });

  const crankJoint = createPivot('Crank', [0.22, 0.36, 0], root);
  createPart('CrankAxle', cylinderXGeo(0.01, 0.01, 0.10, 10), polishedBrass, {
    position: [0.05, 0, 0],
    parent: crankJoint
  });

  buildGear('CrankPinion', 12, 0.048, 0.016, agedBrass, crankJoint, {
    position: [-0.02, 0, 0],
    rotation: [0, 0, 90]
  });

  createPart('CrankArm', boxGeo(0.015, 0.11, 0.02), polishedBrass, {
    position: [0.10, 0.045, 0],
    parent: crankJoint
  });
  createPart('CrankHubCollar', cylinderXGeo(0.018, 0.018, 0.02, 12), agedBrass, {
    position: [0.10, 0, 0],
    parent: crankJoint
  });
  createPart('CrankPin', cylinderXGeo(0.008, 0.008, 0.06, 10), polishedBrass, {
    position: [0.13, 0.09, 0],
    parent: crankJoint
  });
  createPart('CrankIvoryKnob', cylinderXGeo(0.016, 0.012, 0.05, 14), ivory, {
    position: [0.145, 0.09, 0],
    parent: crankJoint
  });

  // ---------------------------------------------------------------------------
  // Arm 3: Earth & Moon (Outermost planet, lowest arm tier at Y=0.54, R3 = 0.94m)
  // By placing the outermost arm at the lowest tier, its long arm sweeps below
  // Venus and Mercury, completely preventing mechanical binding!
  // ---------------------------------------------------------------------------
  const earthJoint = createPivot('EarthArm', [0, 0.54, 0], root);

  createPart('EarthCollar', cylinderGeo(0.046, 0.046, 0.035, 14), polishedBrass, {
    position: [0, 0, 0],
    parent: earthJoint
  });
  buildGear('EarthGear', 28, 0.165, 0.02, agedBrass, earthJoint, {
    position: [0, -0.01, 0],
    rim: true
  });

  beamBetween('EarthRailLower', [0, 0, 0], [0.94, 0, 0], 0.008, polishedBrass, { parent: earthJoint });
  beamBetween('EarthRailUpper', [0.05, 0.045, 0], [0.94, 0.045, 0], 0.007, polishedBrass, { parent: earthJoint });

  const strutXs = [0.24, 0.44, 0.64, 0.84];
  for (let i = 0; i < strutXs.length; i++) {
    const sx = strutXs[i];
    beamBetween(`EarthStrut_${i}`, [sx, 0, 0], [sx, 0.045, 0], 0.005, agedBrass, { parent: earthJoint });
    beamBetween(`EarthDiag_${i}`, [sx - 0.08, 0, 0], [sx, 0.045, 0], 0.004, agedBrass, { parent: earthJoint });
  }

  beamBetween('EarthCounterArm', [0, 0.02, 0], [-0.30, 0.02, 0], 0.009, polishedBrass, { parent: earthJoint });
  createPart('EarthWeightBase', cylinderGeo(0.048, 0.052, 0.05, 16), agedBrass, {
    position: [-0.30, 0.02, 0],
    parent: earthJoint
  });
  createPart('EarthWeightFinial', sphereGeo(0.032, 14, 10), polishedBrass, {
    position: [-0.35, 0.02, 0],
    parent: earthJoint
  });

  // Earth riser column at R3 = 0.94m rising up to Y = 0.96 (world Y = 1.50)
  beamBetween('EarthRiserPillar', [0.94, 0, 0], [0.94, 0.96, 0], 0.010, polishedBrass, { parent: earthJoint });
  createPart('EarthGearboxHousing', cylinderGeo(0.038, 0.042, 0.045, 14), agedBrass, {
    position: [0.94, 0.97, 0],
    parent: earthJoint
  });
  buildGear('EarthMiniGear', 14, 0.038, 0.014, polishedBrass, earthJoint, {
    position: [0.94, 1.00, 0]
  });

  // Miniature Armillary Gimbal around Earth (23.5 degrees axial tilt)
  const meridianTilt = 23.5;
  createPart('EarthMeridianRing', torusGeo(0.12, 0.007, 8, 20), polishedBrass, {
    position: [0.94, 1.08, 0],
    rotation: [0, 0, meridianTilt],
    parent: earthJoint
  });
  createPart('EarthEquatorRing', torusGeo(0.11, 0.005, 8, 18), polishedBrass, {
    position: [0.94, 1.08, 0],
    rotation: [90, 0, meridianTilt],
    parent: earthJoint
  });
  createPart('EarthAxisPin', cylinderGeo(0.005, 0.005, 0.26, 10), agedBrass, {
    position: [0.94, 1.08, 0],
    rotation: [0, 0, meridianTilt],
    parent: earthJoint
  });
  createPart('EarthSphere', sphereGeo(0.076, 22, 16), earthMat, {
    position: [0.94, 1.08, 0],
    parent: earthJoint
  });

  // Moon Sub-assembly (pivots around Earth, parented to Joint_EarthArm)
  const moonJoint = createPivot('Moon', [0.94, 1.02, 0], earthJoint);

  beamBetween('MoonArmBeam', [0, 0, 0], [0.18, 0.04, 0], 0.004, polishedBrass, { parent: moonJoint });
  beamBetween('MoonRiser', [0.18, 0.04, 0], [0.18, 0.06, 0], 0.003, polishedBrass, { parent: moonJoint });
  beamBetween('MoonCounterArm', [0, 0, 0], [-0.05, 0, 0], 0.003, agedBrass, { parent: moonJoint });
  createPart('MoonWeightBall', sphereGeo(0.012, 12, 8), agedBrass, {
    position: [-0.05, 0, 0],
    parent: moonJoint
  });
  createPart('MoonSphere', sphereGeo(0.024, 14, 10), moonMat, {
    position: [0.18, 0.06, 0],
    parent: moonJoint
  });

  // ---------------------------------------------------------------------------
  // Arm 2: Venus (Middle planet, middle arm tier at Y=0.66, R2 = 0.64m)
  // Reaches to R=0.64, well inside Earth's riser at R=0.94
  // ---------------------------------------------------------------------------
  const venusJoint = createPivot('Venus', [0, 0.66, 0], root);
  venusJoint.rotation.y = THREE.MathUtils.degToRad(210);

  createPart('VenusCollar', cylinderGeo(0.040, 0.040, 0.035, 14), polishedBrass, {
    position: [0, 0, 0],
    parent: venusJoint
  });
  buildGear('VenusGear', 22, 0.135, 0.02, agedBrass, venusJoint, {
    position: [0, -0.01, 0],
    rim: true
  });

  beamBetween('VenusArmBeam', [0, 0, 0], [0.64, 0, 0], 0.008, polishedBrass, { parent: venusJoint });

  createPart('VenusScroll', torusGeo(0.06, 0.005, 8, 16), polishedBrass, {
    position: [0.32, -0.052, 0],
    rotation: [0, 0, 0],
    parent: venusJoint
  });

  beamBetween('VenusCounterArm', [0, 0, 0], [-0.22, 0, 0], 0.007, polishedBrass, { parent: venusJoint });
  createPart('VenusWeightCylinder', cylinderGeo(0.035, 0.035, 0.04, 14), agedBrass, {
    position: [-0.22, 0, 0],
    parent: venusJoint
  });
  createPart('VenusWeightFinial', sphereGeo(0.022, 14, 10), polishedBrass, {
    position: [-0.25, 0, 0],
    parent: venusJoint
  });

  beamBetween('VenusRiser', [0.64, 0, 0], [0.64, 0.74, 0], 0.007, polishedBrass, { parent: venusJoint });
  createPart('VenusCup', coneGeo(0.022, 0.03, 12), agedBrass, {
    position: [0.64, 0.755, 0],
    parent: venusJoint
  });
  createPart('VenusSphere', sphereGeo(0.066, 20, 14), venusMat, {
    position: [0.64, 0.82, 0],
    parent: venusJoint
  });

  // ---------------------------------------------------------------------------
  // Arm 1: Mercury (Innermost planet, top arm tier at Y=0.78, R1 = 0.36m)
  // Sits highest in the gear stack, perfectly clear of Venus (R=0.64) and Earth (R=0.94)
  // ---------------------------------------------------------------------------
  const mercuryJoint = createPivot('Mercury', [0, 0.78, 0], root);
  mercuryJoint.rotation.y = THREE.MathUtils.degToRad(75);

  createPart('MercCollar', cylinderGeo(0.036, 0.036, 0.035, 14), polishedBrass, {
    position: [0, 0, 0],
    parent: mercuryJoint
  });
  buildGear('MercGear', 18, 0.105, 0.02, agedBrass, mercuryJoint, {
    position: [0, -0.01, 0],
    rim: true
  });

  beamBetween('MercArmBeam', [0, 0, 0], [0.36, 0, 0], 0.007, polishedBrass, { parent: mercuryJoint });

  createPart('MercScroll', torusGeo(0.055, 0.004, 8, 16), polishedBrass, {
    position: [0.18, -0.048, 0],
    rotation: [0, 0, 0],
    parent: mercuryJoint
  });

  beamBetween('MercCounterArm', [0, 0, 0], [-0.14, 0, 0], 0.006, polishedBrass, { parent: mercuryJoint });
  createPart('MercWeightBall', sphereGeo(0.028, 14, 10), agedBrass, {
    position: [-0.14, 0, 0],
    parent: mercuryJoint
  });

  beamBetween('MercRiser', [0.36, 0, 0], [0.36, 0.50, 0], 0.006, polishedBrass, { parent: mercuryJoint });
  createPart('MercCup', coneGeo(0.016, 0.025, 12), agedBrass, {
    position: [0.36, 0.51, 0],
    parent: mercuryJoint
  });
  createPart('MercurySphere', sphereGeo(0.042, 16, 12), mercuryMat, {
    position: [0.36, 0.56, 0],
    parent: mercuryJoint
  });

  // ---------------------------------------------------------------------------
  // The Sun.
  //
  // It used to sit at Y=1.66, on top of a 0.90 m spindle, with the three planets
  // banded between 1.34 and 1.62 below and around it. Every part was individually
  // fine and the whole thing read as a table lamp: the one relationship an orrery
  // exists to show is that the planets go ROUND the sun, and a sun mounted above
  // them shows the opposite. Dropped to 1.48, which is the mean of Mercury (1.34),
  // Venus (1.48) and Earth (1.62), so the orbits now pass through it.
  // ---------------------------------------------------------------------------
  const sunGroup = new THREE.Object3D();
  sunGroup.name = 'SunAssembly';
  root.add(sunGroup);

  createPart('SunFinialBase', cylinderGeo(0.048, 0.065, 0.08, 18), polishedBrass, {
    position: [0, 1.16, 0],
    parent: sunGroup
  });
  createPart('SunNeck', cylinderGeo(0.030, 0.045, 0.08, 18), agedBrass, {
    position: [0, 1.24, 0],
    parent: sunGroup
  });
  createPart('SunCup', cylinderGeo(0.085, 0.04, 0.05, 20), polishedBrass, {
    position: [0, 1.305, 0],
    parent: sunGroup
  });

  // 16 Radiant Sunburst Rays
  for (let i = 0; i < 16; i++) {
    const angle = (i * Math.PI * 2) / 16;
    const rx = Math.cos(angle) * 0.085;
    const rz = Math.sin(angle) * 0.085;
    createPart(`SunRay_${i}`, coneGeo(0.009, 0.055, 8), sunGold, {
      position: [rx, 1.32, rz],
      rotation: [Math.sin(angle) * 35, 0, -Math.cos(angle) * 35],
      parent: sunGroup
    });
  }

  createPart('SunSphere', sphereGeo(0.165, 24, 18), sunGold, {
    position: [0, 1.48, 0],
    parent: sunGroup
  });

  return root;
}

function animate() {
  const duration = 12;

  // Track 1: Hand Crank (turns on X axis, 12 revolutions in 12s)
  const crankKeys = [];
  const crankSteps = 48;
  for (let i = 0; i <= crankSteps; i++) {
    crankKeys.push({
      time: (i * duration) / crankSteps,
      rotation: [(i * 90) % 360, 0, 0]
    });
  }

  // Track 2: Mercury (starts at 75°, completes 4 revolutions in 12s)
  const mercKeys = [];
  const mercSteps = 16;
  const mercBase = 75;
  for (let i = 0; i <= mercSteps; i++) {
    mercKeys.push({
      time: (i * duration) / mercSteps,
      rotation: [0, (mercBase + i * 90) % 360, 0]
    });
  }

  // Track 3: Venus (starts at 210°, completes 2 revolutions in 12s)
  const venusKeys = [];
  const venusSteps = 8;
  const venusBase = 210;
  for (let i = 0; i <= venusSteps; i++) {
    venusKeys.push({
      time: (i * duration) / venusSteps,
      rotation: [0, (venusBase + i * 90) % 360, 0]
    });
  }

  // Track 4: Earth (starts at 0°, completes 1 revolution in 12s)
  const earthKeys = [];
  const earthSteps = 4;
  for (let i = 0; i <= earthSteps; i++) {
    earthKeys.push({
      time: (i * duration) / earthSteps,
      rotation: [0, (i * 90) % 360, 0]
    });
  }

  // Track 5: Moon (orbits Earth, completes 6 revolutions in 12s)
  const moonKeys = [];
  const moonSteps = 24;
  for (let i = 0; i <= moonSteps; i++) {
    moonKeys.push({
      time: (i * duration) / moonSteps,
      rotation: [0, (i * 90) % 360, 0]
    });
  }

  return [
    createClip('OrreryMotion', duration, [
      rotationTrack('Joint_Crank', crankKeys),
      rotationTrack('Joint_Mercury', mercKeys),
      rotationTrack('Joint_Venus', venusKeys),
      rotationTrack('Joint_EarthArm', earthKeys),
      rotationTrack('Joint_Moon', moonKeys)
    ])
  ];
}

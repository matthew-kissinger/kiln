// Authored by: gemini-3.8-flash-high, via agy.
//
// Written by the model itself through the Kiln MCP tools: it wrote the
// program, rendered it, looked at its own six-view contact sheet, and
// revised. Not a line of it is hand-authored.
//
// Refined later, in this repository, with `kiln_edit`: the hood's break-arch
// was rebuilt from segments, replacing a full torus that read as a circle
// floating over the dial.
// The attribution above is for the authoring run, which had none of this in
// scope. Both passes went through the same tools; only the second one could
// see the gallery it was going into.

const meta = { name: 'LongcaseClock', category: 'prop' };

function build() {
  const root = createRoot('LongcaseClock');

  // =========================================================================
  // Materials Palette (Cohesive, low draw-calls, high instanceability grade)
  // =========================================================================
  const walnutDark = gameMaterial(0x361d10, { roughness: 0.72, metalness: 0.04 }); // Solid English walnut case & moldings
  const walnutBurl = gameMaterial(0x542d16, { roughness: 0.60, metalness: 0.04 }); // Bookmatched burl veneer panels
  const brass = gameMaterial(0xd8ad36, { roughness: 0.22, metalness: 0.90 });      // Polished brass finials, pendulum, weights
  const dialFace = gameMaterial(0xfbf6e8, { roughness: 0.88, metalness: 0.0 });    // Antique cream painted enamel dial face
  const dialBlack = gameMaterial(0x141414, { roughness: 0.85, metalness: 0.1 });   // Enamel black numerals, tracks, hands
  const dialMoon = gameMaterial(0x122244, { roughness: 0.68, metalness: 0.12 });   // Prussian midnight blue lunar arch
  const dialGold = gameMaterial(0xdfb43a, { roughness: 0.25, metalness: 0.85 });   // Painted gold stars and moon face

  // =========================================================================
  // 1. Plinth Base & Bracket Feet (Sitting on Y = 0)
  // =========================================================================
  // 4 Carved Ogee Bracket Feet resting on the floor (Y: 0.00 to 0.09)
  const footPositions = [
    [0.12, 0.045, -0.22],  // Front-Left
    [0.12, 0.045, 0.22],   // Front-Right
    [-0.12, 0.045, -0.22], // Back-Left
    [-0.12, 0.045, 0.22],  // Back-Right
  ];
  for (let i = 0; i < footPositions.length; i++) {
    const [fx, fy, fz] = footPositions[i];
    createPart('Foot_' + i, boxGeo(0.09, 0.09, 0.09), walnutDark, {
      position: [fx, fy, fz],
      parent: root,
    });
    createPart('FootWing_' + i, cylinderGeo(0.04, 0.02, 0.09, 10), walnutDark, {
      position: [fx, fy, fz],
      rotation: [0, 45, 0],
      parent: root,
    });
  }

  // Base Plinth Lower Step (Y: 0.09 to 0.15, size: 0.34 x 0.06 x 0.54)
  createPart('PlinthLowerStep', boxGeo(0.34, 0.06, 0.54), walnutDark, {
    position: [0, 0.12, 0],
    parent: root,
  });

  // Plinth Stepped Cyma Molding (Y: 0.15 to 0.18)
  createPart('PlinthMolding1', boxGeo(0.32, 0.03, 0.52), walnutDark, {
    position: [0, 0.165, 0],
    parent: root,
  });

  // Base Pedestal Carcass (Y: 0.18 to 0.52, size: 0.30 x 0.34 x 0.48)
  createPart('BasePedestal', boxGeo(0.30, 0.34, 0.48), walnutDark, {
    position: [0, 0.35, 0],
    parent: root,
  });

  // Front Inset Burl Walnut Panel on Base (X = +0.152)
  createPart('BasePanelBurlField', boxGeo(0.008, 0.26, 0.40), walnutBurl, {
    position: [0.152, 0.35, 0],
    parent: root,
  });
  // Stepped molding framing the front panel
  createPart('BasePanelBorderTop', boxGeo(0.014, 0.016, 0.41), walnutDark, {
    position: [0.154, 0.48, 0],
    parent: root,
  });
  createPart('BasePanelBorderBottom', boxGeo(0.014, 0.016, 0.41), walnutDark, {
    position: [0.154, 0.22, 0],
    parent: root,
  });
  createPart('BasePanelBorderLeft', boxGeo(0.014, 0.276, 0.016), walnutDark, {
    position: [0.154, 0.35, -0.20],
    parent: root,
  });
  createPart('BasePanelBorderRight', boxGeo(0.014, 0.276, 0.016), walnutDark, {
    position: [0.154, 0.35, 0.20],
    parent: root,
  });
  // Brass corner inlays on base panel
  const baseCornerOffsets = [[0.12, -0.19], [0.12, 0.19], [-0.12, -0.19], [-0.12, 0.19]];
  for (let bc = 0; bc < 4; bc++) {
    const [bcy, bcz] = baseCornerOffsets[bc];
    createPart('BaseCornerInlay_' + bc, sphereGeo(0.006, 8, 6), brass, {
      position: [0.156, 0.35 + bcy, bcz],
      parent: root,
    });
  }

  // Base-to-Waist Transition Moldings (Throat/Waist Rail, Y: 0.52 to 0.58)
  createPart('WaistTransition1', boxGeo(0.28, 0.03, 0.44), walnutDark, {
    position: [0, 0.535, 0],
    parent: root,
  });
  createPart('WaistTransition2', boxGeo(0.25, 0.03, 0.40), walnutDark, {
    position: [0, 0.565, 0],
    parent: root,
  });

  // =========================================================================
  // 2. Trunk / Waist Section (Y: 0.58 to 1.48)
  // =========================================================================
  // Waist Back Panel (X = -0.10)
  createPart('WaistBack', boxGeo(0.02, 0.90, 0.36), walnutDark, {
    position: [-0.10, 1.03, 0],
    parent: root,
  });
  // Waist Left Wall (Z = -0.17)
  createPart('WaistWallLeft', boxGeo(0.20, 0.90, 0.02), walnutDark, {
    position: [0.0, 1.03, -0.17],
    parent: root,
  });
  // Waist Right Wall (Z = +0.17)
  createPart('WaistWallRight', boxGeo(0.20, 0.90, 0.02), walnutDark, {
    position: [0.0, 1.03, 0.17],
    parent: root,
  });
  // Waist Floor Board
  createPart('WaistFloor', boxGeo(0.20, 0.02, 0.34), walnutDark, {
    position: [0.0, 0.59, 0],
    parent: root,
  });
  // Waist Ceiling Board
  createPart('WaistCeiling', boxGeo(0.20, 0.02, 0.34), walnutDark, {
    position: [0.0, 1.47, 0],
    parent: root,
  });

  // Fluted Quarter-Columns on the front corners of the waist (Z = ±0.165, X = +0.095)
  const colZOffsets = [-0.165, 0.165];
  for (let c = 0; c < 2; c++) {
    const cz = colZOffsets[c];
    const prefix = c === 0 ? 'ColL_' : 'ColR_';

    // Turned brass base
    createPart(prefix + 'BrassBase', cylinderGeo(0.022, 0.026, 0.035, 14), brass, {
      position: [0.095, 0.605, cz],
      parent: root,
    });
    createPart(prefix + 'BaseTorus', torusGeo(0.023, 0.005, 6, 14), brass, {
      position: [0.095, 0.622, cz],
      rotation: [90, 0, 0],
      parent: root,
    });

    // Column wooden shaft
    createPart(prefix + 'WoodShaft', cylinderGeo(0.017, 0.018, 0.80, 14), walnutDark, {
      position: [0.095, 1.035, cz],
      parent: root,
    });

    // Reeded fluting ribs (6 vertical ribs)
    for (let r = 0; r < 6; r++) {
      const angle = (r * Math.PI) / 3;
      const rx = 0.095 + 0.0175 * Math.cos(angle);
      const rz = cz + 0.0175 * Math.sin(angle);
      createPart(prefix + 'Reed_' + r, cylinderGeo(0.0035, 0.0035, 0.76, 6), walnutBurl, {
        position: [rx, 1.035, rz],
        parent: root,
      });
    }

    // Turned brass capital
    createPart(prefix + 'BrassCapNeck', cylinderGeo(0.018, 0.017, 0.025, 14), brass, {
      position: [0.095, 1.445, cz],
      parent: root,
    });
    createPart(prefix + 'BrassCapCrown', cylinderGeo(0.026, 0.019, 0.025, 14), brass, {
      position: [0.095, 1.465, cz],
      parent: root,
    });
  }

  // Long Waist Door Frame (Front X = +0.10, clear glazed aperture)
  // Left Stile
  createPart('DoorStileLeft', boxGeo(0.02, 0.86, 0.035), walnutDark, {
    position: [0.10, 1.03, -0.13],
    parent: root,
  });
  // Right Stile
  createPart('DoorStileRight', boxGeo(0.02, 0.86, 0.035), walnutDark, {
    position: [0.10, 1.03, 0.13],
    parent: root,
  });
  // Bottom Rail
  createPart('DoorRailBottom', boxGeo(0.02, 0.045, 0.225), walnutDark, {
    position: [0.10, 0.62, 0],
    parent: root,
  });
  // Top Arched Rail
  createPart('DoorRailTop', boxGeo(0.02, 0.045, 0.225), walnutDark, {
    position: [0.10, 1.44, 0],
    parent: root,
  });
  // Inner beaded molding around door aperture
  createPart('DoorBeadBottom', cylinderGeo(0.004, 0.004, 0.22, 8), brass, {
    position: [0.105, 0.645, 0],
    rotation: [90, 0, 0],
    parent: root,
  });
  createPart('DoorBeadLeft', cylinderGeo(0.004, 0.004, 0.77, 8), brass, {
    position: [0.105, 1.03, -0.11],
    parent: root,
  });
  createPart('DoorBeadRight', cylinderGeo(0.004, 0.004, 0.77, 8), brass, {
    position: [0.105, 1.03, 0.11],
    parent: root,
  });

  // Brass Hinges and Keyhole Escutcheon
  createPart('HingeTop', cylinderGeo(0.005, 0.005, 0.04, 10), brass, {
    position: [0.11, 1.32, -0.148],
    parent: root,
  });
  createPart('HingeBottom', cylinderGeo(0.005, 0.005, 0.04, 10), brass, {
    position: [0.11, 0.74, -0.148],
    parent: root,
  });
  createPart('EscutcheonPlate', boxGeo(0.004, 0.04, 0.022), brass, {
    position: [0.112, 1.03, 0.12],
    parent: root,
  });
  createPart('KeyholeHole', cylinderGeo(0.003, 0.003, 0.008, 6), dialBlack, {
    position: [0.113, 1.03, 0.12],
    rotation: [0, 0, 90],
    parent: root,
  });

  // =========================================================================
  // 3. Interior Clockwork (Drive Weights + Swinging Pendulum)
  // =========================================================================
  // Two Brass Cylindrical Weights (Suspended from movement)
  const weightConfigs = [
    { name: 'WeightTime', x: 0.02, y: 1.15, z: -0.07 },   // Left weight
    { name: 'WeightStrike', x: 0.02, y: 1.05, z: 0.07 },  // Right weight
  ];
  for (const wc of weightConfigs) {
    createPart(wc.name + '_Body', cylinderGeo(0.023, 0.023, 0.16, 16), brass, {
      position: [wc.x, wc.y, wc.z],
      parent: root,
    });
    createPart(wc.name + '_TopCap', sphereGeo(0.023, 12, 8), brass, {
      position: [wc.x, wc.y + 0.08, wc.z],
      scale: [1, 0.5, 1],
      parent: root,
    });
    createPart(wc.name + '_BottomTip', coneGeo(0.023, 0.035, 12), brass, {
      position: [wc.x, wc.y - 0.095, wc.z],
      rotation: [180, 0, 0],
      parent: root,
    });
    createPart(wc.name + '_Pulley', torusGeo(0.011, 0.004, 6, 12), brass, {
      position: [wc.x, wc.y + 0.10, wc.z],
      rotation: [0, 90, 0],
      parent: root,
    });
    const chainLen = 1.47 - (wc.y + 0.11);
    createPart(wc.name + '_Chain', cylinderGeo(0.002, 0.002, chainLen, 6), brass, {
      position: [wc.x, wc.y + 0.11 + chainLen / 2, wc.z],
      parent: root,
    });
  }

  // =========================================================================
  // 4. Swinging Pendulum Assembly (Joint_Pendulum)
  // =========================================================================
  const pendulumPivotY = 1.44;
  const pendulumJoint = createPivot('Pendulum', [0.0, pendulumPivotY, 0.0], root);

  // Top suspension block (local coords)
  createPart('PendulumTopBlock', boxGeo(0.016, 0.025, 0.012), brass, {
    position: [0, -0.0125, 0],
    parent: pendulumJoint,
  });

  // Polished brass pendulum rod (length 0.65m)
  const rodLength = 0.65;
  createPart('PendulumRod', cylinderGeo(0.005, 0.005, rodLength, 10), brass, {
    position: [0, -rodLength / 2, 0],
    parent: pendulumJoint,
  });

  // Heavy Lenticular Brass Bob (Centered at local Y = -0.58)
  const bobY = -0.58;
  createPart('PendulumBobDisc', sphereGeo(0.075, 18, 12), brass, {
    position: [0, bobY, 0],
    scale: [0.28, 1.0, 1.0],
    parent: pendulumJoint,
  });
  createPart('PendulumBobBezel', torusGeo(0.075, 0.008, 8, 20), brass, {
    position: [0, bobY, 0],
    rotation: [0, 90, 0],
    parent: pendulumJoint,
  });
  createPart('PendulumBobRosette', cylinderGeo(0.020, 0.026, 0.010, 12), brass, {
    position: [0.021, bobY, 0],
    rotation: [0, 0, 90],
    parent: pendulumJoint,
  });
  createPart('PendulumBobStar', sphereGeo(0.012, 8, 6), brass, {
    position: [0.026, bobY, 0],
    parent: pendulumJoint,
  });

  // Rating Nut and Bottom Spire
  createPart('PendulumRatingNut', cylinderGeo(0.009, 0.011, 0.020, 8), brass, {
    position: [0, -0.665, 0],
    parent: pendulumJoint,
  });
  createPart('PendulumBottomFinial', coneGeo(0.009, 0.028, 10), brass, {
    position: [0, -0.685, 0],
    rotation: [180, 0, 0],
    parent: pendulumJoint,
  });

  // =========================================================================
  // 5. Throat / Hood Support Moldings (Y: 1.48 to 1.55)
  // =========================================================================
  createPart('ThroatStep1', boxGeo(0.26, 0.02, 0.40), walnutDark, {
    position: [0, 1.49, 0],
    parent: root,
  });
  createPart('ThroatStep2', boxGeo(0.29, 0.02, 0.46), walnutDark, {
    position: [0, 1.51, 0],
    parent: root,
  });
  createPart('ThroatStep3', boxGeo(0.31, 0.02, 0.50), walnutDark, {
    position: [0, 1.53, 0],
    parent: root,
  });

  // =========================================================================
  // 6. Hood / Bonnet Carcass (Y: 1.55 to 2.12)
  // =========================================================================
  // Hood Back Wall
  createPart('HoodBack', boxGeo(0.02, 0.57, 0.48), walnutDark, {
    position: [-0.14, 1.835, 0],
    parent: root,
  });
  // Hood Side Walls with Arched Openings
  const sideZ = [-0.24, 0.24];
  for (let s = 0; s < 2; s++) {
    const sz = sideZ[s];
    const prefix = s === 0 ? 'HoodSideL_' : 'HoodSideR_';

    createPart(prefix + 'Lower', boxGeo(0.28, 0.12, 0.02), walnutDark, {
      position: [0, 1.61, sz],
      parent: root,
    });
    createPart(prefix + 'Upper', boxGeo(0.28, 0.15, 0.02), walnutDark, {
      position: [0, 2.045, sz],
      parent: root,
    });
    createPart(prefix + 'PillarF', boxGeo(0.03, 0.30, 0.02), walnutDark, {
      position: [0.12, 1.82, sz],
      parent: root,
    });
    createPart(prefix + 'PillarB', boxGeo(0.03, 0.30, 0.02), walnutDark, {
      position: [-0.12, 1.82, sz],
      parent: root,
    });
  }

  // Freestanding Turned Hood Columns at front corners (X = +0.14, Z = ±0.235)
  for (let hc = 0; hc < 2; hc++) {
    const hcz = hc === 0 ? -0.235 : 0.235;
    const prefix = hc === 0 ? 'HoodColL_' : 'HoodColR_';

    createPart(prefix + 'BaseBlock', boxGeo(0.045, 0.025, 0.045), walnutDark, {
      position: [0.14, 1.5625, hcz],
      parent: root,
    });
    createPart(prefix + 'BaseBrass', cylinderGeo(0.017, 0.020, 0.025, 14), brass, {
      position: [0.14, 1.585, hcz],
      parent: root,
    });
    createPart(prefix + 'BaseTorus', torusGeo(0.019, 0.0045, 6, 14), brass, {
      position: [0.14, 1.60, hcz],
      rotation: [90, 0, 0],
      parent: root,
    });

    createPart(prefix + 'Shaft', cylinderGeo(0.014, 0.016, 0.44, 14), walnutDark, {
      position: [0.14, 1.83, hcz],
      parent: root,
    });

    createPart(prefix + 'CapBrassNeck', cylinderGeo(0.015, 0.014, 0.02, 14), brass, {
      position: [0.14, 2.06, hcz],
      parent: root,
    });
    createPart(prefix + 'CapBrassCrown', cylinderGeo(0.024, 0.016, 0.025, 14), brass, {
      position: [0.14, 2.0825, hcz],
      parent: root,
    });
    createPart(prefix + 'CapAbacus', boxGeo(0.045, 0.015, 0.045), walnutDark, {
      position: [0.14, 2.1025, hcz],
      parent: root,
    });
  }

  // Hood Arched Door Surround (Front X = +0.145, open aperture framing the dial)
  createPart('HoodDoorStileL', boxGeo(0.02, 0.52, 0.035), walnutDark, {
    position: [0.145, 1.81, -0.20],
    parent: root,
  });
  createPart('HoodDoorStileR', boxGeo(0.02, 0.52, 0.035), walnutDark, {
    position: [0.145, 1.81, 0.20],
    parent: root,
  });
  createPart('HoodDoorRailBottom', boxGeo(0.02, 0.035, 0.38), walnutDark, {
    position: [0.145, 1.5675, 0],
    parent: root,
  });
  // Arched Hood Door Top Arch.
  //
  // This was one full torus, which is a ring and not an arch: its lower half ran
  // straight across the moon lunette and clipped the top of the chapter ring.
  // `torusGeo` takes no arc angle, so the half that is actually wanted is built
  // from segments swept over the top of an ellipse. Each block is turned to the
  // tangent there -- phi = atan2(b cos t, a sin t) -- which is 0 at the crown and
  // a quarter turn at each springing point, so the moulding meets the stiles
  // upright instead of cutting into them.
  const archA = 0.195;
  const archB = 0.145;
  const archY = 1.95;
  const archSegments = 15;
  const geoArchBlock = boxGeo(0.02, 0.036, 0.048);
  for (let i = 0; i < archSegments; i++) {
    const t = (i / (archSegments - 1)) * Math.PI;
    createPart('HoodDoorArch' + i, geoArchBlock, walnutDark, {
      position: [0.145, archY + archB * Math.sin(t), archA * Math.cos(t)],
      rotation: [(Math.atan2(archB * Math.cos(t), archA * Math.sin(t)) * 180) / Math.PI, 0, 0],
      parent: root,
    });
  }
  // Brass door knob
  createPart('HoodDoorKnob', sphereGeo(0.008, 10, 6), brass, {
    position: [0.155, 1.76, 0.19],
    parent: root,
  });

  // =========================================================================
  // 7. The Painted Dial & Movement Assembly (Facing +X)
  // =========================================================================
  const dialCenterX = 0.130;
  const dialCenterY = 1.76;
  const dialCenterZ = 0.0;

  // Solid brass dial backplate (0.36m x 0.36m square)
  createPart('DialPlateSquare', boxGeo(0.008, 0.36, 0.38), brass, {
    position: [dialCenterX - 0.005, dialCenterY, dialCenterZ],
    parent: root,
  });

  // Cast Brass Corner Spandrels in all 4 corners (Rococo scrollwork)
  const spandrelOffsets = [
    [-0.13, -0.13], // Bottom-Left
    [-0.13, 0.13],  // Bottom-Right
    [0.13, -0.13],  // Top-Left
    [0.13, 0.13],   // Top-Right
  ];
  for (let sp = 0; sp < 4; sp++) {
    const [sy, sz] = spandrelOffsets[sp];
    createPart('SpandrelPlate_' + sp, boxGeo(0.005, 0.055, 0.055), brass, {
      position: [dialCenterX + 0.001, dialCenterY + sy, dialCenterZ + sz],
      parent: root,
    });
    createPart('SpandrelScrollA_' + sp, torusGeo(0.024, 0.0045, 6, 10), brass, {
      position: [dialCenterX + 0.003, dialCenterY + sy, dialCenterZ + sz],
      rotation: [0, 90, 0],
      parent: root,
    });
    createPart('SpandrelScrollB_' + sp, torusGeo(0.014, 0.0035, 6, 8), brass, {
      position: [dialCenterX + 0.004, dialCenterY + sy + 0.012, dialCenterZ + sz + 0.012],
      rotation: [0, 90, 45],
      parent: root,
    });
  }

  // Large Painted Cream Dial Face (Radius 0.136m, crisp and prominent)
  createPart('DialPaintedFace', cylinderGeo(0.136, 0.136, 0.008, 24), dialFace, {
    position: [dialCenterX, dialCenterY, dialCenterZ],
    rotation: [0, 0, 90],
    parent: root,
  });

  // Polished Brass Bezel Ring wrapping Chapter Ring
  createPart('DialBrassBezel', torusGeo(0.136, 0.007, 8, 24), brass, {
    position: [dialCenterX + 0.004, dialCenterY, dialCenterZ],
    rotation: [0, 90, 0],
    parent: root,
  });

  // Outer & Inner Minute Tracks (Concentric black enamel rings)
  createPart('DialOuterMinuteTrack', torusGeo(0.128, 0.0018, 4, 24), dialBlack, {
    position: [dialCenterX + 0.005, dialCenterY, dialCenterZ],
    rotation: [0, 90, 0],
    parent: root,
  });
  createPart('DialInnerMinuteTrack', torusGeo(0.122, 0.0018, 4, 24), dialBlack, {
    position: [dialCenterX + 0.005, dialCenterY, dialCenterZ],
    rotation: [0, 90, 0],
    parent: root,
  });
  createPart('DialInnerHourTrack', torusGeo(0.082, 0.0018, 4, 24), dialBlack, {
    position: [dialCenterX + 0.005, dialCenterY, dialCenterZ],
    rotation: [0, 90, 0],
    parent: root,
  });

  // 12 Five-Minute Diamond Markers
  for (let m = 0; m < 12; m++) {
    const angle = (m * 30 * Math.PI) / 180;
    const my = dialCenterY + 0.125 * Math.cos(angle);
    const mz = dialCenterZ + 0.125 * Math.sin(angle);
    createPart('MinutePip_' + m, boxGeo(0.002, 0.0045, 0.0045), dialBlack, {
      position: [dialCenterX + 0.005, my, mz],
      rotation: [45, 0, 0],
      parent: root,
    });
  }

  // 12 Roman Numerals (I through XII)
  const romanHourConfigs = [
    { hour: 12, bars: [{ z: -0.013, rot: 25 }, { z: -0.005, rot: -25 }, { z: 0.004, rot: 0 }, { z: 0.013, rot: 0 }] }, // XII
    { hour: 1,  bars: [{ z: 0.0, rot: 0 }] },                                                                              // I
    { hour: 2,  bars: [{ z: -0.006, rot: 0 }, { z: 0.006, rot: 0 }] },                                                    // II
    { hour: 3,  bars: [{ z: -0.009, rot: 0 }, { z: 0.0, rot: 0 }, { z: 0.009, rot: 0 }] },                                // III
    { hour: 4,  bars: [{ z: -0.010, rot: 0 }, { z: 0.001, rot: -22 }, { z: 0.010, rot: 22 }] },                            // IV
    { hour: 5,  bars: [{ z: -0.006, rot: -22 }, { z: 0.006, rot: 22 }] },                                                 // V
    { hour: 6,  bars: [{ z: -0.009, rot: -22 }, { z: 0.0, rot: 22 }, { z: 0.009, rot: 0 }] },                             // VI
    { hour: 7,  bars: [{ z: -0.013, rot: -22 }, { z: -0.005, rot: 22 }, { z: 0.004, rot: 0 }, { z: 0.013, rot: 0 }] },    // VII
    { hour: 8,  bars: [{ z: -0.017, rot: -22 }, { z: -0.009, rot: 22 }, { z: 0.0, rot: 0 }, { z: 0.008, rot: 0 }, { z: 0.016, rot: 0 }] }, // VIII
    { hour: 9,  bars: [{ z: -0.010, rot: 0 }, { z: 0.001, rot: 25 }, { z: 0.010, rot: -25 }] },                            // IX
    { hour: 10, bars: [{ z: -0.005, rot: 25 }, { z: 0.005, rot: -25 }] },                                                 // X
    { hour: 11, bars: [{ z: -0.011, rot: 25 }, { z: -0.003, rot: -25 }, { z: 0.008, rot: 0 }] },                           // XI
  ];
  const numeralRadius = 0.102;
  for (const nc of romanHourConfigs) {
    const hourRad = ((nc.hour % 12) * 30 * Math.PI) / 180;
    const cy = dialCenterY + numeralRadius * Math.cos(hourRad);
    const cz = dialCenterZ + numeralRadius * Math.sin(hourRad);
    const numeralRotX = -(nc.hour % 12) * 30;

    for (let b = 0; b < nc.bars.length; b++) {
      const bar = nc.bars[b];
      createPart('Num_' + nc.hour + '_' + b, boxGeo(0.002, 0.020, 0.004), dialBlack, {
        position: [dialCenterX + 0.005, cy, cz + bar.z],
        rotation: [numeralRotX + bar.rot, 0, 0],
        parent: root,
      });
    }
  }

  // Painted Moon Phase Lunette (Rolling Moon Arch)
  const moonArchY = 1.99;
  createPart('MoonArchBackdrop', cylinderGeo(0.12, 0.12, 0.006, 20), dialMoon, {
    position: [dialCenterX + 0.001, moonArchY, 0],
    rotation: [0, 0, 90],
    scale: [1, 0.70, 1],
    parent: root,
  });
  // Golden Moon Face (smiling disc)
  createPart('MoonFaceGold', sphereGeo(0.042, 14, 10), dialGold, {
    position: [dialCenterX + 0.004, moonArchY + 0.01, 0],
    scale: [0.15, 1, 1],
    parent: root,
  });
  // Painted Golden Stars in the night sky
  const starCoords = [
    [0.05, -0.06], [0.04, 0.065], [0.06, 0.02],
    [-0.015, -0.075], [-0.025, 0.08], [0.025, -0.025],
    [0.01, 0.04], [0.03, -0.07],
  ];
  for (let st = 0; st < starCoords.length; st++) {
    const [sy, sz] = starCoords[st];
    createPart('StarA_' + st, boxGeo(0.002, 0.009, 0.0025), dialGold, {
      position: [dialCenterX + 0.004, moonArchY + sy, sz],
      parent: root,
    });
    createPart('StarB_' + st, boxGeo(0.002, 0.0025, 0.009), dialGold, {
      position: [dialCenterX + 0.004, moonArchY + sy, sz],
      parent: root,
    });
  }
  // Arched brass surround rim framing the moon dial
  createPart('MoonArchBrassRim', torusGeo(0.12, 0.006, 8, 20), brass, {
    position: [dialCenterX + 0.004, moonArchY, 0],
    rotation: [0, 90, 0],
    parent: root,
  });

  // Center Brass Arbor Collet & Cap Nut
  createPart('CenterArborCollet', cylinderGeo(0.014, 0.014, 0.014, 14), brass, {
    position: [dialCenterX + 0.006, dialCenterY, dialCenterZ],
    rotation: [0, 0, 90],
    parent: root,
  });
  createPart('CenterArborNut', sphereGeo(0.007, 10, 6), brass, {
    position: [dialCenterX + 0.016, dialCenterY, dialCenterZ],
    parent: root,
  });

  // Pierced Ornate Clock Hands (Display time: 10:10)
  // Hour Hand (Pointing towards 10 o'clock: ~120° from +Y)
  createPart('HourHandHeart', torusGeo(0.016, 0.0035, 6, 12), dialBlack, {
    position: [dialCenterX + 0.010, dialCenterY + 0.034, dialCenterZ - 0.028],
    rotation: [0, 90, 30],
    parent: root,
  });
  createPart('HourHandSpadeTip', coneGeo(0.009, 0.024, 8), dialBlack, {
    position: [dialCenterX + 0.010, dialCenterY + 0.052, dialCenterZ - 0.043],
    rotation: [0, 0, -50],
    parent: root,
  });
  createPart('HourHandShaft', cylinderGeo(0.003, 0.0045, 0.038, 6), dialBlack, {
    position: [dialCenterX + 0.010, dialCenterY + 0.017, dialCenterZ - 0.014],
    rotation: [50, 0, 0],
    parent: root,
  });

  // Minute Hand (Pointing towards 2 o'clock: ~60° from +Y)
  createPart('MinuteHandLoop1', torusGeo(0.014, 0.003, 6, 12), dialBlack, {
    position: [dialCenterX + 0.012, dialCenterY + 0.036, dialCenterZ + 0.032],
    rotation: [0, 90, -40],
    parent: root,
  });
  createPart('MinuteHandLoop2', torusGeo(0.010, 0.003, 6, 12), dialBlack, {
    position: [dialCenterX + 0.012, dialCenterY + 0.060, dialCenterZ + 0.052],
    rotation: [0, 90, -40],
    parent: root,
  });
  createPart('MinuteHandNeedle', coneGeo(0.006, 0.044, 8), dialBlack, {
    position: [dialCenterX + 0.012, dialCenterY + 0.088, dialCenterZ + 0.076],
    rotation: [0, 0, 40],
    parent: root,
  });
  createPart('MinuteHandShaft', cylinderGeo(0.003, 0.005, 0.052, 6), dialBlack, {
    position: [dialCenterX + 0.012, dialCenterY + 0.022, dialCenterZ + 0.018],
    rotation: [-40, 0, 0],
    parent: root,
  });

  // =========================================================================
  // 8. Hood Cornice, Swan-Neck Pediment & Brass Finials (Y: 2.12 to 2.36)
  // =========================================================================
  // Stepped Classical Cornice at the top of the hood (Y: 2.12 to 2.16)
  createPart('HoodCorniceLower', boxGeo(0.33, 0.025, 0.52), walnutDark, {
    position: [0, 2.1325, 0],
    parent: root,
  });
  createPart('HoodCorniceUpper', boxGeo(0.35, 0.025, 0.55), walnutDark, {
    position: [0, 2.1575, 0],
    parent: root,
  });

  // Swan-Neck Pediment: Twin Carved Arched Scrolls
  const scrollZOffsets = [-0.15, 0.15];
  for (let sc = 0; sc < 2; sc++) {
    const scz = scrollZOffsets[sc];
    const prefix = sc === 0 ? 'ScrollL_' : 'ScrollR_';
    const sign = sc === 0 ? -1 : 1;

    // Outer primary scroll molding
    createPart(prefix + 'ArchOuter', torusGeo(0.11, 0.018, 8, 16), walnutDark, {
      position: [0.08, 2.19, scz],
      rotation: [0, 90, sign * 25],
      parent: root,
    });
    // Inner fillet molding
    createPart(prefix + 'ArchInner', torusGeo(0.09, 0.008, 6, 14), walnutDark, {
      position: [0.082, 2.19, scz],
      rotation: [0, 90, sign * 25],
      parent: root,
    });
    // Center terminal rosettes in carved brass
    createPart(prefix + 'RosetteBrass', cylinderGeo(0.018, 0.018, 0.018, 14), brass, {
      position: [0.095, 2.245, sign * 0.055],
      rotation: [0, 0, 90],
      parent: root,
    });
    createPart(prefix + 'RosetteOrb', sphereGeo(0.013, 10, 6), brass, {
      position: [0.106, 2.245, sign * 0.055],
      parent: root,
    });
  }

  // Pediment Tympanum Backboard (Bookmatched walnut panel)
  createPart('PedimentTympanum', boxGeo(0.02, 0.14, 0.46), walnutBurl, {
    position: [-0.02, 2.21, 0],
    parent: root,
  });

  // Three Turned Brass Finials on Pedestals (Prompt rule: "brass finials")
  const finialConfigs = [
    { name: 'FinialLeft',   px: 0.08, py: 2.17, pz: -0.22, scale: 0.90 },
    { name: 'FinialCenter', px: 0.08, py: 2.22, pz: 0.0,   scale: 1.18 }, // Grand master center finial
    { name: 'FinialRight',  px: 0.08, py: 2.17, pz: 0.22,  scale: 0.90 },
  ];

  for (const fc of finialConfigs) {
    const s = fc.scale;
    createPart(fc.name + '_Plinth', boxGeo(0.050 * s, 0.028 * s, 0.050 * s), walnutDark, {
      position: [fc.px, fc.py + 0.014 * s, fc.pz],
      parent: root,
    });

    const baseY = fc.py + 0.028 * s;

    createPart(fc.name + '_Collar', boxGeo(0.035 * s, 0.012 * s, 0.035 * s), brass, {
      position: [fc.px, baseY + 0.006 * s, fc.pz],
      parent: root,
    });
    createPart(fc.name + '_Pedestal', cylinderGeo(0.013 * s, 0.020 * s, 0.020 * s, 14), brass, {
      position: [fc.px, baseY + 0.021 * s, fc.pz],
      parent: root,
    });
    createPart(fc.name + '_UrnBody', sphereGeo(0.026 * s, 14, 10), brass, {
      position: [fc.px, baseY + 0.046 * s, fc.pz],
      scale: [1, 1.25, 1],
      parent: root,
    });
    createPart(fc.name + '_UrnRim', torusGeo(0.018 * s, 0.0045 * s, 6, 14), brass, {
      position: [fc.px, baseY + 0.072 * s, fc.pz],
      rotation: [90, 0, 0],
      parent: root,
    });
    createPart(fc.name + '_SpireNeck', cylinderGeo(0.008 * s, 0.013 * s, 0.016 * s, 12), brass, {
      position: [fc.px, baseY + 0.083 * s, fc.pz],
      parent: root,
    });
    createPart(fc.name + '_Orb', sphereGeo(0.015 * s, 12, 8), brass, {
      position: [fc.px, baseY + 0.101 * s, fc.pz],
      parent: root,
    });
    createPart(fc.name + '_SpireNeedle', coneGeo(0.008 * s, 0.046 * s, 12), brass, {
      position: [fc.px, baseY + 0.132 * s, fc.pz],
      parent: root,
    });
  }

  return root;
}

// ===========================================================================
// Animation: Grandfather Clock Swinging Pendulum (Smooth Harmonic Motion)
// ===========================================================================
function animate() {
  const duration = 2.0;    // Standard 2-second cycle for a 1-second grandfather clock seconds pendulum
  const maxSwingDeg = 5.5; // Natural pendular swing angle with clean cabinet clearance

  // Sinusoidal harmonic oscillation around X axis (Y-Z plane, left-to-right swing)
  // Perfectly loops: pose at t = duration equals pose at t = 0
  const samples = 16;
  const swingKeys = [];
  for (let s = 0; s <= samples; s++) {
    const t = (s * duration) / samples;
    // Harmonic cosine swing: maximum tilt at t = 0 and t = duration, passes 0 at t = 0.5s & 1.5s
    const angleX = maxSwingDeg * Math.cos((2 * Math.PI * t) / duration);
    swingKeys.push({
      time: parseFloat(t.toFixed(4)),
      rotation: [parseFloat(angleX.toFixed(3)), 0, 0],
    });
  }

  return [
    createClip('swing', duration, [
      rotationTrack('Joint_Pendulum', swingKeys),
    ]),
  ];
}
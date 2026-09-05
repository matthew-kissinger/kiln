const meta = {
  name: 'Solar Sail Courier',
  category: 'vehicle',
  role: 'vehicle'
};

function build() {
  const root = createRoot('SolarSailCourier');

  // PBR Materials
  const hullIvory = gameMaterial(0xf6f4ec, { roughness: 0.32, metalness: 0.10 });
  const hullIvoryDark = gameMaterial(0xdcd6c8, { roughness: 0.42, metalness: 0.15 });
  const darkTitanium = gameMaterial(0x20242b, { roughness: 0.35, metalness: 0.88 });
  const sparTruss = gameMaterial(0x323842, { roughness: 0.38, metalness: 0.82 });
  const goldHardware = gameMaterial(0xdfba4e, { roughness: 0.24, metalness: 0.92 });
  const glowCyan = gameMaterial(0x00d4ff, { emissive: 0x00b4d8, emissiveIntensity: 2.5, roughness: 0.20 });
  const engineMetal = gameMaterial(0x16181d, { roughness: 0.28, metalness: 0.92 });

  // Brilliant reflective origami solar foil membranes
  const foilGold = gameMaterial(0xf5be38, { roughness: 0.14, metalness: 0.96, flatShading: true });
  const foilCopper = gameMaterial(0xd46632, { roughness: 0.16, metalness: 0.94, flatShading: true });
  foilGold.side = THREE.DoubleSide;
  foilCopper.side = THREE.DoubleSide;

  // =========================================================================
  // 1. COMPACT IVORY CARGO CORE (+X is forward, -X is aft)
  // =========================================================================
  const coreRoot = createRoot('CargoCore');
  root.add(coreRoot);

  // Main fuselage cylindrical body
  createPart('MainFuselage', cylinderGeo(0.28, 0.28, 0.90, 24), hullIvory, {
    position: [0.05, 0, 0],
    rotation: [0, 0, 90],
    parent: coreRoot
  });

  // Forward aerodynamic tapered nose cone
  createPart('NoseCone', cylinderGeo(0.08, 0.28, 0.80, 24), hullIvory, {
    position: [0.90, 0, 0],
    rotation: [0, 0, 90],
    parent: coreRoot
  });

  // Rounded nose cap
  createPart('NoseCap', sphereGeo(0.08, 16, 12), hullIvory, {
    position: [1.30, 0, 0],
    parent: coreRoot
  });

  // Forward telemetry sensor spike
  createPart('SensorSpike', cylinderGeo(0.008, 0.018, 0.40, 8), darkTitanium, {
    position: [1.50, 0, 0],
    rotation: [0, 0, 90],
    parent: coreRoot
  });

  // Optical sensor dome / telemetry blister
  createPart('SensorDomeTop', sphereGeo(0.06, 16, 12), glowCyan, {
    position: [1.10, 0.22, 0],
    parent: coreRoot
  });
  createPart('SensorHousingTop', cylinderGeo(0.065, 0.075, 0.05, 16), darkTitanium, {
    position: [1.10, 0.19, 0],
    parent: coreRoot
  });

  // Aft hull taper transition
  createPart('AftTransition', cylinderGeo(0.28, 0.20, 0.50, 24), hullIvory, {
    position: [-0.65, 0, 0],
    rotation: [0, 0, 90],
    parent: coreRoot
  });

  // Aft structural engine collar
  createPart('EngineCollar', cylinderGeo(0.21, 0.21, 0.16, 24), darkTitanium, {
    position: [-0.98, 0, 0],
    rotation: [0, 0, 90],
    parent: coreRoot
  });

  // Ion thruster expansion nozzle
  createPart('IonNozzle', cylinderGeo(0.14, 0.26, 0.36, 24), engineMetal, {
    position: [-1.24, 0, 0],
    rotation: [0, 0, 90],
    parent: coreRoot
  });

  // Ion propulsion luminous discharge grid
  createPart('IonGrid', cylinderGeo(0.135, 0.135, 0.04, 20), glowCyan, {
    position: [-1.12, 0, 0],
    rotation: [0, 0, 90],
    parent: coreRoot
  });

  // 4 modular cylindrical cargo pods strapped around the fuselage
  const cargoOffsets = [
    [0.05, 0.25, 0.25],
    [0.05, -0.25, 0.25],
    [0.05, -0.25, -0.25],
    [0.05, 0.25, -0.25]
  ];
  for (let c = 0; c < 4; c++) {
    const [cx, cy, cz] = cargoOffsets[c];
    createPart('CargoPod_' + c, cylinderGeo(0.08, 0.08, 0.65, 16), hullIvoryDark, {
      position: [cx, cy, cz],
      rotation: [0, 0, 90],
      parent: coreRoot
    });
    // Pod endcaps
    createPart('CargoCapFwd_' + c, sphereGeo(0.08, 12, 8), darkTitanium, {
      position: [cx + 0.325, cy, cz],
      parent: coreRoot
    });
    createPart('CargoCapAft_' + c, sphereGeo(0.08, 12, 8), darkTitanium, {
      position: [cx - 0.325, cy, cz],
      parent: coreRoot
    });
    // Gold restraint straps
    createPart('CargoStrapA_' + c, torusGeo(0.085, 0.01, 8, 16), goldHardware, {
      position: [cx + 0.18, cy, cz],
      rotation: [0, 90, 0],
      parent: coreRoot
    });
    createPart('CargoStrapB_' + c, torusGeo(0.085, 0.01, 8, 16), goldHardware, {
      position: [cx - 0.18, cy, cz],
      rotation: [0, 90, 0],
      parent: coreRoot
    });
  }

  // 4 Attitude Control Thruster (RCS) quads
  const rcsAngles = [0, 90, 180, 270];
  for (let r = 0; r < 4; r++) {
    const deg = rcsAngles[r];
    const rad = (deg * Math.PI) / 180;
    const ry = 0.27 * Math.cos(rad);
    const rz = 0.27 * Math.sin(rad);
    // Forward RCS
    createPart('RCSBlockFwd_' + r, boxGeo(0.06, 0.05, 0.05), darkTitanium, {
      position: [0.75, ry, rz],
      rotation: [deg, 0, 0],
      parent: coreRoot
    });
    createPart('RCSNozzleFwd_' + r, coneGeo(0.02, 0.04, 8), goldHardware, {
      position: [0.75, ry * 1.15, rz * 1.15],
      rotation: [deg, 0, 0],
      parent: coreRoot
    });
  }

  // Central octagonal structural collar ring at X=0 where the 4 spars attach
  createPart('CollarRing', cylinderGeo(0.33, 0.33, 0.14, 16), darkTitanium, {
    position: [0, 0, 0],
    rotation: [0, 0, 90],
    parent: coreRoot
  });
  createPart('CollarFlangeFwd', torusGeo(0.33, 0.016, 8, 24), goldHardware, {
    position: [0.07, 0, 0],
    rotation: [0, 90, 0],
    parent: coreRoot
  });
  createPart('CollarFlangeAft', torusGeo(0.33, 0.016, 8, 24), goldHardware, {
    position: [-0.07, 0, 0],
    rotation: [0, 90, 0],
    parent: coreRoot
  });

  // =========================================================================
  // 2. ARTICULATED DELICATE SPARS & ORIGAMI SOLAR FOIL WINGS
  // =========================================================================
  const quadAnglesDeg = [45, 135, 225, 315];

  for (let k = 0; k < 4; k++) {
    const qDeg = quadAnglesDeg[k];

    // Orientation root for quadrant k
    // Local frame: +X forward, +Y radially along boom, +Z transverse along sail
    const mountPivot = createPivot('Mount_' + k, [0, 0, 0], root);
    mountPivot.rotation.x = (qDeg * Math.PI) / 180;

    // Collar hinge clevis bracket
    createPart('CollarClevis_' + k, boxGeo(0.12, 0.06, 0.08), darkTitanium, {
      position: [0, 0.33, 0],
      parent: mountPivot
    });

    // PRIMARY ARTICULATED BOOM JOINT
    // Rotates around local Z axis for stowed/deployed transition
    const boomJoint = createPivot('Boom_' + k, [0, 0.36, 0], mountPivot);

    // Boom root hinge pin
    createPart('HingePinRoot_' + k, cylinderGeo(0.016, 0.016, 0.10, 12), goldHardware, {
      position: [0, 0, 0],
      rotation: [90, 0, 0],
      parent: boomJoint
    });

    // Hydraulic deployment actuator pushrod
    beamBetween('ActuatorCylinder_' + k, [0.08, -0.05, 0], [0.03, 0.22, 0], 0.014, darkTitanium, {
      parent: boomJoint
    });
    beamBetween('ActuatorPiston_' + k, [0.03, 0.22, 0], [0.01, 0.35, 0], 0.008, goldHardware, {
      parent: boomJoint
    });

    // --- INNER LATTICE SPAR (Length = 1.35m along +Y) ---
    buildLatticeSparSegment('InnerSpar_' + k, 0.05, 1.35, 0.075, sparTruss, goldHardware, boomJoint);

    // Mechanical hinge brackets along inner spar for sail panel attachment
    const innerHingeY = [0.25, 0.55, 0.85, 1.15];
    for (let h = 0; h < innerHingeY.length; h++) {
      const hy = innerHingeY[h];
      createPart('InnerHingeLug_' + k + '_' + h, boxGeo(0.03, 0.04, 0.04), darkTitanium, {
        position: [0, hy, 0.045],
        parent: boomJoint
      });
      createPart('InnerHingePin_' + k + '_' + h, cylinderGeo(0.008, 0.008, 0.05, 10), goldHardware, {
        position: [0, hy, 0.065],
        rotation: [0, 0, 90],
        parent: boomJoint
      });
    }

    // --- MID-SPAR ARTICULATED JOINT ---
    const midBoomJoint = createPivot('MidBoom_' + k, [0, 1.35, 0], boomJoint);

    // Mid-spar hinge knuckle & torsion spring
    createPart('MidHingeBarrel_' + k, cylinderGeo(0.02, 0.02, 0.08, 12), darkTitanium, {
      position: [0, 0, 0],
      rotation: [90, 0, 0],
      parent: midBoomJoint
    });
    createPart('MidHingePin_' + k, cylinderGeo(0.01, 0.01, 0.10, 12), goldHardware, {
      position: [0, 0, 0],
      rotation: [90, 0, 0],
      parent: midBoomJoint
    });
    createPart('TorsionSpring_' + k, torusGeo(0.024, 0.006, 8, 16), goldHardware, {
      position: [0, 0, 0.03],
      parent: midBoomJoint
    });

    // --- OUTER LATTICE SPAR (Length = 1.35m along +Y) ---
    buildLatticeSparSegment('OuterSpar_' + k, 0.05, 1.35, 0.060, sparTruss, goldHardware, midBoomJoint);

    // Mechanical hinge brackets along outer spar
    const outerHingeY = [0.25, 0.55, 0.85, 1.15];
    for (let h = 0; h < outerHingeY.length; h++) {
      const hy = outerHingeY[h];
      createPart('OuterHingeLug_' + k + '_' + h, boxGeo(0.025, 0.035, 0.035), darkTitanium, {
        position: [0, hy, 0.040],
        parent: midBoomJoint
      });
      createPart('OuterHingePin_' + k + '_' + h, cylinderGeo(0.007, 0.007, 0.045, 10), goldHardware, {
        position: [0, hy, 0.055],
        rotation: [0, 0, 90],
        parent: midBoomJoint
      });
    }

    // Outer boom tip package: probe, optical beacon, tension rigging spreader
    createPart('TipHub_' + k, sphereGeo(0.04, 12, 8), darkTitanium, {
      position: [0, 1.38, 0],
      parent: midBoomJoint
    });
    createPart('TipBeacon_' + k, cylinderGeo(0.015, 0.015, 0.05, 12), glowCyan, {
      position: [0, 1.42, 0],
      parent: midBoomJoint
    });
    createPart('TipProbe_' + k, cylinderGeo(0.004, 0.008, 0.18, 8), goldHardware, {
      position: [0, 1.50, 0],
      parent: midBoomJoint
    });

    // Tension rigging spreader spar
    beamBetween('TipSpreaderA_' + k, [0, 1.38, 0], [0.06, 1.32, 0.14], 0.007, sparTruss, { parent: midBoomJoint });
    beamBetween('TipSpreaderB_' + k, [0, 1.38, 0], [-0.06, 1.32, 0.14], 0.007, sparTruss, { parent: midBoomJoint });

    // --- ORIGAMI SOLAR FOIL WINGS ---
    // Inner Segmented Origami Sail Panel (hinged on inner boom)
    const sailInnerJoint = createPivot('SailInner_' + k, [0, 0.15, 0.07], boomJoint);
    createOrigamiSailPanel({
      name: 'InnerFoil_' + k,
      rMin: 0.10,
      rMax: 1.20,
      angleRad: 0.62,
      numRings: 10,
      numRays: 7,
      foldDepth: 0.055,
      matGold: foilGold,
      matCopper: foilCopper,
      parent: sailInnerJoint
    });
    // Inner panel spar-side reinforcement batten
    beamBetween('InnerBatten_' + k, [0, 0.10, 0], [0, 1.20, 0], 0.008, darkTitanium, {
      parent: sailInnerJoint
    });

    // Outer Segmented Origami Sail Panel (hinged on outer boom)
    const sailOuterJoint = createPivot('SailOuter_' + k, [0, 0.08, 0.06], midBoomJoint);
    createOrigamiSailPanel({
      name: 'OuterFoil_' + k,
      rMin: 0.08,
      rMax: 1.25,
      angleRad: 0.70,
      numRings: 12,
      numRays: 8,
      foldDepth: 0.065,
      matGold: foilGold,
      matCopper: foilCopper,
      parent: sailOuterJoint
    });
    // Outer panel spar-side reinforcement batten
    beamBetween('OuterBatten_' + k, [0, 0.08, 0], [0, 1.25, 0], 0.007, darkTitanium, {
      parent: sailOuterJoint
    });

    // Tension rigging cable between inner and outer sail battens
    beamBetween('RiggingCable_' + k, [0, 1.20, 0], [0, 0.08, 0], 0.004, goldHardware, {
      parent: sailInnerJoint
    });
  }

  return root;
}

// ===========================================================================
// HELPER: Triangular Lattice Spar Construction
// ===========================================================================
function buildLatticeSparSegment(name, yStart, yEnd, radius, trussMat, accentMat, parent) {
  const length = yEnd - yStart;
  const numBays = 6;
  const bayLen = length / numBays;
  const r0 = radius;
  const r1 = radius * 0.75; // Subtle taper towards outer end

  // 3 longeron carbon tubes forming a triangular prism
  const longeronAngles = [0, 120, 240];
  const longeronPts = [];

  for (let a = 0; a < 3; a++) {
    const deg = longeronAngles[a];
    const rad = (deg * Math.PI) / 180;
    const x0 = r0 * Math.sin(rad);
    const z0 = r0 * Math.cos(rad);
    const x1 = r1 * Math.sin(rad);
    const z1 = r1 * Math.cos(rad);

    beamBetween(name + '_Longeron_' + a, [x0, yStart, z0], [x1, yEnd, z1], 0.007, trussMat, { parent });

    const pts = [];
    for (let b = 0; b <= numBays; b++) {
      const t = b / numBays;
      const r = r0 + t * (r1 - r0);
      pts.push([r * Math.sin(rad), yStart + t * length, r * Math.cos(rad)]);
    }
    longeronPts.push(pts);
  }

  // Cross battens and diagonal cross-braces for each lattice bay
  for (let b = 0; b < numBays; b++) {
    for (let s = 0; s < 3; s++) {
      const sNext = (s + 1) % 3;
      const p0 = longeronPts[s][b];
      const p1 = longeronPts[sNext][b];
      const pNext0 = longeronPts[s][b + 1];
      const pNext1 = longeronPts[sNext][b + 1];

      // Batten ring strut
      beamBetween(name + '_Batten_' + b + '_' + s, p0, p1, 0.005, trussMat, { parent });

      // Diagonal cross brace
      beamBetween(name + '_Diag_' + b + '_' + s, p0, pNext1, 0.004, accentMat, { parent });
    }
  }
}

// ===========================================================================
// HELPER: Origami-Folded Solar Foil Mesh (Miura-Ori Faceted Tessellation)
// ===========================================================================
function createOrigamiSailPanel(opts) {
  const { name, rMin, rMax, angleRad, numRings, numRays, foldDepth, matGold, matCopper, parent } = opts;

  // Grid coordinates
  const grid = [];
  for (let i = 0; i <= numRings; i++) {
    const u = i / numRings;
    const r = rMin + u * (rMax - rMin);
    const row = [];
    for (let j = 0; j <= numRays; j++) {
      const v = j / numRays;
      const theta = v * angleRad;

      // In the sail local frame:
      // +Y is along the boom spar (radial)
      // +Z is transverse across the sail quadrant
      // +X is out-of-plane origami fold displacement
      const y = r * Math.cos(theta);
      const z = r * Math.sin(theta);

      // Origami mountain/valley crease displacement
      const parity = ((i + j) % 2 === 0) ? 1 : -1;
      // Edge weight: 0 at spar attachment (j=0) so the edge mounts flush to the straight spar batten!
      const edgeWeight = Math.sin(v * Math.PI * 0.5);
      const radialScale = 0.5 + 0.5 * u;
      const x = parity * foldDepth * edgeWeight * radialScale;

      row.push([x, y, z]);
    }
    grid.push(row);
  }

  // Generate planar faceted triangles
  const posGold = [];
  const idxGold = [];
  const posCopper = [];
  const idxCopper = [];

  function addTri(posArr, idxArr, pA, pB, pC) {
    const base = posArr.length / 3;
    posArr.push(pA[0], pA[1], pA[2], pB[0], pB[1], pB[2], pC[0], pC[1], pC[2]);
    idxArr.push(base, base + 1, base + 2);
  }

  for (let i = 0; i < numRings; i++) {
    for (let j = 0; j < numRays; j++) {
      const p00 = grid[i][j];
      const p10 = grid[i + 1][j];
      const p11 = grid[i + 1][j + 1];
      const p01 = grid[i][j + 1];

      // Material pattern: geometric gold/copper alternating chevrons
      const isGold = ((Math.floor(i / 2) + Math.floor(j / 2)) % 2 === 0);
      const targetPos = isGold ? posGold : posCopper;
      const targetIdx = isGold ? idxGold : idxCopper;

      // Rigid origami fold crease diagonal alternates with parity
      if ((i + j) % 2 === 0) {
        addTri(targetPos, targetIdx, p00, p10, p11);
        addTri(targetPos, targetIdx, p00, p11, p01);
      } else {
        addTri(targetPos, targetIdx, p00, p10, p01);
        addTri(targetPos, targetIdx, p10, p11, p01);
      }
    }
  }

  if (posGold.length > 0) {
    const geoGold = meshGeo({ positions: posGold, indices: idxGold });
    createPart(name + '_Gold', geoGold, matGold, { parent });
  }
  if (posCopper.length > 0) {
    const geoCopper = meshGeo({ positions: posCopper, indices: idxCopper });
    createPart(name + '_Copper', geoCopper, matCopper, { parent });
  }
}

// ===========================================================================
// ANIMATION: Solar Sail Deployment Sequence
// ===========================================================================
function animate(root) {
  const tracks = [];
  const duration = 3.0;

  for (let k = 0; k < 4; k++) {
    // 1. Primary Boom Deployment
    // Folds tightly along fuselage at t=0, swings outward to radial position
    tracks.push(
      rotationTrack('Joint_Boom_' + k, [
        { time: 0.0, rotation: [0, 0, -78] },
        { time: 0.8, rotation: [0, 0, -32] },
        { time: 1.6, rotation: [0, 0, 0] },
        { time: 3.0, rotation: [0, 0, 0] }
      ])
    );

    // 2. Mid-Boom Articulation
    // Tucked inward during cruise, locks straight during deployment
    tracks.push(
      rotationTrack('Joint_MidBoom_' + k, [
        { time: 0.0, rotation: [0, 0, 24] },
        { time: 0.8, rotation: [0, 0, 10] },
        { time: 1.6, rotation: [0, 0, 0] },
        { time: 3.0, rotation: [0, 0, 0] }
      ])
    );

    // 3. Inner Origami Sail Panel Hinge
    // Folded against the boom, unfurls radially
    tracks.push(
      rotationTrack('Joint_SailInner_' + k, [
        { time: 0.0, rotation: [0, 0, 75] },
        { time: 0.9, rotation: [0, 0, 35] },
        { time: 1.8, rotation: [0, 0, 0] },
        { time: 3.0, rotation: [0, 0, 0] }
      ])
    );

    // 4. Outer Origami Sail Panel Hinge
    // Tightly folded accordion over inner panel, blooms wide into full sail
    tracks.push(
      rotationTrack('Joint_SailOuter_' + k, [
        { time: 0.0, rotation: [0, 0, -135] },
        { time: 0.9, rotation: [0, 0, -60] },
        { time: 1.8, rotation: [0, 0, 0] },
        { time: 3.0, rotation: [0, 0, 0] }
      ])
    );
  }

  return [createClip('Deploy', duration, tracks)];
}

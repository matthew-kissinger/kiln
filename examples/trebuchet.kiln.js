// Authored by: gemini-3.8-flash-high, via agy.
//
// Written by the model itself through the Kiln MCP tools, and cut off
// mid-run rather than finished -- by a provider limit, or by the
// dispatch deadline. The program below is what was on disk when the
// session ended; how many times it had looked at its own contact sheet
// by then is not recorded, so this one does not make the claim the
// others do.
//
// Dispatched into a clean directory containing only the brief and the Kiln
// skills, with no access to this repository or to any finished example.

const meta = { name: 'Trebuchet', category: 'prop' };

function build() {
  const root = createRoot('Trebuchet');

  // Materials
  const woodDark = gameMaterial(0x4a3525, { roughness: 0.85, metalness: 0.05 });
  const woodBeam = gameMaterial(0x5c432d, { roughness: 0.8, metalness: 0.05 });
  const woodLight = gameMaterial(0x705338, { roughness: 0.85, metalness: 0.05 });
  const ironMat = gameMaterial(0x242628, { roughness: 0.45, metalness: 0.85 });
  const ropeMat = gameMaterial(0x998365, { roughness: 0.95, metalness: 0.0 });
  const stoneMat = gameMaterial(0x7a7975, { roughness: 0.9, metalness: 0.05 });
  const leatherMat = gameMaterial(0x5a341a, { roughness: 0.85, metalness: 0.1 });

  // Geometry dimensions
  // Base: length 8.0 along X (-4.8 to 3.2), width 2.4 along Z (-1.2 to 1.2), sits on Y=0
  const baseRunnerGeo = boxGeo(8.0, 0.3, 0.25);
  const runnerY = 0.15;
  const zLeft = -1.1;
  const zRight = 1.1;

  // Runners
  createPart('Runner_Left', baseRunnerGeo, woodDark, { position: [-0.8, runnerY, zLeft], parent: root });
  createPart('Runner_Right', baseRunnerGeo, woodDark, { position: [-0.8, runnerY, zRight], parent: root });

  // Ladder cross rungs (7 rungs)
  const rungGeo = boxGeo(0.25, 0.22, 2.2);
  const rungXs = [-4.6, -3.2, -1.8, -0.4, 1.0, 2.2, 3.0];
  for (let i = 0; i < rungXs.length; i++) {
    createPart(`Rung_${i}`, rungGeo, woodDark, { position: [rungXs[i], runnerY + 0.02, 0], parent: root });
  }

  // Launch trough along center of ladder frame
  const troughBaseGeo = boxGeo(5.0, 0.06, 0.6);
  createPart('Trough_Base', troughBaseGeo, woodLight, { position: [-1.2, runnerY + 0.12, 0], parent: root });
  const troughSideGeo = boxGeo(5.0, 0.14, 0.06);
  createPart('Trough_SideL', troughSideGeo, woodLight, { position: [-1.2, runnerY + 0.18, -0.3], parent: root });
  createPart('Trough_SideR', troughSideGeo, woodLight, { position: [-1.2, runnerY + 0.18, 0.3], parent: root });

  // Outriggers / stabilizers on base
  const outriggerGeo = boxGeo(0.22, 0.25, 3.4);
  createPart('Outrigger_Front', outriggerGeo, woodDark, { position: [1.8, runnerY, 0], parent: root });
  createPart('Outrigger_Rear', outriggerGeo, woodDark, { position: [-3.8, runnerY, 0], parent: root });

  // A-Frame Apex position
  const apexX = 0.2;
  const apexY = 4.6;

  // A-Frame uprights on Left and Right
  const legRadius = 0.14;
  [zLeft, zRight].forEach((z, idx) => {
    const side = idx === 0 ? 'L' : 'R';

    // Front leg: from (1.8, 0.3, z) to (apexX, apexY, z)
    beamBetween(`Leg_Front_${side}`, [1.8, 0.3, z], [apexX, apexY, z], legRadius, woodDark, { parent: root });

    // Rear leg: from (-3.0, 0.3, z) to (apexX, apexY, z)
    beamBetween(`Leg_Rear_${side}`, [-3.0, 0.3, z], [apexX, apexY, z], legRadius, woodDark, { parent: root });

    // Vertical kingpost: from (apexX, 0.3, z) to (apexX, apexY, z)
    beamBetween(`Kingpost_${side}`, [apexX, 0.3, z], [apexX, apexY, z], legRadius * 0.9, woodDark, { parent: root });

    // Horizontal tie beam at Y = 2.2
    beamBetween(`Tie_Horiz_${side}`, [-1.5, 2.2, z], [1.1, 2.2, z], legRadius * 0.85, woodDark, { parent: root });

    // Diagonal braces
    beamBetween(`Brace_Front_${side}`, [0.2, 2.2, z], [1.5, 0.3, z], legRadius * 0.7, woodDark, { parent: root });
    beamBetween(`Brace_Rear_${side}`, [0.2, 2.2, z], [-2.2, 0.3, z], legRadius * 0.7, woodDark, { parent: root });

    // Apex bearing block
    const capGeo = boxGeo(0.5, 0.4, 0.32);
    createPart(`BearingBlock_${side}`, capGeo, woodBeam, { position: [apexX, apexY, z], parent: root });
    const strapGeo = boxGeo(0.52, 0.42, 0.08);
    createPart(`BearingStrap_${side}`, strapGeo, ironMat, { position: [apexX, apexY, z + (idx === 0 ? -0.16 : 0.16)], parent: root });
  });

  // Cross-bracing between trusses (Left & Right)
  beamBetween('Cross_Apex_Front', [apexX + 0.2, apexY - 0.4, zLeft], [apexX + 0.2, apexY - 0.4, zRight], 0.1, woodDark, { parent: root });
  beamBetween('Cross_Apex_Rear', [apexX - 0.2, apexY - 0.4, zLeft], [apexX - 0.2, apexY - 0.4, zRight], 0.1, woodDark, { parent: root });
  beamBetween('Cross_Tie_Mid', [apexX, 2.2, zLeft], [apexX, 2.2, zRight], 0.11, woodDark, { parent: root });
  beamBetween('Cross_Tie_Front', [1.1, 2.2, zLeft], [1.1, 2.2, zRight], 0.1, woodDark, { parent: root });
  beamBetween('Cross_Tie_Rear', [-1.5, 2.2, zLeft], [-1.5, 2.2, zRight], 0.1, woodDark, { parent: root });

  // X-bracing between rear legs
  beamBetween('X_Rear_1', [-1.5, 2.2, zLeft], [-3.0, 0.3, zRight], 0.06, woodDark, { parent: root });
  beamBetween('X_Rear_2', [-1.5, 2.2, zRight], [-3.0, 0.3, zLeft], 0.06, woodDark, { parent: root });

  // Main Axle at apex
  const axleGeo = cylinderZGeo(0.1, 0.1, 2.8, 12);
  createPart('Main_Axle', axleGeo, ironMat, { position: [apexX, apexY, 0], parent: root });

  // Throwing Beam
  // Rotated in cocked position: beam tilted down to rear (-X), short end up to front (+X).
  // Tilt angle around Z: e.g. -38 degrees.
  const beamPivot = createPivot('BeamPivot', [apexX, apexY, 0], root);
  beamPivot.rotation.z = -38 * Math.PI / 180;

  // The beam geometry centered at pivot or offset.
  // Total beam length: 7.2m. Short arm = 1.6m (+X), Long arm = 5.6m (-X).
  // Beam center offset: (1.6 - 5.6) / 2 = -2.0m.
  const beamGeo = boxGeo(7.2, 0.35, 0.28);
  createPart('Throwing_Beam', beamGeo, woodBeam, { position: [-2.0, 0, 0], parent: beamPivot });

  // Beam iron reinforcement bands around pivot
  const ironCollarGeo = boxGeo(0.8, 0.42, 0.34);
  createPart('Beam_Collar', ironCollarGeo, ironMat, { position: [0, 0, 0], parent: beamPivot });

  // Beam taper / reinforcement cheeks
  const cheekGeo = boxGeo(2.4, 0.12, 0.32);
  createPart('Beam_CheekTop', cheekGeo, woodDark, { position: [-0.5, 0.22, 0], parent: beamPivot });
  createPart('Beam_CheekBottom', cheekGeo, woodDark, { position: [-0.5, -0.22, 0], parent: beamPivot });

  // Release finger at long beam tip
  // Beam tip is at local X = -5.6
  const fingerGeo = cylinderXGeo(0.025, 0.015, 0.5, 8);
  createPart('Release_Finger', fingerGeo, ironMat, { position: [-5.7, 0.1, 0], rotation: [0, 0, 25], parent: beamPivot });
  const fingerRingGeo = torusGeo(0.06, 0.015, 8, 16);
  createPart('Finger_BaseRing', fingerRingGeo, ironMat, { position: [-5.55, 0.05, 0], rotation: [0, 90, 0], parent: beamPivot });

  // Trunnion axle on short end of beam (local X = 1.5)
  const trunnionAxleGeo = cylinderZGeo(0.06, 0.06, 1.4, 10);
  createPart('Trunnion_Axle', trunnionAxleGeo, ironMat, { position: [1.5, 0, 0], parent: beamPivot });

  // Counterweight:
  // Must hang vertically free! So create counterweight pivot attached to root at trunnion world position.
  // Let's find trunnion world position:
  // Apex = (apexX, apexY, 0). Short arm is at angle -38 deg.
  // dx = 1.5 * cos(-38 deg) = 1.5 * 0.788 = 1.182
  // dy = 1.5 * sin(-38 deg) = 1.5 * (-0.615) = -0.923 (wait, rotation around Z: +38 tilts short arm UP if +X goes to +Y!)
  // In Three.js: rotation around Z: x' = x*cos(theta) - y*sin(theta); y' = x*sin(theta) + y*cos(theta)
  // With theta = +38 deg: x' = 1.5*cos(38) = 1.18, y' = 1.5*sin(38) = 0.92.
  // If we want short arm UP and long arm DOWN: theta should be positive (+35 deg)!
  // Let's adjust beamPivot rotation:
  // theta = 38 deg.
  // Short arm (+X) goes to X = apexX + 1.5*cos(38°) = 0.2 + 1.18 = 1.38, Y = apexY + 1.5*sin(38°) = 4.6 + 0.92 = 5.52.
  // Long arm (-X) goes to X = apexX - 5.6*cos(38°) = 0.2 - 4.41 = -4.21, Y = apexY - 5.6*sin(38°) = 4.6 - 3.45 = 1.15.
  // Perfect!
  beamPivot.rotation.z = 38 * Math.PI / 180;

  const trunnionX = apexX + 1.5 * Math.cos(38 * Math.PI / 180);
  const trunnionY = apexY + 1.5 * Math.sin(38 * Math.PI / 180);

  // Counterweight hangs straight down from (trunnionX, trunnionY, 0)
  const cwPivot = createPivot('CounterweightPivot', [trunnionX, trunnionY, 0], root);

  // Counterweight suspension arms (iron hangers on left and right)
  const hangerArmGeo = boxGeo(0.08, 1.4, 0.05);
  createPart('Hanger_L', hangerArmGeo, ironMat, { position: [0, -0.65, -0.6], parent: cwPivot });
  createPart('Hanger_R', hangerArmGeo, ironMat, { position: [0, -0.65, 0.6], parent: cwPivot });

  // Counterweight box: wooden crate with iron straps
  const boxW = 1.1;
  const boxH = 1.2;
  const boxD = 1.1;
  const cwBoxGeo = boxGeo(boxW, boxH, boxD);
  createPart('CW_Box', cwBoxGeo, woodDark, { position: [0, -1.6, 0], parent: cwPivot });

  // Iron straps around counterweight box
  const strapHGeo = boxGeo(boxW + 0.04, 0.08, boxD + 0.04);
  createPart('CW_Strap_H1', strapHGeo, ironMat, { position: [0, -1.2, 0], parent: cwPivot });
  createPart('CW_Strap_H2', strapHGeo, ironMat, { position: [0, -1.9, 0], parent: cwPivot });
  const strapVGeo = boxGeo(0.08, boxH + 0.04, boxD + 0.04);
  createPart('CW_Strap_V1', strapVGeo, ironMat, { position: [-0.4, -1.6, 0], parent: cwPivot });
  createPart('CW_Strap_V2', strapVGeo, ironMat, { position: [0.4, -1.6, 0], parent: cwPivot });

  // Ballast rocks visible on top of counterweight box
  for (let i = 0; i < 6; i++) {
    const rockGeo = sphereGeo(0.18 + (i % 3) * 0.03, 6, 6);
    const rx = ((i % 3) - 1) * 0.3;
    const rz = (Math.floor(i / 3) - 0.5) * 0.4;
    createPart(`CW_Rock_${i}`, rockGeo, stoneMat, { position: [rx, -0.95, rz], parent: cwPivot });
  }

  // Beam tip world position:
  const tipX = apexX - 5.6 * Math.cos(38 * Math.PI / 180);
  const tipY = apexY - 5.6 * Math.sin(38 * Math.PI / 180);

  // Windlass assembly at rear (-X)
  const windlassX = -4.3;
  const windlassY = 0.55;

  // Upright support posts for windlass
  const winPostGeo = boxGeo(0.18, 0.8, 0.18);
  createPart('WinPost_L', winPostGeo, woodDark, { position: [windlassX, windlassY, -0.65], parent: root });
  createPart('WinPost_R', winPostGeo, woodDark, { position: [windlassX, windlassY, 0.65], parent: root });

  // Windlass drum axle
  const drumAxleGeo = cylinderZGeo(0.04, 0.04, 1.6, 10);
  createPart('Windlass_Axle', drumAxleGeo, ironMat, { position: [windlassX, windlassY + 0.25, 0], parent: root });

  // Wooden winding drum in center
  const drumGeo = cylinderZGeo(0.16, 0.16, 0.8, 12);
  createPart('Windlass_Drum', drumGeo, woodLight, { position: [windlassX, windlassY + 0.25, 0], parent: root });

  // Ratchet wheel and pawl
  const ratchetDiscGeo = cylinderZGeo(0.24, 0.24, 0.05, 16);
  createPart('Ratchet_Disc', ratchetDiscGeo, ironMat, {
    position: [windlassX, windlassY + 0.25, 0.45],
    parent: root
  });
  const toothGeo = boxGeo(0.08, 0.04, 0.05);
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    createPart(`Ratchet_Tooth_${i}`, toothGeo, ironMat, {
      position: [windlassX + Math.cos(angle) * 0.24, windlassY + 0.25 + Math.sin(angle) * 0.24, 0.45],
      rotation: [0, 0, (angle * 180 / Math.PI) + 30],
      parent: root
    });
  }
  const pawlGeo = boxGeo(0.22, 0.05, 0.04);
  createPart('Ratchet_Pawl', pawlGeo, ironMat, {
    position: [windlassX - 0.15, windlassY + 0.45, 0.45],
    rotation: [0, 0, -30],
    parent: root
  });

  // Windlass spokes / hand wheel on outer right side
  for (let a = 0; a < 4; a++) {
    const spokeGeo = cylinderGeo(0.025, 0.025, 1.1, 8);
    createPart(`WinSpoke_${a}`, spokeGeo, woodDark, {
      position: [windlassX, windlassY + 0.25, 0.82],
      rotation: [0, 0, a * 45],
      parent: root
    });
  }

  // Cocking rope from windlass drum to beam tip hook
  beamBetween('Cocking_Rope', [windlassX, windlassY + 0.35, 0], [tipX, tipY, 0], 0.025, ropeMat, { parent: root });

  // Stone Ball and Leather Pouch in trough
  // Stone ball sits in trough at X = -1.2, Y = 0.45, Z = 0
  const stoneRadius = 0.22;
  const stoneX = -1.2;
  const stoneY = runnerY + 0.12 + 0.03 + stoneRadius;
  const stoneGeo = sphereGeo(stoneRadius, 12, 10);
  createPart('Stone_Shot', stoneGeo, stoneMat, { position: [stoneX, stoneY, 0], parent: root });

  // Leather pouch under and around stone
  const pouchGeo = boxGeo(0.55, 0.08, 0.48);
  createPart('Leather_Pouch', pouchGeo, leatherMat, { position: [stoneX, stoneY - stoneRadius + 0.03, 0], parent: root });

  // Sling ropes running from beam tip to leather pouch
  beamBetween('Sling_Rope_L', [tipX, tipY + 0.05, -0.06], [stoneX - 0.25, stoneY - 0.05, -0.2], 0.015, ropeMat, { parent: root });
  beamBetween('Sling_Rope_R', [tipX, tipY + 0.05, 0.06], [stoneX - 0.25, stoneY - 0.05, 0.2], 0.015, ropeMat, { parent: root });

  // Rope lashings and iron brackets at critical joints
  // Base corners iron straps
  [-4.6, 3.0].forEach(bx => {
    [zLeft, zRight].forEach((bz, bidx) => {
      const cornerStrap = boxGeo(0.35, 0.32, 0.3);
      createPart(`Strap_Base_${bx > 0 ? 'F' : 'R'}_${bidx === 0 ? 'L' : 'R'}`, cornerStrap, ironMat, { position: [bx, runnerY, bz], parent: root });
    });
  });

  // Lashings around A-frame leg bases
  [zLeft, zRight].forEach((z, idx) => {
    const s = idx === 0 ? 'L' : 'R';
    const lashingGeo = cylinderGeo(0.2, 0.2, 0.25, 8);
    createPart(`Lash_Front_${s}`, lashingGeo, ropeMat, { position: [1.8, 0.35, z], parent: root });
    createPart(`Lash_Rear_${s}`, lashingGeo, ropeMat, { position: [-3.0, 0.35, z], parent: root });
  });

  return root;
}

// Authored by: gemini-3.8-flash-high, via agy.
//
// Written by the model itself through the Kiln MCP tools: it wrote the
// program, rendered it, looked at its own six-view contact sheet, and
// revised. Not a line of it is hand-authored.

const meta = { name: 'HotAirBalloon', category: 'prop' };

async function build() {
  const root = createRoot('HotAirBalloon');

  // ==========================================
  // MATERIALS PALETTE (11 Functional Materials)
  // ==========================================
  // Striped envelope colors (vibrant carnival / festival balloon)
  const matRed = gameMaterial(0xc62828, { roughness: 0.75 });
  const matCream = gameMaterial(0xf5f3ea, { roughness: 0.75 });
  const matBlue = gameMaterial(0x1565c0, { roughness: 0.75 });
  const matGold = gameMaterial(0xfbc02d, { roughness: 0.75 });
  const envColors = [matRed, matCream, matBlue, matGold];

  // Structural dark trim (skirt, load rings, cables, tank straps)
  const matDarkTrim = gameMaterial(0x242424, { roughness: 0.65 });

  // Metals
  const matSteel = gameMaterial(0xb2bec3, { metalness: 0.88, roughness: 0.28 });
  const matBrass = gameMaterial(0xd4af37, { metalness: 0.90, roughness: 0.25 });

  // Wicker & Wood
  const matWicker = gameMaterial(0x9a6e3e, { roughness: 0.92 });
  const matWickerDark = gameMaterial(0x684722, { roughness: 0.92 });
  const matWood = gameMaterial(0x422610, { roughness: 0.85 });
  const matLeather = gameMaterial(0x381b0c, { roughness: 0.65 });

  // Ballast Canvas & Rigging Ropes
  const matSandbag = gameMaterial(0xcbb082, { roughness: 0.95 });
  const matRope = gameMaterial(0x735038, { roughness: 0.90 });

  // ==========================================
  // 1. BASKET BASE & RUNNERS (Sitting on Y=0)
  // ==========================================
  // Heavy hardwood skids resting on ground Y = 0.00 to 0.06
  const runnerGeo = boxGeo(1.36, 0.06, 0.09);
  createPart('Runner_L', runnerGeo, matWood, { position: [0, 0.03, -0.38], parent: root });
  createPart('Runner_R', runnerGeo, matWood, { position: [0, 0.03, 0.38], parent: root });

  // Transverse floor cross slats
  const crossSlatGeo = boxGeo(0.08, 0.04, 0.86);
  createPart('Slat_F', crossSlatGeo, matWood, { position: [0.50, 0.04, 0], parent: root });
  createPart('Slat_M', crossSlatGeo, matWood, { position: [0, 0.04, 0], parent: root });
  createPart('Slat_B', crossSlatGeo, matWood, { position: [-0.50, 0.04, 0], parent: root });

  // Marine plywood floor board
  const floorGeo = boxGeo(1.28, 0.03, 1.08);
  createPart('Floor', floorGeo, matWood, { position: [0, 0.075, 0], parent: root });

  // ==========================================
  // 2. WICKER BASKET BODY
  // ==========================================
  const basketGroup = createPivot('BasketGroup', [0, 0, 0], root);

  // Four hollow woven wicker walls (height from Y = 0.08 to Y = 1.04)
  const wallLongGeo = boxGeo(0.08, 0.96, 1.08);
  const wallShortGeo = boxGeo(1.20, 0.96, 0.08);

  createPart('Wall_Front', wallLongGeo, matWicker, { position: [0.60, 0.56, 0], parent: basketGroup });
  createPart('Wall_Back', wallLongGeo, matWicker, { position: [-0.60, 0.56, 0], parent: basketGroup });
  createPart('Wall_Left', wallShortGeo, matWicker, { position: [0, 0.56, -0.50], parent: basketGroup });
  createPart('Wall_Right', wallShortGeo, matWicker, { position: [0, 0.56, 0.50], parent: basketGroup });

  // Horizontal woven wicker accent ribs wrapping around exterior
  const bandXGeo = boxGeo(1.30, 0.035, 0.03);
  const bandZGeo = boxGeo(0.03, 0.035, 1.10);
  const bandHeights = [0.20, 0.38, 0.56, 0.74, 0.92];

  for (let b = 0; b < bandHeights.length; b++) {
    const yH = bandHeights[b];
    createPart('BandX_L_' + b, bandXGeo, matWickerDark, { position: [0, yH, -0.53], parent: basketGroup });
    createPart('BandX_R_' + b, bandXGeo, matWickerDark, { position: [0, yH, 0.53], parent: basketGroup });
    createPart('BandZ_F_' + b, bandZGeo, matWickerDark, { position: [0.63, yH, 0], parent: basketGroup });
    createPart('BandZ_B_' + b, bandZGeo, matWickerDark, { position: [-0.63, yH, 0], parent: basketGroup });
  }

  // Heavy stitched leather corner boots at bottom corners
  const cornerBootGeo = boxGeo(0.14, 0.20, 0.14);
  createPart('Boot_FL', cornerBootGeo, matLeather, { position: [0.60, 0.16, -0.50], parent: basketGroup });
  createPart('Boot_FR', cornerBootGeo, matLeather, { position: [0.60, 0.16, 0.50], parent: basketGroup });
  createPart('Boot_BL', cornerBootGeo, matLeather, { position: [-0.60, 0.16, -0.50], parent: basketGroup });
  createPart('Boot_BR', cornerBootGeo, matLeather, { position: [-0.60, 0.16, 0.50], parent: basketGroup });

  // Padded leather bolster rim around top edge of basket (Y = 1.04 to 1.14)
  const bolsterLongGeo = cylinderZGeo(0.055, 0.055, 1.10, 10);
  const bolsterShortGeo = cylinderXGeo(0.055, 0.055, 1.28, 10);
  createPart('Bolster_Front', bolsterLongGeo, matLeather, { position: [0.61, 1.08, 0], parent: basketGroup });
  createPart('Bolster_Back', bolsterLongGeo, matLeather, { position: [-0.61, 1.08, 0], parent: basketGroup });
  createPart('Bolster_Left', bolsterShortGeo, matLeather, { position: [0, 1.08, -0.51], parent: basketGroup });
  createPart('Bolster_Right', bolsterShortGeo, matLeather, { position: [0, 1.08, 0.51], parent: basketGroup });

  // Tapered corner cuffs connecting the bolsters cleanly
  const cornerCapGeo = taperConeGeo(0.065, 0.050, 0.08, 'y', 10);
  createPart('CornerCap_FL', cornerCapGeo, matLeather, { position: [0.61, 1.08, -0.51], parent: basketGroup });
  createPart('CornerCap_FR', cornerCapGeo, matLeather, { position: [0.61, 1.08, 0.51], parent: basketGroup });
  createPart('CornerCap_BL', cornerCapGeo, matLeather, { position: [-0.61, 1.08, -0.51], parent: basketGroup });
  createPart('CornerCap_BR', cornerCapGeo, matLeather, { position: [-0.61, 1.08, 0.51], parent: basketGroup });

  // Braided rope grab handles on front and back
  const handleGeo = torusGeo(0.07, 0.015, 6, 10);
  createPart('Handle_Front', handleGeo, matRope, { position: [0.66, 0.52, 0], rotation: [0, 90, 0], parent: basketGroup });
  createPart('Handle_Back', handleGeo, matRope, { position: [-0.66, 0.52, 0], rotation: [0, 90, 0], parent: basketGroup });

  // ==========================================
  // 3. PROPANE FUEL TANKS (In 4 Corners)
  // ==========================================
  const tankPositions = [
    [0.42, -0.32],
    [0.42, 0.32],
    [-0.42, -0.32],
    [-0.42, 0.32]
  ];

  const tankBodyGeo = cylinderGeo(0.125, 0.125, 0.72, 12);
  const tankBaseGeo = cylinderGeo(0.12, 0.13, 0.06, 12);
  const tankDomeGeo = taperConeGeo(0.125, 0.07, 0.10, 'y', 12);
  const tankCollarGeo = cylinderGeo(0.12, 0.12, 0.10, 12);
  const tankValveGeo = cylinderGeo(0.022, 0.022, 0.05, 8);
  const tankKnobGeo = cylinderGeo(0.032, 0.032, 0.02, 8);
  const tankGaugeGeo = cylinderXGeo(0.028, 0.028, 0.025, 8);
  const strapGeo = boxGeo(0.26, 0.035, 0.035);

  for (let t = 0; t < tankPositions.length; t++) {
    const [tx, tz] = tankPositions[t];
    const tankPivot = createPivot('TankPivot_' + t, [tx, 0.09, tz], basketGroup);

    // Foot base ring
    createPart('TankBase_' + t, tankBaseGeo, matDarkTrim, { position: [0, 0.03, 0], parent: tankPivot });
    // Main vessel body (Y = 0.12 to 0.84)
    createPart('TankBody_' + t, tankBodyGeo, matSteel, { position: [0, 0.42, 0], parent: tankPivot });
    // Upper dome shoulder (Y = 0.84 to 0.94)
    createPart('TankDome_' + t, tankDomeGeo, matSteel, { position: [0, 0.83, 0], parent: tankPivot });
    // Protective collar shroud with cutout handles (Y = 0.94 to 1.04)
    createPart('TankCollar_' + t, tankCollarGeo, matDarkTrim, { position: [0, 0.93, 0], parent: tankPivot });
    // Brass shutoff valve cluster
    createPart('TankValve_' + t, tankValveGeo, matBrass, { position: [0, 0.95, 0], parent: tankPivot });
    createPart('TankKnob_' + t, tankKnobGeo, matRed, { position: [0, 1.00, 0], parent: tankPivot });
    // Pressure gauge dial facing inward toward pilot
    const gaugeX = tx > 0 ? -0.06 : 0.06;
    createPart('TankGauge_' + t, tankGaugeGeo, matBrass, { position: [gaugeX, 0.93, 0], parent: tankPivot });
    // Securing tie-down strap
    createPart('TankStrap_' + t, strapGeo, matDarkTrim, { position: [0, 0.55, 0.11 * Math.sign(tz)], parent: tankPivot });
  }

  // ==========================================
  // 4. SANDBAGS ON BASKET RIM (Ballast Sacks)
  // ==========================================
  // Pear-shaped ballast sack profile
  const sackProfile = [
    [0.01, -0.18],
    [0.075, -0.15],
    [0.098, -0.05],
    [0.088, 0.07],
    [0.045, 0.14],
    [0.028, 0.17]
  ];
  const sackBodyGeo = lathe(sackProfile, 10);
  const cinchGeo = torusGeo(0.036, 0.012, 6, 8);
  const sackMouthGeo = taperConeGeo(0.028, 0.065, 0.07, 'y', 10);

  // 8 sandbags hanging on the basket rim (centered on walls)
  const sandbagPlacements = [
    { name: 'Front_L', pos: [0.68, 0.74, -0.20] },
    { name: 'Front_R', pos: [0.68, 0.74, 0.20] },
    { name: 'Back_L',  pos: [-0.68, 0.74, -0.20] },
    { name: 'Back_R',  pos: [-0.68, 0.74, 0.20] },
    { name: 'Left_F',  pos: [0.22, 0.74, -0.58] },
    { name: 'Left_B',  pos: [-0.22, 0.74, -0.58] },
    { name: 'Right_F', pos: [0.22, 0.74, 0.58] },
    { name: 'Right_B', pos: [-0.22, 0.74, 0.58] }
  ];

  for (let s = 0; s < sandbagPlacements.length; s++) {
    const sb = sandbagPlacements[s];
    const sbPivot = createPivot('Sandbag_' + sb.name, sb.pos, basketGroup);

    // Bulging canvas sack body
    createPart('Sack_' + s, sackBodyGeo, matSandbag, { position: [0, 0, 0], parent: sbPivot });
    // Cinched neck rope
    createPart('Cinch_' + s, cinchGeo, matRope, { position: [0, 0.17, 0], parent: sbPivot });
    // Ruffled sack mouth opening
    createPart('Mouth_' + s, sackMouthGeo, matSandbag, { position: [0, 0.21, 0], parent: sbPivot });

    // Hanging rope lanyard securing sack to the bolster rim
    beamBetween(
      'Rope_' + s,
      [sb.pos[0], sb.pos[1] + 0.17, sb.pos[2]],
      [sb.pos[0] * 0.90, 1.08, sb.pos[2] * 0.90],
      0.010,
      matRope,
      { segments: 6, parent: basketGroup }
    );
  }

  // ==========================================
  // 5. BURNER FRAME & BURNERS
  // ==========================================
  const burnerGroup = createPivot('BurnerGroup', [0, 0, 0], root);

  // 4 Corner support upright poles rising from basket corners to burner frame
  const poleBasePositions = [
    [0.54, 1.08, -0.44],
    [0.54, 1.08, 0.44],
    [-0.54, 1.08, -0.44],
    [-0.54, 1.08, 0.44]
  ];
  const poleTopPositions = [
    [0.34, 2.12, -0.28],
    [0.34, 2.12, 0.28],
    [-0.34, 2.12, -0.28],
    [-0.34, 2.12, 0.28]
  ];

  for (let p = 0; p < 4; p++) {
    const pBase = poleBasePositions[p];
    const pTop = poleTopPositions[p];
    // Main stainless upright strut
    beamBetween('BurnerPole_' + p, pBase, pTop, 0.018, matSteel, { segments: 8, parent: burnerGroup });
    // Lower leather protective sleeve padding
    const pMid = [pBase[0] * 0.72 + pTop[0] * 0.28, 1.38, pBase[2] * 0.72 + pTop[2] * 0.28];
    beamBetween('PolePadding_' + p, pBase, pMid, 0.028, matLeather, { segments: 8, parent: burnerGroup });
  }

  // Burner gimbal outer frame at Y = 2.15
  const frameXGeo = boxGeo(0.68, 0.035, 0.035);
  const frameZGeo = boxGeo(0.035, 0.035, 0.56);
  createPart('FrameX_L', frameXGeo, matSteel, { position: [0, 2.15, -0.28], parent: burnerGroup });
  createPart('FrameX_R', frameXGeo, matSteel, { position: [0, 2.15, 0.28], parent: burnerGroup });
  createPart('FrameZ_F', frameZGeo, matSteel, { position: [0.34, 2.15, 0], parent: burnerGroup });
  createPart('FrameZ_B', frameZGeo, matSteel, { position: [-0.34, 2.15, 0], parent: burnerGroup });

  // Center crossbar & gimbal pivot
  const crossXGeo = boxGeo(0.68, 0.025, 0.025);
  createPart('CrossBar_Mid', crossXGeo, matDarkTrim, { position: [0, 2.15, 0], parent: burnerGroup });

  // Dual Burner Cans (side-by-side along Z axis)
  const burnerZOffsets = [-0.14, 0.14];
  const burnerCanGeo = cylinderGeo(0.105, 0.095, 0.20, 14);
  const burnerNozzleGeo = taperConeGeo(0.095, 0.125, 0.06, 'y', 14);
  const coilGeo = torusGeo(0.088, 0.014, 8, 14);

  for (let b = 0; b < 2; b++) {
    const bZ = burnerZOffsets[b];
    const bPivot = createPivot('BurnerCan_' + b, [0, 2.22, bZ], burnerGroup);

    // Perforated burner can cylinder
    createPart('CanBody_' + b, burnerCanGeo, matSteel, { position: [0, 0, 0], parent: bPivot });
    // Upper flared nozzle bell
    createPart('Nozzle_' + b, burnerNozzleGeo, matDarkTrim, { position: [0, 0.13, 0], parent: bPivot });
    // Copper vaporizing pre-heat coils lying horizontally across top of nozzle
    createPart('Coil_1_' + b, coilGeo, matBrass, { position: [0, 0.16, 0], rotation: [90, 0, 0], parent: bPivot });
    createPart('Coil_2_' + b, coilGeo, matBrass, { position: [0, 0.20, 0], rotation: [90, 0, 0], parent: bPivot });

    // Pilot light pipe
    const pilotGeo = cylinderGeo(0.012, 0.012, 0.12, 8);
    createPart('Pilot_' + b, pilotGeo, matBrass, { position: [0.08, 0.10, 0], parent: bPivot });
  }

  // Central manifold block
  const manifoldGeo = boxGeo(0.12, 0.07, 0.36);
  createPart('Manifold', manifoldGeo, matDarkTrim, { position: [0, 2.06, 0], parent: burnerGroup });

  // Physical structural mounting brackets connecting Manifold to CrossBar_Mid
  const mountBracketGeo = boxGeo(0.035, 0.08, 0.035);
  createPart('ManifoldMount_L', mountBracketGeo, matDarkTrim, { position: [0, 2.11, -0.14], parent: burnerGroup });
  createPart('ManifoldMount_R', mountBracketGeo, matDarkTrim, { position: [0, 2.11, 0.14], parent: burnerGroup });

  // Squeeze blast valve handles hanging down below manifold
  const valveLeverGeo = cylinderGeo(0.010, 0.010, 0.14, 8);
  const valveKnobGeo = cylinderGeo(0.022, 0.022, 0.04, 8);
  for (let b = 0; b < 2; b++) {
    const bZ = burnerZOffsets[b];
    createPart('ValveLever_' + b, valveLeverGeo, matBrass, { position: [-0.04, 1.98, bZ], rotation: [15, 0, 0], parent: burnerGroup });
    createPart('ValveKnob_' + b, valveKnobGeo, matRed, { position: [-0.04, 1.91, bZ], parent: burnerGroup });
  }

  // Dual pressure gauges on pilot-facing side of manifold
  const gaugeGeo = cylinderXGeo(0.028, 0.028, 0.02, 8);
  createPart('BurnerGauge_L', gaugeGeo, matBrass, { position: [-0.07, 2.06, -0.09], parent: burnerGroup });
  createPart('BurnerGauge_R', gaugeGeo, matBrass, { position: [-0.07, 2.06, 0.09], parent: burnerGroup });

  // 4 Flexible fuel hoses running to all 4 propane tanks
  const hoseRoutes = [
    [[-0.04, 2.03, -0.14], [-0.20, 1.75, -0.22], [-0.34, 1.35, -0.28], [-0.42, 1.04, -0.32]],
    [[-0.04, 2.03, 0.14],  [-0.20, 1.75, 0.22],  [-0.34, 1.35, 0.28],  [-0.42, 1.04, 0.32]],
    [[0.04, 2.03, -0.14],  [0.20, 1.75, -0.22],  [0.34, 1.35, -0.28],  [0.42, 1.04, -0.32]],
    [[0.04, 2.03, 0.14],   [0.20, 1.75, 0.22],   [0.34, 1.35, 0.28],   [0.42, 1.04, 0.32]],
  ];
  for (let h = 0; h < hoseRoutes.length; h++) {
    pipeAlongPath(hoseRoutes[h], 0.011, { bendRadius: 0.06, parent: burnerGroup });
  }

  // ==========================================
  // 6. SUSPENSION FLYING WIRES (Rigging)
  // ==========================================
  const throatRadius = 0.78;
  const throatY = 3.50;

  for (let w = 0; w < 8; w++) {
    const angle = (w * Math.PI * 2) / 8;
    const wx = throatRadius * Math.cos(angle);
    const wz = throatRadius * Math.sin(angle);

    const fromCorner = (w % 2 === 0);
    const origin = fromCorner
      ? [Math.sign(wx) * 0.54, 1.10, Math.sign(wz) * 0.44]
      : [Math.sign(wx) * 0.34, 2.15, Math.sign(wz) * 0.28];

    beamBetween('FlyingWire_' + w, origin, [wx, throatY, wz], 0.007, matDarkTrim, { segments: 6, parent: root });
    const carabinerGeo = torusGeo(0.024, 0.006, 6, 8);
    createPart('Carabiner_' + w, carabinerGeo, matSteel, { position: [wx, throatY, wz], parent: root });
  }

  // ==========================================
  // 7. BALLOON ENVELOPE (Striped Teardrop)
  // ==========================================
  const envelopeGroup = createPivot('EnvelopeGroup', [0, 0, 0], root);

  // Throat load hoop ring
  const throatHoopGeo = torusGeo(throatRadius, 0.035, 8, 20);
  createPart('ThroatHoop', throatHoopGeo, matDarkTrim, { position: [0, throatY, 0], parent: envelopeGroup });

  // Nomex flame-resistant bottom skirt
  const skirtGeo = taperConeGeo(throatRadius, 0.90, 0.35, 'y', 20);
  createPart('NomexSkirt', skirtGeo, matDarkTrim, { position: [0, throatY + 0.17, 0], parent: envelopeGroup });

  // Aerodynamic teardrop envelope profile with smooth hemispherical crown
  const envelopeProfile = [
    [0.90, 3.85],  // skirt junction
    [1.25, 4.40],
    [1.80, 5.10],
    [2.45, 5.90],
    [3.20, 6.80],
    [3.85, 7.80],
    [4.30, 8.80],  // lower equator
    [4.42, 9.70],  // maximum equator diameter (8.84m)
    [4.25, 10.55],
    [3.80, 11.35],
    [3.10, 12.05],
    [2.20, 12.60],
    [1.30, 12.88],
    [0.55, 13.01],
    [0.01, 13.05]  // smooth rounded apex
  ];

  // 24 vertical gores (stripes) revolving 15° each
  const goreCount = 24;
  const dAngle = (Math.PI * 2) / goreCount;
  const goreGeo = revolveGeo(envelopeProfile, { angle: dAngle, segments: 3 });

  for (let g = 0; g < goreCount; g++) {
    const mat = envColors[g % 4];
    createPart('Gore_' + g, goreGeo, mat, {
      rotation: [0, (g * 360) / goreCount, 0],
      parent: envelopeGroup
    });
  }

  // Crown apex cap & parachute valve vent disc
  const crownRingGeo = torusGeo(0.50, 0.035, 8, 16);
  createPart('CrownRing', crownRingGeo, matDarkTrim, { position: [0, 13.03, 0], parent: envelopeGroup });

  const crownDiscGeo = cylinderGeo(0.48, 0.48, 0.04, 16);
  createPart('CrownDisc', crownDiscGeo, matDarkTrim, { position: [0, 13.04, 0], parent: envelopeGroup });

  const apexFinialGeo = torusGeo(0.12, 0.02, 6, 12);
  createPart('ApexFinial', apexFinialGeo, matDarkTrim, { position: [0, 13.10, 0], parent: envelopeGroup });

  return root;
}

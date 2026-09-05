// Authored by: gemini-3.8-flash-high, via agy.
//
// Written by the model itself through the Kiln MCP tools: it wrote the
// program, rendered it, looked at its own six-view contact sheet, and
// revised. Not a line of it is hand-authored, with one exception recorded
// below.
//
// Dispatched into a clean directory containing only the brief and the Kiln
// skills, with no access to this repository or to any finished example.
//
// The exception: review found the four canted cab corners rotated the wrong
// way, which left the panels crossing the line they should have lain on and a
// slot open into the cabin at each end of every one. The sign of `cornerAngle`
// was negated by hand at its three sites. Nothing else was touched, and the
// contact sheet the model was working from does not show the defect at the
// scale it was reviewed -- which is the honest reason it survived: the
// structural gates pass this asset either way, because a mirrored chamfer is
// well-formed geometry in the wrong place.

const meta = { name: 'Tram', category: 'vehicle' };

async function build() {
  const root = createRoot('Tram');

  // --- 1. Materials ---
  const matSteelDark = gameMaterial(0x202328, { metalness: 0.7, roughness: 0.45 });
  const matRailSteel = gameMaterial(0x6e747e, { metalness: 0.85, roughness: 0.35 });
  const matWoodTie = gameMaterial(0x35261b, { roughness: 0.9 });
  const matWoodInterior = gameMaterial(0x694627, { roughness: 0.75 });
  const matBodyGreen = gameMaterial(0x1a3c2c, { roughness: 0.5 });
  const matBodyGreenDark = gameMaterial(0x10261c, { roughness: 0.55 });
  const matBodyCream = gameMaterial(0xf5eedc, { roughness: 0.45 });
  const matRoofCanvas = gameMaterial(0x3e4248, { roughness: 0.85 });
  const matBrass = gameMaterial(0xd8aa44, { metalness: 0.85, roughness: 0.25 });
  const matCopper = gameMaterial(0xb96e3c, { metalness: 0.8, roughness: 0.3 });
  const matGlass = glassMaterial(0xa0d2ea, { opacity: 0.35, roughness: 0.1 });
  const matLampGlow = gameMaterial(0xfff5d6, { emissive: 0xffe28a, emissiveIntensity: 1.3 });
  const matSignDark = gameMaterial(0x14171b, { roughness: 0.85 });
  const matMarkerRed = gameMaterial(0xcc2222, { roughness: 0.4, emissive: 0x880000, emissiveIntensity: 0.6 });

  // Shared Geometries for instancing and clean draw call count
  const tieGeo = boxGeo(0.24, 0.09, 2.3);
  const tiePlateGeo = boxGeo(0.26, 0.015, 0.16);
  const wheelRadius = 0.33;
  const wheelTreadGeo = cylinderZGeo(wheelRadius, wheelRadius, 0.065, 14);
  const wheelFlangeGeo = cylinderZGeo(wheelRadius + 0.035, wheelRadius + 0.035, 0.025, 14);
  const wheelHubGeo = cylinderZGeo(0.09, 0.09, 0.09, 10);
  const journalBoxGeo = boxGeo(0.16, 0.18, 0.12);
  const coilSpringGeo = cylinderYGeo(0.045, 0.045, 0.12, 8);
  const brakeShoeGeo = boxGeo(0.06, 0.14, 0.06);
  const rivetGeo = sphereGeo(0.014, 6, 4);

  // --- 2. Track & Ground (Y=0) ---
  for (let x = -5.6; x <= 5.6; x += 0.7) {
    const xPos = Math.round(x * 10) / 10;
    createPart('Tie_' + xPos, tieGeo, matWoodTie, { position: [xPos, 0.045, 0], parent: root });
    createPart('TiePlate_L_' + xPos, tiePlateGeo, matSteelDark, { position: [xPos, 0.095, -0.72], parent: root });
    createPart('TiePlate_R_' + xPos, tiePlateGeo, matSteelDark, { position: [xPos, 0.095, 0.72], parent: root });
  }

  const railLength = 12.0;
  const railBaseGeo = boxGeo(railLength, 0.02, 0.12);
  const railWebGeo = boxGeo(railLength, 0.08, 0.03);
  const railHeadGeo = boxGeo(railLength, 0.04, 0.065);
  [-0.72, 0.72].forEach((z, i) => {
    const side = i === 0 ? 'L' : 'R';
    createPart('RailBase_' + side, railBaseGeo, matRailSteel, { position: [0, 0.10, z], parent: root });
    createPart('RailWeb_' + side, railWebGeo, matRailSteel, { position: [0, 0.15, z], parent: root });
    createPart('RailHead_' + side, railHeadGeo, matRailSteel, { position: [0, 0.21, z], parent: root });
  });

  const railTopY = 0.23;
  const axleY = railTopY + wheelRadius; // 0.56m
  const floorY = 0.88;

  // --- 3. Two 4-Wheel Bogie Trucks ---
  const bogieCenters = [-2.6, 2.6];
  const axleShaftGeo = cylinderZGeo(0.045, 0.045, 1.6, 10);
  const motorGeo = boxGeo(0.35, 0.28, 0.5);
  const sideFrameTopGeo = boxGeo(1.8, 0.08, 0.06);
  const sideFrameBotGeo = boxGeo(1.5, 0.06, 0.06);
  const sideDiagGeo = boxGeo(0.65, 0.05, 0.05);
  const springPackGeo = boxGeo(0.32, 0.12, 0.09);
  const truckBolsterGeo = boxGeo(0.40, 0.36, 1.85);

  bogieCenters.forEach((bX, bIdx) => {
    const bogie = createPivot('Truck_' + bIdx, [bX, 0, 0], root);

    createPart('TruckBolster_' + bIdx, truckBolsterGeo, matSteelDark, {
      position: [0, 0.74, 0],
      parent: bogie
    });

    [-0.88, 0.88].forEach((zSide, sIdx) => {
      const sName = (sIdx === 0 ? 'L' : 'R') + '_' + bIdx;
      createPart('SideFrameTop_' + sName, sideFrameTopGeo, matSteelDark, { position: [0, axleY + 0.08, zSide], parent: bogie });
      createPart('SideFrameBot_' + sName, sideFrameBotGeo, matSteelDark, { position: [0, axleY - 0.10, zSide], parent: bogie });
      createPart('SideFrameDiagA_' + sName, sideDiagGeo, matSteelDark, { position: [-0.4, axleY, zSide], rotation: [0, 0, 25], parent: bogie });
      createPart('SideFrameDiagB_' + sName, sideDiagGeo, matSteelDark, { position: [0.4, axleY, zSide], rotation: [0, 0, -25], parent: bogie });
      createPart('SpringPack_' + sName, springPackGeo, matSteelDark, { position: [0, axleY - 0.02, zSide], parent: bogie });
    });

    [-0.7, 0.7].forEach((dx, aIdx) => {
      const axleName = bIdx + '_' + aIdx;
      createPart('AxleShaft_' + axleName, axleShaftGeo, matSteelDark, { position: [dx, axleY, 0], parent: bogie });
      createPart('TractionMotor_' + axleName, motorGeo, matSteelDark, { position: [dx > 0 ? dx - 0.22 : dx + 0.22, axleY, 0], parent: bogie });

      [-0.72, 0.72].forEach((wZ, wIdx) => {
        const wName = (wIdx === 0 ? 'L' : 'R') + '_' + axleName;
        const flangeZ = wIdx === 0 ? wZ + 0.035 : wZ - 0.035;

        createPart('WheelTread_' + wName, wheelTreadGeo, matRailSteel, { position: [dx, axleY, wZ], parent: bogie });
        createPart('WheelFlange_' + wName, wheelFlangeGeo, matRailSteel, { position: [dx, axleY, flangeZ], parent: bogie });
        createPart('WheelHub_' + wName, wheelHubGeo, matSteelDark, { position: [dx, axleY, wIdx === 0 ? wZ - 0.03 : wZ + 0.03], parent: bogie });

        const brakeX = dx > 0 ? dx + wheelRadius * 0.95 : dx - wheelRadius * 0.95;
        createPart('BrakeShoe_' + wName, brakeShoeGeo, matSteelDark, { position: [brakeX, axleY, wZ], parent: bogie });
      });

      [-0.88, 0.88].forEach((jZ, jIdx) => {
        const jName = (jIdx === 0 ? 'L' : 'R') + '_' + axleName;
        createPart('JournalBox_' + jName, journalBoxGeo, matSteelDark, { position: [dx, axleY, jZ], parent: bogie });
        createPart('CoilSpring_' + jName, coilSpringGeo, matSteelDark, { position: [dx, axleY + 0.12, jZ], parent: bogie });
      });
    });

    [-0.7, 0.7].forEach((dx, aIdx) => {
      const bXPos = dx > 0 ? dx + 0.32 : dx - 0.32;
      createPart('BrakeBeam_' + bIdx + '_' + aIdx, cylinderZGeo(0.03, 0.03, 1.5, 8), matSteelDark, {
        position: [bXPos, axleY, 0],
        parent: bogie
      });
    });
  });

  // --- 4. Underframe & Chassis Equipment ---
  const sideSillGeo = boxGeo(8.6, 0.14, 0.08);
  [-1.12, 1.12].forEach((zSill, sIdx) => {
    createPart('SideSill_' + (sIdx === 0 ? 'L' : 'R'), sideSillGeo, matSteelDark, { position: [0, floorY - 0.07, zSill], parent: root });
  });
  createPart('ChassisSubFloor', boxGeo(8.6, 0.10, 2.22), matSteelDark, { position: [0, floorY - 0.05, 0], parent: root });
  createPart('InteriorFloor', boxGeo(8.4, 0.02, 2.16), matWoodInterior, { position: [0, floorY + 0.01, 0], parent: root });

  createPart('AirReservoir', cylinderXGeo(0.18, 0.18, 1.4, 12), matSteelDark, { position: [-0.6, floorY - 0.22, -0.45], parent: root });
  createPart('CompressorBox', boxGeo(0.6, 0.32, 0.5), matSteelDark, { position: [0.7, floorY - 0.20, -0.4], parent: root });
  createPart('ResistanceGridBox', boxGeo(1.2, 0.26, 0.55), matSteelDark, { position: [0, floorY - 0.18, 0.42], parent: root });
  const resistFinGeo = boxGeo(0.02, 0.24, 0.57);
  for (let gx = -0.5; gx <= 0.5; gx += 0.2) {
    createPart('ResistFin_' + gx.toFixed(1), resistFinGeo, matSteelDark, { position: [gx, floorY - 0.18, 0.42], parent: root });
  }

  // --- 5. Tram Lower Panelled Skirt & Belt Rail ---
  const bodyCenterLength = 6.0;
  const skirtY = floorY + 0.44;
  const lowerSkirtGeo = boxGeo(bodyCenterLength, 0.86, 0.04);
  const rockerTrimGeo = boxGeo(bodyCenterLength + 0.1, 0.06, 0.06);
  const beltRailGeo = boxGeo(bodyCenterLength + 0.1, 0.07, 0.065);
  const skirtBattenGeo = boxGeo(0.04, 0.84, 0.02);

  [-1.13, 1.13].forEach((zSide, sIdx) => {
    const sLabel = sIdx === 0 ? 'L' : 'R';
    createPart('LowerSkirt_' + sLabel, lowerSkirtGeo, matBodyGreen, { position: [0, skirtY, zSide], parent: root });
    createPart('RockerSill_' + sLabel, rockerTrimGeo, matBodyGreenDark, { position: [0, floorY + 0.03, zSide + (sIdx === 0 ? -0.015 : 0.015)], parent: root });
    createPart('BeltRail_' + sLabel, beltRailGeo, matBrass, { position: [0, floorY + 0.86, zSide + (sIdx === 0 ? -0.015 : 0.015)], parent: root });

    for (let bx = -2.7; bx <= 2.7; bx += 0.6) {
      const bxPos = Math.round(bx * 10) / 10;
      createPart('Batten_' + sLabel + '_' + bxPos, skirtBattenGeo, matBodyGreenDark, { position: [bxPos, skirtY, zSide + (sIdx === 0 ? -0.02 : 0.02)], parent: root });
      createPart('RivetTop_' + sLabel + '_' + bxPos, rivetGeo, matBrass, { position: [bxPos, floorY + 0.86, zSide + (sIdx === 0 ? -0.045 : 0.045)], parent: root });
      createPart('RivetBot_' + sLabel + '_' + bxPos, rivetGeo, matBrass, { position: [bxPos, floorY + 0.04, zSide + (sIdx === 0 ? -0.045 : 0.045)], parent: root });
    }
  });

  // Vestibule section
  [-3.35, 3.35].forEach((vx, vIdx) => {
    const vName = vIdx === 0 ? 'Rear' : 'Front';
    createPart('VestibuleSkirt_L_' + vName, boxGeo(0.7, 0.86, 0.04), matBodyGreen, { position: [vx, skirtY, -1.13], parent: root });
    createPart('VestibuleBelt_L_' + vName, boxGeo(0.7, 0.07, 0.065), matBrass, { position: [vx, floorY + 0.86, -1.145], parent: root });
    createPart('VestibuleRocker_L_' + vName, boxGeo(0.7, 0.06, 0.06), matBodyGreenDark, { position: [vx, floorY + 0.03, -1.145], parent: root });

    createPart('DoorStepWell_' + vName, boxGeo(0.72, 0.12, 0.20), matWoodInterior, { position: [vx, floorY - 0.02, 1.10], parent: root });
    createPart('DoorLeafA_' + vName, boxGeo(0.32, 1.74, 0.03), matBodyGreenDark, { position: [vx - 0.17, floorY + 0.90, 1.13], parent: root });
    createPart('DoorLeafB_' + vName, boxGeo(0.32, 1.74, 0.03), matBodyGreenDark, { position: [vx + 0.17, floorY + 0.90, 1.13], parent: root });
    createPart('DoorGlassA_' + vName, boxGeo(0.22, 0.65, 0.015), matGlass, { position: [vx - 0.17, floorY + 1.25, 1.13], parent: root });
    createPart('DoorGlassB_' + vName, boxGeo(0.22, 0.65, 0.015), matGlass, { position: [vx + 0.17, floorY + 1.25, 1.13], parent: root });
    beamBetween('DoorGrab_' + vName, [vx - 0.32, floorY + 0.15, 1.15], [vx - 0.32, floorY + 1.20, 1.15], 0.016, matBrass, { parent: root });
  });

  // --- 6. Rounded Cab Ends (Front +X, Rear -X) ---
  const cabExtents = [
    { dir: 1, name: 'Front' },
    { dir: -1, name: 'Rear' }
  ];

  const dashCenterGeo = boxGeo(0.06, 0.86, 1.22);
  const beltCenterGeo = boxGeo(0.08, 0.07, 1.24);
  const rockerCenterGeo = boxGeo(0.08, 0.06, 1.24);
  const dashCornerGeo = boxGeo(0.06, 0.86, 0.76);
  const beltCornerGeo = boxGeo(0.08, 0.07, 0.78);
  const rockerCornerGeo = boxGeo(0.08, 0.06, 0.78);
  const bumperCenterGeo = boxGeo(0.12, 0.18, 1.6);
  const bumperWingGeo = boxGeo(0.10, 0.18, 0.68);

  cabExtents.forEach(cab => {
    const d = cab.dir;
    const cName = cab.name;

    createPart('CabDashCenter_' + cName, dashCenterGeo, matBodyGreen, { position: [d * 4.35, skirtY, 0], parent: root });
    createPart('CabBeltCenter_' + cName, beltCenterGeo, matBrass, { position: [d * 4.37, floorY + 0.86, 0], parent: root });
    createPart('CabRockerCenter_' + cName, rockerCenterGeo, matBodyGreenDark, { position: [d * 4.37, floorY + 0.03, 0], parent: root });

    [-1, 1].forEach(sideDir => {
      const sideName = sideDir === -1 ? 'L' : 'R';
      const cornerAngle = -d * sideDir * 40;
      const cornerX = d * 3.98;
      const cornerZ = sideDir * 0.85;

      createPart('CabDashCorner_' + cName + '_' + sideName, dashCornerGeo, matBodyGreen, {
        position: [cornerX, skirtY, cornerZ],
        rotation: [0, cornerAngle, 0],
        parent: root
      });
      createPart('CabBeltCorner_' + cName + '_' + sideName, beltCornerGeo, matBrass, {
        position: [cornerX + d * 0.015, floorY + 0.86, cornerZ + sideDir * 0.015],
        rotation: [0, cornerAngle, 0],
        parent: root
      });
      createPart('CabRockerCorner_' + cName + '_' + sideName, rockerCornerGeo, matBodyGreenDark, {
        position: [cornerX + d * 0.015, floorY + 0.03, cornerZ + sideDir * 0.015],
        rotation: [0, cornerAngle, 0],
        parent: root
      });
    });

    const bumperX = d * 4.56;
    createPart('BumperCenter_' + cName, bumperCenterGeo, matSteelDark, { position: [bumperX, floorY - 0.05, 0], parent: root });
    for (let ry = -0.05; ry <= 0.05; ry += 0.05) {
      createPart('BumperRib_' + cName + '_' + ry.toFixed(2), boxGeo(0.03, 0.02, 1.58), matRailSteel, {
        position: [bumperX + d * 0.065, floorY - 0.05 + ry, 0],
        parent: root
      });
    }
    [-1, 1].forEach(sideDir => {
      const bWingName = (sideDir === -1 ? 'L' : 'R') + '_' + cName;
      createPart('BumperWing_' + bWingName, bumperWingGeo, matSteelDark, {
        position: [d * 4.36, floorY - 0.05, sideDir * 0.98],
        rotation: [0, d * sideDir * 35, 0],
        parent: root
      });
    });

    createPart('BumperBracket_L_' + cName, boxGeo(0.55, 0.10, 0.08), matSteelDark, { position: [d * 4.25, floorY - 0.05, -0.6], parent: root });
    createPart('BumperBracket_R_' + cName, boxGeo(0.55, 0.10, 0.08), matSteelDark, { position: [d * 4.25, floorY - 0.05, 0.6], parent: root });
  });

  // --- 7. Front Life-Guard Fender / Cowcatcher ---
  createPart('FenderMount_L', boxGeo(0.55, 0.08, 0.08), matSteelDark, { position: [4.40, 0.42, -0.65], parent: root });
  createPart('FenderMount_R', boxGeo(0.55, 0.08, 0.08), matSteelDark, { position: [4.40, 0.42, 0.65], parent: root });
  beamBetween('FenderArm_L', [4.35, floorY - 0.06, -0.65], [4.68, 0.36, -0.65], 0.035, matSteelDark, { parent: root });
  beamBetween('FenderArm_R', [4.35, floorY - 0.06, 0.65], [4.68, 0.36, 0.65], 0.035, matSteelDark, { parent: root });

  createPart('FenderTransverseBeam', cylinderZGeo(0.04, 0.04, 1.8, 10), matSteelDark, { position: [4.68, 0.36, 0], parent: root });
  createPart('FenderLowerBeam', cylinderZGeo(0.03, 0.03, 1.7, 10), matSteelDark, { position: [4.90, 0.27, 0], parent: root });
  for (let fz = -0.75; fz <= 0.75; fz += 0.15) {
    const fzPos = Math.round(fz * 100) / 100;
    beamBetween('FenderSlat_' + fzPos, [4.68, 0.36, fzPos], [4.90, 0.27, fzPos], 0.015, matWoodInterior, { parent: root });
  }

  // --- 8. Window Band (Drop Windows & Transoms) ---
  const windowBaseY = floorY + 0.88;
  const windowMidY = windowBaseY + 0.45;
  const windowTopY = windowBaseY + 0.90;

  const eaveHeaderGeo = boxGeo(bodyCenterLength + 0.8, 0.07, 0.07);
  [-1.13, 1.13].forEach((zSide, sIdx) => {
    const sLabel = sIdx === 0 ? 'L' : 'R';
    createPart('WindowEaveHeader_' + sLabel, eaveHeaderGeo, matBodyCream, {
      position: [0, windowTopY + 0.035, zSide + (sIdx === 0 ? -0.01 : 0.01)],
      parent: root
    });
  });

  const windowSpacing = 0.60;
  const postWidth = 0.08;
  const glassWidth = windowSpacing - postWidth;
  const postGeo = boxGeo(postWidth, 0.90, 0.06);
  const windowSillGeo = boxGeo(glassWidth + 0.04, 0.035, 0.08);
  const dropGlassGeo = boxGeo(glassWidth, 0.52, 0.015);
  const transomGlassGeo = boxGeo(glassWidth, 0.28, 0.015);
  const transomBarGeo = boxGeo(glassWidth + 0.02, 0.025, 0.04);

  for (let wx = -2.7; wx <= 2.7; wx += windowSpacing) {
    const wxPos = Math.round(wx * 100) / 100;
    [-1.13, 1.13].forEach((zSide, sIdx) => {
      const sLabel = sIdx === 0 ? 'L' : 'R';
      createPart('WindowPost_' + sLabel + '_' + wxPos, postGeo, matBodyCream, { position: [wxPos, windowMidY, zSide], parent: root });
      createPart('WindowSill_' + sLabel + '_' + wxPos, windowSillGeo, matBodyCream, { position: [wxPos + windowSpacing / 2, windowBaseY + 0.02, zSide], parent: root });
      createPart('DropGlass_' + sLabel + '_' + wxPos, dropGlassGeo, matGlass, { position: [wxPos + windowSpacing / 2, windowBaseY + 0.30, zSide], parent: root });
      createPart('TransomGlass_' + sLabel + '_' + wxPos, transomGlassGeo, matGlass, { position: [wxPos + windowSpacing / 2, windowBaseY + 0.72, zSide], parent: root });
      createPart('TransomBar_' + sLabel + '_' + wxPos, transomBarGeo, matBodyCream, { position: [wxPos + windowSpacing / 2, windowBaseY + 0.57, zSide], parent: root });
    });
  }

  [-3.35, 3.35].forEach((vx, vIdx) => {
    const vName = vIdx === 0 ? 'Rear' : 'Front';
    createPart('VestibuleGlass_L_' + vName, boxGeo(0.55, 0.75, 0.015), matGlass, { position: [vx, windowMidY, -1.13], parent: root });
    createPart('VestibuleFrame_L_' + vName, boxGeo(0.59, 0.85, 0.05), matBodyCream, { position: [vx, windowMidY, -1.13], parent: root });
  });

  const windshieldCenterGeo = boxGeo(0.02, 0.75, 1.12);
  const windshieldFrameBotGeo = boxGeo(0.06, 0.04, 1.16);
  const windshieldFrameTopGeo = boxGeo(0.06, 0.05, 1.16);
  const windshieldCornerGeo = boxGeo(0.02, 0.75, 0.68);
  const cornerFrameBotGeo = boxGeo(0.06, 0.04, 0.72);
  const cornerFrameTopGeo = boxGeo(0.06, 0.05, 0.72);
  const cornerPillarGeo = boxGeo(0.08, 0.90, 0.08);

  cabExtents.forEach(cab => {
    const d = cab.dir;
    const cName = cab.name;

    createPart('WindshieldCenter_' + cName, windshieldCenterGeo, matGlass, { position: [d * 4.34, windowMidY, 0], parent: root });
    createPart('WindshieldFrameBot_' + cName, windshieldFrameBotGeo, matBodyCream, { position: [d * 4.35, windowBaseY + 0.04, 0], parent: root });
    createPart('WindshieldFrameTop_' + cName, windshieldFrameTopGeo, matBodyCream, { position: [d * 4.35, windowTopY - 0.04, 0], parent: root });

    if (d > 0) {
      createPart('WiperMotor', cylinderXGeo(0.03, 0.03, 0.06, 8), matSteelDark, { position: [4.38, windowTopY - 0.02, 0.25], parent: root });
      beamBetween('WiperBlade', [4.38, windowTopY - 0.04, 0.25], [4.37, windowMidY - 0.1, 0.12], 0.012, matSteelDark, { parent: root });
    }

    [-1, 1].forEach(sideDir => {
      const sideName = sideDir === -1 ? 'L' : 'R';
      const cornerAngle = -d * sideDir * 40;
      const cornerX = d * 3.98;
      const cornerZ = sideDir * 0.85;

      createPart('WindshieldCorner_' + cName + '_' + sideName, windshieldCornerGeo, matGlass, {
        position: [cornerX, windowMidY, cornerZ],
        rotation: [0, cornerAngle, 0],
        parent: root
      });
      createPart('CornerFrameBot_' + cName + '_' + sideName, cornerFrameBotGeo, matBodyCream, {
        position: [cornerX + d * 0.01, windowBaseY + 0.04, cornerZ + sideDir * 0.01],
        rotation: [0, cornerAngle, 0],
        parent: root
      });
      createPart('CornerFrameTop_' + cName + '_' + sideName, cornerFrameTopGeo, matBodyCream, {
        position: [cornerX + d * 0.01, windowTopY - 0.04, cornerZ + sideDir * 0.01],
        rotation: [0, cornerAngle, 0],
        parent: root
      });
      createPart('CornerPillar_' + cName + '_' + sideName, cornerPillarGeo, matBodyCream, {
        position: [d * 4.28, windowMidY, sideDir * 0.58],
        parent: root
      });
    });
  });

  // --- 9. Interior Fixtures ---
  const seatCushionGeo = boxGeo(0.42, 0.08, 0.65);
  const seatBackGeo = boxGeo(0.06, 0.42, 0.65);
  const seatPedestalGeo = cylinderYGeo(0.03, 0.03, 0.34, 8);
  const aisleGripGeo = cylinderYGeo(0.015, 0.015, 0.12, 6);

  for (let sx = -2.2; sx <= 2.2; sx += 0.8) {
    const sxPos = Math.round(sx * 10) / 10;
    [-0.68, 0.68].forEach((sz, sIdx) => {
      const sSide = sIdx === 0 ? 'L' : 'R';
      createPart('SeatCushion_' + sSide + '_' + sxPos, seatCushionGeo, matWoodInterior, { position: [sxPos, floorY + 0.38, sz], parent: root });
      createPart('SeatBack_' + sSide + '_' + sxPos, seatBackGeo, matWoodInterior, { position: [sxPos - 0.18, floorY + 0.58, sz], parent: root });
      createPart('SeatPedestal_' + sSide + '_' + sxPos, seatPedestalGeo, matSteelDark, { position: [sxPos, floorY + 0.17, sz], parent: root });
      createPart('AisleGrip_' + sSide + '_' + sxPos, aisleGripGeo, matBrass, { position: [sxPos - 0.18, floorY + 0.82, sIdx === 0 ? -0.36 : 0.36], parent: root });
    });
  }

  cabExtents.forEach(cab => {
    const d = cab.dir;
    const cName = cab.name;
    createPart('Controller_' + cName, boxGeo(0.28, 0.72, 0.28), matSteelDark, { position: [d * 3.95, floorY + 0.36, -0.25], parent: root });
    createPart('ThrottleHandle_' + cName, cylinderYGeo(0.02, 0.02, 0.12, 8), matBrass, { position: [d * 3.95, floorY + 0.78, -0.25], parent: root });
    createPart('BrakeStaff_' + cName, cylinderYGeo(0.02, 0.02, 0.85, 8), matSteelDark, { position: [d * 3.95, floorY + 0.42, 0.25], parent: root });
    createPart('BrakeWheel_' + cName, torusGeo(0.12, 0.018, 8, 12), matBrass, { position: [d * 3.95, floorY + 0.86, 0.25], rotation: [90, 0, 0], parent: root });
  });

  for (let hx = -2.0; hx <= 2.0; hx += 0.8) {
    createPart('CeilingLamp_' + hx.toFixed(1), sphereGeo(0.06, 8, 6), matLampGlow, { position: [hx, windowTopY + 0.18, 0], parent: root });
  }

  // --- 10. Continuous Roof & Raised Clerestory Monitor Roof ---
  const roofY = windowTopY + 0.06;

  createPart('RoofLowerDeck', boxGeo(7.6, 0.10, 2.42), matRoofCanvas, { position: [0, roofY + 0.05, 0], parent: root });

  cabExtents.forEach(cab => {
    const d = cab.dir;
    const cName = cab.name;
    createPart('CabHoodCenter_' + cName, boxGeo(0.65, 0.10, 1.35), matRoofCanvas, { position: [d * 4.15, roofY + 0.05, 0], parent: root });
    [-1, 1].forEach(sideDir => {
      const cornerAngle = -d * sideDir * 40;
      createPart('CabHoodCorner_' + cName + '_' + (sideDir === -1 ? 'L' : 'R'), boxGeo(0.55, 0.10, 0.85), matRoofCanvas, {
        position: [d * 3.92, roofY + 0.05, sideDir * 0.90],
        rotation: [0, cornerAngle, 0],
        parent: root
      });
    });
  });

  const clerestoryBaseY = roofY + 0.10;
  const clerestoryHeight = 0.28;
  const clerestoryMidY = clerestoryBaseY + 0.14;
  const clerestoryTopY = clerestoryBaseY + 0.28;

  createPart('ClerestoryUpperDeck', boxGeo(6.2, 0.08, 1.38), matRoofCanvas, { position: [0, clerestoryTopY + 0.04, 0], parent: root });
  createPart('ClerestoryArchCrown', boxGeo(6.0, 0.06, 1.15), matRoofCanvas, { position: [0, clerestoryTopY + 0.09, 0], parent: root });

  const clerestoryEndCapGeo = cylinderYGeo(0.68, 0.68, 0.28, 12);
  [-3.1, 3.1].forEach((cx, cIdx) => {
    const capName = cIdx === 0 ? 'Rear' : 'Front';
    createPart('ClerestoryEndCap_' + capName, clerestoryEndCapGeo, matRoofCanvas, { position: [cx, clerestoryMidY, 0], parent: root });
  });

  const clerestoryWallGeo = boxGeo(6.0, 0.26, 0.04);
  const louverFrameGeo = boxGeo(0.32, 0.16, 0.025);
  const louverSlatGeo = boxGeo(0.28, 0.025, 0.035);

  [-0.67, 0.67].forEach((cz, sIdx) => {
    const sLabel = sIdx === 0 ? 'L' : 'R';
    createPart('ClerestoryWall_' + sLabel, clerestoryWallGeo, matBodyCream, { position: [0, clerestoryMidY, cz], parent: root });

    for (let lx = -2.5; lx <= 2.5; lx += 0.55) {
      const lxPos = Math.round(lx * 100) / 100;
      createPart('LouverFrame_' + sLabel + '_' + lxPos, louverFrameGeo, matBodyGreenDark, {
        position: [lxPos, clerestoryMidY, cz + (sIdx === 0 ? -0.022 : 0.022)],
        parent: root
      });
      createPart('LouverSlatA_' + sLabel + '_' + lxPos, louverSlatGeo, matBrass, {
        position: [lxPos, clerestoryMidY + 0.03, cz + (sIdx === 0 ? -0.025 : 0.025)],
        parent: root
      });
      createPart('LouverSlatB_' + sLabel + '_' + lxPos, louverSlatGeo, matBrass, {
        position: [lxPos, clerestoryMidY - 0.03, cz + (sIdx === 0 ? -0.025 : 0.025)],
        parent: root
      });
    }
  });

  const ventStemGeo = cylinderYGeo(0.045, 0.045, 0.08, 8);
  const ventCapGeo = cylinderYGeo(0.14, 0.08, 0.05, 10);
  for (let vx = -2.2; vx <= 2.2; vx += 0.88) {
    const vxPos = Math.round(vx * 100) / 100;
    createPart('VentStem_' + vxPos, ventStemGeo, matSteelDark, { position: [vxPos, clerestoryTopY + 0.14, 0], parent: root });
    createPart('VentCap_' + vxPos, ventCapGeo, matCopper, { position: [vxPos, clerestoryTopY + 0.19, 0], parent: root });
  }

  const catwalkGeo = boxGeo(5.8, 0.025, 0.22);
  [-0.92, 0.92].forEach((boardZ, bIdx) => {
    createPart('RoofCatwalk_' + (bIdx === 0 ? 'L' : 'R'), catwalkGeo, matWoodInterior, { position: [0, roofY + 0.11, boardZ], parent: root });
  });

  // --- 11. Trolley Pole Reaching to Wire ---
  const baseCenterY = clerestoryTopY + 0.13;
  createPart('TrolleyMountPlate', boxGeo(0.65, 0.04, 0.55), matSteelDark, { position: [0.5, baseCenterY, 0], parent: root });
  createPart('TrolleyTurret', cylinderYGeo(0.14, 0.16, 0.12, 10), matSteelDark, { position: [0.5, baseCenterY + 0.08, 0], parent: root });
  const trolleySpringGeo = cylinderXGeo(0.04, 0.04, 0.38, 8);
  [-0.10, 0.10].forEach((sz, sIdx) => {
    createPart('TrolleySpring_' + (sIdx === 0 ? 'L' : 'R'), trolleySpringGeo, matSteelDark, { position: [0.45, baseCenterY + 0.12, sz], parent: root });
  });

  const poleTip = [-2.2, 4.75, 0];
  beamBetween('TrolleyPoleLower', [0.45, baseCenterY + 0.15, 0], [-0.8, 3.90, 0], 0.032, matBrass, { parent: root });
  beamBetween('TrolleyPoleUpper', [-0.8, 3.90, 0], poleTip, 0.022, matBrass, { parent: root });

  createPart('TrolleyHarp', boxGeo(0.12, 0.08, 0.06), matBrass, { position: [poleTip[0], poleTip[1], poleTip[2]], parent: root });
  createPart('TrolleyWheel', cylinderZGeo(0.065, 0.065, 0.045, 10), matBrass, { position: [poleTip[0] - 0.04, poleTip[1] + 0.05, 0], parent: root });

  createPart('OverheadWire', cylinderXGeo(0.012, 0.012, 11.8, 8), matCopper, { position: [0, 4.80, 0], parent: root });

  beamBetween('TrolleyRope', poleTip, [-4.36, floorY + 0.55, 0], 0.007, matSteelDark, { parent: root });
  createPart('TrolleyCatcherDrum', cylinderXGeo(0.07, 0.07, 0.08, 10), matBrass, { position: [-4.40, floorY + 0.55, 0], parent: root });

  // --- 12. Headlamps, Destination Blinds & Dash Fittings ---
  const hlHousingGeo = cylinderXGeo(0.18, 0.17, 0.18, 14);
  const hlBezelGeo = cylinderXGeo(0.19, 0.19, 0.03, 14);
  const hlLensGeo = cylinderXGeo(0.16, 0.16, 0.02, 12);
  const destHousingGeo = boxGeo(0.16, 0.24, 0.88);
  const destFaceGeo = boxGeo(0.02, 0.18, 0.80);
  const destTextGeo = boxGeo(0.01, 0.10, 0.65);
  const markerBracketGeo = cylinderXGeo(0.018, 0.018, 0.08, 6);
  const markerLanternGeo = cylinderYGeo(0.045, 0.045, 0.10, 8);
  const markerLensGeo = sphereGeo(0.035, 8, 6);
  const footGongGeo = cylinderYGeo(0.12, 0.06, 0.08, 10);
  const gongStemGeo = cylinderYGeo(0.02, 0.02, 0.10, 6);

  cabExtents.forEach(cab => {
    const d = cab.dir;
    const cName = cab.name;

    const hlX = d * 4.42;
    const hlY = floorY + 0.55;
    createPart('HeadlampBracket_' + cName, boxGeo(0.14, 0.08, 0.08), matSteelDark, { position: [hlX - d * 0.04, hlY, 0], parent: root });
    createPart('HeadlampHousing_' + cName, hlHousingGeo, matBrass, { position: [hlX + d * 0.07, hlY, 0], parent: root });
    createPart('HeadlampBezel_' + cName, hlBezelGeo, matBrass, { position: [hlX + d * 0.16, hlY, 0], parent: root });
    createPart('HeadlampLens_' + cName, hlLensGeo, matLampGlow, { position: [hlX + d * 0.175, hlY, 0], parent: root });

    const destX = d * 4.36;
    const destY = roofY + 0.02;
    createPart('DestBoxHousing_' + cName, destHousingGeo, matBodyCream, { position: [destX, destY, 0], parent: root });
    createPart('DestBlindFace_' + cName, destFaceGeo, matSignDark, { position: [destX + d * 0.08, destY, 0], parent: root });
    createPart('DestTextPlate_' + cName, destTextGeo, matLampGlow, { position: [destX + d * 0.09, destY, 0], parent: root });

    [-0.55, 0.55].forEach((mz, mIdx) => {
      const mName = (mIdx === 0 ? 'L' : 'R') + '_' + cName;
      const markerColor = (d > 0 && mIdx === 1) ? matMarkerRed : matLampGlow;
      createPart('MarkerBracket_' + mName, markerBracketGeo, matBrass, { position: [d * 4.30, windowTopY - 0.05, mz], parent: root });
      createPart('MarkerLantern_' + mName, markerLanternGeo, matBrass, { position: [d * 4.34, windowTopY - 0.05, mz], parent: root });
      createPart('MarkerLens_' + mName, markerLensGeo, markerColor, { position: [d * 4.36, windowTopY - 0.05, mz], parent: root });
    });

    [-0.60, 0.60].forEach((gz, gIdx) => {
      const gName = (gIdx === 0 ? 'L' : 'R') + '_' + cName;
      beamBetween('GrabIron_' + gName, [d * 4.34, floorY + 0.10, gz], [d * 4.34, floorY + 0.86, gz], 0.018, matBrass, { parent: root });
    });

    createPart('FootGongStem_' + cName, gongStemGeo, matSteelDark, { position: [d * 4.15, floorY - 0.08, 0], parent: root });
    createPart('FootGong_' + cName, footGongGeo, matBrass, { position: [d * 4.15, floorY - 0.14, 0], parent: root });
  });

  return root;
}

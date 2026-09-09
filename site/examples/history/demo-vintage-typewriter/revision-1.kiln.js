const meta = { name: 'Vintage Typewriter', category: 'prop', role: 'prop' };

async function build() {
  const root = createRoot('VintageTypewriter');

  const iron = gameMaterial(0x1b1b20, { metalness: 0.55, roughness: 0.5 });
  const ironLight = gameMaterial(0x2e2e35, { metalness: 0.6, roughness: 0.45 });
  const brass = gameMaterial(0xc9972f, { metalness: 0.9, roughness: 0.32 });
  const brassDark = gameMaterial(0x8f6a1f, { metalness: 0.85, roughness: 0.45 });
  const ivory = gameMaterial(0xf4ecd8, { metalness: 0.05, roughness: 0.45 });
  const ivoryDim = gameMaterial(0xe8dcc0, { metalness: 0.05, roughness: 0.55 });
  const rubber = gameMaterial(0x111114, { metalness: 0.1, roughness: 0.85 });
  const steel = gameMaterial(0x9aa0a8, { metalness: 0.9, roughness: 0.35 });
  const paperMat = gameMaterial(0xf7f4ea, { metalness: 0.0, roughness: 0.9 });
  const wood = gameMaterial(0x4a2f1c, { metalness: 0.0, roughness: 0.7 });
  const inkBlack = gameMaterial(0x0c0c0e, { metalness: 0.2, roughness: 0.7 });

  // --- Feet + wooden base ---
  const footGeo = cylinderGeo(0.018, 0.022, 0.02, 12);
  const footPos = [[0.15, 0.01, 0.16], [0.15, 0.01, -0.16], [-0.15, 0.01, 0.16], [-0.15, 0.01, -0.16]];
  for (let i = 0; i < 4; i++) {
    createPart('Foot' + i, footGeo, rubber, { position: footPos[i], parent: root });
  }
  const baseBoard = await roundedBoxGeo(0.38, 0.035, 0.42, 0.01, { style: 'round' });
  createPart('BaseBoard', baseBoard, wood, { position: [0, 0.037, 0], parent: root });
  const baseTrim = await roundedBoxGeo(0.385, 0.012, 0.425, 0.005, { style: 'chamfer' });
  createPart('BaseTrim', baseTrim, brassDark, { position: [0, 0.058, 0], parent: root });

  // --- Lower body ---
  const lowerBody = await roundedBoxGeo(0.30, 0.10, 0.34, 0.02, { style: 'round' });
  createPart('LowerBody', lowerBody, iron, { position: [0.02, 0.115, 0], parent: root });

  // Front brass maker plate
  const frontPlate = await roundedBoxGeo(0.01, 0.03, 0.20, 0.004, { style: 'chamfer' });
  createPart('FrontPlate', frontPlate, brass, { position: [0.172, 0.10, 0], parent: root });

  // Sloped top housing (rear of keys)
  const topHousing = await roundedBoxGeo(0.16, 0.07, 0.32, 0.02, { style: 'round' });
  createPart('TopHousing', topHousing, iron, { position: [-0.04, 0.185, 0], rotation: [0, 0, -8], parent: root });

  // Ribbon cover strip
  const ribbonCover = await roundedBoxGeo(0.06, 0.02, 0.28, 0.008, { style: 'round' });
  createPart('RibbonCover', ribbonCover, ironLight, { position: [-0.03, 0.225, 0], parent: root });

  // --- Ribbon spools ---
  const spoolGeo = cylinderGeo(0.028, 0.028, 0.014, 20);
  const spoolHubGeo = cylinderGeo(0.008, 0.008, 0.022, 12);
  const spoolZ = [0.085, -0.085];
  for (let i = 0; i < 2; i++) {
    createPart('Spool' + i, spoolGeo, inkBlack, { position: [-0.03, 0.242, spoolZ[i]], parent: root });
    createPart('SpoolHub' + i, spoolHubGeo, brass, { position: [-0.03, 0.245, spoolZ[i]], parent: root });
  }

  // --- Type-bar basket (fan of levers converging to center) ---
  for (let i = -5; i <= 5; i++) {
    const t = i / 5;
    const sx = 0.0 + Math.abs(t) * 0.01;
    const sz = t * 0.11;
    const ex = -0.075;
    const ez = t * 0.02;
    beamBetween('TypeBar' + (i + 5), [sx, 0.21, sz], [ex, 0.245, ez], 0.0022, steel, { parent: root });
  }
  // Center guide
  const guideGeo = boxGeo(0.02, 0.03, 0.02);
  createPart('TypeGuide', guideGeo, brassDark, { position: [-0.075, 0.25, 0], parent: root });

  // --- Round ivory keys ---
  const brassRingGeo = cylinderGeo(0.0165, 0.0175, 0.010, 20);
  const ivoryTopGeo = cylinderGeo(0.0135, 0.0145, 0.009, 20);
  const keyStemGeo = cylinderGeo(0.0035, 0.0035, 0.035, 8);

  let keyIndex = 0;
  function makeKey(px, py, pz, ivoryMat) {
    const id = keyIndex++;
    createPart('KeyStem' + id, keyStemGeo, steel, { position: [px, py - 0.02, pz], rotation: [0, 0, -18], parent: root });
    createPart('KeyRing' + id, brassRingGeo, brass, { position: [px, py, pz], rotation: [0, 0, -18], parent: root });
    createPart('KeyTop' + id, ivoryTopGeo, ivoryMat, { position: [px + 0.003, py + 0.007, pz], rotation: [0, 0, -18], parent: root });
  }

  const rows = [
    { x: 0.125, y: 0.180, n: 10, w: 0.29 },
    { x: 0.09, y: 0.196, n: 9, w: 0.265 },
    { x: 0.055, y: 0.212, n: 9, w: 0.265 },
    { x: 0.02, y: 0.228, n: 8, w: 0.24 },
  ];
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let k = 0; k < row.n; k++) {
      const z = row.n === 1 ? 0 : -row.w / 2 + (row.w * k) / (row.n - 1);
      const mat = (r + k) % 7 === 3 ? ivoryDim : ivory;
      makeKey(row.x, row.y, z, mat);
    }
  }

  // Space bar - long ivory bar in front
  const spaceBar = await roundedBoxGeo(0.025, 0.012, 0.16, 0.005, { style: 'round' });
  createPart('SpaceBar', spaceBar, ivory, { position: [0.155, 0.172, 0], rotation: [0, 0, -12], parent: root });
  const spaceTrim = await roundedBoxGeo(0.028, 0.005, 0.165, 0.002, { style: 'chamfer' });
  createPart('SpaceTrim', spaceTrim, brass, { position: [0.153, 0.165, 0], rotation: [0, 0, -12], parent: root });

  // --- Carriage: side frames ---
  const sideGeo = boxGeo(0.09, 0.07, 0.015);
  createPart('CarriageSideR', sideGeo, iron, { position: [-0.10, 0.235, 0.185], parent: root });
  createPart('CarriageSideL', sideGeo, iron, { position: [-0.10, 0.235, -0.185], parent: root });
  // Brass side caps
  const sideCapGeo = cylinderZGeo(0.012, 0.012, 0.018, 12);
  createPart('SideCapR', sideCapGeo, brass, { position: [-0.10, 0.25, 0.195], parent: root });
  createPart('SideCapL', sideCapGeo, brass, { position: [-0.10, 0.25, -0.195], parent: root });

  // Carriage rail (steel bar in front of platen)
  const railGeo = cylinderZGeo(0.008, 0.008, 0.40, 12);
  createPart('CarriageRail', railGeo, steel, { position: [-0.055, 0.235, 0], parent: root });

  // --- Platen (paper roller) ---
  const platenGeo = cylinderZGeo(0.028, 0.028, 0.37, 24);
  createPart('Platen', platenGeo, rubber, { position: [-0.115, 0.275, 0], parent: root });
  const axleGeo = cylinderZGeo(0.006, 0.006, 0.44, 10);
  createPart('PlatenAxle', axleGeo, steel, { position: [-0.115, 0.275, 0], parent: root });

  // Brass platen knobs
  const knobGeo = cylinderZGeo(0.020, 0.020, 0.022, 16);
  const knobCapGeo = sphereGeo(0.012, 12, 8);
  createPart('KnobR', knobGeo, brass, { position: [-0.115, 0.275, 0.205], parent: root });
  createPart('KnobL', knobGeo, brass, { position: [-0.115, 0.275, -0.205], parent: root });
  createPart('KnobCapR', knobCapGeo, brassDark, { position: [-0.115, 0.275, 0.219], parent: root });
  createPart('KnobCapL', knobCapGeo, brassDark, { position: [-0.115, 0.275, -0.219], parent: root });

  // Paper bail bar + rollers
  const bailGeo = cylinderZGeo(0.004, 0.004, 0.34, 8);
  createPart('PaperBail', bailGeo, steel, { position: [-0.095, 0.29, 0], parent: root });
  const bailRollerGeo = cylinderZGeo(0.007, 0.007, 0.02, 10);
  createPart('BailRoller1', bailRollerGeo, rubber, { position: [-0.095, 0.29, 0.08], parent: root });
  createPart('BailRoller2', bailRollerGeo, rubber, { position: [-0.095, 0.29, -0.08], parent: root });

  // --- Paper sheet ---
  const paperGeo = boxGeo(0.004, 0.24, 0.24);
  createPart('Paper', paperGeo, paperMat, { position: [-0.135, 0.38, 0], rotation: [0, 0, 8], parent: root });

  // --- Return lever (brass, left side) ---
  beamBetween('ReturnArm', [-0.115, 0.28, -0.20], [-0.05, 0.33, -0.24], 0.006, brass, { parent: root });
  const leverHandleGeo = sphereGeo(0.013, 12, 8);
  createPart('ReturnHandle', leverHandleGeo, wood, { position: [-0.05, 0.33, -0.24], parent: root });

  // Paper guide
  const guidePlate = boxGeo(0.002, 0.06, 0.26);
  createPart('PaperGuide', guidePlate, steel, { position: [-0.098, 0.295, 0], rotation: [0, 0, 10], parent: root });

  return root;
}

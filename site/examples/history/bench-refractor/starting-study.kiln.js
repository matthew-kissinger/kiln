const serviceOffset = 0.20;
const TILT_DEG = -55;
const CARRIAGE_Y = 1.02;

const meta = { name: 'Articulated Observatory Instrument', category: 'prop', role: 'prop' };

async function build() {
  const root = createRoot('ObservatoryInstrument');
  const steel = gameMaterial(0x3a4148, { metalness: 0.7, roughness: 0.45 });
  const darkSteel = gameMaterial(0x23282e, { metalness: 0.6, roughness: 0.55 });
  const aluminium = gameMaterial(0xd8dde2, { metalness: 0.35, roughness: 0.4 });
  const tubeWhite = gameMaterial(0xe8e4d8, { metalness: 0.15, roughness: 0.5 });
  const brass = gameMaterial(0xb08a3e, { metalness: 0.85, roughness: 0.3 });
  const redAnodized = gameMaterial(0x9e2b25, { metalness: 0.5, roughness: 0.4 });
  const blackRubber = gameMaterial(0x141414, { metalness: 0.0, roughness: 0.9 });
  const lensGlass = glassMaterial(0x9fd4ff, { opacity: 0.45, roughness: 0.1, metalness: 0.1 });

  // ---- Tripod (static) ----
  const tripod = createPivot('Tripod', [0, 0, 0], root);
  createPart('Hub', cylinderGeo(0.09, 0.11, 0.12, 24), steel, { position: [0, 0.78, 0], parent: tripod });
  createPart('HubCap', sphereGeo(0.05, 16, 12), brass, { position: [0, 0.86, 0], parent: tripod });
  const footR = 0.48;
  const footAngles = [90, 210, 330];
  footAngles.forEach((deg, i) => {
    const a = deg * Math.PI / 180;
    const fx = Math.cos(a) * footR;
    const fz = Math.sin(a) * footR;
    beamBetween('Leg' + i, [0, 0.76, 0], [fx, 0.06, fz], 0.028, steel, { parent: tripod });
    createPart('FootPad' + i, cylinderGeo(0.055, 0.065, 0.04, 16), darkSteel, { position: [fx, 0.02, fz], parent: tripod });
    createPart('FootBolt' + i, cylinderGeo(0.012, 0.012, 0.03, 6), brass, { position: [fx, 0.05, fz], parent: tripod });
    beamBetween('Spreader' + i, [0, 0.35, 0], [(fx * 0.82), 0.22, (fz * 0.82)], 0.012, darkSteel, { parent: tripod });
  });
  createPart('SpreaderHub', cylinderGeo(0.04, 0.04, 0.05, 12), brass, { position: [0, 0.35, 0], parent: tripod });
  createPart('Column', cylinderGeo(0.05, 0.06, 0.35, 20), steel, { position: [0, 0.9, 0], parent: tripod });
  createPart('ColumnCollar', torusGeo(0.06, 0.015, 8, 20), brass, { position: [0, 0.98, 0], rotation: [0, 0, 0], parent: tripod });

  // ---- Translation rail = mechanical axis along X (static) ----
  const railGroup = createPivot('RailBase', [0, 0, 0], root);
  createPart('RailBed', boxGeo(0.78, 0.05, 0.22), darkSteel, { position: [0, 1.0, 0], parent: railGroup });
  // two polished rods show the horizontal axis
  createPart('RodFront', cylinderXGeo(0.014, 0.014, 0.7, 12), aluminium, { position: [0, 1.045, 0.07], parent: railGroup });
  createPart('RodBack', cylinderXGeo(0.014, 0.014, 0.7, 12), aluminium, { position: [0, 1.045, -0.07], parent: railGroup });
  createPart('RailEndL', boxGeo(0.05, 0.09, 0.24), steel, { position: [-0.38, 1.045, 0], parent: railGroup });
  createPart('RailEndR', boxGeo(0.05, 0.09, 0.24), steel, { position: [0.38, 1.045, 0], parent: railGroup });
  for (let s = -1; s <= 1; s += 2) {
    const x = s * 0.38;
    createPart('RailBoltF' + (s > 0 ? 'R' : 'L'), cylinderGeo(0.01, 0.01, 0.025, 6), brass, { position: [x, 1.09, 0.07], parent: railGroup });
    createPart('RailBoltB' + (s > 0 ? 'R' : 'L'), cylinderGeo(0.01, 0.01, 0.025, 6), brass, { position: [x, 1.09, -0.07], parent: railGroup });
  }
  // rack teeth strip reinforces the translation axis reading
  for (let i = 0; i < 9; i++) {
    const x = -0.28 + i * 0.07;
    createPart('RackTooth' + i, boxGeo(0.02, 0.015, 0.04), brass, { position: [x, 1.03, 0], parent: railGroup });
  }

  // ---- Carriage (animated) ----
  const carriage = createPivot('Carriage', [0, CARRIAGE_Y, 0], root);
  createPart('CarriageBlock', boxGeo(0.24, 0.07, 0.2), redAnodized, { position: [0, 0.075, 0], parent: carriage });
  createPart('CarriageTopPlate', boxGeo(0.26, 0.02, 0.22), steel, { position: [0, 0.12, 0], parent: carriage });
  // side skirts partly conceal the trunnion foot + hidden bolts
  createPart('CarriageSkirtL', boxGeo(0.26, 0.05, 0.02), darkSteel, { position: [0, 0.06, 0.1], parent: carriage });
  createPart('CarriageSkirtR', boxGeo(0.26, 0.05, 0.02), darkSteel, { position: [0, 0.06, -0.1], parent: carriage });
  // sliding sleeves around rods
  createPart('SleeveF', cylinderXGeo(0.022, 0.022, 0.2, 12), darkSteel, { position: [0, 0.025, 0.07], parent: carriage });
  createPart('SleeveB', cylinderXGeo(0.022, 0.022, 0.2, 12), darkSteel, { position: [0, 0.025, -0.07], parent: carriage });
  // visible carriage bolts
  createPart('CarriageBoltFL', cylinderGeo(0.009, 0.009, 0.02, 6), brass, { position: [-0.09, 0.135, 0.07], parent: carriage });
  createPart('CarriageBoltFR', cylinderGeo(0.009, 0.009, 0.02, 6), brass, { position: [0.09, 0.135, 0.07], parent: carriage });

  // ---- Tilt cradle on carriage ----
  const tiltBase = createPivot('TiltBase', [0, 0.13, 0], carriage);
  // Front V-block (visible bracket)
  createPart('FrontCradle', boxGeo(0.08, 0.1, 0.16), steel, { position: [0.1, 0.06, 0], parent: tiltBase });
  createPart('FrontSaddle', cylinderXGeo(0.082, 0.082, 0.07, 20), darkSteel, { position: [0.1, 0.1, 0], parent: tiltBase });
  // Rear trunnion: foot slides INTO carriage slot -> partly concealed attachment
  createPart('RearFootHidden', boxGeo(0.12, 0.025, 0.12), steel, { position: [-0.1, 0.005, 0], parent: tiltBase });
  createPart('RearPost', boxGeo(0.05, 0.12, 0.05), steel, { position: [-0.1, 0.07, 0], parent: tiltBase });
  createPart('RearSaddle', cylinderXGeo(0.08, 0.08, 0.05, 20), darkSteel, { position: [-0.1, 0.12, 0], parent: tiltBase });
  // bolts: two visible in front of skirt, two tucked under top plate (concealed)
  createPart('TrunnionBoltVisL', cylinderGeo(0.008, 0.008, 0.02, 6), brass, { position: [-0.05, 0.015, 0.045], parent: tiltBase });
  createPart('TrunnionBoltVisR', cylinderGeo(0.008, 0.008, 0.02, 6), brass, { position: [-0.05, 0.015, -0.045], parent: tiltBase });
  createPart('TrunnionBoltHidL', cylinderGeo(0.008, 0.008, 0.02, 6), brass, { position: [-0.14, 0.005, 0.045], parent: tiltBase });
  createPart('TrunnionBoltHidR', cylinderGeo(0.008, 0.008, 0.02, 6), brass, { position: [-0.14, 0.005, -0.045], parent: tiltBase });

  // ---- Tilted optical tube (optical axis) ----
  const tilt = createPivot('TiltTube', [0, 0.1, 0], tiltBase);
  tilt.rotation.z = TILT_DEG * Math.PI / 180;
  // main tube along local +Y
  createPart('MainTube', cylinderGeo(0.07, 0.07, 0.8, 28), tubeWhite, { position: [0, 0.25, 0], parent: tilt });
  createPart('TubeRingFront', torusGeo(0.071, 0.012, 8, 28), brass, { position: [0, 0.55, 0], parent: tilt });
  createPart('TubeRingRear', torusGeo(0.071, 0.012, 8, 28), brass, { position: [0, -0.05, 0], parent: tilt });
  createPart('DewShield', cylinderGeo(0.086, 0.086, 0.18, 28), darkSteel, { position: [0, 0.68, 0], parent: tilt });
  createPart('ObjectiveCell', cylinderGeo(0.075, 0.075, 0.05, 28), brass, { position: [0, 0.585, 0], parent: tilt });
  createPart('ObjectiveLens', cylinderGeo(0.068, 0.068, 0.008, 28), lensGlass, { position: [0, 0.60, 0], parent: tilt });
  createPart('RearCell', cylinderGeo(0.072, 0.072, 0.08, 24), steel, { position: [0, -0.16, 0], parent: tilt });
  createPart('RearCap', sphereGeo(0.03, 12, 8), blackRubber, { position: [0, -0.21, 0], parent: tilt });
  // finder scope parallel to main tube reinforces optical axis
  createPart('FinderTube', cylinderGeo(0.022, 0.022, 0.3, 14), darkSteel, { position: [0.0, 0.32, 0.095], parent: tilt });
  createPart('FinderLens', cylinderGeo(0.02, 0.02, 0.006, 14), lensGlass, { position: [0.0, 0.47, 0.095], parent: tilt });
  createPart('FinderBracketA', boxGeo(0.03, 0.03, 0.03), steel, { position: [0.0, 0.22, 0.075], parent: tilt });
  createPart('FinderBracketB', boxGeo(0.03, 0.03, 0.03), steel, { position: [0.0, 0.42, 0.075], parent: tilt });

  // ---- ServiceAssembly: focusing stage + side eyepiece + bracket (moves with serviceOffset) ----
  const serviceAssembly = createPivot('ServiceAssembly', [0, 0.0 + serviceOffset, 0], tilt);
  // slider sleeve around tube
  createPart('FocusSleeve', cylinderGeo(0.082, 0.082, 0.1, 24), redAnodized, { position: [0, 0.0, 0], parent: serviceAssembly });
  createPart('FocusRing', torusGeo(0.083, 0.01, 8, 24), blackRubber, { position: [0, 0.03, 0], parent: serviceAssembly });
  // focus knobs both sides
  createPart('FocusKnobR', cylinderZGeo(0.022, 0.022, 0.03, 16), blackRubber, { position: [0, 0.0, 0.1], parent: serviceAssembly });
  createPart('FocusKnobL', cylinderZGeo(0.022, 0.022, 0.03, 16), blackRubber, { position: [0, 0.0, -0.1], parent: serviceAssembly });
  createPart('FocusShaft', cylinderZGeo(0.008, 0.008, 0.19, 10), brass, { position: [0, 0.0, 0], parent: serviceAssembly });
  // L-bracket: vertical plate + foot wrapping slider (mounting bracket)
  const bracketProfile = [[-0.05, -0.02], [0.05, -0.02], [0.05, 0.02], [0.015, 0.02], [0.015, 0.1], [-0.025, 0.1], [-0.025, 0.02], [-0.05, 0.02]];
  const bracketGeo = await extrudeProfile(bracketProfile, { depth: 0.06, bevel: 0.004 });
  createPart('FocusBracket', bracketGeo, steel, { position: [0, -0.02, 0.1], parent: serviceAssembly });
  createPart('BracketBoltA', cylinderGeo(0.008, 0.008, 0.018, 6), brass, { position: [0.03, 0.0, 0.135], rotation: [90, 0, 0], parent: serviceAssembly });
  createPart('BracketBoltB', cylinderGeo(0.008, 0.008, 0.018, 6), brass, { position: [-0.03, 0.0, 0.135], rotation: [90, 0, 0], parent: serviceAssembly });
  // side eyepiece along +Z (side of tube)
  createPart('EyepieceHolder', cylinderZGeo(0.028, 0.028, 0.07, 16), steel, { position: [0, -0.01, 0.17], parent: serviceAssembly });
  createPart('EyepieceTube', cylinderZGeo(0.02, 0.024, 0.12, 16), darkSteel, { position: [0, -0.01, 0.25], parent: serviceAssembly });
  createPart('Eyecup', cylinderZGeo(0.028, 0.022, 0.03, 16), blackRubber, { position: [0, -0.01, 0.325], parent: serviceAssembly });
  createPart('EyeLens', cylinderZGeo(0.016, 0.016, 0.005, 16), lensGlass, { position: [0, -0.01, 0.341], parent: serviceAssembly });
  // diagonal small tube connecting focuser to eyepiece path
  beamBetween('FocusDrawtube', [0, -0.01, 0.05], [0, -0.01, 0.14], 0.018, brass, { parent: serviceAssembly });

  return root;
}

function animate(root) {
  return [createClip('ServiceMotion', 1.0, [
    positionTrack('Joint_Carriage', [
      { time: 0, position: [0, CARRIAGE_Y, 0] },
      { time: 0.5, position: [0.3, CARRIAGE_Y, 0] },
      { time: 1.0, position: [0, CARRIAGE_Y, 0] }
    ])
  ])];
}

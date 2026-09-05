// Art Deco Radio - Collectible 1930s Cathedral/Waterfall Tabletop Model
const meta = {
  name: 'Art Deco Radio',
  category: 'prop',
  role: 'prop'
};

async function build() {
  const root = createRoot('ArtDecoRadio');

  // Materials
  const walnutMat = gameMaterial(0x4a2a18, { roughness: 0.42, metalness: 0.06 });
  const darkWoodMat = gameMaterial(0x23140c, { roughness: 0.48, metalness: 0.04 });
  const brassMat = gameMaterial(0xd4af37, { roughness: 0.22, metalness: 0.88 });
  const antiqueBrassMat = gameMaterial(0x9e7b2c, { roughness: 0.35, metalness: 0.82 });
  const grilleClothMat = gameMaterial(0xc29b38, { roughness: 0.92, metalness: 0.02 });
  const dialFaceMat = gameMaterial(0xfcf5e5, { roughness: 0.55, emissive: 0xffd27d, emissiveIntensity: 0.32 });
  const dialGlassMat = glassMaterial(0xd8f0ff, { opacity: 0.32, roughness: 0.08 });
  const pointerMat = gameMaterial(0xd32f2f, { roughness: 0.30, metalness: 0.10 });
  const bakeliteMat = gameMaterial(0x1a120e, { roughness: 0.32, metalness: 0.08 });
  const pilotJewelMat = gameMaterial(0xdd1818, { roughness: 0.15, emissive: 0xff2200, emissiveIntensity: 0.75 });
  const backPanelMat = gameMaterial(0x2d221b, { roughness: 0.85 });
  const dialTickMat = gameMaterial(0x2b1c11, { roughness: 0.6 });

  // 1. Stepped Plinth Base & Corner Feet
  const lowerPlinthGeo = await roundedBoxGeo(0.200, 0.015, 0.340, 0.004, { segments: 10 });
  createPart('LowerPlinth', lowerPlinthGeo, darkWoodMat, { position: [0, 0.0075, 0], parent: root });

  const plinthBrassGeo = boxGeo(0.194, 0.004, 0.330);
  createPart('PlinthBrassTrim', plinthBrassGeo, brassMat, { position: [0, 0.017, 0], parent: root });

  const upperPlinthGeo = await roundedBoxGeo(0.186, 0.014, 0.316, 0.0035, { segments: 10 });
  createPart('UpperPlinth', upperPlinthGeo, darkWoodMat, { position: [0, 0.026, 0], parent: root });

  const footPositions = [
    [0.075, 0.003, 0.140],
    [0.075, 0.003, -0.140],
    [-0.075, 0.003, 0.140],
    [-0.075, 0.003, -0.140]
  ];
  footPositions.forEach((pos, idx) => {
    const footGeo = cylinderYGeo(0.014, 0.011, 0.006, 16);
    createPart(`Foot_${idx + 1}`, footGeo, antiqueBrassMat, { position: pos, parent: root });
  });

  // 2. Stepped Silhouette Cabinet Body
  const wingGeo = await roundedBoxGeo(0.165, 0.200, 0.050, 0.014, { segments: 14 });
  createPart('LeftWing', wingGeo, walnutMat, { position: [0, 0.133, -0.125], parent: root });
  createPart('RightWing', wingGeo, walnutMat, { position: [0, 0.133, 0.125], parent: root });

  [-0.151, 0.151].forEach((zSide, sideIdx) => {
    [-0.03, 0, 0.03].forEach((yOffset, ribIdx) => {
      const ribGeo = cylinderXGeo(0.002, 0.002, 0.12, 10);
      createPart(`WingRib_${sideIdx}_${ribIdx}`, ribGeo, brassMat, {
        position: [0, 0.133 + yOffset, zSide],
        parent: root
      });
    });
  });

  const shoulderGeo = await roundedBoxGeo(0.172, 0.280, 0.026, 0.010, { segments: 14 });
  createPart('LeftShoulder', shoulderGeo, walnutMat, { position: [0, 0.173, -0.088], parent: root });
  createPart('RightShoulder', shoulderGeo, walnutMat, { position: [0, 0.173, 0.088], parent: root });

  const centerTowerGeo = await roundedBoxGeo(0.178, 0.347, 0.150, 0.018, { segments: 16 });
  createPart('CenterTower', centerTowerGeo, walnutMat, { position: [0, 0.206, 0], parent: root });

  [-0.076, 0.076].forEach((zPos, idx) => {
    const pillarGeo = cylinderYGeo(0.004, 0.004, 0.340, 16);
    createPart(`DecoPillar_${idx + 1}`, pillarGeo, brassMat, { position: [0.088, 0.203, zPos], parent: root });
  });

  const crestTiers = [
    { size: [0.110, 0.005, 0.070], y: 0.382 },
    { size: [0.085, 0.005, 0.048], y: 0.387 },
    { size: [0.055, 0.005, 0.026], y: 0.392 }
  ];
  crestTiers.forEach((tier, idx) => {
    const tierGeo = boxGeo(tier.size[0], tier.size[1], tier.size[2]);
    createPart(`ApexCrest_${idx + 1}`, tierGeo, brassMat, { position: [0, tier.y, 0], parent: root });
  });

  // 3. Speaker Grille & Woven Geometric Fretwork
  const grilleBezelOuter = await roundedBoxGeo(0.006, 0.136, 0.124, 0.0025, { segments: 12 });
  createPart('SpeakerGrilleBezel', grilleBezelOuter, brassMat, { position: [0.089, 0.275, 0], parent: root });

  const clothGeo = boxGeo(0.003, 0.124, 0.112);
  createPart('GrilleCloth', clothGeo, grilleClothMat, { position: [0.085, 0.275, 0], parent: root });

  const slatLength = 0.140;
  const slatThickness = 0.0022;
  const slatWidth = 0.0035;
  const slatOffsets = [-0.045, -0.030, -0.015, 0, 0.015, 0.030, 0.045];

  slatOffsets.forEach((offset, idx) => {
    const slatGeo = boxGeo(slatThickness, slatLength, slatWidth);
    createPart(`GrilleSlatPos_${idx}`, slatGeo, darkWoodMat, {
      position: [0.0872, 0.275 + offset * 0.7, offset],
      rotation: [45, 0, 0],
      parent: root
    });
  });

  slatOffsets.forEach((offset, idx) => {
    const slatGeo = boxGeo(slatThickness, slatLength, slatWidth);
    createPart(`GrilleSlatNeg_${idx}`, slatGeo, darkWoodMat, {
      position: [0.0888, 0.275 + offset * 0.7, offset],
      rotation: [-45, 0, 0],
      parent: root
    });
  });

  [-0.026, 0, 0.026].forEach((zPos, idx) => {
    const barGeo = cylinderYGeo(0.0018, 0.0018, 0.132, 12);
    createPart(`GrilleCenterBar_${idx}`, barGeo, brassMat, { position: [0.091, 0.275, zPos], parent: root });
  });

  const medallionGeo = boxGeo(0.003, 0.018, 0.018);
  createPart('GrilleMedallion', medallionGeo, brassMat, { position: [0.092, 0.275, 0], rotation: [45, 0, 0], parent: root });

  // 4. Inset Glass Tuning Dial & Animated Pointer
  const dialBezelGeo = await roundedBoxGeo(0.008, 0.068, 0.116, 0.0025, { segments: 10 });
  createPart('DialBezel', dialBezelGeo, brassMat, { position: [0.088, 0.165, 0], parent: root });

  const dialFaceGeo = boxGeo(0.002, 0.054, 0.100);
  createPart('DialFace', dialFaceGeo, dialFaceMat, { position: [0.084, 0.165, 0], parent: root });

  const scaleLineAM = boxGeo(0.001, 0.0015, 0.084);
  createPart('ScaleLineAM', scaleLineAM, dialTickMat, { position: [0.0852, 0.176, 0], parent: root });

  const scaleLineSW = boxGeo(0.001, 0.0015, 0.084);
  createPart('ScaleLineSW', scaleLineSW, dialTickMat, { position: [0.0852, 0.154, 0], parent: root });

  for (let t = -7; t <= 7; t++) {
    const isMajor = t % 2 === 0;
    const tickH = isMajor ? 0.005 : 0.003;
    const tickGeo = boxGeo(0.001, tickH, 0.0012);
    createPart(`DialTick_${t + 7}`, tickGeo, dialTickMat, {
      position: [0.0852, 0.176 - (isMajor ? 0.002 : 0.001), t * 0.0056],
      parent: root
    });
  }

  const pointerPivot = createPivot('TuningPointer', [0.086, 0.142, 0], root);

  const needleArmGeo = boxGeo(0.0012, 0.038, 0.0016);
  createPart('NeedleArm', needleArmGeo, pointerMat, { position: [0, 0.019, 0], parent: pointerPivot });

  const needleTipGeo = cylinderYGeo(0.0008, 0.002, 0.006, 8);
  createPart('NeedleTip', needleTipGeo, pointerMat, { position: [0, 0.038, 0], parent: pointerPivot });

  const pointerHubGeo = cylinderXGeo(0.0035, 0.0035, 0.0025, 16);
  createPart('NeedleHub', pointerHubGeo, brassMat, { position: [0, 0, 0], parent: pointerPivot });

  const glassGeo = await roundedBoxGeo(0.0025, 0.056, 0.104, 0.001, { segments: 8 });
  createPart('DialGlass', glassGeo, dialGlassMat, { position: [0.0895, 0.165, 0], parent: root });

  // 5. Tactile Differentiated Knobs
  const tuningKnobPivot = createPivot('TuningKnob', [0.090, 0.076, 0], root);

  const centerBezelGeo = cylinderXGeo(0.017, 0.017, 0.0025, 24);
  createPart('TuningKnobBezel', centerBezelGeo, brassMat, { position: [0.0015, 0, 0], parent: tuningKnobPivot });

  const centerBodyGeo = cylinderXGeo(0.0145, 0.0155, 0.013, 24);
  createPart('TuningKnobBody', centerBodyGeo, bakeliteMat, { position: [0.008, 0, 0], parent: tuningKnobPivot });

  const fluteCount = 12;
  for (let f = 0; f < fluteCount; f++) {
    const angle = (f * (360 / fluteCount)) * (Math.PI / 180);
    const fluteGeo = cylinderXGeo(0.0016, 0.0016, 0.011, 8);
    createPart(`TuningFlute_${f}`, fluteGeo, bakeliteMat, {
      position: [0.008, 0.015 * Math.cos(angle), 0.015 * Math.sin(angle)],
      parent: tuningKnobPivot
    });
  }

  const centerCapGeo = cylinderXGeo(0.009, 0.009, 0.002, 24);
  createPart('TuningCap', centerCapGeo, brassMat, { position: [0.015, 0, 0], parent: tuningKnobPivot });

  const tuningPipGeo = boxGeo(0.002, 0.003, 0.0015);
  createPart('TuningPip', tuningPipGeo, pointerMat, { position: [0.0155, 0.006, 0], parent: tuningKnobPivot });

  const leftKnobBaseGeo = cylinderXGeo(0.013, 0.014, 0.008, 20);
  createPart('VolumeKnobBase', leftKnobBaseGeo, darkWoodMat, { position: [0.095, 0.076, -0.054], parent: root });

  const leftKnobBrassRim = cylinderXGeo(0.0142, 0.0142, 0.002, 20);
  createPart('VolumeKnobRim', leftKnobBrassRim, brassMat, { position: [0.0995, 0.076, -0.054], parent: root });

  const leftKnobInnerGeo = cylinderXGeo(0.0075, 0.008, 0.015, 18);
  createPart('VolumeKnobInner', leftKnobInnerGeo, bakeliteMat, { position: [0.101, 0.076, -0.054], parent: root });

  const leftKnobCapGeo = cylinderXGeo(0.005, 0.005, 0.002, 16);
  createPart('VolumeKnobCap', leftKnobCapGeo, brassMat, { position: [0.109, 0.076, -0.054], parent: root });

  const rightKnobHubGeo = cylinderXGeo(0.012, 0.0125, 0.009, 20);
  createPart('SelectorKnobHub', rightKnobHubGeo, bakeliteMat, { position: [0.095, 0.076, 0.054], parent: root });

  const rightPointerArm = boxGeo(0.007, 0.016, 0.005);
  createPart('SelectorPointerArm', rightPointerArm, bakeliteMat, {
    position: [0.096, 0.082, 0.058],
    rotation: [30, 0, 0],
    parent: root
  });

  const rightKnobCap = cylinderXGeo(0.006, 0.006, 0.002, 16);
  createPart('SelectorKnobCap', rightKnobCap, brassMat, { position: [0.100, 0.076, 0.054], parent: root });

  // 6. Fine Details
  const lampBezelGeo = cylinderXGeo(0.0055, 0.0055, 0.003, 16);
  createPart('PilotLampBezel', lampBezelGeo, brassMat, { position: [0.090, 0.114, 0], parent: root });

  const jewelGeo = cylinderXGeo(0.0035, 0.002, 0.003, 14);
  createPart('PilotJewel', jewelGeo, pilotJewelMat, { position: [0.092, 0.114, 0], parent: root });

  const plaqueGeo = boxGeo(0.002, 0.009, 0.042);
  createPart('BrandPlaque', plaqueGeo, brassMat, { position: [0.090, 0.048, 0], parent: root });

  const plaqueInlayGeo = boxGeo(0.001, 0.006, 0.036);
  createPart('BrandPlaqueInlay', plaqueInlayGeo, darkWoodMat, { position: [0.0912, 0.048, 0], parent: root });

  const backBoardGeo = boxGeo(0.004, 0.310, 0.300);
  createPart('BackPanel', backBoardGeo, backPanelMat, { position: [-0.088, 0.185, 0], parent: root });

  for (let v = 0; v < 5; v++) {
    const louverGeo = boxGeo(0.002, 0.005, 0.160);
    createPart(`BackLouver_${v}`, louverGeo, darkWoodMat, { position: [-0.0905, 0.230 - v * 0.018, 0], parent: root });
  }

  const grommetGeo = cylinderXGeo(0.006, 0.006, 0.004, 14);
  createPart('PowerGrommet', grommetGeo, bakeliteMat, { position: [-0.090, 0.050, 0.080], parent: root });

  return root;
}

function animate(root) {
  const pointerTrack = rotationTrack('Joint_TuningPointer', [
    { time: 0.0, rotation: [-24, 0, 0] },
    { time: 1.2, rotation: [10, 0, 0] },
    { time: 2.2, rotation: [26, 0, 0] },
    { time: 3.0, rotation: [-8, 0, 0] },
    { time: 4.0, rotation: [-24, 0, 0] }
  ]);

  const knobTrack = rotationTrack('Joint_TuningKnob', [
    { time: 0.0, rotation: [0, 0, 0] },
    { time: 1.2, rotation: [240, 0, 0] },
    { time: 2.2, rotation: [480, 0, 0] },
    { time: 3.0, rotation: [160, 0, 0] },
    { time: 4.0, rotation: [0, 0, 0] }
  ]);

  return [createClip('Tune', 4.0, [pointerTrack, knobTrack])];
}

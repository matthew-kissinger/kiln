const meta = { name: 'Twisting ribbed canopy', category: 'architecture', role: 'building' };

// serviceOffset controls the lateral position of ServiceAssembly
const serviceOffset = 0.35;

/**
 * Surface equation for the asymmetric twisting canopy roof.
 * u: longitudinal coordinate [-3.0, 3.0]
 * v: transverse coordinate [-2.0, 2.0]
 */
function getRoofPoint(u, v) {
  const t = (u + 3.0) / 6.0; // 0 at u = -3, 1 at u = +3
  // Twist angle in radians: from -15 deg (-0.26 rad) to +18.3 deg (+0.32 rad)
  const theta = -0.26 + 0.58 * t;
  // Transverse arch and asymmetric sag
  const arch = 0.35 * (1.0 - Math.pow(v / 2.0, 2));
  const asymSag = 0.08 * Math.sin(t * Math.PI) * (v / 2.0);
  const longitudinalCrown = 0.12 * Math.cos((u / 3.0) * (Math.PI / 2.0));
  const h = arch + asymSag;
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const x = u;
  const y = 2.85 + longitudinalCrown + v * sinT + h * cosT;
  const z = v * cosT - h * sinT;
  return [x, y, z];
}

function build() {
  const root = createRoot('TwistingCanopy');

  // Materials
  const roofMat = gameMaterial(0xf0f4f8, { roughness: 0.35, metalness: 0.15 });
  roofMat.side = THREE.DoubleSide;

  const steelRibMat = gameMaterial(0x2d3748, { roughness: 0.45, metalness: 0.75 });
  const footingMat = gameMaterial(0x8c9298, { roughness: 0.85, metalness: 0.1 });
  const columnMat = gameMaterial(0x3b444c, { roughness: 0.4, metalness: 0.8 });
  const trolleyMat = gameMaterial(0x1a202c, { roughness: 0.5, metalness: 0.8 });
  const railMat = gameMaterial(0x4a5568, { roughness: 0.35, metalness: 0.85 });
  const housingMat = gameMaterial(0x2b303a, { roughness: 0.4, metalness: 0.7 });
  const lensMat = gameMaterial(0xffffff, { roughness: 0.2, metalness: 0.0, emissive: 0xfff5e0, emissiveIntensity: 2.2 });

  // 1. Thin continuous roof membrane
  const roofGeo = parametricSurface((u, v) => getRoofPoint(u, v), {
    u: [-3.0, 3.0],
    v: [-2.0, 2.0],
    uSegments: 48,
    vSegments: 24,
  });
  createPart('RoofMembrane', roofGeo, roofMat, { parent: root });

  // 2. Twelve repeated structural ribs following the roof profile
  const ribCount = 12;
  const ribProfile = [[-0.035, -0.07], [0.035, -0.07], [0.035, 0.01], [-0.035, 0.01]];
  for (let i = 0; i < ribCount; i++) {
    const uRib = -2.7 + i * (5.4 / (ribCount - 1));
    const stations = [];
    const numStations = 17;
    for (let k = 0; k < numStations; k++) {
      const vk = -1.95 + k * (3.9 / (numStations - 1));
      const pt = getRoofPoint(uRib, vk);
      stations.push([pt[0], pt[1] - 0.02, pt[2]]);
    }
    const ribGeo = sweepProfile(ribProfile, stations, { up: [1, 0, 0] });
    createPart('StructuralRib_' + (i + 1), ribGeo, steelRibMat, { parent: root });
  }

  // 3. Central longitudinal structural spine
  const spineProfile = [[-0.04, -0.04], [0.04, -0.04], [0.04, 0.04], [-0.04, 0.04]];
  const spineStations = [];
  const spineCount = 19;
  for (let k = 0; k < spineCount; k++) {
    const xk = -2.8 + k * (5.6 / (spineCount - 1));
    const pt = getRoofPoint(xk, 0.0);
    spineStations.push([pt[0], pt[1] - 0.05, pt[2]]);
  }
  const spineGeo = sweepProfile(spineProfile, spineStations, { up: [0, 0, 1] });
  createPart('CentralSpine', spineGeo, steelRibMat, { parent: root });

  // 4. Two offset structural supports
  // Support 1: West / negative X, negative Z
  const s1X = -1.3;
  const s1Z = -0.7;
  createPart('Support1_Footing', boxGeo(0.5, 0.08, 0.5), footingMat, { position: [s1X, 0.04, s1Z], parent: root });
  createPart('Support1_Pedestal', cylinderGeo(0.18, 0.22, 0.28, 16), footingMat, { position: [s1X, 0.22, s1Z], parent: root });
  createPart('Support1_Column', cylinderGeo(0.11, 0.14, 1.9, 16), columnMat, { position: [s1X, 1.31, s1Z], parent: root });
  createPart('Support1_Capital', cylinderGeo(0.20, 0.13, 0.12, 16), columnMat, { position: [s1X, 2.32, s1Z], parent: root });

  const s1Cap = [s1X, 2.35, s1Z];
  const rib3Pt = getRoofPoint(-1.72, -0.7);
  const spine1Pt = getRoofPoint(-1.3, 0.0);
  const rib5Pt = getRoofPoint(-0.74, -0.7);
  beamBetween('Support1_StrutWest', s1Cap, [rib3Pt[0], rib3Pt[1] - 0.05, rib3Pt[2]], 0.04, columnMat, { parent: root });
  beamBetween('Support1_StrutSpine', s1Cap, [spine1Pt[0], spine1Pt[1] - 0.06, spine1Pt[2]], 0.04, columnMat, { parent: root });
  beamBetween('Support1_StrutEast', s1Cap, [rib5Pt[0], rib5Pt[1] - 0.05, rib5Pt[2]], 0.04, columnMat, { parent: root });

  // Support 2: East / positive X, positive Z (offset in both X and Z)
  const s2X = 1.4;
  const s2Z = 0.65;
  createPart('Support2_Footing', boxGeo(0.5, 0.08, 0.5), footingMat, { position: [s2X, 0.04, s2Z], parent: root });
  createPart('Support2_Pedestal', cylinderGeo(0.18, 0.22, 0.28, 16), footingMat, { position: [s2X, 0.22, s2Z], parent: root });
  createPart('Support2_Column', cylinderGeo(0.11, 0.14, 2.15, 16), columnMat, { position: [s2X, 1.435, s2Z], parent: root });
  createPart('Support2_Capital', cylinderGeo(0.20, 0.13, 0.12, 16), columnMat, { position: [s2X, 2.57, s2Z], parent: root });

  const s2Cap = [s2X, 2.60, s2Z];
  const rib8Pt = getRoofPoint(0.74, 0.65);
  const spine2Pt = getRoofPoint(1.4, 0.0);
  const rib10Pt = getRoofPoint(1.72, 0.65);
  beamBetween('Support2_StrutWest', s2Cap, [rib8Pt[0], rib8Pt[1] - 0.05, rib8Pt[2]], 0.04, columnMat, { parent: root });
  beamBetween('Support2_StrutSpine', s2Cap, [spine2Pt[0], spine2Pt[1] - 0.06, spine2Pt[2]], 0.04, columnMat, { parent: root });
  beamBetween('Support2_StrutEast', s2Cap, [rib10Pt[0], rib10Pt[1] - 0.05, rib10Pt[2]], 0.04, columnMat, { parent: root });

  // 5. Fixed mounting track suspended under the canopy at serviceOffset
  const trackY = 2.65;
  createPart('FixedGuideTrack', boxGeo(4.6, 0.04, 0.04), steelRibMat, { position: [0, trackY, serviceOffset], parent: root });

  // Fixed suspension hangers connecting ribs to the fixed guide track
  const hangerX = [-1.8, -0.9, 0.0, 0.9, 1.8];
  for (let h = 0; h < hangerX.length; h++) {
    const xh = hangerX[h];
    const th = (xh + 3.0) / 6.0;
    const rot = -0.26 + 0.58 * th;
    const vApprox = serviceOffset / Math.cos(rot);
    const roofAbove = getRoofPoint(xh, vApprox);
    beamBetween('TrackHanger_' + (h + 1), [xh, roofAbove[1] - 0.05, serviceOffset], [xh, trackY + 0.02, serviceOffset], 0.015, steelRibMat, { parent: root });
  }

  // 6. ServiceAssembly: suspended maintenance light rail
  // Named exactly 'ServiceAssembly'
  const serviceAssembly = createPivot('ServiceAssembly', [0, trackY, serviceOffset], root);
  serviceAssembly.name = 'ServiceAssembly';

  // Trolley brackets (clamp over and slide along mounting track)
  const trolleyX = [-1.2, 0.0, 1.2];
  for (let t = 0; t < trolleyX.length; t++) {
    const xt = trolleyX[t];
    createPart('TrolleyCarriage_' + (t + 1), boxGeo(0.14, 0.06, 0.07), trolleyMat, { position: [xt, 0.0, 0.0], parent: serviceAssembly });
    beamBetween('TrolleyDropL_' + (t + 1), [xt - 0.04, 0.0, 0.0], [xt - 0.04, -0.12, 0.0], 0.012, steelRibMat, { parent: serviceAssembly });
    beamBetween('TrolleyDropR_' + (t + 1), [xt + 0.04, 0.0, 0.0], [xt + 0.04, -0.12, 0.0], 0.012, steelRibMat, { parent: serviceAssembly });
  }

  // Light rail main extrusion
  createPart('LightRailBeam', boxGeo(3.6, 0.04, 0.06), railMat, { position: [0.0, -0.12, 0.0], parent: serviceAssembly });
  createPart('LightRailEndCap_Neg', boxGeo(0.02, 0.05, 0.07), trolleyMat, { position: [-1.81, -0.12, 0.0], parent: serviceAssembly });
  createPart('LightRailEndCap_Pos', boxGeo(0.02, 0.05, 0.07), trolleyMat, { position: [1.81, -0.12, 0.0], parent: serviceAssembly });

  // Light housings and lenses (move together with brackets and rail)
  const lightX = [-1.35, -0.45, 0.45, 1.35];
  for (let l = 0; l < lightX.length; l++) {
    const xl = lightX[l];
    createPart('LightHousing_' + (l + 1), boxGeo(0.40, 0.035, 0.10), housingMat, { position: [xl, -0.155, 0.0], parent: serviceAssembly });
    createPart('LightLens_' + (l + 1), boxGeo(0.36, 0.01, 0.08), lensMat, { position: [xl, -0.175, 0.0], parent: serviceAssembly });
  }

  return root;
}

function animate(root) {
  const track = positionTrack('ServiceAssembly', [
    { time: 0.0, position: [0.0, 2.65, serviceOffset] },
    { time: 0.5, position: [0.25, 2.65, serviceOffset] },
    { time: 1.0, position: [0.0, 2.65, serviceOffset] },
  ]);
  return [createClip('ServiceMotion', 1.0, [track])];
}


const meta = {
  name: 'Greywatch Stylized Aircraft Carrier',
  category: 'vehicle',
  role: 'vehicle'
};

function hullGeometry() {
  const stations = [
    { x: -10.6, w: 1.65, top: 2.08, shoulder: 1.62, bottom: 0.72 },
    { x: -9.2,  w: 2.55, top: 2.12, shoulder: 1.55, bottom: 0.48 },
    { x: -5.8,  w: 2.92, top: 2.14, shoulder: 1.48, bottom: 0.34 },
    { x:  0.0,  w: 3.02, top: 2.16, shoulder: 1.44, bottom: 0.28 },
    { x:  5.5,  w: 2.72, top: 2.12, shoulder: 1.50, bottom: 0.42 },
    { x:  8.6,  w: 1.72, top: 2.02, shoulder: 1.52, bottom: 0.62 },
    { x: 10.5,  w: 0.22, top: 1.72, shoulder: 1.38, bottom: 0.92 }
  ];
  const positions = [];
  const indices = [];
  for (const s of stations) {
    const w = s.w;
    const ring = [
      [s.x, s.top,     -w * 0.82],
      [s.x, s.top,      w * 0.82],
      [s.x, s.shoulder,  w],
      [s.x, s.bottom + 0.32,  w * 0.68],
      [s.x, s.bottom,   w * 0.24],
      [s.x, s.bottom,  -w * 0.24],
      [s.x, s.bottom + 0.32, -w * 0.68],
      [s.x, s.shoulder, -w]
    ];
    for (const p of ring) positions.push(...p);
  }
  const n = 8;
  for (let i = 0; i < stations.length - 1; i++) {
    for (let j = 0; j < n; j++) {
      const a = i * n + j;
      const b = i * n + (j + 1) % n;
      const c = (i + 1) * n + (j + 1) % n;
      const d = (i + 1) * n + j;
      indices.push(a, b, c, a, c, d);
    }
  }
  for (let j = 1; j < n - 1; j++) indices.push(0, j, j + 1);
  const last = (stations.length - 1) * n;
  for (let j = 1; j < n - 1; j++) indices.push(last, last + j + 1, last + j);
  return meshGeo({ positions, indices });
}

function addStrip(parent, name, length, width, position, rotationY, material, height) {
  return createPart(name, boxGeo(length, height || 0.025, width), material, {
    position, rotation: [0, rotationY || 0, 0], parent
  });
}

function addRail(parent, name, x, z, len, alongX, material, y) {
  const rail = createPart(name, cylinderGeo(0.022, 0.022, len, 8), material, {
    position: [x, y || 2.72, z],
    rotation: alongX ? [0, 0, 90] : [90, 0, 0],
    parent
  });
  return rail;
}

function addJet(parent, id, x, z, heading, mats, wingGeo) {
  const jet = createPivot('Jet_' + id, [x, 2.55, z], parent);
  jet.rotation.y = heading * Math.PI / 180;

  createPart('Jet_' + id + '_Fuselage', cylinderGeo(0.09, 0.12, 0.88, 10), mats.jet, {
    position: [0, 0.10, 0], rotation: [0, 0, -90], parent: jet
  });
  createPart('Jet_' + id + '_Nose', cylinderGeo(0.0, 0.09, 0.34, 10), mats.jetLight, {
    position: [0.61, 0.10, 0], rotation: [0, 0, -90], parent: jet
  });
  createPart('Jet_' + id + '_TailBody', cylinderGeo(0.095, 0.07, 0.28, 10), mats.jet, {
    position: [-0.56, 0.10, 0], rotation: [0, 0, -90], parent: jet
  });
  createPart('Jet_' + id + '_Cockpit', sphereGeo(0.12, 10, 6), mats.glass, {
    position: [0.22, 0.19, 0], scale: [1.45, 0.62, 0.62], parent: jet
  });
  createPart('Jet_' + id + '_InnerWings', wingGeo, mats.jet, {
    position: [-0.04, 0.10, 0], parent: jet
  });
  createPart('Jet_' + id + '_FoldedWingPort', boxGeo(0.34, 0.045, 0.30), mats.jetLight, {
    position: [-0.09, 0.22, -0.39], rotation: [-68, 0, -8], parent: jet
  });
  createPart('Jet_' + id + '_FoldedWingStarboard', boxGeo(0.34, 0.045, 0.30), mats.jetLight, {
    position: [-0.09, 0.22, 0.39], rotation: [68, 0, 8], parent: jet
  });
  createPart('Jet_' + id + '_PortTailplane', boxGeo(0.28, 0.035, 0.24), mats.jetLight, {
    position: [-0.49, 0.12, -0.16], rotation: [0, 8, 0], parent: jet
  });
  createPart('Jet_' + id + '_StarboardTailplane', boxGeo(0.28, 0.035, 0.24), mats.jetLight, {
    position: [-0.49, 0.12, 0.16], rotation: [0, -8, 0], parent: jet
  });
  createPart('Jet_' + id + '_TailFin', boxGeo(0.24, 0.22, 0.035), mats.jetLight, {
    position: [-0.47, 0.23, 0], rotation: [0, 0, -20], parent: jet
  });
  createPart('Jet_' + id + '_NoseWheel', cylinderGeo(0.035, 0.035, 0.035, 8), mats.rubber, {
    position: [0.34, -0.045, 0], rotation: [90, 0, 0], parent: jet
  });
  createPart('Jet_' + id + '_PortWheel', cylinderGeo(0.042, 0.042, 0.035, 8), mats.rubber, {
    position: [-0.15, -0.055, -0.17], rotation: [90, 0, 0], parent: jet
  });
  createPart('Jet_' + id + '_StarboardWheel', cylinderGeo(0.042, 0.042, 0.035, 8), mats.rubber, {
    position: [-0.15, -0.055, 0.17], rotation: [90, 0, 0], parent: jet
  });
}

async function build() {
  const root = createRoot('Greywatch_Carrier');

  const hullMat = gameMaterial(0x59636b, { metalness: 0.55, roughness: 0.62 });
  const hullDark = gameMaterial(0x30383e, { metalness: 0.62, roughness: 0.58 });
  const hullLight = gameMaterial(0x77838b, { metalness: 0.42, roughness: 0.68 });
  const deckMat = gameMaterial(0x24292d, { metalness: 0.35, roughness: 0.82 });
  const deckPanel = gameMaterial(0x3d464b, { metalness: 0.44, roughness: 0.73 });
  const white = gameMaterial(0xd7d9d3, { roughness: 0.72 });
  const yellow = gameMaterial(0xd2a72a, { metalness: 0.12, roughness: 0.72 });
  const red = gameMaterial(0x9f3e32, { roughness: 0.74 });
  const glass = gameMaterial(0x15252c, { metalness: 0.35, roughness: 0.22 });
  const black = gameMaterial(0x111416, { metalness: 0.3, roughness: 0.68 });
  const copper = gameMaterial(0x7a5534, { metalness: 0.55, roughness: 0.62 });
  const jet = gameMaterial(0x9ca6a7, { metalness: 0.45, roughness: 0.58 });
  const jetLight = gameMaterial(0xc2c6c2, { metalness: 0.32, roughness: 0.62 });
  const rubber = gameMaterial(0x111315, { roughness: 0.92 });

  createPart('Main_Hull', hullGeometry(), hullMat, { parent: root });

  const deckOutline = [
    [-10.5, -2.20], [-9.9, -3.05], [-4.8, -3.34], [2.5, -3.16],
    [8.8, -2.72], [10.6, -1.25], [10.2, 2.20], [6.8, 2.72],
    [-5.4, 3.18], [-10.4, 2.52]
  ];
  const deckGeo = await extrudeProfile(deckOutline, {
    depth: 0.30, axis: 'y', center: true, bevel: 0.07, bevelStyle: 'chamfer'
  });
  createPart('Angled_Flight_Deck', deckGeo, deckMat, {
    position: [0, 2.31, 0], parent: root
  });

  createPart('Hull_Port_Rub_Rail', boxGeo(16.5, 0.16, 0.16), hullDark, {
    position: [-0.8, 1.55, -2.90], parent: root
  });
  createPart('Hull_Starboard_Rub_Rail', boxGeo(15.8, 0.16, 0.16), hullDark, {
    position: [-0.2, 1.55, 2.92], parent: root
  });
  createPart('Bow_Breakwater', boxGeo(1.7, 0.24, 2.45), hullLight, {
    position: [8.25, 2.60, 0.0], rotation: [0, -3, 0], parent: root
  });
  createPart('Bow_Breakwater_DarkFace', boxGeo(0.09, 0.22, 2.25), hullDark, {
    position: [7.38, 2.60, 0.0], rotation: [0, -3, 0], parent: root
  });

  for (let i = 0; i < 10; i++) {
    createPart('Port_Hangar_Vent_' + i, boxGeo(0.46, 0.20, 0.045), black, {
      position: [-6.2 + i * 1.15, 1.42, -2.83], parent: root
    });
  }
  for (let i = 0; i < 8; i++) {
    createPart('Starboard_Hangar_Vent_' + i, boxGeo(0.42, 0.18, 0.045), black, {
      position: [-5.2 + i * 1.28, 1.40, 2.86], parent: root
    });
  }

  addStrip(root, 'Landing_Zone_Port_Edge', 12.9, 0.085, [-2.25, 2.485, -1.63], -8, white, 0.025);
  addStrip(root, 'Landing_Zone_Starboard_Edge', 12.9, 0.085, [-2.03, 2.485, 0.03], -8, white, 0.025);
  for (let i = 0; i < 12; i++) {
    addStrip(root, 'Landing_Center_Dash_' + i, 0.58, 0.095,
      [-7.15 + i * 0.86, 2.49, -0.87 + i * -0.12], -8, white, 0.028);
  }

  addStrip(root, 'Bow_Catapult_Line_Port', 8.9, 0.055, [4.4, 2.49, -0.82], 0, white, 0.025);
  addStrip(root, 'Bow_Catapult_Line_Starboard', 8.7, 0.055, [4.35, 2.49, 0.72], 0, white, 0.025);
  for (const z of [-1.10, -0.54, 0.43, 1.00]) {
    addStrip(root, 'Bow_Service_Line_' + String(z), 4.9, 0.045, [6.1, 2.488, z], 0, yellow, 0.022);
  }

  addStrip(root, 'Port_Deck_Safety_Line', 15.5, 0.075, [-1.4, 2.49, -2.82], -1.5, yellow, 0.025);
  addStrip(root, 'Starboard_Deck_Safety_Line', 14.2, 0.075, [-0.6, 2.49, 2.62], -1.5, yellow, 0.025);
  addStrip(root, 'Stern_Service_Crossline', 0.075, 4.9, [-8.95, 2.49, 0.05], 0, yellow, 0.025);

  const elevatorData = [
    { id: 'Aft_Starboard', x: -5.9, z: 3.18, sx: 2.05, sz: 1.35 },
    { id: 'Forward_Starboard', x: 4.85, z: 2.86, sx: 1.95, sz: 1.18 },
    { id: 'Aft_Port', x: -6.95, z: -3.24, sx: 1.70, sz: 1.10 }
  ];
  for (const e of elevatorData) {
    createPart('Elevator_' + e.id, boxGeo(e.sx, 0.16, e.sz), deckPanel, {
      position: [e.x, 2.39, e.z], parent: root
    });
    addStrip(root, 'Elevator_' + e.id + '_LongMark_A', e.sx * 0.88, 0.045,
      [e.x, 2.485, e.z - e.sz * 0.38], 0, yellow, 0.025);
    addStrip(root, 'Elevator_' + e.id + '_LongMark_B', e.sx * 0.88, 0.045,
      [e.x, 2.485, e.z + e.sz * 0.38], 0, yellow, 0.025);
    addStrip(root, 'Elevator_' + e.id + '_EndMark_A', 0.045, e.sz * 0.76,
      [e.x - e.sx * 0.44, 2.485, e.z], 0, yellow, 0.025);
    addStrip(root, 'Elevator_' + e.id + '_EndMark_B', 0.045, e.sz * 0.76,
      [e.x + e.sx * 0.44, 2.485, e.z], 0, yellow, 0.025);
  }

  const island = createPivot('Island_Superstructure', [1.75, 2.50, 1.95], root);
  createPart('Island_Armored_Base', await roundedBoxGeo(2.35, 0.72, 1.28, 0.09, { style: 'chamfer' }), hullMat, {
    position: [0, 0.36, 0], parent: island
  });
  createPart('Island_Mid_Block', await roundedBoxGeo(1.78, 0.72, 1.13, 0.08, { style: 'chamfer' }), hullLight, {
    position: [0.16, 1.02, 0], parent: island
  });
  createPart('Island_Bridge', await roundedBoxGeo(2.25, 0.62, 1.34, 0.08, { style: 'chamfer' }), hullMat, {
    position: [0.03, 1.64, -0.02], parent: island
  });
  createPart('Island_Bridge_Front_Windows', boxGeo(0.055, 0.25, 0.90), glass, {
    position: [1.175, 1.69, -0.02], parent: island
  });
  createPart('Island_Bridge_Port_Windows', boxGeo(1.58, 0.22, 0.05), glass, {
    position: [0.03, 1.69, -0.705], parent: island
  });
  createPart('Island_Bridge_Starboard_Windows', boxGeo(1.58, 0.22, 0.05), glass, {
    position: [0.03, 1.69, 0.665], parent: island
  });
  for (let i = 0; i < 5; i++) {
    createPart('Bridge_Window_Mullion_Port_' + i, boxGeo(0.035, 0.27, 0.065), hullDark, {
      position: [-0.60 + i * 0.31, 1.69, -0.735], parent: island
    });
    createPart('Bridge_Window_Mullion_Starboard_' + i, boxGeo(0.035, 0.27, 0.065), hullDark, {
      position: [-0.60 + i * 0.31, 1.69, 0.695], parent: island
    });
  }

  createPart('Island_Funnel', cylinderGeo(0.30, 0.40, 1.38, 10), hullDark, {
    position: [-0.42, 2.55, 0.25], rotation: [0, 0, -7], parent: island
  });
  createPart('Island_Funnel_Cap', cylinderGeo(0.35, 0.35, 0.14, 10), black, {
    position: [-0.50, 3.24, 0.25], rotation: [0, 0, -7], parent: island
  });
  createPart('Island_Mast_Lower', cylinderGeo(0.095, 0.13, 1.55, 10), hullLight, {
    position: [0.42, 2.73, -0.12], parent: island
  });
  createPart('Island_Mast_Upper', cylinderGeo(0.045, 0.085, 1.35, 10), hullLight, {
    position: [0.42, 4.05, -0.12], parent: island
  });
  createPart('Radar_Array_Lower', boxGeo(0.20, 0.78, 1.40), hullDark, {
    position: [0.46, 3.25, -0.10], rotation: [0, 0, 8], parent: island
  });
  createPart('Radar_Array_Face', boxGeo(0.055, 0.62, 1.18), glass, {
    position: [0.575, 3.25, -0.10], rotation: [0, 0, 8], parent: island
  });
  createPart('Radar_Top_Bar', boxGeo(1.20, 0.10, 0.10), hullLight, {
    position: [0.42, 4.66, -0.12], parent: island
  });
  createPart('Radar_Top_Panel', boxGeo(0.16, 0.48, 1.05), hullDark, {
    position: [0.42, 4.42, -0.12], rotation: [0, 0, -5], parent: island
  });
  createPart('Radar_Top_Face', boxGeo(0.045, 0.38, 0.88), glass, {
    position: [0.515, 4.42, -0.12], rotation: [0, 0, -5], parent: island
  });
  for (const z of [-0.62, 0.38]) {
    createPart('Yardarm_Antenna_' + String(z), cylinderGeo(0.025, 0.025, 0.85, 7), hullLight, {
      position: [0.42, 4.75, z], parent: island
    });
  }
  createPart('Mast_Top_Red_Light', sphereGeo(0.07, 10, 6), red, {
    position: [0.42, 4.78, -0.12], parent: island
  });

  createPart('Island_Deck_Crane_Post', cylinderGeo(0.075, 0.095, 0.86, 8), yellow, {
    position: [-1.35, 0.62, 0.55], parent: island
  });
  createPart('Island_Deck_Crane_Boom', boxGeo(0.90, 0.07, 0.07), yellow, {
    position: [-0.94, 1.03, 0.55], rotation: [0, 0, -18], parent: island
  });

  for (const side of [-1, 1]) {
    const z = side * 3.18;
    for (let i = 0; i < 8; i++) {
      const x = -7.7 + i * 1.95;
      addRail(root, (side < 0 ? 'Port' : 'Starboard') + '_SafetyRail_' + i,
        x, z, 1.55, true, hullLight, 2.70);
      createPart((side < 0 ? 'Port' : 'Starboard') + '_RailPost_' + i,
        cylinderGeo(0.022, 0.022, 0.35, 7), hullLight, {
          position: [x - 0.72, 2.60, z], parent: root
        });
    }
  }

  for (const x of [-7.8, -2.9, 6.5]) {
    const sponson = createPivot('Defensive_Sponson_' + String(x), [x, 2.15, 3.25], root);
    createPart('Sponson_Platform_' + String(x), cylinderGeo(0.38, 0.42, 0.16, 12), hullDark, {
      position: [0, 0.10, 0], parent: sponson
    });
    createPart('Sponson_Turret_' + String(x), sphereGeo(0.25, 10, 6), hullLight, {
      position: [0, 0.30, 0], scale: [1.2, 0.68, 1.0], parent: sponson
    });
    createPart('Sponson_Barrel_' + String(x), cylinderGeo(0.025, 0.035, 0.55, 8), black, {
      position: [0.25, 0.34, 0], rotation: [0, 0, -90], parent: sponson
    });
  }

  const wingGeo = await extrudeProfile(
    [[-0.38, -0.33], [0.22, -0.32], [0.34, 0], [0.22, 0.32], [-0.38, 0.33], [-0.23, 0]],
    { depth: 0.055, axis: 'y', center: true, bevel: 0.018, bevelStyle: 'chamfer' }
  );
  const jetMats = { jet, jetLight, glass, rubber };
  addJet(root, '01', -5.0, 1.55, 5, jetMats, wingGeo);
  addJet(root, '02', -3.35, 1.42, 5, jetMats, wingGeo);
  addJet(root, '03', -5.95, 0.15, 7, jetMats, wingGeo);
  addJet(root, '04', 4.75, -1.72, 0, jetMats, wingGeo);
  addJet(root, '05', 6.35, -1.70, 0, jetMats, wingGeo);

  const tow = createPivot('Deck_Tow_Tractor', [-1.55, 2.53, 2.20], root);
  createPart('Tow_Tractor_Body', await roundedBoxGeo(0.82, 0.26, 0.48, 0.06, { style: 'chamfer' }), yellow, {
    position: [0, 0.14, 0], parent: tow
  });
  createPart('Tow_Tractor_Cab', boxGeo(0.28, 0.30, 0.38), hullDark, {
    position: [-0.16, 0.34, 0], parent: tow
  });
  for (const x of [-0.26, 0.26]) {
    for (const z of [-0.25, 0.25]) {
      createPart('Tow_Wheel_' + String(x) + '_' + String(z), cylinderGeo(0.10, 0.10, 0.07, 10), rubber, {
        position: [x, 0.07, z], rotation: [90, 0, 0], parent: tow
      });
    }
  }

  for (let i = 0; i < 7; i++) {
    createPart('Aft_Tie_Down_' + i, torusGeo(0.055, 0.012, 6, 10), copper, {
      position: [-8.2 + i * 0.55, 2.47, 1.20], rotation: [90, 0, 0], parent: root
    });
  }

  return root;
}

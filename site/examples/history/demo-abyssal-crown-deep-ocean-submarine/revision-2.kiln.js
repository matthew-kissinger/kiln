const meta = {
  name: 'Abyssal Crown Deep-Ocean Submarine',
  category: 'vehicle',
  role: 'vehicle'
};

const P = {
  hullY: 2.18,
  hullVerticalScale: 0.88,
  stations: [
    [-7.15, 0.10], [-6.92, 0.52], [-6.35, 1.10], [-5.25, 1.48],
    [-3.20, 1.70], [-0.60, 1.80], [2.35, 1.82], [4.25, 1.67],
    [5.65, 1.30], [6.55, 0.72], [6.98, 0.16], [7.06, 0.06]
  ]
};

function ownedGeo(positions, indices, uvs) {
  return meshGeo({ positions, indices, uvs });
}

function hullHalfGeo(upper) {
  const positions = [], indices = [], uvs = [];
  const rings = P.stations.length;
  const around = 28;
  const a0 = upper ? -Math.PI * 0.5 : Math.PI * 0.5;
  const a1 = upper ?  Math.PI * 0.5 : Math.PI * 1.5;
  for (let i = 0; i < rings; i++) {
    const x = P.stations[i][0];
    const r = P.stations[i][1];
    for (let j = 0; j <= around; j++) {
      const t = j / around;
      const a = a0 + (a1 - a0) * t;
      positions.push(x, r * P.hullVerticalScale * Math.cos(a), r * Math.sin(a));
      uvs.push(i / (rings - 1), t);
    }
  }
  const row = around + 1;
  for (let i = 0; i < rings - 1; i++) {
    for (let j = 0; j < around; j++) {
      const a = i * row + j, b = (i + 1) * row + j;
      const c = a + 1, d = b + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  return ownedGeo(positions, indices, uvs);
}

function hullRadiusAt(x) {
  const s = P.stations;
  if (x <= s[0][0]) return s[0][1];
  if (x >= s[s.length - 1][0]) return s[s.length - 1][1];
  for (let i = 0; i < s.length - 1; i++) {
    if (x >= s[i][0] && x <= s[i + 1][0]) {
      const t = (x - s[i][0]) / (s[i + 1][0] - s[i][0]);
      return s[i][1] * (1 - t) + s[i + 1][1] * t;
    }
  }
  return 1;
}

function waterlineBandGeo(thetaCenter) {
  const positions = [], indices = [], uvs = [];
  const rows = 4;
  const halfAngle = 0.025;
  for (let i = 0; i < P.stations.length; i++) {
    const x = P.stations[i][0];
    const r = P.stations[i][1] + 0.014;
    for (let j = 0; j < rows; j++) {
      const t = j / (rows - 1);
      const a = thetaCenter - halfAngle + 2 * halfAngle * t;
      positions.push(x, r * P.hullVerticalScale * Math.cos(a), r * Math.sin(a));
      uvs.push(i / (P.stations.length - 1), t);
    }
  }
  for (let i = 0; i < P.stations.length - 1; i++) {
    for (let j = 0; j < rows - 1; j++) {
      const a = i * rows + j, b = (i + 1) * rows + j;
      const c = a + 1, d = b + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  return ownedGeo(positions, indices, uvs);
}

function prismXY(points, depth) {
  const p = [], idx = [], n = points.length;
  for (let side = -1; side <= 1; side += 2) {
    for (const q of points) p.push(q[0], q[1], side * depth * 0.5);
  }
  for (let i = 1; i < n - 1; i++) {
    idx.push(0, i + 1, i);
    idx.push(n, n + i, n + i + 1);
  }
  for (let i = 0; i < n; i++) {
    const k = (i + 1) % n;
    idx.push(i, k, n + i, k, n + k, n + i);
  }
  return ownedGeo(p, idx);
}

function prismXZ(points, height) {
  const p = [], idx = [], n = points.length;
  for (let side = -1; side <= 1; side += 2) {
    for (const q of points) p.push(q[0], side * height * 0.5, q[1]);
  }
  for (let i = 1; i < n - 1; i++) {
    idx.push(0, i, i + 1);
    idx.push(n, n + i + 1, n + i);
  }
  for (let i = 0; i < n; i++) {
    const k = (i + 1) % n;
    idx.push(i, n + i, k, k, n + i, n + k);
  }
  return ownedGeo(p, idx);
}

async function build() {
  const root = createRoot('AbyssalCrown_Submarine');

  const charcoal = gameMaterial(0x182228, { metalness: 0.72, roughness: 0.30 });
  const charcoalSoft = gameMaterial(0x26343a, { metalness: 0.62, roughness: 0.38 });
  const lowerRed = gameMaterial(0x66161d, { metalness: 0.48, roughness: 0.38 });
  const pale = gameMaterial(0xd9d5c2, { metalness: 0.35, roughness: 0.34 });
  const brass = gameMaterial(0xb8893f, { metalness: 0.88, roughness: 0.23 });
  const dark = gameMaterial(0x090e11, { metalness: 0.78, roughness: 0.29 });
  const rubber = gameMaterial(0x121619, { metalness: 0.12, roughness: 0.70 });
  const baseMat = gameMaterial(0x101518, { metalness: 0.60, roughness: 0.32 });

  createPart('UpperPressureHull', hullHalfGeo(true), charcoal, {
    position: [0, P.hullY, 0], parent: root
  });
  createPart('LowerPressureHull', hullHalfGeo(false), lowerRed, {
    position: [0, P.hullY, 0], parent: root
  });
  createPart('Waterline_Starboard', waterlineBandGeo(Math.PI * 0.5), pale, {
    position: [0, P.hullY, 0], parent: root
  });
  createPart('Waterline_Port', waterlineBandGeo(-Math.PI * 0.5), pale, {
    position: [0, P.hullY, 0], parent: root
  });

  const seamXs = [-4.65, -2.35, 0.15, 2.65, 4.65];
  for (let i = 0; i < seamXs.length; i++) {
    const x = seamXs[i], r = hullRadiusAt(x) + 0.018;
    createPart('PressureRing_' + (i + 1), torusGeo(r, 0.018, 8, 48), charcoalSoft, {
      position: [x, P.hullY, 0], rotation: [0, 90, 0],
      scale: [1, P.hullVerticalScale, 1], parent: root
    });
  }

  const sailFairing = sphereGeo(1, 48, 24);
  createPart('SailBaseFairing', sailFairing, charcoalSoft, {
    position: [0.55, 3.47, 0], scale: [1.72, 0.46, 0.70], parent: root
  });
  const sailBody = await roundedBoxGeo(2.55, 2.07, 0.78, 0.20, { segments: 8, smooth: true });
  createPart('CommandSail', sailBody, charcoal, {
    position: [0.48, 4.45, 0], rotation: [0, 0, -3], parent: root
  });
  const sailCap = await roundedBoxGeo(1.92, 0.12, 0.66, 0.055, { segments: 6, smooth: true });
  createPart('SailCap', sailCap, pale, {
    position: [0.46, 5.49, 0], rotation: [0, 0, -3], parent: root
  });

  const mastPositions = [
    ['AttackPeriscope', 0.05, 6.02, -0.08, 0.075, 0.98],
    ['SearchPeriscope', 0.68, 5.95, 0.12, 0.065, 0.78],
    ['SensorMast', -0.48, 5.87, 0.10, 0.055, 0.62]
  ];
  for (let i = 0; i < mastPositions.length; i++) {
    const m = mastPositions[i];
    createPart(m[0] + '_Stem', cylinderGeo(m[4], m[4], m[5], 20), i === 2 ? brass : charcoalSoft, {
      position: [m[1], m[2], m[3]], parent: root
    });
    createPart(m[0] + '_Collar', cylinderGeo(m[4] * 2.15, m[4] * 2.15, 0.13, 24), brass, {
      position: [m[1], m[2] - m[5] * 0.46, m[3]], parent: root
    });
  }
  createPart('AttackPeriscope_Head', cylinderGeo(0.082, 0.082, 0.34, 20), charcoalSoft, {
    position: [0.20, 6.46, -0.08], rotation: [0, 0, 90], parent: root
  });
  createPart('AttackPeriscope_Lens', cylinderGeo(0.055, 0.055, 0.025, 20), brass, {
    position: [0.375, 6.46, -0.08], rotation: [0, 0, 90], parent: root
  });
  createPart('SearchPeriscope_Head', cylinderGeo(0.072, 0.072, 0.28, 20), charcoalSoft, {
    position: [0.81, 6.31, 0.12], rotation: [0, 0, 90], parent: root
  });

  const hatchXs = [-3.15, -1.42, 2.60, 4.08];
  for (let i = 0; i < hatchXs.length; i++) {
    const x = hatchXs[i];
    const top = P.hullY + hullRadiusAt(x) * P.hullVerticalScale;
    createPart('DeckHatch_' + (i + 1), cylinderGeo(0.27, 0.27, 0.055, 32), charcoalSoft, {
      position: [x, top + 0.02, 0], parent: root
    });
    createPart('DeckHatchRing_' + (i + 1), torusGeo(0.27, 0.024, 8, 32), brass, {
      position: [x, top + 0.055, 0], rotation: [90, 0, 0], parent: root
    });
    createPart('DeckHatchDog_' + (i + 1), await roundedBoxGeo(0.28, 0.035, 0.055, 0.014, { segments: 4 }), brass, {
      position: [x, top + 0.085, 0], rotation: [0, i % 2 ? 35 : -35, 0], parent: root
    });
  }

  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const x = 4.25 + i * 0.48;
      const z = side * (hullRadiusAt(x) + 0.015);
      createPart((side > 0 ? 'Starboard' : 'Port') + '_BowPanel_' + (i + 1),
        cylinderGeo(0.12, 0.12, 0.025, 24), i === 1 ? brass : charcoalSoft, {
          position: [x, P.hullY + 0.12 - i * 0.10, z],
          rotation: [90, 0, 0], parent: root
        });
    }
    createPart((side > 0 ? 'Starboard' : 'Port') + '_SailPlaque',
      await roundedBoxGeo(0.78, 0.16, 0.035, 0.012, { segments: 5 }), brass, {
        position: [0.55, 4.48, side * 0.405], parent: root
      });
  }

  const topFin = prismXY([[-1.05, 0], [0.72, 0], [0.16, 1.62], [-0.72, 1.45]], 0.20);
  const bottomFin = prismXY([[-1.05, 0], [0.72, 0], [0.16, -0.72], [-0.74, -0.66]], 0.20);
  createPart('UpperTailFin', topFin, charcoal, {
    position: [-5.82, 3.10, 0], parent: root
  });
  createPart('LowerTailFin', bottomFin, lowerRed, {
    position: [-5.82, 1.24, 0], parent: root
  });

  const rightFin = prismXZ([[-1.05, 0], [0.72, 0], [0.14, 1.72], [-0.76, 1.46]], 0.18);
  const leftFin = prismXZ([[-1.05, 0], [0.72, 0], [0.14, -1.72], [-0.76, -1.46]], 0.18);
  createPart('StarboardTailFin', rightFin, charcoal, {
    position: [-5.82, P.hullY, 0.66], parent: root
  });
  createPart('PortTailFin', leftFin, charcoal, {
    position: [-5.82, P.hullY, -0.66], parent: root
  });

  const shroudX = -7.43;
  createPart('PropulsorShroudFront', torusGeo(0.82, 0.14, 12, 48), charcoalSoft, {
    position: [shroudX + 0.18, P.hullY, 0], rotation: [0, 90, 0],
    scale: [1, 0.94, 1], parent: root
  });
  createPart('PropulsorShroudRear', torusGeo(0.82, 0.11, 12, 48), dark, {
    position: [shroudX - 0.22, P.hullY, 0], rotation: [0, 90, 0],
    scale: [1, 0.94, 1], parent: root
  });
  const shroudBrace = await roundedBoxGeo(0.46, 0.08, 0.08, 0.025, { segments: 4 });
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI * 0.5;
    createPart('ShroudBrace_' + (i + 1), shroudBrace, charcoalSoft, {
      position: [shroudX - 0.02, P.hullY + 0.72 * Math.cos(a), 0.72 * Math.sin(a)],
      rotation: [a * 180 / Math.PI, 0, 0], parent: root
    });
  }
  createPart('PropulsorHub', cylinderGeo(0.18, 0.24, 0.64, 32), brass, {
    position: [shroudX - 0.02, P.hullY, 0], rotation: [0, 0, 90], parent: root
  });
  const blade = await roundedBoxGeo(0.22, 0.075, 0.56, 0.028, { segments: 5, smooth: true });
  for (let i = 0; i < 7; i++) {
    const a = i * Math.PI * 2 / 7;
    createPart('PropulsorBlade_' + (i + 1), blade, brass, {
      position: [shroudX - 0.12, P.hullY + 0.35 * Math.cos(a), 0.35 * Math.sin(a)],
      rotation: [a * 180 / Math.PI + 18, 18, 0], parent: root
    });
  }

  const base = await roundedBoxGeo(12.6, 0.28, 3.15, 0.12, { segments: 8, smooth: true });
  createPart('DisplayPlinth', base, baseMat, {
    position: [-0.10, 0.14, 0], parent: root
  });
  const foot = await roundedBoxGeo(0.72, 0.72, 1.30, 0.11, { segments: 7, smooth: true });
  const cradle = await roundedBoxGeo(0.54, 0.12, 1.82, 0.05, { segments: 6, smooth: true });
  for (const x of [-3.25, 3.05]) {
    createPart('DisplayStanchion_' + x, foot, dark, {
      position: [x, 0.58, 0], parent: root
    });
    createPart('BrassCradle_' + x, cradle, brass, {
      position: [x, 0.98, 0], parent: root
    });
    createPart('CradlePad_' + x, await roundedBoxGeo(0.62, 0.08, 1.55, 0.03, { segments: 4 }), rubber, {
      position: [x, 1.06, 0], parent: root
    });
  }
  const plaque = await roundedBoxGeo(2.45, 0.42, 0.09, 0.04, { segments: 6, smooth: true });
  createPart('ModelNamePlaque', plaque, brass, {
    position: [0.25, 0.31, 1.61], rotation: [-8, 0, 0], parent: root
  });
  createPart('PlaqueInset', await roundedBoxGeo(2.12, 0.24, 0.035, 0.014, { segments: 5 }), dark, {
    position: [0.25, 0.31, 1.665], rotation: [-8, 0, 0], parent: root
  });

  return root;
}
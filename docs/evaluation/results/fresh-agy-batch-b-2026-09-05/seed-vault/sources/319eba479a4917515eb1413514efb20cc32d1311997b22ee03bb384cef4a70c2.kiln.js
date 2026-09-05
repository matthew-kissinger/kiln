const meta = {
  name: 'Botanical Seed Library',
  category: 'architecture',
  role: 'building',
};

function buildPodShell(ivoryMat, greenMat, root) {
  const Nu = 28;
  const Nv = 24;

  const outPositions = [];
  const outUvs = [];
  const outIndices = [];

  const inPositions = [];
  const inUvs = [];
  const inIndices = [];

  const leftEdgePath = [];
  const rightEdgePath = [];

  for (let i = 0; i <= Nu; i++) {
    const u = i / Nu;
    const y = 0.24 + u * 3.65;
    const rOuter = (1.85 - 0.95 * u) * (1.0 + 0.15 * Math.sin(u * Math.PI));
    const rInner = Math.max(0.2, rOuter - 0.08);

    const tStart = 0.55 * Math.PI + u * 1.25;
    const tEnd = 2.05 * Math.PI + u * 1.25;

    for (let j = 0; j <= Nv; j++) {
      const v = j / Nv;
      const theta = tStart + v * (tEnd - tStart);
      const lobe = 1.0 + 0.035 * Math.sin(v * Math.PI * 4);

      const xo = rOuter * lobe * Math.cos(theta);
      const zo = rOuter * lobe * Math.sin(theta);
      outPositions.push(xo, y, zo);
      outUvs.push(v, u);

      const xi = rInner * lobe * Math.cos(theta);
      const zi = rInner * lobe * Math.sin(theta);
      inPositions.push(xi, y, zi);
      inUvs.push(v, u);

      if (j === 0) {
        leftEdgePath.push([xo, y, zo]);
      }
      if (j === Nv) {
        rightEdgePath.push([xo, y, zo]);
      }
    }
  }

  const stride = Nv + 1;
  for (let i = 0; i < Nu; i++) {
    for (let j = 0; j < Nv; j++) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = (i + 1) * stride + (j + 1);
      const d = i * stride + (j + 1);

      outIndices.push(a, b, c, a, c, d);
      inIndices.push(a, c, b, a, d, c);
    }
  }

  const outerGeo = meshGeo({ positions: outPositions, indices: outIndices, uvs: outUvs });
  const innerGeo = meshGeo({ positions: inPositions, indices: inIndices, uvs: inUvs });

  createPart('OuterShell', outerGeo, ivoryMat, { parent: root });
  createPart('InnerShell', innerGeo, greenMat, { parent: root });

  return { leftEdgePath, rightEdgePath };
}

function buildRibs(copperMat, root) {
  for (let k = 0; k < 5; k++) {
    const frac = k / 4;
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const y = 0.24 + u * 3.7;
      const r = (1.85 - 0.95 * u) * (1.0 + 0.15 * Math.sin(u * Math.PI)) + 0.035;
      const theta = (0.55 * Math.PI + u * 1.25) + frac * (1.5 * Math.PI);
      pts.push([r * Math.cos(theta), y, r * Math.sin(theta)]);
    }
    const ribGeo = pipeAlongPath(pts, 0.038, { tubularSegments: 24, radialSegments: 8 });
    createPart('ShellRib_' + k, ribGeo, copperMat, { parent: root });
  }
}

function buildApexSpire(brightCopperMat, root) {
  const finialPts = [];
  for (let s = 0; s <= 20; s++) {
    const t = s / 20;
    const a = t * Math.PI * 3.2;
    const r = 0.18 * (1 - t * 0.85);
    finialPts.push([r * Math.cos(a), 3.82 + t * 0.45, r * Math.sin(a)]);
  }
  const spireGeo = pipeAlongPath(finialPts, 0.028, { tubularSegments: 20, radialSegments: 8 });
  createPart('ApexSpireFinial', spireGeo, brightCopperMat, { parent: root });
  createPart('ApexSpireBud', sphereGeo(0.065, 12, 12), brightCopperMat, {
    position: [0, 3.82, 0],
    parent: root,
  });
}

function buildDrawers(ivoryMat, darkGreenMat, copperMat, root) {
  const rCab = 1.35;
  const tiers = [0.55, 0.92, 1.28];
  const numPerTier = 7;
  for (let t = 0; t < tiers.length; t++) {
    const y = tiers[t];
    for (let d = 0; d < numPerTier; d++) {
      const phi = 0.95 * Math.PI + (d / (numPerTier - 1)) * (0.88 * Math.PI);
      const cx = rCab * Math.cos(phi);
      const cz = rCab * Math.sin(phi);
      const rotY = Math.atan2(-Math.cos(phi), -Math.sin(phi)) * (180 / Math.PI);

      createPart('DrawerCase_' + t + '_' + d, boxGeo(0.24, 0.32, 0.16), darkGreenMat, {
        position: [cx, y, cz],
        rotation: [0, rotY, 0],
        parent: root,
      });

      createPart('DrawerFace_' + t + '_' + d, boxGeo(0.21, 0.28, 0.04), ivoryMat, {
        position: [cx - 0.10 * Math.cos(phi), y, cz - 0.10 * Math.sin(phi)],
        rotation: [0, rotY, 0],
        parent: root,
      });

      createPart('DrawerLabel_' + t + '_' + d, boxGeo(0.08, 0.04, 0.01), copperMat, {
        position: [cx - 0.125 * Math.cos(phi), y + 0.05, cz - 0.125 * Math.sin(phi)],
        rotation: [0, rotY, 0],
        parent: root,
      });

      createPart('DrawerPull_' + t + '_' + d, torusGeo(0.016, 0.0035, 8, 12), copperMat, {
        position: [cx - 0.125 * Math.cos(phi), y - 0.04, cz - 0.125 * Math.sin(phi)],
        rotation: [0, rotY, 0],
        parent: root,
      });
    }
  }
}

function buildCarousel(copperMat, brightCopperMat, glassMat, seedMat, seedDarkMat, greenMat, root) {
  const carouselPivot = createPivot('Carousel', [0.1, 0.28, 0], root);

  createPart('Spindle', cylinderGeo(0.05, 0.05, 2.3, 16), copperMat, {
    position: [0, 1.15, 0],
    parent: carouselPivot,
  });

  createPart('BearingCollar_0', torusGeo(0.16, 0.03, 12, 24), brightCopperMat, {
    position: [0, 0.12, 0],
    rotation: [90, 0, 0],
    parent: carouselPivot,
  });
  createPart('BearingCollar_1', torusGeo(0.12, 0.025, 12, 24), brightCopperMat, {
    position: [0, 0.65, 0],
    rotation: [90, 0, 0],
    parent: carouselPivot,
  });
  createPart('BearingCollar_2', torusGeo(0.11, 0.022, 12, 24), brightCopperMat, {
    position: [0, 1.35, 0],
    rotation: [90, 0, 0],
    parent: carouselPivot,
  });

  createPart('LowerRing_Outer', torusGeo(0.68, 0.024, 12, 32), copperMat, {
    position: [0, 0.65, 0],
    rotation: [90, 0, 0],
    parent: carouselPivot,
  });
  createPart('LowerRing_Inner', torusGeo(0.48, 0.016, 10, 28), brightCopperMat, {
    position: [0, 0.65, 0],
    rotation: [90, 0, 0],
    parent: carouselPivot,
  });

  for (let s = 0; s < 4; s++) {
    const ang = s * Math.PI * 0.5;
    const deg = s * 90;
    createPart('LowerSpoke_' + s, cylinderGeo(0.014, 0.014, 0.62, 8), copperMat, {
      position: [0.31 * Math.cos(ang), 0.65, 0.31 * Math.sin(ang)],
      rotation: [0, -deg, 90],
      parent: carouselPivot,
    });
  }

  for (let v = 0; v < 10; v++) {
    const va = v * 2 * Math.PI / 10;
    const vx = 0.68 * Math.cos(va);
    const vz = 0.68 * Math.sin(va);

    createPart('LowerBracket_' + v, cylinderGeo(0.042, 0.042, 0.035, 14), copperMat, {
      position: [vx, 0.65, vz],
      parent: carouselPivot,
    });
    createPart('LowerVial_' + v, cylinderGeo(0.032, 0.032, 0.24, 16), glassMat, {
      position: [vx, 0.77, vz],
      parent: carouselPivot,
    });
    createPart('LowerCap_' + v, cylinderGeo(0.036, 0.036, 0.035, 14), brightCopperMat, {
      position: [vx, 0.90, vz],
      parent: carouselPivot,
    });

    if (v % 3 === 0) {
      createPart('LowerSeedA_' + v, capsuleGeo(0.014, 0.07, 8), seedMat, {
        position: [vx, 0.76, vz],
        rotation: [15, 0, 10],
        parent: carouselPivot,
      });
    } else if (v % 3 === 1) {
      createPart('LowerSeedB_' + v, sphereGeo(0.018, 10, 10), seedDarkMat, {
        position: [vx, 0.74, vz],
        parent: carouselPivot,
      });
      createPart('LowerSeedB2_' + v, sphereGeo(0.014, 8, 8), seedDarkMat, {
        position: [vx + 0.008, 0.77, vz - 0.005],
        parent: carouselPivot,
      });
    } else {
      createPart('LowerSeedC_' + v, sphereGeo(0.016, 10, 10), greenMat, {
        position: [vx, 0.75, vz],
        parent: carouselPivot,
      });
    }
  }

  createPart('UpperRing_Outer', torusGeo(0.44, 0.02, 12, 28), copperMat, {
    position: [0, 1.35, 0],
    rotation: [90, 0, 0],
    parent: carouselPivot,
  });

  for (let s = 0; s < 4; s++) {
    const ang = s * Math.PI * 0.5 + Math.PI * 0.25;
    const deg = s * 90 + 45;
    createPart('UpperSpoke_' + s, cylinderGeo(0.012, 0.012, 0.40, 8), copperMat, {
      position: [0.20 * Math.cos(ang), 1.35, 0.20 * Math.sin(ang)],
      rotation: [0, -deg, 90],
      parent: carouselPivot,
    });
  }

  for (let v = 0; v < 6; v++) {
    const va = v * 2 * Math.PI / 6 + Math.PI / 6;
    const vx = 0.44 * Math.cos(va);
    const vz = 0.44 * Math.sin(va);

    createPart('UpperBracket_' + v, cylinderGeo(0.040, 0.040, 0.03, 14), copperMat, {
      position: [vx, 1.35, vz],
      parent: carouselPivot,
    });
    createPart('UpperVial_' + v, cylinderGeo(0.030, 0.030, 0.20, 16), glassMat, {
      position: [vx, 1.45, vz],
      parent: carouselPivot,
    });
    createPart('UpperCap_' + v, cylinderGeo(0.034, 0.034, 0.03, 14), brightCopperMat, {
      position: [vx, 1.56, vz],
      parent: carouselPivot,
    });

    if (v % 2 === 0) {
      createPart('UpperSeedA_' + v, capsuleGeo(0.012, 0.05, 8), seedMat, {
        position: [vx, 1.44, vz],
        parent: carouselPivot,
      });
    } else {
      createPart('UpperSeedB_' + v, sphereGeo(0.016, 10, 10), seedDarkMat, {
        position: [vx, 1.43, vz],
        parent: carouselPivot,
      });
    }
  }

  createPart('SpireRing', torusGeo(0.18, 0.016, 10, 24), brightCopperMat, {
    position: [0, 2.22, 0],
    rotation: [90, 0, 0],
    parent: carouselPivot,
  });
  createPart('SpireBud', sphereGeo(0.07, 12, 12), brightCopperMat, {
    position: [0, 2.36, 0],
    parent: carouselPivot,
  });
  createPart('SpireTip', cylinderGeo(0.008, 0.035, 0.14, 12), brightCopperMat, {
    position: [0, 2.47, 0],
    parent: carouselPivot,
  });
}

function buildLantern(lanternMat, copperMat, brightCopperMat, root) {
  createPart('LanternRod', cylinderGeo(0.012, 0.012, 0.55, 8), copperMat, {
    position: [0.1, 2.95, 0],
    parent: root,
  });
  createPart('LanternRing', torusGeo(0.16, 0.02, 10, 20), copperMat, {
    position: [0.1, 2.68, 0],
    rotation: [90, 0, 0],
    parent: root,
  });
  createPart('LanternCore', sphereGeo(0.08, 12, 12), lanternMat, {
    position: [0.1, 2.68, 0],
    parent: root,
  });
  createPart('LanternCap', cylinderGeo(0.04, 0.10, 0.08, 12), brightCopperMat, {
    position: [0.1, 2.75, 0],
    parent: root,
  });
}

function buildPlinth(stoneMat, ivoryMat, copperMat, root) {
  createPart('PlinthBase', cylinderGeo(2.25, 2.30, 0.14, 36), stoneMat, {
    position: [0, 0.07, 0],
    parent: root,
  });
  createPart('PlinthTier', cylinderGeo(1.98, 2.02, 0.14, 36), stoneMat, {
    position: [0, 0.21, 0],
    parent: root,
  });
  createPart('PlinthCopperRim', torusGeo(2.00, 0.02, 10, 48), copperMat, {
    position: [0, 0.27, 0],
    rotation: [90, 0, 0],
    parent: root,
  });
  createPart('EntryRamp', cylinderGeo(1.4, 1.5, 0.08, 24), ivoryMat, {
    position: [0.75, 0.14, 0.75],
    parent: root,
  });
}

function build() {
  const root = createRoot('BotanicalSeedLibrary');

  const ivoryMat = gameMaterial(0xf4eee1, { roughness: 0.45, metalness: 0.05 });
  const greenMat = gameMaterial(0x284f39, { roughness: 0.6, metalness: 0.08 });
  const darkGreenMat = gameMaterial(0x183424, { roughness: 0.7 });
  const copperMat = gameMaterial(0xc86a42, { roughness: 0.28, metalness: 0.85 });
  const brightCopperMat = gameMaterial(0xdf7d52, { roughness: 0.18, metalness: 0.92 });
  const stoneMat = gameMaterial(0xded7cc, { roughness: 0.8, metalness: 0.02 });
  const seedMat = gameMaterial(0xb67b3e, { roughness: 0.5, metalness: 0.1 });
  const seedDarkMat = gameMaterial(0x543621, { roughness: 0.65, metalness: 0.05 });
  const glassMat = glassMaterial(0xd0ece6, { opacity: 0.38, roughness: 0.08, metalness: 0.12 });
  const lanternMat = gameMaterial(0xffebc8, { emissive: 0xffda96, emissiveIntensity: 0.85, roughness: 0.2 });

  buildPlinth(stoneMat, ivoryMat, copperMat, root);
  const shell = buildPodShell(ivoryMat, greenMat, root);

  const leftTrimGeo = pipeAlongPath(shell.leftEdgePath, 0.036, { tubularSegments: 28, radialSegments: 8 });
  createPart('ApertureTrim_Left', leftTrimGeo, copperMat, { parent: root });

  const rightTrimGeo = pipeAlongPath(shell.rightEdgePath, 0.036, { tubularSegments: 28, radialSegments: 8 });
  createPart('ApertureTrim_Right', rightTrimGeo, copperMat, { parent: root });

  buildRibs(copperMat, root);
  buildApexSpire(brightCopperMat, root);
  buildDrawers(ivoryMat, darkGreenMat, copperMat, root);
  buildCarousel(copperMat, brightCopperMat, glassMat, seedMat, seedDarkMat, greenMat, root);
  buildLantern(lanternMat, copperMat, brightCopperMat, root);

  return root;
}

function animate(root) {
  const clip = createClip('CarouselSpin', 6, [
    rotationTrack('Joint_Carousel', [
      { time: 0, rotation: [0, 0, 0] },
      { time: 3, rotation: [0, 180, 0] },
      { time: 6, rotation: [0, 360, 0] },
    ]),
  ]);
  return [clip];
}

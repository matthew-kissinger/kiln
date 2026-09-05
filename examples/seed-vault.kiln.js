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
    const rOuter = (1.95 * (1.0 - 0.86 * Math.pow(u, 1.35))) * (1.0 + 0.12 * Math.sin(Math.pow(u, 0.75) * Math.PI));
    const rInner = Math.max(0.06, rOuter - 0.075);

    const tCenter = 0.25 * Math.PI;
    const tOpeningHalf = 0.38 * Math.PI * (1.0 - 0.88 * Math.pow(u, 1.8));
    const tStart = tCenter + tOpeningHalf;
    const tEnd = tCenter + 2 * Math.PI - tOpeningHalf;

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
    const frac = (k + 0.5) / 5;
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const y = 0.24 + u * 3.65;
      const r = (1.95 * (1.0 - 0.86 * Math.pow(u, 1.35))) * (1.0 + 0.12 * Math.sin(Math.pow(u, 0.75) * Math.PI)) + 0.035;
      const tCenter = 0.25 * Math.PI;
      const tOpeningHalf = 0.38 * Math.PI * (1.0 - 0.88 * Math.pow(u, 1.8));
      const tStart = tCenter + tOpeningHalf;
      const tEnd = tCenter + 2 * Math.PI - tOpeningHalf;
      const theta = tStart + frac * (tEnd - tStart);
      pts.push([r * Math.cos(theta), y, r * Math.sin(theta)]);
    }
    const ribGeo = pipeAlongPath(pts, 0.038, { tubularSegments: 24, radialSegments: 8 });
    createPart('ShellRib_' + k, ribGeo, copperMat, { parent: root });
  }
}

function buildApexSpire(brightCopperMat, root) {
  createPart('ApexCollar', torusGeo(0.25, 0.032, 10, 24), brightCopperMat, {
    position: [0, 3.86, 0],
    rotation: [90, 0, 0],
    parent: root,
  });
  createPart('ApexCapDome', sphereGeo(0.24, 16, 12), brightCopperMat, {
    position: [0, 3.86, 0],
    scale: [1, 0.45, 1],
    parent: root,
  });
  const finialPts = [];
  for (let s = 0; s <= 20; s++) {
    const t = s / 20;
    const a = t * Math.PI * 3.2;
    const r = 0.14 * (1 - t * 0.85);
    finialPts.push([r * Math.cos(a), 3.96 + t * 0.45, r * Math.sin(a)]);
  }
  const spireGeo = pipeAlongPath(finialPts, 0.024, { tubularSegments: 20, radialSegments: 8 });
  createPart('ApexSpireFinial', spireGeo, brightCopperMat, { parent: root });
  createPart('ApexSpireBud', sphereGeo(0.065, 12, 12), brightCopperMat, {
    position: [0, 3.96, 0],
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

  for (let d = 0; d < numPerTier; d++) {
    const phi = 0.95 * Math.PI + (d / (numPerTier - 1)) * (0.88 * Math.PI);
    const cx = rCab * Math.cos(phi);
    const cz = rCab * Math.sin(phi);
    const rotY = Math.atan2(-Math.cos(phi), -Math.sin(phi)) * (180 / Math.PI);

    createPart('DrawerPlinth_' + d, boxGeo(0.25, 0.12, 0.20), darkGreenMat, {
      position: [cx, 0.32, cz],
      rotation: [0, rotY, 0],
      parent: root,
    });
    createPart('DrawerCornice_' + d, boxGeo(0.26, 0.04, 0.22), copperMat, {
      position: [cx, 1.48, cz],
      rotation: [0, rotY, 0],
      parent: root,
    });
  }

  const shelfHeights = [0.38, 0.74, 1.10, 1.46];
  for (let s = 0; s < shelfHeights.length; s++) {
    const sy = shelfHeights[s];
    const pts = [];
    for (let p = 0; p <= 20; p++) {
      const phi = 0.94 * Math.PI + (p / 20) * (0.90 * Math.PI);
      pts.push([(rCab - 0.08) * Math.cos(phi), sy, (rCab - 0.08) * Math.sin(phi)]);
    }
    const railGeo = pipeAlongPath(pts, 0.016, { tubularSegments: 20, radialSegments: 8 });
    createPart('CabinetRail_' + s, railGeo, copperMat, { parent: root });
  }
}

function buildCarousel(copperMat, brightCopperMat, glassMat, seedMat, seedDarkMat, greenMat, root) {
  const carouselPivot = createPivot('Carousel', [0.1, 0.28, 0], root);

  createPart('Spindle', cylinderGeo(0.05, 0.05, 2.3, 16), copperMat, {
    position: [0, 1.15, 0],
    parent: carouselPivot,
  });

  createPart('TurntableBase', cylinderGeo(0.34, 0.38, 0.14, 28), copperMat, {
    position: [0, 0.07, 0],
    parent: carouselPivot,
  });
  createPart('TurntableMolding', torusGeo(0.36, 0.024, 10, 32), brightCopperMat, {
    position: [0, 0.14, 0],
    rotation: [90, 0, 0],
    parent: carouselPivot,
  });
  createPart('BearingCollar_0', cylinderGeo(0.12, 0.20, 0.12, 20), brightCopperMat, {
    position: [0, 0.20, 0],
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

  for (let v = 0; v < 12; v++) {
    const va = v * 2 * Math.PI / 12;
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
    createPart('LowerBand_' + v, torusGeo(0.034, 0.005, 8, 16), brightCopperMat, {
      position: [vx, 0.77, vz],
      rotation: [90, 0, 0],
      parent: carouselPivot,
    });

    if (v % 4 === 0) {
      createPart('LowerSeedA_' + v, capsuleGeo(0.013, 0.07, 8), seedMat, {
        position: [vx, 0.76, vz],
        rotation: [15, 0, 10],
        parent: carouselPivot,
      });
      createPart('LowerSeedA_Wing_' + v, boxGeo(0.004, 0.08, 0.022), seedMat, {
        position: [vx, 0.78, vz],
        rotation: [0, 45, 15],
        parent: carouselPivot,
      });
    } else if (v % 4 === 1) {
      createPart('LowerSeedB_' + v, sphereGeo(0.018, 10, 10), seedDarkMat, {
        position: [vx, 0.74, vz],
        parent: carouselPivot,
      });
      createPart('LowerSeedB2_' + v, sphereGeo(0.013, 8, 8), seedDarkMat, {
        position: [vx + 0.008, 0.77, vz - 0.005],
        parent: carouselPivot,
      });
    } else if (v % 4 === 2) {
      createPart('LowerSeedC_' + v, sphereGeo(0.016, 10, 10), greenMat, {
        position: [vx, 0.75, vz],
        parent: carouselPivot,
      });
      createPart('LowerSeedC2_' + v, cylinderGeo(0.006, 0.006, 0.04, 8), greenMat, {
        position: [vx, 0.79, vz],
        rotation: [20, 0, 0],
        parent: carouselPivot,
      });
    } else {
      createPart('LowerSeedD_' + v, torusGeo(0.016, 0.006, 8, 14), seedMat, {
        position: [vx, 0.75, vz],
        rotation: [45, 30, 0],
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

  for (let v = 0; v < 8; v++) {
    const va = v * 2 * Math.PI / 8 + Math.PI / 8;
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
    createPart('UpperBand_' + v, torusGeo(0.032, 0.004, 8, 16), brightCopperMat, {
      position: [vx, 1.45, vz],
      rotation: [90, 0, 0],
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
  createPart('LanternRod', cylinderGeo(0.012, 0.012, 0.50, 8), copperMat, {
    position: [0.1, 2.70, 0],
    parent: root,
  });
  createPart('LanternRing', torusGeo(0.16, 0.02, 10, 20), copperMat, {
    position: [0.1, 2.45, 0],
    rotation: [90, 0, 0],
    parent: root,
  });
  createPart('LanternCore', sphereGeo(0.08, 12, 12), lanternMat, {
    position: [0.1, 2.45, 0],
    parent: root,
  });
  createPart('LanternCap', cylinderGeo(0.04, 0.10, 0.08, 12), brightCopperMat, {
    position: [0.1, 2.52, 0],
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
  createPart('FloorInlayOuter', torusGeo(1.05, 0.014, 8, 40), copperMat, {
    position: [0.1, 0.281, 0],
    rotation: [90, 0, 0],
    parent: root,
  });
  createPart('FloorInlayInner', torusGeo(0.55, 0.012, 8, 32), copperMat, {
    position: [0.1, 0.281, 0],
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

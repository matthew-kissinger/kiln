// Authored by: gemini-3.8-flash-high, via agy.
//
// Written by the model itself through the Kiln MCP tools: it wrote the
// program, rendered it, looked at its own six-view contact sheet, and
// revised. Not a line of it is hand-authored.
//
// Dispatched into a clean directory containing only the brief and the Kiln
// skills, with no access to this repository or to any finished example.

const meta = { name: 'PlanetariumProjector', category: 'prop', role: 'prop' };

async function build() {
  const root = createRoot('PlanetariumProjector');

  // --- Materials ---
  // Mid-century precision scientific instrument aesthetic:
  // Dark hammertone cast iron body, brass gears & optical bezels, satin stainless steel shafts,
  // deep blue optical glass elements, and matte industrial cable rubber.
  const castBody = gameMaterial(0x23272b, { metalness: 0.65, roughness: 0.45 });
  const darkIron = gameMaterial(0x17191c, { metalness: 0.55, roughness: 0.6 });
  const brass = gameMaterial(0xcfa032, { metalness: 0.88, roughness: 0.28 });
  const polishedSteel = gameMaterial(0x9ca3af, { metalness: 0.92, roughness: 0.18 });
  const lensGlass = gameMaterial(0x0c1e2e, { metalness: 0.95, roughness: 0.05 });
  const cableMat = gameMaterial(0x141414, { roughness: 0.85, metalness: 0.1 });

  // Reusable Geometries to optimize draw calls and triangle budget
  const boltGeo = cylinderGeo(0.016, 0.016, 0.025, 6);
  const gearToothSmallGeo = boxGeo(0.032, 0.035, 0.035);
  const gearToothMediumGeo = boxGeo(0.036, 0.038, 0.03);
  const gearSpokeGeo = cylinderGeo(0.012, 0.012, 0.74, 6);
  const cageBarGeo = cylinderYGeo(0.013, 0.013, 0.8, 6);
  const lensBaseGeo = cylinderGeo(0.05, 0.062, 0.025, 6);
  const lensBarrelGeo = cylinderGeo(0.036, 0.046, 0.055, 6);
  const lensGlassGeo = cylinderGeo(0.038, 0.038, 0.01, 6);
  const pinholeGeo = cylinderGeo(0.018, 0.018, 0.008, 6);
  const planetBarrelGeo = cylinderGeo(0.038, 0.044, 0.19, 6);
  const planetLensGeo = cylinderGeo(0.04, 0.04, 0.015, 6);

  // ==========================================
  // 1. TAPERED PEDESTAL BASE & CABLE TERMINAL
  // ==========================================
  // Stepped heavy casting at the floor (Y = 0)
  createPart('BaseFlange', cylinderGeo(1.05, 1.15, 0.06, 24), darkIron, {
    position: [0, 0.03, 0],
    parent: root,
  });

  createPart('BaseStep', cylinderGeo(0.88, 1.02, 0.08, 20), castBody, {
    position: [0, 0.1, 0],
    parent: root,
  });

  // Perimeter anchor bolts (12 bolts)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    createPart(`AnchorBolt_${i}`, boltGeo, polishedSteel, {
      position: [Math.cos(a) * 1.05, 0.07, Math.sin(a) * 1.05],
      parent: root,
    });
  }

  // Tapered column of the pedestal
  createPart('PedestalColumn', cylinderGeo(0.46, 0.8, 1.1, 20), castBody, {
    position: [0, 0.69, 0],
    parent: root,
  });

  // 4 reinforcing vertical flanges / ribs
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    createPart(`PedestalRib_${i}`, boxGeo(0.06, 0.85, 0.16), darkIron, {
      position: [Math.cos(a) * 0.58, 0.62, Math.sin(a) * 0.58],
      rotation: [0, -a * (180 / Math.PI), 0],
      parent: root,
    });
  }

  // Electrical terminal & control housing on the pedestal
  createPart('JunctionBox', boxGeo(0.24, 0.32, 0.18), darkIron, {
    position: [0.52, 0.45, 0.28],
    rotation: [0, -25, 0],
    parent: root,
  });
  createPart('JunctionPlate', boxGeo(0.25, 0.15, 0.02), brass, {
    position: [0.53, 0.48, 0.38],
    rotation: [0, -25, 0],
    parent: root,
  });
  createPart('JunctionDial', cylinderGeo(0.04, 0.04, 0.03, 8), polishedSteel, {
    position: [0.55, 0.36, 0.37],
    rotation: [90, 0, -25],
    parent: root,
  });

  // Pedestal neck & Azimuth Ring Gear
  createPart('PedestalNeck', cylinderGeo(0.5, 0.46, 0.14, 18), darkIron, {
    position: [0, 1.31, 0],
    parent: root,
  });
  createPart('AzimuthRing', torusGeo(0.51, 0.024, 5, 16), brass, {
    position: [0, 1.39, 0],
    rotation: [90, 0, 0],
    parent: root,
  });
  for (let t = 0; t < 16; t++) {
    const ta = (t / 16) * Math.PI * 2;
    createPart(`AzTooth_${t}`, gearToothSmallGeo, brass, {
      position: [Math.cos(ta) * 0.52, 1.39, Math.sin(ta) * 0.52],
      rotation: [0, -ta * (180 / Math.PI), 0],
      parent: root,
    });
  }

  createPart('PedestalCrown', cylinderGeo(0.46, 0.5, 0.1, 18), castBody, {
    position: [0, 1.47, 0],
    parent: root,
  });

  // ==========================================
  // 2. YOKE, ELEVATION TRUNNIONS & GEAR CAGE
  // ==========================================
  createPart('MountBase', cylinderGeo(0.42, 0.46, 0.18, 16), darkIron, {
    position: [0, 1.61, 0],
    parent: root,
  });

  createPart('YokeSaddle', boxGeo(0.36, 0.22, 0.95), castBody, {
    position: [0, 1.76, 0],
    parent: root,
  });

  // Dual Trunnion arms (left and right)
  for (const [sideName, zSign] of [['L', -1], ['R', 1]]) {
    createPart(`YokeArm_${sideName}`, cylinderGeo(0.13, 0.18, 0.85, 10), castBody, {
      position: [0, 2.18, zSign * 0.48],
      parent: root,
    });

    createPart(`YokeStrut_${sideName}`, boxGeo(0.12, 0.6, 0.1), darkIron, {
      position: [-0.08, 2.05, zSign * 0.48],
      rotation: [0, 0, 15],
      parent: root,
    });

    // Elevation Trunnion Bearing Housing
    createPart(`TrunnionPillow_${sideName}`, cylinderZGeo(0.22, 0.22, 0.18, 14), darkIron, {
      position: [0, 2.6, zSign * 0.52],
      parent: root,
    });
    createPart(`TrunnionCap_${sideName}`, cylinderZGeo(0.23, 0.23, 0.05, 14), brass, {
      position: [0, 2.6, zSign * 0.62],
      parent: root,
    });
    for (let b = 0; b < 6; b++) {
      const ba = (b / 6) * Math.PI * 2;
      createPart(`TrunnionBolt_${sideName}_${b}`, boltGeo, polishedSteel, {
        position: [Math.cos(ba) * 0.16, 2.6 + Math.sin(ba) * 0.16, zSign * 0.65],
        rotation: [90, 0, 0],
        parent: root,
      });
    }

    // Elevation Ring Gear & Cage
    createPart(`ElevationRing_${sideName}`, torusGeo(0.42, 0.024, 5, 16), brass, {
      position: [0, 2.6, zSign * 0.38],
      parent: root,
    });
    createPart(`CageRingOuter_${sideName}`, torusGeo(0.45, 0.02, 4, 14), polishedSteel, {
      position: [0, 2.6, zSign * 0.32],
      parent: root,
    });

    // Radial gear teeth around the ring gear
    for (let t = 0; t < 14; t++) {
      const ta = (t / 14) * Math.PI * 2;
      createPart(`ElevTooth_${sideName}_${t}`, gearToothMediumGeo, brass, {
        position: [Math.cos(ta) * 0.43, 2.6 + Math.sin(ta) * 0.43, zSign * 0.38],
        rotation: [0, 0, ta * (180 / Math.PI)],
        parent: root,
      });
    }

    // Radial spokes linking ring to trunnion axle
    for (let s = 0; s < 6; s++) {
      const sa = (s / 6) * Math.PI;
      createPart(`GearSpoke_${sideName}_${s}`, gearSpokeGeo, polishedSteel, {
        position: [0, 2.6, zSign * 0.38],
        rotation: [0, 0, sa * (180 / Math.PI)],
        parent: root,
      });
    }
  }

  // Central trunnion axle connecting both sides
  createPart('TrunnionShaft', cylinderZGeo(0.09, 0.09, 1.25, 12), polishedSteel, {
    position: [0, 2.6, 0],
    parent: root,
  });

  // Elevation Drive Motor & Worm Gearbox
  createPart('ElevationMotor', cylinderZGeo(0.11, 0.11, 0.26, 10), darkIron, {
    position: [0.18, 2.42, -0.56],
    parent: root,
  });
  createPart('ElevationGearbox', boxGeo(0.18, 0.18, 0.16), castBody, {
    position: [0.08, 2.52, -0.54],
    parent: root,
  });
  createPart('MotorEndPlate', cylinderZGeo(0.115, 0.115, 0.03, 10), brass, {
    position: [0.18, 2.42, -0.7],
    parent: root,
  });

  // Counterweight arm and counterweight discs
  createPart('CounterweightBar', cylinderXGeo(0.045, 0.045, 0.65, 8), polishedSteel, {
    position: [-0.35, 2.6, 0],
    parent: root,
  });
  createPart('CounterweightDisc1', cylinderXGeo(0.24, 0.24, 0.14, 14), darkIron, {
    position: [-0.55, 2.6, 0],
    parent: root,
  });
  createPart('CounterweightDisc2', cylinderXGeo(0.22, 0.22, 0.1, 14), brass, {
    position: [-0.68, 2.6, 0],
    parent: root,
  });

  // ==========================================
  // 3. CENTRAL DUMBBELL FRAME & PLANET CAGES
  // ==========================================
  const dumbbellPivot = createPivot('DumbbellFrame', [0, 2.6, 0], root);
  dumbbellPivot.rotation.z = 38 * (Math.PI / 180); // Astronomical latitude tilt ~38°

  // Central declination drum / carrier
  createPart('CenterHub', cylinderYGeo(0.38, 0.38, 0.44, 16), darkIron, {
    position: [0, 0, 0],
    parent: dumbbellPivot,
  });
  createPart('CenterRingGear', torusGeo(0.41, 0.024, 5, 16), brass, {
    position: [0, 0, 0],
    rotation: [90, 0, 0],
    parent: dumbbellPivot,
  });
  for (let t = 0; t < 14; t++) {
    const ta = (t / 14) * Math.PI * 2;
    createPart(`CenterTooth_${t}`, gearToothSmallGeo, brass, {
      position: [Math.cos(ta) * 0.42, 0, Math.sin(ta) * 0.42],
      rotation: [0, -ta * (180 / Math.PI), 0],
      parent: dumbbellPivot,
    });
  }

  // Declination drive motor pod
  createPart('DeclinationDrive', cylinderXGeo(0.09, 0.09, 0.28, 10), castBody, {
    position: [0.32, 0, 0],
    parent: dumbbellPivot,
  });
  createPart('DeclinationDriveCap', cylinderXGeo(0.095, 0.095, 0.04, 10), brass, {
    position: [0.47, 0, 0],
    parent: dumbbellPivot,
  });

  const cageHeight = 0.82;
  const cageRadius = 0.33;
  const sphereDist = 0.28 + cageHeight + 0.5;

  for (const [hemi, sign] of [['North', 1], ['South', -1]]) {
    const cageCenterY = sign * (0.22 + cageHeight / 2);
    const collarY = sign * 0.22;
    const topCollarY = sign * (0.22 + cageHeight);

    // Inner & Outer Bulkheads
    createPart(`CageCollarInner_${hemi}`, cylinderYGeo(0.35, 0.35, 0.06, 16), castBody, {
      position: [0, collarY, 0],
      parent: dumbbellPivot,
    });
    createPart(`CageCollarOuter_${hemi}`, cylinderYGeo(0.35, 0.35, 0.06, 16), castBody, {
      position: [0, topCollarY, 0],
      parent: dumbbellPivot,
    });
    createPart(`CageRingGear_${hemi}`, torusGeo(0.36, 0.02, 4, 14), brass, {
      position: [0, topCollarY, 0],
      rotation: [90, 0, 0],
      parent: dumbbellPivot,
    });

    // 8 Longitudinal Cage Struts
    for (let j = 0; j < 8; j++) {
      const a = (j / 8) * Math.PI * 2;
      createPart(`CageStrut_${hemi}_${j}`, cageBarGeo, polishedSteel, {
        position: [Math.cos(a) * cageRadius, cageCenterY, Math.sin(a) * cageRadius],
        parent: dumbbellPivot,
      });
    }

    // Mid-cage intermediate ring
    createPart(`CageMidRing_${hemi}`, torusGeo(cageRadius, 0.015, 4, 14), brass, {
      position: [0, cageCenterY, 0],
      rotation: [90, 0, 0],
      parent: dumbbellPivot,
    });

    // Center internal axle
    createPart(`CageCoreShaft_${hemi}`, cylinderYGeo(0.08, 0.08, cageHeight, 10), darkIron, {
      position: [0, cageCenterY, 0],
      parent: dumbbellPivot,
    });

    // Clustered Planet Projector mechanisms inside cage
    const projectorCount = 3;
    for (let p = 0; p < projectorCount; p++) {
      const pAngle = (p / projectorCount) * Math.PI * 2 + (sign > 0 ? 0.3 : 1.2);
      const py = cageCenterY + (p - 1) * 0.2;
      const px = Math.cos(pAngle) * 0.16;
      const pz = Math.sin(pAngle) * 0.16;

      createPart(`PlanetMount_${hemi}_${p}`, boxGeo(0.08, 0.07, 0.1), darkIron, {
        position: [px, py, pz],
        rotation: [0, -pAngle * (180 / Math.PI), 0],
        parent: dumbbellPivot,
      });

      const barrelAngle = pAngle + (p % 2 === 0 ? 0.35 : -0.35);
      const bbx = Math.cos(barrelAngle) * 0.22;
      const bbz = Math.sin(barrelAngle) * 0.22;
      const pDir = new THREE.Vector3(Math.cos(barrelAngle), 0.3 * sign, Math.sin(barrelAngle)).normalize();
      const pBarrel = createPart(`PlanetBarrel_${hemi}_${p}`, planetBarrelGeo, brass, {
        position: [bbx, py + (sign * 0.03), bbz],
        parent: dumbbellPivot,
      });
      pBarrel.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pDir);

      const pLens = createPart(`PlanetLens_${hemi}_${p}`, planetLensGeo, lensGlass, {
        position: [bbx + pDir.x * 0.1, py + (sign * 0.03) + pDir.y * 0.1, bbz + pDir.z * 0.1],
        parent: dumbbellPivot,
      });
      pLens.quaternion.copy(pBarrel.quaternion);
    }

    // ==========================================
    // 4. STAR SPHERES (NORTH & SOUTH)
    // ==========================================
    const sphereY = sign * sphereDist;

    // Perforated Star Sphere Ball
    createPart(`StarSphere_${hemi}`, sphereGeo(0.5, 18, 12), castBody, {
      position: [0, sphereY, 0],
      parent: dumbbellPivot,
    });

    // Equator structural ring
    createPart(`SphereEquator_${hemi}`, torusGeo(0.51, 0.02, 4, 14), brass, {
      position: [0, sphereY, 0],
      rotation: [90, 0, 0],
      parent: dumbbellPivot,
    });

    // Latitude panel rib rings
    createPart(`SphereLatRib1_${hemi}`, torusGeo(0.44, 0.015, 4, 12), darkIron, {
      position: [0, sphereY + sign * 0.23, 0],
      rotation: [90, 0, 0],
      parent: dumbbellPivot,
    });
    createPart(`SphereLatRib2_${hemi}`, torusGeo(0.44, 0.015, 4, 12), darkIron, {
      position: [0, sphereY - sign * 0.23, 0],
      rotation: [90, 0, 0],
      parent: dumbbellPivot,
    });

    // Polar cap projector
    createPart(`PolarCap_${hemi}`, cylinderGeo(0.11, 0.15, 0.07, 10), brass, {
      position: [0, sphereY + sign * 0.5, 0],
      parent: dumbbellPivot,
    });

    // Perforated star pinholes around sphere equator (8 pinholes per sphere)
    for (let ph = 0; ph < 8; ph++) {
      const pha = (ph / 8) * Math.PI * 2 + 0.15;
      const phx = Math.cos(pha) * 0.505;
      const phz = Math.sin(pha) * 0.505;
      const pinPart = createPart(`StarPinhole_${hemi}_${ph}`, pinholeGeo, darkIron, {
        position: [phx, sphereY + (ph % 2 === 0 ? 0.08 : -0.08) * sign, phz],
        parent: dumbbellPivot,
      });
      pinPart.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(phx, 0, phz).normalize());
    }

    // Studded Lens Barrels distributed across the star ball (22 precision lenses per sphere)
    const rings = [
      { latDeg: sign * 68, count: 3, rotOffset: 0.1 },
      { latDeg: sign * 42, count: 5, rotOffset: 0.3 },
      { latDeg: sign * 18, count: 6, rotOffset: 0.0 },
      { latDeg: -sign * 15, count: 5, rotOffset: 0.2 },
      { latDeg: -sign * 42, count: 3, rotOffset: 0.4 },
    ];

    let lensCount = 0;
    for (const r of rings) {
      const latRad = r.latDeg * (Math.PI / 180);
      const yLocal = Math.sin(latRad) * 0.5;
      const rPlane = Math.cos(latRad) * 0.5;

      for (let k = 0; k < r.count; k++) {
        const lon = (k / r.count) * Math.PI * 2 + r.rotOffset;
        const xLocal = Math.cos(lon) * rPlane;
        const zLocal = Math.sin(lon) * rPlane;

        const normalVec = new THREE.Vector3(xLocal / 0.5, yLocal / 0.5, zLocal / 0.5).normalize();
        const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normalVec);

        const collar = createPart(`LensCollar_${hemi}_${lensCount}`, lensBaseGeo, darkIron, {
          position: [xLocal + normalVec.x * 0.012, sphereY + yLocal + normalVec.y * 0.012, zLocal + normalVec.z * 0.012],
          parent: dumbbellPivot,
        });
        collar.quaternion.copy(quat);

        const barrel = createPart(`LensBarrel_${hemi}_${lensCount}`, lensBarrelGeo, brass, {
          position: [xLocal + normalVec.x * 0.045, sphereY + yLocal + normalVec.y * 0.045, zLocal + normalVec.z * 0.045],
          parent: dumbbellPivot,
        });
        barrel.quaternion.copy(quat);

        const glass = createPart(`LensFront_${hemi}_${lensCount}`, lensGlassGeo, lensGlass, {
          position: [xLocal + normalVec.x * 0.074, sphereY + yLocal + normalVec.y * 0.074, zLocal + normalVec.z * 0.074],
          parent: dumbbellPivot,
        });
        glass.quaternion.copy(quat);

        lensCount++;
      }
    }

    // Special projector nacelles on equator
    for (let c = 0; c < 2; c++) {
      const cAngle = c * Math.PI + (sign > 0 ? 0 : Math.PI / 2);
      const cx = Math.cos(cAngle) * 0.52;
      const cz = Math.sin(cAngle) * 0.52;
      createPart(`SpecialProjector_${hemi}_${c}`, cylinderGeo(0.05, 0.065, 0.12, 6), polishedSteel, {
        position: [cx, sphereY, cz],
        rotation: [0, -cAngle * (180 / Math.PI), 90],
        parent: dumbbellPivot,
      });
      createPart(`SpecialLens_${hemi}_${c}`, cylinderGeo(0.052, 0.052, 0.02, 6), lensGlass, {
        position: [cx * 1.11, sphereY, cz * 1.11],
        rotation: [0, -cAngle * (180 / Math.PI), 90],
        parent: dumbbellPivot,
      });
    }
  }

  // ==========================================
  // 5. INDUSTRIAL CABLE TRUNK & CONDUITS
  // ==========================================
  const mainCablePath = [
    [0.12, 2.55, 0.45],
    [0.32, 2.25, 0.52],
    [0.46, 1.85, 0.5],
    [0.54, 1.4, 0.44],
    [0.56, 0.95, 0.38],
    [0.54, 0.55, 0.32],
  ];
  const mainCableGeo = pipeAlongPath(mainCablePath, 0.048, { bendRadius: 0.16, tubularSegments: 20, radialSegments: 6 });
  createPart('MainCableTrunk', mainCableGeo, cableMat, { parent: root });

  const clampPoints = [
    { pos: [0.46, 1.82, 0.5], rot: -20 },
    { pos: [0.54, 1.38, 0.44], rot: -25 },
    { pos: [0.56, 0.92, 0.38], rot: -28 },
  ];
  clampPoints.forEach((cp, idx) => {
    createPart(`CableClamp_${idx}`, boxGeo(0.08, 0.04, 0.14), brass, {
      position: cp.pos,
      rotation: [0, cp.rot, 0],
      parent: root,
    });
  });

  const motorConduitPath = [
    [0.18, 2.38, -0.62],
    [0.12, 2.1, -0.58],
    [0.05, 1.85, -0.48],
  ];
  const motorConduitGeo = pipeAlongPath(motorConduitPath, 0.025, { bendRadius: 0.1, tubularSegments: 12, radialSegments: 6 });
  createPart('MotorConduit', motorConduitGeo, cableMat, { parent: root });

  return root;
}

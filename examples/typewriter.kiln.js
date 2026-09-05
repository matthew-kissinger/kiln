// Authored by: opencode-go/muse-spark-1.3-contributor, via opencode.
//
// Written by the model itself through the Kiln MCP tools: it wrote the
// program, rendered it, looked at its own six-view contact sheet, and
// revised. Not a line of it is hand-authored.
//
// Dispatched into a clean directory containing only the brief and the Kiln
// skills, with no access to this repository or to any finished example.
//
// Refined later, in this repository, with `kiln_edit`: the type-bar segment
// was rebuilt as a slotted arc that clears the keys, the back of the frame was
// closed with a panel, and the finish was made crinkle enamel.
// The attribution above is for the authoring run, which had none of this in
// scope. Both passes went through the same tools; only the second one could
// see the gallery it was going into.

const meta = { name: 'Typewriter', category: 'prop' };

async function build() {
  const root = createRoot('Typewriter');

  // Wrinkle enamel.
  //
  // The frame was 0x17181c and 0x232429 -- two flat near-blacks -- and the
  // whole machine came back as a silhouette with white keys floating on it.
  // A black subject still has to return light somewhere or there is nothing
  // for the eye to read the form from, and on this machine the light comes
  // from the finish itself: interwar office typewriters were sprayed in
  // crinkle enamel, a paint that dries into a fine pebbled crust and breaks
  // every highlight into hundreds of small ones. So the value goes up to a
  // charcoal that can actually shade, and the crust is a height map -- which
  // is the part that makes the panels look sprayed rather than filled.
  const enamelAlbedo = proceduralTexture({
    schemaVersion: 2, size: 512, usage: 'albedo', name: 'WrinkleEnamel',
    layers: [
      { op: 'solid', color: 0x2f3034 },
      { op: 'noise', colorA: 0x1c1d21, colorB: 0x43454a, scale: 48, octaves: 5, seed: 3, blend: 'overlay', opacity: 0.7 },
      { op: 'noise', colorA: 0x232429, colorB: 0x35373c, scale: 9, octaves: 3, seed: 23, blend: 'multiply', opacity: 0.2 },
    ],
  });
  const enamelNormal = normalMapFromHeight(enamelAlbedo, { strength: 4 });
  const castIron = pbrMaterial({
    albedo: enamelAlbedo, normal: enamelNormal, roughness: 0.5, metalness: 0.25,
  });
  const castIron2 = gameMaterial(0x33353a, { roughness: 0.55, metalness: 0.35 });
  const steel = gameMaterial(0x9aa0a6, { roughness: 0.32, metalness: 0.85 });
  const darkSteel = gameMaterial(0x4a4d52, { roughness: 0.45, metalness: 0.8 });
  const brass = gameMaterial(0x5e4d26, { roughness: 0.45, metalness: 0.75 });
  const rubber = gameMaterial(0x101012, { roughness: 0.95, metalness: 0.0 });
  const ivory = gameMaterial(0xe9e2cd, { roughness: 0.35, metalness: 0.0 });
  // Nickel key rings, not black ones -- the ring is what separates one key
  // cap from the next when the whole deck is dark.
  const keyRim = gameMaterial(0x6e7278, { roughness: 0.3, metalness: 0.85 });
  const paperMat = gameMaterial(0xf2ecda, { roughness: 0.9, metalness: 0.0 });
  const glassTop = glassMaterial(0xdfe8ea, { opacity: 0.35, roughness: 0.1, metalness: 0.1 });

  const footGeo = cylinderGeo(0.032, 0.038, 0.03, 16);
  const footPos = [[0.28, 0.015, 0.30], [0.28, 0.015, -0.30], [-0.28, 0.015, 0.30], [-0.28, 0.015, -0.30]];
  for (let i = 0; i < 4; i++) {
    createPart('Foot_' + i, footGeo, rubber, { position: footPos[i], parent: root });
  }

  // Unwrapped because it is CSG output: roundedBoxGeo hulls eight spheres
  // through Manifold and hands back geometry with no UV attribute, which the
  // enamel's albedo and normal maps both need.
  const baseGeo = await autoUnwrap(await roundedBoxGeo(0.72, 0.10, 0.70, 0.02, { segments: 4 }));
  createPart('Base', baseGeo, castIron, { position: [0.0, 0.08, 0.0], parent: root });

  const lipGeo = await roundedBoxGeo(0.06, 0.04, 0.66, 0.012, { segments: 3 });
  createPart('FrontLip', lipGeo, castIron2, { position: [0.36, 0.09, 0.0], parent: root });
  // maker plate on front lip
  createPart('MakerPlate', decalBox(0.012, 0.018, 0.20), brass, { position: [0.392, 0.09, 0.0], rotation: [0, 0, 0], parent: root });

  const deckGeo = await autoUnwrap(await roundedBoxGeo(0.42, 0.06, 0.64, 0.015, { segments: 3 }));
  createPart('KeyDeck', deckGeo, castIron, { position: [0.12, 0.185, 0.0], rotation: [0, 0, -12], parent: root });

  const coverGeo = await roundedBoxGeo(0.16, 0.04, 0.60, 0.012, { segments: 3 });
  createPart('TopCover', coverGeo, castIron2, { position: [-0.10, 0.245, 0.0], parent: root });

  const cheekGeo = await autoUnwrap(await roundedBoxGeo(0.45, 0.15, 0.045, 0.012, { segments: 2 }));
  createPart('CheekR', cheekGeo, castIron, { position: [-0.03, 0.205, 0.335], parent: root });
  createPart('CheekL', cheekGeo, castIron, { position: [-0.03, 0.205, -0.335], parent: root });

  const capGeo = boxGeo(0.42, 0.014, 0.05);
  createPart('TrimR', capGeo, brass, { position: [-0.03, 0.287, 0.335], parent: root });
  createPart('TrimL', capGeo, brass, { position: [-0.03, 0.287, -0.335], parent: root });

  // Back plate. The frame had two cheeks and a top cover and nothing at all
  // closing the rear, so from behind you looked straight through the machine
  // and out at the underside of the keys. Every enclosed typewriter has this
  // panel: it butts against the rear face of both cheeks (x = -0.255), spans
  // the gap between their inner faces (z = +/-0.3125), and runs from the top of
  // the base up to the trim line. Its own trim strip carries the brass around
  // the back so the three sides read as one band.
  const backPlateGeo = await autoUnwrap(await roundedBoxGeo(0.030, 0.158, 0.625, 0.008, { segments: 3 }));
  createPart('BackPlate', backPlateGeo, castIron, { position: [-0.270, 0.209, 0.0], parent: root });
  createPart('TrimB', boxGeo(0.05, 0.014, 0.625), brass, { position: [-0.2725, 0.287, 0.0], parent: root });

  // carriage support standards (ground the carriage to the frame)
  const stdGeo = boxGeo(0.10, 0.12, 0.04);
  createPart('CarriageStdR', stdGeo, castIron, { position: [-0.23, 0.32, 0.40], parent: root });
  createPart('CarriageStdL', stdGeo, castIron, { position: [-0.23, 0.32, -0.40], parent: root });

  const stalkGeo = cylinderGeo(0.006, 0.006, 0.10, 10);
  const rimGeo = cylinderGeo(0.027, 0.025, 0.015, 20);
  const faceGeo = cylinderGeo(0.021, 0.021, 0.004, 20);
  const glassGeo = cylinderGeo(0.020, 0.020, 0.003, 20);

  const rows = [
    { x: 0.29, y: 0.195, n: 9, z0: -0.224 },
    { x: 0.19, y: 0.235, n: 10, z0: -0.252 },
    { x: 0.09, y: 0.275, n: 9, z0: -0.224 }
  ];
  let ki = 0;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let k = 0; k < row.n; k++) {
      const z = row.z0 + k * 0.056;
      createPart('KeyStalk_' + ki, stalkGeo, darkSteel, { position: [row.x - 0.01, row.y - 0.045, z], rotation: [0, 0, 12], parent: root });
      createPart('KeyRim_' + ki, rimGeo, keyRim, { position: [row.x, row.y, z], rotation: [0, 0, -12], parent: root });
      createPart('KeyFace_' + ki, faceGeo, ivory, { position: [row.x + 0.0025, row.y + 0.0075, z], rotation: [0, 0, -12], parent: root });
      createPart('KeyGlass_' + ki, glassGeo, glassTop, { position: [row.x + 0.004, row.y + 0.010, z], rotation: [0, 0, -12], parent: root });
      ki++;
    }
  }

  const spaceGeo = await roundedBoxGeo(0.045, 0.018, 0.34, 0.008, { segments: 3 });
  createPart('Spacebar', spaceGeo, keyRim, { position: [0.345, 0.165, 0.0], rotation: [0, 0, -8], parent: root });
  const spaceArmGeo = boxGeo(0.08, 0.01, 0.015);
  createPart('SpaceArmR', spaceArmGeo, darkSteel, { position: [0.31, 0.14, 0.14], parent: root });
  createPart('SpaceArmL', spaceArmGeo, darkSteel, { position: [0.31, 0.14, -0.14], parent: root });

  const shiftGeo = await roundedBoxGeo(0.05, 0.02, 0.05, 0.006, { segments: 2 });
  createPart('ShiftR', shiftGeo, keyRim, { position: [0.09, 0.24, 0.29], rotation: [0, 0, -12], parent: root });
  createPart('ShiftL', shiftGeo, keyRim, { position: [0.09, 0.24, -0.29], rotation: [0, 0, -12], parent: root });

  // The type-bar segment.
  //
  // This was a filled disc -- cylinderGeo(0.16, 0.18, 0.05) centred at
  // x = -0.06 -- with a full torus ring above it. Both are circles, and a
  // circle of that radius reaches forward to x = +0.12, which is exactly where
  // the back row of keys sits (x = 0.09, rim radius 0.027). From above the
  // machine looked like it had a lid closed over its own keyboard.
  //
  // The real part is not a disc. It is the segment: a slotted arc standing
  // behind the print point with one slot per type bar, holding the bars in
  // register as they swing. It is open at the front, and it stops well short of
  // the keys -- that gap is where the operator's fingers go. Built from blocks
  // on an arc because torusGeo takes no arc argument; the slots are the gaps
  // between the teeth, which is how the part reads on the real machine too.
  const segTeeth = 27;
  const segToothGeo = boxGeo(0.030, 0.026, 0.0055);
  const segBackGeo = boxGeo(0.014, 0.030, 0.016);
  for (let i = 0; i < segTeeth; i++) {
    const t = i / (segTeeth - 1) - 0.5;
    const ang = t * 150;
    const c = Math.cos((ang * Math.PI) / 180);
    const s = Math.sin((ang * Math.PI) / 180);
    // A Y rotation of a carries +X to (cos a, 0, -sin a), so -ang is what
    // points each tooth outward along its own radius.
    createPart('SegTooth_' + i, segToothGeo, darkSteel, {
      position: [-0.115 + c * 0.088, 0.288, s * 0.208],
      rotation: [0, -ang, 0],
      parent: root,
    });
    createPart('SegBack_' + i, segBackGeo, castIron2, {
      position: [-0.115 + c * 0.070, 0.283, s * 0.166],
      rotation: [0, -ang, 0],
      parent: root,
    });
  }

  const printPt = [-0.10, 0.40, 0.0];
  const nBars = 26;
  for (let i = 0; i < nBars; i++) {
    const t = (i / (nBars - 1) - 0.5);
    const ang = t * 140;
    const rad = 0.15;
    const bx = -0.06 - Math.abs(t) * 0.025;
    const bz = Math.sin(ang * Math.PI / 180) * rad * 1.4;
    const by = 0.30;
    const midX = (bx + printPt[0]) / 2 + 0.02;
    const midY = (by + printPt[1]) / 2;
    const midZ = bz * 0.55;
    beamBetween('TypeBar_' + i, [bx, by, bz], [midX, midY, midZ], 0.0042, darkSteel, { parent: root });
    beamBetween('TypeBarTop_' + i, [midX, midY, midZ], printPt, 0.003, steel, { parent: root });
    createPart('TypeSlug_' + i, boxGeo(0.018, 0.012, 0.010), steel, { position: [printPt[0] - 0.005 - (i % 3) * 0.004, printPt[1] + 0.005, (i - nBars / 2) * 0.0012], rotation: [0, 0, 20], parent: root });
  }
  createPart('TypeGuide', boxGeo(0.03, 0.06, 0.02), darkSteel, { position: [-0.105, 0.375, 0.0], parent: root });

  const spoolCoreGeo = cylinderGeo(0.028, 0.028, 0.022, 20);
  const spoolFlangeGeo = cylinderGeo(0.048, 0.048, 0.005, 24);
  const spoolPos = [[-0.02, 0.285, 0.20], [-0.02, 0.285, -0.20]];
  for (let s = 0; s < 2; s++) {
    const sp = spoolPos[s];
    createPart('SpoolCore_' + s, spoolCoreGeo, rubber, { position: sp, parent: root });
    createPart('SpoolFlangeB_' + s, spoolFlangeGeo, darkSteel, { position: [sp[0], sp[1] - 0.013, sp[2]], parent: root });
    createPart('SpoolFlangeT_' + s, spoolFlangeGeo, darkSteel, { position: [sp[0], sp[1] + 0.013, sp[2]], parent: root });
    createPart('SpoolPin_' + s, cylinderGeo(0.005, 0.005, 0.03, 10), steel, { position: [sp[0], sp[1] + 0.025, sp[2]], parent: root });
  }
  const ribbonGeo = boxGeo(0.10, 0.004, 0.36);
  createPart('Ribbon', ribbonGeo, rubber, { position: [-0.06, 0.30, 0.0], parent: root });
  beamBetween('RibbonArmR', [-0.02, 0.29, 0.20], [-0.10, 0.36, 0.03], 0.004, darkSteel, { parent: root });
  beamBetween('RibbonArmL', [-0.02, 0.29, -0.20], [-0.10, 0.36, -0.03], 0.004, darkSteel, { parent: root });

  const railGeo = cylinderZGeo(0.012, 0.012, 0.92, 14);
  createPart('CarriageRailF', railGeo, steel, { position: [-0.16, 0.36, 0.0], parent: root });
  createPart('CarriageRailB', railGeo, steel, { position: [-0.30, 0.36, 0.0], parent: root });

  const endGeo = await autoUnwrap(await roundedBoxGeo(0.20, 0.10, 0.03, 0.01, { segments: 2 }));
  createPart('CarriageEndR', endGeo, castIron, { position: [-0.23, 0.42, 0.46], parent: root });
  createPart('CarriageEndL', endGeo, castIron, { position: [-0.23, 0.42, -0.46], parent: root });

  const platenGeo = cylinderZGeo(0.062, 0.062, 0.82, 28);
  createPart('Platen', platenGeo, rubber, { position: [-0.24, 0.475, 0.0], parent: root });
  const capPGeo = cylinderZGeo(0.045, 0.045, 0.03, 20);
  createPart('PlatenCapR', capPGeo, darkSteel, { position: [-0.24, 0.475, 0.425], parent: root });
  createPart('PlatenCapL', capPGeo, darkSteel, { position: [-0.24, 0.475, -0.425], parent: root });

  const knobBodyGeo = cylinderZGeo(0.048, 0.048, 0.045, 24);
  const knobEndGeo = cylinderZGeo(0.030, 0.048, 0.02, 24);
  const knobAxGeo = cylinderZGeo(0.010, 0.010, 0.06, 12);
  const ribGeo = boxGeo(0.008, 0.008, 0.05);
  for (const side of [1, -1]) {
    const zc = side * 0.48;
    const tag = side > 0 ? 'R' : 'L';
    createPart('KnobBody_' + tag, knobBodyGeo, castIron2, { position: [-0.24, 0.475, zc], parent: root });
    createPart('KnobEnd_' + tag, knobEndGeo, castIron2, { position: [-0.24, 0.475, zc + side * 0.032], parent: root });
    createPart('KnobAx_' + tag, knobAxGeo, steel, { position: [-0.24, 0.475, side * 0.445], parent: root });
    for (let r = 0; r < 8; r++) {
      const a = r * 22.5;
      createPart('KnobRib_' + tag + r, ribGeo, castIron2, { position: [-0.24, 0.475, zc], rotation: [0, 0, a], parent: root });
    }
  }

  // paper seated against platen back, table directly behind paper
  const tableGeo = boxGeo(0.015, 0.20, 0.78);
  createPart('PaperTable', tableGeo, castIron2, { position: [-0.325, 0.52, 0.0], rotation: [0, 0, -12], parent: root });
  const paperGeo = boxGeo(0.006, 0.26, 0.60);
  createPart('Paper', paperGeo, paperMat, { position: [-0.308, 0.585, 0.0], rotation: [0, 0, -12], parent: root });

  const bailGeo = cylinderZGeo(0.008, 0.008, 0.80, 12);
  createPart('BailBar', bailGeo, steel, { position: [-0.185, 0.53, 0.0], parent: root });
  const rollerGeo = cylinderZGeo(0.016, 0.016, 0.03, 14);
  createPart('BailRollerR', rollerGeo, rubber, { position: [-0.185, 0.53, 0.18], parent: root });
  createPart('BailRollerC', rollerGeo, rubber, { position: [-0.185, 0.53, 0.0], parent: root });
  createPart('BailRollerL', rollerGeo, rubber, { position: [-0.185, 0.53, -0.15], parent: root });
  beamBetween('BailArmR', [-0.23, 0.44, 0.44], [-0.185, 0.53, 0.40], 0.006, darkSteel, { parent: root });
  beamBetween('BailArmL', [-0.23, 0.44, -0.44], [-0.185, 0.53, -0.40], 0.006, darkSteel, { parent: root });

  const rulerGeo = boxGeo(0.03, 0.015, 0.80);
  createPart('PaperRuler', rulerGeo, steel, { position: [-0.145, 0.40, 0.0], parent: root });

  beamBetween('ReturnLever', [-0.23, 0.47, -0.47], [-0.04, 0.54, -0.60], 0.009, darkSteel, { parent: root });
  createPart('ReturnGrip', cylinderGeo(0.015, 0.015, 0.10, 14), castIron2, { position: [0.005, 0.55, -0.615], rotation: [0, 0, 78], parent: root });

  createPart('LineLever', boxGeo(0.02, 0.02, 0.06), darkSteel, { position: [-0.23, 0.50, -0.47], parent: root });
  const smallKnobGeo = sphereGeo(0.016, 14, 10);
  createPart('MarginKnobR', smallKnobGeo, brass, { position: [-0.16, 0.385, 0.38], parent: root });
  createPart('MarginKnobL', smallKnobGeo, brass, { position: [-0.16, 0.385, -0.38], parent: root });

  const screwGeo = cylinderGeo(0.008, 0.008, 0.008, 12);
  createPart('ScrewFR', screwGeo, steel, { position: [0.30, 0.135, 0.28], parent: root });
  createPart('ScrewFL', screwGeo, steel, { position: [0.30, 0.135, -0.28], parent: root });

  return root;
}

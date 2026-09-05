// Authored by: opencode-go/deepseek-v4-flash-vision-exp, via opencode.
//
// Written by the model itself through the Kiln MCP tools: it wrote the
// program, rendered it, looked at its own six-view contact sheet, and
// revised. Not a line of it is hand-authored.
//
// Dispatched into a clean directory containing only the brief and the Kiln
// skills, with no access to this repository or to any finished example.
//
// Refined later, in this repository, with `kiln_edit`: three materials that
// looked right in source and wrong in the render. The comments at each one say
// what the render showed. The attribution above is for the authoring run; both
// passes went through the same tools, and only the second one was looking at
// the asset next to a gallery.

const meta = { name: 'Windmill', category: 'prop', role: 'poi' };

async function build() {
  const root = createRoot('Windmill');
  const D2R = Math.PI / 180;

  // ---------- materials ----------
  // The tower was a solid terracotta with an OVERLAY noise laid over it, and
  // overlay is a contrast operator: a base already past mid on red and under it
  // on green and blue comes back out of it as fire-engine red. The windmill
  // rendered as a painted silo. Real coursing instead, from the `bricks` op the
  // texture DSL already has, with the noise dropped to a light multiply so it
  // soils the brick rather than recolouring it, and a height-derived normal so
  // the courses catch the light from the side the way brick does.
  const brickTex = proceduralTexture({ schemaVersion: 2, size: 512, usage: 'albedo', name: 'Brick',
    layers: [ { op: 'solid', color: 0x7d5346 },
              { op: 'bricks', brick: 0x8a5f4e, mortar: 0x9c948a, rows: 56, cols: 22, mortarWidth: 0.08, stagger: 0.5 },
              { op: 'noise', colorA: 0x6d4c40, colorB: 0xa07a6b, scale: 7, octaves: 4, seed: 3, blend: 'multiply', opacity: 0.32 } ] });
  const brick = pbrMaterial({ albedo: brickTex, normal: normalMapFromHeight(brickTex, { strength: 3 }), roughness: 0.95 });

  // Same overlay problem, and the cap had a second one: nothing in the texture
  // said shingle, so a shingled cap rendered as a smooth brown dome. Courses of
  // staggered tiles, and the normal map is what turns them into overlapping
  // boards rather than a printed pattern.
  const shingleTex = proceduralTexture({ schemaVersion: 2, size: 512, usage: 'albedo', name: 'Shingle',
    layers: [ { op: 'solid', color: 0x6b5c48 },
              { op: 'bricks', brick: 0x6f6049, mortar: 0x4a3f31, rows: 26, cols: 14, mortarWidth: 0.06, stagger: 0.5 },
              { op: 'noise', colorA: 0x5a4d3c, colorB: 0x8d7c62, scale: 9, octaves: 4, seed: 8, blend: 'multiply', opacity: 0.4 } ] });
  const shingle = pbrMaterial({ albedo: shingleTex, normal: normalMapFromHeight(shingleTex, { strength: 4 }), roughness: 0.72 });

  const wood = gameMaterial(0x8a5c33, { roughness: 0.85 });
  const woodDark = gameMaterial(0x5a3a20, { roughness: 0.9 });
  const green = gameMaterial(0x35503a, { roughness: 0.7 });
  const iron = gameMaterial(0x2f2f33, { metalness: 0.9, roughness: 0.32 });
  // 0xdcd2b6 is already within a few percent of white, and under the neutral
  // studio dome a rough near-white surface clips: the sail bays came back as
  // blank white rectangles with no weave and no fold. Unbleached rather than
  // bleached, which leaves headroom for the highlight to land somewhere.
  const canvas = gameMaterial(0x9c8f74, { roughness: 0.96 });
  const trim = gameMaterial(0xd6d0bd, { roughness: 0.8 });
  const dark = gameMaterial(0x1a1a1a, { roughness: 0.9 });
  // Dressed stone, not chalk. The belt courses at 0x8f8a82 came back within a
  // few percent of white and read as icing piped round the tower: a rough
  // diffuse surface under the neutral studio dome returns nearly all of what it
  // is given, so a light base colour has nowhere left to go.
  const stone = gameMaterial(0x6f6a63, { roughness: 0.95 });

  // ---------- tower ----------
  const baseR = 4.5, topR = 3.0, topY = 14.0;
  const towR = (y) => baseR + (topR - baseR) * (y / topY);

  const towerGeo = cylinderUnwrap(cylinderGeo(topR, baseR, topY, 32));
  createPart('Tower', towerGeo, brick, { position: [0, 7, 0], parent: root });

  // The eleven course rings that used to be here were a stand-in for coursing
  // the texture could not draw. It can now, and eleven proud hoops down a
  // tapering tower read as a stack of tyres, not as brick.

  // stone belt-courses (structural accent bands)
  [1.0, 7.2, 13.0].forEach((y, i) => {
    const r = towR(y) + 0.05;
    createPart('Belt' + i, torusGeo(r, 0.16, 6, 32), stone, { position: [0, y, 0], rotation: [90, 0, 0], parent: root });
  });

  // stepped foundation plinth
  createPart('Plinth', cylinderGeo(baseR + 0.3, baseR + 0.5, 0.62, 32), brick, { position: [0, 0.31, 0], parent: root });
  createPart('Plinth2', cylinderGeo(baseR + 0.5, baseR + 0.62, 0.4, 32), brick, { position: [0, 0.7, 0], parent: root });

  // iron hoops at the tower head
  const hoopY = 13.15;
  const hoopR = towR(hoopY) + 0.1;
  createPart('HoopTop', torusGeo(hoopR, 0.13, 8, 32), iron, { position: [0, hoopY, 0], rotation: [90, 0, 0], parent: root });
  createPart('HoopTop2', torusGeo(hoopR * 0.98, 0.09, 8, 32), iron, { position: [0, 13.45, 0], rotation: [90, 0, 0], parent: root });

  // ---------- plank door (front, +X) ----------
  const doorG = createPivot('Door', [0, 0, 0], root);
  {
    const dx = towR(1.3) + 0.02;
    for (let i = 0; i < 7; i++) {
      const z = (i - 3) * 0.21;
      const h = 2.3 - Math.abs(z) * 0.25;
      createPart('DoorPlank' + i, boxGeo(0.09, h, 0.2), green, { position: [dx, 0.1 + h / 2, z], parent: doorG });
    }
    createPart('DFrameL', boxGeo(0.12, 2.4, 0.12), woodDark, { position: [dx + 0.02, 1.35, -0.75], parent: doorG });
    createPart('DFrameR', boxGeo(0.12, 2.4, 0.12), woodDark, { position: [dx + 0.02, 1.35, 0.75], parent: doorG });
    createPart('DFrameT', boxGeo(0.12, 0.14, 1.6), woodDark, { position: [dx + 0.02, 2.5, 0], parent: doorG });
    createPart('DoorStep', boxGeo(0.6, 0.18, 1.7), stone, { position: [dx + 0.35, 0.09, 0], parent: doorG });
  }

  // ---------- shuttered windows at three levels ----------
  function shutterWindow(n, azDeg, y) {
    const piv = createPivot('Win' + n, [0, y, 0], root);
    piv.rotation.y = azDeg * D2R;
    const rx = towR(y) + 0.04;
    createPart('Win' + n + 'Dark', decalBox(0.06, 0.95, 0.62), dark, { position: [rx, 0, 0], parent: piv });
    createPart('Win' + n + 'T', decalBox(0.06, 0.09, 0.72), trim, { position: [rx + 0.01, 0.52, 0], parent: piv });
    createPart('Win' + n + 'B', decalBox(0.08, 0.1, 0.72), trim, { position: [rx + 0.02, -0.52, 0], parent: piv });
    createPart('Win' + n + 'L', decalBox(0.06, 1.05, 0.09), trim, { position: [rx + 0.01, 0, -0.36], parent: piv });
    createPart('Win' + n + 'R', decalBox(0.06, 1.05, 0.09), trim, { position: [rx + 0.01, 0, 0.36], parent: piv });
    createPart('Win' + n + 'SL', boxGeo(0.05, 1.0, 0.34), green, { position: [rx + 0.12, 0, -0.54], rotation: [0, -24, 0], parent: piv });
    createPart('Win' + n + 'SR', boxGeo(0.05, 1.0, 0.34), green, { position: [rx + 0.12, 0, 0.54], rotation: [0, 24, 0], parent: piv });
    return piv;
  }
  shutterWindow(0, 0, 4.8);
  shutterWindow(1, 62, 8.0);
  shutterWindow(2, -62, 10.6);
  shutterWindow(3, 0, 9.2);
  shutterWindow(4, 180, 5.4);
  shutterWindow(5, 118, 10.9);

  // ---------- timber stage gallery (2/3 up) ----------
  const galleryY = 12.0;
  const galOuter = 3.9;
  createPart('StageFloor', cylinderGeo(galOuter, galOuter, 0.22, 28), woodDark, { position: [0, galleryY - 0.11, 0], parent: root });
  createPart('StageRim', torusGeo(galOuter, 0.09, 6, 28), wood, { position: [0, galleryY - 0.05, 0], rotation: [90, 0, 0], parent: root });

  const plank = createPart('Plank0', boxGeo(1.0, 0.07, 0.42), wood, { position: [3.42, galleryY + 0.02, 0], parent: root });
  arrayRadial('Plank', plank, 34, 'y', root);

  const post = createPart('Post0', boxGeo(0.09, 1.25, 0.09), wood, { position: [galOuter - 0.05, galleryY + 0.72, 0], parent: root });
  arrayRadial('Post', post, 32, 'y', root);

  const baluster = createPart('Baluster0', cylinderYGeo(0.035, 0.035, 0.5, 6), woodDark, { position: [galOuter - 0.05, galleryY + 0.62, 0], parent: root });
  arrayRadial('Baluster', baluster, 64, 'y', root);
  createPart('RailTop', torusGeo(galOuter - 0.05, 0.075, 6, 32), wood, { position: [0, galleryY + 1.34, 0], rotation: [90, 0, 0], parent: root });
  createPart('RailMid', torusGeo(galOuter - 0.05, 0.05, 6, 32), wood, { position: [0, galleryY + 0.9, 0], rotation: [90, 0, 0], parent: root });
  createPart('RailBottom', torusGeo(galOuter - 0.05, 0.05, 6, 32), wood, { position: [0, galleryY + 0.25, 0], rotation: [90, 0, 0], parent: root });

  const bracket = createPart('Bracket0', boxGeo(0.95, 0.09, 0.09), wood, { position: [3.45, galleryY - 0.45, 0], rotation: [0, 0, 49], parent: root });
  arrayRadial('Bracket', bracket, 28, 'y', root);

  // access ladder leaning on the tower up to the gallery
  {
    const az = 55 * D2R;
    const c = Math.cos(az), s = Math.sin(az);
    createLadder('Ladder', { bottom: [(towR(0.2) + 0.35) * c, 0.05, (towR(0.2) + 0.35) * s], top: [(towR(11.9) + 0.35) * c, galleryY - 0.1, (towR(11.9) + 0.35) * s], material: wood, width: 0.55, rungCount: 15, railRadius: 0.055, rungRadius: 0.05, parent: root });
  }

  // ---------- boat-shaped shingled cap ----------
  const capProfile = [
    [3.9, 14.0], [3.9, 14.9], [3.2, 16.1], [1.6, 17.0], [0.0, 17.4], [-1.9, 17.0],
    [-3.2, 16.0], [-4.2, 14.7], [-4.4, 14.0], [-2.2, 14.0], [0.0, 14.0], [2.2, 14.0]
  ];
  let capGeo = await extrudeProfile(capProfile, { depth: 6.6, bevel: 0.28, bevelStyle: 'round', segments: 7, axis: 'z', center: true, smooth: false });
  capGeo = await autoUnwrap(capGeo);
  createPart('Cap', capGeo, shingle, { position: [0, 0, 0], parent: root });

  const ridge = curveToMesh([[3.7, 14.9, 0], [3.2, 16.1, 0], [1.6, 17.0, 0], [0, 17.4, 0], [-1.9, 17.0, 0], [-3.2, 16.0, 0], [-4.1, 14.7, 0]], 0.09, 16, 6);
  createPart('Ridge', ridge, woodDark, { parent: root });

  createPart('Gable', boxGeo(0.12, 1.0, 3.4), woodDark, { position: [3.95, 15.3, 0], parent: root });

  // finial weathervane on the crown of the cap
  createPart('VaneMast', cylinderYGeo(0.035, 0.035, 1.3, 8), iron, { position: [0, 18.0, 0], parent: root });
  createPart('VaneArrow', boxGeo(0.9, 0.06, 0.02), iron, { position: [0.3, 18.4, 0], parent: root });
  createPart('VaneArrowTip', boxGeo(0.02, 0.24, 0.02), iron, { position: [0.72, 18.4, 0], parent: root });
  createPart('VaneTail', boxGeo(0.3, 0.24, 0.02), iron, { position: [-0.2, 18.4, 0], parent: root });

  // ---------- canted windshaft ----------
  const cant = 12 * D2R;
  const dd = [Math.cos(cant), Math.sin(cant), 0];
  const hubPos = [5.2, 16.1, 0];
  const shaftStart = [1.0, 14.6, 0];

  const shaftLen = Math.hypot(hubPos[0] - shaftStart[0], hubPos[1] - shaftStart[1]);
  const shaftCenter = [(shaftStart[0] + hubPos[0]) / 2, (shaftStart[1] + hubPos[1]) / 2, 0];
  createPart('Shaft', cylinderOnAxis(shaftCenter, dd, 0.2, shaftLen + 0.4), wood, { parent: root });

  // stuffing-box collar where the shaft exits the cap front lip
  createPart('ShaftCollar', cylinderOnAxis([3.6, 15.15, 0], dd, 0.34, 0.5), iron, { parent: root });

  // ---------- four lattice sails (spin around the canted shaft) ----------
  const shaftPivot = createPivot('ShaftBase', hubPos, root);
  shaftPivot.rotation.z = -(Math.PI / 2 - cant);

  const spinPivot = createPivot('Sails', [0, 0, 0], shaftPivot);

  function buildSail(sp, tag) {
    // main stock (spar)
    createPart('Stock' + tag, boxGeo(7.8, 0.14, 0.4), wood, { position: [4.2, 0, 0], parent: sp });
    // hub-side leading sailboard
    createPart('Board' + tag, boxGeo(1.4, 0.1, 1.1), woodDark, { position: [1.1, 0, -0.4], parent: sp });
    // sailcloth panel behind the lattice
    createPart('Cloth' + tag, boxGeo(5.5, 0.03, 1.8), canvas, { position: [5.1, -0.09, 0], parent: sp });
    // cloth-bay lattice frame
    createPart('L' + tag + 'A1', boxGeo(0.07, 0.07, 1.9), woodDark, { position: [2.3, 0, 0], parent: sp });
    createPart('L' + tag + 'A2', boxGeo(0.07, 0.07, 1.9), woodDark, { position: [7.9, 0, 0], parent: sp });
    createPart('L' + tag + 'R1', boxGeo(5.6, 0.07, 0.07), woodDark, { position: [5.1, 0, 0.95], parent: sp });
    createPart('L' + tag + 'R2', boxGeo(5.6, 0.07, 0.07), woodDark, { position: [5.1, 0, -0.95], parent: sp });
    for (let i = 0; i < 11; i++) {
      createPart('L' + tag + 'V' + i, boxGeo(0.05, 0.05, 1.9), woodDark, { position: [2.55 + i * 0.52, 0, 0], parent: sp });
    }
    createPart('L' + tag + 'H1', boxGeo(5.6, 0.05, 0.05), woodDark, { position: [5.1, 0, 0.33], parent: sp });
    createPart('L' + tag + 'H2', boxGeo(5.6, 0.05, 0.05), woodDark, { position: [5.1, 0, -0.33], parent: sp });
    // tip board at the far end of the sail
    createPart('Tip' + tag, boxGeo(0.5, 0.12, 1.4), woodDark, { position: [8.15, 0, 0], parent: sp });
  }

  for (let k = 0; k < 4; k++) {
    const sp = createPivot('SailPivot' + k, [0, 0, 0], spinPivot);
    sp.rotation.y = k * (Math.PI / 2);
    buildSail(sp, k);
  }

  // hub block
  createPart('Hub', cylinderOnAxis(hubPos, dd, 0.45, 0.7), iron, { parent: root });

  // ---------- fantail on a small tower behind the cap ----------
  const fant = createPivot('Fantail', [0, 0, 0], root);
  {
    const fx = -4.2, fy = 13.2;
    createPart('FantTower', cylinderGeo(0.32, 0.5, 2.6, 10), wood, { position: [fx, fy, 0], parent: fant });
    const fp = createPart('FantPost0', cylinderYGeo(0.045, 0.045, 2.8, 6), woodDark, { position: [fx + 0.42, fy, 0], parent: fant });
    arrayRadial('FantPost', fp, 4, 'y', fant);
    createPart('FantRing1', torusGeo(0.42, 0.04, 5, 12), woodDark, { position: [fx, fy - 1.0, 0], rotation: [90, 0, 0], parent: fant });
    createPart('FantRing2', torusGeo(0.42, 0.04, 5, 12), woodDark, { position: [fx, fy + 1.0, 0], rotation: [90, 0, 0], parent: fant });

    // fan blades (8) around a horizontal -X-facing wheel
    const fan = createPivot('FanHub', [fx - 0.7, fy, 0], fant);
    const blade = createPart('Blade0', boxGeo(0.07, 1.4, 0.32), woodDark, { position: [0, 0.78, 0], parent: fan });
    arrayRadial('Blade', blade, 8, 'x', fan);
    createPart('FanCenter', cylinderXGeo(0.14, 0.14, 0.5, 10), iron, { position: [0, 0, 0], parent: fan });
  }

  return root;
}

function animate() {
  return [spinAnimation('Joint_Sails', 12, 'y')];
}

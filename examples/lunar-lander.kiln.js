// A lunar module.
//
// Authored by: Claude Opus 5, via Claude Code. Every part below was written by
// the model itself, looking at its own renders through the Kiln tools and
// revising. Not a line of it is hand-authored.
//
// Every other hero in this set is a thing that was MADE TO LOOK LIKE SOMETHING:
// a gun carriage, a lamp column, a motorcycle tank. All of them have designed
// surfaces. A lunar module has none. Nothing about it was styled, because it
// never flew through air and never had to survive being seen. It is a machine
// wrapped in crumpled foil and held together by struts that go exactly where
// the loads are, and its silhouette is the direct output of that.
//
// That makes it the one asset here where SYMMETRY IS THE ENEMY. The real
// vehicle is four-fold symmetric in its structure and violently asymmetric in
// everything bolted to it: one ladder, one dish on one side, one hatch, docking
// target on one face, RCS quads that are the same four times but antennas that
// are not. Build the fittings symmetrically and it stops reading as a
// spacecraft and starts reading as a lamp. So the structure below is generated
// in a four-fold loop and then everything hung on it is placed once, by hand,
// on the face it actually belongs to.
//
// The material lesson is foil. Kapton and aluminised mylar are metallic, but
// they are CRUMPLED, and crumple is a normal-map property, not an albedo one.
// A flat gold albedo at high metalness gives you a brass barrel. The same
// albedo with a strong normal derived from high-frequency noise gives you
// something that reads as thin sheet stretched over a frame, which is the whole
// visual identity of the descent stage.
const meta = { name: 'LunarLander', category: 'vehicle', role: 'hero' };

async function build() {
  const root = createRoot('LunarLander');
  const uv = (g) => autoUnwrap(g, { resolution: 1024 });
  const D = Math.PI / 180;

  // ---------- Dimensions ----------
  const DESC_R = 2.05;      // octagon circumradius of the descent stage
  const DESC_Y0 = 1.32;     // descent stage underside
  const DESC_Y1 = 2.92;     // descent stage deck
  const ASC_Y1 = 4.62;      // top of the ascent stage
  const PAD_R = 3.15;       // footpad ring radius

  // ---------- Materials ----------
  // Gold Kapton. See the header: the crumple lives in the normal map. Strength
  // 4.0 is far past what any other asset here uses, and it is the difference
  // between foil and sheet brass.
  const foilAlbedo = proceduralTexture({
    schemaVersion: 2, size: 1024, usage: 'albedo', name: 'KaptonGold',
    layers: [
      { op: 'solid', color: 0xa3853f },
      { op: 'noise', colorA: 0x8d7134, colorB: 0xc0a25a, scale: 150, octaves: 5, seed: 3, blend: 'overlay', opacity: 0.34 },
      { op: 'noise', colorA: 0x7a6229, colorB: 0xa3853f, scale: 34, octaves: 3, seed: 41, blend: 'multiply', opacity: 0.10 },
    ],
  });
  const foil = pbrMaterial({
    albedo: foilAlbedo, normal: normalMapFromHeight(foilAlbedo, { strength: 3.0 }),
    roughness: 0.56, metalness: 0.34,
  });

  // Black Kapton, the same crumple at a different value. The descent stage is
  // banded gold and black, and that banding is most of what identifies it.
  const blackFoilAlbedo = proceduralTexture({
    schemaVersion: 2, size: 512, usage: 'albedo', name: 'KaptonBlack',
    layers: [
      { op: 'solid', color: 0x35322e },
      { op: 'noise', colorA: 0x24221f, colorB: 0x4a463f, scale: 120, octaves: 5, seed: 11, blend: 'overlay', opacity: 0.55 },
    ],
  });
  const blackFoil = pbrMaterial({
    albedo: blackFoilAlbedo, normal: normalMapFromHeight(blackFoilAlbedo, { strength: 3.0 }),
    roughness: 0.58, metalness: 0.38,
  });

  // Thermal white. A DIELECTRIC -- white paint over aluminium, not bare metal.
  const whiteAlbedo = proceduralTexture({
    schemaVersion: 2, size: 512, usage: 'albedo', name: 'ThermalWhite',
    layers: [
      { op: 'solid', color: 0xd6d4cf },
      { op: 'noise', colorA: 0xbcbab5, colorB: 0xe8e6e1, scale: 40, octaves: 3, seed: 7, blend: 'overlay', opacity: 0.40 },
    ],
  });
  const white = pbrMaterial({
    albedo: whiteAlbedo, normal: normalMapFromHeight(whiteAlbedo, { strength: 1.2 }),
    roughness: 0.72, metalness: 0.04,
  });

  // Bare structure: struts, ladder, engine mount.
  const alloyAlbedo = proceduralTexture({
    schemaVersion: 2, size: 512, usage: 'albedo', name: 'Alloy',
    layers: [
      { op: 'solid', color: 0x9a9ea3 },
      { op: 'noise', colorA: 0x83878c, colorB: 0xb4b8bd, scale: 46, octaves: 3, seed: 19, blend: 'overlay', opacity: 0.45 },
    ],
  });
  const alloy = pbrMaterial({
    albedo: alloyAlbedo, normal: normalMapFromHeight(alloyAlbedo, { strength: 1.0 }),
    roughness: 0.42, metalness: 0.88,
  });

  // The descent engine bell: ablative, scorched, and rough enough that it does
  // not compete with the foil for attention.
  const nozzle = gameMaterial(0x3a3330, { roughness: 0.86, metalness: 0.35 });
  const glassPane = glassMaterial(0x0d1a1f, { opacity: 0.72, roughness: 0.05, metalness: 0 });
  const trim = gameMaterial(0x2b2e31, { roughness: 0.52, metalness: 0.45 });

  const box = async (name, w, h, d, r, position, mat, rotation, parent) =>
    createPart(name, await uv(await roundedBoxGeo(w, h, d, r)), mat, {
      position, rotation, parent: parent ?? root,
    });

  // ---------- Descent stage ----------
  // An octagonal prism. Extruded as a profile rather than assembled from boxes,
  // because eight faces built as four crossed slabs leaves visible seams at
  // every corner and the corners are exactly where the legs attach.
  const octagon = (r, rot = 22.5) =>
    Array.from({ length: 8 }, (_, i) => {
      const a = (i * 45 + rot) * D;
      return [Math.cos(a) * r, Math.sin(a) * r];
    });

  createPart('DescentBody', await uv(await extrudeProfile(octagon(DESC_R), {
    depth: DESC_Y1 - DESC_Y0, axis: 'y', bevel: 0.04,
  })), foil, { position: [0, (DESC_Y0 + DESC_Y1) / 2, 0], parent: root });
  // Black band around the lower third, and the deck cap on top.
  createPart('DescentBand', await uv(await extrudeProfile(octagon(DESC_R + 0.015), {
    depth: 0.46, axis: 'y', bevel: 0.02,
  })), blackFoil, { position: [0, DESC_Y0 + 0.30, 0], parent: root });
  createPart('DescentDeck', await uv(await extrudeProfile(octagon(DESC_R + 0.03), {
    depth: 0.10, axis: 'y', bevel: 0.02,
  })), alloy, { position: [0, DESC_Y1 + 0.03, 0], parent: root });
  createPart('DescentFloor', await uv(await extrudeProfile(octagon(DESC_R - 0.02), {
    depth: 0.08, axis: 'y', bevel: 0.02,
  })), blackFoil, { position: [0, DESC_Y0 + 0.02, 0], parent: root });
  // Panel seams: a batten up each of the eight corners, so the foil reads as
  // panels stretched between frames instead of one shrink-wrapped solid.
  for (let i = 0; i < 8; i++) {
    const a = (i * 45 + 22.5) * D;
    createPart(`DescentBatten_${i}`, await uv(await roundedBoxGeo(0.07, DESC_Y1 - DESC_Y0, 0.07, 0.018)), alloy, {
      position: [Math.cos(a) * (DESC_R - 0.02), (DESC_Y0 + DESC_Y1) / 2, Math.sin(a) * (DESC_R - 0.02)],
      rotation: [0, -i * 45 - 22.5, 0], parent: root,
    });
  }

  // Quadrant bays, each on a named face and each different. This is the part of
  // the descent stage that stops it reading as an octagonal drum.
  const faceAt = (deg, out) => {
    const a = deg * D;
    const rr = DESC_R * Math.cos(22.5 * D) + out;
    return [Math.cos(a) * rr, Math.sin(a) * rr];
  };
  {
    // MESA: the stowage pallet, hinged down on the face the ladder faces.
    const [mx, mz] = faceAt(270, 0.17);
    await box('MesaBay', 1.34, 0.92, 0.34, 0.05, [mx, 2.18, mz], blackFoil);
    await box('MesaLid', 1.30, 0.06, 0.44, 0.02, [mx, 2.68, mz - 0.10], alloy, [-14, 0, 0]);
    for (const t of [-0.44, 0, 0.44]) {
      await box(`MesaStrap_${t.toFixed(2)}`, 0.05, 0.94, 0.04, 0.012, [mx + t, 2.18, mz - 0.17], alloy);
    }
  }
  {
    // Science package: a smaller pallet with the RTG cask strapped beside it.
    const [sx, sz2] = faceAt(90, 0.14);
    await box('SeqBay', 0.96, 0.70, 0.28, 0.05, [sx, 2.30, sz2], blackFoil);
    createPart('RtgCask', cylinderZGeo(0.15, 0.15, 0.86, 16), alloy,
      { position: [sx - 0.74, 2.12, sz2 + 0.02], rotation: [0, 90, 0], parent: root });
    for (const t of [-0.30, 0.30]) {
      await box(`SeqStrap_${t.toFixed(2)}`, 0.05, 0.72, 0.04, 0.012, [sx + t, 2.30, sz2 + 0.15], alloy);
    }
  }
  {
    // Aft bay: three tanks behind a part-height cover, on the face opposite the
    // ladder. Different again, so no two quadrants share a read.
    const [ax, az] = faceAt(180, 0.10);
    await box('AftDescentCover', 1.10, 0.44, 0.22, 0.04, [ax, 1.76, az], alloy, [0, 90, 0]);
    for (const t of [-0.38, 0, 0.38]) {
      createPart(`DescentTank_${t.toFixed(2)}`, cylinderGeo(0.16, 0.16, 0.78, 14), white,
        { position: [ax - 0.04, 2.42, az + t], parent: root });
    }
  }

  // ---------- Descent engine ----------
  createPart('EngineSkirt', await uv(await revolveProfile([
    [0.000, 0.00], [0.300, 0.00], [0.330, 0.12], [0.320, 0.26], [0.000, 0.26],
  ], { segments: 24, axis: 'y', smooth: true })), alloy, {
    position: [0, DESC_Y0 - 0.26, 0], parent: root,
  });
  // The bell. A revolve, so the flare is a real curve and it survives being
  // looked at from directly underneath. The profile already runs mouth-first
  // from y=0, so it needs NO flip -- the first pass turned it 180 degrees and
  // drove the whole nozzle through the ground plane.
  const bellProfile = [
    [0.620, 0.00], [0.600, 0.06], [0.420, 0.36],
    [0.300, 0.62], [0.250, 0.86], [0.245, 0.98],
  ];
  const BELL_Y = 0.08;
  createPart('EngineBell', await uv(await revolveProfile(
    [[0.000, 0.00], ...bellProfile, [0.000, 0.98]],
    { segments: 32, axis: 'y', smooth: true },
  )), nozzle, { position: [0, BELL_Y, 0], parent: root });
  // Stiffening rings. Their radius is READ OFF the bell profile rather than
  // guessed, so every ring sits on the surface at whatever height it lands.
  const bellRadiusAt = (y) => {
    for (let k = 1; k < bellProfile.length; k++) {
      const [r0, y0] = bellProfile[k - 1];
      const [r1, y1] = bellProfile[k];
      if (y >= y0 && y <= y1) return r0 + (r1 - r0) * ((y - y0) / (y1 - y0));
    }
    return bellProfile[bellProfile.length - 1][0];
  };
  for (let i = 0; i < 6; i++) {
    const ly = 0.10 + i * 0.165;
    createPart(`BellRib_${i}`, torusGeo(bellRadiusAt(ly) + 0.010, 0.018, 6, 28), nozzle, {
      position: [0, BELL_Y + ly, 0], rotation: [90, 0, 0], parent: root,
    });
  }

  // ---------- Landing gear ----------
  // Four legs on the diagonals, each a primary strut with two secondary struts
  // bracing it back to the stage. This is the part where the structure is
  // genuinely four-fold symmetric, so it is the part that gets a loop.
  for (let i = 0; i < 4; i++) {
    const a = (i * 90 + 45) * D;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const top = [c * (DESC_R - 0.30), DESC_Y1 - 0.14, s * (DESC_R - 0.30)];
    const knee = [c * PAD_R, 0.42, s * PAD_R];
    const padTop = [c * PAD_R, 0.30, s * PAD_R];

    beamBetween(`LegPrimary_${i}`, top, knee, 0.088, alloy, { parent: root });
    // Secondary struts, splayed to either side of the primary.
    for (const sd of [-1, 1]) {
      const anchor = [
        Math.cos(a + sd * 30 * D) * (DESC_R - 0.10), DESC_Y0 + 0.10, Math.sin(a + sd * 30 * D) * (DESC_R - 0.10),
      ];
      beamBetween(`LegSecondary_${i}${sd > 0 ? 'A' : 'B'}`, anchor, knee, 0.048, alloy, { parent: root });
    }
    // Deployment truss back up to the deck.
    beamBetween(`LegTruss_${i}`, [c * (PAD_R - 0.95), 0.92, s * (PAD_R - 0.95)],
      [c * (DESC_R - 0.18), DESC_Y1 - 0.20, s * (DESC_R - 0.18)], 0.036, alloy, { parent: root });

    // Footpad: a shallow dish, not a disc. It has to look like it would sink.
    createPart(`Footpad_${i}`, await uv(await revolveProfile([
      [0.000, 0.00], [0.400, 0.02], [0.455, 0.10], [0.450, 0.17],
      [0.300, 0.19], [0.000, 0.19],
    ], { segments: 22, axis: 'y', smooth: true })), alloy, {
      position: [padTop[0], 0.0, padTop[2]], parent: root,
    });
    createPart(`FootpadCollar_${i}`, cylinderGeo(0.085, 0.085, 0.24, 12), alloy, {
      position: [padTop[0], 0.30, padTop[2]], parent: root,
    });
    // Contact probe: the wire that told the crew to cut the engine. One of the
    // four was deleted on the real vehicle so it could not spear the ladder.
    if (i !== 0) {
      beamBetween(`ContactProbe_${i}`, [c * (PAD_R + 0.10), 0.16, s * (PAD_R + 0.10)],
        [c * (PAD_R + 0.34), -0.0, s * (PAD_R + 0.34)], 0.014, alloy, { parent: root });
    }
  }

  // ---------- Ascent stage ----------
  // Deliberately not a box and not a cylinder: a wide low body with a canted
  // forward face carrying the windows, which is the shape everyone recognises.
  await box('AscentBody', 2.10, 1.24, 2.32, 0.14, [0, 3.60, 0], white);
  await box('AscentShoulderL', 0.90, 0.52, 2.36, 0.16, [-0.94, 3.36, 0], white);
  // Forward face, canted back at the top the way the real crew compartment is.
  await box('AscentFace', 0.30, 1.10, 1.84, 0.10, [1.04, 3.66, 0], white, [0, 0, -14]);
  // Cabin roof and the black thermal blanket over the aft equipment bay.
  await box('AscentRoof', 1.70, 0.22, 2.00, 0.10, [0, 4.30, 0], white);
  await box('AftBlanket', 0.70, 1.00, 2.10, 0.12, [-1.10, 3.88, 0], blackFoil);
  // Battens and fittings over the blanket. Without these it is a black hole in
  // the silhouette; with them it reads as a covered equipment rack.
  for (const bz of [-0.72, -0.24, 0.24, 0.72]) {
    await box(`AftBatten_${bz.toFixed(2)}`, 0.06, 1.02, 0.05, 0.014, [-1.46, 3.88, bz], alloy);
  }
  await box('AftGirth', 0.06, 0.05, 2.02, 0.014, [-1.46, 4.26, 0], alloy);
  createPart('AftTankA', cylinderZGeo(0.20, 0.20, 0.66, 16), white,
    { position: [-1.52, 3.50, 0.48], parent: root });
  createPart('AftTankB', cylinderZGeo(0.15, 0.15, 0.52, 14), alloy,
    { position: [-1.50, 3.52, -0.62], parent: root });

  // Two triangular windows, canted down so the crew could see the ground. Built
  // as thin plates on the canted face rather than cut into it -- a boolean here
  // would need the face to be manifold with the shoulder, and the win is zero.
  for (const sz of [-1, 1]) {
    const mir = (pts) => pts.map(([u, v]) => [u * sz, v]);
    createPart(`Window_${sz > 0 ? 'R' : 'L'}`, await uv(await extrudeProfile(mir([
      [0.00, 0.39], [0.44, 0.13], [0.39, -0.34], [-0.13, -0.26],
    ]), { depth: 0.05, axis: 'x', bevel: 0.012 })), glassPane, {
      position: [1.23, 3.80, sz * 0.40], rotation: [0, 0, -14], parent: root,
    });
    createPart(`WindowFrame_${sz > 0 ? 'R' : 'L'}`, await uv(await extrudeProfile(mir([
      [0.00, 0.47], [0.52, 0.17], [0.47, -0.42], [-0.20, -0.33],
    ]), { depth: 0.03, axis: 'x', bevel: 0.010 })), trim, {
      position: [1.20, 3.80, sz * 0.40], rotation: [0, 0, -14], parent: root,
    });
  }

  // Forward hatch, square with rounded corners, below and between the windows.
  await box('Hatch', 0.12, 0.82, 0.82, 0.05, [1.16, 3.06, 0], white, [0, 0, -4]);
  await box('HatchHandle', 0.09, 0.09, 0.30, 0.03, [1.23, 3.06, 0.20], alloy);
  // Egress porch and the ladder down the forward leg -- placed ONCE, on +X.
  await box('Porch', 0.56, 0.09, 1.00, 0.03, [1.42, 2.98, 0], alloy);
  {
    const a = 45 * D;   // the ladder rides the leg at +45 degrees
    const lx = Math.cos(a);
    const lz = Math.sin(a);
    for (const sd of [-1, 1]) {
      beamBetween(`LadderRail_${sd > 0 ? 'A' : 'B'}`,
        [1.46 + sd * 0.02 * lz, 2.94, sd * 0.20], [PAD_R * lx * 0.86, 0.50, sd * 0.20], 0.022, alloy, { parent: root });
    }
    for (let r = 0; r < 9; r++) {
      const f = r / 8;
      createPart(`LadderRung_${r}`, cylinderZGeo(0.017, 0.017, 0.40, 8), alloy, {
        position: [1.46 + (PAD_R * lx * 0.86 - 1.46) * f, 2.94 + (0.50 - 2.94) * f, 0], parent: root,
      });
    }
  }

  // ---------- Fittings, each placed once ----------
  // RCS thruster quads at the four corners of the ascent stage. These ARE
  // four-fold, so they loop; everything after this does not.
  for (let i = 0; i < 4; i++) {
    const a = (i * 90 + 45) * D;
    const c = Math.cos(a) * 1.34;
    const s = Math.sin(a) * 1.42;
    await box(`RcsBody_${i}`, 0.26, 0.26, 0.26, 0.05, [c, 3.86, s], alloy);
    for (const [dx, dy, dz, nm] of [[0.20, 0, 0, 'F'], [-0.20, 0, 0, 'B'], [0, 0.20, 0, 'U'], [0, -0.20, 0, 'D']]) {
      createPart(`RcsNozzle_${i}${nm}`, coneGeo(0.052, 0.11, 10), nozzle, {
        position: [c + dx, 3.86 + dy, s + dz],
        rotation: [dz ? 90 : 0, 0, dx ? (dx > 0 ? -90 : 90) : (dy > 0 ? 0 : 180)], parent: root,
      });
    }
  }

  // Plume deflectors: a canted plate under each downward thruster, so the down
  // jet has something to bounce off instead of the descent stage deck.
  for (let i = 0; i < 4; i++) {
    const a = (i * 90 + 45) * D;
    await box(`PlumeDeflector_${i}`, 0.36, 0.04, 0.30, 0.012,
      [Math.cos(a) * 1.34, 3.53, Math.sin(a) * 1.42], alloy, [0, -(i * 90 + 45), 24]);
  }

  // Docking tunnel and drogue, on top.
  createPart('DockTunnel', cylinderGeo(0.40, 0.44, 0.36, 24), alloy,
    { position: [0, ASC_Y1 + 0.12, 0], parent: root });
  createPart('DockRing', torusGeo(0.42, 0.045, 8, 28), alloy,
    { position: [0, ASC_Y1 + 0.30, 0], rotation: [90, 0, 0], parent: root });
  // Rendezvous radar: a dish, offset forward and to one side. Centring it would
  // hand the whole vehicle a symmetry it does not have.
  createPart('RadarMast', cylinderGeo(0.045, 0.045, 0.44, 10), alloy,
    { position: [0.52, 4.72, -0.30], rotation: [0, 0, -16], parent: root });
  createPart('RadarDish', await uv(await revolveProfile([
    [0.000, 0.00], [0.150, 0.05], [0.290, 0.17], [0.300, 0.20],
    [0.150, 0.09], [0.000, 0.03],
  ], { segments: 22, axis: 'y', smooth: true })), alloy, {
    position: [0.60, 4.94, -0.30], rotation: [0, 0, -52], parent: root,
  });
  // S-band steerable antenna, on the OTHER side and at a different angle.
  createPart('SbandBoom', cylinderGeo(0.035, 0.035, 0.60, 10), alloy,
    { position: [-0.30, 4.82, 0.72], rotation: [26, 0, 18], parent: root });
  createPart('SbandDish', await uv(await revolveProfile([
    [0.000, 0.00], [0.140, 0.06], [0.255, 0.19], [0.262, 0.22],
    [0.140, 0.10], [0.000, 0.04],
  ], { segments: 20, axis: 'y', smooth: true })), white, {
    position: [-0.44, 5.10, 0.86], rotation: [40, 0, 30], parent: root,
  });
  // VHF whip and the tracking-light strobe.
  beamBetween('VhfWhip', [-0.66, 4.34, -0.86], [-0.94, 5.28, -1.06], 0.012, alloy, { parent: root });
  createPart('TrackLight', sphereGeo(0.070, 12, 8), white, { position: [0.82, 4.36, 0.62], parent: root });

  // Plume deflectors under the RCS quads, and a couple of hand rails. Small,
  // asymmetric, and most of what makes the ascent stage look inhabited.
  for (const [hx, hy, hz, rot] of [[1.20, 3.44, 0.62, 0], [1.20, 3.44, -0.62, 0], [-0.10, 4.36, 0.96, 90]]) {
    createPart(`HandRail_${hz.toFixed(2)}_${hy.toFixed(2)}`, cylinderZGeo(0.016, 0.016, 0.34, 8), alloy, {
      position: [hx, hy, hz], rotation: [0, rot, 0], parent: root,
    });
  }

  return root;
}

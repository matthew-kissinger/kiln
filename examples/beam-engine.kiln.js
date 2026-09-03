// A Cornish rotative beam engine.
//
// Authored by: Claude Opus 5, via Claude Code. Every part below was written by
// the model itself, looking at its own renders through the Kiln tools and
// revising. Not a line of it is hand-authored.
//
// This is the only asset in the repository that MOVES, and it is here because
// `kiln_screenshot_animation` shipped with no example exercising it. An asset
// with an `animate()` is a different problem from a static one: the geometry
// has to be built in joints that can turn, and the joints have to turn in a way
// that survives being looked at.
//
// The interesting part is that the linkage is SOLVED, not eyeballed. A beam
// engine is a four-bar: the crank turns at constant speed, the beam rocks, and
// a connecting rod of fixed length joins them. Animating that by picking a
// plausible beam angle for each crank angle produces a rod that visibly
// stretches and shortens -- the single most obvious way to make a mechanism
// look fake. So `animate()` below bisects for the beam angle that holds the rod
// length exactly constant at every keyframe, then derives the connecting rod's
// own angle from the two endpoints it has to reach. Twenty-four keyframes of
// that read as a machine; twenty-four keyframes of guessing read as a toy.
//
//   crank angle -> solve beam angle (rod length invariant) -> derive rod angle
//                                                          -> derive piston lift
//
// Known simplification, stated because the render will not show it: a real
// beam engine needs Watt's parallel motion to keep the piston rod vertical
// while the beam end swings through an arc. That linkage is here as geometry
// but is not articulated. The horizontal excursion it would correct is 33 mm
// over a 1.3 m beam, which is below what these views resolve.
const meta = { name: 'BeamEngine', category: 'prop', role: 'wonder' };

// Linkage constants. `animate()` needs the same numbers `build()` used, so they
// live at module scope rather than inside either one.
const BEAM_PIVOT = [0, 2.86, 0];
const BEAM_HALF = 1.30;          // beam pivot to either end
const CRANK = [-1.30, 1.12, 0.30];
const CRANK_THROW = 0.30;
const FLYWHEEL_Z = 0.74;
const CYL_X = 1.30;
// Rod length that makes the beam rock symmetrically: the beam end must travel
// exactly as far as the crank pin does, so sin(phiMax) = throw / halfLength.
const PHI_MAX = Math.asin(CRANK_THROW / BEAM_HALF);
const ROD_LEN = Math.hypot(
  -BEAM_HALF * Math.cos(PHI_MAX) - CRANK[0],
  BEAM_PIVOT[1] + BEAM_HALF * Math.sin(PHI_MAX) - (CRANK[1] + CRANK_THROW),
);

async function build() {
  const root = createRoot('BeamEngine');
  const uv = (g) => autoUnwrap(g, { resolution: 1024 });

  // ---------- Materials ----------
  // Cast iron, painted the dark bottle green every preserved engine wears.
  // Painted iron is a DIELECTRIC; run it metallic and the whole frame becomes a
  // mirror and every moulding on the columns disappears.
  const ironAlbedo = proceduralTexture({
    schemaVersion: 2, size: 1024, usage: 'albedo', name: 'EngineGreen',
    layers: [
      { op: 'solid', color: 0x1f3b32 },
      { op: 'gradient', from: 0x2a4d42, to: 0x162b24, angleDeg: 90, blend: 'overlay', opacity: 0.5 },
      { op: 'noise', colorA: 0x18302a, colorB: 0x2d5347, scale: 38, octaves: 4, seed: 9, blend: 'overlay', opacity: 0.40 },
    ],
  });
  const iron = pbrMaterial({
    albedo: ironAlbedo, normal: normalMapFromHeight(ironAlbedo, { strength: 1.8 }),
    roughness: 0.46, metalness: 0.12,
  });

  // Bearings, oilers, the governor. Polished brass is what the eye goes to, so
  // it is spent only on the parts that actually rotate or need attention.
  const brassAlbedo = proceduralTexture({
    schemaVersion: 2, size: 512, usage: 'albedo', name: 'Brass',
    layers: [
      { op: 'solid', color: 0xb08d3c },
      { op: 'noise', colorA: 0x8d6f2d, colorB: 0xd6b055, scale: 44, octaves: 3, seed: 21, blend: 'overlay', opacity: 0.45 },
    ],
  });
  const brass = pbrMaterial({
    albedo: brassAlbedo, normal: normalMapFromHeight(brassAlbedo, { strength: 1.0 }),
    roughness: 0.24, metalness: 0.94,
  });

  const steelAlbedo = proceduralTexture({
    schemaVersion: 2, size: 512, usage: 'albedo', name: 'PolishedSteel',
    layers: [
      { op: 'solid', color: 0xb9bec4 },
      { op: 'noise', colorA: 0xa4a9af, colorB: 0xd2d7dd, scale: 58, octaves: 2, seed: 5, blend: 'overlay', opacity: 0.30 },
    ],
  });
  const steel = pbrMaterial({
    albedo: steelAlbedo, normal: normalMapFromHeight(steelAlbedo, { strength: 0.7 }),
    roughness: 0.16, metalness: 0.95,
  });

  const stoneAlbedo = proceduralTexture({
    schemaVersion: 2, size: 1024, usage: 'albedo', name: 'Ashlar',
    layers: [
      { op: 'solid', color: 0x8d8578 },
      { op: 'bricks', brick: 0x9a9284, mortar: 0x6f685d, rows: 10, cols: 5, blend: 'overlay', opacity: 0.55 },
      { op: 'noise', colorA: 0x6e675c, colorB: 0xa39b8d, scale: 30, octaves: 4, seed: 13, blend: 'overlay', opacity: 0.40 },
    ],
  });
  const stone = pbrMaterial({
    albedo: stoneAlbedo, normal: normalMapFromHeight(stoneAlbedo, { strength: 2.6 }),
    roughness: 0.88, metalness: 0.0,
  });

  // Cylinder lagging: wooden staves under brass bands, which is how a Victorian
  // engine insulated a hot cylinder.
  const laggingAlbedo = proceduralTexture({
    schemaVersion: 2, size: 512, usage: 'albedo', name: 'Lagging',
    layers: [
      { op: 'solid', color: 0x5c4128 },
      { op: 'stripes', colorA: 0x4a3320, colorB: 0x6d4e31, count: 30, angleDeg: 90, blend: 'overlay', opacity: 0.55 },
      { op: 'noise', colorA: 0x3d2a1a, colorB: 0x6d4e31, scale: 40, octaves: 3, seed: 31, blend: 'overlay', opacity: 0.30 },
    ],
  });
  const lagging = pbrMaterial({
    albedo: laggingAlbedo, normal: normalMapFromHeight(laggingAlbedo, { strength: 2.0 }),
    roughness: 0.80, metalness: 0.0,
  });

  const box = async (name, w, h, d, r, position, mat, rotation, parent) =>
    createPart(name, await uv(await roundedBoxGeo(w, h, d, r)), mat, {
      position, rotation, parent: parent ?? root,
    });

  // ---------- Bedplate ----------
  await box('Plinth', 3.90, 0.30, 1.90, 0.03, [0, 0.15, 0], stone);
  await box('Bedplate', 3.60, 0.14, 1.62, 0.02, [0, 0.37, 0], iron);
  // Hold-down bolts around the bedplate edge.
  for (let i = 0; i < 10; i++) {
    const x = -1.62 + (i / 9) * 3.24;
    for (const sz of [-1, 1]) {
      createPart(`BedBolt_${i}${sz > 0 ? 'R' : 'L'}`, cylinderGeo(0.032, 0.032, 0.06, 8), steel, {
        position: [x, 0.46, sz * 0.72], parent: root,
      });
    }
  }

  // ---------- Entablature columns ----------
  // Four Doric columns carrying the beam. The engine house style is the whole
  // charm of these machines: they were built to be looked at.
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const nm = `${sx > 0 ? 'F' : 'B'}${sz > 0 ? 'R' : 'L'}`;
      const at = [sx * 0.46, 0, sz * 0.56];
      await box(`ColBase_${nm}`, 0.34, 0.12, 0.34, 0.02, [at[0], 0.50, at[2]], iron);
      createPart(`Column_${nm}`, await uv(await revolveProfile([
        [0.000, 0.00], [0.132, 0.00], [0.126, 0.10], [0.112, 1.00],
        [0.104, 1.78], [0.118, 1.86], [0.116, 1.94], [0.000, 1.94],
      ], { segments: 24, axis: 'y', smooth: true })), iron, {
        position: [at[0], 0.56, at[2]], parent: root,
      });
      await box(`ColCap_${nm}`, 0.30, 0.10, 0.30, 0.018, [at[0], 2.55, at[2]], iron);
    }
  }
  // Entablature: the frame the beam bearing sits in.
  for (const sz of [-1, 1]) {
    await box(`Entab_${sz > 0 ? 'R' : 'L'}`, 1.36, 0.18, 0.26, 0.025, [0, 2.69, sz * 0.56], iron);
  }
  await box('EntabCross', 0.36, 0.16, 1.38, 0.025, [0, 2.69, 0], iron);
  // Trunnion bearing pedestal and its brass caps.
  await box('TrunnionBlock', 0.46, 0.24, 0.62, 0.03, [0, 2.86, 0], iron);
  for (const sz of [-1, 1]) {
    createPart(`TrunnionCap_${sz > 0 ? 'R' : 'L'}`, cylinderZGeo(0.098, 0.098, 0.10, 20), brass, {
      position: [0, 2.86, sz * 0.32], parent: root,
    });
    createPart(`Oiler_${sz > 0 ? 'R' : 'L'}`, revolveProfile ? sphereGeo(0.036, 12, 8) : sphereGeo(0.036, 12, 8), brass, {
      position: [0, 2.99, sz * 0.32], parent: root,
    });
  }

  // ---------- The beam ----------
  // Everything that rocks lives under this pivot, so the animation moves one
  // node and the strapwork, end pins and bolts come with it.
  const beam = createPivot('Beam', BEAM_PIVOT, root);
  const beamProfile = [
    [-1.30, 0.030], [-1.06, 0.170], [0, 0.290], [1.06, 0.170], [1.30, 0.030],
    [1.30, -0.030], [1.06, -0.170], [0, -0.290], [-1.06, -0.170], [-1.30, -0.030],
  ];
  createPart('BeamWeb', await uv(await extrudeProfile(beamProfile, {
    depth: 0.20, axis: 'z', bevel: 0.014,
  })), iron, { parent: beam });
  // Strapwork: the wrought-iron straps a cast beam was reinforced with.
  for (const sx of [-1, 1]) {
    await box(`BeamStrap_${sx > 0 ? 'F' : 'B'}`, 0.06, 0.30, 0.24, 0.012,
      [sx * 0.72, 0, 0], steel, undefined, beam);
    createPart(`BeamEndPin_${sx > 0 ? 'F' : 'B'}`, cylinderZGeo(0.062, 0.062, 0.34, 16), brass, {
      position: [sx * BEAM_HALF, 0, 0], parent: beam,
    });
    createPart(`BeamEndBoss_${sx > 0 ? 'F' : 'B'}`, cylinderZGeo(0.098, 0.098, 0.22, 16), iron, {
      position: [sx * BEAM_HALF, 0, 0], parent: beam,
    });
  }
  createPart('BeamHubBoss', cylinderZGeo(0.130, 0.130, 0.26, 20), iron, { parent: beam });
  // Bolt rows down the beam web, the detail that says cast and bolted.
  for (let i = 0; i < 7; i++) {
    const x = -0.90 + i * 0.30;
    for (const sy of [-1, 1]) {
      createPart(`BeamBolt_${i}${sy > 0 ? 'T' : 'B'}`, cylinderZGeo(0.020, 0.020, 0.23, 8), steel, {
        position: [x, sy * (0.115 - Math.abs(x) * 0.055), 0], parent: beam,
      });
    }
  }

  // ---------- Cylinder ----------
  // Lagged, banded, and standing on its own base. The piston rod comes out of
  // the top and runs up to the beam.
  await box('CylBase', 0.78, 0.16, 0.78, 0.025, [CYL_X, 0.52, 0], iron);
  createPart('CylBody', await uv(await revolveProfile([
    [0.000, 0.00], [0.330, 0.00], [0.330, 0.10], [0.300, 0.14],
    [0.300, 1.06], [0.330, 1.10], [0.330, 1.20], [0.000, 1.20],
  ], { segments: 32, axis: 'y', smooth: true })), lagging, {
    position: [CYL_X, 0.60, 0], parent: root,
  });
  for (let i = 0; i < 4; i++) {
    createPart(`CylBand_${i}`, torusGeo(0.312, 0.020, 8, 32), brass, {
      position: [CYL_X, 0.82 + i * 0.24, 0], rotation: [90, 0, 0], parent: root,
    });
  }
  createPart('CylTopCover', cylinderGeo(0.345, 0.345, 0.09, 32), iron,
    { position: [CYL_X, 1.84, 0], parent: root });
  createPart('CylStuffingBox', cylinderGeo(0.115, 0.140, 0.16, 20), brass,
    { position: [CYL_X, 1.94, 0], parent: root });
  // Cover bolts.
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    createPart(`CylCoverBolt_${i}`, cylinderGeo(0.020, 0.020, 0.05, 8), steel, {
      position: [CYL_X + Math.cos(a) * 0.295, 1.90, Math.sin(a) * 0.295], parent: root,
    });
  }
  // Steam chest and pipework on the outboard face.
  await box('SteamChest', 0.20, 0.72, 0.30, 0.025, [CYL_X + 0.40, 1.16, 0], iron);
  createPart('SteamPipe', cylinderGeo(0.070, 0.070, 0.90, 16), brass,
    { position: [CYL_X + 0.40, 0.98, 0.34], rotation: [12, 0, 0], parent: root });
  createPart('SteamElbow', torusGeo(0.070, 0.070, 8, 18), brass,
    { position: [CYL_X + 0.40, 1.54, 0.28], rotation: [0, 90, 0], parent: root });

  // ---------- Piston rod and crosshead ----------
  const pist = createPivot('PistonRod', [CYL_X, 0, 0], root);
  createPart('PistonRod', cylinderGeo(0.048, 0.048, 1.05, 16), steel,
    { position: [0, 2.36, 0], parent: pist });
  await box('Crosshead', 0.20, 0.16, 0.30, 0.03, [0, 2.79, 0], iron, undefined, pist);
  createPart('CrossheadPin', cylinderZGeo(0.052, 0.052, 0.40, 14), brass,
    { position: [0, 2.79, 0], parent: pist });
  // Watt's parallel motion, as geometry. See the header: it is not articulated.
  for (const sz of [-1, 1]) {
    beamBetween(`ParallelLink_${sz > 0 ? 'R' : 'L'}`,
      [CYL_X - 0.02, 2.76, sz * 0.13], [CYL_X - 0.46, 2.56, sz * 0.13], 0.022, iron, { parent: root });
  }

  // ---------- Flywheel and crank ----------
  const fly = createPivot('Flywheel', [CRANK[0], CRANK[1], FLYWHEEL_Z], root);
  // No solid web between the spokes: the first pass had a full disc face here,
  // which hid all eight spokes and turned the flywheel into a plate.
  createPart('FlywheelRim', torusGeo(0.700, 0.070, 12, 56), iron, { parent: fly });
  createPart('FlywheelRimInner', torusGeo(0.640, 0.030, 8, 48), iron, { parent: fly });
  createPart('FlywheelHub', cylinderZGeo(0.140, 0.140, 0.28, 22), iron, { parent: fly });
  const flySpoke = createPart('FlywheelSpoke0',
    await uv(await roundedBoxGeo(0.075, 0.58, 0.075, 0.020)), iron,
    { position: [0, 0.40, 0], parent: fly });
  arrayRadial('FlywheelSpoke', flySpoke, 8, 'z', fly);

  // Main shaft runs from the flywheel through its bearing to the crank.
  createPart('MainShaft', cylinderZGeo(0.075, 0.075, 0.90, 20), steel,
    { position: [CRANK[0], CRANK[1], 0.42], parent: root });
  await box('ShaftPedestal', 0.42, 0.66, 0.30, 0.03, [CRANK[0], 0.78, 0.16], iron);
  createPart('ShaftBearing', cylinderZGeo(0.115, 0.115, 0.22, 20), brass,
    { position: [CRANK[0], CRANK[1], 0.16], parent: root });

  // The crank turns with the flywheel; the connecting rod hangs off its pin.
  const crank = createPivot('Crank', CRANK, root);
  await box('CrankWeb', 0.44, 0.16, 0.09, 0.025, [CRANK_THROW / 2, 0, 0], steel, undefined, crank);
  createPart('CrankPin', cylinderZGeo(0.055, 0.055, 0.20, 16), brass,
    { position: [CRANK_THROW, 0, 0], parent: crank });

  // The connecting rod is a CHILD of the crank, so it inherits the pin's orbit
  // and only needs to correct its own angle. Built pointing +Y from the pin.
  const rod = createPivot('ConRod', [CRANK_THROW, 0, 0], crank);
  createPart('ConRodShaft', cylinderGeo(0.052, 0.064, ROD_LEN - 0.16, 16), steel,
    { position: [0, ROD_LEN / 2, 0], parent: rod });
  createPart('ConRodBigEnd', cylinderZGeo(0.090, 0.090, 0.16, 18), brass, { parent: rod });
  createPart('ConRodSmallEnd', cylinderZGeo(0.072, 0.072, 0.15, 18), brass,
    { position: [0, ROD_LEN, 0], parent: rod });
  for (const sy of [0, 1]) {
    createPart(`ConRodStrap_${sy}`, await uv(await roundedBoxGeo(0.15, 0.09, 0.19, 0.020)), steel,
      { position: [0, sy * ROD_LEN + (sy ? -0.10 : 0.10), 0], parent: rod });
  }

  // ---------- Governor ----------
  // Watt's centrifugal governor, on its own pedestal, belt-driven off the
  // shaft. It spins, which is most of why these engines look alive.
  await box('GovPedestal', 0.26, 0.92, 0.26, 0.03, [-0.30, 1.00, -0.62], iron);
  const gov = createPivot('Governor', [-0.30, 1.46, -0.62], root);
  createPart('GovSpindle', cylinderGeo(0.030, 0.030, 0.44, 12), steel, { position: [0, 0.10, 0], parent: gov });
  createPart('GovCollar', cylinderGeo(0.070, 0.070, 0.05, 16), brass, { position: [0, 0.30, 0], parent: gov });
  for (const sx of [-1, 1]) {
    beamBetween(`GovArm_${sx > 0 ? 'A' : 'B'}`,
      [0, 0.30, 0], [sx * 0.20, -0.02, 0], 0.014, steel, { parent: gov });
    createPart(`GovBall_${sx > 0 ? 'A' : 'B'}`, sphereGeo(0.062, 16, 12), brass,
      { position: [sx * 0.23, -0.06, 0], parent: gov });
    beamBetween(`GovLink_${sx > 0 ? 'A' : 'B'}`,
      [sx * 0.16, 0.06, 0], [0, -0.10, 0], 0.010, steel, { parent: gov });
  }
  createPart('GovCap', cylinderGeo(0.045, 0.045, 0.05, 14), brass, { position: [0, 0.34, 0], parent: gov });

  return root;
}

// The four-bar solve. For a crank angle, find the beam angle that keeps the
// connecting rod exactly ROD_LEN long, then read the rod's own angle off the
// two endpoints. Bisection, because the distance function is monotonic in the
// beam angle over the range the beam can physically reach and 40 halvings is
// far more precision than a keyframe needs.
function animate() {
  const FRAMES = 24;
  const DUR = 3.0;
  const DEG = 180 / Math.PI;

  const pinAt = (theta) => [
    CRANK[0] + CRANK_THROW * Math.cos(theta),
    CRANK[1] + CRANK_THROW * Math.sin(theta),
  ];
  const beamEndAt = (phi) => [
    -BEAM_HALF * Math.cos(phi),
    BEAM_PIVOT[1] - BEAM_HALF * Math.sin(phi),
  ];
  const solvePhi = (theta) => {
    const P = pinAt(theta);
    // f decreases as phi grows, because the beam end swings down toward the pin.
    const f = (phi) => {
      const E = beamEndAt(phi);
      return Math.hypot(E[0] - P[0], E[1] - P[1]) - ROD_LEN;
    };
    let lo = -0.6;
    let hi = 0.6;
    for (let i = 0; i < 40; i++) {
      const m = (lo + hi) / 2;
      if (f(m) > 0) lo = m; else hi = m;
    }
    return (lo + hi) / 2;
  };

  const beamKeys = [];
  const flyKeys = [];
  const crankKeys = [];
  const rodKeys = [];
  const pistonKeys = [];
  const govKeys = [];

  for (let i = 0; i <= FRAMES; i++) {
    const t = (i / FRAMES) * DUR;
    const theta = (i / FRAMES) * Math.PI * 2;
    const phi = solvePhi(theta);
    const P = pinAt(theta);
    const E = beamEndAt(phi);
    // World angle of the rod, then strip the parent crank's rotation. A part
    // built along +Y and turned by a about Z points at (-sin a, cos a), so
    // reaching heading psi needs a = psi - 90 degrees.
    const psi = Math.atan2(E[1] - P[1], E[0] - P[0]);
    const rodLocal = (psi - Math.PI / 2 - theta) * DEG;

    beamKeys.push({ time: t, rotation: [0, 0, phi * DEG] });
    flyKeys.push({ time: t, rotation: [0, 0, theta * DEG] });
    crankKeys.push({ time: t, rotation: [0, 0, theta * DEG] });
    rodKeys.push({ time: t, rotation: [0, 0, rodLocal] });
    // The far beam end lifts as the near end falls, and the piston rod follows.
    pistonKeys.push({ time: t, position: [0, BEAM_HALF * Math.sin(phi), 0] });
    govKeys.push({ time: t, rotation: [0, theta * 2 * DEG, 0] });
  }

  return [createClip('Run', DUR, [
    rotationTrack('Joint_Beam', beamKeys),
    rotationTrack('Joint_Flywheel', flyKeys),
    rotationTrack('Joint_Crank', crankKeys),
    rotationTrack('Joint_ConRod', rodKeys),
    positionTrack('Joint_PistonRod', pistonKeys),
    rotationTrack('Joint_Governor', govKeys),
  ])];
}

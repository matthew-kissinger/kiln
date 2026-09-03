// A Victorian cast-iron street lamp.
//
// Where the field gun is a study in booleans and arrays, this one is a study in
// revolved profiles: the plinth mouldings, the column entasis, the collar, the
// roof and the finial are all single revolves, because a turned or cast part
// gets its whole character from a silhouette curve that a stack of cylinders
// cannot reproduce.
//
// It is also the emissive/glass example for this repository. The lantern carries
// real BLEND glass over an emissive burner, which on the CPU rasterizer is
// invisible and on a GPU render is most of the asset.
//
// Two things were wrong in the first pass and both are worth recording.
//
// 1. Painted cast iron was authored at metalness 0.55 over a near-black albedo.
//    Paint is a DIELECTRIC. A dark metal is a black mirror: with no environment
//    to reflect it returns almost nothing, and the whole lamp rendered as a
//    featureless silhouette with the flutes, mouldings and scrollwork invisible.
//    The fix is metalness 0.08 and a lifted albedo value, not a brighter light.
// 2. The lantern was scaled off the column instead of off a person. A real gas
//    lamp head is roughly two feet tall and reads as the subject of the object;
//    a small one turns the whole asset into a pole.
//
// Authored by: Claude Opus 5, via Claude Code. Every part below was written by the model itself,
// looking at its own renders through the Kiln tools and revising.
const meta = { name: 'StreetLamp', category: 'prop', role: 'poi' };

async function build() {
  const root = createRoot('StreetLamp');
  const uv = (g) => autoUnwrap(g, { resolution: 512 });

  // ---------- Materials ----------
  // Painted cast iron: municipal near-black with a green cast. Value is lifted
  // well off black so the cast detail survives, and metalness stays low because
  // what the eye reads here is thick paint over iron, not bare metal.
  const ironAlbedo = proceduralTexture({
    schemaVersion: 2, size: 512, usage: 'albedo', name: 'CastIron',
    layers: [
      { op: 'solid', color: 0x4c574f },
      { op: 'noise', colorA: 0x36403a, colorB: 0x6c7972, scale: 12, octaves: 4, seed: 5, blend: 'overlay', opacity: 0.6 },
      { op: 'noise', colorA: 0x2a322e, colorB: 0x4c574f, scale: 3, octaves: 3, seed: 17, blend: 'multiply', opacity: 0.22 },
    ],
  });
  const castIron = pbrMaterial({
    albedo: ironAlbedo, normal: normalMapFromHeight(ironAlbedo, { strength: 3.5 }),
    roughness: 0.55, metalness: 0.08,
  });

  const brassAlbedo = proceduralTexture({
    schemaVersion: 2, size: 256, usage: 'albedo', name: 'Brass',
    layers: [
      { op: 'solid', color: 0xa8873f },
      { op: 'noise', colorA: 0x7e6430, colorB: 0xc9a75c, scale: 8, octaves: 3, seed: 9, blend: 'overlay', opacity: 0.5 },
    ],
  });
  const brass = pbrMaterial({
    albedo: brassAlbedo, normal: normalMapFromHeight(brassAlbedo, { strength: 1.6 }),
    roughness: 0.32, metalness: 0.9,
  });

  // Glass is BLEND, so it needs no UVs and must not be atlassed.
  const glass = glassMaterial(0xcfe4e8, { opacity: 0.20, roughness: 0.06, metalness: 0 });
  // The burner. Emissive is the one material cue a flat render cannot fake.
  const flame = gameMaterial(0xffd89a, { emissive: 0xffbb55, emissiveIntensity: 2.6, roughness: 0.4 });

  // ---------- Plinth ----------
  // Octagonal, as a real lamp base is, and stepped rather than a single block.
  // With vertices offset by half a segment the octagon puts a FLAT FACE on +X,
  // which is what the access door is mounted to below.
  const oct = (r) => Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    return [Math.cos(a) * r, Math.sin(a) * r];
  });
  createPart('PlinthLower', await uv(await extrudeProfile(oct(0.46), { depth: 0.18, axis: 'y', bevel: 0.022 })), castIron, {
    position: [0, 0.09, 0], parent: root,
  });
  createPart('PlinthUpper', await uv(await extrudeProfile(oct(0.37), { depth: 0.22, axis: 'y', bevel: 0.018 })), castIron, {
    position: [0, 0.29, 0], parent: root,
  });

  // Access door for the gas main, on the flat +X face. Real lamp bases have one
  // and it is the single detail that says the object was serviced by somebody.
  const doorFace = 0.37 * Math.cos(Math.PI / 8);
  createPart('AccessDoor', await uv(await roundedBoxGeo(0.030, 0.170, 0.220, 0.012)), castIron, {
    position: [doorFace + 0.010, 0.30, 0], parent: root,
  });
  for (const sz of [-1, 1]) {
    createPart(`DoorHinge_${sz > 0 ? 'R' : 'L'}`, cylinderGeo(0.014, 0.014, 0.048, 8), castIron, {
      position: [doorFace + 0.022, 0.30, sz * 0.098], parent: root,
    });
  }
  createPart('DoorBoss', cylinderXGeo(0.016, 0.016, 0.030, 10), brass, {
    position: [doorFace + 0.026, 0.30, -0.062], parent: root,
  });

  // Base moulding: the flare from plinth to column, in one revolve.
  createPart('BaseMoulding', await uv(await revolveProfile([
    [0.000, 0.40], [0.345, 0.40], [0.312, 0.47], [0.242, 0.52],
    [0.206, 0.60], [0.171, 0.68], [0.140, 0.78], [0.000, 0.78],
  ], { segments: 40, axis: 'y', bevel: 0.006 })), castIron, { parent: root });

  // Foundation bolts around the flare. Eight of them, the count a real casting
  // would use, arrayed rather than hand-placed.
  const bolt = createPart('Bolt0', sphereGeo(0.024, 10, 8), castIron, { position: [0.276, 0.505, 0], parent: root });
  arrayRadial('Bolt', bolt, 8, 'y', root);

  // ---------- Column ----------
  // Entasis: the shaft swells slightly low down and tapers to the collar. A
  // straight cylinder here is the single clearest tell of a generated lamppost.
  createPart('Column', await uv(await revolveProfile([
    [0.000, 0.78], [0.128, 0.78], [0.132, 1.00], [0.126, 1.45],
    [0.113, 2.00], [0.098, 2.55], [0.089, 2.92], [0.000, 2.92],
  ], { segments: 40, axis: 'y', smooth: true })), castIron, { parent: root });

  // Flutes. Twelve of them, and each is a beam between two points ON the taper
  // rather than a straight cylinder at a fixed radius, which is why they stay
  // half-buried the whole way up instead of sinking at the bottom and floating
  // at the top.
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    beamBetween(`Flute_${i}`,
      [Math.cos(a) * 0.119, 0.84, Math.sin(a) * 0.119],
      [Math.cos(a) * 0.083, 2.60, Math.sin(a) * 0.083],
      0.015, castIron, { parent: root });
  }

  // A cast joint band partway up, where a real column comes in two sections.
  createPart('JointBand', await uv(await revolveProfile([
    [0.000, 1.46], [0.128, 1.46], [0.146, 1.50], [0.146, 1.58],
    [0.128, 1.62], [0.000, 1.62],
  ], { segments: 32, axis: 'y', bevel: 0.005 })), castIron, { parent: root });

  // Capital under the lantern. The lantern floor lands on top of it, so the
  // head reads as seated rather than stacked.
  createPart('Collar', await uv(await revolveProfile([
    [0.000, 2.80], [0.096, 2.80], [0.158, 2.89], [0.158, 2.96],
    [0.122, 3.01], [0.114, 3.04], [0.000, 3.04],
  ], { segments: 40, axis: 'y', bevel: 0.006 })), castIron, { parent: root });

  // Scroll brackets: four cast curls springing from the capital to the underside
  // of the lantern floor overhang. Bezier into a swept tube, which is the only
  // way to get a curl that reads as ironwork.
  //
  // The first pass bowed these out to 0.40 m across half a metre of column. Four
  // of them at that size overlap from every side view into one continuous torus,
  // and a hoop hanging off a lamppost is not a thing that exists. A bracket has
  // to be small enough to read as a bracket: it reaches less far than the thing
  // it supports, and it tucks under it.
  const scrollPath = bezierCurve([
    [0.105, 2.80, 0], [0.275, 2.83, 0], [0.300, 2.96, 0], [0.210, 3.00, 0],
  ], 26);
  const scroll = createPart('Scroll0', curveToMesh(scrollPath, 0.022, 26, 8), castIron, { parent: root });
  arrayRadial('Scroll', scroll, 4, 'y', root);

  // ---------- Lantern ----------
  // Hexagonal and deliberately large: about 0.7 m of glass on a 4.6 m lamp, so
  // the head reads as the subject and the column as its support. It is also a
  // little WIDER than it is tall, which is what separates a lamp head from a
  // lantern on a stick.
  const LANT_R0 = 0.325;   // radius at the lantern floor
  const LANT_R1 = 0.265;   // radius at the lantern shoulder
  const LANT_Y0 = 3.16;
  const LANT_Y1 = 3.92;

  createPart('LanternFloor', await uv(await revolveProfile([
    [0.000, 3.00], [0.355, 3.00], [0.355, 3.11], [0.298, 3.18], [0.000, 3.18],
  ], { segments: 6, axis: 'y', bevel: 0.008 })), castIron, { parent: root });

  // Six corner posts, leaning in with the taper, plus the shoulder and sill
  // rails they land on. Without the rails the posts read as six loose sticks.
  const corner = (i, r, y) => {
    const a = (i / 6) * Math.PI * 2;
    return [Math.cos(a) * r, y, Math.sin(a) * r];
  };
  for (let i = 0; i < 6; i++) {
    // beamBetween creates the part itself; it is not a geometry factory.
    beamBetween(`LanternPost_${i}`, corner(i, LANT_R0, LANT_Y0), corner(i, LANT_R1, LANT_Y1), 0.024, castIron, { parent: root });
    beamBetween(`ShoulderRail_${i}`, corner(i, LANT_R1, LANT_Y1), corner((i + 1) % 6, LANT_R1, LANT_Y1), 0.020, castIron, { parent: root });
    beamBetween(`SillRail_${i}`, corner(i, LANT_R0, LANT_Y0 + 0.02), corner((i + 1) % 6, LANT_R0, LANT_Y0 + 0.02), 0.018, castIron, { parent: root });
  }

  // Glass panels, inset just behind the posts so they do not z-fight the frame.
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const rMid = (LANT_R0 + LANT_R1) / 2 - 0.014;
    const pane = createPart(`Glass_${i}`, boxGeo(0.006, LANT_Y1 - LANT_Y0 - 0.06, 0.300), glass, {
      position: [Math.cos(a) * rMid, (LANT_Y0 + LANT_Y1) / 2, Math.sin(a) * rMid],
      parent: root,
    });
    pane.rotation.y = -a;
  }

  // One of the six lights is the hinged access pane the lamplighter opened to
  // reach the burner: a raised frame, two hinges down one edge and a brass latch
  // on the other. Six identical panes is the tell that nobody ever had to open
  // this thing, and asymmetry is most of what makes a repeated array read as a
  // manufactured object rather than a generated one.
  const aDoor = Math.PI / 6;
  const rDoor = (LANT_R0 + LANT_R1) / 2 + 0.008;
  const nx = Math.cos(aDoor), nz = Math.sin(aDoor);
  const tx = -Math.sin(aDoor), tz = Math.cos(aDoor);
  const halfW = 0.125, yLo = LANT_Y0 + 0.04, yHi = LANT_Y1 - 0.06;
  const cnr = (sw, y) => [nx * rDoor + tx * sw * halfW, y, nz * rDoor + tz * sw * halfW];
  beamBetween('PaneFrameBottom', cnr(-1, yLo), cnr(1, yLo), 0.011, castIron, { parent: root });
  beamBetween('PaneFrameTop', cnr(-1, yHi), cnr(1, yHi), 0.011, castIron, { parent: root });
  beamBetween('PaneFrameHingeSide', cnr(-1, yLo), cnr(-1, yHi), 0.011, castIron, { parent: root });
  beamBetween('PaneFrameLatchSide', cnr(1, yLo), cnr(1, yHi), 0.011, castIron, { parent: root });
  for (const s of [-1, 1]) {
    createPart(`PaneHinge_${s > 0 ? 'Upper' : 'Lower'}`, sphereGeo(0.019, 10, 8), castIron, {
      position: cnr(-1, (yLo + yHi) / 2 + s * 0.21), parent: root,
    });
  }
  createPart('PaneLatch', sphereGeo(0.017, 10, 8), brass, { position: cnr(1, (yLo + yHi) / 2), parent: root });

  // The burner inside: mantle, gallery ring and feed pipe. Small, bright, and
  // only visible through the glass.
  createPart('Burner', sphereGeo(0.078, 20, 14), flame, { position: [0, 3.55, 0], parent: root });
  createPart('BurnerGallery', torusGeo(0.086, 0.012, 8, 18), brass, { position: [0, 3.46, 0], parent: root });
  createPart('BurnerStem', cylinderGeo(0.020, 0.020, 0.34, 10), brass, { position: [0, 3.32, 0], parent: root });

  // ---------- Roof and finial ----------
  // An ogee: a near-vertical drip edge, then a slope that FLATTENS toward the
  // apex. The first pass was a 45-degree cone, and a cone with a tapered brass
  // point on top does not read as a lamp roof, it reads as a tiki torch.
  createPart('Roof', await uv(await revolveProfile([
    [0.000, 3.88], [0.385, 3.88], [0.362, 3.95], [0.272, 4.03],
    [0.145, 4.10], [0.000, 4.14],
  ], { segments: 6, axis: 'y', smooth: false })), castIron, { parent: root });

  // Six hip ribs on the roof, so it does not read as a smooth dome.
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    beamBetween(`RoofRib_${i}`,
      [Math.cos(a) * 0.368, 3.92, Math.sin(a) * 0.368], [0, 4.13, 0], 0.015, castIron, { parent: root });
  }

  // Vent cowl. A gas lamp has to breathe, and the cowl is what stops the finial
  // from growing straight out of the roof like a spike.
  createPart('Cowl', await uv(await revolveProfile([
    [0.000, 4.10], [0.102, 4.12], [0.096, 4.19], [0.070, 4.23],
    [0.070, 4.26], [0.000, 4.26],
  ], { segments: 24, axis: 'y', bevel: 0.005 })), castIron, { parent: root });

  // Ball-and-spike finial, in CAST IRON. It was one tapered brass revolve and it
  // read as a flame: orange, pointed, sitting on the apex. That is the hazard of
  // putting the only warm material in the asset at the very top of the
  // silhouette. A ball with a waist under it is unmistakably cast, and the brass
  // collar keeps the gilded accent without the shape that read as fire.
  createPart('FinialStem', cylinderGeo(0.030, 0.024, 0.10, 12), castIron, { position: [0, 4.29, 0], parent: root });
  createPart('FinialCollar', torusGeo(0.036, 0.011, 8, 16), brass, { position: [0, 4.33, 0], parent: root });
  createPart('FinialBall', sphereGeo(0.060, 16, 12), castIron, { position: [0, 4.41, 0], parent: root });
  createPart('FinialSpike', coneGeo(0.026, 0.16, 10), castIron, { position: [0, 4.53, 0], parent: root });

  // Ladder rest: the pair of stub arms a lamplighter leaned a ladder against,
  // each with the short diagonal strut that carried the load. The kind of detail
  // that says the object had a job.
  //
  // Sized down twice. The first pass reached 0.36 m with a quarter-metre
  // diagonal strut under each arm, and from the front the four members drew a
  // downward chevron that made the lamp read as a crossbow. Shortening the arms
  // was not enough: the strut IS the chevron, so it is gone and only the two
  // stub lugs remain, which is what a real rest looks like anyway.
  for (const sz of [-1, 1]) {
    beamBetween(`LadderArm_${sz > 0 ? 'R' : 'L'}`,
      [0, 2.31, sz * 0.090], [0, 2.32, sz * 0.235], 0.020, castIron, { parent: root });
  }

  return root;
}

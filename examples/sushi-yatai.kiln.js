// A yatai: the mobile sushi stall you eat at standing up.
//
// Authored by: Claude Opus 5, via Claude Code. Every part below was written by
// the model itself, looking at its own renders through the Kiln tools and
// revising. Not a line of it is hand-authored.
//
// The other heroes are solid objects -- a gun, a helmet, a walker -- and their
// shape is a surface you could put your hand on. A yatai is a FRAME. It is
// posts, slats, a counter and a roof, and more than half of what you see
// through it is the background. That makes it the hardest of the set to fake,
// because a solid object can hide sloppy interior construction behind its own
// skin and this cannot: every joint is visible from the customer side.
//
// So the technique here is REPETITION WITH VARIATION. Slats, roof battens,
// menu tags and lantern ribs are all arrays, and an array is the fastest way to
// make an asset look generated. Three things break that up:
//
//   1. Every run of slats uses a prime-ish count against its span, so the
//      spacing never lands on a tidy fraction of the frame behind it.
//   2. The menu tags are individually rotated by a small pseudo-random angle
//      derived from their index. Real paper tags hang crooked; identical
//      tags hanging plumb read as a texture, not as objects.
//   3. The two lanterns are deliberately NOT a mirrored pair -- different
//      heights, different hang angles, one riding higher on its cord.
//
// The other lesson is warm emissive. A chochin is a paper bag with a bulb in
// it, so it is bright AND translucent AND it lights nothing else here, because
// this renderer has no global illumination. Cranking emissiveIntensity to fake
// a glow just clips the paper to white and loses the ribs. The lanterns read as
// lit because their albedo is a saturated orange-red at moderate emissive, and
// because everything within half a metre of them is dark timber.
const meta = { name: 'SushiYatai', category: 'architecture', role: 'hero' };

async function build() {
  const root = createRoot('SushiYatai');
  const uv = (g) => autoUnwrap(g, { resolution: 1024 });

  // ---------- Dimensions ----------
  // A real yatai is small: two or three customers wide, and short enough that
  // one person can pull it. Getting this wrong is the fastest way to make it
  // read as a garden shed.
  const HALF_Z = 1.18;   // half the counter length
  const POST_X = 0.40;   // posts inboard of the counter edge
  const COUNTER_Y = 0.95;
  const ROOF_Y = 2.06;

  // ---------- Materials ----------
  // Hinoki/cedar: the pale, warm, slightly pink timber a stall is built from.
  // The grain is a high-count stripe, not noise -- noise gives you dirty
  // plywood, and stripes running along the length of a member is what actually
  // says "sawn board".
  const cedarAlbedo = proceduralTexture({
    schemaVersion: 2, size: 1024, usage: 'albedo', name: 'Hinoki',
    layers: [
      { op: 'solid', color: 0xc9a071 },
      { op: 'stripes', colorA: 0xb98d5e, colorB: 0xd6b083, count: 96, angleDeg: 0, blend: 'overlay', opacity: 0.40 },
      { op: 'noise', colorA: 0x9d7449, colorB: 0xdcbb92, scale: 26, octaves: 4, seed: 7, blend: 'overlay', opacity: 0.35 },
      { op: 'noise', colorA: 0x6f5233, colorB: 0xc9a071, scale: 7, octaves: 2, seed: 19, blend: 'multiply', opacity: 0.16 },
    ],
  });
  const cedar = pbrMaterial({
    albedo: cedarAlbedo, normal: normalMapFromHeight(cedarAlbedo, { strength: 2.0 }),
    roughness: 0.74, metalness: 0.0,
  });

  // Structural timber, oiled darker with age and hand-grease. Posts and beams
  // are a different value from the panelling so the frame reads as a frame.
  const beamAlbedo = proceduralTexture({
    schemaVersion: 2, size: 512, usage: 'albedo', name: 'OiledPost',
    layers: [
      { op: 'solid', color: 0x6b4a2f },
      { op: 'stripes', colorA: 0x5c3f27, colorB: 0x7d5838, count: 72, angleDeg: 0, blend: 'overlay', opacity: 0.45 },
      { op: 'noise', colorA: 0x412c1b, colorB: 0x7d5838, scale: 22, octaves: 4, seed: 13, blend: 'overlay', opacity: 0.40 },
    ],
  });
  const beamWood = pbrMaterial({
    albedo: beamAlbedo, normal: normalMapFromHeight(beamAlbedo, { strength: 2.2 }),
    roughness: 0.78, metalness: 0.0,
  });

  // Indigo noren. Cotton, so it is rough and completely non-metallic; the
  // horizontal band is where a shop's name would be dyed.
  const norenAlbedo = proceduralTexture({
    schemaVersion: 2, size: 512, usage: 'albedo', name: 'NorenIndigo',
    layers: [
      { op: 'solid', color: 0x1f3557 },
      { op: 'noise', colorA: 0x18293f, colorB: 0x2c4a74, scale: 34, octaves: 3, seed: 5, blend: 'overlay', opacity: 0.45 },
      { op: 'stripes', colorA: 0xe8e2d2, colorB: 0x1f3557, count: 3, angleDeg: 0, blend: 'normal', opacity: 0.30 },
    ],
  });
  const noren = pbrMaterial({
    albedo: norenAlbedo, normal: normalMapFromHeight(norenAlbedo, { strength: 1.2 }),
    roughness: 0.94, metalness: 0.0,
  });

  // Lantern paper. Saturated, warm, and only moderately emissive -- see header.
  const lanternPaper = gameMaterial(0xff7a3c, {
    emissive: 0xff5a1e, emissiveIntensity: 1.35, roughness: 0.68, metalness: 0.0,
  });
  const lacquer = gameMaterial(0x1b1512, { roughness: 0.32, metalness: 0.04 });

  // Stainless: the counter top insert and the neta case frame. The one genuinely
  // metallic thing on the cart, which is why the counter reads as a work surface.
  const steelAlbedo = proceduralTexture({
    schemaVersion: 2, size: 512, usage: 'albedo', name: 'BrushedSteel',
    layers: [
      { op: 'solid', color: 0x9aa0a6 },
      { op: 'stripes', colorA: 0x8c9298, colorB: 0xb0b6bc, count: 120, angleDeg: 0, blend: 'overlay', opacity: 0.35 },
    ],
  });
  const steel = pbrMaterial({
    albedo: steelAlbedo, normal: normalMapFromHeight(steelAlbedo, { strength: 0.8 }),
    roughness: 0.34, metalness: 0.92,
  });

  const caseGlass = glassMaterial(0xd8ecef, { opacity: 0.22, roughness: 0.04, metalness: 0 });
  const roofCanvas = gameMaterial(0x2a2622, { roughness: 0.88, metalness: 0.02 });

  // ---------- Helpers ----------
  const box = async (name, w, h, d, r, position, mat = cedar, rotation) =>
    createPart(name, await uv(await roundedBoxGeo(w, h, d, r)), mat, { position, rotation, parent: root });

  // ---------- Chassis ----------
  // Two longitudinal skids with cross members. The cart has to look like it
  // could actually be pulled, which means the load path runs into the wheels.
  for (const sx of [-1, 1]) {
    await box(`Skid_${sx > 0 ? 'F' : 'B'}`, 0.10, 0.13, HALF_Z * 2 + 0.10, 0.02,
      [sx * 0.38, 0.46, 0], beamWood);
  }
  for (let i = 0; i < 4; i++) {
    const z = -0.86 + i * 0.573;
    await box(`CrossMember_${i}`, 0.92, 0.09, 0.09, 0.018, [0, 0.46, z], beamWood);
  }

  // ---------- Wheels ----------
  // Two only, at the back. A yatai rests on drop-down legs at the front, which
  // is both true and useful: it tips the whole silhouette slightly and stops
  // the cart reading as a symmetrical box on casters.
  for (const sz of [-1, 1]) {
    const hub = createPivot(`WheelHub_${sz > 0 ? 'R' : 'L'}`, [-0.34, 0.40, sz * 0.56], root);
    createPart(`WheelRim_${sz > 0 ? 'R' : 'L'}`, torusGeo(0.355, 0.045, 10, 44), beamWood, { parent: hub });
    createPart(`WheelTyre_${sz > 0 ? 'R' : 'L'}`, torusGeo(0.398, 0.022, 8, 44), steel, { parent: hub });
    createPart(`WheelBoss_${sz > 0 ? 'R' : 'L'}`, cylinderZGeo(0.075, 0.075, 0.13, 16), beamWood, { parent: hub });
    // Ten spokes: a cart wheel, not a bicycle wheel, so they are chunky and few.
    const spoke = createPart(`WheelSpoke_${sz > 0 ? 'R' : 'L'}0`,
      await uv(await roundedBoxGeo(0.045, 0.30, 0.055, 0.012)), beamWood,
      { position: [0, 0.20, 0], parent: hub });
    arrayRadial(`WheelSpoke_${sz > 0 ? 'R' : 'L'}`, spoke, 10, 'z', hub);
  }
  // Front drop legs, splayed slightly outward the way a real prop leg is.
  for (const sz of [-1, 1]) {
    await box(`PropLeg_${sz > 0 ? 'R' : 'L'}`, 0.08, 0.50, 0.08, 0.015,
      [0.40, 0.25, sz * 0.52], beamWood, [sz * -4, 0, 6]);
    await box(`PropFoot_${sz > 0 ? 'R' : 'L'}`, 0.16, 0.05, 0.14, 0.015,
      [0.435, 0.025, sz * 0.535], beamWood);
  }
  // Pull handle: the detail that makes it a cart rather than a kiosk.
  for (const sz of [-1, 1]) {
    beamBetween(`Shaft_${sz > 0 ? 'R' : 'L'}`,
      [0.44, 0.50, sz * 0.40], [1.16, 0.66, sz * 0.30], 0.032, beamWood, { parent: root });
  }
  createPart('HandleBar', cylinderZGeo(0.034, 0.034, 0.66, 14), beamWood,
    { position: [1.16, 0.66, 0], parent: root });

  // ---------- Under-counter body ----------
  // Slatted, because a solid panel here kills the whole read. 17 slats over
  // 2.30 m is deliberately not a round number against the 4 cross members.
  const SLATS = 17;
  for (let i = 0; i < SLATS; i++) {
    const z = -HALF_Z + 0.06 + (i / (SLATS - 1)) * (HALF_Z * 2 - 0.12);
    await box(`Slat_${i}`, 0.035, 0.42, 0.085, 0.008, [0.44, 0.73, z], cedar);
  }
  // Back panel is solid: the customer never sees it, and it gives the interior
  // something to read against instead of straight through to the sky.
  await box('BackPanel', 0.04, 0.44, HALF_Z * 2, 0.01, [-0.42, 0.73, 0], cedar);
  await box('KickRail', 0.10, 0.07, HALF_Z * 2 + 0.06, 0.015, [0.44, 0.50, 0], beamWood);

  // ---------- Counter ----------
  // The top overhangs the body at the front, which is the whole reason a
  // customer can stand at it. Two boards with a visible seam, not one slab.
  await box('CounterFront', 0.34, 0.055, HALF_Z * 2 + 0.16, 0.012, [0.42, COUNTER_Y, 0], cedar);
  await box('CounterBack', 0.42, 0.055, HALF_Z * 2 + 0.16, 0.012, [0.06, COUNTER_Y, 0], cedar);
  await box('CounterEdge', 0.045, 0.075, HALF_Z * 2 + 0.16, 0.014, [0.60, COUNTER_Y - 0.005, 0], beamWood);
  // Stainless prep insert, sunk into the back half where the itamae works.
  await box('PrepInsert', 0.30, 0.02, 1.20, 0.006, [-0.10, COUNTER_Y + 0.03, -0.20], steel);

  // ---------- Posts and roof frame ----------
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const nm = `${sx > 0 ? 'F' : 'B'}${sz > 0 ? 'R' : 'L'}`;
      await box(`Post_${nm}`, 0.085, ROOF_Y - 0.44, 0.085, 0.015,
        [sx * POST_X, 0.44 + (ROOF_Y - 0.44) / 2, sz * (HALF_Z - 0.06)], beamWood);
    }
  }
  // Head beams both ways, so the roof has something to actually sit on.
  for (const sx of [-1, 1]) {
    await box(`HeadBeam_${sx > 0 ? 'F' : 'B'}`, 0.09, 0.11, HALF_Z * 2 + 0.04, 0.018,
      [sx * POST_X, ROOF_Y - 0.06, 0], beamWood);
  }
  for (const sz of [-1, 1]) {
    await box(`TieBeam_${sz > 0 ? 'R' : 'L'}`, POST_X * 2 + 0.09, 0.09, 0.09, 0.018,
      [0, ROOF_Y - 0.17, sz * (HALF_Z - 0.06)], beamWood);
  }

  // ---------- Roof ----------
  // A shallow gable, extruded as a profile along Z. Built from boxes this
  // would need a rotated pair of slabs meeting at a ridge, and the joint at the
  // ridge would be visibly wrong from the end view; a profile just has a peak.
  const roofProfile = [
    [-0.78, 0.00], [0.00, 0.22], [0.78, 0.00],
    [0.78, -0.055], [0.00, 0.165], [-0.78, -0.055],
  ];
  createPart('RoofShell', await uv(await extrudeProfile(roofProfile, {
    depth: HALF_Z * 2 + 0.34, axis: 'z', bevel: 0.012,
  })), roofCanvas, { position: [0, ROOF_Y + 0.02, 0], parent: root });
  // Battens across the roof, 13 of them, and the ridge cap.
  for (let i = 0; i < 13; i++) {
    const z = -HALF_Z - 0.10 + (i / 12) * (HALF_Z * 2 + 0.20);
    createPart(`Batten_${i}`, await uv(await roundedBoxGeo(1.60, 0.028, 0.05, 0.010)), beamWood, {
      position: [0, ROOF_Y + 0.115, z], parent: root,
    });
  }
  await box('RidgeCap', 0.10, 0.06, HALF_Z * 2 + 0.36, 0.018, [0, ROOF_Y + 0.245, 0], beamWood);

  // ---------- Noren ----------
  // Three panels with real gaps between them, hanging from a rod. The gaps are
  // the point: a single curtain is a wall, three panels is a doorway.
  createPart('NorenRod', cylinderZGeo(0.022, 0.022, HALF_Z * 2 - 0.10, 12), beamWood,
    { position: [POST_X + 0.035, ROOF_Y - 0.30, 0], parent: root });
  for (let i = 0; i < 3; i++) {
    const z = -0.72 + i * 0.72;
    await box(`NorenPanel_${i}`, 0.012, 0.46, 0.66, 0.004,
      [POST_X + 0.035, ROOF_Y - 0.545, z], noren, [0, 0, (i - 1) * 1.2]);
  }

  // ---------- Chochin lanterns ----------
  // Not a mirrored pair: different sizes, heights and hang angles.
  const lantern = async (name, at, scale, tilt) => {
    const p = createPivot(name, at, root);
    const profile = [
      [0.000, 0.000], [0.052, 0.000], [0.058, 0.018], [0.094, 0.082],
      [0.112, 0.170], [0.094, 0.258], [0.058, 0.322], [0.052, 0.340],
      [0.000, 0.340],
    ].map(([r, y]) => [r * scale, y * scale]);
    createPart(`${name}Paper`, await uv(await revolveProfile(profile, {
      segments: 28, axis: 'y', smooth: true,
    })), lanternPaper, { parent: p });
    // Ribs. A chochin without ribs is an orange egg.
    for (let i = 0; i < 7; i++) {
      const t = (i + 1) / 8;
      const y = t * 0.340 * scale;
      const r = (0.112 - Math.abs(t - 0.5) * 0.118) * scale + 0.004;
      createPart(`${name}Rib_${i}`, torusGeo(r, 0.0055 * scale, 6, 22), lacquer, {
        position: [0, y, 0], rotation: [90, 0, 0], parent: p,
      });
    }
    createPart(`${name}CapT`, cylinderGeo(0.050 * scale, 0.050 * scale, 0.028 * scale, 14), lacquer,
      { position: [0, 0.348 * scale, 0], parent: p });
    createPart(`${name}CapB`, cylinderGeo(0.046 * scale, 0.050 * scale, 0.026 * scale, 14), lacquer,
      { position: [0, -0.010 * scale, 0], parent: p });
    p.rotation.z = tilt * Math.PI / 180;
    return p;
  };
  await lantern('LanternA', [POST_X + 0.10, ROOF_Y - 0.62, 0.86], 1.00, -5);
  await lantern('LanternB', [POST_X + 0.10, ROOF_Y - 0.52, -0.82], 0.86, 7);
  for (const [nm, z, top] of [['A', 0.86, 0.34], ['B', -0.82, 0.24]]) {
    beamBetween(`LanternCord${nm}`,
      [POST_X + 0.08, ROOF_Y - 0.05, z], [POST_X + 0.10, ROOF_Y - 0.62 + top, z],
      0.006, lacquer, { parent: root });
  }

  // ---------- Neta case ----------
  // The refrigerated fish case. Angled front glass, because a vertical pane
  // reflects the customer and a real case is raked to show the neta.
  await box('CaseBase', 0.42, 0.075, 1.34, 0.012, [-0.02, COUNTER_Y + 0.065, 0.10], steel);
  await box('CaseBackWall', 0.03, 0.30, 1.34, 0.008, [-0.21, COUNTER_Y + 0.25, 0.10], steel);
  for (const sz of [-1, 1]) {
    await box(`CaseEnd_${sz > 0 ? 'R' : 'L'}`, 0.42, 0.28, 0.022, 0.006,
      [-0.02, COUNTER_Y + 0.24, 0.10 + sz * 0.67], caseGlass);
  }
  createPart('CaseGlass', await uv(await roundedBoxGeo(0.34, 0.014, 1.34, 0.005)), caseGlass, {
    position: [0.06, COUNTER_Y + 0.245, 0.10], rotation: [0, 0, 62], parent: root,
  });
  await box('CaseRail', 0.03, 0.03, 1.34, 0.010, [0.19, COUNTER_Y + 0.10, 0.10], steel);
  // Neta on the tray, in two rows. Small enough to read as fish, not as boxes.
  const netaColors = [0xd94f4f, 0xe8895a, 0xf0d9b8, 0xd05a72, 0xe0a05c, 0xf2e3c8];
  for (let i = 0; i < 12; i++) {
    const row = i % 2;
    const k = Math.floor(i / 2);
    const mat = gameMaterial(netaColors[(i * 5) % netaColors.length], {
      roughness: 0.44, metalness: 0.0,
    });
    await box(`Neta_${i}`, 0.115, 0.036, 0.085, 0.014,
      [-0.10 + row * 0.15, COUNTER_Y + 0.121, -0.42 + k * 0.175], mat, [0, (i * 37) % 18 - 9, 0]);
  }

  // ---------- Menu tags ----------
  // Tanzaku: thin paper strips on the back wall, each hanging at its own small
  // crooked angle. The angle is derived from the index, so it is deterministic
  // but never repeats within the run.
  // They need something to hang FROM. The first pass pinned them at head height
  // against a back panel that only exists below the counter, so all nine hung in
  // mid-air -- the QA gate caught it before the render did.
  await box('MenuBoard', 0.03, 0.17, HALF_Z * 2 - 0.16, 0.008, [-0.385, 1.73, 0], beamWood);
  for (let i = 0; i < 9; i++) {
    const z = -0.94 + i * 0.235;
    const skew = ((i * 53) % 11) - 5;
    await box(`MenuTag_${i}`, 0.012, 0.26, 0.085, 0.004,
      [-0.378, 1.52, z], noren, [0, 0, skew]);
  }

  // ---------- Counter clutter ----------
  // A working stall has things ON it. These are cheap and they are most of what
  // sells the asset as inhabited rather than as a model of a stall.
  createPart('SoySauce', cylinderGeo(0.032, 0.038, 0.115, 14), lacquer,
    { position: [0.44, COUNTER_Y + 0.086, -0.86], parent: root });
  createPart('SoyCap', cylinderGeo(0.016, 0.022, 0.030, 12), steel,
    { position: [0.44, COUNTER_Y + 0.158, -0.86], parent: root });
  createPart('ChopstickJar', cylinderGeo(0.052, 0.048, 0.135, 16), cedar,
    { position: [0.44, COUNTER_Y + 0.095, 0.94], parent: root });
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    createPart(`Chopstick_${i}`, cylinderGeo(0.0045, 0.0035, 0.21, 6), cedar, {
      position: [0.44 + Math.cos(a) * 0.022, COUNTER_Y + 0.215, 0.94 + Math.sin(a) * 0.022],
      rotation: [((i * 31) % 9) - 4, 0, ((i * 17) % 9) - 4], parent: root,
    });
  }
  // Sake bottles behind the counter, three, different heights.
  for (let i = 0; i < 3; i++) {
    const h = 0.20 + (i % 3) * 0.035;
    createPart(`Tokkuri_${i}`, await uv(await revolveProfile([
      [0.000, 0.000], [0.042, 0.000], [0.048, 0.030], [0.046, h * 0.55],
      [0.020, h * 0.82], [0.019, h], [0.026, h + 0.012], [0.000, h + 0.012],
    ], { segments: 20, axis: 'y', smooth: true })), lacquer, {
      position: [-0.30, COUNTER_Y + 0.03, -0.70 + i * 0.17], parent: root,
    });
  }
  // Cutting board and knife on the prep side.
  await box('CuttingBoard', 0.26, 0.028, 0.44, 0.008, [-0.08, COUNTER_Y + 0.045, -0.62], cedar);
  await box('KnifeBlade', 0.045, 0.008, 0.24, 0.003, [-0.08, COUNTER_Y + 0.062, -0.62], steel, [0, 0, 0]);
  await box('KnifeHandle', 0.030, 0.024, 0.11, 0.008, [-0.08, COUNTER_Y + 0.070, -0.44], lacquer);

  // ---------- Stools ----------
  // Two, at different distances from the counter and turned differently. A
  // matched pair squared to the cart is the tell of a generated scene.
  for (const [i, z, dx, spin] of [[0, 0.52, 0.00, 12], [1, -0.44, 0.06, -21]]) {
    const p = createPivot(`Stool_${i}`, [1.02 + dx, 0, z], root);
    createPart(`StoolTop_${i}`, await uv(await roundedBoxGeo(0.30, 0.045, 0.30, 0.018)), cedar,
      { position: [0, 0.56, 0], parent: p });
    for (const lx of [-1, 1]) {
      for (const lz of [-1, 1]) {
        createPart(`StoolLeg_${i}_${lx}${lz}`, cylinderGeo(0.017, 0.021, 0.56, 10), beamWood, {
          position: [lx * 0.105, 0.28, lz * 0.105],
          rotation: [lz * 3.5, 0, -lx * 3.5], parent: p,
        });
      }
    }
    createPart(`StoolRail_${i}`, torusGeo(0.115, 0.010, 6, 20), beamWood,
      { position: [0, 0.20, 0], rotation: [90, 0, 0], parent: p });
    p.rotation.y = spin * Math.PI / 180;
  }

  return root;
}

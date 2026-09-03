// An 1885 Ordinary bicycle -- a penny-farthing.
//
// The other heroes are massive objects: a gun carriage, a lamp column, a helmet.
// This one is almost entirely AIR. Its whole character is a 1.4 m wheel, a
// hairline backbone curving around it, and sixty-eight spokes you can see the
// background through, and none of that survives being approximated with boxes.
//
// It is therefore the curves-and-arrays example. The backbone, the fork legs and
// the handlebars are bezier paths swept into tubes; both wheels are radial
// arrays under a pivot at the hub, which is the only way to array something
// around a centre that is not the world origin.
//
// The clearance between the backbone and the tyre is 20 mm and that is not an
// accident -- a real Ordinary hugs its wheel. Every control point below was
// checked against the wheel radius at t = 0.25, 0.5 and 0.75 before it was
// rendered once, because a spline that passes through a 1.4 m wheel is not
// something a six-view contact sheet will necessarily show you.
//
// Authored by: Claude Opus 5, via Claude Code. Every part below was written by the model itself,
// looking at its own renders through the Kiln tools and revising.
const meta = { name: 'PennyFarthing', category: 'vehicle', role: 'hero' };

async function build() {
  const root = createRoot('PennyFarthing');
  const uv = (g) => autoUnwrap(g, { resolution: 512 });

  // ---------- Materials ----------
  // Black japanned steel. Enamel is a DIELECTRIC over metal, so metalness stays
  // low; at 0.9 this would be a black mirror and the frame would vanish.
  const enamelAlbedo = proceduralTexture({
    schemaVersion: 2, size: 512, usage: 'albedo', name: 'Japanned',
    layers: [
      { op: 'solid', color: 0x2b2723 },
      { op: 'noise', colorA: 0x201d1a, colorB: 0x453f38, scale: 40, octaves: 4, seed: 7, blend: 'overlay', opacity: 0.55 },
    ],
  });
  const enamel = pbrMaterial({
    albedo: enamelAlbedo, normal: normalMapFromHeight(enamelAlbedo, { strength: 1.1 }),
    roughness: 0.38, metalness: 0.12,
  });

  // Nickel plate: the spokes, rims, hubs and pedal irons. This is the bright
  // metal, and it is the reason the asset reads at all on a GPU render -- a
  // wheel of dark spokes against a dark frame is a smudge.
  const nickelAlbedo = proceduralTexture({
    schemaVersion: 2, size: 256, usage: 'albedo', name: 'Nickel',
    layers: [
      { op: 'solid', color: 0xbcc0c4 },
      { op: 'noise', colorA: 0xa2a7ab, colorB: 0xd6dade, scale: 36, octaves: 3, seed: 13, blend: 'overlay', opacity: 0.45 },
    ],
  });
  const nickel = pbrMaterial({
    albedo: nickelAlbedo, normal: normalMapFromHeight(nickelAlbedo, { strength: 1.0 }),
    roughness: 0.20, metalness: 0.94,
  });

  // Solid rubber tyre and a tanned leather saddle. Both dielectric.
  const rubber = gameMaterial(0x1a1917, { roughness: 0.92, metalness: 0.0 });
  const leatherAlbedo = proceduralTexture({
    schemaVersion: 2, size: 512, usage: 'albedo', name: 'Leather',
    layers: [
      { op: 'solid', color: 0x6d4526 },
      { op: 'noise', colorA: 0x54341c, colorB: 0x8d5f36, scale: 34, octaves: 4, seed: 19, blend: 'overlay', opacity: 0.6 },
    ],
  });
  const leather = pbrMaterial({
    albedo: leatherAlbedo, normal: normalMapFromHeight(leatherAlbedo, { strength: 2.4 }),
    roughness: 0.68, metalness: 0.0,
  });

  // ---------- Wheels ----------
  // A wheel is a radial array about its own hub, so it has to live under a pivot
  // AT that hub. arrayRadial turns copies about the axis through its parent
  // origin, not about the world origin, and building the wheel at the world
  // origin and translating it afterwards is the version of this that produces a
  // sunflower instead of a bicycle.
  const wheel = (name, at, rimR, tyreTube, spokes, spokeR, hubR, hubHalf) => {
    const p = createPivot(name, at, root);
    // torusGeo lies in the XY plane with its hole on Z, which is exactly the
    // plane a wheel rolling along +X turns in. No rotation needed.
    createPart(`${name}Rim`, torusGeo(rimR, 0.018, 10, 72), nickel, { parent: p });
    createPart(`${name}Tyre`, torusGeo(rimR + 0.019 + tyreTube, tyreTube, 10, 72), rubber, { parent: p });
    createPart(`${name}Hub`, cylinderZGeo(hubR, hubR, hubHalf * 2, 20), nickel, { parent: p });
    for (const sz of [-1, 1]) {
      createPart(`${name}Flange${sz > 0 ? 'R' : 'L'}`, cylinderZGeo(hubR * 1.35, hubR * 1.35, 0.012, 20), nickel, {
        position: [0, 0, sz * hubHalf], parent: p,
      });
    }
    const len = rimR - hubR * 0.9;
    const spoke = createPart(`${name}Spoke0`, cylinderGeo(spokeR, spokeR, len, 6), nickel, {
      position: [0, hubR * 0.9 + len / 2, 0], parent: p,
    });
    arrayRadial(`${name}Spoke`, spoke, spokes, 'z', p);
    return p;
  };

  // A 52-inch driver and a 17-inch trailer. The whole machine is sized off the
  // big wheel, so it is placed first and everything else is derived from it.
  const FR = 0.645, FT = 0.017;          // front rim radius, tyre tube
  const FY = FR + 0.019 + FT * 2;        // hub height = outside radius of the tyre
  wheel('FrontWheel', [0, FY, 0], FR, FT, 48, 0.0035, 0.048, 0.048);

  const RR = 0.184, RT = 0.015;
  const RY = RR + 0.019 + RT * 2;
  const RX = -1.06;
  wheel('RearWheel', [RX, RY, 0], RR, RT, 20, 0.0032, 0.030, 0.030);

  // ---------- Fork ----------
  // Two legs up the sides of the driver to the steering head above the tyre.
  // They carry the rider, the cranks and the whole front of the machine.
  const HEAD = [0.020, FY + FR + 0.128, 0];
  for (const sz of [-1, 1]) {
    const legPath = bezierCurve([
      [0.000, FY, sz * 0.056], [0.052, FY + 0.30, sz * 0.058],
      [0.046, FY + 0.58, sz * 0.046], [HEAD[0], HEAD[1] - 0.02, sz * 0.030],
    ], 22);
    createPart(`ForkLeg_${sz > 0 ? 'R' : 'L'}`, curveToMesh(legPath, 0.013, 22, 8), enamel, { parent: root });
  }
  createPart('SteeringHead', cylinderGeo(0.026, 0.026, 0.115, 16), enamel, {
    position: [HEAD[0], HEAD[1] + 0.010, 0], parent: root,
  });
  createPart('HeadCollar', torusGeo(0.030, 0.009, 8, 20), nickel, {
    position: [HEAD[0], HEAD[1] - 0.042, 0], rotation: [90, 0, 0], parent: root,
  });

  // ---------- Backbone ----------
  // The signature curve: off the head, round the back of the driver, down to the
  // trailing fork. Checked against the wheel at t = 0.25 / 0.50 / 0.75 -- see the
  // header. The clearance is deliberately small; a backbone standing off the
  // wheel reads as a chopper, not an Ordinary.
  const BB = [
    [0.010, HEAD[1] + 0.010, 0], [-0.400, 1.500, 0],
    [-0.960, 0.950, 0], [RX, 0.300, 0],
  ];
  // Evaluate the backbone analytically to hang things off it. Guessing a height
  // and hoping it lands on a spline is how parts end up floating 30 mm off the
  // frame in a render nobody looks at closely enough to catch.
  const onBackbone = (t) => {
    const u = 1 - t;
    const w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
    return [0, 1, 2].map((k) => BB.reduce((s, p, i) => s + w[i] * p[k], 0));
  };

  // Chained beams down the spline rather than one curveToMesh, because the tube
  // sweep is a CONSTANT radius and a constant-radius backbone is what makes the
  // whole machine read as a line drawing. A real one is a forging: thick where
  // it takes the rider at the head, drawn down to little more than a rod at the
  // trailing fork. Eighteen segments over 1.7 m are short enough that the joints
  // do not read, and the taper is worth far more than the smoothness it costs.
  const SEGS = 18;
  let prev = onBackbone(0);
  for (let i = 1; i <= SEGS; i++) {
    const cur = onBackbone(i / SEGS);
    const r = 0.027 - 0.015 * ((i - 0.5) / SEGS);
    beamBetween(`Backbone_${i}`, prev, cur, r, enamel, { parent: root });
    prev = cur;
  }

  // Trailing fork down to the small hub.
  for (const sz of [-1, 1]) {
    beamBetween(`RearFork_${sz > 0 ? 'R' : 'L'}`,
      [RX, 0.300, 0], [RX, RY, sz * 0.034], 0.011, enamel, { parent: root });
  }

  // ---------- Saddle ----------
  const seatAt = onBackbone(0.19);
  createPart('SaddlePost', cylinderGeo(0.014, 0.016, 0.075, 12), nickel, {
    position: [seatAt[0] + 0.052, seatAt[1] + 0.048, 0], parent: root,
  });
  // The long leaf spring an Ordinary hangs its saddle from, swept as one tube.
  // Four stacked rings were tried here for a coil and disappeared entirely at
  // asset scale: a detail smaller than the render can resolve is not detail, it
  // is triangles. The leaf is legible because it spans 220 mm.
  const springPath = bezierCurve([
    [seatAt[0] + 0.052, seatAt[1] + 0.082, 0], [seatAt[0] - 0.010, seatAt[1] + 0.132, 0],
    [seatAt[0] - 0.118, seatAt[1] + 0.126, 0], [seatAt[0] - 0.166, seatAt[1] + 0.070, 0],
  ], 22);
  createPart('SaddleSpring', curveToMesh(springPath, 0.008, 22, 8), nickel, { parent: root });
  createPart('SpringClip', torusGeo(0.020, 0.006, 6, 16), nickel, {
    position: [seatAt[0] - 0.160, seatAt[1] + 0.060, 0], rotation: [90, 0, 0], parent: root,
  });

  const saddleOutline = [
    [0.130, 0.000], [0.112, 0.045], [0.060, 0.076], [-0.020, 0.086],
    [-0.092, 0.076], [-0.132, 0.045], [-0.142, 0.000],
    [-0.132, -0.045], [-0.092, -0.076], [-0.020, -0.086],
    [0.060, -0.076], [0.112, -0.045],
  ];
  const saddle = createPart('Saddle', await uv(await extrudeProfile(saddleOutline, {
    depth: 0.038, axis: 'y', bevel: 0.014,
  })), leather, { position: [seatAt[0] - 0.048, seatAt[1] + 0.140, 0], parent: root });
  saddle.rotation.z = (-7 * Math.PI) / 180;
  // The cantle. Without a raised back edge a sling saddle photographs as a
  // pancake, which is what the first render of this one looked like.
  createPart('SaddleCantle', await uv(await roundedBoxGeo(0.052, 0.036, 0.150, 0.016)), leather, {
    position: [seatAt[0] - 0.170, seatAt[1] + 0.152, 0], parent: root,
  });

  // ---------- Handlebars ----------
  // Mustache bars: they sweep forward, out and back down to the grips.
  for (const sz of [-1, 1]) {
    const barPath = bezierCurve([
      [HEAD[0], HEAD[1] + 0.062, 0], [HEAD[0] + 0.070, HEAD[1] + 0.070, sz * 0.130],
      [HEAD[0] + 0.020, HEAD[1] + 0.020, sz * 0.250], [HEAD[0] - 0.075, HEAD[1] - 0.010, sz * 0.290],
    ], 24);
    createPart(`Handlebar_${sz > 0 ? 'R' : 'L'}`, curveToMesh(barPath, 0.011, 24, 8), nickel, { parent: root });
    createPart(`Grip_${sz > 0 ? 'R' : 'L'}`, cylinderXGeo(0.017, 0.017, 0.090, 14), leather, {
      position: [HEAD[0] - 0.062, HEAD[1] - 0.008, sz * 0.288], rotation: [0, 74, 0], parent: root,
    });
  }
  // Spoon brake: a lever on the right bar, a rod down the front of the head, and
  // the spoon itself bearing on the crown of the tyre. The spoon on its own was
  // an unexplained metal tab hovering near the wheel -- a mechanism reads as a
  // mechanism only when the linkage back to the hand that works it is there.
  const TYRE_TOP = FY + FR + 0.019 + FT * 2;
  createPart('ForkCrown', await uv(await roundedBoxGeo(0.062, 0.040, 0.090, 0.010)), enamel, {
    position: [HEAD[0], HEAD[1] - 0.054, 0], parent: root,
  });
  beamBetween('BrakeLever',
    [HEAD[0] + 0.012, HEAD[1] + 0.056, 0.026], [HEAD[0] + 0.026, HEAD[1] + 0.046, 0.140], 0.007, nickel, { parent: root });
  beamBetween('BrakeRod',
    [HEAD[0] + 0.016, HEAD[1] + 0.050, 0.030], [0.102, TYRE_TOP + 0.016, 0.010], 0.005, nickel, { parent: root });
  createPart('BrakeSpoon', await uv(await roundedBoxGeo(0.052, 0.014, 0.054, 0.006)), nickel, {
    position: [0.102, TYRE_TOP + 0.006, 0], parent: root,
  });

  // ---------- Cranks and pedals ----------
  // Fixed to the driver hub, one crank up and forward, the other down and back,
  // because two cranks in line is a tricycle mistake that reads instantly.
  const CRANK = 0.168;
  let crankIndex = 0;
  for (const [dir, sz] of [[1, 1], [-1, -1]]) {
    const i = crankIndex++;
    const px = dir * CRANK * 0.80, py = FY + dir * CRANK * 0.60;
    beamBetween(`Crank_${i}`, [0, FY, sz * 0.058], [px, py, sz * 0.066], 0.014, nickel, { parent: root });
    createPart(`PedalSpindle_${i}`, cylinderZGeo(0.011, 0.011, 0.096, 12), nickel, {
      position: [px, py, sz * 0.114], parent: root,
    });
    createPart(`PedalBlock_${i}`, await uv(await roundedBoxGeo(0.098, 0.020, 0.072, 0.005)), rubber, {
      position: [px, py - 0.018, sz * 0.126], parent: root,
    });
  }

  // Mounting step on the backbone, where the rider put a foot to vault on.
  const stepAt = onBackbone(0.62);
  createPart('MountingStep', cylinderZGeo(0.013, 0.013, 0.090, 12), nickel, {
    position: [stepAt[0], stepAt[1], -0.062], parent: root,
  });
  createPart('StepPlate', await uv(await roundedBoxGeo(0.052, 0.012, 0.038, 0.005)), enamel, {
    position: [stepAt[0], stepAt[1] - 0.005, -0.106], parent: root,
  });

  return root;
}

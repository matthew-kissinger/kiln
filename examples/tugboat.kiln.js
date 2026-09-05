// Authored by: gemini-3.8-flash-high, via agy.
//
// Written by the model itself through the Kiln MCP tools: it wrote the
// program, rendered it, looked at its own six-view contact sheet, and
// revised. Its hull, deckhouse, mast and fittings are its own.
//
// Two things were repaired afterwards. The whip antennas started 50 mm above
// the masthead, which is two numbers. And the bilge keels were straight boxes
// parked at a fixed z: the half-beam runs from 2.40 m amidships to 0.06 m at
// the cutwater, so a 5 m bar leaves the plating long before either end and
// reads as a red stick hanging in the water beside the boat. Moving it inboard
// only moves where it detaches, so the fins are now swept along the hull --
// they sample the model's own getStationProfile at each station and stand off
// the surface normal, which puts them on the plating by construction. Nothing
// else in the program was touched.
//
// Dispatched into a clean directory containing only the brief and the Kiln
// skills, with no access to this repository or to any finished example.

const meta = { name: 'Tugboat', category: 'vehicle', role: 'vehicle' };

async function build() {
  const root = createRoot('Tugboat');

  // ==========================================
  // MATERIALS (Consistent, game-ready PBR)
  // ==========================================
  const hullLowerMat = gameMaterial(0x8b2010, { roughness: 0.65, metalness: 0.15 }); // Red oxide antifouling
  const hullUpperMat = gameMaterial(0x182026, { roughness: 0.55, metalness: 0.25 }); // Dark navy/black steel topsides
  const bootTopMat   = gameMaterial(0xf0f0f0, { roughness: 0.6, metalness: 0.1 });  // White waterline stripe / band
  const deckMat      = gameMaterial(0x3a4048, { roughness: 0.85, metalness: 0.2 }); // Non-skid steel deck
  const deckhouseMat = gameMaterial(0xf4f6f8, { roughness: 0.45, metalness: 0.15 }); // Crisp white superstructure
  const trimDarkMat  = gameMaterial(0x222a35, { roughness: 0.6, metalness: 0.3 }); // Bulwarks capping & trims
  const glassMat     = glassMaterial(0x4080aa, { opacity: 0.5, roughness: 0.1, metalness: 0.4 }); // Glazing
  const fenderMat    = gameMaterial(0x3e3226, { roughness: 0.95, metalness: 0.0 }); // Coir rope fender belt
  const puddingMat   = gameMaterial(0x2e241a, { roughness: 0.98, metalness: 0.0 }); // Bow pudding fender
  const rubberMat    = gameMaterial(0x1a1a1a, { roughness: 0.9, metalness: 0.05 }); // Tyre drop fenders
  const funnelMat    = gameMaterial(0xd35400, { roughness: 0.5, metalness: 0.2 }); // Maritime orange funnel
  const funnelCapMat = gameMaterial(0x151515, { roughness: 0.7, metalness: 0.3 }); // Black funnel cap
  const steelMat     = gameMaterial(0x71797e, { roughness: 0.4, metalness: 0.75 }); // Machinery & rails
  const darkIronMat  = gameMaterial(0x282c34, { roughness: 0.65, metalness: 0.7 }); // Bitts, towing hook, windlass
  const brassMat     = gameMaterial(0xd4af37, { roughness: 0.3, metalness: 0.85 }); // Propeller, horn, portholes
  const mastMat      = gameMaterial(0xdde2e6, { roughness: 0.4, metalness: 0.3 }); // Radar mast
  const lanternRed   = gameMaterial(0xdd2222, { roughness: 0.2, metalness: 0.1, emissive: 0xaa0000, emissiveIntensity: 0.9 });
  const lanternGreen = gameMaterial(0x22dd44, { roughness: 0.2, metalness: 0.1, emissive: 0x00aa22, emissiveIntensity: 0.9 });
  const lanternWhite = gameMaterial(0xffffff, { roughness: 0.2, metalness: 0.1, emissive: 0xffffff, emissiveIntensity: 0.9 });
  const lanternAmber = gameMaterial(0xffaa11, { roughness: 0.2, metalness: 0.1, emissive: 0xee8800, emissiveIntensity: 0.9 });
  const lifeRingMat  = gameMaterial(0xe65100, { roughness: 0.6, metalness: 0.05 }); // Orange lifebuoy

  // ==========================================
  // 1. PARAMETRIC HULL GEOMETRY
  // ==========================================
  // Tuned station and girth count to fit solidly in 4,000-12,000 triangle budget (~7,500 tris)
  const numStations = 16;
  const numGirthLower = 5;
  const numGirthUpper = 4;
  const wlY = 1.65; // Waterline height

  function getStationProfile(u) {
    const xBase = -6.6 + 15.0 * u;
    
    // Keel profile: flat at Y=0 amidships, rises at deadwood (stern) and forefoot (bow)
    let yKeel = 0.0;
    if (u < 0.15) {
      const tf = (0.15 - u) / 0.15;
      yKeel = 0.85 * tf * tf;
    } else if (u > 0.84) {
      const tf = (u - 0.84) / 0.16;
      yKeel = 0.75 * tf * tf;
    }

    // Sheerline profile: classic sweep, lowest amidships, rising to bow flare
    let ySheer = 2.45;
    if (u <= 0.45) {
      const tf = (0.45 - u) / 0.45;
      ySheer = 2.45 + 0.35 * tf * tf;
    } else {
      const tf = (u - 0.45) / 0.55;
      ySheer = 2.45 + 1.05 * tf * tf;
    }

    // Half beam: max amidships (u=0.48), rounded counter at stern, sharp cutwater at stem
    let b = 2.4;
    if (u < 0.48) {
      const tf = (0.48 - u) / 0.48;
      b = 2.4 * (1.0 - 0.38 * tf * tf);
    } else {
      const tf = (u - 0.48) / 0.52;
      b = 0.06 + (2.4 - 0.06) * (1.0 - Math.pow(tf, 1.45));
    }

    // Stem rake forward & stern counter overhang aft
    let rakeX = 0;
    if (u > 0.84) {
      rakeX = 0.65 * Math.pow((u - 0.84) / 0.16, 1.5);
    } else if (u < 0.12) {
      rakeX = -0.45 * Math.pow((0.12 - u) / 0.12, 1.5);
    }

    return { xBase, rakeX, yKeel, ySheer, b };
  }

  // Generate Lower Hull (Keel to Waterline)
  const lowerPos = [];
  const lowerIndices = [];
  for (let i = 0; i <= numStations; i++) {
    const u = i / numStations;
    const st = getStationProfile(u);
    const yTop = Math.min(wlY, st.ySheer - 0.05);

    // Starboard (+z)
    for (let j = 0; j <= numGirthLower; j++) {
      const v = j / numGirthLower;
      const y = st.yKeel + v * (yTop - st.yKeel);
      const x = st.xBase + st.rakeX * (y / st.ySheer);
      const angle = v * (Math.PI / 2);
      const zFrac = Math.pow(Math.sin(angle), 0.55);
      const zHalf = 0.12 + (st.b * (yTop / st.ySheer) - 0.12) * zFrac;
      lowerPos.push(x, y, zHalf);
    }
    // Port (-z)
    for (let j = 0; j <= numGirthLower; j++) {
      const v = j / numGirthLower;
      const y = st.yKeel + v * (yTop - st.yKeel);
      const x = st.xBase + st.rakeX * (y / st.ySheer);
      const angle = v * (Math.PI / 2);
      const zFrac = Math.pow(Math.sin(angle), 0.55);
      const zHalf = 0.12 + (st.b * (yTop / st.ySheer) - 0.12) * zFrac;
      lowerPos.push(x, y, -zHalf);
    }
  }

  const ptsPerStLower = (numGirthLower + 1) * 2;
  for (let i = 0; i < numStations; i++) {
    for (let j = 0; j < numGirthLower; j++) {
      // Starboard side
      const a = i * ptsPerStLower + j;
      const b = a + 1;
      const c = (i + 1) * ptsPerStLower + j;
      const d = c + 1;
      lowerIndices.push(a, b, d, a, d, c);

      // Port side
      const pa = i * ptsPerStLower + (numGirthLower + 1) + j;
      const pb = pa + 1;
      const pc = (i + 1) * ptsPerStLower + (numGirthLower + 1) + j;
      const pd = pc + 1;
      lowerIndices.push(pa, pc, pd, pa, pd, pb);
    }
  }

  const lowerHullGeo = new THREE.BufferGeometry();
  lowerHullGeo.setAttribute('position', new THREE.Float32BufferAttribute(lowerPos, 3));
  lowerHullGeo.setIndex(lowerIndices);
  lowerHullGeo.computeVertexNormals();
  createPart('HullLower', lowerHullGeo, hullLowerMat, { parent: root });

  // Generate Upper Hull (Waterline to Sheerline)
  const upperPos = [];
  const upperIndices = [];
  const sheerlinePoints = [];
  const sheerlinePort = [];

  for (let i = 0; i <= numStations; i++) {
    const u = i / numStations;
    const st = getStationProfile(u);
    const yBot = Math.min(wlY, st.ySheer - 0.05);

    for (let j = 0; j <= numGirthUpper; j++) {
      const v = j / numGirthUpper;
      const y = yBot + v * (st.ySheer - yBot);
      const x = st.xBase + st.rakeX * (y / st.ySheer);
      const zBot = 0.12 + (st.b * (yBot / st.ySheer) - 0.12);
      const zTop = st.b;
      const zHalf = zBot + v * (zTop - zBot);
      upperPos.push(x, y, zHalf);

      if (j === numGirthUpper) {
        sheerlinePoints.push([x, y, zHalf]);
        sheerlinePort.push([x, y, -zHalf]);
      }
    }
    for (let j = 0; j <= numGirthUpper; j++) {
      const v = j / numGirthUpper;
      const y = yBot + v * (st.ySheer - yBot);
      const x = st.xBase + st.rakeX * (y / st.ySheer);
      const zBot = 0.12 + (st.b * (yBot / st.ySheer) - 0.12);
      const zTop = st.b;
      const zHalf = zBot + v * (zTop - zBot);
      upperPos.push(x, y, -zHalf);
    }
  }

  const ptsPerStUpper = (numGirthUpper + 1) * 2;
  for (let i = 0; i < numStations; i++) {
    for (let j = 0; j < numGirthUpper; j++) {
      const a = i * ptsPerStUpper + j;
      const b = a + 1;
      const c = (i + 1) * ptsPerStUpper + j;
      const d = c + 1;
      upperIndices.push(a, b, d, a, d, c);

      const pa = i * ptsPerStUpper + (numGirthUpper + 1) + j;
      const pb = pa + 1;
      const pc = (i + 1) * ptsPerStUpper + (numGirthUpper + 1) + j;
      const pd = pc + 1;
      upperIndices.push(pa, pc, pd, pa, pd, pb);
    }
  }

  const upperHullGeo = new THREE.BufferGeometry();
  upperHullGeo.setAttribute('position', new THREE.Float32BufferAttribute(upperPos, 3));
  upperHullGeo.setIndex(upperIndices);
  upperHullGeo.computeVertexNormals();
  createPart('HullUpper', upperHullGeo, hullUpperMat, { parent: root });

  // Stern counter cap
  createPart('SternCounterCap', cylinderGeo(1.48, 1.45, 1.1, 12, 1, false, Math.PI / 2, Math.PI), hullUpperMat, {
    position: [-6.6, 2.05, 0],
    rotation: [0, 90, 0],
    scale: [1, 1, 0.45],
    parent: root
  });

  // Main Deck Surface
  const deckPos = [];
  const deckIndices = [];
  for (let i = 0; i <= numStations; i++) {
    const u = i / numStations;
    const st = getStationProfile(u);
    const x = st.xBase + st.rakeX;
    const y = st.ySheer;
    const b = st.b - 0.08;
    deckPos.push(x, y, b);
    deckPos.push(x, y, -b);
  }
  for (let i = 0; i < numStations; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = (i + 1) * 2;
    const d = c + 1;
    deckIndices.push(a, d, b, a, c, d);
  }
  const deckGeo = new THREE.BufferGeometry();
  deckGeo.setAttribute('position', new THREE.Float32BufferAttribute(deckPos, 3));
  deckGeo.setIndex(deckIndices);
  deckGeo.computeVertexNormals();
  createPart('MainDeck', deckGeo, deckMat, { parent: root });

  // Bulwarks
  const bulwarkPos = [];
  const bulwarkIndices = [];
  const bulwarkHeight = 0.65;
  for (let i = 0; i <= numStations; i++) {
    const u = i / numStations;
    const st = getStationProfile(u);
    const x = st.xBase + st.rakeX;
    const yBase = st.ySheer;
    const yTop = yBase + bulwarkHeight;
    const b = st.b;
    bulwarkPos.push(x, yBase, b);
    bulwarkPos.push(x, yTop, b);
    bulwarkPos.push(x, yBase, -b);
    bulwarkPos.push(x, yTop, -b);
  }
  for (let i = 0; i < numStations; i++) {
    const a = i * 4;
    const b = a + 1;
    const c = (i + 1) * 4;
    const d = c + 1;
    bulwarkIndices.push(a, b, d, a, d, c);

    const pa = i * 4 + 2;
    const pb = pa + 1;
    const pc = (i + 1) * 4 + 2;
    const pd = pc + 1;
    bulwarkIndices.push(pa, pd, pb, pa, pc, pd);
  }
  const bulwarkGeo = new THREE.BufferGeometry();
  bulwarkGeo.setAttribute('position', new THREE.Float32BufferAttribute(bulwarkPos, 3));
  bulwarkGeo.setIndex(bulwarkIndices);
  bulwarkGeo.computeVertexNormals();
  createPart('Bulwarks', bulwarkGeo, hullUpperMat, { parent: root });

  // Bulwark Capping Rails
  const stbdCapPath = [];
  const portCapPath = [];
  for (let i = 0; i <= numStations; i++) {
    const u = i / numStations;
    const st = getStationProfile(u);
    stbdCapPath.push([st.xBase + st.rakeX, st.ySheer + bulwarkHeight, st.b]);
    portCapPath.push([st.xBase + st.rakeX, st.ySheer + bulwarkHeight, -st.b]);
  }
  const stbdCapGeo = pipeAlongPath(stbdCapPath, 0.055, { bendRadius: 0.15, tubularSegments: 16, radialSegments: 6 });
  createPart('CapRailStbd', stbdCapGeo, trimDarkMat, { parent: root });

  const portCapGeo = pipeAlongPath(portCapPath, 0.055, { bendRadius: 0.15, tubularSegments: 16, radialSegments: 6 });
  createPart('CapRailPort', portCapGeo, trimDarkMat, { parent: root });

  createPart('CapStern', torusGeo(1.48, 0.055, 6, 12), trimDarkMat, {
    position: [-6.6, 2.75 + bulwarkHeight, 0],
    rotation: [90, 0, 0],
    scale: [0.6, 1, 1],
    parent: root
  });

  // Freeing ports / scuppers
  const scupperX = [-4.0, -2.0, 0.2, 2.4];
  scupperX.forEach((sx, idx) => {
    createPart(`ScupperStbd_${idx}`, decalBox(0.35, 0.14, 0.03), trimDarkMat, { position: [sx, 2.58, 2.38], parent: root });
    createPart(`ScupperPort_${idx}`, decalBox(0.35, 0.14, 0.03), trimDarkMat, { position: [sx, 2.58, -2.38], parent: root });
  });

  // ==========================================
  // 2. KEEL BAR, SKEG & BILGE KEELS (Grounding firmly at Y=0)
  // ==========================================
  // Continuous bar keel touching Y=0 (Y center = 0.11, height = 0.22 -> min Y = 0.000)
  createPart('KeelBarMain', boxGeo(10.5, 0.22, 0.28), hullLowerMat, { position: [1.2, 0.11, 0], parent: root });
  // Stern skeg / sole piece extending under propeller to rudder heel (min Y = 0.000)
  createPart('SkegSolePiece', boxGeo(3.2, 0.22, 0.22), hullLowerMat, { position: [-5.4, 0.11, 0], parent: root });
  // Deadwood fairing connecting keel to hull stern
  createPart('Deadwood', boxGeo(2.4, 0.75, 0.24), hullLowerMat, { position: [-4.6, 0.55, 0], parent: root });

  // Bilge keels (roll damping fins), swept along the hull rather than laid
  // beside it.
  //
  // A bilge keel is welded to the turn of the bilge and follows it, so a
  // straight box cannot be one: the half-beam here runs from 2.40 m amidships
  // to 0.06 m at the cutwater, and a 5 m bar parked at a fixed z leaves the
  // plating long before it reaches either end. That is what it looked like --
  // a red stick hanging in the water alongside the boat.
  //
  // The hull is parametric, so the fin can simply ask it where the plating is.
  // At each station it samples getStationProfile at a fixed girth fraction,
  // takes the surface tangent there analytically, and sweeps a thin rectangle
  // outward along the surface normal. The fin is then on the hull by
  // construction, at every station, whatever the sections do.
  const BK_V = 0.42;          // girth fraction: the turn of the bilge
  const BK_DEPTH = 0.30;      // how far the fin stands off the plating
  const BK_THICK = 0.06;
  const BK_U0 = 0.28;
  const BK_U1 = 0.72;
  const BK_STATIONS = 12;

  // The plating point and its outward normal at girth fraction v, in the
  // station's own y-z plane. dz/dv is the derivative of the girth curve the
  // hull loops use, so the fin sits flush instead of approximately flush.
  function bilgeFrame(u) {
    const st = getStationProfile(u);
    const yTop = Math.min(wlY, st.ySheer - 0.05);
    const zSpan = st.b * (yTop / st.ySheer) - 0.12;
    const ang = BK_V * (Math.PI / 2);
    const y = st.yKeel + BK_V * (yTop - st.yKeel);
    const z = 0.12 + zSpan * Math.pow(Math.sin(ang), 0.55);
    const dy = yTop - st.yKeel;
    const dz = zSpan * 0.55 * Math.pow(Math.sin(ang), -0.45) * Math.cos(ang) * (Math.PI / 2);
    const len = Math.hypot(dy, dz) || 1;
    return { st, y, z, ny: -dz / len, nz: dy / len, ty: dy / len, tz: dz / len };
  }

  function bilgeKeelGeo(side) {
    const pos = [];
    const idx = [];
    for (let i = 0; i <= BK_STATIONS; i++) {
      const u = BK_U0 + (i / BK_STATIONS) * (BK_U1 - BK_U0);
      const f = bilgeFrame(u);
      // Four section corners: inner and outer edge, each given the fin's
      // thickness along the girth tangent.
      for (const d of [0, BK_DEPTH]) {
        for (const t of [-BK_THICK / 2, BK_THICK / 2]) {
          const y = f.y + f.ny * d + f.ty * t;
          const z = f.z + f.nz * d + f.tz * t;
          const x = f.st.xBase + f.st.rakeX * (y / f.st.ySheer);
          pos.push(x, y, side * z);
        }
      }
    }
    const quad = (a, b, c, d) =>
      side > 0 ? idx.push(a, b, d, a, d, c) : idx.push(a, d, b, a, c, d);
    for (let i = 0; i < BK_STATIONS; i++) {
      const a = i * 4;
      const b = a + 4;
      quad(a + 0, a + 1, b + 0, b + 1); // inner face
      quad(a + 2, a + 3, b + 2, b + 3); // outer face
      quad(a + 0, a + 2, b + 0, b + 2); // one side
      quad(a + 1, a + 3, b + 1, b + 3); // the other
    }
    // Caps, so the fin reads as a plate with ends and not an open trough.
    const last = BK_STATIONS * 4;
    quad(0, 1, 2, 3);
    quad(last + 2, last + 3, last + 0, last + 1);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
  }

  createPart('BilgeKeelStbd', bilgeKeelGeo(1), hullLowerMat, { parent: root });
  createPart('BilgeKeelPort', bilgeKeelGeo(-1), hullLowerMat, { parent: root });

  // ==========================================
  // 3. HEAVY ROPE FENDER BELTING & BOW PUDDING FENDER
  // ==========================================
  const fullFenderPath = [];
  for (let i = numStations; i >= 0; i--) {
    fullFenderPath.push([sheerlinePoints[i][0], sheerlinePoints[i][1] - 0.05, sheerlinePoints[i][2] + 0.12]);
  }
  const sternR = 1.58;
  for (let a = 0; a <= 6; a++) {
    const theta = (a / 6) * Math.PI;
    const sx = -6.6 - Math.sin(theta) * 0.42;
    const sz = Math.cos(theta) * sternR;
    fullFenderPath.push([sx, 2.75, sz]);
  }
  for (let i = 0; i <= numStations; i++) {
    fullFenderPath.push([sheerlinePort[i][0], sheerlinePort[i][1] - 0.05, sheerlinePort[i][2] - 0.12]);
  }

  const fenderBeltGeo = pipeAlongPath(fullFenderPath, 0.24, { bendRadius: 0.25, closed: true, tubularSegments: 36, radialSegments: 6 });
  createPart('RopeFenderBelt', fenderBeltGeo, fenderMat, { parent: root });

  // Bow Pudding Fender (Tight to the raked cutwater stem)
  const puddingGroup = createPivot('BowPuddingAssembly', [0, 0, 0], root);
  const pMainPoints = [
    [7.9, 3.1, -0.6],
    [8.5, 3.0, -0.3],
    [8.95, 2.9, 0.0],
    [8.5, 3.0, 0.3],
    [7.9, 3.1, 0.6],
  ];
  const pMainGeo = pipeAlongPath(pMainPoints, 0.38, { bendRadius: 0.2, tubularSegments: 12, radialSegments: 6 });
  createPart('PuddingCenter', pMainGeo, puddingMat, { parent: puddingGroup });

  const pUpperPoints = [
    [8.2, 3.65, -0.5],
    [8.7, 3.55, -0.25],
    [9.15, 3.45, 0.0],
    [8.7, 3.55, 0.25],
    [8.2, 3.65, 0.5],
  ];
  const pUpperGeo = pipeAlongPath(pUpperPoints, 0.32, { bendRadius: 0.18, tubularSegments: 12, radialSegments: 6 });
  createPart('PuddingUpper', pUpperGeo, puddingMat, { parent: puddingGroup });

  const pLowerPoints = [
    [7.7, 2.55, -0.6],
    [8.2, 2.45, -0.3],
    [8.65, 2.35, 0.0],
    [8.2, 2.45, 0.3],
    [7.7, 2.55, 0.6],
  ];
  const pLowerGeo = pipeAlongPath(pLowerPoints, 0.36, { bendRadius: 0.18, tubularSegments: 12, radialSegments: 6 });
  createPart('PuddingLower', pLowerGeo, puddingMat, { parent: puddingGroup });

  beamBetween('PuddingChainTopL', [8.2, 3.75, -0.5], [8.0, 3.6, -0.85], 0.035, darkIronMat, { parent: puddingGroup });
  beamBetween('PuddingChainTopR', [8.2, 3.75,  0.5], [8.0, 3.6,  0.85], 0.035, darkIronMat, { parent: puddingGroup });
  beamBetween('PuddingChainBotL', [7.7, 2.4, -0.55], [7.5, 2.25, -0.9], 0.035, darkIronMat, { parent: puddingGroup });
  beamBetween('PuddingChainBotR', [7.7, 2.4,  0.55], [7.5, 2.25,  0.9], 0.035, darkIronMat, { parent: puddingGroup });

  // Side tyre drop fenders
  const dropFenderX = [-2.5, -0.8, 0.8];
  dropFenderX.forEach((dx, i) => {
    createPart(`TyreStbd_${i}`, torusGeo(0.32, 0.1, 6, 10), rubberMat, { position: [dx, 2.2, 2.48], rotation: [0, 90, 0], parent: root });
    beamBetween(`TyreChainS_${i}`, [dx, 3.05, 2.42], [dx, 2.5, 2.48], 0.02, steelMat, { parent: root });
    createPart(`TyrePort_${i}`, torusGeo(0.32, 0.1, 6, 10), rubberMat, { position: [dx, 2.2, -2.48], rotation: [0, 90, 0], parent: root });
    beamBetween(`TyreChainP_${i}`, [dx, 3.05, -2.42], [dx, 2.5, -2.48], 0.02, steelMat, { parent: root });
  });

  // ==========================================
  // 4. LOW FORECASTLE, ANCHOR WINCH & HAWSE PIPES
  // ==========================================
  createPart('ForecastleDeck', boxGeo(3.6, 0.18, 3.6), deckMat, { position: [6.0, 3.22, 0], parent: root });
  createPart('Breakwater', boxGeo(0.12, 0.35, 3.4), trimDarkMat, { position: [4.2, 3.4, 0], parent: root });

  // Anchor Winch
  createPart('WinchBed', boxGeo(1.5, 0.35, 1.9), darkIronMat, { position: [5.6, 3.45, 0], parent: root });
  createPart('WinchGearCase', boxGeo(0.8, 0.7, 0.6), darkIronMat, { position: [5.6, 3.85, 0], parent: root });
  createPart('WinchDriveMotor', cylinderXGeo(0.24, 0.24, 0.85, 8), steelMat, { position: [5.1, 3.75, 0], parent: root });
  createPart('WildcatPort', cylinderZGeo(0.38, 0.38, 0.32, 10), darkIronMat, { position: [5.6, 3.85, -0.55], parent: root });
  createPart('WildcatStbd', cylinderZGeo(0.38, 0.38, 0.32, 10), darkIronMat, { position: [5.6, 3.85,  0.55], parent: root });
  createPart('WarpingHeadPort', cylinderZGeo(0.26, 0.32, 0.38, 8), steelMat, { position: [5.6, 3.85, -1.0], parent: root });
  createPart('WarpingHeadStbd', cylinderZGeo(0.26, 0.32, 0.38, 8), steelMat, { position: [5.6, 3.85,  1.0], parent: root });
  createPart('BrakeWheelPort', torusGeo(0.22, 0.03, 6, 10), darkIronMat, { position: [5.1, 4.15, -0.55], rotation: [0, 90, 0], parent: root });
  createPart('BrakeWheelStbd', torusGeo(0.22, 0.03, 6, 10), darkIronMat, { position: [5.1, 4.15,  0.55], rotation: [0, 90, 0], parent: root });

  createPart('HawseLipPort', torusGeo(0.25, 0.06, 6, 8), darkIronMat, { position: [7.2, 2.7, -1.25], rotation: [25, 30, 0], parent: root });
  createPart('HawseLipStbd', torusGeo(0.25, 0.06, 6, 8), darkIronMat, { position: [7.2, 2.7,  1.25], rotation: [-25, 30, 0], parent: root });
  beamBetween('ChainRunPort', [5.6, 3.75, -0.55], [6.8, 3.32, -0.85], 0.055, darkIronMat, { parent: root });
  beamBetween('ChainRunStbd', [5.6, 3.75,  0.55], [6.8, 3.32,  0.85], 0.055, darkIronMat, { parent: root });

  beamBetween('AnchorShankPort', [7.2, 2.7, -1.25], [7.7, 2.1, -1.55], 0.07, darkIronMat, { parent: root });
  createPart('AnchorCrownPort', boxGeo(0.3, 0.35, 0.5), darkIronMat, { position: [7.7, 2.05, -1.6], rotation: [20, -35, 10], parent: root });
  createPart('AnchorFlukePort', boxGeo(0.55, 0.5, 0.12), darkIronMat, { position: [7.85, 2.15, -1.62], rotation: [20, -35, 10], parent: root });

  beamBetween('AnchorShankStbd', [7.2, 2.7, 1.25], [7.7, 2.1, 1.55], 0.07, darkIronMat, { parent: root });
  createPart('AnchorCrownStbd', boxGeo(0.3, 0.35, 0.5), darkIronMat, { position: [7.7, 2.05, 1.6], rotation: [-20, 35, 10], parent: root });
  createPart('AnchorFlukeStbd', boxGeo(0.55, 0.5, 0.12), darkIronMat, { position: [7.85, 2.15, 1.62], rotation: [-20, 35, 10], parent: root });

  createPart('BowCenterChock', boxGeo(0.4, 0.25, 0.5), darkIronMat, { position: [8.2, 3.85, 0], parent: root });
  createPart('BowChockHole', cylinderXGeo(0.12, 0.12, 0.5, 8), trimDarkMat, { position: [8.2, 3.88, 0], parent: root });

  // ==========================================
  // 5. WHITE DECKHOUSE & GLAZED WHEELHOUSE WITH WALKAROUND BRIDGE
  // ==========================================
  createPart('DeckhouseMain', boxGeo(4.8, 1.55, 3.1), deckhouseMat, { position: [1.8, 3.5, 0], parent: root });
  createPart('EngineCasing', boxGeo(2.2, 1.35, 2.4), deckhouseMat, { position: [-0.9, 3.4, 0], parent: root });

  createPart('DoorStbd', boxGeo(0.1, 1.3, 0.7), trimDarkMat, { position: [0.8, 3.4, 1.57], parent: root });
  createPart('DoorPort', boxGeo(0.1, 1.3, 0.7), trimDarkMat, { position: [0.8, 3.4, -1.57], parent: root });

  const portholeOffsets = [-0.4, 1.8, 3.0];
  portholeOffsets.forEach((px, i) => {
    createPart(`PortholeStbd_${i}`, torusGeo(0.15, 0.03, 6, 8), brassMat, { position: [px, 3.65, 1.57], rotation: [0, 90, 0], parent: root });
    createPart(`PortholePort_${i}`, torusGeo(0.15, 0.03, 6, 8), brassMat, { position: [px, 3.65, -1.57], rotation: [0, 90, 0], parent: root });
  });

  createPart('LouverStbd', boxGeo(0.8, 0.4, 0.08), trimDarkMat, { position: [-1.2, 3.65, 1.23], parent: root });
  createPart('LouverPort', boxGeo(0.8, 0.4, 0.08), trimDarkMat, { position: [-1.2, 3.65, -1.23], parent: root });
  createPart('MushroomVent1', cylinderYGeo(0.18, 0.12, 0.4, 8), steelMat, { position: [-1.6, 4.3, 0.7], parent: root });
  createPart('MushroomVent2', cylinderYGeo(0.18, 0.12, 0.4, 8), steelMat, { position: [-1.6, 4.3, -0.7], parent: root });

  createLadder('BridgeLadderPort', { bottom: [0.0, 2.65, -1.75], top: [0.0, 4.25, -1.75], width: 0.48, rungCount: 5, material: steelMat, parent: root });
  createLadder('BridgeLadderStbd', { bottom: [0.0, 2.65,  1.75], top: [0.0, 4.25,  1.75], width: 0.48, rungCount: 5, material: steelMat, parent: root });

  createPart('LifebuoyStbd', torusGeo(0.3, 0.08, 6, 10), lifeRingMat, { position: [2.5, 3.6, 1.6], rotation: [0, 90, 0], parent: root });
  createPart('LifebuoyPort', torusGeo(0.3, 0.08, 6, 10), lifeRingMat, { position: [2.5, 3.6, -1.6], rotation: [0, 90, 0], parent: root });

  createPart('BridgeDeckFloor', boxGeo(5.2, 0.16, 3.7), deckMat, { position: [1.8, 4.28, 0], parent: root });
  createPart('BridgeWingStbd', boxGeo(1.6, 0.16, 0.45), deckMat, { position: [2.2, 4.28, 2.05], parent: root });
  createPart('BridgeWingPort', boxGeo(1.6, 0.16, 0.45), deckMat, { position: [2.2, 4.28, -2.05], parent: root });

  const bridgeRailGroup = createPivot('BridgeRailings', [0, 0, 0], root);
  const railH = 0.92;
  const bY = 4.36;
  const bPerimeter = [
    [-0.7, 1.85], [1.4, 1.85], [1.4, 2.25], [3.0, 2.25], [3.0, 1.85], [4.3, 1.85],
    [4.3, -1.85], [3.0, -1.85], [3.0, -2.25], [1.4, -2.25], [1.4, -1.85], [-0.7, -1.85]
  ];
  const topRailPts = bPerimeter.map(p => [p[0], bY + railH, p[1]]);
  const midRailPts = bPerimeter.map(p => [p[0], bY + railH * 0.5, p[1]]);
  const topRailGeo = pipeAlongPath(topRailPts, 0.028, { bendRadius: 0.1, closed: true, tubularSegments: 24, radialSegments: 5 });
  createPart('BridgeTopRail', topRailGeo, steelMat, { parent: bridgeRailGroup });

  const midRailGeo = pipeAlongPath(midRailPts, 0.02, { bendRadius: 0.1, closed: true, tubularSegments: 24, radialSegments: 5 });
  createPart('BridgeMidRail', midRailGeo, steelMat, { parent: bridgeRailGroup });

  bPerimeter.forEach((p, idx) => {
    beamBetween(`Stanchion_${idx}`, [p[0], bY, p[1]], [p[0], bY + railH, p[1]], 0.026, steelMat, { parent: bridgeRailGroup });
  });

  // Glazed Wheelhouse
  createPart('WheelhouseLower', boxGeo(3.0, 0.6, 2.6), deckhouseMat, { position: [2.2, 4.66, 0], parent: root });
  createPart('WheelhouseRoof', boxGeo(3.4, 0.16, 3.0), deckhouseMat, { position: [2.2, 5.92, 0], parent: root });
  createPart('SunVisor', boxGeo(0.5, 0.08, 3.1), trimDarkMat, { position: [3.8, 5.9, 0], rotation: [0, 0, -15], parent: root });

  createPart('FrontWinGlass', boxGeo(0.06, 0.75, 2.3), glassMat, { position: [3.71, 5.35, 0], parent: root });
  createPart('ClearViewScreen', torusGeo(0.24, 0.025, 6, 10), brassMat, { position: [3.73, 5.35, 0], rotation: [0, 90, 0], parent: root });
  beamBetween('MullionF1', [3.72, 4.96, -0.6], [3.72, 5.76, -0.6], 0.035, trimDarkMat, { parent: root });
  beamBetween('MullionF2', [3.72, 4.96,  0.6], [3.72, 5.76,  0.6], 0.035, trimDarkMat, { parent: root });

  createPart('StbdWinGlass', boxGeo(2.4, 0.75, 0.06), glassMat, { position: [2.2, 5.35, 1.31], parent: root });
  beamBetween('MullionS1', [1.6, 4.96, 1.32], [1.6, 5.76, 1.32], 0.035, trimDarkMat, { parent: root });
  beamBetween('MullionS2', [2.8, 4.96, 1.32], [2.8, 5.76, 1.32], 0.035, trimDarkMat, { parent: root });

  createPart('PortWinGlass', boxGeo(2.4, 0.75, 0.06), glassMat, { position: [2.2, 5.35, -1.31], parent: root });
  beamBetween('MullionP1', [1.6, 4.96, -1.32], [1.6, 5.76, -1.32], 0.035, trimDarkMat, { parent: root });
  beamBetween('MullionP2', [2.8, 4.96, -1.32], [2.8, 5.76, -1.32], 0.035, trimDarkMat, { parent: root });

  createPart('AftWinGlass', boxGeo(0.06, 0.75, 1.8), glassMat, { position: [0.69, 5.35, 0], parent: root });

  // Interior
  createPart('HelmConsole', boxGeo(0.6, 0.5, 1.4), darkIronMat, { position: [3.3, 5.15, 0], parent: root });
  createPart('ShipWheel', torusGeo(0.24, 0.03, 6, 10), brassMat, { position: [3.1, 5.35, 0], rotation: [0, 90, 0], parent: root });
  createPart('TelegraphStbd', cylinderYGeo(0.08, 0.1, 0.5, 8), brassMat, { position: [3.2, 5.25, 0.55], parent: root });
  createPart('TelegraphPort', cylinderYGeo(0.08, 0.1, 0.5, 8), brassMat, { position: [3.2, 5.25, -0.55], parent: root });
  createPart('HelmChair', boxGeo(0.45, 0.45, 0.45), darkIronMat, { position: [2.3, 5.2, 0], parent: root });

  // Searchlight & horns
  createPart('SearchlightBase', cylinderYGeo(0.12, 0.15, 0.25, 8), steelMat, { position: [3.2, 6.12, 0], parent: root });
  createPart('SearchlightBarrel', cylinderXGeo(0.2, 0.24, 0.35, 8), brassMat, { position: [3.25, 6.35, 0], parent: root });
  createPart('SearchlightLens', sphereGeo(0.18, 6, 6), lanternWhite, { position: [3.42, 6.35, 0], scale: [0.3, 1, 1], parent: root });
  createPart('AirHornLong', coneXGeo(0.12, 0.65, 8), brassMat, { position: [2.5, 6.18, 0.55], parent: root });
  createPart('AirHornShort', coneXGeo(0.11, 0.45, 8), brassMat, { position: [2.5, 6.18, 0.75], parent: root });

  // Funnel
  const funnelPivot = createPivot('FunnelAssembly', [-0.5, 4.2, 0], root);
  funnelPivot.rotation.z = -0.14;
  createPart('FunnelBody', cylinderYGeo(0.72, 0.82, 1.9, 14), funnelMat, {
    position: [0, 0.95, 0],
    scale: [1.35, 1.0, 0.9],
    parent: funnelPivot
  });
  createPart('FunnelWhiteBand', cylinderYGeo(0.73, 0.76, 0.45, 14), bootTopMat, {
    position: [0, 1.15, 0],
    scale: [1.36, 1.0, 0.91],
    parent: funnelPivot
  });
  createPart('FunnelBlackCap', cylinderYGeo(0.74, 0.72, 0.5, 14), funnelCapMat, {
    position: [0, 2.05, 0],
    scale: [1.38, 1.0, 0.92],
    parent: funnelPivot
  });
  createPart('ExhaustPipeMain', cylinderYGeo(0.18, 0.18, 0.7, 8), funnelCapMat, { position: [0.2, 2.4, 0], parent: funnelPivot });
  createPart('ExhaustPipeAux', cylinderYGeo(0.11, 0.11, 0.6, 6), funnelCapMat, { position: [-0.25, 2.35, 0.15], parent: funnelPivot });
  beamBetween('WhistlePipe', [0.85, 0.1, 0], [0.75, 2.3, 0], 0.035, brassMat, { parent: funnelPivot });

  // Mast
  const mastPivot = createPivot('MastAssembly', [1.8, 5.95, 0], root);
  mastPivot.rotation.z = -0.05;
  createPart('MastLowerPole', cylinderYGeo(0.1, 0.15, 1.8, 8), mastMat, { position: [0, 0.9, 0], parent: mastPivot });
  createPart('MastUpperPole', cylinderYGeo(0.05, 0.1, 1.8, 8), mastMat, { position: [0, 2.7, 0], parent: mastPivot });
  beamBetween('MastStayFwd', [0, 2.0, 0], [1.3, 0.05, 0], 0.02, steelMat, { parent: mastPivot });
  beamBetween('MastStayPort', [0, 2.0, 0], [-0.4, 0.05, -1.3], 0.02, steelMat, { parent: mastPivot });
  beamBetween('MastStayStbd', [0, 2.0, 0], [-0.4, 0.05,  1.3], 0.02, steelMat, { parent: mastPivot });

  createPart('RadarPlatform', boxGeo(0.7, 0.1, 0.7), mastMat, { position: [0.15, 1.35, 0], parent: mastPivot });
  createPart('RadarMotorBox', cylinderYGeo(0.18, 0.22, 0.25, 8), mastMat, { position: [0.15, 1.52, 0], parent: mastPivot });
  createPart('RadarScannerBar', boxGeo(0.14, 0.12, 1.25), deckhouseMat, { position: [0.15, 1.72, 0], parent: mastPivot });
  createPart('RadarScannerFace', decalBox(0.03, 0.09, 1.2), trimDarkMat, { position: [0.23, 1.72, 0], parent: mastPivot });

  beamBetween('CrossYard', [0, 2.4, -1.1], [0, 2.4, 1.1], 0.045, mastMat, { parent: mastPivot });

  // Navigation lights with screens
  createPart('NavScreenStbd', boxGeo(0.24, 0.3, 0.04), trimDarkMat, { position: [0, 2.4, 1.05], parent: mastPivot });
  createPart('NavLanternStbd', boxGeo(0.14, 0.2, 0.14), lanternGreen, { position: [0.08, 2.4, 1.15], parent: mastPivot });
  createPart('NavScreenPort', boxGeo(0.24, 0.3, 0.04), trimDarkMat, { position: [0, 2.4, -1.05], parent: mastPivot });
  createPart('NavLanternPort', boxGeo(0.14, 0.2, 0.14), lanternRed, { position: [0.08, 2.4, -1.15], parent: mastPivot });
  createPart('MastheadLantern', boxGeo(0.14, 0.2, 0.14), lanternWhite, { position: [0.12, 3.1, 0], parent: mastPivot });

  createPart('TowingLightUpper', boxGeo(0.12, 0.15, 0.12), lanternAmber, { position: [-0.1, 2.8, 0], parent: mastPivot });
  createPart('TowingLightLower', boxGeo(0.12, 0.15, 0.12), lanternAmber, { position: [-0.1, 2.5, 0], parent: mastPivot });

  createPart('MastTruck', cylinderYGeo(0.08, 0.08, 0.08, 6), brassMat, { position: [0, 3.65, 0], parent: mastPivot });
  beamBetween('AntennaPort', [0, 3.45, -0.04], [0, 5.0, -0.35], 0.015, steelMat, { parent: mastPivot });
  beamBetween('AntennaStbd', [0, 3.45,  0.04], [0, 5.0,  0.35], 0.015, steelMat, { parent: mastPivot });

  // ==========================================
  // 8. TOWING HOOK, TOWING ARCHES & BITTS ON OPEN AFTER DECK
  // ==========================================
  const arch1Points = [];
  for (let a = 0; a <= 10; a++) {
    const theta = (a / 10) * Math.PI;
    const ay = 2.65 + Math.sin(theta) * 1.35;
    const az = -Math.cos(theta) * 2.2;
    arch1Points.push([-3.4, ay, az]);
  }
  const arch1Geo = pipeAlongPath(arch1Points, 0.065, { bendRadius: 0.15, tubularSegments: 12, radialSegments: 6 });
  createPart('TowingArchForward', arch1Geo, steelMat, { parent: root });

  const arch2Points = [];
  for (let a = 0; a <= 10; a++) {
    const theta = (a / 10) * Math.PI;
    const ay = 2.7 + Math.sin(theta) * 1.15;
    const az = -Math.cos(theta) * 1.85;
    arch2Points.push([-5.0, ay, az]);
  }
  const arch2Geo = pipeAlongPath(arch2Points, 0.065, { bendRadius: 0.15, tubularSegments: 12, radialSegments: 6 });
  createPart('TowingArchAft', arch2Geo, steelMat, { parent: root });

  const towPostGroup = createPivot('TowingHookAssembly', [-1.6, 2.65, 0], root);
  createPart('TowingPostMain', boxGeo(0.55, 1.25, 0.55), darkIronMat, { position: [0, 0.62, 0], parent: towPostGroup });
  createPart('TowingPostCrossPin', cylinderZGeo(0.14, 0.14, 1.6, 8), darkIronMat, { position: [0, 0.95, 0], parent: towPostGroup });
  createPart('RadialTrack', torusGeo(1.2, 0.06, 6, 10), steelMat, {
    position: [0, 0.7, 0],
    rotation: [90, 0, 0],
    scale: [0.6, 1, 1],
    parent: towPostGroup
  });
  createPart('SpringCylinder', cylinderXGeo(0.18, 0.18, 0.8, 8), darkIronMat, { position: [-0.45, 0.7, 0], parent: towPostGroup });
  createPart('TowingHookJaw', torusGeo(0.24, 0.07, 6, 10), darkIronMat, {
    position: [-0.95, 0.7, 0],
    rotation: [90, 0, 0],
    parent: towPostGroup
  });
  beamBetween('TripLever', [-0.9, 0.7, 0], [-0.9, 1.15, 0], 0.03, lanternRed, { parent: towPostGroup });

  createPart('HawserReelStandL', boxGeo(0.1, 0.75, 0.12), darkIronMat, { position: [-2.5, 3.0, -0.65], parent: root });
  createPart('HawserReelStandR', boxGeo(0.1, 0.75, 0.12), darkIronMat, { position: [-2.5, 3.0,  0.65], parent: root });
  createPart('HawserDrum', cylinderZGeo(0.35, 0.35, 1.1, 8), darkIronMat, { position: [-2.5, 3.1, 0], parent: root });
  createPart('HawserCoil', cylinderZGeo(0.32, 0.32, 0.9, 8), fenderMat, { position: [-2.5, 3.1, 0], parent: root });
  createPart('AftHatchCoaming', boxGeo(0.9, 0.18, 0.9), darkIronMat, { position: [-4.2, 2.75, 0], parent: root });
  createPart('AftHatchCover', boxGeo(0.82, 0.08, 0.82), trimDarkMat, { position: [-4.2, 2.86, 0], parent: root });
  createPart('SternRollerChock', boxGeo(0.45, 0.3, 0.6), darkIronMat, { position: [-6.45, 3.2, 0], parent: root });
  createPart('SternRollerPin', cylinderZGeo(0.09, 0.09, 0.45, 8), steelMat, { position: [-6.45, 3.25, 0], parent: root });

  const bittLayout = [
    { name: 'BittForePort', pos: [6.4, 3.28, -1.25] },
    { name: 'BittForeStbd', pos: [6.4, 3.28,  1.25] },
    { name: 'BittWaistFwdPort', pos: [3.4, 2.82, -1.95] },
    { name: 'BittWaistFwdStbd', pos: [3.4, 2.82,  1.95] },
    { name: 'BittWaistAftPort', pos: [-3.8, 2.7, -1.95] },
    { name: 'BittWaistAftStbd', pos: [-3.8, 2.7,  1.95] },
    { name: 'BittQuarterPort', pos: [-5.6, 2.78, -1.35] },
    { name: 'BittQuarterStbd', pos: [-5.6, 2.78,  1.35] },
  ];
  bittLayout.forEach(b => {
    const bp = createPivot(b.name, b.pos, root);
    createPart(`${b.name}_Base`, boxGeo(0.35, 0.08, 0.65), darkIronMat, { position: [0, 0.04, 0], parent: bp });
    createPart(`${b.name}_Post1`, cylinderYGeo(0.09, 0.09, 0.45, 8), darkIronMat, { position: [0, 0.28, -0.16], parent: bp });
    createPart(`${b.name}_Post2`, cylinderYGeo(0.09, 0.09, 0.45, 8), darkIronMat, { position: [0, 0.28,  0.16], parent: bp });
    createPart(`${b.name}_Bar`, cylinderZGeo(0.04, 0.04, 0.58, 6), darkIronMat, { position: [0, 0.4, 0], parent: bp });
  });

  // ==========================================
  // 9. SINGLE PROPELLER & RUDDER UNDER COUNTER
  // ==========================================
  createPart('ShaftBossing', cylinderXGeo(0.28, 0.32, 1.4, 10), hullLowerMat, { position: [-4.6, 0.85, 0], parent: root });
  createPart('PropellerShaft', cylinderXGeo(0.09, 0.09, 1.0, 8), steelMat, { position: [-5.2, 0.85, 0], parent: root });
  
  // Propeller Hub (raised to Y = 0.85m to ensure ample clearance above skeg shoe)
  createPart('PropellerHub', cylinderXGeo(0.24, 0.16, 0.5, 10), brassMat, { position: [-5.65, 0.85, 0], parent: root });
  // 4 Propeller blades: tips stay well above skeg (lowest blade reaches Y = 0.22m)
  for (let b = 0; b < 4; b++) {
    const bladeAngleDeg = b * 90;
    const rad = bladeAngleDeg * Math.PI / 180;
    const bladeDist = 0.40;
    const by = Math.sin(rad) * bladeDist;
    const bz = Math.cos(rad) * bladeDist;
    createPart(`PropBlade_${b}`, boxGeo(0.12, 0.46, 0.28), brassMat, {
      position: [-5.65, 0.85 + by, bz],
      rotation: [bladeAngleDeg + 28, 0, 0],
      scale: [1, 1, 0.7],
      parent: root
    });
  }

  // Rudder Assembly
  const rudderGroup = createPivot('RudderAssembly', [-6.35, 0, 0], root);
  createPart('RudderStock', cylinderYGeo(0.12, 0.12, 1.4, 8), steelMat, { position: [0, 1.35, 0], parent: rudderGroup });
  createPart('RudderBladeMain', boxGeo(1.05, 1.35, 0.14), hullLowerMat, { position: [-0.35, 0.78, 0], parent: rudderGroup });
  createPart('RudderLeadingEdge', cylinderYGeo(0.08, 0.08, 1.35, 8), hullLowerMat, { position: [0.15, 0.78, 0], parent: rudderGroup });
  createPart('RudderHeelBearing', cylinderYGeo(0.12, 0.12, 0.22, 8), darkIronMat, { position: [0, 0.11, 0], parent: rudderGroup });

  return root;
}

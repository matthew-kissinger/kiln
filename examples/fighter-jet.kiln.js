// Authored by: opus, via claude.
//
// Written by the model itself through the Kiln MCP tools, and cut off
// mid-run rather than finished -- by a provider limit, or by the
// dispatch deadline. The program below is what was on disk when the
// session ended; how many times it had looked at its own contact sheet
// by then is not recorded, so this one does not make the claim the
// others do.
//
// Dispatched into a clean directory containing only the brief and the Kiln
// skills, with no access to this repository or to any finished example.
//
// Refined later, in this repository, with `kiln_edit`: the wing was split at
// its own hinge lines. It had been lofted full chord underneath the flap, the
// flaperon and the aileron, which are lofted from the same stations over the
// same aerofoil, so both wings carried a hatched wedge from top where two
// identical surfaces sat at one depth. The skin was repainted later still;
// the comment at the material says why.

const meta = { name: 'FighterJet', category: 'prop', role: 'vehicle' };

// ---------------------------------------------------------------------------
// Frame: +X forward (nose), +Y up, +Z asset right. Gear down, tyres on Y = 0.
// Overall: 16.5 m nose to tail, 11.0 m span, 4.6 m to the fin tips.
// ---------------------------------------------------------------------------

const D2R = Math.PI / 180;

function lerp(a, b, t) { return a + (b - a) * t; }

// Generic skinned loft. `sections` is an array of equal-length rings of
// [x,y,z] points, ordered consistently around the loop. Both ends are capped
// with a centroid fan, then the winding is normalised by signed volume so the
// surface always faces outward (or inward when opts.invert is set).
function loftGeo(sections, opts) {
  opts = opts || {};
  const M = sections.length;
  const N = sections[0].length;
  const verts = [];
  for (let s = 0; s < M; s++) {
    const sec = sections[s];
    for (let i = 0; i < N; i++) verts.push(sec[i][0], sec[i][1], sec[i][2]);
  }
  const idx = [];
  for (let s = 0; s < M - 1; s++) {
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N;
      const a = s * N + i, b = s * N + j, c = (s + 1) * N + i, d = (s + 1) * N + j;
      idx.push(a, c, d);
      idx.push(a, d, b);
    }
  }
  if (opts.capStart !== false) {
    let cx = 0, cy = 0, cz = 0;
    for (let i = 0; i < N; i++) { cx += sections[0][i][0]; cy += sections[0][i][1]; cz += sections[0][i][2]; }
    const ci = verts.length / 3;
    verts.push(cx / N, cy / N, cz / N);
    for (let i = 0; i < N; i++) { const j = (i + 1) % N; idx.push(ci, j, i); }
  }
  if (opts.capEnd !== false) {
    const base = (M - 1) * N;
    let cx = 0, cy = 0, cz = 0;
    for (let i = 0; i < N; i++) { cx += sections[M - 1][i][0]; cy += sections[M - 1][i][1]; cz += sections[M - 1][i][2]; }
    const ci = verts.length / 3;
    verts.push(cx / N, cy / N, cz / N);
    for (let i = 0; i < N; i++) { const j = (i + 1) % N; idx.push(ci, base + i, base + j); }
  }
  let vol = 0;
  for (let t = 0; t < idx.length; t += 3) {
    const i0 = idx[t] * 3, i1 = idx[t + 1] * 3, i2 = idx[t + 2] * 3;
    const ax = verts[i0], ay = verts[i0 + 1], az = verts[i0 + 2];
    const bx = verts[i1], by = verts[i1 + 1], bz = verts[i1 + 2];
    const cx2 = verts[i2], cy2 = verts[i2 + 1], cz2 = verts[i2 + 2];
    vol += ax * (by * cz2 - bz * cy2) + ay * (bz * cx2 - bx * cz2) + az * (bx * cy2 - by * cx2);
  }
  const wantPositive = !opts.invert;
  if ((vol > 0) !== wantPositive) {
    for (let t = 0; t < idx.length; t += 3) { const tmp = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = tmp; }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

// Surface of revolution about a cardinal axis from a CLOSED 2D outline of
// [axial, radial] pairs -> watertight tube/solid. Used for nozzles and tyres.
function revolveClosed(profile, segments, axis) {
  const sections = [];
  for (let s = 0; s < segments; s++) {
    const a = (s / segments) * Math.PI * 2;
    const ca = Math.cos(a), sa = Math.sin(a);
    const ring = [];
    for (let i = 0; i < profile.length; i++) {
      const p = profile[i][0], r = profile[i][1];
      if (axis === 'x') ring.push([p, r * ca, r * sa]);
      else if (axis === 'z') ring.push([r * ca, r * sa, p]);
      else ring.push([r * ca, p, r * sa]);
    }
    sections.push(ring);
  }
  // wrap around: treat as closed in the sweep direction too
  const M = sections.length, N = profile.length;
  const verts = [];
  for (let s = 0; s < M; s++) for (let i = 0; i < N; i++) verts.push(sections[s][i][0], sections[s][i][1], sections[s][i][2]);
  const idx = [];
  for (let s = 0; s < M; s++) {
    const s2 = (s + 1) % M;
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N;
      const a = s * N + i, b = s * N + j, c = s2 * N + i, d = s2 * N + j;
      idx.push(a, c, d);
      idx.push(a, d, b);
    }
  }
  let vol = 0;
  for (let t = 0; t < idx.length; t += 3) {
    const i0 = idx[t] * 3, i1 = idx[t + 1] * 3, i2 = idx[t + 2] * 3;
    const ax = verts[i0], ay = verts[i0 + 1], az = verts[i0 + 2];
    const bx = verts[i1], by = verts[i1 + 1], bz = verts[i1 + 2];
    const cx = verts[i2], cy = verts[i2 + 1], cz = verts[i2 + 2];
    vol += ax * (by * cz - bz * cy) + ay * (bz * cx - bx * cz) + az * (bx * cy - by * cx);
  }
  if (vol < 0) for (let t = 0; t < idx.length; t += 3) { const tmp = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = tmp; }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

// NACA symmetric half-thickness shape function, normalised so the peak is ~0.5.
function foilF(u) {
  const t = Math.max(0, Math.min(1, u));
  return 5 * (0.2969 * Math.sqrt(t) - 0.1260 * t - 0.3516 * t * t + 0.2843 * t * t * t - 0.1036 * t * t * t * t);
}

// Lofts a chordwise SLICE (u0..u1 of chord) of an aerofoil surface across a
// list of span stations. `mapper(x, station, offset)` puts a point in world space.
function foilLoft(stations, u0, u1, n, mapper) {
  const sections = [];
  const us = [];
  for (let i = 0; i <= n; i++) { const p = (1 - Math.cos(Math.PI * i / n)) / 2; us.push(u0 + (u1 - u0) * p); }
  for (let s = 0; s < stations.length; s++) {
    const st = stations[s];
    const chord = st.le - st.te;
    const loop = [];
    for (let i = 0; i <= n; i++) {
      const u = us[i];
      loop.push(mapper(st.le - u * chord, st, foilF(u) * st.t * chord));
    }
    for (let i = n; i >= 0; i--) {
      const u = us[i];
      loop.push(mapper(st.le - u * chord, st, -foilF(u) * st.t * chord));
    }
    sections.push(loop);
  }
  return loftGeo(sections, {});
}

// Chined fuselage cross-section: superellipse above and below a hard chine
// edge that carries a small vertical facet so it stays crisp when smoothed.
function fuseRing(st, nTop, nBot) {
  const pts = [];
  const eps = st.chine;
  for (let i = 0; i <= nTop; i++) {
    const t = (i / nTop) * Math.PI;
    const c = Math.cos(t), s = Math.sin(t);
    const z = st.w * Math.sign(c) * Math.pow(Math.abs(c), 2 / st.eTop);
    const y = st.cy + eps + st.hu * Math.pow(Math.abs(s), 2 / st.eTop);
    pts.push([st.x, y, z]);
  }
  for (let i = 0; i <= nBot; i++) {
    const t = Math.PI + (i / nBot) * Math.PI;
    const c = Math.cos(t), s = Math.sin(t);
    const z = st.w * Math.sign(c) * Math.pow(Math.abs(c), 2 / st.eBot);
    const y = st.cy - eps - st.hl * Math.pow(Math.abs(s), 2 / st.eBot);
    pts.push([st.x, y, z]);
  }
  return pts;
}

function roundRect(w, h, r, n) {
  // n points around a rounded rectangle in (z,y), centred on origin
  const pts = [];
  const cx = [w - r, w - r, -(w - r), -(w - r)];
  const cy = [h - r, -(h - r), -(h - r), h - r];
  const a0 = [0, -90, 180, 90];
  const per = Math.max(2, Math.round(n / 4));
  for (let q = 0; q < 4; q++) {
    for (let i = 0; i < per; i++) {
      const a = (a0[q] + (q === 0 ? 0 : 0) + (i / per) * 90 + (q === 0 ? 0 : 0)) * D2R;
      const ang = (a0[q] - (i / per) * 90) * D2R;
      pts.push([cx[q] + r * Math.cos(ang), cy[q] + r * Math.sin(ang)]);
    }
  }
  return pts;
}

async function build() {
  const root = createRoot('FighterJet');

  // ------------------------------------------------------------ materials
  // Low-visibility tactical paint, which is what an airframe is finished in --
  // it is not bare metal, and metalness 0.32 on a light grey was enough to make
  // it act like some. Under the studio dome the whole aircraft came back a
  // uniform near-white: not one panel line, not one shadow across the fuselage
  // spine, and no difference at all between the two tones the scheme is built
  // from. Paint is dielectric, so the metalness goes to almost nothing, and the
  // two greys move apart far enough that the upper surfaces read as a scheme.
  const skin = gameMaterial(0x5c646f, { metalness: 0.06, roughness: 0.62, flatShading: false });
  const skinDark = gameMaterial(0x424951, { metalness: 0.06, roughness: 0.66, flatShading: false });
  const radomeMat = gameMaterial(0x4e545b, { metalness: 0.10, roughness: 0.80, flatShading: false });
  const nozzleMat = gameMaterial(0xa89e90, { metalness: 0.92, roughness: 0.38, flatShading: false });
  const burnt = gameMaterial(0x4b433a, { metalness: 0.85, roughness: 0.62, flatShading: false });
  const black = gameMaterial(0x1b1e21, { roughness: 0.88, metalness: 0.15 });
  const rubber = gameMaterial(0x131416, { roughness: 0.98, metalness: 0.02 });
  const steel = gameMaterial(0xc9ced3, { metalness: 0.95, roughness: 0.18 });
  const duct = gameMaterial(0x8f949a, { metalness: 0.10, roughness: 0.55, flatShading: false });
  const glass = glassMaterial(0x8fb8cc, { opacity: 0.34, roughness: 0.06, metalness: 0.35 });
  const lightR = gameMaterial(0xd21f2a, { emissive: 0xd21f2a, emissiveIntensity: 0.9, roughness: 0.4 });
  const lightG = gameMaterial(0x21c04a, { emissive: 0x21c04a, emissiveIntensity: 0.9, roughness: 0.4 });
  const lightW = gameMaterial(0xf2f4f0, { emissive: 0xf2f4f0, emissiveIntensity: 0.8, roughness: 0.4 });

  // ------------------------------------------------------------- fuselage
  // x, half-width, chine height, upper height, lower depth, superellipse exps
  const fuseTable = [
    [8.62, 0.030, 2.000, 0.030, 0.030, 2.4, 2.4],
    [8.45, 0.140, 2.000, 0.125, 0.120, 2.5, 2.4],
    [8.10, 0.320, 2.000, 0.250, 0.240, 2.6, 2.4],
    [7.40, 0.500, 2.000, 0.380, 0.360, 2.7, 2.5],
    [6.60, 0.660, 2.000, 0.480, 0.460, 2.8, 2.5],
    [5.80, 0.780, 2.000, 0.540, 0.540, 2.9, 2.5],
    [5.00, 0.860, 2.000, 0.575, 0.600, 3.0, 2.6],
    [4.20, 0.920, 2.000, 0.600, 0.660, 3.0, 2.6],
    [3.40, 0.980, 2.000, 0.620, 0.720, 3.0, 2.7],
    [2.60, 1.040, 2.000, 0.640, 0.780, 3.0, 2.7],
    [1.80, 1.100, 1.990, 0.660, 0.820, 3.0, 2.8],
    [1.00, 1.160, 1.980, 0.680, 0.840, 3.0, 2.8],
    [0.10, 1.220, 1.970, 0.700, 0.860, 3.0, 2.8],
    [-0.80, 1.250, 1.960, 0.700, 0.860, 3.0, 2.8],
    [-1.70, 1.250, 1.955, 0.685, 0.845, 3.0, 2.8],
    [-2.60, 1.235, 1.950, 0.665, 0.825, 2.9, 2.8],
    [-3.50, 1.205, 1.950, 0.625, 0.785, 2.9, 2.7],
    [-4.40, 1.165, 1.950, 0.585, 0.745, 2.8, 2.7],
    [-5.30, 1.125, 1.950, 0.545, 0.690, 2.8, 2.6],
    [-6.20, 1.075, 1.950, 0.500, 0.625, 2.7, 2.6],
    [-6.70, 1.040, 1.950, 0.475, 0.585, 2.7, 2.5],
    [-7.05, 1.010, 1.950, 0.460, 0.560, 2.6, 2.5],
  ];
  const fuseSections = fuseTable.map(function (r) {
    return fuseRing({ x: r[0], w: r[1], cy: r[2], hu: r[3], hl: r[4], eTop: r[5], eBot: r[6], chine: 0.018 }, 11, 11);
  });
  createPart('Fuselage', loftGeo(fuseSections, {}), skin, { parent: root });

  // Radome: a darker dielectric cap over the forward 2 m of the nose.
  const radomeSections = fuseTable.filter(function (r) { return r[0] >= 6.55; }).map(function (r) {
    return fuseRing({ x: r[0], w: r[1] * 1.006, cy: r[2], hu: r[3] * 1.006, hl: r[4] * 1.006, eTop: r[5], eBot: r[6], chine: 0.019 }, 11, 11);
  });
  createPart('Radome', loftGeo(radomeSections, {}), radomeMat, { parent: root });

  // Pitot boom on the radome tip: nose datum is X = 9.00.
  createPart('PitotBoom', cylinderXGeo(0.016, 0.030, 0.40, 8), steel, { position: [8.80, 2.000, 0], parent: root });
  createPart('PitotTip', coneXGeo(0.016, 0.06, 8), black, { position: [8.97, 2.000, 0], parent: root });

  // Dorsal spine fairing behind the canopy.
  const spineSections = [];
  const spineTable = [[2.95, 0.30, 0.10], [2.20, 0.36, 0.16], [1.20, 0.40, 0.19], [0.00, 0.42, 0.20], [-1.40, 0.40, 0.18], [-2.60, 0.35, 0.14], [-3.40, 0.28, 0.08]];
  for (let i = 0; i < spineTable.length; i++) {
    const x = spineTable[i][0], w = spineTable[i][1], h = spineTable[i][2];
    // ride on the fuselage upper surface at that station
    let top = 2.60;
    for (let k = 0; k < fuseTable.length - 1; k++) {
      if (x <= fuseTable[k][0] && x >= fuseTable[k + 1][0]) {
        const t = (fuseTable[k][0] - x) / (fuseTable[k][0] - fuseTable[k + 1][0]);
        top = lerp(fuseTable[k][2] + fuseTable[k][3], fuseTable[k + 1][2] + fuseTable[k + 1][3], t);
      }
    }
    const ring = [];
    const n = 9;
    for (let j = 0; j <= n; j++) {
      const a = (j / n) * Math.PI;
      ring.push([x, top - 0.14 + h * Math.pow(Math.sin(a), 0.75), w * Math.cos(a)]);
    }
    for (let j = n - 1; j >= 1; j--) {
      const a = (j / n) * Math.PI;
      ring.push([x, top - 0.16, w * Math.cos(a) * 0.98]);
    }
    spineSections.push(ring);
  }
  createPart('DorsalSpine', loftGeo(spineSections, {}), skin, { parent: root });

  // ------------------------------------------------- leading-edge root ext
  const lerxTable = [
    [5.90, 0.86, 0.045], [5.40, 0.97, 0.070], [4.60, 1.06, 0.100],
    [3.80, 1.15, 0.125], [3.00, 1.25, 0.150], [2.40, 1.34, 0.165], [1.90, 1.40, 0.170],
  ];
  for (let s = -1; s <= 1; s += 2) {
    const secs = [];
    for (let i = 0; i < lerxTable.length; i++) {
      const x = lerxTable[i][0], zo = lerxTable[i][1], th = lerxTable[i][2];
      const zi = 0.45;
      const nv = 7;
      const ring = [];
      for (let j = 0; j <= nv; j++) {
        const v = j / nv;
        const z = lerp(zi, zo, v);
        ring.push([x, 2.000 + (th * Math.pow(1 - v, 0.55) + 0.006), s * z]);
      }
      for (let j = nv; j >= 0; j--) {
        const v = j / nv;
        const z = lerp(zi, zo, v);
        ring.push([x, 2.000 - (th * Math.pow(1 - v, 0.55) + 0.006), s * z]);
      }
      secs.push(ring);
    }
    createPart(s > 0 ? 'LerxRight' : 'LerxLeft', loftGeo(secs, {}), skin, { parent: root });
  }

  // ------------------------------------------------------------ main wing
  const wingStations = [
    { s: 0.95, le: 2.79, te: -4.15, t: 0.062, y: 1.920 },
    { s: 1.60, le: 2.38, te: -4.10, t: 0.060, y: 1.950 },
    { s: 2.40, le: 1.87, te: -4.03, t: 0.058, y: 1.985 },
    { s: 3.30, le: 1.30, te: -3.60, t: 0.056, y: 2.020 },
    { s: 4.20, le: 0.73, te: -3.10, t: 0.052, y: 2.060 },
    { s: 5.10, le: 0.16, te: -2.55, t: 0.048, y: 2.100 },
    { s: 5.50, le: -0.09, te: -2.30, t: 0.046, y: 2.115 },
  ];
  function wingStationsBetween(a, b) {
    const out = [];
    for (let i = 0; i < wingStations.length; i++) if (wingStations[i].s >= a - 1e-6 && wingStations[i].s <= b + 1e-6) out.push(wingStations[i]);
    return out;
  }
  for (let side = -1; side <= 1; side += 2) {
    const nm = side > 0 ? 'Right' : 'Left';
    const map = function (x, st, off) { return [x, st.y + off, side * st.s]; };
    // Split at the hinge lines instead of lofted full chord underneath them.
    // The flap, flaperon and aileron below come off the same stations and the
    // same aerofoil, so a wing that also spans their chord bands lays a second
    // identical surface at the same depth: the top view came back with a
    // hatched wedge across both wings where the rasterizer could not decide
    // which of the two it was looking at. Each band now belongs to one part,
    // and the seams fall exactly where a real hinge line does.
    createPart('WingInboard' + nm, foilLoft(wingStationsBetween(0.95, 1.60), 0.002, 0.985, 13, map), skin, { parent: root });
    createPart('WingBox' + nm, foilLoft(wingStationsBetween(1.60, 5.50), 0.150, 0.735, 13, map), skin, { parent: root });
    // leading-edge flap, outboard of the body side
    createPart('LEFlap' + nm, foilLoft(wingStationsBetween(1.60, 5.50), 0.004, 0.150, 8, map), skinDark, { parent: root });
    // inboard flaperon and outboard aileron
    createPart('Flaperon' + nm, foilLoft(wingStationsBetween(1.60, 3.30), 0.735, 0.985, 8, map), skinDark, { parent: root });
    createPart('Aileron' + nm, foilLoft(wingStationsBetween(3.30, 5.50), 0.735, 0.985, 8, map), skinDark, { parent: root });
    // wingtip nav light + static dischargers
    createPart('NavLight' + nm, capsuleXGeo(0.055, 0.20, 8), side > 0 ? lightG : lightR, { position: [-0.60, 2.118, side * 5.52], parent: root });
    for (let i = 0; i < 3; i++) {
      createPart('StaticWick' + nm + i, cylinderXGeo(0.008, 0.012, 0.28, 5), black, { position: [-2.55 - i * 0.02, 2.10 + i * 0.005, side * (4.55 + i * 0.42)], rotation: [0, -12 * side, 0], parent: root });
    }
  }

  // -------------------------------------------------------- vertical tails
  const finStations = [
    { s: 0.00, le: -3.05, te: -6.75, t: 0.055 },
    { s: 0.65, le: -3.48, te: -6.80, t: 0.050 },
    { s: 1.40, le: -3.98, te: -6.86, t: 0.045 },
    { s: 2.10, le: -4.45, te: -6.91, t: 0.040 },
    { s: 2.54, le: -4.68, te: -6.93, t: 0.038 },
  ];
  const cant = 25 * D2R, finRootY = 2.30, finRootZ = 1.02;
  for (let side = -1; side <= 1; side += 2) {
    const nm = side > 0 ? 'Right' : 'Left';
    const map = function (x, st, off) {
      return [x, finRootY + st.s * Math.cos(cant) - off * Math.sin(cant), side * (finRootZ + st.s * Math.sin(cant) + off * Math.cos(cant))];
    };
    createPart('VerticalTail' + nm, foilLoft(finStations, 0.002, 0.700, 10, map), skin, { parent: root });
    createPart('Rudder' + nm, foilLoft(finStations, 0.712, 0.985, 8, map), skinDark, { parent: root });
    // fin-tip antenna fairing
    const tipY = finRootY + 2.54 * Math.cos(cant), tipZ = side * (finRootZ + 2.54 * Math.sin(cant));
    createPart('FinTipPod' + nm, capsuleXGeo(0.048, 0.55, 8), skinDark, { position: [-5.75, tipY + 0.03, tipZ], rotation: [side * 25, 0, -6], parent: root });
    createPart('FinTipLight' + nm, capsuleXGeo(0.040, 0.10, 8), lightW, { position: [-6.16, tipY - 0.02, tipZ], rotation: [side * 25, 0, -6], parent: root });
  }

  // ----------------------------------------------------------- stabilators
  const stabStations = [
    { s: 0.00, le: -3.70, te: -6.40, t: 0.060 },
    { s: 0.90, le: -4.25, te: -6.42, t: 0.055 },
    { s: 1.70, le: -4.75, te: -6.45, t: 0.048 },
    { s: 2.35, le: -5.15, te: -6.48, t: 0.042 },
  ];
  const anh = 6 * D2R, stabRootY = 1.985, stabRootZ = 0.95;
  for (let side = -1; side <= 1; side += 2) {
    const nm = side > 0 ? 'Right' : 'Left';
    const map = function (x, st, off) {
      return [x, stabRootY - st.s * Math.sin(anh) + off * Math.cos(anh), side * (stabRootZ + st.s * Math.cos(anh) + off * Math.sin(anh))];
    };
    createPart('Stabilator' + nm, foilLoft(stabStations, 0.002, 0.985, 11, map), skin, { parent: root });
    // pivot fairing where the stabilator meets the boom
    createPart('StabPivot' + nm, capsuleXGeo(0.115, 0.70, 10), skinDark, { position: [-5.10, 1.965, side * 1.16], rotation: [0, 0, 0], parent: root });
  }

  // ------------------------------------------------------- caret intakes
  const intakeTable = [
    { x: 2.50, w: 0.455, h: 0.345, r: 0.075, zc: 1.245, yc: 1.505 },
    { x: 2.05, w: 0.460, h: 0.350, r: 0.085, zc: 1.250, yc: 1.510 },
    { x: 1.30, w: 0.470, h: 0.365, r: 0.110, zc: 1.255, yc: 1.530 },
    { x: 0.40, w: 0.470, h: 0.375, r: 0.140, zc: 1.245, yc: 1.560 },
    { x: -0.60, w: 0.450, h: 0.370, r: 0.170, zc: 1.215, yc: 1.590 },
    { x: -1.50, w: 0.410, h: 0.350, r: 0.190, zc: 1.180, yc: 1.620 },
  ];
  for (let side = -1; side <= 1; side += 2) {
    const nm = side > 0 ? 'Right' : 'Left';
    const secs = [];
    for (let i = 0; i < intakeTable.length; i++) {
      const st = intakeTable[i];
      const rr = roundRect(st.w, st.h, st.r, 16);
      const ring = [];
      for (let j = 0; j < rr.length; j++) {
        const zl = rr[j][0], yl = rr[j][1];
        let x = st.x;
        if (i === 0) {
          // caret rake: outboard-lower lip is furthest forward
          x = st.x + 0.24 * (zl / st.w) - 0.16 * (yl / st.h);
        }
        ring.push([x, st.yc + yl, side * (st.zc + zl)]);
      }
      secs.push(ring);
    }
    createPart('Intake' + nm, loftGeo(secs, {}), skin, { parent: root });

    // inner duct, normals inverted so the bore reads as a hole
    const inner = [];
    for (let i = 0; i < intakeTable.length; i++) {
      const st = intakeTable[i];
      const k = 0.86;
      const rr = roundRect(st.w * k, st.h * k, st.r * k, 14);
      const ring = [];
      for (let j = 0; j < rr.length; j++) {
        const zl = rr[j][0], yl = rr[j][1];
        let x = st.x;
        if (i === 0) x = st.x + 0.24 * (zl / (st.w * k)) * k - 0.16 * (yl / (st.h * k)) * k + 0.012;
        ring.push([x, st.yc + yl + (i > 2 ? (i - 2) * 0.05 : 0), side * (st.zc + zl)]);
      }
      inner.push(ring);
    }
    createPart('IntakeDuct' + nm, loftGeo(inner, { invert: true }), duct, { parent: root });
    createPart('IntakeFace' + nm, cylinderXGeo(0.33, 0.33, 0.05, 14), black, { position: [-1.40, 1.72, side * 1.19], parent: root });

    // boundary-layer diverter splitter plate between duct and fuselage side
    createPart('Diverter' + nm, boxGeo(2.9, 0.62, 0.05), skinDark, { position: [1.10, 1.52, side * 0.80], parent: root });
    // lower lip reinforcement
    createPart('IntakeLip' + nm, capsuleZGeo(0.045, 0.80, 8), skinDark, { position: [2.56, 1.175, side * 1.25], rotation: [0, 0, 0], parent: root });
  }

  // ---------------------------------------------------- exhaust / nozzles
  const nozProfile = [
    [-6.10, 0.545], [-6.45, 0.520], [-6.80, 0.480], [-7.10, 0.440], [-7.28, 0.428], [-7.42, 0.440], [-7.50, 0.458],
    [-7.50, 0.418], [-7.42, 0.402], [-7.28, 0.392], [-7.10, 0.404], [-6.80, 0.442], [-6.45, 0.482], [-6.10, 0.508],
  ];
  const petalGeo = await extrudeProfile(
    [[-0.24, -0.020], [0.24, -0.013], [0.24, 0.013], [-0.24, 0.020]],
    { depth: 0.140, axis: 'z', center: true }
  );
  const shingleGeo = await extrudeProfile(
    [[-0.19, -0.022], [0.19, -0.014], [0.19, 0.014], [-0.19, 0.022]],
    { depth: 0.152, axis: 'z', center: true }
  );
  for (let side = -1; side <= 1; side += 2) {
    const nm = side > 0 ? 'Right' : 'Left';
    const zc = side * 0.50, yc = 1.780;
    const noz = createPart('Nozzle' + nm, revolveClosed(nozProfile, 24, 'x'), nozzleMat, { parent: root });
    noz.position.set(0, yc, zc);
    // afterburner interior + flame holder
    createPart('BurnerCan' + nm, cylinderXGeo(0.375, 0.375, 1.30, 16), burnt, { position: [-6.85, yc, zc], parent: root });
    createPart('TurbineFace' + nm, cylinderXGeo(0.36, 0.36, 0.06, 16), black, { position: [-6.55, yc, zc], parent: root });
    createPart('FlameCone' + nm, coneXGeo(0.16, 0.55, 12), burnt, { position: [-6.90, yc, zc], parent: root });

    const count = 20;
    let petal0 = null, shing0 = null;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * 360;
      const ar = a * D2R;
      const py = yc + 0.418 * Math.cos(ar), pz = zc + 0.418 * Math.sin(ar);
      if (i === 0) petal0 = createPart('NozzlePetal' + nm + i, petalGeo, nozzleMat, { position: [-7.30, py, pz], rotation: [a, 0, 0], parent: root });
      else createInstance('NozzlePetal' + nm + i, petal0, { position: [-7.30, py, pz], rotation: [a, 0, 0], parent: root });
      const b = ((i + 0.5) / count) * 360, br = b * D2R;
      const sy = yc + 0.478 * Math.cos(br), sz = zc + 0.478 * Math.sin(br);
      if (i === 0) shing0 = createPart('NozzleShingle' + nm + i, shingleGeo, nozzleMat, { position: [-7.00, sy, sz], rotation: [b, 0, 0], parent: root });
      else createInstance('NozzleShingle' + nm + i, shing0, { position: [-7.00, sy, sz], rotation: [b, 0, 0], parent: root });
    }
    // actuator rods around the nozzle throat
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.4;
      beamBetween('NozzleActuator' + nm + i,
        [-6.55, yc + 0.55 * Math.cos(a), zc + 0.55 * Math.sin(a)],
        [-7.05, yc + 0.475 * Math.cos(a), zc + 0.475 * Math.sin(a)],
        0.026, steel, { parent: root });
    }
  }
  // ventral fairing between the two engine bays
  createPart('EngineBayFairing', capsuleXGeo(0.22, 1.9, 10), skinDark, { position: [-6.10, 1.44, 0], parent: root });

  // ---------------------------------------------------------- cockpit tub
  const tub = boxGeo(2.55, 0.72, 1.14);
  createPart('CockpitTub', tub, black, { position: [4.45, 2.18, 0], parent: root });
  createPart('CockpitFloor', boxGeo(2.4, 0.06, 1.0), black, { position: [4.45, 1.86, 0], parent: root });
  // instrument panel + coaming
  createPart('InstrumentPanel', boxGeo(0.10, 0.46, 0.90), black, { position: [5.42, 2.24, 0], rotation: [0, 0, 18], parent: root });
  createPart('PanelGlare', await roundedBoxGeo(0.34, 0.10, 1.00, 0.035, { segments: 3 }), black, { position: [5.30, 2.47, 0], parent: root });
  createPart('MFD_Centre', decalBox(0.24, 0.24, 0.02), gameMaterial(0x123a2e, { emissive: 0x1d7a5a, emissiveIntensity: 0.5 }), { position: [5.37, 2.26, 0], rotation: [0, 0, 18], parent: root });
  createPart('MFD_Left', decalBox(0.18, 0.18, 0.02), gameMaterial(0x123a2e, { emissive: 0x1d7a5a, emissiveIntensity: 0.5 }), { position: [5.38, 2.24, -0.30], rotation: [0, 0, 18], parent: root });
  createPart('MFD_Right', decalBox(0.18, 0.18, 0.02), gameMaterial(0x123a2e, { emissive: 0x1d7a5a, emissiveIntensity: 0.5 }), { position: [5.38, 2.24, 0.30], rotation: [0, 0, 18], parent: root });
  // HUD
  createPart('HudBody', await roundedBoxGeo(0.26, 0.20, 0.34, 0.03, { segments: 3 }), black, { position: [5.30, 2.62, 0], parent: root });
  createPart('HudCombiner', decalBox(0.30, 0.30, 0.012), glass, { position: [5.22, 2.79, 0], rotation: [0, 0, 15], parent: root });
  createPart('HudCombiner2', decalBox(0.26, 0.26, 0.012), glass, { position: [5.36, 2.77, 0], rotation: [0, 0, 8], parent: root });
  // ejection seat
  createPart('SeatPan', await roundedBoxGeo(0.52, 0.10, 0.50, 0.03, { segments: 3 }), gameMaterial(0x2c3138, { roughness: 0.85 }), { position: [4.10, 2.10, 0], parent: root });
  createPart('SeatBack', await roundedBoxGeo(0.16, 0.66, 0.50, 0.04, { segments: 3 }), gameMaterial(0x2c3138, { roughness: 0.85 }), { position: [3.86, 2.36, 0], rotation: [0, 0, -12], parent: root });
  createPart('SeatHeadbox', await roundedBoxGeo(0.24, 0.30, 0.44, 0.05, { segments: 3 }), gameMaterial(0x33383f, { roughness: 0.85 }), { position: [3.79, 2.72, 0], parent: root });
  createPart('SeatHandle', cylinderZGeo(0.022, 0.022, 0.32, 8), gameMaterial(0xd8b400, { roughness: 0.5 }), { position: [3.86, 2.88, 0], parent: root });
  createPart('ControlStick', cylinderYGeo(0.022, 0.028, 0.30, 8), black, { position: [4.55, 2.10, 0], parent: root });
  createPart('StickGrip', capsuleYGeo(0.038, 0.12, 8), gameMaterial(0x24282d, { roughness: 0.9 }), { position: [4.55, 2.28, 0], parent: root });
  createPart('ThrottleQuadrant', boxGeo(0.34, 0.08, 0.10), black, { position: [4.75, 2.16, -0.44], parent: root });

  // --------------------------------------------------------- bubble canopy
  const canTable = [
    [5.95, 0.30, 0.18, 2.500], [5.70, 0.42, 0.36, 2.500], [5.40, 0.52, 0.55, 2.500],
    [5.00, 0.60, 0.70, 2.510], [4.50, 0.64, 0.78, 2.520], [4.00, 0.64, 0.78, 2.530],
    [3.50, 0.60, 0.70, 2.540], [3.10, 0.52, 0.52, 2.550], [2.85, 0.44, 0.30, 2.560],
  ];
  function canopyRing(x, w, h, sy) {
    const ring = [];
    const n = 12;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI;
      ring.push([x, sy + h * Math.pow(Math.sin(a), 0.78), w * Math.cos(a)]);
    }
    for (let i = n - 1; i >= 1; i--) {
      const a = (i / n) * Math.PI;
      ring.push([x, sy - 0.05, w * Math.cos(a) * 0.985]);
    }
    return ring;
  }
  const canopySections = canTable.map(function (r) { return canopyRing(r[0], r[1], r[2], r[3]); });
  createPart('Canopy', loftGeo(canopySections, {}), glass, { parent: root });

  // canopy framing: windscreen bow, rear bow, and the two sill rails
  function archPath(x, w, h, sy, scale) {
    const pts = [];
    const n = 14;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI;
      pts.push([x, sy + h * scale * Math.pow(Math.sin(a), 0.78), w * scale * Math.cos(a)]);
    }
    return pts;
  }
  createPart('WindscreenBow', curveToMesh(archPath(5.40, 0.52, 0.55, 2.500, 1.015), 0.030, 20, 6), skinDark, { parent: root });
  createPart('CanopyRearBow', curveToMesh(archPath(2.87, 0.44, 0.30, 2.560, 1.015), 0.030, 20, 6), skinDark, { parent: root });
  for (let side = -1; side <= 1; side += 2) {
    const rail = [];
    for (let i = 0; i < canTable.length; i++) rail.push([canTable[i][0], canTable[i][3] - 0.03, side * canTable[i][1] * 1.01]);
    createPart('CockpitSill' + (side > 0 ? 'Right' : 'Left'), curveToMesh(rail, 0.036, 26, 6), skinDark, { parent: root });
  }
  createPart('CanopyActuator', boxGeo(0.55, 0.09, 0.09), steel, { position: [3.05, 2.62, 0], parent: root });

  // -------------------------------------------------------- landing gear
  // shared wheel builder
  function makeWheel(name, cx, cy, cz, R, W, parent) {
    const rBead = R * 0.62;
    const tyre = [
      [-W / 2, rBead], [W / 2, rBead], [W / 2, rBead + (R - rBead) * 0.30], [W * 0.44, rBead + (R - rBead) * 0.72],
      [W * 0.34, R * 0.995], [W * 0.16, R], [-W * 0.16, R], [-W * 0.34, R * 0.995],
      [-W * 0.44, rBead + (R - rBead) * 0.72], [-W / 2, rBead + (R - rBead) * 0.30],
    ];
    const t = createPart(name + 'Tyre', revolveClosed(tyre, 22, 'z'), rubber, { parent: parent });
    t.position.set(cx, cy, cz);
    const rimProf = [
      [-W * 0.40, R * 0.28], [W * 0.40, R * 0.28], [W * 0.40, rBead * 1.02], [W * 0.18, rBead * 1.02],
      [W * 0.10, R * 0.50], [-W * 0.10, R * 0.50], [-W * 0.18, rBead * 1.02], [-W * 0.40, rBead * 1.02],
    ];
    const rim = createPart(name + 'Rim', revolveClosed(rimProf, 18, 'z'), gameMaterial(0x9aa0a6, { metalness: 0.85, roughness: 0.35 }), { parent: parent });
    rim.position.set(cx, cy, cz);
    createPart(name + 'Hub', cylinderZGeo(R * 0.24, R * 0.20, W * 0.95, 12), steel, { position: [cx, cy, cz], parent: parent });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      createPart(name + 'Bolt' + i, cylinderZGeo(0.022, 0.022, W * 0.86, 6), steel,
        { position: [cx + R * 0.36 * Math.cos(a), cy + R * 0.36 * Math.sin(a), cz], parent: parent });
    }
    createPart(name + 'Brake', cylinderZGeo(R * 0.52, R * 0.52, W * 0.30, 14), gameMaterial(0x585d63, { metalness: 0.8, roughness: 0.55 }),
      { position: [cx, cy, cz - Math.sign(cz || 1) * W * 0.42], parent: parent });
  }

  // --- nose gear ---
  const ng = createPivot('NoseGear', [0, 0, 0], root);
  createPart('NoseBayRoof', boxGeo(1.5, 0.10, 0.70), black, { position: [4.60, 1.36, 0], parent: ng });
  createPart('NoseTrunnion', await roundedBoxGeo(0.34, 0.24, 0.34, 0.04, { segments: 3 }), skinDark, { position: [4.78, 1.30, 0], parent: ng });
  createPart('NoseOleoBarrel', cylinderYGeo(0.088, 0.095, 0.60, 12), gameMaterial(0x767c83, { metalness: 0.8, roughness: 0.4 }), { position: [4.72, 1.02, 0], rotation: [0, 0, 5], parent: ng });
  createPart('NoseOleoPiston', cylinderYGeo(0.062, 0.062, 0.42, 12), steel, { position: [4.66, 0.70, 0], rotation: [0, 0, 5], parent: ng });
  createPart('NoseForkYokeL', boxGeo(0.12, 0.30, 0.05), gameMaterial(0x767c83, { metalness: 0.8, roughness: 0.4 }), { position: [4.63, 0.45, -0.145], parent: ng });
  createPart('NoseForkYokeR', boxGeo(0.12, 0.30, 0.05), gameMaterial(0x767c83, { metalness: 0.8, roughness: 0.4 }), { position: [4.63, 0.45, 0.145], parent: ng });
  createPart('NoseAxle', cylinderZGeo(0.040, 0.040, 0.34, 10), steel, { position: [4.62, 0.32, 0], parent: ng });
  makeWheel('NoseWheel', 4.62, 0.32, 0.0, 0.32, 0.20, ng);
  beamBetween('NoseDragBrace', [4.86, 1.24, 0], [5.44, 1.42, 0], 0.038, steel, { parent: ng });
  beamBetween('NoseTorqueUpper', [4.58, 1.00, 0.10], [4.55, 0.80, 0.06], 0.022, steel, { parent: ng });
  beamBetween('NoseTorqueLower', [4.55, 0.80, 0.06], [4.55, 0.58, 0.10], 0.022, steel, { parent: ng });
  createPart('TaxiLight', await roundedBoxGeo(0.10, 0.12, 0.18, 0.02, { segments: 3 }), lightW, { position: [4.86, 0.92, 0], parent: ng });
  createPart('NoseDoorL', boxGeo(1.20, 0.035, 0.42), skin, { position: [4.60, 1.24, -0.44], rotation: [-62, 0, 0], parent: ng });
  createPart('NoseDoorR', boxGeo(1.20, 0.035, 0.42), skin, { position: [4.60, 1.24, 0.44], rotation: [62, 0, 0], parent: ng });

  // --- main gear ---
  for (let side = -1; side <= 1; side += 2) {
    const nm = side > 0 ? 'Right' : 'Left';
    const mg = createPivot('MainGear' + nm, [0, 0, 0], root);
    createPart('MainBayRoof' + nm, boxGeo(1.7, 0.10, 0.78), black, { position: [-1.55, 1.16, side * 1.20], parent: mg });
    createPart('MainTrunnion' + nm, await roundedBoxGeo(0.40, 0.26, 0.30, 0.04, { segments: 3 }), skinDark, { position: [-1.40, 1.14, side * 1.10], parent: mg });
    beamBetween('MainOleoBarrel' + nm, [-1.44, 1.14, side * 1.12], [-1.58, 0.66, side * 1.36], 0.090, gameMaterial(0x767c83, { metalness: 0.8, roughness: 0.4 }), { parent: mg });
    beamBetween('MainOleoPiston' + nm, [-1.57, 0.72, side * 1.35], [-1.62, 0.46, side * 1.42], 0.062, steel, { parent: mg });
    beamBetween('MainDragBrace' + nm, [-1.46, 1.06, side * 1.16], [-2.46, 1.20, side * 0.98], 0.045, steel, { parent: mg });
    beamBetween('MainSideStay' + nm, [-1.52, 0.92, side * 1.26], [-1.50, 1.14, side * 0.72], 0.038, steel, { parent: mg });
    beamBetween('MainTorqueUpper' + nm, [-1.44, 0.96, side * 1.28], [-1.42, 0.78, side * 1.33], 0.022, steel, { parent: mg });
    beamBetween('MainTorqueLower' + nm, [-1.42, 0.78, side * 1.33], [-1.48, 0.56, side * 1.38], 0.022, steel, { parent: mg });
    createPart('MainAxle' + nm, cylinderZGeo(0.048, 0.048, 0.42, 10), steel, { position: [-1.62, 0.46, side * 1.42], parent: mg });
    makeWheel('MainWheel' + nm, -1.62, 0.46, side * 1.52, 0.46, 0.30, mg);
    createPart('MainDoor' + nm, boxGeo(1.45, 0.04, 0.50), skin, { position: [-1.55, 1.04, side * 1.02], rotation: [side * 68, 0, 0], parent: mg });
    createPart('MainDoorAft' + nm, boxGeo(0.62, 0.04, 0.36), skin, { position: [-2.40, 1.10, side * 1.24], rotation: [side * 48, 0, 0], parent: mg });
  }

  // -------------------------------------------------------------- pylons
  const pylonGeo = await roundedBoxGeo(1.85, 0.36, 0.22, 0.055, { segments: 3 });
  const pylonNose = await roundedBoxGeo(0.42, 0.24, 0.20, 0.075, { segments: 3 });
  const pylonSpec = [
    { z: 2.30, x: 0.20, yTop: 1.815 },
    { z: 3.55, x: -0.20, yTop: 1.905 },
  ];
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < pylonSpec.length; i++) {
      const p = pylonSpec[i];
      const nm = (side > 0 ? 'R' : 'L') + (i === 0 ? 'Inner' : 'Outer');
      createPart('Pylon' + nm, pylonGeo, skinDark, { position: [p.x, p.yTop - 0.20, side * p.z], parent: root });
      createPart('PylonNose' + nm, pylonNose, skinDark, { position: [p.x + 1.05, p.yTop - 0.14, side * p.z], parent: root });
      createPart('PylonShoe' + nm, boxGeo(1.60, 0.05, 0.30), skinDark, { position: [p.x, p.yTop - 0.02, side * p.z], parent: root });
      // sway braces and the ejector-rack lugs
      for (let k = 0; k < 2; k++) {
        createPart('SwayBrace' + nm + k, cylinderYGeo(0.026, 0.026, 0.16, 6), steel, { position: [p.x - 0.30 + k * 0.60, p.yTop - 0.44, side * (p.z + 0.10)], parent: root });
        createPart('SwayBrace' + nm + 'b' + k, cylinderYGeo(0.026, 0.026, 0.16, 6), steel, { position: [p.x - 0.30 + k * 0.60, p.yTop - 0.44, side * (p.z - 0.10)], parent: root });
      }
      createPart('PylonLug' + nm, boxGeo(0.10, 0.10, 0.16), steel, { position: [p.x, p.yTop - 0.40, side * p.z], parent: root });
    }
  }

  // ------------------------------------------------------- surface detail
  // gun port and gas-purge vents on the left LERX shoulder
  createPart('GunPort', cylinderXGeo(0.055, 0.055, 0.22, 10), black, { position: [5.05, 2.16, -0.86], rotation: [0, 0, 0], parent: root });
  createPart('GunFairing', capsuleXGeo(0.10, 0.70, 10), skinDark, { position: [4.70, 2.14, -0.86], parent: root });
  for (let i = 0; i < 3; i++) createPart('GunVent' + i, decalBox(0.16, 0.05, 0.012), black, { position: [4.35 - i * 0.22, 2.20, -0.84], rotation: [0, 0, 0], parent: root });

  // in-flight refuelling receptacle door on the spine
  createPart('RefuelDoor', decalBox(0.42, 0.24, 0.02), skinDark, { position: [2.30, 2.72, 0.18], rotation: [-14, 0, 0], parent: root });

  // upper-surface airbrakes, cracked open either side of the spine
  for (let side = -1; side <= 1; side += 2) {
    createPart('Airbrake' + (side > 0 ? 'R' : 'L'), boxGeo(1.05, 0.05, 0.52), skinDark,
      { position: [-3.05, 2.60, side * 0.62], rotation: [0, 0, -9], parent: root });
  }

  // AoA vanes, angle-of-sideslip probe, and blade antennas
  for (let side = -1; side <= 1; side += 2) {
    createPart('AoaVane' + (side > 0 ? 'R' : 'L'), boxGeo(0.20, 0.05, 0.02), black, { position: [7.10, 2.02, side * 0.51], parent: root });
    createPart('AoaBoss' + (side > 0 ? 'R' : 'L'), cylinderZGeo(0.045, 0.045, 0.06, 8), skinDark, { position: [7.02, 2.02, side * 0.50], parent: root });
  }
  createPart('BladeAntennaTop', boxGeo(0.34, 0.20, 0.03), skinDark, { position: [0.60, 2.85, 0], rotation: [0, 0, -8], parent: root });
  createPart('BladeAntennaBelly', boxGeo(0.30, 0.18, 0.03), skinDark, { position: [3.00, 1.14, 0], rotation: [0, 0, 8], parent: root });

  // formation-light strips and anti-collision beacons
  for (let side = -1; side <= 1; side += 2) {
    createPart('FormLightFwd' + (side > 0 ? 'R' : 'L'), decalBox(0.70, 0.07, 0.012), lightW, { position: [3.60, 2.02, side * 1.01], rotation: [0, 0, 0], parent: root });
    createPart('FormLightAft' + (side > 0 ? 'R' : 'L'), decalBox(0.70, 0.07, 0.012), lightW, { position: [-2.60, 2.06, side * 1.24], rotation: [0, 0, 0], parent: root });
  }
  createPart('BeaconTop', capsuleYGeo(0.055, 0.06, 8), lightR, { position: [-1.20, 2.70, 0], parent: root });
  createPart('BeaconBelly', capsuleYGeo(0.055, 0.06, 8), lightR, { position: [-0.60, 1.10, 0], parent: root });
  createPart('TailLight', capsuleXGeo(0.05, 0.10, 8), lightW, { position: [-7.06, 2.30, 0], parent: root });

  // access panels along the spine and wing roots
  const panelSpec = [
    [1.60, 2.66, 0.55, 0.60, 0.44], [0.30, 2.66, 0.60, 0.60, 0.44], [-1.10, 2.62, 0.60, 0.60, 0.44],
    [-2.20, 2.55, 0.62, 0.50, 0.40], [-4.00, 2.48, 0.60, 0.60, 0.40],
  ];
  for (let i = 0; i < panelSpec.length; i++) {
    const p = panelSpec[i];
    for (let side = -1; side <= 1; side += 2) {
      createPart('Panel' + i + (side > 0 ? 'R' : 'L'), decalBox(p[3], p[4], 0.015), skinDark,
        { position: [p[0], p[1], side * p[2]], rotation: [90, 0, 0], parent: root });
    }
  }

  return root;
}

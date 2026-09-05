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
// Refined later, in this repository, with `kiln_edit`: two materials that were
// right in source and wrong in the render, and the same mistake in opposite
// directions. The comments at each one say what the render showed.

const meta = { name: 'CommsSatellite', category: 'prop', role: 'prop' };

// Geostationary communications satellite, deployed configuration.
// +X = antenna boresight (earth face), +Y = up, +Z = asset right.
// Solar wings run along +/-Z; apogee engine bell is the lowest part, resting on Y=0.

const BUS = 2.6;              // cubic bus edge
const BUS_Y0 = 0.95;          // bus underside
const CY = BUS_Y0 + BUS / 2;  // bus centre height
const HALF = BUS / 2;

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function dishProfile(R, f, t, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const r = (R * i) / n;
    pts.push([r, (r * r) / (4 * f)]);
  }
  for (let i = n; i >= 0; i--) {
    const r = (R * i) / n;
    pts.push([r, (r * r) / (4 * f) - t]);
  }
  return pts;
}

async function build() {
  const root = createRoot('CommsSatellite');
  const rand = rng(20260904);

  // ---- materials (kept few so draw calls stay low) ----
  // Multi-layer insulation, in two shades so the blanket is not one flat sheet.
  // The two were 0xd8a13c at metalness 0.95 and 0xc6320 at 0.9, which is far
  // enough apart that the facets did not read as one blanket at all: under the
  // studio dome the light shade clipped to a flat saturated yellow wherever a
  // facet faced the key, the dark shade stayed brown, and a satellite came back
  // wearing a chessboard. Metalness down to where the highlight still rolls off
  // instead of clamping, and the two shades brought within a stop of each other.
  const gold = gameMaterial(0xc09244, { metalness: 0.45, roughness: 0.5, flatShading: true });
  const goldDark = gameMaterial(0x9a7433, { metalness: 0.45, roughness: 0.6, flatShading: true });
  const struct = gameMaterial(0x33363c, { metalness: 0.6, roughness: 0.6, flatShading: true });
  const alum = gameMaterial(0xc9ccd1, { metalness: 0.85, roughness: 0.35, flatShading: true });
  // Reflector faces, radiator tiles and the sun sensor. 0xe9e7e1 is within a few
  // percent of white, and a rough near-white surface under the studio dome
  // returns nearly all of what it is given: the three dishes came back as blank
  // discs with the feed struts drawn on them and no bowl visible at all.
  const white = gameMaterial(0xbcb9b1, { metalness: 0.1, roughness: 0.75 });
  const black = gameMaterial(0x15161a, { metalness: 0.3, roughness: 0.85, flatShading: true });
  const cell = gameMaterial(0x1c2b60, { metalness: 0.45, roughness: 0.22, flatShading: true });

  // =====================================================================
  // BUS
  // =====================================================================
  const busGroup = createPivot('Bus', [0, CY, 0], root);

  createPart('Mesh_BusCore', boxGeo(BUS - 0.12, BUS - 0.12, BUS - 0.12), struct, { parent: busGroup });

  // corner longerons
  const longeronY = boxGeo(0.11, BUS, 0.11);
  const longeronZ = boxGeo(0.11, 0.11, BUS);
  const longeronX = boxGeo(BUS, 0.11, 0.11);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      createPart(`Mesh_LongeronY_${sx > 0 ? 'F' : 'A'}${sz > 0 ? 'R' : 'L'}`, longeronY, struct, {
        position: [sx * (HALF - 0.05), 0, sz * (HALF - 0.05)], parent: busGroup,
      });
    }
    for (const sy of [-1, 1]) {
      createPart(`Mesh_LongeronZ_${sx > 0 ? 'F' : 'A'}${sy > 0 ? 'U' : 'D'}`, longeronZ, struct, {
        position: [sx * (HALF - 0.05), sy * (HALF - 0.05), 0], parent: busGroup,
      });
      createPart(`Mesh_LongeronX_${sx > 0 ? 'R' : 'L'}${sy > 0 ? 'U' : 'D'}`, longeronX, struct, {
        position: [0, sy * (HALF - 0.05), sx * (HALF - 0.05)], parent: busGroup,
      });
    }
  }

  // ---- faceted gold thermal blanket panels on +X / -X / +Y / -Y ----
  const blanketX = await roundedBoxGeo(0.07, 0.83, 0.83, 0.03, { style: 'chamfer', segments: 1 });
  const blanketY = await roundedBoxGeo(0.83, 0.07, 0.83, 0.03, { style: 'chamfer', segments: 1 });
  const offs = [-0.865, 0, 0.865];
  const faces = [
    { id: 'Fwd', geo: blanketX, axis: 'x', s: 1 },
    { id: 'Aft', geo: blanketX, axis: 'x', s: -1 },
    { id: 'Top', geo: blanketY, axis: 'y', s: 1 },
    { id: 'Btm', geo: blanketY, axis: 'y', s: -1 },
  ];
  for (const f of faces) {
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        // leave the underside centre clear for the apogee engine
        if (f.id === 'Btm' && i === 1 && j === 1) continue;
        const jitter = 0.010 + rand() * 0.055;
        const t1 = (rand() - 0.5) * 9;
        const t2 = (rand() - 0.5) * 9;
        let pos, rot;
        if (f.axis === 'x') {
          pos = [f.s * (HALF - 0.03 + jitter), offs[i], offs[j]];
          rot = [t1, 0, t2];
        } else {
          pos = [offs[i], f.s * (HALF - 0.03 + jitter), offs[j]];
          rot = [t1, 0, t2];
        }
        createPart(`Mesh_Blanket_${f.id}_${i}${j}`, f.geo, rand() > 0.78 ? goldDark : gold, {
          position: pos, rotation: rot, parent: busGroup,
        });
      }
    }
  }

  // blanket tie-down tapes
  const tapeX = boxGeo(0.03, 2.55, 0.08);
  const tapeY = boxGeo(0.08, 0.03, 2.55);
  for (const s of [-1, 1]) {
    for (const o of [-0.44, 0.44]) {
      createPart(`Mesh_Tape_X${s > 0 ? 'F' : 'A'}${o > 0 ? 'a' : 'b'}`, tapeX, goldDark, {
        position: [s * (HALF + 0.055), 0, o], parent: busGroup,
      });
      createPart(`Mesh_Tape_Y${s > 0 ? 'U' : 'D'}${o > 0 ? 'a' : 'b'}`, tapeY, goldDark, {
        position: [o, s * (HALF + 0.055), 0], parent: busGroup,
      });
    }
  }

  // radiator faces on +/-Z (north/south panels): dark backing plate under a
  // 4x4 array of optical-solar-reflector tiles, so the face reads as tiled
  // hardware rather than one blank slab.
  const radBack = boxGeo(2.44, 2.44, 0.06);
  const osrGeo = boxGeo(0.55, 0.55, 0.045);
  const osrOff = [-0.87, -0.29, 0.29, 0.87];
  for (const s of [-1, 1]) {
    const sd = s > 0 ? 'R' : 'L';
    createPart(`Mesh_RadiatorBack_${sd}`, radBack, struct, {
      position: [0, 0, s * (HALF - 0.03)], parent: busGroup,
    });
    for (let a = 0; a < 4; a++) {
      for (let b = 0; b < 4; b++) {
        createPart(`Mesh_OSRTile_${sd}${a}${b}`, osrGeo, white, {
          position: [osrOff[a], osrOff[b], s * (HALF + 0.02)], parent: busGroup,
        });
      }
    }
  }

  // =====================================================================
  // APOGEE ENGINE (underside, bell exit rests on Y=0)
  // =====================================================================
  const engine = createPivot('ApogeeEngine', [0, 0, 0], root);
  const bellPts = [];
  const NB = 12, BELL_H = 0.78, R_EXIT = 0.44, R_TH = 0.10, WALL = 0.035;
  const rAt = (u) => R_TH + (R_EXIT - R_TH) * Math.pow(1 - u, 1.9);
  for (let i = 0; i <= NB; i++) bellPts.push([rAt(i / NB), (i / NB) * BELL_H]);
  bellPts.push([R_TH + 0.045, BELL_H + 0.20]);              // throat -> chamber
  bellPts.push([R_TH + 0.045 + WALL, BELL_H + 0.20]);
  for (let i = NB; i >= 0; i--) bellPts.push([rAt(i / NB) + WALL, (i / NB) * BELL_H]);
  const bellGeo = await revolveProfile(bellPts, { segments: 24, axis: 'y', smooth: true });
  createPart('Mesh_EngineBell', bellGeo, alum, { position: [0, 0, 0], parent: engine });

  // cooling-tube wrap on the bell
  for (let i = 0; i < 3; i++) {
    const u = 0.16 + i * 0.24;
    createPart(`Mesh_BellBand${i}`, torusGeo(rAt(u) + 0.045, 0.018, 5, 18), alum, {
      position: [0, u * BELL_H, 0], rotation: [90, 0, 0], parent: engine,
    });
  }
  createPart('Mesh_EngineChamber', cylinderGeo(0.15, 0.19, 0.30, 12), struct, {
    position: [0, BELL_H + 0.30, 0], parent: engine,
  });
  createPart('Mesh_EngineValveBlock', boxGeo(0.30, 0.16, 0.24), black, {
    position: [0, BELL_H + 0.50, 0], parent: engine,
  });
  // engine skirt / interface ring
  createPart('Mesh_EngineSkirt', cylinderGeo(0.42, 0.30, 0.14, 16), goldDark, {
    position: [0, BUS_Y0 - 0.07, 0], parent: engine,
  });
  // propellant feed lines
  for (const s of [-1, 1]) {
    createPart(`Mesh_FeedLine${s > 0 ? 'R' : 'L'}`, pipeAlongPath(
      [[0.13 * s, BUS_Y0 + 0.05, 0.18 * s], [0.20 * s, BELL_H + 0.42, 0.26 * s], [0.08 * s, BELL_H + 0.26, 0.14 * s]],
      0.022, { bendRadius: 0.06, tubularSegments: 12, radialSegments: 5 }), alum, { parent: engine });
  }

  // =====================================================================
  // ATTITUDE-CONTROL THRUSTER CLUSTERS (four bus corners)
  // =====================================================================
  const thrBase = await roundedBoxGeo(0.30, 0.22, 0.30, 0.04, { style: 'chamfer', segments: 1 });
  const nozGeo = taperConeGeo(0.035, 0.10, 0.26, 'y', 10);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const tag = `${sx > 0 ? 'F' : 'A'}${sz > 0 ? 'R' : 'L'}`;
      const cl = createPivot(`ThrusterCluster_${tag}`, [sx * 1.02, BUS_Y0 + 0.02, sz * 1.02], root);
      createPart(`Mesh_ThrBase_${tag}`, thrBase, black, { parent: cl });
      // two canted nozzles: one axial-down, one radial-out
      const n1 = createPivot(`Nozzle_${tag}_A`, [sx * 0.06, -0.14, sz * 0.06], cl);
      n1.rotation.set(0, 0, 0);
      createPart(`Mesh_Nozzle_${tag}_A`, nozGeo, alum, { position: [0, -0.13, 0], rotation: [180, 0, 0], parent: n1 });
      const n2 = createPivot(`Nozzle_${tag}_B`, [sx * 0.13, -0.02, sz * 0.13], cl);
      n2.rotation.set(sz * -0.62, 0, sx * 0.62);
      createPart(`Mesh_Nozzle_${tag}_B`, nozGeo, alum, { position: [0, -0.13, 0], rotation: [180, 0, 0], parent: n2 });
      createPart(`Mesh_ThrMani_${tag}`, cylinderGeo(0.05, 0.05, 0.22, 8), alum, {
        position: [sx * 0.02, 0.16, sz * 0.02], parent: cl,
      });
    }
  }

  // =====================================================================
  // SOLAR WINGS  (5 hinged panels per wing, ~21 m tip to tip)
  // =====================================================================
  const PW_X = 2.40, PW_Z = 1.52, PT = 0.05, GAP = 0.08;
  const Z_YOKE_END = 2.60;
  const subGeo = await roundedBoxGeo(PW_X, PT, PW_Z, 0.02, { style: 'chamfer', segments: 1 });
  const cellGeo = boxGeo(0.300, 0.014, 0.268);
  const ribGeo = boxGeo(PW_X - 0.08, 0.05, 0.05);
  const hingeGeo = cylinderXGeo(0.045, 0.045, 0.20, 8);
  const hingeLug = boxGeo(0.10, 0.13, 0.10);

  for (const s of [-1, 1]) {
    const side = s > 0 ? 'R' : 'L';
    const wing = createPivot(`SolarWing_${side}`, [0, CY, 0], root);

    // BAPTA drive drum on the bus radiator face
    createPart(`Mesh_BAPTA_${side}`, cylinderZGeo(0.30, 0.30, 0.42, 16), alum, {
      position: [0, 0, s * 1.52], parent: wing,
    });
    createPart(`Mesh_BAPTARing_${side}`, cylinderZGeo(0.36, 0.36, 0.07, 16), goldDark, {
      position: [0, 0, s * 1.68], parent: wing,
    });

    // truss yoke: two diverging booms + spar + diagonals
    for (const b of [-1, 1]) {
      beamBetween(`YokeBoom_${side}${b > 0 ? 'A' : 'B'}`,
        [b * 0.22, 0, s * 1.72], [b * 0.98, 0, s * Z_YOKE_END], 0.055, alum, { parent: wing, segments: 8 });
      beamBetween(`YokeDiag_${side}${b > 0 ? 'A' : 'B'}`,
        [b * 0.22, 0, s * 1.72], [-b * 0.55, 0, s * (Z_YOKE_END - 0.06)], 0.03, alum, { parent: wing, segments: 6 });
    }
    createPart(`Mesh_YokeSpar_${side}`, cylinderXGeo(0.06, 0.06, 2.16, 10), alum, {
      position: [0, 0, s * Z_YOKE_END], parent: wing,
    });
    // yoke cable harness
    createPart(`Mesh_YokeHarness_${side}`, pipeAlongPath(
      [[0.30, -0.10, s * 1.70], [0.55, -0.22, s * 2.05], [0.72, -0.10, s * 2.55]],
      0.028, { bendRadius: 0.12, tubularSegments: 14, radialSegments: 5 }), black, { parent: wing });

    for (let k = 0; k < 5; k++) {
      const zc = s * (Z_YOKE_END + PW_Z / 2 + k * (PW_Z + GAP));
      const pan = createPivot(`SolarPanel_${side}${k + 1}`, [0, 0, zc], wing);

      createPart(`Mesh_Substrate_${side}${k + 1}`, subGeo, struct, { parent: pan });

      // photovoltaic cell grid, sun side (+Y): 7 strings x 5 rows
      for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 5; j++) {
          createPart(`Mesh_Cell_${side}${k + 1}_${i}${j}`, cellGeo, cell, {
            position: [-1.029 + i * 0.343, PT / 2 + 0.006, -0.608 + j * 0.304],
            parent: pan,
          });
        }
      }
      // interconnect bus bars between the cell strings
      for (let i = 0; i < 6; i++) {
        createPart(`Mesh_BusBar_${side}${k + 1}_${i}`, boxGeo(0.028, 0.016, PW_Z - 0.09), alum, {
          position: [-0.858 + i * 0.343, PT / 2 + 0.006, 0], parent: pan,
        });
      }
      // per-panel edge rails (they stop at each hinge line, as on a real wing)
      for (const hx of [-1.16, 1.16]) {
        createPart(`Mesh_PanelEdge_${side}${k + 1}_${hx > 0 ? 'a' : 'b'}`,
          cylinderZGeo(0.032, 0.032, PW_Z, 6), alum, { position: [hx, 0, 0], parent: pan });
      }
      // back-side stiffener ribs
      for (const r of [-0.44, 0.44]) {
        createPart(`Mesh_Rib_${side}${k + 1}_${r > 0 ? 'a' : 'b'}`, ribGeo, alum, {
          position: [0, -PT / 2 - 0.025, r], parent: pan,
        });
      }

      // hinge line on the inboard edge of this panel
      const zh = s * (Z_YOKE_END + k * (PW_Z + GAP)) + s * (k === 0 ? 0 : -GAP / 2);
      for (const hx of [-0.92, 0, 0.92]) {
        createPart(`Mesh_Hinge_${side}${k + 1}_${hx < 0 ? 'a' : hx > 0 ? 'c' : 'b'}`, hingeGeo, struct, {
          position: [hx, 0, zh], parent: wing,
        });
        createPart(`Mesh_HingeLug_${side}${k + 1}_${hx < 0 ? 'a' : hx > 0 ? 'c' : 'b'}`, hingeLug, struct, {
          position: [hx, -0.02, zh + s * 0.10], parent: wing,
        });
      }
    }

    // outboard tip frame
    const zTip = s * (Z_YOKE_END + 5 * PW_Z + 4 * GAP);
    createPart(`Mesh_WingTipSpar_${side}`, cylinderXGeo(0.05, 0.05, PW_X, 8), alum, {
      position: [0, 0, zTip - s * 0.03], parent: wing,
    });
    for (const hx of [-1.16, 1.16]) {
      createPart(`Mesh_WingTipCap_${side}${hx > 0 ? 'a' : 'b'}`, boxGeo(0.09, 0.09, 0.09), struct, {
        position: [hx, 0, zTip - s * 0.03], parent: wing,
      });
    }
  }

  // =====================================================================
  // PARABOLIC DISH ANTENNAS on gimbal arms (boresight +X)
  // =====================================================================
  async function makeDish(name, R, f, mountPos, yawDeg, pitchDeg, armFrom) {
    const gimbal = createPivot(`Gimbal_${name}`, mountPos, root);
    gimbal.rotation.set(0, (yawDeg * Math.PI) / 180, (pitchDeg * Math.PI) / 180);

    // dish frame: local +Y is the boresight, rotated to +X
    const frame = createPivot(`DishFrame_${name}`, [0, 0, 0], gimbal);
    frame.rotation.z = -Math.PI / 2;

    const geo = await revolveProfile(dishProfile(R, f, 0.035, 8), { segments: 22, axis: 'y', smooth: true });
    createPart(`Mesh_Reflector_${name}`, geo, white, { parent: frame });
    const rimY = (R * R) / (4 * f);
    createPart(`Mesh_DishRim_${name}`, torusGeo(R, 0.035, 5, 22), alum, {
      position: [0, rimY - 0.02, 0], rotation: [90, 0, 0], parent: frame,
    });
    // radial back ribs + hub
    createPart(`Mesh_DishHub_${name}`, cylinderGeo(0.16, 0.20, 0.20, 10), struct, {
      position: [0, -0.14, 0], parent: frame,
    });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      beamBetween(`DishRib_${name}${i}`,
        [Math.cos(a) * 0.15, -0.10, Math.sin(a) * 0.15],
        [Math.cos(a) * (R - 0.06), rimY - 0.05, Math.sin(a) * (R - 0.06)],
        0.022, struct, { parent: frame, segments: 6 });
    }
    // feed tripod + horn at the focus
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.4;
      beamBetween(`FeedLeg_${name}${i}`,
        [Math.cos(a) * R * 0.82, (R * 0.82) * (R * 0.82) / (4 * f), Math.sin(a) * R * 0.82],
        [0, f, 0], 0.02, alum, { parent: frame, segments: 6 });
    }
    createPart(`Mesh_FeedHorn_${name}`, taperConeGeo(0.055, 0.13, 0.26, 'y', 12), goldDark, {
      position: [0, f + 0.04, 0], rotation: [180, 0, 0], parent: frame,
    });
    createPart(`Mesh_FeedCan_${name}`, cylinderGeo(0.075, 0.075, 0.18, 10), alum, {
      position: [0, f + 0.24, 0], parent: frame,
    });

    // gimbal head + two-axis arm back to the bus
    createPart(`Mesh_GimbalHead_${name}`, await roundedBoxGeo(0.26, 0.24, 0.24, 0.04, { style: 'chamfer', segments: 1 }),
      black, { position: [-0.16, 0, 0], parent: gimbal });
    createPart(`Mesh_GimbalAxis_${name}`, cylinderZGeo(0.055, 0.055, 0.36, 8), alum, {
      position: [-0.16, 0, 0], parent: gimbal });
    beamBetween(`GimbalArm_${name}`, armFrom, [mountPos[0] - 0.30, mountPos[1], mountPos[2]], 0.075, alum,
      { parent: root, segments: 8 });
    beamBetween(`GimbalStrut_${name}`,
      [armFrom[0], armFrom[1] - 0.42, armFrom[2]], [mountPos[0] - 0.34, mountPos[1] - 0.06, mountPos[2]], 0.04, alum,
      { parent: root, segments: 6 });
    return gimbal;
  }

  await makeDish('Main', 1.15, 0.46, [2.75, 3.32, -0.86], -8, 7, [1.30, 3.10, -0.66]);
  await makeDish('Ku', 0.85, 0.34, [2.50, 2.22, 1.06], 12, -4, [1.30, 2.30, 0.80]);
  await makeDish('Tx', 0.55, 0.22, [2.12, 1.12, -0.98], -18, -12, [1.30, 1.35, -0.66]);

  // sub-reflector on the main dish (dual-reflector feed)
  const mainSub = createPivot('SubReflector_Main', [3.36, 3.32, -0.86], root);
  mainSub.rotation.z = Math.PI / 2;
  createPart('Mesh_SubReflector', await revolveProfile(dishProfile(0.26, 0.22, 0.03, 6), { segments: 16, axis: 'y', smooth: true }),
    alum, { parent: mainSub });

  // =====================================================================
  // HORN FEED CLUSTER on the +X face
  // =====================================================================
  const horns = createPivot('HornCluster', [1.34, 1.80, 0.28], root);
  createPart('Mesh_HornBox', await roundedBoxGeo(0.42, 0.62, 0.74, 0.05, { style: 'chamfer', segments: 1 }), black, {
    position: [0.20, 0, 0], parent: horns,
  });
  createPart('Mesh_HornBoxTrim', boxGeo(0.05, 0.66, 0.78), goldDark, { position: [0.42, 0, 0], parent: horns });
  let hi = 0;
  for (const hy of [-0.17, 0.17]) {
    for (const hz of [-0.20, 0.20]) {
      const len = 0.34 + (hi % 2) * 0.14;
      createPart(`Mesh_Horn${hi}`, taperConeGeo(0.075, 0.155, len, 'x', 4), goldDark, {
        position: [0.44 + len / 2, hy, hz], rotation: [45, 0, 0], parent: horns,
      });
      createPart(`Mesh_HornThroat${hi}`, cylinderXGeo(0.055, 0.055, 0.12, 8), alum, {
        position: [0.40, hy, hz], parent: horns,
      });
      hi++;
    }
  }

  // =====================================================================
  // OMNI WHIP ANTENNA
  // =====================================================================
  const whip = createPivot('OmniWhip', [-0.86, BUS_Y0 + BUS, 0.88], root);
  whip.rotation.z = 0.16;
  createPart('Mesh_WhipBase', cylinderGeo(0.09, 0.11, 0.12, 10), black, { position: [0, 0.06, 0], parent: whip });
  createPart('Mesh_WhipInsulator', cylinderGeo(0.055, 0.055, 0.14, 8), white, { position: [0, 0.19, 0], parent: whip });
  createPart('Mesh_WhipRod', cylinderGeo(0.022, 0.03, 1.55, 8), alum, { position: [0, 1.03, 0], parent: whip });
  createPart('Mesh_WhipTip', sphereGeo(0.045, 8, 6), alum, { position: [0, 1.82, 0], parent: whip });
  for (let i = 0; i < 3; i++) {
    createPart(`Mesh_WhipCollar${i}`, cylinderGeo(0.038, 0.038, 0.04, 8), goldDark, {
      position: [0, 0.55 + i * 0.42, 0], parent: whip,
    });
  }

  // =====================================================================
  // STAR TRACKER + SUN SENSORS
  // =====================================================================
  const star = createPivot('StarTracker', [-0.72, BUS_Y0 + BUS, -0.62], root);
  star.rotation.x = 0.34;
  star.rotation.z = -0.22;
  createPart('Mesh_StarBody', await roundedBoxGeo(0.34, 0.24, 0.30, 0.04, { style: 'chamfer', segments: 1 }), black, {
    position: [0, 0.12, 0], parent: star,
  });
  createPart('Mesh_StarBaffle', taperConeGeo(0.13, 0.17, 0.46, 'y', 12), black, { position: [0, 0.48, 0], parent: star });
  createPart('Mesh_StarBaffleRim', torusGeo(0.17, 0.02, 5, 14), alum, { position: [0, 0.70, 0], rotation: [90, 0, 0], parent: star });
  createPart('Mesh_StarMount', boxGeo(0.30, 0.06, 0.26), alum, { position: [0, -0.01, 0], parent: star });

  const sun = createPivot('SunSensor', [1.30, BUS_Y0 + BUS - 0.30, 0.98], root);
  createPart('Mesh_SunSensor', boxGeo(0.12, 0.16, 0.16), white, { parent: sun });
  createPart('Mesh_SunSensorHead', cylinderXGeo(0.05, 0.05, 0.10, 8), black, { position: [0.10, 0, 0], parent: sun });

  return root;
}

// Authored by: opencode-go/omen-alpha, via opencode.
//
// Written by the model itself through the Kiln MCP tools: it wrote the
// program, rendered it, looked at its own six-view contact sheet, and
// revised. Not a line of it is hand-authored.
//
// Dispatched into a clean directory containing only the brief and the Kiln
// skills, with no access to this repository or to any finished example.

const meta = { name: 'CableStayedBridge', category: 'architecture' };

async function build() {
  const root = createRoot('CableStayedBridge');

  // ---------- one set of driving numbers ----------
  const DECK_HALF = 45;          // deck runs X -45..+45
  const GIRDER_BOT = 6.9;        // girder underside
  const GIRDER_TOP = 8.05;       // top of box girder webs
  const SLAB_TOP = 8.3;          // deck slab / road base
  const ROAD_W = 3.3;            // road half width (two 3.3 lanes)
  const SLAB_HALF_W = 3.9;       // slab half width
  const GIRDER_HALF_W = 3.2;     // box girder half width
  const PYLON_H = 30;            // pylon top
  const PYLON_LEG_Z = 5.05;      // leg centreline Z
  const LEG_HALF_BOT = 0.95, LEG_HALF_TOP = 0.7;
  const CABLE_Z_DECK = 3.5;      // deck anchor plane
  const CABLE_Z_TOP = 4.55;      // pylon anchor plane (leg centre)
  const ANCHOR_X = [4.5, 9, 13.5, 18, 22.5, 27];
  const ANCHOR_TOP_Y = [29.6, 28.4, 27.0, 25.6, 24.4, 23.4];

  // ---------- materials ----------
  const conc = gameMaterial(0xc9c5bb, { roughness: 0.95 });
  const concDark = gameMaterial(0xa9a59b, { roughness: 0.95 });
  const asphalt = gameMaterial(0x35363a, { roughness: 1 });
  const paint = gameMaterial(0xe8e6e0, { roughness: 0.6 });
  const steel = gameMaterial(0x555b63, { metalness: 0.75, roughness: 0.4 });
  const lampMetal = gameMaterial(0x4b5560, { metalness: 0.6, roughness: 0.5 });
  const lampGlow = gameMaterial(0xfff2cc, { emissive: 0xffe9b0, emissiveIntensity: 1.2 });
  const beaconRed = gameMaterial(0xd23a2a, { emissive: 0xd22a1a, emissiveIntensity: 1.5 });

  // ---------- pylon pier (stepped river pier) ----------
  createPart('PylonPierFooting', await roundedBoxGeo(11.4, 0.7, 14.0, 0.15), concDark, { position: [0, 0.35, 0], parent: root });
  createPart('PylonPierBody', await roundedBoxGeo(9.2, 1.6, 12.4, 0.3), concDark, { position: [0, 1.5, 0], parent: root });
  createPart('PylonPierCap', await roundedBoxGeo(10.4, 0.55, 12.8, 0.05), conc, { position: [0, 2.55, 0], parent: root });

  // ---------- H-shaped pylon legs (tapered square prisms with tapered face ribs) ----------
  const legH = PYLON_H - 2.2;
  const legGeo = cylinderGeo(LEG_HALF_TOP * Math.SQRT2, LEG_HALF_BOT * Math.SQRT2, legH, 4);
  const ribGeo = await extrudeProfile(
    [[-1.3, 0], [1.3, 0], [0.95, legH], [-0.95, legH]],
    { depth: 1.1, axis: 'z', center: true });
  for (const s of [-1, 1]) {
    createPart('PylonLeg' + (s < 0 ? 'Port' : 'Starboard'), legGeo, conc, { position: [0, (2.2 + PYLON_H) / 2, s * PYLON_LEG_Z], rotation: [0, 45, 0], parent: root });
    createPart('PylonLegRib' + (s < 0 ? 'Port' : 'Starboard'), ribGeo, conc, { position: [0, 2.2, s * PYLON_LEG_Z], parent: root });
  }

  // crossbeams between the legs (lower strut / upper strut / head beam)
  const beamDef = [
    { name: 'LowerStrut', y: 4.4, h: 1.2, len: 9.0, d: 1.4 },
    { name: 'UpperStrut', y: 13.2, h: 1.4, len: 9.2, d: 1.6 },
    { name: 'HeadBeam', y: 29.4, h: 1.6, len: 9.4, d: 2.8 },
  ];
  for (const b of beamDef) {
    createPart('Pylon' + b.name, boxGeo(b.d, b.h, b.len), conc, { position: [0, b.y, 0], parent: root });
  }

  // aviation beacon on the head beam
  createPart('BeaconPost', cylinderGeo(0.16, 0.2, 0.5, 8), lampMetal, { position: [0, 30.45, 0], parent: root });
  createPart('BeaconLight', sphereGeo(0.13, 8, 6), beaconRed, { position: [0, 30.78, 0], parent: root });

  // pylon anchor brackets (lower cable anchors; top two sit inside the head beam)
  const bracketGeo = boxGeo(0.9, 0.8, 0.9);
  for (let i = 2; i < ANCHOR_X.length; i++) {
    for (const s of [-1, 1]) {
      createPart('PylonBracket' + s + '_' + i, bracketGeo, steel, { position: [0, ANCHOR_TOP_Y[i], s * 4.4], parent: root });
    }
  }

  // ---------- deck: trapezoid box girder + slab ----------
  const girderLen = DECK_HALF * 2;
  createPart('GirderBottomSlab', boxGeo(girderLen, 0.3, GIRDER_HALF_W * 2), conc, { position: [0, GIRDER_BOT + 0.15, 0], parent: root });
  const webGeo = boxGeo(girderLen, 1.3, 0.32);
  createPart('GirderWebPort', webGeo, conc, { position: [0, 7.46, -3.08], rotation: [-23, 0, 0], parent: root });
  createPart('GirderWebStarboard', webGeo, conc, { position: [0, 7.46, 3.08], rotation: [23, 0, 0], parent: root });
  createPart('DeckSlab', boxGeo(girderLen, SLAB_TOP - GIRDER_TOP, SLAB_HALF_W * 2), conc, { position: [0, (GIRDER_TOP + SLAB_TOP) / 2, 0], parent: root });

  // road plate + markings
  createPart('RoadPlate', boxGeo(girderLen, 0.07, ROAD_W * 2), asphalt, { position: [0, SLAB_TOP + 0.035, 0], parent: root });
  const markY = SLAB_TOP + 0.08;
  const edgeGeo = boxGeo(girderLen - 1, 0.02, 0.12);
  createPart('EdgeLinePort', edgeGeo, paint, { position: [0, markY, -3.1], parent: root });
  createPart('EdgeLineStarboard', edgeGeo, paint, { position: [0, markY, 3.1], parent: root });
  const dashGeo = boxGeo(2, 0.02, 0.14);
  for (let x = -43; x <= 43; x += 4.5) {
    createPart('LaneDash' + x.toFixed(1), dashGeo, paint, { position: [x, markY, 0], parent: root });
  }

  // parapets + steel handrail with posts set into the parapet top
  const parapetGeo = boxGeo(girderLen, 0.95, 0.3);
  const railGeo = cylinderXGeo(0.035, 0.035, girderLen - 0.4, 6);
  const railPostGeo = boxGeo(0.07, 0.36, 0.07);
  createPart('ParapetPort', parapetGeo, conc, { position: [0, SLAB_TOP + 0.475, -3.75], parent: root });
  createPart('ParapetStarboard', parapetGeo, conc, { position: [0, SLAB_TOP + 0.475, 3.75], parent: root });
  createPart('HandrailPort', railGeo, steel, { position: [0, SLAB_TOP + 1.3, -3.75], parent: root });
  createPart('HandrailStarboard', railGeo, steel, { position: [0, SLAB_TOP + 1.3, 3.75], parent: root });
  for (let x = -43 + 2.25; x <= 43; x += 4.5) {
    createPart('RailPost' + x.toFixed(2) + 'P', railPostGeo, steel, { position: [x, SLAB_TOP + 1.13, -3.75], parent: root });
    createPart('RailPost' + x.toFixed(2) + 'S', railPostGeo, steel, { position: [x, SLAB_TOP + 1.13, 3.75], parent: root });
  }

  // deck cable anchor stubs
  const anchorGeo = boxGeo(0.7, 0.5, 0.35);
  for (const sx of [-1, 1]) {
    for (const ax of ANCHOR_X) {
      for (const sz of [-1, 1]) {
        createPart('DeckAnchor' + sx + '_' + ax + '_' + sz, anchorGeo, steel, { position: [sx * ax, 8.15, sz * 3.38], parent: root });
      }
    }
  }

  // ---------- stay cables: two fans ----------
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      for (let i = 0; i < ANCHOR_X.length; i++) {
        beamBetween('Cable' + sx + '_' + sz + '_' + i,
          [sx * ANCHOR_X[i], 8.3, sz * CABLE_Z_DECK],
          [0, ANCHOR_TOP_Y[i], sz * CABLE_Z_TOP],
          0.08, steel, { segments: 8, parent: root });
      }
    }
  }

  // ---------- approach piers ----------
  const pierFootGeo = boxGeo(3.4, 0.9, 6.4);
  const pierColGeo = boxGeo(1.8, 5.2, 4.6);
  const pierCapGeo = boxGeo(3.0, 1.0, 5.6);
  for (const px of [30, 40]) {
    for (const sx of [-1, 1]) {
      const x = sx * px;
      const tag = sx + '_' + px;
      createPart('PierFooting' + tag, pierFootGeo, concDark, { position: [x, 0.45, 0], parent: root });
      createPart('PierColumn' + tag, pierColGeo, concDark, { position: [x, 3.5, 0], parent: root });
      createPart('PierCap' + tag, pierCapGeo, conc, { position: [x, 6.5, 0], parent: root });
    }
  }

  // ---------- abutments ----------
  const abutGeo = boxGeo(3.0, 8.3, 9.4);
  const abutRoadGeo = boxGeo(3.0, 0.07, ROAD_W * 2);
  const wingGeo = boxGeo(3.0, 3.0, 0.35);
  for (const sx of [-1, 1]) {
    const x = sx * 46.5;
    const tag = sx < 0 ? 'Port' : 'Starboard';
    createPart('Abutment' + tag, abutGeo, concDark, { position: [x, 4.15, 0], parent: root });
    createPart('AbutmentRoad' + tag, abutRoadGeo, asphalt, { position: [x, SLAB_TOP + 0.035, 0], parent: root });
    createPart('WingWall' + tag, wingGeo, concDark, { position: [x, 1.5, sx * 4.875], parent: root });
  }

  // ---------- lamp standards ----------
  const poleGeo = cylinderGeo(0.07, 0.1, 3.6, 8);
  const armGeoPort = pipeAlongPath([[0, 12.75, -3.75], [0, 13.15, -2.95], [0, 13.3, -2.25]], 0.06, { radialSegments: 6 });
  const armGeoStar = pipeAlongPath([[0, 12.75, 3.75], [0, 13.15, 2.95], [0, 13.3, 2.25]], 0.06, { radialSegments: 6 });
  const headGeo = await roundedBoxGeo(0.55, 0.16, 0.3, 0.05);
  const glowGeo = boxGeo(0.45, 0.02, 0.24);
  const lampXs = [
    { x: 10, s: 1 }, { x: 22, s: -1 }, { x: 34, s: 1 }, { x: 44, s: -1 },
    { x: -10, s: -1 }, { x: -22, s: 1 }, { x: -34, s: -1 }, { x: -44, s: 1 },
  ];
  for (const L of lampXs) {
    const z = L.s * 3.75;
    createPart('LampPole' + L.x, poleGeo, lampMetal, { position: [L.x, 11.05, z], parent: root });
    createPart('LampArm' + L.x, L.s < 0 ? armGeoPort : armGeoStar, lampMetal, { position: [L.x, 0, 0], parent: root });
    createPart('LampHead' + L.x, headGeo, lampMetal, { position: [L.x, 13.32, z - L.s * 1.55], parent: root });
    createPart('LampGlow' + L.x, glowGeo, lampGlow, { position: [L.x, 13.23, z - L.s * 1.55], parent: root });
  }

  return root;
}

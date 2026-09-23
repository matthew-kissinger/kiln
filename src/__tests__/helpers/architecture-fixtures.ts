/** Historical roof fixtures retained for geometry/QA regression, not agent prompt defaults. */
export const ARCHITECTURE_RIDGE_X_SCAFFOLD = `const meta = { name: 'RidgeXHouse', category: 'architecture' };
function build() {
  const root = createRoot('RidgeXHouse');
  const wall = gameMaterial(0xd8c4a0, { roughness: 0.9 });
  const roof = gameMaterial(0x7a3e35, { roughness: 0.82 });
  const shell = createGableShell('House', { wall, roof }, {
    spanX: 8, spanZ: 6, wallHeight: 3, rise: 1.6, overhang: 0.4,
    ridgeAxis: 'x', closedEnds: true, enterable: true, parent: root,
    openings: [{ id: 'front-door', wall: 'front', kind: 'door', width: 1.1, height: 2.1 }],
  });
  for (const face of shell.roof.faces) {
    createRoofSurfaceLayout('RoofPanels_' + face.side, roof, {
      face, kind: 'panels', panelWidth: 0.8, parent: shell.roof.root,
    });
  }
  return root;
}`;

export const ARCHITECTURE_RIDGE_Z_SCAFFOLD = `const meta = { name: 'RidgeZHouse', category: 'architecture' };
function build() {
  const root = createRoot('RidgeZHouse');
  const wall = gameMaterial(0xc9b895, { roughness: 0.92 });
  const roof = gameMaterial(0x40566e, { roughness: 0.8 });
  const shell = createGableShell('House', { wall, roof }, {
    spanX: 7, spanZ: 10, wallHeight: 3.2, rise: 1.8, overhang: 0.45,
    ridgeAxis: 'z', closedEnds: true, enterable: true, parent: root,
    openings: [{ id: 'front-door', wall: 'front', kind: 'door', width: 1.2, height: 2.2 }],
  });
  for (const face of shell.roof.faces) {
    createRoofSurfaceLayout('RoofPanels_' + face.side, roof, {
      face, kind: 'panels', panelWidth: 0.8, parent: shell.roof.root,
    });
  }
  return root;
}`;

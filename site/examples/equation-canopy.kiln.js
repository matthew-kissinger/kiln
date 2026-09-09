// Maintainer teaching example. Not a model benchmark or a watertight roof.
const meta = { name: 'Equation canopy', category: 'structure' };
const height = (u, v) => 1.35 + 0.22 * Math.sin(u * 2) + 0.12 * v * v;
function build() {
  const root = createRoot('EquationCanopy');
  const blue = gameMaterial('#7ca7af');
  blue.side = THREE.DoubleSide;
  const surface = parametricSurface(
    (u, v) => [u, height(u, v), v],
    { u: [-1.6, 1.6], v: [-0.8, 0.8], uSegments: 48, vSegments: 24, orientation: 'vu' },
  );
  createPart('Surface', surface, blue, { parent: root });
  const steel = gameMaterial('#525d63');
  const orange = gameMaterial('#d88439');
  for (const u of [-1.45, 1.45]) for (const v of [-0.68, 0.68]) {
    const h = height(u, v);
    const du = 0.44 * Math.cos(u * 2);
    const dv = 0.24 * v;
    const rotZ = Math.atan(du) * (180 / Math.PI);
    const rotX = -Math.atan(dv) * (180 / Math.PI);

    const plateThick = 0.015;
    const plateOffset = 0.006;
    const socketY = h - plateThick / 2 - plateOffset;
    const capHeight = 0.025;
    const capY = socketY - plateThick / 2 - capHeight / 2;
    const postH = capY - capHeight / 2;

    createPart(`Post_${u}_${v}`, boxGeo(0.08, postH, 0.08), steel, { parent: root, position: [u, postH / 2, v] });
    createPart(`Foot_${u}_${v}`, boxGeo(0.23, 0.045, 0.23), steel, { parent: root, position: [u, 0.0225, v] });
    createPart(`Cap_${u}_${v}`, cylinderGeo(0.055, 0.055, capHeight, 16), steel, {
      parent: root,
      position: [u, capY, v],
      rotation: [rotX, 0, rotZ],
    });
    createPart(
      u > 0 && v > 0 ? 'CornerSocket' : `Socket_${u}_${v}`,
      boxGeo(0.20, plateThick, 0.20),
      orange,
      {
        parent: root,
        position: [u, socketY, v],
        rotation: [rotX, 0, rotZ],
      },
    );
  }
  return root;
}

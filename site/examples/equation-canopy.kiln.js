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
    createPart(`Post_${u}_${v}`, boxGeo(0.08, h, 0.08), steel, { parent: root, position: [u, h / 2, v] });
    createPart(`Foot_${u}_${v}`, boxGeo(0.23, 0.045, 0.23), steel, { parent: root, position: [u, 0.0225, v] });
    createPart(u > 0 && v > 0 ? 'CornerSocket' : `Socket_${u}_${v}`, boxGeo(0.19, 0.085, 0.19), orange, { parent: root, position: [u, h - 0.055, v], rotation: [0, 25, 0] });
  }
  return root;
}

// Teaching example authored by the maintainer agent for the source-edit demo.
// This is not a clean-room model evaluation or a gallery benchmark entry.
const meta = { name: 'Workbench', category: 'prop' };
function build() {
  const root = createRoot('Workbench');
  const timber = gameMaterial('#bb8751', { roughness: 0.85 });
  const edge = gameMaterial('#805738', { roughness: 0.9 });
  const steel = gameMaterial('#334148', { roughness: 0.65 });
  const shelfHeight = 0.2;
  const part = (name, size, position, material) => createPart(name, boxGeo(...size), material, { parent: root, position });
  for (const x of [-0.69, 0.69]) for (const z of [-0.3, 0.3]) {
    part(`Leg_${x}_${z}`, [0.1, 0.88, 0.1], [x, 0.44, z], steel);
    part(`Foot_${x}_${z}`, [0.14, 0.035, 0.14], [x, 0.0175, z], steel);
  }
  for (let i = 0; i < 5; i++) part(`TopBoard_${i}`, [1.65, 0.08, 0.15], [0, 0.9, (i - 2) * 0.156], timber);
  for (const z of [-0.32, 0.32]) {
    part(`Apron_${z}`, [1.48, 0.12, 0.06], [0, 0.78, z], edge);
    part(`ShelfRail_${z}`, [1.48, 0.075, 0.06], [0, shelfHeight - 0.055, z], steel);
  }
  for (let i = 0; i < 4; i++) part(`ShelfBoard_${i}`, [1.38, 0.045, 0.14], [0, shelfHeight, (i - 1.5) * 0.145], timber);
  return root;
}

// Ordinary JavaScript: copy this function into your asset source.
/** @param {{width:number,height:number,depth:number,post:number}} spec */
function makeFrame(name, spec, material, parent) {
  const { width, height, depth, post } = spec;
  if (![width, height, depth, post].every(v => Number.isFinite(v) && v > 0)
      || post * 2 >= Math.min(width, height)) throw new Error('Invalid frame dimensions');
  const root = createPivot(name, [0, 0, 0], parent);
  createPart('LeftPost', boxGeo(depth, height, post), material,
    { position: [0, height / 2, -(width - post) / 2], parent: root });
  createPart('RightPost', boxGeo(depth, height, post), material,
    { position: [0, height / 2, (width - post) / 2], parent: root });
  createPart('Header', boxGeo(depth, post, width - 2 * post), material,
    { position: [0, height - post / 2, 0], parent: root });
  const top = createPivot('TopAttachment', [0, height, 0], root);
  const base = createPivot('BaseAttachment', [0, 0, 0], root);
  return { root, anchors: { top, base } };
}

const meta = { name: 'Three portal frames', category: 'architecture' };
function build() {
  const root = createRoot('PortalFrames');
  const steel = gameMaterial(0x3b7278);
  const near = makeFrame('Near', { width: 2.4, height: 2.6, depth: 0.18, post: 0.14 }, steel, root);
  const middle = makeFrame('Middle', { width: 2.4, height: 3.1, depth: 0.18, post: 0.14 }, steel, root);
  const far = makeFrame('Far', { width: 2.4, height: 2.8, depth: 0.18, post: 0.14 }, steel, root);
  near.root.position.x = -1.5;
  far.root.position.x = 1.5;
  // An attachment follows this frame's dimensions without duplicated coordinates.
  createPart('Marker', sphereGeo(0.09, 12, 8), gameMaterial(0xe6b65c),
    { position: [0, 0.09, 0], parent: middle.anchors.top });
  return root;
}

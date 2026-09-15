import * as T from 'three';
import { renderSceneToGLB } from '../../src/render';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { parseArgs } from 'node:util';
const { values } = parseArgs({ options: { output: { type: 'string' } } });
if (!values.output) throw new Error('Required: --output EMPTY_GLB_DIRECTORY');
const output = resolve(values.output);
process.env['KILN_GLTF_EXPORTER'] = 'three';
await mkdir(output, { recursive: true });
for (const kind of ['skin', 'morph', 'double-sided', 'single-sided']) {
  const root = new T.Group();
  root.name = 'Fixture';
  const material = new T.MeshStandardMaterial({
    color: 0x22aa55,
    roughness: 0.55,
    metalness: 0.1,
    side: kind === 'single-sided' ? T.FrontSide : T.DoubleSide,
  });
  material.name = 'Surface';
  let clips: T.AnimationClip[] = [];
  if (kind === 'skin') {
    const geo = new T.PlaneGeometry(0.4, 1, 1, 2);
    geo.translate(0, 0.5, 0);
    const count = geo.getAttribute('position').count,
      indices = [],
      weights = [];
    for (let i = 0; i < count; i++) {
      const y = geo.getAttribute('position').getY(i);
      indices.push(y > 0.5 ? 1 : 0, 0, 0, 0);
      weights.push(1, 0, 0, 0);
    }
    geo.setAttribute('skinIndex', new T.Uint16BufferAttribute(indices, 4));
    geo.setAttribute('skinWeight', new T.Float32BufferAttribute(weights, 4));
    const mesh = new T.SkinnedMesh(geo, material);
    mesh.name = 'Mesh_Skin';
    const base = new T.Bone();
    base.name = 'Bone_Base';
    const tip = new T.Bone();
    tip.name = 'Bone_Tip';
    tip.position.y = 0.5;
    base.add(tip);
    mesh.add(base);
    root.add(mesh);
    root.updateMatrixWorld(true);
    mesh.bind(new T.Skeleton([base, tip]));
    clips = [
      new T.AnimationClip('Bend', 2, [
        new T.QuaternionKeyframeTrack(
          'Bone_Tip.quaternion',
          [0, 2],
          [0, 0, 0, 1, 0, 0, Math.sin(Math.PI / 6), Math.cos(Math.PI / 6)],
        ),
      ]),
    ];
  } else if (kind === 'morph') {
    const geo = new T.BoxGeometry(0.4, 0.4, 0.2);
    const target = geo.getAttribute('position').clone();
    for (let i = 0; i < target.count; i++)
      target.setX(i, target.getX(i) + (target.getY(i) > 0 ? 0.6 : 0));
    geo.morphAttributes.position = [target];
    const mesh = new T.Mesh(geo, material);
    mesh.name = 'Mesh_Morph';
    mesh.updateMorphTargets();
    root.add(mesh);
    clips = [
      new T.AnimationClip('Stretch', 2, [
        new T.NumberKeyframeTrack('Mesh_Morph.morphTargetInfluences[0]', [0, 2], [0, 1]),
      ]),
    ];
  } else {
    const mesh = new T.Mesh(new T.PlaneGeometry(0.8, 0.8), material);
    mesh.name = 'Mesh_Sheet';
    root.add(mesh);
  }
  const result = await renderSceneToGLB(root, { clips, derivative: true, optimize: 'off' });
  if (result.gltfValidation.issues.numErrors) throw new Error(`${kind}: invalid GLB`);
  await writeFile(join(output, `${kind}.glb`), result.bytes, { flag: 'wx' });
  console.log(kind, result.bytes.length);
}

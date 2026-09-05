/** Offline X4 trial: ordinary functions versus expanded assembly source. */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { executeKilnCode } from '../src/render';
import { KilnDraftBuffer } from '../src/edit-buffer';
import type * as THREE from 'three';

const recipe = readFileSync(resolve(import.meta.dir, '../skills/kiln-author-asset/references/reusable-frame.kiln.js'), 'utf8').replace(/\r\n/g, '\n');
const helper = recipe.slice(0, recipe.indexOf('const meta'));
const body = helper.slice(helper.indexOf('  const { width'), helper.lastIndexOf('}'));
function source(count: number, expanded: boolean): string {
  const assemblies = Array.from({length: count}, (_, i) => {
    const args = `'Frame${i}', { width: 2.4, height: 2.6, depth: 0.18, post: 0.14 }, steel, root`;
    const expression = expanded ? `((name, spec, material, parent) => {${body}})(${args})` : `makeFrame(${args})`;
    return `const frame${i} = ${expression}; frame${i}.root.position.x = ${i * 1.5};`;
  }).join('\n');
  return `${expanded ? '' : helper}const meta={name:'Repeated frames',category:'architecture'};\nfunction build(){const root=createRoot('Frames');const steel=gameMaterial(0x3b7278);\n${assemblies}\nreturn root;}`;
}
function snapshot(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  const records: unknown[] = [];
  root.traverse(node => {
    const mesh = node as THREE.Mesh;
    records.push({name: node.name, matrix: node.matrixWorld.toArray(),
      positions: mesh.isMesh ? Array.from(mesh.geometry.getAttribute('position').array) : undefined});
  });
  return JSON.stringify(records);
}
const trials = [];
for (const count of [1, 3, 16]) {
  const compact = source(count, false), expanded = source(count, true);
  const a = await executeKilnCode(compact), b = await executeKilnCode(expanded);
  const equal = snapshot(a.root) === snapshot(b.root);
  if (!equal) throw new Error('Expanded and reusable assemblies differ');
  const oldString = "'Frame0', { width: 2.4, height: 2.6";
  const newString = "'Frame0', { width: 2.4, height: 3.1";
  const draft = new KilnDraftBuffer(compact);
  if (!draft.apply({oldString, newString}).ok) throw new Error('Revision failed');
  const edited = (await executeKilnCode(draft.code)).root;
  const target = edited.getObjectByName('Joint_Frame0')!;
  const anchorY = target.getObjectByName('Joint_TopAttachment')!.position.y;
  if (anchorY !== 3.1) throw new Error('Attachment did not follow parameter');
  for (let i=1;i<count;i++) {
    if (snapshot(a.root.getObjectByName(`Joint_Frame${i}`)!) !== snapshot(edited.getObjectByName(`Joint_Frame${i}`)!)) throw new Error('Unrelated assembly changed');
  }
  trials.push({count, reusableBytes: Buffer.byteLength(compact), expandedBytes: Buffer.byteLength(expanded), identicalGeometryAndTransforms: equal,
    editArgumentBytes: Buffer.byteLength(JSON.stringify({oldString,newString})), revisedAnchorY: anchorY, unchangedSiblingAssemblies: count-1,
    semanticsSha256: createHash('sha256').update(snapshot(a.root)).digest('hex')});
}
const receipt = {experiment: 'X4 ordinary reusable parts', scope:'Offline deterministic assembly comparison; no model or visual-quality claim', trials};
writeFileSync(resolve(import.meta.dir, '../docs/experiments/reusable-parts-results.json'), JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt,null,2));

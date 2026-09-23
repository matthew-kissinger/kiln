import { describe, expect, test } from 'bun:test';
import * as THREE from 'three';
import { describeAssembly, replicateAssembly } from './assembly';
import { createWheelAssembly, resolveVehicleWheelAssemblies } from './vehicle';
import { createGableRoof } from './architecture';
import {
  createJointChain,
  readCharacterJointDescriptorV1,
  readCharacterRigGraphV1,
  stampCharacterRigGraphV1,
} from './character';
import { readSemanticMetadataV1, stampSemanticMetadataV1 } from './contracts';
import { createClip, getJointNames, positionTrack, rotationTrack } from './primitives';
import { renderSceneToGLB } from './render';
import { NodeIO } from '@gltf-transform/core';
import { loadGlbReviewScene } from './views/glb';
import { prepareClip, poseSceneAtTime } from './views/pose';

const material = () => new THREE.MeshStandardMaterial({ color: 0x778899 });
function bay() {
  const root = new THREE.Group();
  root.name = 'Bay';
  const geometry = new THREE.BoxGeometry(0.2, 2, 0.2);
  const mat = material();
  for (const [name, x] of [
    ['Left', -1],
    ['Right', 1],
  ] as const) {
    const post = new THREE.Mesh(geometry, mat);
    post.name = name;
    post.position.set(x, 1, 0);
    root.add(post);
    stampSemanticMetadataV1(post, {
      roles: ['bay.post', `bay.post.${name.toLowerCase()}`],
      frames: [{ id: 'top', translation: [0, 1, 0], rotation: [0, 0, 0, 1] }],
      sockets: [
        { id: `top-${name.toLowerCase()}`, type: 'beam', frame: 'top', compatibleTypes: ['beam'] },
      ],
    });
  }
  stampSemanticMetadataV1(root, {
    roles: ['bay'],
    relationships: [
      { kind: 'contains', targetType: 'node', target: 'Left' },
      { kind: 'contains', targetType: 'role', target: 'bay.post.right' },
      { kind: 'connects', targetType: 'socket', target: 'top-left' },
    ],
  });
  return root;
}
function expectMatrix(a: THREE.Matrix4, b: THREE.Matrix4) {
  for (let i = 0; i < 16; i++) expect(a.elements[i]).toBeCloseTo(b.elements[i]!, 7);
}

describe('common assembly access', () => {
  test('semantic joint discovery finds unnamed wheel pivots and renamed joint chains without guessing from names', () => {
    const root = new THREE.Group();
    const wheel = createWheelAssembly(
      'Wheel',
      { tire: material(), rim: material() },
      { side: 'left', index: 0, radius: 0.5, width: 0.2, steering: true },
    );
    root.add(wheel.root);
    wheel.spinPivot.name = 'Rotor';
    wheel.steeringPivot!.name = 'Swivel';
    const chain = createJointChain(
      'Arm',
      [
        { role: 'arm', offset: [0, 1, 0] },
        { role: 'tip', offset: [1, 0, 0] },
      ],
      { parent: root },
    );
    chain.nodes.forEach((node) => {
      node.name = 'Duplicate';
    });
    const namedOnly = new THREE.Object3D();
    namedOnly.name = 'Joint_Unclassified';
    root.add(namedOnly);
    const misleading = new THREE.Object3D();
    stampSemanticMetadataV1(misleading, { roles: ['wheel.pivotish'] });
    root.add(misleading);
    const view = describeAssembly(root);
    expect(view.joints.map((joint) => joint.node)).toEqual([
      wheel.steeringPivot!,
      wheel.spinPivot,
      ...chain.nodes,
    ]);
    expect(new Set(view.joints.map((joint) => joint.nodeId)).size).toBe(4);
    expect(view.joints.map((joint) => joint.kinds)).toEqual([
      ['steering'],
      ['wheel-spin'],
      ['articulated'],
      ['articulated'],
    ]);
    expect(view.joints[2]?.descriptor?.role).toBe('arm');
    expect(view.joints[2]?.descriptor?.rest.translation).toEqual([0, 1, 0]);
    expect(getJointNames(root)).toEqual(['Joint_Unclassified']);
    view.joints[2]!.descriptor!.rest.translation[0] = 100;
    expect(readCharacterJointDescriptorV1(chain.root)!.rest.translation[0]).toBe(0);
  });
  test('describes scoped roles, frames, sockets, material bindings and root-local bounds without mutation', () => {
    const root = bay();
    root.position.set(20, 2, 4);
    root.rotation.y = 0.7;
    root.scale.set(3, 2, 4);
    const before = root.matrix.clone();
    const view = describeAssembly(root);
    expect(view.version).toBe('kiln.assembly.v1');
    expect(view.root).toBe(root);
    expect(view.roles.get('bay.post')).toHaveLength(2);
    expect(view.frames).toHaveLength(2);
    expect(view.sockets).toHaveLength(2);
    expect(view.materials).toHaveLength(2);
    expect(view.bounds!.size[0]).toBeCloseTo(2.2);
    expect(view.bounds!.size[1]).toBeCloseTo(2);
    expect(view.ownership.hierarchy).toBe('borrowed');
    expect(root.matrix.equals(before)).toBe(true);
    root.children[1]!.position.x = 5;
    expect(view.bounds!.size[0]).toBeCloseTo(2.2); // explicitly a snapshot
    expect(describeAssembly(root).bounds!.size[0]).toBeCloseTo(6.2);
  });

  test('a geometry-free articulated scaffold has no fabricated bounds', () => {
    const chain = createJointChain('Arm', [
      { role: 'arm', offset: [0, 1, 0] },
      { role: 'tip', offset: [1, 0, 0], endEffector: true },
    ]);
    const view = describeAssembly(chain.root);
    expect(view.bounds).toBeNull();
    expect(view.frames.length).toBeGreaterThan(0);
    expect(view.sockets).toHaveLength(1);
  });
});

describe('hierarchy and resource replication', () => {
  test('policy typos and copy implementations that cannot guarantee ownership fail explicitly', () => {
    const source = bay();
    expect(() =>
      replicateAssembly(describeAssembly(source), {
        namespace: 'typo',
        geometries: 'copy',
      } as unknown as Parameters<typeof replicateAssembly>[1]),
    ).toThrow(/option|policy/);
    const mesh = source.children[0] as THREE.Mesh;
    const mat = mesh.material as THREE.MeshStandardMaterial;
    mat.onBeforeRender = () => {};
    expect(() =>
      replicateAssembly(describeAssembly(source), { namespace: 'hook', materials: 'copy' }),
    ).toThrow(/custom|callback/);
    const shared = replicateAssembly(describeAssembly(source), { namespace: 'shared' });
    expect((shared.root.children[0] as THREE.Mesh).material).toBe(mat);
    mat.onBeforeRender = THREE.Material.prototype.onBeforeRender;
    mesh.geometry.clone = () => mesh.geometry;
    expect(() =>
      replicateAssembly(describeAssembly(source), { namespace: 'fake', geometry: 'copy' }),
    ).toThrow(/custom|clone/);
    const shadow = bay();
    shadow.onBeforeShadow = () => {};
    expect(() => describeAssembly(shadow)).toThrow(/callback/);
  });
  test('static manual TRS matrices refresh replica world caches without inheriting an old parent', () => {
    const root = bay();
    const parent = new THREE.Group();
    parent.position.x = 10;
    parent.add(root);
    root.matrixAutoUpdate = false;
    root.matrix.makeTranslation(2, 0, 0);
    parent.updateMatrixWorld(true);
    root.matrixWorldNeedsUpdate = false;
    const replica = replicateAssembly(describeAssembly(root), { namespace: 'manual_static' });
    replica.root.updateMatrixWorld();
    expect(replica.root.matrixWorld.elements[12]).toBe(2);
    expect(root.matrixWorld.elements[12]).toBe(12);
    root.matrixWorldAutoUpdate = false;
    expect(() => describeAssembly(root)).toThrow(/matrixWorldAutoUpdate|world matrix/);
  });
  test('preserves authored signed TRS components instead of decomposing an equivalent matrix', () => {
    const source = bay();
    source.scale.set(2, -3, 0.5);
    source.rotation.set(0.2, 0.3, 0.4);
    source.children[0]!.scale.set(-1, -2, 3);
    source.children[0]!.rotation.y = -0.2;
    const replica = replicateAssembly(describeAssembly(source), { namespace: 'signed' });
    for (const node of [source, source.children[0]!]) {
      const copy = replica.nodeMap.get(node)!;
      expect(copy.scale.toArray()).toEqual(node.scale.toArray());
      expect(copy.quaternion.toArray()).toEqual(node.quaternion.toArray());
    }
  });

  test('large translations cannot hide local shear and nonunit source quaternions fail clearly', () => {
    const source = bay();
    source.matrixAutoUpdate = false;
    source.matrix.makeTranslation(1e12, 0, 0);
    source.matrix.elements[4] = 0.3;
    expect(() => describeAssembly(source)).toThrow(/shear|TRS/);
    const invalid = bay();
    invalid.quaternion.set(0, 0, 0, 2);
    expect(() => describeAssembly(invalid)).toThrow(/quaternion/);
  });

  test('one namespace cannot silently coexist with different replica source names in a destination', () => {
    const parent = new THREE.Group();
    const source = bay();
    replicateAssembly(describeAssembly(source), { namespace: 'reserved', parent });
    source.name = 'Different';
    source.children[0]!.name = 'DifferentLeft';
    source.children[1]!.name = 'DifferentRight';
    stampSemanticMetadataV1(source, { roles: ['bay'] });
    expect(() =>
      replicateAssembly(describeAssembly(source), { namespace: 'reserved', parent }),
    ).toThrow(/collision|namespace/);
    expect(parent.children).toHaveLength(1);
  });
  test('retains full local transforms under a new nonidentity parent and shares resources explicitly', () => {
    const oldParent = new THREE.Group();
    oldParent.position.set(10, 0, 0);
    oldParent.rotation.z = 0.3;
    const source = bay();
    source.position.set(1, 2, 3);
    source.rotation.y = 0.5;
    source.scale.set(-2, 3, 0.5);
    oldParent.add(source);
    source.children[0]!.rotation.x = 0.4;
    const parent = new THREE.Group();
    parent.position.set(-5, 4, 7);
    parent.scale.set(4, 2, 1);
    const replica = replicateAssembly(describeAssembly(source), { namespace: 'second', parent });
    expect(replica.root.parent).toBe(parent);
    expect(replica.root.children).toHaveLength(2);
    expect(replica.root).not.toBe(source);
    expect(replica.root.position.toArray()).toEqual(source.position.toArray());
    expect(replica.root.scale.toArray()).toEqual(source.scale.toArray());
    const a = source.children[0] as THREE.Mesh;
    const b = replica.nodeMap.get(a) as THREE.Mesh;
    expect(b.geometry).toBe(a.geometry);
    expect(b.material).toBe(a.material);
    expect(b.rotation.x).toBeCloseTo(a.rotation.x);
    expect(b.uuid).not.toBe(a.uuid);
    expect(b.name).not.toBe(a.name);
    b.position.x = 99;
    expect(a.position.x).toBe(-1);
    expect(replica.ownership.geometry).toBe('shared');
    expect(replica.ownership.materials).toBe('shared');
    expect(source.parent).toBe(oldParent);
  });

  test('copy policies own buffers/materials once per shared resource while keeping textures shared', () => {
    const source = bay();
    const original = source.children[0] as THREE.Mesh;
    const texture = new THREE.Texture();
    (original.material as THREE.MeshStandardMaterial).map = texture;
    const replica = replicateAssembly(describeAssembly(source), {
      namespace: 'owned',
      geometry: 'copy',
      materials: 'copy',
    });
    const left = replica.root.children[0] as THREE.Mesh;
    const right = replica.root.children[1] as THREE.Mesh;
    expect(left.geometry).not.toBe(original.geometry);
    expect(left.geometry).toBe(right.geometry);
    expect(left.material).not.toBe(original.material);
    expect(left.material).toBe(right.material);
    expect((left.material as THREE.MeshStandardMaterial).map).toBe(texture);
    left.geometry.getAttribute('position').setX(0, 100);
    expect(original.geometry.getAttribute('position').getX(0)).not.toBe(100);
    expect(Array.from(left.geometry.getAttribute('uv').array)).toEqual(
      Array.from(original.geometry.getAttribute('uv').array),
    );
    expect(left.geometry.groups).toEqual(original.geometry.groups);
    expect(replica.ownership.textures).toBe('shared');
  });

  test('world placement preserves the world transform, rejecting reparenting that requires local shear', () => {
    const source = bay();
    source.position.set(1, 2, 3);
    source.rotation.y = 0.6;
    const oldParent = new THREE.Group();
    oldParent.position.set(7, 8, 9);
    oldParent.rotation.z = 0.2;
    oldParent.add(source);
    const parent = new THREE.Group();
    parent.position.set(-5, 2, 1);
    parent.rotation.x = 0.1;
    source.updateWorldMatrix(true, true);
    const expected = source.matrixWorld.clone();
    const replica = replicateAssembly(describeAssembly(source), {
      namespace: 'world',
      space: 'world',
      parent,
    });
    replica.root.updateWorldMatrix(true, true);
    expectMatrix(replica.root.matrixWorld, expected);
    const scaled = new THREE.Group();
    scaled.scale.set(2, 1, 3);
    expect(() =>
      replicateAssembly(describeAssembly(source), {
        namespace: 'sheared',
        space: 'world',
        parent: scaled,
      }),
    ).toThrow(/shear|TRS/);
    expect(scaled.children).toHaveLength(0);
  });

  test('revalidates edited source and detects namespace collisions before attaching a replica', () => {
    const source = bay();
    const view = describeAssembly(source);
    const parent = new THREE.Group();
    replicateAssembly(view, { namespace: 'same', parent });
    expect(() => replicateAssembly(view, { namespace: 'same', parent })).toThrow(
      /collision|already/,
    );
    source.children[0]!.scale.x = 0;
    expect(() => replicateAssembly(view, { namespace: 'invalid', parent })).toThrow(
      /singular|zero/,
    );
    expect(parent.children).toHaveLength(1);
  });

  test('rejects unsupported skin, morph, instances, custom metadata and lossy matrices explicitly', () => {
    for (const node of [
      new THREE.SkinnedMesh(new THREE.BoxGeometry(), material()),
      new THREE.InstancedMesh(new THREE.BoxGeometry(), material(), 2),
    ]) {
      expect(() => describeAssembly(node)).toThrow(/unsupported|skin|instanc/i);
    }
    const morph = new THREE.Mesh(new THREE.BoxGeometry(), material());
    morph.geometry.morphAttributes.position = [morph.geometry.getAttribute('position').clone()];
    expect(() => describeAssembly(morph)).toThrow(/morph/i);
    const source = bay();
    source.matrixAutoUpdate = false;
    source.matrix.elements[4] = 0.3;
    expect(() => describeAssembly(source)).toThrow(/shear|TRS/);
    const custom = bay();
    custom.userData.note = { arbitraryReference: 'Left' };
    const view = describeAssembly(custom);
    expect(() => replicateAssembly(view, { namespace: 'strict' })).toThrow(/metadata/i);
    const copied = replicateAssembly(view, { namespace: 'opaque', unknownMetadata: 'copy-json' });
    expect(copied.root.userData.note).toEqual(custom.userData.note);
    expect(copied.root.userData.note).not.toBe(custom.userData.note);
  });
});

describe('semantic and animation identity', () => {
  test('UUID-bound internal tracks remap, and name-versus-UUID ambiguity cannot pick an arbitrary node', () => {
    const root = bay();
    const child = root.children[0]!;
    const clip = createClip('ByUuid', 1, [
      positionTrack(child.uuid, [{ time: 0, position: [-1, 1, 0] }]),
    ]);
    const replica = replicateAssembly(describeAssembly(root, { clips: [clip] }), {
      namespace: 'uuid',
    });
    expect(replica.clips[0]!.tracks[0]!.name).toBe(`${replica.nodeMap.get(child)!.name}.position`);
    const ambiguous = bay();
    const other = ambiguous.children[1]!;
    ambiguous.children[0]!.name = other.uuid;
    stampSemanticMetadataV1(ambiguous, { roles: ['bay'] });
    const conflict = createClip('Conflict', 1, [
      positionTrack(other.uuid, [{ time: 0, position: [0, 0, 0] }]),
    ]);
    expect(() =>
      replicateAssembly(describeAssembly(ambiguous, { clips: [conflict] }), {
        namespace: 'ambiguous',
      }),
    ).toThrow(/ambiguous/i);
  });
  test('clips attached to descendants are retained and remapped even without an explicit clip list', () => {
    const root = bay();
    const child = root.children[0]!;
    const clip = createClip('Attached', 1, [
      positionTrack(child.name, [{ time: 0, position: [-1, 1, 0] }], 'STEP'),
    ]);
    child.animations = [clip];
    const replica = replicateAssembly(describeAssembly(root), { namespace: 'attached' });
    const copied = replica.nodeMap.get(child)!;
    expect(copied.animations).toHaveLength(1);
    expect(copied.animations[0]).toBe(replica.clipMap.get(clip));
    expect(copied.animations[0]!.tracks[0]!.name).toBe(`${copied.name}.position`);
    expect(copied.animations[0]!.tracks[0]).not.toBe(clip.tracks[0]);
  });
  test('unknown fields inside known metadata cannot disappear during identity remapping', () => {
    const root = bay();
    (root.userData.kilnSemantic as Record<string, unknown>).hiddenReference = 'Left';
    expect(() => describeAssembly(root)).toThrow(/metadata|field/);
  });
  test('unsupported additive/manual-root animation and world placement of declared joint roots fail explicitly', () => {
    const root = bay();
    const track = positionTrack(root.name, [{ time: 0, position: [0, 0, 0] }]);
    const clip = createClip('Additive', 1, [track]);
    clip.blendMode = THREE.AdditiveAnimationBlendMode;
    expect(() =>
      replicateAssembly(describeAssembly(root, { clips: [clip] }), { namespace: 'additive' }),
    ).toThrow(/additive|blend/i);
    clip.blendMode = THREE.NormalAnimationBlendMode;
    root.matrixAutoUpdate = false;
    expect(() =>
      replicateAssembly(describeAssembly(root, { clips: [clip] }), { namespace: 'manual' }),
    ).toThrow(/manual|matrixAutoUpdate/);
    const chain = createJointChain('Root', [{ role: 'root', offset: [0, 1, 0] }]);
    expect(() =>
      replicateAssembly(describeAssembly(chain.root), { namespace: 'world', space: 'world' }),
    ).toThrow(/rest|joint root/);
  });

  test('explicit opaque copying includes clip metadata, while metadata getters and cycles are never executed', () => {
    const root = bay();
    const clip = createClip('Move', 1, [
      positionTrack('Left', [{ time: 0, position: [-1, 1, 0] }]),
    ]);
    clip.userData.note = { reference: 'Left' };
    expect(() =>
      replicateAssembly(describeAssembly(root, { clips: [clip] }), { namespace: 'strict' }),
    ).toThrow(/metadata/);
    const replica = replicateAssembly(describeAssembly(root, { clips: [clip] }), {
      namespace: 'json',
      unknownMetadata: 'copy-json',
    });
    expect(replica.clips[0]!.userData).toEqual(clip.userData);
    expect(replica.clips[0]!.userData.note).not.toBe(clip.userData.note);
    let reads = 0;
    const getter = bay();
    Object.defineProperty(getter.userData, 'kilnSemantic', {
      enumerable: true,
      configurable: true,
      get() {
        reads++;
        return {};
      },
    });
    expect(() => describeAssembly(getter)).toThrow(/getter/);
    expect(reads).toBe(0);
    const cyclic = bay();
    cyclic.userData.cycle = cyclic.userData;
    expect(() => describeAssembly(cyclic)).toThrow(/cyclic/);
    const malformedArray = bay();
    const value = new Array(1);
    Object.assign(value, { extra: 'would disappear during JSON copying' });
    malformedArray.userData.values = value;
    expect(() => describeAssembly(malformedArray)).toThrow(/sparse|extended/);
  });

  test('export preserves concrete replica references and animates the replica without moving the source', async () => {
    const source = bay();
    const clip = createClip('Step', 2, [
      positionTrack(
        'Left',
        [
          { time: 0, position: [-1, 1, 0] },
          { time: 1, position: [-1, 2, 0] },
          { time: 2, position: [-1, 1, 0] },
        ],
        'STEP',
      ),
    ]);
    const replica = replicateAssembly(describeAssembly(source, { clips: [clip] }), {
      namespace: 'exported',
    });
    replica.root.position.x = 4;
    const scene = new THREE.Group();
    scene.name = 'Scene';
    scene.add(source, replica.root);
    const output = await renderSceneToGLB(scene, { clips: [...replica.clips] });
    const doc = await new NodeIO().readBinary(output.bytes);
    const root = doc
      .getRoot()
      .listNodes()
      .find((node) => node.getName() === replica.root.name)!;
    const metadata = root.getExtras().kilnSemantic as { relationships: Array<{ target: string }> };
    expect(metadata.relationships[0]!.target).toBe(replica.nodeMap.get(source.children[0]!)!.name);
    const loaded = await loadGlbReviewScene(output.bytes);
    poseSceneAtTime(loaded.root, prepareClip(loaded.root, loaded.clips[0]!), 1.5);
    expect(loaded.root.getObjectByName('Left')!.position.y).toBe(1);
    expect(
      loaded.root.getObjectByName(replica.nodeMap.get(source.children[0]!)!.name)!.position.y,
    ).toBe(2);
  });
  test('internal references use replica identities while repeated classification roles remain intact', () => {
    const source = bay();
    const replica = replicateAssembly(describeAssembly(source), { namespace: 'third' });
    const metadata = readSemanticMetadataV1(replica.root)!;
    expect(metadata.relationships[0]).toMatchObject({
      targetType: 'node',
      target: replica.nodeMap.get(source.children[0]!)!.name,
    });
    expect(metadata.relationships[1]).toMatchObject({
      targetType: 'node',
      target: replica.nodeMap.get(source.children[1]!)!.name,
    });
    const socket = readSemanticMetadataV1(replica.nodeMap.get(source.children[0]!)!)!.sockets[0]!;
    expect(metadata.relationships[2]).toMatchObject({ targetType: 'socket', target: socket.id });
    expect(socket.id).not.toBe('top-left');
    expect(socket.frame).toBe('top');
    expect(replica.roles.get('bay.post')).toHaveLength(2);
    expect(readSemanticMetadataV1(source)!.relationships[0]!.target).toBe('Left');
  });

  test('wheel and roof retain complete parts and expose their unresolved external relationships', () => {
    const wheel = createWheelAssembly(
      'Wheel',
      { tire: material(), rim: material() },
      { radius: 0.6, width: 0.2, side: 'left', index: 0, steering: true },
    );
    const roof = createGableRoof('Roof', material(), { spanX: 4, spanZ: 3, rise: 1 });
    for (const root of [wheel.root, roof.root]) {
      const view = describeAssembly(root);
      expect(() => replicateAssembly(view, { namespace: 'strict' })).toThrow(/external/);
      const replica = replicateAssembly(view, {
        namespace: root === wheel.root ? 'wheel' : 'roof',
        externalReferences: 'preserve',
      });
      expect(replica.nodes).toHaveLength(view.nodes.length);
      expect(replica.externalReferences.length).toBeGreaterThan(0);
      expect(replica.frames.length).toBe(view.frames.length);
    }
    const replica = replicateAssembly(describeAssembly(wheel.root), {
      namespace: 'wheel_b',
      externalReferences: 'preserve',
    });
    const resolved = resolveVehicleWheelAssemblies(replica.root);
    expect(resolved).toHaveLength(1);
    expect(resolved[0]!.side).toBe('left');
    expect(resolved[0]!.index).toBe('0');
  });

  test('branched articulation remaps descriptors, rig graph and STEP clips while retaining rest values', () => {
    const root = new THREE.Group();
    root.name = 'Creature';
    const body = createJointChain('Body', [{ role: 'body', offset: [0, 1, 0] }], { parent: root });
    const left = createJointChain(
      'Left',
      [
        { role: 'left.arm', aliases: ['left.hand-base'], offset: [1, 0, 0] },
        { role: 'left.tip', offset: [1, 0, 0], endEffector: true },
      ],
      { parent: body.end, parentRole: 'body' },
    );
    const right = createJointChain(
      'Right',
      [
        { role: 'right.arm', offset: [-1, 0, 0] },
        { role: 'right.tip', offset: [-1, 0, 0], endEffector: true },
      ],
      { parent: body.end, parentRole: 'body' },
    );
    stampCharacterRigGraphV1(root, {
      bodyPlan: 'custom',
      joints: [...body.descriptors, ...left.descriptors, ...right.descriptors],
    });
    const clips = [
      createClip('Gesture', 1, [
        positionTrack(
          body.root.name,
          [
            { time: 0, position: [0, 1, 0] },
            { time: 1, position: [0, 1.1, 0] },
          ],
          'STEP',
        ),
        rotationTrack(left.root.name, [
          { time: 0, rotation: [0, 0, 0] },
          { time: 1, rotation: [0, 0, 45] },
        ]),
      ]),
    ];
    const replica = replicateAssembly(describeAssembly(root, { clips }), { namespace: 'other' });
    const copiedLeft = replica.nodeMap.get(left.root)!;
    const descriptor = readCharacterJointDescriptorV1(copiedLeft)!;
    expect(descriptor.role).toBe('other.left.arm');
    expect(descriptor.parentRole).toBe('other.body');
    expect(descriptor.aliases).toEqual(['other.left.hand-base']);
    expect(descriptor.rest).toEqual(left.descriptors[0]!.rest);
    const graph = readCharacterRigGraphV1(replica.root)!;
    expect(graph.joints.map((joint) => joint.role)).toEqual([
      'other.body',
      'other.left.arm',
      'other.left.tip',
      'other.right.arm',
      'other.right.tip',
    ]);
    expect(replica.clips[0]!.tracks[0]!.name).toBe(
      `${replica.nodeMap.get(body.root)!.name}.position`,
    );
    expect(replica.clips[0]!.tracks[0]!.getInterpolation()).toBe(THREE.InterpolateDiscrete);
    expect(Array.from(replica.clips[0]!.tracks[0]!.values)).toEqual(
      Array.from(clips[0]!.tracks[0]!.values),
    );
    const scene = new THREE.Group();
    scene.add(root, replica.root);
    const mixer = new THREE.AnimationMixer(scene);
    mixer.clipAction(replica.clips[0]!).play();
    mixer.setTime(0.5);
    expect(left.root.quaternion.z).toBe(0);
    expect(copiedLeft.quaternion.z).toBeGreaterThan(0);
    expect(body.root.position.y).toBe(1);
    expect(replica.nodeMap.get(body.root)!.position.y).toBe(1);
  });

  test('ambiguous names/roles and external tracks fail clearly instead of silently binding to the source', () => {
    const source = bay();
    stampSemanticMetadataV1(source, {
      roles: ['bay'],
      relationships: [{ kind: 'holds', targetType: 'role', target: 'bay.post' }],
    });
    expect(() => replicateAssembly(describeAssembly(source), { namespace: 'bad' })).toThrow(
      /ambiguous/i,
    );
    const other = bay();
    other.children[1]!.name = 'Left';
    expect(() => replicateAssembly(describeAssembly(other), { namespace: 'bad' })).toThrow(
      /ambiguous/i,
    );
    const external = createClip('External', 1, [
      positionTrack('Outside', [{ time: 0, position: [0, 0, 0] }]),
    ]);
    expect(() =>
      replicateAssembly(describeAssembly(bay(), { clips: [external] }), { namespace: 'strict' }),
    ).toThrow(/external/);
    const replica = replicateAssembly(describeAssembly(bay(), { clips: [external] }), {
      namespace: 'kept',
      externalReferences: 'preserve',
    });
    expect(replica.clips[0]!.tracks[0]!.name).toBe('Outside.position');
    expect(replica.externalReferences.some((reference) => reference.kind === 'animation')).toBe(
      true,
    );
  });
});

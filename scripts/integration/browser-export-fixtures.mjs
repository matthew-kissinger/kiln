import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { communitySceneDocument } from '../../src/community-exporter.ts';
import { createGltfIO } from '../../src/gltf-io.ts';

const SIZE = 192;
const requireThat = (condition, message) => {
  if (!condition) throw new Error(message);
};
const pixels = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255]);
function texture() {
  const map = new THREE.DataTexture(pixels.slice(), 2, 2, THREE.RGBAFormat);
  map.colorSpace = THREE.SRGBColorSpace;
  map.magFilter = THREE.NearestFilter;
  map.minFilter = THREE.NearestFilter;
  map.needsUpdate = true;
  return map;
}
async function fixture(kind) {
  const root = new THREE.Group();
  root.name = 'Asset';
  let clips = [];
  let mesh;
  if (kind === 'skin') {
    const geometry = new THREE.PlaneGeometry(1, 2, 1, 4);
    geometry.translate(0, 1, 0);
    const position = geometry.getAttribute('position');
    const indices = [];
    const weights = [];
    for (let i = 0; i < position.count; i++) {
      const influence = Math.max(0, Math.min(1, position.getY(i) - 0.5));
      indices.push(0, 1, 0, 0);
      weights.push(1 - influence, influence, 0, 0);
    }
    geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(indices, 4));
    geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));
    mesh = new THREE.SkinnedMesh(
      geometry,
      new THREE.MeshStandardMaterial({ color: 0x44aa77, side: THREE.DoubleSide }),
    );
    const base = new THREE.Bone();
    base.name = 'Joint_Base';
    const tip = new THREE.Bone();
    tip.name = 'Joint_Tip';
    tip.position.y = 0.5;
    base.add(tip);
    mesh.add(base);
    mesh.bind(new THREE.Skeleton([base, tip]));
    clips = [
      new THREE.AnimationClip('Bend', 1, [
        new THREE.QuaternionKeyframeTrack(
          'Joint_Tip.quaternion',
          [0, 1],
          [0, 0, 0, 1, 0, 0, 0.5, Math.sqrt(0.75)],
        ),
      ]),
    ];
  } else if (kind === 'morph') {
    const geometry = new THREE.BoxGeometry(1, 1, 0.4);
    const morph = geometry.getAttribute('position').clone();
    for (let i = 0; i < morph.count; i++) {
      if (morph.getY(i) > 0)
        morph.setXYZ(i, morph.getX(i) + 0.7, morph.getY(i) + 0.5, morph.getZ(i));
    }
    geometry.morphAttributes.position = [morph];
    mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0xaa7744 }));
    mesh.name = 'Mesh_Surface';
    clips = [
      new THREE.AnimationClip('Morph', 1, [
        new THREE.NumberKeyframeTrack('Mesh_Surface.morphTargetInfluences[0]', [0, 1], [0, 1]),
      ]),
    ];
  } else if (kind === 'sheen') {
    mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 32, 16),
      new THREE.MeshPhysicalMaterial({
        color: 0x446688,
        roughness: 0.7,
        sheen: 0.6,
        sheenColor: 0xaa2222,
        sheenRoughness: 0.35,
      }),
    );
  } else {
    const map = texture();
    if (kind === 'encoded') {
      const canvas = new OffscreenCanvas(2, 2);
      const ctx = canvas.getContext('2d');
      ctx.putImageData(new ImageData(new Uint8ClampedArray(pixels), 2, 2), 0, 0);
      map.userData.encoded = {
        mime: 'image/png',
        bytes: new Uint8Array(await (await canvas.convertToBlob()).arrayBuffer()),
      };
    }
    if (kind.startsWith('uv-')) {
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.MirroredRepeatWrapping;
      map.offset.set(0.17, 0.23);
      map.repeat.set(1.7, kind === 'uv-uniform' ? 1.7 : 1.3);
      map.rotation = 0.37;
      if (kind === 'uv-center' || kind === 'uv-uniform') map.center.set(0.5, 0.5);
      if (kind === 'uv-matrix') {
        map.matrixAutoUpdate = false;
        map.matrix.set(1.2, 0.3, 0.13, 0.2, 0.8, 0.21, 0, 0, 1);
      }
      if (kind === 'uv-native-matrix') {
        map.matrixAutoUpdate = false;
        const c = Math.cos(0.37);
        const s = Math.sin(0.37);
        map.matrix.set(1.7 * c, 1.3 * s, 0.17, -1.7 * s, 1.3 * c, 0.23, 0, 0, 1);
      }
    }
    mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 1.5),
      new THREE.MeshStandardMaterial({
        map,
        roughness: 0.6,
        side: kind === 'double-sided' ? THREE.DoubleSide : THREE.FrontSide,
      }),
    );
    if (kind === 'raw' || kind === 'encoded') {
      clips = [
        new THREE.AnimationClip('Turn', 1, [
          new THREE.QuaternionKeyframeTrack(
            'Mesh_Surface.quaternion',
            [0, 1],
            [0, 0, 0, 1, 0, 0.382683432365, 0, 0.923879532511],
          ),
        ]),
      ];
    }
  }
  mesh.name = 'Mesh_Surface';
  mesh.userData.private = 'must-not-export';
  root.add(mesh);
  return { root, clips, mesh };
}
function comparePixels(a, b) {
  let max = 0;
  let total = 0;
  let large = 0;
  let foreground = 0;
  for (let i = 0; i < a.length; i++) {
    const delta = Math.abs(a[i] - b[i]);
    max = Math.max(max, delta);
    total += delta;
    if (delta > 8) large++;
    if (i % 4 !== 3 && a[i] > 5) foreground++;
  }
  return {
    maxByteDifference: max,
    meanByteDifference: total / a.length,
    largeDifferenceFraction: large / a.length,
    foregroundChannels: foreground,
  };
}
function poseVertices(mesh) {
  mesh.updateWorldMatrix(true, false);
  if (mesh.isSkinnedMesh) mesh.skeleton.update();
  const result = [];
  const point = new THREE.Vector3();
  for (let i = 0; i < mesh.geometry.getAttribute('position').count; i++) {
    mesh.getVertexPosition(i, point).applyMatrix4(mesh.matrixWorld);
    result.push(...point.toArray());
  }
  return result;
}
async function run() {
  const canvas = document.createElement('canvas');
  document.body.append(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(SIZE, SIZE);
  const gl = renderer.getContext();
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  const gpu = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  requireThat(!/swiftshader|llvmpipe|software/i.test(gpu), `Hardware GPU required: ${gpu}`);
  const target = new THREE.WebGLRenderTarget(SIZE, SIZE);
  const results = [];
  for (const kind of [
    'raw',
    'encoded',
    'skin',
    'morph',
    'sheen',
    'uv-transform',
    'uv-center',
    'uv-uniform',
    'uv-matrix',
    'uv-native-matrix',
    'double-sided',
  ]) {
    const expectedRejection = ['uv-transform', 'uv-center', 'uv-matrix'].includes(kind);
    const row = { case: kind, expectedRejection };
    results.push(row);
    try {
      const { root, clips, mesh } = await fixture(kind);
      const docs = [
        await communitySceneDocument(root, clips),
        await communitySceneDocument(root, clips),
      ];
      requireThat(
        !expectedRejection,
        'Unrepresentable UV fixture unexpectedly exported; qualify a lossless supported path before changing this expectation',
      );
      const bytes = await Promise.all(docs.map((doc) => createGltfIO().writeBinary(doc)));
      row.bytes = Array.from(bytes[0]);
      requireThat(
        bytes[0].length === bytes[1].length && bytes[0].every((value, i) => value === bytes[1][i]),
        'Nondeterministic browser export',
      );
      const loaded = await new GLTFLoader().parseAsync(bytes[0].buffer, '');
      const importedMesh = loaded.scene.getObjectByName('Mesh_Surface');
      if (kind.startsWith('uv-')) {
        if (mesh.material.map.matrixAutoUpdate) mesh.material.map.updateMatrix();
        row.textureDiagnostic = {
          original: {
            matrix: mesh.material.map.matrix.toArray(),
            flipY: mesh.material.map.flipY,
            wrapS: mesh.material.map.wrapS,
            wrapT: mesh.material.map.wrapT,
            minFilter: mesh.material.map.minFilter,
            magFilter: mesh.material.map.magFilter,
          },
          imported: {
            matrix: importedMesh.material.map.matrix.toArray(),
            flipY: importedMesh.material.map.flipY,
            wrapS: importedMesh.material.map.wrapS,
            wrapT: importedMesh.material.map.wrapT,
            minFilter: importedMesh.material.map.minFilter,
            magFilter: importedMesh.material.map.magFilter,
          },
        };
      }
      requireThat(importedMesh?.isMesh, 'Export lost named mesh');
      requireThat(!('private' in importedMesh.userData), 'Private metadata leaked');
      if (kind === 'skin')
        requireThat(
          importedMesh.isSkinnedMesh && importedMesh.skeleton.bones.length === 2,
          'Skin/bones lost',
        );
      if (kind === 'morph')
        requireThat(importedMesh.morphTargetInfluences.length === 1, 'Morph target lost');
      if (kind.startsWith('uv-'))
        requireThat(
          docs[0]
            .getRoot()
            .listExtensionsUsed()
            .some((ext) => ext.extensionName === 'KHR_texture_transform'),
          'UV transform extension missing',
        );
      if (kind === 'double-sided')
        requireThat(importedMesh.material.side === THREE.DoubleSide, 'Double-sided material lost');
      row.samples = [];
      let firstImage;
      let finalImage;
      const times = clips.length ? [0, 0.25, 0.5, 0.75, 1] : [0];
      const views = kind === 'double-sided' ? ['front', 'back'] : ['front'];
      for (const view of views)
        for (const time of times) {
          const images = [];
          const vertices = [];
          const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
          const centerY = kind === 'skin' ? 0.8 : 0;
          camera.position.set(0, centerY, view === 'back' ? -4 : 4);
          camera.lookAt(0, centerY, 0);
          for (const [object, animation, surface] of [
            [root, clips[0], mesh],
            [loaded.scene, loaded.animations[0], importedMesh],
          ]) {
            let mixer;
            if (animation) {
              mixer = new THREE.AnimationMixer(object);
              const action = mixer.clipAction(animation);
              action.setLoop(THREE.LoopOnce, 1);
              action.clampWhenFinished = true;
              action.play();
              mixer.setTime(time);
            }
            object.updateMatrixWorld(true);
            vertices.push(poseVertices(surface));
            const scene = new THREE.Scene();
            scene.add(object, new THREE.HemisphereLight(0xffffff, 0x555555, 3));
            renderer.setRenderTarget(target);
            renderer.render(scene, camera);
            const image = new Uint8Array(SIZE * SIZE * 4);
            renderer.readRenderTargetPixels(target, 0, 0, SIZE, SIZE, image);
            images.push(image);
            renderer.setRenderTarget(null);
            renderer.render(scene, camera);
            mixer?.stopAllAction();
          }
          const difference = comparePixels(images[0], images[1]);
          let maxVertexDifference = 0;
          requireThat(vertices[0].length === vertices[1].length, 'Vertex count changed');
          vertices[0].forEach((value, i) => {
            maxVertexDifference = Math.max(maxVertexDifference, Math.abs(value - vertices[1][i]));
          });
          row.samples.push({ view, time, ...difference, maxVertexDifference });
          requireThat(
            maxVertexDifference < 1e-5,
            `Deformed vertices differ: ${maxVertexDifference}`,
          );
          requireThat(
            difference.meanByteDifference <= 0.1 && difference.largeDifferenceFraction <= 0.001,
            `GPU parity failed: ${JSON.stringify(difference)}`,
          );
          requireThat(difference.foregroundChannels > 1000, `Fixture not visible from ${view}`);
          firstImage ??= images[0];
          finalImage = images[0];
        }
      if (clips.length) {
        row.motion = comparePixels(firstImage, finalImage);
        requireThat(row.motion.largeDifferenceFraction > 0.005, 'Animation did not visibly move');
      }
      if (kind === 'sheen') {
        mesh.material.sheen = 0;
        const scene = new THREE.Scene();
        scene.add(root, new THREE.HemisphereLight(0xffffff, 0x555555, 3));
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.set(0, 0, 4);
        camera.lookAt(0, 0, 0);
        renderer.setRenderTarget(target);
        renderer.render(scene, camera);
        const withoutSheen = new Uint8Array(SIZE * SIZE * 4);
        renderer.readRenderTargetPixels(target, 0, 0, SIZE, SIZE, withoutSheen);
        renderer.setRenderTarget(null);
        row.sheenEffect = comparePixels(firstImage, withoutSheen);
        requireThat(
          row.sheenEffect.meanByteDifference > 0.01,
          'Sheen did not visibly affect the fixture',
        );
      }
      row.passed = true;
      row.supported = true;
    } catch (error) {
      row.passed =
        expectedRejection &&
        String(error).includes(
          'UV matrix contains shear or perspective that KHR_texture_transform cannot represent',
        );
      row.supported = false;
      row.error = String(error);
    }
  }
  target.dispose();
  renderer.dispose();
  return { gpu, size: SIZE, results };
}
window.audit = run();

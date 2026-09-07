/// <reference lib="dom" />
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { validateAssetGlb } from '../assets';

/** The gallery's local studio lighting, orbit controls, and framing in a small standalone surface. */
export function createAssetStage(container: HTMLElement) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x151a12);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  container.replaceChildren(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 1000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  room.dispose();
  pmrem.dispose();
  const sun = new THREE.DirectionalLight(0xfff1d7, 2.4);
  sun.position.set(4, 8, 5);
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0xe1edda, 0x4d493d, 1.7));
  let root: THREE.Group | undefined;
  let mixer: THREE.AnimationMixer | undefined;
  let clips: THREE.AnimationClip[] = [];
  let running = true;
  let last = performance.now();
  let frame = 0;
  let generation = 0;
  let disposed = false;
  const disposeModel = (model: THREE.Object3D) => {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    model.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      geometries.add(mesh.geometry);
      for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        materials.add(material);
        for (const value of Object.values(material))
          if (value instanceof THREE.Texture) textures.add(value);
      }
    });
    for (const value of [...geometries, ...materials, ...textures]) value.dispose();
  };
  const reset = () => {
    if (!root) return;
    const box = new THREE.Box3().setFromObject(root, true);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const radius = Math.max(size.length() / 2, 0.01);
    const fov = Math.min(
      (camera.fov * Math.PI) / 180,
      2 * Math.atan(Math.tan((camera.fov * Math.PI) / 360) * camera.aspect),
    );
    const distance = (radius / Math.sin(fov / 2)) * 1.12;
    controls.target.copy(center);
    camera.position
      .copy(center)
      .add(new THREE.Vector3(1, 0.65, 1.25).normalize().multiplyScalar(distance));
    camera.near = Math.max(radius / 1000, 0.0001);
    camera.far = distance + radius * 100;
    controls.minDistance = radius * 0.1;
    controls.maxDistance = radius * 80;
    camera.updateProjectionMatrix();
    controls.update();
  };
  const resize = new ResizeObserver(() => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  });
  resize.observe(container);
  const animate = (now: number) => {
    if (disposed) return;
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (running) mixer?.update(dt);
    controls.update();
    renderer.render(scene, camera);
    frame = requestAnimationFrame(animate);
  };
  frame = requestAnimationFrame(animate);
  return {
    async load(bytes: Uint8Array) {
      const current = ++generation;
      validateAssetGlb(bytes);
      const manager = new THREE.LoadingManager();
      manager.setURLModifier((url) => {
        if (!url.startsWith('blob:') && !url.startsWith('data:'))
          throw new Error('External model resources are not loaded');
        return url;
      });
      const gltf = await new GLTFLoader(manager).parseAsync(Uint8Array.from(bytes).buffer, '');
      if (disposed || current !== generation) {
        disposeModel(gltf.scene);
        return undefined;
      }
      if (root) {
        mixer?.stopAllAction();
        mixer?.uncacheRoot(root);
        scene.remove(root);
        disposeModel(root);
      }
      root = gltf.scene;
      scene.add(root);
      clips = gltf.animations;
      mixer = new THREE.AnimationMixer(root);
      running = true;
      const width = container.clientWidth,
        height = container.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      reset();
      let triangles = 0,
        meshes = 0;
      const materials = new Set<THREE.Material>();
      root.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        meshes++;
        triangles +=
          ((mesh.geometry.index?.count ?? mesh.geometry.attributes.position?.count ?? 0) / 3) *
          ((mesh as THREE.InstancedMesh).isInstancedMesh ? (mesh as THREE.InstancedMesh).count : 1);
        for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material])
          materials.add(m);
      });
      return { triangles, meshes, materials: materials.size, clips: clips.map((c) => c.name) };
    },
    reset,
    wire(value: boolean) {
      root?.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh)
          for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material])
            if ('wireframe' in m) m.wireframe = value;
      });
    },
    lighting(value: string) {
      renderer.toneMappingExposure = value === 'bright' ? 1.65 : value === 'soft' ? 0.85 : 1.15;
      sun.intensity = value === 'soft' ? 0.8 : 2.4;
    },
    clip(index: number) {
      mixer?.stopAllAction();
      if (clips[index]) mixer?.clipAction(clips[index]!).play();
    },
    pause(value: boolean) {
      running = !value;
    },
    dispose() {
      disposed = true;
      generation++;
      cancelAnimationFrame(frame);
      resize.disconnect();
      controls.dispose();
      if (root) disposeModel(root);
      environment.dispose();
      renderer.dispose();
      container.replaceChildren();
    },
  };
}

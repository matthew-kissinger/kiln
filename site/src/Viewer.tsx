import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, Grid, OrbitControls, useGLTF, useProgress } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

import { REPO, asset } from './repo';
import type { Specimen } from './types';

const num = (n: number) => n.toLocaleString('en-US');

const title = (name: string) =>
  name
    .split('-')
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join(' ');

interface OrbitLike {
  target: THREE.Vector3;
  minDistance: number;
  maxDistance: number;
  update: () => void;
}

const UP = new THREE.Vector3(0, 1, 0);

/** A three-quarter view from a little above, which suits all fifty of them. */
const ELEVATION = 0.315; // radians, about 18 degrees
const AZIMUTH = 0.733; // radians, about 42 degrees

const orbitDirection = (azimuth: number) =>
  new THREE.Vector3(
    Math.cos(azimuth) * Math.cos(ELEVATION),
    Math.sin(ELEVATION),
    Math.sin(azimuth) * Math.cos(ELEVATION),
  );

/**
 * Points on the actual surface, in world space, thinned to a fixed budget.
 *
 * The camera has to be placed from the silhouette, and the bounding box is a bad
 * proxy for it: the airship is a slender ellipsoid, so six of its box's eight
 * corners are empty air, and framing to them pushed the camera back far enough
 * that the asset sat in the middle of a lot of nothing. Vertices are what is
 * actually on screen.
 *
 * A stride rather than every vertex, because the fit runs over a full turntable
 * and the answer does not improve past a few thousand samples. Instanced meshes
 * fall back to their bounds -- their per-instance transforms are not in the
 * position attribute -- though nothing the engine emits today is instanced.
 */
function surfacePoints(root: THREE.Object3D, budget = 4000): THREE.Vector3[] {
  root.updateWorldMatrix(true, true);
  const meshes: THREE.Mesh[] = [];
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
  });

  let total = 0;
  for (const m of meshes) total += m.geometry.getAttribute('position')?.count ?? 0;
  const stride = Math.max(1, Math.ceil(total / budget));

  const points: THREE.Vector3[] = [];
  const v = new THREE.Vector3();
  for (const mesh of meshes) {
    if ((mesh as THREE.InstancedMesh).isInstancedMesh) {
      const box = new THREE.Box3().setFromObject(mesh);
      for (const x of [box.min.x, box.max.x])
        for (const y of [box.min.y, box.max.y])
          for (const z of [box.min.z, box.max.z]) points.push(new THREE.Vector3(x, y, z));
      continue;
    }
    const pos = mesh.geometry.getAttribute('position');
    if (!pos) continue;
    for (let i = 0; i < pos.count; i += stride) {
      points.push(v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld).clone());
    }
  }
  return points;
}

const AZIMUTH_SAMPLES = 16;

/**
 * Every sampled point resolved into camera axes, once per azimuth on the
 * turntable.
 *
 * The whole turntable and not just the opening angle, because the view rotates:
 * framing for the angle it happens to start at walks the tail of a fifty-metre
 * airship off the edge four seconds later. Flat typed arrays because the search
 * below sweeps these tens of times and allocating a vector per point per pass
 * turns ten milliseconds into a second.
 */
function project(points: readonly THREE.Vector3[], origin: THREE.Vector3) {
  const n = points.length;
  const depth = new Float64Array(AZIMUTH_SAMPLES * n);
  const across = new Float64Array(AZIMUTH_SAMPLES * n);
  const above = new Float64Array(AZIMUTH_SAMPLES * n);
  const p = new THREE.Vector3();

  for (let a = 0; a < AZIMUTH_SAMPLES; a++) {
    const forward = orbitDirection((a / AZIMUTH_SAMPLES) * Math.PI * 2);
    const right = new THREE.Vector3().crossVectors(UP, forward).normalize();
    const up = new THREE.Vector3().crossVectors(forward, right);
    for (let i = 0; i < n; i++) {
      p.copy(points[i]!).sub(origin);
      const at = a * n + i;
      depth[at] = p.dot(forward);
      across[at] = p.dot(right);
      above[at] = p.dot(up);
    }
  }
  return { n, depth, across, above };
}

type Projection = ReturnType<typeof project>;

/**
 * How far back the camera has to sit for everything to stay in frame, with the
 * orbit target raised by `lift` from where the projection was taken.
 *
 * A point is on screen when |across| <= (distance - depth) * tanH, and likewise
 * vertically, so each point names a distance and the largest one wins. Raising
 * the target moves each point down by `lift` in world space, which is a shift of
 * `lift * cos(elevation)` in the camera's vertical axis and `lift *
 * sin(elevation)` in depth; nothing moves horizontally, because the horizontal
 * axis of an orbiting camera is always level.
 */
function distanceFor(proj: Projection, lift: number, tanH: number, tanV: number) {
  const dz = lift * Math.sin(ELEVATION);
  const dy = lift * Math.cos(ELEVATION);
  let needed = 0;
  for (let i = 0; i < proj.depth.length; i++) {
    const depth = proj.depth[i]! - dz;
    const h = depth + Math.abs(proj.across[i]!) / tanH;
    const v = depth + Math.abs(proj.above[i]! - dy) / tanV;
    if (h > needed) needed = h;
    if (v > needed) needed = v;
  }
  return needed;
}

/**
 * Where to point the camera and how far back to put it.
 *
 * Aiming at the centre of the bounding box is the obvious choice and it wastes a
 * lot of screen. The camera looks down from eighteen degrees, so the near-bottom
 * of a wide asset projects much further below the centre than its far-top
 * projects above: the cathedral came out sitting low in a frame padded to fit the
 * corner of its own base slab, at about forty per cent of the width it could
 * have had. Raising the aim point re-centres the silhouette and the padding goes
 * away with it.
 *
 * The distance needed is convex in that height, so a ternary search finds the
 * best one in a few dozen evaluations of arithmetic over flat arrays.
 */
function frameAsset(
  points: readonly THREE.Vector3[],
  center: THREE.Vector3,
  extent: number,
  fov: number,
  aspect: number,
) {
  const tanV = Math.tan((fov * Math.PI) / 360);
  const tanH = tanV * aspect;
  const proj = project(points, center);

  let low = -extent;
  let high = extent;
  for (let i = 0; i < 22; i++) {
    const a = low + (high - low) / 3;
    const b = high - (high - low) / 3;
    if (distanceFor(proj, a, tanH, tanV) < distanceFor(proj, b, tanH, tanV)) high = b;
    else low = a;
  }
  const lift = (low + high) / 2;
  return {
    target: new THREE.Vector3(center.x, center.y + lift, center.z),
    distance: distanceFor(proj, lift, tanH, tanV),
  };
}

/**
 * Image-based lighting from three's own room scene, rather than an HDR fetched
 * from a CDN. Half of these assets are painted metal and every one of them is
 * lit only by what the environment gives it, so a scene with no environment map
 * shows brushed steel as flat grey and makes the engine look worse than it is.
 * Generating the map in the browser costs a few milliseconds once and nothing
 * after that, and it removes a network dependency from the one thing on the page
 * that has to work.
 */
function Ibl() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const target = pmrem.fromScene(room, 0.04);
    scene.environment = target.texture;
    scene.environmentIntensity = 0.62;
    return () => {
      scene.environment = null;
      target.dispose();
      room.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

function Model({
  url,
  wireframe,
  framing,
  onBounds,
}: {
  url: string;
  wireframe: boolean;
  framing: number;
  onBounds: (radius: number) => void;
}) {
  const { scene } = useGLTF(url);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const controls = useThree((s) => s.controls) as OrbitLike | null;
  // The canvas size and not `camera.aspect`, which is still 1 on the frame this
  // first runs, so a wide viewport got framed as though it were square. Reading
  // it here also means turning a phone on its side re-frames instead of cropping.
  const { width, height } = useThree((s) => s.size);

  // Sampled once per asset, not once per reframe: a reset or a resize should not
  // walk every vertex again.
  const points = useMemo(() => surfacePoints(scene), [scene]);

  /**
   * `frustumCulled` off across the board. Several of these programs place parts
   * a long way from the origin -- the airship's mooring mast, the carrier's
   * island -- and three culls against a bounding sphere it computes per mesh, so
   * a part whose geometry was built with a large offset baked into its vertices
   * can blink out at certain angles. Fifty draw calls more is nothing here; a
   * disappearing funnel is not.
   */
  useEffect(() => {
    scene.traverse((o) => {
      o.frustumCulled = false;
    });
  }, [scene]);

  // Frame on load, on every explicit reset, and on resize. The engine's contract
  // puts an asset on Y=0 facing +X, so the camera can be placed from the geometry
  // alone and land on a three-quarter view every time with no per-asset hint.
  //
  // `framing` is not read in the body and is not meant to be: it is a counter
  // the reset button increments, and being in the dependency list is its whole
  // job.
  // biome-ignore lint/correctness/useExhaustiveDependencies: framing is a trigger, not an input.
  useEffect(() => {
    if (!controls) return;
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const radius = Math.max(size.length() / 2, 0.001);
    const framed = frameAsset(points, center, size.y, camera.fov, width / height);
    // A little over the exact fit, so nothing ever kisses the edge of the frame.
    const distance = Math.max(framed.distance, 0.01) * 1.04;

    camera.position.copy(framed.target).addScaledVector(orbitDirection(AZIMUTH), distance);
    camera.near = Math.max(distance / 800, 0.005);
    camera.far = distance * 16;
    camera.updateProjectionMatrix();
    controls.target.copy(framed.target);
    // Before `update()`, and imperatively rather than as props on the control:
    // the limits are a function of the bounds, the bounds are only known here,
    // and `update()` clamps to whatever the limits currently say. Passing them
    // as props meant the first frame of every asset was clamped against the
    // previous one's radius -- which framed the airship at 48 metres instead of
    // 109 and cut its mooring mast off the side of the screen.
    controls.minDistance = radius * 0.3;
    controls.maxDistance = radius * 14;
    controls.update();
    onBounds(radius);
  }, [scene, points, camera, controls, framing, onBounds, width, height]);

  useEffect(() => {
    const touched: THREE.Material[] = [];
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        const mat = m as THREE.MeshStandardMaterial;
        mat.wireframe = wireframe;
        touched.push(mat);
      }
    });
    // Restored on the way out because drei caches the loaded scene by URL, and a
    // material left in wireframe would come back that way on the next visit.
    return () => {
      for (const m of touched) (m as THREE.MeshStandardMaterial).wireframe = false;
    };
  }, [scene, wireframe]);

  return <primitive object={scene} />;
}

function Loading() {
  const { active, progress } = useProgress();
  if (!active) return null;
  return (
    <div className="loading">
      <div>
        <i style={{ width: `${Math.max(progress, 4)}%` }} />
      </div>
      building the mesh
    </div>
  );
}

export function Viewer({ all, current }: { all: Specimen[]; current: Specimen }) {
  const { name } = current;
  const [wireframe, setWireframe] = useState(false);
  const [grid, setGrid] = useState(true);
  const [spin, setSpin] = useState(true);
  const [framing, setFraming] = useState(0);
  const [radius, setRadius] = useState(4);

  const index = all.findIndex((s) => s.name === name);
  const step = useMemo(
    () => (delta: number) => {
      const next = all[(index + delta + all.length) % all.length]!;
      location.hash = `#/${next.name}`;
    },
    [all, index],
  );

  // Arrow keys walk the gallery and Escape goes back to it, because anyone who
  // opens fifty of these in a row will try both within about a minute.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'Escape') location.hash = '#/';
      else if (e.key.toLowerCase() === 'w') setWireframe((v) => !v);
      else if (e.key.toLowerCase() === 'g') setGrid((v) => !v);
      else return;
      e.preventDefault();
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [step]);

  // A new specimen starts framed and spinning again, whatever was left set on
  // the last one. Wireframe and the grid deliberately carry over: someone
  // stepping through the gallery in wireframe meant to be in wireframe.
  //
  // biome-ignore lint/correctness/useExhaustiveDependencies: name is a trigger, not an input.
  useEffect(() => {
    setFraming((n) => n + 1);
    setSpin(true);
  }, [name]);

  const [x, y, z] = current.size;

  return (
    <div className="viewer">
      <div className="bar">
        <a className="back" href="#/">
          &larr; gallery
        </a>
        <div className="sep" />
        <h2>{title(current.name)}</h2>
        <div className="step">
          <button type="button" onClick={() => step(-1)} aria-label="Previous specimen">
            &larr;
          </button>
          <button type="button" onClick={() => step(1)} aria-label="Next specimen">
            &rarr;
          </button>
        </div>
        <div className="controls">
          <button
            type="button"
            className="chip"
            aria-pressed={wireframe}
            onClick={() => setWireframe(!wireframe)}
          >
            wireframe
          </button>
          <button type="button" className="chip" aria-pressed={grid} onClick={() => setGrid(!grid)}>
            grid
          </button>
          <button type="button" className="chip" aria-pressed={spin} onClick={() => setSpin(!spin)}>
            spin
          </button>
          <button type="button" className="chip" onClick={() => setFraming((n) => n + 1)}>
            reset view
          </button>
          <a className="chip" href={`${REPO}/blob/main/examples/${current.name}.kiln.js`}>
            program
          </a>
          <a className="chip" href={asset(current.file)} download={`${current.name}.glb`}>
            glb
          </a>
        </div>
      </div>

      <div className="stage">
        <Canvas
          dpr={[1, 2]}
          // Transparent, so the well behind it keeps its gradient: a flat clear
          // colour under a lit model reads as a cut-out, and the falloff is what
          // makes the stage look like a room.
          gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
          camera={{ fov: 34, position: [6, 3, 5] }}
        >
          <Ibl />
          {/* A key with a real direction on top of the room light, so edges and
              bevels read. Everything else about the surface comes from the
              material the program declared. */}
          <directionalLight position={[radius * 2, radius * 2.6, radius * 1.4]} intensity={2.1} />
          <directionalLight position={[-radius * 1.8, radius, -radius * 1.6]} intensity={0.5} />
          <hemisphereLight args={['#cfd8dd', '#2a221c', 0.35]} />

          <OrbitControls
            makeDefault
            autoRotate={spin}
            autoRotateSpeed={0.55}
            enableDamping
            dampingFactor={0.06}
          />

          <Suspense fallback={null}>
            <Model
              key={current.name}
              url={asset(current.file)}
              wireframe={wireframe}
              framing={framing}
              onBounds={setRadius}
            />
          </Suspense>

          <ContactShadows
            position={[0, 0.001, 0]}
            scale={radius * 4}
            far={radius * 1.5}
            opacity={0.55}
            blur={2.4}
            resolution={1024}
            color="#000000"
          />
          {grid && (
            <Grid
              args={[radius * 10, radius * 10]}
              cellSize={radius / 5}
              cellColor="#2b2620"
              sectionSize={radius}
              sectionColor="#453b31"
              fadeDistance={radius * 9}
              fadeStrength={1.4}
              infiniteGrid
              followCamera={false}
            />
          )}
        </Canvas>

        <Loading />

        {/* One anchored group rather than two independently positioned panels:
            side by side on a wide screen, stacked on a phone, and neither one
            has to know how tall the other is. */}
        <div className="panels">
          <dl className="readout">
            <dt>triangles</dt>
            <dd>{num(current.tris)}</dd>
            <dt>draw calls</dt>
            <dd>{num(current.drawCalls)}</dd>
            <dt>materials</dt>
            <dd>{num(current.materials)}</dd>
            <dt>size</dt>
            <dd>
              {x} &times; {y} &times; {z} m
            </dd>
            <dt>glb</dt>
            <dd>{(current.bytes / 1024).toFixed(0)} KB</dd>
          </dl>

          <p className="caption">
            {current.caption}
            <b>
              written by <i>{current.model}</i> through {current.harness}
              {current.cleanRoom ? ', in a clean room' : ''}
            </b>
          </p>
        </div>
      </div>
    </div>
  );
}

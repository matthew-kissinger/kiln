import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { PMREMGenerator, OrthographicCamera } from 'three';
import { heroCamera } from './hero-camera';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { asset } from './repo';
import type { Specimen } from './types';

function Lighting() {
  const { gl, scene, invalidate } = useThree();
  useEffect(() => {
    const generator = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const target = generator.fromScene(room, 0.04);
    scene.environment = target.texture;
    scene.environmentIntensity = 0.62;
    invalidate();
    return () => {
      scene.environment = null;
      target.dispose();
      room.dispose();
      generator.dispose();
    };
  }, [gl, scene, invalidate]);
  return null;
}

function Model({ file }: { file: string }) {
  const { scene } = useGLTF(asset(file));
  const copy = useMemo(() => scene.clone(true), [scene]);
  const { camera, controls, invalidate } = useThree();
  useEffect(() => {
    if (!(camera instanceof OrthographicCamera) || !controls) return;
    const recipe = heroCamera(copy);
    camera.position.fromArray(recipe.position);
    camera.up.fromArray(recipe.up);
    camera.left = -recipe.halfHeight * recipe.aspect;
    camera.right = recipe.halfHeight * recipe.aspect;
    camera.top = recipe.halfHeight;
    camera.bottom = -recipe.halfHeight;
    camera.near = recipe.near;
    camera.far = recipe.far;
    camera.lookAt(...recipe.target);
    camera.updateProjectionMatrix();
    const orbit = controls as unknown as {
      target: { fromArray(v: number[]): void };
      update(): void;
    };
    orbit.target.fromArray(recipe.target);
    orbit.update();
    invalidate();
  }, [copy, camera, controls, invalidate]);
  return <primitive object={copy} />;
}
export default function HeroScene({
  specimen,
  onReady,
}: {
  specimen: Specimen;
  onReady: () => void;
}) {
  return (
    <Canvas
      frameloop="demand"
      onCreated={onReady}
      dpr={[1, 1.5]}
      orthographic
      camera={{ position: [24, 18, 30], manual: true }}
      fallback={
        <img
          className="hero-poster"
          src={asset(specimen.poster ?? specimen.thumb)}
          alt={`Static preview of ${specimen.name.replaceAll('-', ' ')}`}
        />
      }
    >
      <hemisphereLight args={['#cfd8dd', '#2a221c', 0.35]} />
      <directionalLight position={[10, 13, 7]} intensity={2.1} />
      <directionalLight position={[-9, 5, -8]} intensity={0.5} />
      <Lighting />
      <Model file={specimen.file} />
      <OrbitControls
        makeDefault
        enablePan={false}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI - 0.1}
      />
    </Canvas>
  );
}

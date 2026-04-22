/**
 * Primitive coverage tests (W7.3)
 *
 * Existence of these primitives is the entire substrate of the Kiln
 * sandbox - the LLM is expected to call any of them. The render-only
 * spike test only exercises a handful (boxGeo + gameMaterial), leaving
 * most of primitives.ts uncovered. These tests call each primitive
 * directly and assert real behavior:
 *   - return types are the expected Three.js classes
 *   - geometries produce non-zero positions / indices when applicable
 *   - materials carry through their option settings
 *   - animation track helpers produce KeyframeTrack instances with the
 *     right shape
 *   - the analysis helpers (countTriangles, countMaterials, getJointNames,
 *     validateAsset) compute correct numbers on a small built scene
 */

import { describe, expect, test } from 'bun:test';
import * as THREE from 'three';

import {
  // construction
  createRoot,
  createPivot,
  createPart,
  // geometries
  boxGeo,
  sphereGeo,
  cylinderGeo,
  coneGeo,
  capsuleGeo,
  torusGeo,
  planeGeo,
  // materials
  gameMaterial,
  basicMaterial,
  glassMaterial,
  lambertMaterial,
  // animation tracks
  rotationTrack,
  positionTrack,
  scaleTrack,
  createClip,
  // animation patterns
  idleBreathing,
  bobbingAnimation,
  spinAnimation,
  // analysis
  countTriangles,
  countMaterials,
  getJointNames,
  validateAsset,
  buildSandboxGlobals,
} from '../primitives';

// =============================================================================
// Construction primitives
// =============================================================================

describe('createRoot / createPivot / createPart', () => {
  test('createRoot returns a named Object3D', () => {
    const root = createRoot('MyAsset');
    expect(root).toBeInstanceOf(THREE.Object3D);
    expect(root.name).toBe('MyAsset');
  });

  test('createPivot positions the joint and parents it', () => {
    const root = createRoot('R');
    const pivot = createPivot('Hip', [1, 2, 3], root);

    expect(pivot.name).toBe('Joint_Hip');
    expect(pivot.position.x).toBe(1);
    expect(pivot.position.y).toBe(2);
    expect(pivot.position.z).toBe(3);
    expect(pivot.parent).toBe(root);
    expect(root.children).toContain(pivot);
  });

  test('createPivot defaults position to origin and works without a parent', () => {
    const orphan = createPivot('Lonely');
    expect(orphan.position.x).toBe(0);
    expect(orphan.position.y).toBe(0);
    expect(orphan.position.z).toBe(0);
    expect(orphan.parent).toBeNull();
  });

  test('createPart returns a Mesh by default and adds it to the parent', () => {
    const root = createRoot('R');
    const mesh = createPart('Body', boxGeo(1, 1, 1), gameMaterial(0xff0000), {
      parent: root,
    });

    expect(mesh).toBeInstanceOf(THREE.Mesh);
    expect(mesh.name).toBe('Mesh_Body');
    expect(mesh.parent).toBe(root);
  });

  test('createPart applies position/rotation/scale options', () => {
    const mesh = createPart('Cube', boxGeo(1, 1, 1), gameMaterial(0x00ff00), {
      position: [1, 2, 3],
      rotation: [90, 0, 45],
      scale: [2, 1, 1],
    });

    expect(mesh.position.x).toBe(1);
    expect(mesh.position.y).toBe(2);
    expect(mesh.position.z).toBe(3);
    // Rotation is converted from degrees to radians.
    expect(mesh.rotation.x).toBeCloseTo(Math.PI / 2);
    expect(mesh.rotation.z).toBeCloseTo(Math.PI / 4);
    expect(mesh.scale.x).toBe(2);
  });

  test('createPart with pivot=true returns the wrapping pivot', () => {
    const root = createRoot('R');
    const wrapped = createPart('Door', boxGeo(1, 2, 0.1), gameMaterial(0x654321), {
      pivot: true,
      position: [0.5, 0, 0],
      parent: root,
    });

    expect(wrapped.name).toBe('Joint_Door');
    expect(wrapped.parent).toBe(root);
    // The pivot should hold the offset; the inner mesh should be at origin.
    expect(wrapped.position.x).toBe(0.5);
    const child = wrapped.children[0] as THREE.Mesh;
    expect(child).toBeInstanceOf(THREE.Mesh);
    expect(child.position.x).toBe(0);
    expect(child.name).toBe('Mesh_Door');
  });
});

// =============================================================================
// Geometry primitives
// =============================================================================

describe('geometry primitives produce real Three.js geometries', () => {
  test('boxGeo', () => {
    const g = boxGeo(1, 2, 3);
    expect(g).toBeInstanceOf(THREE.BoxGeometry);
    expect(g.getAttribute('position').count).toBeGreaterThan(0);
  });

  test('sphereGeo with default and custom segments', () => {
    const def = sphereGeo(1);
    expect(def).toBeInstanceOf(THREE.SphereGeometry);
    const custom = sphereGeo(1, 16, 12);
    expect(custom.parameters.widthSegments).toBe(16);
    expect(custom.parameters.heightSegments).toBe(12);
  });

  test('cylinderGeo', () => {
    const g = cylinderGeo(0.5, 0.5, 2, 12);
    expect(g).toBeInstanceOf(THREE.CylinderGeometry);
    expect(g.parameters.radialSegments).toBe(12);
  });

  test('coneGeo with default segments', () => {
    const g = coneGeo(1, 2);
    expect(g).toBeInstanceOf(THREE.ConeGeometry);
    expect(g.parameters.radialSegments).toBe(8);
  });

  test('capsuleGeo with default segments', () => {
    const g = capsuleGeo(0.5, 1);
    expect(g).toBeInstanceOf(THREE.CapsuleGeometry);
    expect(g.getAttribute('position').count).toBeGreaterThan(0);
  });

  test('torusGeo with custom segments', () => {
    const g = torusGeo(1, 0.25, 16, 24);
    expect(g).toBeInstanceOf(THREE.TorusGeometry);
    expect(g.parameters.radialSegments).toBe(16);
    expect(g.parameters.tubularSegments).toBe(24);
  });

  test('planeGeo', () => {
    const g = planeGeo(2, 2);
    expect(g).toBeInstanceOf(THREE.PlaneGeometry);
  });
});

// =============================================================================
// Materials
// =============================================================================

describe('materials carry option settings', () => {
  test('gameMaterial defaults', () => {
    const m = gameMaterial(0xff0000);
    expect(m).toBeInstanceOf(THREE.MeshStandardMaterial);
    expect(m.metalness).toBe(0);
    expect(m.roughness).toBe(0.8);
    expect(m.flatShading).toBe(true);
  });

  test('gameMaterial overrides applied', () => {
    const m = gameMaterial('#00ff00', {
      metalness: 0.5,
      roughness: 0.2,
      emissive: 0x111111,
      emissiveIntensity: 2,
      flatShading: false,
    });
    expect(m.metalness).toBe(0.5);
    expect(m.roughness).toBe(0.2);
    expect(m.emissiveIntensity).toBe(2);
    expect(m.flatShading).toBe(false);
  });

  test('basicMaterial defaults and transparency override', () => {
    const def = basicMaterial(0xffffff);
    expect(def).toBeInstanceOf(THREE.MeshBasicMaterial);
    expect(def.transparent).toBe(false);
    expect(def.opacity).toBe(1);

    const trans = basicMaterial(0xffffff, { transparent: true, opacity: 0.5 });
    expect(trans.transparent).toBe(true);
    expect(trans.opacity).toBe(0.5);
  });

  test('glassMaterial is transparent and double-sided', () => {
    const m = glassMaterial(0x88ccff);
    expect(m).toBeInstanceOf(THREE.MeshStandardMaterial);
    expect(m.transparent).toBe(true);
    expect(m.opacity).toBe(0.35);
    expect(m.side).toBe(THREE.DoubleSide);
  });

  test('glassMaterial accepts custom options', () => {
    const m = glassMaterial(0x88ccff, { opacity: 0.2, roughness: 0.5, metalness: 0.3 });
    expect(m.opacity).toBe(0.2);
    expect(m.roughness).toBe(0.5);
    expect(m.metalness).toBe(0.3);
  });

  test('lambertMaterial defaults and overrides', () => {
    const def = lambertMaterial(0xffffff);
    expect(def).toBeInstanceOf(THREE.MeshLambertMaterial);
    expect(def.flatShading).toBe(true);

    const overridden = lambertMaterial(0xffffff, {
      flatShading: false,
      emissive: 0x222222,
    });
    expect(overridden.flatShading).toBe(false);
  });
});

// =============================================================================
// Animation track helpers
// =============================================================================

describe('keyframe track helpers', () => {
  test('rotationTrack produces a QuaternionKeyframeTrack with 4 values per frame', () => {
    const t = rotationTrack('Joint_X', [
      { time: 0, rotation: [0, 0, 0] },
      { time: 1, rotation: [90, 0, 0] },
    ]);
    expect(t).toBeInstanceOf(THREE.QuaternionKeyframeTrack);
    expect(t.name).toBe('Joint_X.quaternion');
    expect(t.times.length).toBe(2);
    // 2 keyframes × 4 quaternion components.
    expect(t.values.length).toBe(8);
  });

  test('positionTrack produces a VectorKeyframeTrack with 3 values per frame', () => {
    const t = positionTrack('Joint_Y', [
      { time: 0, position: [0, 0, 0] },
      { time: 0.5, position: [1, 2, 3] },
    ]);
    expect(t).toBeInstanceOf(THREE.VectorKeyframeTrack);
    expect(t.name).toBe('Joint_Y.position');
    expect(t.values.length).toBe(6);
  });

  test('scaleTrack produces a VectorKeyframeTrack with 3 values per frame', () => {
    const t = scaleTrack('Joint_Z', [
      { time: 0, scale: [1, 1, 1] },
      { time: 1, scale: [2, 2, 2] },
    ]);
    expect(t).toBeInstanceOf(THREE.VectorKeyframeTrack);
    expect(t.name).toBe('Joint_Z.scale');
    expect(t.values).toEqual(new Float32Array([1, 1, 1, 2, 2, 2]));
  });

  test('createClip wraps tracks in a named AnimationClip', () => {
    const track = rotationTrack('Joint_X', [{ time: 0, rotation: [0, 0, 0] }]);
    const clip = createClip('Wave', 1.5, [track]);
    expect(clip).toBeInstanceOf(THREE.AnimationClip);
    expect(clip.name).toBe('Wave');
    expect(clip.duration).toBe(1.5);
    expect(clip.tracks).toEqual([track]);
  });
});

// =============================================================================
// Animation patterns
// =============================================================================

describe('common animation patterns', () => {
  test('idleBreathing produces a 3-keyframe positionTrack on the body joint', () => {
    const clip = idleBreathing('Joint_Chest', 2, 0.05);
    expect(clip.name).toBe('Idle');
    expect(clip.duration).toBe(2);
    expect(clip.tracks.length).toBe(1);
    expect(clip.tracks[0]?.name).toBe('Joint_Chest.position');
    // 3 keyframes × 3 components = 9.
    expect(clip.tracks[0]?.values.length).toBe(9);
  });

  test('bobbingAnimation oscillates a root', () => {
    const clip = bobbingAnimation('Floater', 1, 0.2);
    expect(clip.name).toBe('Bob');
    expect(clip.duration).toBe(1);
    expect(clip.tracks[0]?.name).toBe('Floater.position');
  });

  test('spinAnimation defaults to Y axis', () => {
    const clip = spinAnimation('Joint_Wheel');
    expect(clip.name).toBe('Spin');
    expect(clip.tracks.length).toBe(1);
    expect(clip.tracks[0]?.name).toBe('Joint_Wheel.quaternion');
    // 5 keyframes × 4 quaternion components.
    expect(clip.tracks[0]?.values.length).toBe(20);
  });

  test('spinAnimation accepts an explicit axis', () => {
    const xClip = spinAnimation('Joint_Wheel', 1, 'x');
    const zClip = spinAnimation('Joint_Wheel', 1, 'z');
    // We don't introspect quaternion contents; we just confirm both
    // produce valid clips on the requested joint - meaning all three
    // axis branches are taken.
    expect(xClip.tracks[0]?.name).toBe('Joint_Wheel.quaternion');
    expect(zClip.tracks[0]?.name).toBe('Joint_Wheel.quaternion');
  });
});

// =============================================================================
// Analysis helpers
// =============================================================================

describe('countTriangles / countMaterials / getJointNames', () => {
  function buildScene(): THREE.Object3D {
    const root = createRoot('Demo');
    createPivot('Hip', [0, 0, 0], root);
    createPart('Head', sphereGeo(0.3, 8, 6), gameMaterial(0xff0000), {
      pivot: true,
      parent: root,
    });
    createPart('Body', boxGeo(0.5, 1, 0.3), gameMaterial(0x00ff00), {
      parent: root,
    });
    return root;
  }

  test('countTriangles counts both indexed and non-indexed geometry', () => {
    const root = buildScene();
    const tris = countTriangles(root);
    // Box = 12 tris, sphere(8,6) ≈ 80 tris (indexed, poles share verts).
    // The exact number depends on Three.js's primitive builder; we just
    // need to confirm both indexed (sphere) and non-indexed paths are
    // exercised and produce a reasonable total.
    expect(tris).toBeGreaterThan(50);
    expect(tris).toBeLessThan(200);
  });

  test('countTriangles handles a non-indexed geometry as well', () => {
    const root = createRoot('R');
    const geo = new THREE.BufferGeometry();
    // A single triangle (3 verts, 9 floats), no index.
    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), 3)
    );
    root.add(new THREE.Mesh(geo, gameMaterial(0x0)));
    expect(countTriangles(root)).toBe(1);
  });

  test('countMaterials returns the number of unique materials in the scene', () => {
    const root = buildScene();
    expect(countMaterials(root)).toBe(2);
  });

  test('countMaterials handles arrays of materials per mesh', () => {
    const root = createRoot('R');
    const mesh = new THREE.Mesh(
      boxGeo(1, 1, 1),
      [gameMaterial(0xff0000), gameMaterial(0x00ff00)]
    );
    root.add(mesh);
    expect(countMaterials(root)).toBe(2);
  });

  test('getJointNames returns every Joint_* in the tree', () => {
    const root = buildScene();
    const joints = getJointNames(root);
    expect(joints).toContain('Joint_Hip');
    expect(joints).toContain('Joint_Head');
    expect(joints.length).toBe(2);
  });
});

// =============================================================================
// validateAsset advisory
// =============================================================================

describe('validateAsset advisories', () => {
  test('returns valid=true with no warnings for a tiny prop', () => {
    const root = createRoot('Tiny');
    createPart('Body', boxGeo(1, 1, 1), gameMaterial(0xff0000), {
      parent: root,
    });
    const r = validateAsset(root, 'prop');
    expect(r.valid).toBe(true);
    expect(r.warnings).toEqual([]);
    expect(r.errors).toEqual([]);
  });

  test('warns when triangle budget is exceeded for the category', () => {
    const root = createRoot('Heavy');
    // A sphere(2, 64, 64) is ~8192 tris, blows the prop budget (3000).
    createPart('Big', sphereGeo(2, 64, 64), gameMaterial(0x00ff00), {
      parent: root,
    });
    const r = validateAsset(root, 'prop');
    expect(r.valid).toBe(true);
    expect(r.warnings.some((w) => w.startsWith('High triangle count'))).toBe(true);
  });

  test('warns when material budget is exceeded', () => {
    const root = createRoot('ManyMats');
    // 20 distinct materials; vfx category limit = 4.
    for (let i = 0; i < 20; i++) {
      createPart(`P${i}`, boxGeo(1, 1, 1), gameMaterial(i), { parent: root });
    }
    const r = validateAsset(root, 'vfx');
    expect(r.warnings.some((w) => w.startsWith('High material count'))).toBe(true);
  });

  test('character / environment categories use their own budgets', () => {
    // Drive both branches of the guidelines lookup.
    const root = createRoot('R');
    expect(validateAsset(root, 'character').valid).toBe(true);
    expect(validateAsset(root, 'environment').valid).toBe(true);
  });
});

// =============================================================================
// Sandbox globals export
// =============================================================================

describe('buildSandboxGlobals', () => {
  test('exposes every primitive the LLM is told it can use', () => {
    const globals = buildSandboxGlobals();
    const expected = [
      'createRoot', 'createPivot', 'createPart',
      'capsuleGeo', 'cylinderGeo', 'boxGeo', 'sphereGeo', 'coneGeo',
      'torusGeo', 'planeGeo',
      'gameMaterial', 'basicMaterial', 'glassMaterial', 'lambertMaterial',
      'rotationTrack', 'positionTrack', 'scaleTrack', 'createClip',
      'spinAnimation', 'bobbingAnimation', 'idleBreathing',
      'countTriangles', 'countMaterials', 'getJointNames', 'validateAsset',
      'Math', 'console',
    ];
    for (const name of expected) {
      expect(globals[name]).toBeDefined();
    }
  });

  test('when given a usage map, tallies primitive invocations', () => {
    const usage: Record<string, number> = {};
    const globals = buildSandboxGlobals(usage) as Record<
      string,
      (...a: unknown[]) => unknown
    >;

    // Call a spread of primitives with varying counts.
    globals.createRoot!('R');
    globals.createRoot!('R2');
    globals.createRoot!('R3');
    globals.boxGeo!(1, 1, 1);
    globals.boxGeo!(2, 2, 2);
    globals.sphereGeo!(0.5);
    globals.gameMaterial!(0xff0000);

    expect(usage.createRoot).toBe(3);
    expect(usage.boxGeo).toBe(2);
    expect(usage.sphereGeo).toBe(1);
    expect(usage.gameMaterial).toBe(1);
    // Unused primitive has no entry.
    expect(usage.torusGeo).toBeUndefined();
  });

  test('usage map is isolated per call', () => {
    const usageA: Record<string, number> = {};
    const usageB: Record<string, number> = {};
    const gA = buildSandboxGlobals(usageA) as Record<string, (...a: unknown[]) => unknown>;
    const gB = buildSandboxGlobals(usageB) as Record<string, (...a: unknown[]) => unknown>;

    gA.createRoot!('A');
    gB.createRoot!('B');
    gB.createRoot!('B2');

    expect(usageA.createRoot).toBe(1);
    expect(usageB.createRoot).toBe(2);
  });

  test('without a usage map, primitives are unwrapped (zero-overhead path)', () => {
    const globals = buildSandboxGlobals() as Record<string, unknown>;
    // Identity check: the exposed function is the original primitive, not a
    // wrapper. Looking up by name against a second fresh globals keeps the
    // test independent of module structure.
    const raw = buildSandboxGlobals() as Record<string, unknown>;
    expect(globals.boxGeo).toBe(raw.boxGeo);
  });
});

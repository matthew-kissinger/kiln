import { describe, expect, test } from 'bun:test';
import * as THREE from 'three';

import { createAssetIntentV1 } from '../contracts';
import { inspectSceneMaterials } from './material';

const intent = createAssetIntentV1({ category: 'prop' });

describe('material portable-PBR conformance fixtures', () => {
  test('accepts a finite untextured standard material control', () => {
    const scene = new THREE.Group();
    scene.add(
      new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0.1 }),
      ),
    );

    expect(inspectSceneMaterials({ intent, scene })).toEqual([]);
  });

  test('blocks a non-finite portable-PBR factor with the exact finding code', () => {
    const scene = new THREE.Group();
    const material = new THREE.MeshStandardMaterial();
    material.roughness = Number.NaN;
    scene.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material));

    const findings = inspectSceneMaterials({ intent, scene });
    expect(findings.map((finding) => finding.code)).toEqual(['MAT_NONFINITE_FACTOR']);
    expect(findings[0]?.disposition).toBe('block');
  });
});

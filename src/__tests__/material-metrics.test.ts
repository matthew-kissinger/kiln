import { describe, expect, test } from 'bun:test';
import { Document, WebIO } from '@gltf-transform/core';
import { KHRMaterialsUnlit } from '@gltf-transform/extensions';
import * as THREE from 'three';

import { applyMaterialRecipeV1 } from '../material-recipe-runtime';
import {
  collectMaterialMetricsV1,
  evaluateMaterialBudgetV1,
  materialBudgetProfileForQaProfile,
  type MaterialMetricsV1,
} from '../material-metrics';
import { createMaterialRecipeRequestV1 } from '../material-recipes';
import { ApprovedTextureResourceCache } from '../material-resources';
import { renderSceneToGLB } from '../render';

async function materialGalleryMetrics(): Promise<MaterialMetricsV1> {
  const cache = new ApprovedTextureResourceCache();
  const root = new THREE.Group();
  const bark = await applyMaterialRecipeV1(
    createMaterialRecipeRequestV1('kiln.material.bark.v1', {
      textureResources: { baseColor: 'kiln.texture.bark-albedo.v1' },
    }),
    { cache },
  );
  const leaf = await applyMaterialRecipeV1(
    createMaterialRecipeRequestV1('kiln.material.leaf.v1', {
      textureResources: { baseColor: 'kiln.texture.leaf-mask-albedo.v1' },
    }),
    { cache },
  );
  const glass = await applyMaterialRecipeV1(
    createMaterialRecipeRequestV1('kiln.material.glass.v1'),
    { cache },
  );
  for (const [index, applied] of [bark, leaf, glass].entries()) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(index + 1, 1, 1), applied.material);
    mesh.position.x = index * 3;
    root.add(mesh);
  }
  const rendered = await renderSceneToGLB(root, { sceneName: 'MaterialMetricsGallery' });
  expect(rendered.gltfValidation.issues.numErrors).toBe(0);
  return collectMaterialMetricsV1(await new WebIO().readBinary(rendered.bytes));
}

describe('MAT-010 material metrics', () => {
  test('attaches separate material metrics to the five-dimension QA report', async () => {
    const applied = await applyMaterialRecipeV1(
      createMaterialRecipeRequestV1('kiln.material.leaf.v1'),
    );
    const root = new THREE.Group();
    root.add(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), applied.material));
    const rendered = await renderSceneToGLB(root, { sceneName: 'LeafMetricsReport' });
    expect(rendered.materialMetrics).toMatchObject({
      maskedMaterials: 1,
      blendedMaterials: 0,
      doubleSidedMaterials: 1,
    });
    expect(rendered.qaReport.dimensions.runtimeCost.metrics).toMatchObject({
      maskedMaterials: 1,
      blendedMaterials: 0,
      doubleSidedMaterials: 1,
      imageCount: 0,
    });
  });

  test('separates alpha mode, sidedness, textures, images, resolution, and decoded memory', async () => {
    const metrics = await materialGalleryMetrics();
    expect(metrics).toMatchObject({
      schemaVersion: 1,
      materialCount: 3,
      opaqueMaterials: 1,
      maskedMaterials: 1,
      blendedMaterials: 1,
      singleSidedMaterials: 1,
      doubleSidedMaterials: 2,
      texturedMaterials: 2,
      untexturedMaterials: 1,
      extensionCount: 0,
      extensionsUsed: [],
      materialExtensionCount: 0,
      materialExtensionsUsed: [],
      imageCount: 2,
      maxImageDimension: 4,
      totalImagePixels: 32,
      decodedImageBytesRgba8: 128,
    });
    expect(metrics.images).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ width: 4, height: 4, decodedBytesRgba8: 64 }),
      ]),
    );
    expect(metrics.totalSurfaceArea).toBeGreaterThan(0);
    expect(metrics.blendedSurfaceArea).toBeGreaterThan(0);
    expect(metrics.blendedSurfaceAreaRatio).toBeGreaterThan(0);
    // A masked leaf is counted only as MASK, never as blended transparency.
    expect(metrics.maskedMaterials + metrics.blendedMaterials + metrics.opaqueMaterials).toBe(
      metrics.materialCount,
    );
  });

  test('reports ratified extension use independently from core material counts', () => {
    const document = new Document();
    const material = document.createMaterial('UnlitMarker');
    const extension = document.createExtension(KHRMaterialsUnlit);
    material.setExtension('KHR_materials_unlit', extension.createUnlit());
    const metrics = collectMaterialMetricsV1(document);
    expect(metrics.extensionCount).toBe(1);
    expect(metrics.extensionsUsed).toEqual(['KHR_materials_unlit']);
    expect(metrics.materialExtensionCount).toBe(1);
    expect(metrics.materialExtensionsUsed).toEqual(['KHR_materials_unlit']);
    expect(metrics.materialCount).toBe(1);
  });
});

describe('MAT-018 advisory texture budgets', () => {
  test('selects a tier/profile and reports measured cost with downscale advice', async () => {
    const base = await materialGalleryMetrics();
    const over: MaterialMetricsV1 = {
      ...base,
      imageCount: 9,
      maxImageDimension: 8192,
      decodedImageBytesRgba8: 256 * 1024 * 1024,
      blendedSurfaceArea: 80,
      totalSurfaceArea: 100,
      blendedSurfaceAreaRatio: 0.8,
      images: [
        {
          name: 'hero-albedo',
          width: 8192,
          height: 8192,
          maxDimension: 8192,
          decodedBytesRgba8: 256 * 1024 * 1024,
          estimatedGpuBytesWithMipmaps: 342 * 1024 * 1024,
        },
      ],
    };
    expect(materialBudgetProfileForQaProfile('vehicle.mobile')).toBe('mobile.portable.v1');
    expect(materialBudgetProfileForQaProfile('architecture.default')).toBe('web.portable.v1');
    const warnings = evaluateMaterialBudgetV1(over, {
      profile: 'web.portable.v1',
      tier: 'standard',
    });
    expect(warnings.map((warning) => warning.code)).toEqual([
      'MATERIAL_TEXTURE_RESOLUTION_BUDGET',
      'MATERIAL_IMAGE_COUNT_BUDGET',
      'MATERIAL_DECODED_MEMORY_BUDGET',
      'MATERIAL_BLEND_AREA_BUDGET',
    ]);
    expect(warnings.every((warning) => warning.disposition === 'warn')).toBe(true);
    expect(
      warnings.every((warning) => warning.measurement.actual > warning.measurement.threshold),
    ).toBe(true);
    expect(warnings.map((warning) => warning.advice).join(' ')).toMatch(/Downscale.*atlas.*MASK/is);
    expect(warnings.map((warning) => warning.message).join(' ')).toMatch(
      /8192px.*9 images.*256\.00 MiB.*80\.0%/s,
    );
  });

  test('stays advisory and quiet within the selected budget', async () => {
    const measured = await materialGalleryMetrics();
    const metrics = {
      ...measured,
      blendedSurfaceArea: measured.totalSurfaceArea * 0.3,
      blendedSurfaceAreaRatio: 0.3,
    };
    expect(
      evaluateMaterialBudgetV1(metrics, {
        profile: 'web.portable.v1',
        tier: 'hero',
      }),
    ).toEqual([]);
  });
});

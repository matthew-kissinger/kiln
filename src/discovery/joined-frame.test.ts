import { expect, test } from 'bun:test';
import { executeKilnCode, renderSceneToGLB } from '../render';
import { loadGlbReviewScene } from '../views/glb';
import { measureSurfaceDistance } from '../views/surface-distance';
import { createDiscovery, listDiscoveryEntries } from './index';

test('joined-frame recipe is discoverable and keeps both brace endpoints attached after dimensional edits', async () => {
  const id = 'recipe:joined-frame-v1';
  const discover = createDiscovery(async () => ({}));
  const result = await discover({
    query: 'braces floating between frame supports',
    kind: 'recipe',
  });
  expect(result.entries.slice(0, 6).map((e) => e.id)).toContain(id);
  const entry = listDiscoveryEntries().find((e) => e.id === id);
  if (entry?.kind !== 'recipe') throw new Error('Missing joined-frame recipe');
  for (const exporter of ['legacy', 'three'] as const) {
    for (const [span, height] of [
      [1.2, 0.8],
      [1.8, 0.8],
      [1.8, 1.1],
    ]) {
      const source = entry.recipe.example
        .replace('const span = 1.2;', `const span = ${span};`)
        .replace('const height = 0.8;', `const height = ${height};`);
      const { root } = await executeKilnCode(source);
      root.position.set(3, -2, 1);
      root.rotation.set(0.2, 0.7, -0.1);
      const glb = await renderSceneToGLB(root, { optimize: 'off', gltfExporter: exporter });
      expect(glb.gltfValidation.issues.numErrors).toBe(0);
      const { root: exported } = await loadGlbReviewScene(glb.bytes);
      for (const side of ['Near', 'Far']) {
        const gap = (a: string, b: string) => {
          const result = measureSurfaceDistance(exported, {
            from: { subject: { name: `Mesh_${a}` } },
            to: { subject: { name: `Mesh_${b}` } },
          });
          expect(result.status).toBe('complete');
          return result.distance!;
        };
        expect(gap(`${side}Brace`, `${side}PostA`)).toBeLessThan(1e-6);
        expect(gap(`${side}Brace`, `${side}PostB`)).toBeLessThan(1e-6);
        expect(gap(`${side}Rail`, 'Deck')).toBeLessThan(1e-6);
        // Contact at both ends is compatible with intentional separation elsewhere.
        expect(gap(`${side}Brace`, 'Deck')).toBeGreaterThan(height! * 0.2);
      }
    }
  }
});

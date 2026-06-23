/**
 * Wave 1C smoke test: verify the new WASM/module deps load cleanly in Node.
 * If any of these fail to import, the downstream CSG/UV/subdivide primitives
 * (Waves 2A / 2B / 3A) won't work.
 */

import { describe, it, expect } from 'bun:test';

describe('Wave 1C: new dependency smoke tests', () => {
  it('manifold-3d loads and initializes', async () => {
    const module = (await import('manifold-3d')) as unknown as {
      default: () => Promise<Record<string, unknown>>;
    };
    const init = module.default;
    expect(typeof init).toBe('function');

    const Manifold = (await init()) as Record<string, unknown>;
    expect(Manifold).toBeDefined();
    expect(typeof Manifold['Manifold']).toBe('function');
  });

  it('three-subdivide loads', async () => {
    const mod = (await import('three-subdivide')) as Record<string, unknown>;
    expect(mod).toBeDefined();
    expect(typeof mod['LoopSubdivision']).toBe('function');
  });

  it('xatlas-three loads', async () => {
    const mod = (await import('xatlas-three')) as Record<string, unknown>;
    expect(mod).toBeDefined();
  });
});

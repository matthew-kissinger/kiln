/**
 * T2.2 — the bounded procedural op set.
 *
 * The properties worth defending here are determinism (the same spec must
 * always produce the same bytes, or the pinned-SHA fixtures become a lottery),
 * tileability (the reason a procedural material looks right on a wall and not
 * just on a test cube), and the bounds (an untrusted model authors these specs).
 */

import { describe, expect, test } from 'bun:test';
import * as THREE from 'three';
import {
  MAX_NOISE_OCTAVES,
  MAX_PROCEDURAL_LAYERS,
  normalMapFromHeight,
  proceduralTexture,
  ProceduralTextureError,
} from '../procedural-texture';
import { executeKilnCode } from '../render';

const pixels = (tex: THREE.DataTexture): Uint8Array => tex.image.data as Uint8Array;

/** Sample one texel as [r,g,b]. */
function texelAt(tex: THREE.DataTexture, x: number, y: number): [number, number, number] {
  const size = tex.image.width;
  const o = (y * size + x) * 4;
  const d = pixels(tex);
  return [d[o]!, d[o + 1]!, d[o + 2]!];
}

// -----------------------------------------------------------------------------
// Determinism
// -----------------------------------------------------------------------------

describe('determinism', () => {
  test('the same spec produces byte-identical pixels, including noise', () => {
    const spec = {
      size: 64,
      usage: 'albedo' as const,
      layers: [
        { op: 'solid' as const, color: 0x5a4632 },
        {
          op: 'noise' as const,
          colorA: 0x3d2f21,
          colorB: 0x7a6248,
          scale: 6,
          octaves: 4,
          seed: 7,
          blend: 'overlay' as const,
        },
      ],
    };

    expect(
      Buffer.compare(
        Buffer.from(pixels(proceduralTexture(spec))),
        Buffer.from(pixels(proceduralTexture(spec))),
      ),
    ).toBe(0);
  });

  test('a different seed produces different pixels (the check above can fail)', () => {
    const layers = (seed: number) => [
      { op: 'noise' as const, colorA: 0x000000, colorB: 0xffffff, scale: 8, octaves: 3, seed },
    ];
    const a = proceduralTexture({ size: 32, layers: layers(1) });
    const b = proceduralTexture({ size: 32, layers: layers(2) });
    expect(Buffer.compare(Buffer.from(pixels(a)), Buffer.from(pixels(b)))).not.toBe(0);
  });
});

// -----------------------------------------------------------------------------
// Tileability — the property that separates this from a toy
// -----------------------------------------------------------------------------

describe('tileability', () => {
  test('noise wraps: the last column continues into the first', () => {
    const tex = proceduralTexture({
      size: 64,
      layers: [{ op: 'noise', colorA: 0x000000, colorB: 0xffffff, scale: 4, octaves: 3, seed: 3 }],
    });

    // The step across the seam (column 63 -> 0) should look like any other
    // neighbouring pair, not like an arbitrary jump. Measured on this spec:
    // interior steps reach 28/255 while the seam step peaks at 2/255, so the
    // seam is not merely "within range" — it is an order of magnitude smaller
    // than the noise's own local variation. A quarter of the interior max
    // leaves room for the seed to change without making this brittle, while
    // still failing loudly if the lattice ever stops wrapping.
    let interiorMax = 0;
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 63; x++) {
        interiorMax = Math.max(
          interiorMax,
          Math.abs(texelAt(tex, x, y)[0] - texelAt(tex, x + 1, y)[0]),
        );
      }
    }
    let seamMax = 0;
    for (let y = 0; y < 64; y++) {
      seamMax = Math.max(seamMax, Math.abs(texelAt(tex, 63, y)[0] - texelAt(tex, 0, y)[0]));
    }

    expect(interiorMax).toBeGreaterThan(8); // the noise actually varies
    expect(seamMax).toBeLessThanOrEqual(interiorMax / 4);
  });

  test('a repeating pattern lands on exact texel boundaries', () => {
    // 8 squares across 64 texels = 8 texels each; texel-center sampling is what
    // keeps the boundary from drifting half a texel.
    const tex = proceduralTexture({
      size: 64,
      layers: [{ op: 'checker', colorA: 0x000000, colorB: 0xffffff, squares: 8 }],
    });
    expect(texelAt(tex, 7, 0)[0]).toBe(0);
    expect(texelAt(tex, 8, 0)[0]).toBe(255);
    expect(texelAt(tex, 15, 0)[0]).toBe(255);
    expect(texelAt(tex, 16, 0)[0]).toBe(0);
  });
});

// -----------------------------------------------------------------------------
// The ops themselves
// -----------------------------------------------------------------------------

describe('layer ops', () => {
  test('solid fills with exactly the requested color', () => {
    const tex = proceduralTexture({ size: 8, layers: [{ op: 'solid', color: 0x336699 }] });
    expect(texelAt(tex, 0, 0)).toEqual([0x33, 0x66, 0x99]);
    expect(texelAt(tex, 7, 7)).toEqual([0x33, 0x66, 0x99]);
  });

  test('gradient runs from one color to the other', () => {
    const tex = proceduralTexture({
      size: 64,
      layers: [{ op: 'gradient', from: 0x000000, to: 0xffffff }],
    });
    const left = texelAt(tex, 0, 32)[0];
    const right = texelAt(tex, 63, 32)[0];
    expect(left).toBeLessThan(20);
    expect(right).toBeGreaterThan(235);
  });

  test('bricks stagger alternate rows', () => {
    const tex = proceduralTexture({
      size: 64,
      layers: [{ op: 'bricks', brick: 0xffffff, mortar: 0x000000, rows: 4, cols: 2 }],
    });
    // Two rows offset by half a brick cannot be identical scanlines.
    const rowA = Array.from({ length: 64 }, (_, x) => texelAt(tex, x, 4)[0]).join(',');
    const rowB = Array.from({ length: 64 }, (_, x) => texelAt(tex, x, 20)[0]).join(',');
    expect(rowA).not.toBe(rowB);
  });

  test('stripes at 90 degrees run the other way', () => {
    const flat = proceduralTexture({
      size: 32,
      layers: [{ op: 'stripes', colorA: 0x000000, colorB: 0xffffff, count: 4 }],
    });
    const turned = proceduralTexture({
      size: 32,
      layers: [{ op: 'stripes', colorA: 0x000000, colorB: 0xffffff, count: 4, angleDeg: 90 }],
    });
    // Horizontal stripes vary along x and not y; vertical ones do the reverse.
    expect(texelAt(flat, 0, 0)[0]).toBe(texelAt(flat, 0, 31)[0]);
    expect(texelAt(turned, 0, 0)[0]).toBe(texelAt(turned, 31, 0)[0]);
    expect(Buffer.compare(Buffer.from(pixels(flat)), Buffer.from(pixels(turned)))).not.toBe(0);
  });
});

// -----------------------------------------------------------------------------
// Blending
// -----------------------------------------------------------------------------

describe('blend modes', () => {
  const base = { op: 'solid' as const, color: 0x808080 };

  test('multiply darkens, screen lightens', () => {
    const mul = proceduralTexture({
      size: 4,
      layers: [base, { op: 'solid', color: 0x808080, blend: 'multiply' }],
    });
    const scr = proceduralTexture({
      size: 4,
      layers: [base, { op: 'solid', color: 0x808080, blend: 'screen' }],
    });
    expect(texelAt(mul, 0, 0)[0]).toBeLessThan(0x80);
    expect(texelAt(scr, 0, 0)[0]).toBeGreaterThan(0x80);
  });

  test('opacity 0 leaves the layer below untouched', () => {
    const tex = proceduralTexture({
      size: 4,
      layers: [base, { op: 'solid', color: 0xff0000, opacity: 0 }],
    });
    expect(texelAt(tex, 0, 0)).toEqual([0x80, 0x80, 0x80]);
  });

  test('the first layer ignores blend and opacity — there is nothing beneath it', () => {
    const withBlend = proceduralTexture({
      size: 4,
      layers: [{ op: 'solid', color: 0x336699, blend: 'multiply', opacity: 0.1 }],
    });
    expect(texelAt(withBlend, 0, 0)).toEqual([0x33, 0x66, 0x99]);
  });
});

// -----------------------------------------------------------------------------
// Color space is set here, unlike in the bake pass
// -----------------------------------------------------------------------------

describe('color space', () => {
  test('albedo and emissive are sRGB; data maps are linear', () => {
    const layers = [{ op: 'solid' as const, color: 0x808080 }];
    expect(proceduralTexture({ size: 4, usage: 'albedo', layers }).colorSpace).toBe(
      THREE.SRGBColorSpace,
    );
    expect(proceduralTexture({ size: 4, usage: 'emissive', layers }).colorSpace).toBe(
      THREE.SRGBColorSpace,
    );
    expect(proceduralTexture({ size: 4, usage: 'roughness', layers }).colorSpace).toBe(
      THREE.NoColorSpace,
    );
    expect(proceduralTexture({ size: 4, layers }).colorSpace).toBe(THREE.SRGBColorSpace);
  });

  test('the recipe is recorded on the texture for provenance', () => {
    const tex = proceduralTexture({
      size: 8,
      usage: 'roughness',
      layers: [{ op: 'solid', color: 0x404040 }],
    });
    expect((tex.userData as Record<string, unknown>)['kilnProcedural']).toEqual({
      schemaVersion: 2,
      size: 8,
      usage: 'roughness',
      layers: [{ op: 'solid', color: 0x404040, blend: 'normal', opacity: 1 }],
      canonicalJson:
        '{"layers":[{"blend":"normal","color":4210752,"op":"solid","opacity":1}],"schemaVersion":2,"size":8,"usage":"roughness"}',
      recipeHash: 'sha256:0ba0122424c854c14ff660e67a38fee4079a1d8da8cc2359b922d73453bfbce4',
    });
  });
});

// -----------------------------------------------------------------------------
// Bounds — the spec author is untrusted
// -----------------------------------------------------------------------------

describe('bounds and validation', () => {
  const layers = [{ op: 'solid' as const, color: 0 }];

  test('size must be a power of two within range', () => {
    expect(() => proceduralTexture({ size: 100, layers })).toThrow(ProceduralTextureError);
    expect(() => proceduralTexture({ size: 2048, layers })).toThrow(/power of two/);
    expect(() => proceduralTexture({ size: 2, layers })).toThrow(/power of two/);
  });

  test('the layer stack is bounded and must not be empty', () => {
    expect(() => proceduralTexture({ layers: [] })).toThrow(/non-empty/);
    const tooMany = Array.from({ length: MAX_PROCEDURAL_LAYERS + 1 }, () => layers[0]!);
    expect(() => proceduralTexture({ size: 4, layers: tooMany })).toThrow(
      new RegExp(`maximum of ${MAX_PROCEDURAL_LAYERS}`),
    );
  });

  test('an unknown op is rejected by name, listing what does exist', () => {
    expect(() => proceduralTexture({ size: 4, layers: [{ op: 'perlin' } as never] })).toThrow(
      /"perlin" is not one of solid, checker, stripes, gradient, bricks, noise/,
    );
  });

  test('octaves are capped so a spec cannot buy unbounded work', () => {
    expect(() =>
      proceduralTexture({
        size: 4,
        layers: [{ op: 'noise', colorA: 0, colorB: 0xffffff, octaves: MAX_NOISE_OCTAVES + 1 }],
      }),
    ).toThrow(/octaves/);
  });

  test('colors outside 24-bit range are rejected', () => {
    expect(() =>
      proceduralTexture({ size: 4, layers: [{ op: 'solid', color: 0x1000000 }] }),
    ).toThrow(/color integer/);
    expect(() => proceduralTexture({ size: 4, layers: [{ op: 'solid', color: -1 }] })).toThrow(
      /color integer/,
    );
  });

  test('an unknown blend mode is rejected', () => {
    expect(() =>
      proceduralTexture({
        size: 4,
        layers: [layers[0]!, { op: 'solid', color: 0, blend: 'divide' as never }],
      }),
    ).toThrow(/blend/);
  });
});

// -----------------------------------------------------------------------------
// normalMapFromHeight
// -----------------------------------------------------------------------------

describe('normalMapFromHeight', () => {
  test('a flat source yields a flat normal map pointing straight out', () => {
    const flat = proceduralTexture({ size: 16, layers: [{ op: 'solid', color: 0x808080 }] });
    const n = normalMapFromHeight(flat);
    // Flat means (0,0,1), encoded as (128,128,255).
    expect(texelAt(n, 8, 8)[0]).toBe(128);
    expect(texelAt(n, 8, 8)[1]).toBe(128);
    expect(texelAt(n, 8, 8)[2]).toBeGreaterThan(250);
  });

  test('a gradient tilts the normal along the slope', () => {
    const ramp = proceduralTexture({
      size: 32,
      layers: [{ op: 'gradient', from: 0x000000, to: 0xffffff }],
    });
    const n = normalMapFromHeight(ramp, { strength: 4 });
    // Height rises along +x, so the normal leans back along -x: red < 128.
    expect(texelAt(n, 16, 16)[0]).toBeLessThan(128);
    expect(texelAt(n, 16, 16)[1]).toBe(128);
  });

  test('output is linear data, never sRGB', () => {
    const src = proceduralTexture({
      size: 8,
      usage: 'albedo',
      layers: [{ op: 'solid', color: 0x808080 }],
    });
    expect(src.colorSpace).toBe(THREE.SRGBColorSpace);
    expect(normalMapFromHeight(src).colorSpace).toBe(THREE.NoColorSpace);
  });

  test('it names the derived map after its source', () => {
    const src = proceduralTexture({ size: 8, name: 'Bark', layers: [{ op: 'solid', color: 0 }] });
    expect(normalMapFromHeight(src).name).toBe('Bark_Normal');
  });

  test('a source with no readable pixels is rejected with the reason', () => {
    expect(() => normalMapFromHeight(new THREE.Texture())).toThrow(/no readable pixels/);
  });

  test('strength must be positive', () => {
    const src = proceduralTexture({ size: 8, layers: [{ op: 'solid', color: 0 }] });
    expect(() => normalMapFromHeight(src, { strength: 0 })).toThrow(/positive/);
  });
});

// -----------------------------------------------------------------------------
// End to end through the sandbox
// -----------------------------------------------------------------------------

describe('the agent path', () => {
  test('generated code can build a fully procedural PBR material', async () => {
    const code = `
const meta = { name: 'ProcCrate' };
function build() {
  const root = createRoot('ProcCrate');
  const albedo = proceduralTexture({
    size: 64,
    usage: 'albedo',
    name: 'CrateWood',
    layers: [
      { op: 'solid', color: 0x8a6a43 },
      { op: 'noise', colorA: 0x6b4f30, colorB: 0xa88358, scale: 5, octaves: 3, seed: 2, blend: 'overlay' },
      { op: 'stripes', colorA: 0x000000, colorB: 0xffffff, count: 8, angleDeg: 90, blend: 'multiply', opacity: 0.2 },
    ],
  });
  const mat = pbrMaterial({ albedo, normal: normalMapFromHeight(albedo, { strength: 3 }) });
  createPart('Body', boxGeo(1, 1, 1), mat, { parent: root });
  return root;
}
`;
    const executed = await executeKilnCode(code);
    expect(executed.root.name).toBe('ProcCrate');

    const mesh = executed.root.children[0] as THREE.Mesh;
    const mat = mesh.material as THREE.MeshStandardMaterial;
    expect(mat.map?.name).toBe('CrateWood');
    expect(mat.normalMap).toBeTruthy();
    expect(mat.map?.colorSpace).toBe(THREE.SRGBColorSpace);
    expect(mat.normalMap?.colorSpace).toBe(THREE.NoColorSpace);
  });
});

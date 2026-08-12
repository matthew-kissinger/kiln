import { describe, expect, test } from 'bun:test';
import type * as THREE from 'three';

import { listPrimitives } from '../list-primitives';
import {
  APPROVED_TEXTURE_RESOURCES_V1,
  type ApprovedTextureResourceDescriptorV1,
  type ApprovedTextureResourceId,
} from '../material-recipes';
import { ApprovedTextureResourceCache } from '../material-resources';
import { createTextureResolver } from '../texture-resolver';
import { buildSandboxGlobals } from '../primitives';
import { executeKilnCode } from '../render';

const SUBJECT: ApprovedTextureResourceId = 'kiln.texture.bark-albedo.v1';
const runtimeRegistry: Readonly<
  Record<ApprovedTextureResourceId, ApprovedTextureResourceDescriptorV1>
> = Object.freeze({
  ...APPROVED_TEXTURE_RESOURCES_V1,
  [SUBJECT]: Object.freeze({
    ...APPROVED_TEXTURE_RESOURCES_V1[SUBJECT],
    delivery: 'runtime',
  } satisfies ApprovedTextureResourceDescriptorV1),
});

function goodBytes(): Uint8Array {
  return new ApprovedTextureResourceCache().resolve(SUBJECT).bytes;
}

function firstTextureMetadata(root: THREE.Object3D): Record<string, unknown> | undefined {
  const child = root.children[0];
  if (!(child as { isMesh?: boolean } | undefined)?.isMesh) {
    throw new TypeError('expected first generated child to be a mesh');
  }
  const material = (child as THREE.Mesh).material;
  if (Array.isArray(material)) throw new TypeError('expected one generated material');
  return (material as THREE.MeshStandardMaterial).map?.userData as
    | Record<string, unknown>
    | undefined;
}

describe('H6 generated texture boundary', () => {
  test('raw loadTexture is absent while the one-argument approved-ID loader is present', () => {
    const globals = buildSandboxGlobals();
    expect(globals['loadTexture']).toBeUndefined();
    expect(typeof globals['loadApprovedTexture']).toBe('function');
    expect(listPrimitives().some(({ name }) => name === 'loadTexture')).toBe(false);
    expect(listPrimitives().some(({ name }) => name === 'loadApprovedTexture')).toBe(true);
  });

  test.each([
    './relative.png',
    '/absolute/texture.png',
    'C:\\absolute\\texture.png',
    '../traversal.png',
    'https://textures.example/asset.png',
    'kiln.texture.not-approved.v1',
  ])('rejects non-approved generated source %s before any host resolver call', async (source) => {
    let calls = 0;
    const cache = new ApprovedTextureResourceCache({
      registry: runtimeRegistry,
      resolver: async () => {
        calls += 1;
        return { bytes: goodBytes(), mime: 'image/png' };
      },
    });
    const resolver = createTextureResolver(cache);
    await expect(resolver.loadApprovedTexture(source)).rejects.toThrow(
      /approved texture resource ID/i,
    );
    expect(calls).toBe(0);
  });

  test('generated code cannot pass bytes, hashes, resolver objects, or a second options argument', async () => {
    const globals = buildSandboxGlobals();
    const loader = globals['loadApprovedTexture'] as (...args: unknown[]) => Promise<unknown>;
    await expect(loader(new Uint8Array([137, 80, 78, 71]))).rejects.toThrow(
      /exactly one approved resource ID/,
    );
    await expect(loader({ resourceId: SUBJECT, sha256: 'forged' })).rejects.toThrow(
      /exactly one approved resource ID/,
    );
    await expect(loader(SUBJECT, { resolver: {}, path: './secret.png' })).rejects.toThrow(
      /exactly one approved resource ID/,
    );
    const recipe = globals['materialRecipe'] as (...args: unknown[]) => Promise<unknown>;
    await expect(
      recipe('kiln.material.wood.v1', {}, { resolver: {}, hash: 'forged' }),
    ).rejects.toThrow(/approved recipe ID and optional bounded overrides/);
  });

  test('approved embedded IDs work in generated code without exposing resolver internals', async () => {
    const executed = await executeKilnCode(`
      const meta = { name: 'approved-texture', category: 'prop' };
      async function build() {
        const root = createRoot('Root');
        const albedo = await loadApprovedTexture('${SUBJECT}');
        root.add(new THREE.Mesh(boxUnwrap(boxGeo(1, 1, 1)), pbrMaterial({ albedo })));
        return root;
      }
    `);
    expect(firstTextureMetadata(executed.root)?.['kilnTexture']).toMatchObject({
      usage: 'albedo',
      approvedResource: { resourceId: SUBJECT },
    });
  });

  test('bounded host bytes work only through an injected resolver bound to an approved ID', async () => {
    const cache = new ApprovedTextureResourceCache({
      registry: runtimeRegistry,
      resolver: async (descriptor, context) => {
        expect(descriptor.id).toBe(SUBJECT);
        expect(context.signal).toBeInstanceOf(AbortSignal);
        expect(context.deadlineMs).toBeGreaterThan(0);
        return { bytes: goodBytes(), mime: 'image/png' };
      },
    });
    const executed = await executeKilnCode(
      `
      const meta = { name: 'host-texture', category: 'prop' };
      async function build() {
        const root = createRoot('Root');
        const albedo = await loadApprovedTexture('${SUBJECT}');
        root.add(new THREE.Mesh(boxUnwrap(boxGeo(1, 1, 1)), pbrMaterial({ albedo })));
        return root;
      }
    `,
      { textureResolver: createTextureResolver(cache) },
    );
    expect(firstTextureMetadata(executed.root)?.['kilnTexture']).toMatchObject({
      approvedResource: { resourceId: SUBJECT, delivery: 'runtime' },
    });
  });

  test('historical raw generated programs fail instead of reading a relative path', async () => {
    await expect(
      executeKilnCode(`
      const meta = { name: 'legacy-path', category: 'prop' };
      async function build() {
        await loadTexture('./should-never-be-read.png');
        return createRoot('Root');
      }
    `),
    ).rejects.toThrow(/loadTexture is not defined/);
  });
});

import { expect, test } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Client, InMemoryTransport } from '@modelcontextprotocol/client';
import { createKilnMcpServer } from './mcp-server';
import { FileAssetLibrary } from './assets-node';
import { MemoryProgramStore, retainProgram } from './program-store';
import { createKilnProgramToolRegistry } from './tools/registry';
import { decodeWidgetAsset } from './widget-transfer';
import { readAssetResource } from './assets-resources';

test('MCP saves an editable revision, exposes exact downloadable bytes, and restores source in a new session', async () => {
  const root = await mkdtemp(join(tmpdir(), 'kiln-asset-tools-'));
  const assetLibrary = new FileAssetLibrary({
    project: root,
    library: join(root, 'personal'),
  });
  const programStore = new MemoryProgramStore();
  const code =
    "const meta = { name: 'Box', category: 'prop' }; function build() { const root = createRoot('Box'); createPart('Body', boxGeo(1,1,1), gameMaterial(0x88aa66), {parent: root, position: [0,0.5,0]}); return root; }";
  const programRef = await retainProgram(programStore, code);
  const server = createKilnMcpServer({
    programStore,
    assetLibrary,
    assetDownloadUrls: async () => ({ 'asset.glb': 'https://example.com/asset.glb' }),
  });
  const client = new Client({ name: 'asset-test', version: '1' });
  const [ct, st] = InMemoryTransport.createLinkedPair();
  await Promise.all([client.connect(ct), server.connect(st)]);
  try {
    const definitions = await client.listTools();
    const presentation = definitions.tools.find((tool) => tool.name === 'kiln_present')!;
    expect(presentation.outputSchema).toBeDefined();
    expect(presentation._meta?.ui).toBeDefined();
    const result = await client.callTool({
      name: 'kiln_save',
      arguments: { programRef, name: 'Box' },
    });
    expect(result.isError).not.toBe(true);
    const content = result.content as {
      type: string;
      text?: string;
      uri?: string;
    }[];
    const data = JSON.parse(content.find((b) => b.type === 'text')!.text!);
    expect(data.asset.editable).toBe(true);
    const present = await client.callTool({
      name: 'kiln_present',
      arguments: {
        collection: 'project',
        assetId: data.asset.assetId,
        revisionId: data.asset.revisionId,
      },
    });
    expect(present.isError).not.toBe(true);
    expect(JSON.stringify(present.content).length).toBeLessThan(6000);
    expect((present.structuredContent as { asset?: unknown })?.asset).toBeDefined();
    const widget = present._meta?.kilnAsset as {
      files?: Record<string, string | { encoding: string; data: string }>;
      downloadUrls?: Record<string, string>;
    };
    expect(widget.downloadUrls?.['asset.glb']).toBe('https://example.com/asset.glb');
    expect(widget.files?.['asset.glb']).toBeDefined();
    const wireGlb = widget.files!['asset.glb']!;
    expect(JSON.stringify(present.content)).not.toContain(
      typeof wireGlb === 'string' ? wireGlb : wireGlb.data,
    );
    const decoded = await decodeWidgetAsset(widget);
    expect(decoded.record).toEqual(
      await assetLibrary.read('project', data.asset.assetId, data.asset.revisionId),
    );
    const sourceLink = content.find((b) => b.uri?.endsWith('/source.kiln.js'))!;
    expect(sourceLink).toBeDefined();
    const source = await client.readResource({ uri: sourceLink.uri! });
    expect('text' in source.contents[0]! ? source.contents[0].text : undefined).toBe(code);
    const fresh = new MemoryProgramStore();
    const defs = createKilnProgramToolRegistry({
      programStore: fresh,
      assetLibrary,
    });
    const restored = (await defs
      .find((d) => d.name === 'kiln_assets')!
      .run({
        action: 'restore',
        collection: 'project',
        assetId: data.asset.assetId,
        revisionId: data.asset.revisionId,
      })) as { programRef: string };
    expect(await fresh.get(restored.programRef)).toBe(code);
    const copy = (await defs
      .find((d) => d.name === 'kiln_import')!
      .run({
        sourceCollection: 'project',
        collection: 'library',
        assetId: data.asset.assetId,
        revisionId: data.asset.revisionId,
      })) as { asset: { revisionId: string } };
    expect(copy.asset.revisionId).toBe(data.asset.revisionId);
    // Large provenance belongs in a downloadable manifest, not every tool reply.
    const record = await assetLibrary.read('project', data.asset.assetId, data.asset.revisionId);
    const verbose = await assetLibrary.save('project', {
      name: 'Verbose',
      code,
      glb: record.files['asset.glb']!,
      build: {
        engine: 'test',
        options: {},
        warnings: [],
        integration: { details: 'x'.repeat(50000) },
      },
    });
    const exported = await defs
      .find((d) => d.name === 'kiln_export')!
      .run({
        collection: 'project',
        assetId: verbose.assetId,
        revisionId: verbose.revisionId,
      });
    expect(JSON.stringify(exported).length).toBeLessThan(6000);
  } finally {
    await client.close();
    await server.close();
    await rm(root, { recursive: true, force: true });
  }
});

/**
 * A `resource_link` says "here is where the bytes are", and a client has to decide
 * whether to spend context on them. The spec gives it two fields for that decision --
 * `size` and `annotations.audience` -- and emitting neither leaves the client guessing
 * from a MIME type. `editable.zip` is also not advertised: it is a bundle of the other
 * files, so a client that resolves every link pays for the same bytes twice. It stays
 * readable at its URI, which is what the widget's download button uses.
 */
test('every advertised asset link says how big it is and who it is for', async () => {
  const root = await mkdtemp(join(tmpdir(), 'kiln-asset-links-'));
  const assetLibrary = new FileAssetLibrary({ project: root });
  const programStore = new MemoryProgramStore();
  const programRef = await retainProgram(
    programStore,
    "const meta = { name: 'Box', category: 'prop' }; function build() { const root = createRoot('Box'); createPart('Body', boxGeo(1,1,1), gameMaterial(0x88aa66), {parent: root, position: [0,0.5,0]}); return root; }",
  );
  const server = createKilnMcpServer({ programStore, assetLibrary });
  const client = new Client({ name: 'asset-link-test', version: '1' });
  const [ct, st] = InMemoryTransport.createLinkedPair();
  await Promise.all([client.connect(ct), server.connect(st)]);
  try {
    const saved = await client.callTool({
      name: 'kiln_save',
      arguments: { programRef, name: 'Box' },
    });
    const blocks = saved.content as { type: string; text?: string }[];
    const data = JSON.parse(blocks.find((block) => block.type === 'text')!.text!);
    const links = blocks.filter((block) => block.type === 'resource_link') as unknown as {
      name: string;
      uri: string;
      size?: number;
      annotations?: { audience?: string[]; priority?: number };
    }[];
    expect(links.length).toBeGreaterThan(0);
    expect(links.map((link) => link.name)).not.toContain('editable.zip');

    const record = await assetLibrary.read('project', data.asset.assetId, data.asset.revisionId);
    for (const link of links) {
      // A declared size a client cannot trust is worse than no size at all, so this
      // compares against the bytes `resources/read` actually returns for that URI.
      const served = await readAssetResource(assetLibrary, link.uri);
      expect(link.size).toBe(served.bytes.byteLength);
      expect(link.annotations?.audience?.length).toBeGreaterThan(0);
      expect(typeof link.annotations?.priority).toBe('number');
    }
    // The renders and the GLB are download artifacts; the model already sees images
    // from kiln_render and never needs to spend context decoding a mesh.
    for (const name of ['asset.glb', 'preview.png']) {
      expect(links.find((link) => link.name === name)!.annotations!.audience).toEqual(['user']);
    }
    // Dropped from the advertised list, still readable where the widget expects it.
    const bundle = await readAssetResource(
      assetLibrary,
      `kiln://assets/project/${data.asset.assetId}/${data.asset.revisionId}/editable.zip`,
    );
    expect(bundle.bytes.byteLength).toBeGreaterThan(0);
    expect(Object.keys(record.files)).toContain('asset.glb');
  } finally {
    await client.close();
    await server.close();
    await rm(root, { recursive: true, force: true });
  }
});

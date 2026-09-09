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

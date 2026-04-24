/**
 * FBX -> GLB ingest.
 *
 * Host: Playwright Chromium (same pattern as kiln/imposter). FBXLoader and
 * GLTFExporter both live in three/examples/jsm; they assume a browser
 * context for Blob/URL/atob shims. Running them in-browser is simpler and
 * more robust than backporting Node shims.
 *
 * Flow per input FBX:
 *   1. Read bytes, base64-encode into a data: URL.
 *   2. page.evaluate -> FBXLoader.parse(ArrayBuffer) -> THREE.Group.
 *   3. Optional: scale the root to meters (FBX commonly exports in cm).
 *   4. GLTFExporter.parse(group, { binary: true }) -> ArrayBuffer -> base64.
 *   5. Decode to Buffer in Node, optionally run @gltf-transform dedup/prune.
 */

import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { Buffer } from 'node:buffer';

import { NodeIO } from '@gltf-transform/core';
import { dedup, prune } from '@gltf-transform/functions';
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';

export interface IngestFbxOptions {
  /**
   * Multiply the imported scene's root scale by this factor before export.
   * FBX files commonly use centimeters — set 0.01 to normalize to meters.
   * Default 1.0 (no rescale).
   */
  scale?: number;
  /** Run @gltf-transform dedup + prune after serialization. Default true. */
  mergeMaterials?: boolean;
  /** Optional name stored in the exported glTF scene. Default = file basename. */
  sceneName?: string;
}

export interface IngestFbxResult {
  glb: Buffer;
  meta: {
    sceneName: string;
    triangles: number;
    bytes: number;
    sourceBytes: number;
  };
}

export interface IngestFbxSession {
  ingest(fbx: Buffer | string, opts?: IngestFbxOptions): Promise<IngestFbxResult>;
  close(): Promise<void>;
}

export async function openFbxIngestSession(): Promise<IngestFbxSession> {
  const browser: Browser = await chromium.launch();
  const ctx: BrowserContext = await browser.newContext();
  const page: Page = await ctx.newPage();
  await page.setContent(buildHarnessHtml());
  await page.waitForFunction(
    () => (globalThis as unknown as { __fbxReady?: boolean }).__fbxReady === true,
    { timeout: 30_000 },
  );

  return {
    ingest: (fbx, opts) => ingestOnPage(page, fbx, opts ?? {}),
    close: async () => {
      await ctx.close();
      await browser.close();
    },
  };
}

export async function ingestFbx(
  fbx: Buffer | string,
  opts: IngestFbxOptions = {},
): Promise<IngestFbxResult> {
  const session = await openFbxIngestSession();
  try {
    return await session.ingest(fbx, opts);
  } finally {
    await session.close();
  }
}

async function ingestOnPage(
  page: Page,
  fbx: Buffer | string,
  opts: IngestFbxOptions,
): Promise<IngestFbxResult> {
  const buf = typeof fbx === 'string' ? readFileSync(fbx) : fbx;
  const sourcePath = typeof fbx === 'string' ? fbx : undefined;
  const scale = opts.scale ?? 1.0;
  const sceneName = opts.sceneName ?? (sourcePath ? basename(sourcePath, '.fbx') : 'Scene');

  const dataUrl = `data:application/octet-stream;base64,${buf.toString('base64')}`;
  const out = (await page.evaluate(
    async ([url, s, name]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = globalThis as any;
      return w.__fbxIngest(url, s, name);
    },
    [dataUrl, scale, sceneName] as const,
  )) as { glbBase64: string; triangles: number };

  let glb = Buffer.from(out.glbBase64, 'base64');
  if (opts.mergeMaterials !== false) {
    // Run dedup + prune through gltf-transform for a tighter output.
    const io = new NodeIO();
    const doc = await io.readBinary(glb);
    await doc.transform(prune(), dedup());
    glb = Buffer.from(await io.writeBinary(doc));
  }

  return {
    glb,
    meta: {
      sceneName,
      triangles: out.triangles,
      bytes: glb.byteLength,
      sourceBytes: buf.byteLength,
    },
  };
}

function buildHarnessHtml(): string {
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<script type="importmap">
{
  "imports": {
    "three": "https://unpkg.com/three@0.184.0/build/three.module.js",
    "three/addons/": "https://unpkg.com/three@0.184.0/examples/jsm/"
  }
}
</script>
</head>
<body>
<script type="module">
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

function countTris(root) {
  let tris = 0;
  root.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    const g = o.geometry;
    if (g.index) tris += g.index.count / 3;
    else if (g.attributes.position) tris += g.attributes.position.count / 3;
  });
  return Math.round(tris);
}

window.__fbxIngest = async (dataUrl, scale, sceneName) => {
  const resp = await fetch(dataUrl);
  const arrayBuf = await resp.arrayBuffer();
  const loader = new FBXLoader();
  const group = loader.parse(arrayBuf, '');
  if (scale !== 1) group.scale.multiplyScalar(scale);
  group.name = sceneName;
  const tris = countTris(group);

  const exporter = new GLTFExporter();
  const glb = await new Promise((resolve, reject) => {
    exporter.parse(
      group,
      (result) => {
        if (result instanceof ArrayBuffer) resolve(result);
        else reject(new Error('GLTFExporter returned non-binary output'));
      },
      (err) => reject(err),
      { binary: true, onlyVisible: true, trs: false },
    );
  });

  // ArrayBuffer -> base64 for postMessage.
  const bytes = new Uint8Array(glb);
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return { glbBase64: btoa(bin), triangles: tris };
};

window.__fbxReady = true;
</script>
</body></html>`;
}

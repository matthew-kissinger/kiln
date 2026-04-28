/**
 * Imposter baker — renders a GLB from N camera angles into a packed atlas.
 *
 * Backend: Playwright + Chromium (same pattern as scripts/visual-audit.ts).
 * Reason: the kiln render substrate (render.ts) is pure scene-graph math with
 * no WebGL, so actual pixel output requires a real GPU context. Playwright is
 * already a repo dep and works on Windows, which headless-gl does not.
 *
 * Strategy:
 *   1. Launch one Chromium page per session (ImposterSession).
 *   2. Inject a tiny three.js 0.184 harness that loads GLBs from data URLs.
 *   3. For each tile, set an orthographic camera to (az, el), render, capture
 *      PNG tile via canvas.toDataURL.
 *   4. Composite tiles into a single atlas via sharp.
 *   5. Optionally bake auxiliary layers (depth, normal) with shared geometry
 *      and a swapped material — each emits its own atlas PNG.
 *
 * The session is reusable — one Chromium launch can bake dozens of GLBs.
 */

import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import { chromium, type Page } from 'playwright';

import type {
  ImposterAngleCount,
  ImposterAuxLayer,
  ImposterAxis,
  ImposterBgColor,
  ImposterColorLayer,
  ImposterMeta,
} from './schema';
import { IMPOSTER_SCHEMA_VERSION } from './schema';
import { enumerateTiles, resolveLayout } from './projection';

export interface BakeImposterOptions {
  angles: ImposterAngleCount;
  axis?: ImposterAxis;
  /** Pixel size of a single tile (square). Atlas size = tileSize * tilesX × tilesY. */
  tileSize?: 128 | 256 | 512 | 1024;
  /** Which layers to produce. 'albedo' is always included. */
  auxLayers?: ImposterAuxLayer[];
  /** Background color for the albedo bake. 'transparent' uses RGBA alpha. */
  bgColor?: ImposterBgColor;
  /** 'beauty' preserves legacy lit bakes; 'baseColor' emits unlit color for runtime lighting. */
  colorLayer?: ImposterColorLayer;
  /** RGB bleed radius into transparent pixels before atlas packing. Defaults to 2 for baseColor bakes. */
  edgeBleedPx?: number;
  /** Included in meta.source.path for provenance. */
  sourcePath?: string;
}

export interface BakeImposterResult {
  /** Packed albedo atlas (PNG). */
  atlas: Buffer;
  /** Auxiliary atlases keyed by layer name. */
  aux: Partial<Record<ImposterAuxLayer, Buffer>>;
  /** Sidecar metadata — write alongside the atlas. */
  meta: ImposterMeta;
}

export interface ImposterSession {
  bake(glb: Buffer | string, opts: BakeImposterOptions): Promise<BakeImposterResult>;
  close(): Promise<void>;
}

/** Spin up a reusable Playwright session. Call close() when you're done batching. */
export async function openImposterSession(): Promise<ImposterSession> {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.setContent(buildHarnessHtml());
  await page.waitForFunction(
    () => (globalThis as unknown as { __imposterReady?: boolean }).__imposterReady === true,
    { timeout: 30_000 },
  );

  return {
    bake: (glb, opts) => bakeOnPage(page, glb, opts),
    close: async () => {
      await ctx.close();
      await browser.close();
    },
  };
}

/** Convenience: one-shot bake. Internally opens + closes a session. */
export async function bakeImposter(
  glb: Buffer | string,
  opts: BakeImposterOptions,
): Promise<BakeImposterResult> {
  const session = await openImposterSession();
  try {
    return await session.bake(glb, opts);
  } finally {
    await session.close();
  }
}

// ============================================================================
// Internals
// ============================================================================

async function bakeOnPage(
  page: Page,
  glb: Buffer | string,
  opts: BakeImposterOptions,
): Promise<BakeImposterResult> {
  const angles = opts.angles;
  const axis: ImposterAxis = opts.axis ?? (angles === 16 ? 'y' : 'hemi-y');
  const tileSize = opts.tileSize ?? 512;
  const auxLayers = uniqueAuxLayers(opts.auxLayers ?? []);
  const bgColor: ImposterBgColor = opts.bgColor ?? 'transparent';
  const colorLayer: ImposterColorLayer = opts.colorLayer ?? 'beauty';
  const edgeBleedPx = opts.edgeBleedPx ?? (colorLayer === 'baseColor' && bgColor === 'transparent' ? 2 : 0);

  if (!Number.isInteger(edgeBleedPx) || edgeBleedPx < 0) {
    throw new Error(`edgeBleedPx must be a non-negative integer (got ${edgeBleedPx})`);
  }
  if (colorLayer === 'baseColor' && !auxLayers.includes('normal')) {
    throw new Error("baseColor imposter bakes require auxLayers to include 'normal'");
  }

  const buf = typeof glb === 'string' ? readFileSync(glb) : glb;
  const sourcePath = opts.sourcePath ?? (typeof glb === 'string' ? glb : undefined);

  const layout = resolveLayout(angles, axis);
  const tiles = enumerateTiles(layout);

  // Load the GLB into the harness and pull back bbox + tri count.
  const loadInfo = (await page.evaluate(
    async ([dataUrl, tileSz]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = globalThis as any;
      return w.__imposterLoadGlb(dataUrl, tileSz);
    },
    [`data:model/gltf-binary;base64,${buf.toString('base64')}`, tileSize] as const,
  )) as { bbox: { min: [number, number, number]; max: [number, number, number] }; tris: number };

  // Render each layer.
  const layers: ImposterAuxLayer[] = ['albedo', ...auxLayers];
  const atlases: Partial<Record<ImposterAuxLayer, Buffer>> = {};
  for (const layer of layers) {
    const tilePngs: Buffer[] = [];
    for (const tile of tiles) {
      const dataUrl = (await page.evaluate(
        (args) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const w = globalThis as any;
          return w.__imposterRenderTile(args);
        },
        {
          dir: tile.dir,
          layer,
          bgColor,
          colorLayer,
          tileSize,
        },
      )) as string;
      const png = Buffer.from(dataUrl.split(',')[1]!, 'base64');
      tilePngs.push(png);
    }
    atlases[layer] = await composeAtlas(tilePngs, tileSize, layout.tilesX, layout.tilesY, bgColor, edgeBleedPx);
  }

  const albedo = atlases.albedo!;
  // Separate aux from albedo in the result surface.
  const aux: Partial<Record<ImposterAuxLayer, Buffer>> = {};
  for (const layer of auxLayers) {
    if (atlases[layer]) aux[layer] = atlases[layer];
  }

  // Build the ImposterMeta sidecar.
  const min = loadInfo.bbox.min;
  const max = loadInfo.bbox.max;
  const sizeX = max[0] - min[0];
  const sizeY = max[1] - min[1];
  const sizeZ = max[2] - min[2];
  const worldSize = Math.max(sizeX, sizeY, sizeZ);
  const yOffset = (min[1] + max[1]) * 0.5;

  const meta: ImposterMeta = {
    version: IMPOSTER_SCHEMA_VERSION,
    angles,
    tilesX: layout.tilesX,
    tilesY: layout.tilesY,
    tileSize,
    atlasWidth: layout.tilesX * tileSize,
    atlasHeight: layout.tilesY * tileSize,
    worldSize,
    yOffset,
    projection: 'orthographic',
    axis,
    hemi: axis === 'hemi-y',
    layout: 'latlon',
    azimuths: layout.azimuths,
    elevations: layout.elevations,
    bbox: { min, max },
    source: {
      ...(sourcePath ? { path: sourcePath } : {}),
      bytes: buf.byteLength,
      tris: loadInfo.tris,
    },
    auxLayers: layers,
    bgColor,
    colorLayer,
    normalSpace: 'capture-view',
    edgeBleedPx,
    textureColorSpace: 'srgb',
  };

  return { atlas: albedo, aux, meta };
}

async function composeAtlas(
  tilePngs: Buffer[],
  tileSize: number,
  tilesX: number,
  tilesY: number,
  bgColor: ImposterBgColor,
  edgeBleedPx: number,
): Promise<Buffer> {
  const width = tilesX * tileSize;
  const height = tilesY * tileSize;
  const bg =
    bgColor === 'transparent'
      ? { r: 0, g: 0, b: 0, alpha: 0 }
      : { r: 255, g: 0, b: 255, alpha: 1 };

  const composites: sharp.OverlayOptions[] = [];
  for (let idx = 0; idx < tilePngs.length; idx++) {
    const i = idx % tilesX;
    const j = Math.floor(idx / tilesX);
    const input = bgColor === 'transparent' && edgeBleedPx > 0
      ? await bleedTransparentRgb(tilePngs[idx]!, edgeBleedPx)
      : tilePngs[idx]!;
    composites.push({ input, left: i * tileSize, top: j * tileSize });
  }

  const atlas = await sharp({
    create: { width, height, channels: 4, background: bg },
  })
    .composite(composites)
    .png()
    .toBuffer();

  return bgColor === 'transparent' && edgeBleedPx > 0
    ? bleedTransparentRgb(atlas, edgeBleedPx)
    : atlas;
}

function uniqueAuxLayers(layers: ImposterAuxLayer[]): ImposterAuxLayer[] {
  const out: ImposterAuxLayer[] = [];
  for (const layer of layers) {
    if (layer === 'albedo') continue;
    if (!out.includes(layer)) out.push(layer);
  }
  return out;
}

export async function bleedTransparentRgb(png: Buffer, radius: number): Promise<Buffer> {
  if (radius <= 0) return png;
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const width = info.width;
  const height = info.height;
  let src = Buffer.from(data);
  let dst = Buffer.from(data);

  for (let pass = 0; pass < radius; pass++) {
    let changed = false;
    src.copy(dst);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        if (src[idx + 3] !== 0) continue;

        let r = 0;
        let g = 0;
        let b = 0;
        let n = 0;
        for (let oy = -1; oy <= 1; oy++) {
          const ny = y + oy;
          if (ny < 0 || ny >= height) continue;
          for (let ox = -1; ox <= 1; ox++) {
            if (ox === 0 && oy === 0) continue;
            const nx = x + ox;
            if (nx < 0 || nx >= width) continue;
            const ni = (ny * width + nx) * 4;
            if (src[ni + 3] === 0) continue;
            r += src[ni]!;
            g += src[ni + 1]!;
            b += src[ni + 2]!;
            n++;
          }
        }
        if (n > 0) {
          dst[idx] = Math.round(r / n);
          dst[idx + 1] = Math.round(g / n);
          dst[idx + 2] = Math.round(b / n);
          changed = true;
        }
      }
    }
    if (!changed) break;
    const tmp = src;
    src = dst;
    dst = tmp;
  }

  return sharp(src, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

// ============================================================================
// In-browser harness — three.js 0.184 from CDN, with loader + render helpers.
// ============================================================================

function buildHarnessHtml(): string {
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<style>html,body{margin:0;padding:0;background:#ff00ff}#app{width:1024px;height:1024px}</style>
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
<div id="app"></div>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const W = () => renderer.domElement.width;
const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(1024, 1024);
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const ambient = new THREE.AmbientLight(0xffffff, 0.45);
scene.add(ambient);
const key = new THREE.DirectionalLight(0xffffff, 1.0);
key.position.set(1.5, 2, 1);
scene.add(key);
const fill = new THREE.DirectionalLight(0xffffff, 0.35);
fill.position.set(-1, 0.5, -1);
scene.add(fill);

let root = null;
let boundsRadius = 1;
let boundsCenter = new THREE.Vector3();
let originalMaterials = new Map();
let baseColorMaterials = new Map();

window.__imposterLoadGlb = async (dataUrl, tileSize) => {
  if (root) scene.remove(root);
  originalMaterials.clear();
  baseColorMaterials.clear();
  if (renderer.domElement.width !== tileSize) {
    renderer.setSize(tileSize, tileSize);
  }
  const loader = new GLTFLoader();
  return new Promise((resolve, reject) => {
    loader.load(dataUrl, (gltf) => {
      root = gltf.scene;
      scene.add(root);
      const box = new THREE.Box3().setFromObject(root);
      boundsCenter = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const diag = Math.sqrt(size.x * size.x + size.y * size.y + size.z * size.z);
      boundsRadius = diag * 0.5 || 1;
      let tris = 0;
      root.traverse((obj) => {
        if (obj.isMesh && obj.material) {
          originalMaterials.set(obj, obj.material);
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          const baseMats = mats.map((material) => createBaseColorMaterial(material, obj.geometry));
          baseColorMaterials.set(obj, Array.isArray(obj.material) ? baseMats : baseMats[0]);
          for (const m of mats) {
            m.side = THREE.FrontSide;
            m.needsUpdate = true;
          }
          if (obj.geometry && obj.geometry.index) tris += obj.geometry.index.count / 3;
          else if (obj.geometry && obj.geometry.attributes.position) tris += obj.geometry.attributes.position.count / 3;
        }
      });
      resolve({
        bbox: { min: [box.min.x, box.min.y, box.min.z], max: [box.max.x, box.max.y, box.max.z] },
        tris: Math.round(tris),
      });
    }, undefined, (err) => reject(err));
  });
};

function createBaseColorMaterial(source, geometry) {
  const mat = new THREE.MeshBasicMaterial({
    color: source.color ? source.color.clone() : new THREE.Color(0xffffff),
    map: source.map ?? null,
    alphaMap: source.alphaMap ?? null,
    vertexColors: Boolean(source.vertexColors || geometry?.attributes?.color),
    opacity: source.opacity ?? 1,
    transparent: Boolean(source.transparent || (source.opacity ?? 1) < 1 || source.alphaMap),
    alphaTest: source.alphaTest ?? 0,
    side: THREE.FrontSide,
  });
  mat.name = source.name ? source.name + '__baseColor' : 'baseColor';
  return mat;
}

window.__imposterRenderTile = ({ dir, layer, bgColor, colorLayer, tileSize }) => {
  if (!root) throw new Error('no GLB loaded');
  if (renderer.domElement.width !== tileSize) renderer.setSize(tileSize, tileSize);

  // Swap materials for the active layer.
  if (layer === 'normal') {
    const normMat = new THREE.MeshNormalMaterial({ side: THREE.FrontSide });
    root.traverse((o) => { if (o.isMesh) o.material = normMat; });
  } else if (layer === 'depth') {
    const depthMat = new THREE.MeshDepthMaterial({
      side: THREE.FrontSide,
      depthPacking: THREE.RGBADepthPacking,
    });
    root.traverse((o) => { if (o.isMesh) o.material = depthMat; });
  } else {
    // albedo: legacy beauty restores original materials, production baseColor
    // swaps to unlit MeshBasicMaterial so runtime lighting owns the shade.
    root.traverse((o) => {
      if (!o.isMesh) return;
      if (colorLayer === 'baseColor' && baseColorMaterials.has(o)) {
        o.material = baseColorMaterials.get(o);
      } else if (originalMaterials.has(o)) {
        o.material = originalMaterials.get(o);
      }
    });
  }

  // Orthographic camera sized to the bounding sphere.
  const half = boundsRadius * 1.02;
  const camera = new THREE.OrthographicCamera(-half, half, half, -half, 0.01, 200);
  const d = new THREE.Vector3(dir[0], dir[1], dir[2]).normalize();
  camera.position.copy(boundsCenter).addScaledVector(d, boundsRadius * 4);
  camera.up.set(0, 1, 0);
  camera.lookAt(boundsCenter);

  // Background.
  if (layer === 'albedo' && bgColor === 'transparent') {
    scene.background = null;
    renderer.setClearColor(0x000000, 0);
  } else if (layer === 'albedo' && bgColor === 'magenta') {
    scene.background = new THREE.Color(0xff00ff);
    renderer.setClearColor(0xff00ff, 1);
  } else {
    scene.background = null;
    renderer.setClearColor(0x000000, 0);
  }

  renderer.render(scene, camera);
  return renderer.domElement.toDataURL('image/png');
};

window.__imposterReady = true;
</script>
</body></html>`;
}

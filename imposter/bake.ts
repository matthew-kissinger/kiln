/**
 * Imposter baker — renders a GLB from N camera angles into a packed atlas.
 *
 * Backend: Playwright + Chromium.
 * Reason: the kiln render substrate (render.ts) is pure scene-graph math with
 * no WebGL, so actual pixel output requires a real browser context. The public
 * pixelforge CLI runs this path through Node, which is Playwright's supported
 * JavaScript runtime across Windows, macOS, and Linux.
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
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, extname, resolve, sep } from 'node:path';
import sharp from 'sharp';
import { chromium, type Page } from 'playwright';

import type {
  ImposterAngleCount,
  ImposterAuxLayer,
  ImposterBgColor,
  ImposterColorLayer,
  ImposterLayout,
  ImposterMeta,
  LatLonImposterAxis,
} from './schema';
import { IMPOSTER_LEGACY_SCHEMA_VERSION, IMPOSTER_SCHEMA_VERSION, ImposterMetaSchema } from './schema';
import { enumerateOctahedralTiles, enumerateTiles, resolveLayout } from './projection';

const HARNESS_ORIGIN = 'https://pixel-forge-kiln.local';
const nodeRequire = createRequire(import.meta.url);

export interface BakeImposterOptions {
  angles?: ImposterAngleCount;
  axis?: LatLonImposterAxis | 'octahedral';
  /** Tile layout. Defaults to lat/lon unless axis is the octahedral compatibility alias. */
  layout?: ImposterLayout;
  /** Octahedral grid dimensions. Defaults to 8x8 when layout='octahedral'. */
  grid?: { x: number; y: number };
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
  /** Pin deterministic browser and PNG settings where Chromium permits it. */
  deterministic?: boolean;
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

export interface OpenImposterSessionOptions {
  deterministic?: boolean;
}

/** Spin up a reusable Playwright session. Call close() when you're done batching. */
export async function openImposterSession(opts: OpenImposterSessionOptions = {}): Promise<ImposterSession> {
  assertSupportedBrowserBakeRuntime();
  const browser = await chromium.launch({
    ...(opts.deterministic
      ? {
          args: [
            '--disable-gpu',
            '--use-angle=swiftshader-webgl',
            '--use-gl=angle',
          ],
        }
      : {}),
  });
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await installHarnessRoutes(page);
  await page.setContent(buildHarnessHtml({ deterministic: Boolean(opts.deterministic) }));
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

function assertSupportedBrowserBakeRuntime(): void {
  const isBun = Boolean((globalThis as { Bun?: unknown }).Bun);
  if (isBun && process.platform === 'win32') {
    throw new Error(
      'Playwright-backed imposter baking is not supported through Bun on Windows. Build and run the public Node CLI instead: bun run --filter @pixel-forge/cli build && node packages/cli/dist/index.js kiln bake-imposter ...',
    );
  }
}

/** Convenience: one-shot bake. Internally opens + closes a session. */
export async function bakeImposter(
  glb: Buffer | string,
  opts: BakeImposterOptions,
): Promise<BakeImposterResult> {
  const session = await openImposterSession({ deterministic: opts.deterministic });
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
  const requestedLayout: ImposterLayout = opts.layout ?? (opts.axis === 'octahedral' ? 'octahedral' : 'latlon');
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

  const resolved = resolveBakeLayout(opts, requestedLayout);
  const tiles = resolved.layout === 'octahedral'
    ? enumerateOctahedralTiles(resolved.grid)
    : enumerateTiles(resolved.latLon);

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
    atlases[layer] = await composeAtlas(tilePngs, tileSize, resolved.tilesX, resolved.tilesY, bgColor, edgeBleedPx);
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

  const common = {
    angles: resolved.angles,
    tilesX: resolved.tilesX,
    tilesY: resolved.tilesY,
    tileSize,
    atlasWidth: resolved.tilesX * tileSize,
    atlasHeight: resolved.tilesY * tileSize,
    worldSize,
    yOffset,
    projection: 'orthographic',
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
  } as const;

  const metaPayload = resolved.layout === 'octahedral'
    ? {
        version: IMPOSTER_SCHEMA_VERSION,
        ...common,
        axis: 'octahedral',
        hemi: false,
        layout: 'octahedral',
        directionEncoding: 'octahedral',
        directions: tiles.map((tile) => tile.dir),
      }
    : {
        version: IMPOSTER_LEGACY_SCHEMA_VERSION,
        ...common,
        axis: resolved.latLon.axis,
        hemi: resolved.latLon.axis === 'hemi-y',
        layout: 'latlon',
        azimuths: resolved.latLon.azimuths,
        elevations: resolved.latLon.elevations,
      };
  ImposterMetaSchema.parse(metaPayload);
  const meta = metaPayload as ImposterMeta;

  return { atlas: albedo, aux, meta };
}

type ResolvedBakeLayout =
  | {
      layout: 'latlon';
      angles: ImposterAngleCount;
      tilesX: number;
      tilesY: number;
      latLon: ReturnType<typeof resolveLayout>;
    }
  | {
      layout: 'octahedral';
      angles: number;
      tilesX: number;
      tilesY: number;
      grid: { x: number; y: number };
    };

function resolveBakeLayout(
  opts: BakeImposterOptions,
  layout: ImposterLayout,
): ResolvedBakeLayout {
  if (layout === 'octahedral') {
    const grid = opts.grid ?? { x: 8, y: 8 };
    if (!Number.isInteger(grid.x) || !Number.isInteger(grid.y) || grid.x <= 0 || grid.y <= 0) {
      throw new Error(`octahedral grid must be positive integers (got ${grid.x}x${grid.y})`);
    }
    return {
      layout,
      angles: grid.x * grid.y,
      tilesX: grid.x,
      tilesY: grid.y,
      grid,
    };
  }

  if (opts.axis === 'octahedral') {
    throw new Error("axis='octahedral' requires layout='octahedral'");
  }
  const angles = opts.angles ?? 16;
  const axis: LatLonImposterAxis = opts.axis ?? (angles === 16 ? 'y' : 'hemi-y');
  const latLon = resolveLayout(angles, axis);
  return {
    layout,
    angles,
    tilesX: latLon.tilesX,
    tilesY: latLon.tilesY,
    latLon,
  };
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
    .png({ compressionLevel: 9, adaptiveFiltering: false })
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

async function installHarnessRoutes(page: Page): Promise<void> {
  const threeRoot = dirname(dirname(nodeRequire.resolve('three')));
  await page.route(`${HARNESS_ORIGIN}/three/**`, async (route) => {
    const url = new URL(route.request().url());
    const rel = decodeURIComponent(url.pathname.replace(/^\/three\//, ''));
    const filePath = resolve(threeRoot, rel);
    const rootWithSep = threeRoot.endsWith(sep) ? threeRoot : `${threeRoot}${sep}`;
    if (filePath !== threeRoot && !filePath.startsWith(rootWithSep)) {
      await route.abort();
      return;
    }
    if (!existsSync(filePath)) {
      await route.abort();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: contentTypeFor(filePath),
      body: readFileSync(filePath),
    });
  });
}

function contentTypeFor(filePath: string): string {
  switch (extname(filePath).toLowerCase()) {
    case '.js':
      return 'application/javascript';
    case '.wasm':
      return 'application/wasm';
    case '.json':
      return 'application/json';
    default:
      return 'application/octet-stream';
  }
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

  return sharp(src, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9, adaptiveFiltering: false })
    .toBuffer();
}

// ============================================================================
// In-browser harness - local three.js modules, with loader + render helpers.
// ============================================================================

function buildHarnessHtml(opts: { deterministic: boolean }): string {
  const antialias = opts.deterministic ? 'false' : 'true';
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<style>html,body{margin:0;padding:0;background:#ff00ff}#app{width:1024px;height:1024px}</style>
<script type="importmap">
{
  "imports": {
    "three": "${HARNESS_ORIGIN}/three/build/three.module.js",
    "three/addons/": "${HARNESS_ORIGIN}/three/examples/jsm/"
  }
}
</script>
</head>
<body>
<div id="app"></div>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const W = () => renderer.domElement.width;
const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: ${antialias}, alpha: true, preserveDrawingBuffer: true });
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
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('${HARNESS_ORIGIN}/three/examples/jsm/libs/draco/');
  loader.setDRACOLoader(dracoLoader);
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
  if (Math.abs(d.dot(camera.up)) > 0.97) camera.up.set(0, 0, 1);
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

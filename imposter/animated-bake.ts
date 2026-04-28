/**
 * Animated octahedral imposter baker.
 *
 * W2 emits a packed RGBA8 debug atlas for review. Production R8 palette and
 * KTX2/DataArrayTexture packaging stay behind the review gate.
 */

import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import { chromium, type Page } from 'playwright';

import {
  ANIMATED_IMPOSTER_DEFAULT_ENVELOPE_BYTES,
  ANIMATED_IMPOSTER_KIND,
  ANIMATED_IMPOSTER_SCHEMA_VERSION,
  AnimatedImposterMetaSchema,
  type AnimatedClipTarget,
  type AnimatedImposterMeta,
  type AnimatedImposterPreBakeInput,
  type AnimatedImposterTextureLayout,
} from './animated-schema';
import {
  validateAnimatedImposterPreBake,
  type AnimatedImposterPreBakeReport,
} from './animated-validate';
import type { ResolvedClip } from './clip-resolver';

export interface AnimatedTileCamera {
  i: number;
  j: number;
  u: number;
  v: number;
  dir: [number, number, number];
}

export interface BakeAnimatedImposterOptions {
  clipTargets?: AnimatedClipTarget[];
  clipFallbacks?: AnimatedImposterPreBakeInput['clipFallbacks'];
  attachments?: AnimatedImposterAttachment[];
  viewGrid?: { x: number; y: number };
  tileSize?: number;
  framesPerClip?: number;
  textureLayout?: AnimatedImposterTextureLayout;
  sourcePath?: string;
  colorUri?: string;
  envelopeBytes?: number;
}

export interface AnimatedImposterAttachment {
  id: string;
  kind: 'weapon';
  glb: Buffer | string;
  sourcePath?: string;
  lengthMeters: number;
  gripNames?: string[];
  supportNames?: string[];
  muzzleNames?: string[];
  stockNames?: string[];
  sourceForward?: [number, number, number];
  pitchTrimDeg?: number;
  forwardHold?: number;
  gripOffset?: number;
  socketMode?: 'shouldered-forward';
}

export interface BakeAnimatedImposterResult {
  atlas: Buffer;
  frameAtlases: Buffer[];
  meta: AnimatedImposterMeta;
  preBake: AnimatedImposterPreBakeReport;
  frameAtlas: {
    width: number;
    height: number;
    framesX: number;
    framesY: number;
  };
}

export interface AnimatedImposterSession {
  bake(glb: Buffer | string, opts?: BakeAnimatedImposterOptions): Promise<BakeAnimatedImposterResult>;
  close(): Promise<void>;
}

interface LoadedAnimatedGlbInfo {
  bbox: { min: [number, number, number]; max: [number, number, number] };
  tris: number;
  skinned: boolean;
  clipNames: string[];
  clipDurations: Record<string, number>;
}

interface BrowserAttachmentInput extends Omit<AnimatedImposterAttachment, 'glb'> {
  dataUrl: string;
  bytes: number;
  hash: string;
}

export function enumerateOctahedralGrid(x: number, y: number): AnimatedTileCamera[] {
  if (!Number.isInteger(x) || !Number.isInteger(y) || x <= 0 || y <= 0) {
    throw new Error('octahedral grid dimensions must be positive integers');
  }
  const out: AnimatedTileCamera[] = [];
  for (let j = 0; j < y; j++) {
    for (let i = 0; i < x; i++) {
      const u = ((i + 0.5) / x) * 2 - 1;
      const v = 1 - ((j + 0.5) / y) * 2;
      out.push({ i, j, u, v, dir: octaDecode(u, v) });
    }
  }
  return out;
}

export async function openAnimatedImposterSession(): Promise<AnimatedImposterSession> {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.setContent(buildAnimatedHarnessHtml());
  await page.waitForFunction(
    () => (globalThis as unknown as { __animatedImposterReady?: boolean }).__animatedImposterReady === true,
    { timeout: 30_000 },
  );

  return {
    bake: (glb, opts) => bakeAnimatedOnPage(page, glb, opts ?? {}),
    close: async () => {
      await ctx.close();
      await browser.close();
    },
  };
}

export async function bakeAnimatedImposter(
  glb: Buffer | string,
  opts: BakeAnimatedImposterOptions = {},
): Promise<BakeAnimatedImposterResult> {
  const session = await openAnimatedImposterSession();
  try {
    return await session.bake(glb, opts);
  } finally {
    await session.close();
  }
}

async function bakeAnimatedOnPage(
  page: Page,
  glb: Buffer | string,
  opts: BakeAnimatedImposterOptions,
): Promise<BakeAnimatedImposterResult> {
  const buf = typeof glb === 'string' ? readFileSync(glb) : glb;
  const sourcePath = opts.sourcePath ?? (typeof glb === 'string' ? glb : undefined);
  const clipTargets = opts.clipTargets ?? ['walking'];
  const viewGrid = opts.viewGrid ?? { x: 6, y: 6 };
  const tileSize = opts.tileSize ?? 96;
  const framesPerClip = opts.framesPerClip ?? 8;
  const textureLayout = opts.textureLayout ?? 'atlas';
  const colorUri = opts.colorUri ?? 'animated-albedo-packed.png';
  const envelopeBytes = opts.envelopeBytes ?? ANIMATED_IMPOSTER_DEFAULT_ENVELOPE_BYTES;
  const attachments = loadBrowserAttachments(opts.attachments ?? []);

  if (textureLayout !== 'atlas') {
    throw new Error('W2 animated imposter bake currently writes packed 2D atlas output only');
  }

  const loadInfo = (await page.evaluate(
    async ([dataUrl, tileSz, browserAttachments]) => {
      const w = globalThis as unknown as {
        __animatedImposterLoadGlb: (
          dataUrl: string,
          tileSize: number,
          attachments: BrowserAttachmentInput[],
        ) => Promise<LoadedAnimatedGlbInfo>;
      };
      return w.__animatedImposterLoadGlb(dataUrl, tileSz, browserAttachments);
    },
    [`data:model/gltf-binary;base64,${buf.toString('base64')}`, tileSize, attachments] as const,
  )) as LoadedAnimatedGlbInfo;

  const preBake = validateAnimatedImposterPreBake({
    source: {
      ...(sourcePath ? { path: sourcePath } : {}),
      bytes: buf.byteLength,
      tris: loadInfo.tris,
      skinned: loadInfo.skinned,
      clipNames: loadInfo.clipNames,
    },
    clipTargets,
    clipFallbacks: opts.clipFallbacks ?? [],
    viewGrid,
    tileSize,
    framesPerClip,
    textureFormat: 'rgba8',
    textureLayout,
    includeNormal: false,
    includeDepth: false,
    envelopeBytes,
  });

  if (!preBake.ok) {
    throw new Error(`animated imposter pre-bake failed: ${preBake.blockers.map((i) => i.message).join('; ')}`);
  }

  const tiles = enumerateOctahedralGrid(viewGrid.x, viewGrid.y);
  const frameAtlases: Buffer[] = [];
  const clips = clipTargets
    .map((target) => preBake.clipResolution.clips[target])
    .filter(isRenderableClip);

  for (const clip of clips) {
    const durationSec = durationForClip(loadInfo.clipDurations, clip.rawName!, clip.resolved!);
    for (let frame = 0; frame < framesPerClip; frame++) {
      const timeSec = durationSec * (frame / framesPerClip);
      const tilePngs: Buffer[] = [];
      for (const tile of tiles) {
        const dataUrl = (await page.evaluate(
          (args) => {
            const w = globalThis as unknown as {
              __animatedImposterRenderTile: (args: {
                dir: [number, number, number];
                clipRawName: string;
                timeSec: number;
                tileSize: number;
              }) => string;
            };
            return w.__animatedImposterRenderTile(args);
          },
          {
            dir: tile.dir,
            clipRawName: clip.rawName!,
            timeSec,
            tileSize,
          },
        )) as string;
        tilePngs.push(Buffer.from(dataUrl.split(',')[1]!, 'base64'));
      }
      frameAtlases.push(await composeAtlas(tilePngs, tileSize, viewGrid.x, viewGrid.y));
    }
  }

  const layerWidth = viewGrid.x * tileSize;
  const layerHeight = viewGrid.y * tileSize;
  const { framesX, framesY } = chooseFrameGrid(frameAtlases.length);
  const atlas = await composeAtlas(frameAtlases, layerWidth, framesX, framesY, layerHeight);
  const min = loadInfo.bbox.min;
  const max = loadInfo.bbox.max;
  const worldSize = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]);
  const yOffset = (min[1] + max[1]) * 0.5;

  const meta: AnimatedImposterMeta = {
    version: ANIMATED_IMPOSTER_SCHEMA_VERSION,
    kind: ANIMATED_IMPOSTER_KIND,
    source: {
      ...(sourcePath ? { path: sourcePath } : {}),
      bytes: buf.byteLength,
      tris: loadInfo.tris,
      skinned: loadInfo.skinned,
      hash: createHash('sha256').update(buf).digest('hex'),
      animationClips: loadInfo.clipNames,
      ...(attachments.length
        ? {
            attachments: attachments.map((attachment) => ({
              id: attachment.id,
              kind: attachment.kind,
              ...(attachment.sourcePath ? { sourcePath: attachment.sourcePath } : {}),
              bytes: attachment.bytes,
              hash: attachment.hash,
            })),
          }
        : {}),
    },
    bbox: { min, max, worldSize, yOffset },
    projection: 'orthographic',
    view: {
      layout: 'octahedral',
      directionEncoding: 'octahedral',
      grid: { x: viewGrid.x, y: viewGrid.y, count: viewGrid.x * viewGrid.y },
      tileSize,
      framesPerClip,
    },
    clips: clips.map((clip) => ({
      target: clip.target,
      resolved: clip.resolved,
      rawName: clip.rawName,
      matchedBy: clip.matchedBy,
      ...(clip.fallbackFor ? { fallbackFor: clip.fallbackFor } : {}),
      ...(clip.fallbackRawName ? { fallbackRawName: clip.fallbackRawName } : {}),
      frameCount: framesPerClip,
      durationSec: durationForClip(loadInfo.clipDurations, clip.rawName!, clip.resolved!),
    })),
    textures: {
      layout: textureLayout,
      color: {
        uri: colorUri,
        format: 'rgba8',
        width: layerWidth * framesX,
        height: layerHeight * framesY,
        layers: frameAtlases.length,
        framesX,
        framesY,
        bytes: atlas.byteLength,
        colorSpace: 'srgb',
      },
    },
    runtime: {
      renderer: 'webgl2',
      primitive: 'instanced-quad',
      material: 'ShaderMaterial',
      textureMode: 'packed-2d-atlas',
      attributes: ['frameOffset', 'clip', 'variant', 'yaw', 'paletteRow'],
    },
    storage: {
      colorBytes: preBake.storage.colorBytes,
      totalRawBytes: preBake.storage.totalRawBytes,
      envelopeBytes: preBake.storage.envelopeBytes,
      fitsEnvelope: preBake.storage.fitsEnvelope,
    },
    validation: {
      warnings: preBake.warnings,
    },
  };

  return {
    atlas,
    frameAtlases,
    meta: AnimatedImposterMetaSchema.parse(meta),
    preBake,
    frameAtlas: { width: layerWidth, height: layerHeight, framesX, framesY },
  };
}

function loadBrowserAttachments(attachments: AnimatedImposterAttachment[]): BrowserAttachmentInput[] {
  return attachments.map((attachment) => {
    const buf = typeof attachment.glb === 'string' ? readFileSync(attachment.glb) : attachment.glb;
    const { glb: _glb, ...rest } = attachment;
    return {
      ...rest,
      dataUrl: `data:model/gltf-binary;base64,${buf.toString('base64')}`,
      bytes: buf.byteLength,
      hash: createHash('sha256').update(buf).digest('hex'),
    };
  });
}

async function composeAtlas(
  tilePngs: Buffer[],
  tileWidth: number,
  tilesX: number,
  tilesY: number,
  tileHeight = tileWidth,
): Promise<Buffer> {
  const composites: sharp.OverlayOptions[] = [];
  for (let idx = 0; idx < tilePngs.length; idx++) {
    const i = idx % tilesX;
    const j = Math.floor(idx / tilesX);
    composites.push({ input: tilePngs[idx]!, left: i * tileWidth, top: j * tileHeight });
  }

  return sharp({
    create: { width: tilesX * tileWidth, height: tilesY * tileHeight, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(composites)
    .png()
    .toBuffer();
}

function durationForClip(durations: Record<string, number>, rawName: string, resolved: string): number {
  return durations[rawName] ?? durations[resolved] ?? durations[resolved.toLowerCase()] ?? 1;
}

function isRenderableClip(clip: ResolvedClip | undefined): clip is ResolvedClip & { rawName: string; resolved: string } {
  return Boolean(clip?.rawName && clip.resolved);
}

function chooseFrameGrid(layerCount: number): { framesX: number; framesY: number } {
  let best = { framesX: layerCount, framesY: 1, waste: 0, aspectPenalty: Number.POSITIVE_INFINITY };
  for (let y = 1; y <= layerCount; y++) {
    const x = Math.ceil(layerCount / y);
    const waste = x * y - layerCount;
    const aspectPenalty = Math.abs(x / y - 2);
    if (waste < best.waste || (waste === best.waste && aspectPenalty < best.aspectPenalty)) {
      best = { framesX: x, framesY: y, waste, aspectPenalty };
    }
  }
  return { framesX: best.framesX, framesY: best.framesY };
}

function octaDecode(u: number, v: number): [number, number, number] {
  let x = u;
  const y = 1 - Math.abs(u) - Math.abs(v);
  let z = v;

  if (y < 0) {
    const oldX = x;
    x = (1 - Math.abs(z)) * Math.sign(oldX || 1);
    z = (1 - Math.abs(oldX)) * Math.sign(z || 1);
  }

  const len = Math.hypot(x, y, z) || 1;
  return [x / len, y / len, z / len];
}

function buildAnimatedHarnessHtml(): string {
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<style>html,body{margin:0;padding:0;background:#000}#app{width:1024px;height:1024px}</style>
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

const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(1024, 1024);
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 0.55));
const key = new THREE.DirectionalLight(0xffffff, 1.1);
key.position.set(1.5, 2, 1);
scene.add(key);
const fill = new THREE.DirectionalLight(0xffffff, 0.35);
fill.position.set(-1, 0.5, -1);
scene.add(fill);

let actorGroup = null;
let root = null;
let mixer = null;
let clips = [];
let boundsRadius = 1;
let boundsCenter = new THREE.Vector3();
let originalMaterials = new Map();
let bones = {};
let rootMotionBase = null;
let weaponPivot = new THREE.Group();
let currentWeapon = null;
let currentWeaponMeta = null;

function normalizeClipName(raw) {
  let s = raw;
  while (s.includes('|')) s = s.slice(s.indexOf('|') + 1);
  return s;
}

function findClip(rawName) {
  return clips.find((c) => c.name === rawName)
    || clips.find((c) => normalizeClipName(c.name) === normalizeClipName(rawName));
}

window.__animatedImposterLoadGlb = async (dataUrl, tileSize, attachments = []) => {
  if (actorGroup) scene.remove(actorGroup);
  originalMaterials.clear();
  bones = {};
  rootMotionBase = null;
  currentWeapon = null;
  currentWeaponMeta = null;
  weaponPivot = new THREE.Group();
  if (renderer.domElement.width !== tileSize) renderer.setSize(tileSize, tileSize);
  const loader = new GLTFLoader();
  return new Promise((resolve, reject) => {
    loader.load(dataUrl, async (gltf) => {
      root = gltf.scene;
      clips = gltf.animations || [];
      mixer = new THREE.AnimationMixer(root);
      actorGroup = new THREE.Group();
      actorGroup.add(root);
      actorGroup.add(weaponPivot);
      scene.add(actorGroup);
      collectBones(root);
      const firstClip = clips[0];
      if (firstClip) {
        const action = mixer.clipAction(firstClip);
        action.reset();
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.play();
        mixer.setTime(0);
        root.updateMatrixWorld(true);
      }
      rootMotionBase = bones.Hips ? bones.Hips.position.clone() : null;

      if (attachments.length > 0) {
        currentWeaponMeta = attachments[0];
        try {
          const weaponGltf = await loadGltf(loader, currentWeaponMeta.dataUrl);
          currentWeapon = weaponGltf.scene;
          normalizeWeapon(currentWeapon, currentWeaponMeta);
          weaponPivot.add(currentWeapon);
          updateWeaponSocket();
        } catch (error) {
          console.warn('Animated imposter weapon attachment failed', error);
        }
      }

      actorGroup.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(actorGroup);
      boundsCenter = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      boundsRadius = Math.sqrt(size.x * size.x + size.y * size.y + size.z * size.z) * 0.5 || 1;
      let tris = 0;
      let skinned = false;
      actorGroup.traverse((obj) => {
        if (obj.isSkinnedMesh) skinned = true;
        if (obj.isMesh && obj.material) {
          originalMaterials.set(obj, obj.material);
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const m of mats) {
            m.side = THREE.FrontSide;
            m.needsUpdate = true;
          }
          if (obj.geometry && obj.geometry.index) tris += obj.geometry.index.count / 3;
          else if (obj.geometry && obj.geometry.attributes.position) tris += obj.geometry.attributes.position.count / 3;
        }
      });
      const clipDurations = {};
      for (const clip of clips) {
        clipDurations[clip.name] = clip.duration || 1;
        clipDurations[normalizeClipName(clip.name)] = clip.duration || 1;
        clipDurations[normalizeClipName(clip.name).toLowerCase()] = clip.duration || 1;
      }
      resolve({
        bbox: { min: [box.min.x, box.min.y, box.min.z], max: [box.max.x, box.max.y, box.max.z] },
        tris: Math.round(tris),
        skinned,
        clipNames: clips.map((c) => c.name),
        clipDurations,
      });
    }, undefined, (err) => reject(err));
  });
};

window.__animatedImposterRenderTile = ({ dir, clipRawName, timeSec, tileSize }) => {
  if (!root || !mixer) throw new Error('no animated GLB loaded');
  if (renderer.domElement.width !== tileSize) renderer.setSize(tileSize, tileSize);

  const clip = findClip(clipRawName);
  if (!clip) throw new Error('clip not found: ' + clipRawName);
  mixer.stopAllAction();
  const action = mixer.clipAction(clip);
  action.reset();
  action.setLoop(THREE.LoopRepeat, Infinity);
  action.play();
  mixer.setTime((timeSec || 0) % (clip.duration || 1));
  lockRootMotion();
  root.updateMatrixWorld(true);
  updateWeaponSocket();
  actorGroup?.updateMatrixWorld(true);

  actorGroup.traverse((o) => {
    if (o.isMesh && originalMaterials.has(o)) o.material = originalMaterials.get(o);
  });

  const half = boundsRadius * 1.05;
  const camera = new THREE.OrthographicCamera(-half, half, half, -half, 0.01, 200);
  const d = new THREE.Vector3(dir[0], dir[1], dir[2]).normalize();
  camera.position.copy(boundsCenter).addScaledVector(d, boundsRadius * 4);
  camera.up.set(0, 1, 0);
  if (Math.abs(d.dot(camera.up)) > 0.97) camera.up.set(0, 0, 1);
  camera.lookAt(boundsCenter);

  scene.background = null;
  renderer.setClearColor(0x000000, 0);
  renderer.render(scene, camera);
  return renderer.domElement.toDataURL('image/png');
};

function loadGltf(loader, dataUrl) {
  return new Promise((resolve, reject) => {
    loader.load(dataUrl, resolve, undefined, reject);
  });
}

function collectBones(rootObject) {
  bones = {};
  rootObject.traverse((node) => {
    if (node.isBone) bones[node.name] = node;
  });
}

function findNamed(rootObject, names = []) {
  for (const name of names) {
    let found = null;
    rootObject.traverse((node) => {
      if (!found && node.name === name) found = node;
    });
    if (found) return found;
  }
  return null;
}

function centerOfObject(rootObject, object) {
  if (!object) return null;
  rootObject.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return null;
  const center = box.getCenter(new THREE.Vector3());
  return rootObject.worldToLocal(center.clone());
}

function normalizeWeapon(weaponRoot, weapon) {
  weaponRoot.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(weaponRoot);
  const size = box.getSize(new THREE.Vector3());
  const long = Math.max(size.x, size.y, size.z) || 1;
  const scale = weapon.lengthMeters / long;
  weaponRoot.scale.setScalar(scale);
  const gripObject = findNamed(weaponRoot, weapon.gripNames || []);
  const supportObject = findNamed(weaponRoot, weapon.supportNames || []);
  const muzzleObject = findNamed(weaponRoot, weapon.muzzleNames || []);
  const stockObject = findNamed(weaponRoot, weapon.stockNames || []);
  const grip = centerOfObject(weaponRoot, gripObject) || new THREE.Vector3(0, 0, 0);
  const support = centerOfObject(weaponRoot, supportObject);
  const muzzle = centerOfObject(weaponRoot, muzzleObject);
  const stock = centerOfObject(weaponRoot, stockObject);
  const muzzleDirection = weapon.sourceForward
    ? new THREE.Vector3(...weapon.sourceForward)
    : muzzle
      ? muzzle.clone().sub(grip)
      : new THREE.Vector3(1, 0, 0);
  const alignment = muzzleDirection.lengthSq() > 0.0001
    ? new THREE.Quaternion().setFromUnitVectors(muzzleDirection.normalize(), new THREE.Vector3(1, 0, 0))
    : new THREE.Quaternion();
  weaponRoot.quaternion.copy(alignment);
  const transformLocal = (point) => point.clone().multiplyScalar(scale).applyQuaternion(weaponRoot.quaternion);
  const transformedGrip = transformLocal(grip);
  weaponRoot.position.copy(transformedGrip.multiplyScalar(-1));
  weaponRoot.userData.stockOffset = stock
    ? transformLocal(stock).sub(transformLocal(grip))
    : new THREE.Vector3(-0.28, 0.04, 0);
  weaponRoot.userData.supportOffset = support
    ? transformLocal(support).sub(transformLocal(grip))
    : new THREE.Vector3(0.28, 0.02, 0);
  weaponRoot.updateMatrixWorld(true);
}

function worldPosition(name) {
  const bone = bones[name];
  if (!bone) return null;
  return bone.getWorldPosition(new THREE.Vector3());
}

function rootForward() {
  const q = root.getWorldQuaternion(new THREE.Quaternion());
  return new THREE.Vector3(0, 0, 1).applyQuaternion(q).normalize();
}

function bodyForward() {
  const hips = bones.Hips || bones.Spine || root;
  const q = hips.getWorldQuaternion(new THREE.Quaternion());
  return new THREE.Vector3(0, 0, 1).applyQuaternion(q).normalize();
}

function lockRootMotion() {
  if (!rootMotionBase || !bones.Hips) return;
  bones.Hips.position.x = rootMotionBase.x;
  bones.Hips.position.z = rootMotionBase.z;
}

const boneUp = new THREE.Vector3(0, 1, 0);

function setBoneDirectionWorld(bone, directionWorld) {
  if (!bone?.parent) return;
  const direction = directionWorld.clone().normalize();
  if (direction.lengthSq() < 0.0001) return;
  const parentInv = bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
  const targetLocal = direction.applyQuaternion(parentInv).normalize();
  bone.quaternion.setFromUnitVectors(boneUp, targetLocal);
  bone.updateMatrixWorld(true);
}

function solveArmToTarget(side, target, axes) {
  const upper = bones[side + 'Arm'];
  const fore = bones[side + 'ForeArm'];
  const hand = bones[side + 'Hand'];
  if (!upper || !fore || !hand || !target) return;

  root.updateMatrixWorld(true);
  const shoulder = upper.getWorldPosition(new THREE.Vector3());
  const elbowNow = fore.getWorldPosition(new THREE.Vector3());
  const handNow = hand.getWorldPosition(new THREE.Vector3());
  const upperLength = Math.max(0.001, shoulder.distanceTo(elbowNow));
  const foreLength = Math.max(0.001, elbowNow.distanceTo(handNow));
  const reach = Math.max(0.08, upperLength + foreLength - 0.025);
  const targetVector = target.clone().sub(shoulder);
  const distance = targetVector.length();
  if (distance < 0.001) return;

  const direction = targetVector.clone().normalize();
  const clampedTarget = distance > reach
    ? shoulder.clone().add(direction.clone().multiplyScalar(reach))
    : target.clone();
  const clampedDistance = Math.min(distance, reach);
  const sideSign = side === 'Right' ? 1 : -1;
  const pole = shoulder.clone()
    .add(axes.cleanUp.clone().multiplyScalar(-0.24))
    .add(axes.actorRight.clone().multiplyScalar(0.22 * sideSign))
    .add(axes.forward.clone().multiplyScalar(0.04));
  let planeNormal = direction.clone().cross(pole.clone().sub(shoulder)).normalize();
  if (planeNormal.lengthSq() < 0.0001) planeNormal = axes.actorRight.clone().multiplyScalar(sideSign);
  const bendDirection = planeNormal.clone().cross(direction).normalize();
  const along = (upperLength * upperLength - foreLength * foreLength + clampedDistance * clampedDistance) / (2 * clampedDistance);
  const height = Math.sqrt(Math.max(0, upperLength * upperLength - along * along));
  const elbow = shoulder.clone()
    .add(direction.clone().multiplyScalar(along))
    .add(bendDirection.multiplyScalar(height));

  setBoneDirectionWorld(upper, elbow.clone().sub(shoulder));
  root.updateMatrixWorld(true);
  const elbowWorld = fore.getWorldPosition(new THREE.Vector3());
  setBoneDirectionWorld(fore, clampedTarget.clone().sub(elbowWorld));
  root.updateMatrixWorld(true);
}

function updateWeaponSocket() {
  if (!currentWeapon || !currentWeaponMeta) return;
  const right = worldPosition('RightHand');
  const leftShoulder = worldPosition('LeftArm') || worldPosition('LeftShoulder');
  const rightShoulder = worldPosition('RightArm') || worldPosition('RightShoulder');
  if (!right) return;

  const up = new THREE.Vector3(0, 1, 0);
  const travelForward = rootForward();
  travelForward.y = 0;
  if (travelForward.lengthSq() < 0.0001) travelForward.set(0, 0, 1);
  travelForward.normalize();
  const torsoForward = bodyForward();
  torsoForward.y = 0;
  if (torsoForward.lengthSq() < 0.0001) torsoForward.set(0, 0, 1);
  torsoForward.normalize();
  const forward = currentWeaponMeta.socketMode === 'shouldered-forward' ? travelForward : torsoForward;
  let actorRight = new THREE.Vector3().crossVectors(forward, up).normalize();
  if (leftShoulder && rightShoulder) {
    const shoulderSpan = rightShoulder.clone().sub(leftShoulder);
    shoulderSpan.y = 0;
    if (shoulderSpan.lengthSq() > 0.0001) {
      shoulderSpan.normalize();
      if (shoulderSpan.dot(actorRight) < 0) shoulderSpan.multiplyScalar(-1);
      actorRight = shoulderSpan;
    }
  }
  const cleanUp = new THREE.Vector3().crossVectors(actorRight, forward).normalize();
  const matrix = new THREE.Matrix4().makeBasis(forward, cleanUp, actorRight);
  weaponPivot.quaternion.setFromRotationMatrix(matrix);
  if (currentWeaponMeta.pitchTrimDeg) {
    weaponPivot.rotateZ(THREE.MathUtils.degToRad(currentWeaponMeta.pitchTrimDeg));
  }

  const shoulder = rightShoulder || right;
  const shoulderCenter = leftShoulder && rightShoulder
    ? leftShoulder.clone().lerp(rightShoulder, 0.5)
    : shoulder.clone().sub(actorRight.clone().multiplyScalar(0.12));
  const shoulderPocket = shoulder.clone()
    .lerp(shoulderCenter, 0.42)
    .add(cleanUp.clone().multiplyScalar(-0.035));
  const stockOffset = currentWeapon.userData.stockOffset instanceof THREE.Vector3
    ? currentWeapon.userData.stockOffset.clone()
    : new THREE.Vector3(-0.28, 0.04, 0);
  const stockWorldOffset = stockOffset.applyQuaternion(weaponPivot.quaternion);
  const offset = currentWeaponMeta.gripOffset || 0;
  const stockAnchoredGrip = shoulderPocket.clone()
    .add(forward.clone().multiplyScalar((currentWeaponMeta.forwardHold ?? 0.06) + offset))
    .sub(stockWorldOffset);
  weaponPivot.position.copy(stockAnchoredGrip).add(actorRight.clone().multiplyScalar(0.006));

  const supportOffset = currentWeapon.userData.supportOffset instanceof THREE.Vector3
    ? currentWeapon.userData.supportOffset.clone()
    : new THREE.Vector3(0.28, 0.02, 0);
  const supportTarget = weaponPivot.position.clone().add(supportOffset.applyQuaternion(weaponPivot.quaternion));
  const gripTarget = weaponPivot.position.clone();
  const axes = { forward, cleanUp, actorRight };
  solveArmToTarget('Right', gripTarget, axes);
  solveArmToTarget('Left', supportTarget, axes);
  root.updateMatrixWorld(true);
}

window.__animatedImposterReady = true;
</script>
</body></html>`;
}

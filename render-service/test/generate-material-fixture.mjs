import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PNG } from 'pngjs';

const IMAGE_SIZE = 16;
const PANEL_SIZE = 1.8;
const PANEL_CENTERS = Object.freeze({
  AlbedoChecker: [-2.6, 1.6, 0],
  NormalResponse: [0, 1.6, 0],
  SharedOrmResponse: [2.6, 1.6, 0],
  AoResponse: [-2.6, -1.6, 0],
  EmissiveResponse: [0, -1.6, 0],
  AlphaResponse: [2.6, -1.6, 0],
});
const CAMERA = Object.freeze({
  position: [0, 0, 10],
  target: [0, 0, 0],
  up: [0, 1, 0],
  fovDeg: 35,
  aspect: 1.5,
  near: 0.1,
  far: 100,
});
const WIDTH = 768;
const HEIGHT = 512;

function pngBytes(pixel) {
  const png = new PNG({ width: IMAGE_SIZE, height: IMAGE_SIZE });
  for (let y = 0; y < IMAGE_SIZE; y += 1) {
    for (let x = 0; x < IMAGE_SIZE; x += 1) {
      const rgba = pixel(x, y);
      const offset = (y * IMAGE_SIZE + x) * 4;
      for (let channel = 0; channel < 4; channel += 1) png.data[offset + channel] = rgba[channel];
    }
  }
  return PNG.sync.write(png, { deflateLevel: 9, filterType: 0 });
}

function sourceImages() {
  const checker = (x, y) => ((Math.floor(x / 4) + Math.floor(y / 4)) % 2) === 0;
  return [
    {
      name: 'AlbedoChecker',
      bytes: pngBytes((x, y) => checker(x, y) ? [245, 245, 245, 255] : [18, 18, 18, 255]),
    },
    {
      name: 'NormalSplit',
      bytes: pngBytes((x) => x < IMAGE_SIZE / 2 ? [32, 128, 224, 255] : [224, 128, 224, 255]),
    },
    {
      name: 'SharedOrm',
      bytes: pngBytes((x, y) => [
        x < IMAGE_SIZE / 2 ? 32 : 255,
        y < IMAGE_SIZE / 2 ? 32 : 224,
        checker(x, y) ? 24 : 232,
        255,
      ]),
    },
    {
      name: 'EmissiveChecker',
      bytes: pngBytes((x, y) => checker(x, y) ? [255, 32, 8, 255] : [0, 0, 0, 255]),
    },
    {
      name: 'AlphaChecker',
      bytes: pngBytes((x, y) => checker(x, y) ? [32, 255, 64, 255] : [255, 32, 192, 0]),
    },
  ];
}

function align4(value) {
  return (value + 3) & ~3;
}

function panelRegion([x, y], insetWorld = 0.18) {
  const half = PANEL_SIZE / 2 - insetWorld;
  const tanHalf = Math.tan(CAMERA.fovDeg * Math.PI / 360);
  const project = (worldX, worldY) => ({
    x: WIDTH * (1 + worldX / (10 * tanHalf * CAMERA.aspect)) / 2,
    y: HEIGHT * (1 - worldY / (10 * tanHalf)) / 2,
  });
  const topLeft = project(x - half, y + half);
  const bottomRight = project(x + half, y - half);
  return [
    Math.ceil(topLeft.x),
    Math.ceil(topLeft.y),
    Math.floor(bottomRight.x),
    Math.floor(bottomRight.y),
  ];
}

function appendBuffer(parts, bufferViews, bytes, extra = {}) {
  const offset = parts.reduce((total, part) => total + part.length, 0);
  const view = { buffer: 0, byteOffset: offset, byteLength: bytes.length, ...extra };
  bufferViews.push(view);
  parts.push(bytes);
  const padding = align4(bytes.length) - bytes.length;
  if (padding) parts.push(Buffer.alloc(padding));
  return bufferViews.length - 1;
}

function floatBuffer(values) {
  const bytes = Buffer.alloc(values.length * 4);
  values.forEach((value, index) => bytes.writeFloatLE(value, index * 4));
  return bytes;
}

function uint16Buffer(values) {
  const bytes = Buffer.alloc(values.length * 2);
  values.forEach((value, index) => bytes.writeUInt16LE(value, index * 2));
  return bytes;
}

function encodeGlb(json, bin) {
  const source = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonLength = align4(source.length);
  const jsonChunk = Buffer.alloc(jsonLength, 0x20);
  source.copy(jsonChunk);
  const binLength = align4(bin.length);
  const binChunk = Buffer.alloc(binLength);
  bin.copy(binChunk);
  const glb = Buffer.alloc(12 + 8 + jsonChunk.length + 8 + binChunk.length);
  glb.writeUInt32LE(0x46546c67, 0);
  glb.writeUInt32LE(2, 4);
  glb.writeUInt32LE(glb.length, 8);
  glb.writeUInt32LE(jsonChunk.length, 12);
  glb.writeUInt32LE(0x4e4f534a, 16);
  jsonChunk.copy(glb, 20);
  const binHeader = 20 + jsonChunk.length;
  glb.writeUInt32LE(binChunk.length, binHeader);
  glb.writeUInt32LE(0x004e4942, binHeader + 4);
  binChunk.copy(glb, binHeader + 8);
  return glb;
}

export function buildMaterialChannelsFixture() {
  const parts = [];
  const bufferViews = [];
  const positionView = appendBuffer(parts, bufferViews, floatBuffer([
    -0.9, -0.9, 0, 0.9, -0.9, 0, 0.9, 0.9, 0, -0.9, 0.9, 0,
  ]), { target: 34962 });
  const normalView = appendBuffer(parts, bufferViews, floatBuffer([
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
  ]), { target: 34962 });
  const tangentView = appendBuffer(parts, bufferViews, floatBuffer([
    1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1,
  ]), { target: 34962 });
  const uv0View = appendBuffer(parts, bufferViews, floatBuffer([
    0, 1, 1, 1, 1, 0, 0, 0,
  ]), { target: 34962 });
  const uv1View = appendBuffer(parts, bufferViews, floatBuffer([
    0, 1, 1, 1, 1, 0, 0, 0,
  ]), { target: 34962 });
  const indexView = appendBuffer(parts, bufferViews, uint16Buffer([0, 1, 2, 0, 2, 3]), { target: 34963 });

  const images = sourceImages();
  const imageJson = images.map((image) => ({
    name: image.name,
    bufferView: appendBuffer(parts, bufferViews, image.bytes),
    mimeType: 'image/png',
  }));
  const bin = Buffer.concat(parts);
  const primitive = (material) => ({
    attributes: { POSITION: 0, NORMAL: 1, TANGENT: 2, TEXCOORD_0: 3, TEXCOORD_1: 4 },
    indices: 5,
    material,
    mode: 4,
  });
  const materialNames = Object.keys(PANEL_CENTERS);
  const json = {
    asset: { version: '2.0', generator: 'kiln-render-service material-channels-v1' },
    scene: 0,
    scenes: [{ nodes: materialNames.map((_, index) => index) }],
    nodes: materialNames.map((name, index) => ({
      name: `${name}Panel`,
      mesh: index,
      translation: PANEL_CENTERS[name],
    })),
    meshes: materialNames.map((name, index) => ({ name: `${name}Mesh`, primitives: [primitive(index)] })),
    materials: [
      {
        name: 'AlbedoChecker',
        pbrMetallicRoughness: { baseColorTexture: { index: 0 }, metallicFactor: 0, roughnessFactor: 1 },
        doubleSided: true,
      },
      {
        name: 'NormalResponse',
        pbrMetallicRoughness: { baseColorFactor: [0.62, 0.62, 0.62, 1], metallicFactor: 0, roughnessFactor: 0.7 },
        normalTexture: { index: 1, scale: 1 },
        doubleSided: true,
      },
      {
        name: 'SharedOrmResponse',
        pbrMetallicRoughness: {
          baseColorFactor: [0.62, 0.62, 0.62, 1],
          metallicFactor: 1,
          roughnessFactor: 1,
          metallicRoughnessTexture: { index: 2 },
        },
        occlusionTexture: { index: 2, strength: 1 },
        doubleSided: true,
      },
      {
        name: 'AoResponse',
        pbrMetallicRoughness: { baseColorFactor: [0.72, 0.72, 0.72, 1], metallicFactor: 0, roughnessFactor: 0.9 },
        occlusionTexture: { index: 2, strength: 1 },
        doubleSided: true,
      },
      {
        name: 'EmissiveResponse',
        pbrMetallicRoughness: { baseColorFactor: [0.01, 0.01, 0.01, 1], metallicFactor: 0, roughnessFactor: 1 },
        emissiveTexture: { index: 3 },
        emissiveFactor: [1, 1, 1],
        doubleSided: true,
      },
      {
        name: 'AlphaResponse',
        pbrMetallicRoughness: { baseColorTexture: { index: 4 }, metallicFactor: 0, roughnessFactor: 0.8 },
        alphaMode: 'MASK',
        alphaCutoff: 0.5,
        doubleSided: true,
      },
    ],
    samplers: [{ magFilter: 9728, minFilter: 9728, wrapS: 33071, wrapT: 33071 }],
    textures: imageJson.map((_, index) => ({ sampler: 0, source: index })),
    images: imageJson,
    buffers: [{ byteLength: bin.length }],
    bufferViews,
    accessors: [
      { bufferView: positionView, componentType: 5126, count: 4, type: 'VEC3', min: [-0.9, -0.9, 0], max: [0.9, 0.9, 0] },
      { bufferView: normalView, componentType: 5126, count: 4, type: 'VEC3' },
      { bufferView: tangentView, componentType: 5126, count: 4, type: 'VEC4' },
      { bufferView: uv0View, componentType: 5126, count: 4, type: 'VEC2' },
      { bufferView: uv1View, componentType: 5126, count: 4, type: 'VEC2' },
      { bufferView: indexView, componentType: 5123, count: 6, type: 'SCALAR', min: [0], max: [3] },
    ],
  };
  const glb = encodeGlb(json, bin);
  const manifest = {
    schemaVersion: 1,
    fixtureId: 'material-channels-v1',
    glbSha256: `sha256:${createHash('sha256').update(glb).digest('hex')}`,
    render: {
      width: WIDTH,
      height: HEIGHT,
      lightingPresetId: 'neutral-studio-v1',
      cameras: [CAMERA],
    },
    regions: Object.fromEntries(Object.entries(PANEL_CENTERS).map(([name, center]) => [name, panelRegion(center)])),
  };
  return { glb, manifest };
}

async function main() {
  const outputDir = resolve(dirname(fileURLToPath(import.meta.url)), 'fixtures');
  const { glb, manifest } = buildMaterialChannelsFixture();
  await mkdir(outputDir, { recursive: true });
  await writeFile(resolve(outputDir, 'material-channels-v1.glb'), glb);
  await writeFile(resolve(outputDir, 'material-channels-v1.manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  process.stdout.write(`wrote material-channels-v1.glb (${glb.length} bytes, ${manifest.glbSha256})\n`);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) await main();

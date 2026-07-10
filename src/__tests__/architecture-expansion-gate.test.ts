/**
 * W8 G-ROOF-EXPAND provider-free ablation.
 *
 * Candidate shed/hip scaffolds and an explicit roof-UV remap stay test-only.
 * This file measures whether either candidate earns a public P2 surface over
 * the existing freeform primitives and face-local gable geometry.
 */
import { createHash } from 'node:crypto';

import { WebIO } from '@gltf-transform/core';
import { beforeAll, describe, expect, test } from 'bun:test';
import sharp from 'sharp';
import * as THREE from 'three';

import { createGableShell, type RidgeAxis } from '../architecture';
import {
  createAssetIntentV1,
  readSemanticMetadataV1,
  readSemanticMetadataV1FromExtras,
  stampSemanticMetadataV1,
  type AssetIntentV1,
  type SemanticLocalFrameV1,
} from '../contracts';
import { optimizeGlbBytes, renderSceneToGLB } from '../render';
import { loadTexture } from '../textures';

const PUBLIC_HELPER_MINIMUM_LIFT = 0.15;
const EPSILON = 1e-5;

type RoofType = 'shed' | 'hip';
type Arm = 'baseline' | 'candidate';

interface RoofGateCase {
  id: string;
  type: RoofType;
  ridgeAxis: RidgeAxis;
  spanX: number;
  spanZ: number;
  wallHeight: number;
  rise: number;
  overhang: number;
  transform: {
    position: readonly [number, number, number];
    rotation: readonly [number, number, number];
  };
}

interface FaceDefinition {
  id: string;
  role: string;
  vertices: readonly THREE.Vector3[];
}

interface BuiltRoofArm {
  root: THREE.Group;
  roof: THREE.Group;
  intent: AssetIntentV1;
  expectedFaces: readonly FaceDefinition[];
}

interface ArmMeasurement {
  id: string;
  structuralPass: boolean;
  faceCount: number;
  frameCount: number;
  validatorErrors: number;
  validatorWarnings: number;
  glbBytes: number;
  glbSha256: string;
  repeatGlbSha256: string;
  byteStable: boolean;
}

interface UvMeasurement {
  id: string;
  arm: Arm;
  directionalPass: boolean;
  initialValidatorErrors: number;
  initialValidatorWarnings: number;
  rebakeValidatorErrors: number;
  rebakeValidatorWarnings: number;
  initialGlbSha256: string;
  rebakedGlbSha256: string;
  texturedMaterials: number;
}

const ROOF_GATE_CORPUS = Object.freeze([
  {
    id: 'shed-ridge-x-wide',
    type: 'shed',
    ridgeAxis: 'x',
    spanX: 8,
    spanZ: 5,
    wallHeight: 3,
    rise: 1.4,
    overhang: 0.35,
    transform: { position: [0, 0, 0], rotation: [0, 0, 0] },
  },
  {
    id: 'shed-ridge-z-long',
    type: 'shed',
    ridgeAxis: 'z',
    spanX: 5,
    spanZ: 9,
    wallHeight: 3.2,
    rise: 1.1,
    overhang: 0.45,
    transform: { position: [2.2, 0.4, -3.1], rotation: [0.04, 0.61, -0.03] },
  },
  {
    id: 'shed-ridge-x-square',
    type: 'shed',
    ridgeAxis: 'x',
    spanX: 6,
    spanZ: 6,
    wallHeight: 2.7,
    rise: 2,
    overhang: 0.2,
    transform: { position: [-1.7, 0.2, 2.8], rotation: [-0.02, -0.37, 0.05] },
  },
  {
    id: 'shed-ridge-z-steep',
    type: 'shed',
    ridgeAxis: 'z',
    spanX: 4,
    spanZ: 7,
    wallHeight: 4.1,
    rise: 2.6,
    overhang: 0.6,
    transform: { position: [4.3, 1.1, 1.6], rotation: [0.06, 0.22, -0.04] },
  },
  {
    id: 'hip-ridge-x-wide',
    type: 'hip',
    ridgeAxis: 'x',
    spanX: 9,
    spanZ: 5,
    wallHeight: 3,
    rise: 1.8,
    overhang: 0.35,
    transform: { position: [0, 0, 0], rotation: [0, 0, 0] },
  },
  {
    id: 'hip-ridge-z-long',
    type: 'hip',
    ridgeAxis: 'z',
    spanX: 5,
    spanZ: 10,
    wallHeight: 3.4,
    rise: 2.1,
    overhang: 0.4,
    transform: { position: [-3.4, 0.5, -2.2], rotation: [0.03, 0.73, 0.02] },
  },
  {
    id: 'hip-ridge-x-square',
    type: 'hip',
    ridgeAxis: 'x',
    spanX: 6,
    spanZ: 6,
    wallHeight: 2.8,
    rise: 1.6,
    overhang: 0.25,
    transform: { position: [1.3, 0.3, 3.7], rotation: [-0.03, -0.48, 0.04] },
  },
  {
    id: 'hip-ridge-z-square',
    type: 'hip',
    ridgeAxis: 'z',
    spanX: 7,
    spanZ: 7,
    wallHeight: 3.6,
    rise: 2.4,
    overhang: 0.55,
    transform: { position: [3.8, 0.8, -1.4], rotation: [0.05, 0.31, -0.02] },
  },
] as const satisfies readonly RoofGateCase[]);

const UV_GATE_CORPUS = Object.freeze([
  { id: 'gable-uv-ridge-x', ridgeAxis: 'x', spanX: 8, spanZ: 5, rise: 1.7, overhang: 0.35 },
  { id: 'gable-uv-ridge-z', ridgeAxis: 'z', spanX: 5, spanZ: 8, rise: 1.7, overhang: 0.35 },
] as const);

const sha256 = (value: string | Uint8Array): string =>
  createHash('sha256').update(value).digest('hex');

function canonicalJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function semantic<T extends THREE.Object3D>(
  node: T,
  roles: readonly string[],
  frames: readonly SemanticLocalFrameV1[] = [],
): T {
  return stampSemanticMetadataV1(node, { roles, frames });
}

function vectorKey(value: THREE.Vector3): string {
  return value
    .toArray()
    .map((entry) => Math.round(entry * 1_000_000) / 1_000_000)
    .join(',');
}

function normalizedVertices(vertices: readonly THREE.Vector3[]): THREE.Vector3[] {
  const seen = new Set<string>();
  const copy = vertices
    .filter((vertex) => {
      const key = vectorKey(vertex);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((vertex) => vertex.clone());
  if (copy.length < 3) throw new TypeError('A roof face needs at least three unique vertices.');
  const normal = copy[1]!.clone().sub(copy[0]!).cross(copy[2]!.clone().sub(copy[0]!));
  if (normal.y < 0) copy.reverse();
  return copy;
}

function faceGeometry(vertices: readonly THREE.Vector3[]): THREE.BufferGeometry {
  const ordered = normalizedVertices(vertices);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      ordered.flatMap((vertex) => vertex.toArray()),
      3,
    ),
  );
  geometry.setAttribute(
    'uv',
    new THREE.Float32BufferAttribute(
      ordered.flatMap((vertex) => [vertex.x, vertex.z]),
      2,
    ),
  );
  geometry.setIndex(ordered.length === 3 ? [0, 1, 2] : [0, 1, 2, 0, 2, 3]);
  geometry.computeVertexNormals();
  return geometry;
}

function roofFaceDefinitions(spec: RoofGateCase): FaceDefinition[] {
  const halfX = spec.spanX / 2 + spec.overhang;
  const halfZ = spec.spanZ / 2 + spec.overhang;
  if (spec.type === 'shed') {
    return spec.ridgeAxis === 'x'
      ? [
          {
            id: 'surface',
            role: 'roof.shed.surface',
            vertices: [
              new THREE.Vector3(-halfX, spec.rise, -halfZ),
              new THREE.Vector3(halfX, spec.rise, -halfZ),
              new THREE.Vector3(halfX, 0, halfZ),
              new THREE.Vector3(-halfX, 0, halfZ),
            ],
          },
        ]
      : [
          {
            id: 'surface',
            role: 'roof.shed.surface',
            vertices: [
              new THREE.Vector3(-halfX, spec.rise, -halfZ),
              new THREE.Vector3(-halfX, spec.rise, halfZ),
              new THREE.Vector3(halfX, 0, halfZ),
              new THREE.Vector3(halfX, 0, -halfZ),
            ],
          },
        ];
  }

  if (spec.ridgeAxis === 'x') {
    const ridgeHalf = Math.max(0, halfX - halfZ);
    const ridgeLeft = new THREE.Vector3(-ridgeHalf, spec.rise, 0);
    const ridgeRight = new THREE.Vector3(ridgeHalf, spec.rise, 0);
    return [
      {
        id: 'negative',
        role: 'roof.hip.negative',
        vertices: [
          new THREE.Vector3(-halfX, 0, -halfZ),
          new THREE.Vector3(halfX, 0, -halfZ),
          ridgeRight,
          ridgeLeft,
        ],
      },
      {
        id: 'positive',
        role: 'roof.hip.positive',
        vertices: [
          new THREE.Vector3(halfX, 0, halfZ),
          new THREE.Vector3(-halfX, 0, halfZ),
          ridgeLeft,
          ridgeRight,
        ],
      },
      {
        id: 'left',
        role: 'roof.hip.left',
        vertices: [
          new THREE.Vector3(-halfX, 0, halfZ),
          new THREE.Vector3(-halfX, 0, -halfZ),
          ridgeLeft,
        ],
      },
      {
        id: 'right',
        role: 'roof.hip.right',
        vertices: [
          new THREE.Vector3(halfX, 0, -halfZ),
          new THREE.Vector3(halfX, 0, halfZ),
          ridgeRight,
        ],
      },
    ];
  }

  const ridgeHalf = Math.max(0, halfZ - halfX);
  const ridgeBack = new THREE.Vector3(0, spec.rise, -ridgeHalf);
  const ridgeFront = new THREE.Vector3(0, spec.rise, ridgeHalf);
  return [
    {
      id: 'left',
      role: 'roof.hip.left',
      vertices: [
        new THREE.Vector3(-halfX, 0, halfZ),
        new THREE.Vector3(-halfX, 0, -halfZ),
        ridgeBack,
        ridgeFront,
      ],
    },
    {
      id: 'right',
      role: 'roof.hip.right',
      vertices: [
        new THREE.Vector3(halfX, 0, -halfZ),
        new THREE.Vector3(halfX, 0, halfZ),
        ridgeFront,
        ridgeBack,
      ],
    },
    {
      id: 'negative',
      role: 'roof.hip.negative',
      vertices: [
        new THREE.Vector3(-halfX, 0, -halfZ),
        new THREE.Vector3(halfX, 0, -halfZ),
        ridgeBack,
      ],
    },
    {
      id: 'positive',
      role: 'roof.hip.positive',
      vertices: [
        new THREE.Vector3(halfX, 0, halfZ),
        new THREE.Vector3(-halfX, 0, halfZ),
        ridgeFront,
      ],
    },
  ];
}

function addShellEnvelope(root: THREE.Group, spec: RoofGateCase, material: THREE.Material): void {
  const thickness = 0.15;
  const walls = [
    [
      'front',
      new THREE.BoxGeometry(thickness, spec.wallHeight, spec.spanZ),
      [spec.spanX / 2, spec.wallHeight / 2, 0],
    ],
    [
      'back',
      new THREE.BoxGeometry(thickness, spec.wallHeight, spec.spanZ),
      [-spec.spanX / 2, spec.wallHeight / 2, 0],
    ],
    [
      'left',
      new THREE.BoxGeometry(spec.spanX, spec.wallHeight, thickness),
      [0, spec.wallHeight / 2, -spec.spanZ / 2],
    ],
    [
      'right',
      new THREE.BoxGeometry(spec.spanX, spec.wallHeight, thickness),
      [0, spec.wallHeight / 2, spec.spanZ / 2],
    ],
  ] as const;
  for (const [id, geometry, position] of walls) {
    const wall = semantic(new THREE.Mesh(geometry, material), [`wall.${id}`]);
    wall.name = `Wall_${id}`;
    wall.position.set(position[0], position[1], position[2]);
    root.add(wall);
  }
  const floor = semantic(
    new THREE.Mesh(new THREE.BoxGeometry(spec.spanX, 0.1, spec.spanZ), material),
    ['floor'],
  );
  floor.name = 'Floor';
  floor.position.y = -0.05;
  root.add(floor);
}

function candidateFrames(spec: RoofGateCase, face: FaceDefinition): SemanticLocalFrameV1[] {
  const ordered = normalizedVertices(face.vertices);
  const center = ordered
    .reduce((sum, vertex) => sum.add(vertex), new THREE.Vector3())
    .multiplyScalar(1 / ordered.length);
  const normal = ordered[1]!
    .clone()
    .sub(ordered[0]!)
    .cross(ordered[2]!.clone().sub(ordered[0]!))
    .normalize();
  const requestedRidge =
    spec.ridgeAxis === 'x' ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1);
  const ridge = requestedRidge
    .clone()
    .addScaledVector(normal, -requestedRidge.dot(normal))
    .normalize();
  // Match the public gable RoofFaceFrame's right-handed basis: X is ridge,
  // Y is outward normal, and Z is downhill, so X cross Y must equal Z.
  const downhill = ridge.clone().cross(normal).normalize();
  const rotation = new THREE.Quaternion()
    .setFromRotationMatrix(new THREE.Matrix4().makeBasis(ridge, normal, downhill))
    .normalize();
  return [
    {
      id: 'surface',
      translation: center.toArray(),
      rotation: rotation.toArray(),
    },
  ];
}

function buildRoofArm(spec: RoofGateCase, arm: Arm): BuiltRoofArm {
  const root = semantic(new THREE.Group(), [`architecture.shell.${spec.type}`]);
  root.name = `${arm}_${spec.id}`;
  root.position.set(...spec.transform.position);
  root.rotation.set(...spec.transform.rotation);
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xc8ad82, roughness: 0.9 });
  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x59616d, roughness: 0.82 });
  addShellEnvelope(root, spec, wallMaterial);

  const roof = semantic(new THREE.Group(), ['roof.assembly']);
  roof.name = 'Roof';
  roof.position.y = spec.wallHeight;
  root.add(roof);
  const expectedFaces = roofFaceDefinitions(spec);
  for (const face of expectedFaces) {
    const mesh = semantic(
      new THREE.Mesh(faceGeometry(face.vertices), roofMaterial),
      [face.role],
      arm === 'candidate' ? candidateFrames(spec, face) : [],
    );
    mesh.name = `Roof_${face.id}`;
    roof.add(mesh);
  }
  root.updateMatrixWorld(true);

  const halfRun = (spec.ridgeAxis === 'x' ? spec.spanZ : spec.spanX) / 2;
  const intent = createAssetIntentV1({
    category: 'architecture',
    architecture: {
      subtype: `${spec.type}-roof building`,
      enterable: false,
      footprint: { spanX: spec.spanX, spanZ: spec.spanZ },
      wallHeight: spec.wallHeight,
      roof: {
        type: spec.type,
        ridgeAxis: spec.ridgeAxis,
        rise: spec.rise,
        pitchDegrees: THREE.MathUtils.radToDeg(Math.atan2(spec.rise, halfRun)),
        overhang: spec.overhang,
        closedEnds: false,
      },
    },
  });
  return { root, roof, intent, expectedFaces };
}

function sceneFaceSignature(roof: THREE.Group): string[] {
  return roof.children
    .filter((node): node is THREE.Mesh => node instanceof THREE.Mesh)
    .map((mesh) => {
      const position = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
      const vertices = new Set<string>();
      for (let index = 0; index < position.count; index++) {
        vertices.add(
          vectorKey(
            new THREE.Vector3(position.getX(index), position.getY(index), position.getZ(index)),
          ),
        );
      }
      return [...vertices].sort().join('|');
    })
    .sort();
}

function expectedFaceSignature(faces: readonly FaceDefinition[]): string[] {
  return faces.map((face) => [...new Set(face.vertices.map(vectorKey))].sort().join('|')).sort();
}

function faceNormal(vertices: readonly THREE.Vector3[]): THREE.Vector3 {
  const ordered = normalizedVertices(vertices);
  return ordered[1]!
    .clone()
    .sub(ordered[0]!)
    .cross(ordered[2]!.clone().sub(ordered[0]!))
    .normalize();
}

function everyTriangleFacesUp(mesh: THREE.Mesh): boolean {
  const position = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
  const index = mesh.geometry.getIndex();
  const draw = index
    ? Array.from({ length: index.count }, (_, offset) => index.getX(offset))
    : Array.from({ length: position.count }, (_, offset) => offset);
  if (draw.length === 0 || draw.length % 3 !== 0) return false;
  for (let offset = 0; offset < draw.length; offset += 3) {
    const a = new THREE.Vector3().fromBufferAttribute(position, draw[offset]!);
    const b = new THREE.Vector3().fromBufferAttribute(position, draw[offset + 1]!);
    const c = new THREE.Vector3().fromBufferAttribute(position, draw[offset + 2]!);
    const normal = b.sub(a).cross(c.sub(a));
    if (!normal.toArray().every(Number.isFinite) || normal.lengthSq() <= EPSILON || normal.y <= 0) {
      return false;
    }
  }
  return true;
}

function frameMatchesFace(node: THREE.Object3D, face: FaceDefinition): boolean {
  const frames = readSemanticMetadataV1(node)?.frames ?? [];
  if (frames.length !== 1 || frames[0]?.id !== 'surface') return false;
  const frame = frames[0];
  const translation = new THREE.Vector3().fromArray(frame.translation);
  const rotation = new THREE.Quaternion().fromArray(frame.rotation);
  const expectedCenter = normalizedVertices(face.vertices)
    .reduce((sum, vertex) => sum.add(vertex), new THREE.Vector3())
    .multiplyScalar(1 / normalizedVertices(face.vertices).length);
  const expectedNormal = faceNormal(face.vertices);
  const frameNormal = new THREE.Vector3(0, 1, 0).applyQuaternion(rotation).normalize();
  return (
    translation.distanceTo(expectedCenter) <= EPSILON &&
    Math.abs(rotation.length() - 1) <= EPSILON &&
    frameNormal.dot(expectedNormal) >= 1 - EPSILON
  );
}

function structurePass(arm: BuiltRoofArm, armName: Arm): boolean {
  const meshes = arm.roof.children.filter((node): node is THREE.Mesh => node instanceof THREE.Mesh);
  if (
    sceneFaceSignature(arm.roof).join(';') !== expectedFaceSignature(arm.expectedFaces).join(';')
  ) {
    return false;
  }
  for (const [index, mesh] of meshes.entries()) {
    const roles = readSemanticMetadataV1(mesh)?.roles ?? [];
    if (!roles.some((role) => role.startsWith('roof.'))) return false;
    if (!everyTriangleFacesUp(mesh)) return false;
    const face = arm.expectedFaces[index];
    if (!face) return false;
    const frameCount = readSemanticMetadataV1(mesh)?.frames.length ?? 0;
    if (armName === 'baseline' ? frameCount !== 0 : !frameMatchesFace(mesh, face)) return false;
  }
  arm.root.updateMatrixWorld(true);
  const actualBounds = new THREE.Box3();
  for (const mesh of meshes) {
    const position = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let index = 0; index < position.count; index++) {
      actualBounds.expandByPoint(
        mesh.localToWorld(new THREE.Vector3().fromBufferAttribute(position, index)),
      );
    }
  }
  const expectedBounds = new THREE.Box3();
  for (const face of arm.expectedFaces) {
    for (const vertex of face.vertices) {
      expectedBounds.expandByPoint(arm.roof.localToWorld(vertex.clone()));
    }
  }
  return (
    !actualBounds.isEmpty() &&
    actualBounds.min.distanceTo(expectedBounds.min) <= EPSILON &&
    actualBounds.max.distanceTo(expectedBounds.max) <= EPSILON
  );
}

async function measureRoofArm(spec: RoofGateCase, armName: Arm): Promise<ArmMeasurement> {
  const arm = buildRoofArm(spec, armName);
  const first = await renderSceneToGLB(arm.root, { intent: arm.intent, optimize: 'off' });
  const repeat = await renderSceneToGLB(arm.root, { intent: arm.intent, optimize: 'off' });
  const document = await new WebIO().readBinary(first.bytes);
  const exportedFaces = document
    .getRoot()
    .listNodes()
    .filter((node) => node.getName().startsWith('Roof_'));
  const exportedFaceCount = exportedFaces.length;
  const frameCount = exportedFaces.reduce(
    (count, node) =>
      count + (readSemanticMetadataV1FromExtras(node.getExtras())?.frames.length ?? 0),
    0,
  );
  return {
    id: spec.id,
    structuralPass:
      structurePass(arm, armName) &&
      exportedFaceCount === arm.expectedFaces.length &&
      frameCount === (armName === 'candidate' ? arm.expectedFaces.length : 0) &&
      first.gltfValidation.issues.numErrors === 0,
    faceCount: arm.expectedFaces.length,
    frameCount,
    validatorErrors: first.gltfValidation.issues.numErrors,
    validatorWarnings: first.gltfValidation.issues.numWarnings,
    glbBytes: first.bytes.byteLength,
    glbSha256: sha256(first.bytes),
    repeatGlbSha256: sha256(repeat.bytes),
    byteStable: sha256(first.bytes) === sha256(repeat.bytes),
  };
}

async function directionalPatternMaterial(): Promise<THREE.MeshStandardMaterial> {
  const width = 2;
  const height = 4;
  const rows = [
    [230, 50, 45, 255],
    [230, 180, 45, 255],
    [55, 175, 90, 255],
    [55, 95, 220, 255],
  ] as const;
  const pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) pixels.set(rows[y]!, (y * width + x) * 4);
  }
  const encoded = await sharp(Buffer.from(pixels), {
    raw: { width, height, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toBuffer();
  const texture = await loadTexture(new Uint8Array(encoded), {
    usage: 'albedo',
    name: 'Roof_RidgeU_DownhillV_TestPattern',
  });
  texture.flipY = false;
  return new THREE.MeshStandardMaterial({ map: texture, color: 0xffffff, roughness: 0.8 });
}

function remapTopFaceUv(geometry: THREE.BufferGeometry): void {
  const position = geometry.getAttribute('position') as THREE.BufferAttribute;
  const normal = geometry.getAttribute('normal') as THREE.BufferAttribute;
  const uv = geometry.getAttribute('uv') as THREE.BufferAttribute;
  const xs: number[] = [];
  const zs: number[] = [];
  for (let index = 0; index < position.count; index++) {
    if (normal.getY(index) > 0.9) {
      xs.push(position.getX(index));
      zs.push(position.getZ(index));
    }
  }
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);
  for (let index = 0; index < position.count; index++) {
    if (normal.getY(index) <= 0.9) continue;
    uv.setXY(
      index,
      (position.getX(index) - minX) / (maxX - minX),
      1 - (position.getZ(index) - minZ) / (maxZ - minZ),
    );
  }
  uv.needsUpdate = true;
}

function correlation(left: readonly number[], right: readonly number[]): number {
  const leftMean = left.reduce((sum, value) => sum + value, 0) / left.length;
  const rightMean = right.reduce((sum, value) => sum + value, 0) / right.length;
  let numerator = 0;
  let leftSquare = 0;
  let rightSquare = 0;
  for (let index = 0; index < left.length; index++) {
    const a = left[index]! - leftMean;
    const b = right[index]! - rightMean;
    numerator += a * b;
    leftSquare += a * a;
    rightSquare += b * b;
  }
  return numerator / Math.sqrt(leftSquare * rightSquare);
}

async function inspectDirectionalUv(bytes: Uint8Array): Promise<{
  pass: boolean;
  texturedMaterials: number;
}> {
  const document = await new WebIO().readBinary(bytes);
  const texturedMaterials = document
    .getRoot()
    .listMaterials()
    .filter((material) => material.getBaseColorTexture() !== null).length;
  const roofNodes = document
    .getRoot()
    .listNodes()
    .filter((node) => node.getName().startsWith('Mesh_Roof_'));
  const passes = roofNodes.map((node) => {
    const primitive = node.getMesh()?.listPrimitives()[0];
    if (!primitive?.getMaterial()?.getBaseColorTexture()) return false;
    const positions = primitive?.getAttribute('POSITION')?.getArray();
    const normals = primitive?.getAttribute('NORMAL')?.getArray();
    const uvs = primitive?.getAttribute('TEXCOORD_0')?.getArray();
    if (!positions || !normals || !uvs) return false;
    const x: number[] = [];
    const z: number[] = [];
    const u: number[] = [];
    const v: number[] = [];
    for (let index = 0; index < normals.length / 3; index++) {
      if ((normals[index * 3 + 1] ?? -1) <= 0.9) continue;
      x.push(positions[index * 3] ?? 0);
      z.push(positions[index * 3 + 2] ?? 0);
      u.push(uvs[index * 2] ?? 0);
      v.push(uvs[index * 2 + 1] ?? 0);
    }
    return (
      x.length === 4 &&
      Math.abs(correlation(x, u)) > 1 - EPSILON &&
      Math.abs(correlation(z, v)) > 1 - EPSILON &&
      Math.abs(correlation(x, v)) < EPSILON &&
      Math.abs(correlation(z, u)) < EPSILON
    );
  });
  return { pass: roofNodes.length === 2 && passes.every(Boolean), texturedMaterials };
}

async function measureUvCase(
  spec: (typeof UV_GATE_CORPUS)[number],
  arm: Arm,
): Promise<UvMeasurement> {
  const wall = new THREE.MeshStandardMaterial({ color: 0xc8ad82, roughness: 0.9 });
  const roofMaterial = await directionalPatternMaterial();
  const shell = createGableShell(
    `Uv_${arm}_${spec.id}`,
    { wall, roof: roofMaterial },
    {
      spanX: spec.spanX,
      spanZ: spec.spanZ,
      wallHeight: 3,
      rise: spec.rise,
      overhang: spec.overhang,
      ridgeAxis: spec.ridgeAxis,
      enterable: false,
      closedEnds: true,
    },
  );
  if (arm === 'candidate') {
    for (const slope of shell.roof.slopes) {
      if (!(slope instanceof THREE.Mesh)) continue;
      slope.geometry = slope.geometry.clone();
      remapTopFaceUv(slope.geometry);
    }
  }
  const halfRun = (spec.ridgeAxis === 'x' ? spec.spanZ : spec.spanX) / 2;
  const intent = createAssetIntentV1({
    category: 'architecture',
    architecture: {
      subtype: 'gable building',
      enterable: false,
      footprint: { spanX: spec.spanX, spanZ: spec.spanZ },
      wallHeight: 3,
      roof: {
        type: 'gable',
        ridgeAxis: spec.ridgeAxis,
        rise: spec.rise,
        pitchDegrees: THREE.MathUtils.radToDeg(Math.atan2(spec.rise, halfRun)),
        overhang: spec.overhang,
        closedEnds: true,
      },
    },
  });
  const initial = await renderSceneToGLB(shell.root, { intent, optimize: 'off' });
  const rebaked = await optimizeGlbBytes(initial.bytes, {
    mode: 'palette',
    category: 'architecture',
  });
  if (!rebaked) throw new Error('Expected the architecture UV fixture to rebake.');
  const initialInspection = await inspectDirectionalUv(initial.bytes);
  const rebakedInspection = await inspectDirectionalUv(rebaked.bytes);
  return {
    id: spec.id,
    arm,
    directionalPass: initialInspection.pass && rebakedInspection.pass,
    initialValidatorErrors: initial.gltfValidation.issues.numErrors,
    initialValidatorWarnings: initial.gltfValidation.issues.numWarnings,
    rebakeValidatorErrors: rebaked.gltfValidation.issues.numErrors,
    rebakeValidatorWarnings: rebaked.gltfValidation.issues.numWarnings,
    initialGlbSha256: sha256(initial.bytes),
    rebakedGlbSha256: sha256(rebaked.bytes),
    texturedMaterials: Math.min(
      initialInspection.texturedMaterials,
      rebakedInspection.texturedMaterials,
    ),
  };
}

let baselineRoof: ArmMeasurement[];
let candidateRoof: ArmMeasurement[];
let uv: UvMeasurement[];

beforeAll(async () => {
  baselineRoof = [];
  candidateRoof = [];
  for (const spec of ROOF_GATE_CORPUS) {
    baselineRoof.push(await measureRoofArm(spec, 'baseline'));
    candidateRoof.push(await measureRoofArm(spec, 'candidate'));
  }
  uv = [];
  for (const spec of UV_GATE_CORPUS) {
    uv.push(await measureUvCase(spec, 'baseline'));
    uv.push(await measureUvCase(spec, 'candidate'));
  }
}, 40_000);

describe('W8 G-ROOF-EXPAND provider-free gate', () => {
  test('fixed shed/hip candidate fixtures do not beat correct freeform controls', () => {
    const baselinePasses = baselineRoof.filter((entry) => entry.structuralPass).length;
    const candidatePasses = candidateRoof.filter((entry) => entry.structuralPass).length;
    const lift = candidatePasses / candidateRoof.length - baselinePasses / baselineRoof.length;
    expect(sha256(canonicalJson(ROOF_GATE_CORPUS))).toBe(
      '8facf880d90fb1e4d1b47c525ac732139dfddd00296590f265dd388215b19567',
    );
    expect(baselinePasses).toBe(8);
    expect(candidatePasses).toBe(8);
    expect(lift).toBe(0);
    expect(lift).toBeLessThan(PUBLIC_HELPER_MINIMUM_LIFT);
    expect(baselineRoof.every((entry) => entry.frameCount === 0)).toBe(true);
    expect(candidateRoof.every((entry) => entry.frameCount === entry.faceCount)).toBe(true);
  });

  test('all scaffold arms are exact, byte-stable, and Khronos-clean', () => {
    for (const entry of [...baselineRoof, ...candidateRoof]) {
      expect(entry.structuralPass, entry.id).toBe(true);
      expect(entry.validatorErrors, entry.id).toBe(0);
      expect(entry.validatorWarnings, entry.id).toBe(0);
      expect(entry.byteStable, entry.id).toBe(true);
      expect(entry.glbSha256, entry.id).toBe(entry.repeatGlbSha256);
      expect(entry.glbBytes, entry.id).toBeGreaterThan(1_000);
    }
  });

  test('existing face-local gable UVs already run ridge-to-eave through export and rebake', () => {
    expect(sha256(canonicalJson(UV_GATE_CORPUS))).toBe(
      '061cad5800ed7122da9f8e7d85bb97b013831b317b93d99c841a8178b6fb7640',
    );
    expect(uv).toHaveLength(4);
    for (const entry of uv) {
      expect(entry.directionalPass, `${entry.arm}:${entry.id}`).toBe(true);
      expect(entry.initialValidatorErrors, `${entry.arm}:${entry.id}`).toBe(0);
      expect(entry.initialValidatorWarnings, `${entry.arm}:${entry.id}`).toBe(0);
      expect(entry.rebakeValidatorErrors, `${entry.arm}:${entry.id}`).toBe(0);
      expect(entry.rebakeValidatorWarnings, `${entry.arm}:${entry.id}`).toBe(0);
      expect(entry.texturedMaterials, `${entry.arm}:${entry.id}`).toBeGreaterThanOrEqual(1);
    }
    const baselinePasses = uv.filter(
      (entry) => entry.arm === 'baseline' && entry.directionalPass,
    ).length;
    const candidatePasses = uv.filter(
      (entry) => entry.arm === 'candidate' && entry.directionalPass,
    ).length;
    expect(baselinePasses).toBe(2);
    expect(candidatePasses).toBe(2);
    expect(candidatePasses / 2 - baselinePasses / 2).toBe(0);
  });

  test('pins the complete negative gate report', () => {
    const report = {
      schemaVersion: 1,
      experimentId: 'kiln.architecture.roof-expansion.provider-free.v1',
      providerCalls: 0,
      publicHelperMinimumLift: PUBLIC_HELPER_MINIMUM_LIFT,
      scaffold: {
        corpusSha256: sha256(canonicalJson(ROOF_GATE_CORPUS)),
        baselinePasses: baselineRoof.filter((entry) => entry.structuralPass).length,
        candidatePasses: candidateRoof.filter((entry) => entry.structuralPass).length,
        total: ROOF_GATE_CORPUS.length,
        lift: 0,
        candidateOwnFixtureFrames: candidateRoof.reduce((sum, entry) => sum + entry.frameCount, 0),
      },
      uv: {
        corpusSha256: sha256(canonicalJson(UV_GATE_CORPUS)),
        baselinePasses: uv.filter((entry) => entry.arm === 'baseline' && entry.directionalPass)
          .length,
        candidatePasses: uv.filter((entry) => entry.arm === 'candidate' && entry.directionalPass)
          .length,
        totalPerArm: UV_GATE_CORPUS.length,
        lift: 0,
      },
      delegatedHumanLabels: 0,
      gate: 'closed',
      gateReason:
        'Neither P2 candidate improves the fixed deterministic pass rate over the existing public surface; no public API expansion is justified.',
      artifactSha256: [...baselineRoof, ...candidateRoof].map((entry) => entry.glbSha256),
      uvArtifactSha256: uv.flatMap((entry) => [entry.initialGlbSha256, entry.rebakedGlbSha256]),
    } as const;
    expect(sha256(canonicalJson(report.artifactSha256))).toBe(
      'ca879d9107e2e750a7e9e61fba1d8ebc098e6390c774f47c4cddf1e61e7236ea',
    );
    expect(sha256(canonicalJson(report.uvArtifactSha256))).toBe(
      'b2f1b1f2d950ca0c7c550a18a5aaf6d1e696c9a1938dac682870b44aa47c8300',
    );
    expect(sha256(canonicalJson(report))).toBe(
      '782b8ed3bec42c7c4e90eb8d1739d588412a4c3b326adf6a8a44942757f6b559',
    );
  });
});

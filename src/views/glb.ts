/** GLB-native input adapter for the deterministic CPU geometry-flat renderer. */

import { Primitive, WebIO, type Accessor, type Material } from '@gltf-transform/core';
import {
  EXTMeshGPUInstancing,
  KHRMaterialsVariants,
  KHRTextureBasisu,
} from '@gltf-transform/extensions';
import { Matrix4, Quaternion, Vector3 } from 'three';

export const GLB_GEOMETRY_FLAT_REASON = {
  TEXTURE_SAMPLING_UNSUPPORTED: 'GLB_FLAT_TEXTURE_SAMPLING_UNSUPPORTED',
  KTX2_SAMPLING_UNSUPPORTED: 'GLB_FLAT_KTX2_SAMPLING_UNSUPPORTED',
  NON_TRIANGLE_PRIMITIVE_UNSUPPORTED: 'GLB_FLAT_NON_TRIANGLE_PRIMITIVE_UNSUPPORTED',
  SKIN_DEFORMATION_UNSUPPORTED: 'GLB_FLAT_SKIN_DEFORMATION_UNSUPPORTED',
  MORPH_TARGETS_UNSUPPORTED: 'GLB_FLAT_MORPH_TARGETS_UNSUPPORTED',
} as const;

export type GlbGeometryFlatReasonCode =
  (typeof GLB_GEOMETRY_FLAT_REASON)[keyof typeof GLB_GEOMETRY_FLAT_REASON];

const REASON_ORDER: readonly GlbGeometryFlatReasonCode[] = [
  GLB_GEOMETRY_FLAT_REASON.KTX2_SAMPLING_UNSUPPORTED,
  GLB_GEOMETRY_FLAT_REASON.TEXTURE_SAMPLING_UNSUPPORTED,
  GLB_GEOMETRY_FLAT_REASON.NON_TRIANGLE_PRIMITIVE_UNSUPPORTED,
  GLB_GEOMETRY_FLAT_REASON.SKIN_DEFORMATION_UNSUPPORTED,
  GLB_GEOMETRY_FLAT_REASON.MORPH_TARGETS_UNSUPPORTED,
];

export type GlbGeometryFlatErrorCode =
  | 'GLB_FLAT_PARSE_FAILED'
  | 'GLB_FLAT_NO_SCENE'
  | 'GLB_FLAT_NO_RENDERABLE_GEOMETRY'
  | 'GLB_FLAT_INVALID_INSTANCING';

export class GlbGeometryFlatError extends Error {
  constructor(
    readonly code: GlbGeometryFlatErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'GlbGeometryFlatError';
  }
}

interface FlatAttribute {
  array: ArrayLike<number>;
  itemSize: number;
  count: number;
}

interface FlatMaterial {
  color: { r: number; g: number; b: number };
  opacity: number;
  doubleSided: boolean;
}

interface FlatMesh {
  isMesh: true;
  visible: true;
  geometry: {
    getAttribute(name: string): FlatAttribute | undefined;
    index: FlatAttribute;
  };
  material: FlatMaterial;
  matrixWorld: { elements: readonly number[] };
}

export interface GlbGeometryFlatRoot {
  updateMatrixWorld(force?: boolean): void;
  traverse(callback: (value: unknown) => void): void;
}

export interface LoadedGlbGeometryFlatScene {
  root: GlbGeometryFlatRoot;
  reasonCodes: GlbGeometryFlatReasonCode[];
  meshCount: number;
  instanceCount: number;
}

const glbIO = (): WebIO =>
  new WebIO().registerExtensions([EXTMeshGPUInstancing, KHRMaterialsVariants, KHRTextureBasisu]);

export function geometryFlatTextureReasonCode(mimeType: string | null): GlbGeometryFlatReasonCode {
  return mimeType === 'image/ktx2'
    ? GLB_GEOMETRY_FLAT_REASON.KTX2_SAMPLING_UNSUPPORTED
    : GLB_GEOMETRY_FLAT_REASON.TEXTURE_SAMPLING_UNSUPPORTED;
}

function decodedAccessor(accessor: Accessor): Float64Array {
  const itemSize = accessor.getElementSize();
  const output = new Float64Array(accessor.getCount() * itemSize);
  const element: number[] = [];
  for (let index = 0; index < accessor.getCount(); index++) {
    accessor.getElement(index, element);
    for (let component = 0; component < itemSize; component++) {
      output[index * itemSize + component] = element[component]!;
    }
  }
  return output;
}

function triangleIndices(
  primitive: import('@gltf-transform/core').Primitive,
  vertexCount: number,
): Uint32Array | undefined {
  const sourceAccessor = primitive.getIndices();
  const source = sourceAccessor
    ? Array.from(decodedAccessor(sourceAccessor), (value) => Math.trunc(value))
    : Array.from({ length: vertexCount }, (_, index) => index);
  switch (primitive.getMode()) {
    case Primitive.Mode.TRIANGLES:
      return Uint32Array.from(source);
    case Primitive.Mode.TRIANGLE_STRIP: {
      const triangles: number[] = [];
      for (let index = 0; index + 2 < source.length; index++) {
        triangles.push(
          source[index]!,
          source[index + 1 + (index % 2)]!,
          source[index + 2 - (index % 2)]!,
        );
      }
      return Uint32Array.from(triangles);
    }
    case Primitive.Mode.TRIANGLE_FAN: {
      const triangles: number[] = [];
      for (let index = 1; index + 1 < source.length; index++) {
        triangles.push(source[index]!, source[index + 1]!, source[0]!);
      }
      return Uint32Array.from(triangles);
    }
    default:
      return undefined;
  }
}

function flatMaterial(material: Material | null): FlatMaterial {
  if (!material) {
    return { color: { r: 0.7, g: 0.7, b: 0.7 }, opacity: 1, doubleSided: false };
  }
  const [r, g, b, factorAlpha] = material.getBaseColorFactor();
  const alphaMode = material.getAlphaMode();
  const opacity =
    alphaMode === 'BLEND'
      ? factorAlpha
      : alphaMode === 'MASK' && factorAlpha < material.getAlphaCutoff()
        ? 0
        : 1;
  return {
    color: { r, g, b },
    opacity,
    doubleSided: material.getDoubleSided(),
  };
}

function noteMaterialTextures(
  material: Material | null,
  reasons: Set<GlbGeometryFlatReasonCode>,
): void {
  if (!material) return;
  const textures = [
    material.getBaseColorTexture(),
    material.getNormalTexture(),
    material.getMetallicRoughnessTexture(),
    material.getEmissiveTexture(),
    material.getOcclusionTexture(),
  ];
  for (const texture of textures) {
    if (texture) reasons.add(geometryFlatTextureReasonCode(texture.getMimeType()));
  }
}

function instanceMatrices(node: import('@gltf-transform/core').Node): {
  matrices: Matrix4[];
  count: number;
} {
  const world = new Matrix4().fromArray(node.getWorldMatrix());
  const extension = node.getExtension('EXT_mesh_gpu_instancing') as {
    getAttribute(name: string): Accessor | null;
    listAttributes(): Accessor[];
  } | null;
  if (!extension) return { matrices: [world], count: 1 };

  const attributes = extension.listAttributes();
  if (attributes.length === 0) {
    throw new GlbGeometryFlatError(
      'GLB_FLAT_INVALID_INSTANCING',
      `Node ${JSON.stringify(node.getName())} has EXT_mesh_gpu_instancing with no attributes.`,
    );
  }
  const count = attributes[0]!.getCount();
  if (attributes.some((attribute) => attribute.getCount() !== count)) {
    throw new GlbGeometryFlatError(
      'GLB_FLAT_INVALID_INSTANCING',
      `Node ${JSON.stringify(node.getName())} has mismatched EXT_mesh_gpu_instancing counts.`,
    );
  }
  const translations = extension.getAttribute('TRANSLATION');
  const rotations = extension.getAttribute('ROTATION');
  const scales = extension.getAttribute('SCALE');
  const translation: number[] = [];
  const rotation: number[] = [];
  const scale: number[] = [];
  const matrices: Matrix4[] = [];
  for (let index = 0; index < count; index++) {
    translations?.getElement(index, translation);
    rotations?.getElement(index, rotation);
    scales?.getElement(index, scale);
    const local = new Matrix4().compose(
      new Vector3(
        translations ? translation[0]! : 0,
        translations ? translation[1]! : 0,
        translations ? translation[2]! : 0,
      ),
      new Quaternion(
        rotations ? rotation[0]! : 0,
        rotations ? rotation[1]! : 0,
        rotations ? rotation[2]! : 0,
        rotations ? rotation[3]! : 1,
      ).normalize(),
      new Vector3(scales ? scale[0]! : 1, scales ? scale[1]! : 1, scales ? scale[2]! : 1),
    );
    matrices.push(world.clone().multiply(local));
  }
  return { matrices, count };
}

/** Parse final artifact bytes into the minimal scene contract consumed by the CPU rasterizer. */
export async function loadGlbGeometryFlatScene(
  bytes: Uint8Array,
): Promise<LoadedGlbGeometryFlatScene> {
  let document: import('@gltf-transform/core').Document;
  try {
    document = await glbIO().readBinary(Uint8Array.from(bytes));
  } catch (error) {
    throw new GlbGeometryFlatError(
      'GLB_FLAT_PARSE_FAILED',
      `Could not parse final GLB bytes: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const scene = document.getRoot().getDefaultScene() ?? document.getRoot().listScenes()[0];
  if (!scene) throw new GlbGeometryFlatError('GLB_FLAT_NO_SCENE', 'Final GLB has no scene.');

  const reasons = new Set<GlbGeometryFlatReasonCode>();
  const meshes: FlatMesh[] = [];
  let instanceCount = 0;
  const sceneNodes = new Set<import('@gltf-transform/core').Node>();
  const visit = (node: import('@gltf-transform/core').Node): void => {
    if (sceneNodes.has(node)) return;
    sceneNodes.add(node);
    for (const child of node.listChildren()) visit(child);
  };
  for (const child of scene.listChildren()) visit(child);

  for (const node of sceneNodes) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    if (node.getSkin()) reasons.add(GLB_GEOMETRY_FLAT_REASON.SKIN_DEFORMATION_UNSUPPORTED);
    const instances = instanceMatrices(node);
    instanceCount += instances.count;
    for (const primitive of mesh.listPrimitives()) {
      if (primitive.listTargets().length > 0) {
        reasons.add(GLB_GEOMETRY_FLAT_REASON.MORPH_TARGETS_UNSUPPORTED);
      }
      const positionAccessor = primitive.getAttribute('POSITION');
      if (positionAccessor?.getElementSize() !== 3) continue;
      const positions = decodedAccessor(positionAccessor);
      const indices = triangleIndices(primitive, positionAccessor.getCount());
      if (!indices) {
        reasons.add(GLB_GEOMETRY_FLAT_REASON.NON_TRIANGLE_PRIMITIVE_UNSUPPORTED);
        continue;
      }
      const material = primitive.getMaterial();
      noteMaterialTextures(material, reasons);
      const geometry = {
        getAttribute(name: string): FlatAttribute | undefined {
          return name === 'position'
            ? { array: positions, itemSize: 3, count: positionAccessor.getCount() }
            : undefined;
        },
        index: { array: indices, itemSize: 1, count: indices.length },
      };
      for (const matrix of instances.matrices) {
        meshes.push({
          isMesh: true,
          visible: true,
          geometry,
          material: flatMaterial(material),
          matrixWorld: { elements: [...matrix.elements] },
        });
      }
    }
  }
  if (meshes.length === 0) {
    throw new GlbGeometryFlatError(
      'GLB_FLAT_NO_RENDERABLE_GEOMETRY',
      'Final GLB contains no triangle geometry supported by the CPU fallback.',
    );
  }
  const root: GlbGeometryFlatRoot = {
    updateMatrixWorld() {},
    traverse(callback) {
      for (const mesh of meshes) callback(mesh);
    },
  };
  return {
    root,
    reasonCodes: REASON_ORDER.filter((reason) => reasons.has(reason)),
    meshCount: meshes.length,
    instanceCount,
  };
}

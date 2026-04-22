/**
 * Headless Kiln GLB Renderer
 *
 * Takes Kiln-generated code and produces a binary GLB Buffer.
 * Uses Three.js for scene construction (pure math, no WebGL) and
 * @gltf-transform/core for serialization. No browser APIs required.
 *
 * Ported from scripts/export-glb.ts - same bridge pattern, exposed as a
 * library function so core can be consumed by server/CLI without shelling
 * out.
 */

import * as THREE from 'three';
import { Document, WebIO } from '@gltf-transform/core';

import {
  buildSandboxGlobals,
  countTriangles,
} from './primitives';

// WebIO (not NodeIO) is used for GLB serialization so the same code path
// works in both Node and browser environments. writeBinary() only builds the
// GLB byte stream in memory - it never reads URIs - so the fetch/fs gap
// between WebIO and NodeIO is irrelevant on the write side. This lets the
// editor's exportGLB() and headless renderGLB() share one bridge.

// Gltf-transform type aliases for local readability.
type GtNode = import('@gltf-transform/core').Node;
type GtMesh = import('@gltf-transform/core').Mesh;
type GtMaterial = import('@gltf-transform/core').Material;
type GtBuffer = import('@gltf-transform/core').Buffer;

// Accessor.Type is typed as Record<string, AccessorType> which runs afoul of
// noUncheckedIndexedAccess. Use the literal strings directly - same values,
// no type noise.
type AccessorTypeStr = 'SCALAR' | 'VEC2' | 'VEC3' | 'VEC4' | 'MAT2' | 'MAT3' | 'MAT4';
const TYPE_SCALAR: AccessorTypeStr = 'SCALAR';
const TYPE_VEC2: AccessorTypeStr = 'VEC2';
const TYPE_VEC3: AccessorTypeStr = 'VEC3';
const TYPE_VEC4: AccessorTypeStr = 'VEC4';

// =============================================================================
// Execution
// =============================================================================

export interface KilnCodeMeta {
  name?: string;
  category?: string;
  tris?: number;
  [key: string]: unknown;
}

export interface ExecutedKilnCode {
  meta: KilnCodeMeta;
  root: THREE.Object3D;
  clips: THREE.AnimationClip[];
}

/**
 * Execute Kiln-generated code in a Function sandbox and return the built
 * Three.js scene plus animation clips. Throws on any runtime error in the
 * generated code.
 */
export function executeKilnCode(code: string): ExecutedKilnCode {
  if (!code || typeof code !== 'string') {
    throw new Error('executeKilnCode: code must be a non-empty string');
  }

  // Normalize line endings - Windows CRLF from LLM responses trips up the
  // Function constructor.
  const normalized = code.replace(/\r\n/g, '\n');

  const globals = buildSandboxGlobals();
  const globalNames = Object.keys(globals);
  const globalValues = Object.values(globals);

  const fn = new Function(
    ...globalNames,
    `${normalized}\nreturn { meta: typeof meta !== 'undefined' ? meta : {}, build, animate: typeof animate !== 'undefined' ? animate : null };`
  );

  const { meta, build, animate } = fn(...globalValues) as {
    meta: KilnCodeMeta;
    build: () => THREE.Object3D;
    animate: ((root: THREE.Object3D) => THREE.AnimationClip[] | undefined) | null;
  };

  if (typeof build !== 'function') {
    throw new Error('executeKilnCode: generated code did not define `build`');
  }

  const root = build();
  if (!(root instanceof THREE.Object3D)) {
    throw new Error('executeKilnCode: build() did not return a THREE.Object3D');
  }

  const clips = animate ? (animate(root) ?? []) : [];

  return { meta: meta ?? {}, root, clips };
}

// =============================================================================
// Three.js -> gltf-transform Bridge
// =============================================================================

function bridgeMaterial(
  doc: Document,
  threeMat: THREE.Material,
  cache: Map<THREE.Material, GtMaterial>
): GtMaterial {
  const cached = cache.get(threeMat);
  if (cached) return cached;

  const mat = doc.createMaterial(threeMat.name || undefined);

  if (threeMat instanceof THREE.MeshStandardMaterial) {
    mat.setBaseColorFactor([threeMat.color.r, threeMat.color.g, threeMat.color.b, threeMat.opacity]);
    mat.setRoughnessFactor(threeMat.roughness);
    mat.setMetallicFactor(threeMat.metalness);
    if (threeMat.emissive) {
      mat.setEmissiveFactor([threeMat.emissive.r, threeMat.emissive.g, threeMat.emissive.b]);
    }
    if (threeMat.transparent) {
      mat.setAlphaMode('BLEND');
    }
    if (threeMat.side === THREE.DoubleSide) {
      mat.setDoubleSided(true);
    }
  } else if (threeMat instanceof THREE.MeshLambertMaterial) {
    mat.setBaseColorFactor([threeMat.color.r, threeMat.color.g, threeMat.color.b, threeMat.opacity]);
    mat.setRoughnessFactor(1.0);
    mat.setMetallicFactor(0.0);
    if (threeMat.emissive) {
      mat.setEmissiveFactor([threeMat.emissive.r, threeMat.emissive.g, threeMat.emissive.b]);
    }
  } else if (threeMat instanceof THREE.MeshBasicMaterial) {
    mat.setBaseColorFactor([threeMat.color.r, threeMat.color.g, threeMat.color.b, threeMat.opacity]);
    mat.setRoughnessFactor(1.0);
    mat.setMetallicFactor(0.0);
  }

  cache.set(threeMat, mat);
  return mat;
}

function bridgeGeometry(
  doc: Document,
  buf: GtBuffer,
  geometry: THREE.BufferGeometry,
  material: GtMaterial,
  meshName: string
): GtMesh {
  if (!geometry.getAttribute('normal')) {
    geometry.computeVertexNormals();
  }

  const prim = doc.createPrimitive().setMaterial(material);

  const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
  if (posAttr) {
    prim.setAttribute(
      'POSITION',
      doc.createAccessor(meshName + '_pos')
        .setArray(new Float32Array(posAttr.array))
        .setType(TYPE_VEC3)
        .setBuffer(buf)
    );
  }

  const normAttr = geometry.getAttribute('normal') as THREE.BufferAttribute | undefined;
  if (normAttr) {
    prim.setAttribute(
      'NORMAL',
      doc.createAccessor(meshName + '_norm')
        .setArray(new Float32Array(normAttr.array))
        .setType(TYPE_VEC3)
        .setBuffer(buf)
    );
  }

  const uvAttr = geometry.getAttribute('uv') as THREE.BufferAttribute | undefined;
  if (uvAttr) {
    prim.setAttribute(
      'TEXCOORD_0',
      doc.createAccessor(meshName + '_uv')
        .setArray(new Float32Array(uvAttr.array))
        .setType(TYPE_VEC2)
        .setBuffer(buf)
    );
  }

  const indexAttr = geometry.getIndex();
  if (indexAttr) {
    prim.setIndices(
      doc.createAccessor(meshName + '_idx')
        .setArray(new Uint16Array(indexAttr.array))
        .setType(TYPE_SCALAR)
        .setBuffer(buf)
    );
  }

  return doc.createMesh(meshName).addPrimitive(prim);
}

function bridgeNode(
  doc: Document,
  buf: GtBuffer,
  threeObj: THREE.Object3D,
  matCache: Map<THREE.Material, GtMaterial>,
  nodeMap: Map<string, GtNode>
): GtNode {
  const gtNode = doc.createNode(threeObj.name || undefined);

  gtNode.setTranslation([threeObj.position.x, threeObj.position.y, threeObj.position.z]);
  gtNode.setRotation([
    threeObj.quaternion.x,
    threeObj.quaternion.y,
    threeObj.quaternion.z,
    threeObj.quaternion.w,
  ]);
  gtNode.setScale([threeObj.scale.x, threeObj.scale.y, threeObj.scale.z]);

  if (threeObj instanceof THREE.Mesh) {
    const threeMat = threeObj.material as THREE.Material;
    const gtMat = bridgeMaterial(doc, threeMat, matCache);
    const gtMesh = bridgeGeometry(doc, buf, threeObj.geometry, gtMat, threeObj.name || 'mesh');
    gtNode.setMesh(gtMesh);
  }

  if (threeObj.name) {
    nodeMap.set(threeObj.name, gtNode);
  }

  for (const child of threeObj.children) {
    const childNode = bridgeNode(doc, buf, child, matCache, nodeMap);
    gtNode.addChild(childNode);
  }

  return gtNode;
}

function bridgeAnimations(
  doc: Document,
  buf: GtBuffer,
  clips: THREE.AnimationClip[],
  nodeMap: Map<string, GtNode>,
  warnings: string[]
): void {
  for (const clip of clips) {
    const anim = doc.createAnimation(clip.name);

    for (const track of clip.tracks) {
      const dotIdx = track.name.lastIndexOf('.');
      const nodeName = track.name.substring(0, dotIdx);
      const property = track.name.substring(dotIdx + 1);

      const targetNode = nodeMap.get(nodeName);
      if (!targetNode) {
        warnings.push(`Animation target "${nodeName}" not found - skipped`);
        continue;
      }

      let targetPath: 'translation' | 'rotation' | 'scale';
      let valueType: AccessorTypeStr;
      if (property === 'position') {
        targetPath = 'translation';
        valueType = TYPE_VEC3;
      } else if (property === 'quaternion') {
        targetPath = 'rotation';
        valueType = TYPE_VEC4;
      } else if (property === 'scale') {
        targetPath = 'scale';
        valueType = TYPE_VEC3;
      } else {
        warnings.push(`Unsupported animation property "${property}" on "${nodeName}" - skipped`);
        continue;
      }

      const inputAcc = doc.createAccessor(clip.name + '_' + nodeName + '_input')
        .setArray(new Float32Array(track.times))
        .setType(TYPE_SCALAR)
        .setBuffer(buf);

      const outputAcc = doc.createAccessor(clip.name + '_' + nodeName + '_output')
        .setArray(new Float32Array(track.values))
        .setType(valueType)
        .setBuffer(buf);

      const sampler = doc.createAnimationSampler()
        .setInput(inputAcc)
        .setOutput(outputAcc)
        .setInterpolation('LINEAR');

      const channel = doc.createAnimationChannel()
        .setTargetNode(targetNode)
        .setTargetPath(targetPath)
        .setSampler(sampler);

      anim.addSampler(sampler);
      anim.addChannel(channel);
    }
  }
}

// =============================================================================
// Public API
// =============================================================================

export interface RenderResult {
  glb: Buffer;
  tris: number;
  meta: KilnCodeMeta;
  warnings: string[];
}

export interface RenderSceneResult {
  /** Binary GLB bytes, platform-agnostic (Buffer-compatible in Node). */
  bytes: Uint8Array;
  tris: number;
  warnings: string[];
}

export interface RenderSceneOptions {
  /** Name of the glTF scene. Defaults to 'Scene'. */
  sceneName?: string;
  /** Animation clips to bridge into the document. */
  clips?: THREE.AnimationClip[];
}

/**
 * Serialize a pre-built Three.js scene graph to a GLB byte stream.
 *
 * This is the shared bridge used by both `renderGLB(code)` (headless, re-
 * executes code) and the in-editor `exportGLB()` (uses the live scene).
 *
 * Works in both Node and browser - uses WebIO, which only touches network
 * APIs on the read side. The write side is pure bytes-in/bytes-out, so the
 * same function serializes identically on either platform. That unifies
 * the two historical paths (Three.js GLTFExporter in the editor vs.
 * gltf-transform bridge headlessly) into one canonical pipeline.
 *
 * Pure function: no file I/O, no globals, no WebGL.
 */
export async function renderSceneToGLB(
  root: THREE.Object3D,
  opts: RenderSceneOptions = {}
): Promise<RenderSceneResult> {
  const clips = opts.clips ?? [];
  const warnings: string[] = [];
  const tris = countTriangles(root);

  // Runtime-aware joint-name validation (follow-up #6 from the W1.1 spike
  // report). Walk the scene graph + animation tracks and surface any track
  // whose target name doesn't resolve to a scene node. Non-fatal - the GLB
  // still renders; agents iterating on code use these warnings to fix the
  // next iteration. Runs before the bridge so the descriptive "rename the
  // pivot" hint is first; the bridge also emits a briefer "target not
  // found - skipped" for each unresolved track (kept for compatibility).
  for (const w of inspectGeneratedAnimation(root, clips)) warnings.push(w);

  const doc = new Document();
  const buf = doc.createBuffer();
  const matCache = new Map<THREE.Material, GtMaterial>();
  const nodeMap = new Map<string, GtNode>();

  const rootNode = bridgeNode(doc, buf, root, matCache, nodeMap);
  doc.createScene(opts.sceneName ?? 'Scene').addChild(rootNode);

  if (clips.length > 0) {
    bridgeAnimations(doc, buf, clips, nodeMap, warnings);
  }

  const io = new WebIO();
  const bytes = await io.writeBinary(doc);

  return { bytes, tris, warnings };
}

/**
 * Execute Kiln code and serialize to a GLB Buffer.
 *
 * This is the main headless entry point. Takes the JS code Claude produces
 * (the same string shape `/api/kiln/generate` returns) and returns ready-
 * to-write bytes.
 *
 * Pure function: no file I/O, no globals, no WebGL.
 */
export async function renderGLB(code: string): Promise<RenderResult> {
  const { meta, root, clips } = executeKilnCode(code);
  const scene = await renderSceneToGLB(root, {
    sceneName: meta.name || 'Scene',
    clips,
  });

  return {
    glb: Buffer.from(scene.bytes),
    tris: scene.tris,
    meta: { ...meta, tris: scene.tris },
    warnings: scene.warnings,
  };
}

// =============================================================================
// Runtime-aware animation inspection
// =============================================================================

/**
 * Walk a Kiln-executed scene graph and its animation clips, and surface any
 * track whose target (e.g. `Joint_LeftWheel.rotation`) doesn't resolve to a
 * named node in the scene. These are *warnings*, not errors — the GLB still
 * renders fine, the track just does nothing. Agents iterating on generated
 * code use this signal to pick a real joint name on the next pass.
 *
 * Pure, side-effect free, safe to call without rendering.
 */
export function inspectGeneratedAnimation(
  root: THREE.Object3D,
  clips: THREE.AnimationClip[]
): string[] {
  const warnings: string[] = [];
  if (clips.length === 0) return warnings;

  const nodeNames = new Set<string>();
  root.traverse((obj) => {
    if (obj.name) nodeNames.add(obj.name);
  });

  for (const clip of clips) {
    for (const track of clip.tracks) {
      const dotIdx = track.name.lastIndexOf('.');
      if (dotIdx === -1) {
        warnings.push(`Track "${track.name}" is missing a node.property separator`);
        continue;
      }
      const nodeName = track.name.substring(0, dotIdx);
      const property = track.name.substring(dotIdx + 1);

      if (!nodeNames.has(nodeName)) {
        warnings.push(
          `Animation track "${clip.name}:${track.name}" targets unknown node "${nodeName}" — rename the pivot or fix the track`
        );
      }

      if (!['position', 'quaternion', 'scale'].includes(property)) {
        warnings.push(
          `Animation track "${clip.name}:${track.name}" uses unsupported property "${property}"`
        );
      }
    }
  }

  return warnings;
}

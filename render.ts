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
import { dedup } from '@gltf-transform/functions';

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
type GtTexture = import('@gltf-transform/core').Texture;

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
  /**
   * Count of primitive invocations from the agent-generated build() call.
   * Populated by executeKilnCode / renderGLB; agents don't author this.
   * Used to drive primitive-library prioritization from real usage.
   */
  primitiveUsage?: Record<string, number>;
  [key: string]: unknown;
}

export interface ExecutedKilnCode {
  meta: KilnCodeMeta;
  root: THREE.Object3D;
  clips: THREE.AnimationClip[];
  /**
   * Primitive-call counts gathered while executing build()/animate().
   * Identical to meta.primitiveUsage once renderGLB merges it in.
   */
  primitiveUsage: Record<string, number>;
}

/**
 * Execute Kiln-generated code in a Function sandbox and return the built
 * Three.js scene plus animation clips. Throws on any runtime error in the
 * generated code.
 */
/**
 * Execute generated Kiln code and return the built scene + clips.
 *
 * Async because CSG primitives (boolUnion, boolDiff, etc.) are WASM-backed
 * and async. Sync `build()` functions are supported transparently — if the
 * return value is a Promise it is awaited, otherwise it is used as-is.
 * Same for `animate()`.
 */
export async function executeKilnCode(code: string): Promise<ExecutedKilnCode> {
  if (!code || typeof code !== 'string') {
    throw new Error('executeKilnCode: code must be a non-empty string');
  }

  // Normalize line endings - Windows CRLF from LLM responses trips up the
  // Function constructor.
  const normalized = code.replace(/\r\n/g, '\n');

  const primitiveUsage: Record<string, number> = {};
  const globals = buildSandboxGlobals(primitiveUsage);
  const globalNames = Object.keys(globals);
  const globalValues = Object.values(globals);

  const fn = new Function(
    ...globalNames,
    `${normalized}\nreturn { meta: typeof meta !== 'undefined' ? meta : {}, build, animate: typeof animate !== 'undefined' ? animate : null };`
  );

  const { meta, build, animate } = fn(...globalValues) as {
    meta: KilnCodeMeta;
    build: () => THREE.Object3D | Promise<THREE.Object3D>;
    animate:
      | ((root: THREE.Object3D) =>
          | THREE.AnimationClip[]
          | undefined
          | Promise<THREE.AnimationClip[] | undefined>)
      | null;
  };

  if (typeof build !== 'function') {
    throw new Error('executeKilnCode: generated code did not define `build`');
  }

  const root = await build();
  // Duck-typed check — the kiln sandbox uses `new Function(...)`, which under
  // bun creates an isolated module realm. `new THREE.X()` inside the sandbox
  // produces objects whose constructor is a *different* class object from the
  // THREE imported here, so `instanceof THREE.Object3D` returns false.
  // Three.js sets `.isObject3D = true` on the prototype for exactly this case.
  if (!(root as { isObject3D?: boolean })?.isObject3D) {
    throw new Error('executeKilnCode: build() did not return a THREE.Object3D');
  }

  const clips = animate ? ((await animate(root)) ?? []) : [];

  return { meta: meta ?? {}, root, clips, primitiveUsage };
}

// =============================================================================
// Three.js -> gltf-transform Bridge
// =============================================================================

function bridgeMaterial(
  doc: Document,
  threeMat: THREE.Material,
  cache: Map<THREE.Material, GtMaterial>,
  textureCache: Map<THREE.Texture, GtTexture>
): GtMaterial {
  const cached = cache.get(threeMat);
  if (cached) return cached;

  const mat = doc.createMaterial(threeMat.name || undefined);

  // Duck-typed material checks — see executeKilnCode for the rationale.
  // Sandbox-created materials are different class instances of the same
  // module, so `.isXMaterial` is the only reliable identity test.
  const matFlags = threeMat as unknown as {
    isMeshStandardMaterial?: boolean;
    isMeshLambertMaterial?: boolean;
    isMeshBasicMaterial?: boolean;
  };
  if (matFlags.isMeshStandardMaterial) {
    const stdMat = threeMat as THREE.MeshStandardMaterial;
    mat.setBaseColorFactor([stdMat.color.r, stdMat.color.g, stdMat.color.b, stdMat.opacity]);
    mat.setRoughnessFactor(stdMat.roughness);
    mat.setMetallicFactor(stdMat.metalness);
    if (stdMat.emissive) {
      mat.setEmissiveFactor([stdMat.emissive.r, stdMat.emissive.g, stdMat.emissive.b]);
    }
    if (stdMat.transparent) {
      mat.setAlphaMode('BLEND');
    }
    if (stdMat.side === THREE.DoubleSide) {
      mat.setDoubleSided(true);
    }
    // PBR texture slots (Wave 3B)
    if (stdMat.map) {
      const t = bridgeTexture(doc, stdMat.map, textureCache);
      if (t) mat.setBaseColorTexture(t);
    }
    if (stdMat.normalMap) {
      const t = bridgeTexture(doc, stdMat.normalMap, textureCache);
      if (t) mat.setNormalTexture(t);
    }
    // metallic + roughness live in one glTF texture (R=unused, G=rough, B=metal).
    // If the agent used separate Three.js maps we emit the roughness one as
    // the combined channel — the common case is a single combined map anyway.
    const mrSource = stdMat.roughnessMap ?? stdMat.metalnessMap;
    if (mrSource) {
      const t = bridgeTexture(doc, mrSource, textureCache);
      if (t) mat.setMetallicRoughnessTexture(t);
    }
    if (stdMat.emissiveMap) {
      const t = bridgeTexture(doc, stdMat.emissiveMap, textureCache);
      if (t) mat.setEmissiveTexture(t);
    }
    if (stdMat.aoMap) {
      const t = bridgeTexture(doc, stdMat.aoMap, textureCache);
      if (t) mat.setOcclusionTexture(t);
      mat.setOcclusionStrength(stdMat.aoMapIntensity ?? 1);
    }
  } else if (matFlags.isMeshLambertMaterial) {
    const lambMat = threeMat as THREE.MeshLambertMaterial;
    mat.setBaseColorFactor([lambMat.color.r, lambMat.color.g, lambMat.color.b, lambMat.opacity]);
    mat.setRoughnessFactor(1.0);
    mat.setMetallicFactor(0.0);
    if (lambMat.emissive) {
      mat.setEmissiveFactor([lambMat.emissive.r, lambMat.emissive.g, lambMat.emissive.b]);
    }
  } else if (matFlags.isMeshBasicMaterial) {
    const basicMat = threeMat as THREE.MeshBasicMaterial;
    mat.setBaseColorFactor([basicMat.color.r, basicMat.color.g, basicMat.color.b, basicMat.opacity]);
    mat.setRoughnessFactor(1.0);
    mat.setMetallicFactor(0.0);
  }

  cache.set(threeMat, mat);
  return mat;
}

/**
 * Bridge a Three.js Texture to a gltf-transform Texture.
 *
 * Prefers `userData.encoded` (raw PNG/JPG bytes from loadTexture) so we
 * don't re-encode. Falls back to null if nothing is encoded — procedural
 * DataTextures without encoded bytes aren't exportable yet (requires
 * runtime PNG encoding, which we'll wire in Wave 3D via sharp).
 */
function bridgeTexture(
  doc: Document,
  threeTex: THREE.Texture,
  cache: Map<THREE.Texture, GtTexture>
): GtTexture | null {
  const cached = cache.get(threeTex);
  if (cached) return cached;

  const encoded = (threeTex.userData as Record<string, unknown>)['encoded'] as
    | { mime: string; bytes: Uint8Array }
    | undefined;
  if (!encoded) return null;

  const t = doc.createTexture(threeTex.name || 'texture');
  t.setMimeType(encoded.mime);
  t.setImage(encoded.bytes);
  cache.set(threeTex, t);
  return t;
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
  nodeMap: Map<string, GtNode>,
  meshCache: Map<string, GtMesh>,
  texCache: Map<THREE.Texture, GtTexture>
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

  if ((threeObj as { isMesh?: boolean }).isMesh) {
    const threeMesh = threeObj as THREE.Mesh;
    const threeMat = threeMesh.material as THREE.Material;
    const gtMat = bridgeMaterial(doc, threeMat, matCache, texCache);

    // Key the mesh cache by (geometry ref, material ref) so createInstance
    // (same geo + mat as source) produces a GLB-level mesh instance: a
    // single Mesh referenced by multiple Nodes. Cuts duplicated accessors
    // for wheels, bolts, fence posts, etc.
    const cacheKey = `${threeMesh.geometry.uuid}__${threeMat.uuid}`;
    let gtMesh = meshCache.get(cacheKey);
    if (!gtMesh) {
      gtMesh = bridgeGeometry(doc, buf, threeMesh.geometry, gtMat, threeMesh.name || 'mesh');
      meshCache.set(cacheKey, gtMesh);
    }
    gtNode.setMesh(gtMesh);
  }

  if (threeObj.name) {
    nodeMap.set(threeObj.name, gtNode);
  }

  for (const child of threeObj.children) {
    const childNode = bridgeNode(doc, buf, child, matCache, nodeMap, meshCache, texCache);
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
  /**
   * Run gltf-transform dedup() before serializing. Default true. Set false
   * to inspect raw bridge output for debugging.
   */
  dedup?: boolean;
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
  for (const w of inspectSceneStructure(root)) warnings.push(w);

  const doc = new Document();
  const buf = doc.createBuffer();
  const matCache = new Map<THREE.Material, GtMaterial>();
  const meshCache = new Map<string, GtMesh>();
  const texCache = new Map<THREE.Texture, GtTexture>();
  const nodeMap = new Map<string, GtNode>();

  const rootNode = bridgeNode(doc, buf, root, matCache, nodeMap, meshCache, texCache);
  doc.createScene(opts.sceneName ?? 'Scene').addChild(rootNode);

  if (clips.length > 0) {
    bridgeAnimations(doc, buf, clips, nodeMap, warnings);
  }

  // Dedupe accessors/materials/meshes so instanced parts (4 wheels, 10 posts,
  // 12 windows) share a single underlying resource in the GLB. Cuts file
  // size on instancing-heavy assets; no-op on unique-geometry scenes.
  if (opts.dedup !== false) {
    try {
      await doc.transform(dedup());
    } catch (err) {
      warnings.push(`dedup transform failed: ${err instanceof Error ? err.message : String(err)}`);
    }
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
  const { meta, root, clips, primitiveUsage } = await executeKilnCode(code);
  const scene = await renderSceneToGLB(root, {
    sceneName: meta.name || 'Scene',
    clips,
  });

  return {
    glb: Buffer.from(scene.bytes),
    tris: scene.tris,
    meta: { ...meta, tris: scene.tris, primitiveUsage },
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

// =============================================================================
// Runtime structural validators (stray planes, floating parts)
// =============================================================================

interface MeshStats {
  name: string;
  triCount: number;
  isPlaneGeo: boolean;
  center: THREE.Vector3;
  size: THREE.Vector3;
  box: THREE.Box3;
}

function collectMeshStats(root: THREE.Object3D): MeshStats[] {
  root.updateMatrixWorld(true);
  const out: MeshStats[] = [];
  root.traverse((obj) => {
    if (!(obj as { isMesh?: boolean }).isMesh) return;
    const meshObj = obj as THREE.Mesh;
    const geo = meshObj.geometry;
    if (!geo) return;

    const idx = geo.getIndex();
    const tri = idx ? idx.count / 3 : (geo.getAttribute('position')?.count ?? 0) / 3;

    const box = new THREE.Box3().setFromObject(obj);
    if (!isFinite(box.min.x) || !isFinite(box.max.x)) {
      return;
    }
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);

    out.push({
      name: obj.name || '(unnamed)',
      triCount: Math.floor(tri),
      isPlaneGeo: geo.type === 'PlaneGeometry',
      center,
      size,
      box,
    });
  });
  return out;
}

/**
 * Detects two structural failure modes observed in real overnight runs:
 *
 * 1. **Stray plane at origin** — a 2-triangle `PlaneGeometry` mesh whose
 *    world-space bbox centroid sits within 2cm of world origin. This is
 *    what happens when the model reaches for `planeGeo` as a decal (red
 *    star, stamp, hull number) and forgets to position it on the host
 *    surface. Fix: move the decal into place, or switch to `decalBox`.
 * 2. **Floating part** — a mesh whose world-space bbox has no overlap
 *    (with a 2cm tolerance) with any other mesh in the scene. Fix: move
 *    the mesh so it contacts its intended parent surface.
 *
 * Emits strings compatible with the existing `warnings` channel on
 * `RenderResult`. `_direct-generate.ts` threshold-checks these to trigger
 * a single corrective retry.
 */
export function inspectSceneStructure(root: THREE.Object3D): string[] {
  const warnings: string[] = [];
  const meshes = collectMeshStats(root);
  if (meshes.length === 0) return warnings;

  const STRAY_CENTROID_TOL = 0.02;
  const FLOATING_EXPAND = 0.02;
  const DECAL_EXTENT_MAX = 0.5; // anything smaller than 50cm fits decal profile

  for (const m of meshes) {
    if (!m.isPlaneGeo) continue;
    if (m.triCount > 2) continue;
    if (m.size.length() > DECAL_EXTENT_MAX) continue;
    if (m.center.length() < STRAY_CENTROID_TOL) {
      warnings.push(
        `Stray plane "${m.name}" at world origin (centroid ≈ [0,0,0]). Replace planeGeo with decalBox and position on a host surface, or move this mesh into place.`,
      );
    }
  }

  if (meshes.length > 1) {
    const floaters: string[] = [];
    for (let i = 0; i < meshes.length; i++) {
      const a = meshes[i]!;
      const ax = a.box.clone().expandByScalar(FLOATING_EXPAND);
      let overlapsAny = false;
      for (let j = 0; j < meshes.length; j++) {
        if (i === j) continue;
        const b = meshes[j]!;
        if (ax.intersectsBox(b.box)) {
          overlapsAny = true;
          break;
        }
      }
      if (!overlapsAny) floaters.push(a.name);
    }
    if (floaters.length > 0) {
      warnings.push(
        `Floating parts (no mesh overlap with any sibling, 2cm tol): ${floaters.join(', ')}. Move these so their bbox contacts a parent/surface mesh.`,
      );
    }
  }

  return warnings;
}

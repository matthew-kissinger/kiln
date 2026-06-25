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
  dedup,
  palette,
  flatten,
  join,
  weld,
  prune,
  mergeDocuments,
} from '@gltf-transform/functions';

import { buildSlotIndex, chooseSlot, hexToLinearRgb, type SnapSlot } from './palette-snap';

import { buildSandboxGlobals, countTriangles } from './primitives';
import {
  collectGlbMetrics,
  gradeInstanceability,
  type InstanceabilityGrade,
  type InstanceabilityMetrics,
  type InstanceabilityReport,
} from './metrics';

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
type GtScene = import('@gltf-transform/core').Scene;

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

/**
 * Scene-placement role the agent declares in its `meta` block. Drives composer
 * layout (wonders anchor + scale up, fill scatters, ground is the base, vehicles
 * snap to roads) and Kiln City density budgeting. Semantic — cannot be recomputed
 * from GLB bytes, so it travels in provenance. See plan/05-product-depth.md §3.4.
 */
export type AssetRole = 'ground' | 'building' | 'wonder' | 'poi' | 'prop' | 'fill' | 'vehicle';

export interface KilnCodeMeta {
  name?: string;
  category?: string;
  /** Scene-placement role (agent-declared). Drives composer layout + city budgeting. */
  role?: AssetRole;
  tris?: number;
  /**
   * Count of primitive invocations from the agent-generated build() call.
   * Populated by executeKilnCode / renderGLB; agents don't author this.
   * Used to drive primitive-library prioritization from real usage.
   */
  primitiveUsage?: Record<string, number>;
  /**
   * Instanceability metrics measured against the post-dedup() glTF Document.
   * Informational only — never a gate. Populated by renderGLB / renderSceneToGLB.
   */
  instanceability?: InstanceabilityReport;
  /**
   * Convenience copy of {@link KilnCodeMeta.instanceability}.grade (A–F),
   * auto-filled at bake so consumers read the tier without re-deriving it.
   */
  tier?: InstanceabilityGrade;
  /** Set if metric computation threw; the GLB is still valid. */
  metricsError?: string;
  /** Set when an opt-in consolidation pass ran (optimize !== 'off'). */
  optimize?: OptimizeSummary;
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
    `${normalized}\nreturn { meta: typeof meta !== 'undefined' ? meta : {}, build, animate: typeof animate !== 'undefined' ? animate : null };`,
  );

  const { meta, build, animate } = fn(...globalValues) as {
    meta: KilnCodeMeta;
    build: () => THREE.Object3D | Promise<THREE.Object3D>;
    animate:
      | ((
          root: THREE.Object3D,
        ) => THREE.AnimationClip[] | undefined | Promise<THREE.AnimationClip[] | undefined>)
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
  textureCache: Map<THREE.Texture, GtTexture>,
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
    mat.setBaseColorFactor([
      basicMat.color.r,
      basicMat.color.g,
      basicMat.color.b,
      basicMat.opacity,
    ]);
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
  cache: Map<THREE.Texture, GtTexture>,
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
  meshName: string,
): GtMesh {
  if (!geometry.getAttribute('normal')) {
    geometry.computeVertexNormals();
  }

  const prim = doc.createPrimitive().setMaterial(material);

  const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
  if (posAttr) {
    prim.setAttribute(
      'POSITION',
      doc
        .createAccessor(meshName + '_pos')
        .setArray(new Float32Array(posAttr.array))
        .setType(TYPE_VEC3)
        .setBuffer(buf),
    );
  }

  const normAttr = geometry.getAttribute('normal') as THREE.BufferAttribute | undefined;
  if (normAttr) {
    prim.setAttribute(
      'NORMAL',
      doc
        .createAccessor(meshName + '_norm')
        .setArray(new Float32Array(normAttr.array))
        .setType(TYPE_VEC3)
        .setBuffer(buf),
    );
  }

  const uvAttr = geometry.getAttribute('uv') as THREE.BufferAttribute | undefined;
  if (uvAttr) {
    prim.setAttribute(
      'TEXCOORD_0',
      doc
        .createAccessor(meshName + '_uv')
        .setArray(new Float32Array(uvAttr.array))
        .setType(TYPE_VEC2)
        .setBuffer(buf),
    );
  }

  const indexAttr = geometry.getIndex();
  if (indexAttr) {
    prim.setIndices(
      doc
        .createAccessor(meshName + '_idx')
        .setArray(new Uint16Array(indexAttr.array))
        .setType(TYPE_SCALAR)
        .setBuffer(buf),
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
  texCache: Map<THREE.Texture, GtTexture>,
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
  warnings: string[],
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

      const inputAcc = doc
        .createAccessor(clip.name + '_' + nodeName + '_input')
        .setArray(new Float32Array(track.times))
        .setType(TYPE_SCALAR)
        .setBuffer(buf);

      const outputAcc = doc
        .createAccessor(clip.name + '_' + nodeName + '_output')
        .setArray(new Float32Array(track.values))
        .setType(valueType)
        .setBuffer(buf);

      const sampler = doc
        .createAnimationSampler()
        .setInput(inputAcc)
        .setOutput(outputAcc)
        .setInterpolation('LINEAR');

      const channel = doc
        .createAnimationChannel()
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

/**
 * Bake-time material-consolidation mode (opt-in, default off).
 *   - `off`     — today's output, byte-identical across every consumer.
 *   - `auto`    — grade-aware: runs `palette` only when it would actually act
 *                 (>= PALETTE_MIN distinct materials — i.e. the asset is grade
 *                 C/D/F from material sprawl); below that it is a no-op, byte-
 *                 identical to `off`. The default grade-lift lever for the agent
 *                 path: lean assets stay untouched, sprawling heroes collapse.
 *   - `palette` — merge distinct flat-color materials into one palette material
 *                 + palette texture (`palette → weld → prune`). Node graph,
 *                 named pivots, and animations are fully preserved, so it is safe
 *                 for animated assets + Kiln City behaviors. Lifts the grade by
 *                 collapsing the material count (the grade's primary axis).
 *   - `full`    — `palette` plus `flatten → join` to also cut draw calls. STATIC
 *                 assets only: auto-degrades to `palette` when the Document has
 *                 animations or skins (flatten/join must not disturb a rig).
 * See docs/kiln-material-consolidation-cycle.md (Move 1).
 */
export type OptimizeMode = 'off' | 'auto' | 'palette' | 'full';

/** What a consolidation pass did (recorded in provenance / render.meta). */
export interface OptimizeSummary {
  /** The mode actually applied (may differ from the request after auto-degrade). */
  mode: 'palette' | 'full';
  materialsBefore: number;
  materialsAfter: number;
  drawsBefore: number;
  drawsAfter: number;
}

export interface RenderSceneResult {
  /** Binary GLB bytes, platform-agnostic (Buffer-compatible in Node). */
  bytes: Uint8Array;
  tris: number;
  warnings: string[];
  /** Post-dedup (and post-optimize, when enabled) instanceability report
   *  (informational). Undefined if it threw. */
  instanceability?: InstanceabilityReport;
  /** Set if metric computation threw; bytes are still valid. */
  metricsError?: string;
  /** Set when an opt-in consolidation pass ran (optimize !== 'off'). */
  optimize?: OptimizeSummary;
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
  /** Asset category, threaded into the instanceability grade context. */
  category?: string;
  /**
   * Opt-in material consolidation, applied after dedup. Defaults to the
   * `KILN_BAKE_OPTIMIZE` env (else `off`). `off` is byte-identical to today.
   * See {@link OptimizeMode}.
   */
  optimize?: OptimizeMode;
}

/** Minimum distinct material-value blocks before palette() generates a texture.
 *  Below this it is a no-op (an asset with very few materials is already cheap). */
const PALETTE_MIN = 5;

/** Resolve the effective optimize mode: explicit option wins, else the env, else off. */
function resolveOptimize(opt?: OptimizeMode): OptimizeMode {
  if (opt) return opt;
  const env = process.env['KILN_BAKE_OPTIMIZE'];
  return env === 'auto' || env === 'palette' || env === 'full' ? env : 'off';
}

/**
 * Run the opt-in consolidation transforms on a baked Document, in place.
 *
 * `palette` collapses distinct untextured flat-color materials into one palette
 * material + a small palette texture (textured materials pass through untouched);
 * `weld` + `prune` clean up. `full` adds `flatten → join` to also reduce draws,
 * but ONLY for static assets — if the Document carries animations or skins it
 * auto-degrades to `palette` so a rig is never disturbed (flatten leaves animated
 * nodes + skeletons in place by design, and join({keepNamed:true}) never merges a
 * named pivot, but degrading is the belt-and-braces guarantee). `prune` keeps
 * empty leaf nodes + extras so named pivots that Kiln City behaviors target by
 * name survive. palette groups by alpha mode, so opaque + the one glass slot stay
 * distinct materials (transparency is never flattened into opaque).
 *
 * Returns what it did; throws are the caller's to handle (the GLB is otherwise
 * valid). Pure w.r.t. inputs other than the mutated Document.
 */
async function consolidateMaterials(
  doc: Document,
  mode: 'palette' | 'full',
): Promise<OptimizeSummary> {
  const before = collectGlbMetrics(doc);
  const root = doc.getRoot();
  const animatedOrSkinned = root.listAnimations().length > 0 || root.listSkins().length > 0;
  const effective: 'palette' | 'full' = mode === 'full' && animatedOrSkinned ? 'palette' : mode;

  const steps = [palette({ min: PALETTE_MIN })];
  if (effective === 'full') {
    // flatten() leaves skeletons + animation-targeted nodes in place; join keeps
    // named meshes/nodes intact so pivots survive. Both only run on static assets.
    steps.push(flatten(), join({ keepNamed: true }));
  }
  steps.push(weld(), prune({ keepLeaves: true, keepExtras: true }));

  await doc.transform(...steps);

  const after = collectGlbMetrics(doc);
  return {
    mode: effective,
    materialsBefore: before.uniqueMaterials,
    materialsAfter: after.uniqueMaterials,
    drawsBefore: before.drawCalls,
    drawsAfter: after.drawCalls,
  };
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
  opts: RenderSceneOptions = {},
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

  // Opt-in material consolidation (default off => byte-identical to today). Runs
  // after dedup so palette() works on the already-merged material set. `auto` is
  // grade-aware: it consolidates only when palette() would actually act
  // (>= PALETTE_MIN materials), so lean assets stay byte-stable. Failure is
  // swallowed with a warning — the dedup'd GLB is still valid.
  const optimizeMode = resolveOptimize(opts.optimize);
  let effectiveOptimize: 'off' | 'palette' | 'full' =
    optimizeMode === 'auto' ? 'off' : optimizeMode;
  if (optimizeMode === 'auto' && collectGlbMetrics(doc, tris).uniqueMaterials >= PALETTE_MIN) {
    effectiveOptimize = 'palette';
  }
  let optimize: OptimizeSummary | undefined;
  if (effectiveOptimize !== 'off') {
    try {
      optimize = await consolidateMaterials(doc, effectiveOptimize);
    } catch (err) {
      warnings.push(
        `optimize (${effectiveOptimize}) failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // Instanceability metrics, measured against the post-dedup() (and post-optimize,
  // when enabled) Document so the counts reflect the GLB the runtime actually
  // loads. Informational only — never a gate. Failure is swallowed: the GLB is
  // still valid without it. Triangle count can change under `full` (join welds
  // primitives), so derive it from the final Document rather than the pre-bake tris.
  let instanceability: InstanceabilityReport | undefined;
  let metricsError: string | undefined;
  try {
    const metrics: InstanceabilityMetrics = collectGlbMetrics(doc, optimize ? undefined : tris);
    instanceability = gradeInstanceability(metrics, { category: opts.category });
  } catch (err) {
    metricsError = err instanceof Error ? err.message : String(err);
  }

  const io = new WebIO();
  const bytes = await io.writeBinary(doc);

  return {
    bytes,
    tris,
    warnings,
    instanceability,
    metricsError,
    ...(optimize ? { optimize } : {}),
  };
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
export async function renderGLB(
  code: string,
  opts: { optimize?: OptimizeMode } = {},
): Promise<RenderResult> {
  const { meta, root, clips, primitiveUsage } = await executeKilnCode(code);
  const scene = await renderSceneToGLB(root, {
    sceneName: meta.name || 'Scene',
    clips,
    category: typeof meta.category === 'string' ? meta.category : undefined,
    ...(opts.optimize ? { optimize: opts.optimize } : {}),
  });

  return {
    glb: Buffer.from(scene.bytes),
    tris: scene.tris,
    meta: {
      ...meta,
      tris: scene.tris,
      primitiveUsage,
      ...(scene.instanceability
        ? { instanceability: scene.instanceability, tier: scene.instanceability.grade }
        : {}),
      ...(scene.metricsError ? { metricsError: scene.metricsError } : {}),
      ...(scene.optimize ? { optimize: scene.optimize } : {}),
    },
    warnings: scene.warnings,
  };
}

/**
 * Grade instanceability directly from baked GLB bytes.
 *
 * Used by consumers that hold a finished GLB but not its THREE scene — e.g.
 * Kiln Studio computing the grade web-side from the persisted artifact, so the
 * AgentCore runtime never has to (no wire bump, no runtime image rebuild). Pure
 * read: parses the GLB, walks the post-dedup document, grades. Never throws on a
 * valid GLB; returns undefined if the bytes can't be parsed.
 */
export async function gradeGlbBytes(
  bytes: Uint8Array,
  opts: { category?: string } = {},
): Promise<InstanceabilityReport | undefined> {
  try {
    const doc = await new WebIO().readBinary(bytes);
    return gradeInstanceability(collectGlbMetrics(doc), opts);
  } catch {
    return undefined;
  }
}

/** Result of {@link optimizeGlbBytes}: the consolidated GLB + its re-graded report. */
export interface OptimizeGlbResult {
  /** The consolidated GLB bytes. */
  bytes: Uint8Array;
  /** Instanceability report recomputed on the optimized bytes. */
  report?: InstanceabilityReport;
  /** What the pass did. */
  summary: OptimizeSummary;
}

/**
 * Consolidate materials in a finished GLB, working from bytes — the web-side
 * counterpart to {@link renderGLB}'s bake-time `optimize` option.
 *
 * Used by Kiln Studio: the AgentCore runtime returns an un-optimized GLB, and the
 * web tier re-bakes it here before persisting, so consolidation reaches prod with
 * NO wire bump / runtime change (the runtime never sees an `optimize` flag). Same
 * `consolidateMaterials` pass + re-grade as the render path. Pure read+write:
 * parses the GLB, transforms, re-serializes; returns `undefined` if the bytes
 * can't be parsed or the transform throws (caller keeps the original GLB).
 */
export async function optimizeGlbBytes(
  bytes: Uint8Array,
  opts: { mode?: OptimizeMode; category?: string } = {},
): Promise<OptimizeGlbResult | undefined> {
  const requested = opts.mode ?? 'palette';
  try {
    const io = new WebIO();
    const doc = await io.readBinary(bytes);
    // `auto` is grade-aware: consolidate only when palette() would act
    // (>= PALETTE_MIN materials); a no-op auto (or an explicit `off`) returns
    // undefined so the caller simply keeps the original bytes unchanged.
    if (requested === 'off') return undefined;
    let mode: 'palette' | 'full';
    if (requested === 'auto') {
      if (collectGlbMetrics(doc).uniqueMaterials < PALETTE_MIN) return undefined;
      mode = 'palette';
    } else {
      mode = requested;
    }
    const summary = await consolidateMaterials(doc, mode);
    const outBytes = await io.writeBinary(doc);
    let report: InstanceabilityReport | undefined;
    try {
      report = gradeInstanceability(collectGlbMetrics(doc), { category: opts.category });
    } catch {
      report = undefined;
    }
    return { bytes: outBytes, ...(report ? { report } : {}), summary };
  } catch {
    return undefined;
  }
}

// =============================================================================
// Palette snap (scene palettes) — web-side hard snap to a user-defined palette
// =============================================================================

/** One slot the GLB snap targets: a color + kind + optional PBR/opacity. */
export interface SnapPaletteSlot {
  /** sRGB hex (e.g. `#9fc9a3`). */
  color: string;
  /** Defaults to 'opaque'. transparent material → glass, emissive → glow. */
  kind?: 'opaque' | 'glass' | 'glow';
  metalness?: number;
  roughness?: number;
  /** Opacity for a glass slot (default 0.4). */
  opacity?: number;
}

/** Result of {@link snapGlbToPalette}. */
export interface SnapGlbResult {
  /** The snapped + consolidated GLB bytes. */
  bytes: Uint8Array;
  /** Instanceability report recomputed on the snapped bytes. */
  report?: InstanceabilityReport;
  /** What the consolidation pass did. */
  summary: OptimizeSummary;
  /** Materials whose color was rewritten to a slot. */
  snapped: number;
  /** Materials left unchanged (textured / hero, or no eligible slot). */
  skipped: number;
}

/**
 * Hard-snap a finished GLB's materials to a user-defined palette — the bake-time,
 * persisted counterpart of the Kiln City frontend snap. Each flat-color material's
 * base color is rewritten to the perceptually-nearest slot (OKLab, via
 * {@link chooseSlot}) and its PBR set from that slot, so a whole batch generated
 * against one palette lands on exactly those colors and collapses (after
 * `consolidateMaterials`) to ~one material per slot — "reads as one place" + a few
 * draws. Textured / hero materials are left untouched (they carry their own color).
 *
 * Pure read+write (parses GLB, rewrites, re-serializes); returns `undefined` if the
 * bytes can't be parsed or the transform throws (caller keeps the original GLB),
 * mirroring {@link optimizeGlbBytes}.
 */
export async function snapGlbToPalette(
  bytes: Uint8Array,
  slots: readonly SnapPaletteSlot[],
  opts: { category?: string } = {},
): Promise<SnapGlbResult | undefined> {
  if (slots.length === 0) return undefined;
  try {
    const io = new WebIO();
    const doc = await io.readBinary(bytes);
    const before = collectGlbMetrics(doc);
    const idx = buildSlotIndex(slots as readonly SnapSlot[]);
    let snapped = 0;
    let skipped = 0;
    for (const mat of doc.getRoot().listMaterials()) {
      // Hero exception — never recolor a textured material (it carries its own color).
      if (mat.getBaseColorTexture()) {
        skipped++;
        continue;
      }
      const base = mat.getBaseColorFactor();
      const emissive = mat.getEmissiveFactor();
      const transparent = mat.getAlphaMode() === 'BLEND' || mat.getAlpha() < 0.98;
      const slotI = chooseSlot(idx, {
        baseLinear: [base[0], base[1], base[2]],
        emissiveLinear: [emissive[0], emissive[1], emissive[2]],
        transparent,
      });
      if (slotI === undefined) {
        skipped++;
        continue;
      }
      const slot = slots[slotI]!;
      const kind = slot.kind ?? 'opaque';
      const [lr, lg, lb] = hexToLinearRgb(slot.color);
      const alpha = kind === 'glass' ? (slot.opacity ?? 0.4) : 1;
      mat.setBaseColorFactor([lr, lg, lb, alpha]);
      mat.setMetallicFactor(slot.metalness ?? 0);
      mat.setRoughnessFactor(slot.roughness ?? (kind === 'glass' ? 0.1 : 0.85));
      if (kind === 'glass') mat.setAlphaMode('BLEND');
      else if (mat.getAlphaMode() === 'BLEND') mat.setAlphaMode('OPAQUE');
      // Glow keeps a "lit" look by emitting its slot color; clear stray emissive otherwise.
      mat.setEmissiveFactor(kind === 'glow' ? [lr, lg, lb] : [0, 0, 0]);
      snapped++;
    }
    // Snapping made many materials value-identical — dedup merges those objects first
    // (palette() alone keeps distinct objects), then consolidate collapses further.
    await doc.transform(dedup());
    await consolidateMaterials(doc, 'palette');
    // Summary spans the WHOLE snap (original → final), not just the consolidation sub-step,
    // so provenance shows the true material collapse (e.g. 14 → 4).
    const after = collectGlbMetrics(doc);
    const summary: OptimizeSummary = {
      mode: 'palette',
      materialsBefore: before.uniqueMaterials,
      materialsAfter: after.uniqueMaterials,
      drawsBefore: before.drawCalls,
      drawsAfter: after.drawCalls,
    };
    const outBytes = await io.writeBinary(doc);
    let report: InstanceabilityReport | undefined;
    try {
      report = gradeInstanceability(after, { category: opts.category });
    } catch {
      report = undefined;
    }
    return { bytes: outBytes, ...(report ? { report } : {}), summary, snapped, skipped };
  } catch {
    return undefined;
  }
}

// =============================================================================
// Scene composition — merge N placed GLBs into one scene GLB (export)
// =============================================================================

/** One placed asset to compose into the scene: its GLB bytes + a world transform. */
export interface SceneComposePart {
  bytes: Uint8Array;
  transform: {
    /** World position [x, y, z], engine frame (+X fwd, +Y up, ground Y=0), meters. */
    pos: [number, number, number];
    /** Euler rotation in DEGREES, XYZ order (the Kiln/Placement convention). */
    rotDeg: [number, number, number];
    /** Per-axis scale. */
    scale: [number, number, number];
  };
  /** Wrapper node name (e.g. an instanceId) — a debug aid in the exported file. */
  name?: string;
}

export interface SceneComposeOptions {
  /** glTF scene name. Default 'Scene'. */
  sceneName?: string;
  /** Material consolidation across the merged scene. Default 'palette' (a few draws). */
  optimize?: OptimizeMode;
  /** Keep each asset's animation clips. Default false (static dressing). */
  keepAnimations?: boolean;
}

export interface SceneComposeResult {
  /** The composed scene GLB bytes. */
  bytes: Uint8Array;
  tris: number;
  /** Draw calls in the composed scene (post-optimize). */
  draws: number;
  /** Distinct materials in the composed scene (post-optimize). */
  materials: number;
  /** Per-part skip notes + transform warnings (never throws on one bad part). */
  warnings: string[];
}

/** Euler degrees (XYZ) → a glTF quaternion [x, y, z, w] via THREE (the viewer's frame). */
function eulerDegToQuat(deg: [number, number, number]): [number, number, number, number] {
  const e = new THREE.Euler(
    THREE.MathUtils.degToRad(deg[0]),
    THREE.MathUtils.degToRad(deg[1]),
    THREE.MathUtils.degToRad(deg[2]),
    'XYZ',
  );
  const q = new THREE.Quaternion().setFromEuler(e);
  return [q.x, q.y, q.z, q.w];
}

/**
 * Compose N placed GLBs into a single scene GLB — the Scenes-page export primitive.
 *
 * Pure gltf-transform (no THREE GLTFLoader, whose texture path is browser-DOM-bound):
 * each part's bytes are read into a Document, `mergeDocuments` copies its graph into a
 * master Document (textures copied as bytes, lossless), and its scene roots are
 * reparented under a fresh transform node carrying the placement's TRS. One merge per
 * placement (a Node can't have two parents); a final `dedup()` collapses repeated
 * blueprints (e.g. 30 identical fence posts) and `consolidateMaterials` keeps the
 * export to a few draws. A corrupt/unreadable part becomes a warning and is skipped,
 * never failing the whole export.
 *
 * Runs under Bun in the web tier (same WebIO read→transform→write path as
 * {@link optimizeGlbBytes}). Pure: no fs / globals / WebGL.
 */
export async function composeSceneGLB(
  parts: readonly SceneComposePart[],
  opts: SceneComposeOptions = {},
): Promise<SceneComposeResult> {
  const warnings: string[] = [];
  const io = new WebIO();
  const master = new Document();
  const masterScene = master.createScene(opts.sceneName ?? 'Scene');
  let composed = 0;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]!;
    try {
      const src = await io.readBinary(part.bytes);
      const srcScene = src.getRoot().listScenes()[0];
      const map = mergeDocuments(master, src);
      const wrap = master
        .createNode(part.name ?? `part_${i}`)
        .setTranslation([part.transform.pos[0], part.transform.pos[1], part.transform.pos[2]])
        .setRotation(eulerDegToQuat(part.transform.rotDeg))
        .setScale([part.transform.scale[0], part.transform.scale[1], part.transform.scale[2]]);
      const mergedScene = srcScene ? (map.get(srcScene) as GtScene | undefined) : undefined;
      if (mergedScene) {
        for (const child of mergedScene.listChildren()) wrap.addChild(child);
        mergedScene.dispose();
      }
      masterScene.addChild(wrap);
      composed++;
    } catch (err) {
      warnings.push(
        `part ${i} (${part.name ?? ''}) skipped: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  if (composed === 0) throw new Error('composeSceneGLB: no parts could be merged');

  // Static dressing has no shared timeline — drop per-asset clips unless asked to keep.
  if (!opts.keepAnimations) {
    for (const anim of master.getRoot().listAnimations()) anim.dispose();
  }

  try {
    await master.transform(dedup());
  } catch (err) {
    warnings.push(`dedup failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  const optimizeMode: OptimizeMode = opts.optimize ?? 'palette';
  let effectiveOptimize: 'off' | 'palette' | 'full' =
    optimizeMode === 'auto' ? 'off' : optimizeMode;
  if (optimizeMode === 'auto' && collectGlbMetrics(master).uniqueMaterials >= PALETTE_MIN) {
    effectiveOptimize = 'palette';
  }
  if (effectiveOptimize !== 'off') {
    try {
      await consolidateMaterials(master, effectiveOptimize);
    } catch (err) {
      warnings.push(
        `optimize (${effectiveOptimize}) failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // mergeDocuments brings each source's Buffer across, but a GLB allows ≤1 buffer.
  // Reassign every accessor to the first buffer and drop the rest.
  const rootBuffers = master.getRoot().listBuffers();
  if (rootBuffers.length > 1) {
    const main = rootBuffers[0]!;
    for (const acc of master.getRoot().listAccessors()) acc.setBuffer(main);
    for (let i = 1; i < rootBuffers.length; i++) rootBuffers[i]!.dispose();
  }

  const metrics = collectGlbMetrics(master);
  const bytes = await io.writeBinary(master);
  return {
    bytes,
    tris: metrics.triangles,
    draws: metrics.drawCalls,
    materials: metrics.uniqueMaterials,
    warnings,
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
  clips: THREE.AnimationClip[],
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
          `Animation track "${clip.name}:${track.name}" targets unknown node "${nodeName}" — rename the pivot or fix the track`,
        );
      }

      if (!['position', 'quaternion', 'scale'].includes(property)) {
        warnings.push(
          `Animation track "${clip.name}:${track.name}" uses unsupported property "${property}"`,
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
 *
 * Floating-part warnings carry an actionable fix: the minimal world-space
 * shift that brings the floater into contact with its nearest sibling (or the
 * `snapTo(part, host)` call that applies it).
 *
 * Pass `opts.category` (vehicle / weapon / boat / aircraft) to additionally
 * run the orientation advisory: kiln assets face +X, so a vehicle whose Z
 * extent dominates its X extent was probably built sideways. Aircraft skip
 * the Z check (wingspan legitimately dominates) and check Y instead.
 */
export interface InspectStructureOptions {
  /** Asset kind for the orientation advisory. Omit to skip it. */
  category?: 'vehicle' | 'weapon' | 'boat' | 'aircraft' | (string & {});
}

/** Minimal world-space translation that closes the gap between two boxes
 *  (zero on axes that already overlap). */
function minimalGapVector(a: THREE.Box3, b: THREE.Box3): THREE.Vector3 {
  const v = new THREE.Vector3();
  for (const axis of ['x', 'y', 'z'] as const) {
    if (a.min[axis] > b.max[axis]) v[axis] = b.max[axis] - a.min[axis];
    else if (a.max[axis] < b.min[axis]) v[axis] = b.min[axis] - a.max[axis];
    else v[axis] = 0;
  }
  return v;
}

export function inspectSceneStructure(
  root: THREE.Object3D,
  opts: InspectStructureOptions = {},
): string[] {
  const warnings: string[] = [];
  const meshes = collectMeshStats(root);
  if (meshes.length === 0) return warnings;

  // Orientation advisory (category-aware; runs even for single-mesh scenes).
  const cat = opts.category?.toLowerCase();
  if (cat === 'vehicle' || cat === 'weapon' || cat === 'boat' || cat === 'aircraft') {
    const all = new THREE.Box3();
    for (const m of meshes) all.union(m.box);
    const size = new THREE.Vector3();
    all.getSize(size);
    if (cat === 'aircraft') {
      if (size.y > size.x * 1.2) {
        warnings.push(
          `Orientation: this aircraft is ${size.y.toFixed(2)} tall but only ${size.x.toFixed(2)} long along +X (the nose axis). Kiln aircraft fly nose-first along +X — it may be built vertically or sideways.`,
        );
      }
    } else if (size.z > size.x * 1.3) {
      warnings.push(
        `Orientation: this ${cat} spans ${size.z.toFixed(2)} along Z but only ${size.x.toFixed(2)} along +X. Kiln ${cat}s face +X (forward/muzzle/bow) — it looks built sideways; rebuild the long axis along X.`,
      );
    }
  }

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
      if (overlapsAny) continue;

      // Actionable fix: the minimal shift to the NEAREST sibling, plus the
      // snapTo call that applies it.
      let nearest: MeshStats | undefined;
      let nearestGap: THREE.Vector3 | undefined;
      for (let j = 0; j < meshes.length; j++) {
        if (i === j) continue;
        const gap = minimalGapVector(a.box, meshes[j]!.box);
        if (!nearestGap || gap.length() < nearestGap.length()) {
          nearest = meshes[j]!;
          nearestGap = gap;
        }
      }
      const fix =
        nearest && nearestGap
          ? ` Fix: shift "${a.name}" by [${nearestGap.x.toFixed(3)}, ${nearestGap.y.toFixed(3)}, ${nearestGap.z.toFixed(3)}] toward "${nearest.name}", or call snapTo(part, hostPart) to do it automatically.`
          : '';
      floaters.push(`${a.name}${fix ? ' —' + fix : ''}`);
    }
    if (floaters.length > 0) {
      warnings.push(
        `Floating parts (no mesh overlap with any sibling, 2cm tol): ${floaters.join(' | ')}`,
      );
    }
  }

  return warnings;
}

/**
 * OPT-IN geometry settle: translate each floating mesh into contact with its
 * nearest sibling, but only when the gap is small (≤ `maxGap`). Deliberately
 * NOT applied inside kiln_render or renderGLB — silently mutating geometry
 * would desync the code from the artifact and poison refine loops. The batch
 * harness uses it after a soft-retry still warns, and records the settled part
 * names in provenance so the mutation is visible.
 *
 * Returns the names of the parts that were moved.
 */
export function settleContacts(
  root: THREE.Object3D,
  opts: { maxGap?: number; overlap?: number } = {},
): string[] {
  const maxGap = opts.maxGap ?? 0.05;
  const overlap = opts.overlap ?? 0.01;
  const settled: string[] = [];

  // One move per pass, then re-collect: moving a part changes every other
  // part's floating status (with two meshes BOTH read as floaters — moving
  // either resolves both). Among the settleable floaters, move the smallest
  // (it's the attachment, not the hull).
  for (let pass = 0; pass < 8; pass++) {
    const meshes = collectMeshStats(root);
    if (meshes.length < 2) return settled;

    let pick: { stats: MeshStats; gap: THREE.Vector3; volume: number } | undefined;
    for (let i = 0; i < meshes.length; i++) {
      const a = meshes[i]!;
      const ax = a.box.clone().expandByScalar(0.02);
      if (meshes.some((b, j) => j !== i && ax.intersectsBox(b.box))) continue;

      let nearestGap: THREE.Vector3 | undefined;
      for (let j = 0; j < meshes.length; j++) {
        if (i === j) continue;
        const gap = minimalGapVector(a.box, meshes[j]!.box);
        if (!nearestGap || gap.length() < nearestGap.length()) nearestGap = gap;
      }
      if (!nearestGap || nearestGap.length() === 0 || nearestGap.length() > maxGap) continue;

      const volume = a.size.x * a.size.y * a.size.z;
      if (!pick || volume < pick.volume) pick = { stats: a, gap: nearestGap, volume };
    }
    if (!pick) break;

    // Close the gap plus a small overlap along the dominant gap axis.
    const delta = pick.gap.clone();
    const dominant = (['x', 'y', 'z'] as const).reduce(
      (d, axis) => (Math.abs(delta[axis]) > Math.abs(delta[d]) ? axis : d),
      'x' as 'x' | 'y' | 'z',
    );
    delta[dominant] += Math.sign(delta[dominant]) * overlap;

    // Find the named object and move it, converting the world delta into the
    // parent's local space (handles rotated/scaled ancestors).
    let target: THREE.Object3D | undefined;
    root.traverse((obj) => {
      if (!target && obj.name === pick!.stats.name && (obj as { isMesh?: boolean }).isMesh)
        target = obj;
    });
    if (!target) break;
    const parent = target.parent ?? root;
    const p0 = new THREE.Vector3();
    target.getWorldPosition(p0);
    const p1 = p0.clone().add(delta);
    const l0 = parent.worldToLocal(p0.clone());
    const l1 = parent.worldToLocal(p1.clone());
    target.position.add(l1.sub(l0));
    target.updateMatrixWorld(true);
    settled.push(pick.stats.name);
  }
  return settled;
}

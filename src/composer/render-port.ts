/**
 * SceneRenderPort — the host-supplied seam that lets the composer SEE the scene
 * without the engine importing THREE. The engine defines this interface and the
 * agent tools call it; Studio implements it with real GLBs (composeSceneGLB +
 * the rasterizer). Bun tests inject a stub returning a fixed PNG.
 */
import type { Placement } from './model';
import type { WorldDocumentV2 } from './world-document';

export interface SceneCamera {
  position: [number, number, number];
  target: [number, number, number];
  /** World-space camera up vector. Host default is [0,1,0]. */
  up?: [number, number, number];
  /** Vertical FOV in degrees. Default ~50. */
  fovDeg?: number;
  aspect?: number;
  near?: number;
  far?: number;
}

/** Fully resolved camera values recorded in an immutable render receipt. */
export interface ResolvedSceneCamera {
  position: [number, number, number];
  target: [number, number, number];
  up: [number, number, number];
  fovDeg: number;
  aspect: number;
  near: number;
  far: number;
}

export interface SceneRenderRequest {
  /** The evaluated scene (generationId + transform per instance). */
  placements: Placement[];
  /** Canonical authority for terrain/artifact resolution on world-aware host adapters. */
  worldDocument?: WorldDocumentV2;
  /** Omit for the standard 3-angle grid; pass one camera for a custom shot. */
  cameras?: SceneCamera[];
  width?: number;
  height?: number;
  /** Canonical input identity for an immutable GPU milestone. */
  worldHash?: `sha256:${string}`;
  lightingPresetId?: string;
  /** Requested host backend, e.g. `webgpu` or `vulkan`; host reports actual backend. */
  backendPreference?: string;
}

/** Reproducibility/provenance record for a successful GPU milestone render. */
export interface SceneRenderReceipt {
  worldHash: `sha256:${string}`;
  cameras: ResolvedSceneCamera[];
  width: number;
  height: number;
  lightingPresetId: string;
  backend: string;
  rendererId: string;
  outputSha256: `sha256:${string}`;
}

/** Provenance for successful fallback pixels that do not attest the requested cameras. */
export interface SceneRenderFallbackReceipt {
  /** Literal false prevents this record from being mistaken for a SceneRenderReceipt. */
  cameraAttested: false;
  backend: string;
  rendererId: string;
  outputSha256: `sha256:${string}`;
}

export interface SceneRenderResult {
  ok: boolean;
  /** The composited grid, or the single custom-camera frame (base64 PNG). */
  pngBase64?: string;
  /** One PNG per requested camera, when more than one was passed. */
  perCameraBase64?: string[];
  tris?: number;
  /** Present when the host renders an immutable canonical-world milestone. */
  receipt?: SceneRenderReceipt;
  /** Actual fallback producer/output identity; never an exact-camera attestation. */
  fallbackReceipt?: SceneRenderFallbackReceipt;
  /** True when `ok:true` pixels came from a declared fallback rather than the
   * requested renderer. Absent preserves compatibility with legacy hosts whose
   * successful result did not report fallback provenance. */
  degraded?: boolean;
  /** Stable, credential-free fallback explanation. Meaningful when degraded is true. */
  degradeReason?: string;
  error?: string;
}

/** Inject this at `runKilnComposer` call time. A build/render failure returns
 *  `{ ok:false, error }` (no image) so the agent gets a fixable error. */
export type SceneRenderPort = (req: SceneRenderRequest) => Promise<SceneRenderResult>;

/**
 * PbrRenderRequest — one PBR/beauty render of an ALREADY-PRODUCED GLB.
 *
 * The engine never talks to a render service directly: hosts implement
 * {@link PbrRenderPort} (Studio wires it to its GPU render service; tests inject
 * stubs). The GPU path is a non-deterministic VIEW producer only — GLB compute
 * stays deterministic and never depends on this seam.
 */
export interface PbrRenderRequest {
  /** The rendered GLB bytes (route the produced asset; do NOT re-execute programs). */
  glb: Uint8Array;
  /**
   * View directions from model center toward the camera, max 12. Omit for the
   * host default.
   *
   * A host must return exactly one PNG per entry, in request order. Truncating
   * or padding is a degrade, not a success: the engine composites the result
   * into a grid whose shape was chosen from this list's length, so a
   * different-length reply would silently reshape the artifact.
   */
  viewDirs?: [number, number, number][];
  /** Square per-view cell size in pixels. */
  size?: number;
  /** Optional larger single beauty-shot size. */
  beautySize?: number;
  /** Fully resolved perspective cameras for canonical composed-scene renders.
   * Legacy asset sheets continue to use `viewDirs` unchanged. */
  cameras?: ResolvedSceneCamera[];
  /** Rectangular camera target. Both are required in camera mode and each is bounded. */
  width?: number;
  height?: number;
  /** Host-owned lighting preset identity applied to the perspective render. */
  lightingPresetId?: string;
}

const PBR_REQUEST_KEYS = new Set([
  'glb',
  'viewDirs',
  'size',
  'beautySize',
  'cameras',
  'width',
  'height',
  'lightingPresetId',
]);

function finiteTuple3(value: unknown, path: string): [number, number, number] {
  if (
    !Array.isArray(value) ||
    value.length !== 3 ||
    value.some((entry) => typeof entry !== 'number' || !Number.isFinite(entry))
  )
    throw new TypeError(`${path} must be a finite [x,y,z] tuple`);
  return [value[0] as number, value[1] as number, value[2] as number];
}

function boundedPixelSize(value: unknown, path: string): number {
  if (!Number.isInteger(value) || (value as number) < 1 || (value as number) > 4096) {
    throw new TypeError(`${path} must be an integer in [1,4096]`);
  }
  return value as number;
}

/** Strict runtime validator/clone for the private GPU transport boundary. */
export function validatePbrRenderRequest(input: unknown): PbrRenderRequest {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('PbrRenderRequest must be an object');
  }
  const source = input as Record<string, unknown>;
  for (const key of Object.keys(source)) {
    if (!PBR_REQUEST_KEYS.has(key)) throw new TypeError(`PbrRenderRequest.${key} is unknown`);
  }
  if (!(source.glb instanceof Uint8Array) || source.glb.byteLength === 0) {
    throw new TypeError('PbrRenderRequest.glb must be a non-empty Uint8Array');
  }
  const result: PbrRenderRequest = { glb: source.glb };
  if (source.viewDirs !== undefined) {
    if (
      !Array.isArray(source.viewDirs) ||
      source.viewDirs.length < 1 ||
      source.viewDirs.length > 12
    ) {
      throw new TypeError('PbrRenderRequest.viewDirs must contain 1..12 directions');
    }
    result.viewDirs = source.viewDirs.map((value, index) => {
      const direction = finiteTuple3(value, `PbrRenderRequest.viewDirs[${index}]`);
      if (Math.hypot(...direction) === 0) {
        throw new TypeError(`PbrRenderRequest.viewDirs[${index}] must be non-zero`);
      }
      return direction;
    });
  }
  if (source.size !== undefined)
    result.size = boundedPixelSize(source.size, 'PbrRenderRequest.size');
  if (source.beautySize !== undefined) {
    result.beautySize = boundedPixelSize(source.beautySize, 'PbrRenderRequest.beautySize');
  }
  const hasWidth = source.width !== undefined;
  const hasHeight = source.height !== undefined;
  if (hasWidth !== hasHeight) {
    throw new TypeError('PbrRenderRequest.width and height must be provided together');
  }
  if (hasWidth) {
    result.width = boundedPixelSize(source.width, 'PbrRenderRequest.width');
    result.height = boundedPixelSize(source.height, 'PbrRenderRequest.height');
  }
  if (source.cameras !== undefined) {
    if (source.viewDirs !== undefined) {
      throw new TypeError('PbrRenderRequest.cameras and viewDirs are mutually exclusive');
    }
    if (source.size !== undefined || source.beautySize !== undefined) {
      throw new TypeError('PbrRenderRequest camera mode cannot use legacy size or beautySize');
    }
    if (result.width === undefined || result.height === undefined) {
      throw new TypeError('PbrRenderRequest camera mode requires width and height');
    }
    if (!Array.isArray(source.cameras) || source.cameras.length < 1 || source.cameras.length > 12) {
      throw new TypeError('PbrRenderRequest.cameras must contain 1..12 cameras');
    }
    result.cameras = source.cameras.map((value, index) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new TypeError(`PbrRenderRequest.cameras[${index}] must be an object`);
      }
      const camera = value as Record<string, unknown>;
      const expected = new Set(['position', 'target', 'up', 'fovDeg', 'aspect', 'near', 'far']);
      for (const key of Object.keys(camera)) {
        if (!expected.has(key))
          throw new TypeError(`PbrRenderRequest.cameras[${index}].${key} is unknown`);
      }
      const position = finiteTuple3(camera.position, `PbrRenderRequest.cameras[${index}].position`);
      const target = finiteTuple3(camera.target, `PbrRenderRequest.cameras[${index}].target`);
      const up = finiteTuple3(camera.up, `PbrRenderRequest.cameras[${index}].up`);
      if (
        Math.hypot(position[0] - target[0], position[1] - target[1], position[2] - target[2]) === 0
      ) {
        throw new TypeError(`PbrRenderRequest.cameras[${index}].target must differ from position`);
      }
      if (Math.hypot(...up) === 0) {
        throw new TypeError(`PbrRenderRequest.cameras[${index}].up must be non-zero`);
      }
      const view = [
        target[0] - position[0],
        target[1] - position[1],
        target[2] - position[2],
      ] as const;
      const cross = [
        view[1] * up[2] - view[2] * up[1],
        view[2] * up[0] - view[0] * up[2],
        view[0] * up[1] - view[1] * up[0],
      ] as const;
      if (Math.hypot(...cross) <= Math.hypot(...view) * Math.hypot(...up) * 1e-9) {
        throw new TypeError(
          `PbrRenderRequest.cameras[${index}].up must not be collinear with view`,
        );
      }
      const number = (key: 'fovDeg' | 'aspect' | 'near' | 'far'): number => {
        const parsed = camera[key];
        if (typeof parsed !== 'number' || !Number.isFinite(parsed)) {
          throw new TypeError(`PbrRenderRequest.cameras[${index}].${key} must be finite`);
        }
        return parsed;
      };
      const fovDeg = number('fovDeg');
      const aspect = number('aspect');
      const near = number('near');
      const far = number('far');
      if (fovDeg <= 0 || fovDeg >= 180) {
        throw new TypeError(`PbrRenderRequest.cameras[${index}].fovDeg must be in (0,180)`);
      }
      if (aspect <= 0)
        throw new TypeError(`PbrRenderRequest.cameras[${index}].aspect must be positive`);
      if (near <= 0)
        throw new TypeError(`PbrRenderRequest.cameras[${index}].near must be positive`);
      if (far <= near)
        throw new TypeError(`PbrRenderRequest.cameras[${index}].far must exceed near`);
      const targetAspect = result.width! / result.height!;
      if (Math.abs(aspect - targetAspect) > Math.max(1, targetAspect) * 1e-9) {
        throw new TypeError(`PbrRenderRequest.cameras[${index}].aspect must equal width/height`);
      }
      return { position, target, up, fovDeg, aspect, near, far };
    });
  } else if (hasWidth) {
    throw new TypeError('PbrRenderRequest width and height require camera mode');
  }
  if (source.lightingPresetId !== undefined) {
    if (
      typeof source.lightingPresetId !== 'string' ||
      !source.lightingPresetId.trim() ||
      source.lightingPresetId !== source.lightingPresetId.trim() ||
      source.lightingPresetId.length > 128
    ) {
      throw new TypeError('PbrRenderRequest.lightingPresetId must be a non-empty string');
    }
    result.lightingPresetId = source.lightingPresetId;
  }
  return result;
}

/**
 * Backdrop hosts must paint behind the asset, so a GPU-rendered sheet and the
 * CPU-rasterized one a degrade produces are comparable. Re-exported here (from
 * the rasterizer's own leaf constant) because the host implementing this port
 * has no reason to import the rasterizer.
 */
export { GRID_BACKGROUND_HEX, GRID_BACKGROUND_RGB } from '../views/background';

export interface PbrRenderResult {
  ok: boolean;
  /** Honest producer identity, e.g. "dawn-vulkan:nvidia-rtx-a4500:NVIDIA: 550.100"
   *  or the CPU fallback's deterministic "cpu-raster:<engine-version>". */
  rendererId: string;
  /** Actual renderer backend. Required by hosts for camera mode; optional for legacy ports. */
  backend?: string;
  /** Exact camera transport echoed by a camera-mode host after validation. */
  cameras?: ResolvedSceneCamera[];
  width?: number;
  height?: number;
  lightingPresetId?: string;
  /** One PNG per requested view direction, in request order. */
  viewsPng?: Uint8Array[];
  /** The optional beauty shot. */
  beautyPng?: Uint8Array;
  /** Host-measured phase timings in milliseconds. */
  timings?: Record<string, number>;
  error?: string;
}

/** Host-supplied PBR renderer seam. Absent everywhere it is optional means the
 *  feature is off and behavior is byte-identical to the CPU-only path. */
export type PbrRenderPort = (req: PbrRenderRequest) => Promise<PbrRenderResult>;

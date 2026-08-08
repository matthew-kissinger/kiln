/**
 * SceneRenderPort — the host-supplied seam that lets the composer SEE the scene
 * without the engine importing THREE. The engine defines this interface and the
 * agent tools call it; Studio implements it with real GLBs (composeSceneGLB +
 * the rasterizer). Bun tests inject a stub returning a fixed PNG.
 */
import type { Placement } from './model';

export interface SceneCamera {
  position: [number, number, number];
  target: [number, number, number];
  /** Vertical FOV in degrees. Default ~50. */
  fovDeg?: number;
}

export interface SceneRenderRequest {
  /** The evaluated scene (generationId + transform per instance). */
  placements: Placement[];
  /** Omit for the standard 3-angle grid; pass one camera for a custom shot. */
  cameras?: SceneCamera[];
  width?: number;
  height?: number;
}

export interface SceneRenderResult {
  ok: boolean;
  /** The composited grid, or the single custom-camera frame (base64 PNG). */
  pngBase64?: string;
  /** One PNG per requested camera, when more than one was passed. */
  perCameraBase64?: string[];
  tris?: number;
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

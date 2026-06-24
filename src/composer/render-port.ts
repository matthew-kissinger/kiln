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

import { createHash } from 'node:crypto';
import {
  DEFAULT_PRESENTATION_PRESET_ID,
  PRESENTATION_PRESET_IDS,
  isPresentationPresetId,
} from './presentation-presets.mjs';

// Singular export retained for existing Engine/Studio callers. The plural list
// is the registry-backed source of truth for strict ID validation and discovery.
export const SUPPORTED_LIGHTING_PRESET_ID = DEFAULT_PRESENTATION_PRESET_ID;
export const SUPPORTED_LIGHTING_PRESET_IDS = PRESENTATION_PRESET_IDS;
export const RENDER_FIDELITY_VERSION = 'kiln.render-fidelity.v1';
export const RENDER_FIDELITY_PRODUCER = 'kiln-render-service';
export const RENDER_OPERATIONAL_EVIDENCE_VERSION = 'kiln.render-operational.v1';
export const RENDER_OUTCOME_CODES = Object.freeze([
  'health_ok',
  'gpu_success',
  'auth_rejected',
  'request_rejected',
  'not_implemented',
  'route_not_found',
  'render_failed',
]);
export const MAX_VIEW_DIRS = 12;
export const MAX_CAMERAS = 12;
export const MIN_CAMERA_DIMENSION = 1;
export const MAX_CAMERA_DIMENSION = 4096;
// Includes every camera in the request. This admits one 4K frame, eight 1080p
// frames, or twelve 720p frames while bounding transient MSAA/depth allocation.
export const MAX_CAMERA_TOTAL_PIXELS = 16_777_216;

export const DEFAULT_VIEW_DIRS = Object.freeze([
  Object.freeze([1, 0.35, 1]),
  Object.freeze([-1, 0.35, 1]),
  Object.freeze([1, 0.35, -1]),
  Object.freeze([-1, 0.35, -1]),
  Object.freeze([0, 1, 0.001]),
  Object.freeze([0.001, -1, 0.001]),
]);

function badRequest(message) {
  return Object.assign(new Error(message), { status: 400 });
}

function supportedPresetMessage(field) {
  return SUPPORTED_LIGHTING_PRESET_IDS.length === 1
    ? `${field} must be ${SUPPORTED_LIGHTING_PRESET_ID}`
    : `${field} must be one of: ${SUPPORTED_LIGHTING_PRESET_IDS.join(', ')}`;
}

const RENDER_OUTCOME_CODE_SET = new Set(RENDER_OUTCOME_CODES);
const MAX_OPERATIONAL_MS = 86_400_000;
const MAX_OPERATIONAL_QUEUE_DEPTH = 10_000;
const OPERATIONAL_EVIDENCE_KEYS = new Set([
  'outcomeCode',
  'queueWaitMs',
  'queueDepthAtEnqueue',
  'concurrencyAtStart',
  'firstRenderInProcess',
  'workerAgeMsAtStart',
]);

/** Stable low-cardinality outcome for structured request logs and metrics extraction. */
export function httpRenderOutcomeCode({ method, path, status }) {
  if (status === 401) return 'auth_rejected';
  if (status === 501) return 'not_implemented';
  if (status === 404) return 'route_not_found';
  if (status === 400 || status === 413) return 'request_rejected';
  if (method === 'GET' && (path === '/health' || path === '/ping') && status >= 200 && status < 300) {
    return 'health_ok';
  }
  if (method === 'POST' && path === '/render' && status >= 200 && status < 300) {
    return 'gpu_success';
  }
  return 'render_failed';
}

function nonNegativeFinite(value, path) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw badRequest(`${path} must be a non-negative finite number`);
  }
  return value;
}

/**
 * Produce the bounded, identifier-free queue/worker envelope consumed by R2.8
 * metrics extraction. Oversized valid observations are capped rather than
 * failing a completed render; malformed internal values still fail closed.
 */
export function buildRenderOperationalEvidenceV1(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw badRequest('render operational evidence must be an object');
  }
  for (const key of Object.keys(input)) {
    if (!OPERATIONAL_EVIDENCE_KEYS.has(key)) throw badRequest(`${key} is unknown`);
  }
  if (!RENDER_OUTCOME_CODE_SET.has(input.outcomeCode)) {
    throw badRequest('outcomeCode is not supported');
  }
  const queueWaitMs = nonNegativeFinite(input.queueWaitMs, 'queueWaitMs');
  const workerAgeMsAtStart = nonNegativeFinite(input.workerAgeMsAtStart, 'workerAgeMsAtStart');
  if (!Number.isInteger(input.queueDepthAtEnqueue) || input.queueDepthAtEnqueue < 0) {
    throw badRequest('queueDepthAtEnqueue must be a non-negative integer');
  }
  if (input.concurrencyAtStart !== 1) {
    throw badRequest('concurrencyAtStart must be 1 for the serial GPU queue');
  }
  if (typeof input.firstRenderInProcess !== 'boolean') {
    throw badRequest('firstRenderInProcess must be boolean');
  }

  const evidenceClamped = queueWaitMs > MAX_OPERATIONAL_MS
    || workerAgeMsAtStart > MAX_OPERATIONAL_MS
    || input.queueDepthAtEnqueue > MAX_OPERATIONAL_QUEUE_DEPTH;
  return {
    version: RENDER_OPERATIONAL_EVIDENCE_VERSION,
    outcomeCode: input.outcomeCode,
    queueWaitMs: +Math.min(queueWaitMs, MAX_OPERATIONAL_MS).toFixed(1),
    queueDepthAtEnqueue: Math.min(input.queueDepthAtEnqueue, MAX_OPERATIONAL_QUEUE_DEPTH),
    concurrencyAtStart: 1,
    concurrencyLimit: 1,
    workerPhase: input.firstRenderInProcess ? 'first-render' : 'warm-render',
    workerAgeMsAtStart: +Math.min(workerAgeMsAtStart, MAX_OPERATIONAL_MS).toFixed(1),
    evidenceClamped,
  };
}

/** Provider/GPU-free serial queue with explicit start evidence for every job. */
export function createSerialRenderQueue(options = {}) {
  const now = options.now ?? (() => performance.now());
  if (typeof now !== 'function') throw badRequest('serial render queue now must be a function');
  const processStartedAt = options.processStartedAt ?? now();
  if (!Number.isFinite(processStartedAt)) {
    throw badRequest('serial render queue processStartedAt must be finite');
  }

  let tail = Promise.resolve();
  let queuedJobs = 0;
  let activeJobs = 0;
  let renderJobsStarted = 0;
  return Object.freeze({
    enqueue(job) {
      if (typeof job !== 'function') throw badRequest('serial render queue job must be a function');
      const enqueuedAt = now();
      const queueDepthAtEnqueue = activeJobs + queuedJobs;
      queuedJobs++;
      const runJob = async () => {
        queuedJobs--;
        activeJobs++;
        const firstRenderInProcess = renderJobsStarted === 0;
        renderJobsStarted++;
        const startedAt = now();
        const start = {
          queueWaitMs: startedAt - enqueuedAt,
          queueDepthAtEnqueue,
          concurrencyAtStart: activeJobs,
          firstRenderInProcess,
          workerAgeMsAtStart: startedAt - processStartedAt,
        };
        try {
          return await job(start);
        } finally {
          activeJobs--;
        }
      };
      const run = tail.then(runJob, runJob);
      tail = run.catch(() => { });
      return run;
    },
  });
}

function finiteTuple3(value, path) {
  if (!Array.isArray(value) || value.length !== 3 || !value.every(Number.isFinite)) {
    throw badRequest(`${path} must be [x,y,z] finite numbers`);
  }
  return [...value];
}

function finiteNumber(value, path) {
  if (!Number.isFinite(value)) throw badRequest(`${path} must be finite`);
  return value;
}

function pixelDimension(value, path) {
  if (
    !Number.isInteger(value)
    || value < MIN_CAMERA_DIMENSION
    || value > MAX_CAMERA_DIMENSION
  ) {
    throw badRequest(
      `${path} must be an integer in [${MIN_CAMERA_DIMENSION},${MAX_CAMERA_DIMENSION}]`,
    );
  }
  return value;
}

/** Legacy direction validation. Returned arrays are cloned; defaults are mutable copies. */
export function validateViewDirs(views) {
  if (views === undefined || views === null || (Array.isArray(views) && views.length === 0)) {
    return DEFAULT_VIEW_DIRS.map((view) => [...view]);
  }
  if (!Array.isArray(views)) throw badRequest('views must be an array of [x,y,z] directions');
  if (views.length > MAX_VIEW_DIRS) {
    throw badRequest(`views has ${views.length} entries; the maximum is ${MAX_VIEW_DIRS}`);
  }
  return views.map((value, index) => {
    const direction = finiteTuple3(value, `views[${index}]`);
    if (Math.hypot(...direction) < 1e-9) {
      throw badRequest(`views[${index}] must not be the zero vector`);
    }
    return direction;
  });
}

/** Strict camera-mode parser shared by HTTP and direct renderer callers. */
export function validateCameraMode(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw badRequest('camera render options must be an object');
  }
  if (!Array.isArray(input.cameras) || input.cameras.length < 1 || input.cameras.length > MAX_CAMERAS) {
    throw badRequest(`cameras must contain 1..${MAX_CAMERAS} entries`);
  }
  const width = pixelDimension(input.width, 'width');
  const height = pixelDimension(input.height, 'height');
  const totalPixels = width * height * input.cameras.length;
  if (!Number.isSafeInteger(totalPixels) || totalPixels > MAX_CAMERA_TOTAL_PIXELS) {
    throw badRequest(
      `camera request has ${totalPixels} total pixels; maximum is ${MAX_CAMERA_TOTAL_PIXELS}`,
    );
  }
  const targetAspect = width / height;
  const cameras = input.cameras.map((value, index) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw badRequest(`cameras[${index}] must be an object`);
    }
    const allowed = new Set(['position', 'target', 'up', 'fovDeg', 'aspect', 'near', 'far']);
    for (const key of Object.keys(value)) {
      if (!allowed.has(key)) throw badRequest(`cameras[${index}].${key} is unknown`);
    }
    const position = finiteTuple3(value.position, `cameras[${index}].position`);
    const target = finiteTuple3(value.target, `cameras[${index}].target`);
    const up = finiteTuple3(value.up, `cameras[${index}].up`);
    const view = target.map((component, axis) => component - position[axis]);
    const viewLength = Math.hypot(...view);
    const upLength = Math.hypot(...up);
    if (viewLength < 1e-9) throw badRequest(`cameras[${index}].target must differ from position`);
    if (upLength < 1e-9) throw badRequest(`cameras[${index}].up must be non-zero`);
    const cross = [
      view[1] * up[2] - view[2] * up[1],
      view[2] * up[0] - view[0] * up[2],
      view[0] * up[1] - view[1] * up[0],
    ];
    if (Math.hypot(...cross) <= viewLength * upLength * 1e-9) {
      throw badRequest(`cameras[${index}].up must not be collinear with view`);
    }
    const fovDeg = finiteNumber(value.fovDeg, `cameras[${index}].fovDeg`);
    const aspect = finiteNumber(value.aspect, `cameras[${index}].aspect`);
    const near = finiteNumber(value.near, `cameras[${index}].near`);
    const far = finiteNumber(value.far, `cameras[${index}].far`);
    if (fovDeg <= 0 || fovDeg >= 180) {
      throw badRequest(`cameras[${index}].fovDeg must be in (0,180)`);
    }
    if (aspect <= 0) throw badRequest(`cameras[${index}].aspect must be positive`);
    if (near <= 0) throw badRequest(`cameras[${index}].near must be positive`);
    if (far <= near) throw badRequest(`cameras[${index}].far must exceed near`);
    if (Math.abs(aspect - targetAspect) > Math.max(1, targetAspect) * 1e-9) {
      throw badRequest(`cameras[${index}].aspect must equal width/height`);
    }
    return { position, target, up, fovDeg, aspect, near, far };
  });
  const lightingPresetId = input.lightingPresetId === undefined
    ? SUPPORTED_LIGHTING_PRESET_ID
    : input.lightingPresetId;
  if (!isPresentationPresetId(lightingPresetId)) {
    throw badRequest(supportedPresetMessage('lighting_preset_id'));
  }
  return { cameras, width, height, lightingPresetId, totalPixels };
}

/** Parse only render-mode fields; GLB/auth/body-size validation remains in the server. */
export function validateRenderMode(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw badRequest('render body must be an object');
  }
  if (body.cameras !== undefined) {
    if (body.views !== undefined || body.size !== undefined || body.beauty_size !== undefined) {
      throw badRequest('camera mode is mutually exclusive with views, size, and beauty_size');
    }
    if (body.background !== undefined) {
      throw badRequest('camera mode cannot override the neutral-studio-v1 background');
    }
    const allowed = new Set([
      'glb_base64',
      'input_glb_sha256',
      'cameras',
      'width',
      'height',
      'lighting_preset_id',
    ]);
    for (const key of Object.keys(body)) {
      if (body[key] !== undefined && !allowed.has(key)) {
        throw badRequest(`camera mode field ${key} is unknown`);
      }
    }
    const camera = validateCameraMode({
      cameras: body.cameras,
      width: body.width,
      height: body.height,
      lightingPresetId: body.lighting_preset_id,
    });
    return { mode: 'camera', ...camera };
  }
  if (body.width !== undefined || body.height !== undefined || body.lighting_preset_id !== undefined) {
    throw badRequest('width, height, and lighting_preset_id require cameras');
  }
  return {
    mode: 'legacy',
    viewDirs: validateViewDirs(body.views),
    size: body.size,
    beautySize: body.beauty_size,
    background: body.background,
  };
}

export function sha256(bytes) {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
}

const SHA256_IDENTITY_RE = /^sha256:[0-9a-f]{64}$/;

/**
 * Compute the identity of the exact GLB bytes the renderer will consume. A new
 * caller may also assert its expected identity; legacy callers omit the claim
 * and still receive the computed identity in the response.
 */
export function validateInputGlbIdentity(bytes, claimedIdentity) {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0) {
    throw badRequest('GLB identity requires non-empty bytes');
  }
  const actual = sha256(bytes);
  if (claimedIdentity === undefined) return actual;
  if (typeof claimedIdentity !== 'string' || !SHA256_IDENTITY_RE.test(claimedIdentity)) {
    throw badRequest('input_glb_sha256 must be sha256:<64 lowercase hex characters>');
  }
  if (claimedIdentity !== actual) {
    throw badRequest('input_glb_sha256 does not match glb_base64 bytes');
  }
  return actual;
}

const FIDELITY_TIMING_KEYS = new Set([
  'loadMs',
  'viewsMs',
  'beautyMs',
  'totalMs',
  'queueWaitMs',
  'queueAndTotalMs',
]);

function cloneCamera(camera) {
  return {
    position: [...camera.position],
    target: [...camera.target],
    up: [...camera.up],
    fovDeg: camera.fovDeg,
    aspect: camera.aspect,
    near: camera.near,
    far: camera.far,
  };
}

/**
 * Mint the additive renderer-side fidelity receipt only after all identity and
 * camera/profile claims have been checked against the request and actual result.
 *
 * `exactArtifact` is deliberately false: this service attests the exact GLB
 * bytes it rendered, but only the caller knows whether those bytes are the
 * persisted/final artifact rather than an in-loop or derivative GLB.
 */
export function buildRenderFidelityV1({
  rendererId,
  inputGlbSha256,
  presentationProfile,
  renderMode,
  resolvedCameras,
  timings,
}) {
  if (
    typeof rendererId !== 'string'
    || rendererId.trim() !== rendererId
    || rendererId.length < 1
    || rendererId.length > 160
  ) {
    throw badRequest('rendererId must be a non-empty string of at most 160 characters');
  }
  if (typeof inputGlbSha256 !== 'string' || !SHA256_IDENTITY_RE.test(inputGlbSha256)) {
    throw badRequest('inputGlbSha256 must be sha256:<64 lowercase hex characters>');
  }
  if (!isPresentationPresetId(presentationProfile)) {
    throw badRequest(supportedPresetMessage('presentationProfile'));
  }
  if (!renderMode || (renderMode.mode !== 'camera' && renderMode.mode !== 'legacy')) {
    throw badRequest('renderMode must be a validated camera or legacy render mode');
  }
  if (!Array.isArray(resolvedCameras)) {
    throw badRequest('resolvedCameras must be an array');
  }

  const requestedCameras = renderMode.mode === 'camera'
    ? renderMode.cameras.map(cloneCamera)
    : [];
  if (
    resolvedCameras.length !== requestedCameras.length
    || JSON.stringify(resolvedCameras) !== JSON.stringify(requestedCameras)
  ) {
    throw badRequest('resolved cameras do not match the validated requested cameras');
  }

  if (!timings || typeof timings !== 'object' || Array.isArray(timings)) {
    throw badRequest('timings must be an object');
  }
  const checkedTimings = {};
  for (const [key, value] of Object.entries(timings)) {
    if (!FIDELITY_TIMING_KEYS.has(key)) throw badRequest(`timings.${key} is unknown`);
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      throw badRequest(`timings.${key} must be a non-negative finite number`);
    }
    checkedTimings[key] = value;
  }
  if (checkedTimings.totalMs === undefined || checkedTimings.queueAndTotalMs === undefined) {
    throw badRequest('timings must include totalMs and queueAndTotalMs');
  }
  if (checkedTimings.queueAndTotalMs < checkedTimings.totalMs) {
    throw badRequest('timings.queueAndTotalMs must be at least totalMs');
  }
  if (
    checkedTimings.queueWaitMs !== undefined
    && checkedTimings.queueWaitMs > checkedTimings.queueAndTotalMs
  ) {
    throw badRequest('timings.queueWaitMs must not exceed queueAndTotalMs');
  }

  return {
    version: RENDER_FIDELITY_VERSION,
    producer: RENDER_FIDELITY_PRODUCER,
    requested: 'full-preferred',
    delivered: 'full-material',
    materialFaithful: true,
    exactArtifact: false,
    rendererId,
    inputGlbSha256,
    degraded: false,
    presentationProfile,
    renderMode: renderMode.mode,
    requestedCameras,
    resolvedCameras: resolvedCameras.map(cloneCamera),
    timings: checkedTimings,
  };
}

/** Canonical identity of an ordered output set; it is not a composite-image hash. */
export function outputSetSha256(outputs) {
  const hash = createHash('sha256');
  hash.update('kiln-render-output-set-v1\0');
  for (const output of outputs) {
    const size = Buffer.allocUnsafe(4);
    size.writeUInt32BE(output.byteLength);
    hash.update(size);
    hash.update(output);
  }
  return `sha256:${hash.digest('hex')}`;
}

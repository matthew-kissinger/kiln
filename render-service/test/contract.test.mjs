import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  MAX_CAMERA_TOTAL_PIXELS,
  MAX_CAMERAS,
  RENDER_FIDELITY_PRODUCER,
  RENDER_FIDELITY_VERSION,
  RENDER_OPERATIONAL_EVIDENCE_VERSION,
  RENDER_OUTCOME_CODES,
  SUPPORTED_LIGHTING_PRESET_ID,
  buildRenderOperationalEvidenceV1,
  buildRenderFidelityV1,
  createSerialRenderQueue,
  httpRenderOutcomeCode,
  outputSetSha256,
  sha256,
  validateInputGlbIdentity,
  validateCameraMode,
  validateRenderMode,
  validateViewDirs,
} from '../src/contract.mjs';

const camera = (overrides = {}) => ({
  position: [12, 8, 15],
  target: [0, 1, 0],
  up: [0, 1, 0],
  fovDeg: 50,
  aspect: 16 / 9,
  near: 0.1,
  far: 500,
  ...overrides,
});

const exactBody = (overrides = {}) => ({
  glb_base64: 'not-used-by-mode-parser',
  cameras: [camera()],
  width: 1280,
  height: 720,
  lighting_preset_id: SUPPORTED_LIGHTING_PRESET_ID,
  ...overrides,
});

const throws400 = (fn, pattern) => {
  assert.throws(fn, (error) => error?.status === 400 && pattern.test(error.message));
};

describe('provider-free render contract', () => {
  it('keeps the legacy direction request shape and defaults unchanged', () => {
    const parsed = validateRenderMode({ size: 384, beauty_size: 1024 });
    assert.equal(parsed.mode, 'legacy');
    assert.equal(parsed.size, 384);
    assert.equal(parsed.beautySize, 1024);
    assert.equal(parsed.viewDirs.length, 6);
    parsed.viewDirs[0][0] = 99;
    assert.equal(validateViewDirs(undefined)[0][0], 1);

    const requested = [[1, 0, 0], [0, 0, -1]];
    const directions = validateViewDirs(requested);
    assert.deepEqual(directions, requested);
    assert.notEqual(directions, requested);
    assert.notEqual(directions[0], requested[0]);
  });

  it('normalizes one exact camera mode and clones all transport tuples', () => {
    const body = exactBody();
    const parsed = validateRenderMode(body);
    assert.deepEqual(parsed, {
      mode: 'camera',
      cameras: [camera()],
      width: 1280,
      height: 720,
      lightingPresetId: SUPPORTED_LIGHTING_PRESET_ID,
      totalPixels: 1280 * 720,
    });
    assert.notEqual(parsed.cameras, body.cameras);
    assert.notEqual(parsed.cameras[0].position, body.cameras[0].position);
    assert.equal(validateRenderMode({ ...body, lighting_preset_id: undefined }).lightingPresetId,
      SUPPORTED_LIGHTING_PRESET_ID);
    assert.equal(validateRenderMode({
      ...body,
      input_glb_sha256: `sha256:${'a'.repeat(64)}`,
    }).mode, 'camera');
  });

  it('rejects mixed legacy and exact selectors in either direction', () => {
    for (const legacy of [{ views: [[1, 0, 0]] }, { size: 512 }, { beauty_size: 1024 }]) {
      throws400(() => validateRenderMode({ ...exactBody(), ...legacy }), /mutually exclusive/);
    }
    throws400(() => validateRenderMode({ ...exactBody(), mystery_option: true }), /unknown/);
    throws400(() => validateRenderMode({ ...exactBody(), background: '#000000' }), /cannot override/);
    for (const cameraOnly of [{ width: 1 }, { height: 1 }, { lighting_preset_id: SUPPORTED_LIGHTING_PRESET_ID }]) {
      throws400(() => validateRenderMode(cameraOnly), /require cameras/);
    }
  });

  it('bounds dimensions, camera count, and total transient pixels', () => {
    throws400(() => validateCameraMode({ cameras: [], width: 1, height: 1 }), /1\.\.12/);
    throws400(() => validateCameraMode({
      cameras: Array.from({ length: MAX_CAMERAS + 1 }, () => camera({ aspect: 1 })),
      width: 1,
      height: 1,
    }), /1\.\.12/);
    throws400(() => validateCameraMode({ cameras: [camera()], width: 0, height: 720 }), /width/);
    throws400(() => validateCameraMode({ cameras: [camera()], width: 1280, height: 4097 }), /height/);
    throws400(() => validateCameraMode({
      cameras: [camera({ aspect: 1 }), camera({ aspect: 1 })],
      width: 4096,
      height: 4096,
    }), /total pixels/);
    const boundary = validateCameraMode({
      cameras: [camera({ aspect: 1 })],
      width: 4096,
      height: 4096,
    });
    assert.equal(boundary.totalPixels, MAX_CAMERA_TOTAL_PIXELS);
  });

  it('fails closed on malformed or ambiguous perspective cameras', () => {
    const base = { cameras: [camera()], width: 1280, height: 720 };
    throws400(() => validateCameraMode({ ...base, cameras: [{ ...camera(), surprise: true }] }), /unknown/);
    throws400(() => validateCameraMode({ ...base, cameras: [camera({ position: [0, 0] })] }), /position/);
    throws400(() => validateCameraMode({ ...base, cameras: [camera({ target: [12, 8, 15] })] }), /differ/);
    throws400(() => validateCameraMode({ ...base, cameras: [camera({ up: [0, 0, 0] })] }), /non-zero/);
    throws400(() => validateCameraMode({ ...base, cameras: [camera({ up: [12, 7, 15] })] }), /collinear/);
    throws400(() => validateCameraMode({ ...base, cameras: [camera({ fovDeg: 180 })] }), /fovDeg/);
    throws400(() => validateCameraMode({ ...base, cameras: [camera({ near: 0 })] }), /near/);
    throws400(() => validateCameraMode({ ...base, cameras: [camera({ far: 0.05 })] }), /far/);
    throws400(() => validateCameraMode({ ...base, cameras: [camera({ aspect: 1 })] }), /width\/height/);
    throws400(() => validateCameraMode({ ...base, lightingPresetId: 'dramatic-night-v1' }), /neutral-studio-v1/);
  });

  it('binds ordered output identity without pretending it is a composite hash', () => {
    const first = Buffer.from('first');
    const second = Buffer.from('second');
    assert.match(sha256(first), /^sha256:[0-9a-f]{64}$/);
    assert.equal(outputSetSha256([first, second]), outputSetSha256([first, second]));
    assert.notEqual(outputSetSha256([first, second]), outputSetSha256([second, first]));
    assert.notEqual(outputSetSha256([first, second]), outputSetSha256([Buffer.concat([first, second])]));
  });

  it('computes the exact input GLB identity and fails closed on a claimed mismatch', () => {
    const glb = Buffer.from('glTF exact bytes');
    const identity = validateInputGlbIdentity(glb);
    assert.equal(identity, sha256(glb));
    assert.equal(validateInputGlbIdentity(glb, identity), identity);
    throws400(
      () => validateInputGlbIdentity(glb, 'sha256:not-a-digest'),
      /input_glb_sha256 must be sha256/,
    );
    throws400(
      () => validateInputGlbIdentity(glb, sha256(Buffer.from('different bytes'))),
      /does not match glb_base64 bytes/,
    );
  });

  it('builds a frozen additive full-material fidelity receipt for exact camera bytes', () => {
    const mode = validateRenderMode(exactBody());
    const inputGlbSha256 = sha256(Buffer.from('glTF exact bytes'));
    const timings = {
      loadMs: 2.5,
      viewsMs: 8,
      beautyMs: 0,
      totalMs: 10.5,
      queueAndTotalMs: 12,
    };
    const receipt = buildRenderFidelityV1({
      rendererId: 'dawn-vulkan:test-device',
      inputGlbSha256,
      presentationProfile: SUPPORTED_LIGHTING_PRESET_ID,
      renderMode: mode,
      resolvedCameras: mode.cameras,
      timings,
    });

    assert.deepEqual(receipt, {
      version: RENDER_FIDELITY_VERSION,
      producer: RENDER_FIDELITY_PRODUCER,
      requested: 'full-preferred',
      delivered: 'full-material',
      materialFaithful: true,
      // The service attests the exact bytes it rendered, not whether those bytes
      // are the caller's persisted/final artifact.
      exactArtifact: false,
      rendererId: 'dawn-vulkan:test-device',
      inputGlbSha256,
      degraded: false,
      presentationProfile: SUPPORTED_LIGHTING_PRESET_ID,
      renderMode: 'camera',
      requestedCameras: [camera()],
      resolvedCameras: [camera()],
      timings: {
        loadMs: 2.5,
        viewsMs: 8,
        beautyMs: 0,
        totalMs: 10.5,
        queueAndTotalMs: 12,
      },
    });
    assert.notEqual(receipt.requestedCameras, mode.cameras);
    assert.notEqual(receipt.resolvedCameras, mode.cameras);
    assert.notEqual(receipt.timings, timings);
  });

  it('rejects forged camera/profile/timing fidelity instead of minting a false receipt', () => {
    const mode = validateRenderMode(exactBody());
    const common = {
      rendererId: 'dawn-vulkan:test-device',
      inputGlbSha256: sha256(Buffer.from('glTF exact bytes')),
      presentationProfile: SUPPORTED_LIGHTING_PRESET_ID,
      renderMode: mode,
      resolvedCameras: mode.cameras,
      timings: { totalMs: 10, queueAndTotalMs: 12 },
    };
    throws400(
      () => buildRenderFidelityV1({ ...common, presentationProfile: 'other-profile' }),
      /presentationProfile must be neutral-studio-v1/,
    );
    throws400(
      () => buildRenderFidelityV1({
        ...common,
        resolvedCameras: [camera({ position: [99, 8, 15] })],
      }),
      /resolved cameras do not match/,
    );
    throws400(
      () => buildRenderFidelityV1({ ...common, timings: { totalMs: -1 } }),
      /timings.totalMs must be a non-negative finite number/,
    );
    throws400(
      () => buildRenderFidelityV1({ ...common, timings: { totalMs: 1, secretMs: 2 } }),
      /timings.secretMs is unknown/,
    );
    throws400(
      () => buildRenderFidelityV1({
        ...common,
        timings: { totalMs: 10, queueAndTotalMs: 9 },
      }),
      /queueAndTotalMs must be at least totalMs/,
    );
    throws400(
      () => buildRenderFidelityV1({
        ...common,
        timings: { totalMs: 10, queueWaitMs: 13, queueAndTotalMs: 12 },
      }),
      /queueWaitMs must not exceed queueAndTotalMs/,
    );
  });

  it('keeps legacy fidelity additive with no invented perspective cameras', () => {
    const mode = validateRenderMode({ views: [[1, 0, 0]], size: 384 });
    const receipt = buildRenderFidelityV1({
      rendererId: 'dawn-vulkan:test-device',
      inputGlbSha256: sha256(Buffer.from('glTF exact bytes')),
      presentationProfile: SUPPORTED_LIGHTING_PRESET_ID,
      renderMode: mode,
      resolvedCameras: [],
      timings: { totalMs: 10, queueAndTotalMs: 12 },
    });
    assert.equal(receipt.renderMode, 'legacy');
    assert.deepEqual(receipt.requestedCameras, []);
    assert.deepEqual(receipt.resolvedCameras, []);
  });

  it('maps HTTP outcomes to one frozen low-cardinality code set', () => {
    assert.deepEqual(RENDER_OUTCOME_CODES, [
      'health_ok',
      'gpu_success',
      'auth_rejected',
      'request_rejected',
      'not_implemented',
      'route_not_found',
      'render_failed',
    ]);
    assert.equal(httpRenderOutcomeCode({ method: 'GET', path: '/health', status: 200 }), 'health_ok');
    assert.equal(httpRenderOutcomeCode({ method: 'POST', path: '/render', status: 200 }), 'gpu_success');
    assert.equal(httpRenderOutcomeCode({ method: 'POST', path: '/render', status: 401 }), 'auth_rejected');
    assert.equal(httpRenderOutcomeCode({ method: 'POST', path: '/render', status: 400 }), 'request_rejected');
    assert.equal(httpRenderOutcomeCode({ method: 'POST', path: '/render', status: 413 }), 'request_rejected');
    assert.equal(httpRenderOutcomeCode({ method: 'POST', path: '/bake', status: 501 }), 'not_implemented');
    assert.equal(httpRenderOutcomeCode({ method: 'GET', path: '/missing', status: 404 }), 'route_not_found');
    assert.equal(httpRenderOutcomeCode({ method: 'POST', path: '/render', status: 500 }), 'render_failed');
  });

  it('builds bounded queue/concurrency evidence with only stable fields', () => {
    const evidence = buildRenderOperationalEvidenceV1({
      outcomeCode: 'gpu_success',
      queueWaitMs: 24.25,
      queueDepthAtEnqueue: 2,
      concurrencyAtStart: 1,
      firstRenderInProcess: true,
      workerAgeMsAtStart: 1_234.5,
    });
    assert.deepEqual(evidence, {
      version: RENDER_OPERATIONAL_EVIDENCE_VERSION,
      outcomeCode: 'gpu_success',
      queueWaitMs: 24.3,
      queueDepthAtEnqueue: 2,
      concurrencyAtStart: 1,
      concurrencyLimit: 1,
      workerPhase: 'first-render',
      workerAgeMsAtStart: 1_234.5,
      evidenceClamped: false,
    });
    assert.deepEqual(Object.keys(evidence).sort(), [
      'concurrencyAtStart',
      'concurrencyLimit',
      'evidenceClamped',
      'outcomeCode',
      'queueDepthAtEnqueue',
      'queueWaitMs',
      'version',
      'workerAgeMsAtStart',
      'workerPhase',
    ]);
  });

  it('caps operational evidence without creating unbounded values or identifiers', () => {
    const evidence = buildRenderOperationalEvidenceV1({
      outcomeCode: 'render_failed',
      queueWaitMs: 999_999_999,
      queueDepthAtEnqueue: 99_999,
      concurrencyAtStart: 1,
      firstRenderInProcess: false,
      workerAgeMsAtStart: 999_999_999,
    });
    assert.deepEqual(evidence, {
      version: RENDER_OPERATIONAL_EVIDENCE_VERSION,
      outcomeCode: 'render_failed',
      queueWaitMs: 86_400_000,
      queueDepthAtEnqueue: 10_000,
      concurrencyAtStart: 1,
      concurrencyLimit: 1,
      workerPhase: 'warm-render',
      workerAgeMsAtStart: 86_400_000,
      evidenceClamped: true,
    });
  });

  it('rejects malformed operational evidence and unknown outcome cardinality', () => {
    const common = {
      outcomeCode: 'gpu_success',
      queueWaitMs: 1,
      queueDepthAtEnqueue: 0,
      concurrencyAtStart: 1,
      firstRenderInProcess: false,
      workerAgeMsAtStart: 2,
    };
    throws400(
      () => buildRenderOperationalEvidenceV1({ ...common, outcomeCode: 'gpu:test-device-123' }),
      /outcomeCode is not supported/,
    );
    throws400(
      () => buildRenderOperationalEvidenceV1({ ...common, queueWaitMs: -1 }),
      /queueWaitMs must be a non-negative finite number/,
    );
    throws400(
      () => buildRenderOperationalEvidenceV1({ ...common, queueDepthAtEnqueue: 1.5 }),
      /queueDepthAtEnqueue must be a non-negative integer/,
    );
    throws400(
      () => buildRenderOperationalEvidenceV1({ ...common, concurrencyAtStart: 2 }),
      /concurrencyAtStart must be 1/,
    );
    throws400(
      () => buildRenderOperationalEvidenceV1({ ...common, firstRenderInProcess: 'yes' }),
      /firstRenderInProcess must be boolean/,
    );
    throws400(
      () => buildRenderOperationalEvidenceV1({ ...common, privateRequestId: 'high-cardinality' }),
      /privateRequestId is unknown/,
    );
  });

  it('serial queue reports jobs ahead, concurrency one, and first versus warm start', async () => {
    let now = 100;
    const queue = createSerialRenderQueue({ now: () => now, processStartedAt: 0 });
    let releaseFirst;
    const firstGate = new Promise((resolve) => { releaseFirst = resolve; });
    const starts = [];
    const first = queue.enqueue(async (start) => {
      starts.push(start);
      await firstGate;
      return 'first';
    });
    await Promise.resolve();
    assert.deepEqual(starts[0], {
      queueWaitMs: 0,
      queueDepthAtEnqueue: 0,
      concurrencyAtStart: 1,
      firstRenderInProcess: true,
      workerAgeMsAtStart: 100,
    });

    now = 110;
    const second = queue.enqueue(async (start) => {
      starts.push(start);
      return 'second';
    });
    await Promise.resolve();
    assert.equal(starts.length, 1, 'the second job must not overlap the first');

    now = 130;
    releaseFirst();
    assert.equal(await first, 'first');
    assert.equal(await second, 'second');
    assert.deepEqual(starts[1], {
      queueWaitMs: 20,
      queueDepthAtEnqueue: 1,
      concurrencyAtStart: 1,
      firstRenderInProcess: false,
      workerAgeMsAtStart: 130,
    });
  });

  it('serial queue settles a failed render and still starts the next job warm', async () => {
    let now = 10;
    const queue = createSerialRenderQueue({ now: () => now, processStartedAt: 0 });
    await assert.rejects(queue.enqueue(async () => { throw new Error('device lost'); }), /device lost/);
    now = 20;
    const next = await queue.enqueue(async (start) => start);
    assert.deepEqual(next, {
      queueWaitMs: 0,
      queueDepthAtEnqueue: 0,
      concurrencyAtStart: 1,
      firstRenderInProcess: false,
      workerAgeMsAtStart: 20,
    });
  });
});

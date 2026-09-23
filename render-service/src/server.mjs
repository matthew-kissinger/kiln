// HTTP surface. Contract (plan B2):
//   GET  /health, /ping       -> 200 {ok, rendererId, adapter, capabilities, authRequired}
//                                (never 503: a software or absent adapter aborts boot below,
//                                 so a listening server always implies a hardware adapter)
//   POST /render legacy: {glb_base64, input_glb_sha256?, size?, views?, beauty_size?, backdrop?}
//   POST /render camera: {glb_base64, input_glb_sha256?, cameras, width, height,
//                         lighting_preset_id?, backdrop?}
//                             -> 200 legacy response unchanged, or exact camera
//                                receipt metadata + ordered output identities
//                                (`input_glb_sha256` opts into an additive,
//                                 hash-verified material-fidelity receipt)
//                             -> 400 on a malformed/over-long views[] (max 12).
//                                Exactly one PNG comes back per requested view,
//                                in request order — the caller composites a grid
//                                whose shape it chose from that length, so this
//                                rejects rather than truncating.
//   POST /bake                -> 501 (texture bakes are a later workstream)
// Auth: $RENDER_SERVICE_TOKEN on POST routes, supplied as either
// `x-render-token: <token>` or
// `Authorization: Bearer <token>`. The custom header exists because RunPod's
// load-balancer gateway consumes Authorization for its own edge API-key auth, so
// gateway callers can never deliver an app-layer bearer token through it.
// A token is OPTIONAL on a loopback bind and REQUIRED on any wider one; see
// bind-policy.mjs, which refuses the boot rather than warning about it.
// Renders are serialized: one GPU, one queue.
import { createServer } from 'node:http';
import { realpathSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRESENTATION_PROFILE_ID, initRenderer, renderGlb } from './renderer.mjs';
import {
  describeInstance,
  parseOwnerPid,
  createServiceLifecycle,
  serviceLifecycleOptions,
} from './instance.mjs';
import { acquireGpu } from './gpu.mjs';
import { buildHealthDocument } from './health-contract.mjs';
import { describeBind, resolveBindPolicy } from './bind-policy.mjs';
import { createRendererCaptureIdentity } from './cache-identity.mjs';
import { validateSelfContainedGlb } from './glb-input.mjs';
import { readBoundedBody, requestCancellation } from './request-limits.mjs';
import { buildCompatibility, resolvedRendererDependencies } from './build-identity.mjs';
import {
  buildRenderFidelityV1,
  buildRenderOperationalEvidenceV1,
  createSerialRenderQueue,
  httpRenderOutcomeCode,
  outputSetSha256,
  sha256,
  validateInputGlbIdentity,
  validateRenderMode,
} from './contract.mjs';

const PROCESS_STARTED_AT = performance.now();
const PORT = Number(process.env.PORT ?? 8000);
// Who this process is, answered on /health so the host that finds it can tell a
// current shared renderer from a stale orphan. The owner is the host that
// started it on demand; a hand-started service has none and outlives sessions.
const SOURCE_DIR = fileURLToPath(new URL('.', import.meta.url));
const OWNER_PID = parseOwnerPid(process.env.RENDER_SERVICE_OWNER_PID);
const LIFECYCLE = serviceLifecycleOptions(process.env);
const COMPATIBILITY = buildCompatibility({
  sourceDir: SOURCE_DIR,
  dependencies: resolvedRendererDependencies(),
});
const INSTANCE = describeInstance({
  pid: process.pid,
  ownerPid: OWNER_PID,
  startedAt: new Date().toISOString(),
  sourceDir: realpathSync(dirname(SOURCE_DIR)),
  sourceFingerprint: COMPATIBILITY.sourceFingerprint,
  ...LIFECYCLE,
});
const TOKEN = process.env.RENDER_SERVICE_TOKEN ?? '';
// Unset now means loopback, and a wider bind has to say so AND carry a token.
// `bind-policy.mjs` owns that rule and the reasoning; the container sets
// HOST=0.0.0.0 explicitly, so its bind is a decision rather than an inheritance.
// This runs BEFORE the GPU is acquired: a misconfiguration should cost the
// operator a message, not thirty seconds of adapter initialization first.
let bind;
try {
  bind = resolveBindPolicy({
    host: process.env.HOST,
    token: TOKEN,
    allowUnauthenticated: process.env.RENDER_SERVICE_ALLOW_UNAUTHENTICATED,
  });
} catch (e) {
  console.error(`FATAL: ${e.message}`);
  process.exit(1);
}

const MAX_BODY = 96 * 1024 * 1024; // 64MB base64 ≈ 48MB GLB, plus JSON overhead
const MAX_GLB = 48 * 1024 * 1024;

// Boot assertion: a software adapter must prevent the service from starting at all,
// so a driver regression yields a service that will not boot rather than one that
// silently renders everything on CPU.
let gpuState;
try {
  gpuState = await acquireGpu();
  await initRenderer();
} catch (e) {
  console.error(`FATAL: ${e.message}`);
  process.exit(1);
}
gpuState.captureIdentity = createRendererCaptureIdentity(gpuState);
gpuState.compatibility = COMPATIBILITY;
console.log(`adapter: ${JSON.stringify(gpuState.summary)}`);
console.log(`rendererId: ${gpuState.rendererId}`);
// Only reachable on a loopback bind or an explicit waiver -- an exposed bind with
// no token never got this far. So this is information, not a warning: on loopback
// the absence of a token is the correct, documented, zero-config default.
if (!TOKEN && bind.exposed)
  console.warn(
    'WARNING: exposed bind with RENDER_SERVICE_ALLOW_UNAUTHENTICATED=1 — POST routes are UNAUTHENTICATED',
  );

let lifecycle;
const renderQueue = createSerialRenderQueue({
  processStartedAt: PROCESS_STARTED_AT,
  onActivity: ({ admittedJobs }) => lifecycle?.setActivity(admittedJobs),
});

function send(res, status, obj) {
  if (res.destroyed || res.writableEnded) return;
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
}

const server = createServer(async (req, res) => {
  const started = performance.now();
  const cancellation = requestCancellation(req, res);
  let admission;
  // Accumulated across the handler and emitted exactly once by done(). Only
  // names and sizes go in here — never a token, a header value, or GLB bytes.
  // Path only, never the query string: nothing here accepts a token as a query
  // parameter, but logging the raw URL would make any future one a disclosure.
  const log = {
    method: req.method,
    path: String(req.url ?? '')
      .split('?')[0]
      .slice(0, 200),
    auth: 'not-required',
  };
  const done = (status, obj) => {
    if (status >= 400 && !req.complete && !res.destroyed) {
      res.setHeader('connection', 'close');
      res.once('finish', () => req.destroy());
    }
    send(res, status, obj);
    const outcomeCode = httpRenderOutcomeCode({
      method: log.method,
      path: log.path,
      status,
    });
    console.log(
      JSON.stringify({
        evt: 'request',
        ...log,
        outcomeCode,
        status,
        ...(status >= 400 && obj?.error ? { error: obj.error } : {}),
        ms: +(performance.now() - started).toFixed(1),
      }),
    );
  };
  try {
    // /ping: RunPod load-balancer health convention (200 = healthy). The boot
    // assertion guarantees a listening server implies a hardware adapter.
    if (req.method === 'GET' && (req.url === '/health' || req.url === '/ping')) {
      // Capability advertisement, not decoration: a GitHub-build endpoint carries
      // no commit stamp, so this is the only way a caller can tell WHICH build is
      // live before depending on a feature. The pure builder is contract-tested
      // without booting a GPU and advertises every registry ID explicitly.
      return done(200, buildHealthDocument(gpuState, Boolean(TOKEN), INSTANCE));
    }
    if (req.method === 'POST' && (req.url === '/render' || req.url === '/bake')) {
      if (TOKEN) {
        const auth = req.headers.authorization ?? '';
        const custom = req.headers['x-render-token'] ?? '';
        if (auth !== `Bearer ${TOKEN}` && custom !== TOKEN) {
          log.auth = 'rejected';
          return done(401, { ok: false, error: 'unauthorized' });
        }
        // Which header carried it, never the value: the gateway strips
        // Authorization, so this distinguishes a gateway caller from a direct one.
        log.auth = 'ok';
        log.authVia = custom === TOKEN ? 'x-render-token' : 'authorization';
      } else {
        log.auth = 'disabled';
      }
      if (req.url === '/bake') return done(501, { ok: false, error: 'bake not implemented yet' });

      // Reserve before reading: even stalled uploads count against admission
      // and managed activity. Unknown/chunked lengths reserve the body ceiling.
      const declared = req.headers['content-length'];
      if (
        declared !== undefined &&
        (!/^\d+$/.test(declared) || !Number.isSafeInteger(Number(declared)))
      )
        return done(400, { ok: false, error: 'invalid content-length' });
      const reservationBytes = declared === undefined ? MAX_BODY : Number(declared);
      if (reservationBytes > MAX_BODY) return done(413, { ok: false, error: 'body too large' });
      admission = renderQueue.reserve({ bytes: reservationBytes, signal: cancellation.signal });
      let raw = await readBoundedBody(req, {
        signal: cancellation.signal,
        maxBytes: Math.max(1, reservationBytes),
        timeoutMs: 15000,
      });
      log.bodyBytes = raw.length;
      let body;
      try {
        body = JSON.parse(raw.toString('utf8'));
      } catch {
        return done(400, { ok: false, error: 'invalid JSON' });
      }
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return done(400, { ok: false, error: 'JSON body must be an object' });
      }
      if (typeof body.glb_base64 !== 'string' || !body.glb_base64) {
        return done(400, { ok: false, error: 'glb_base64 (string) required' });
      }
      const glb = Buffer.from(body.glb_base64, 'base64');
      log.glbBytes = glb.length;
      if (glb.length < 20 || glb.readUInt32LE(0) !== 0x46546c67) {
        return done(400, { ok: false, error: 'not a GLB (bad magic)' });
      }
      if (glb.length > MAX_GLB) return done(413, { ok: false, error: 'GLB too large' });
      validateSelfContainedGlb(glb);
      // New fidelity-aware callers assert the identity they sent. Legacy callers
      // omit it and retain their exact historical response shape.
      let inputGlbSha256;
      try {
        inputGlbSha256 = validateInputGlbIdentity(glb, body.input_glb_sha256);
      } catch (e) {
        return done(e.status ?? 400, { ok: false, error: String(e.message ?? e) });
      }
      const fidelityRequested = body.input_glb_sha256 !== undefined;
      log.inputGlbSha256 = inputGlbSha256;
      // Validated BEFORE the queue: malformed exact cameras or legacy views are
      // immediate 400s, not GPU-queue work. renderGlb validates again for direct callers.
      let renderMode;
      try {
        renderMode = validateRenderMode(body);
      } catch (e) {
        return done(e.status ?? 400, { ok: false, error: String(e.message ?? e) });
      }
      log.renderMode = renderMode.mode;
      if (renderMode.mode === 'camera') {
        log.camerasRequested = renderMode.cameras.length;
        log.width = renderMode.width;
        log.height = renderMode.height;
        log.totalPixels = renderMode.totalPixels;
        log.lightingPresetId = renderMode.lightingPresetId;
        log.backend = gpuState.backend;
        log.rendererId = gpuState.rendererId;
      } else {
        log.viewsRequested = renderMode.viewDirs.length;
      }
      // Do not retain encoded JSON/body buffers in queued request closures.
      raw = undefined;
      body = undefined;
      admission.resize(glb.length);

      const t0 = performance.now();
      const queued = await admission.run(async (operationalStart) => {
        log.renderOperationalStart = operationalStart;
        return {
          operationalStart,
          result: await renderGlb(
            glb,
            renderMode.mode === 'camera'
              ? {
                  cameras: renderMode.cameras,
                  width: renderMode.width,
                  height: renderMode.height,
                  lightingPresetId: renderMode.lightingPresetId,
                  backdrop: renderMode.backdrop,
                }
              : {
                  size: renderMode.size,
                  viewDirs: renderMode.viewDirs,
                  beautySize: renderMode.beautySize,
                  backdrop: renderMode.backdrop,
                },
          ),
        };
      });
      const result = queued.result;
      const timings = {
        ...result.timings,
        queueWaitMs: +queued.operationalStart.queueWaitMs.toFixed(1),
        queueAndTotalMs: +(performance.now() - t0).toFixed(1),
      };
      log.views = result.views.length;
      log.beauty = Boolean(result.beauty);
      log.timings = timings;
      const viewSha256 = result.views.map(sha256);
      const outputSetHash = outputSetSha256(result.views);
      if (renderMode.mode === 'camera') log.outputSetSha256 = outputSetHash;
      const appliedPresentationProfile = result.lightingPresetId ?? PRESENTATION_PROFILE_ID;
      const fidelity = fidelityRequested
        ? buildRenderFidelityV1({
            rendererId: gpuState.rendererId,
            inputGlbSha256,
            presentationProfile: appliedPresentationProfile,
            renderMode,
            resolvedCameras: result.cameras ?? [],
            timings,
          })
        : undefined;
      const operationalEvidence = buildRenderOperationalEvidenceV1({
        outcomeCode: 'gpu_success',
        ...queued.operationalStart,
      });
      log.operationalEvidence = operationalEvidence;
      delete log.renderOperationalStart;
      return done(200, {
        ok: true,
        rendererId: gpuState.rendererId,
        presentationProfile: appliedPresentationProfile,
        timings,
        views: result.views.map((b) => b.toString('base64')),
        ...(result.beauty ? { beauty: result.beauty.toString('base64') } : {}),
        ...(fidelity ? { inputGlbSha256, fidelity, operationalEvidence } : {}),
        ...(renderMode.mode === 'camera'
          ? {
              backend: gpuState.backend,
              cameras: result.cameras,
              width: result.width,
              height: result.height,
              lightingPresetId: result.lightingPresetId,
              viewSha256,
              outputSetSha256: outputSetHash,
              cameraReceipts: result.cameras.map((camera, index) => ({
                index,
                camera,
                width: result.width,
                height: result.height,
                outputSha256: viewSha256[index],
              })),
            }
          : {}),
      });
    }
    done(404, { ok: false, error: 'not found' });
  } catch (e) {
    if (log.renderOperationalStart && !log.operationalEvidence) {
      try {
        log.operationalEvidence = buildRenderOperationalEvidenceV1({
          outcomeCode: 'render_failed',
          ...log.renderOperationalStart,
        });
      } catch {
        /* never mask the original render failure with metrics evidence */
      }
      delete log.renderOperationalStart;
    }
    done(e.status ?? 500, { ok: false, error: String(e.message ?? e) });
  } finally {
    admission?.release();
    cancellation.dispose();
  }
});

server.requestTimeout = 20000;
server.headersTimeout = 10000;
server.once('close', () => lifecycle?.stop());

server.listen(PORT, bind.host, () => {
  lifecycle = createServiceLifecycle({
    ...LIFECYCLE,
    onIdle: () => {
      console.error(`managed renderer idle for ${LIFECYCLE.idleTimeoutMs}ms; exiting`);
      server.close(() => process.exit(0));
    },
  });
  lifecycle.setActivity(renderQueue.snapshot().admittedJobs);
  console.log(
    `kiln-render-service listening on ${describeBind(bind, { token: TOKEN, allowUnauthenticated: process.env.RENDER_SERVICE_ALLOW_UNAUTHENTICATED })}:${PORT}`,
  );
});

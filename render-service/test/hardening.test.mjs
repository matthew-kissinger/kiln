import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import test from 'node:test';
import { crc32, deflateSync } from 'node:zlib';
import { createSerialRenderQueue } from '../src/contract.mjs';
import { delay, simulatedService, until } from './http-service-fixture.mjs';

const tick = () => new Promise((resolve) => setImmediate(resolve));
function glb(json, bin) {
  const encoded = Buffer.from(JSON.stringify(json));
  const jsonSize = Math.ceil(encoded.length / 4) * 4;
  const binSize = bin ? Math.ceil(bin.length / 4) * 4 : 0;
  const bytes = Buffer.alloc(20 + jsonSize + (bin ? 8 + binSize : 0));
  bytes.writeUInt32LE(0x46546c67, 0);
  bytes.writeUInt32LE(2, 4);
  bytes.writeUInt32LE(bytes.length, 8);
  bytes.writeUInt32LE(jsonSize, 12);
  bytes.writeUInt32LE(0x4e4f534a, 16);
  bytes.fill(0x20, 20, 20 + jsonSize);
  encoded.copy(bytes, 20);
  if (bin) {
    bytes.writeUInt32LE(binSize, 20 + jsonSize);
    bytes.writeUInt32LE(0x004e4942, 24 + jsonSize);
    bin.copy(bytes, 28 + jsonSize);
  }
  return bytes;
}
const minimal = (overrides = {}) => ({ asset: { version: '2.0' }, ...overrides });
const pngHeader = (width = 1, height = 1) => {
  const b = Buffer.alloc(33);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(b);
  b.writeUInt32BE(13, 8);
  b.write('IHDR', 12);
  b.writeUInt32BE(width, 16);
  b.writeUInt32BE(height, 20);
  b[24] = 8;
  b[25] = 6;
  return b;
};
const pngChunk = (type, data) => {
  const bytes = Buffer.alloc(data.length + 12);
  bytes.writeUInt32BE(data.length);
  bytes.write(type, 4);
  data.copy(bytes, 8);
  bytes.writeUInt32BE(crc32(bytes.subarray(4, -4)), bytes.length - 4);
  return bytes;
};
const pngImage = (
  width = 1,
  height = 1,
  { interlace = 0, inflatedBytes = (width * 4 + 1) * height } = {},
) => {
  const header = pngHeader(width, height);
  header[28] = interlace;
  return Buffer.concat([
    header.subarray(0, 8),
    pngChunk('IHDR', header.subarray(16, 29)),
    pngChunk('IDAT', deflateSync(Buffer.alloc(inflatedBytes))),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
};

test('queue rejects excess admitted work before retaining its callback', async () => {
  const queue = createSerialRenderQueue({ maxJobs: 2, maxBytes: 10 });
  let release;
  const head = queue.enqueue(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
    { bytes: 6 },
  );
  await tick();
  const second = queue.enqueue(() => 2, { bytes: 4 });
  try {
    assert.throws(() => queue.enqueue(() => 3, { bytes: 1 }), /capacity|overloaded/);
  } finally {
    release();
    await Promise.allSettled([head, second]);
  }
});

test('queue cancels pending work immediately and leaves the active job alone', async () => {
  const queue = createSerialRenderQueue({ maxJobs: 2, maxBytes: 10 });
  let release;
  const head = queue.enqueue(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  await tick();
  const abort = new AbortController();
  let ran = false;
  let outcome = 'pending';
  const pending = queue.enqueue(
    () => {
      ran = true;
    },
    { signal: abort.signal, bytes: 10 },
  );
  pending.then(
    () => {
      outcome = 'resolved';
    },
    () => {
      outcome = 'rejected';
    },
  );
  try {
    abort.abort();
    await tick();
    assert.equal(outcome, 'rejected');
    assert.equal(ran, false);
    assert.equal(queue.snapshot().admittedJobs, 1);
    const replacement = queue.enqueue(() => 42, { bytes: 10 });
    release();
    assert.equal(await replacement, 42);
  } finally {
    release();
    await Promise.allSettled([head, pending]);
  }
});

test('admitted uploads count against limits, can resize, and release idempotently', () => {
  const queue = createSerialRenderQueue({ maxJobs: 2, maxBytes: 10 });
  const upload = queue.reserve({ bytes: 9 });
  assert.throws(() => queue.reserve({ bytes: 2 }), /capacity|overloaded/);
  upload.resize(4);
  const next = queue.reserve({ bytes: 6 });
  upload.release();
  upload.release();
  assert.equal(queue.snapshot().retainedBytes, 6);
  next.release();
  assert.equal(queue.snapshot().admittedJobs, 0);
});

test('an aborted running job remains active until native work settles', async () => {
  const queue = createSerialRenderQueue({ maxJobs: 2, maxBytes: 10 });
  const abort = new AbortController();
  let release;
  const run = queue.enqueue(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
    { signal: abort.signal, bytes: 5 },
  );
  const rejected = assert.rejects(run, { name: 'AbortError' });
  await tick();
  try {
    abort.abort();
    await tick();
    assert.equal(queue.snapshot().activeJobs, 1);
    assert.equal(queue.snapshot().retainedBytes, 5);
  } finally {
    release();
  }
  await rejected;
  assert.equal(queue.snapshot().admittedJobs, 0);
});

test('GLB validator accepts the real embedded material fixture and bounded data buffers', async () => {
  const { validateSelfContainedGlb } = await import('../src/glb-input.mjs');
  const fixture = readFileSync(new URL('./fixtures/material-channels-v1.glb', import.meta.url));
  assert.ok(validateSelfContainedGlb(fixture).bufferBytes > 0);
  const data = glb(
    minimal({ buffers: [{ byteLength: 4, uri: 'data:application/octet-stream;base64,AAAAAA==' }] }),
  );
  assert.equal(validateSelfContainedGlb(data).bufferBytes, 4);
});

test('GLB validator rejects every external buffer/image location before loader resolution', async () => {
  const { validateSelfContainedGlb } = await import('../src/glb-input.mjs');
  for (const uri of [
    'https://example.invalid/x',
    'http://127.0.0.1/x',
    'file:///secret',
    '../texture.png',
    '//host/x',
    'blob:other',
  ]) {
    for (const document of [
      minimal({ buffers: [{ byteLength: 4, uri }] }),
      minimal({ images: [{ uri }] }),
    ]) {
      assert.throws(() => validateSelfContainedGlb(glb(document)), /external|data URI/);
    }
  }
});

test('GLB validator bounds decoded PNGs and rejects unsupported image formats', async () => {
  const { validateSelfContainedGlb } = await import('../src/glb-input.mjs');
  const image = (bytes, mime = 'image/png') =>
    glb(minimal({ images: [{ uri: `data:${mime};base64,${bytes.toString('base64')}` }] }));
  assert.equal(validateSelfContainedGlb(image(pngImage(2, 3))).imagePixels, 6);
  assert.throws(
    () => validateSelfContainedGlb(image(pngHeader(100000, 100000))),
    /image|pixel|dimension/,
  );
  for (const mime of ['image/jpeg', 'image/webp', 'image/avif', 'image/ktx2']) {
    assert.throws(() => validateSelfContainedGlb(image(pngHeader(), mime)), /PNG|unsupported/);
  }
  assert.throws(
    () => validateSelfContainedGlb(image(pngHeader(4, 4)), { maxImagePixels: 15 }),
    /pixel/,
  );
});

test('queue preserves even falsy rejection reasons and validates its clock first', async () => {
  const queue = createSerialRenderQueue();
  const outcome = await queue
    .enqueue(() => Promise.reject(undefined))
    .then(
      () => 'resolved',
      () => 'rejected',
    );
  assert.equal(outcome, 'rejected');
  assert.throws(() => createSerialRenderQueue({ now: 4 }), /finite clock/);
});

test('GLB admission prevents interlaced PNG inflate bombs while preserving valid interlace', async () => {
  const { validateSelfContainedGlb } = await import('../src/glb-input.mjs');
  const image = (bytes) =>
    glb(minimal({ images: [{ uri: `data:image/png;base64,${bytes.toString('base64')}` }] }));
  assert.equal(validateSelfContainedGlb(image(pngImage(1, 1, { interlace: 1 }))).imagePixels, 1);
  assert.throws(
    () => validateSelfContainedGlb(image(pngImage(1, 1, { interlace: 1, inflatedBytes: 65536 }))),
    /PNG.*(inflate|scanline|budget)/,
  );
  assert.throws(
    () => validateSelfContainedGlb(image(pngHeader())),
    /PNG.*(truncated|chunk|IDAT|CRC)/,
  );
});

test('GLB data buffers cannot conceal excess decoded bytes behind declared byteLength', async () => {
  const { validateSelfContainedGlb } = await import('../src/glb-input.mjs');
  const bytes = glb(
    minimal({ buffers: [{ byteLength: 1, uri: 'data:application/octet-stream;base64,AAAAAA==' }] }),
  );
  assert.throws(() => validateSelfContainedGlb(bytes), /buffer.*(length|byteLength)/);
});

test('GLB admission bounds graph expansion and rejects cyclic or multiply parented nodes', async () => {
  const { validateSelfContainedGlb } = await import('../src/glb-input.mjs');
  for (const nodes of [
    [{ children: [0] }],
    [{ children: [1] }, { children: [0] }],
    [{ children: [2] }, { children: [2] }, {}],
  ]) {
    assert.throws(() => validateSelfContainedGlb(glb(minimal({ nodes }))), /node.*(cycle|parent)/);
  }
  assert.throws(
    () =>
      validateSelfContainedGlb(
        glb(minimal({ nodes: [{ children: [1] }, { children: [2] }, {}] })),
        { maxNodeDepth: 2 },
      ),
    /depth/,
  );
  assert.equal(
    validateSelfContainedGlb(glb(minimal({ nodes: [{ children: [1, 2] }, {}, {}] }))).nodeCount,
    3,
  );
  assert.throws(
    () =>
      validateSelfContainedGlb(
        glb(minimal({ meshes: [{ primitives: [{ attributes: {} }, { attributes: {} }] }] })),
        { maxPrimitives: 1 },
      ),
    /primitive.*budget/,
  );
});

test('GLB validator rejects invalid chunk lengths and buffer/accessor ranges', async () => {
  const { validateSelfContainedGlb } = await import('../src/glb-input.mjs');
  const wrong = glb(minimal());
  wrong.writeUInt32LE(wrong.length + 4, 8);
  assert.throws(() => validateSelfContainedGlb(wrong), /length/);
  assert.throws(
    () => validateSelfContainedGlb(glb(minimal({ buffers: [{ byteLength: 8 }] }), Buffer.alloc(4))),
    /buffer/,
  );
  assert.throws(
    () =>
      validateSelfContainedGlb(
        glb(
          minimal({ buffers: [{ byteLength: 4 }], bufferViews: [{ buffer: 0, byteLength: 8 }] }),
          Buffer.alloc(4),
        ),
      ),
    /bufferView|range/,
  );
  assert.throws(
    () =>
      validateSelfContainedGlb(
        glb(
          minimal({
            buffers: [{ byteLength: 4 }],
            bufferViews: [{ buffer: 0, byteLength: 4 }],
            accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' }],
          }),
          Buffer.alloc(4),
        ),
      ),
    /accessor|range/,
  );
});

test('managed idle waits for admitted work and ignores creator liveness; manual never expires', async () => {
  const { createServiceLifecycle } = await import('../src/instance.mjs');
  const timers = [];
  let closed = 0;
  const lifecycle = createServiceLifecycle({
    mode: 'managed',
    idleTimeoutMs: 10,
    setTimer: (fn) => {
      const timer = { fn, cleared: false };
      timers.push(timer);
      return timer;
    },
    clearTimer: (timer) => {
      timer.cleared = true;
    },
    onIdle: () => {
      closed++;
    },
  });
  lifecycle.setActivity(2);
  timers[0].fn();
  assert.equal(closed, 0);
  lifecycle.setActivity(1);
  assert.equal(timers.length, 1);
  lifecycle.setActivity(0);
  timers.at(-1).fn();
  timers.at(-1).fn();
  assert.equal(closed, 1);
  const manual = createServiceLifecycle({
    mode: 'manual',
    idleTimeoutMs: 1,
    setTimer: () => {
      throw new Error('manual timer');
    },
    onIdle: () => {
      closed++;
    },
  });
  manual.setActivity(1);
  manual.setActivity(0);
  manual.stop();
  assert.equal(closed, 1);
});

test('stalled uploads time out and disconnect signals release admission', async () => {
  const { readBoundedBody, requestCancellation } = await import('../src/request-limits.mjs');
  const req = new PassThrough();
  const res = new EventEmitter();
  res.writableEnded = false;
  const cancellation = requestCancellation(req, res);
  const pending = readBoundedBody(req, {
    signal: cancellation.signal,
    maxBytes: 10,
    timeoutMs: 10,
  });
  await assert.rejects(pending, /upload.*timed out/);
  cancellation.dispose();
  const req2 = new PassThrough();
  const res2 = new EventEmitter();
  res2.writableEnded = false;
  const cancelled = requestCancellation(req2, res2);
  const queue = createSerialRenderQueue();
  queue.reserve({ bytes: 10, signal: cancelled.signal });
  res2.emit('close');
  assert.equal(queue.snapshot().admittedJobs, 0);
  cancelled.dispose();
});

test('real HTTP handler rejects external resources before simulated GPU work and keeps manual mode alive', async (t) => {
  const service = await simulatedService(t, { idleTimeoutMs: 50 });
  const health = await service.health();
  assert.equal(health.protocol, 'kiln.render-service.v2');
  assert.equal(health.instance.mode, 'manual');
  assert.equal(health.instance.idleTimeoutMs, null);
  assert.ok(health.capabilities.includes('render.input.self-contained-v1'));
  assert.match(health.compatibility.fingerprint, /^sha256:[a-f0-9]{64}$/);
  const rejected = await service.render(
    glb(minimal({ buffers: [{ byteLength: 4, uri: 'http://127.0.0.1/external' }] })),
  );
  assert.equal(rejected.status, 400);
  assert.match((await rejected.json()).error, /external/);
  service.owner.kill();
  await delay(100);
  assert.equal((await service.health()).ok, true);
  assert.deepEqual(await service.events(), []);
});

test('real HTTP queue cancels a disconnected waiting client and survives initiating owner death until idle', async (t) => {
  const service = await simulatedService(t, { mode: 'managed', idleTimeoutMs: 250 });
  const payload = (label) => glb({ asset: { version: '2.0', generator: label } });
  const head = service.render(payload('head'));
  await until(async () => (await service.events()).includes('head'), 'active job');
  const abort = new AbortController();
  const pending = service.render(payload('cancelled'), abort.signal).then(
    () => 'resolved',
    () => 'aborted',
  );
  // One more complete HTTP client remains queued while the creator disappears.
  const tail = service.render(payload('tail'));
  await delay(50);
  service.owner.kill();
  abort.abort();
  assert.equal(await pending, 'aborted');
  await delay(300);
  assert.equal((await service.health()).ok, true);
  await service.release('head');
  assert.equal((await head).status, 200);
  await until(async () => (await service.events()).includes('tail'), 'surviving queued job');
  assert.deepEqual(await service.events(), ['head', 'tail']);
  await delay(300);
  assert.equal((await service.health()).ok, true);
  await service.release('tail');
  assert.equal((await tail).status, 200);
  await until(() => service.child.exitCode !== null, 'managed idle exit');
  assert.equal(service.child.exitCode, 0, service.output());
  assert.match(service.output(), /idle.*exiting/);
});

test('real HTTP admission counts stalled uploads and rejects overload before body buffering', async (t) => {
  const { request } = await import('node:http');
  const service = await simulatedService(t);
  const uploads = [];
  t.after(() =>
    uploads.forEach((req) => {
      req.destroy();
    }),
  );
  for (let index = 0; index < 8; index++) {
    const req = request(`${service.base}/render`, {
      method: 'POST',
      headers: { 'content-length': '100' },
    });
    req.on('error', () => {});
    req.flushHeaders();
    uploads.push(req);
  }
  await delay(100);
  const rejected = await service.render(glb(minimal()));
  assert.equal(rejected.status, 503);
  assert.match((await rejected.json()).error, /capacity|overloaded/);
  for (const req of uploads) req.destroy();
  await delay(50);
  const malformed = await service.render(Buffer.from('malformed GLB'));
  assert.equal(malformed.status, 400, 'aborted uploads released all slots');
});

// The production upload deadline is 15 seconds; allow process startup and loaded runners.
test('real HTTP upload deadline releases admitted work and permits managed idle exit', {
  timeout: 25000,
}, async (t) => {
  const { request } = await import('node:http');
  const service = await simulatedService(t, { mode: 'managed', idleTimeoutMs: 250 });
  let req;
  const expired = new Promise((resolve, reject) => {
    req = request(
      `${service.base}/render`,
      { method: 'POST', headers: { 'content-length': '100' } },
      (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () =>
          resolve({
            status: response.statusCode,
            body: JSON.parse(Buffer.concat(chunks).toString('utf8')),
          }),
        );
        response.on('error', reject);
      },
    );
    req.on('error', reject);
    req.flushHeaders();
  });
  t.after(() => req.destroy());
  service.owner.kill();
  await delay(300);
  assert.equal((await service.health()).ok, true);
  const response = await expired;
  assert.equal(response.status, 408);
  assert.match(response.body.error, /upload.*timed out/);
  await until(() => service.child.exitCode !== null, 'idle exit after upload timeout');
  assert.equal(service.child.exitCode, 0, service.output());
});

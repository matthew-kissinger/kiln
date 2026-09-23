import { abortedRender } from './render-queue.mjs';

/** Client disconnect cancels admission/queued work; a complete request body is not a disconnect. */
export function requestCancellation(req, res) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  const closed = () => {
    if (!res.writableEnded) abort();
  };
  req.once('aborted', abort);
  res.once('close', closed);
  return {
    signal: controller.signal,
    dispose() {
      req.removeListener('aborted', abort);
      res.removeListener('close', closed);
    },
  };
}

/** Absolute upload deadline, not a sliding timeout a stalled sender can keep resetting. */
export function readBoundedBody(req, { signal, maxBytes, timeoutMs = 15000 }) {
  if (signal?.aborted) return Promise.reject(abortedRender());
  if (
    !Number.isSafeInteger(maxBytes) ||
    maxBytes < 1 ||
    !Number.isFinite(timeoutMs) ||
    timeoutMs <= 0
  )
    throw new RangeError('invalid upload limits');
  return new Promise((resolve, reject) => {
    let chunks = [];
    let total = 0;
    let finished = false;
    const clean = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', aborted);
      req.removeListener('data', data);
      req.removeListener('end', end);
      req.removeListener('error', error);
      req.removeListener('aborted', aborted);
    };
    const settle = (failure, bytes) => {
      if (finished) return;
      finished = true;
      clean();
      chunks = [];
      if (failure) {
        req.pause();
        reject(failure);
      } else resolve(bytes);
    };
    const error = (failure) => settle(failure);
    const aborted = () => settle(abortedRender());
    const data = (chunk) => {
      total += chunk.length;
      if (total > maxBytes)
        settle(Object.assign(new Error('request body too large'), { status: 413 }));
      else chunks.push(chunk);
    };
    const end = () => settle(undefined, Buffer.concat(chunks));
    const timer = setTimeout(
      () => settle(Object.assign(new Error('request upload timed out'), { status: 408 })),
      timeoutMs,
    );
    signal?.addEventListener('abort', aborted, { once: true });
    req.on('data', data);
    req.once('end', end);
    req.once('error', error);
    req.once('aborted', aborted);
  });
}

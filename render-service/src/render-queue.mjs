const fail = (message, status = 400) => Object.assign(new Error(message), { status });
export const abortedRender = () =>
  Object.assign(new Error('render request aborted'), { name: 'AbortError', status: 499 });

/** Admission includes uploads, queued GLBs and running work. No GPU dependency. */
export function createBoundedRenderQueue(options = {}) {
  const now = options.now ?? (() => performance.now());
  if (typeof now !== 'function') throw fail('serial render queue requires a finite clock');
  const processStartedAt = options.processStartedAt ?? now();
  const maxJobs = options.maxJobs ?? 8;
  const maxBytes = options.maxBytes ?? 256 * 1024 * 1024;
  if (!Number.isFinite(processStartedAt)) throw fail('serial render queue requires a finite clock');
  for (const [name, value] of Object.entries({ maxJobs, maxBytes })) {
    if (!Number.isSafeInteger(value) || value < 1)
      throw fail(`${name} must be a positive safe integer`);
  }
  const admitted = new Set();
  const waiting = [];
  let retainedBytes = 0;
  let activeJobs = 0;
  let jobsStarted = 0;
  const snapshot = () =>
    Object.freeze({
      admittedJobs: admitted.size,
      queuedJobs: waiting.length,
      activeJobs,
      retainedBytes,
      maxJobs,
      maxBytes,
    });
  const notify = () => options.onActivity?.(snapshot());
  const finish = (record) => {
    if (record.state === 'finished') return;
    record.state = 'finished';
    admitted.delete(record);
    retainedBytes -= record.bytes;
    record.signal?.removeEventListener('abort', record.abort);
    record.job = undefined;
    notify();
  };
  const pump = () => {
    if (activeJobs || !waiting.length) return;
    const record = waiting.shift();
    record.state = 'running';
    activeJobs = 1;
    const start = {
      queueWaitMs: now() - record.enqueuedAt,
      queueDepthAtEnqueue: record.depth,
      concurrencyAtStart: 1,
      firstRenderInProcess: jobsStarted++ === 0,
      workerAgeMsAtStart: now() - processStartedAt,
    };
    notify();
    (async () => {
      let result;
      let error;
      let failed = false;
      try {
        result = await record.job(start);
      } catch (caught) {
        error = caught;
        failed = true;
      }
      activeJobs = 0;
      finish(record);
      if (record.signal?.aborted) record.reject(abortedRender());
      else if (failed) record.reject(error);
      else record.resolve(result);
      pump();
    })();
  };
  const reserve = ({ bytes = 0, signal } = {}) => {
    if (!Number.isSafeInteger(bytes) || bytes < 0)
      throw fail('request bytes must be a nonnegative safe integer');
    if (signal?.aborted) throw abortedRender();
    if (admitted.size >= maxJobs || retainedBytes + bytes > maxBytes)
      throw fail('render queue overloaded: request capacity exceeded', 503);
    const record = { bytes, signal, state: 'reserved' };
    record.abort = () => {
      // Submitted GPU work is not interrupted. Keep its resources/activity
      // counted until completion, then discard its result.
      if (record.state === 'running' || record.state === 'finished') return;
      const index = waiting.indexOf(record);
      if (index >= 0) waiting.splice(index, 1);
      finish(record);
      record.reject?.(abortedRender());
    };
    admitted.add(record);
    retainedBytes += bytes;
    signal?.addEventListener('abort', record.abort, { once: true });
    notify();
    return Object.freeze({
      resize(nextBytes) {
        if (record.state !== 'reserved')
          throw fail('only an admitted upload can resize its reservation');
        if (!Number.isSafeInteger(nextBytes) || nextBytes < 0)
          throw fail('request bytes must be a nonnegative safe integer');
        if (retainedBytes - record.bytes + nextBytes > maxBytes)
          throw fail('render queue overloaded: byte capacity exceeded', 503);
        retainedBytes += nextBytes - record.bytes;
        record.bytes = nextBytes;
        notify();
      },
      run(job) {
        if (signal?.aborted) throw abortedRender();
        if (record.state !== 'reserved') throw fail('render reservation is no longer available');
        if (typeof job !== 'function') throw fail('serial render queue job must be a function');
        record.job = job;
        record.state = 'queued';
        record.enqueuedAt = now();
        record.depth = activeJobs + waiting.length;
        const promise = new Promise((resolve, reject) => {
          record.resolve = resolve;
          record.reject = reject;
        });
        waiting.push(record);
        notify();
        queueMicrotask(pump);
        return promise;
      },
      release() {
        if (record.state === 'running') return;
        const index = waiting.indexOf(record);
        if (index >= 0) waiting.splice(index, 1);
        finish(record);
        record.reject?.(abortedRender());
      },
    });
  };
  return Object.freeze({
    reserve,
    snapshot,
    enqueue(job, admission) {
      if (typeof job !== 'function') throw fail('serial render queue job must be a function');
      const slot = reserve(admission);
      try {
        return slot.run(job);
      } catch (error) {
        slot.release();
        throw error;
      }
    },
  });
}

// GPU acquisition and the anti-software guard.
//
// Two facts B1a/B1 established that this module encodes:
// 1. Dawn's Node binding leaves adapter.isFallbackAdapter undefined on every
//    platform tested (win32/D3D12, linux/Vulkan) — the spec flag is unusable.
//    The guard is vendor/description matching.
// 2. A container can pass every CUDA check (nvidia-smi works) while Vulkan
//    silently lands on llvmpipe — missing GLVND dispatch libs do exactly this.
//    So the guard must fail CLOSED, at boot, not at first render.
import { create, globals } from 'webgpu';

Object.assign(globalThis, globals);

const SOFTWARE_RE = /swiftshader|lavapipe|llvmpipe|software|microsoft basic/i;

let state = null;
let shuttingDown = false;

/**
 * Declare that teardown has begun, so a device torn down on the way out is not
 * reported as a fault. Exported for the shutdown path and for tests.
 */
export function markGpuShutdown() {
  shuttingDown = true;
}

/**
 * A lost device is unrecoverable here: the renderer context and /health both
 * answer from cached state, so the worker would stay 200-healthy while failing
 * every render. Exiting non-zero is the only way the orchestrator learns to
 * replace it. `reason: 'destroyed'` is our own teardown, never a fault.
 * @param {{reason?: string}} info
 */
export function shouldExitOnDeviceLost(info) {
  return !shuttingDown && info?.reason !== 'destroyed';
}

export function adapterSummary(adapter) {
  const i = adapter.info ?? {};
  return {
    vendor: i.vendor ?? '',
    architecture: i.architecture ?? '',
    device: i.device ?? '',
    description: i.description ?? '',
  };
}

export function isSoftwareAdapter(adapter) {
  const { vendor, device, description } = adapterSummary(adapter);
  return SOFTWARE_RE.test(`${vendor} ${device} ${description}`);
}

export async function acquireGpu({ allowSoftware = false } = {}) {
  if (state) return state;
  const gpu = create([]);
  try {
    Object.defineProperty(globalThis, 'navigator', { value: { gpu }, configurable: true });
  } catch {
    try { Object.defineProperty(globalThis.navigator, 'gpu', { value: gpu, configurable: true }); } catch { /* three gets device directly */ }
  }
  const adapter = await gpu.requestAdapter({ powerPreference: 'high-performance' });
  if (!adapter) throw new Error('no WebGPU adapter: no usable Vulkan/D3D12/Metal device visible to Dawn');
  const software = isSoftwareAdapter(adapter);
  if (software && !allowSoftware) {
    const { description } = adapterSummary(adapter);
    throw new Error(`software adapter refused (fail closed): ${description}. ` +
      'On Linux this usually means the NVIDIA Vulkan ICD failed to init - check GLVND libs (libegl1/libgl1/libglvnd0).');
  }
  const device = await adapter.requestDevice({
    requiredFeatures: [...adapter.features],
  });
  // Health is not liveness without this. Signals are deliberately left on Node's
  // default (immediate termination) — no JS runs after them, so the handler
  // cannot fire on a container stop; 'beforeExit' covers a drained event loop.
  process.once('beforeExit', markGpuShutdown);
  device.lost.then((info) => {
    if (!shouldExitOnDeviceLost(info)) return;
    console.error(JSON.stringify({
      evt: 'device_lost',
      reason: info?.reason ?? 'unknown',
      message: info?.message ?? '',
    }));
    process.exit(1);
  });
  const summary = adapterSummary(adapter);
  const backend = process.platform === 'win32' ? 'd3d12' : process.platform === 'darwin' ? 'metal' : 'vulkan';
  const rendererId = `dawn-${backend}:${summary.device || summary.vendor}:${summary.description}`.slice(0, 160);
  state = { gpu, adapter, device, summary, software, backend, rendererId };
  return state;
}

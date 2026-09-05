import {
  DEFAULT_PRESENTATION_PRESET_ID,
  PRESENTATION_PRESET_CAPABILITIES,
  PRESENTATION_PRESET_IDS,
} from './presentation-presets.mjs';

/** Provider-free health contract shared by the HTTP route and unit tests. */
export const RENDER_CAPABILITIES = Object.freeze([
  'render.views',
  'render.views.checked',
  'render.cameras.perspective-v1',
  'render.targets.rectangular-v1',
  'render.outputs.sha256-v1',
  'render.fidelity.v1',
  'render.operational-evidence.v1',
  ...PRESENTATION_PRESET_CAPABILITIES,
  'render.beauty',
  'auth.x-render-token',
]);

export function buildHealthDocument(gpuState, authRequired) {
  return {
    ok: true,
    ...(gpuState.captureIdentity?{captureIdentity:gpuState.captureIdentity}:{}),
    rendererId: gpuState.rendererId,
    backend: gpuState.backend,
    adapter: gpuState.summary,
    capabilities: RENDER_CAPABILITIES,
    presentationProfile: DEFAULT_PRESENTATION_PRESET_ID,
    lightingPresetIds: [...PRESENTATION_PRESET_IDS],
    authRequired: Boolean(authRequired),
  };
}

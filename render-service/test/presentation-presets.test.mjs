import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DEFAULT_PRESENTATION_PRESET_ID,
  PRESENTATION_PRESET_CAPABILITIES,
  PRESENTATION_PRESET_IDS,
  getPresentationPreset,
  isPresentationPresetId,
} from '../src/presentation-presets.mjs';
import { buildHealthDocument, RENDER_CAPABILITIES } from '../src/health-contract.mjs';
import {
  SUPPORTED_LIGHTING_PRESET_ID,
  SUPPORTED_LIGHTING_PRESET_IDS,
  buildRenderFidelityV1,
  sha256,
  validateRenderMode,
} from '../src/contract.mjs';

const camera = {
  position: [0, 0, 5],
  target: [0, 0, 0],
  up: [0, 1, 0],
  fovDeg: 35,
  aspect: 1,
  near: 0.1,
  far: 100,
};

function recursivelyFrozen(value) {
  if (!value || typeof value !== 'object') return true;
  return Object.isFrozen(value) && Object.values(value).every(recursivelyFrozen);
}

describe('versioned presentation preset registry', () => {
  it('pins neutral-studio-v1 to the byte/visual-equivalent renderer values', () => {
    assert.equal(DEFAULT_PRESENTATION_PRESET_ID, 'neutral-studio-v1');
    assert.deepEqual(PRESENTATION_PRESET_IDS, ['neutral-studio-v1']);
    assert.equal(Object.isFrozen(PRESENTATION_PRESET_IDS), true);
    assert.equal(Object.isFrozen(PRESENTATION_PRESET_CAPABILITIES), true);
    assert.equal(SUPPORTED_LIGHTING_PRESET_ID, DEFAULT_PRESENTATION_PRESET_ID);
    assert.equal(SUPPORTED_LIGHTING_PRESET_IDS, PRESENTATION_PRESET_IDS);
    assert.deepEqual(getPresentationPreset('neutral-studio-v1'), {
      id: 'neutral-studio-v1',
      environment: { type: 'room', sigma: 0.04 },
      background: '#aab1bc',
      exposure: 1.38,
      ambient: { type: 'hemisphere', sky: 0xffffff, ground: 0x6f7888, intensity: 2 },
      sun: { enabled: false },
      key: { enabled: true, color: 0xffffff, intensity: 3, position: [4, 7, 5], castsShadow: false },
      fill: { enabled: true, color: 0xdce8ff, intensity: 1.8, position: [-4, 3, 2], castsShadow: false },
      rim: { enabled: true, color: 0xffead6, intensity: 1.2, position: [-2, 5, -5], castsShadow: false },
      shadows: {
        enabled: false,
        type: 'pcf-soft',
        mapSize: [1024, 1024],
        bias: 0,
        normalBias: 0,
        radius: 1,
      },
    });
    assert.equal(recursivelyFrozen(getPresentationPreset('neutral-studio-v1')), true);
  });

  it('resolves by ID only and rejects unknown IDs at the request and receipt boundaries', () => {
    assert.equal(isPresentationPresetId('neutral-studio-v1'), true);
    assert.equal(isPresentationPresetId('dramatic-night-v1'), false);
    assert.equal(getPresentationPreset('dramatic-night-v1'), undefined);
    assert.throws(() => validateRenderMode({
      cameras: [camera], width: 512, height: 512, lighting_preset_id: 'dramatic-night-v1',
    }), (error) => error?.status === 400 && /neutral-studio-v1/.test(error.message));
    for (const nonId of [null, { exposure: 2 }, ['neutral-studio-v1']]) {
      assert.throws(() => validateRenderMode({
        cameras: [camera], width: 512, height: 512, lighting_preset_id: nonId,
      }), (error) => error?.status === 400 && /neutral-studio-v1/.test(error.message));
    }
    const renderMode = validateRenderMode({ cameras: [camera], width: 512, height: 512 });
    assert.throws(() => buildRenderFidelityV1({
      rendererId: 'dawn-vulkan:test',
      inputGlbSha256: sha256(Buffer.from('glb')),
      presentationProfile: 'dramatic-night-v1',
      renderMode,
      resolvedCameras: renderMode.cameras,
      timings: { totalMs: 1 },
    }), (error) => error?.status === 400 && /neutral-studio-v1/.test(error.message));
  });

  it('advertises every registry ID through provider-free health contract data', () => {
    assert.deepEqual(PRESENTATION_PRESET_CAPABILITIES, ['render.profile.neutral-studio-v1']);
    assert.ok(PRESENTATION_PRESET_CAPABILITIES.every((capability) => RENDER_CAPABILITIES.includes(capability)));
    const health = buildHealthDocument({
      rendererId: 'dawn-vulkan:test',
      backend: 'vulkan',
      summary: { vendor: 'test' },
    }, true);
    assert.equal(health.presentationProfile, 'neutral-studio-v1');
    assert.deepEqual(health.lightingPresetIds, ['neutral-studio-v1']);
    assert.notEqual(health.lightingPresetIds, PRESENTATION_PRESET_IDS);
    assert.equal(health.authRequired, true);
  });
});

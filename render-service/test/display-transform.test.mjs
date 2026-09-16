import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BACKDROP_HEX, BACKDROP_IDS } from '../src/backdrops.mjs';
import {
  backdropClearColor,
  displayBytes,
  hexToBytes,
  linearForDisplayBytes,
  srgbDecode,
} from '../src/display-transform.mjs';
import { PRESENTATION_PRESET_IDS, getPresentationPreset } from '../src/presentation-presets.mjs';

test('the forward transform reproduces pixels measured on the GPU', () => {
  // Read back from a dawn-d3d12 device at the studio exposure of 1.38, when the
  // backdrop was still cleared as a plain colour. This is the calibration that
  // says the port is the transform the output pass really applies.
  for (const [hex, measured] of [
    ['#aab1bc', [203, 207, 213]],
    ['#1a1a1a', [14, 14, 14]],
    ['#dfe3e8', [227, 228, 230]],
  ]) {
    const linear = hexToBytes(hex).map((byte) => srgbDecode(byte / 255));
    assert.deepEqual(displayBytes(linear, 1.38), measured, hex);
  }
});

test('every backdrop reads back as its own table bytes at every preset exposure', () => {
  for (const id of PRESENTATION_PRESET_IDS) {
    const { exposure } = getPresentationPreset(id);
    for (const backdrop of BACKDROP_IDS) {
      const hex = BACKDROP_HEX[backdrop];
      const clear = backdropClearColor(hex, exposure);
      // A clear above 1.0 is fine: the framebuffer is HalfFloat, and a lower
      // exposure needs a brighter scene value to reach the same byte.
      assert.ok(
        clear.every((c) => c >= 0),
        `${backdrop} at ${id}: ${clear}`,
      );
      assert.deepEqual(displayBytes(clear, exposure), hexToBytes(hex), `${backdrop} at ${id}`);
    }
  }
});

test('the inverse is exact for every grey at any exposure', () => {
  for (const exposure of [0.9, 1.38, 2.5]) {
    for (let grey = 0; grey <= 255; grey++) {
      const bytes = [grey, grey, grey];
      assert.deepEqual(displayBytes(linearForDisplayBytes(bytes, exposure), exposure), bytes);
    }
  }
});

test('refuses what the tone mapping cannot reach and what it cannot parse', () => {
  assert.throws(() => linearForDisplayBytes([255, 0, 0], 1.38), /not reachable/);
  assert.throws(() => linearForDisplayBytes([170, 177], 1.38), /three integers/);
  assert.throws(() => backdropClearColor('#aab1bc', 0), /exposure/);
  assert.throws(() => backdropClearColor('aab1bc', 1.38), /hex/);
});

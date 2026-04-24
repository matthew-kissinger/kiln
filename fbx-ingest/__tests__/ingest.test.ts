/**
 * FBX ingest — live Chromium test, gated on KILN_FBX_LIVE=1.
 *
 * Survival-kit zip sits at the TIJ project root; unzip it ahead of running
 * this test:
 *   mkdir -p tmp/survival-kit
 *   unzip C:/Users/Mattm/X/games-3d/terror-in-the-jungle/survival-kit.zip -d tmp/survival-kit
 *   KILN_FBX_LIVE=1 KILN_FBX_FIXTURE=tmp/survival-kit/Models/FBX/barrel.fbx bun test ingest
 */

import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';

import { ingestFbx } from '../ingest';

const LIVE = process.env.KILN_FBX_LIVE === '1';
const FIXTURE_ENV = process.env.KILN_FBX_FIXTURE;

describe.if(LIVE && !!FIXTURE_ENV)('ingestFbx (live)', () => {
  test('converts an FBX file to a non-empty GLB', async () => {
    const fixture = FIXTURE_ENV!;
    if (!existsSync(fixture)) {
      throw new Error(`KILN_FBX_FIXTURE does not exist: ${fixture}`);
    }
    const fbx = readFileSync(fixture);
    const result = await ingestFbx(fbx, { scale: 1.0, mergeMaterials: true });
    // GLB magic 'glTF' = 0x46546C67 little-endian.
    expect(result.glb.readUInt32LE(0)).toBe(0x46546c67);
    expect(result.meta.bytes).toBeGreaterThan(1000);
    expect(result.meta.sourceBytes).toBe(fbx.byteLength);
  }, 60_000);
});

describe.if(!(LIVE && FIXTURE_ENV))('ingestFbx (skipped)', () => {
  test('set KILN_FBX_LIVE=1 + KILN_FBX_FIXTURE=/path/to/file.fbx to run', () => {
    expect(LIVE && FIXTURE_ENV).toBeFalsy();
  });
});

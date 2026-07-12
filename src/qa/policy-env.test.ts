/**
 * H-40 ops kill switch: `KILN_QA_MODE=observe|off` must (a) downgrade every
 * registry rule via the QaRulePolicy seam and (b) suppress the two render-path
 * blocking throws — without perturbing anything when unset. The integration
 * case drives a real render of a program that trips an enforce-mode exact rule
 * (UNIVERSAL_ZERO_SCALE_RULE) and proves the same program blocks under default
 * env but completes with a warning under observe.
 */
import { afterEach, describe, expect, test } from 'bun:test';

import { assessProgramGrade } from '../agent/grade-refine';
import { createAssetIntentV1 } from '../contracts';
import { renderGLB } from '../render';
import { AssetQaBlockedError, qaBlockingEnabled, qaPolicyFromEnv } from './run';

const ZERO_SCALE_CODE = `
const meta = { name: 'ZeroScale' };
function build() {
  const root = createRoot('ZeroScale');
  createPart('Body', boxGeo(1, 1, 1), lambertMaterial(0xff0000), { parent: root });
  const ghost = createPart('Ghost', boxGeo(1, 1, 1), lambertMaterial(0x00ff00), { parent: root });
  ghost.scale.set(0, 0, 0);
  return root;
}
`;

describe('qaPolicyFromEnv / qaBlockingEnabled', () => {
  test('unset env keeps ship defaults (empty policy, blocking on)', () => {
    expect(qaPolicyFromEnv({})).toEqual({});
    expect(qaBlockingEnabled({})).toBe(true);
  });

  test('observe/off downgrade the default mode and disable blocking', () => {
    expect(qaPolicyFromEnv({ KILN_QA_MODE: 'observe' })).toEqual({ defaultMode: 'observe' });
    expect(qaPolicyFromEnv({ KILN_QA_MODE: 'off' })).toEqual({ defaultMode: 'off' });
    expect(qaBlockingEnabled({ KILN_QA_MODE: 'observe' })).toBe(false);
    expect(qaBlockingEnabled({ KILN_QA_MODE: 'off' })).toBe(false);
  });

  test('upgrade modes and garbage are ignored (downgrade-only switch)', () => {
    expect(qaPolicyFromEnv({ KILN_QA_MODE: 'enforce' })).toEqual({});
    expect(qaPolicyFromEnv({ KILN_QA_MODE: 'warn' })).toEqual({});
    expect(qaPolicyFromEnv({ KILN_QA_MODE: 'nonsense' })).toEqual({});
    expect(qaBlockingEnabled({ KILN_QA_MODE: 'enforce' })).toBe(true);
    expect(qaBlockingEnabled({ KILN_QA_MODE: 'nonsense' })).toBe(true);
  });
});

describe('KILN_QA_MODE render-path integration', () => {
  const saved = process.env['KILN_QA_MODE'];
  afterEach(() => {
    if (saved === undefined) delete process.env['KILN_QA_MODE'];
    else process.env['KILN_QA_MODE'] = saved;
  });

  test('a zero-scale program blocks under default env', async () => {
    delete process.env['KILN_QA_MODE'];
    const intent = createAssetIntentV1({ category: 'prop' });
    await expect(renderGLB(ZERO_SCALE_CODE, { intent })).rejects.toThrow(AssetQaBlockedError);
  });

  test('H-40(3): the blocked-render message carries the finding message + authored repairText', async () => {
    // This message is exactly what the agent reads mid-loop (kiln_render returns
    // { ok:false, error: err.message }) — bare rule codes would leave the model
    // guessing what to fix.
    delete process.env['KILN_QA_MODE'];
    const intent = createAssetIntentV1({ category: 'prop' });
    const err = await renderGLB(ZERO_SCALE_CODE, { intent }).then(
      () => undefined,
      (e: unknown) => e,
    );
    expect(err).toBeInstanceOf(AssetQaBlockedError);
    const message = (err as AssetQaBlockedError).message;
    expect(message).toMatch(/Asset QA blocked/);
    expect(message).toContain('UNIVERSAL_ZERO_SCALE_RENDERABLE');
    expect(message).toContain('has zero scale');
    expect(message).toContain('FIX: Use a finite non-zero scale');
  });

  test('the same program completes under KILN_QA_MODE=observe', async () => {
    process.env['KILN_QA_MODE'] = 'observe';
    const intent = createAssetIntentV1({ category: 'prop' });
    const render = await renderGLB(ZERO_SCALE_CODE, { intent });
    expect(render.glb.byteLength).toBeGreaterThan(0);
  });

  test('H-10: assessProgramGrade reports a QA block as qaBlocked, not a broken program', async () => {
    delete process.env['KILN_QA_MODE'];
    const assess = await assessProgramGrade(ZERO_SCALE_CODE, { category: 'prop' });
    expect(assess.ok).toBe(false);
    expect(assess.qaBlocked).toBe(true);
    expect(assess.error).toMatch(/Asset QA blocked/);
  });

  test('H-10: observe mode revives the salvage predicate for a QA-blocked program', async () => {
    process.env['KILN_QA_MODE'] = 'observe';
    const assess = await assessProgramGrade(ZERO_SCALE_CODE, { category: 'prop' });
    expect(assess.ok).toBe(true);
    expect(assess.qaBlocked).toBeUndefined();
  });
});

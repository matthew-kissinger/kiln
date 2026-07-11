import type { VfxIntentV1 } from '../contracts/breadth';
import type { VfxArtifactEvidenceV1 } from './breadth';

export interface VfxBreadthCorpusFixtureV1 {
  id: string;
  intent: VfxIntentV1;
  evidence: VfxArtifactEvidenceV1;
  expectedExactCodes: string[];
}

const material = (
  id: string,
  alphaMode: 'opaque' | 'mask' | 'blend' = 'blend',
  overrides: Partial<VfxArtifactEvidenceV1['materials'][number]> = {},
): VfxArtifactEvidenceV1['materials'][number] => ({
  id,
  surfaceRole: 'card',
  alphaMode,
  alphaData: alphaMode !== 'opaque',
  doubleSided: true,
  ...(alphaMode === 'mask' ? { alphaCutoff: 0.45 } : {}),
  screenAreaRatio: 0.24,
  transparentLayers: alphaMode === 'blend' ? 2 : 0,
  textureMemoryBytes: 1_048_576,
  ...overrides,
});

const intent = (
  subtype: VfxIntentV1['subtype'],
  overrides: Partial<VfxIntentV1> = {},
): VfxIntentV1 => ({
  schemaVersion: 1,
  subtype,
  portability: 'portable',
  transparency: 'blend',
  doubleSided: true,
  facing: {
    source: 'explicit',
    mode: subtype === 'billboard' ? 'camera-y-axis' : 'fixed',
    normalAxis: '+X',
    ...((subtype === 'beam' || subtype === 'trail') && { directionAxis: '+X' as const }),
  },
  animation: {
    playback: 'loop',
    durationSeconds: 1,
    endpointBehavior: 'matchStart',
    driver: 'clip',
    clipName: `${subtype}.loop`,
  },
  ...overrides,
});

const evidence = (
  requested: VfxIntentV1,
  overrides: Partial<VfxArtifactEvidenceV1> = {},
): VfxArtifactEvidenceV1 => ({
  schemaVersion: 1,
  facing: { ...requested.facing },
  animation: { ...requested.animation, endpointMatches: true },
  ...(requested.sidecar ? { sidecar: { ...requested.sidecar } } : {}),
  materials: [material(`${requested.subtype}.material`, requested.transparency)],
  clips:
    requested.animation.driver === 'clip'
      ? [
          {
            name: requested.animation.clipName!,
            durationSeconds: requested.animation.durationSeconds,
          },
        ]
      : [],
  uniforms:
    requested.animation.driver === 'timeUniform' ? [requested.animation.timeUniformName!] : [],
  ...overrides,
});

const fixture = (
  id: string,
  requested: VfxIntentV1,
  overrides: Partial<VfxArtifactEvidenceV1> = {},
  expectedExactCodes: string[] = [],
): VfxBreadthCorpusFixtureV1 => ({
  id,
  intent: requested,
  evidence: evidence(requested, overrides),
  expectedExactCodes,
});

const billboardSmoke = intent('billboard');
const beam = intent('beam');
const trail = intent('trail');
const portal = intent('portal');
const impact = intent('impact', {
  animation: {
    playback: 'oneShot',
    durationSeconds: 0.35,
    endpointBehavior: 'disappear',
    driver: 'clip',
    clipName: 'impact.burst',
  },
});
const aura = intent('aura');
const volume = intent('volume-like', {
  transparency: 'mask',
  animation: { playback: 'static', durationSeconds: 0, endpointBehavior: 'none', driver: 'none' },
});
const runtimeShader = intent('runtimeShader', {
  portability: 'sidecar',
  sidecar: { kind: 'tsl', id: 'kiln.vfx.energy-portal.tsl.v1', version: '1.0.0' },
  animation: {
    playback: 'loop',
    durationSeconds: 1.5,
    endpointBehavior: 'matchStart',
    driver: 'timeUniform',
    timeUniformName: 'kilnTimeSeconds',
  },
});

/** Fixed, no-provider VFX corpus spanning every approved subtype and primary failure class. */
export const VFX_BREADTH_CORPUS_V1: readonly VfxBreadthCorpusFixtureV1[] = Object.freeze([
  fixture('vfx.billboard-smoke.valid', billboardSmoke),
  fixture('vfx.beam.valid', beam),
  fixture('vfx.trail.valid', trail),
  fixture('vfx.portal.valid', portal),
  fixture('vfx.impact.valid', impact),
  fixture('vfx.aura.valid', aura),
  fixture('vfx.volume.valid', volume),
  fixture('vfx.tsl-sidecar.valid', runtimeShader),
  fixture(
    'vfx.billboard-smoke.opaque-card',
    billboardSmoke,
    { materials: [material('smoke.card', 'opaque', { alphaData: false })] },
    ['VFX_TRANSPARENCY_MODE_MISMATCH', 'VFX_ALPHA_DATA_MISSING'],
  ),
  fixture('vfx.beam.wrong-direction', beam, { facing: { ...beam.facing, directionAxis: '-X' } }, [
    'VFX_FACING_CONTRACT_MISMATCH',
  ]),
  fixture(
    'vfx.portal.open-loop',
    portal,
    { animation: { ...portal.animation, endpointMatches: false } },
    ['VFX_LOOP_ENDPOINT_MISMATCH'],
  ),
  fixture('vfx.tsl-sidecar.missing-time-uniform', runtimeShader, { uniforms: [] }, [
    'VFX_REQUIRED_TIME_UNIFORM_MISSING',
  ]),
]);

export const VFX_BENCH_RUBRIC_V1 = Object.freeze({
  schemaVersion: 1 as const,
  category: 'vfx' as const,
  deterministicEvidenceIsDelegatedDecision: false as const,
  criteria: [
    'vfx.intent-readability',
    'vfx.transparency',
    'vfx.facing',
    'vfx.temporal-policy',
    'vfx.runtime-portability',
  ] as const,
  requiredFixtures: [
    'vfx.billboard-smoke.valid',
    'vfx.beam.valid',
    'vfx.trail.valid',
    'vfx.portal.valid',
    'vfx.impact.valid',
    'vfx.aura.valid',
    'vfx.tsl-sidecar.valid',
  ] as const,
});

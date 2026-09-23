import { expect, test } from 'bun:test';
import * as THREE from 'three';
import { stampSemanticMetadataV1 } from '../contracts';
import { createAssetRequirementsV1, type AssetRequirementsV1 } from '../contracts/requirements';
import { createAssetRequirementsStore } from '../requirements-store';
import { resolveRequirementsContext } from '../requirements-context';
import { runRequirementsSceneQa } from './requirements-run';
import { renderSceneToGLB } from '../render';
type Effects = Extract<
  NonNullable<AssetRequirementsV1['requirements']['effects']>,
  { value: unknown }
>['value'];
const effects: Effects = {
  schemaVersion: 1,
  subtype: 'beam',
  portability: 'portable',
  transparency: 'blend',
  doubleSided: true,
  facing: { source: 'explicit', mode: 'fixed', normalAxis: '+Y', directionAxis: '+X' },
  animation: { playback: 'static', durationSeconds: 0, endpointBehavior: 'none', driver: 'none' },
};
function binding(value = effects) {
  return createAssetRequirementsStore().host.bind(
    { taskId: 'effects', lineageId: 'one' },
    createAssetRequirementsV1({
      labels: ['prop'],
      requirements: { effects: { state: 'requested', value } },
    }),
    { actor: 'owner', source: 'brief', reason: 'Effect contract' },
  );
}
function beam(opacity = 0.5) {
  const root = new THREE.Group();
  root.name = 'Effect';
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.1, 0.1),
    new THREE.MeshStandardMaterial({
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
    }),
  );
  mesh.name = 'Beam';
  stampSemanticMetadataV1(mesh, { roles: ['vfx.effect.surface.beam'] });
  root.add(mesh);
  return root;
}
const codes = (report: ReturnType<typeof runRequirementsSceneQa>) =>
  Object.values(report.dimensions).flatMap((d) => d.findings.map((f) => f.code));
test('explicit effect requirements apply without an effect category and are remeasured from final bytes', async () => {
  const result = await renderSceneToGLB(beam(), { requirements: binding() });
  expect(result.qaReport.acceptance).toBe('accepted');
  expect(result.qaReport.rules.find((r) => r.id === 'VFX_EXACT_PROFILE')?.status).toBe('evaluated');
  expect(result.qaReport.dimensions.exportIntegrity.metrics).toMatchObject({
    finalVfxNormalAxis: '+Y',
    finalVfxDirectionAxis: '+X',
  });
});
test('declared transparency requires actual alpha data and cannot be bypassed with source metadata', () => {
  const root = beam(1);
  root.userData.category = 'prop';
  root.userData.kilnVfxEvidence = { alphaData: true };
  const report = runRequirementsSceneQa(resolveRequirementsContext(binding()), root, []);
  expect(codes(report)).toContain('VFX_ALPHA_DATA_MISSING');
  expect(report.acceptance).toBe('blocked');
});
test('unsupported runtime sidecars cannot satisfy a request by naming themselves in source metadata', () => {
  const root = beam();
  root.userData.sidecar = { kind: 'tsl', id: 'forged', version: '1' };
  const request: Effects = {
    ...effects,
    portability: 'sidecar',
    sidecar: { kind: 'tsl', id: 'forged', version: '1' },
  };
  const report = runRequirementsSceneQa(resolveRequirementsContext(binding(request)), root, []);
  expect(codes(report)).toContain('VFX_SIDECAR_IDENTITY_MISMATCH');
  expect(report.acceptance).toBe('blocked');
});

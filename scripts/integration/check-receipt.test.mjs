import { test, expect } from 'bun:test';
import { checkReceipt } from './check-receipt.mjs';

const manifest = {
  files: {
    'prop.glb': {
      nodes: [{ name: 'Pennant', parent: 'Pivot', uvSets: 2, morphTargets: 1 }],
      materials: [{ name: 'Cloth', metallic: 0.2 }],
      animationCount: 1,
    },
  },
};
const receipt = {
  engine: 'test',
  version: '1',
  files: [
    {
      file: 'prop.glb',
      nodes: [{ name: 'Pennant', parent: 'Pivot', uvSets: 2, morphTargets: 1 }],
      materials: [{ name: 'Cloth', metallic: 0.20000001 }],
      animations: ['Turn'],
    },
  ],
};
test('checks structural and numeric expectations with tolerance', () =>
  expect(checkReceipt(receipt, manifest)).toEqual([]));
test('rejects a missing file rather than passing an empty import', () =>
  expect(checkReceipt({ ...receipt, files: [] }, manifest).join()).toContain('missing'));
test('detects feature loss', () => {
  const broken = structuredClone(receipt);
  broken.files[0].nodes[0].uvSets = 1;
  expect(checkReceipt(broken, manifest).join()).toContain('uvSets');
});
test('rejects ambiguous names and importer errors', () => {
  const broken = structuredClone(receipt);
  broken.files[0].nodes.push(broken.files[0].nodes[0]);
  expect(checkReceipt(broken, manifest).join()).toContain('ambiguous');
  broken.files[0].error = 'failed';
  expect(checkReceipt(broken, manifest).join()).toContain('failed');
});
test('requires a nonempty expectation set and engine identity', () => {
  expect(checkReceipt(receipt, { files: {} }).length).toBeGreaterThan(0);
  expect(checkReceipt({ ...receipt, version: '' }, manifest).length).toBeGreaterThan(0);
});
test('rejects unasserted imports', () => {
  const extra = structuredClone(receipt);
  extra.files.push({ file: 'uncovered.glb' });
  expect(checkReceipt(extra, manifest).join()).toContain('no expectations');
});
test('detects clips that import but do not move their target', () => {
  const expectations = structuredClone(manifest);
  expectations.files['prop.glb'].animatedNodeCount = 1;
  expect(
    checkReceipt(
      { ...receipt, files: [{ ...receipt.files[0], animatedNodeCount: 0 }] },
      expectations,
    ).join(),
  ).toContain('animatedNodeCount');
});

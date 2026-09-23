import { describe, expect, test } from 'bun:test';
import { createAssetRequirementsV1, requestedRequirement } from './contracts/requirements';
import { assetRequirementsPolicyHash, createAssetRequirementsStore } from './requirements-store';

const key = { taskId: 'task-a', lineageId: 'asset-a' };
const authority = { actor: 'host', reason: 'User brief', source: 'brief' as const };

describe('host-owned requirements bindings', () => {
  test('reader cannot mutate policy and missing lineages do not inherit another asset', () => {
    const { host, reader } = createAssetRequirementsStore();
    host.bind(key, createAssetRequirementsV1(), authority);
    expect(Object.keys(reader)).toEqual(['get']);
    expect(() => reader.get({ ...key, lineageId: 'asset-b' })).toThrow('not bound');
    expect(() => reader.get({ ...key, taskId: 'task-b' })).toThrow('not bound');
  });

  test('bind and read return detached records so source metadata cannot lower obligations', () => {
    const { host, reader } = createAssetRequirementsStore();
    const input = createAssetRequirementsV1({
      requirements: { grounding: requestedRequirement({ planeY: 0 }) },
    });
    const first = host.bind(key, input, authority);
    delete input.requirements.grounding;
    delete first.requirements.requirements.grounding;
    const read = reader.get(key);
    delete read.requirements.requirements.grounding;
    expect(reader.get(key).requirements.requirements.grounding?.state).toBe('requested');
  });

  test('host changes require a current revision and leave an auditable history', () => {
    const { host, reader } = createAssetRequirementsStore();
    const first = host.bind(key, createAssetRequirementsV1(), authority);
    const next = createAssetRequirementsV1({
      requirements: { grounding: requestedRequirement({}) },
    });
    expect(() => host.replace(key, 0, next, authority)).toThrow('revision');
    expect(() => host.replace(key, 1, next, { ...authority, reason: '' })).toThrow('reason');
    const second = host.replace(key, first.revision, next, {
      ...authority,
      reason: 'User added ground contact',
    });
    expect(second.revision).toBe(2);
    expect(second.policyHash).not.toBe(first.policyHash);
    expect(second.history).toHaveLength(2);
    expect(second.history[1]?.previousPolicyHash).toBe(first.policyHash);
    expect(() => host.replace(key, first.revision, next, authority)).toThrow('revision');
    expect(reader.get(key)).toEqual(second);
  });

  test('labels and reasons do not alter effective policy identity', () => {
    const { host } = createAssetRequirementsStore();
    const a = host.bind(key, createAssetRequirementsV1({ labels: ['boat'] }), authority);
    const b = host.replace(key, 1, createAssetRequirementsV1({ labels: ['prop'] }), authority);
    expect(b.policyHash).toBe(a.policyHash);
  });

  test('cannot overwrite bindings or bypass validation with imported records', () => {
    const { host } = createAssetRequirementsStore();
    host.bind(key, createAssetRequirementsV1(), authority);
    expect(() => host.bind(key, createAssetRequirementsV1(), authority)).toThrow('already bound');
    expect(() =>
      host.bind(
        { ...key, lineageId: 'b' },
        { schemaVersion: 1, category: 'prop' } as never,
        authority,
      ),
    ).toThrow();
  });

  test('hash canonicalizes key order, preserves state, and rejects invalid data', () => {
    const a = createAssetRequirementsV1({
      requirements: {
        navigation: requestedRequirement({}, 'brief navigation'),
        grounding: requestedRequirement({ planeY: 0 }),
      },
    });
    const b = createAssetRequirementsV1({
      requirements: {
        grounding: requestedRequirement({ planeY: 0 }),
        navigation: requestedRequirement({}, 'another explanation'),
      },
    });
    expect(assetRequirementsPolicyHash(a)).toBe(assetRequirementsPolicyHash(b));
    b.requirements.navigation = { state: 'inferred', value: {} };
    expect(assetRequirementsPolicyHash(a)).not.toBe(assetRequirementsPolicyHash(b));
    expect(() =>
      assetRequirementsPolicyHash({
        ...a,
        requirements: { grounding: { state: 'requested', value: { planeY: NaN } } },
      }),
    ).toThrow();
  });
});

describe('explicit host restore', () => {
  test('restores a detached full history and appends the current host decision', () => {
    const original = createAssetRequirementsStore();
    original.host.bind(key, createAssetRequirementsV1(), authority);
    const saved = original.host.replace(
      key,
      1,
      createAssetRequirementsV1({ requirements: { grounding: requestedRequirement({}) } }),
      authority,
    );
    const restored = createAssetRequirementsStore();
    expect(() => restored.reader.get(key)).toThrow('not bound');
    const result = restored.host.restore(saved, {
      actor: 'restoring-host',
      reason: 'User resumed saved asset',
      source: 'restore',
    });
    expect(result.revision).toBe(3);
    expect(result.history.slice(0, 2)).toEqual(saved.history);
    expect(result.history[2]).toMatchObject({
      actor: 'restoring-host',
      source: 'restore',
      previousPolicyHash: saved.policyHash,
    });
    delete saved.requirements.requirements.grounding;
    delete result.requirements.requirements.grounding;
    expect(restored.reader.get(key).requirements.requirements.grounding?.state).toBe('requested');
  });
  test('restore rejects malformed history, wrong authority source, and existing lineages', () => {
    const saved = createAssetRequirementsStore().host.bind(
      key,
      createAssetRequirementsV1(),
      authority,
    );
    const restored = createAssetRequirementsStore();
    expect(() => restored.host.restore(saved, authority)).toThrow('restore');
    const malformed = structuredClone(saved);
    malformed.history[0]!.revision = 2;
    expect(() => restored.host.restore(malformed, { ...authority, source: 'restore' })).toThrow(
      'binding',
    );
    restored.host.restore(saved, { ...authority, source: 'restore' });
    expect(() => restored.host.restore(saved, { ...authority, source: 'restore' })).toThrow(
      'already bound',
    );
  });
});

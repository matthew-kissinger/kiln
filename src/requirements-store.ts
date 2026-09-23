import { assetRequirementsPolicyHash } from './requirements-identity';
import { validateRequirementsBinding } from './requirements-context';
export { assetRequirementsPolicyHash } from './requirements-identity';
import { validateAssetRequirementsV1, type AssetRequirementsV1 } from './contracts/requirements';

export interface RequirementsBindingKey {
  taskId: string;
  lineageId: string;
}
export interface RequirementsAuthority {
  actor: string;
  reason: string;
  source: 'brief' | 'automation' | 'migration' | 'restore';
}
export interface RequirementsChange extends RequirementsAuthority {
  revision: number;
  policyHash: string;
  previousPolicyHash?: string;
}
export interface RequirementsBinding extends RequirementsBindingKey {
  kind: 'kiln.requirements-binding';
  schemaVersion: 1;
  revision: number;
  policyHash: string;
  requirements: AssetRequirementsV1;
  history: RequirementsChange[];
}
export interface AssetRequirementsReader {
  get(key: RequirementsBindingKey): RequirementsBinding;
}
export interface AssetRequirementsHost {
  /** Explicit current-host authorization restores checked history into an unbound lineage. */
  restore(snapshot: unknown, authority: RequirementsAuthority): RequirementsBinding;
  bind(
    key: RequirementsBindingKey,
    requirements: AssetRequirementsV1,
    authority: RequirementsAuthority,
  ): RequirementsBinding;
  replace(
    key: RequirementsBindingKey,
    expectedRevision: number,
    requirements: AssetRequirementsV1,
    authority: RequirementsAuthority,
  ): RequirementsBinding;
}

function requireText(value: unknown, name: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0)
    throw new TypeError(`${name} must be non-empty.`);
}

/**
 * Keep `host` in the orchestrator; inject only `reader` into execution tools.
 * This is a capability boundary, not a sandbox for hostile same-process code.
 * Imported JSON never restores authority by itself: a host must explicitly bind it.
 */
export function createAssetRequirementsStore(): {
  host: AssetRequirementsHost;
  reader: AssetRequirementsReader;
} {
  const bindings = new Map<string, RequirementsBinding>();
  const index = (key: RequirementsBindingKey): string => {
    requireText(key.taskId, 'taskId');
    requireText(key.lineageId, 'lineageId');
    return JSON.stringify([key.taskId, key.lineageId]);
  };
  const write = (
    key: RequirementsBindingKey,
    input: AssetRequirementsV1,
    authority: RequirementsAuthority,
    previous?: RequirementsBinding,
  ): RequirementsBinding => {
    requireText(authority.actor, 'actor');
    requireText(authority.reason, 'reason');
    if (!['brief', 'automation', 'migration', 'restore'].includes(authority.source))
      throw new TypeError('Invalid authority source.');
    const validated = validateAssetRequirementsV1(input);
    if (!validated.valid || !validated.value)
      throw new TypeError(
        `Invalid requirements: ${validated.issues.map((issue) => `${issue.path}: ${issue.message}`).join('; ')}`,
      );
    const requirements = validated.value;
    const policyHash = assetRequirementsPolicyHash(requirements);
    const revision = (previous?.revision ?? 0) + 1;
    const change: RequirementsChange = {
      actor: authority.actor,
      reason: authority.reason,
      source: authority.source,
      revision,
      policyHash,
      ...(previous ? { previousPolicyHash: previous.policyHash } : {}),
    };
    const next: RequirementsBinding = {
      kind: 'kiln.requirements-binding',
      schemaVersion: 1,
      taskId: key.taskId,
      lineageId: key.lineageId,
      revision,
      policyHash,
      requirements,
      history: [...(previous?.history ?? []), change],
    };
    bindings.set(index(key), next);
    return structuredClone(next);
  };
  const reader: AssetRequirementsReader = Object.freeze({
    get(key: RequirementsBindingKey) {
      const result = bindings.get(index(key));
      if (!result) throw new Error('Requirements lineage is not bound by the host.');
      return structuredClone(result);
    },
  });
  const host: AssetRequirementsHost = Object.freeze({
    restore(snapshot: unknown, authority: RequirementsAuthority) {
      if (authority.source !== 'restore')
        throw new TypeError('Requirements restore requires explicit restore authority.');
      const previous = validateRequirementsBinding(snapshot);
      const key = { taskId: previous.taskId, lineageId: previous.lineageId };
      if (bindings.has(index(key)))
        throw new Error('Requirements lineage is already bound; restore cannot overwrite it.');
      return write(key, previous.requirements, authority, previous);
    },
    bind(
      key: RequirementsBindingKey,
      requirements: AssetRequirementsV1,
      authority: RequirementsAuthority,
    ) {
      if (bindings.has(index(key)))
        throw new Error(
          'Requirements lineage is already bound; use a revision-checked replacement.',
        );
      return write(key, requirements, authority);
    },
    replace(
      key: RequirementsBindingKey,
      expectedRevision: number,
      requirements: AssetRequirementsV1,
      authority: RequirementsAuthority,
    ) {
      const previous = bindings.get(index(key));
      if (!previous) throw new Error('Requirements lineage is not bound by the host.');
      if (expectedRevision !== previous.revision)
        throw new Error(
          `Requirements revision conflict: expected ${expectedRevision}, current ${previous.revision}.`,
        );
      return write(key, requirements, authority, previous);
    },
  });
  return { host, reader };
}

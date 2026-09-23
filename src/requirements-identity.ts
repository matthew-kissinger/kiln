import { createHash } from 'node:crypto';
import { validateAssetRequirementsV1, type AssetRequirementsV1 } from './contracts/requirements';

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonical(entry)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

/** Descriptive labels and explanatory prose do not invalidate equivalent policy. */
export function assetRequirementsPolicyHash(input: AssetRequirementsV1): string {
  const validated = validateAssetRequirementsV1(input);
  if (!validated.valid || !validated.value)
    throw new TypeError('Cannot hash invalid asset requirements.');
  const requirements = validated.value;
  const { frame, scope } = requirements;
  const withoutReason = (value: { state: string; value?: unknown }) => ({
    state: value.state,
    ...('value' in value ? { value: value.value } : {}),
  });
  const effective = Object.fromEntries(
    Object.entries(requirements.requirements)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, withoutReason(value!)]),
  );
  return createHash('sha256')
    .update(
      canonical({
        kind: requirements.kind,
        schemaVersion: requirements.schemaVersion,
        frame,
        ...(scope ? { scope: withoutReason(scope) } : {}),
        requirements: effective,
      }),
    )
    .digest('hex');
}

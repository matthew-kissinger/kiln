import { migrateAssetIntentV1ToRequirements } from '../../contracts/requirements-migration';
import { createAssetRequirementsStore } from '../../requirements-store';

/** Explicitly reviewed fixture conversion, never a runtime compatibility path.
 * Preserve the complete historical obligations so neutral checker gaps remain visible.
 */
export function bindLegacyFixtureRequirements(intent: unknown) {
  const report = migrateAssetIntentV1ToRequirements(intent);
  if (report.status !== 'review-required' || !report.proposal)
    throw new Error(`Invalid historical fixture: ${JSON.stringify(report.unresolved)}`);
  return createAssetRequirementsStore().host.bind(
    { taskId: 'qa-fixture', lineageId: 'migrated' },
    report.proposal,
    {
      actor: 'test-author',
      source: 'migration',
      reason: 'Conformance fixture obligations reviewed during neutral migration',
    },
  );
}

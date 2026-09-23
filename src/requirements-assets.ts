/** Saved policy is provenance data. Only the current host can authorize its use. */
import type { AssetManifest } from './assets';
import {
  assertNoLegacyRuntimePolicy,
  readRequirementsCheckpoint,
  requirementsContextsEqual,
  resolveRequirementsContext,
  validateRequirementsContext,
  type RequirementsContext,
} from './requirements-context';

export function savedRequirements(manifest: AssetManifest): RequirementsContext {
  const options = manifest.build?.options;
  if (!options || options.requirements === undefined)
    throw new Error(
      'Saved asset has no current requirements receipt; explicit migration is required before restore or revision.',
    );
  assertNoLegacyRuntimePolicy(options);
  const saved = validateRequirementsContext(options.requirements);
  if (saved.binding) {
    const { checkpoint } = readRequirementsCheckpoint(options.requirementsCheckpoint);
    if (
      checkpoint.programRef !== manifest.files['source.kiln.js']?.sha256 ||
      !requirementsContextsEqual(saved, resolveRequirementsContext(checkpoint.binding))
    )
      throw new Error('Saved requirements checkpoint does not match the source or build receipt.');
  } else if (options.requirementsCheckpoint !== undefined) {
    throw new Error('A neutral saved asset cannot carry a bound requirements checkpoint.');
  }
  return saved;
}

/** A restored binding may advance the same history. Imported claims cannot activate it. */
export function assertSavedRequirementsAuthorized(
  manifest: AssetManifest,
  current: RequirementsContext,
): RequirementsContext {
  const saved = savedRequirements(manifest);
  if (!saved.binding) return saved;
  const previous = saved.binding;
  const active = current.binding;
  if (
    !active ||
    active.taskId !== previous.taskId ||
    active.lineageId !== previous.lineageId ||
    active.revision < previous.revision ||
    JSON.stringify(active.history.slice(0, previous.revision)) !== JSON.stringify(previous.history)
  )
    throw new Error(
      'A current host binding extending this asset lineage is required. Restore the checked checkpoint through the host requirements store before restoring or revising the asset.',
    );
  return saved;
}

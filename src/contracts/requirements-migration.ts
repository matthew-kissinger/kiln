/** Explicit data conversion only. Never import this module from normal policy resolution. */
import { validateAssetIntentV1, type AssetCategory, type ContractValidationIssue } from './asset';
import { resolveEnvironmentIntentProfile } from './environment';
import { assetManifestSchema, type AssetManifest } from '../assets';
import {
  createAssetRequirementsV1,
  requestedRequirement,
  validateAssetRequirementsV1,
  type AssetRequirementsV1,
} from './requirements';

export interface RequirementsMigrationChange {
  from: string;
  to: string;
  explanation: string;
}

export interface RequirementsMigrationReport {
  kind: 'kiln.requirements-migration';
  schemaVersion: 1;
  status: 'invalid' | 'review-required';
  /** Detached original, retained for explicit review; never a runtime policy. */
  original?: unknown;
  /** Proposed current-schema data; not authority to bind or evidence of QA equivalence. */
  proposal?: AssetRequirementsV1;
  changes: RequirementsMigrationChange[];
  unresolved: ContractValidationIssue[];
}

export interface AssetManifestMigrationReport {
  kind: 'kiln.asset-manifest-migration';
  schemaVersion: 1;
  status: 'invalid' | 'review-required';
  original?: unknown;
  recoveredIntent?: { source: 'host-reconstruction'; value: unknown };
  /** A review/rebuild proposal, deliberately not a saved manifest or host binding. */
  proposal?: {
    kind: 'kiln.asset-migration-proposal';
    schemaVersion: 1;
    originalRevision: { assetId: string; revisionId: string };
    source: AssetManifest['files'][string];
    retainedFiles: AssetManifest['files'];
    retainedBuildOptions: Record<string, unknown>;
    requirements: AssetRequirementsV1;
    rebuildRequired: true;
    artifactVerification: 'not-performed';
  };
  changes: RequirementsMigrationChange[];
  unresolved: ContractValidationIssue[];
}

/** Known policy differences, not a second runtime selector or an equivalence claim. */
const CATEGORY_RULE_REVIEWS: Record<AssetCategory, Record<string, string>> = {
  prop: {
    PROP_CAPABILITY_EXACT_PROFILE:
      'enforce: rigid mechanism measurements are shared, but generic articulation/opening remains incomplete. Historical container subtypes also selected opening checks with a 0.08 m minimum interior extent; neutral requests do not infer that threshold or subtype selection. Review those obligations explicitly.',
    PROP_ADVISORY_PROFILE:
      'observe: requested bounds and grounding use the shared placement kernel. Historical circular assembly advice selected by subtype or scene roles has no neutral adapter. Inspect the retained source/scene even when the subtype is absent; converting a label does not preserve that advice.',
  },
  character: {
    CHARACTER_PROFILE:
      'enforce: rig measurements are shared. Historically the articulated capability selected body-plan graph checks; requested rig.bodyPlan now selects them directly. Review this changed applicability and any unmeasured rig fields before replacing policy.',
    CHARACTER_ADVISORY_PROFILE:
      'observe: shared rig and sampled animation measurements now require requested rig data. Clip/graph checks do not establish locomotion or motion quality; review retained rig obligations against current coverage.',
  },
  vfx: {
    VFX_EXACT_PROFILE:
      'enforce: shared effects measurements now require requested effects and are remeasured from final bytes. Old scene/sidecar declarations cannot establish current runtime-shader behavior; rebuild and review representation coverage.',
    VFX_ADVISORY_PROFILE:
      'observe: shared effects advice now requires requested effects. Historical category selection and appearance evidence are not current acceptance; review the rebuilt representation.',
  },
  environment: {
    ENVIRONMENT_EXACT_PROFILE:
      'enforce: shared socket, tiling and navigation kernels use explicit spatial requirements. Ground/path roles no longer exempt protruding obstacles. Missing route/edge evidence stays incomplete; review changed applicability and unsupported spatial fields.',
    ENVIRONMENT_ADVISORY_PROFILE:
      'observe: historical navigation advice of 0.8 m width and 1.8 m headroom is mapped explicitly when navigable. Shared spatial advice does not certify clear space or edge continuity; review remaining fields and scene evidence.',
  },
  architecture: {
    ARCHITECTURE_PROFILE:
      'enforce: shared structure measurements now require requested structure. Retained fields do not imply measured coverage; review unsupported structure/access requirements and rebuild authored surface/portal evidence.',
    ARCHITECTURE_ADVISORY_PROFILE:
      'observe: shared roof, envelope and scale advice now requires requested structure. Labels impose no roof or storey defaults; review the explicit converted fields and current coverage.',
  },
  vegetation: {
    VEGETATION_CONTACT_PROFILE:
      'enforce: shared contact measurements now use requested foliage.grounded and an explicit ground plane, independently of the label. Review retained foliage requirements and rebuilt support evidence.',
    VEGETATION_ADVISORY_PROFILE:
      'observe: shared foliage advice now requires requested foliage. Growth measurements require canopy context; unsupported fields remain incomplete and material/attachment advice does not certify appearance.',
  },
  vehicle: {
    VEHICLE_PROFILE:
      'enforce: shared mobility measurements now require requested mobility; the historical +X front frame is mapped explicitly. Zero-wheel watercraft does not imply grounding. Review retained fields and current measurement coverage.',
    VEHICLE_ADVISORY_PROFILE:
      'observe: shared mobility findings retain advisory mode under requested mobility. Review support and assembly evidence after rebuild; category conversion is not physical qualification.',
    VEHICLE_W6_ADVISORY_PROFILE:
      'observe: shared mobility advice currently measures rotor/propeller propulsion only; other propulsion and nonempty animationAssemblies remain incomplete. Review these obligations explicitly.',
  },
};

const MAPPED_FIELDS = new Set([
  'schemaVersion',
  'category',
  'subtype',
  'scope',
  'capabilities',
  'bounds',
  'frame',
  'requiredParts',
  'forbiddenExtras',
  'material',
  'animation',
  'architecture',
  'character',
  'vehicle',
  'vegetation',
  'vfx',
  'modular',
  'qaProfile',
]);

function isJsonData(value: unknown, ancestors = new Set<unknown>()): boolean {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'object' || ancestors.has(value)) return false;
  if (
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) !== Object.prototype &&
    Object.getPrototypeOf(value) !== null
  )
    return false;
  ancestors.add(value);
  const valid = Object.values(value).every((entry) => isJsonData(entry, ancestors));
  ancestors.delete(value);
  return valid;
}

/**
 * Produce a reviewable conversion without dropping legacy obligations or treating
 * a manifest's claims as host authority. Known policy differences stay explicit;
 * callers must review them rather than infer equivalence from copied fields.
 */
export function migrateAssetIntentV1ToRequirements(value: unknown): RequirementsMigrationReport {
  const report: RequirementsMigrationReport = {
    kind: 'kiln.requirements-migration',
    schemaVersion: 1,
    status: 'invalid',
    changes: [],
    unresolved: [],
  };
  if (!isJsonData(value)) {
    report.unresolved.push({
      code: 'NON_JSON_LEGACY_INTENT',
      path: '',
      message: 'Migration requires finite, acyclic JSON data.',
    });
    return report;
  }
  report.original = structuredClone(value);
  const validated = validateAssetIntentV1(value);
  if (!validated.valid || !validated.value) {
    report.unresolved = validated.issues;
    return report;
  }
  const intent = validated.value;
  const proposal = createAssetRequirementsV1({
    labels: [...new Set([intent.category, ...(intent.subtype ? [intent.subtype] : [])])],
    scope: {
      state: intent.scope.explicit ? 'requested' : 'inferred',
      value: intent.scope.scope,
      reason: intent.scope.explicit
        ? 'Explicit persisted scope.'
        : 'Historical scope default; not an explicit user requirement.',
    },
  });
  const requirements = proposal.requirements;
  const change = (
    from: string,
    to: string,
    explanation = 'Preserved as an explicit requirement from the original record.',
  ) => {
    report.changes.push({ from, to, explanation });
  };
  change(
    'category',
    'labels',
    'Category is descriptive; its rule obligations are listed separately for qualification.',
  );
  if (intent.subtype) change('subtype', 'labels');
  change('scope', 'scope');
  change('frame', 'frame', 'The canonical coordinate frame is unchanged.');
  requirements.material = requestedRequirement({ ...intent.material });
  requirements.parts = requestedRequirement({
    required: [...intent.requiredParts],
    forbiddenExtras: [...intent.forbiddenExtras],
  });
  change('material', 'requirements.material');
  change('requiredParts', 'requirements.parts.required');
  change('forbiddenExtras', 'requirements.parts.forbiddenExtras');
  if (intent.bounds) {
    requirements.bounds = requestedRequirement({ ...intent.bounds });
    change('bounds', 'requirements.bounds');
  }
  if (intent.animation) {
    requirements.animation = requestedRequirement(structuredClone(intent.animation));
    change('animation', 'requirements.animation');
  }
  if (intent.architecture) {
    requirements.structure = requestedRequirement(structuredClone(intent.architecture));
    change('architecture', 'requirements.structure');
  }
  if (intent.character) {
    requirements.rig = requestedRequirement(structuredClone(intent.character));
    change('character', 'requirements.rig');
  }
  if (intent.vehicle) {
    requirements.mobility = requestedRequirement({
      ...structuredClone(intent.vehicle),
      frontFrame: '+X',
    });
    change(
      'qaRules.VEH_FRONT_AXIS',
      'requirements.mobility.frontFrame',
      'Preserve the former vehicle profile front-frame obligation explicitly.',
    );
    change('vehicle', 'requirements.mobility');
  }
  if (intent.vegetation) {
    requirements.foliage = requestedRequirement(structuredClone(intent.vegetation));
    change('vegetation', 'requirements.foliage');
  }
  if (intent.vfx) {
    requirements.effects = requestedRequirement(structuredClone(intent.vfx));
    change('vfx', 'requirements.effects');
  }
  if (intent.modular) {
    requirements.modular = requestedRequirement(structuredClone(intent.modular));
    change('modular', 'requirements.modular');
  }
  const environment = resolveEnvironmentIntentProfile(intent);
  if (environment) {
    const { schemaVersion: _version, ...spatialLayout } = environment;
    requirements.spatialLayout = requestedRequirement(spatialLayout);
    change(
      'category+subtype+capabilities',
      'requirements.spatialLayout',
      'Preserved explicit environment socket, tiling and navigation context.',
    );
  }
  const representation: {
    transparentSurface?: boolean;
    runtimeShader?: boolean;
    precomputedTangents?: boolean;
    skinned?: boolean;
  } = {};
  const access: { enterable?: boolean; driveable?: boolean } = {};
  for (const capability of intent.capabilities) {
    let target: string;
    switch (capability) {
      case 'grounded':
        requirements.grounding = requestedRequirement({
          planeY: intent.frame.groundY,
        });
        target = 'grounding';
        break;
      case 'articulated':
        requirements.articulation = requestedRequirement({});
        target = 'articulation';
        break;
      case 'openable':
        requirements.opening = requestedRequirement({});
        target = 'opening';
        break;
      case 'navigable':
        requirements.navigation = requestedRequirement(
          intent.category === 'environment' ? { minWidth: 0.8, minHeight: 1.8 } : {},
        );
        if (intent.category === 'environment')
          change(
            'qaRules.ENV_NAV_CORRIDOR_TOO_NARROW+ENV_NAV_HEADROOM_TOO_LOW',
            'requirements.navigation.minWidth+minHeight',
            'Preserve historical 0.8 m width and 1.8 m headroom advice explicitly; neutral navigation has no default dimensions.',
          );
        target = 'navigation';
        break;
      case 'tileable':
        requirements.tiling = requestedRequirement({});
        target = 'tiling';
        break;
      case 'enterable':
      case 'driveable':
        access[capability] = true;
        target = 'access';
        break;
      case 'transparentSurface':
      case 'runtimeShader':
      case 'precomputedTangents':
      case 'skinned':
        representation[capability] = true;
        target = 'representation';
        break;
    }
    change(`capabilities.${capability}`, `requirements.${target}`);
  }
  if (Object.keys(representation).length > 0)
    requirements.representation = requestedRequirement(representation);
  if (Object.keys(access).length > 0) requirements.access = requestedRequirement(access);
  if (intent.qaProfile !== `${intent.category}.default`) {
    report.unresolved.push({
      code: 'CUSTOM_QA_PROFILE',
      path: 'qaProfile',
      message: `Profile ${JSON.stringify(intent.qaProfile)} needs an explicit rule-policy disposition, including any legacy-name exceptions.`,
    });
  }
  for (const field of Object.keys(value as object)) {
    if (!MAPPED_FIELDS.has(field))
      report.unresolved.push({
        code: 'UNMAPPED_LEGACY_FIELD',
        path: field,
        message:
          'Preserved in the original record; its meaning must be resolved before activation.',
      });
  }
  for (const [parent, allowed] of [
    ['scope', new Set(['schemaVersion', 'scope', 'explicit'])],
    ['frame', new Set(['units', 'forward', 'up', 'right', 'groundY'])],
  ] as const) {
    for (const field of Object.keys(intent[parent])) {
      if (!allowed.has(field))
        report.unresolved.push({
          code: 'UNMAPPED_LEGACY_FIELD',
          path: `${parent}.${field}`,
          message:
            'Preserved in the original record; its meaning must be resolved before activation.',
        });
    }
  }
  const ruleReviews = { ...CATEGORY_RULE_REVIEWS[intent.category] };
  ruleReviews.ASSET_SCOPE_PROFILE = intent.scope.explicit
    ? 'observe: requested scope retains advisory member/dressing measurements. Nested members no longer inflate top-level counts; these measurements do not certify semantic scope or reusable kit membership.'
    : 'observe: the historical scope is inferred and remains inferred in the proposal. It no longer activates scope observation; explicitly review scope rather than silently promoting a historical default to a requested requirement.';
  if (intent.scope.scope === 'modularSet' && intent.scope.explicit)
    ruleReviews.MODULAR_JOIN_PROFILE =
      'enforce: explicit historical modularSet scope selected the join check, whose analyzer sampled only the first reciprocal pair. Neutral modular joins are not evaluated; review this unsupported obligation rather than accepting a grid declaration as equivalent join coverage.';
  else if (intent.modular)
    ruleReviews.MODULAR_JOIN_PROFILE =
      'enforce: historical join checking required explicit modularSet scope. The proposal retains modular data as requested, but neutral modular joins are not evaluated. Review both the changed applicability and the unsupported obligation.';
  for (const [rule, explanation] of Object.entries(ruleReviews)) {
    report.unresolved.push({
      code: 'RULE_MIGRATION_UNQUALIFIED',
      path: `qaRules.${rule}`,
      message: explanation,
    });
  }
  const current = validateAssetRequirementsV1(proposal);
  if (!current.valid || !current.value) {
    report.unresolved.push(...current.issues);
    return report;
  }
  report.status = 'review-required';
  report.proposal = current.value;
  return report;
}

/**
 * Preserve an old revision while proposing current requirements. Manifest hashes
 * identify the retained bytes; this data-only function does not verify or rebuild
 * those files and cannot turn old QA into current acceptance.
 */
export function migrateAssetManifestV1ToRequirements(
  value: unknown,
  recovery?: { legacyIntent: unknown },
): AssetManifestMigrationReport {
  const report: AssetManifestMigrationReport = {
    kind: 'kiln.asset-manifest-migration',
    schemaVersion: 1,
    status: 'invalid',
    changes: [],
    unresolved: [],
  };
  const issue = (code: string, path: string, message: string) => {
    report.unresolved.push({ code, path, message });
  };
  if (!isJsonData(value)) {
    issue('NON_JSON_LEGACY_MANIFEST', '', 'Migration requires finite, acyclic JSON data.');
    return report;
  }
  report.original = structuredClone(value);
  const parsed = assetManifestSchema.safeParse(value);
  if (!parsed.success) {
    for (const problem of parsed.error.issues)
      issue('INVALID_LEGACY_MANIFEST', problem.path.join('.'), problem.message);
    return report;
  }
  const manifest = parsed.data;
  const options = manifest.build?.options;
  if (options && ('requirements' in options || 'requirementsCheckpoint' in options)) {
    issue(
      'CURRENT_REQUIREMENTS_PRESENT',
      'build.options',
      'Use current saved-requirements restore; do not reinterpret an existing receipt as legacy policy.',
    );
    return report;
  }
  if (!manifest.editable || !manifest.files['source.kiln.js'] || !manifest.files['asset.glb']) {
    issue(
      'LEGACY_SOURCE_UNAVAILABLE',
      'files',
      'A source-bearing revision and its GLB inventory are required for an editable migration. Existing artifacts remain readable.',
    );
    return report;
  }
  if (recovery && options?.intent !== undefined) {
    issue(
      'LEGACY_INTENT_ALREADY_PRESENT',
      'build.options.intent',
      'A supplied reconstruction cannot replace an existing persisted intent.',
    );
    return report;
  }
  const legacyIntent = options?.intent ?? recovery?.legacyIntent;
  if (legacyIntent === undefined) {
    issue(
      'MISSING_LEGACY_INTENT',
      'build.options.intent',
      'No persisted full intent exists. A category label or old QA result cannot reconstruct historical obligations; recover the original brief/intent explicitly.',
    );
    return report;
  }
  const converted = migrateAssetIntentV1ToRequirements(legacyIntent);
  const intentPath = recovery ? 'recoveredIntent' : 'build.options.intent';
  if (recovery && converted.original !== undefined)
    report.recoveredIntent = {
      source: 'host-reconstruction',
      value: converted.original,
    };
  report.unresolved.push(
    ...converted.unresolved.map((problem) => ({
      ...problem,
      path: `${intentPath}${problem.path ? `.${problem.path}` : ''}`,
    })),
  );
  if (!converted.proposal || converted.status === 'invalid') return report;
  const intentCategory = (legacyIntent as { category: string }).category;
  if (options?.category !== undefined && options.category !== intentCategory)
    issue(
      'LEGACY_CATEGORY_CONFLICT',
      'build.options.category',
      'Persisted category and intent disagree; resolve the original request before binding the proposal.',
    );
  for (const key of Object.keys(value as object))
    if (!Object.hasOwn(assetManifestSchema.shape, key))
      issue(
        'UNMAPPED_MANIFEST_FIELD',
        key,
        'Retained in the original record; review its meaning before migration.',
      );
  const retainedBuildOptions = structuredClone(options ?? {});
  delete retainedBuildOptions.intent;
  delete retainedBuildOptions.category;
  for (const key of Object.keys(retainedBuildOptions))
    issue(
      'LEGACY_BUILD_OPTION_REVIEW',
      `build.options.${key}`,
      'Retained for review; select a supported current build option explicitly when rebuilding.',
    );
  const rawBuild = (value as { build?: Record<string, unknown> }).build;
  if (rawBuild)
    for (const key of Object.keys(rawBuild))
      if (
        !['engine', 'options', 'warnings', 'integration', 'qa', 'dependencies', 'rebuild'].includes(
          key,
        )
      )
        issue(
          'UNMAPPED_MANIFEST_FIELD',
          `build.${key}`,
          'Retained in the original build record; its meaning is not silently discarded.',
        );
  const requirements = structuredClone(converted.proposal);
  requirements.labels = [...new Set([...requirements.labels, ...manifest.tags])];
  const current = validateAssetRequirementsV1(requirements);
  if (!current.valid || !current.value) {
    report.unresolved.push(
      ...current.issues.map((problem) => ({
        ...problem,
        path: `proposal.requirements.${problem.path}`,
      })),
    );
    return report;
  }
  report.proposal = {
    kind: 'kiln.asset-migration-proposal',
    schemaVersion: 1,
    originalRevision: {
      assetId: manifest.assetId,
      revisionId: manifest.revisionId,
    },
    source: { ...manifest.files['source.kiln.js'] },
    retainedFiles: structuredClone(manifest.files),
    retainedBuildOptions,
    requirements: current.value,
    rebuildRequired: true,
    artifactVerification: 'not-performed',
  };
  report.changes = [
    ...converted.changes.map((change) => ({
      ...change,
      from: `${intentPath}.${change.from}`,
      to: `proposal.requirements.${change.to}`,
    })),
    {
      from: 'tags',
      to: 'proposal.requirements.labels',
      explanation: 'Retained as descriptive labels only.',
    },
    {
      from: 'files',
      to: 'proposal.retainedFiles',
      explanation:
        'Original artifact identities remain unchanged; bytes have not been verified by this manifest-only conversion.',
    },
    {
      from: 'build.qa',
      to: 'original.build.qa',
      explanation:
        'Historical QA stays in the original. Rebuild with current host-authorized requirements and obtain a new report; no current QA or binding is fabricated.',
    },
    {
      from: 'build.options',
      to: 'proposal.retainedBuildOptions',
      explanation: 'Non-policy options remain review data, not executable defaults.',
    },
  ];
  report.status = 'review-required';
  return report;
}

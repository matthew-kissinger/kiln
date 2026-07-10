/** Official Khronos glTF Validator integration for final persisted GLB bytes. */

export interface KhronosGltfIssue {
  code: string;
  message: string;
  severity: number;
  pointer?: string;
}

export interface KhronosGltfValidationReport {
  uri?: string;
  mimeType?: string;
  validatorVersion?: string;
  validatedAt?: string;
  issues: {
    numErrors: number;
    numWarnings: number;
    numInfos: number;
    numHints: number;
    messages: KhronosGltfIssue[];
    truncated?: boolean;
  };
  info?: Record<string, unknown>;
}

function finiteCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

function normalizeIssue(value: unknown): KhronosGltfIssue {
  const issue = (value ?? {}) as Record<string, unknown>;
  return {
    code: typeof issue.code === 'string' ? issue.code : 'GLTF_VALIDATOR_UNKNOWN',
    message: typeof issue.message === 'string' ? issue.message : 'Unknown glTF validation issue.',
    severity: finiteCount(issue.severity),
    ...(typeof issue.pointer === 'string' ? { pointer: issue.pointer } : {}),
  };
}

function normalizeReport(value: unknown): KhronosGltfValidationReport {
  const report = (value ?? {}) as Record<string, unknown>;
  const sourceIssues = (report.issues ?? {}) as Record<string, unknown>;
  return {
    ...(typeof report.uri === 'string' ? { uri: report.uri } : {}),
    ...(typeof report.mimeType === 'string' ? { mimeType: report.mimeType } : {}),
    ...(typeof report.validatorVersion === 'string'
      ? { validatorVersion: report.validatorVersion }
      : {}),
    ...(typeof report.validatedAt === 'string' ? { validatedAt: report.validatedAt } : {}),
    issues: {
      numErrors: finiteCount(sourceIssues.numErrors),
      numWarnings: finiteCount(sourceIssues.numWarnings),
      numInfos: finiteCount(sourceIssues.numInfos),
      numHints: finiteCount(sourceIssues.numHints),
      messages: Array.isArray(sourceIssues.messages)
        ? sourceIssues.messages.map(normalizeIssue)
        : [],
      ...(typeof sourceIssues.truncated === 'boolean' ? { truncated: sourceIssues.truncated } : {}),
    },
    ...(report.info && typeof report.info === 'object'
      ? { info: report.info as Record<string, unknown> }
      : {}),
  };
}

export class GltfValidationError extends Error {
  readonly report: KhronosGltfValidationReport;

  constructor(report: KhronosGltfValidationReport) {
    const first = report.issues.messages.find((issue) => issue.severity === 0);
    super(
      `Final GLB failed Khronos validation with ${report.issues.numErrors} error(s)` +
        (first ? `: ${first.code} — ${first.message}` : '.'),
    );
    this.name = 'GltfValidationError';
    this.report = report;
  }
}

/** Validate the exact bytes intended for persistence. No network resources are permitted. */
export async function validateFinalGlbBytes(
  bytes: Uint8Array,
  uri = 'model.glb',
): Promise<KhronosGltfValidationReport> {
  const validator = await import('gltf-validator');
  const raw = await validator.validateBytes(bytes, {
    uri,
    maxIssues: 1_000,
    externalResourceFunction: async (externalUri: string) => {
      throw new Error(`External glTF resource is forbidden in final GLB: ${externalUri}`);
    },
  });
  return normalizeReport(raw);
}

export async function assertFinalGlbValid(
  bytes: Uint8Array,
  uri = 'model.glb',
): Promise<KhronosGltfValidationReport> {
  const report = await validateFinalGlbBytes(bytes, uri);
  if (report.issues.numErrors > 0) throw new GltfValidationError(report);
  return report;
}

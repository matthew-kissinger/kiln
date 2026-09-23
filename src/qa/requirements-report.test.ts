import { expect, test } from 'bun:test';
import { createAssetRequirementsV1, requestedRequirement } from '../contracts/requirements';
import { createAssetRequirementsStore } from '../requirements-store';
import { resolveRequirementsContext } from '../requirements-context';
import { REQUIREMENTS_RULE_MAP } from './requirements-applicability';
import { createRequirementsQaReport } from './requirements-report';
const executedRules = REQUIREMENTS_RULE_MAP.filter((x) => x.kernel).map((x) => x.id);
test('universal success yields category-free acceptance only for supported requirements', () => {
  const report = createRequirementsQaReport(resolveRequirementsContext(), { executedRules });
  expect(report.schemaVersion).toBe(2);
  expect(report.acceptance).toBe('accepted');
  expect(report.disposition).toBe('pass');
  expect(report).not.toHaveProperty('category');
  expect(report.dimensions.requirementReadiness.status).toBe('pass');
});
test('a produced artifact with an unsupported requested obligation is not accepted', () => {
  const binding = createAssetRequirementsStore().host.bind(
    { taskId: 't', lineageId: 'a' },
    createAssetRequirementsV1({
      requirements: { structure: requestedRequirement({ roof: { type: 'custom-arched-shell' } }) },
    }),
    { actor: 'host', source: 'brief', reason: 'brief' },
  );
  const report = createRequirementsQaReport(resolveRequirementsContext(binding), { executedRules });
  expect(report.acceptance).toBe('incomplete');
  expect(report.disposition).toBe('notEvaluated');
  expect(report.dimensions.requirementReadiness.status).toBe('notEvaluated');
  expect(report.unevaluatedRequirements.map((x) => x.key)).toEqual(['structure']);
});
test('actual exact blockers remain blockers even with unsupported obligations', () => {
  const report = createRequirementsQaReport(resolveRequirementsContext(), {
    executedRules,
    findings: [
      {
        code: 'UNIVERSAL_EMPTY_OUTPUT',
        disposition: 'block',
        dimension: 'exportIntegrity',
        profile: 'universal',
        message: 'Scene is empty.',
      },
    ],
  });
  expect(report.acceptance).toBe('blocked');
  expect(report.disposition).toBe('block');
});
test('unexecuted mandatory kernels cannot create a clean pass', () => {
  const report = createRequirementsQaReport(resolveRequirementsContext(), { executedRules: [] });
  expect(report.acceptance).toBe('incomplete');
  expect(report.disposition).toBe('notEvaluated');
});

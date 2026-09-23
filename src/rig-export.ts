import {
  KILN_CHARACTER_JOINT_EXTRAS_KEY,
  KILN_CHARACTER_RIG_EXTRAS_KEY,
  validateCharacterJointDescriptorV1,
  validateCharacterRigGraphV1,
} from './character';

/** Both exporters preserve the same validated, detached rig data, never arbitrary userData. */
export function rigExtrasForExport(node: {
  name: string;
  userData: Record<string, unknown>;
}): Record<string, unknown> {
  const extras: Record<string, unknown> = {};
  for (const [key, validate] of [
    [KILN_CHARACTER_JOINT_EXTRAS_KEY, validateCharacterJointDescriptorV1],
    [KILN_CHARACTER_RIG_EXTRAS_KEY, validateCharacterRigGraphV1],
  ] as const) {
    const value = node.userData[key];
    if (value === undefined) continue;
    const result = validate(value);
    if (!result.valid || !result.value) {
      throw new TypeError(
        `Invalid ${key} on node ${node.name || '<unnamed>'}: ${result.issues.map((issue) => `${issue.path || '<root>'}: ${issue.message}`).join('; ')}`,
      );
    }
    extras[key] = result.value;
  }
  return extras;
}

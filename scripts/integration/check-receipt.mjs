/** Explicit engine-specific expectations: no import-success-only acceptance. */
export function checkReceipt(receipt, manifest) {
  const errors = [];
  if (!receipt.engine || !receipt.version) errors.push('missing engine/version identity');
  if (!Object.keys(manifest.files ?? {}).length) errors.push('missing file expectations');
  const equal = (actual, expected) =>
    typeof expected === 'number'
      ? Number.isFinite(actual) && Math.abs(actual - expected) <= (manifest.tolerance ?? 1e-5)
      : Array.isArray(expected)
        ? Array.isArray(actual) &&
          actual.length === expected.length &&
          expected.every((v, i) => equal(actual[i], v))
        : actual === expected;
  for (const [file, expected] of Object.entries(manifest.files ?? {})) {
    const matches = (receipt.files ?? []).filter((r) => r.file === file);
    if (matches.length !== 1) {
      errors.push(`${file}: missing or duplicate receipt`);
      continue;
    }
    const actual = matches[0];
    if (actual.error) {
      errors.push(`${file}: ${actual.error}`);
      continue;
    }
    if (
      !expected.nodes?.length &&
      !expected.materials?.length &&
      expected.animationCount === undefined
    )
      errors.push(`${file}: no assertions`);
    if (
      expected.animationCount !== undefined &&
      actual.animations?.length !== expected.animationCount
    )
      errors.push(`${file}: animationCount mismatch`);
    if (
      expected.animatedNodeCount !== undefined &&
      actual.animatedNodeCount !== expected.animatedNodeCount
    )
      errors.push(`${file}: animatedNodeCount mismatch`);
    for (const collection of ['nodes', 'materials'])
      for (const item of expected[collection] ?? []) {
        const found = (actual[collection] ?? []).filter((entry) => entry.name === item.name);
        if (found.length !== 1) {
          errors.push(`${file}: ${collection}/${item.name} missing or ambiguous`);
          continue;
        }
        for (const [key, value] of Object.entries(item))
          if (!equal(found[0][key], value))
            errors.push(
              `${file}: ${collection}/${item.name}.${key} expected ${JSON.stringify(value)}, got ${JSON.stringify(found[0][key])}`,
            );
      }
  }
  for (const record of receipt.files ?? [])
    if (!manifest.files?.[record.file])
      errors.push(`${record.file}: no expectations${record.error ? `; ${record.error}` : ''}`);
  return errors;
}

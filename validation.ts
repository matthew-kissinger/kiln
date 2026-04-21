/**
 * Kiln Code Validation
 *
 * Validates generated Kiln code before returning it to the caller.
 * Catches common Claude output issues (exports, wrong keyframe format,
 * missing meta/build).
 *
 * Copied from packages/shared/kiln-validation.ts for the core spike.
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validate(code: string): ValidationResult {
  const errors: string[] = [];

  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    return { valid: false, errors: ['Empty or missing code'] };
  }

  // Must have meta object
  if (!/const\s+meta\s*=/.test(code)) {
    errors.push('Missing `const meta = { ... }` declaration');
  }

  // Must have build function
  if (!/function\s+build\s*\(/.test(code)) {
    errors.push('Missing `function build()` declaration');
  }

  // No import statements (sandbox globals)
  if (/^\s*import\s+/m.test(code)) {
    errors.push('Contains import statements - code must use sandbox globals only');
  }

  // No export statements
  if (/^\s*export\s+/m.test(code)) {
    errors.push('Contains export statements - just define meta, build, animate');
  }

  // Detect wrong keyframe format: { time: N, value: [...] }
  if (/\{\s*time:\s*[^,]+,\s*value:\s*\[/.test(code)) {
    errors.push('Uses `value:` in keyframes - must use `rotation:` or `position:` instead');
  }

  // Syntax check via Function constructor
  try {
    new Function(code);
  } catch (e) {
    errors.push(`Syntax error: ${e instanceof Error ? e.message : String(e)}`);
  }

  return { valid: errors.length === 0, errors };
}

// Compatibility alias - matches the shared package's exported name so call
// sites can swap over cleanly during the W2 dedupe.
export const validateKilnCode = validate;

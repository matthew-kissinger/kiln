/** Closed, engine-owned repair hints. Never serialize exception messages or stacks. */
export type AuthoringDiagnostic = 'UNBOUND_VARIABLE' | 'GEAR_RADII_ORDER' | 'ROUNDED_BOX_RADIUS';
// Names no identifier on purpose. The identifier is only available from the
// sandboxed exception message, and this module's contract is that no captured
// identifier, path, message or stack crosses that boundary. Pointing at the
// discovery tool is engine-owned text, so it costs nothing to include and is
// the actionable half: an undeclared name here is usually a helper that does
// not exist rather than a typo in a local.
export const UNBOUND_VARIABLE_ADVICE =
  'Check variable spelling and scope: generated code used an undeclared variable. Read the current source and check declarations before retrying. If it was meant to be a Kiln helper, call kiln_list_primitives to confirm the exact name and signature; the sandbox exposes only those globals.';
export const GEAR_RADII_ORDER_ADVICE =
  'gearGeo requires boreRadius < rootRadius < tipRadius; specify rootRadius when changing tipRadius. Omitted radii keep their absolute defaults.';
export const ROUNDED_BOX_RADIUS_ADVICE =
  'roundedBoxGeo: radius must be less than half the smallest dimension. Reduce radius or increase the smallest dimension; equality is invalid.';
export function authoringDiagnosticAdvice(diagnostic: AuthoringDiagnostic | undefined): string {
  if (diagnostic === 'UNBOUND_VARIABLE') return UNBOUND_VARIABLE_ADVICE;
  if (diagnostic === 'ROUNDED_BOX_RADIUS') return ROUNDED_BOX_RADIUS_ADVICE;
  return diagnostic === 'GEAR_RADII_ORDER' ? GEAR_RADII_ORDER_ADVICE : '';
}
export class AuthoringDiagnosticError extends Error {
  constructor(readonly diagnostic: AuthoringDiagnostic = 'UNBOUND_VARIABLE') {
    super(authoringDiagnosticAdvice(diagnostic));
    this.name = 'AuthoringDiagnosticError';
  }
}
export function rethrowAuthoringError(error: unknown): never {
  // Unsupported ambient/resource APIs stay generic, including the legacy loadTexture probe.
  // Classification only. No captured identifier, path, message, or stack crosses the boundary.
  if (
    error instanceof ReferenceError &&
    /(?: is not defined$|^Can't find variable: )/.test(error.message) &&
    !/\b(?:loadTexture|process|fetch|globalThis|require|Bun|Deno)\b/.test(error.message)
  ) {
    throw new AuthoringDiagnosticError();
  }
  throw error;
}

/** Closed, engine-owned repair hints. Never serialize exception messages or stacks. */
export type AuthoringDiagnostic = 'UNBOUND_VARIABLE' | 'GEAR_RADII_ORDER';
export const UNBOUND_VARIABLE_ADVICE =
  'Check variable spelling and scope: generated code used an undeclared variable. Read the current source and check declarations before retrying.';
export const GEAR_RADII_ORDER_ADVICE =
  'gearGeo requires boreRadius < rootRadius < tipRadius; specify rootRadius when changing tipRadius. Omitted radii keep their absolute defaults.';
export function authoringDiagnosticAdvice(diagnostic: AuthoringDiagnostic | undefined): string {
  if (diagnostic === 'UNBOUND_VARIABLE') return UNBOUND_VARIABLE_ADVICE;
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

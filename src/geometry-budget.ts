/** Per-operation compute/allocation limits, independent of asset labels or style. */
export const GEOMETRY_ALLOCATION_LIMITS = Object.freeze({
  parametricSamples: 262_144,
  subdivisionTriangles: 1_000_000,
  subdivisionAttributeBytes: 128 * 1024 * 1024,
  subdivisionIterations: 10,
  repeatedMeshes: 10_000,
  primitiveSegments: 4096,
  primitiveGridVertices: 262_144,
});
export function assertDimension(name: string, value: number, allowZero = false): void {
  if (
    !Number.isFinite(value) ||
    !Number.isFinite(Math.fround(value)) ||
    (allowZero ? value < 0 : Math.fround(value) <= 0)
  )
    throw new RangeError(
      `${name} must be finite, representable in Float32, and ${allowZero ? 'nonnegative' : 'positive'}.`,
    );
}
export function assertPrimitiveSegments(name: string, value: number, minimum: number): void {
  if (
    !Number.isSafeInteger(value) ||
    value < minimum ||
    value > GEOMETRY_ALLOCATION_LIMITS.primitiveSegments
  )
    throw new RangeError(
      `${name} must be an integer from ${minimum} to ${GEOMETRY_ALLOCATION_LIMITS.primitiveSegments}.`,
    );
}
export function assertPrimitiveGrid(name: string, first: number, second: number): void {
  if ((first + 1) * (second + 1) > GEOMETRY_ALLOCATION_LIMITS.primitiveGridVertices)
    throw new RangeError(
      `${name} exceeds ${GEOMETRY_ALLOCATION_LIMITS.primitiveGridVertices} grid vertices; reduce segment counts.`,
    );
}
export function assertRepetitionCount(name: string, count: number): void {
  if (
    !Number.isSafeInteger(count) ||
    count < 1 ||
    count > GEOMETRY_ALLOCATION_LIMITS.repeatedMeshes
  )
    throw new RangeError(
      `${name} count must be an integer from 1 to ${GEOMETRY_ALLOCATION_LIMITS.repeatedMeshes}, including the source. Split large repetitions into intentional bounded groups.`,
    );
}
export function assertFiniteTriple(name: string, values: readonly number[]): void {
  if (!Array.isArray(values) || values.length !== 3 || !values.every(Number.isFinite))
    throw new RangeError(`${name} must contain three finite numbers.`);
}

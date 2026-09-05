/** Experimental bounded implicit surfaces. Synchronous WASM work is cancellable only by the host evaluator boundary. */
import type * as THREE from 'three';
import { getManifoldModule, manifoldToGeometry } from './solids';
import type { Point3 } from './geometry';

export interface ImplicitSurfaceOptions {
  bounds: { min: Point3; max: Point3 };
  edgeLength: number;
  /** Sampling-grid estimate cap, checked before WASM. Default 1,000,000 cells. */
  maxCells?: number;
  /** Actual callback cap, including adaptive samples. Default 8,000,000 evaluations. */
  maxEvaluations?: number;
  /** Positive values inset a positive-inside field. */
  level?: number;
  /** Root-finding tolerance; -1 uses interpolated crossings. */
  tolerance?: number;
  smooth?: boolean;
}

export async function implicitSurface(
  sample: (point: Point3) => number,
  options: ImplicitSurfaceOptions,
): Promise<THREE.BufferGeometry> {
  const {
    bounds,
    edgeLength,
    maxCells = 1_000_000,
    maxEvaluations = 8_000_000,
    level = 0,
    tolerance = -1,
    smooth = true,
  } = options;
  if (
    bounds?.min.length !== 3 ||
    bounds.max.length !== 3 ||
    ![...bounds.min, ...bounds.max].every(Number.isFinite) ||
    bounds.min.some((v, i) => v >= bounds.max[i]!)
  )
    throw new Error('implicitSurface bounds must be finite and increasing on every axis');
  if (!Number.isFinite(edgeLength) || edgeLength <= 0)
    throw new Error('implicitSurface edgeLength must be positive and finite');
  if (
    !Number.isSafeInteger(maxCells) ||
    maxCells < 1 ||
    !Number.isSafeInteger(maxEvaluations) ||
    maxEvaluations < 1
  )
    throw new Error('implicitSurface maxCells and maxEvaluations must be positive safe integers');
  if (
    !Number.isFinite(level) ||
    !Number.isFinite(tolerance) ||
    (tolerance !== -1 && tolerance <= 0)
  )
    throw new Error('implicitSurface level must be finite; tolerance must be -1 or positive');
  const estimatedGridCells = bounds.min.reduce(
    (product, min, i) => product * Math.ceil((bounds.max[i]! - min) / edgeLength),
    1,
  );
  if (!Number.isSafeInteger(estimatedGridCells) || estimatedGridCells > maxCells)
    throw new Error(
      `implicitSurface estimated grid ${estimatedGridCells} exceeds maxCells ${maxCells}; increase edgeLength or narrow bounds`,
    );
  const mod = await getManifoldModule();
  let evaluations = 0;
  const solid = mod.Manifold.levelSet(
    (point) => {
      evaluations++;
      if (evaluations > maxEvaluations)
        throw new Error(`implicitSurface exceeded maxEvaluations ${maxEvaluations}`);
      const value = sample([point[0], point[1], point[2]]);
      if (!Number.isFinite(value))
        throw new Error('implicitSurface callback must return a finite number');
      return value;
    },
    { min: [...bounds.min], max: [...bounds.max] },
    edgeLength,
    level,
    tolerance,
  );
  try {
    if (solid.numTri() === 0)
      throw new Error(
        'implicitSurface result is empty; the field does not enclose a positive-inside region in these bounds',
      );
    const out = manifoldToGeometry(solid, { smooth });
    out.userData.kilnImplicit = {
      schemaVersion: 1,
      experimental: true,
      edgeLength,
      estimatedGridCells,
      evaluations,
      maxCells,
      maxEvaluations,
    };
    out.userData.kilnGeometryWarnings = [
      {
        code: 'EXPERIMENTAL_IMPLICIT_SURFACE',
        message:
          'Implicit sampling is resolution-dependent and produces geometry without UVs. Review thin features and bounds; closed topology is not a claim of CAD accuracy.',
      },
    ];
    return out;
  } finally {
    solid.delete();
  }
}

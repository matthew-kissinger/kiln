/** Lossless TRS validation shared by assembly placement operations. */
import * as THREE from 'three';

export function checkedTrs(
  matrix: THREE.Matrix4,
  label: string,
): { position: THREE.Vector3; quaternion: THREE.Quaternion; scale: THREE.Vector3 } {
  const e = matrix.elements;
  // Inverting an affine parent can leave the homogeneous constant a few ulps
  // from one. Keep projective terms strictly zero while accepting that roundoff.
  if (
    !e.every(Number.isFinite) ||
    e[3] !== 0 ||
    e[7] !== 0 ||
    e[11] !== 0 ||
    Math.abs(e[15]! - 1) > 16 * Number.EPSILON
  )
    throw new Error(`${label}: finite affine TRS is required.`);
  if (!Number.isFinite(matrix.determinant()) || matrix.determinant() === 0)
    throw new Error(`${label}: singular/zero-scale transforms are unsupported.`);
  const position = new THREE.Vector3(),
    quaternion = new THREE.Quaternion(),
    scale = new THREE.Vector3();
  matrix.decompose(position, quaternion, scale);
  const rebuilt = new THREE.Matrix4().compose(position, quaternion, scale);
  if (
    rebuilt.elements.some(
      (value, i) =>
        !Number.isFinite(value) || Math.abs(value - e[i]!) > 1e-8 * Math.max(1, Math.abs(e[i]!)),
    )
  )
    throw new Error(`${label}: local shear cannot be represented losslessly as TRS.`);
  return { position, quaternion, scale };
}

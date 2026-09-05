import type * as THREE from 'three';

export type GeometryExportPolicy = 'warn' | 'strict';
export const EXPORTED_GEOMETRY_ATTRIBUTES: Readonly<Record<string, number>> = {
  position: 3,
  normal: 3,
  uv: 2,
  tangent: 4,
};

/** Read logical values, including interleaved stride/offset and normalized integer attributes. */
export function geometryAttributeValues(
  attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
): Float32Array<ArrayBuffer> {
  const values = new Float32Array(attribute.count * attribute.itemSize);
  for (let vertex = 0; vertex < attribute.count; vertex++) {
    for (let component = 0; component < attribute.itemSize; component++) {
      values[vertex * attribute.itemSize + component] = attribute.getComponent(vertex, component);
    }
  }
  return values;
}

/** Check export data before bounds, texture baking or GLB conversion can obscure its origin. */
export function inspectGeometryExport(
  root: THREE.Object3D,
  policy: GeometryExportPolicy = 'warn',
): string[] {
  const warnings: string[] = [];
  root.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;
    const geometry = mesh.geometry;
    const name = mesh.name || '<unnamed mesh>';
    const unsupported = (feature: string) => {
      const message = `EXPORT_ATTRIBUTE_UNSUPPORTED ${name}: ${feature} is not preserved by the GLB bridge.`;
      if (policy === 'strict') throw new TypeError(message);
      warnings.push(message);
    };
    const position = geometry.getAttribute('position');
    if (!position || position.itemSize !== 3)
      throw new TypeError(`${name}: position requires xyz vertices.`);
    for (const [key, attribute] of Object.entries(geometry.attributes)) {
      const expected = EXPORTED_GEOMETRY_ATTRIBUTES[key];
      if (expected === undefined) {
        unsupported(key);
        continue;
      }
      if (attribute.itemSize !== expected || attribute.count !== position.count) {
        throw new TypeError(
          `${name}: ${key} requires ${position.count} vertices with ${expected} components each.`,
        );
      }
      for (let vertex = 0; vertex < attribute.count; vertex++) {
        for (let component = 0; component < attribute.itemSize; component++) {
          if (!Number.isFinite(attribute.getComponent(vertex, component))) {
            throw new TypeError(`${name}: ${key} contains a non-finite value at vertex ${vertex}.`);
          }
        }
      }
    }
    const index = geometry.getIndex();
    if ((index?.count ?? position.count) % 3 !== 0)
      throw new TypeError(`${name}: triangle indices/vertices must be a multiple of three.`);
    if (index) {
      for (let i = 0; i < index.count; i++) {
        const value = index.getX(i);
        if (!Number.isInteger(value) || value < 0 || value >= position.count)
          throw new TypeError(`${name}: index ${i} is outside the position attribute.`);
      }
    }
    // Material arrays are supported by bridgeGeometry's exact group-range validation.
    for (const key of Object.keys(geometry.morphAttributes)) unsupported(`morph ${key}`);
    if ((mesh as THREE.SkinnedMesh).isSkinnedMesh) unsupported('skinning');
    for (const key of ['kilnAttributeWarnings', 'kilnGeometryWarnings']) {
      const notes: unknown = geometry.userData[key];
      if (!Array.isArray(notes)) continue;
      for (const note of notes) {
        if (typeof note === 'string') warnings.push(`${name}: ${note}`);
        else if (note && typeof note === 'object' && 'code' in note)
          warnings.push(
            `${name}: ${String(note.code)}${'message' in note ? ` ${String(note.message)}` : ''}`,
          );
      }
    }
  });
  return warnings;
}

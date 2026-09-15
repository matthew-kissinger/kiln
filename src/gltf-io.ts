import { WebIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';

/** Keep standard extensions through every document round trip. Codec-dependent
 * extensions still require their decoder; registration does not invent one. */
export function createGltfIO(): WebIO {
  return new WebIO().registerExtensions(ALL_EXTENSIONS);
}

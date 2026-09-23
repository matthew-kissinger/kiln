/** Self-contained, bounded GLB admission. Does not fetch, decode pixels or initialize a GPU. */
import { inspectPng } from './png-input.mjs';
export const GLB_INPUT_LIMITS = Object.freeze({
  maxGlbBytes: 48 * 1024 * 1024,
  maxJsonBytes: 4 * 1024 * 1024,
  maxBufferBytes: 64 * 1024 * 1024,
  maxImageBytes: 16 * 1024 * 1024,
  maxImageDimension: 4096,
  maxImagePixels: 32 * 1024 * 1024,
  maxAccessorElements: 16 * 1024 * 1024,
  maxNodes: 20000,
  maxNodeDepth: 128,
  maxPrimitives: 10000,
  maxResources: 10000,
});
const fail = (message, status = 400) => Object.assign(new Error(`GLB: ${message}`), { status });
const integer = (value, label, minimum = 0) => {
  if (!Number.isSafeInteger(value) || value < minimum)
    throw fail(`${label} must be a safe integer >= ${minimum}`);
  return value;
};
const object = (value, label) => {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw fail(`${label} must be an object`);
  return value;
};
const getIndex = (array, index, label) => {
  integer(index, label);
  if (index >= array.length) throw fail(`${label} is out of range`);
  return array[index];
};

function dataUri(uri, kind, maxBytes) {
  if (typeof uri !== 'string' || !uri.startsWith('data:'))
    throw fail(`external ${kind} URI is forbidden; embed the resource in the GLB`);
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/]*={0,2})$/.exec(uri);
  if (!match || match[2].length % 4 !== 0) throw fail(`${kind} requires a valid base64 data URI`);
  const mime = match[1];
  if (
    kind === 'image'
      ? mime !== 'image/png'
      : !['application/octet-stream', 'application/gltf-buffer'].includes(mime)
  ) {
    throw fail(`unsupported ${kind} data MIME ${mime}; images currently require PNG`);
  }
  const estimated =
    (match[2].length / 4) * 3 - (match[2].endsWith('==') ? 2 : match[2].endsWith('=') ? 1 : 0);
  if (estimated > maxBytes) throw fail(`${kind} decoded byte budget exceeded`, 413);
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length !== estimated || bytes.toString('base64') !== match[2])
    throw fail(`${kind} data URI is not canonical base64`);
  return bytes;
}

export function validateSelfContainedGlb(input, overrides = {}) {
  const limits = { ...GLB_INPUT_LIMITS, ...overrides };
  for (const [key, value] of Object.entries(limits)) integer(value, key, 1);
  if (!Buffer.isBuffer(input) || input.length < 20) throw fail('complete GLB bytes required');
  if (input.length > limits.maxGlbBytes) throw fail('input byte budget exceeded', 413);
  if (input.readUInt32LE(0) !== 0x46546c67 || input.readUInt32LE(4) !== 2)
    throw fail('GLB version 2 required');
  if (input.readUInt32LE(8) !== input.length) throw fail('header length must match input length');
  let offset = 12;
  let document;
  let binary;
  while (offset < input.length) {
    if (offset + 8 > input.length) throw fail('truncated chunk header');
    const length = input.readUInt32LE(offset);
    const type = input.readUInt32LE(offset + 4);
    const end = offset + 8 + length;
    if (length % 4 || end > input.length) throw fail('invalid chunk length');
    const bytes = input.subarray(offset + 8, end);
    if (type === 0x4e4f534a && offset === 12) {
      if (length > limits.maxJsonBytes) throw fail('JSON byte budget exceeded', 413);
      try {
        document = JSON.parse(bytes.toString('utf8'));
      } catch {
        throw fail('invalid JSON chunk');
      }
    } else if (type === 0x004e4942 && document && !binary) binary = bytes;
    else throw fail('expected one JSON chunk followed by at most one BIN chunk');
    offset = end;
  }
  object(document, 'document');
  if (document.asset?.version !== '2.0') throw fail('asset.version must be 2.0');
  const list = (key, max = limits.maxResources) => {
    const values = document[key] ?? [];
    if (!Array.isArray(values) || values.length > max)
      throw fail(`${key} count exceeds resource budget`, 413);
    values.forEach((value, index) => {
      object(value, `${key}[${index}]`);
    });
    return values;
  };
  for (const extension of document.extensionsUsed ?? []) {
    if (
      [
        'KHR_draco_mesh_compression',
        'EXT_meshopt_compression',
        'KHR_texture_basisu',
        'EXT_texture_webp',
        'EXT_texture_avif',
        'MSFT_texture_dds',
      ].includes(extension)
    ) {
      throw fail(
        `unsupported compressed/image extension ${extension}; use uncompressed geometry and PNG images`,
      );
    }
  }
  const declaredBuffers = list('buffers');
  let bufferBytes = 0;
  const buffers = declaredBuffers.map((buffer, index) => {
    const length = integer(buffer.byteLength, `buffers[${index}].byteLength`, 1);
    bufferBytes += length;
    if (bufferBytes > limits.maxBufferBytes) throw fail('buffer byte budget exceeded', 413);
    let bytes;
    if (buffer.uri !== undefined) {
      bytes = dataUri(buffer.uri, 'buffer', limits.maxBufferBytes);
      if (bytes.length !== length)
        throw fail(`buffer ${index} byteLength must match its data URI length`);
    } else {
      if (index !== 0 || !binary) throw fail(`buffer ${index} has no embedded BIN data`);
      bytes = binary;
      if (bytes.length - length > 3) throw fail('embedded buffer length does not match BIN chunk');
    }
    if (length > bytes.length) throw fail(`buffer ${index} byteLength exceeds its data`);
    return bytes.subarray(0, length);
  });
  const views = list('bufferViews').map((view, index) => {
    const bytes = getIndex(buffers, view.buffer, `bufferViews[${index}].buffer`);
    const start = integer(view.byteOffset ?? 0, `bufferViews[${index}].byteOffset`);
    const length = integer(view.byteLength, `bufferViews[${index}].byteLength`, 1);
    if (start + length > bytes.length) throw fail(`bufferView ${index} range exceeds its buffer`);
    if (
      view.byteStride !== undefined &&
      (!Number.isInteger(view.byteStride) ||
        view.byteStride < 4 ||
        view.byteStride > 252 ||
        view.byteStride % 4)
    )
      throw fail(`bufferView ${index} has invalid byteStride`);
    return { bytes: bytes.subarray(start, start + length), stride: view.byteStride };
  });
  const components = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };
  const sizes = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
  let accessorElements = 0;
  const range = (viewIndex, start, count, elementSize, label, componentSize) => {
    const view = getIndex(views, viewIndex, `${label}.bufferView`);
    integer(start, `${label}.byteOffset`);
    const stride = view.stride ?? elementSize;
    if (
      stride < elementSize ||
      stride % componentSize ||
      start % componentSize ||
      start + (count - 1) * stride + elementSize > view.bytes.length
    )
      throw fail(`${label} range/stride exceeds its bufferView`);
  };
  for (const [index, accessor] of list('accessors').entries()) {
    const size = sizes[accessor.componentType];
    const count = integer(accessor.count, `accessor ${index}.count`, 1);
    const width = components[accessor.type];
    if (!size || !width) throw fail(`accessor ${index} has unsupported type/componentType`);
    accessorElements += count * width;
    if (!Number.isSafeInteger(accessorElements) || accessorElements > limits.maxAccessorElements)
      throw fail('accessor element budget exceeded', 413);
    const columns = accessor.type.startsWith('MAT') ? Number(accessor.type.slice(3)) : 1;
    const elementSize = columns > 1 ? columns * Math.ceil((columns * size) / 4) * 4 : width * size;
    if (accessor.bufferView !== undefined)
      range(
        accessor.bufferView,
        accessor.byteOffset ?? 0,
        count,
        elementSize,
        `accessor ${index}`,
        size,
      );
    if (accessor.sparse !== undefined) {
      const sparse = object(accessor.sparse, `accessor ${index}.sparse`);
      const sparseCount = integer(sparse.count, 'sparse.count', 1);
      if (sparseCount > count) throw fail('sparse.count exceeds accessor count');
      const indices = object(sparse.indices, 'sparse.indices');
      const values = object(sparse.values, 'sparse.values');
      if (![5121, 5123, 5125].includes(indices.componentType))
        throw fail('unsupported sparse index type');
      range(
        indices.bufferView,
        indices.byteOffset ?? 0,
        sparseCount,
        sizes[indices.componentType],
        'sparse.indices',
        sizes[indices.componentType],
      );
      range(
        values.bufferView,
        values.byteOffset ?? 0,
        sparseCount,
        elementSize,
        'sparse.values',
        size,
      );
    }
  }
  let imagePixels = 0;
  for (const [index, image] of list('images').entries()) {
    if (image.uri !== undefined && image.bufferView !== undefined)
      throw fail(`image ${index} must use uri or bufferView, not both`);
    if (image.mimeType !== undefined && image.mimeType !== 'image/png')
      throw fail(`unsupported image MIME ${image.mimeType}; renderer currently supports PNG only`);
    const bytes =
      image.uri !== undefined
        ? dataUri(image.uri, 'image', limits.maxImageBytes)
        : getIndex(views, image.bufferView, `image ${index}.bufferView`).bytes;
    if (bytes.length > limits.maxImageBytes) throw fail('image byte budget exceeded', 413);
    imagePixels += inspectPng(bytes, {
      maxDimension: limits.maxImageDimension,
      maxPixels: limits.maxImagePixels - imagePixels,
    });
  }
  const nodes = list('nodes', limits.maxNodes);
  const parents = new Uint32Array(nodes.length);
  const children = nodes.map((node, index) => {
    const references = node.children ?? [];
    if (!Array.isArray(references) || references.length > nodes.length)
      throw fail(`node ${index} has invalid children`);
    for (const child of references) {
      getIndex(nodes, child, `node ${index}.children`);
      if (++parents[child] > 1) throw fail(`node ${child} has multiple parents`);
    }
    return references;
  });
  // glTF node hierarchies are disjoint trees. Checking iteratively also prevents
  // malformed cycles and deep inputs from exhausting GLTFLoader recursion.
  const visit = [];
  for (let index = 0; index < nodes.length; index++)
    if (parents[index] === 0) visit.push([index, 1]);
  for (let offset = 0; offset < visit.length; offset++) {
    const [index, depth] = visit[offset];
    if (depth > limits.maxNodeDepth) throw fail('node depth exceeds resource budget', 413);
    for (const child of children[index]) visit.push([child, depth + 1]);
  }
  if (visit.length !== nodes.length) throw fail('node graph contains a cycle');
  let primitiveCount = 0;
  for (const [index, mesh] of list('meshes').entries()) {
    if (!Array.isArray(mesh.primitives)) throw fail(`mesh ${index}.primitives must be an array`);
    primitiveCount += mesh.primitives.length;
    if (primitiveCount > limits.maxPrimitives)
      throw fail('primitive count exceeds resource budget', 413);
  }
  for (const name of ['materials', 'textures', 'animations', 'skins', 'scenes']) list(name);
  return Object.freeze({ bufferBytes, imagePixels, accessorElements, nodeCount: nodes.length });
}

/** Defense in depth: GLTFLoader may resolve only resources it creates locally. */
export function selfContainedResourceUrl(url) {
  if (typeof url === 'string' && (url.startsWith('blob:') || url.startsWith('data:'))) return url;
  throw fail('external resource URL rejected by loader');
}

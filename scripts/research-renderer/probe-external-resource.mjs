// Uses the prototype's exact GLTFLoader without initializing WebGPU.
// The sole external URI points to this process's ephemeral loopback triangle server.
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const [serviceDir] = process.argv.slice(2);
const require = createRequire(join(serviceDir, 'package.json'));
const { GLTFLoader } = await import(
  pathToFileURL(require.resolve('three/addons/loaders/GLTFLoader.js'))
);
globalThis.ProgressEvent ??= class extends Event {
  constructor(type, data) {
    super(type);
    Object.assign(this, data);
  }
};
const triangle = Buffer.from(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]).buffer);
let requests = 0;
const server = createServer((_req, res) => {
  requests++;
  res.writeHead(200, {
    'content-type': 'application/octet-stream',
    'content-length': triangle.length,
  });
  res.end(triangle);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
try {
  const document = {
    asset: { version: '2.0' },
    buffers: [
      {
        byteLength: triangle.length,
        uri: `http://127.0.0.1:${server.address().port}/triangle.bin`,
      },
    ],
    bufferViews: [{ buffer: 0, byteLength: triangle.length }],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 3,
        type: 'VEC3',
        min: [0, 0, 0],
        max: [1, 1, 0],
      },
    ],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    nodes: [{ mesh: 0 }],
    scenes: [{ nodes: [0] }],
    scene: 0,
  };
  const json = Buffer.from(JSON.stringify(document));
  const padded = Buffer.alloc(Math.ceil(json.length / 4) * 4, 0x20);
  json.copy(padded);
  const glb = Buffer.alloc(20 + padded.length);
  glb.writeUInt32LE(0x46546c67, 0);
  glb.writeUInt32LE(2, 4);
  glb.writeUInt32LE(glb.length, 8);
  glb.writeUInt32LE(padded.length, 12);
  glb.writeUInt32LE(0x4e4f534a, 16);
  padded.copy(glb, 20);
  const asset = await new GLTFLoader().parseAsync(
    glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.length),
    '',
  );
  console.log(
    JSON.stringify({
      node: process.version,
      glbBytes: glb.length,
      externalRequests: requests,
      loadedMeshes: asset.scene.children.length,
      scope: 'same GLTFLoader as service, direct parse; no HTTP renderer or GPU initialized',
    }),
  );
} finally {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}

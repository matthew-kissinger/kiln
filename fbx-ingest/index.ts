/**
 * kiln/fbx-ingest — FBX -> GLB conversion via three.js FBXLoader + GLTFExporter.
 *
 *   import { kiln } from '@pixel-forge/core';
 *   const { glb, meta } = await kiln.ingestFbx(fbxBuffer, { scale: 0.01 });
 *
 * For batch ingest of many FBX files, reuse a session:
 *   const session = await kiln.openFbxIngestSession();
 *   for (const path of files) await session.ingest(path);
 *   await session.close();
 */

export { ingestFbx, openFbxIngestSession } from './ingest';
export type {
  IngestFbxOptions,
  IngestFbxResult,
  IngestFbxSession,
} from './ingest';

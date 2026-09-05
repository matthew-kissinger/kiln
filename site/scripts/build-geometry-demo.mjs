import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { MemoryProgramStore } from '../../src/program-store';
import { createKilnProgramToolRegistry } from '../../src/tools/registry';
import { resolveEvaluatorPortV1 } from '../../src/evaluator/protocol';
export async function buildGeometryDemo(repo, out) {
  const code = await readFile(join(repo, 'site/examples/equation-canopy.kiln.js'), 'utf8');
  const registry = createKilnProgramToolRegistry({ programStore: new MemoryProgramStore() });
  const tool = registry.find((t) => t.name === 'kiln_render');
  const first = await tool.run({ code, capture: { preset: '1x1' } });
  if (!first.ok) throw Error(JSON.stringify(first));
  const subject = first.parts.find((part) => part.name === 'Mesh_CornerSocket');
  if (!subject) throw Error('Teaching socket was not exported');
  const capture = {
    version: 'kiln.capture.v1',
    size: 512,
    cols: 2,
    shots: [
      {
        name: 'Equation surface',
        camera: {
          type: 'orbit',
          relativeTo: 'asset',
          azimuthDeg: 45,
          elevationDeg: 25,
          padding: 1.2,
        },
      },
      {
        name: 'Socket attachment',
        subject: { path: subject.path },
        visibility: 'context',
        camera: {
          type: 'orbit',
          relativeTo: 'part',
          azimuthDeg: 65,
          elevationDeg: -18,
          padding: 3,
        },
      },
    ],
  };
  const result = await tool.run({ programRef: first.programRef, capture });
  if (!result.ok) throw Error(JSON.stringify(result));
  const png = tool.media(result)?.png;
  if (!png) throw Error('Teaching render has no image');
  const asset = await resolveEvaluatorPortV1(undefined, 'trusted-local').render(code);
  const hash = (x) => createHash('sha256').update(x).digest('hex');
  await writeFile(join(out, 'equation-canopy.png'), png);
  await writeFile(join(out, 'equation-canopy.kiln.js'), code);
  await writeFile(join(out, 'equation-canopy.glb'), asset.glb);
  await writeFile(
    join(out, 'geometry-demo.json'),
    JSON.stringify(
      {
        attribution: 'Maintainer teaching example; not a model evaluation',
        programRef: first.programRef,
        artifactHash: hash(asset.glb),
        imageHash: hash(png),
        capture,
        cameraShots: result.cameraShots,
        viewFidelity: result.viewFidelity,
      },
      null,
      2,
    ),
  );
}

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { MemoryProgramStore } from '../../src/program-store';
import { createKilnProgramToolRegistry } from '../../src/tools/registry';
import { resolveEvaluatorPortV1 } from '../../src/evaluator/protocol';

export async function buildEditDemo(repo, out) {
  const source = await readFile(join(repo, 'site/examples/workbench.kiln.js'), 'utf8');
  const store = new MemoryProgramStore();
  const registry = createKilnProgramToolRegistry({ programStore: store });
  const tool = (name) => registry.find((entry) => entry.name === name);
  const capture = {
    version: 'kiln.capture.v1',
    size: 640,
    shots: [
      {
        name: 'Workbench',
        camera: {
          type: 'explicit',
          projection: 'orthographic',
          position: [2.4, 1.8, 2.8],
          target: [0, 0.55, 0],
          halfHeight: 0.9,
        },
      },
    ],
  };
  const before = await tool('kiln_render').run({ code: source, capture });
  if (!before.ok) throw new Error(`Edit demo base failed: ${JSON.stringify(before)}`);
  const read = await tool('kiln_source').run({
    programRef: before.programRef,
    query: 'shelfHeight',
  });
  const edit = {
    programRef: before.programRef,
    edits: [{ oldString: 'shelfHeight = 0.2', newString: 'shelfHeight = 0.45' }],
    capture,
  };
  const after = await tool('kiln_edit').run(edit);
  if (!after.ok || after.programRef === before.programRef)
    throw new Error(`Edit demo revision failed: ${JSON.stringify(after)}`);
  const records = [];
  for (const [name, result] of [
    ['before', before],
    ['after', after],
  ]) {
    const code = await store.get(result.programRef);
    const render = await resolveEvaluatorPortV1(undefined, 'trusted-local').render(code);
    const png = tool(name === 'before' ? 'kiln_render' : 'kiln_edit').media(result)?.png;
    if (!png) throw new Error(`Edit demo ${name} returned no image`);
    await writeFile(join(out, `workbench-${name}.png`), png);
    await writeFile(join(out, `workbench-${name}.kiln.js`), code);
    await writeFile(join(out, `workbench-${name}.glb`), render.glb);
    records.push({
      name,
      programRef: result.programRef,
      sourceHash: createHash('sha256').update(code).digest('hex'),
      artifactHash: createHash('sha256').update(render.glb).digest('hex'),
      viewFidelity: result.viewFidelity,
    });
  }
  await writeFile(
    join(out, 'edit-demo.json'),
    `${JSON.stringify({ attribution: 'Maintainer-agent teaching example; not an independent model evaluation', capture, read, edit, diff: after.diff, records }, null, 2)}\n`,
  );
}

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { createKilnProgramToolRegistry } from '../src/tools/registry';

const tools = createKilnProgramToolRegistry();
const content = [
  '# Tool reference',
  'Generated from the public registry with `bun run docs:tools`. Change the registry to update names, descriptions or schemas; use `bun run docs:tools --check` to check for drift.',
  'Use these tools through your connected agent. Supply `code` once, then pass the returned `programRef` to later calls. References identify exact source revisions. [Source workflow](programs.md) · [Camera recipes](cameras.md) · [Geometry guide](geometry.md).',
  'Call `kiln_list_primitives({capabilities:true})` for the current host limits and export/camera support. The schema below describes inputs; actual image replies include fidelity and capture metadata. Source reads return exact text, edits return a new revision, and failed builds return their errors.',
  ...tools.flatMap(tool => {
    const schema = z.toJSONSchema(tool.inputSchema);
    return [`## ${tool.name}`, tool.description, '<details>\n<summary>Input JSON Schema</summary>\n', '```json\n' + JSON.stringify(schema, null, 2) + '\n```\n\n</details>'];
  }),
].join('\n\n') + '\n';
const path = fileURLToPath(new URL('../docs/tools.md', import.meta.url));
if (process.argv.includes('--check')) {
  if (await readFile(path, 'utf8').catch(() => '') !== content) {
    console.error('Tool reference differs from the registry. Run bun run docs:tools.');
    process.exitCode = 1;
  }
} else {
  await writeFile(path, content);
  console.log(`Wrote ${tools.length} public tool definitions to docs/tools.md.`);
}

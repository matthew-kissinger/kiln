import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { createKilnProgramToolRegistry } from '../src/tools/registry';

export const toolReferencePath = fileURLToPath(new URL('../docs/tools.md', import.meta.url));

/**
 * The published tool reference, derived from the registry.
 *
 * Exported so the drift check can be a test rather than a command nobody runs.
 * `--check` existed from the start and appeared in no workflow and no test, which
 * is how `docs/tools.md` came to understate every tuple schema for a week: zod
 * 4.6.2 changed `z.toJSONSchema` to emit `items: false`, `minItems` and
 * `maxItems` for fixed-length tuples, the in-range bump took it, and the only
 * thing that would have noticed was opt-in.
 */
export function toolReferenceMarkdown(): string {
  const tools = createKilnProgramToolRegistry();
  return `${[
    '# Tool reference',
    'Generated from the public registry with `bun run docs:tools`. Change the registry to update names, descriptions or schemas; use `bun run docs:tools --check` to check for drift.',
    'Use these tools through your connected agent. Supply `code` once, then pass the returned `programRef` to later calls. References identify exact source revisions. [Source workflow](programs.md) · [Camera recipes](cameras.md) · [Geometry guide](geometry.md).',
    'Call `kiln_list_primitives({capabilities:true})` for the current host limits and export/camera support. The schema below describes inputs; actual image replies include fidelity and capture metadata. Source reads return exact text, edits return a new revision, and failed builds return their errors.',
    ...tools.flatMap((tool) => {
      const schema = z.toJSONSchema(tool.inputSchema);
      return [
        `## ${tool.name}`,
        tool.description,
        '<details>\n<summary>Input JSON Schema</summary>\n',
        `\`\`\`json\n${JSON.stringify(schema, null, 2)}\n\`\`\`\n\n</details>`,
      ];
    }),
  ].join('\n\n')}\n`;
}

// Only when run as a command. Importing this module must not write a file or set
// an exit code -- the test below it imports the builder.
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const content = toolReferenceMarkdown();
  if (process.argv.includes('--check')) {
    if ((await readFile(toolReferencePath, 'utf8').catch(() => '')) !== content) {
      console.error('Tool reference differs from the registry. Run bun run docs:tools.');
      process.exitCode = 1;
    }
  } else {
    await writeFile(toolReferencePath, content);
    console.log(
      `Wrote ${createKilnProgramToolRegistry().length} public tool definitions to docs/tools.md.`,
    );
  }
}

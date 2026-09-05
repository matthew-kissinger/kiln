/**
 * Tool results have a size budget, and nothing was enforcing it.
 *
 * `kiln_list_primitives` returned its 92 entries twice -- once as a structured
 * array and once as the formatted text rendered from that array -- and the
 * default MCP serialization pretty-printed the pair. One call put 90,497 bytes
 * on the wire.
 *
 * Harnesses do not agree on what to do with a result that size. Claude Code and
 * `agy` swallow it. OpenCode truncates it, spills the full copy to a file under
 * its tool-output directory, and hands the model the cut-off version plus the
 * problem of reassembling the rest. A dispatched `glm-5.3` run did exactly that:
 * it called the tool, was told the catalog was truncated, and spent the next
 * twenty-two minutes grepping and re-reading the spill file at increasing
 * offsets. It never wrote a program. The timeout, not the model, ended it.
 *
 * The fix was to stop sending the same information twice, which cost nothing:
 * in-process callers still get `primitives` from `run()`, and the wire carries
 * the text the model actually reads. Measured after: 36,647 bytes, received in
 * full by the same model on the same harness, which then enumerated all 92
 * primitives and their categories correctly.
 *
 * The ceiling below is deliberately loose. It is not a claim about any harness's
 * exact threshold -- OpenCode's sits somewhere between the two measurements and
 * is not documented -- it is a tripwire for the regression that actually
 * happened: a result quietly starting to carry its own contents twice.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'bun:test';
import { z } from 'zod';

import { kilnMcpToolDefs, runTool } from '../mcp-server';

const REPO = resolve(import.meta.dir, '..', '..');

/** Comfortably above the measured 36,647 and far below the 90,497 that broke. */
const CATALOG_CEILING = 48 * 1024;

const defOf = (name: string) => {
  const def = kilnMcpToolDefs().find((d) => d.name === name);
  if (!def) throw new Error(`no such tool: ${name}`);
  return def;
};

describe('kiln_list_primitives wire payload', () => {
  it('sends the catalog once, not twice', async () => {
    const def = defOf('kiln_list_primitives');
    const raw = (await def.run({})) as { primitives: unknown[]; text: string };
    const wire = await runTool(def, {});

    // The structured array is still there for in-process callers.
    expect(raw.primitives.length).toBeGreaterThan(50);

    const block = wire.content[0] as { type: string; text: string };
    expect(block.type).toBe('text');
    // What goes out is the rendered text verbatim...
    expect(block.text).toBe(raw.text);
    // ...and not a JSON dump that would repeat every entry a second time.
    expect(block.text.startsWith('{')).toBe(false);
    expect(block.text).not.toContain('"signature":');
  });

  it('stays under the size that derails a harness', async () => {
    const wire = await runTool(defOf('kiln_list_primitives'), {});
    const bytes = Buffer.byteLength(JSON.stringify(wire), 'utf8');
    expect({ tool: 'kiln_list_primitives', over: bytes > CATALOG_CEILING }).toEqual({
      tool: 'kiln_list_primitives',
      over: false,
    });
  });

  /**
   * The catalog is the big one, but the rule is general: no text-only tool
   * result should be shipping tens of kilobytes. Image-bearing tools are
   * exempt -- their bytes are the point, and they are base64 by necessity.
   */
  it('no text-only tool result is oversized', async () => {
    const oversized: string[] = [];
    for (const def of kilnMcpToolDefs()) {
      if (def.media || def.mediaMulti) continue;
      let wire: Awaited<ReturnType<typeof runTool>>;
      try {
        wire = await runTool(def, {});
      } catch {
        continue; // needs real arguments; covered by its own tests
      }
      if (Buffer.byteLength(JSON.stringify(wire), 'utf8') > CATALOG_CEILING)
        oversized.push(def.name);
    }
    expect(oversized).toEqual([]);
  });
});

/**
 * The always-on cost of attaching Kiln, and the README's claim about it.
 *
 * Everything else a harness pays for Kiln is per-call and visible. This is the
 * part that is paid on every turn of every session whether or not the model is
 * modelling anything: the tool schemas the harness advertises, and the front
 * matter each skill uses to say when it applies. The README quotes both figures
 * to argue that the surface is small, and a number in prose with nothing holding
 * it to the code is a number that will be wrong by the next release.
 *
 * The ceilings are the point of the test; the exact figures are what the README
 * has to match. If a description grows for a good reason, update both -- the
 * failure is a prompt to re-measure, not a rule against writing documentation.
 */
describe('always-on context cost', () => {
  const schemaChars = () => {
    let total = 0;
    for (const def of kilnMcpToolDefs()) {
      // The MCP SDK derives the advertised JSON Schema from the same zod
      // object, so converting it here measures what a harness is actually
      // sent rather than a stand-in for it.
      const schema = z.toJSONSchema(def.inputSchema as never, { io: 'input' });
      total += JSON.stringify({
        name: def.name,
        description: def.description,
        inputSchema: schema,
      }).length;
    }
    return total;
  };

  const frontMatterChars = async () => {
    const dir = join(REPO, 'skills');
    let total = 0;
    let count = 0;
    for (const name of await readdir(dir)) {
      // Normalize before measuring. The count is a claim about how much a
      // skill says about itself, and that must not change with whoever checked
      // the tree out: a CRLF working copy counts one extra character per line
      // and disagrees with CI, which is exactly how this assertion first
      // failed. `.gitattributes` keeps the tree LF; this keeps the measurement
      // honest even where it is not.
      const md = (await readFile(join(dir, name, 'SKILL.md'), 'utf8')).replace(/\r\n/g, '\n');
      const fm = /^---\n([\s\S]*?)\n---/.exec(md);
      if (!fm) throw new Error(`skills/${name}/SKILL.md has no front matter`);
      total += fm[1]!.length;
      count++;
    }
    return { total, count };
  };

  it('the seven tool schemas stay small, and the README quotes the real number', async () => {
    const chars = schemaChars();
    // A budget, not a target: several tools' worth of headroom before anyone
    // has to think about it again.
    expect(chars).toBeLessThan(24 * 1024);
    const readme = await readFile(join(REPO, 'README.md'), 'utf8');
    expect(readme).toContain(`${chars.toLocaleString('en-US')} characters of JSON Schema`);
  });

  it('the skills advertise themselves in the front matter the README quotes', async () => {
    const { total, count } = await frontMatterChars();
    expect(count).toBe(5);
    // Front matter is a name and one sentence. Anything much past this is a
    // skill trying to teach from the index instead of from its body.
    expect(total).toBeLessThan(2048);
    const readme = await readFile(join(REPO, 'README.md'), 'utf8');
    expect(readme).toContain(`${total.toLocaleString('en-US')} characters of front matter`);
  });
});

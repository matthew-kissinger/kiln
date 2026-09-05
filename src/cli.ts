#!/usr/bin/env bun
/**
 * Kiln CLI — the entry point for humans and scripts.
 *
 * Two commands:
 *   render   — execute an existing Kiln program to GLB + a six-view contact sheet.
 *              Offline: no model, no network, no key. This is the quickstart path,
 *              and the one that must keep working on a machine with nothing set up.
 *   generate — run the agent loop against a provider to author a program first.
 *
 * The view grid deliberately runs through the SAME `kiln_screenshot` registry def
 * the agent calls, rather than reaching into the rasterizer directly, so the image
 * a human sees is byte-identical to the image the model saw. Any drift between the
 * two would be a bug we would rather fail loudly than paper over.
 *
 * Argument parsing is hand-rolled to keep the dependency surface at zero — this
 * file is the one place a `commander`-shaped dependency would be tempting and is
 * not worth it.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve as resolvePath } from 'node:path';

import { renderGLB } from './render';
import type { KilnToolContext } from './tools/registry';
import { kilnMcpToolDefs } from './mcp-server';
import { resolveRenderMode, buildRenderPort, describeDrawnBy } from './cli-render-mode';
import type { RenderMode } from './cli-render-mode';

const USAGE = `kiln — vision-in-the-loop 3D asset generation

USAGE
  kiln render <program.js> [options]     execute a Kiln program (offline, no key)
  kiln generate "<prompt>"  [options]    author a program with a model, then render

OPTIONS
  --out <path>            GLB output path            (default: out.glb)
  --views <path>          contact sheet PNG path     (default: none)
  --render <mode>         auto | cpu | gpu           (default: auto)
  --render-port <url>     remote GPU render service
  --model <id>            model id for generate      (default: env KILN_MODEL)
  --max-steps <n>         agent step cap, 0 = off    (default: 0)
  --category <name>       prop | vehicle | character | architecture | vegetation
  -h, --help              this message

EXAMPLES
  kiln render examples/crate.kiln.js --out crate.glb --views sheet.png
  kiln generate "a weathered wooden crate" --out crate.glb --views sheet.png
  kiln render examples/crate.kiln.js --render cpu --views sheet.png
`;

interface Args {
  command: string | undefined;
  positional: string[];
  out: string | undefined;
  views: string | undefined;
  render: RenderMode;
  renderPort: string | undefined;
  model: string | undefined;
  maxSteps: number;
  category: string | undefined;
  help: boolean;
}

export function parseArgs(argv: readonly string[]): Args {
  const args: Args = {
    command: undefined,
    positional: [],
    out: undefined,
    views: undefined,
    render: 'auto',
    renderPort: undefined,
    model: process.env['KILN_MODEL'],
    maxSteps: 0,
    category: undefined,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    const next = (): string => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${a} requires a value`);
      return v;
    };
    switch (a) {
      case '-h':
      case '--help':
        args.help = true;
        break;
      case '--out':
        args.out = next();
        break;
      case '--views':
        args.views = next();
        break;
      case '--render':
        args.render = resolveRenderMode(next());
        break;
      case '--render-port':
        args.renderPort = next();
        break;
      case '--model':
        args.model = next();
        break;
      case '--category':
        args.category = next();
        break;
      case '--max-steps': {
        const n = Number(next());
        // Zero is the documented "no cap" value, so it has to be accepted here
        // as well as being the default -- rejecting it would leave a user who
        // read the help text unable to type what it told them.
        if (!Number.isInteger(n) || n < 0)
          throw new Error('--max-steps must be a non-negative integer (0 = no cap)');
        args.maxSteps = n;
        break;
      }
      default:
        if (a.startsWith('-')) throw new Error(`unknown option: ${a}`);
        if (args.command === undefined) args.command = a;
        else args.positional.push(a);
    }
  }
  return args;
}

/**
 * Render one program to GLB bytes plus, optionally, the contact sheet.
 * Shared by both commands so `generate` and `render` cannot diverge in output.
 */
async function emit(code: string, args: Args, context: KilnToolContext): Promise<void> {
  const result = await renderGLB(code);
  // Only write a GLB when one was asked for, or when it is the sole output —
  // `--views sheet.png` alone should not litter the working directory.
  const out = args.out ?? (args.views ? undefined : 'out.glb');
  if (out) {
    await writeFile(resolvePath(out), result.glb);
    console.log(`  ${out}  ${result.tris} tris  ${(result.glb.length / 1024).toFixed(1)} KB`);
  } else {
    console.log(`  ${result.tris} tris  ${(result.glb.length / 1024).toFixed(1)} KB`);
  }
  const bounds = result.integrationManifest.bounds;
  if (bounds) {
    const size = bounds.size ?? bounds.max;
    if (Array.isArray(size)) {
      console.log(`  bounds  ${size.map((n) => Number(n).toFixed(2)).join(' x ')} m`);
    }
  }
  for (const w of result.warnings) console.log(`  warning: ${w}`);

  if (args.views) {
    // The SAME def the MCP surface serves, so the CLI cannot render views through
    // a path the agent never takes — and so `--render-port` actually fires, which
    // the frozen baseline's CPU-only kiln_screenshot would silently ignore.
    const def = kilnMcpToolDefs(context).find((d) => d.name === 'kiln_render');
    if (!def) throw new Error('kiln_render is missing from the MCP tool surface');
    const output = await def.run({ code });
    const media = def.media?.(output);
    if (!media) throw new Error('kiln_screenshot returned no image');
    await writeFile(resolvePath(args.views), media.png);
    // Report what actually drew the pixels, not what was configured. The engine
    // routes to the port only when the scene needs PBR shading, so a GPU that was
    // available and correctly skipped must not be reported as if it had drawn.
    console.log(`  ${args.views}  (${describeDrawnBy(output, context)})`);
  }
}

async function cmdRender(args: Args): Promise<number> {
  const file = args.positional[0] ?? undefined;
  if (!file) {
    console.error('render requires a program path\n');
    console.error(USAGE);
    return 2;
  }
  const code = await readFile(resolvePath(file), 'utf8');
  const context = await buildRenderPort(args.render, args.renderPort);
  console.log(`rendering ${file}`);
  await emit(code, args, context);
  return 0;
}

async function cmdGenerate(args: Args): Promise<number> {
  const prompt = args.positional.join(' ').trim();
  if (!prompt) {
    console.error('generate requires a prompt\n');
    console.error(USAGE);
    return 2;
  }
  if (!args.model) {
    console.error('no model selected: pass --model <id> or set KILN_MODEL');
    return 2;
  }

  // Imported lazily so `kiln render` never pulls the agent stack (an optional
  // peer) into the process. A missing @strands-agents/sdk must not break the
  // offline path, which is the one the quickstart promises works everywhere.
  const [{ runKilnAgent }, { makeKilnModel, resolveKilnAgentModel }] = await Promise.all([
    import('./agent/run'),
    import('./agent/providers'),
  ]);

  const context = await buildRenderPort(args.render, args.renderPort);
  const descriptor = resolveKilnAgentModel(args.model);
  const model = makeKilnModel(descriptor);

  console.log(`generating "${prompt}"`);
  console.log(`  model ${args.model}  max-steps ${args.maxSteps}  render ${args.render}`);

  const run = await runKilnAgent({
    model,
    prompt,
    maxSteps: args.maxSteps,
    ...(args.category ? { category: args.category as never } : {}),
    ...context,
  } as never);

  if (!run.code) {
    console.error('the agent finished without submitting a program');
    if (run.lastText) console.error(`  last message: ${run.lastText.slice(0, 400)}`);
    return 1;
  }
  console.log(`  ${run.steps} steps, ${run.toolCalls.length} tool calls`);
  // `generate` always writes the GLB: producing an asset is the point of the
  // command, unlike `render`, where `--views` alone is a legitimate request.
  const outPath = args.out ?? 'out.glb';
  await emit(run.code, { ...args, out: outPath }, context);

  const source = outPath.replace(/\.glb$/i, '.kiln.js');
  await writeFile(resolvePath(source), run.code, 'utf8');
  console.log(`  ${source}  (the program — edit and re-render it)`);
  return 0;
}

export async function main(argv: readonly string[]): Promise<number> {
  let args: Args;
  try {
    args = parseArgs(argv);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 2;
  }
  if (args.help || !args.command) {
    console.log(USAGE);
    return args.command ? 0 : 2;
  }
  try {
    switch (args.command) {
      case 'render':
        return await cmdRender(args);
      case 'generate':
        return await cmdGenerate(args);
      default:
        console.error(`unknown command: ${args.command}\n`);
        console.error(USAGE);
        return 2;
    }
  } catch (err) {
    // Expected operator errors — an unreachable GPU, an unreadable program — are
    // messages, not stack traces. KILN_DEBUG=1 restores the trace for real bugs.
    if (process.env['KILN_DEBUG'] && err instanceof Error && err.stack) {
      console.error(err.stack);
    } else {
      console.error(err instanceof Error ? err.message : String(err));
    }
    return 1;
  }
}

if (import.meta.main) {
  main(process.argv.slice(2))
    .then((code) => {
      process.exitCode = code;
    })
    .catch((err: unknown) => {
      console.error(err instanceof Error ? (err.stack ?? err.message) : String(err));
      process.exitCode = 1;
    });
}

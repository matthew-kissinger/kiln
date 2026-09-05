#!/usr/bin/env node
/**
 * Human and script entry point: render programs, import/export source revisions,
 * or run the optional model-driven generation loop. Rendering a GLB and its views
 * shares one evaluation through the program-aware registry.
 */
import { open, readFile, writeFile } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';

import { createPackagedLocalToolContext } from './local-runtime';
import { createKilnProgramToolRegistry, type KilnToolContext } from './tools/registry';
import { fileURLToPath } from 'node:url';
import { resolveRenderMode, buildRenderPort, describeDrawnBy } from './cli-render-mode';
import type { RenderMode } from './cli-render-mode';
import { localProgramStore } from './program-store-node';

const USAGE = `kiln — vision-in-the-loop 3D asset generation

USAGE
  kiln render <program.js|ref> [options]     execute a Kiln program (offline, no key)
  kiln generate "<prompt>"  [options]    author a program with a model, then render
  kiln source <file.js>                 save a source snapshot and print its programRef
  kiln source <sha256:ref> --out file.js export a revision without model transcription

OPTIONS
  --out <path>            GLB output path            (default: out.glb)
  --views <path>          contact sheet PNG path     (default: none)
  --capture <file.json>  camera recipe for --views  (grid output; max 1 MiB)
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
  kiln render sha256:FULL_HASH --capture cameras.json --views chosen.png
`;

interface Args {
  command: string | undefined;
  positional: string[];
  out: string | undefined;
  views: string | undefined;
  capture: string | undefined;
  captureRecipe?: unknown;
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
    capture: undefined,
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
      case '--capture':
        args.capture = next();
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

/** Read a bounded recipe and validate the same capture schema used by MCP. */
async function readCaptureRecipe(args: Args): Promise<unknown> {
  if (!args.views) throw new Error('--capture requires --views <output.png>.');
  if (args.command !== 'render' && args.command !== 'generate')
    throw new Error('--capture is supported by render and generate only.');
  const limit = 1024 * 1024;
  const file = await open(resolvePath(args.capture!), 'r');
  let capture: unknown;
  try {
    const info = await file.stat();
    if (!info.isFile() || info.size > limit)
      throw new Error('--capture requires a JSON file no larger than 1 MiB.');
    const buffer = Buffer.alloc(limit + 1);
    const { bytesRead } = await file.read(buffer, 0, buffer.length, 0);
    if (bytesRead > limit) throw new Error('--capture JSON exceeds 1 MiB.');
    try {
      capture = JSON.parse(buffer.subarray(0, bytesRead).toString('utf8'));
    } catch {
      throw new Error('--capture requires valid JSON.');
    }
  } finally {
    await file.close();
  }
  const def = createKilnProgramToolRegistry().find((d) => d.name === 'kiln_render');
  if (!def) throw new Error('kiln_render is missing from the MCP tool surface');
  // Schema validation needs a selector but does not resolve or write this placeholder.
  def.inputSchema.parse({ programRef: `sha256:${'0'.repeat(64)}`, capture });
  if ((capture as { output?: unknown } | null)?.output === 'separate')
    throw new Error('--capture supports grid output only for one --views PNG. Set output to grid.');
  return capture;
}

/**
 * Render one program to GLB bytes plus, optionally, the contact sheet.
 * Shared by both commands so `generate` and `render` cannot diverge in output.
 */
async function emit(code: string, args: Args, context: KilnToolContext): Promise<void> {
  context.programStore ??= localProgramStore();
  const programRef = await context.programStore.put(code);
  console.log(`  programRef ${programRef}`);
  const result = await context.evaluatorPort!.render(code, {
    optimize: 'off',
    ...(args.category ? { category: args.category as never } : {}),
  });
  if (result.buildCache)
    console.log(`  build ${result.buildCache.hit ? 'reused' : 'created'} ${result.buildCache.key}`);
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
    // This call already built the exact source above. Review the same artifact.
    const def = createKilnProgramToolRegistry({
      ...context,
      evaluatorPort: { render: async () => result },
    }).find((d) => d.name === 'kiln_render');
    if (!def) throw new Error('kiln_render is missing from the MCP tool surface');
    const output = await def.run({
      programRef,
      ...(args.captureRecipe === undefined ? {} : { capture: args.captureRecipe }),
    });
    const failure = output as { ok?: unknown; error?: unknown } | null;
    if (failure?.ok === false && typeof failure.error === 'string' && failure.error.trim()) {
      throw new Error(failure.error.slice(0, 2048));
    }
    const media = def.media?.(output);
    if (!media) throw new Error('kiln_render returned no image');
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
  const code = file.startsWith('sha256:')
    ? await localProgramStore().get(file)
    : await readFile(resolvePath(file), 'utf8');
  const context = await createPackagedLocalToolContext(
    await buildRenderPort(args.render, args.renderPort),
  );
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
  // Nonliteral imports keep optional model SDKs outside the offline Node bundle.
  const modules = import.meta.url.endsWith('.ts')
    ? ['./agent/run.ts', './agent/providers.ts']
    : ['./agent-run.mjs', './agent-providers.mjs'];
  let generation: [typeof import('./agent/run'), typeof import('./agent/providers')];
  try {
    generation = await Promise.all([import(modules[0]!), import(modules[1]!)]);
  } catch (error) {
    throw new Error(
      'The optional generation adapter could not load. Use your connected agent with MCP, or install the agent/provider dependencies for kiln generate.',
      { cause: error },
    );
  }
  const [{ runKilnAgent }, { makeKilnModel, resolveKilnAgentModel }] = generation;

  const context = await createPackagedLocalToolContext(
    await buildRenderPort(args.render, args.renderPort),
  );
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

async function cmdSource(args: Args): Promise<number> {
  const input = args.positional[0];
  if (!input || args.positional.length !== 1)
    throw new Error('source requires one file path or programRef.');
  const store = localProgramStore();
  if (input.startsWith('sha256:')) {
    const code = await store.get(input);
    if (args.out) {
      await writeFile(resolvePath(args.out), code, { encoding: 'utf8', flag: 'wx' });
      console.log(`Saved ${input} to ${args.out}`);
    } else process.stdout.write(code);
  } else {
    if (args.out)
      throw new Error('Use source <programRef> --out <new-file.js> to export a saved revision.');
    console.log(await store.put(await readFile(resolvePath(input), 'utf8')));
  }
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
    return args.help ? 0 : 2;
  }
  try {
    if (args.capture !== undefined) args.captureRecipe = await readCaptureRecipe(args);
    switch (args.command) {
      case 'source':
        return await cmdSource(args);
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

function isDirectCliEntry(): boolean {
  if (!process.argv[1]) return false;
  try {
    // npm's Unix bin is a symlink; compare the actual files on both sides.
    return (
      realpathSync(resolvePath(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))
    );
  } catch {
    return false;
  }
}

if (isDirectCliEntry()) {
  main(process.argv.slice(2))
    .then((code) => {
      process.exitCode = code;
    })
    .catch((err: unknown) => {
      console.error(err instanceof Error ? (err.stack ?? err.message) : String(err));
      process.exitCode = 1;
    });
}

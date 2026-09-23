import { expect, test } from 'bun:test';
import { mkdtemp, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

test('packaged OpenRouter construction and prompt caching do not load other optional providers', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'kiln-provider-isolation-'));
  try {
    await symlink(
      resolve(import.meta.dir, '../../node_modules'),
      join(directory, 'node_modules'),
      process.platform === 'win32' ? 'junction' : 'dir',
    );
    const output = join(directory, 'providers.mjs');
    const built = await Bun.build({
      entrypoints: [resolve(import.meta.dir, 'providers.ts')],
      target: 'node',
      packages: 'external',
    });
    expect(built.success).toBe(true);
    await writeFile(output, await built.outputs[0]!.text());
    const entry = join(directory, 'probe.mjs');
    await writeFile(
      entry,
      `
import { registerHooks } from 'node:module';
registerHooks({resolve(specifier, context, next) {
  if (['@strands-agents/sdk/models/anthropic', '@strands-agents/sdk/models/google', '@strands-agents/sdk/models/openai', '@anthropic-ai/sdk', '@google/genai', 'openai'].includes(specifier)) throw new Error('UNSELECTED_PROVIDER_LOADED: '+specifier);
  return next(specifier, context);
}});
const {makeKilnModel,toCachedSystemPrompt}=await import('./providers.mjs');
const model=await makeKilnModel({provider:'openrouter',model:'google/gemini-3.8-flash',thinking:'high',maxTokens:16000},{apiKey:'offline-fixture-key'});
console.log(JSON.stringify({model:model.constructor.name,system:await toCachedSystemPrompt('SYSTEM',model)}));
`,
    );
    const child = Bun.spawnSync(['node', entry], { stdout: 'pipe', stderr: 'pipe' });
    expect(child.stderr.toString()).toBe('');
    expect(child.exitCode).toBe(0);
    expect(JSON.parse(child.stdout.toString())).toEqual({ model: 'VercelModel', system: 'SYSTEM' });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}, 20000);

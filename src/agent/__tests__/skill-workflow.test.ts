import { expect, test } from 'bun:test';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { runKilnAgent } from '../run';
import { ScriptedModel } from './scripted-model';
import { MemoryProgramStore, programReference } from '../../program-store';

const skillDir = fileURLToPath(new URL('../../../skills/kiln-author-asset', import.meta.url));
const code = `const meta={name:'Skill cube'};
function build(){const r=createRoot('Cube');createPart('Body',boxGeo(1,1,1),gameMaterial('#778899'),{parent:r,position:[0,.5,0]});return r;}`;

test('built-in native workflow is available without filesystem skills and preserves failed-edit recovery', async () => {
  const store = new MemoryProgramStore();
  const ref = await store.put(code);
  const changed = code.replace('#778899', '#aabbcc');
  const model = new ScriptedModel([
    { toolCalls: [{ name: 'skills', input: { skill_name: 'kiln-native-workflow' } }] },
    {
      toolCalls: [{ name: 'kiln_render', input: { programRef: ref, capture: { preset: '1x1' } } }],
    },
    {
      toolCalls: [
        {
          name: 'kiln_edit',
          input: {
            programRef: ref,
            edits: [{ oldString: 'missing anchor', newString: 'replacement' }],
          },
        },
      ],
    },
    { toolCalls: [{ name: 'kiln_source', input: { programRef: ref } }] },
    {
      toolCalls: [
        {
          name: 'kiln_edit',
          input: {
            programRef: ref,
            edits: [{ oldString: '#778899', newString: '#aabbcc' }],
            capture: { preset: '1x1' },
          },
        },
      ],
    },
    {
      toolCalls: [{ name: 'kiln_finish', input: { programRef: await programReference(changed) } }],
    },
  ]);
  const result = await runKilnAgent({
    model,
    prompt: 'Change the cube color',
    programStore: store,
    existingProgramRef: ref,
  });
  expect(JSON.stringify(model.messageSnapshots[1])).toContain('Native Kiln workflow');
  expect(JSON.stringify(model.messageSnapshots[1])).not.toContain('not found');
  expect(result.completion).toBe('finished');
  expect(result.programRef).toBe(await programReference(changed));
  expect(result.code).toBe(changed);
  expect(await store.get(ref)).toBe(code);
  expect(result.toolCalls).not.toContain('kiln_save');
});

test('missing native skill configuration fails before invoking a model', async () => {
  const model = new ScriptedModel([{ text: 'should never run' }]);
  const result = await runKilnAgent({
    model,
    prompt: 'A cube',
    knowhow: 'skill',
    skillDir: join(tmpdir(), 'kiln-nonexistent-skill-workflow-directory'),
  });
  expect(result.completion).toBe('failed');
  expect(model.seenSystemPrompts).toHaveLength(0);
  expect(result.error).toMatch(/skill/i);
});

test('native refinement skill reads its reference and edits a retained revision without delivery tools', async () => {
  const store = new MemoryProgramStore();
  const base = await store.put(code);
  const changed = code.replace('#778899', '#aabbcc');
  const model = new ScriptedModel([
    { toolCalls: [{ name: 'skills', input: { skill_name: 'kiln-modeling-references' } }] },
    {
      toolCalls: [
        {
          name: 'kiln_skill_resource',
          input: { skill: 'kiln-refine-asset', path: 'references/revision-and-views.md' },
        },
      ],
    },
    { toolCalls: [{ name: 'kiln_source', input: { programRef: base } }] },
    {
      toolCalls: [
        {
          name: 'kiln_edit',
          input: {
            programRef: base,
            edits: [{ oldString: '#778899', newString: '#aabbcc' }],
            capture: { preset: '1x1' },
          },
        },
      ],
    },
    {
      toolCalls: [{ name: 'kiln_finish', input: { programRef: await programReference(changed) } }],
    },
  ]);
  const result = await runKilnAgent({
    model,
    prompt: 'Change the color',
    knowhow: 'skill',
    skillDir: fileURLToPath(new URL('../../../skills/kiln-refine-asset', import.meta.url)),
    programStore: store,
    existingProgramRef: base,
  });
  expect(result.completion).toBe('finished');
  expect(result.code).toBe(changed);
  expect(await store.get(base)).toBe(code);
  expect(JSON.stringify(model.messageSnapshots[2])).toContain('kiln.skill-resource.v1');
  expect(result.toolCalls).not.toContain('kiln_save');
});

test('native skill mode can activate instructions, read a reference, discover a recipe and finish exact source', async () => {
  const ref = await programReference(code);
  const model = new ScriptedModel([
    { toolCalls: [{ name: 'skills', input: { skill_name: 'kiln-modeling-references' } }] },
    {
      toolCalls: [
        {
          name: 'kiln_skill_resource',
          input: {
            skill: 'kiln-author-asset',
            path: 'references/program-contract.md',
            limit: 4000,
          },
        },
      ],
    },
    {
      toolCalls: [
        { name: 'kiln_discover', input: { query: 'transparent glass window', kind: 'recipe' } },
      ],
    },
    { toolCalls: [{ name: 'kiln_render', input: { code, capture: { preset: '1x1' } } }] },
    { toolCalls: [{ name: 'kiln_finish', input: { programRef: ref } }] },
  ]);
  const result = await runKilnAgent({ model, prompt: 'A cube', knowhow: 'skill', skillDir });
  expect(result.error).toBeUndefined();
  expect(result.completion).toBe('finished');
  expect(result.code).toBe(code);
  expect(String(model.seenSystemPrompts[0])).toContain('<name>kiln-modeling-references</name>');
  expect(String(model.seenSystemPrompts[0])).not.toContain('<name>kiln-author-asset</name>');
  expect(JSON.stringify(model.messageSnapshots[1])).not.toContain('node kiln.mjs');
  const referenceTurn = JSON.stringify(model.messageSnapshots[2]);
  expect(referenceTurn).toContain('kiln.skill-resource.v1');
  expect(referenceTurn).toContain('program-contract.md');
  expect(referenceTurn).toContain('nextOffset');
  expect(referenceTurn).not.toContain('not found in registry');
});

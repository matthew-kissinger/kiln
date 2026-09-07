#!/usr/bin/env node
// Manual, paid harness dogfood. Never imported by CI or normal validation.
import { mkdir, mkdtemp, readFile, writeFile, readdir, cp } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { createWorkspace } from './create-workspace.mjs';
import { HARNESSES, run } from './harness.mjs';

const choices = {
  codex: { model: null, subject: 'A portable field recording machine: two exposed tape reels, a sloped control panel with distinct knobs and VU meters, a sturdy carry handle, rubber feet, and a removable-looking protective frame. Warm ivory panels, dark graphite case, restrained orange details. A coherent finished prop for a stylized exploration game, about 40 cm wide.' },
  claude: { model: 'sonnet', subject: 'A portable field recording machine: two exposed tape reels, a sloped control panel with distinct knobs and VU meters, a sturdy carry handle, rubber feet, and a removable-looking protective frame. Warm ivory panels, dark graphite case, restrained orange details. A coherent finished prop for a stylized exploration game, about 40 cm wide.' },
  opencode: { model: 'opencode-go/glm-5.3-flash', subject: 'A compact botanical research trolley: four rubber wheels touching the ground, a lower tray, two planted specimen containers with distinct broad leaf silhouettes, a small articulated inspection lamp, and a clipped-on instrument panel. Sage green powder-coated frame, terracotta pots, warm ivory instrument. A coherent finished prop for a stylized exploration game, about 90 cm tall.' },
  agy: { model: 'gemini-3.8-flash-high', subject: 'A tabletop mechanical orrery: stepped circular pedestal, a tilted brass orbital ring held by a real bracket, a central sun sphere, and three planets on distinct supported radial arms at different radii. Midnight blue enamel and warm brass. A coherent finished prop for a stylized exploration game, about 45 cm tall. Include a slow looping orbit animation if you can review its intermediate poses.' },
};
const harnessName = process.argv[2]; const choice = choices[harnessName];
if (!choice) throw new Error('Choose claude, codex, opencode, or agy. This command spends model quota.');
const stamp = new Date().toISOString().replaceAll(':','-').replaceAll('.','-');
const output = resolve('.dogfood','collections',`${stamp}-${harnessName}`); await mkdir(output,{recursive:true});
const parent = await mkdtemp(join(tmpdir(),'kiln-collections-dogfood-')); const workspace = join(parent,'workspace');
await createWorkspace(workspace,harnessName);
const base = JSON.parse(await readFile(join(workspace,'.kiln','workspace.json'),'utf8'));
const sourceStore = join(workspace,'.kiln','programs');
const roots = { project: join(workspace,'assets','kiln'), personal: join(workspace,'personal-library') };
await writeFile(join(workspace,'.kiln','collections.json'),JSON.stringify(roots,null,2));
const prompt = [
  'Read this workspace AGENTS.md and skills/kiln-author-asset/SKILL.md. Use only the configured kiln_workspace server. Do not read the engine source or example collection. Do not install software, publish, or use another agent.',
  `Make this asset: ${choice.subject}`,
  'Use kiln_list_primitives to learn the needed API. Author, render, look at images when your harness delivers them, and repair visible problems. Do not claim you saw an image if you only received a file path. Check viewFidelity before judging materials.',
  `Save the finished source using kiln_save into project, with a clear name, tags, brief, and attribution ${choice.model ? `model=${choice.model}, ` : ''}harness=${harnessName}. This is supplied attribution; the parent will verify the actual model separately.`,
  'Then exercise the new workflow: kiln_assets list; kiln_export; kiln_import copying the saved revision from project to personal; kiln_assets restore from personal. Make one small intentional dimension/detail refinement with kiln_edit and save the child into personal with the original assetId and parentRevision. Export the child resource links. Preserve both revisions.',
  'Write dogfood-result.json with assetId, originalRevisionId, refinedRevisionId, programRefs, review observations, any tool/UX issues, and whether render images were actually visible to you. Use the host Write tool for this report. Finish within 10 minutes. Never spend the whole time polishing; leave time to test save/copy/restore/refine.',
].join(' ');
await writeFile(join(output,'brief.txt'),prompt);
const harness = HARNESSES[harnessName]; const logFile = join(output,'harness.log');
let args = harness.argv({model:choice.model,prompt,timeout:'10m',logFile,sandbox:workspace});
if (harnessName === 'claude') args = ['-p',prompt,'--model',choice.model,'--permission-mode','acceptEdits','--strict-mcp-config','--mcp-config',join(workspace,'.mcp.json'),'--allowedTools','mcp__kiln_workspace__* Read Write Edit Glob Grep','--output-format','stream-json','--verbose'];
if (harnessName === 'agy') args = ['--new-project',...args,'--disable-slash-commands'];
console.log(JSON.stringify({harness:harnessName,requestedModel:choice.model,workspace,output}));
await writeFile(join(output,'run.json'),JSON.stringify({harness:harnessName,requestedModel:choice.model,workspace,output,workspaceSetup:base,startedAt:new Date().toISOString(),authorization:'User requested different harness/model dogfoods after implementing collections.',renderer:'cpu',runtimeBuild:JSON.parse(await readFile('dist/build.json','utf8'))},null,2));
const result = await run(harness.bin,args,{cwd:workspace,timeoutMs:10*60*1000,logFile:harness.needsLogFile?logFile:null,env:{KILN_RENDER:'cpu',KILN_PROGRAM_STORE:sourceStore,KILN_COLLECTIONS:JSON.stringify(roots),...(harness.env?.({model:choice.model}) ?? {})}});
await writeFile(join(output,'transcript.txt'),result.out);
await cp(workspace,join(output,'workspace'),{recursive:true,filter:path=>!path.includes('node_modules')&&!path.includes(`${join('.kiln','cache')}`)});
const manifests = [];
for (const [collection, directory] of Object.entries(roots)) {
  for (const asset of await readdir(directory).catch(()=>[])) {
    for (const revision of await readdir(join(directory,asset,'revisions')).catch(()=>[])) {
      try { const record = JSON.parse(await readFile(join(directory,asset,'revisions',revision,'manifest.json'),'utf8')); manifests.push({collection,record}); } catch {}
    }
  }
}
let actualModel = harness.actualModel?.(result.out) ?? null;
if (harnessName === 'codex') actualModel = /^model:\s*(.+)$/m.exec(result.out)?.[1]?.trim() ?? null;
if (harnessName === 'claude') for (const line of result.out.split('\n')) { try { const item=JSON.parse(line); if(item.type==='system'&&item.subtype==='init') actualModel=item.model; } catch {} }
const summary = {harness:harnessName,requestedModel:choice.model,actualModel,exitCode:result.code,finishedAt:new Date().toISOString(),savedRevisions:manifests.map(({collection,record})=>({collection,name:record.name,assetId:record.assetId,revisionId:record.revisionId,parentRevision:record.parentRevision,artifactHash:record.files['asset.glb'].sha256})),transcriptHash:createHash('sha256').update(result.out).digest('hex'),output};
await writeFile(join(output,'result.json'),JSON.stringify(summary,null,2)); console.log(JSON.stringify(summary));
process.exitCode = result.code === 0 && manifests.length >= 3 ? 0 : 1;

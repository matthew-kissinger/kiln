import { mkdir, readFile, writeFile, cp, readdir } from 'node:fs/promises';
import { appendFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
const base=process.argv[2] ? resolve(process.argv[2]) : '';
if (!base || process.argv[3]!=='--run-authorized-pilot') throw new Error('Usage: node scripts/evaluation/dispatch.mjs FROZEN_DIRECTORY --run-authorized-pilot. This dispatches up to 12 live model calls plus their same-session follow-ups; authorization must already be recorded.');
const freeze=JSON.parse(await readFile(join(base,'freeze.json'),'utf8'));
const bun='C:/Users/Mattm/.bun/bin/bun.exe',node='C:/Program Files/nodejs/node.exe';
const sha=x=>'sha256:'+createHash('sha256').update(x).digest('hex');
const followup='Use the saved revision. Read only the source section you need, increase `serviceOffset` by 0.15 metres, and render the edit by reference. Keep unrelated source unchanged. Show the named `ServiceAssembly` closely enough to check its attachment and in a wider view that establishes its location. Use the camera controls available in this condition. Sample the translation animation before, during and after its movement to check that attached pieces travel together. Export the revised source and GLB and report the final revision reference.';
const prompt='Read AGENTS.md, BRIEF.md and CONDITION.md. Build the brief using the configured Kiln MCP tools. Work only in this directory; do not read the engine installation, examples, other projects, previous runs, personal memories or global skills. Do not use web/network/provider tools or spawn agents. This is the first submission: save first.kiln.js and first.glb through node kiln.mjs, write first-result.json with programRef and honest image-review/remaining-issue notes, then stop for the follow-up. Keep at least 10 of the total 30 Kiln calls and some of the 15-minute total deadline for the subsequent edit. Do not bypass the experimental condition with direct engine imports or CLI authoring; the CLI is only for exporting saved source/GLB.';
await mkdir(join(base,'runs'));
async function phase(run,phase,sessionId) {
  const {workspace,configPath,harness,model,deadline}=run;
  const common=['-c','approval_policy="on-request"','-c','approvals_reviewer="auto_review"','-c','features.memories=false','-c','features.apps=false','-c','model_reasoning_effort="high"','-c',`mcp_servers.kiln_workspace.command=${JSON.stringify(bun)}`,'-c',`mcp_servers.kiln_workspace.args=${JSON.stringify([join(base,'package/scripts/evaluation/server.ts'),configPath])}`,'-c',`mcp_servers.kiln_workspace.env.KILN_PROGRAM_STORE=${JSON.stringify(join(workspace,'.kiln/programs'))}`,'-c','mcp_servers.kiln_workspace.env.KILN_RENDER="cpu"'];
  const input=phase===1?prompt:followup;
  let command,args,env={...process.env};
  if(harness==='codex'){
    command=node;
    args=['C:/Program Files/nodejs/node_modules/@openai/codex/bin/codex.js','exec','--approve-for-me',...(phase===2?['resume']:[]),'--ignore-user-config','--json','--skip-git-repo-check','-m',model,...common,...(phase===1?['--ignore-rules','--cd',workspace]:[sessionId]),input];
  }else{
    command='C:/Program Files/nodejs/node_modules/opencode-ai/bin/opencode.exe';
    args=['run','--pure','--auto','--dir',workspace,'--format','json','-m',model,'--variant','high',...(phase===2?['--session',sessionId]:[]),input];
    env.XDG_CONFIG_HOME=join(workspace,'.config');env.OPENCODE_DISABLE_CLAUDE_CODE='true';
  }
  await writeFile(join(run.directory,`invocation-${phase}.json`),JSON.stringify({command,args,cwd:workspace,environmentOverrides:harness==='opencode'?{XDG_CONFIG_HOME:env.XDG_CONFIG_HOME,OPENCODE_DISABLE_CLAUDE_CODE:'true'}:{}},null,2));
  const started=Date.now();
  return await new Promise(done=>{
    const child=spawn(command,args,{cwd:workspace,env,stdio:['ignore','pipe','pipe'],windowsHide:true});
    let stdout='',stderr='',timedOut=false;
    child.stdout.on('data',data=>{stdout+=data;appendFileSync(join(run.directory,`harness-${phase}.jsonl`),data);});
    child.stderr.on('data',data=>{stderr+=data;appendFileSync(join(run.directory,`stderr-${phase}.log`),data);});
    const timer=setTimeout(()=>{timedOut=true;spawn('taskkill',['/PID',String(child.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});},Math.max(1,deadline-Date.now()));
    child.on('error',error=>{clearTimeout(timer);done({exitCode:-1,error:error.message,seconds:(Date.now()-started)/1000});});
    child.on('close',exitCode=>{
      clearTimeout(timer);
      const events=stdout.split('\n').flatMap(line=>{try{return[JSON.parse(line)];}catch{return[];}});
      const id=events.find(e=>e.thread_id)?.thread_id ?? events.find(e=>e.sessionID)?.sessionID ?? sessionId;
      done({exitCode,timedOut,sessionId:id,seconds:(Date.now()-started)/1000,eventCount:events.length,usage:events.filter(e=>e.usage||e.type==='step_finish').map(e=>e.usage??e.part),error:stderr.trim().slice(-1500)});
    });
  });
}
async function cell(harness,briefId,condition,index){
  const runId=`e0-${harness}-${briefId}-${condition}`,directory=join(base,'runs',runId),workspace=join(directory,'workspace');
  await mkdir(workspace,{recursive:true});
  const model=harness==='codex'?'gpt-6-astra':'opencode/muse-spark-1.3-contributor-free';
  const packet=(await readFile(join(base,'protocol/common-guide.md'),'utf8'))+'\n\nBudget: 30 total Kiln calls, 48 image cells, 512-pixel maximum cell side, 15 minutes total including follow-up. Export source using node kiln.mjs source sha256:FULL_HASH --out first.kiln.js; export GLB using node kiln.mjs render sha256:FULL_HASH --out first.glb. After the follow-up use final.kiln.js and final.glb. Do not read .kiln/programs directly.\n';
  await writeFile(join(workspace,'AGENTS.md'),packet);
  await cp(join(base,`protocol/briefs/${briefId}.md`),join(workspace,'BRIEF.md'));
  await cp(join(base,`protocol/condition-${condition}.md`),join(workspace,'CONDITION.md'));
  await writeFile(join(workspace,'kiln.mjs'),`import { main } from ${JSON.stringify(pathToFileURL(join(base,'package/dist/cli.mjs')).href)};process.env.KILN_PROGRAM_STORE=${JSON.stringify(join(workspace,'.kiln/programs'))};process.env.KILN_RENDER='cpu';process.exitCode=await main(process.argv.slice(2));\n`);
  const configPath=join(directory,'host-config.json');
  const config={runId,condition,outputDirectory:join(directory,'tools'),programStoreDirectory:join(workspace,'.kiln/programs'),authorization:freeze.authorization,allowResume:true,maxToolCalls:30,maxImageCells:48,maxCellSide:512,maxWallSeconds:900};
  await writeFile(configPath,JSON.stringify(config,null,2));
  if(harness==='opencode')await writeFile(join(workspace,'opencode.json'),JSON.stringify({$schema:'https://opencode.ai/config.json',mcp:{kiln_workspace:{type:'local',command:[bun,join(base,'package/scripts/evaluation/server.ts'),configPath],environment:{KILN_PROGRAM_STORE:config.programStoreDirectory,KILN_RENDER:'cpu'},enabled:true}},permission:{external_directory:'deny'}},null,2));
  const suppliedFiles=[];for(const file of await readdir(workspace)) suppliedFiles.push({path:file,hash:sha(await readFile(join(workspace,file)))});
  const run={runId,directory,workspace,configPath,harness,model,condition,briefId,index,deadline:Date.now()+900000,suppliedFiles,startedAt:new Date().toISOString()};
  await writeFile(join(directory,'run.json'),JSON.stringify({...run,freeze},null,2));
  console.log(JSON.stringify({runId,status:'started',workspace}));
  const first=await phase(run,1);
  await writeFile(join(directory,'phase-1.json'),JSON.stringify(first,null,2));
  let firstSubmission=false;try{JSON.parse(await readFile(join(workspace,'first-result.json'),'utf8'));await readFile(join(workspace,'first.kiln.js'));firstSubmission=true;}catch{}
  let second=null;
  if(first.exitCode===0&&first.sessionId&&firstSubmission&&Date.now()<run.deadline)second=await phase(run,2,first.sessionId);
  if(second)await writeFile(join(directory,'phase-2.json'),JSON.stringify(second,null,2));
  const result={runId,first,second,firstSubmission,seconds:900-(run.deadline-Date.now())/1000,status:first.timedOut||second?.timedOut?'budget-exhausted':'pending-review'};
  await writeFile(join(directory,'outcome.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result));return result;
}
const queue=async(harness)=>{const rows=harness==='codex'?[['variable-duct','A'],['variable-duct','B'],['variable-duct','C'],['optical-instrument','B'],['optical-instrument','C'],['optical-instrument','A']]:[['variable-duct','C'],['variable-duct','B'],['variable-duct','A'],['optical-instrument','A'],['optical-instrument','C'],['optical-instrument','B']];const results=[];for(let i=0;i<rows.length;i++)results.push(await cell(harness,...rows[i],i));return results;};
await writeFile(join(base,'results.json'),JSON.stringify((await Promise.all(['codex','opencode'].map(queue))).flat(),null,2));

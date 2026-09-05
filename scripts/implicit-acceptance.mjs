import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const results=[];
for(const name of ['organic','mixed','cellular']) for(const edgeLength of [0.2,0.1]) {
 const result=spawnSync('bun',['scripts/implicit-acceptance-case.ts',name,String(edgeLength)],{cwd:resolve(import.meta.dirname,'..'),encoding:'utf8',timeout:20000,windowsHide:true,maxBuffer:1024*1024});
 let record;
 if(result.status===0) record=JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1));
 else {record={name,edgeLength,status:result.error?.code==='ETIMEDOUT'?'timeout':'failed',stderr:result.stderr.slice(-1500)};process.exitCode=1;}
 results.push(record);console.log(JSON.stringify(record));
}
const directory=resolve(import.meta.dirname,'../output/implicit-acceptance');mkdirSync(directory,{recursive:true});writeFileSync(resolve(directory,'results.json'),JSON.stringify({node:process.version,bun:spawnSync('bun',['--version'],{encoding:'utf8',windowsHide:true}).stdout.trim(),perCaseTimeoutMs:20000,results},null,2)+'\n');

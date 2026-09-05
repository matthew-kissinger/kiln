import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const cases=['bevel-box-profile','bevel-box-minkowski','bevel-holed-profile','bevel-holed-minkowski','shell-sphere-normal-offset','shell-box-normal-offset','shell-thin-normal-offset','remesh-box-field','remesh-thin-field','sdf-sphere-coarse','sdf-sphere-fine','sdf-cellular'];
const results=[];
for(const id of cases){
 const started=performance.now();
 const result=spawnSync('bun',['src/experiments/geometry-frontier.ts',id],{cwd:resolve(import.meta.dirname,'..'),encoding:'utf8',timeout:20000,windowsHide:true,maxBuffer:1024*1024});
 let record;
 if(result.status===0){try{record=JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1));}catch{record={id,status:'invalid-output',stdout:result.stdout};}}
 else record={id,status:result.error?.code==='ETIMEDOUT'?'timeout':'failed',wallMs:performance.now()-started,stderr:result.stderr.slice(-1500)};
 results.push(record);console.log(JSON.stringify(record));
}
const directory=resolve(import.meta.dirname,'../output/geometry-experiments');mkdirSync(directory,{recursive:true});writeFileSync(resolve(directory,'results.json'),JSON.stringify({node:process.version,perCaseTimeoutMs:20000,results},null,2)+'\n');

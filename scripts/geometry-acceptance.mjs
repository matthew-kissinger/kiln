import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const cases=['bevel-concave-profile','bevel-concave','bevel-mixed','bevel-thin','shell-open-plane-in','shell-open-plane-out','shell-curved-in','shell-curved-out','shell-curved-collision','remesh-deformed','remesh-uneven','remesh-boolean'];
const results=[];
for(const id of cases){
 const result=spawnSync('bun',[id==='bevel-concave-profile'?'scripts/geometry-profile-control.ts':'src/experiments/geometry-acceptance.ts',id],{cwd:resolve(import.meta.dirname,'..'),encoding:'utf8',timeout:20000,windowsHide:true,maxBuffer:1024*1024});
 let record;
 if(result.status===0){try{record=JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1));}catch{record={id,status:'invalid-output',stdout:result.stdout};}}
 else record={id,status:result.error?.code==='ETIMEDOUT'?'timeout':'failed',stderr:result.stderr.slice(-1500)};
 results.push(record);console.log(JSON.stringify(record));
}
const directory=resolve(import.meta.dirname,'../output/geometry-acceptance');mkdirSync(directory,{recursive:true});writeFileSync(resolve(directory,'results.json'),JSON.stringify({node:process.version,perCaseTimeoutMs:20000,results},null,2)+'\n');

import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { FileProgramStore } from '../src/program-store-node';
import { ExperimentalProgramAliases } from '../src/experiments/program-aliases';

if (process.argv[2] === '--child') {
  const directory=process.argv[3]!, expected=process.argv[4]!, next=process.argv[5]!;
  const aliases=new ExperimentalProgramAliases(join(directory,'aliases'),new FileProgramStore(join(directory,'programs')));
  try { await aliases.compareAndSet('bridge',expected,next); console.log(JSON.stringify({status:'updated'})); }
  catch(error) {
    const message=(error as Error).message;
    if (!message.includes('conflict') && !message.includes('busy')) throw error;
    console.log(JSON.stringify({status:message.includes('conflict')?'conflict':'busy'}));
  }
} else {
  const directory=await mkdtemp(join(tmpdir(),'kiln-alias-concurrency-'));
  try {
    const store=new FileProgramStore(join(directory,'programs'));
    const aliases=new ExperimentalProgramAliases(join(directory,'aliases'),store);
    const refs=await Promise.all(['original','candidate-a','candidate-b'].map(code=>store.put(code)));
    await aliases.compareAndSet('bridge',null,refs[0]!);
    const children=Array.from({length:8},(_,i)=>{
      const child=Bun.spawn([process.execPath,import.meta.path,'--child',directory,refs[0]!,refs[1+i%2]!],{stdout:'pipe',stderr:'pipe'});
      const timer=setTimeout(()=>child.kill(),10000);
      return (async()=>{
        try {
          const [code,stdout,stderr]=await Promise.all([child.exited,new Response(child.stdout).text(),new Response(child.stderr).text()]);
          if(code!==0) throw new Error(`Worker failed: ${stderr}`);
          return JSON.parse(stdout) as {status:string};
        } finally {clearTimeout(timer);}
      })();
    });
    const results=await Promise.all(children);
    const updated=results.filter(result=>result.status==='updated').length;
    if(updated!==1) throw new Error(`Expected one winner, received ${updated}`);
    const finalRef=await aliases.resolve('bridge');
    if(!refs.slice(1).includes(finalRef!)) throw new Error('Alias target is not a candidate');
    const immutableSources=await Promise.all(refs.map(ref=>new FileProgramStore(store.directory).get(ref)));
    if(JSON.stringify(immutableSources)!==JSON.stringify(['original','candidate-a','candidate-b'])) throw new Error('Immutable sources changed');
    const receipt={experiment:'R0 project-local alias compare-and-set',processes:8,updated,rejected:7,
      rejectionKinds:[...new Set(results.filter(result=>result.status!=='updated').map(result=>result.status))].sort(),
      immutableReferencesResolved:refs.length,originalSourcePreserved:true,finalAliasIsCandidate:true,
      usability:'Not evaluated; clean-room model pilot required before stable adoption'};
    if(process.argv[2]!=='--check') await writeFile(resolve(import.meta.dir,'../docs/experiments/program-aliases-results.json'),JSON.stringify(receipt,null,2)+'\n');
    console.log(JSON.stringify(receipt,null,2));
  } finally { await rm(directory,{recursive:true,force:true}); }
}

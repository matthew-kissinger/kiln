// Evaluation-only transparent MCP recorder. Never installed with the runtime.
import {spawn} from 'node:child_process';
import {mkdirSync,appendFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
export function plannedCells(tool,args={}){
  if(tool==='kiln_edit'&&args.render===false)return 0;
  if(tool==='kiln_inspect')return 1;
  if(!['kiln_render','kiln_edit','kiln_screenshot_animation','kiln_view_interior','kiln_screenshot'].includes(tool))return 0;
  const capture=args.capture;
  if(capture?.shots)return Math.min(9,Math.max(1,capture.shots.length));
  if(capture?.cells?.length)return Math.min(9,capture.cells.length);
  if(capture?.preset){const match=/^([1-3])x([1-3])$/.exec(capture.preset);return match?Number(match[1])*Number(match[2]):9;}
  if(tool==='kiln_screenshot_animation')return Math.min(9,Math.max(1,args.frameTimes?.length??args.frames??6));
  return tool==='kiln_view_interior'?3:6;
}
export class EvaluationBudget{
  constructor({maxCalls=30,maxImages=48}={}){this.maxCalls=maxCalls;this.maxImages=maxImages;this.calls=0;this.images=0;this.pending=new Map();}
  reserve(id,count){if(this.calls>=this.maxCalls)return 'Tool call budget exhausted';if(this.images+[...this.pending.values()].reduce((a,b)=>a+b,0)+count>this.maxImages)return 'Rendered image-cell budget exhausted';this.calls++;this.pending.set(id,count);return null;}
  settle(id,count){this.pending.delete(id);this.images+=count;}
  stats(){return {calls:this.calls,images:this.images,reserved:[...this.pending.values()].reduce((a,b)=>a+b,0),maxCalls:this.maxCalls,maxImages:this.maxImages};}
}
export function observeShipping({server,out,maxCalls=30,maxImages=48,deadlineMs=900000}){
  for(const value of [maxCalls,maxImages,deadlineMs])if(!Number.isSafeInteger(value)||value<1)throw Error('Positive observer limits required');
  mkdirSync(out,{recursive:true});mkdirSync(join(out,'images'),{recursive:true});
  const budget=new EvaluationBudget({maxCalls,maxImages});const pending=new Map();let timer,expired=false,sequence=0;
  const record=entry=>appendFileSync(join(out,'transcript.jsonl'),JSON.stringify({...entry,time:new Date().toISOString()})+'\n');
  const send=value=>process.stdout.write(JSON.stringify(value)+'\n');
  const error=(id,message)=>send({jsonrpc:'2.0',id,result:{isError:true,content:[{type:'text',text:JSON.stringify({ok:false,code:'EVALUATION_BUDGET',error:message,budget:budget.stats()})}]}});
  const child=spawn(process.execPath,[server],{stdio:['pipe','pipe','pipe'],windowsHide:true,env:{...process.env,...(process.env.RENDER_SERVICE_TOKEN&&!process.env.KILN_RENDER_TOKEN?{KILN_RENDER_TOKEN:process.env.RENDER_SERVICE_TOKEN}:{})}});
  child.stderr.on('data',chunk=>appendFileSync(join(out,'server.stderr.log'),chunk));
  createInterface({input:process.stdin}).on('line',line=>{let request;try{request=JSON.parse(line);}catch{child.stdin.write(line+'\n');return;}
    if(request.method==='tools/call'){
      if(!timer)timer=setTimeout(()=>{expired=true;record({direction:'budget',reason:'deadline',budget:budget.stats()});for(const id of pending.keys())error(id,'Session deadline exhausted');pending.clear();child.kill();},deadlineMs);
      const tool=request.params?.name,args=request.params?.arguments??{},cells=plannedCells(tool,args);const reason=expired?'Session deadline exhausted':budget.reserve(request.id,cells);
      record({direction:'request',id:request.id,tool,args,argumentBytes:Buffer.byteLength(JSON.stringify(args)),reservedCells:cells,denied:reason??undefined,budget:budget.stats()});
      if(reason){error(request.id,reason);return;}
      pending.set(request.id,{tool,cells,sequence:++sequence});
    }
    if(!expired)child.stdin.write(line+'\n');
  }).on('close',()=>child.stdin.end());
  createInterface({input:child.stdout}).on('line',line=>{let response;try{response=JSON.parse(line);}catch{process.stdout.write(line+'\n');return;}
    const call=pending.get(response.id);if(call){const content=response.result?.content??[];const images=content.filter(item=>item.type==='image');const saved=[];for(let i=0;i<images.length;i++){const bytes=Buffer.from(images[i].data,'base64');const path=join(out,'images',`${String(call.sequence).padStart(3,'0')}-${i}.png`);writeFileSync(path,bytes);saved.push({path,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}
      const delivered=images.length?Math.max(call.cells,images.length):0;budget.settle(response.id,delivered);pending.delete(response.id);
      record({direction:'response',id:response.id,tool:call.tool,content:content.map(item=>item.type==='image'?{type:'image',mimeType:item.mimeType}:item),images:saved,chargedCells:delivered,isError:response.result?.isError??false,budget:budget.stats()});
      if(images.length>call.cells){error(response.id,'Renderer returned more images than reserved');return;}
    }
    process.stdout.write(line+'\n');
  });
  child.on('close',code=>{if(timer)clearTimeout(timer);writeFileSync(join(out,'budget.json'),JSON.stringify({...budget.stats(),expired,exitCode:code},null,2));process.exitCode=code??1;});
  child.on('error',err=>{record({direction:'observer-error',message:err.message});process.exitCode=1;});
  return child;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const options={};const args=process.argv.slice(2);while(args.length){const flag=args.shift(),value=args.shift();if(!['--server','--out','--max-calls','--max-images','--deadline-ms'].includes(flag)||!value)throw Error('Expected --server PATH --out DIR [--max-calls 30 --max-images 48 --deadline-ms 900000]');options[{'--server':'server','--out':'out','--max-calls':'maxCalls','--max-images':'maxImages','--deadline-ms':'deadlineMs'}[flag]]=['--server','--out'].includes(flag)?resolve(value):Number(value);}if(!options.server||!options.out)throw Error('server and out required');observeShipping(options);
}

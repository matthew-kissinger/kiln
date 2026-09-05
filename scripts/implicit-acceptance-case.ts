/** Bounded offline X0 field measurements; not a public engine API. */
import { createHash } from 'node:crypto';
import { implicitSurface } from '../src/implicit';
import { geometryDiagnostics } from '../src/geometry';
import type { BufferGeometry } from 'three';
type Point = readonly [number, number, number];
const [name, resolution] = process.argv.slice(2);
const edgeLength = Number(resolution);
if (!['organic', 'mixed', 'cellular'].includes(name!) || ![0.2, 0.1].includes(edgeLength)) throw new Error('Choose organic|mixed|cellular and 0.2|0.1');
const sphere = ([x,y,z]: Point, center: number, radius: number) => radius-Math.hypot(x-center,y,z);
const box = ([x,y,z]: Point) => {
  const q = [Math.abs(x)-0.6,Math.abs(y)-0.45,Math.abs(z)-0.5];
  return -Math.hypot(...q.map(v=>Math.max(v,0)))-Math.min(Math.max(...q),0);
};
const field = (p: Point) => {
  if (name === 'organic') {
    const a=sphere(p,-0.4,0.65), b=sphere(p,0.4,0.65), k=0.3;
    const h=Math.max(k-Math.abs(a-b),0)/k;
    return Math.max(a,b)+h*h*k/4;
  }
  if (name === 'mixed') return Math.max(box(p),sphere(p,0.65,0.65));
  const [x,y,z]=p;
  return Math.min(1-Math.hypot(x,y,z),0.15-Math.abs(Math.sin(x*6)*Math.cos(y*6)+Math.sin(y*6)*Math.cos(z*6)+Math.sin(z*6)*Math.cos(x*6)));
};
const options = {bounds:{min:[-1.5,-1.2,-1.2] as Point,max:[1.5,1.2,1.2] as Point},edgeLength};
const started=performance.now();
const geometry=await implicitSurface(field,options);
const buildMs=performance.now()-started;
const repeated=await implicitSurface(field,options);
function digest(g: BufferGeometry) {
  const h=createHash('sha256');
  for(const attribute of [g.getAttribute('position'),g.getAttribute('normal'),g.index]) if(attribute) h.update(Buffer.from(attribute.array.buffer,attribute.array.byteOffset,attribute.array.byteLength));
  return h.digest('hex');
}
const p=geometry.getAttribute('position'), index=geometry.index;
const vertexResiduals:number[]=[],centroidResiduals:number[]=[];
for(let i=0;i<p.count;i++) vertexResiduals.push(Math.abs(field([p.getX(i),p.getY(i),p.getZ(i)])));
for(let i=0;i<(index?.count??p.count);i+=3) {
  const ids=[0,1,2].map(k=>index?index.getX(i+k):i+k);
  centroidResiduals.push(Math.abs(field([ids.reduce((s,j)=>s+p.getX(j),0)/3,ids.reduce((s,j)=>s+p.getY(j),0)/3,ids.reduce((s,j)=>s+p.getZ(j),0)/3])));
}
function summary(values:number[]) { values.sort((a,b)=>a-b);return {samples:values.length,max:values.at(-1),p95:values[Math.floor((values.length-1)*0.95)]}; }
const sha256=digest(geometry), repeatHash=digest(repeated);
if(sha256!==repeatHash) throw new Error('Repeated field output differs');
console.log(JSON.stringify({name,edgeLength,buildMs,triangles:(index?.count??p.count)/3,sha256,repeatIdentical:true,sampling:geometry.userData.kilnImplicit,vertexFieldResidual:summary(vertexResiduals),centroidFieldResidual:summary(centroidResiduals),topology:geometryDiagnostics(geometry),bounds:{min:geometry.boundingBox!.min.toArray(),max:geometry.boundingBox!.max.toArray()},uvPresent:!!geometry.getAttribute('uv')}));

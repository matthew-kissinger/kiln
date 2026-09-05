// Opt-in GPU proof: known linear patches must reach PNG through ACES + sRGB.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { PNG } from 'pngjs';
import * as THREE from 'three/webgpu';
import { initRenderer } from '../src/renderer.mjs';
import { renderDisplayTarget } from '../src/display-output.mjs';
import { packRgbaReadback } from '../src/readback.mjs';
import { markGpuShutdown } from '../src/gpu.mjs';
const out = new URL('../../tmp/display-output-proof/', import.meta.url);
await mkdir(out, { recursive: true });
const colors = [[.04,.04,.04],[.18,.18,.18],[.5,.5,.5],[1,1,1],[2,2,2],[4,4,4],[.8,.05,.02],[.03,.6,.05],[.02,.04,.8]];
const mul = (m,c) => m.map(row => row.reduce((s,v,i) => s+v*c[i],0));
function expected(c, exposure) {
  const input=mul([[.59719,.35458,.04823],[.076,.90834,.01566],[.0284,.13383,.83777]],c.map(v=>v*exposure/.6));
  const fit=input.map(v=>(v*(v+.0245786)-.000090537)/(v*(v+.432951)*.983729+.238081));
  const linear=mul([[1.60475,-.53108,-.07367],[-.10208,1.10813,-.00605],[-.00327,-.07276,1.07602]],fit).map(v=>Math.max(0,Math.min(1,v)));
  return linear.map(v=>Math.round(255*(v<=.0031308?12.92*v:1.055*v**(1/2.4)-.055)));
}
const {renderer,gpuState}=await initRenderer();
const scene=new THREE.Scene();scene.background=new THREE.Color(0);
const geometry=new THREE.PlaneGeometry(.96,.96);
colors.forEach((c,i)=>{const material=new THREE.MeshBasicMaterial({color:new THREE.Color().setRGB(...c,THREE.LinearSRGBColorSpace)});const mesh=new THREE.Mesh(geometry,material);mesh.position.set(i%3-1,1-Math.floor(i/3),0);scene.add(mesh)});
const camera=new THREE.OrthographicCamera(-1.5,1.5,1.5,-1.5,.1,10);camera.position.z=3;camera.lookAt(0,0,0);
const target=new THREE.RenderTarget(270,270,{samples:4});
async function read(name){const data=packRgbaReadback(await renderer.readRenderTargetPixelsAsync(target,0,0,270,270),270,270);const png=new PNG({width:270,height:270});data.copy(png.data);await writeFile(new URL(name+'.png',out),PNG.sync.write(png));return colors.map((_,i)=>{const at=((Math.floor(i/3)*90+45)*270+i%3*90+45)*4;return [...data.subarray(at,at+3)]})}
try {
  renderer.toneMappingExposure=1.38;
  renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.setRenderTarget(null);
  const legacy=await read('legacy-linear-clipped');
  renderDisplayTarget(renderer,scene,camera,target);
  const corrected=await read('display-aces-srgb'),reference=colors.map(c=>expected(c,1.38));
  for(let i=0;i<colors.length;i++)for(let j=0;j<3;j++)assert(Math.abs(corrected[i][j]-reference[i][j])<=2,JSON.stringify({patch:i,actual:corrected[i],reference:reference[i]}));
  assert.deepEqual(legacy[3],[255,255,255]);assert.deepEqual(legacy[5],[255,255,255]);
  assert(corrected[3][0]<corrected[4][0]&&corrected[4][0]<corrected[5][0]);
  renderer.toneMappingExposure=.7;renderDisplayTarget(renderer,scene,camera,target);
  const lower=await read('display-lower-exposure');
  for(let i=0;i<colors.length;i++)for(let j=0;j<3;j++)assert(Math.abs(lower[i][j]-expected(colors[i],.7)[j])<=2);
  assert(lower[1][0]<corrected[1][0]);
  const receipt={status:'passed',rendererId:gpuState.rendererId,inputLinearColors:colors,legacy,corrected,expected:reference,lowerExposure:lower,toleranceBytes:2,checks:['HDR whites1/2/4 remain distinguishable','neutral/color patches match ACES+exposure+sRGB','exposure changes actual output','unaligned270px readback retains rows']};
  await writeFile(new URL('receipt.json',out),JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));
} finally {
  markGpuShutdown();target.dispose();geometry.dispose();for(const mesh of scene.children)mesh.material?.dispose();renderer.dispose();gpuState.device.destroy();
}
process.exit(0);

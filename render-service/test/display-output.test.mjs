import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as THREE from 'three/webgpu';
import {renderDisplayTarget} from '../src/display-output.mjs';
function fixture(){const canvas={width:4,height:4,style:{},addEventListener(){},removeEventListener(){},getContext(){throw Error('No GPU needed')}};const renderer=new THREE.WebGPURenderer({canvas,outputBufferType:THREE.HalfFloatType});renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.outputColorSpace=THREE.SRGBColorSpace;const target=new THREE.RenderTarget(16,8);return{renderer,target};}
test('PNG output invokes the actual Three HDR framebuffer/display-transform path',()=>{
 const {renderer,target}=fixture();let observed;
 renderer.render=()=>{observed={target:renderer.getRenderTarget(),output:renderer.getOutputRenderTarget(),needsHdr:renderer.needsFrameBufferTarget,toneMapping:renderer.currentToneMapping,colorSpace:renderer.currentColorSpace,bufferType:renderer.getOutputBufferType()}};
 renderDisplayTarget(renderer,{}, {},target);
 assert.equal(observed.target,null,'must permit Three internal HDR framebuffer pass');assert.equal(observed.output,target);assert.equal(observed.needsHdr,true);assert.equal(observed.toneMapping,THREE.ACESFilmicToneMapping);assert.equal(observed.colorSpace,THREE.SRGBColorSpace);assert.equal(observed.bufferType,THREE.HalfFloatType);
 assert.equal(renderer.getRenderTarget(),null);assert.equal(renderer.getOutputRenderTarget(),null);
});
test('a failed view restores prior public renderer targets',()=>{const {renderer,target}=fixture();const previous=new THREE.RenderTarget(4,4);renderer.setOutputRenderTarget(previous);renderer.render=()=>{throw Error('draw failed')};assert.throws(()=>renderDisplayTarget(renderer,{}, {},target),/draw failed/);assert.equal(renderer.getRenderTarget(),null);assert.equal(renderer.getOutputRenderTarget(),previous)});

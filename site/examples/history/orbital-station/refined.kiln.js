// Authored by: gpt-6-astra, via codex.
//
// Original model-authored station retained in site/examples/history/orbital-station.
// Maintainer revision: Codex refinement following owner feedback on the rear assembly.
// This revision uses the existing source and repository context.

const meta = { name: 'OrbitalStation', category: 'prop' };
function build() {
 const root=createRoot('OrbitalStation');
 const white=gameMaterial(0xbfcbd0,{metalness:0.22,roughness:0.42,flatShading:false}), dark=gameMaterial(0x202d38,{metalness:0.65,roughness:0.38,flatShading:false}), blue=gameMaterial(0x153450,{metalness:0.55,roughness:0.26,flatShading:false}), glass=gameMaterial(0x4393a5,{metalness:0.25,roughness:0.23,emissive:0x174857,emissiveIntensity:0.18,flatShading:false}), gold=gameMaterial(0xa67b44,{metalness:0.72,roughness:0.34,flatShading:false});
 const frame=createPivot('Station',[0,10.25,0],root);
 const rotor=createPivot('HabitatRotor',[0,0,0],frame);
 const part=(n,g,m,p,parent=frame,r=[0,0,0])=>createPart(n,g,m,{position:p,parent,rotation:r});
 const beam=(n,a,b,r,m,parent=frame)=>beamBetween(n,a,b,r,m,{segments:6,parent});
 const ringPoint=(x,r,a)=>[x,r*Math.cos(a),r*Math.sin(a)];
 function wedge(r0,r1,x0,x1,a0,a1) {
  const v=[];for(const x of [x0,x1])for(const r of [r0,r1])for(const a of [a0,a1])v.push(...ringPoint(x,r,a));
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));
  g.setIndex([0,1,3,0,3,2,4,6,7,4,7,5,0,4,5,0,5,1,2,3,7,2,7,6,0,2,6,0,6,4,1,5,7,1,7,3]);const solid=g.toNonIndexed();solid.computeVertexNormals();return solid;
 }
 for(let i=0;i<24;i++){
  const a=i*Math.PI/12, b=(i+1)*Math.PI/12, mid=(a+b)/2;
  part('HabitatWedge_'+i,wedge(8.1,9.9,-0.9,0.9,a,b),i%6===0?gold:white,[0,0,0],rotor);
  for(const side of [-1,1]){
   part('WindowBand_'+i+'_'+side,wedge(8.65,9.2,side>0?0.899:-0.93,side>0?0.93:-0.899,a+0.035,b-0.035),glass,[0,0,0],rotor);
   part('WindowMullion_'+i+'_'+side,boxGeo(0.06,0.57,0.055),white,ringPoint(side*0.942,8.925,mid),rotor,[mid*180/Math.PI,0,0]);
   beam('Handrail_'+i+'_'+side,ringPoint(side*1.22,9.65,a),ringPoint(side*1.22,9.65,b),0.045,dark,rotor);
   beam('RailStanchion_'+i+'_'+side,ringPoint(side*0.86,9.65,a),ringPoint(side*1.22,9.65,a),0.045,dark,rotor);
  }
  beam('OuterCoolant_'+i,ringPoint(0,10.15,a),ringPoint(0,10.15,b),0.1,gold,rotor);
  part('CableTray_'+i,boxGeo(0.34,0.12,2.56),dark,ringPoint(-0.5,9.96,mid),rotor,[mid*180/Math.PI,0,0]);
  if(i%2===0){
   part('ServiceJunction_'+i,boxGeo(0.65,0.22,0.5),white,ringPoint(0.25,9.9,mid),rotor,[mid*180/Math.PI,0,0]);
   part('ServiceLatch_'+i,boxGeo(0.18,0.04,0.3),gold,ringPoint(0.25,10.02,mid),rotor,[mid*180/Math.PI,0,0]);
  }
  beam('PipeClamp_'+i,ringPoint(0,9.8,mid),ringPoint(0,10.15,mid),0.12,dark,rotor);
 }
 for(let i=0;i<4;i++){
  const a=i*Math.PI/2, p=createPivot('SpokeFrame'+i,[0,0,0],rotor);p.rotation.x=a;
  part('TaperedSpoke'+i,cylinderGeo(0.65,0.32,6.9,8),white,[0,4.95,0],p);
  beam('SpokeService'+i,[0.4,1.4,0],[0.4,8.2,0],0.08,gold,p);
  for(let j=0;j<3;j++)part('SpokeFlange'+i+'_'+j,boxGeo(1.12,0.15,1.12),dark,[0,3+j*2,0],p);
 }
 const hubShell=lathe([[0,-3.2],[1.2,-3.2],[1.35,-3.04],[1.35,3.04],[1.2,3.2],[0,3.2]],48);hubShell.rotateZ(-Math.PI/2);
 part('FixedHub',hubShell,white,[0,0,0]);
 part('RotorBearing',cylinderXGeo(1.58,1.58,1.2,48),dark,[0,0,0]);
 for(const x of [-2.9,2.9])part('HubEndBand'+x,cylinderXGeo(1.43,1.43,0.22,48),gold,[x,0,0]);
 // A recessed axial service port, surrounded by a structural annulus.
 // The dark backing sits behind the lip, so the end reads as a cavity rather than a blank cap.
 part('AftPressureBulkhead',cylinderXGeo(1.22,1.35,0.48,48),dark,[-3.38,0,0]);
 part('AftPortRecess',cylinderXGeo(0.84,0.84,0.08,48),dark,[-3.66,0,0]);
 const aftRing=(name,radius,tube,x,mat)=>part(name,torusGeo(radius,tube,8,48),mat,[x,0,0],frame,[0,90,0]);
 aftRing('AftStructuralLip',1.16,0.16,-3.68,white);
 aftRing('AftSeal',0.91,0.07,-3.72,gold);
 part('ServiceHatch',cylinderXGeo(0.64,0.64,0.06,32),white,[-3.73,0,0]);
 part('HatchSplit',boxGeo(0.025,1.08,0.035),dark,[-3.77,0,0]);
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4;
  part('AftLatch'+i,boxGeo(0.18,0.2,0.16),gold,ringPoint(-3.83,1.13,a),frame,[a*180/Math.PI,0,0]);
  part('HubServicePanel'+i,boxGeo(1.4,0.12,0.55),white,ringPoint(-1.98,1.34,a),frame,[a*180/Math.PI,0,0]);
  for(let j=0;j<4;j++)part('HubVent'+i+'_'+j,boxGeo(0.065,0.025,0.38),dark,ringPoint(-2.42+j*0.23,1.415,a),frame,[a*180/Math.PI,0,0]);
 }
 const dock=createPivot('DockingNode',[3.7,0,0],frame);
 part('DockingManifold',cylinderXGeo(0.95,1.15,1.4,12),dark,[0,0,0],dock);
 for(let i=0;i<4;i++){
  const a=i*Math.PI/2;
  beam('RadialDockNeck'+i,ringPoint(0,0.7,a),ringPoint(0,1.65,a),0.42,white,dock);
  const p=createPivot('DockCollarFrame'+i,ringPoint(0,1.7,a),dock);p.rotation.x=a-Math.PI/2;
  part('RadialDockCollar'+i,torusGeo(0.48,0.12,6,12),gold,[0,0,0],p);
 }
 part('AxialDockCollar',cylinderXGeo(0.58,0.58,0.55,12),gold,[4.6,0,0]);
 const craft=createPivot('SupplyCraft',[6.3,0,0],frame);
 part('CargoHull',cylinderXGeo(0.86,0.86,2.9,12),white,[0,0,0],craft);
 part('CargoForwardCap',coneXGeo(0.86,0.75,12),white,[1.8,0,0],craft);
 for(const x of [-1,0.8])part('CargoStrap'+x,cylinderXGeo(0.9,0.9,0.18,12),dark,[x,0,0],craft);
 part('Cockpit',boxGeo(0.7,0.14,0.85),glass,[1,0.82,0],craft);
 for(const s of [-1,1]){
  part('ThrusterPod'+s,cylinderXGeo(0.24,0.3,0.9,8),dark,[-0.8,0,s*0.92],craft);
  beam('ArrayBoom'+s,[-2.5,0,0],[-2.5,0,s*11.4],0.18,white);
  part('GimbalBearing'+s,cylinderZGeo(0.5,0.5,0.8,12),gold,[-2.5,0,s*11.2]);
  const wing=createPivot('SolarWing'+s,[-2.5,0,s*15.2],frame);wing.rotation.z=-0.85;
  part('ArrayBacking_'+s,boxGeo(4.6,0.16,8.2),dark,[0,0,0],wing);
  for(let row=0;row<12;row++)for(let col=0;col<4;col++)
   part('SolarCell_'+s+'_'+row+'_'+col,boxGeo(1.06,0.035,0.6),blue,[-1.68+col*1.12,0.097,-3.63+row*0.66],wing);
  for(const x of [-2.27,0,2.27])beam('ArraySpar_'+s+'_'+x,[x,-0.36,-4.1],[x,-0.36,4.1],0.055,white,wing);
  for(const x of [-2.27,0,2.27])for(const z of [-4,4])beam('TrussTie_'+s+'_'+x+'_'+z,[x,-0.36,z],[x,0,z],0.055,white,wing);
  for(let j=0;j<8;j++){
   beam('ArrayCrossbar_'+s+'_'+j,[-2.3,-0.12,-4+j*1.14],[2.3,-0.12,-4+j*1.14],0.045,white,wing);
   beam('ArrayTruss_'+s+'_'+j,[-2.25,-0.36,-4+j],[2.25,-0.12,-3+j],0.045,white,wing);
  }
  // Mirrored, double-sided thermal cassettes, with a visible load path to the hub.
  const rad=createPivot('Radiator'+s,[-1.95,s*2.65,0],frame);
  for(const z of [-0.9,0.9]){
   beam('RadiatorRoot'+s+'_'+z,[-1.2,s*0.92,z*0.65],[-1.2,s*2.65,z],0.11,dark);
   beam('RadiatorBrace'+s+'_'+z,[-2.85,s*0.92,z*0.65],[-1.2,s*2.65,z],0.075,gold);
  }
  part('ThermalCassette_'+s,boxGeo(2.55,0.2,3.5),dark,[0,0,0],rad);
  for(const face of [-1,1]){
   for(let j=0;j<6;j++){
    part('ThermalTile_'+s+'_'+face+'_'+j,boxGeo(0.37,0.045,3.18),white,[-1.025+j*0.41,face*0.12,0],rad);
    part('ThermalTube_'+s+'_'+face+'_'+j,boxGeo(0.025,0.025,3.05),dark,[-1.025+j*0.41,face*0.155,0],rad);
   }
  }
  for(const z of [-1.7,1.7])part('RadiatorHeader'+s+'_'+z,boxGeo(2.62,0.25,0.12),gold,[0,0,z],rad);
  for(const x of [-1.28,1.28])part('RadiatorEdge'+s+'_'+x,boxGeo(0.09,0.24,3.5),white,[x,0,0],rad);
 }
 // Paired communications pods flank the aft port. No isolated top mast or horn:
 // the rear service assembly is mirrored across both its vertical and lateral axes.
 for(const s of [-1,1]){
  beam('CommsOutrigger'+s,[-2.9,0,s*1.2],[-4.15,0,s*2.05],0.12,dark);
  for(const y of [-0.35,0.35])beam('CommsBrace'+s+'_'+y,[-2.5,y,s*1.18],[-4.15,0,s*2.05],0.055,gold);
  const pod=createPivot('CommsPod'+s,[-4.15,0,s*2.05],frame);pod.rotation.x=s*Math.PI/2;
  part('CommunicationsDish'+s,lathe([[0,0],[0.2,0.025],[0.43,0.13],[0.6,0.29],[0.6,0.35],[0.42,0.19],[0.18,0.085],[0,0.06]],32),white,[0,0,0],pod);
  beam('DishFeed'+s,[0,0,0],[0,0.5,0],0.035,gold,pod);
 }
 root.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(root);frame.position.y-=bounds.min.y;
 return root;
}
function animate(){ return [createClip('HabitatRotation',60,[rotationTrack('Joint_HabitatRotor',[0,15,30,45,60].map((time,i)=>({time,rotation:[i*90,0,0]})))])]; }

// Authored by: gpt-6-astra, via codex.
//
// Written by the model itself through the Kiln MCP tools: it wrote the
// program, rendered it, looked at its own six-view contact sheet, and
// revised. Not a line of it is hand-authored.
//
// Dispatched into a clean directory containing only the brief and the Kiln
// skills, with no access to this repository or to any finished example.

const meta = { name: 'RigidAirship', category: 'vehicle' };
// +X bow; closed fabric envelope. The grounded mooring mast supports the moored scene.
function build() {
  const root = createRoot('RigidAirship');
  const fabric = gameMaterial(0xaeb7b6,{roughness:0.83,flatShading:false});
  const seam = gameMaterial(0x8f9c9c,{roughness:0.85});
  const steel = gameMaterial(0x3c505b,{metalness:0.6,roughness:0.48});
  const silver = gameMaterial(0x94a2a7,{metalness:0.65,roughness:0.4});
  const paint = gameMaterial(0x234750,{roughness:0.68});
  const glass = gameMaterial(0x214653,{metalness:0.35,roughness:0.18});
  const wood = gameMaterial(0x604630,{roughness:0.65});
  let serial=0;
  function part(n,g,m,p,r=[0,0,0],sc=[1,1,1],parent=root){return createPart(n,g,m,{position:p,rotation:r,scale:sc,parent});}
  function beam(n,a,b,r,m=steel,parent=root){return beamBetween(n+'_'+serial++,a,b,r,m,{segments:4,parent});}
  const profile=[[0,-24],[0.65,-23],[1.9,-20],[3.6,-16],[4.6,-11],[5,-5],[5,3],[4.65,10],[3.65,17],[2,22],[0.65,23.7],[0,24]];
  function rad(x){
    for(let j=1;j<profile.length;j++)if(x<=profile[j][1]){
      const a=profile[j-1],b=profile[j];return a[0]+(b[0]-a[0])*(x-a[1])/(b[1]-a[1]);
    }return 0;
  }
  part('ClosedFabricEnvelope',lathe(profile,48),fabric,[0,16,0],[0,0,-90]);
  // Very shallow surface tapes; the complete opaque envelope remains underneath every tape.
  for(let x=-20;x<=22;x+=3){
    const p=[[-0.022,rad(x-0.022)+0.012],[0.022,rad(x+0.022)+0.012]];
    part('CoveredRingSeam_'+x,lathe(p.map(v=>[v[1],x+v[0]]),48),seam,[0,16,0],[0,0,-90]);
  }
  for(let k=0;k<12;k++){
    const t=k*Math.PI/6;
    const pts=profile.slice(1,-1).map(p=>[p[1],16+(p[0]+0.006)*Math.cos(t),(p[0]+0.006)*Math.sin(t)]);
    for(let j=1;j<pts.length;j++)beam('CoveredLongitudinalTape',pts[j-1],pts[j],0.016,seam);
  }
  for(const x of [-13,18]){
    part('PaintedRegistrationBand_'+x,lathe([[rad(x-0.28)+0.014,x-0.28],[rad(x+0.28)+0.014,x+0.28]],48),paint,[0,16,0],[0,0,-90]);
  }
  // Glazing is applied over the intact hull: no missing skin or cutaway.
  for(const s of [-1,1])for(let i=0;i<18;i++){
    const x=-8+i*1.12,z=s*(rad(x)+0.02);
    part('PromenadeWindowFrame_'+s+'_'+i,boxGeo(0.56,0.6,0.09),silver,[x,15.9,z]);
    part('PromenadeGlazing_'+s+'_'+i,boxGeo(0.43,0.46,0.025),glass,[x,15.9,z+s*0.055]);
  }
  const gondola=createPivot('ControlGondola',[12.4,11.3,0],root);
  part('BridgeLowerHull',sphereGeo(1,20,10),fabric,[0,-0.3,0],[0,0,0],[3,0.68,1.02],gondola);
  part('BridgeCabin',boxGeo(4.7,1.15,1.75),fabric,[0,0.08,0],[0,0,0],[1,1,1],gondola);
  part('BridgeCanopy',boxGeo(5.05,0.16,1.98),paint,[0,0.72,0],[0,0,0],[1,1,1],gondola);
  for(const s of [-1,1])for(let i=0;i<6;i++)
    part('BridgeSideGlass_'+s+'_'+i,boxGeo(0.57,0.66,0.05),glass,[-1.95+i*0.75,0.18,s*0.89],[0,0,0],[1,1,1],gondola);
  for(const s of [-1,1])part('BridgeForwardGlass_'+s,boxGeo(0.05,0.67,0.67),glass,[2.37,0.18,s*0.42],[0,0,0],[1,1,1],gondola);
  for(const s of [-1,1])for(const x of [-8,7]){
    const z=s*5.8,y=13.7,id=x+'_'+s;
    part('EngineCar_'+id,sphereGeo(1,16,8),fabric,[x,y,z],[0,0,0],[1.9,0.62,0.64]);
    beam('EngineFrontOutrigger',[x+0.8,14.4,s*4.3],[x+0.7,y,z],0.11);
    beam('EngineRearOutrigger',[x-0.9,14.4,s*4.3],[x-0.7,y,z],0.11);
    beam('EngineDiagonal',[x-1.2,14.9,s*4.2],[x+0.7,y,z],0.075);
    part('EngineIntake_'+id,cylinderXGeo(0.36,0.36,0.15,12),steel,[x+1.75,y,z]);
    part('PropellerHub_'+id,sphereGeo(0.25,12,8),silver,[x+2.06,y,z],[0,0,0],[1.6,1,1]);
    for(let k=0;k<3;k++){
      const a=k*120+20,t=a*Math.PI/180;
      part('TractorPropeller_'+id+'_'+k,sphereGeo(1,8,6),wood,[x+1.96,y+0.79*Math.cos(t),z+0.79*Math.sin(t)],[a,0,-12],[0.085,0.96,0.17]);
    }
    for(let i=0;i<4;i++)part('EngineVent_'+id+'_'+i,boxGeo(0.11,0.35,0.035),steel,[x-0.4+i*0.24,y,z+s*0.625]);
    beam('Exhaust',[x-0.5,y+0.42,z],[x-1.2,y+0.88,z],0.09);
  }
  // Closed tapered fin slabs with explicit shared trailing-edge coordinates.
  function finSlab(points,thickness){
    const v=[];for(const y of [-thickness/2,thickness/2])for(const p of points)v.push(p[0],y,p[1]);
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));
    g.setIndex([0,2,1,0,3,2,4,5,6,4,6,7,0,1,5,0,5,4,1,2,6,1,6,5,2,3,7,2,7,6,3,0,4,3,4,7]);
    g.computeVertexNormals();return g;
  }
  for(let k=0;k<4;k++){
    const tail=createPivot('TailFinAssembly_'+k,[-18.3,16,0],root);
    tail.rotation.x=k*Math.PI/2;
    part('FabricFin_'+k,finSlab([[-3.7,0],[3.7,0],[0,6.35],[-2.5,6.35]],0.2),fabric,[0,0,0],[0,0,0],[1,1,1],tail);
    part('HingedTailSurface_'+k,finSlab([[-4.6,0],[-3.62,0],[-2.42,6.35],[-3.15,6.35]],0.14),paint,[0,0,0],[0,0,0],[1,1,1],tail);
    beam('TailHinge',[-3.7,0,0],[-2.5,0,6.35],0.045,silver,tail);
    const t=k*Math.PI/2;
    for(const s of [-1,1])beam('TautFinBrace',[-12,16-2.6*Math.sin(t)+s*3.3*Math.cos(t),2.6*Math.cos(t)-s*3.3*Math.sin(t)],[-19.2,16-5.8*Math.sin(t),5.8*Math.cos(t)],0.027,steel);
  }
  part('NoseReinforcementPlate',lathe([[0,24.17],[0.72,23.7],[0.84,23.52]],48),silver,[0,16,0],[0,0,-90]);
  part('BowCouplingSocket',cylinderXGeo(0.22,0.3,0.65,12),steel,[24.22,16,0]);
  const mast=createPivot('MooringMast',[26,0,0],root);
  const corners=[[-1,-1],[-1,1],[1,1],[1,-1]];
  function half(y){return 2-1.55*(y/16);}
  for(let c=0;c<4;c++){
    const [a,b]=corners[c];
    part('MastFoot_'+c,boxGeo(1.15,0.3,1.15),steel,[a*2,0.15,b*2],[0,0,0],[1,1,1],mast);
    beam('MastLeg',[a*2,0.3,b*2],[a*0.45,16,b*0.45],0.13,steel,mast);
    for(let j=0;j<6;j++){
      const y0=0.5+j*2.5,y1=y0+2.5,[d,e]=corners[(c+1)%4];
      beam('LatticeHorizontal',[a*half(y0),y0,b*half(y0)],[d*half(y0),y0,e*half(y0)],0.075,steel,mast);
      beam('LatticeDiagonalA',[a*half(y0),y0,b*half(y0)],[d*half(y1),y1,e*half(y1)],0.06,steel,mast);
      beam('LatticeDiagonalB',[d*half(y0),y0,e*half(y0)],[a*half(y1),y1,b*half(y1)],0.06,steel,mast);
      part('RivetedGusset_'+c+'_'+j,boxGeo(0.25,0.28,0.14),silver,[a*half(y0),y0,b*half(y0)],[0,0,0],[1,1,1],mast);
      for(const dy of [-0.075,0.075])part('MastRivet_'+c+'_'+j+'_'+dy,sphereGeo(0.044,6,2),steel,[a*half(y0),y0+dy,b*(half(y0)+0.08)],[0,0,0],[1,1,0.65],mast);
    }
  }
  part('MastHeadPlatform',boxGeo(1.45,0.22,1.45),steel,[0,15.8,0],[0,0,0],[1,1,1],mast);
  part('RotatingMastHead',cylinderYGeo(0.44,0.5,0.55,16),silver,[0,16.15,0],[0,0,0],[1,1,1],mast);
  beam('CouplingArm',[-1.65,16,0],[0,16.25,0],0.2,steel,mast);
  beam('CouplingArmBrace',[-1.65,16,0],[0,15.25,0],0.12,steel,mast);
  return root;
}

// Authored by: gpt-6-astra, via codex.
//
// Written by the model itself through the Kiln MCP tools: it wrote the
// program, rendered it, looked at its own six-view contact sheet, and
// revised. Not a line of it is hand-authored.
//
// Dispatched into a clean directory containing only the brief and the Kiln
// skills, with no access to this repository or to any finished example.

const meta = { name: 'BlastFurnace', category: 'architecture' };

function build() {
  const root = createRoot('BlastFurnace');
  const steel = gameMaterial(0x536168, {metalness:0.6, roughness:0.65});
  const dark = gameMaterial(0x2e3639, {metalness:0.5, roughness:0.8});
  const rust = gameMaterial(0x89523a, {metalness:0.35, roughness:0.85});
  const brick = gameMaterial(0x784b3d);
  const concrete = gameMaterial(0x77766c);
  const rail = gameMaterial(0xc29b48, {metalness:0.35, roughness:0.65});
  const molten = gameMaterial(0xeb641c,{emissive:0xff4308,emissiveIntensity:0.6});
  let id=0;
  const part=(n,g,m,p=[0,0,0],r=[0,0,0])=>createPart(n+'_'+id++,g,m,{position:p,rotation:r,parent:root});
  const box=(n,s,p,m=steel)=>part(n,boxGeo(...s),m,p);
  const cyl=(n,rt,rb,h,p,m=steel,segs=16)=>part(n,cylinderGeo(rt,rb,h,segs),m,p);
  const beam=(n,a,b,r=0.06,m=steel,segs=3)=>beamBetween(n+'_'+id++,a,b,r,m,{segments:segs,parent:root});
  const pipe=(n,points,r)=>part(n,pipeAlongPath(points,r,{bendRadius:0.5,tubularSegments:14,radialSegments:6}),steel);
  const ring=(n,r,y,t=0.07,m=rust,x=0,z=0)=>part(n,torusGeo(r,t,4,16),m,[x,y,z],[90,0,0]);
  box('Foundation',[24,0.5,22],[-1,0.25,3],concrete);
  cyl('Hearth',2.3,2.3,3,[0,2,0],brick);
  cyl('RefractoryBosh',3.3,2.3,3,[0,5,0],brick);
  cyl('FurnaceStack',1.65,3.3,12,[0,12.5,0]);
  cyl('Throat',1.65,1.65,2,[0,19.5,0]);
  cyl('ChargingBell',0.45,1.6,0.9,[0,20.95,0],rust);
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4, b=a+Math.PI/4;
    box('RingColumn',[0.45,6,0.45],[3.4*Math.cos(a),3.5,3.4*Math.sin(a)]);
    beam('ColumnRingBrace',[3.4*Math.cos(a),1.2,3.4*Math.sin(a)],[3.4*Math.cos(b),6.4,3.4*Math.sin(b)],0.1);
  }
  for(const y of [7,12,17]){
    const inner=3.3-(y-6.5)*1.65/12;
    part('AnnularWalkway',lathe([[inner,y-0.14],[4,y-0.14],[4,y],[inner,y],[inner,y-0.14]],16),dark);
    ring('WalkwayHandrail',4,y+1.05,0.055,rail);
    ring('WalkwayMidrail',4,y+0.52,0.04,rail);
    for(let j=0;j<16;j++){
      const a=j*Math.PI/8;
      beam('HandrailPost',[4*Math.cos(a),y,4*Math.sin(a)],[4*Math.cos(a),y+1.05,4*Math.sin(a)],0.045,rail);
      beam('WalkwayBracket',[inner*Math.cos(a),y-0.85,inner*Math.sin(a)],[3.9*Math.cos(a),y-0.14,3.9*Math.sin(a)],0.065);
    }
  }
  for(let i=0;i<3;i++){
    const x=-5+i*4.5;
    cyl('StoveFooting',1.85,1.85,0.4,[x,0.7,8],concrete);
    cyl('HotBlastStove',1.65,1.65,10.6,[x,6.2,8]);
    part('StoveDomedCrown',lathe([[1.65,0],[1.52,0.65],[1.1,1.2],[0.5,1.55],[0,1.65]],16),steel,[x,11.5,8]);
    for(const y of [1.1,4,7,10.8])ring('StoveSeam',1.66,y,0.045,rust,x,8);
    pipe('StoveHotOutlet',[[x,2.8,6.5],[x,2.8,5.5],[x,4.8,5.2]],0.38);
    box('StoveAccessDoor',[0.8,1.3,0.15],[x,1.6,9.66],dark);
  }
  pipe('HotBlastHeader',[[-5,4.8,5.2],[4.5,4.8,5.2],[4.5,4.8,1],[3.25,4.8,0]],0.48);
  ring('BustleMain',3.15,4.8,0.3,steel);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;beam('Tuyere',[3.15*Math.cos(a),4.8,3.15*Math.sin(a)],[2.4*Math.cos(a),3.3,2.4*Math.sin(a)],0.15,rust,8);}
  pipe('MainDowncomer',[[0,19.7,1.3],[0,21.7,2.5],[1,21.7,3.8],[5.8,14,4],[7,8,4]],0.55);
  pipe('SecondaryOfftake',[[1.2,19.7,-0.3],[2.3,21.3,0],[3.5,20.7,2.5],[5.8,14,4]],0.35);
  cyl('DustCatcher',1.25,1.25,4,[7,6,4]);
  cyl('DustHopper',1.25,0.35,2,[7,3,4],rust);
  for(const x of [6,8])for(const z of [3.2,4.8])box('DustCatcherLeg',[0.2,3.5,0.2],[x,2.25,z]);
  pipe('CleanGasMain',[[7,7,4],[8,7,5.5],[8,6,10],[4,6,10]],0.35);
  // Incline truss: common interpolation keeps all bays on the two rails.
  const at=(t,z,low=0)=>[-10+9*t,0.85+20*t-low,z];
  for(const z of [-0.9,0.9]){
    beam('SkipUpperChord',at(0,z),at(1,z),0.12);
    beam('SkipLowerChord',at(0,z,0.7),at(1,z,0.7),0.12);
    for(let i=0;i<10;i++){beam('SkipWeb',at(i/10,z),at((i+1)/10,z,0.7),0.065);beam('SkipCrossTie',at(i/10,-0.9),at(i/10,0.9),0.07);}
  }
  for(const t of [0.3,0.65])for(const z of [-0.9,0.9])beam('InclineTrestle',[-10+9*t,0.5,z],at(t,z,0.7),0.14);
  box('SkipCar',[1.3,1,2],at(0.67,0),rust);
  for(const x of [-2.4,2.4])for(const z of [-2,2]){
    box('ChargingGantryLeg',[0.24,5.4,0.24],[x,19.7,z]);
    beam('GantryKnee',[x,21.4,z],[0,22.3,z],0.09);
  }
  box('ChargingGantryCrosshead',[5.4,0.35,4.6],[0,22.55,0]);
  cyl('ChargingWinch',0.35,0.35,0.8,[0,22,0],rust);
  beam('BellSuspension',[0,21.3,0],[0,22.3,0],0.06,dark);
  // Riveted plate courses follow the taper of the shell.
  for(const y of [8.4,10.5,13.5,15.5,18.3]){
    const r=3.3-(y-6.5)*1.65/12;
    ring('ShellPlateSeam',r+0.025,y,0.045,rust);
    for(let j=0;j<12;j++){
      const a=j*Math.PI/6;
      part('ShellRivet',sphereGeo(0.075,4,3),rust,[(r+0.04)*Math.cos(a),y+0.13,(r+0.04)*Math.sin(a)]);
    }
  }
  // Three connected flights, consistently five metres between service decks.
  for(let level=0;level<3;level++){
    const startY=level===0?0.92:7+(level-1)*5;
    const rise=level===0?6.08:5;
    const sign=level%2===0?1:-1;
    const x0=-3*sign;
    const stairs=createStairs('ServiceStairs'+level,dark,{steps:22,totalRise:rise,totalRun:6,width:0.95,axis:'x',treadThickness:0.09,parent:root});
    stairs.root.position.set(x0,startY,-4.35);
    stairs.root.rotation.y=sign===1?0:Math.PI;
    for(const z of [-4.83,-3.87]){
      beam('StairStringer',[x0,startY-0.1,z],[-x0,startY+rise-0.1,z],0.09);
      beam('StairHandrail',[x0,startY+1,z],[-x0,startY+rise+1,z],0.045,rail);
      for(let j=0;j<=4;j++)beam('StairBaluster',[x0+sign*1.5*j,startY+rise*j/4,z],[x0+sign*1.5*j,startY+rise*j/4+1,z],0.04,rail);
    }
    box('StairLanding',[1.25,0.16,2.3],[-x0,startY+rise-0.08,-3.8],dark);
  }
  for(const x of [-3,3])box('StairTowerColumn',[0.18,16.5,0.18],[x,8.75,-4.65]);
  pipe('IronTapConnection',[[2.05,1.4,-0.6],[2.5,1,-1],[2.8,0.74,-2.7]],0.16);
  pipe('SlagTapConnection',[[2.15,2,0.6],[2.65,1.25,1],[2.8,0.74,0.7]],0.14);
  // Open cast house, front faces +X. Floor strips leave two real recessed channels.
  box('CastHouseSubfloor',[8,0.2,8],[6.2,0.6,-1],concrete);
  for(const [z,w] of [[-4,2],[-1,3],[2,2]])box('CastFloorBank',[8,0.22,w],[6.2,0.81,z],concrete);
  for(const z of [-2.7,0.7])box('RecessedRunner',[7.6,0.035,0.35],[6.2,0.72,z],molten);
  for(const x of [3,6.5,10])for(const z of [-5,3])box('CastHouseColumn',[0.22,5.1,0.22],[x,3.05,z]);
  for(const x of [3,6.5,10])box('CastHouseRoofBeam',[0.25,0.25,8.4],[x,5.5,-1]);
  const roof=createRoofPlanes('CastHouseRoof',rust,{width:7.5,depth:8.2,height:1.1,overhang:0.3,ridgeAxis:'x',thickness:0.12,parent:root});
  roof.root.position.set(6.5,5.625,-1);
  return root;
}


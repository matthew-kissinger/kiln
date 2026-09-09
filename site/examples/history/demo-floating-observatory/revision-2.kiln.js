const meta = {name:'AETHER REACH — Floating Observatory',category:'environment',role:'poi'};
function build(){
 const root=createRoot('AetherReach');
 const P={ground:4.05,towerX:-0.55,deck:7.45,steps:42,turn:Math.PI*2.15};
 const stone=gameMaterial(0xd3c9ab,{roughness:0.86});
 const trim=gameMaterial(0xeee0bc,{roughness:0.72});
 const rockM=[0x394652,0x45545e,0x52616b,0x657078].map(c=>gameMaterial(c,{roughness:1,flatShading:true}));
 const grass=gameMaterial(0x557b65,{roughness:1});
 const moss=gameMaterial(0x789273,{roughness:1});
 const teal=gameMaterial(0x276b70,{metalness:0.5,roughness:0.43});
 const brass=gameMaterial(0xc99b4e,{metalness:0.78,roughness:0.25});
 const darkBrass=gameMaterial(0x806138,{metalness:0.7,roughness:0.42});
 const dark=gameMaterial(0x23363d,{roughness:0.6});
 const wood=gameMaterial(0x795942,{roughness:0.85});
 const glass=gameMaterial(0x358a9a,{metalness:0.5,roughness:0.16,emissive:0x123e50,emissiveIntensity:0.28});
 const crystal=gameMaterial(0xb16af0,{metalness:0.18,roughness:0.28,emissive:0x9738ed,emissiveIntensity:1.65});
 function part(n,g,m,p=[0,0,0],par=root){return createPart(n,g,m,{position:p,parent:par});}
 function group(n,p=[0,0,0],par=root){const g=new THREE.Group();g.name=n;g.position.set(...p);par.add(g);return g;}
 function cyl(n,r1,r2,h,m,p,par=root){return part(n,new THREE.CylinderGeometry(r1,r2,h,32),m,p,par);}
 function rod(n,a,b,r,m,par=root){const v=new THREE.Vector3(...a),w=new THREE.Vector3(...b);const d=w.clone().sub(v);const o=part(n,new THREE.CylinderGeometry(r,r,d.length(),8),m,v.add(w).multiplyScalar(0.5).toArray(),par);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;}
 function curve(n,pts,r,m,par=root){return part(n,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),Math.max(12,pts.length*2),r,6,false),m,[0,0,0],par);}
 function ring(n,r,t,y,m,par=root){const o=part(n,new THREE.TorusGeometry(r,t,8,72),m,[0,y,0],par);o.rotation.x=Math.PI/2;return o;}
 function sector(n,ri,ro,a,b,y,h,m,par=root){
  const vs=[],ids=[],N=6;
  for(let k=0;k<2;k++)for(let r of [ri,ro])for(let j=0;j<=N;j++){const t=a+(b-a)*j/N;vs.push(r*Math.cos(t),y+k*h,r*Math.sin(t));}
  const L=N+1;function quad(a,b,c,d){ids.push(a,b,c,a,c,d);}
  for(let j=0;j<N;j++){quad(j,j+1,L+j+1,L+j);quad(2*L+j,3*L+j,3*L+j+1,2*L+j+1);quad(j,2*L+j,2*L+j+1,j+1);quad(L+j,L+j+1,3*L+j+1,3*L+j);}
  quad(0,L,3*L,2*L);quad(N,2*L+N,3*L+N,L+N);
  return part(n,meshGeo({positions:vs,indices:ids}),m,[0,0,0],par);
 }
 // A deterministic, jagged inverted mountain. Each belt shares its boundary.
 const island=group('FloatingIsland');
 const count=15;
 const rings=[{y:0.12,r:0.18,dx:0.5,dz:0.1},{y:1.2,r:1.5,dx:0.3,dz:0.1},{y:2.6,r:3.05,dx:0.1,dz:0},{y:3.65,r:4.25,dx:0,dz:0},{y:4.02,r:4.05,dx:0,dz:0}];
 const vertices=rings.map((q,k)=>Array.from({length:count},(_,i)=>{const a=i/count*Math.PI*2;const f=1+0.11*Math.sin(i*7.13)+0.055*Math.cos(i*3.8);return [q.dx+q.r*f*Math.cos(a),q.y+(k===4?0:0.19*Math.sin(i*2.31+k)),q.dz+q.r*f*Math.sin(a)*0.88];}));
 for(let k=0;k<rings.length-1;k++){
  let v=[],idx=[];for(let i=0;i<count;i++){let j=(i+1)%count;let p=[vertices[k][i],vertices[k+1][i],vertices[k+1][j],vertices[k][j]];let o=v.length/3;v.push(...p.flat());idx.push(o,o+1,o+2,o,o+2,o+3);}
  const geo=meshGeo({positions:v,indices:idx}).toNonIndexed();geo.computeVertexNormals();part('CragBelt_'+k,geo,rockM[k], [0,0,0],island);
 }
 const capV=[0,4.025,0,...vertices[4].flat()],capI=[];
 for(let i=0;i<count;i++)capI.push(0,1+(i+1)%count,1+i);
 part('MeadowCrown',meshGeo({positions:capV,indices:capI}),grass,[0,0,0],island);
 for(let i=0;i<9;i++){
  const a=i*2.399,r=2.5+(i%3)*0.4;
  const o=part('RimStone_'+i,new THREE.DodecahedronGeometry(0.35+(i%3)*0.13,0),rockM[i%4],[Math.cos(a)*r,3.97,Math.sin(a)*r*0.9],island);o.scale.set(1.3,0.65,1);o.rotation.y=a;
 }
 const crystalCore=gameMaterial(0xe0afff,{metalness:0.1,roughness:0.28,emissive:0xbb62ff,emissiveIntensity:2.3});
 const crystalShade=gameMaterial(0x743bb8,{metalness:0.2,roughness:0.35,emissive:0x7621d1,emissiveIntensity:0.85});
 const gems=group('GlowingPurpleCrystalClusters',[0,0,0],island);
 function shard(n,top,bottom,r,m){
  const delta=new THREE.Vector3(...top).sub(new THREE.Vector3(...bottom)),len=delta.length(),vs=[],ids=[];
  const profiles=[[0,0.01],[0.26,r],[len*0.82,r*0.9],[len,r*0.3]];
  for(const q of profiles)for(let j=0;j<6;j++){const a=j*Math.PI/3;vs.push(Math.cos(a)*q[1],q[0],Math.sin(a)*q[1]);}
  for(let k=0;k<3;k++)for(let j=0;j<6;j++){const a=k*6+j,b=k*6+(j+1)%6;ids.push(a,b,b+6,a,b+6,a+6);}
  for(let j=1;j<5;j++){ids.push(0,j+1,j);ids.push(18,18+j,19+j);}
  const o=part(n,meshGeo({positions:vs,indices:ids}).toNonIndexed(),m,bottom,gems);
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
 }
 for(let i=0;i<7;i++){
  const a=i*2.4,r=2.45+(i%3)*0.26,y=2.95+(i%3)*0.17;
  const top=[Math.cos(a)*r,y,Math.sin(a)*r*0.88];
  const tip=[Math.cos(a)*(r+0.25),y-1.85-(i%3)*0.32,Math.sin(a)*(r+0.25)*0.88];
  shard('AmethystMain_'+i,top,tip,0.25+(i%2)*0.08,crystal);
  for(let j of [-1,1]){
   const b=a+j*0.17,rt=r+0.17;
   shard('AmethystCompanion_'+i+'_'+j,[Math.cos(b)*rt,y-0.02,Math.sin(b)*rt*0.88],
    [Math.cos(b)*(rt+0.24),y-1.12-0.2*(i%2),Math.sin(b)*(rt+0.24)*0.88],0.15,j===1?crystalCore:crystalShade);
  }
 }
 for(let i=0;i<3;i++){
  const a=[0.1,2.8,4.7][i],r=4.6;
  const o=part('DriftingSatellite_'+i,new THREE.DodecahedronGeometry(0.45+i*0.09,0),rockM[1],[Math.cos(a)*r,2.5-i*0.6,Math.sin(a)*r*0.85]);o.scale.set(1,1.4,0.8);o.rotation.set(0.3,i,0.4);
 }
 const tower=group('ObservatoryTower',[P.towerX,0,0]);
 cyl('Foundation',1.4,1.55,0.24,rockM[2],[0,P.ground+0.1,0],tower);
 cyl('MasonryCore',1.03,1.12,3.13,stone,[0,5.73,0],tower);
 for(let row=0;row<7;row++){
  ring('CourseJoint_'+row,1.08,0.016,4.37+row*0.41,darkBrass,tower);
  for(let j=0;j<12;j++){const a=(j+(row%2)*0.5)/12*Math.PI*2;rod('MasonrySeam_'+row+'_'+j,[1.082*Math.cos(a),4.39+row*0.41,1.082*Math.sin(a)],[1.082*Math.cos(a),4.76+row*0.41,1.082*Math.sin(a)],0.009,darkBrass,tower);}
 }
 // Narrow brass-framed windows on the tower.
 for(let i=0;i<4;i++){
  const a=i*Math.PI/2+0.3,g=group('TowerWindow_'+i,[1.085*Math.cos(a),5.65,1.085*Math.sin(a)],tower);g.rotation.y=Math.PI/2-a;
  part('WindowFrame_'+i,new THREE.BoxGeometry(0.36,0.85,0.085),brass,[0,0,0],g);
  part('WindowGlass_'+i,new THREE.BoxGeometry(0.27,0.71,0.095),dark,[0,0,0.008],g);
  rod('WindowMullion_'+i,[0,-0.36,0.065],[0,0.36,0.065],0.018,brass,g);
 }
 const stairs=group('SpiralStaircase',[P.towerX,0,0]);
 const start=-Math.PI/2,stepRise=(P.deck-P.ground)/P.steps;
 for(let i=0;i<P.steps;i++){
  const a=start+i*P.turn/P.steps,b=start+(i+1)*P.turn/P.steps;
  const y=P.ground+i*stepRise;
  sector('StoneTread_'+String(i+1).padStart(2,'0'),1.12,2.03,a,b-0.012,y,0.095,trim,stairs);
  sector('BrassTreadNosing_'+i,1.14,2.025,b-0.04,b-0.015,y+0.096,0.012,darkBrass,stairs);
  const mid=(a+b)/2;
  if(i%2===0)rod('StairBaluster_'+i,[2.01*Math.cos(mid),y+0.1,2.01*Math.sin(mid)],[2.01*Math.cos(mid),y+0.9,2.01*Math.sin(mid)],0.025,brass,stairs);
 }
 let rail=[],stringer=[];
 for(let i=0;i<=168;i++){let f=i/168,a=start+f*P.turn;rail.push([2.01*Math.cos(a),P.ground+f*(P.deck-P.ground)+0.87,2.01*Math.sin(a)]);stringer.push([1.91*Math.cos(a),P.ground+f*(P.deck-P.ground)-0.06,1.91*Math.sin(a)]);}
 curve('ContinuousSpiralHandrail',rail,0.045,brass,stairs);
 curve('SpiralOuterStringer',stringer,0.065,teal,stairs);
 cyl('TerraceCentralDais',1.12,1.12,0.18,trim,[0,P.deck-0.02,0],tower);
 cyl('TerraceDaisSurface',1.12,1.12,0.045,wood,[0,P.deck+0.09,0],tower);
 const exit=start+P.turn;
 for(let k=0;k<20;k++){
  const a=exit+(3.1+Math.PI*2-exit)*k/20,b=exit+(3.1+Math.PI*2-exit)*(k+1)/20;
  sector('TerraceSlabPanel_'+k,1.1,2.12,a,b,P.deck-0.11,0.18,trim,tower);
  sector('TerraceDeckPanel_'+k,1.1,2.05,a,b,P.deck+0.068,0.045,wood,tower);
 }
 const innerRail=[];
 for(let k=0;k<=36;k++){const a=3.1+(exit-3.1)*k/36;innerRail.push([1.1*Math.cos(a),P.deck+0.78,1.1*Math.sin(a)]);if(k%6===0)rod('StairwellDaisPost_'+k,[1.1*Math.cos(a),P.deck+0.12,1.1*Math.sin(a)],[1.1*Math.cos(a),P.deck+0.78,1.1*Math.sin(a)],0.023,brass,tower);}
 curve('StairwellDaisGuard',innerRail,0.035,brass,tower);
 ring('TerraceBrassRim',2.1,0.045,P.deck+0.075,brass,tower);
 // Roof is an open half-dome, leaving the instrument visible from the front.
 const roof=group('OpenObservatoryDome',[0,P.deck+0.18,0],tower);
 const dome=part('PatinatedCopperHalfDome',new THREE.SphereGeometry(1.98,32,16,-Math.PI/2,Math.PI,0,Math.PI/2),teal,[0,0,0],roof);
 dome.material.side=THREE.DoubleSide;
 for(let j=0;j<=8;j++){
  const phi=-Math.PI/2+j*Math.PI/8,pts=[];
  for(let k=0;k<=24;k++){const t=k/24*Math.PI/2;pts.push([-2*Math.cos(phi)*Math.sin(t),2*Math.cos(t),2*Math.sin(phi)*Math.sin(t)]);}
  curve('DomeMeridian_'+j,pts,0.024,brass,roof);
 }
 const rim=[];for(let i=0;i<=48;i++){const a=Math.PI/2+i/48*Math.PI;rim.push([1.99*Math.cos(a),0,1.99*Math.sin(a)]);}curve('DomeLowerRim',rim,0.065,brass,roof);
 cyl('DomeFinialFoot',0.16,0.2,0.12,brass,[0,2.05,0],roof);
 part('DomeFinial',new THREE.SphereGeometry(0.11,12,8),brass,[0,2.2,0],roof);
 // Partial terrace guard, with a gap where the last stair arrives.
 for(let j=0;j<18;j++){
  const a=-1.32+j*2.64/17;if(a> -1.17&&a< -0.78)continue;
  rod('TerraceBaluster_'+j,[2.035*Math.cos(a),P.deck+0.12,2.035*Math.sin(a)],[2.035*Math.cos(a),P.deck+0.69,2.035*Math.sin(a)],0.026,brass,tower);
 }
 for(const interval of [[-1.42,-1.19],[-0.76,1.42]]){const pts=[];for(let k=0;k<=30;k++){const a=interval[0]+(interval[1]-interval[0])*k/30;pts.push([2.035*Math.cos(a),P.deck+0.7,2.035*Math.sin(a)]);}curve('TerraceGuard_'+interval[0],pts,0.042,brass,tower);}
 const telescope=group('BrassTelescope',[0.18,P.deck+0.12,0],tower);
 cyl('AzimuthBase',0.52,0.64,0.13,darkBrass,[0,0.08,0],telescope);
 cyl('AzimuthDial',0.54,0.54,0.08,brass,[0,0.18,0],telescope);
 cyl('TelescopePier',0.18,0.28,0.88,teal,[0,0.64,0],telescope);
 for(let z of [-0.36,0.36]){rod('MountFork_'+z,[0,0.87,z],[0,1.18,z],0.07,brass,telescope);}
 rod('ElevationAxle',[0,1.18,-0.5],[0,1.18,0.5],0.085,darkBrass,telescope);
 const tube=group('TiltingOpticalTube',[0,1.18,0],telescope);tube.rotation.z=0.43;
 function barrel(n,x,len,r1,r2,m){const o=cyl(n,r1,r2,len,m,[x,0,0],tube);o.rotation.z=-Math.PI/2;return o;}
 barrel('BrassMainBarrel',0.14,2.22,0.27,0.21,brass);
 barrel('ForwardDewShield',1.39,0.52,0.36,0.29,brass);
 barrel('ObjectiveDarkRecess',1.654,0.01,0.305,0.305,dark);
 barrel('ObjectiveBlueLens',1.662,0.009,0.26,0.26,glass);
 barrel('RearFocuser',-1.11,0.36,0.13,0.17,darkBrass);
 barrel('Eyepiece',-1.38,0.18,0.095,0.095,brass);
 barrel('Eyecup',-1.49,0.07,0.11,0.11,dark);
 for(let x of [-0.78,0.04,0.79,1.16,1.62]){const o=part('BarrelCollar_'+x,new THREE.TorusGeometry(x>1?0.345:0.27,0.032,8,40),darkBrass,[x,0,0],tube);o.rotation.y=Math.PI/2;}
 rod('FinderBracketA',[-0.3,0.2,0],[-0.3,0.43,0],0.035,brass,tube);
 rod('FinderBracketB',[0.35,0.2,0],[0.35,0.43,0],0.035,brass,tube);
 const finder=cyl('FinderScope',0.075,0.075,0.95,brass,[0.08,0.44,0],tube);finder.rotation.z=-Math.PI/2;
 const wheel=part('ElevationHandwheel',new THREE.TorusGeometry(0.21,0.024,8,32),brass,[0,1.18,0.54],telescope);
 for(let i=0;i<4;i++){const a=i*Math.PI/2;rod('HandwheelSpoke_'+i,[0,1.18,0.54],[Math.cos(a)*0.2,1.18+Math.sin(a)*0.2,0.54],0.016,brass,telescope);}
 // Entrance path, low plant clumps, and warm beacon lanterns.
 for(let i=0;i<7;i++){const a=-Math.PI/2-0.36+i*0.075,r=3.6-i*0.23;const o=cyl('ApproachPaver_'+i,0.3,0.34,0.08,stone,[P.towerX+Math.cos(a)*r,4.07,Math.sin(a)*r]);o.scale.z=0.72;o.rotation.y=a;}
 for(let i=0;i<12;i++){
  const a=i*2.399,r=2.75+(i%3)*0.32;
  for(let j=0;j<3;j++){const o=part('GrassTuft_'+i+'_'+j,new THREE.ConeGeometry(0.09,0.34+j*0.08,4),j%2?moss:grass,[Math.cos(a)*r+j*0.08,4.18,Math.sin(a)*r*0.85]);o.rotation.z=(j-1)*0.3;}
 }
 for(let i=0;i<2;i++){
  const x=1.75,z=i?1.95:-2.05;const g=group('BeaconLantern_'+i,[x,4.07,z]);
  cyl('BeaconFoot_'+i,0.19,0.28,0.12,darkBrass,[0,0.06,0],g);
  rod('BeaconPost_'+i,[0,0.1,0],[0,0.89,0],0.055,brass,g);
  cyl('BeaconLight_'+i,0.12,0.12,0.28,gameMaterial(0xffd68b,{emissive:0xffab45,emissiveIntensity:0.7}),[0,1.02,0],g);
  part('BeaconCap_'+i,new THREE.ConeGeometry(0.23,0.17,8),teal,[0,1.25,0],g);
 }
 // Spring-fed waterfall: a shallow pool joins a continuous fluted curtain.
 const water=gameMaterial(0x42c6df,{metalness:0.15,roughness:0.22,emissive:0x0c556d,emissiveIntensity:0.22});
 const waterLight=gameMaterial(0xa0eeef,{roughness:0.3,emissive:0x398ca3,emissiveIntensity:0.3});
 const foam=gameMaterial(0xe5fcf8,{roughness:0.65,emissive:0x77b5cc,emissiveIntensity:0.2});
 const falls=group('IslandWaterfall');
 const pool=cyl('SpringPool',0.68,0.65,0.055,water,[2.18,4.073,0.65],falls);pool.scale.z=0.7;
 const course=new THREE.CatmullRomCurve3([
  new THREE.Vector3(2.18,4.11,0.65),new THREE.Vector3(2.85,4.105,0.92),
  new THREE.Vector3(3.55,4.1,1.19),new THREE.Vector3(4.03,4.055,1.34),
  new THREE.Vector3(4.37,3.73,1.46),new THREE.Vector3(4.51,2.8,1.51),
  new THREE.Vector3(4.63,1.5,1.55),new THREE.Vector3(4.76,0.15,1.59),
  new THREE.Vector3(4.85,-1.1,1.62)
 ]);
 const side=new THREE.Vector3(-0.316,0,0.949);
 function waterPoint(t,u){const c=course.getPoint(t),tan=course.getTangent(t).normalize();
  const normal=new THREE.Vector3().crossVectors(side,tan).normalize();
  const width=(0.79+0.12*Math.sin(t*Math.PI))*(1-0.43*Math.pow(t,5));
  c.addScaledVector(side,u*width).addScaledVector(normal,0.018*Math.sin(t*52+u*16)+0.012*Math.sin(t*24-u*35));
  return c;
 }
 const wv=[],wi=[],rows=90,cols=12;
 for(let i=0;i<=rows;i++)for(let j=0;j<=cols;j++){wv.push(...waterPoint(i/rows,j/cols-0.5).toArray());}
 for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const a=i*(cols+1)+j,b=a+cols+1;wi.push(a,a+1,b+1,a,b+1,b);}
 water.side=THREE.DoubleSide;
 part('ContinuousWaterCurtain',meshGeo({positions:wv,indices:wi}),water,[0,0,0],falls);
 for(let j=0;j<7;j++){const pts=[];const begin=j%2?0.25:0.06,end=0.89+0.015*(j%4);
  for(let k=0;k<=62;k++){const t=begin+(end-begin)*k/62,p=waterPoint(t,(j-3)*0.136);
   const n=new THREE.Vector3().crossVectors(side,course.getTangent(t)).normalize();p.addScaledVector(n,0.019);pts.push(p.toArray());}
  curve('WhitewaterRibbon_'+j,pts,j%3===0?0.023:0.012,j%3===0?foam:waterLight,falls);
 }
 for(let i=0;i<9;i++){
  const t=0.36+0.045*Math.sin(i*2.3),p=waterPoint(t,(i-4)*0.12);
  const o=part('SpillLipFoam_'+i,new THREE.IcosahedronGeometry(0.065+(i%3)*0.018,1),foam,p.toArray(),falls);o.scale.set(1.2,0.48,1);
 }
 for(let i=0;i<14;i++){
  const t=0.57+(i%7)*0.067,p=waterPoint(t,(i%2?1:-1)*(0.6+0.06*(i%3)));
  p.y-=0.08*(i%3);
  const o=part('WaterfallSprayDroplet_'+i,new THREE.IcosahedronGeometry(0.035+(i%3)*0.015,1),i%3?waterLight:foam,p.toArray(),falls);o.scale.y=1.8;
 }
 for(let i=0;i<6;i++){const a=1.25+i*0.68;
  const o=part('SpringBankStone_'+i,new THREE.DodecahedronGeometry(0.14+(i%2)*0.035,0),rockM[2],[2.18+Math.cos(a)*0.67,4.1,0.65+Math.sin(a)*0.48],falls);o.scale.y=0.65;}
 return root;
}
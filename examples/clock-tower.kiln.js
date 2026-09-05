// Authored by: gpt-6-astra, via codex.
//
// Written by the model itself through the Kiln MCP tools: it wrote the
// program, rendered it, looked at its own six-view contact sheet, and
// revised. Not a line of it is hand-authored.
//
// Dispatched into a clean directory containing only the brief and the Kiln
// skills, with no access to this repository or to any finished example.

const meta = { name: 'ClockTower', category: 'architecture' };
function build() {
  const root=createRoot('ClockTower');
  const stone=gameMaterial(0x9b927f,{roughness:.95}), trim=gameMaterial(0xc7baa0,{roughness:.85}), shadow=gameMaterial(0x242a29), lead=gameMaterial(0x465359,{metalness:.55,roughness:.65}), gold=gameMaterial(0xc7a04e,{metalness:.75,roughness:.35}), wood=gameMaterial(0x493726), bronze=gameMaterial(0x917044,{metalness:.7,roughness:.5});
  let id=0;
  function part(n,g,m,pos,p=root,rot=[0,0,0]){g=g.clone();g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rot[0]*Math.PI/180,rot[1]*Math.PI/180,rot[2]*Math.PI/180)));g.computeBoundingBox();return createPart(n+'_'+id++,g,m,{position:pos,parent:p});}
  function box(n,w,h,d,x,y,z,m=stone,p=root,rot=[0,0,0]){return part(n,boxGeo(w,h,d),m,[x,y,z],p,rot);}
  function beam(n,a,b,r,m,p=root){return beamBetween(n+'_'+id++,a,b,r,m,{segments:4,parent:p});}
  function group(n,p=root){const g=createRoot(n);p.add(g);return g;}
  function prism(n,pts,x,depth,m,p){
    const v=[],idx=[],N=pts.length;
    for(const xx of [x-depth/2,x+depth/2])for(const q of pts)v.push(xx,q[0],q[1]);
    for(let i=1;i<N-1;i++){idx.push(0,i+1,i,N,N+i,N+i+1);}
    for(let i=0;i<N;i++){const j=(i+1)%N;idx.push(i,j,N+j,i,N+j,N+i);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();return part(n,g,m,[0,0,0],p);
  }
  box('GroundPlinth',6.8,.4,6.8,0,.2,0,trim);
  box('BaseMoulding',6.45,.22,6.45,0,.51,0,trim);
  const stages=[{base:.62,height:4.18},{base:4.8,height:4.6},{base:9.4,height:4.6}];
  for(let f=0;f<4;f++){
    const face=group('Facade_'+f);face.rotation.y=f*Math.PI/2;
    for(let s=0;s<3;s++){
      const st=stages[s], rows=8, rh=st.height/rows;
      for(let r=0;r<rows;r++){
        const low=st.base+r*rh, high=low+rh;
        let gap=0;
        if(s===1 && high>5.65 && low<8.9)gap=.72;
        if(s===0 && f===0 && low<3.2)gap=.85;
        const ranges=gap?[[-2.8,-gap],[gap,2.8]]:[[-2.8,0],[0,2.8]];
        for(const range of ranges){const len=range[1]-range[0];for(let b=0;b<1;b++)box('Ashlar',.48,rh-.016,len-.015,2.56,low+rh/2,range[0]+len*(b+.5),stone,face);}
      }
      box('CourseLower',.65,.12,5.95,2.66,st.base+st.height-.05,0,trim,face);
      box('CourseDrip',.77,.15,6.05,2.68,st.base+st.height+.075,0,trim,face);
    }
    // True void through the middle stage, closed to a pointed lancet by spandrels.
    prism('LancetSpandrelL',[[8.02,-.72],[8.95,-.72],[8.95,0]],2.56,.48,stone,face);
    prism('LancetSpandrelR',[[8.02,.72],[8.95,0],[8.95,.72]],2.56,.48,stone,face);
    for(const z of [-.79,.79])box('LancetJamb',.65,2.55,.15,2.64,6.76,z,trim,face);
    for(const side of [-1,1])beam('PointedArchivolt',[2.92,8.04,side*.79],[2.92,9.02,0],.105,trim,face);
    box('LancetSill',.83,.16,1.82,2.66,5.5,0,trim,face);
    box('StoneMullion',.18,2.73,.085,2.6,6.91,0,trim,face);
    box('Transom',.18,.07,1.4,2.6,7.13,0,trim,face);
    if(f===0){
      for(const side of [-1,1])box('DoorJamb',.7,2.55,.2,2.7,1.72,side*.94,trim,face);
      prism('DoorHeadLeft',[[2.4,-.85],[3.3,-.85],[3.3,0]],2.56,.48,stone,face);
      prism('DoorHeadRight',[[2.4,.85],[3.3,0],[3.3,.85]],2.56,.48,stone,face);
      for(const side of [-1,1])beam('DoorArch',[2.95,2.43,side*.95],[2.95,3.38,0],.13,trim,face);
    }
    const clock=group('Clock_'+f,face);clock.position.set(0,11.65,0);
    part('ClockStoneBed',cylinderXGeo(1.68,1.68,.18,20),trim,[2.85,0,0],clock);
    part('ClockDial',cylinderXGeo(1.45,1.45,.12,20),shadow,[2.98,0,0],clock);
    part('OuterMoulding',torusGeo(1.58,.075,4,20),trim,[2.99,0,0],clock,[0,90,0]);
    part('GiltRim',torusGeo(1.4,.035,4,20),gold,[3.065,0,0],clock,[0,90,0]);
    const nums=['XII','I','II','III','IIII','V','VI','VII','VIII','IX','X','XI'];
    for(let k=0;k<12;k++){
      const a=k*Math.PI/6, cy=1.16*Math.cos(a),cz=-1.16*Math.sin(a),str=nums[k];
      for(let j=0;j<str.length;j++){
        const z=cz-(j-(str.length-1)/2)*.095;
        if(str[j]==='I')box('RomanI',.03,.23,.032,3.071,cy,z,gold,clock);
        if(str[j]==='V'){beam('RomanV',[3.071,cy+.115,z-.035],[3.071,cy-.115,z],.016,gold,clock);beam('RomanV',[3.071,cy-.115,z],[3.071,cy+.115,z+.035],.016,gold,clock);}
        if(str[j]==='X'){beam('RomanX',[3.071,cy+.115,z-.035],[3.071,cy-.115,z+.035],.016,gold,clock);beam('RomanX',[3.071,cy-.115,z-.035],[3.071,cy+.115,z+.035],.016,gold,clock);}
      }
    }
    beam('MinuteHand',[3.11,0,0],[3.11,.76,.44],.037,gold,clock);
    beam('HourHand',[3.12,0,0],[3.12,.32,-.56],.052,gold,clock);
    part('HandBoss',cylinderXGeo(.1,.1,.07,12),gold,[3.14,0,0],clock);
    // Open belfry: side louvre banks leave the hanging bell visible in the centre.
    for(const z of [-2.45,2.45])box('BelfryPier',.65,3.05,.7,2.45,15.55,z,stone,face);
    box('BelfryArchitrave',.65,.3,4.4,2.45,16.9,0,trim,face);
    for(const side of [-1,1])for(const edge of [.7,2.03])box('LouvreFrameStile',.38,2.65,.15,2.47,15.4,side*edge,wood,face);
    for(const side of [-1,1])for(let j=0;j<7;j++)box('Louvre',.42,.12,1.22,2.47,14.4+j*.33,side*1.35,lead,face,[0,0,-24]);
    box('ParapetBase',.48,.18,5.65,2.6,17.25,0,trim,face);
    box('ParapetCap',.55,.17,5.75,2.6,18.05,0,trim,face);
    for(let j=-4;j<=4;j++)box('PiercedParapetUpright',.35,.7,.16,2.6,17.66,j*.57,trim,face);
    // Lucarne seated on the sloping lead roof.
    box('LucarneCheek',.78,.82, .85,1.98,19.15,0,lead,face);
    box('LucarneOpening',.045,.59,.5,2.39,19.16,0,shadow,face);
    for(const z of [-.33,.33])box('LucarneJamb',.14,.75,.1,2.42,19.16,z,trim,face);
    prism('LucarneGable',[[19.53,-.49],[20.15,0],[19.53,.49]],2.15,.7,lead,face);
    for(const side of [-1,1])beam('LucarneVerge',[2.52,19.5,side*.49],[2.52,20.17,0],.065,trim,face);
  }
  for(let s=0;s<3;s++)for(const x of [-1,1])for(const z of [-1,1]){
    const st=stages[s], width=1.05-s*.19, y=st.base+st.height/2;
    box('ClaspButtressX',width,st.height,.67,x*(2.8+width/2-.28),y,z*2.46);
    box('ClaspButtressZ',.67,st.height,width,x*2.46,y,z*(2.8+width/2-.28));
    box('ButtressWeathering',width+.12,.2,width+.12,x*2.89,st.base+st.height-.03,z*2.89,trim);
  }
  box('GroundFloor',5.15,.14,5.15,0,.47,0,shadow);
  for(const y of [4.78,9.38,14.05])box('FloorDeck',5.1,.16,5.1,0,y,0,wood);
  const bell=group('BellAndTimberFrame');
  for(const z of [-1.15,1.15])box('BellFramePost',.24,2.6,.25,0,15.43,z,wood,bell);
  box('BellHeadstock',.42,.32,2.8,0,16.52,0,wood,bell);
  for(const z of [-1,1])beam('TimberBrace',[0,15.45,z*1.15],[0,16.36,z*.45],.1,wood,bell);
  part('BronzeBell',lathe([[.66,0],[.81,.08],[.8,.19],[.57,.34],[.4,.77],[.33,1.08],[.18,1.19],[.12,1.2],[.12,1.07],[.27,.99],[.33,.69],[.49,.26],[.68,.13],[.66,0]],20),bronze,[0,14.78,0],bell);
  beam('BellHanger',[0,15.92,0],[0,16.53,0],.07,bronze,bell);
  beam('ClapperStem',[0,15.38,0],[0,14.72,0],.045,shadow,bell);
  part('Clapper',sphereGeo(.12,8,6),bronze,[0,14.71,0],bell);
  box('RoofCornice',5.9,.25,5.9,0,17.12,0,trim);
  const roof=group('Roof');
  part('LeadSpire',coneGeo(3.65,7.2,4),lead,[0,20.85,0],roof,[0,45,0]);
  for(let f=0;f<4;f++){
    const seams=group('LeadSeams_'+f,roof);seams.rotation.y=f*Math.PI/2;
    for(const z of [-1.8,-.9,0,.9,1.8])beam('StandingLeadSeam',[2.585,17.28,z],[.025,24.43,z*.009],.022,lead,seams);
    for(const y of [18.6,20.2,21.8,23.4]){const w=(24.45-y)*2.581/7.2;beam('LeadPanelJoint',[w+.014,y,-w],[w+.014,y,w],.018,lead,seams);}
  }
  for(const x of [-1,1])for(const z of [-1,1]){
    box('PinnaclePedestal',.63,.95,.63,x*2.63,17.81,z*2.63,trim);
    part('PinnacleSpire',coneGeo(.48,1.7,4),trim,[x*2.63,19.12,z*2.63],root,[0,45,0]);
    for(let level=0;level<3;level++)for(const side of [-1,1]){
      const y=18.57+level*.4,offset=.28-level*.07;
      part('PinnacleCrocket',coneGeo(.115,.25,4),trim,[x*2.63+side*offset,y,z*2.63],root,[0,0,-side*35]);
      part('PinnacleCrocket',coneGeo(.115,.25,4),trim,[x*2.63,y,z*2.63+side*offset],root,[side*35,0,0]);
    }
    part('PinnacleFinial',sphereGeo(.085,6,4),trim,[x*2.63,19.99,z*2.63]);
  }
  beam('VaneMast',[0,24.35,0],[0,25.6,0],.04,gold);
  beam('VaneArrow',[0,25.12,-.7],[0,25.12,.75],.035,gold);
  prism('VaneFlag',[[25.12,-.12],[25.42,-.6],[25.12,-.6]],0,.05,gold,root);
  prism('ArrowHead',[[25.12,.87],[25.25,.6],[24.99,.6]],0,.05,gold,root);
  return root;
}



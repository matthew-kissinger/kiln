const meta = { name: 'NOCTILUS - Nuclear Submarine', category: 'vehicle', role: 'vehicle' };
const P = { hullY: 3.15, showCradle: true, hullSegments: 128, radialSegments: 64 };
async function build() {
 const root=createRoot('NOCTILUS');
 const sub=createPivot('Submarine',[0,0,0],root);
 const navy=gameMaterial(0x11283f,{metalness:0.55,roughness:0.3,flatShading:false});
 const sailmat=gameMaterial(0x19354c,{metalness:0.5,roughness:0.32,flatShading:false});
 const dark=gameMaterial(0x07131e,{metalness:0.25,roughness:0.5,flatShading:false});
 const seam=gameMaterial(0x253e50,{metalness:0.45,roughness:0.4,flatShading:false});
 const brass=gameMaterial(0xbc914a,{metalness:0.82,roughness:0.25,flatShading:false});
 const steel=gameMaterial(0x7b909a,{metalness:0.8,roughness:0.26,flatShading:false});
 const glass=gameMaterial(0x387486,{metalness:0.65,roughness:0.13,flatShading:false});
 const ivory=gameMaterial(0xd3cfb4,{metalness:0.2,roughness:0.5});
 const add=(n,g,m,pos=[0,0,0],rot=[0,0,0],parent=sub)=>createPart(n,g,m,{position:pos,rotation:rot,parent});
 const stations=[[-12,0.17],[-11,0.36],[-9.5,0.8],[-7.5,1.38],[-5,1.85],[-2,2.1],[2,2.2],[6,2.18],[9,2.02],[11,1.64],[12.5,1.03],[13.25,0.44],[13.45,0]];
 const curve=new THREE.CatmullRomCurve3(stations.map(s=>new THREE.Vector3(s[1],s[0],0)),false,'centripetal');
 const points=curve.getPoints(P.hullSegments).map(v=>new THREE.Vector2(Math.max(0,v.x),v.y));
 add('Midnight_Teardrop_Hull',new THREE.LatheGeometry(points,P.radialSegments),navy,[0,P.hullY,0],[0,0,-90]);
 function radius(x) { for(let i=0;i<points.length-1;i++) if(x>=points[i].y&&x<=points[i+1].y){let t=(x-points[i].y)/(points[i+1].y-points[i].y);return points[i].x*(1-t)+points[i+1].x*t;} return 0.2; }
 function line(n,pts,r,mat,parent=sub){const c=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));return add(n,new THREE.TubeGeometry(c,Math.max(8,pts.length*3),r,5,false),mat,[0,0,0],[0,0,0],parent);}
 for(const x of [-9.4,-5.4,0,6.8,10.7])add('Hull_Circumferential_Seam_'+x,new THREE.TorusGeometry(radius(x)+0.003,0.012,5,64),seam,[x,P.hullY,0],[0,90,0]);
 for(const a of [-0.62,0.62,2.35,3.93]){
  let pts=[];for(let x=-9;x<=10;x+=0.5){let r=radius(x)+0.004;pts.push([x,P.hullY+r*Math.cos(a),r*Math.sin(a)]);}
  line('Longitudinal_Panel_Seam_'+a,pts,0.009,seam);
 }
 // Blended, swept sail: matching airfoil sections preserve a soft rounded leading edge.
 const sail=createPivot('Sail_Assembly',[0,0,0],sub);
 function foil(cx,len,width){let p=[];for(let i=0;i<48;i++){let a=i/48*Math.PI*2;p.push([cx+len*0.5*Math.cos(a),width*0.5*Math.sin(a)*(0.88+0.12*Math.cos(a))]);}return p;}
 const sailSections=[
 [4.85,2.15,5.5,1.65],[5.35,2.1,4.8,1.25],[5.7,2.04,4.6,1.11],
 [7.9,1.68,4.02,0.98],[8.32,1.55,3.76,0.91],[8.44,1.54,3.55,0.82]];
 add('Streamlined_Sail',loftProfiles(sailSections.map(s=>({profile:foil(s[1],s[2],s[3]),frame:{origin:[0,s[0],0]}}))),sailmat,[0,0,0],[0,0,0],sail);
 add('Sail_Crown',loftProfiles([{profile:foil(1.54,3.55,0.83),frame:{origin:[0,8.43,0]}},{profile:foil(1.52,3.41,0.76),frame:{origin:[0,8.51,0]}}]),dark,[0,0,0],[0,0,0],sail);
 for(const side of [-1,1]){
  for(let i=0;i<6;i++)add('Sail_Vent_'+side+'_'+i,await roundedBoxGeo(0.13,0.36,0.025,0.012),dark,[0.65+i*0.25,6.02,side*0.515],[0,0,0],sail);
  line('Sail_Service_Panel_'+side,[[0.12,6.55,side*0.44],[0.03,7.58,side*0.43],[0.87,7.75,side*0.46],[0.98,6.55,side*0.49],[0.12,6.55,side*0.44]],0.012,seam,sail);
  add('Sail_Ivory_Insignia_'+side,await roundedBoxGeo(0.7,0.09,0.025,0.009),ivory,[2.02,7.43,side*0.467],[0,0,0],sail);
  add('Sail_Brass_Badge_'+side,cylinderGeo(0.105,0.105,0.026,24),brass,[2.61,7.43,side*0.41],[90,0,0],sail);
 }
 // Stretch the sail shell 40% about its original foot; carry the masts upward without stretching them.
 const sailHeightFactor=1.4, sailFootY=4.85;
 const mastRise=(8.51-sailFootY)*(sailHeightFactor-1);
 const shellParts=sail.children.slice();
 const tallShell=createPivot('Tall_Sail_Shell',[0,sailFootY*(1-sailHeightFactor),0],sail);
 tallShell.scale.y=sailHeightFactor;
 shellParts.forEach(part=>tallShell.add(part));
 const polishedBrass=gameMaterial(0xc79b50,{metalness:0.92,roughness:0.14,flatShading:false});
 const masts=[{x:2.45,h:2.65,r:0.075},{x:1.55,h:2.1,r:0.10},{x:0.62,h:1.48,r:0.135}];
 for(let i=0;i<masts.length;i++){
  const m=masts[i],bottom=8.49+mastRise;
  add('Mast_Deck_Boot_'+i,cylinderGeo(m.r*1.7,m.r*2,0.16,24),dark,[m.x,bottom+0.05,0],[0,0,0],sail);
  add('Polished_Brass_Mast_Base_Collar_'+i,cylinderGeo(m.r*1.75,m.r*1.95,0.23,40),polishedBrass,[m.x,bottom+0.22,0],[0,0,0],sail);
  add('Polished_Brass_Collar_Flange_'+i,cylinderGeo(m.r*2.12,m.r*2.12,0.055,40),polishedBrass,[m.x,bottom+0.135,0],[0,0,0],sail);
  add('Raised_Sensor_Mast_'+i,cylinderGeo(m.r,m.r,m.h,20),steel,[m.x,bottom+m.h/2,0],[0,0,0],sail);
  add('Mast_Brass_Collar_'+i,cylinderGeo(m.r*1.3,m.r*1.3,0.09,24),brass,[m.x,bottom+m.h*0.52,0],[0,0,0],sail);
  if(i<2){
   add('Periscope_Elbow_'+i,await roundedBoxGeo(0.35,0.2,0.19,0.07),navy,[m.x+0.09,bottom+m.h,0],[0,0,0],sail);
   add('Periscope_Lens_'+i,cylinderGeo(0.065,0.065,0.015,20),glass,[m.x+0.274,bottom+m.h,0],[0,0,90],sail);
  }else{
   add('Electronic_Sensor_Head',await roundedBoxGeo(0.32,0.64,0.32,0.08),navy,[m.x,bottom+m.h,0],[0,0,0],sail);
   add('Electronic_Sensor_Band',await roundedBoxGeo(0.325,0.13,0.325,0.055),glass,[m.x,bottom+m.h+0.08,0],[0,0,0],sail);
  }
 }
 // Airfoil planes along local Y, rotated into each radial direction.
 function plane(name,x,rStart,rEnd,chord,tipChord,angle){
  const prof=(c,t)=>{let p=[];for(let i=0;i<24;i++){let a=i/24*Math.PI*2;p.push([c/2*Math.cos(a),t/2*Math.sin(a)]);}return p;};
  const g=loftProfiles([
   {profile:prof(chord,0.24),frame:{origin:[x,rStart,0]}},
   {profile:prof(chord*0.82,0.18),frame:{origin:[x-0.25,rStart+(rEnd-rStart)*0.64,0]}},
   {profile:prof(tipChord,0.065),frame:{origin:[x-0.57,rEnd,0]}}
  ]);
  add(name,g,navy,[0,P.hullY,0],[angle,0,0]);
  const rad=angle*Math.PI/180;
  line(name+'_Control_Hinge',[[x-chord*0.3,P.hullY+(rStart+0.12)*Math.cos(rad),(rStart+0.12)*Math.sin(rad)],[x-0.57-tipChord*0.22,P.hullY+(rEnd-0.1)*Math.cos(rad),(rEnd-0.1)*Math.sin(rad)]],0.012,seam);
 }
 plane('Port_Bow_Diving_Plane',7.1,1.8,3.55,2.1,0.86,-90);
 plane('Starboard_Bow_Diving_Plane',7.1,1.8,3.55,2.1,0.86,90);
 for(let i=0;i<4;i++)plane('Cruciform_Stern_Plane_'+i,-9.3,0.36,i===2?2.62:2.92,2.7,1.05,i*90);
 // Flush dorsal equipment, carefully spaced instead of surface clutter.
 for(const x of [-4.7,-1.7,7.7]){
  const y=P.hullY+radius(x);
  add('Hatch_Recess_'+x,cylinderGeo(0.43,0.43,0.035,40),dark,[x,y+0.012,0]);
  add('Hatch_Cover_'+x,cylinderGeo(0.355,0.355,0.055,40),sailmat,[x,y+0.04,0]);
  add('Hatch_Center_'+x,cylinderGeo(0.105,0.105,0.023,24),brass,[x,y+0.082,0]);
  for(const side of [-1,1])add('Hatch_Hinge_'+x+'_'+side,await roundedBoxGeo(0.16,0.08,0.12,0.025),steel,[x+0.3,y+0.05,side*0.2]);
 }
 for(let i=0;i<10;i++)for(const side of [-1,1]){
  const x=-6.7+i*0.38,r=radius(x);
  add('Aft_Deck_FreeFlood_Vent_'+side+'_'+i,await roundedBoxGeo(0.21,0.035,0.1,0.015),dark,[x,P.hullY+r*0.966+0.015,side*r*0.259],[side*15,0,0]);
 }
 // Swept seven-blade propeller, separate hierarchy.
 const prop=createPivot('Brass_Propeller',[-12.43,P.hullY,0],sub);
 add('Propeller_Shaft',cylinderGeo(0.14,0.14,0.88,32),steel,[-12.16,P.hullY,0],[0,0,90]);
 add('Propeller_Hub',cylinderGeo(0.28,0.17,0.7,40),brass,[0,0,0],[0,0,90],prop);
 for(let b=0;b<7;b++){
  const sections=[[0.2,0,0,0.3],[0.53,-0.03,0.12,0.65],[1.02,-0.14,0.38,0.84],[1.48,-0.31,0.63,0.64],[1.71,-0.36,0.69,0.16]];
  const profiles=sections.map(s=>{const p=[];for(let j=0;j<20;j++){const a=j/20*Math.PI*2;const chord=s[3]*0.5*Math.cos(a);p.push([s[1]+chord*0.48+0.035*Math.sin(a),s[2]+chord]);}return {profile:p,frame:{origin:[0,s[0],0]}};});
  add('Swept_Brass_Blade_'+b,loftProfiles(profiles),brass,[0,0,0],[b*360/7,0,0],prop);
 }
 add('Propeller_Aft_Cap',new THREE.SphereGeometry(0.19,24,16),brass,[-0.36,0,0],[0,0,0],prop);
 if(P.showCradle){
  const stand=createPivot('Removable_Display_Cradle',[0,0,0],root);
  const base=gameMaterial(0x17212a,{metalness:0.5,roughness:0.33,flatShading:false});
  const rubber=gameMaterial(0x0a1016,{roughness:0.85,flatShading:false});
  add('Cradle_Plinth',await roundedBoxGeo(18,0.22,5.4,0.1),base,[0,0.11,0],[0,0,0],stand);
  for(const x of [-5,5]){
   add('Cradle_Foot_'+x,await roundedBoxGeo(0.85,0.24,4.3,0.1),base,[x,0.32,0],[0,0,0],stand);
   const r=radius(x);
   for(const side of [-1,1]){
    const z=side*r*0.62,top=P.hullY-r*Math.sqrt(1-0.62*0.62);
    add('Cradle_Support_'+x+'_'+side,await roundedBoxGeo(0.55,top-0.42,0.55,0.07),base,[x,(top+0.42)/2,z],[0,0,0],stand);
    add('Cradle_Rubber_Pad_'+x+'_'+side,await roundedBoxGeo(0.72,0.12,0.56,0.04),rubber,[x,top,z],[side*-38,0,0],stand);
    add('Cradle_Brass_Fastener_'+x+'_'+side,cylinderGeo(0.085,0.085,0.025,20),brass,[x,0.455,side*1.9],[0,0,0],stand);
   }
  }
  add('Cradle_Nameplate',await roundedBoxGeo(2.8,0.025,0.46,0.012),brass,[0,0.233,2.08],[0,0,0],stand);
  for(let i=0;i<5;i++)add('Nameplate_Engraving_'+i,await roundedBoxGeo(0.08+i*0.035,0.009,0.18,0.004),dark,[-0.5+i*0.25,0.25,2.08],[0,0,0],stand);
 }
 root.traverse(node=>{if(node.isMesh && node.geometry.getAttribute('normal')) node.geometry.normalizeNormals();});
 return root;
}
const meta = {name:'ARGENT CV-72 Aircraft Carrier',category:'vehicle',role:'vehicle'};
function build(){
 const root=createRoot('ARGENT_CV72');
 const D={deckY:4.65,length:34};
 const navy=gameMaterial(0x263f54,{roughness:.5,metalness:.35});
 const steel=gameMaterial(0x748892,{roughness:.48,metalness:.45});
 const light=gameMaterial(0xb3c1c7,{roughness:.55,metalness:.25});
 const dark=gameMaterial(0x171e25,{roughness:.83});
 const deckMat=gameMaterial(0x343b40,{roughness:.9});
 const white=gameMaterial(0xf2edce,{roughness:.7});
 const yellow=gameMaterial(0xe4b444,{roughness:.65});
 const red=gameMaterial(0xa44337,{roughness:.7});
 const glass=gameMaterial(0x123741,{roughness:.2,metalness:.55});
 const orange=gameMaterial(0xf57c22,{roughness:.6});
 function group(n,p=[0,0,0],parent=root){return createPivot(n,p,parent);}
 function box(n,w,h,d,x,y,z,m=steel,p=root,rot=[0,0,0]){return createPart(n,boxGeo(w,h,d),m,{position:[x,y,z],parent:p,rotation:rot});}
 function cyl(n,r,h,x,y,z,m=steel,p=root,rot=[0,0,0],r2=r){return createPart(n,cylinderGeo(r,r2,h,16),m,{position:[x,y,z],parent:p,rotation:rot});}
 function poly(n,pts,y,h,m,p=root){return createPart(n,loftProfiles([{profile:pts,frame:{origin:[0,y,0]}},{profile:pts,frame:{origin:[0,y+h,0]}}]),m,{parent:p});}
 function rod(n,a,b,r,m=steel,p=root){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b);const mesh=createPart(n,cylinderGeo(r,r,av.distanceTo(bv),8),m,{parent:p});mesh.position.copy(av.add(bv).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(...b).sub(new THREE.Vector3(...a)).normalize());return mesh;}
 function line(n,x1,z1,x2,z2,w,m=white,y=4.846,p=root){let dx=x2-x1,dz=z2-z1;return box(n,Math.hypot(dx,dz),.012,w,(x1+x2)/2,y,(z1+z2)/2,m,p,[0,-Math.atan2(dz,dx)*180/Math.PI,0]);}
 const outline=[[-16,-2.65],[-12,-3.35],[7,-3.6],[12,-2.9],[15,-1.6],[16.7,0],[15,1.6],[12,2.9],[7,3.6],[-12,3.35],[-16,2.65]];
 const profiles=[{y:.15,sx:.9,sz:.54},{y:.6,sx:.97,sz:.75},{y:1.5,sx:1,sz:.9},{y:3.7,sx:1,sz:1},{y:4.55,sx:1,sz:1.01}];
 createPart('SculptedHull',loftProfiles(profiles.map(s=>({profile:outline.map(q=>[q[0]*s.sx,q[1]*s.sz]),frame:{origin:[0,s.y,0]}}))),navy,{parent:root});
 createPart('RedLowerHull',loftProfiles([{profile:outline.map(q=>[q[0]*.895,q[1]*.535]),frame:{origin:[0,.13,0]}},{profile:outline.map(q=>[q[0]*.97,q[1]*.755]),frame:{origin:[0,.63,0]}}]),red,{parent:root});
 const dp=[[-16.6,-4.35],[-13,-4.7],[-5,-5.6],[7,-5.6],[10.8,-3.9],[15.7,-3.4],[17.1,-1.4],[17.1,1.4],[15.7,3.4],[7,4.1],[-8,4.1],[-16.6,3.55]];
 poly('FlightDeckRim',dp,4.5,.22,steel);poly('FlightDeck',dp.map(q=>[q[0]*.995,q[1]*.995]),4.72,.11,deckMat);
 // Deliberately uncluttered landing lane angled away from starboard island.
 const lane={ax:-15.8,az:-.15,bx:9,bz:-3.65};
 for(const s of [-1,1])line('LandingLaneBoundary'+s,lane.ax,lane.az+s*1.05,lane.bx,lane.bz+s*1.05,.07);
 for(let i=0;i<15;i++){const t=i/15;let x=lane.ax+(lane.bx-lane.ax)*t,z=lane.az+(lane.bz-lane.az)*t;line('LandingCenterDash'+i,x,z,x+.7,z-.099,.10);}
 for(let i=0;i<4;i++){const x=-13+i*.85,z=lane.az+(x-lane.ax)*(lane.bz-lane.az)/(lane.bx-lane.ax);line('ArrestingCable'+i,x,z-1.0,x+.24,z+1.0,.035,steel,4.862);}
 for(const z of [-1.5,.8]){
 line('BowCatapultRail'+z,4,z,15.8,z,.075,steel);
 line('CatapultYellowGuide'+z,4,z+.18,15.3,z+.18,.04,yellow);
 box('CatapultShuttle'+z,.45,.04,.25,5,4.87,z,light);
 for(let i=0;i<4;i++)box('BowThreshold'+z+'_'+i,.7,.015,.12,15.25,4.849,z-.4+i*.25,white);
 }
 // Deck perimeter painted edge segments.
 for(let i=0;i<dp.length;i++){let a=dp[i],b=dp[(i+1)%dp.length];line('DeckEdgePaint'+i,a[0]*.98,a[1]*.97,b[0]*.98,b[1]*.97,.055,yellow);}
 // Flush deck lifts, recessed tracks, painted hazard corners.
 function lift(n,x,z,w,d){
  const g=group(n);
  box('LiftRecess',w+.18,.025,d+.18,x,4.837,z,dark,g);
  box('LiftSurface',w,.03,d,x,4.85,z,steel,g);
  for(const s of [-1,1]){line('LiftLongEdge'+s,x-w/2,z+s*d/2,x+w/2,z+s*d/2,.055,yellow,4.871,g);line('LiftShortEdge'+s,x+s*w/2,z-d/2,x+s*w/2,z+d/2,.055,yellow,4.871,g);}
  for(let i=0;i<6;i++)box('LiftPanelJoint'+i,.015,.012,d-.2,x-w/2+.2+i*(w-.4)/5,4.874,z,navy,g);
 }
 lift('AftStarboardAircraftElevator',-10.9,2.65,3.3,2.35);
 lift('ForwardStarboardAircraftElevator',7,2.8,2.8,2.0);
 lift('PortAircraftElevator',-5.5,-4.3,3.1,2.0);
 // Structural galleries and hull detail, leaving the pointed bow clear.
 for(const s of [-1,1]){
  for(let i=0;i<7;i++){let x=-13+i*3.5;
   box('Gallery_'+s+'_'+i,2.8,.14,.57,x,3.58,s*3.63,steel);
   box('GalleryShadow_'+s+'_'+i,2.65,.25,.07,x,3.86,s*3.46,dark);
   for(let j=0;j<4;j++)box('GalleryUpright_'+s+'_'+i+'_'+j,.06,.48,.08,x-1.15+j*.77,3.87,s*3.94,steel);
   rod('GalleryRailing_'+s+'_'+i,[x-1.4,4.1,s*3.94],[x+1.4,4.1,s*3.94],.025,light);
   poly('DeckBracket_'+s+'_'+i,[[x-.35,s*3.4],[x+.35,s*3.4],[x+.35,s*4.1]],3.12,.32,navy);
  }
  for(let i=0;i<13;i++){let x=-13+i*2.0;box('HullPanelSeam'+s+'_'+i,.022,1.45,.025,x,2.48,s*(Math.abs(x)>12?3.32:3.56),steel);}
  for(let i=0;i<8;i++)box('HullVent'+s+'_'+i,.48,.19,.025,-10+i*2.55,3.02,s*3.57,dark);
  for(let i=0;i<3;i++){let x=-9+i*6.5;box('LiferaftRack'+s+'_'+i,1.6,.12,.55,x,3.05,s*3.68,steel);for(let j=0;j<3;j++)cyl('LiferaftCanister'+s+'_'+i+'_'+j,.15,.45,x-.5+j*.5,3.23,s*3.75,light,root,[90,0,0]);}
 }
 // Hangar apertures at stern.
 for(const z of [-1.25,1.25]){box('SternHangarOpening'+z,.04,1.4,1.85,-16.015,3.2,z,dark);for(let i=0;i<6;i++)box('HangarShutterSlat'+z+'_'+i,.05,.075,1.7,-16.05,3.77-i*.12,z,steel);}
 box('SternServicePlatform',.8,.12,5,-16.3,2.36,0,steel);
 // Island superstructure.
 const island=group('Island',[0,4.84,2.7]);
 poly('IslandFoundation',[[-4,-.8],[2.8,-.8],[3.5,-.4],[3.5,.6],[-4,.6]],0,.65,navy,island);
 poly('IslandMainTower',[[-3.3,-.6],[2.5,-.6],[2.8,0],[2.4,.65],[-3.3,.65]],.65,1.65,steel,island);
 poly('IslandOrangeRecognitionBand',[[-3.32,-.62],[2.512,-.62],[2.825,0],[2.412,.67],[-3.32,.67]],1.65,.32,orange,island);
 poly('NavigationBridge',[[-1.8,-.85],[2.85,-.85],[3.25,-.4],[3.25,.65],[2.6,.95],[-1.8,.95]],2.1,.72,light,island);
 for(let i=0;i<9;i++)box('PortBridgeWindow'+i,.38,.3,.025,-1.5+i*.49,2.48,-.866,glass,island);
 for(let i=0;i<4;i++)box('ForwardBridgeWindow'+i,.025,.3,.23,3.262,2.48,-.29+i*.27,glass,island);
 for(let i=0;i<8;i++)box('StarboardBridgeWindow'+i,.38,.3,.025,-1.5+i*.5,2.48,.961,glass,island);
 poly('BridgeRoof',[[-1.94,-.99],[2.95,-.99],[3.42,-.44],[3.42,.73],[2.7,1.09],[-1.94,1.09]],2.83,.14,steel,island);
 box('UpperControlCabin',2.2,.65,1.2,.1,3.29,0,navy,island);
 for(let i=0;i<4;i++)box('UpperControlGlass'+i,.4,.29,.03,-.66+i*.51,3.34,-.614,glass,island);
 box('UpperControlRoof',2.45,.12,1.4,.1,3.66,0,light,island);
 box('ExhaustTrunk',1.2,1.2,1.0,-2.4,2.77,.02,navy,island);
 for(let i=0;i<5;i++)box('ExhaustGrille'+i,.075,.025,.85,-2.83+i*.21,3.38,.02,dark,island);
 const mast=group('MainRadarMast',[.1,3.73,0],island);
 for(const s of [-1,1])rod('MastLeg'+s,[-.42,0,s*.4],[0,2.8,s*.09],.065,steel,mast);
 for(let i=0;i<4;i++){let y=.35+i*.55;rod('MastCrossBrace'+i,[-.36,y,-.35],[0,y+.5,.25],.028,light,mast);}
 box('RadarPlatform',1.75,.09,1.35,0,1.9,0,steel,mast);
 cyl('RadarSpindle',.09,.55,0,2.18,0,steel,mast);
 box('LongRangeRadarArray',2.2,.72,.13,0,2.56,0,navy,mast,[0,22,0]);
 for(let i=0;i<8;i++)box('RadarArrayRib'+i,.025,.6,.04,-.93+i*.266,2.56,-.09,light,mast,[0,22,0]);
 cyl('TopAntenna',.025,1.05,0,3.08,0,light,mast);
 cyl('AftSensorMast',.065,2.6,-2.45,4.65,0,steel,island);
 box('AftSearchRadar',1.2,.34,.2,-2.45,5.96,0,light,island);
 for(const x of [-1.3,1.6]){cyl('CommsPedestal'+x,.14,.35,x,3.14,.54,steel,island);createPart('CommsRadome'+x,sphereGeo(.27,16,12),white,{position:[x,3.48,.54],parent:island});}
 // Small exterior ladders and access doors on tower.
 for(let i=0;i<10;i++)rod('IslandLadderRung'+i,[-3.32,.24+i*.23,-.65],[-2.98,.24+i*.23,-.65],.018,light,island);
 for(const x of [-3.32,-2.98])rod('IslandLadderRail'+x,[x,.1,-.65],[x,2.44,-.65],.025,light,island);
 box('IslandAccessDoor',.39,.68,.025,-1.6,.99,-.615,dark,island);
 // Four individually grouped twin-tail deck fighters; +X nose.
 function jet(n,x,z,angle){
  const j=group(n,[x,4.83,z]);j.rotation.y=angle*Math.PI/180;
  createPart('AerodynamicFuselage',loftProfiles([
   {profile:[[-.13,-.13],[.13,-.13],[.13,.13],[-.13,.13]],frame:{origin:[-1.1,.43,0],rotation:[0,0,-90]}},
   {profile:[[-.21,-.24],[.21,-.24],[.21,.24],[-.21,.24]],frame:{origin:[-.45,.43,0],rotation:[0,0,-90]}},
   {profile:[[-.13,-.19],[.13,-.19],[.13,.19],[-.13,.19]],frame:{origin:[.65,.43,0],rotation:[0,0,-90]}},
   {profile:[[-.015,-.025],[.015,-.025],[.015,.025],[-.015,.025]],frame:{origin:[1.35,.43,0],rotation:[0,0,-90]}}
  ]),orange,{parent:j});
  for(const s of [-1,1]){
   poly('SweptWing'+s,[[-.85,s*.16],[.4,s*.16],[-.44,s*1.07],[-.97,s*1.02]],.42,.055,orange,j);
   poly('Tailplane'+s,[[-1.12,s*.14],[-.62,s*.15],[-.95,s*.59],[-1.3,s*.54]],.48,.045,orange,j);
   // Swept, outward-canted twin stabilizers.
   const fg=new THREE.BufferGeometry();
   const v=[-1.09,.49,s*.20,-.57,.49,s*.20,-.90,1.04,s*.34,-1.12,1.04,s*.34];
   fg.setAttribute('position',new THREE.Float32BufferAttribute(v,3));fg.setIndex([0,1,2,0,2,3,2,1,0,3,2,0]);fg.computeVertexNormals();createPart('VerticalStabilizer'+s,fg,orange,{parent:j});
   cyl('EngineNozzle'+s,.102,.23,-1.11,.43,s*.13,dark,j,[0,0,90]);
   box('Intake'+s,.31,.14,.13,.03,.42,s*.23,dark,j);
   rod('MainLandingStrut'+s,[-.55,.12,s*.43],[-.55,.40,s*.43],.025,steel,j);
   cyl('MainWheel'+s,.10,.08,-.55,.1,s*.43,dark,j,[90,0,0]);
   box('WingOrangeTip'+s,.21,.012,.14,-.80,.486,s*.94,orange,j);
  }
  const canopy=createPart('SmokedCockpitCanopy',sphereGeo(1,16,10),glass,{position:[.53,.61,0],scale:[.43,.17,.145],parent:j});
  rod('NoseLandingStrut',[.77,.10,0],[.77,.37,0],.024,steel,j);
  cyl('NoseWheel',.08,.07,.77,.08,0,dark,j,[90,0,0]);
  box('CanopySpine',.025,.015,.29,.36,.73,0,orange,j);
  return j;
 }
 jet('Falcon_01',-13.2,2.15,-10);
 jet('Falcon_02',-8,2.0,-12);
 jet('Falcon_03',10.6,2.0,0);
 jet('Falcon_04',-1.0,-4.34,180);
 // Deck service tug beside island.
 const tug=group('DeckTractor',[-5.4,4.83,2.1]);box('TugBody',.9,.22,.55,0,.23,0,yellow,tug);box('TugCab',.35,.28,.46,-.2,.48,0,yellow,tug);box('TugWindow',.02,.18,.34,-.01,.49,0,glass,tug);
 for(const x of [-.3,.3])for(const z of [-.29,.29])cyl('TugWheel'+x+'_'+z,.13,.10,x,.13,z,dark,tug,[90,0,0]);
 // Deck tie-down sockets and stern approach lamps.
 for(let x=-14;x<14;x+=2)for(const z of [-3.3,1.1,3.3]){if(z===3.3&&x>-5&&x<5)continue;cyl('DeckTieDown'+x+'_'+z,.042,.014,x,4.848,z,light);}
 for(let i=0;i<7;i++)box('SternApproachLamp'+i,.09,.05,.12,-16.49,4.845,-1.0+i*.32,i%2?yellow:white);
 return root;
}
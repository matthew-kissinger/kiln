const meta = { name: 'Kestrel R-7 rescue tiltcraft', category: 'vehicle', role: 'vehicle' };
const STATIONS = [[-3.25,1.72,.035,.035],[-2.7,1.62,.25,.28],[-1.75,1.51,.57,.63],[-.65,1.52,.77,.86],[.65,1.54,.82,.89],[1.6,1.5,.71,.77],[2.45,1.35,.45,.56],[2.95,1.22,.19,.29],[3.12,1.22,.035,.045]];
function section(t) {
 const u=t*(STATIONS.length-1), i=Math.min(STATIONS.length-2,Math.floor(u)), f=u-i;
 return STATIONS[0].map((_,k)=>{const a=STATIONS[Math.max(0,i-1)][k],b=STATIONS[i][k],c=STATIONS[i+1][k],d=STATIONS[Math.min(STATIONS.length-1,i+2)][k];return .5*((2*b)+(-a+c)*f+(2*a-5*b+4*c-d)*f*f+(-a+3*b-3*c+d)*f*f*f);});
}
function hullPoint(t,a,offset=0) {const s=section(t);return [s[0],s[1]+(s[2]+offset)*Math.cos(a),(s[3]+offset)*Math.sin(a)];}
function skin(t0,t1,a0,a1,offset=0,nu=64,nv=64) {
 const p=[],ix=[];for(let i=0;i<=nu;i++)for(let j=0;j<=nv;j++)p.push(...hullPoint(t0+(t1-t0)*i/nu,a0+(a1-a0)*j/nv,offset));
 for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){const a=i*(nv+1)+j,b=a+nv+1;ix.push(a,a+1,b,b,a+1,b+1);}return meshGeo({positions:p,indices:ix});
}
function foil(span,rootChord,tipChord,sweep,thickness,side=1) {
 const p=[],ix=[],N=24,M=48;
 for(let i=0;i<=N;i++){const t=i/N,c=rootChord+(tipChord-rootChord)*t;for(let j=0;j<=M;j++){const a=2*Math.PI*j/M;p.push(-sweep*t+c*.5*Math.cos(a),thickness*(1-.5*t)*Math.sin(a)*(.8+.2*Math.cos(a))+.09*t,side*span*t);}}
 for(let i=0;i<N;i++)for(let j=0;j<M;j++){const a=i*(M+1)+j,b=a+M+1;if(side>0)ix.push(a,a+1,b,b,a+1,b+1);else ix.push(a,b,a+1,b,b+1,a+1);}return meshGeo({positions:p,indices:ix});
}
function build() {
 const root=createRoot('Kestrel_R7');
 const ivory=gameMaterial(0xe4dfca,{roughness:.38,metalness:.12,flatShading:false});
 const orange=gameMaterial(0xb84e25,{roughness:.36,metalness:.16,flatShading:false});
 const graphite=gameMaterial(0x252e32,{roughness:.48,metalness:.2,flatShading:false});
 const glass=gameMaterial(0x153541,{roughness:.13,metalness:.5,flatShading:false});
 const metal=gameMaterial(0x87928f,{roughness:.26,metalness:.8,flatShading:false});
 const rubber=gameMaterial(0x14191c,{roughness:.85,flatShading:false});
 const lamp=gameMaterial(0xffebbe,{emissive:0xffe4a0,emissiveIntensity:.7,roughness:.2});
 const add=(n,g,m,pos=[0,0,0],parent=root,rotation=[0,0,0],scale=[1,1,1])=>createPart(n,g,m,{position:pos,parent,rotation,scale});
 add('CompoundCabin',skin(0,1,0,Math.PI*2),ivory);
 add('GraphiteBelly',skin(.18,.91,2.05,4.23,.012,48,24),graphite);
 for(const s of [-1,1]) {
  const side=s===1?'Starboard':'Port';
  const a0=s>0?.065:-1.67,a1=s>0?1.67:-.065;
  add(side+'CockpitSeal',skin(.575,.935,a0-.025,a1+.025,.022,28,24),graphite);
  add(side+'Windshield',skin(.59,.917,a0+.025,a1-.025,.038,28,24),glass);
  add(side+'CabinDoor',skin(.34,.55,s>0?.92:-2.01,s>0?2.01:-.92,.018,20,16),orange);
  add(side+'CabinWindow',skin(.355,.535,s>0?1.03:-1.55,s>0?1.55:-1.03,.035,20,12),glass);
  add(side+'DoorHandle',boxGeo(.24,.04,.04),metal,[.18,1.31,s*.88]);
  add(side+'ShoulderFairing',sphereGeo(1,40,24),ivory,[-.65,2.05,s*.79],root,[0,0,0],[1.06,.34,.54]);
  add(side+'SweptWing',foil(2.4,1.6,.8,.52,.14,s),ivory,[-.45,2.08,s*.58]);
  add(side+'WingCuff',foil(.4,.9,.82,.08,.145,s),orange,[-.91,2.16,s*2.58]);
  add(side+'TiltAxle',cylinderZGeo(.21,.21,.62,40),metal,[-.99,2.29,s*3.03]);
  const pivot=createPivot(side+'Tilt',[-.99,2.29,s*3.24],root);pivot.rotation.z=-12*Math.PI/180;
  const sections=[[-.72,.16],[-.56,.3],[-.12,.37],[.42,.32],[.65,.24],[.75,.2]].map(([y,r])=>({profile:Array.from({length:48},(_,j)=>[r*Math.cos(j*Math.PI/24),r*.91*Math.sin(j*Math.PI/24)]),frame:{origin:[0,y,0]}}));
  add(side+'Nacelle',loftProfiles(sections),orange,[0,0,0],pivot);
  add(side+'IntakeRim',cylinderYGeo(.245,.26,.14,48),graphite,[0,.67,0],pivot);
  add(side+'RotorMast',cylinderYGeo(.09,.1,.38,32),metal,[0,.87,0],pivot);
  add(side+'Hub',sphereGeo(1,32,20),ivory,[0,1.04,0],pivot,[0,0,0],[.24,.17,.24]);
  const rotor=createPivot(side+'Rotor',[0,1,0],pivot);
  for(let k=0;k<3;k++){
   const blade=createPivot(side+'Blade'+k,[0,0,0],rotor);blade.rotation.y=k*2*Math.PI/3;
   add(side+'Airfoil'+k,foil(1.48,.25,.14,.24,.026,1),graphite,[0,0,.14],blade);
   add(side+'SafetyTip'+k,foil(.18,.15,.13,.03,.02,1),orange,[-.211,.081,1.43],blade);
  }
  add(side+'Tailplane',foil(1.1,.78,.39,.38,.067,s),ivory,[-2.53,1.78,s*.17]);
  beamBetween(side+'MainStrut',[-.88,1.12,s*.59],[-1.05,.31,s*1.05],.065,metal,{segments:16,parent:root});
  add(side+'GearShoulder',sphereGeo(1,24,16),orange,[-.88,1.01,s*.72],root,[0,0,0],[.33,.26,.2]);
  add(side+'MainTyre',torusGeo(.22,.085,16,40),rubber,[-1.05,.305,s*1.1]);
  add(side+'MainHub',cylinderZGeo(.13,.13,.19,32),metal,[-1.05,.305,s*1.1]);
 }
 add('DorsalTail',foil(1.14,1.06,.38,.45,.075,1),orange,[-2.6,1.76,0],root,[-90,0,0]);
 beamBetween('NoseGearShock',[1.91,.96,0],[2.02,.25,0],.057,metal,{segments:16,parent:root});
 add('NoseTyre',torusGeo(.18,.065,16,40),rubber,[2.02,.245,0]);
 add('NoseHub',cylinderZGeo(.11,.11,.18,32),metal,[2.02,.245,0]);
 add('LandingLightBezel',sphereGeo(1,28,18),graphite,[2.73,1.12,0],root,[0,0,0],[.21,.16,.24]);
 add('LandingLight',sphereGeo(1,24,16),lamp,[2.88,1.14,0],root,[0,0,0],[.075,.10,.15]);
 return root;
}
function animate(root) {
 const keys=[];for(let i=0;i<=24;i++){const t=i/24;const a=12+58*(.5-.5*Math.cos(t*2*Math.PI));keys.push({time:t*4,rotation:[0,0,-a]});}
 return [createClip('Rescue conversion',4,['Port','Starboard'].map(s=>rotationTrack('Joint_'+s+'Tilt',keys)))];
}

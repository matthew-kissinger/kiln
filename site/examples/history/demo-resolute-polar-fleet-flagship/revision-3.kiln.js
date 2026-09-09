// RESOLUTE / polar fleet flagship. Original procedural design, metres, +X bow.
const meta = { name: 'Resolute — Polar Fleet Flagship', category: 'vehicle', role: 'vehicle' };
const DESIGN = { length: 32, beam: 6.6, deckY: 2.8, mastHeight: 9.5, radarWidth: 3.2, railHeight: 0.40 };
function build() {
 const root = createRoot('Resolute');
 const navy = gameMaterial(0x243e53,{roughness:0.65,metalness:0.25});
 const blue = gameMaterial(0x496779,{roughness:0.6,metalness:0.2});
 const ivory = gameMaterial(0xd5d7c8,{roughness:0.68});
 const teak = gameMaterial(0xb7824c,{roughness:0.95});
 const seam = gameMaterial(0x795738,{roughness:1});
 const brass = gameMaterial(0xd8ac55,{metalness:0.65,roughness:0.35});
 const red = gameMaterial(0x963e39,{roughness:0.8});
 const black = gameMaterial(0x172631,{roughness:0.8});
 const glass = gameMaterial(0x4fc4cb,{metalness:0.25,roughness:0.2});
 const white = gameMaterial(0xf0e7cc,{roughness:0.7});
 const orange = gameMaterial(0xdd7947,{roughness:0.8});
 const part=(n,g,m,p=[0,0,0],r=[0,0,0],parent=root)=>createPart(n,g,m,{position:p,rotation:r,parent});
 const box=(n,s,p,m,r=[0,0,0],parent=root)=>part(n,boxGeo(...s),m,p,r,parent);
 function rod(n,a,b,r,m,parent=root) {
  const va=new THREE.Vector3(...a), vb=new THREE.Vector3(...b),d=vb.clone().sub(va);
  const o=part(n,cylinderGeo(r,r,d.length(),8),m,va.clone().add(vb).multiplyScalar(.5).toArray(),[0,0,0],parent);
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()); return o;
 }
 // Convex waterline outline sampled along deliberately asymmetric bow/stern stations.
 const stations=[[-16,.15],[-15,1.5],[-13,2.55],[-10,3.1],[-6,3.3],[2,3.3],[7,3.05],[11,2.4],[14,1.3],[16,.06]];
 const outline=stations.map(s=>[s[0],s[1]]).concat(stations.slice().reverse().map(s=>[s[0],-s[1]]));
 function shell(n,rings,m) {
  const p=[],idx=[],N=outline.length;
  for(const [y,sx,sz] of rings) for(const [x,z] of outline)p.push(x*sx,y,z*sz);
  for(let k=0;k<rings.length-1;k++)for(let i=0;i<N;i++){
   const j=(i+1)%N,a=k*N+i,b=k*N+j,c=(k+1)*N+i,d=(k+1)*N+j;idx.push(a,b,c,b,d,c);
  }
  // Outline ordering is clockwise in XZ; its cap orientation is +Y.
  const bot=p.length/3;p.push(0,rings[0][0],0);const top=p.length/3;p.push(0,rings[rings.length-1][0],0);
  for(let i=0;i<N;i++){let j=(i+1)%N;idx.push(bot,j,i);let k=(rings.length-1)*N;idx.push(top,k+i,k+j);}
  return part(n,meshGeo({positions:p,indices:idx}),m);
 }
 shell('Red antifouling carved keel',[[0,.88,.42],[.45,.96,.70],[1.15,1,.94]],red);
 shell('Boot stripe',[[1.15,1,.94],[1.35,1,.96]],black);
 shell('Armoured flared hull',[[1.35,1,.96],[2.35,1,1],[2.77,1,1]],navy);
 shell('Ivory sheer stripe',[[2.56,1.001,1.006],[2.68,1.001,1.006]],ivory);
 shell('Teak main deck',[[2.77,.994,.982],[2.82,.994,.982]],teak);
 // Plank seams follow vessel length but stop at the narrowing bow and stern.
 for(let z=-2.8;z<=2.81;z+=.22){
  let xs=stations.filter(s=>s[1]>Math.abs(z)+.08).map(s=>s[0]);
  if(xs.length>1)box('Deck plank seam '+z.toFixed(2),[Math.max(...xs)-Math.min(...xs),.008,.018],[(Math.max(...xs)+Math.min(...xs))/2,2.827,z],seam);
 }
 // A perimeter handrail composed from station-to-station rails, with vertical stanchions.
 for(let i=0;i<outline.length;i++){
  let a=outline[i],b=outline[(i+1)%outline.length];
  let dist=Math.hypot(b[0]-a[0],b[1]-a[1]),count=Math.ceil(dist/.8);
  for(let t=0;t<count;t++){
   let x=(a[0]+(b[0]-a[0])*t/count)*.985,z=(a[1]+(b[1]-a[1])*t/count)*.96;
   rod('Rail stanchion '+i+'-'+t,[x,2.83,z],[x,2.83+DESIGN.railHeight,z],.022,ivory);
  }
  for(const h of [.19,DESIGN.railHeight])rod('Continuous safety rail '+i+'-'+h,[a[0]*.985,2.83+h,a[1]*.96],[b[0]*.985,2.83+h,b[1]*.96],.018,ivory);
 }
 // Scuttles track the hull stations so they remain mounted along the tapered sides.
 function hullWidth(x) {
  for(let i=0;i<stations.length-1;i++)if(x>=stations[i][0]&&x<=stations[i+1][0]){
   const a=stations[i],b=stations[i+1];return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);
  }
  return .06;
 }
 for(const s of [-1,1])for(let x=-11;x<=10;x+=1.05){
  const z=s*(hullWidth(x)*.9972+.012);
  const yaw=-s*Math.atan((hullWidth(x+.01)-hullWidth(x-.01))/.02)*180/Math.PI;
  part('Brass scuttle '+s+' '+x,torusGeo(.095,.024,6,12),brass,[x,2.28,z],[0,yaw,0]);
  part('Dark scuttle glass '+s+' '+x,cylinderGeo(.078,.078,.018,12),black,[x,2.28,z],[90,yaw,0]);
 }
 // Fleet hull registry 07 is editable solid geometry, with no external font or texture.
 const digits=[[[0,0],[0,.48],[.26,.48],[.26,0],[0,0]],[[0,.48],[.26,.48],[.08,0]]];
 for(const s of [-1,1])for(let d=0;d<2;d++)for(let i=0;i<digits[d].length-1;i++){
  const a=digits[d][i],b=digits[d][i+1];
  rod('Hull registry 07 '+s+' '+d+' '+i,[1.15+s*(a[0]+d*.4),1.74+a[1],s*3.31],[1.15+s*(b[0]+d*.4),1.74+b[1],s*3.31],.027,ivory);
 }
 // Turret assembly in its own local coordinate frame. Articulated pivot retained for edits.
 function turret(n,x,y,dir,scale=1){
  const g=createPivot(n,[x,y,0],root);g.rotation.y=dir*Math.PI/180;
  part(n+' barbette',cylinderGeo(1.1*scale,1.2*scale,.4*scale,16),blue,[0,.2*scale,0],[0,0,0],g);
  // Faceted armour geometry with sloping cheeks; independent turret roof.
  const shape=[[-1.05,-.97],[-1.05,.97],[.65,1.02],[1.12,.65],[1.12,-.65],[.65,-1.02]];
  const pts=[],inds=[];
  for(const [yy,fac] of [[.38,1],[1.2,.82]])for(const [xx,zz] of shape)pts.push(xx*scale*fac,yy*scale,zz*scale*fac);
  for(let i=0;i<6;i++){let j=(i+1)%6;inds.push(i,j,6+i,j,6+j,6+i);}
  for(let i=1;i<5;i++){inds.push(0,i+1,i,6,6+i,6+i+1);}
  part(n+' angled gunhouse',meshGeo({positions:pts,indices:inds}),ivory,[0,0,0],[0,0,0],g);
  box(n+' roof plate',[1.42*scale,.08*scale,1.4*scale],[-.1*scale,1.24*scale,0],blue,[0,0,0],g);
  for(const z of [-.57,0,.57]){
   part(n+' gun mantlet '+z,cylinderGeo(.2*scale,.2*scale,.5*scale,12),navy,[.9*scale,.75*scale,z*scale],[0,0,90],g);
   rod(n+' barrel '+z,[1*scale,.75*scale,z*scale],[4.1*scale,1.02*scale,z*scale],.108*scale,blue,g);
   rod(n+' reinforced breech '+z,[1*scale,.75*scale,z*scale],[2*scale,.837*scale,z*scale],.145*scale,navy,g);
   part(n+' black muzzle '+z,cylinderGeo(.08*scale,.08*scale,.03*scale,12),black,[4.12*scale,1.022*scale,z*scale],[0,0,95],g);
  }
  box(n+' rangefinder',[.25*scale,.22*scale,2.15*scale],[-.45*scale,1.37*scale,0],brass,[0,0,0],g);
 }
 turret('A forward battery',8.3,2.84,0);
 box('B raised battery platform',[3.4,.62,3.7],[3.9,3.13,0],navy);
 turret('B superfiring battery',4.0,3.45,0,.91);
 turret('Y stern battery',-10.2,2.84,180);
 // Long central citadel, stepped bridge and glazed observation deck.
 box('Citadel lower deck',[11.6,.9,3.5],[-2,3.28,0],blue);
 box('Citadel teak roof',[11.8,.1,3.7],[-2,3.78,0],teak);
 box('Bridge lower block',[3.2,1.25,2.7],[.85,4.43,0],ivory);
 box('Bridge middle deck rim',[3.8,.16,3.25],[.85,5.13,0],brass);
 box('Bridge panoramic dark band',[2.8,.65,2.55],[.85,5.53,0],black);
 box('Bridge roof overhang',[3.25,.18,2.95],[.85,5.94,0],ivory);
 for(const s of [-1,1])for(let x=-.25;x<=1.96;x+=.43)box('Bridge side glazing '+s+' '+x,[.32,.42,.03],[x,5.55,s*1.285],glass);
 for(let z=-1;z<=1.01;z+=.4)box('Forward bridge glazing '+z,[.03,.42,.29],[2.27,5.55,z],glass);
 box('Conning tower',[1.3,.83,1.45],[.55,6.43,0],blue);
 part('Director turntable',cylinderGeo(.7,.7,.18,16),brass,[.55,6.93,0]);
 box('Optical director',[.7,.45,1.2],[.55,7.24,0],ivory);
 box('Director rangefinder',[.22,.23,2.1],[.6,7.4,0],navy);
 for(const s of [-1,1]){
  box('Bridge wing '+s,[1.6,.15,1.2],[.5,5.04,s*1.75],blue);
  box('Wing screen '+s,[1.7,.4,.08],[.5,5.3,s*2.31],ivory);
  // stairway with clear readable risers
  for(let i=0;i<8;i++)box('Citadel access step '+s+' '+i,[.25,.1,.55],[2.55-i*.15,2.88+i*.12,s*2.0],ivory);
 }
 // Paired raked funnels, dark mouths and horizontal brass collars.
 for(const x of [-2.4,-5.7]){
  box('Funnel plinth '+x,[1.9,.34,1.85],[x,3.99,0],navy);
  part('Raked funnel '+x,cylinderGeo(.66,.86,1.85,8),ivory,[x-.12,5.05,0],[0,0,-8]);
  part('Funnel brass collar '+x,cylinderGeo(.68,.70,.16,8),brass,[x-.23,5.59,0],[0,0,-8]);
  part('Funnel soot cap '+x,cylinderGeo(.70,.7,.35,8),navy,[x-.26,5.91,0],[0,0,-8]);
  part('Funnel dark opening '+x,cylinderGeo(.56,.56,.025,8),black,[x-.285,6.088,0],[0,0,-8]);
  for(let i=0;i<6;i++)box('Funnel intake louvre '+x+' '+i,[.8,.055,.04],[x,4.25+i*.13,.78],black);
 }
 // Revised naval mast with braced radar, signal halyards, and triangulated support.
 rod('Main mast',[-1.25,5.9,0],[-1.25,DESIGN.mastHeight,0],.075,navy);
 rod('Mast port brace',[-2.1,3.83,-1.1],[-1.25,7.8,0],.06,ivory);
 rod('Mast starboard brace',[-2.1,3.83,1.1],[-1.25,7.8,0],.06,ivory);
 rod('Signal yard',[-1.25,7.8,-1.8],[-1.25,7.8,1.8],.045,brass);
 // Solid radar panel replaced with an open framed array below.
 // Open trussed radar and signal structure: revised silhouette and visible supports.
 const rh=DESIGN.mastHeight, rw=DESIGN.radarWidth;
 for(const z of [-rw/2,rw/2])rod('Radar vertical frame '+z,[-1.25,rh-.52,z],[-1.25,rh+.52,z],.045,brass);
 for(const y of [rh-.52,rh+.52])rod('Radar horizontal frame '+y,[-1.25,y,-rw/2],[-1.25,y,rw/2],.045,brass);
 for(let j=0;j<=8;j++){
  const z=-rw/2+j*rw/8;
  rod('Radar grid vertical '+j,[-1.25,rh-.5,z],[-1.25,rh+.5,z],.019,blue);
 }
 for(let j=1;j<4;j++)rod('Radar grid horizontal '+j,[-1.25,rh-.52+j*.26,-rw/2],[-1.25,rh-.52+j*.26,rw/2],.022,blue);
 rod('Radar diagonal brace L',[-1.25,rh-.52,-rw/2],[-1.25,rh+.52,0],.026,ivory);
 rod('Radar diagonal brace R',[-1.25,rh+.52,0],[-1.25,rh-.52,rw/2],.026,ivory);
 part('Radar rotator bearing',cylinderGeo(.22,.28,.26,12),brass,[-1.25,rh-.65,0]);
 for(let i=0;i<4;i++){
  const y=6.1+i*.58,w=.53*(1-i*.17),wn=.53*(1-(i+1)*.17);
  for(const s of [-1,1]){
   rod('Mast lattice leg '+s+' '+i,[-1.25,y,s*w],[-1.25,y+.58,s*wn],.044,navy);
   rod('Mast lattice cross '+s+' '+i,[-1.25,y,s*w],[-1.25,y+.58,-s*wn],.025,ivory);
  }
 }
 for(const s of [-1,1]){
  rod('Mast tension rigging '+s,[-1.25,8.6,0],[-5.0,3.83,s*1.45],.012,black);
  rod('Signal halyard '+s,[-1.25,7.8,s*1.6],[-1.25,5.5,s*1.6],.012,brass);
  for(let i=0;i<3;i++){
   box('Signal flag '+s+' '+i,[.025,.28,.4],[-1.25,7.25-i*.43,s*1.4],i===1?glass:red);
   box('Signal flag stripe '+s+' '+i,[.028,.07,.4],[-1.25,7.25-i*.43,s*1.4],white);
  }
 }
 // Observation roof railing emphasizes the stepped bridge as an occupied structure.
 for(const s of [-1,1]){
  for(let x=-.6;x<2.4;x+=.45)rod('Bridge roof stanchion '+s+' '+x,[x,6.03,s*1.35],[x,6.35,s*1.35],.02,navy);
  rod('Bridge roof handrail '+s,[-.6,6.35,s*1.35],[2.3,6.35,s*1.35],.025,brass);
 }
 // Deck crane amidships aft, with an open triangular boom and suspended hook.
 part('Crane slewing base',cylinderGeo(.3,.4,.45,12),navy,[-7.7,4.02,0]);
 rod('Crane mast',[-7.7,4.1,0],[-7.7,5.55,0],.07,brass);
 rod('Crane boom upper',[-7.7,5.55,0],[-9.0,5.4,1.4],.055,brass);
 rod('Crane boom lower',[-7.7,4.75,0],[-9.0,5.4,1.4],.045,brass);
 rod('Crane hanging cable',[-9,5.4,1.4],[-9,4.35,1.4],.017,black);
 part('Crane hook',torusGeo(.09,.025,6,12),brass,[-9,4.27,1.4]);
 // Davit-carried lifeboats, secondary twin mounts and ventilators.
 for(const s of [-1,1]){
  for(const x of [-3.6,-6.2]){
   const boat=part('Lifeboat hull '+s+' '+x,cylinderGeo(.5,.28,2.25,8),ivory,[x,4.22,s*2.17],[0,0,90]);boat.scale.z=.55;
   box('Lifeboat dark cockpit '+s+' '+x,[1.5,.1,.46],[x,4.5,s*2.17],navy);
   for(const xx of [x-.65,x+.65]){rod('Boat davit upright '+s+' '+xx,[xx,3.75,s*1.5],[xx,4.9,s*1.5],.05,brass);rod('Boat davit arm '+s+' '+xx,[xx,4.9,s*1.5],[xx,4.9,s*2.2],.05,brass);rod('Boat sling '+s+' '+xx,[xx,4.9,s*2.2],[xx,4.45,s*2.2],.018,black);}
  }
  for(const x of [-8,-.8,6.0]){
   part('Secondary pedestal '+s+' '+x,cylinderGeo(.43,.5,.42,12),navy,[x,3.03,s*2.2]);
   box('Secondary shield '+s+' '+x,[.72,.55,.8],[x,3.42,s*2.2],ivory);
   for(const dx of [-.19,.19])rod('Secondary barrel '+s+' '+x+' '+dx,[x+dx,3.43,s*2.3],[x+dx,3.85,s*3.6],.047,blue);
  }
  for(const x of [-12,-9,10,12]){
   part('Mooring bollard '+s+' '+x,cylinderGeo(.09,.12,.27,8),navy,[x,2.96,s*1.1]);
   box('Bollard cap '+s+' '+x,[.3,.06,.19],[x,3.12,s*1.1],brass);
  }
  for(const x of [-5,-3,-1]){
   box('Hull armour applique '+s+' '+x,[1.5,.42,.11],[x,1.96,s*3.31],blue);
   part('Life ring '+s+' '+x,torusGeo(.18,.045,8,16),orange,[x,3.4,s*1.78]);
  }
 }
 // Foredeck anchor gear: winches, chain links and starboard anchor silhouette.
 for(const s of [-1,1]){
  part('Anchor capstan '+s,cylinderGeo(.25,.32,.3,12),blue,[12,2.99,s*.65]);
  for(let i=0;i<12;i++)part('Anchor chain link '+s+' '+i,torusGeo(.07,.018,6,10),black,[12.25+i*.145,2.84,s*(.65+i*.015)],[90,i%2*60,0]);
  rod('Anchor shank '+s,[13.8,2.38,s*1.5],[13.8,1.62,s*1.55],.05,brass);
  rod('Anchor crossbar '+s,[13.48,2.16,s*1.51],[14.12,2.16,s*1.51],.045,brass);
  rod('Anchor fluke L '+s,[13.8,1.62,s*1.55],[13.45,1.9,s*1.55],.055,brass);
  rod('Anchor fluke R '+s,[13.8,1.62,s*1.55],[14.15,1.9,s*1.55],.055,brass);
 }
 // Stern aircraft-free working deck with winch and crane.
 part('Stern winch',cylinderGeo(.3,.3,.65,12),blue,[-13.1,3.08,0],[90,0,0]);
 rod('Stern flagstaff',[-14.7,2.83,0],[-14.7,4.7,0],.035,brass);
 box('Fleet pennant',[.02,.44,.8],[-14.7,4.43,.42],red);
 box('Pennant ivory stripe',[.024,.12,.8],[-14.7,4.43,.42],ivory);
 // Shared dimensions scale the entire assembly and preserve all attachment relationships.
 root.scale.set(DESIGN.length/32,DESIGN.deckY/2.8,DESIGN.beam/6.6);
 return root;
}

const meta = { name: 'DAUNTLESS CV-08', category: 'vehicle', role: 'vehicle' };
const P = { deckY:12, length:122, hullBeam:21, deckBeam:30 };
function build() {
  const root=createRoot('Dauntless_CV08');
  const mats={
    navy:gameMaterial(0x193950,{metalness:.35,roughness:.63}),
    edge:gameMaterial(0x365970,{metalness:.4,roughness:.54}),
    dark:gameMaterial(0x17232b,{metalness:.25,roughness:.8}),
    deck:gameMaterial(0x30373c,{metalness:.15,roughness:.9}),
    ivory:gameMaterial(0xf3e8cc,{roughness:.7}),
    orange:gameMaterial(0xed742a,{metalness:.18,roughness:.52}),
    safetyOrange:gameMaterial(0xff5f00,{metalness:.08,roughness:.55}),
    glass:gameMaterial(0x7cafb6,{metalness:.5,roughness:.26}),
    steel:gameMaterial(0x8b9da5,{metalness:.65,roughness:.48})
  };
  // Bake static surfaces into one mesh per material within each semantic assembly.
  function assembly(name,parent=root) {
    const g=new THREE.Group();g.name=name;parent.add(g);
    const buckets={};
    function add(geo,mat,pos=[0,0,0],rot=[0,0,0],scale=[1,1,1]){
      if(name.startsWith('Aircraft_') && mat==='orange') mat='safetyOrange';
      const own=geo.index?geo.toNonIndexed():geo.clone();
      const matrix=new THREE.Matrix4().compose(new THREE.Vector3(...pos),new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot.map(v=>v*Math.PI/180))),new THREE.Vector3(...scale));
      own.applyMatrix4(matrix);
      if(!own.getAttribute('normal'))own.computeVertexNormals();
      (buckets[mat]||(buckets[mat]=[])).push(own);
    }
    function box(mat,size,pos,rot=[0,0,0]){add(boxGeo(...size),mat,pos,rot);}
    function cyl(mat,rt,rb,h,pos,rot=[0,0,0],seg=10){add(cylinderGeo(rt,rb,h,seg),mat,pos,rot);}
    function beam(mat,a,b,width){const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b);const d=vb.clone().sub(va);const geo=boxGeo(width,d.length(),width).clone();geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));add(geo,mat,va.add(vb).multiplyScalar(.5).toArray());}
    function plate(mat,outline,y,h){const s=new THREE.Shape();outline.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z));s.closePath();const geo=new THREE.ExtrudeGeometry(s,{depth:h,bevelEnabled:false,steps:1,curveSegments:1});geo.rotateX(-Math.PI/2);add(geo,mat,[0,y,0]);}
    function finish(){
      for(const key of Object.keys(buckets)){const geos=buckets[key],p=[],n=[],uv=[];
        for(const geo of geos){const pa=geo.getAttribute('position'),na=geo.getAttribute('normal'),ua=geo.getAttribute('uv');
          for(let i=0;i<pa.count;i++){p.push(pa.getX(i),pa.getY(i),pa.getZ(i));n.push(na.getX(i),na.getY(i),na.getZ(i));uv.push(ua?ua.getX(i):0,ua?ua.getY(i):0);}
        }
        const merged=new THREE.BufferGeometry();merged.setAttribute('position',new THREE.Float32BufferAttribute(p,3));merged.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));merged.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
        createPart(name+'_'+key,merged,mats[key],{parent:g});
      }return g;
    }
    return {g,add,box,cyl,beam,plate,finish};
  }
  const hullOutline=[[-56,-7],[-49,-10],[32,-10],[48,-8],[57,-3],[60,0],[57,3],[48,8],[32,10],[-49,10],[-56,7]];
  const hull=assembly('Pressure_Hull');
  const sections=[
    {profile:hullOutline.map(([x,z])=>[x*.90,z*.55]),frame:{origin:[0,0,0]}},
    {profile:hullOutline.map(([x,z])=>[x*.98,z*.83]),frame:{origin:[0,3,0]}},
    {profile:hullOutline,frame:{origin:[0,9.5,0]}},
    {profile:hullOutline.map(([x,z])=>[x,z*1.02]),frame:{origin:[0,11.8,0]}}
  ];
  hull.add(loftProfiles(sections),'navy');
  // Continuous chine and waterline ribbons.
  for(const [y,k,m] of [[2.5,.81,'dark'],[9.35,1,'edge']]){
    hull.add(loftProfiles([{profile:hullOutline.map(([x,z])=>[x*(y<3?.98:1),z*k]),frame:{origin:[0,y,0]}},{profile:hullOutline.map(([x,z])=>[x*(y<3?.982:1),z*(k+.005)]),frame:{origin:[0,y+.18,0]}}]),m);
  }
  hull.finish();
  const deckOutline=[[-59,-10],[-46,-16],[-15,-16],[4,-13],[43,-13],[58,-7],[61,4],[54,11],[28,13],[-47,13],[-59,9]];
  const deck=assembly('Flight_Deck');
  deck.plate('edge',deckOutline,11.7,.45);
  deck.plate('deck',deckOutline.map(([x,z])=>[x*.995,z*.985]),12.15,.22);
  // Rim strips follow the shaped perimeter.
  for(let i=0;i<deckOutline.length;i++){const a=deckOutline[i],b=deckOutline[(i+1)%deckOutline.length];deck.beam('steel',[a[0],12.18,a[1]],[b[0],12.18,b[1]],.16);}
  deck.finish();
  const paint=assembly('Deck_Markings');
  function line(a,b,w,mat='ivory',y=12.405){const dx=b[0]-a[0],dz=b[1]-a[1];paint.box(mat,[Math.hypot(dx,dz),.025,w],[(a[0]+b[0])/2,y,(a[1]+b[1])/2],[0,-Math.atan2(dz,dx)*180/Math.PI,0]);}
  // Angled landing lane, deliberately clear of the island and parked aircraft.
  const start=[-53,-2.5],end=[29,-7.9],dx=end[0]-start[0],dz=end[1]-start[1],len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len;
  for(const s of [-1,1])line([start[0]+nx*3.8*s,start[1]+nz*3.8*s],[end[0]+nx*3.8*s,end[1]+nz*3.8*s],.25);
  for(let d=3;d<len-2;d+=7){const a=[start[0]+dx*d/len,start[1]+dz*d/len],b=[start[0]+dx*(d+3)/len,start[1]+dz*(d+3)/len];line(a,b,.24);}
  for(let j=0;j<5;j++){let off=(j-2)*1.1;line([-51+nx*off,-2.63+nz*off],[-47+nx*off,-2.90+nz*off],.55);}
  for(const z of [0.4,5]){line([10,z],[51,z],.18);line([10,z+.6],[51,z+.6],.12,'steel');line([51,z-1],[53,z+.3],.24);line([53,z+.3],[51,z+1.6],.24);}
  for(const x of [-40,-36,-32,-28])line([x,-7],[x+.55,1],.13,'dark',12.445);
  for(const [x,z] of [[-42,8],[-28,8],[35,8],[-19,-12.6]]){
    line([x-4,z-2.3],[x+4,z-2.3],.12);line([x-4,z+2.3],[x+4,z+2.3],.12);
    for(const xx of [x-4,x+4])line([xx,z-2.3],[xx,z+2.3],.12);
  }
  // Large squared 08 on the bow, authored as geometry for texture-free portability.
  function digit(x,z,num){const bars={a:[0,-1.1,2.8,.3],b:[1.25,-.55,.3,1.1],c:[1.25,.55,.3,1.1],d:[0,1.1,2.8,.3],e:[-1.25,.55,.3,1.1],f:[-1.25,-.55,.3,1.1],g:[0,0,2.8,.3]};for(const k of (num===0?'abcdef':'abcdefg')){const q=bars[k];paint.box('ivory',[q[3],.03,q[2]],[x+q[1],12.43,z+q[0]]);}}
  digit(54,-2.5,0);digit(54,1.2,8);
  paint.finish();
  // Sponsons, under-deck cantilevers and side servicing bays.
  const sides=assembly('Hull_Sponsons_and_Service_Bays');
  for(const side of [-1,1]){
    for(const x of [-44,-29,-14,1,16,31]){
      sides.box('edge',[8,.65,2.0],[x,9.0,side*10.5]);
      sides.beam('navy',[x-3,6.5,side*9.7],[x-3,10.7,side*12.3],.55);
      sides.beam('navy',[x+3,6.5,side*9.7],[x+3,10.7,side*12.3],.55);
      sides.box('dark',[5,1.9,.10],[x,7.4,side*10.03]);
      for(let j=0;j<4;j++)sides.box('edge',[.16,1.7,.13],[x-1.8+j*1.2,7.4,side*10.11]);
    }
    for(const x of [-39,-19,8,26]){
      sides.box('steel',[2.4,.85,.7],[x,10.05,side*11.35]);
      sides.box('dark',[2.05,.14,.76],[x,10.05,side*11.37]);
    }
  }
  sides.box('dark',[.14,3.5,12],[-56.05,7.0,0]);
  for(const z of [-4,0,4])sides.box('edge',[.23,3.5,.2],[-56.14,7,z]);
  sides.finish();
  function lift(name,x,z,y){
    const a=assembly(name);a.box('edge',[9,.5,5.4],[x,y-.27,z]);a.box('deck',[8.7,.14,5.1],[x,y+.03,z]);
    for(const side of [-1,1])a.box('orange',[8.5,.035,.2],[x,y+.125,z+side*2.36]);
    for(let j=0;j<9;j++)a.box('ivory',[.3,.036,.5],[x-3.8+j*.95,y+.15,z+2.3],[0,-35,0]);
    for(const xx of [x-3.6,x+3.6]){a.box('dark',[.4,3,.5],[xx,y-1.6,z]);a.beam('edge',[xx,8.3,z>0?9:-10],[xx,y-.5,z],.4);}
    a.finish();
  }
  lift('Starboard_Lift_lowered',22,14.4,10.9);
  lift('Port_Lift_flush',-30,-16.6,12.38);
  const island=assembly('Island');
  const ip=[[-10,7.3],[8,7.3],[10,8.7],[9,11.9],[-10,11.9]];
  island.plate('navy',ip,12.4,5.5);
  island.plate('edge',[[-9,7],[7,7],[9,8.5],[8.3,12.2],[-9,12.2]],17.9,.5);
  island.plate('navy',[[-8,7.5],[6.5,7.5],[8,8.6],[7.4,11.7],[-8,11.7]],18.4,2.5);
  island.plate('dark',[[-7.5,7.32],[6.4,7.32],[8.15,8.5],[7.5,11.85],[-7.5,11.85]],19.25,1.0);
  island.plate('safetyOrange',[[-8.04,7.46],[6.52,7.46],[8.05,8.59],[7.44,11.74],[-8.04,11.74]],18.55,.65);
  for(let x=-6.5;x<6;x+=1.5){island.box('glass',[1.12,.67,.06],[x,19.8,7.27]);island.box('glass',[1.12,.67,.06],[x,19.8,11.9]);}
  island.box('glass',[.08,.65,2],[8.03,19.8,9.5],[0,-12,0]);
  island.plate('edge',[[-8.2,7],[7,7],[8.8,8.5],[8,12.2],[-8.2,12.2]],20.8,.5);
  island.box('navy',[7,2.0,3.2],[-1,22.3,9.7]);
  island.box('edge',[7.5,.35,3.7],[-1,23.4,9.7]);
  // Faceted exhaust stack with recessed dark mouth.
  island.cyl('edge',1.35,1.7,3.6,[-6,23.1,9.7],[0,0,0],4);
  island.cyl('dark',1.05,1.05,.15,[-6,24.95,9.7],[0,0,0],4);
  for(const x of [-7,-5,-3])island.box('dark',[1.3,.75,.08],[x,15.5,7.25]);
  island.box('steel',[1.0,2.0,.14],[6,14,7.22]);
  for(let y=13;y<18;y+=.55)island.box('steel',[.7,.10,.20],[-9.75,y,8.5]);
  for(const z of [7.1,12.1]){
    for(let x=-8;x<8;x+=2)island.box('steel',[.07,.85,.07],[x,21.72,z]);
    island.box('steel',[16,.07,.07],[0,22.1,z]);
  }
  island.finish();
  const radar=assembly('Radar_Masts');
  for(const x of [-1,2])for(const z of [8.7,10.7])radar.beam('steel',[x,23.55,z],[.5,29.0,9.7],.21);
  radar.box('edge',[4,.25,3.2],[.5,27.1,9.7]);
  radar.cyl('steel',.18,.24,4.2,[.5,29.1,9.7]);
  radar.box('dark',[.3,2.5,5.5],[.5,31.0,9.7],[0,-20,0]);
  for(let z=-2;z<=2;z++)radar.box('steel',[.35,2.45,.07],[.5,31,9.7+z],[0,-20,0]);
  for(let y=30;y<=32;y+=.65)radar.box('steel',[.36,.07,5.4],[.5,y,9.7],[0,-20,0]);
  radar.cyl('steel',.07,.12,5.2,[5.1,25.6,9.7]);
  radar.box('steel',[3.5,.12,.12],[5.1,27.2,9.7]);
  radar.add(sphereGeo(.7,12,8),'ivory',[5.1,24.0,9.7]);
  radar.cyl('steel',.05,.08,3,[-7.5,25.2,11]);
  radar.finish();
  // Four reusable parked aircraft assemblies, +X nose.
  function jet(name,x,z,heading){
    const a=assembly(name);
    a.g.position.set(x,12.46,z);a.g.rotation.y=heading*Math.PI/180;
    const rings=[[-3,.34],[-2,.55],[.6,.50],[2.2,.28],[3.7,.025]].map(([xx,r])=>({profile:Array.from({length:8},(_,i)=>[Math.cos(i*Math.PI/4)*r,Math.sin(i*Math.PI/4)*r]),frame:{origin:[xx,.85,0],rotation:[0,0,-90]}}));
    a.add(loftProfiles(rings),'orange');
    const wing=[[-2.0,-.35],[-2.3,-3.2],[-.7,-3.2],[1.4,-.4],[1.4,.4],[-.7,3.2],[-2.3,3.2],[-2.0,.35]];
    a.plate('orange',wing,.74,.15);
    for(const s of [-1,1]){
      a.box('ivory',[.65,.17,.55],[-1.45,.84,s*2.55],[0,20*s,0]);
      a.plate('orange',[[-3.1,s*.2],[-3.6,s*1.6],[-2.35,s*1.6],[-1.65,s*.25]],.85,.12);
      a.add(cylinderGeo(.23,.23,.35,10),'dark',[-3.1,.85,s*.23],[0,0,90]);
      a.box('steel',[.12,.43,.12],[-1.3,.36,s*.95]);
      a.cyl('dark',.22,.22,.16,[-1.3,.20,s*.95],[90,0,0],8);
    }
    const fin=new THREE.BufferGeometry();fin.setAttribute('position',new THREE.Float32BufferAttribute([-3,.85,-.07,-3,2.3,-.07,-1.6,.85,-.07,-3,.85,.07,-1.6,.85,.07,-3,2.3,.07],3));fin.computeVertexNormals();a.add(fin,'orange');
    a.add(sphereGeo(1,12,8),'glass',[.7,1.2,0],[0,0,0],[1.2,.40,.37]);
    a.box('steel',[.10,.4,.10],[2,.36,0]);a.cyl('dark',.19,.19,.17,[2,.19,0],[90,0,0],8);
    a.finish();
  }
  jet('Aircraft_A',-42,8,0);jet('Aircraft_B',-28,8,0);jet('Aircraft_C',35,8,0);jet('Aircraft_D',-19,-12.6,0);
  const fittings=assembly('Deck_Edge_Fittings');
  for(const s of [-1,1])for(const x of [-49,-38,-23,-9,7,33]){
    const z=s*(s<0&&x<-15?15.65:12.5);
    fittings.box('edge',[2.2,.35,1],[x,12.5,z]);
    for(const xx of [x-.65,x+.65])fittings.cyl('steel',.18,.18,.45,[xx,12.9,z]);
  }
  for(const [x,z] of [[-49,-11],[-47,12],[42,-11]]){
    fittings.cyl('edge',1.05,1.25,.75,[x,12.8,z],[],12);
    fittings.add(sphereGeo(.68,12,6),'ivory',[x,13.4,z]);
  }
  // Underwater stern: shafts, rudders and simple bronze-orange propellers.
  for(const z of [-4.4,4.4]){
    fittings.cyl('steel',.23,.23,7,[-53,1.65,z],[0,0,90]);
    fittings.cyl('orange',.65,.3,1,[-56.8,1.65,z],[0,0,90]);
    for(let i=0;i<4;i++)fittings.box('orange',[.14,2.9,.50],[-56.9,1.65,z],[i*45,0,0]);
    fittings.box('navy',[2.2,2.6,.3],[-58.5,1.4,z]);
    fittings.beam('navy',[-58.5,2.5,z],[-54.7,4.8,z],.5);
  }
  fittings.finish();
  return root;
}
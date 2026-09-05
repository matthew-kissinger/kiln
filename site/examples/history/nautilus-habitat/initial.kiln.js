const meta={name:'PELAGIC / Nautilus field habitat',category:'architecture',role:'building'};
function build(){
const root=createRoot('PelagicHabitat');
const ceramic=gameMaterial(0xd5ac82,{roughness:.62,flatShading:false}),edge=gameMaterial(0xefcfaa,{roughness:.48,flatShading:false}),metal=gameMaterial(0x263c40,{metalness:.72,roughness:.35,flatShading:false}),floor=gameMaterial(0x897c68,{roughness:.78}),glass=glassMaterial(0x6cae9d,{opacity:.38,roughness:.16}),white=gameMaterial(0xe4dfcd,{roughness:.6}),light=gameMaterial(0xb7ecd7,{emissive:0x80bca5,emissiveIntensity:.6});
const roof=createPivot('SpiralRoof',[0,0,0],root),interior=createPivot('Interior',[0,0,0],root),circulation=createPivot('Circulation',[0,0,0],interior),service=createPivot('ServicePack',[0,0,0],root);
function box(n,w,h,d,x,y,z,m=metal,p=root){return createPart(n,boxGeo(w,h,d),m,{position:[x,y,z],parent:p});}
function rod(n,a,b,r=.035,m=metal,p=root){return beamBetween(n,a,b,r,m,{segments:12,parent:p});}
function spiral(t,z,offset=0){const r=4.8*Math.exp(-.27*t)+offset;return[-.4+r*Math.cos(t),3.5+r*Math.sin(t)+.16*(1-z*z/5.76),z];}
function ribbon(a,b,z0,z1,thick,nu=12,nv=24){const positions=[],indices=[],uvs=[];for(let s=0;s<2;s++)for(let i=0;i<=nu;i++)for(let j=0;j<=nv;j++){let t=a+(b-a)*i/nu,z=z0+(z1-z0)*j/nv;positions.push(...spiral(t,z,s===0?thick/2:-thick/2));uvs.push(i/nu,j/nv);}const row=nv+1,N=(nu+1)*row;for(let s=0;s<2;s++)for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){let q=s*N+i*row+j;if(s===0)indices.push(q,q+1,q+row,q+1,q+row+1,q+row);else indices.push(q,q+row,q+1,q+1,q+row,q+row+1);}function wall(a,b){indices.push(a,b,a+N,b,b+N,a+N);}for(let i=0;i<nu;i++){wall(i*row,(i+1)*row);wall((i+1)*row+nv,i*row+nv);}for(let j=0;j<nv;j++){wall(j+1,j);wall(nu*row+j,nu*row+j+1);}return meshGeo({positions,indices,uvs});}
const start=-.6,end=4.82;
for(let k=0;k<26;k++){let a=start+(end-start)*k/26,b=start+(end-start)*(k+1)/26;createPart('CeramicVault_'+k,ribbon(a+.004,b-.004,-2.15,2.15,.16,8,24),ceramic,{parent:roof});}
for(let k=0;k<7;k++){let z=-2.18+k*4.36/6,path=[];for(let i=0;i<=170;i++)path.push(spiral(start+(end-start)*i/170,z,-.13));createPart('CurvedRib_'+k,sweepProfile([[-.065,-.06],[.065,-.06],[.065,.06],[-.065,.06]],path,{up:[0,0,1]}),metal,{parent:roof});}
for(const z of[-2.24,2.24])createPart('CeramicEdge_'+z,ribbon(start,end,z-.055,z+.055,.24,192,2),edge,{parent:roof});
box('LowerDeck',5.3,.22,3.7,.75,.65,0,floor,interior);
box('Mezzanine',2.75,.18,3.55,1.925,2.72,0,floor,interior);
for(const x of[-1.55,3.02])for(const z of[-1.45,1.45]){box('Footing_'+x+'_'+z,.72,.16,.65,x,.08,z,ceramic);rod('FoundationStrut_'+x+'_'+z,[x,.16,z],[x,.55,z],.10);}
for(const z of[-1.6,1.6]){rod('MezzanineColumn_'+z,[2.96,.76,z],[2.96,2.63,z],.065);rod('LeftShellSupport_'+z,[-1.55,.76,z],spiral(3.45,z,-.15),.075);rod('DeckGirder_'+z,[-1.85,.49,z],[3.4,.49,z],.09);}
for(let i=0;i<12;i++)box('StairTread_'+i,.24,.085,.9,-1.9+(i+.5)*.205,.76+(i+1)*1.87/12,1.12,edge,circulation);
for(const z of[.63,1.61]){rod('StairStringer_'+z,[-1.9,.7,z],[.56,2.57,z],.075,metal,circulation);rod('StairHandrail_'+z,[-1.9,1.7,z],[.56,3.57,z],.03,metal,circulation);for(let i=0;i<4;i++){let x=-1.9+i*.82,y=.76+i*.623;rod('StairPost_'+z+'_'+i,[x,y,z],[x,y+.94,z],.022,metal,circulation);}}
for(let i=0;i<5;i++){let x=.69+i*.62;box('MezzanineGlass_'+i,.57,.78,.035,x,3.2,1.79,glass,interior);rod('Baluster_'+i,[x-.3,2.82,1.8],[x-.3,3.66,1.8],.025,metal,interior);}
rod('UpperGuardCap',[.38,3.66,1.8],[3.48,3.66,1.8],.035,metal,interior);
box('ResearchBench',1.9,.11,.58,2.0,3.5,-1.13,white,interior);
for(const x of[1.2,2.8])box('BenchCabinet_'+x,.46,.62,.54,x,3.13,-1.13,metal,interior);
for(const x of[1.55,2.35]){box('Monitor_'+x,.5,.37,.055,x,3.79,-1.27,metal,interior);box('MonitorDisplay_'+x,.43,.29,.012,x,3.79,-1.232,light,interior);}
box('LowerLabWorktop',1.65,.1,.64,1.7,1.51,-1.13,white,interior);box('LowerLabStorage',1.54,.65,.58,1.7,1.13,-1.13,metal,interior);
for(let i=0;i<4;i++)box('LabDrawer_'+i,.32,.46,.022,1.12+i*.39,1.19,-.827,ceramic,interior);
box('EntryLanding',1.55,.16,1.22,2.5,.64,2.45,edge,circulation);for(let i=0;i<3;i++)box('EntranceStep_'+i,1.5,.16,.34,2.5,.16+i*.16,3.48-i*.34,ceramic,circulation);
for(const x of[1.7,3.3])box('EntryJamb_'+x,.1,2.02,.12,x,1.74,1.96,metal,interior);
box('EntryLintel',1.7,.13,.15,2.5,2.78,1.96,metal,interior);box('SlidingDoorParked',.67,1.85,.04,3.66,1.72,1.98,glass,interior);
box('RearGlazing',3.1,1.8,.045,1.65,1.69,-1.89,glass,interior);for(const x of[.1,1.65,3.2])box('RearMullion_'+x,.055,1.85,.09,x,1.69,-1.91,metal,interior);
box('ServiceCradle',1.0,.15,2.2,-1.75,.42,-2.5,metal,service);
for(let i=0;i<2;i++){const z=-2.04-i*.9;createPart('PressureVessel_'+i,cylinderGeo(.31,.31,1.6,40),white,{position:[-1.75,1.3,z],parent:service});for(const y of[.69,1.89])createPart('VesselBand_'+i+'_'+y,cylinderGeo(.325,.325,.09,40),metal,{position:[-1.75,y,z],parent:service});rod('ServicePipe_'+i,[-1.75,2.13,z],[-.8,2.13,z],.055,metal,service);rod('SupplyRiser_'+i,[-.8,2.13,z],[-.8,.78,-1.5],.055,metal,service);}
box('HeatExchanger',.55,1.15,1.6,-2.39,1.14,-2.5,metal,service);for(let i=0;i<12;i++)box('CoolingFin_'+i,.65,.045,1.7,-2.4,.64+i*.092,-2.5,ceramic,service);
box('EntryWayfinding',.6,.19,.06,3.0,2.45,2.04,light,interior);
return root;
}

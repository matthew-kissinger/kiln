const meta={name:"LANTERN / S-4",category:"vehicle",role:"vehicle"};
const HULL_Y=1.28;
const ARM_ROOT=[0.28,0.91,0.79];
function skin(stations,a0=0,a1=Math.PI*2,steps=72){
 const p=[],ix=[],uv=[];
 for(let j=0;j<stations.length;j++){const s=stations[j];for(let k=0;k<=steps;k++){const t=a0+(a1-a0)*k/steps;p.push(s[0],s[3]+s[1]*Math.cos(t),s[2]*Math.sin(t));uv.push(j/(stations.length-1),k/steps);}}
 for(let j=0;j<stations.length-1;j++)for(let k=0;k<steps;k++){let a=j*(steps+1)+k,b=a+steps+1;ix.push(a,a+1,b,b,a+1,b+1);}
 return meshGeo({positions:p,indices:ix,uvs:uv});
}
function fairStations(){
 const knots=[[-1.57,.025,.035,1.30],[-1.28,.16,.22,1.31],[-.8,.31,.43,1.30],[-.15,.47,.61,1.28],[.50,.55,.67,1.26],[1.03,.47,.56,1.24],[1.48,.34,.40,1.23]];
 const out=[];
 for(let i=0;i<knots.length-1;i++)for(let j=0;j<10;j++){let t=j/10;let row=[];for(let c=0;c<4;c++){let a=knots[Math.max(0,i-1)][c],b=knots[i][c],d=knots[i+1][c],e=knots[Math.min(knots.length-1,i+2)][c];row.push(c===0?b+(d-b)*t:.5*((2*b)+(-a+d)*t+(2*a-5*b+4*d-e)*t*t+(-a+3*b-3*d+e)*t*t*t));}out.push(row);}
 out.push(knots[knots.length-1]);return out;
}
function build(){
 const root=createRoot("LANTERN_S4");
 const teal=gameMaterial(0x12484c,{metalness:.48,roughness:.32,flatShading:false});
 const ivory=gameMaterial(0xe5dfcb,{metalness:.15,roughness:.34,flatShading:false});
 const black=gameMaterial(0x101c23,{metalness:.2,roughness:.55,flatShading:false});
 const steel=gameMaterial(0x819a9a,{metalness:.78,roughness:.25,flatShading:false});
 const glass=gameMaterial(0x071e2c,{metalness:.55,roughness:.13,flatShading:false});
 const amber=gameMaterial(0xffbb51,{emissive:0xff961d,emissiveIntensity:.65,roughness:.24,flatShading:false});
 const add=(n,g,m,pos=[0,0,0],parent=root,rot=[0,0,0],scale=[1,1,1])=>createPart(n,g,m,{position:pos,parent,rotation:rot,scale});
 const beam=(n,a,b,r,m,parent=root)=>beamBetween(n,a,b,r,m,{parent,segments:12});
 const pipe=(n,pts,r,m,parent=root)=>add(n,pipeAlongPath(pts,r,{bendRadius:.025,tubularSegments:40,radialSegments:8}),m,[0,0,0],parent);
 const stations=fairStations();
 add("Pressure_body_custom_teardrop",skin(stations),teal);
 add("Ivory_upper_fairing",skin(stations.map(s=>[s[0],s[1]+.009,s[2]+.009,s[3]]),-1.10,1.10,36),ivory);
 for(const sign of [-1,1])pipe("Fairing_separation_"+sign,stations.map(s=>[s[0],s[3]+(s[1]+.011)*Math.cos(1.1),sign*(s[2]+.011)*Math.sin(1.1)]),.006,black);
 add("Tail_closure",sphereGeo(.036,20,12),teal,[-1.57,1.30,0],[root][0]);
 const port=createPivot("Observation_port",[0,0,0],root);
 add("Prow_retaining_lip",skin([[1.46,.345,.405,1.23],[1.53,.347,.407,1.23],[1.555,.321,.38,1.23],[1.54,.286,.341,1.23],[1.48,.283,.338,1.23]]),steel,[0,0,0],port);
 add("Recess_elastomer_gasket",skin([[1.485,.284,.339,1.23],[1.47,.272,.327,1.23],[1.31,.256,.307,1.23]]),black,[0,0,0],port);
 add("Port_shadow_well",skin([[1.32,.259,.311,1.23],[1.21,.247,.298,1.23]]),black,[0,0,0],port);
 add("Inset_pressure_glazing",cylinderXGeo(.25,.25,.025,64),glass,[1.225,1.23,0],port,[0,0,0],[1,1,1.20]);
 for(let i=0;i<12;i++){let t=i*Math.PI/6;add("Port_captive_fastener_"+i,cylinderXGeo(.011,.011,.009,8),black,[1.558,1.23+.322*Math.cos(t),.38*Math.sin(t)],port);}
 // One long port-side buoyancy cartridge, carried off the pressure skin.
 const pod=createPivot("Port_buoyancy_cartridge",[-.28,1.66,-.70],root);
 add("Float_streamlined_shell",skin([[-.78,.012,.012,0],[-.61,.105,.125,0],[-.20,.13,.145,0],[.44,.115,.13,0],[.64,.045,.060,0],[.68,.005,.006,0]],0,Math.PI*2,40),ivory,[0,0,0],pod);
 for(const x of [-.70,.06]){beam("Float_saddle_"+x,[x,1.51,-.45],[x,1.62,-.72],.033,teal);add("Float_band_"+x,torusGeo(.133,.013,8,36),steel,[x,1.66,-.70],root,[0,90,0],[1,1.04,1]);}
 // Starboard side-scan instrument: a compact faceted blade with dark acoustic face.
 const survey=createPivot("Starboard_survey_instrument",[-.19,1.22,.84],root);
 add("Side_scan_body",boxGeo(.53,.15,.16),teal,[0,0,0],survey,[0,0,-5]);
 add("Acoustic_ceramic_face",boxGeo(.45,.102,.014),black,[0,0,.084],survey,[0,0,-5]);
 for(const x of [-.37,.01])beam("Instrument_standoff_"+x,[x,1.23,.55],[x,1.22,.79],.022,steel);
 add("Survey_status_light",boxGeo(.045,.019,.009),amber,[.18,.04,.094],survey);
 function thruster(label,x,y,z,r){
  const mount=createPivot(label,[x,y,z],root);
  add(label+"_thick_duct",skin([[-.17,r,r,0],[-.14,r+.015,r+.015,0],[.14,r+.015,r+.015,0],[.17,r,r,0],[.16,r-.036,r-.036,0],[-.16,r-.036,r-.036,0],[-.17,r,r,0]],0,Math.PI*2,56),teal,[0,0,0],mount);
  for(const xx of [-.155,.155])add(label+"_rim_"+xx,torusGeo(r-.006,.009,8,56),steel,[xx,0,0],mount,[0,90,0]);
  add(label+"_motor",cylinderXGeo(.047,.047,.16,24),black,[0,0,0],mount);
  add(label+"_spinner",sphereGeo(.051,24,16),steel,[.09,0,0],mount,[0,0,0],[1.3,1,1]);
  for(let k=0;k<5;k++){let t=k*Math.PI*2/5;const verts=[[-.025,.04,0],[.02,r-.047,-.02],[.045,r-.065,.045],[.01,.04,.027]];const pp=[];for(const v of verts)pp.push(v[0],v[1]*Math.cos(t)-v[2]*Math.sin(t),v[1]*Math.sin(t)+v[2]*Math.cos(t));add(label+"_propeller_"+k,meshGeo({positions:pp,indices:[0,1,2,0,2,3,2,1,0,3,2,0]}),steel,[0,0,0],mount);}
  for(let k=0;k<3;k++){let t=k*Math.PI*2/3;beam(label+"_guard_"+k,[.12,.045*Math.cos(t),.045*Math.sin(t)],[.12,(r-.027)*Math.cos(t),(r-.027)*Math.sin(t)],.011,black,mount);}
  return mount;
 }
 for(const side of [-1,1]){
  thruster("Aft_propulsor_"+side,-.94,.99,side*.68,.225);
  beam("Thruster_forward_mount_"+side,[-.77,1.13,side*.40],[-.81,.99,side*.68],.041,teal);
  beam("Thruster_aft_mount_"+side,[-1.19,1.21,side*.24],[-1.08,.99,side*.68],.028,steel);
 }
 const lift=thruster("Ventral_heave_thruster",-.43,.81,0,.16);lift.rotation.z=Math.PI/2;
 // Mounting plate, paired load paths and hardware at the shoulder.
 add("Arm_hull_mounting_plate",boxGeo(.26,.045,.20),teal,[.28,.92,.53],root,[-42,0,0]);
 beam("Shoulder_mount_forward",[.39,.92,.57],ARM_ROOT,.033,steel);
 beam("Shoulder_mount_aft",[.17,.92,.57],ARM_ROOT,.033,steel);
 for(const xx of [.18,.38])add("Mount_captive_bolt_"+xx,cylinderXGeo(.016,.016,.025,8),steel,[xx,.90,.60],root,[0,90,0]);
 const shoulder=createPivot("Arm_shoulder",ARM_ROOT,root);shoulder.rotation.z=-50*Math.PI/180;
 function joint(n,parent,pos,r){add(n,cylinderXGeo(r,r,.115,28),teal,pos,parent,[0,90,0]);add(n+"_axle",cylinderXGeo(r*.46,r*.46,.135,12),steel,pos,parent,[0,90,0]);}
 joint("Shoulder_rotary_housing",shoulder,[0,0,0],.079);
 for(const zz of [-.039,.039])beam("Upper_link_rail_"+zz,[.025,0,zz],[.405,0,zz],.027,ivory,shoulder);
 add("Upper_link_spine",boxGeo(.29,.052,.047),teal,[.21,0,0],shoulder);
 const elbow=createPivot("Arm_elbow",[.43,0,0],shoulder);elbow.rotation.z=65*Math.PI/180;
 joint("Elbow_bearing",elbow,[0,0,0],.06);
 beam("Forearm_tube",[.015,0,0],[.34,0,0],.028,ivory,elbow);
 beam("Forearm_actuator",[.05,-.049,0],[.29,-.049,0],.013,steel,elbow);
 const wrist=createPivot("Arm_wrist",[.37,0,0],elbow);wrist.rotation.z=-15*Math.PI/180;
 joint("Wrist_micro_gimbal",wrist,[0,0,0],.035);
 add("Measurement_head",boxGeo(.085,.053,.072),black,[.064,0,0],wrist);
 for(const zz of [-.026,.026])beam("Fine_conductivity_probe_"+zz,[.1,0,zz],[.23,-.025,zz],.005,steel,wrist);
 add("Tool_optical_tip",cylinderXGeo(.012,.012,.007,20),amber,[.11,.008,0],wrist);
 // Harness segments end concentrically on joint axes; service loops rotate with each link.
 pipe("Shoulder_rotating_service_loop",[[0,0,.087],[-.06,.09,.087],[.075,.10,.087],[.10,.045,.087],[.37,.045,.087],[.43,0,.087]],.009,black,shoulder);
 pipe("Elbow_rotating_service_loop",[[0,0,.087],[-.035,.08,.087],[.08,.085,.087],[.13,.04,.087],[.37,0,.087]],.007,black,elbow);
 pipe("Tool_harness",[[0,0,.087],[.02,.045,.072],[.09,.03,.035]],.006,black,wrist);
 pipe("Hull_to_shoulder_feed",[[.15,.96,.53],[.10,1.01,.73],[ARM_ROOT[0],ARM_ROOT[1],ARM_ROOT[2]+.087]],.012,black);
 // Discrete working lights, skid and mast.
 for(const sign of [-1,1]){
  beam("Lamp_recess_"+sign,[1.09,.96,sign*.35],[1.25,.98,sign*.39],.062,teal);
  add("Warm_work_lamp_"+sign,cylinderXGeo(.042,.042,.012,24),amber,[1.258,.981,sign*.392]);
  pipe("Landing_runner_"+sign,[[-1.10,.58,sign*.40],[-.91,.50,sign*.44],[.50,.50,sign*.44],[.65,.60,sign*.42]],.025,teal);
  for(const xx of [-.8,.45])beam("Runner_strut_"+sign+"_"+xx,[xx,.53,sign*.44],[xx,.85,sign*.37],.018,steel);
 }
 beam("Telemetry_mast",[-.65,1.62,0],[-.73,1.98,0],.013,steel);
 add("Mast_cap",sphereGeo(.026,16,12),black,[-.73,1.98,0]);
 // Purposeful small registration marks atop the broad fairing.
 for(let i=0;i<4;i++)add("S4_registration_bar_"+i,boxGeo(.022,.008,.09),teal,[-.03+i*.045,1.773,.035]);
 add("Safety_index",boxGeo(.08,.009,.032),amber,[.71,1.804,0]);
 return root;
}
function animate(){
 const keys=(a,b,c)=>[{time:0,rotation:[0,0,a]},{time:1.6,rotation:[0,0,b]},{time:3.2,rotation:[0,0,c]},{time:4.8,rotation:[0,0,a]}];
 return [createClip("Survey_reach",4.8,[rotationTrack("Joint_Arm_shoulder",keys(-50,-67,-42)),rotationTrack("Joint_Arm_elbow",keys(65,43,52)),rotationTrack("Joint_Arm_wrist",keys(-15,24,-10))])];
}
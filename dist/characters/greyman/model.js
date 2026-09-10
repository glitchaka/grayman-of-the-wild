import * as T from 'three';
import {mergeGeometries} from '../../vendor/BufferGeometryUtils.js';
// Palette sampled from the supplied Aseprite sheet. Front is +Z; one unit = one meter.
const COLORS=[0x515262,0x63787d,0x8ea091,0xc9cca1,0xae6a47,0xcaa05a,0x8b4049];
const FRONT=['....00000000....','...0111111110...','...0112222110...','...0122222210...','...0122222210...','...0122222210...','...0112222110...','...0111111110...','....00000000....'];
const U=.125;
export function createGreyMan(){
 const root=new T.Group();root.name='GreyMan';root.userData={height:1.75,unit:'meter',source:'GreyMan-Idle-Run-Action.aseprite',description:'Volumetric articulated interpretation of the supplied 16px character. Side depth and joint motion are modeled interpretations.'};
 const tones=new T.DataTexture(new Uint8Array([75,145,215,255]),4,1,T.RedFormat);tones.needsUpdate=true;tones.minFilter=tones.magFilter=T.NearestFilter;
 const materials=COLORS.map(c=>new T.MeshToonMaterial({color:c,gradientMap:tones}));
 const nodes={};function pivot(name,parent,x,y,z){const g=new T.Group();g.name=name;g.position.set(x,y,z);parent.add(g);nodes[name]=g;return g;}
 const body=pivot('Body',root,0,.69,0),hood=pivot('Hood',body,0,.24,0);const bins=new Map();
 function voxel(parent,color,x,y,z,w,h,d){let key=parent.name+':'+color;if(!bins.has(key))bins.set(key,{parent,color,geos:[]});const g=new T.BoxGeometry(w,h,d);g.translate(x,y,z);bins.get(key).geos.push(g);}
 // Rounded stepped hood shell: separate front aperture, side walls, crown and closed back.
 for(let row=0;row<FRONT.length;row++)for(let x=0;x<16;x++){const token=FRONT[row][x];if(token==='.')continue;const color=+token,px=(x-7.5)*U,py=(8-row)*U-.2425;const edge=color===0;const top=row===0;const maxDepth=top?2:3;
  for(let iz=-maxDepth;iz<=maxDepth;iz++){
   const isFront=iz===maxDepth,isBack=iz===-maxDepth;
   // Round the rear corners so the head has a hood-shaped cross section.
   if(Math.abs(px)>.49&&iz<-1)continue;
   const side=(x===0||FRONT[row][x-1]==='.'||x===15||FRONT[row][x+1]==='.');
   if(!isFront&&!isBack&&!side&&!top&&row!==8)continue;
   if(isFront&&color>=2)continue;
   const shade=isFront?color:(isBack?1:edge?0:1);
   voxel(hood,shade,px,py,iz*U,U,U,U);
  }
  // The visible face is recessed into the hood, with each source pixel retained as a small solid voxel.
  if(color>=2)voxel(hood,2,px,py,.27,U,U,.16);
 }
 // A single eye faces +Z: the amber pixels are the iris, not an offset skin patch.
 voxel(hood,2,0,.3,.26,.62,.49,.24);
 voxel(hood,3,0,.31,.39,.48,.32,.12);
 voxel(hood,3,0,.31,.405,.34,.43,.1);
 voxel(hood,5,0,.31,.478,.255,.29,.085);
 voxel(hood,4,0,.31,.518,.145,.245,.04);
 voxel(hood,0,0,.31,.543,.064,.18,.02);
 voxel(hood,3,-.062,.402,.544,.044,.045,.022);
 // Thick inner cowl behind the aperture; the back is sealed, never a billboard.
 voxel(hood,1,0,.3,-.24,.75,.72,.3);
 voxel(body,0,0,0,0,.68,.42,.43);voxel(body,1,0,.025,.035,.58,.35,.42);
 voxel(body,0,0,-.19,.02,.75,.1,.47);voxel(body,1,0,-.15,-.08,.66,.1,.39);
 voxel(body,6,0,-.09,-.238,.39,.19,.035);voxel(body,4,0,.13,.253,.12,.12,.065);
 for(const side of [-1,1]){
  const label=side<0?'L':'R';const arm=pivot('Arm'+label,body,side*.43,.105,0);
  voxel(arm,0,0,-.1,0,.22,.3,.32);voxel(arm,1,0,-.09,.04,.19,.27,.28);
  const elbow=pivot('Forearm'+label,arm,0,-.22,0);voxel(elbow,0,0,-.095,0,.21,.23,.29);voxel(elbow,1,0,-.085,.015,.18,.18,.26);voxel(elbow,6,0,-.07,.156,.125,.2,.05);voxel(elbow,4,0,-.18,.025,.14,.1,.2);
  const leg=pivot('Leg'+label,body,side*.195,-.22,0);voxel(leg,0,0,-.095,0,.22,.23,.26);voxel(leg,1,0,-.09,.025,.125,.21,.25);
  const shin=pivot('Shin'+label,leg,0,-.17,0);voxel(shin,0,0,-.07,0,.21,.21,.27);voxel(shin,1,0,-.07,.034,.12,.18,.25);
  voxel(shin,0,0,-.215,.06,.245,.17,.39);voxel(shin,1,0,-.15,.11,.16,.065,.3);
 }
 for(const {parent,color,geos}of bins.values()){const geometry=mergeGeometries(geos,false);geos.forEach(g=>g.dispose());const mesh=new T.Mesh(geometry,materials[color]);mesh.name=parent.name+'_color_'+color;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);}
 const clips=makeClips(nodes);const mixer=new T.AnimationMixer(root),actions={};for(const clip of clips)actions[clip.name]=mixer.clipAction(clip);actions.Action.setLoop(T.LoopOnce,1);actions.Action.clampWhenFinished=true;
 let current='Idle',actionRemaining=0;actions.Idle.play();
 const sparks=new T.Group();sparks.name='Action_particles';root.add(sparks);const sparkMaterial=new T.MeshBasicMaterial({color:COLORS[3]});for(let i=0;i<10;i++){const m=new T.Mesh(new T.BoxGeometry(.035,.035,.035),sparkMaterial);sparks.add(m)}sparks.visible=false;
 function play(name){if(current===name)return;actions[current].fadeOut(.12);actions[name].reset().fadeIn(.12).play();current=name;}
 function trigger(){if(actionRemaining>0)return;actionRemaining=.65;play('Action');}
 function update(dt,speed=0,running=false){if(actionRemaining>0){actionRemaining=Math.max(0,actionRemaining-dt);sparks.visible=true;const t=1-actionRemaining/.65;sparks.children.forEach((p,i)=>{const a=i*2.399;p.position.set(Math.cos(a)*(.13+t*.38),.5+Math.sin(a)*.25+t*.22,.45+t*.42);p.scale.setScalar(Math.max(0,1-t));});}else{sparks.visible=false;play(speed>.02?(running?'Run':'Walk'):'Idle');}mixer.update(dt);}
 async function exportGLB(){const {GLTFExporter}=await import('../../vendor/GLTFExporter.js');const fresh=createGreyMan();fresh.mixer.stopAllAction();fresh.sparks.removeFromParent();fresh.root.traverse(n=>{if(n.isMesh)n.material=new T.MeshStandardMaterial({color:n.material.color,roughness:1});});return new GLTFExporter().parseAsync(fresh.root,{binary:true,onlyVisible:false,animations:fresh.clips});}
 return {root,clips,mixer,update,trigger,exportGLB,sparks};
}
function makeClips(nodes){
 function build(name,duration,pose){const tracks=[],steps=32;for(const [id,node]of Object.entries(nodes)){const times=[],rotations=[],positions=[];for(let i=0;i<=steps;i++){const t=i/steps,p=pose(t,id),q=new T.Quaternion().setFromEuler(new T.Euler(...(p.r||[0,0,0])));times.push(t*duration);rotations.push(q.x,q.y,q.z,q.w);positions.push(node.position.x+(p.p?.[0]||0),node.position.y+(p.p?.[1]||0),node.position.z+(p.p?.[2]||0));}tracks.push(new T.QuaternionKeyframeTrack(id+'.quaternion',times,rotations),new T.VectorKeyframeTrack(id+'.position',times,positions));}return new T.AnimationClip(name,duration,tracks)}
 const idle=build('Idle',1.6,(t,id)=>{const s=Math.sin(t*Math.PI*2);return id==='Body'?{p:[0,s*.012,0]}:id==='Hood'?{r:[s*.014,0,0]}:id.startsWith('Arm')?{r:[.025,0,(id.endsWith('L')?1:-1)*(.035+s*.01)]}:{}});
 function locomotion(name,duration,amp){return build(name,duration,(t,id)=>{const a=t*Math.PI*2,sign=id.endsWith('L')?1:-1,s=Math.sin(a)*sign;if(id==='Body')return {p:[0,Math.sin(a*2)*amp*.035,0],r:[amp*.08,Math.sin(a)*amp*.045,Math.sin(a)*amp*.02]};if(id==='Hood')return {r:[-amp*.035+Math.sin(a*2)*.012,-Math.sin(a)*amp*.025,0]};if(id.startsWith('Leg'))return {r:[s*amp,0,0]};if(id.startsWith('Shin'))return {r:[Math.max(0,-s)*amp*.9,0,0]};if(id.startsWith('Arm'))return {r:[-s*amp*.8,0,-sign*.07]};if(id.startsWith('Forearm'))return {r:[-.15-Math.max(0,s)*amp*.55,0,0]};return {}})}
 const action=build('Action',.65,(t,id)=>{const wave=Math.sin(Math.PI*t),swing=Math.sin(Math.PI*Math.min(1,t*1.4));if(id==='Body')return {r:[.1*wave,-.25*wave,0],p:[0,-.05*wave,0]};if(id==='ArmR')return {r:[-1.65*swing,0,-.15*wave]};if(id==='ForearmR')return {r:[-.5*wave,0,0]};if(id==='Hood')return {r:[-.05*wave,.2*wave,0]};return {}});
 return [idle,locomotion('Walk',.8,.42),locomotion('Run',.5,.7),action];
}

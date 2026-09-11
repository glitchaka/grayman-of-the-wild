import * as T from 'three';
const SPECIES={
 rabbit:{name:'Conejo',hp:8,speed:4.6,meat:1,hide:0,mode:'flee',color:0xb4a18a,size:.6},
 deer:{name:'Ciervo',hp:20,speed:5.1,meat:3,hide:1,mode:'flee',color:0xa47b51,size:1},
 boar:{name:'Jabalí',hp:30,speed:3.9,meat:3,hide:1,mode:'territorial',color:0x736457,size:.9},
 wolf:{name:'Lobo',hp:26,speed:4.5,meat:2,hide:2,mode:'hostile',color:0x87938c,size:.85},
 spider:{name:'Araña gigante',hp:35,speed:4.3,meat:1,hide:0,silk:2,venom:1,mode:'hostile',color:0x22252c,size:.85,nocturnal:true},
 werewolf:{name:'Hombre lobo',hp:55,speed:5.2,meat:3,hide:3,claws:2,mode:'hostile',color:0x3c342c,size:1.15,nocturnal:true},
 specter:{name:'Espectro',hp:42,speed:4.0,meat:0,hide:0,ectoplasm:2,mode:'hostile',color:0x6be0d0,size:.9,nocturnal:true,ethereal:true}
};
export function createWildlife({world,visual,character,greyMan,state,now,active,unlocked,reward,beginEncounter,spend,save,toast,lineFree}){
 const animals=[],defs=[
  ['rabbit',-52,79],['rabbit',-68,70],['deer',-37,65],['deer',-81,40],['boar',-91,20],['rabbit',-28,39],['deer',31,42],['boar',31,10],['wolf',-82,-13],['wolf',-44,-45],['rabbit',20,-27],['boar',-30,-75],
  ['spider',-70,22],['spider',-36,50],['spider',-58,-22],['spider',22,-18],
  ['werewolf',-86,32],['werewolf',-32,-52],['werewolf',14,22],['wolf',-18,-50],['wolf',-62,35],
  ['specter',38,-20],['specter',-68,-58],['specter',-12,-38]
 ];
 const getMinute=()=>Math.floor((now()%1080)/1080*1440+480)%1440;
 const isNight=()=>{const m=getMinute();return m>=1230||m<330};
 const isDuskOrNight=()=>{const m=getMinute();return m>=1080||m<360};
 let attackCooldown=0,pending=null;const spear=new T.Group();spear.name='Lance_de_chasse';spear.position.set(0,-.15,.12);character.getObjectByName('ForearmR').add(spear);spear.visible=false;
 function updateWeaponVisual(){
  const w=state.equipment?.weapon||(state.spear?'spear':'none');
  if(spear.userData.currentWeapon===w)return;
  spear.userData.currentWeapon=w;
  while(spear.children.length)spear.remove(spear.children[0]);
  if(w==='spear'){
   visual.box(spear,0,-.4,0,.055,1.2,.055,0x92704e);
   visual.box(spear,0,-1.04,0,.12,.25,.08,0xb5c9c0);
  }else if(w==='sword'){
   visual.box(spear,0,-.1,0,.06,.18,.06,0x543d2b);
   visual.box(spear,0,-.22,0,.26,.05,.08,0x3a4247);
   visual.box(spear,0,-.62,0,.09,.75,.035,0xd9e3e8);
   visual.box(spear,0,-1.02,0,.05,.12,.03,0xd9e3e8);
  }else if(w==='daggers'){
   visual.box(spear,0,-.08,0,.05,.15,.05,0x423528);
   visual.box(spear,0,-.18,0,.15,.04,.06,0x2b241e);
   visual.box(spear,0,-.38,0,.07,.36,.025,0x28231f);
  }else if(w==='bow'){
   visual.box(spear,0,-.1,0,.05,.2,.06,0x523722);
   visual.box(spear,0,.3,0,.04,.45,.05,0x785032);
   visual.box(spear,0,-.3,0,.04,.45,.05,0x785032);
   visual.box(spear,-.08,0,0,.012,1.02,.012,0xf5f7fa);
  }
 }
 function model(type,x,z,y){
  const def=SPECIES[type],g=visual.group('Faune_'+type,x,z,y),b=(x,y,z,w,h,d,c)=>visual.box(g,x,y,z,w,h,d,c),legs=[];
  if(type==='spider'){
   b(0,.4,.12,.48,.34,.45,0x1b1e22);b(0,.55,-.42,.72,.52,.75,0x252a32);b(0,.58,-.4,.22,.12,.4,0x8b3240);
   for(const side of [-1,1]){b(side*.12,.48,.36,.06,.06,.06,0xff2222);b(side*.05,.52,.37,.05,.05,.05,0xff2222)}
   for(let side of [-1,1]){for(let k=0;k<4;k++){const leg=new T.Group();leg.position.set(side*.24,.4,.25-k*.18);g.add(leg);visual.box(leg,side*.2,.15,0,.38,.07,.07,0x1a1d20);visual.box(leg,side*.4,-.15,0,.07,.45,.07,0x2b3038);legs.push(leg)}}
  }else if(type==='werewolf'){
   b(0,1.2,0,.75,.8,.58,def.color);b(0,1.52,-.08,.82,.46,.65,0x2b241d);
   b(0,1.75,.35,.42,.38,.5,def.color);b(0,1.64,.62,.26,.2,.28,0x231d17);
   for(const side of [-1,1]){b(side*.16,1.82,.52,.06,.06,.06,0xffd700);b(side*.18,2.02,.22,.12,.22,.08,0x2b241d);b(side*.12,1.54,.72,.03,.08,.03,0xeeeedd)}
   for(const side of [-1,1]){const arm=new T.Group();arm.position.set(side*.45,1.4,.1);g.add(arm);visual.box(arm,0,-.35,.05,.2,.75,.22,def.color);visual.box(arm,0,-.78,.12,.24,.18,.3,0x1f1a14);legs.push(arm)}
   for(const side of [-1,1]){const leg=new T.Group();leg.position.set(side*.22,.65,-.05);g.add(leg);visual.box(leg,0,-.28,0,.22,.6,.24,def.color);visual.box(leg,0,-.62,.06,.24,.16,.32,0x241e18);legs.push(leg)}
   const tail=b(0,.9,-.4,.18,.2,.75,def.color);tail.rotation.x=-.5;
  }else if(type==='specter'){
   b(0,1.45,0,.5,.52,.48,def.color);b(0,1.4,.16,.32,.28,.14,0x182824);
   for(const side of [-1,1])b(side*.09,1.42,.22,.06,.06,.06,0xa5fff4);
   b(0,.9,0,.62,.72,.55,0x54c4b6);b(0,.38,-.05,.48,.5,.45,0x429e92);
   for(const side of [-1,1]){const arm=new T.Group();arm.position.set(side*.38,1.05,.1);g.add(arm);visual.box(arm,0,-.25,0,.16,.45,.2,0x7ef5e6);legs.push(arm)}
  }else{
   b(0,.68,0,.6,.58,1.1,def.color);b(0,1,.6,.42,.46,.5,def.color);b(0,.85,.9,.31,.23,.35,type==='boar'?0x9c8572:def.color);b(0,.88,1.08,.2,.12,.05,0x38473e);
   for(const side of [-1,1]){b(side*.2,1.08,.8,.045,.07,.09,0x222e2b);b(side*.17,type==='rabbit'?1.58:1.33,.6,.12,type==='rabbit'?.65:.24,.16,def.color)}
   for(const xx of [-.22,.22])for(const zz of [-.35,.35]){const leg=new T.Group();leg.position.set(xx,.52,zz);g.add(leg);visual.box(leg,0,-.24,0,.16,.48,.18,def.color);visual.box(leg,0,-.49,.03,.18,.1,.23,0x474d40);legs.push(leg)}
   if(type==='deer')for(const side of [-1,1]){b(side*.24,1.65,.56,.07,.75,.07,0xc5ba93);b(side*.36,1.87,.56,.3,.07,.07,0xc5ba93);b(side*.48,1.97,.56,.06,.22,.07,0xc5ba93)}
   if(type==='boar')for(const side of [-1,1])b(side*.19,.92,1.04,.07,.25,.07,0xdad5b7);
   const tail=b(0,.8,-.73,.16,.18,type==='wolf'?.8:.25,def.color);tail.rotation.x=.3;
  }
  g.scale.setScalar(def.size);return{g,legs};
 }
 defs.forEach(([type,x,z],i)=>{const spawn=visual.clearSpot(x,z,1);if(!spawn)return;const id='animal-'+i,def=SPECIES[type],s=state.animals[id]??={hp:def.hp,x:spawn.x,z:spawn.z,deadAt:null,looted:false};const y=world.elevation(s.x,s.z);if(!world.canMove(s.x,s.z,y,new Set(),true)){s.x=spawn.x;s.z=spawn.z}const {g,legs}=model(type,s.x,s.z,world.elevation(s.x,s.z));animals.push({id,type,def,s,g,legs,home:spawn,heading:i*2.4,decision:0,alarm:0,hit:0,bite:0,target:new T.Vector3(),moving:0})});
 function reachable(a,range=2.6){return Math.abs(character.position.y-a.g.position.y)<1.8&&Math.hypot(character.position.x-a.s.x,character.position.z-a.s.z)<range&&lineFree(a.s.x,a.s.z,a.g.position.y)}
 function weaponDamage(){
  let d=state.spear?10:4;const w=state.equipment?.weapon;
  if(w==='bow')d=18;else if(w==='daggers')d=16;else if(w==='sword')d=14;else if(w==='spear')d=10;
  if((state.buffs?.strength||0)>0)d=Math.round(d*1.5);if((state.buffs?.poisonWeapon||0)>0)d+=8;
  return d;
 }
 function hit(a){if(!active()||a.s.hp<=0||!reachable(a,3.2))return;const damage=weaponDamage();a.s.hp=Math.max(0,a.s.hp-damage);a.alarm=10;a.hit=.25;if(a.s.hp===0){a.s.deadAt=now();a.s.looted=false;reward('hunting',24,1);toast(`${a.def.name} abatido · Recoge el botín`)}else toast(`${a.def.name} · ${a.s.hp}/${a.def.hp}`);save()}
 function attack(a){if(a.def.mode!=='flee'){if(reachable(a,3.2))beginEncounter(a);return}if(attackCooldown>0||a.s.hp<=0||!reachable(a,3.2)||!spend(3))return;attackCooldown=.8;character.rotation.y=Math.atan2(a.s.x-character.position.x,a.s.z-character.position.z);greyMan.trigger();pending={a,t:.3};a.alarm=10;}
 function interaction(){
  let found=null;const night=isNight(),duskOrNight=isDuskOrNight();
  for(const a of animals){
   if(a.s.looted||!reachable(a,3))continue;
   if(a.def.nocturnal&&!night&&a.s.hp>0)continue;
   if((a.type==='rabbit'||a.type==='deer')&&duskOrNight&&a.s.hp>0&&a.alarm<=0&&!a.g.visible)continue;
   const dist=Math.hypot(a.s.x-character.position.x,a.s.z-character.position.z);if(found&&dist>=found.dist)continue;
   found={x:a.s.x,z:a.s.z,y:a.g.position.y,dist,label:a.s.hp>0?`Cazar ${a.def.name.toLowerCase()} · ${a.s.hp}/${a.def.hp}`:'Recoger botín',fn:()=>{
    if(!reachable(a,3))return;
    if(a.s.hp>0)attack(a);
    else{
     a.s.looted=true;state.food.raw+=a.def.meat;state.hide+=a.def.hide;state.loot??={venom:0,silk:0,claws:0,ectoplasm:0};
     let extra='';
     if(a.def.venom){state.loot.venom=(state.loot.venom||0)+a.def.venom;extra+=` · +${a.def.venom} veneno`}
     if(a.def.silk){state.loot.silk=(state.loot.silk||0)+a.def.silk;extra+=` · +${a.def.silk} seda`}
     if(a.def.claws){state.loot.claws=(state.loot.claws||0)+a.def.claws;extra+=` · +${a.def.claws} garras`}
     if(a.def.ectoplasm){state.loot.ectoplasm=(state.loot.ectoplasm||0)+a.def.ectoplasm;extra+=` · +${a.def.ectoplasm} ectoplasma`}
     toast(`+${a.def.meat} carne cruda${a.def.hide?' · +'+a.def.hide+' piel':''}${extra}`);save();
    }
   }}
  }
  return found;
 }
 function update(dt){
  updateWeaponVisual();
  const hasW=state.spear||(state.equipment?.weapon&&state.equipment?.weapon!=='none');
  spear.visible=!!hasW&&attackCooldown>0;
  if(spear.visible){const tool=character.getObjectByName('Herramienta_recoleccion');if(tool)tool.visible=false}
  attackCooldown=Math.max(0,attackCooldown-dt);
  if(pending){pending.t-=dt;if(pending.t<=0){hit(pending.a);pending=null}}
  if(!active())return;
  const night=isNight(),duskOrNight=isDuskOrNight();
  for(const a of animals){
   const {s,g,def}=a;const distance=Math.hypot(character.position.x-s.x,character.position.z-s.z);
   a.bite=Math.max(0,a.bite-dt);a.hit=Math.max(0,a.hit-dt);a.alarm=Math.max(0,a.alarm-dt);
   if(s.hp<=0){
    if(s.looted&&now()-s.deadAt>1200&&distance>25){s.hp=def.hp;s.looted=false;s.deadAt=null;s.x=a.home.x;s.z=a.home.z;save()}
    else{g.visible=!s.looted;g.rotation.z=Math.PI/2;g.position.y=world.elevation(s.x,s.z)+.2;continue}
   }
   if(def.nocturnal&&!night){g.visible=false;continue}
   const isDiurnal=a.type==='rabbit'||a.type==='deer';
   const homeDistance=Math.hypot(s.x-a.home.x,s.z-a.home.z);
   if(isDiurnal&&duskOrNight&&a.alarm<=0){
    if(homeDistance<1.5){g.visible=false;continue}
   }
   if(distance>45){g.visible=false;continue}
   g.visible=true;g.rotation.z=a.hit>0?Math.sin(a.hit*50)*.13:0;
   if(def.ethereal){g.position.y=world.elevation(s.x,s.z)+.45+Math.sin(now()*2.8)*.22;g.rotation.z=Math.sin(now()*1.5)*.06}
   const sensed=distance<(def.mode==='hostile'?9:def.mode==='territorial'?4.7:6)&&Math.abs(character.position.y-g.position.y)<2.2&&lineFree(s.x,s.z,g.position.y);
   const chasing=now()>=(state.peaceUntil||0)&&(def.mode!=='flee')&&(sensed||a.alarm>0)&&distance<18&&homeDistance<28;
   if(a.type==='wolf'&&(chasing||a.alarm>0)){
    for(const other of animals){
     if(other!==a&&other.type==='wolf'&&other.s.hp>0&&Math.hypot(other.s.x-s.x,other.s.z-s.z)<22){other.alarm=Math.max(other.alarm,8)}
    }
   }
   let dx=0,dz=0,speed=0;
   if(def.mode==='flee'&&(sensed||a.alarm>0)){dx=s.x-character.position.x;dz=s.z-character.position.z;speed=def.speed;a.decision=0}
   else if(isDiurnal&&duskOrNight&&a.alarm<=0){dx=a.home.x-s.x;dz=a.home.z-s.z;speed=2.2}
   else if(chasing){
    dx=character.position.x-s.x;dz=character.position.z-s.z;speed=def.speed;
    if(distance<1.6){speed=0;if(a.bite<=0&&lineFree(s.x,s.z,g.position.y)){a.bite=1.8;if(beginEncounter(a,true))return}}
   }else{
    a.decision-=dt;if(a.decision<=0){a.decision=2.5+Math.random()*4;a.heading+=1+Math.random()*3;a.moving=Math.random()>.3?1:0}
    if(homeDistance>14){dx=a.home.x-s.x;dz=a.home.z-s.z;speed=1.6}else if(a.moving){dx=Math.sin(a.heading);dz=Math.cos(a.heading);speed=.65}
   }
   const len=Math.hypot(dx,dz);
   if(len>.01&&speed){
    dx=dx/len*speed*dt;dz=dz/len*speed*dt;let moved=false;
    if(world.canMove(s.x+dx,s.z,g.position.y,unlocked)){s.x+=dx;moved=true}
    if(world.canMove(s.x,s.z+dz,g.position.y,unlocked)){s.z+=dz;moved=true}
    if(!moved){a.heading+=1.5;a.decision=1;speed=0}else g.rotation.y=Math.atan2(dx,dz);
   }
   if(!def.ethereal)g.position.set(s.x,world.elevation(s.x,s.z),s.z);else g.position.x=s.x,g.position.z=s.z;
   if(a.type==='spider'){
    for(let i=0;i<a.legs.length;i++){
     const side=i<4?-1:1,k=i%4;
     const phase=now()*(speed?speed*4.5:1.2)+(k%2===0?0:Math.PI)+(side>0?Math.PI:0);
     a.legs[i].rotation.y=speed?Math.sin(phase)*.32:Math.sin(now()*1.5+i)*.05;
     a.legs[i].rotation.z=speed?side*(Math.cos(phase)*.2+.08):0;
    }
   }else if(a.type==='werewolf'){
    for(let i=0;i<a.legs.length;i++){
     const isArm=i<2;
     a.legs[i].rotation.x=speed?Math.sin(now()*speed*4+(i%2===0?0:Math.PI))*(isArm?.75:.5):0;
    }
   }else{
    for(let i=0;i<a.legs.length;i++)a.legs[i].rotation.x=speed?Math.sin(now()*speed*4+(i%2===0?0:Math.PI))*.5:0;
   }
  }
 }
 return {update,interaction,blocks:(x,z)=>animals.some(a=>a.s.hp>0&&(!a.def.nocturnal||isNight())&&Math.abs(character.position.y-a.g.position.y)<1.5&&Math.hypot(x-a.s.x,z-a.s.z)<.45*a.def.size+.35),animals};
}

import * as T from 'three';
const FISH=[{id:'perch',name:'Perca del arroyo',hp:28,power:7,color:0x83b891,value:1,xp:24},{id:'trout',name:'Trucha plateada',hp:38,power:9,color:0x8bb9bf,value:2,xp:34},{id:'carp',name:'Carpa dorada',hp:48,power:11,color:0xd0ad63,value:3,xp:46}];
export function createEncounters({state,character,save,onWin,onDefeat,onWake,onLeave}){
 const dialog=document.createElement('dialog');dialog.id='encounter';dialog.setAttribute('aria-label','Encuentro por turnos');dialog.innerHTML='<div class="encounter-top"><small id="encounterKind"></small><span id="encounterTurn"></span></div><div id="encounterStage"><div class="combat-status enemy-status"><b id="enemyName"></b><span id="enemyLevel"></span><div class="combat-hp"><i id="enemyBar"></i></div><small id="enemyHealth"></small></div><div class="combat-status player-status"><b>GreyMan</b><span id="playerLevel"></span><div class="combat-hp"><i id="playerBar"></i></div><small id="playerHealth"></small></div></div><div class="encounter-bottom"><p id="battleMessage" role="status" aria-live="polite"></p><small id="battleIntent"></small><div id="battleActions"></div></div>';document.body.append(dialog);
 const $=id=>dialog.querySelector('#'+id);let current=null,phase='idle',timer=0,queued=null,renderer=null,scene=null,camera=null,hero=null,opponent=null,elapsed=0,pulse=0;
 dialog.addEventListener('cancel',e=>e.preventDefault());window.addEventListener('keydown',e=>{if(!dialog.open)return;if(['KeyW','KeyA','KeyS','KeyD','KeyE','KeyI','Escape','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation()}if(/^Digit[1-4]$/.test(e.code)&&!e.repeat){e.preventDefault();e.stopImmediatePropagation();const b=$('battleActions').querySelectorAll('button')[Number(e.code.slice(-1))-1];if(b&&!b.disabled)b.click()}},true);
 const fishDef=id=>FISH.find(f=>f.id===id)||FISH[0];
 function fishModel(f){const g=new T.Group(),mat=new T.MeshToonMaterial({color:f.color});function b(x,y,z,w,h,d,color){const m=new T.Mesh(new T.BoxGeometry(w,h,d),color?new T.MeshToonMaterial({color}):mat);m.position.set(x,y,z);g.add(m);return m}b(0,1,0,.7,.7,1.45);b(0,1,.65,.5,.48,.55);b(0,1,-1,.08,.85,.65);b(0,1.48,-.15,.08,.38,.55);for(const side of [-1,1]){b(side*.44,.83,.05,.35,.08,.45);b(side*.255,1.12,.84,.06,.09,.1,0x233d39)}return g}
 function disposeStage(){if(renderer){renderer.dispose();renderer.domElement.remove()}renderer=scene=camera=hero=opponent=null}
 function equipHeroModel(heroInstance){
  const forearmR=heroInstance.getObjectByName('ForearmR'),forearmL=heroInstance.getObjectByName('ForearmL'),body=heroInstance.getObjectByName('Body'),hood=heroInstance.getObjectByName('Hood');
  if(!forearmR)return;
  const w=state.equipment?.weapon,a=state.equipment?.armor,h=state.equipment?.helmet;
  function addBox(parent,x,y,z,w,h,d,color,matProps={}){const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshToonMaterial({color,...matProps}));m.position.set(x,y,z);parent.add(m);return m}
  if(w==='spear'||(!w&&state.spear)){
   const g=new T.Group();g.name='Hero_Spear';g.position.set(0,-.2,.1);
   addBox(g,0,-.45,0,.055,1.3,.055,0x8b6540);addBox(g,0,-1.15,0,.11,.28,.065,0xc2d0d6);forearmR.add(g);
  }else if(w==='sword'){
   const g=new T.Group();g.name='Hero_Sword';g.position.set(0,-.15,.1);
   addBox(g,0,-.1,0,.06,.18,.06,0x543d2b);addBox(g,0,-.22,0,.26,.05,.08,0x3a4247);addBox(g,0,-.62,0,.09,.75,.035,0xd9e3e8);addBox(g,0,-1.02,0,.05,.12,.03,0xd9e3e8);addBox(g,0,0,0,.08,.06,.08,0xb09555);forearmR.add(g);
  }else if(w==='daggers'){
   for(const [parent,side] of [[forearmR,1],[forearmL,-1]]){
    if(!parent)continue;
    const g=new T.Group();g.name='Hero_Dagger';g.position.set(0,-.15,.1);
    addBox(g,0,-.08,0,.05,.15,.05,0x423528);addBox(g,0,-.18,0,.15,.04,.06,0x2b241e);
    const blade=addBox(g,side*.02,-.38,0,.07,.36,.025,0x28231f);blade.rotation.z=side*-.12;
    addBox(blade,side*.03,0,0,.02,.35,.028,0xd4e6de);parent.add(g);
   }
  }else if(w==='bow'&&forearmL){
   const g=new T.Group();g.name='Hero_Bow';g.position.set(0,-.15,.1);addBox(g,0,-.1,0,.05,.2,.06,0x523722);
   for(const [sy,rz] of [[1,.25],[-1,-.25]]){const limb=addBox(g,0,sy*.32,0,.04,.45,.05,0x785032);limb.rotation.z=rz}
   addBox(g,-.08,0,0,.012,1.02,.012,0xf5f7fa);forearmL.add(g);
  }
  if(body){
   if(a==='plate'){
    addBox(body,0,-.04,.23,.62,.46,.08,0x6b7782);
    for(const side of [-1,1]){const paul=addBox(body,side*.42,.12,0,.26,.14,.34,0x7d8a96);paul.rotation.z=side*-.2}
   }else if(a==='leather'){
    addBox(body,0,-.03,.22,.58,.42,.06,0x70482e);addBox(body,0,-.03,.23,.6,.1,.08,0x442c1c);
   }else if(a==='specterCloak'){
    const cloak=addBox(body,0,-.15,-.24,.65,.72,.05,0x4ee0cf,{transparent:true,opacity:.78});cloak.rotation.x=.08;
   }
  }
  if(hood&&h==='hood')addBox(hood,0,.55,.32,.68,.12,.22,0x3d352b);
 }
 function stage(model){disposeStage();const holder=$('encounterStage');try{renderer=new T.WebGLRenderer({alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));holder.prepend(renderer.domElement);scene=new T.Scene();camera=new T.PerspectiveCamera(35,1,.1,40);camera.position.set(7,4.3,9);camera.lookAt(0,.9,0);scene.add(new T.HemisphereLight(0xf4f1da,0x375253,3));const sun=new T.DirectionalLight(0xffe5b6,3);sun.position.set(-3,6,4);scene.add(sun);hero=character.clone(true);hero.position.set(-2,0,1.1);hero.rotation.set(0,2.2,0);hero.visible=true;for(const name of ['Herramienta_recoleccion','Lance_de_chasse']){const m=hero.getObjectByName(name);if(m)m.visible=false}const rod=hero.getObjectByName('Canne_a_peche');if(rod)rod.visible=current.kind==='fish';if(current.kind!=='fish')equipHeroModel(hero);scene.add(hero);opponent=model?model.clone(true):fishModel(fishDef(current.fishId));opponent.position.set(2,0,-1);opponent.rotation.set(0,-.8,0);opponent.visible=true;scene.add(opponent);for(const [x,z]of [[-2,1.1],[2,-1]]){const platform=new T.Mesh(new T.CylinderGeometry(1.5,1.65,.18,32),new T.MeshToonMaterial({color:current.kind==='fish'?0x66979a:0x779165}));platform.position.set(x,-.15,z);scene.add(platform)}resize()}catch{disposeStage()}}
 function resize(){if(!renderer)return;const r=$('encounterStage').getBoundingClientRect();renderer.setSize(Math.max(1,r.width),Math.max(1,r.height));camera.aspect=r.width/Math.max(1,r.height);camera.updateProjectionMatrix()}
 window.addEventListener('resize',resize);
 function message(text){$('battleMessage').textContent=text}
 function maxHealth(){return state.equipment?.helmet==='hood'?120:100}
 function status(){if(!current)return;$('encounterKind').textContent=current.kind==='fish'?'PESCA · ENCUENTRO':'FAUNA · ENCUENTRO';$('encounterTurn').textContent='Turno '+current.turn;$('enemyName').textContent=current.name;$('enemyLevel').textContent='Nv. '+current.level;$('enemyHealth').textContent=`${Math.ceil(current.hp)} / ${current.maxHp} ${current.kind==='fish'?'resistencia':'HP'}`;$('enemyBar').style.width=Math.max(0,current.hp/current.maxHp*100)+'%';$('playerLevel').textContent='Nv. '+state.level;$('playerHealth').textContent=`${Math.ceil(state.health)} / ${maxHealth()} HP · Energía ${Math.floor(state.energy)}`;$('playerBar').style.width=Math.min(100,state.health/maxHealth()*100)+'%';$('battleIntent').textContent=phase==='player'?current.intent.label:''}
 function buttons(defs){$('battleActions').replaceChildren();for(const [label,fn,disabled=false]of defs){const b=document.createElement('button');b.textContent=label;b.disabled=disabled;b.onclick=fn;$('battleActions').append(b)}}
 function intent(){const heavy=current.turn%3===0;current.intent={heavy,label:current.kind==='fish'?(heavy?'El pez se prepara para un tirón fuerte.':'El pez forcejea bajo el agua.'):(heavy?'El animal prepara una embestida.':'El animal busca una abertura.')};}
 function menu(){phase='player';status();buttons([[current.kind==='fish'?'Recoger sedal':'Luchar',moves],['Protegerse',()=>act('guard')],['Mochila',items],[current.kind==='fish'?'Soltar el sedal':'Huir',()=>act('escape')]])}
 function moves(){if(phase!=='player')return;const fish=current.kind==='fish',isCloak=state.equipment?.armor==='specterCloak',isBow=state.equipment?.weapon==='bow',cost1=(isCloak||isBow)?1:2,cost2=(isCloak||isBow)?(isBow?3:4):5;buttons([[fish?`Recoger · ${cost1} energía`:isBow?`Disparo · ${cost1} energía`:`Golpe · ${cost1} energía`,()=>act('hit'),state.energy<cost1],[fish?`Tirón firme · ${cost2} energía`:isBow?`Tiro certero · ${cost2} energía`:`Golpe fuerte · ${cost2} energía`,()=>act('strong'),state.energy<cost2],[fish?'Ceder y recuperar':'Tomar aliento',()=>act('breathe')],['Volver',menu]])}
 function items(){if(phase!=='player')return;state.potions??={health:0,energy:0,speed:0,poisonOil:0,beastForce:0};buttons([['Poción salud · +45 HP',()=>act('potHealth'),(state.potions.health||0)<1],['Poción energía · +50 EN',()=>act('potEnergy'),(state.potions.energy||0)<1],['Fuerza bestial · +50% ATK',()=>act('potBeast'),(state.potions.beastForce||0)<1||(state.buffs?.strength||0)>0],['Aceite veneno · +8 daño',()=>act('potPoison'),(state.potions.poisonOil||0)<1||(state.buffs?.poisonWeapon||0)>0],['Guiso · +30 HP',()=>act('stew'),state.food.stew<1],['Comida cocinada · +18 HP',()=>act('meal'),(state.food.roast||0)+(state.food.grilledFish||0)<1],[current.kind==='fish'?'Baya de cebo · calma':'Bayas · +8 HP',()=>act('berry'),state.food.berries<1],['Volver',menu]])}
 function persist(){state.encounter=current;save()}
 function later(fn,delay=.8){queued=fn;timer=delay;phase='animating';buttons([]);status()}
 function finish(result){phase='result';state.encounter=null;queued=null;const ended=current;if(result==='defeat'){onDefeat(ended);message('GreyMan se desvanece…');buttons([]);document.body.classList.add('resting');timer=2.8;phase='fainted';save();return}if(result==='win'){onWin(ended);message(ended.kind==='fish'?`¡Has pescado ${ended.name.toLowerCase()}!`:`${ended.name} ha sido derrotado. Puedes recoger el botín.`)}else{onLeave(ended);message(ended.kind==='fish'?'Recoges la caña. El pez vuelve al agua.':'Te apartas del animal y terminas el encuentro.')}save();status();buttons([['Volver al mundo',close]])}
 function close(){dialog.close();document.body.classList.remove('in-encounter','resting');disposeStage();current=null;phase='idle';queued=null;onLeave(null);window.dispatchEvent(new Event('construction-relocated'))}
 function enemyTurn(guard=false){if(!current)return;let armorRed=1;const arm=state.equipment?.armor;if(arm==='plate')armorRed=.7;else if(arm==='specterCloak')armorRed=.8;else if(arm==='leather')armorRed=.85;let damage=Math.round(current.power*(current.intent.heavy?1.65:1)*(guard?.22:1)*(current.calm>0?.5:1)*armorRed);damage=Math.max(1,damage);state.health=Math.max(0,state.health-damage);state.energy=Math.max(0,state.energy-(current.kind==='fish'?1:0));if(current.calm>0)current.calm--;pulse=-1;message(`${current.kind==='fish'?'El pez da un tirón':current.intent.heavy?'El enemigo embiste':'El enemigo ataca'} · −${damage} HP${guard?' · Bloqueo':armorRed<1?' · Armadura':''}`);persist();status();if(state.health<=0){later(()=>finish('defeat'),.6);return}current.turn++;intent();persist();later(()=>{message('¿Qué hará GreyMan?');menu()})}
 function act(move){if(phase!=='player')return;let guard=false;if(move==='escape'){if(current.kind==='fish'||Math.random()<.75){finish('escape');return}message('El enemigo te cierra el paso.');later(()=>enemyTurn());return}
  if(move==='guard'||move==='breathe'){guard=true;state.energy=Math.min(100,state.energy+(move==='breathe'?12:5));message(move==='guard'?'GreyMan se protege y recupera el ritmo.':'GreyMan toma aliento y recupera 12 de energía.')}
  else if(move==='potHealth'||move==='potEnergy'||move==='potBeast'||move==='potPoison'){
   state.potions??={health:0,energy:0,speed:0,poisonOil:0,beastForce:0};state.buffs??={speed:0,strength:0,poisonWeapon:0};
   if(move==='potHealth'){if((state.potions.health||0)<1)return;state.potions.health--;state.health=Math.min(maxHealth(),state.health+45);message('GreyMan bebe la poción de salud · +45 HP recuperados.')}
   else if(move==='potEnergy'){if((state.potions.energy||0)<1)return;state.potions.energy--;state.energy=Math.min(100,state.energy+50);message('GreyMan bebe la poción de energía · +50 Energía recuperada.')}
   else if(move==='potBeast'){if((state.potions.beastForce||0)<1)return;state.potions.beastForce--;state.buffs.strength=120;message('¡GreyMan desata Fuerza Bestial! +50% daño de arma (120s).')}
   else if(move==='potPoison'){if((state.potions.poisonOil||0)<1)return;state.potions.poisonOil--;state.buffs.poisonWeapon=180;message('¡Arma untada con Aceite Venenoso! +8 daño de veneno por impacto (180s).')}
  }
  else if(move==='stew'||move==='meal'||move==='berry'){let key=move==='stew'?'stew':move==='meal'?(state.food.grilledFish>0?'grilledFish':'roast'):'berries';if(state.food[key]<1)return;state.food[key]--;if(move==='berry'&&current.kind==='fish'){current.calm=2;message('El cebo calma al pez durante dos turnos.')}else{const n=move==='stew'?30:move==='meal'?18:8;state.health=Math.min(maxHealth(),state.health+n);state.hunger=Math.min(100,state.hunger+10);message(`GreyMan recupera ${n} HP.`)}}
  else {
   const isCloak=state.equipment?.armor==='specterCloak',isBow=state.equipment?.weapon==='bow';
   const cost=(isCloak||isBow)?(move==='strong'?(isBow?3:4):1):(move==='strong'?5:2);
   if(state.energy<cost)return;
   state.energy-=cost;
   const bonus=Math.floor((state.level-1)*.65);
   let base=6;const w=state.equipment?.weapon;
   if(current.kind==='fish')base=7+Math.min(5,Math.floor((state.skills.fishing||0)/8));
   else if(w==='bow')base=18;else if(w==='daggers')base=16;else if(w==='sword')base=14;else if(w==='spear'||state.spear)base=10;
   if((state.buffs?.strength||0)>0)base=Math.round(base*1.5);
   const hit=move!=='strong'||Math.random()<.82;
   if(hit){
    let damage=Math.round((base+bonus)*(move==='strong'?1.65:1));
    const isCrit=w==='daggers'&&Math.random()<.35;
    if(isCrit)damage=Math.round(damage*1.75);
    if((state.buffs?.poisonWeapon||0)>0)damage+=8;
    current.hp=Math.max(0,current.hp-damage);pulse=1;
    let extraMsg='';if(isCrit)extraMsg+=' · ¡GOLPE CRÍTICO!';if((state.buffs?.poisonWeapon||0)>0)extraMsg+=' (+veneno)';
    message(`${current.kind==='fish'?'Recoges el sedal':'El impacto alcanza al enemigo'} · −${damage} ${current.kind==='fish'?'resistencia':'HP'}${extraMsg}`);
   }else message(current.kind==='fish'?'El pez se revuelve y evita el tirón.':'El enemigo esquiva el golpe.');
  }
  persist();status();if(current.hp<=0){later(()=>finish('win'));return}
   // Companion supportive action
   const comp=state.companion;
   if(comp&&current.kind!=='fish'&&current.hp>0){
    later(()=>{
     if(comp==='home'){
      state.health=Math.min(maxHealth(),state.health+20);state.energy=Math.min(100,state.energy+15);
      message('¡Mara te asiste con bálsamos y provisiones! +20 HP y +15 Energía.');
     }else if(comp==='workshop'){
      const dmg=22+Math.floor(state.level*0.8);current.hp=Math.max(0,current.hp-dmg);pulse=1;
      message(`¡Scarlett descarga su martillo de forja! −${dmg} HP al enemigo.`);
     }else if(comp==='store'){
      const dmg=25+Math.floor(state.level*0.9);current.hp=Math.max(0,current.hp-dmg);current.calm=Math.max(current.calm||0,1);pulse=1;
      message(`¡Lyra conjura un rayo arcano helado! −${dmg} HP y ralentiza al enemigo.`);
     }
     persist();status();
     if(current.hp<=0){later(()=>finish('win'),.8);return}
     later(()=>enemyTurn(guard),.8);
    },.7);
    return;
   }
   later(()=>enemyTurn(guard));
  }
 function start(data,model=null){if(dialog.open)return false;current=data;phase='player';current.intent??={};if(!current.intent.label)intent();document.body.classList.add('in-encounter');window.dispatchEvent(new Event('construction-relocated'));dialog.showModal();stage(model);message(current.kind==='fish'?'¡Ha picado! Agota su resistencia para sacarlo del agua.':`${current.name} se enfrenta a GreyMan.`);menu();persist();if(state.health<=0)finish('defeat');else if(current.hp<=0)finish('win');return true}
 function startAnimal(a){const power=a.type==='werewolf'?14:a.type==='spider'?11:a.type==='specter'?10:a.def.mode==='hostile'?9:7;return start({kind:'animal',animalId:a.id,name:a.def.name,hp:a.s.hp,maxHp:a.def.hp,level:Math.max(1,Math.round(a.def.hp/8)),power,turn:1,calm:0,origin:{x:character.position.x,z:character.position.z}},a.g)}
 function startFish(fishId){const f=fishDef(fishId);return start({kind:'fish',fishId:f.id,name:f.name,hp:f.hp,maxHp:f.hp,level:Math.round(f.hp/10),power:f.power,turn:1,calm:0,value:f.value,xp:f.xp,origin:{x:character.position.x,z:character.position.z}})}
 function update(dt){if(!dialog.open||document.hidden)return;elapsed+=dt;if(phase==='fainted'){timer-=dt;if(timer<=0){onWake();close()}return}if(queued){timer-=dt;if(timer<=0){const fn=queued;queued=null;fn()}}if(renderer){pulse=T.MathUtils.damp(pulse,0,6,dt);hero.position.x=-2+Math.max(0,pulse)*.6;hero.rotation.z=Math.min(0,pulse)*.12;opponent.position.x=2+Math.min(0,pulse)*.6;opponent.position.y=current.kind==='fish'?Math.sin(elapsed*2)*.12:0;opponent.rotation.z=Math.max(0,pulse)*.13;renderer.render(scene,camera)}}
 return {startAnimal,startFish,resume:(data,model)=>start(data,model),update,get active(){return dialog.open},get resolving(){return phase==='result'||phase==='fainted'}};
}

import {createEncounters} from './encounters.js';
import {createFishing} from './fishing.js';
import {createDungeonSystem} from './dungeons.js';
import * as T from 'three';
import {REGIONS} from './world.js';
import {createLifeWorld} from './life-world.js';
import {createWildlife} from './wildlife.js';
const KEY='greyman-life-v2',FOOD={berries:'Bayas',raw:'Carne cruda',vegetables:'Hortalizas',roast:'Carne asada',stew:'Guiso',fish:'Pescado crudo',grilledFish:'Pescado asado'},SKILLS={logging:'Tala',mining:'Minería',gardening:'Cultivo',cooking:'Cocina',hunting:'Caza',building:'Construcción',exploration:'Exploración',fishing:'Pesca'};
const WEAPONS=[
 {id:'spear',name:'Lanza de caza',type:'weapon',cost:{wood:8,stone:4},desc:'+10 daño en combate y cacería'},
 {id:'sword',name:'Espada de cazador',type:'weapon',cost:{wood:6,stone:10,ore:3},desc:'+14 daño base cuerpo a cuerpo'},
 {id:'daggers',name:'Dagas de garra',type:'weapon',cost:{wood:4,claws:2,hide:2},desc:'+16 daño base · Ataque veloz'},
 {id:'bow',name:'Arco de seda',type:'weapon',cost:{wood:10,silk:4,hide:2},desc:'+18 daño base · Menor coste de energía'}
];
const ARMORS=[
 {id:'leather',name:'Pechera de cuero',type:'armor',cost:{hide:6,wood:2},desc:'-15% daño recibido'},
 {id:'plate',name:'Armadura de placas',type:'armor',cost:{stone:10,ore:5,hide:4},desc:'-30% daño recibido'},
 {id:'specterCloak',name:'Manto espectral',type:'armor',cost:{silk:6,ectoplasm:2},desc:'-20% daño recibido y -25% coste de energía'},
 {id:'hood',name:'Capucha reforzada',type:'helmet',cost:{hide:4,ore:2},desc:'+20 HP máximos permanentes'}
];
export function createDailyLife({world,character,camera,controls,harvesting,living,greyMan,toast,grant,unlocked,isWalking}){
 let stored={};try{stored=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{}
 const state={version:2,clock:0,xp:0,level:1,hunger:100,energy:100,health:100,food:{},seeds:6,saplings:2,water:0,ore:0,hide:0,flowers:0,spear:false,skills:{},stats:{},plots:{},nursery:{},berries:{},projects:{},chests:{},quests:{},animals:{},regrowth:{},depleted:{},visited:{},foodBank:{},flowerRegrowth:{},...stored};
 state.equipment={weapon:'none',armor:'none',helmet:'none',...(stored.equipment||{})};
 state.crafted={weapons:[],armors:[],...(stored.crafted||{})};
 state.loot={venom:0,silk:0,claws:0,ectoplasm:0,...(stored.loot||{})};
 state.potions={health:0,energy:0,speed:0,poisonOil:0,beastForce:0,...(stored.potions||{})};
 state.buffs={speed:0,strength:0,stealth:0,poisonWeapon:0,...(stored.buffs||{})};
 state.flowerRegrowth??={};
 state.affection??={home:0,workshop:0,store:0};
 state.marriedTo??=null;
 state.companion??=null;
 state.ring??=false;
 state.coins??=0;
 state.bounties??=[];
 state.bountiesDay??=-1;
 state.bountiesCompleted??={};
 if(state.spear&&!state.crafted.weapons.includes('spear'))state.crafted.weapons.push('spear');
 if(state.spear&&state.equipment.weapon==='none')state.equipment.weapon='spear';
 for(const key of ['food','foodBank'])state[key]={berries:key==='food'?4:0,raw:0,vegetables:0,roast:0,stew:0,fish:0,grilledFish:0,...state[key]};
 for(const k of ['hunger','energy','health'])state[k]=T.MathUtils.clamp(Number(state[k])||0,0,100);state.level=T.MathUtils.clamp(Number(state.level)||1,1,20);state.clock=Math.max(0,Number(state.clock)||0);
 const visual=createLifeWorld(world);let lastSave=0,lastUI=0,actionCooldown=0,rest=0,activeRest=null,invulnerable=0,dirty=false,ready=false;
 const sprouts=new Map(),hud=document.createElement('div');hud.id='lifeHud';hud.innerHTML='<button id="openJournal" aria-label="Abrir diario, mochila y habilidades"><span id="lifeLevel"></span><span class="xp-track"><span id="lifeXP"></span></span></button><div class="needs"><span title="Hambre"><i>Alimento</i><meter id="hungerMeter" min="0" max="100"></meter></span><span title="Energía"><i>Energía</i><meter id="energyMeter" min="0" max="100"></meter></span><span title="Salud"><i>Salud</i><meter id="healthMeter" min="0" max="100"></meter></span></div><small id="lifeDay"></small>';document.body.append(hud);
 let encounters=null,fishing=null;
 const active=()=>!encounters?.active&&!fishing?.active&&isWalking()&&!living.blocked()&&!document.hidden&&rest<=0;
 const requirement=level=>100+(level-1)*60;
 const skillLevel=key=>Math.min(10,1+Math.floor((state.skills[key]||0)/8));
 function maxPlayerHp(){return state.equipment?.helmet==='hood'?120:100}
 function drinkPotion(id){
  const max=maxPlayerHp();
  if(id==='health'){state.health=Math.min(max,state.health+45);toast('+45 HP restaurados')}
  else if(id==='energy'){state.energy=Math.min(100,state.energy+50);toast('+50 Energía recuperada')}
  else if(id==='speed'){state.buffs.speed=120;toast('¡Elixir de velocidad: 2 minutos!')}
  else if(id==='poisonOil'){state.buffs.poisonWeapon=180;toast('¡Arma envenenada: 3 minutos!')}
  else if(id==='beastForce'){state.buffs.strength=120;toast('¡Fuerza bestial: +50% daño por 2 minutos!')}
 }
 function save(){if(ready)state.position={x:character.position.x,z:character.position.z};try{localStorage.setItem(KEY,JSON.stringify(state))}catch{if(!state.storageWarning){toast('No se pudo guardar en este navegador.');state.storageWarning=true}}living.save();dirty=false;}
 function reward(skill,xp=0,count=0){if(skill){state.skills[skill]=(state.skills[skill]||0)+1;state.stats[skill]=(state.stats[skill]||0)+count}state.xp+=xp;let gained=false;while(state.level<20&&state.xp>=requirement(state.level)){state.xp-=requirement(state.level);state.level++;gained=true}if(state.level===20)state.xp=Math.min(state.xp,requirement(20));if(gained)toast(`Nivel ${state.level} · Velocidad máxima ${(6+Math.min(1.2,(state.level-1)*.08)).toFixed(2)} m/s`);dirty=true;}
 function spend(amount){if(!active()||actionCooldown>0)return false;if(state.energy<amount){toast('Necesitas descansar. La esterilla del campamento está junto al fogón.');return false}state.energy-=amount;actionCooldown=.3;dirty=true;return true}
 function moveTo(x,z){const y=world.elevation(x,z),delta=new T.Vector3(x,y,z).sub(character.position);character.position.add(delta);camera.position.add(delta);controls.target.add(delta);window.dispatchEvent(new Event('construction-relocated'))}
 function lineFree(x,z,y){const p=character.position,dx=x-p.x,dz=z-p.z,dist=Math.hypot(dx,dz);if(Math.abs(p.y-y)>1.6)return false;for(const c of world.colliders){if(c.removed||p.y+.85<c.y-c.h/2||p.y+.85>c.y+c.h/2)continue;const t=T.MathUtils.clamp(((c.x-p.x)*dx+(c.z-p.z)*dz)/(dist*dist||1),0,1);if(t>.08&&t<.82&&Math.abs(p.x+dx*t-c.x)<c.w/2&&Math.abs(p.z+dz*t-c.z)<c.d/2)return false}return true}
 function near(x,z,y,range=2.4){return Math.hypot(character.position.x-x,character.position.z-z)<range&&lineFree(x,z,y)}
 function wake(){const faint=state.fainted;if(!faint)return;state.clock=Math.max(state.clock,faint.wakeClock);moveTo(faint.x,faint.z);state.health=50;state.energy=Math.max(30,state.energy);state.peaceUntil=state.clock+90;delete state.fainted;save();toast('Despiertas cuatro horas después · 50/100 HP · Mismo lugar')}
 function beginEncounter(a,automatic=false){if(!active()||(automatic&&state.clock<(state.peaceUntil||0)))return false;return encounters.startAnimal(a)}
 const fauna=createWildlife({world,visual,character,greyMan,state,now:()=>state.clock,active,unlocked,reward,beginEncounter,spend,save,toast,lineFree});
 encounters=createEncounters({state,character,save,onWin:e=>{if(e.kind==='fish'){state.food.fish+=e.value;reward('fishing',e.xp,1);toast(`+${e.value} pescado · +${e.xp} XP`)}else{const a=fauna.animals.find(a=>a.id===e.animalId);if(a&&a.s.hp>0){a.s.hp=0;a.s.deadAt=state.clock;a.s.looted=false;reward('hunting',24,1)}}},onDefeat:e=>{state.fainted={x:e.origin.x,z:e.origin.z,wakeClock:state.clock+1080/24*4};state.health=0;state.encounter=null;save()},onWake:wake,onLeave:e=>{state.peaceUntil=state.clock+90;if(e?.kind==='animal'){const a=fauna.animals.find(a=>a.id===e.animalId);if(a){a.s.hp=e.hp;a.alarm=0}}}});
 fishing=createFishing({world,visual,state,character,near,canAct:active,encounters,save,toast});
 const dungeons=createDungeonSystem({world,character,encounters,toast,isWalking,save});
 function applyProject(p){const complete=!!state.projects[p.id];p.built.visible=complete;p.broken.visible=!complete;p.c.removed=complete;if(complete&&p.surface&&!p.surfaceAdded){world.surfaces.push(p.surface);p.surfaceAdded=true}if(p.id==='bridge'&&complete&&!p.surfaceAdded){world.floor(-16,43,8,3.6,2.26);p.surfaceAdded=true}}
 visual.projects.forEach(applyProject);
 const well=visual.group('Puits_du_campement',-46,85,2);for(const side of [-1,1]){visual.box(well,side*.55,.35,0,.25,.7,1.3,0x979d87);visual.box(well,0,.35,side*.55,1.3,.7,.25,0x9ea58d)}visual.box(well,0,.27,0,.85,.05,.85,0x528e96);
 function open(title){living.openPanel(title);window.dispatchEvent(new Event('construction-relocated'))}
 const para=living.para,button=living.button;
 function itemCount(key){if(key==='crystals')return living.state.crystalCount;if(key==='wood'||key==='stone')return harvesting.inventory[key];if(key==='flowers')return state.flowers||0;if(key in(state.loot||{}))return state.loot[key]||0;return Number(state[key])||0}
 function costText(cost){return Object.entries(cost).filter(([,v])=>v).map(([key,n])=>`${n} ${{wood:'madera',stone:'piedra',crystals:'cristales',ore:'mineral',hide:'pieles',flowers:'flores',silk:'seda',venom:'veneno',claws:'garras',ectoplasm:'ectoplasma'}[key]||key}`).join(' · ')}
 const afford=cost=>Object.entries(cost).every(([k,n])=>itemCount(k)>=n);
 function pay(cost){for(const [k,n]of Object.entries(cost)){if(k==='crystals')living.state.crystalCount-=n;else if(k==='wood'||k==='stone')harvesting.inventory[k]-=n;else if(k==='flowers')state.flowers=Math.max(0,(state.flowers||0)-n);else if(k in(state.loot||{}))state.loot[k]=Math.max(0,(state.loot[k]||0)-n);else state[k]-=n}}
 function eat(key){if(!isWalking()||state.food[key]<1)return;const effects={berries:[12,2],vegetables:[16,3],roast:[32,10],stew:[48,22],grilledFish:[30,12]};if(!effects[key])return;if(state.hunger>=99&&state.energy>=99){toast('Ya estás saciado y con energía.');return}state.food[key]--;state.hunger=Math.min(100,state.hunger+effects[key][0]);state.energy=Math.min(100,state.energy+effects[key][1]);if(key==='stew')state.health=Math.min(maxPlayerHp(),state.health+12);save();journal('bag')}
 function forgePanel(isTab=false){
  if(!isTab)open('Yunque y Banco de forja');
  para(`Materiales: ${harvesting.inventory.wood} madera · ${harvesting.inventory.stone} piedra · ${state.ore} mineral · ${state.hide} pieles · ${state.loot.silk} seda · ${state.loot.claws} garras · ${state.loot.ectoplasm} ectoplasma`);
  para('--- ARMAS ---');
  for(const w of WEAPONS){
   const crafted=state.crafted.weapons.includes(w.id),equipped=state.equipment.weapon===w.id;
   para(`${w.name}: ${w.desc} · ${crafted?'✓ Fabricada':costText(w.cost)}`);
   if(crafted){
    button(equipped?`Desequipar ${w.name}`:`Equipar ${w.name}`,()=>{
     state.equipment.weapon=equipped?'none':w.id;if(w.id==='spear')state.spear=!equipped;
     save();if(isTab)journal('craft');else forgePanel();toast(equipped?`${w.name} desequipada`:`${w.name} equipada`);
    });
   }else{
    button(`Forjar ${w.name} · ${costText(w.cost)}`,()=>{
     if(!afford(w.cost))return;
     pay(w.cost);state.crafted.weapons.push(w.id);state.equipment.weapon=w.id;if(w.id==='spear')state.spear=true;
     reward('building',35,1);save();if(isTab)journal('craft');else forgePanel();toast(`${w.name} forjada y equipada`);
    },!afford(w.cost));
   }
  }
  para('--- ARMADURAS ---');
  for(const a of ARMORS){
   const crafted=state.crafted.armors.includes(a.id),equipped=state.equipment[a.type]===a.id;
   para(`${a.name}: ${a.desc} · ${crafted?'✓ Fabricada':costText(a.cost)}`);
   if(crafted){
    button(equipped?`Desequipar ${a.name}`:`Equipar ${a.name}`,()=>{
     state.equipment[a.type]=equipped?'none':a.id;
     if(a.type==='helmet'&&state.health>maxPlayerHp())state.health=maxPlayerHp();
     save();if(isTab)journal('craft');else forgePanel();toast(equipped?`${a.name} desequipada`:`${a.name} equipada`);
    });
   }else{
    button(`Forjar ${a.name} · ${costText(a.cost)}`,()=>{
     if(!afford(a.cost))return;
     pay(a.cost);state.crafted.armors.push(a.id);state.equipment[a.type]=a.id;
     reward('building',35,1);save();if(isTab)journal('craft');else forgePanel();toast(`${a.name} forjada y equipada`);
    },!afford(a.cost));
   }
  }
  para('--- OBJETOS ESPECIALES ---');
  para(`Anillo de Promesa: Joya forjada con gemas puras · Pedir matrimonio (afecto ≥ 80) · ${state.ring?'✓ Fabricado':'4 mineral + 2 cristales'}`);
  if(!state.ring){
   button('Forjar Anillo de Promesa · 4 mineral + 2 cristales',()=>{
    if(!afford({ore:4,crystals:2}))return;
    pay({ore:4,crystals:2});state.ring=true;reward('building',45,1);save();
    if(isTab)journal('craft');else forgePanel();toast('¡Anillo de Promesa forjado! Llévaselo a tu amada.');
   },!afford({ore:4,crystals:2}));
  }
 }
 function alembicPanel(isTab=false){
  if(!isTab)open('Alambique de botica');
  para(`Ingredientes: ${state.flowers||0} flores · ${state.food.berries} bayas · ${state.food.vegetables} hortalizas · ${living.state.crystalCount} cristales · ${state.loot.venom} veneno · ${state.loot.claws} garras`);
  const recipes=[
   {id:'health',name:'Poción de salud',cost:{flowers:2},food:'berries',desc:'+45 HP de inmediato'},
   {id:'energy',name:'Poción de energía',cost:{flowers:2},food:'vegetables',desc:'+50 Energía de inmediato'},
   {id:'speed',name:'Elixir de velocidad',cost:{flowers:3,crystals:1},desc:'+30% velocidad de carrera (120s)'},
   {id:'poisonOil',name:'Aceite venenoso',cost:{flowers:2,venom:1},desc:'+8 daño de veneno por golpe (180s)'},
   {id:'beastForce',name:'Fuerza bestial',cost:{flowers:2,claws:1},desc:'+50% daño de arma (120s)'}
  ];
  for(const r of recipes){
   const count=state.potions[r.id]||0,canBrew=afford(r.cost)&&(!r.food||state.food[r.food]>=1);
   para(`${r.name} (Llevas ${count}): ${r.desc} · Coste: ${costText(r.cost)}${r.food?' + 1 '+FOOD[r.food].toLowerCase():''}`);
   button(`Destilar ${r.name.toLowerCase()}`,()=>{
    if(!canBrew)return;
    pay(r.cost);if(r.food)state.food[r.food]--;
    state.potions[r.id]=(state.potions[r.id]||0)+1;
    reward('gardening',15,1);save();if(isTab)journal('alchemy');else alembicPanel();toast(`+1 ${r.name.toLowerCase()}`);
   },!canBrew);
   if(count>0){
    button(`Beber ${r.name.toLowerCase()}`,()=>{
     state.potions[r.id]--;drinkPotion(r.id);save();if(isTab)journal('alchemy');else alembicPanel();
    });
   }
  }
 }
 function journal(tab='bag'){if(!isWalking()||encounters?.active||fishing?.active)return;open('La vida de GreyMan');const tabs=document.createElement('div');tabs.className='journal-tabs';for(const [id,label]of [['bag','Mochila'],['craft','Forja'],['alchemy','Botica'],['skills','Habilidades'],['quests','Encargos'],['routes','Exploración']]){const b=document.createElement('button');b.textContent=label;b.classList.toggle('active',tab===id);b.onclick=()=>journal(id);tabs.append(b)}living.content.append(tabs);
  if(tab==='craft'){forgePanel(true);return}
  if(tab==='alchemy'){alembicPanel(true);return}
  if(tab==='bounties'){bountiesPanel();return}
  if(tab==='bag'){
   para(`Día ${1+Math.floor(state.clock/1080)} · Nivel ${state.level} · ${Math.floor(state.xp)}/${requirement(state.level)} XP`);
   para(`Alimento ${Math.ceil(state.hunger)} · Energía ${Math.ceil(state.energy)} · Salud ${Math.ceil(state.health)} / ${maxPlayerHp()}`);
   para(`--- EQUIPAMIENTO Y VÍNCULOS ---`);
   const wepName=WEAPONS.find(w=>w.id===state.equipment.weapon)?.name||'Ninguna';
   const armName=ARMORS.find(a=>a.id===state.equipment.armor)?.name||'Ninguna';
   const helName=ARMORS.find(a=>a.id===state.equipment.helmet)?.name||'Ninguno';
   const compName=visual.residents.find(r=>r.id===state.companion)?.name;
   const wifeName=visual.residents.find(r=>r.id===state.marriedTo)?.name;
   para(`Vínculos: Esposa: ${wifeName?'❤️ '+wifeName:'Ninguna'} · Acompañante: ${compName?'⚔️ '+compName:'Ninguno'} · Monedas: 🪙 ${state.coins||0}`);
   para(`Arma: ${wepName} · Armadura: ${armName} · Cabeza: ${helName}`);
   if(state.buffs.speed>0||state.buffs.strength>0||state.buffs.poisonWeapon>0){
    para(`Efectos: ${state.buffs.speed>0?'🏃 Velocidad ('+Math.ceil(state.buffs.speed)+'s) ':''}${state.buffs.strength>0?'⚔️ Fuerza ('+Math.ceil(state.buffs.strength)+'s) ':''}${state.buffs.poisonWeapon>0?'🧪 Veneno ('+Math.ceil(state.buffs.poisonWeapon)+'s)':''}`);
   }
   for(const [key,label]of Object.entries(FOOD)){if(key==='raw'||key==='fish')para(`${label}: ${state.food[key]} · Cocínala en el fogón.`);else button(`${label} · ${state.food[key]} — Comer`,()=>eat(key),state.food[key]<1)}
   for(const [potId,label]of [['health','Poción de salud'],['energy','Poción de energía'],['speed','Elixir de velocidad'],['poisonOil','Aceite venenoso'],['beastForce','Fuerza bestial']]){
    const n=state.potions[potId]||0;if(n>0)button(`Beber ${label} (${n})`,()=>{state.potions[potId]--;drinkPotion(potId);save();journal('bag')});
   }
   button(state.rod?'Caña de pesca preparada':'Preparar caña · 8 madera',()=>{if(state.rod||harvesting.inventory.wood<8)return;harvesting.inventory.wood-=8;state.rod=true;save();journal('bag')},state.rod||harvesting.inventory.wood<8);
   para(`Semillas ${state.seeds} · Plantones ${state.saplings} · Flores ${state.flowers||0} · Mineral ${state.ore} · Pieles ${state.hide}`);
   para(`Botín: Seda ${state.loot.silk} · Veneno ${state.loot.venom} · Garras ${state.loot.claws} · Ectoplasma ${state.loot.ectoplasm}`);
   button('Preparar un plantón · 1 madera',()=>{if(harvesting.inventory.wood<1)return;harvesting.inventory.wood-=1;state.saplings++;save();journal('bag')},harvesting.inventory.wood<1);
  }
  if(tab==='skills'){para(`Nivel ${state.level}/20 · ${Math.floor(state.xp)}/${requirement(state.level)} XP para el siguiente nivel.`);para(`Velocidad máxima con energía: ${(6+Math.min(1.2,(state.level-1)*.08)).toFixed(2)} m/s. La falta de alimento o energía reduce el ritmo.`);for(const [key,label]of Object.entries(SKILLS))para(`${label}: ${skillLevel(key)}/10 · ${state.skills[key]||0} prácticas`);para('Cada 8 prácticas sube la habilidad. Tala y minería ganan +1 de fuerza en niveles 4 y 7; cultivar y cocinar también mejoran sus rendimientos. La XP se obtiene al trabajar y descubrir lugares.');}
  if(tab==='quests'){for(const npc of visual.residents){const aff=state.affection?.[npc.id]||0;para(`${npc.name} (${npc.type==='mara'?'Doncella del hogar':npc.type==='scarlett'?'Herrera de la forja':'Maga elfa de la botica'}) · Afecto: ${aff}/100 ${state.marriedTo===npc.id?'❤️ Esposa':''}${npc.h.stage<3?' — Restaura el edificio para que llegue.':''}`);for(const q of quests(npc.id))para(`${state.quests[q.id]?'✓': '◇'} ${q.name} · ${q.amount} ${FOOD[q.item]||({wood:'madera',stone:'piedra',crystals:'cristales'}[q.item])} · ${q.xp} XP`)}para('Los encargos y regalos se entregan hablando con cada habitante. Con afecto 80 y el Anillo de Promesa puedes casarte.');}
  if(tab==='routes'){for(const r of REGIONS)para(`${!r.requires||unlocked.has(r.requires)?'✓':'◇'} ${r.name} — ${routeHint(r.id)}`);for(const p of visual.projects)para(`${state.projects[p.id]?'✓':'◇'} ${p.name} · ${costText(p.cost)}`);para(`Lugares descubiertos: ${Object.keys(state.visited).length}/4 · Cofres encontrados: ${Object.keys(state.chests).length}/${visual.chests.length}. Busca en el mirador, la costa, la cueva y detrás de una cascada.`);}
 }
 document.getElementById('openJournal').onclick=()=>journal();window.addEventListener('keydown',e=>{if(e.code==='KeyI'&&!e.repeat&&isWalking()&&!living.dialog.open){e.preventDefault();journal()}});
 function cook(home=false){open(home?'Cocina de la cabaña':'Fogón del campamento');para('Los platos reponen alimento y energía. El guiso también ayuda a recuperar salud.');const recipes=[{name:'Asar pescado',ingredients:{fish:1},out:'grilledFish',wood:1},{name:'Asar carne',ingredients:{raw:1},out:'roast',wood:1},{name:'Guiso de hortalizas',ingredients:{vegetables:2,berries:1},out:'stew',wood:1}];for(const r of recipes){para(`${r.name}: ${Object.entries(r.ingredients).map(([k,n])=>n+' '+FOOD[k].toLowerCase()).join(' + ')} + ${r.wood} madera`);button('Cocinar',()=>{const x=home?visual.stove.position.x:-49,z=home?visual.stove.position.z:88,y=home?2.12:2;if(!near(x,z,y,3))return;if(!Object.entries(r.ingredients).every(([k,n])=>state.food[k]>=n)||harvesting.inventory.wood<r.wood)return;if(state.energy<2){toast('Descansa antes de cocinar.');return}for(const [k,n]of Object.entries(r.ingredients))state.food[k]-=n;harvesting.inventory.wood-=r.wood;state.energy-=2;const n=skillLevel('cooking')>=5?2:1;state.food[r.out]+=n;reward('cooking',12,1);save();toast(`+${n} ${FOOD[r.out].toLowerCase()}`);cook(home)},!Object.entries(r.ingredients).every(([k,n])=>state.food[k]>=n)||harvesting.inventory.wood<r.wood)}
 }
 function beginRest(home){if(rest>0)return;rest=home?3:2;activeRest={home};living.dialog.close();window.dispatchEvent(new Event('construction-relocated'));document.body.classList.add('resting');toast(home?'Descansando en casa…':'Descansando en el campamento…')}
 window.addEventListener('life:rest',()=>beginRest(true));
  function restorePanel(p){
   open(p.name);
   if(state.projects[p.id]){
    if(p.id==='ship'){shipNavigationPanel();return;}
    para('Paso restaurado.');return;
   }
   if(p.id==='dock'&&!unlocked.has('quest:aguas-restauradas')){
    para('Debes liberar las cuatro regiones principales y restaurar la compuerta del santuario antes de construir el muelle.');
    return;
   }
   if(p.id==='ship'&&!state.projects.dock){
    para('Debes terminar la construcción del Muelle de ultramar antes de construir el barco.');
    return;
   }
   para(costText(p.cost));
   if(p.tool)para(`Herramientas de nivel ${p.tool+1}${p.id==='canal'?' y minería de nivel 3':''}.`);
   button(p.id==='debris'?'Despejar el derrumbe':p.id==='dock'?'Construir muelle':p.id==='ship'?'Construir barco':'Restaurar',()=>{
    if(!near(p.x,p.z,p.y,4.5))return;
    if(p.id==='dock'&&!unlocked.has('quest:aguas-restauradas')){toast('Libera primero las 4 zonas del mapa.');return}
    if(p.id==='ship'&&!state.projects.dock){toast('Construye primero el muelle.');return}
    if(!afford(p.cost)){toast('Faltan materiales.');return}
    if(living.state.tool<(p.tool||0)||(p.id==='canal'&&skillLevel('mining')<3)){toast('Mejora las herramientas y practica minería.');return}
    pay(p.cost);state.projects[p.id]=true;applyProject(p);
    reward('building',p.id==='bridge'?50:p.id==='ship'?120:75,1);checkUnlocks();save();
    toast(`${p.name}: ${p.id==='ship'?'construido · ¡Listo para zarpar!':'restaurado'}`);
    restorePanel(p);
   },!afford(p.cost)||living.state.tool<(p.tool||0)||(p.id==='canal'&&skillLevel('mining')<3));
  }
  function shipNavigationPanel(){
   open('Barco de Travesía · Ultramar');
   const compName=visual.residents.find(r=>r.id===state.companion)?.name;
   para(`El barco de travesía está fondeado y listo para zarpar.${compName?' Tu esposa '+compName+' te acompaña a bordo.':' No llevas acompañante.'}`);
   para('Rutas marítimas descubiertas hacia archipiélagos lejanos:');
   button('Zarpar a Isla de la Tormenta (Coord: 95, -72)',()=>{
    living.dialog.close();moveTo(95,-72);save();
    toast(`¡Has desembarcado en Isla de la Tormenta!${compName?' '+compName+' está a tu lado.':''}`);
   });
   button('Zarpar a Atolón Prohibido (Coord: 87, 74)',()=>{
    living.dialog.close();moveTo(87,74);save();
    toast(`¡Has desembarcado en Atolón Prohibido!${compName?' '+compName+' está a tu lado.':''}`);
   });
   button('Permanecer en el muelle',()=>{living.dialog.close();});
  }
  function bountiesPanel(){
   open('Tablón de Primas del Campamento');
   const day=1+Math.floor(state.clock/1080);
   if(state.bountiesDay!==day||!state.bounties||state.bounties.length===0){
    state.bountiesDay=day;
    state.bounties=[
     {id:`b1_${day}`,title:'Caza Nocturna: 2 Bestias salvajes',kind:'hunt',req:2,xp:90,coins:15,item:'ore',n:4},
     {id:`b2_${day}`,title:'Botánica Silvestre: 4 Flores',kind:'flowers',req:4,xp:75,coins:10,item:'seeds',n:4},
     {id:`b3_${day}`,title:'Pesca en la Costa: 2 Peces',kind:'fish',req:2,xp:80,coins:12,item:'crystals',n:2}
    ];
   }
   para(`Día ${day} · Monedas de cazador acumuladas: 🪙 ${state.coins||0}`);
   para('Completa contratos diarios para obtener monedas y recursos especiales:');
   for(const b of state.bounties){
    const done=!!state.bountiesCompleted?.[b.id];
    para(`${done?'✓':'◇'} ${b.title} · Recompensa: ${b.coins} 🪙 + ${b.n} ${{ore:'mineral',seeds:'semillas',crystals:'cristales'}[b.item]||b.item} + ${b.xp} XP`);
    if(!done){
     let canClaim=false;
     if(b.kind==='flowers'&&(state.flowers||0)>=b.req)canClaim=true;
     else if(b.kind==='fish'&&(state.food.fish>=b.req||state.food.grilledFish>=b.req))canClaim=true;
     else if(b.kind==='hunt'&&(state.stats.hunting||0)>=b.req)canClaim=true;
     button(`Completar: ${b.title}`,()=>{
      if(b.kind==='flowers')state.flowers-=b.req;
      else if(b.kind==='fish'){if(state.food.fish>=b.req)state.food.fish-=b.req;else state.food.grilledFish-=b.req;}
      state.bountiesCompleted??={};state.bountiesCompleted[b.id]=true;
      state.coins=(state.coins||0)+b.coins;
      if(b.item==='crystals')living.state.crystalCount+=b.n;else state[b.item]=(state[b.item]||0)+b.n;
      reward('exploration',b.xp);save();toast(`¡Contrato cumplido! +${b.coins} Monedas de cazador`);
      bountiesPanel();
     },!canClaim);
    }
   }
   para('--- BAZAR DEL GREMIO DE CAZADORES ---');
   const trades=[
    {name:'4 Mineral resistente',coins:10,give:()=>{state.ore+=4;}},
    {name:'2 Cristales puros',coins:12,give:()=>{living.state.crystalCount+=2;}},
    {name:'3 Seda de araña + 2 Ectoplasma',coins:18,give:()=>{state.loot.silk+=3;state.loot.ectoplasm+=2;}},
    {name:'Poción de Salud + Poción de Energía',coins:15,give:()=>{state.potions.health=(state.potions.health||0)+1;state.potions.energy=(state.potions.energy||0)+1;}}
   ];
   for(const t of trades){
    button(`Comprar ${t.name} · ${t.coins} 🪙`,()=>{
     if((state.coins||0)<t.coins)return;
     state.coins-=t.coins;t.give();save();toast(`Comprado: ${t.name}`);bountiesPanel();
    },(state.coins||0)<t.coins);
   }
  }
 function routeHint(id){return {garden:'Tu punto de partida.',coast:'Repara el puente y el tejado de tu cabaña, o activa las tres runas del jardín.',cave:'Abre la costa, mejora el pico a nivel 2 y despeja el derrumbe al norte del jardín.',sanctuary:'Abre la cueva y restaura la compuerta con herramientas de nivel 3 y minería de nivel 3.'}[id]}
 function checkUnlocks(){if(state.projects.bridge&&living.state.houses.home?.stage>=2)grant('quest:ruinas-restauradas');if(unlocked.has('quest:ruinas-restauradas')&&state.projects.debris&&living.state.tool>=1)grant('quest:paso-cueva');if(unlocked.has('quest:paso-cueva')&&state.projects.canal&&living.state.tool>=2&&skillLevel('mining')>=3)grant('quest:aguas-restauradas')}
 function quests(id){return{home:[{id:'mara-berries',name:'Una despensa para empezar',item:'berries',amount:8,xp:70,reward:'seeds',n:4},{id:'mara-stew',name:'Comida para el vecindario',item:'stew',amount:3,xp:120,reward:'saplings',n:3}],workshop:[{id:'scarlett-stone',name:'Material para el banco',item:'stone',amount:12,xp:80,reward:'ore',n:3},{id:'scarlett-crystal',name:'Cristales para el taller',item:'crystals',amount:6,xp:130,reward:'saplings',n:4}],store:[{id:'lyra-harvest',name:'La primera cosecha',item:'vegetables',amount:6,xp:90,reward:'seeds',n:6},{id:'lyra-wood',name:'Cajas para la despensa',item:'wood',amount:18,xp:120,reward:'ore',n:4}]}[id]}
 function talk(npc){
   const isWife=state.marriedTo===npc.id;
   open(`${npc.name}${isWife?' · Tu Esposa ❤️':''}`);
   state.affection??={home:0,workshop:0,store:0};
   const aff=state.affection[npc.id]||0;
   para(`❤️ Nivel de afecto: ${aff}/100 ${isWife?'· Vínculo de matrimonio eterno':aff>=80?'· ¡Profundamente enamorada! Espera tu propuesta.':aff>=50?'· Gran cariño y complicidad':'· Conociéndose con afecto'}`);

   if(npc.id==='home'){
    if(isWife)para('¡Cariño! Qué alegría verte regresar sano y salvo. Este hogar es nuestro remanso de paz. Si vas a adentrarte en tierras salvajes, islas o mazmorras, ¡llévame contigo! Te cuidaré con mis provisiones y bálsamos.');
    else if(aff>=80)para('GreyMan... cada vez que te veo volver del bosque siento un vuelco en el corazón. Cuidar de este lugar a tu lado le da sentido a mis días.');
    else if(aff>=50)para('El jardín está precioso hoy. Me encanta cuando te sientas cerca del fuego al atardecer.');
    else para('Me quedaré cerca de la cabaña. Un huerto y una despensa hacen que este lugar empiece a sentirse como un hogar.');
   }else if(npc.id==='workshop'){
    if(isWife)para('¡Mi valiente esposo! El acero canta hoy más fuerte que nunca. Juntos somos imparables: si hay monstruos o bestias acechando, déjame aplastarlos con mi martillo a tu lado.');
    else if(aff>=80)para('GreyMan... debo confesar que nunca conocí a alguien con tu fuerza de voluntad. Mi corazón late como el fuelle de la fragua cuando estás cerca.');
    else if(aff>=50)para('Buen golpe de pico tienes. Con el mineral que traes y mis manos en el yunque, forjaremos maravillas.');
    else para('Con el taller reparado podemos aprovechar la piedra y los cristales. No hace falta correr: las manos aprenden trabajando.');
   }else{
    if(isWife)para('Esposo mío... las líneas del éter susurran bendiciones sobre nuestra unión. Permíteme congelar a nuestros enemigos y desatar el arcano a tu lado en nuestras travesías.');
    else if(aff>=80)para('GreyMan... los antiguos textos elfas hablaban del hilo invisible del destino, pero estar a tu lado supera cualquier magia ancestral.');
    else if(aff>=50)para('Las esencias y flores que recolectas tienen un fulgor especial. Me alegra investigar la botica junto a ti.');
    else para('Yo cuidaré del almacén y la botica. Guarda parte de la cosecha y usa el alambique para destilar pociones antes de tus viajes.');
   }

   button(`Charlar con ${npc.name} (+5 afecto)`,()=>{
    state.affection[npc.id]=Math.min(100,(state.affection[npc.id]||0)+5);
    reward('exploration',15);save();toast(`+5 Afecto con ${npc.name} (${state.affection[npc.id]}/100)`);talk(npc);
   });

   const flowersCount=state.flowers||0;
   button(`Regalar ramo de flores silvestres (-2 flores, +15 afecto)`,()=>{
    if(flowersCount<2)return;state.flowers-=2;
    state.affection[npc.id]=Math.min(100,(state.affection[npc.id]||0)+15);
    reward('gardening',20);save();toast(`¡A ${npc.name} le ha encantado el ramo de flores! (+15 Afecto)`);talk(npc);
   },flowersCount<2);

   const stewCount=state.food.stew||0;
   button(`Regalar delicioso guiso casero (-1 guiso, +20 afecto)`,()=>{
    if(stewCount<1)return;state.food.stew--;
    state.affection[npc.id]=Math.min(100,(state.affection[npc.id]||0)+20);
    reward('cooking',25);save();toast(`¡${npc.name} disfrutó el guiso enormemente! (+20 Afecto)`);talk(npc);
   },stewCount<1);

   if(!state.marriedTo&&aff>=80){
    button(`💍 Proponer matrimonio con el Anillo de Promesa`,()=>{
     if(!state.ring){toast('Necesitas forjar el Anillo de Promesa en el Yunque primero.');return;}
     state.marriedTo=npc.id;state.companion=npc.id;reward('exploration',300,1);save();
     toast(`¡${npc.name} ha aceptado con lágrimas de emoción! ¡Estáis casados!`);talk(npc);
    },!state.ring);
   }

   if(isWife){
    const isCompanion=state.companion===npc.id;
    button(isCompanion?`Descansar en el campamento por ahora`:`⚔️ ¡Acompáñame a la aventura!`,()=>{
     state.companion=isCompanion?null:npc.id;save();
     toast(isCompanion?`${npc.name} se queda en el campamento.`:`¡${npc.name} viaja contigo y te asistirá en combate!`);talk(npc);
    });
   }

   const q=quests(npc.id).find(q=>!state.quests[q.id]&&!state.quests[q.id.replace('scarlett-','bruno-').replace('lyra-','ines-')]);
   if(q){
    const food=q.item in FOOD,count=food?state.food[q.item]:itemCount(q.item);
    para(`${q.name} · Entrega ${q.amount} ${FOOD[q.item]||q.item}. Llevas ${count}. Premio: ${q.xp} XP + ${q.n} ${{seeds:'semillas',saplings:'plantones',ore:'mineral'}[q.reward]}.`);
    button('Entregar encargo',()=>{
     if(!near(npc.x,npc.z,npc.y,3)||state.quests[q.id])return;
     const carried=food?state.food[q.item]:itemCount(q.item);if(carried<q.amount)return;
     if(food)state.food[q.item]-=q.amount;else pay({[q.item]:q.amount});
     state.quests[q.id]=true;state[q.reward]+=q.n;
     state.affection[npc.id]=Math.min(100,(state.affection[npc.id]||0)+10);
     reward(null,q.xp);save();toast('Encargo completado · +10 Afecto');talk(npc);
    },count<q.amount);
   }else para('Todos sus encargos están completados.');

   button('Cambiar 2 madera por 2 semillas',()=>{
    if(!near(npc.x,npc.z,npc.y,3)||harvesting.inventory.wood<2)return;
    harvesting.inventory.wood-=2;state.seeds+=2;save();talk(npc);
   },harvesting.inventory.wood<2);
 }
 function storage(){open('Despensa del granero');for(const [key,label]of Object.entries(FOOD)){para(`${label}: llevas ${state.food[key]} · guardado ${state.foodBank[key]}`);for(const deposit of [true,false])button(deposit?'Guardar hasta 5':'Retirar hasta 5',()=>{const h=world.buildings.find(h=>h.id==='store');if(!near(h.interact.x,h.interact.z,2.12,3))return;const n=Math.min(5,deposit?state.food[key]:state.foodBank[key]);state.food[key]+=deposit?-n:n;state.foodBank[key]+=deposit?n:-n;save();storage()},(deposit?state.food[key]:state.foodBank[key])<1)}}
 function extendIndoor(h){if(h.id==='home'){para(`Alimento ${Math.ceil(state.hunger)} · Energía ${Math.ceil(state.energy)} · Salud ${Math.ceil(state.health)}`);para('La cocina está al otro lado de la habitación; acércate al fogón para cocinar.')}if(h.id==='store')button('Abrir despensa de alimentos',storage);if(h.id==='workshop'){para(`Mineral ${state.ore} · Pieles ${state.hide}`);if(!state.crafted.weapons.includes('spear'))button('Fabricar lanza de caza · 8 madera + 4 piedra',()=>{if(!near(h.interact.x,h.interact.z,2.12,3)||!afford({wood:8,stone:4}))return;pay({wood:8,stone:4});state.crafted.weapons.push('spear');state.equipment.weapon='spear';state.spear=true;reward('building',25,1);save();living.dialog.close();toast('Lanza de caza forjada: +10 de daño')},!afford({wood:8,stone:4}));if(!state.fortified)button('Reforzar herramientas · 4 mineral + 2 pieles',()=>{if(!near(h.interact.x,h.interact.z,2.12,3)||!afford({ore:4,hide:2}))return;pay({ore:4,hide:2});state.fortified=true;reward('building',35,1);save();living.dialog.close();toast('Herramientas reforzadas · +1 de fuerza')},!afford({ore:4,hide:2}));}}
 function claimChest(c){if(state.chests[c.id]||!near(c.x,c.z,c.y,2.6))return;state.chests[c.id]=true;state.seeds+=3;state.ore+=c.id==='waterfall-cache'?5:2;living.state.crystalCount+=c.id==='waterfall-cache'?8:2;reward('exploration',c.id==='waterfall-cache'?140:60,1);save();toast('Tesoro encontrado · Cristales, mineral y semillas')}
 function findInteraction(){if(!isWalking()||living.dialog.open||rest>0||encounters?.active||fishing?.active)return null;const options=[];function add(x,z,y,label,fn,range=2.3){if(near(x,z,y,range))options.push({x,z,y,label,fn,dist:Math.hypot(character.position.x-x,character.position.z-z)})}
  add(-49,88,2,'Cocinar',()=>cook(false));add(-52,88,2,'Descansar en esterilla',()=>beginRest(false));add(-46,85,2,'Llenar regadera',()=>{state.water=6;save();toast('Regadera llena · 6 riegos')});
  add(-52,85,2,'Yunque · Forja de armas y armaduras',()=>forgePanel());
  add(-44,86,2,'Alambique · Botica de pociones',()=>alembicPanel());
  add(-48,91,2,'Tablón de Primas y Contratos',()=>bountiesPanel());
  if(state.projects.ship)add(59,35,1,'Barco de travesía · Zarpar',()=>shipNavigationPanel(),4.2);
  add(95,-72,1.5,'Embarcadero de retorno · Zarpar al continente',()=>{moveTo(56,26);toast('Regresas al muelle principal de la costa.');save();},4);
  add(87,74,1.1,'Embarcadero de retorno · Zarpar al continente',()=>{moveTo(56,26);toast('Regresas al muelle principal de la costa.');save();},4);
  for(const fp of visual.flowerPatches){const ready=(state.flowerRegrowth[fp.id]||0)<=state.clock;add(fp.x,fp.z,fp.y,ready?'Recoger flores silvestres':'Flores creciendo',()=>{if(!ready){toast(`Crecen en ${Math.ceil(((state.flowerRegrowth[fp.id]||0)-state.clock)/60)} min`);return}if(!spend(1))return;state.flowers=(state.flowers||0)+2;state.flowerRegrowth[fp.id]=state.clock+180;reward('gardening',5,1);save();toast('+2 flores silvestres')})}
  for(const b of visual.bushes){const ready=(state.berries[b.id]||0)<=state.clock;add(b.x,b.z,b.y,ready?'Recoger bayas':'Bayas creciendo',()=>{if(!ready){toast(`Vuelven en ${Math.ceil(((state.berries[b.id]||0)-state.clock)/60)} min de juego`);return}if(!spend(1))return;state.food.berries+=3;state.berries[b.id]=state.clock+300;reward('gardening',6,1);save();toast('+3 bayas')})}
  for(const p of visual.plots){const s=state.plots[p.id],grown=s?.watered&&state.clock>=s.ready;add(p.x,p.z,p.y,!s?'Sembrar · 1 semilla':!s.watered?'Regar cultivo':grown?'Cosechar':'Cultivo creciendo',()=>{if(actionCooldown>0)return;if(!s){if(state.seeds<1){toast('Necesitas semillas. Los habitantes intercambian madera por semillas.');return}if(!spend(1))return;state.seeds--;state.plots[p.id]={planted:state.clock,watered:false,ready:0};reward('gardening',4)}else if(!s.watered){if(state.water<1){toast('Llena la regadera en el pozo del campamento.');return}if(!spend(1))return;state.water--;s.watered=true;s.ready=state.clock+240;reward('gardening',3)}else if(grown){if(!spend(1))return;const n=3+(skillLevel('gardening')>=4?1:0);state.food.vegetables+=n;state.seeds+=2;delete state.plots[p.id];reward('gardening',16,1);toast(`+${n} hortalizas · +2 semillas`)}else toast(`Cosecha en ${Math.ceil((s.ready-state.clock)/60)} min de juego`);save()})}
  for(const p of visual.nursery){const s=state.nursery[p.id];add(p.x,p.z,p.y,!s?'Plantar árbol · 1 plantón':state.clock<s.ready?'Árbol creciendo':`Talar árbol plantado · ${s.hp||3}`,()=>{if(!s){if(state.saplings<1){toast('Prepara plantones en la mochila.');return}if(!spend(2))return;state.saplings--;state.nursery[p.id]={ready:state.clock+600,hp:3};reward('gardening',6)}else if(state.clock>=s.ready){if(!spend(2))return;greyMan.trigger();s.hp-=1+living.state.tool;if(s.hp<=0){harvesting.inventory.wood+=8;state.saplings++;delete state.nursery[p.id];reward('logging',18,1);toast('+8 madera · +1 plantón')}}else toast(`Crece en ${Math.ceil((s.ready-state.clock)/60)} min de juego`);save()})}
  for(const r of harvesting.resources){if(r.type!=='tree'||r.hp>0||state.regrowth[r.id])continue;if(Math.hypot(r.x-character.position.x,r.z-character.position.z)>2.2)continue;add(r.x,r.z,r.y,'Replantar tocón · 1 plantón',()=>{if(state.saplings<1){toast('Prepara plantones en la mochila.');return}if(!spend(2))return;state.saplings--;state.regrowth[r.id]=state.clock+600;reward('gardening',8);save();toast('Árbol replantado · Crecerá en 10 minutos de juego')})}
  for(const p of visual.projects)if(!state.projects[p.id])add(p.x,p.z,p.y,p.id==='debris'?'Despejar derrumbe':p.id==='dock'?'Construir muelle':p.id==='ship'?'Construir barco':'Restaurar '+p.name.toLowerCase(),()=>restorePanel(p),4.5);
  for(const c of visual.chests)if(!state.chests[c.id]&&(!c.requires||state.projects[c.requires]))add(c.x,c.z,c.y,'Abrir '+c.name.toLowerCase(),()=>claimChest(c),2.5);
  if(unlocked.has('quest:aguas-restauradas'))add(5,-43,2,'Pasar detrás de la cascada',()=>{state.waterfallFound=true;moveTo(85,-52);reward('exploration',state.waterfallReward?0:50);state.waterfallReward=true;save();toast('Cámara de las mareas')},3.2);
  add(85,-51,.76,'Volver a la cascada',()=>{moveTo(5,-43);save()},2);
  if(visual.kitchen.stage===3)add(visual.stove.position.x,visual.stove.position.z,2.12,'Cocinar en casa',()=>cook(true),2);
  for(const npc of visual.residents)if(npc.h.stage===3)add(npc.x,npc.z,npc.y,(state.marriedTo===npc.id?'Hablar con mi esposa ':'Hablar con ')+npc.name,()=>talk(npc),2.6);
  const dungSpot=dungeons.interaction(visual.residents.find(r=>r.id===state.companion));if(dungSpot)options.push(dungSpot);
  const fishSpot=fishing.interaction();if(fishSpot)options.push(fishSpot);const animal=fauna.interaction();if(animal)options.push(animal);options.sort((a,b)=>a.dist-b.dist);return options[0]||null;
 }
 function onActivity(e){const d=e.detail||{};if(!d.skill)return;reward(d.skill,d.xp||0,d.count||0);if(d.resource&&d.finished){state.depleted[d.resource.id]=state.clock;if(d.resource.type==='tree'){state.saplings++;toast(`+${Math.max(2,Math.round(d.resource.size*4))} madera · +1 plantón`)}if(d.resource.type==='rock'&&d.resource.size>=3.4&&living.state.tool>=1){state.ore++;toast('Mineral resistente · +1 mineral')}}checkUnlocks();save()}
 window.addEventListener('life:activity',onActivity);
 window.addEventListener('dungeon:chest',e=>{
  const d=e.detail||{};
  state.coins=(state.coins||0)+(d.coins||0);
  state.ore=(state.ore||0)+(d.ore||0);
  living.state.crystalCount+=(d.crystals||0);
  state.loot.silk=(state.loot.silk||0)+(d.silk||0);
  state.loot.ectoplasm=(state.loot.ectoplasm||0)+(d.ectoplasm||0);
  reward('exploration',d.xp||0,1);
  save();
 });
 harvesting.canStrike=r=>{if(!active()||state.energy<1.4){toast('Necesitas descansar para seguir trabajando.');return false}if(r.type==='rock'&&r.size>=3.4&&living.state.tool<1){toast('Piedra resistente · Necesitas el pico de nivel 2.');return false}state.energy-=1.4;dirty=true;return true};
 harvesting.damageFor=r=>1+living.state.tool+(state.fortified?1:0)+Math.min(2,Math.floor((skillLevel(r.type==='tree'?'logging':'mining')-1)/3))+(state.restedUntil>state.clock?1:0);
 for(const r of harvesting.resources)if(r.hp===0&&state.depleted[r.id]===undefined)state.depleted[r.id]=state.clock;
 function renew(){for(const r of harvesting.resources){if(r.hp>0)continue;const timer=state.regrowth[r.id];if(timer&&state.clock>=timer&&Math.hypot(r.x-character.position.x,r.z-character.position.z)>3&&harvesting.restore(r)){delete state.regrowth[r.id];delete state.depleted[r.id];sprouts.get(r.id)?.removeFromParent();sprouts.delete(r.id);dirty=true}
   else if(r.type==='rock'&&state.clock-(state.depleted[r.id]??state.clock)>=900&&!REGIONS.some(region=>Math.hypot(r.x-region.x,r.z-region.z)<region.range)&&Math.hypot(r.x-character.position.x,r.z-character.position.z)>10&&harvesting.restore(r)){delete state.depleted[r.id];dirty=true}
   if(timer&&r.hp===0&&!sprouts.has(r.id)){const g=visual.group('Repousse',r.x,r.z,r.y);visual.box(g,0,.25,0,.07,.5,.07,0x765838);visual.box(g,0,.5,0,.42,.2,.42,0x76a04d);sprouts.set(r.id,g)}if(timer&&sprouts.has(r.id))sprouts.get(r.id).scale.setScalar(.5+Math.min(1,1-(timer-state.clock)/600)*1.5);
  }}
 function update(dt,speed){if(isWalking()&&!encounters.active){if(state.fainted)wake();else if(state.encounter){const model=fauna.animals.find(a=>a.id===state.encounter.animalId)?.g;encounters.resume(state.encounter,model)}}encounters.update(dt);fishing.update(dt);dungeons.update(dt,state.clock);hud.hidden=!isWalking();if(rest>0){rest-=dt;if(rest<=0){const home=activeRest?.home;state.clock+=home?180:60;state.energy=Math.min(100,state.energy+(home?100:45));state.health=Math.min(100,state.health+(home?45:10));state.hunger=Math.max(0,state.hunger-(home?6:2));if(home)state.restedUntil=state.clock+180;activeRest=null;document.body.classList.remove('resting');save();toast(home?'Descansado · Energía recuperada':'Descanso breve · +45 energía')}}
  if(active()){
   state.clock+=dt;invulnerable=Math.max(0,invulnerable-dt);actionCooldown=Math.max(0,actionCooldown-dt);state.hunger=Math.max(0,state.hunger-dt*.027);state.energy=T.MathUtils.clamp(state.energy-dt*(speed>4.1?.24:speed>.1?.025:state.hunger>20?-.015:0),0,100);
   if(state.buffs.speed>0)state.buffs.speed=Math.max(0,state.buffs.speed-dt);
   if(state.buffs.strength>0)state.buffs.strength=Math.max(0,state.buffs.strength-dt);
   if(state.buffs.poisonWeapon>0)state.buffs.poisonWeapon=Math.max(0,state.buffs.poisonWeapon-dt);
   const maxHp=maxPlayerHp();if(state.hunger>65&&state.energy>45)state.health=Math.min(maxHp,state.health+dt*.045);if(state.health>maxHp)state.health=maxHp;
   for(const r of REGIONS)if(!state.visited[r.id]&&(!r.requires||unlocked.has(r.requires))&&Math.hypot(character.position.x-r.x,character.position.z-r.z)<r.range-3){state.visited[r.id]=true;reward('exploration',25,1);toast('Lugar descubierto · '+r.name)}
   if(state.clock-lastUI>.4){lastUI=state.clock;renew();checkUnlocks()}if(state.clock-lastSave>10){lastSave=state.clock;save()}
  }
  fauna.update(active()?dt:0);
  visual.flame.scale.y=.92+Math.sin(state.clock*5)*.12;visual.fireLight.intensity=3+Math.sin(state.clock*7)*.3;
  for(const b of visual.bushes)b.fruit.visible=(state.berries[b.id]||0)<=state.clock;
  for(const fp of visual.flowerPatches)fp.blooms.visible=(state.flowerRegrowth[fp.id]||0)<=state.clock;
  for(const p of visual.plots){const s=state.plots[p.id];p.plant.visible=!!s;p.plant.scale.setScalar(s?.watered?.25+.75*T.MathUtils.clamp(1-(s.ready-state.clock)/240,0,1):.2)}
  for(const p of visual.nursery){const s=state.nursery[p.id];p.tree.visible=!!s;p.tree.scale.setScalar(s?.ready?T.MathUtils.clamp(1-(s.ready-state.clock)/600,.12,1):.12);p.c.removed=!s||state.clock<s.ready||Math.hypot(character.position.x-p.x,character.position.z-p.z)<1.25}
  for(const c of visual.chests){c.lid.rotation.x=state.chests[c.id]?-.95:0;c.lid.position.y=state.chests[c.id]?.3:0}
  for(const npc of visual.residents){
   npc.g.visible=npc.h.stage===3;
   if(state.companion===npc.id){
    const targetDist=1.3,angle=character.rotation.y;
    const tx=character.position.x-Math.sin(angle)*targetDist-Math.cos(angle)*0.5;
    const tz=character.position.z-Math.cos(angle)*targetDist+Math.sin(angle)*0.5;
    const ty=character.position.y;
    npc.g.position.x=T.MathUtils.lerp(npc.g.position.x,tx,dt*5.5);
    npc.g.position.z=T.MathUtils.lerp(npc.g.position.z,tz,dt*5.5);
    npc.g.position.y=ty;
    const dx=character.position.x-npc.g.position.x,dz=character.position.z-npc.g.position.z;
    const d=Math.hypot(dx,dz);
    if(d>0.15)npc.g.rotation.y=Math.atan2(dx,dz);
    if(d>0.35){
     const legPhase=state.clock*9;
     npc.leftArm.rotation.x=Math.sin(legPhase)*0.45;
     npc.rightArm.rotation.x=-Math.sin(legPhase)*0.45;
     npc.body.position.y=0.82+Math.abs(Math.sin(legPhase*2))*0.04;
    }else{
     npc.leftArm.rotation.x=T.MathUtils.lerp(npc.leftArm.rotation.x,0,dt*4);
     npc.rightArm.rotation.x=T.MathUtils.lerp(npc.rightArm.rotation.x,0,dt*4);
     npc.body.position.y=0.82;
     npc.body.rotation.z=Math.sin(state.clock*1.5)*0.025;
    }
   }else{
    npc.g.position.x=T.MathUtils.lerp(npc.g.position.x,npc.x,dt*3);
    npc.g.position.z=T.MathUtils.lerp(npc.g.position.z,npc.z,dt*3);
    npc.g.position.y=npc.y;
    if(npc.type==='mara'){
     npc.rightArm.rotation.x=Math.sin(state.clock*2.5)*0.35+0.25;
     npc.leftArm.rotation.x=0.1;npc.head.rotation.x=0.12;npc.body.rotation.z=Math.sin(state.clock*1.2)*0.02;
    }else if(npc.type==='scarlett'){
     const strike=Math.sin(state.clock*3.8);
     npc.rightArm.rotation.x=strike>0?strike*0.85:-strike*0.25;
     npc.leftArm.rotation.x=-0.2;npc.body.rotation.z=strike>0.6?0.04:-0.02;
     if(visual.anvil&&strike>0.85){visual.anvil.children.find(c=>c.isPointLight)?.intensity===1.2&&(visual.anvil.children.find(c=>c.isPointLight).intensity=2.2);}
     else if(visual.anvil){visual.anvil.children.find(c=>c.isPointLight)?.intensity===2.2&&(visual.anvil.children.find(c=>c.isPointLight).intensity=1.2);}
    }else if(npc.type==='lyra'){
     npc.leftArm.rotation.x=Math.sin(state.clock*2)*0.3+0.2;
     npc.rightArm.rotation.z=Math.cos(state.clock*1.7)*0.25;
     npc.head.rotation.y=Math.sin(state.clock*1.1)*0.15;npc.body.rotation.z=Math.sin(state.clock*1.3)*0.02;
    }
   }
  }
  const inChamber=Math.abs(character.position.x-85)<4.4&&Math.abs(character.position.z+54)<4.4&&isWalking();visual.chamberRoof.visible=!inChamber;for(const wall of visual.chamber.children){if(Math.abs(wall.position.x)===4.5)wall.visible=!inChamber||(camera.position.x-85)*wall.position.x<=0;if(Math.abs(wall.position.z)===4.5)wall.visible=!inChamber||(camera.position.z+54)*wall.position.z<=0;}
  const maxHp=maxPlayerHp();document.getElementById('lifeLevel').textContent=`Nv. ${state.level} · ${Math.floor(state.xp)}/${requirement(state.level)} XP`;document.getElementById('lifeXP').style.width=`${Math.min(100,state.xp/requirement(state.level)*100)}%`;for(const k of ['hunger','energy'])document.getElementById(k+'Meter').value=state[k];
  const hm=document.getElementById('healthMeter');hm.max=maxHp;hm.value=state.health;
  const minute=Math.floor((state.clock%1080)/1080*1440+480)%1440;document.getElementById('lifeDay').textContent=`Día ${1+Math.floor(state.clock/1080)} · ${String(Math.floor(minute/60)).padStart(2,'0')}:${String(minute%60).padStart(2,'0')} · Diario [I]`;
 }
 living.setExtension({blocked:()=>rest>0||encounters.active||fishing.active,find:findInteraction,indoor:extendIndoor,canCollect:c=>{if(state.energy<1){toast('Necesitas descansar.');return false}state.energy--;return true}});
 if(state.position&&Number.isFinite(state.position.x)&&Number.isFinite(state.position.z)){const {x,z}=state.position,y=world.elevation(x,z);if(world.canMove(x,z,y,unlocked))moveTo(x,z)}
 ready=true;checkUnlocks();window.addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{if(document.hidden){window.dispatchEvent(new Event('construction-relocated'));save()}});
 return {state,update,journal,save,cancelFishing:()=>fishing.cancel(),blocked:()=>rest>0||encounters.active||fishing.active,blocks:fauna.blocks,maxSpeed:()=>Math.min(8.5,(6+(state.level-1)*.08)*(state.buffs?.speed>0?1.3:1)*(state.energy<12?.6:state.energy<30?.82:1)*(state.hunger<15?.8:1)),routeHint,dungeons};
}

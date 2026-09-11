import * as T from 'three';
import {createHeroineModel} from './characters/heroines.js';
// All additions are geometry, in the same metre scale as the original world.
export function createLifeWorld(world){
 const root=new T.Group();root.name='Vida_cotidiana';world.layers.Ruinas.add(root);const mats=new Map(),boxGeo=new T.BoxGeometry(1,1,1);
 function material(color){if(!mats.has(color))mats.set(color,new T.MeshToonMaterial({color,gradientMap:world.gradient}));return mats.get(color)}
 function box(g,x,y,z,w,h,d,color){const m=new T.Mesh(boxGeo,material(color));m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=m.receiveShadow=true;g.add(m);return m}
 function group(name,x,z,y=world.elevation(x,z)){const g=new T.Group();g.name=name;g.position.set(x,y,z);root.add(g);return g}
 function collider(x,y,z,w,h,d){world.collider(x,y,z,w,h,d);return world.colliders.at(-1)}
 function clearSpot(x,z,radius=.9){for(let ring=0;ring<10;ring++)for(let i=0;i<(ring?16:1);i++){const a=i*Math.PI/8,xx=x+Math.cos(a)*ring*.8,zz=z+Math.sin(a)*ring*.8,y=world.elevation(xx,zz);if(world.buildings.some(h=>Math.abs(xx-h.x)<h.w/2+1&&Math.abs(zz-h.z)<h.d/2+1))continue;if(world.canMove(xx,zz,y,new Set(),true)&&!world.colliders.some(c=>!c.removed&&Math.abs(xx-c.x)<c.w/2+radius&&Math.abs(zz-c.z)<c.d/2+radius&&y<c.y+c.h/2))return{x:xx,z:zz,y}}return null}
 function foodBush(x,z,id){const pos=clearSpot(x,z);if(!pos)return null;const g=group('Arbusto_bayas_'+id,pos.x,pos.z,pos.y),fruit=new T.Group();g.add(fruit);for(let i=0;i<7;i++){const a=i*2.4;box(g,Math.cos(a)*.5,.45+(i%2)*.2,Math.sin(a)*.5,.65,.65,.65,[0x4a7843,0x6d944a,0x3e6941][i%3]);box(fruit,Math.cos(a)*.75,.7,Math.sin(a)*.75,.14,.14,.14,0xb95d68)}return{...pos,id,group:g,fruit}}
 const bushes=[[-49,81],[-62,89],[-43,66],[-74,64],[-27,41],[30,44],[-70,-13],[27,-27]].map(([x,z],i)=>foodBush(x,z,'berry-'+i)).filter(Boolean);
 const camp=group('Campement',-49,88,2);for(let i=0;i<9;i++){const a=i/9*Math.PI*2;box(camp,Math.cos(a)*.65,.13,Math.sin(a)*.65,.32,.22,.32,0x929c87)}for(const a of [-.5,.5]){const log=box(camp,0,.15,a*.6,1.05,.22,.23,0x6b4937);log.rotation.y=a}const flame=new T.Group();camp.add(flame);for(let i=0;i<3;i++)box(flame,(i-1)*.16,.4+i*.07,0,.2,.5-i*.09,.22,[0xdd9b49,0xf3c86f,0xe57b38][i]);const fireLight=new T.PointLight(0xf5b868,3,6);fireLight.position.y=1;camp.add(fireLight);
 const bed=group('Paillasse',-52,88,2);box(bed,0,.12,0,1,.18,2,0x748768);box(bed,0,.24,-.7,.9,.14,.42,0xd1c7a2);
 const plots=[];for(let i=0;i<6;i++){const x=-44+(i%3)*2.5,z=99+Math.floor(i/3)*2.5,g=group('Potager_'+i,x,z,2),plant=new T.Group();g.add(plant);box(g,0,.055,0,1.9,.11,1.9,0x70513d);for(const side of [-1,1]){box(g,side*.97,.15,0,.12,.2,2,0x9a754d);box(g,0,.15,side*.97,2,.2,.12,0x9a754d)}for(let k=0;k<4;k++){const xx=(k%2-.5)*.8,zz=(Math.floor(k/2)-.5)*.8;box(plant,xx,.3,zz,.11,.6,.11,0x5b843e);box(plant,xx,.48,zz,.6,.12,.25,0x87a54b);box(plant,xx,.17,zz,.32,.25,.32,0xd7a963)}plots.push({id:'plot-'+i,x,z,y:2,g,plant})}
 const nursery=[[-65,101],[-69,101],[-73,103]].map(([x,z],i)=>{const g=group('Pepiniere_'+i,x,z,2);box(g,0,.05,0,1.6,.1,1.6,0x77593e);const tree=new T.Group();g.add(tree);box(tree,0,1.4,0,.3,2.8,.3,0x785039);for(let j=0;j<4;j++){const size=2.2-j*.4;box(tree,0,2+j*.5,0,size,.65,size,0x4e7846)}return{id:'sapling-'+i,x,z,y:2,g,tree,c:collider(x,3,z,.4,2,.4)}});
 const projects=[];
 // A stream crossing on the coastal trail: water is impassable until planks are fitted.
 const bridge=group('Pont_du_ruisseau',-16,43,2);box(bridge,0,.045,0,8,.08,4.4,0x499f9f);world.waterPlane(-16,2.1,43,8,4.4,0x499f9f);const built=new T.Group(),broken=new T.Group();bridge.add(built,broken);for(let i=0;i<12;i++)box(built,-3.7+i*.67,.14,0,.62,.22,3.6,0xa8895d);for(const z of [-1.8,1.8]){box(built,0,.9,z,8,.13,.13,0x805d43);for(const x of [-3.8,0,3.8])box(built,x,.5,z,.14,1.1,.14,0x805d43)}for(const x of [-3.6,3.6]){const m=box(broken,x,.13,0,1,.2,3.6,0x74604b);m.rotation.z=x>0?-.15:.15}const bridgeCol=collider(-16,2.5,43,6.3,1,4.4);projects.push({id:'bridge',name:'Puente del arroyo',x:-21,z:43,y:2,built,broken,c:bridgeCol,cost:{wood:18,stone:6},kind:'bridge'});
 const stairs=group('Escalier_du_belvedere',-30,15,2),stairBuilt=new T.Group(),stairBroken=new T.Group();stairs.add(stairBuilt,stairBroken);for(let i=0;i<10;i++)box(stairBuilt,0,(i+1)*.12,-i*.45,2.6,(i+1)*.24,.45,0x9b9e86);box(stairs,0,1.2,-5.1,4,2.4,2,0x7e8975);world.floor(-30,9.9,4,2,4.4);for(let i=0;i<5;i++)box(stairBroken,(i%2-.5)*1.1,.3+(i%2)*.15,-i*.65,1.1,.6,.8,0x828c7c);const stairCol=collider(-30,3,13.5,2.6,2,3.8);projects.push({id:'stairs',name:'Escalera del mirador',x:-30,z:17,y:2,built:stairBuilt,broken:stairBroken,c:stairCol,cost:{wood:6,stone:18},kind:'stairs',surface:{type:'stairs',x:-30,z:15,w:2.6,d:4.5,y:2,rise:.24,run:.45,count:10}});
 const debris=group('Eboulis_entree',-72,-19,2),cleared=new T.Group(),rubble=new T.Group();debris.add(cleared,rubble);for(let i=0;i<9;i++)box(rubble,(i%3-1)*1.2,.4+Math.floor(i/3)*.55,(i%2)*.4,1.25,.95,1.1,0x727080);box(cleared,-2.5,.15,0,1,.3,1.2,0x8c8b91);projects.push({id:'debris',name:'Derrumbe de la cueva',x:-72,z:-16,y:2,built:cleared,broken:rubble,c:collider(-72,3,-19,4.5,2,1.8),cost:{wood:8,stone:0},tool:1,kind:'debris'});
 const canal=group('Ecluse_du_sanctuaire',11.5,-27,2),fixed=new T.Group(),rust=new T.Group();canal.add(fixed,rust);
 box(canal,0,.06,0,5.4,.12,2.6,0x5a6369);
 for(const s of [-1,1]){box(canal,s*2.1,1.2,0,.8,2.4,1,0x828c92);box(canal,s*2.1,2.5,0,.95,.3,1.1,0x9ca6ad);box(canal,s*2.6,.5,0,.6,1,1.8,0x6c767d)}
 box(canal,0,2.5,0,5.4,.45,.8,0x79838a);
 const canalBeacon=box(canal,0,3.05,0,.5,.7,.5,0x4cd3c3);
 const canalLight=new T.PointLight(0x4cd3c3,3,15);canalLight.position.set(0,3.1,0);canal.add(canalLight);
 for(let i=0;i<6;i++){box(rust,(i-2.5)*.65,.9,0,.3,1.8,.28,0x8b5a3c);box(rust,(i-2.5)*.65,.45,.15,.22,.8,.22,0x5c4231)}
 box(rust,0,1.3,0,3.4,.18,.3,0x70482f);box(rust,0,.5,0,3.4,.18,.3,0x70482f);
 for(let i=0;i<6;i++)box(fixed,(i-2.5)*.65,1.85,0,.25,.8,.26,0x98b6a1);
 box(fixed,0,1.9,0,3.4,.16,.28,0xa4c2ae);
 box(canal,0,.09,0,3.4,.06,2.4,0x3e9fa8);
 projects.push({id:'canal',name:'Compuerta del santuario',x:11.5,z:-27,y:2,built:fixed,broken:rust,c:collider(11.5,2.6,-27,4.2,2.4,1.4),cost:{wood:12,stone:20,crystals:5},tool:2,kind:'canal'});
 const chests=[];function chest(id,x,z,y,name,requires=null){const g=group(name,x,z,y),lid=new T.Group();g.add(lid);box(g,0,.3,0,1.1,.6,.72,0x795a3d);box(lid,0,.69,0,1.16,.2,.77,0x9d8155);for(const xx of [-.4,.4]){box(g,xx,.3,.38,.1,.6,.045,0xb5ab77);box(lid,xx,.69,0,.1,.24,.8,0xb5ab77)}return chests.push({id,x,z,y,g,lid,name,requires})}
 chest('lookout',-30,9.9,4.4,'Cofre del mirador','stairs');const shoreChest=clearSpot(36,13);if(shoreChest)chest('coast-cache',shoreChest.x,shoreChest.z,shoreChest.y,'Alijo de la costa');
 const caveChest=clearSpot(-48,-68);if(caveChest)chest('cave-cache',caveChest.x,caveChest.z,caveChest.y,'Cofre entre cristales');
 // A secluded chamber on the offshore island, linked to the waterfall passage.
 const chamber=group('Chambre_des_marees',85,-54,.6);box(chamber,0,.08,0,9,.16,9,0x8b9c98);world.floor(85,-54,9,9,.76);for(const side of [-1,1]){box(chamber,side*4.5,2,0,.45,4,9,0x7c908c);collider(85+side*4.5,2.6,-54,.45,4,9);box(chamber,0,2,side*4.5,9,4,.45,0x859996);collider(85,2.6,-54+side*4.5,9,4,.45)}const chamberRoof=box(chamber,0,4.1,0,9.4,.3,9.4,0x60756d);for(const xx of [-3,3]){box(chamber,xx,1.2,-2,.6,2.4,.6,0xa4bcb0);box(chamber,xx,2.5,-2,.3,.3,.3,0x9fe3c9)}chest('waterfall-cache',85,-56,.76,'Tesoro de las mareas');const exit=group('Sceau_de_retour',85,-51,.76);box(exit,0,.09,0,1.4,.18,1.4,0x84b3a5);
 const kitchen=world.buildings.find(h=>h.id==='home');const stove=new T.Group();stove.name='Cuisine';stove.position.set(kitchen.x+2.8,2.12,kitchen.z+.7);kitchen.interior.add(stove);box(stove,0,.48,0,.95,.96,.85,0x727b70);box(stove,0,1,0,1.03,.1,.94,0x454e49);box(stove,0,1.15,0,.55,.25,.55,0x9a8c64);const stoveC=collider(stove.position.x,2.6,stove.position.z,.95,.96,.85);stoveC.removed=kitchen.stage<3;kitchen.furniture.push(stoveC);kitchen.colliders.push(stoveC);stoveC.building='home';stoveC.furniture=true;
 function flowerPatch(x,z,id){const pos=clearSpot(x,z);if(!pos)return null;const g=group('Fleurs_'+id,pos.x,pos.z,pos.y),blooms=new T.Group();g.add(blooms);box(g,0,.05,0,.8,.08,.8,0x4a733e);const colors=[0xe75c75,0x4d90e8,0xf0c946,0xa862e3,0xef7a38,0xffffff];for(let i=0;i<5;i++){const a=i*1.25,r=.25+(i%2)*.12,fx=Math.cos(a)*r,fz=Math.sin(a)*r;box(blooms,fx,.2,fz,.04,.38,.04,0x467838);box(blooms,fx,.41,fz,.18,.12,.18,colors[(i+id.charCodeAt(id.length-1))%colors.length]);box(blooms,fx,.48,fz,.08,.08,.08,0xfce35b)}return{...pos,id,group:g,blooms}}
 const flowerPatches=[[-46,80],[-55,93],[-37,73],[-26,52],[-14,38],[24,28],[35,12],[-74,55],[-62,71],[-70,-10],[28,-22],[-42,-40]].map(([x,z],i)=>flowerPatch(x,z,'flower-'+i)).filter(Boolean);
 const anvil=group('Enclume_du_campement',-52,85,2);box(anvil,0,.25,0,.8,.5,.8,0x6b4937);box(anvil,0,.58,0,.45,.2,.75,0x3d4349);box(anvil,0,.7,.1,.35,.15,.5,0x4f5861);box(anvil,0,.72,-.35,.18,.1,.3,0x5a6570);box(anvil,.1,.8,.1,.1,.06,.2,0x8a9299);box(anvil,.1,.79,-.08,.04,.04,.25,0x8b6540);box(anvil,.6,.2,.2,.6,.4,.6,0x50545a);box(anvil,.6,.42,.2,.5,.06,.5,0x2b221d);box(anvil,.6,.45,.2,.2,.05,.2,0xe85d26);const forgeLight=new T.PointLight(0xff6a28,1.2,3);forgeLight.position.set(.6,.6,.2);anvil.add(forgeLight);collider(-52,2.5,85,1.2,1,1.2);
 const alembic=group('Alambic_du_campement',-44,86,2);box(alembic,0,.35,0,1.3,.7,.7,0x7a5d3f);box(alembic,-.35,.8,0,.24,.3,.24,0x56a3b0);box(alembic,-.35,.98,0,.08,.15,.08,0x6ac2d1);box(alembic,-.15,.95,0,.2,.06,.06,0xb27747);box(alembic,0,.78,0,.18,.22,.18,0xe06060);box(alembic,.22,.78,.1,.14,.24,.14,0x4dd97b);box(alembic,.22,.76,-.15,.16,.2,.16,0xf2be4b);box(alembic,.42,.78,0,.14,.22,.14,0x9f56d9);collider(-44,2.5,86,1.4,1.1,.8);
  function createHeroine(id,name,type,x,z,y=2){
   const model=createHeroineModel(type,world.gradient);
   model.g.name='Heroine_'+id;model.g.position.set(x,y,z);root.add(model.g);
   return {...model,h:world.buildings.find(b=>b.id===id),x,z,y,id,type,name,targetX:x,targetZ:z,animTimer:0,workTimer:0};
  }

  const residents=[
   createHeroine('home','Mara','mara',world.buildings.find(h=>h.id==='home').x-2,world.buildings.find(h=>h.id==='home').z+4,2),
   createHeroine('workshop','Scarlett','scarlett',world.buildings.find(h=>h.id==='workshop').x-2,world.buildings.find(h=>h.id==='workshop').z+4,2),
   createHeroine('store','Lyra','lyra',world.buildings.find(h=>h.id==='store').x-2,world.buildings.find(h=>h.id==='store').z+4,2)
  ];

  // Bounties Bulletin Board at Camp
  const board=group('Tableau_des_primes',-48,91,2);
  box(board,-.7,1,0,.18,2,.18,0x65452d);box(board,.7,1,0,.18,2,.18,0x65452d);
  box(board,0,1.3,0,1.6,1,.12,0x855a36);box(board,0,1.85,0,1.8,.25,.45,0x543722);
  for(let i=0;i<3;i++)box(board,(i-1)*.45,1.3,.08,.32,.42,.02,[0xfef08a,0xfde047,0xfacc15][i]);
  const boardLight=new T.PointLight(0xfef08a,1.2,4);boardLight.position.set(0,1.9,.3);board.add(boardLight);

  // Oceanic Dock & Sailing Ship at Coast
  const dock=group('Quai_de_la_cote',58,30,.6),dockBuilt=new T.Group(),dockBroken=new T.Group();dock.add(dockBuilt,dockBroken);
  box(dockBuilt,0,.2,0,4.8,.3,9,0x785338);
  for(const side of [-2.1,2.1]){for(let z=-3.5;z<=3.5;z+=2.3)box(dockBuilt,side,-.8,z,.3,1.8,.3,0x4f3624)}
  box(dockBuilt,-1.8,1.2,3.8,.25,1.8,.25,0x65452d);
  const dockLantern=new T.PointLight(0xfcd34d,2.2,7);dockLantern.position.set(-1.8,2.1,3.8);dockBuilt.add(dockLantern);
  for(let i=0;i<4;i++)box(dockBroken,(i%2-.5)*1.2,.1,(i-1.5)*1.8,1.4,.25,1.2,0x5a3e28);
  projects.push({id:'dock',name:'Muelle de ultramar',x:56,z:26,y:1,built:dockBuilt,broken:dockBroken,c:collider(58,1.8,30,4.8,2,8.8),cost:{wood:25,stone:15},kind:'dock'});

  const ship=group('Bateau_de_traversee',62,38,.4),shipBuilt=new T.Group(),shipBroken=new T.Group();ship.add(shipBuilt,shipBroken);
  box(shipBuilt,0,.6,0,3.6,1.2,8.4,0x6e4325);box(shipBuilt,0,.9,-4.6,2.2,1,1.8,0x54321b);
  box(shipBuilt,0,3.6,-.4,.28,6.2,.28,0x8a5a36);box(shipBuilt,0,5.6,-.4,4.4,.18,.18,0x8a5a36);
  box(shipBuilt,0,4.1,-.3,4.2,3,.1,0xf8fafc);box(shipBuilt,0,1.5,2.6,.6,.6,.08,0xb45309);
  const shipLight=new T.PointLight(0xfde047,2.2,8);shipLight.position.set(0,1.8,-4.8);shipBuilt.add(shipLight);
  box(shipBroken,0,.1,0,3,.2,4,0x4a2e1c);
  projects.push({id:'ship',name:'Barco de travesía',x:59,z:35,y:1,built:shipBuilt,broken:shipBroken,c:collider(62,2,38,3.8,3,8.6),cost:{wood:35,silk:8,ore:6},kind:'ship'});

  world.makeHash();return {root,box,group,material,collider,clearSpot,bushes,flowerPatches,anvil,alembic,plots,nursery,projects,chests,camp,bed,flame,fireLight,stove,kitchen,residents,board,dock,ship,chamber,chamberRoof};
}

import * as T from 'three';
import {shore, onLand} from './world.js';
export function createFishing({world,visual,state,character,near,canAct,encounters,save,toast}){
 let cast=null,wait=0;const lineMat=new T.LineBasicMaterial({color:0xd9e0cc}),rod=new T.Group();rod.name='Canne_a_peche';visual.box(rod,0,.6,0,.045,1.8,.045,0x9e7e52);rod.rotation.z=-.3;character.getObjectByName('ForearmR').add(rod);rod.visible=false;
 const bobber=new T.Mesh(new T.SphereGeometry(.12,8,6),new T.MeshToonMaterial({color:0xd4a46c}));world.layers.Efectos.add(bobber);bobber.visible=false;const line=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]),lineMat);world.layers.Efectos.add(line);line.visible=false;
 const note=document.createElement('div');note.id='fishingNotice';note.hidden=true;note.innerHTML='<b>El sedal descansa en el agua…</b><span>Espera a que pique un pez.</span><button>Recoger la caña</button>';document.body.append(note);note.querySelector('button').onclick=cancel;
 const defs=[{id:'stream',x:-16,z:46.5,waterX:-16,waterZ:43,waterY:2.13,fish:'perch'},{id:'shore',x:shore(74)-2.5,z:74,waterX:shore(74)+1.5,waterZ:74,waterY:.05,fish:'carp'},{id:'cave-pool',x:-64,z:-31,waterX:-64,waterZ:-38,waterY:2.3,fish:'trout'},{id:'sanctuary-pool',x:26,z:-35,waterX:21,waterZ:-35,waterY:2.3,fish:'carp'}];
 const spots=defs.map(d=>{const p=visual.clearSpot(d.x,d.z,.55);if(!p)return null;const g=visual.group('Peche_'+d.id,p.x,p.z,p.y);visual.box(g,0,.38,0,.08,.75,.08,0x9b7c55);visual.box(g,0,.75,0,.6,.33,.08,0x72928a);return{...d,...p}}).filter(Boolean);
 function cancel(){document.body.classList.remove('is-fishing');cast=null;rod.visible=bobber.visible=line.visible=false;note.hidden=true;window.dispatchEvent(new Event('construction-relocated'))}
 function start(spot){if(!canAct()||cast)return;if(!state.rod){toast('Prepara una caña desde la mochila · 8 madera.');return}document.body.classList.add('is-fishing');state.energy=Math.max(0,state.energy-1);cast=spot;wait=4+Math.random()*4;character.rotation.y=Math.atan2(spot.waterX-character.position.x,spot.waterZ-character.position.z);rod.visible=bobber.visible=line.visible=true;bobber.position.set(spot.waterX,spot.waterY,spot.waterZ);note.hidden=false;window.dispatchEvent(new Event('construction-relocated'));save()}
 function update(dt){if(!cast)return;if(document.hidden)return;if(encounters.active){cancel();return}wait-=dt;bobber.position.y=cast.waterY+Math.sin(wait*5)*.06;const tip=new T.Vector3(0,1.5,0);rod.localToWorld(tip);const attr=line.geometry.attributes.position;attr.setXYZ(0,tip.x,tip.y,tip.z);attr.setXYZ(1,bobber.position.x,bobber.position.y,bobber.position.z);attr.needsUpdate=true;line.geometry.computeBoundingSphere();if(wait<=0){const fish=cast.fish;cancel();encounters.startFish(fish)}}
 function detectWater(){
  const p=character.position,distances=[2.2,3.3,4.4],angles=[0,-.35,.35,-.7,.7];
  for(const dist of distances){
   for(const ang of angles){
    const a=character.rotation.y+ang,tx=p.x+Math.sin(a)*dist,tz=p.z+Math.cos(a)*dist;
    for(const pool of (world.pools||[])){
     const dx=(tx-pool.x)/pool.rx,dz=(tz-pool.z)/pool.rz;
     if(dx*dx+dz*dz<1.08&&Math.abs(p.y-pool.y)<3){
      const fish=pool.z<-45&&pool.x<-30?'trout':pool.z<-20?'carp':'perch';
      return {waterX:tx,waterY:pool.y+.05,waterZ:tz,fish};
     }
    }
    if(Math.abs(tx-(-16))<4.4&&Math.abs(tz-43)<2.4&&Math.abs(p.y-2.1)<2.2){
     return {waterX:tx,waterY:2.13,waterZ:tz,fish:'perch'};
    }
    const sX=shore(tz);
    if((tx>=sX-.6||!onLand(tx,tz))&&p.y<3.8){
     return {waterX:tx,waterY:.05,waterZ:tz,fish:(tx>sX+6?'carp':'trout')};
    }
   }
  }
  return null;
 }
 function interaction(){
  for(const p of spots)if(near(p.x,p.z,p.y,2.8))return{x:p.x,y:p.y,z:p.z,dist:Math.hypot(character.position.x-p.x,character.position.z-p.z),label:state.rod?'Pescar':'Pescar · Necesitas una caña',fn:()=>start(p)};
  const water=detectWater();
  if(water){
   return {x:character.position.x,y:character.position.y,z:character.position.z,dist:1.1,label:state.rod?'Pescar en el agua':'Pescar · Necesitas una caña',fn:()=>start(water)};
  }
  return null;
 }
 return {update,interaction,cancel,get active(){return !!cast}};
}

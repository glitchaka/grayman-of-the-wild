import * as T from 'three';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
const C={wood:0x81563c,dark:0x503c30,trim:0xba8756,plaster:0xd9bc90,stone:0x898d85,roof:0x586b72,roof2:0x657d81,cream:0xf1dcb3,green:0x647b49,glass:0xe6b968};
export const HOME_DEFS=[{id:'home',name:'Cabaña del avellano',use:'Vivienda',x:-36,z:90,w:8,d:7,costs:[[8,4],[12,6],[16,8]]},{id:'workshop',name:'Taller del bosque',use:'Taller',x:-78,z:91,w:10,d:8,costs:[[12,6],[18,10],[24,12]]},{id:'store',name:'Granero de piedra',use:'Almacén',x:-92,z:80,w:7,d:6,costs:[[8,4],[12,6],[16,8]]}];
export function installCozy(world){
 world.buildings=[];world.collectibles=[];world.runeGlyphs=[];
 world.settlement=function(){for(const def of HOME_DEFS)this.buildings.push(buildHouse(this,def));for(let x=-96;x<-28;x+=1.5)this.b('Terreno',x,2.025,101,1.5,.05,3.8,0xb9a079);for(let z=77;z<=102;z+=1.5)this.b('Terreno',-57,2.025,z,3.8,.05,1.5,0xb9a079);
  addCrystal(this,-66,2,72,.7,false);addCrystal(this,-48,2,72,.65,false);
  for(const def of HOME_DEFS){for(let z=def.z+def.d/2;z<=102;z+=1.2)this.b('Terreno',def.x,2.03,z,2.3,.06,1.22,0xb8a786);}
  for(const [x,z]of [[35,35],[47,49],[-47,78],[-31,78],[-83,82],[-69,79],[-60,68]])addCrystal(this,x,2,z,.4,true);
 };
 const forest=world.forest;world.forest=function(){const tree=this.tree;this.tree=function(x,y,z,...args){if(HOME_DEFS.some(h=>Math.abs(x-h.x)<h.w/2+3&&Math.abs(z-h.z)<h.d/2+3))return;return tree.call(this,x,y,z,...args)};try{forest.call(this)}finally{this.tree=tree}};
 world.crystal=function(x,y,z,size=1){addCrystal(this,x,y,z,size,false)};
 const garden=world.garden;world.garden=function(){garden.call(this);for(let i=0;i<3;i++){const rune=this.runes[i];const g=runeShape(i,.6);g.position.copy(rune.position);g.position.y=4.05;this.layers.Efectos.remove(rune);this.layers.Efectos.add(g);this.runes[i]=g;g.userData.pedestal=true;}for(let i=0;i<3;i++){const g=runeShape(i,.72);g.position.set(-57,4+i*1.65,49.865);this.layers.Ruinas.add(g);this.runeGlyphs.push(g)}};
 return world;
}
function runeShape(index,size){const shapes=[[[0,-.5],[0,.5],[.34,.18],[0,-.08],[-.34,.18],[0,.5]],[[0,-.5],[0,.5],[.36,.25],[0,0],[.36,-.25]],[[0,-.5],[0,.5],[-.35,.2],[0,-.1],[.35,.2],[0,.5]]];const g=new T.Group();g.name='Runa_'+index;const points=shapes[index];const border=new T.MeshStandardMaterial({color:0x324c49,roughness:1});const light=new T.MeshStandardMaterial({color:0x77aaa1,emissive:0x28786f,emissiveIntensity:.12});for(let i=1;i<points.length;i++){const p=points[i-1],q=points[i],len=Math.hypot(q[0]-p[0],q[1]-p[1])*size,angle=-Math.atan2(q[0]-p[0],q[1]-p[1]);for(const [w,z,mat]of [[.14,-.01,border],[.065,.013,light]]){const m=new T.Mesh(new T.BoxGeometry(w*size,len+.03,.025),mat);m.position.set((p[0]+q[0])*size/2,(p[1]+q[1])*size/2,z);m.rotation.z=angle;g.add(m)}}g.userData.glow=light;return g;}
function addCrystal(world,x,y,z,size,loose){const g=new T.Group();g.name=(loose?'Cristal_suelto':'Veta_cristal')+'_'+world.collectibles.length;g.position.set(x,y,z);const colors=[0x56baa9,0x95e9cd,0x477e91];for(let i=0;i<(loose?1:3);i++){const height=size*(i?1.8:2.8),r=size*(i?.24:.36),xx=i?(i===1?-.4:.38)*size:0;const mat=new T.MeshStandardMaterial({color:colors[i],emissive:colors[i],emissiveIntensity:.16,roughness:.35});const shaft=new T.Mesh(new T.CylinderGeometry(r*.72,r,height*.7,6),mat);shaft.position.set(xx,height*.35,0);const tip=new T.Mesh(new T.ConeGeometry(r*.72,height*.3,6),mat);tip.position.set(xx,height*.85,0);g.add(shaft,tip)}world.layers.Efectos.add(g);const id=`crystal:${x.toFixed(3)}:${y.toFixed(3)}:${z.toFixed(3)}`;let c=null;if(!loose){world.collider(x,y+size,z,size*.8,size*2,size*.8);c=world.colliders.at(-1);c.collectibleId=id;}world.collectibles.push({id,x,y,z,size,loose,group:g,c,hp:loose?1:3,value:loose?1:Math.max(2,Math.round(size*3))});}
function buildHouse(world,def){const {x,z,w,d}=def,y=2;const root=new T.Group();root.name=def.name;world.layers.Ruinas.add(root);const groups={},bins=new Map(),mats=new Map(),colliders=[];
 const G=name=>{const g=new T.Group();g.name=def.id+'_'+name;root.add(g);groups[name]=g;return g};const base=G('cimientos'),walls={front:G('fachada'),back:G('trasera'),left:G('lateral_izquierdo'),right:G('lateral_derecho')},roof=G('tejado'),interior=G('interior'),repair=G('andamios'),finish=G('acabados');
 function box(g,px,py,pz,bw,bh,bd,color,rz=0,rx=0){const key=g.id+':'+color;if(!bins.has(key))bins.set(key,{g,color,parts:[]});const geo=new T.BoxGeometry(bw,bh,bd);geo.rotateZ(rz);geo.rotateX(rx);geo.translate(x+px,y+py,z+pz);bins.get(key).parts.push(geo)}
 function col(px,py,pz,bw,bh,bd){world.collider(x+px,y+py,z+pz,bw,bh,bd);const c=world.colliders.at(-1);c.building=def.id;colliders.push(c);return c}
 // Raised, continuous floor and a low porch with a walkable entry step.
 box(base,0,.015,0,w+.35,.21,d+.35,C.stone);world.floor(x,z,w,d,2.12);
 for(let j=-w/2+.2;j<w/2;j+=.4)box(base,j,.12,0,.37,.06,d-.1,C.trim);
 box(base,0,.025,d/2+1,3.6,.15,2,C.stone);world.floor(x,z+d/2+1,3.6,2,2.1);
 for(let i=0;i<Math.ceil((w+.4)/.7);i++){box(base,-w/2+i*.7,.24,d/2,.65,.3,.45,C.stone);box(base,-w/2+i*.7,.24,-d/2,.65,.3,.45,C.stone)}
 const height=3.05,doorHalf=1.08;
 function frontSegment(cx,width){box(walls.front,cx,1.6,d/2,width,height,.24,C.plaster);col(cx,1.6,d/2,width,height,.27)}
 frontSegment(-(w/2+doorHalf)/2,w/2-doorHalf);frontSegment((w/2+doorHalf)/2,w/2-doorHalf);box(walls.front,0,2.95,d/2,2.16,.35,.25,C.plaster);
 box(walls.back,0,1.6,-d/2,w,height,.25,C.plaster);col(0,1.6,-d/2,w,height,.3);
 for(const side of [-1,1]){const g=side<0?walls.left:walls.right;box(g,side*w/2,1.6,0,.25,height,d,C.plaster);col(side*w/2,1.6,0,.3,height,d);}
 // Framing is present on all four elevations, with window frames and inset shutters.
 for(const [name,g]of Object.entries(walls)){const side=name==='left'||name==='right',normal=name==='left'?-1:1;const length=side?d:w;for(let j=-length/2;j<=length/2+.01;j+=length/4){if(name==='front'&&Math.abs(j)<1.2)continue;box(g,side?normal*w/2:j,1.65,side?j:(name==='front'?d/2:-d/2),side?.31:.16,3.1,side?.16:.31,C.dark)}for(const yy of [.5,2.75,3.16])box(g,side?normal*w/2:0,yy,side?0:(name==='front'?d/2:-d/2),side?.31:w+.2,.13,side?d+.2:.31,C.trim);
  const positions=name==='front'?[-w*.32,w*.32]:[-length*.23,length*.23];for(const pos of positions){const wx=side?normal*(w/2+.17):pos,wz=side?pos:(name==='front'?d/2+.17:-d/2-.17);box(g,wx,1.88,wz,side?.09:1.13,1.28,side?1.13:.09,C.dark);box(g,wx+(side?normal*.055:0),1.88,wz+(side?0:(name==='front'?.055:-.055)),side?.07:.91,1.05,side?.91:.07,C.glass);for(const yy of [1.24,1.88,2.52])box(g,wx,yy,wz,side?.2:1.25,.07,side?1.25:.2,C.trim);box(g,wx,1.88,wz,side?.2:.06,1.29,side?.06:.2,C.trim);if(!side){box(g,wx-.73,1.88,wz,.25,1.25,.13,C.green);box(g,wx+.73,1.88,wz,.25,1.25,.13,C.green);box(g,wx,1.05,wz+.15,1.4,.32,.42,C.wood);for(let j=-.48;j<=.5;j+=.24){box(g,wx+j,1.33,wz+.15,.23,.26,.3,C.green);box(g,wx+j,1.52,wz+.15,.11,.1,.11,j<0?0xd4bd7c:0xb98698)}}}
 }
 // Complete pitched roof: two continuous supporting planes and tightly overlapping tiles.
 const half=w/2+.65,rise=2.05,slope=Math.atan2(rise,half),slant=Math.hypot(half,rise);
 for(const side of [-1,1]){box(roof,side*half/2,3.32+rise/2,0,slant,.16,d+1.3,C.dark,-side*slope);for(let row=0;row<12;row++){const px=(row+.5)*half/12;for(let zz=-d/2-.5;zz<d/2+.65;zz+=.42){box(roof,side*px,3.42+rise*(1-px/half),zz,slant/12+.055,.085,.46,(row+Math.round(zz*10))%3?C.roof:C.roof2,-side*slope)}}box(roof,side*half,3.3,0,.14,.25,d+1.5,C.trim);}
 box(roof,0,5.47,0,.28,.18,d+1.4,C.roof2);
 // Gables close the triangular ends; they are not empty cubes behind the roof.
 for(const side of [-1,1]){const g=side>0?walls.front:walls.back;for(let row=0;row<15;row++){const h=row*.135,width=w*(1-h/rise);if(width>.05)box(g,0,3.23+h,side*d/2,width,.14,.24,C.plaster);}box(g,0,4.08,side*(d/2+.15),.17,1.9,.16,C.dark);for(let k=-1;k<=1;k+=2)box(g,k*w*.23,4.08,side*(d/2+.16),slant*.9,.14,.14,C.trim,-k*slope);}
 // Chimney, porch, lantern, door surround, sign and planted approach.
 for(let row=0;row<8;row++)box(roof,w*.28,4.7+row*.18,-d*.2,.58,.16,.58,row%2?C.stone:0xaaa390);box(roof,w*.28,6.16,-d*.2,.78,.16,.78,C.dark);
 for(const side of [-1,1]){box(walls.front,side*1.17,1.43,d/2+.14,.16,2.62,.2,C.trim);box(finish,side*1.75,.8,d/2+1.7,.14,1.35,.14,C.wood);}box(walls.front,0,2.8,d/2+.14,2.5,.18,.26,C.trim);
 box(walls.front,1.49,2.27,d/2+.35,.24,.42,.23,C.dark);box(walls.front,1.49,2.27,d/2+.49,.14,.28,.15,C.glass);
 box(base,2.7,.75,d/2+1.8,.12,1.4,.12,C.wood);box(base,2.7,1.35,d/2+1.8,1.28,.62,.13,C.green);
 for(const side of [-1,1]){box(repair,side*(w/2+.6),1.75,0,.1,3.4,.13,C.wood);box(repair,side*(w/2+.6),2.1,0,.5,.13,d+.7,C.trim);}for(let i=0;i<4;i++)box(repair,w/2+1.1,.22+i*.11,-d/2+1,1.4,.1,.28,C.trim);
 const structural=colliders.slice();
 // Door rotates at the hinge, and swaps closed/open physical bounds.
 const door=new T.Group();door.name=def.id+'_puerta';door.position.set(x-1.02,y+.12,z+d/2);root.add(door);const dm=new T.Mesh(new T.BoxGeometry(2.04,2.48,.14),new T.MeshStandardMaterial({color:C.green,roughness:.9}));dm.position.set(1.02,1.24,0);dm.castShadow=true;door.add(dm);for(let j=0;j<7;j++){const seam=new T.Mesh(new T.BoxGeometry(.018,2.38,.02),new T.MeshStandardMaterial({color:C.dark}));seam.position.set(.16+j*.28,1.24,.08);door.add(seam)}const knob=new T.Mesh(new T.SphereGeometry(.065,8,6),new T.MeshStandardMaterial({color:0xb7a575,metalness:.5,roughness:.4}));knob.position.set(1.8,1.15,.13);door.add(knob);
 const closed=col(0,1.36,d/2,2.04,2.48,.18),opened=col(-1.02,1.36,d/2-1.02,.18,2.48,2.04);opened.removed=true;
 const furniture=[];function solid(px,py,pz,bw,bh,bd,color){box(interior,px,py,pz,bw,bh,bd,color);const c=col(px,py,pz,bw,bh,bd);c.furniture=true;furniture.push(c)}
 let interact;
 if(def.id==='home'){solid(-w/2+1.1,.47,-d/2+1.55,1.65,.64,2.55,C.dark);box(interior,-w/2+1.1,.82,-d/2+1.55,1.5,.21,2.37,0xa8bba0);box(interior,-w/2+1.1,.95,-d/2+.7,1.3,.15,.55,C.cream);box(interior,-w/2+1.1,.91,-d/2+2,1.48,.04,1.15,0x617e7a);solid(w/2-.8,.68,-d/2+.8,1.25,1.1,1.2,C.wood);box(interior,w/2-.8,1.32,-d/2+.8,.23,.3,.23,C.glass);interact={x:x-w/2+2.25,z:z-d/2+1.7,label:'Descansar'};}
 else if(def.id==='workshop'){solid(0,.78,-d/2+.85,3.8,1.25,1.3,C.wood);box(interior,0,1.45,-d/2+.85,4.1,.15,1.4,C.trim);for(let k=-1;k<=1;k++){box(interior,k*1.15,1.58,-d/2+.85,.5,.18,.45,C.stone);box(interior,k*1.15,1.77,-d/2+.85,.09,.32,.07,C.dark);}solid(-w/2+.8,.75,-.2,1.15,1.2,1.2,C.stone);interact={x,z:z-d/2+2.4,label:'Usar taller'};}
 else {for(const side of [-1,1]){solid(side*(w/2-.65),1,-.5,.95,1.8,d-2,C.wood);for(let yy=.4;yy<2;yy+=.52)box(interior,side*(w/2-.65),yy,-.5,1.08,.08,d-1.8,C.trim);}solid(0,.56,-d/2+.85,1.75,.85,.95,C.green);interact={x,z:z-d/2+2,label:'Abrir almacén'};}
 // Table, chair, rug and shelves make the rooms usable at character scale.
 box(interior,0,.17,0,2.2,.025,2.4,def.id==='home'?0xa67360:0x7c8b70);box(interior,w/2-.35,2.1,-.25,.45,.12,2,C.wood);for(let j=0;j<4;j++)box(interior,w/2-.35,2.3,-.85+j*.35,.27,.3,.2,[C.green,C.roof,C.cream,C.trim][j]);
 for(const {g,color,parts}of bins.values()){if(!mats.has(color))mats.set(color,new T.MeshStandardMaterial({color,roughness:.88,flatShading:true,emissive:color===C.glass?color:0,emissiveIntensity:color===C.glass?.22:0}));const mesh=new T.Mesh(mergeGeometries(parts,false),mats.get(color));parts.forEach(p=>p.dispose());mesh.name=g.name+'_'+color.toString(16);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);}
 const light=new T.PointLight(0xffc581,8,9,2);light.position.set(x,y+2.55,z);interior.add(light);
 const house={...def,root,walls,roof,interior,repair,finish,door,closed,opened,furniture,interact,stage:0,open:false,doorAngle:0,inside:false,colliders,structural};
 house.applyStage=function(stage){this.stage=stage;for(const c of structural)c.removed=stage===0;for(const g of Object.values(walls))for(const mesh of g.children)if(mesh.material?.color.getHex()===C.plaster)mesh.visible=stage>=1;repair.visible=stage<3;finish.visible=stage>=2;interior.visible=stage===3;for(const c of furniture)c.removed=stage<3;roof.visible=stage>=2;};house.applyStage(0);return house;
}

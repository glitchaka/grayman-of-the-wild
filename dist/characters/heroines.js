import * as T from 'three';
import {createPortraitHead} from './portrait-head.js';

// Metre-scale, articulated adult characters. Surfaces are sculpted rings and
// curved strands, never extruded sprites. +Z is the face / walking direction.
export function createHeroineModel(type, gradient) {
 const root=new T.Group();root.name='Humanoide_'+type;
 const palettes={
  mara:{skin:0xffcfb7,blush:0xd98a83,hair:0xce7797,shine:0xf5b6ca,dark:0x61354e,cloth:0xf2eee9,trim:0x393044,skirt:0x352838,eyes:0x58b889,metal:0xd7ae65},
  scarlett:{skin:0xecc09a,blush:0xc77867,hair:0xc6984e,shine:0xf5d28a,dark:0x59412f,cloth:0x572d39,trim:0x292631,skirt:0x963f48,eyes:0x639cad,metal:0xd0a450},
  lyra:{skin:0xe7cabc,blush:0xc88c93,hair:0xd9e5e2,shine:0xf5fff1,dark:0x677e92,cloth:0x173e55,trim:0x102537,skirt:0x205268,eyes:0x54c9bb,metal:0xe6be6a}
 };const p=palettes[type]||palettes.mara,cache=new Map();
 const ink=new T.MeshBasicMaterial({color:0x252330,side:T.BackSide});
 function mat(c){if(!cache.has(c))cache.set(c,new T.MeshToonMaterial({color:c,gradientMap:gradient}));return cache.get(c)}
 function mesh(parent,geo,c,name,outline=false){const m=new T.Mesh(geo,mat(c));m.name=name;m.castShadow=true;m.receiveShadow=true;parent.add(m);if(false){const edge=new T.Mesh(geo,ink);edge.name='Contour';edge.scale.setScalar(1.022);edge.castShadow=false;m.add(edge)}return m}
 function joint(parent,name,x=0,y=0,z=0){const g=new T.Group();g.name=name;g.position.set(x,y,z);parent.add(g);return g}
 const sphere=new T.SphereGeometry(1,20,14);
 function oval(g,name,c,x,y,z,rx,ry,rz,outline=false){const m=mesh(g,sphere,c,name,outline);m.position.set(x,y,z);m.scale.set(rx,ry,rz);return m}
 // Rings: [height, half width, half depth, centre Z]. Elliptical sections
 // establish clavicles, ribcage, waist, pelvis, knees and ankles continuously.
 function loft(g,name,c,rings,{n=32,from=0,to=Math.PI*2,pleat=0,outline=false,anatomy=false,neckline=false}={}){
  const v=[],uv=[],ix=[],closed=Math.abs(to-from-Math.PI*2)<.001;
  const samples=[],curve=new T.CatmullRomCurve3(rings.map(([y,x,z])=>new T.Vector3(x,y,z)),false,'centripetal');
  const rows=Math.max(rings.length-1,(rings.length-1)*4);
  for(let k=0;k<=rows;k++){
   const t=k/rows,r=curve.getPoint(t),offIndex=t*(rings.length-1),oi=Math.min(rings.length-2,Math.floor(offIndex)),offset=T.MathUtils.lerp(rings[oi][3]||0,rings[oi+1][3]||0,offIndex-oi);
   samples.push([r.y,Math.max(.001,r.x),Math.max(.001,r.z),offset]);
  }
  samples.forEach(([y,rx,rz,z=0],k)=>{for(let j=0;j<=n;j++){
   const a=from+(to-from)*j/n,f=1+pleat*Math.cos(a*12),x=Math.sin(a)*rx*f,front=Math.max(0,Math.cos(a));let yy=y,zz=z+Math.cos(a)*rz*f;
   if(anatomy){zz+=front**3*.037*Math.exp(-Math.pow((y-.455)/.076,2))*(Math.exp(-Math.pow((x-.085)/.066,2))+Math.exp(-Math.pow((x+.085)/.066,2)));zz-=front**8*.006*Math.exp(-Math.pow((y-.27)/.07,2));}
   if(neckline){const cut=.18*front**10;yy=y-cut*Math.max(0,(y-.37)/(.66-.37));}
   v.push(x,yy,zz);uv.push(j/n,k/rows);
  }});
  for(let k=0;k<rows;k++)for(let j=0;j<n;j++){const a=k*(n+1)+j,b=a+1,c=a+n+1,d=c+1;ix.push(a,b,c,b,d,c)}
  if(closed){for(const top of [false,true]){if(neckline&&top)continue;const ring=top?rows:0,[y,,,z]=samples[ring],center=v.length/3;v.push(0,y,z);uv.push(.5,top?1:0);for(let j=0;j<n;j++){const a=ring*(n+1)+j;ix.push(center,top?a+1:a,top?a:a+1)}}}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(v,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ix);geo.computeVertexNormals();
  const m=mesh(g,geo,c,name,false);if(!closed){m.material=m.material.clone();m.material.side=T.DoubleSide}return m;
 }
 function strand(g,name,c,points,widths,depth=.55){
  const curve=new T.CatmullRomCurve3(points.map(a=>new T.Vector3(...a))),steps=Math.max(14,points.length*5),sides=12,v=[],ix=[];
  for(let i=0;i<=steps;i++){const t=i/steps,pt=curve.getPoint(t),tan=curve.getTangent(t),axis=new T.Vector3(0,0,1);if(Math.abs(tan.z)>.94)axis.set(1,0,0);const u=new T.Vector3().crossVectors(tan,axis).normalize(),w=new T.Vector3().crossVectors(u,tan).normalize(),f=t*(widths.length-1),a=Math.min(widths.length-2,Math.floor(f)),r=T.MathUtils.lerp(widths[a],widths[a+1],f-a);for(let j=0;j<=sides;j++){const q=j/sides*Math.PI*2,off=u.clone().multiplyScalar(Math.cos(q)*r).addScaledVector(w,Math.sin(q)*r*depth);v.push(pt.x+off.x,pt.y+off.y,pt.z+off.z)}}
  for(let i=0;i<steps;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+1,c=a+sides+1,d=c+1;ix.push(a,c,b,b,c,d)}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(v,3));geo.setIndex(ix);geo.computeVertexNormals();return mesh(g,geo,c,name)
 }
 function seam(g,name,c,points,r=.007){return mesh(g,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(a=>new T.Vector3(...a))),24,r,5,false),c,name)}
 const body=joint(root,'Pelvis',0,.93),head=joint(body,'Cabeza',0,.815),hair=joint(head,'Cabello');
 loft(body,'Anatomia_torax',p.skin,[[.015,.152,.107],[.09,.201,.124],[.17,.158,.108],[.25,.122,.081],[.32,.143,.096],[.42,.176,.116],[.49,.18,.111],[.55,.17,.091],[.60,.193,.077],[.632,.125,.069],[.66,.048,.048],[.72,.047,.047]],{anatomy:true});
 loft(body,'Vestido_con_pinzas',p.cloth,[[.10,.204,.128],[.17,.166,.113],[.25,.13,.09],[.32,.15,.102],[.42,.184,.122],[.49,.187,.118],[.55,.177,.099],[.60,.197,.085],[.632,.13,.075],[.66,.051,.052]],{anatomy:true,neckline:type!=='lyra'});
 loft(body,'Cinturon',p.trim,[[.17,.171,.116],[.198,.157,.108]]);
 oval(body,'Hebilla',p.metal,0,.185,.119,.020,.019,.006);
 const portrait=createPortraitHead(head,p,gradient,type);
 for(const side of [-1,1])oval(head,'Oreja',p.skin,side*.128,-.026,-.011,.021,.038,.016);
 // Fitted scalp leaves the entire face exposed; individual overlapping locks
 // make an asymmetric fringe and a readable hairstyle from all camera angles.
 mesh(hair,new T.SphereGeometry(1,28,16,0,Math.PI*2,0,1.45),p.hair,'Corona').scale.set(.144,.185,.125);
 for(let i=0;i<9;i++){
  const x=(i-4)*.030;
  strand(hair,'Flequillo_'+i,i===2?p.shine:p.hair,[[x*.55,.176,.06],[x,.118,.123],[x+.022,.048+(i%3)*.024,.126],[x+.034,.016+(i%3)*.025,.119]],[.026,.031,.020,.001],.18);
 }
 const sways=[];
 if(type==='mara'){
  // Rose double braids, cream blouse, dark pleated skirt (reference 3).
  for(const s of [-1,1]){
   const braid=joint(hair,'Trenza_'+s,s*.139,-.015,-.025);sways.push(braid);
   for(let i=0;i<9;i++){
    const yy=-i*.054,xx=s*(.006+Math.sin(i*.45)*.018),zz=.055+i*.009;
    const lock=oval(braid,'Trenzado_'+i,p.hair,xx,yy,zz,.042-i*.0012,.041,.023);lock.rotation.z=s*(i%2?.48:-.48);
    seam(braid,'Separacion_trenza',p.dark,[[xx-.027,yy+.013,zz+.022],[xx,yy,zz+.033],[xx+.027,yy-.02,zz+.023]],.0012);
   }
   strand(braid,'Punta',p.hair,[[0,-.45,.135],[s*.02,-.49,.14],[s*.028,-.53,.12]],[.032,.025,.001]);
   oval(braid,'Lazo',p.trim,0,-.442,.16,.019,.014,.012);
   for(const side of [-1,1])oval(braid,'Cinta',p.trim,side*.025,-.443,.152,.027,.014,.006).rotation.z=side*.4;
  }
  for(let i=0;i<8;i++){const a=Math.PI*.5+i/7*Math.PI;strand(hair,'Nuca',p.hair,[[Math.sin(a)*.12,.10,Math.cos(a)*.105],[Math.sin(a)*.14,-.03,Math.cos(a)*.13],[Math.sin(a)*.11,-.18,Math.cos(a)*.11]],[.038,.035,.006]);}
  loft(body,'Falda_plisada',p.skirt,[[-.18,.275,.177],[-.155,.27,.176],[-.05,.243,.164],[.06,.214,.144],[.145,.19,.126]],{pleat:.065,outline:true});
  for(const s of [-1,1])strand(body,'Cuello_blusa',0xffffff,[[s*.067,.619,.075],[s*.112,.56,.104],[s*.065,.477,.151]],[.028,.032,.002],.09);
  seam(body,'Botonadura',p.trim,[[0,.465,.135],[0,.37,.125],[0,.22,.103]],.003);
  for(const y of [.25,.31,.37,.43])oval(body,'Boton',p.metal,0,y,y>.35?.139:.110,.006,.006,.004);
 }else if(type==='scarlett'){
  // Blonde, swept long hair and a red leather / dark metal smith outfit.
  const pony=joint(hair,'Cola_alta',0,.115,-.09);sways.push(pony);
  oval(pony,'Atadura',p.trim,0,.01,0,.06,.034,.044);
  for(let i=0;i<10;i++){const x=(i-4.5)*.018;strand(pony,'Mechon_largo',i%3?p.hair:p.shine,[[x,.05,-.035],[x*2,-.12,-.10],[x*2.5+.025,-.36,-.13],[x*2+.07,-.56,-.04],[x+.12,-.61,.025]],[.039,.054,.044,.025,.001],.20)}
  for(const s of [-1,1])strand(hair,'Rizo_lateral',p.hair,[[s*.13,.09,.025],[s*.17,-.04,.07],[s*.14,-.21,.10],[s*.20,-.30,.07],[s*.22,-.27,.03]],[.035,.045,.036,.021,.001],.18);
  loft(body,'Short_cuir',p.trim,[[-.12,.19,.12],[-.03,.199,.137],[.12,.19,.13]],{outline:true});
  loft(body,'Tabardo_forja',p.skirt,[[-.31,.166,.171],[-.21,.18,.164],[0,.194,.145],[.17,.153,.114]],{from:-.76,to:.76,n:16});
  for(const s of [-1,1]){
   seam(body,'Costura_corpiño',p.metal,[[s*.12,.20,.06],[s*.137,.36,.103],[s*.17,.51,.095],[s*.18,.59,.061]],.007);
   for(let i=0;i<5;i++)seam(body,'Cordones',p.metal,[[-.027,.26+i*.039,.127+i*.007],[.027,.29+i*.039,.132+i*.007]],.003);
  }
  oval(body,'Medallon',p.metal,0,.573,.106,.033,.04,.009);
 }else{
  // Short white bob, pointed ears and a navy / gold mage suit (reference 7).
  for(let i=0;i<13;i++){const a=.9+i/12*(Math.PI*2-1.8),sx=Math.sin(a),cz=Math.cos(a);strand(hair,'Carre_argente',i%4?p.hair:p.shine,[[sx*.095,.13,cz*.09],[sx*.153,.01,cz*.132],[sx*.147,-.15,cz*.12],[sx*.13,-.205+(i%3)*.02,cz*.10]],[.032,.043,.029,.001],.16)}
  for(const s of [-1,1]){
   strand(head,'Oreille_elfique',p.skin,[[s*.135,-.02,0],[s*.192,.015,-.025],[s*.233,.049,-.035]],[.028,.023,.001],.36);
   seam(head,'Bijou_oreille',p.metal,[[s*.17,.003,.007],[s*.175,-.042,.011],[s*.174,-.06,.012]],.005);
  }
  loft(body,'Col_montant',p.trim,[[.63,.069,.073],[.714,.066,.065]]);
  loft(body,'Tunique_ajustee',p.cloth,[[-.12,.18,.125],[-.01,.199,.14],[.12,.187,.13]]);
  const cape=joint(body,'Pans_de_tunique',0,.15,-.10);sways.push(cape);
  for(const s of [-1,1]){
   strand(cape,'Pan',p.skirt,[[s*.11,0,0],[s*.20,-.21,-.025],[s*.23,-.50,-.04],[s*.25,-.72,-.02]],[.10,.13,.10,.001],.16);
   seam(body,'Broderie_or',p.metal,[[s*.15,.06,.11],[s*.11,.22,.083],[s*.13,.39,.124],[s*.15,.55,.093]],.006);
  }
  const gem=mesh(body,new T.OctahedronGeometry(.035),0x78ded1,'Cristal_pectoral');gem.position.set(0,.58,.113);
 }
 const arms=[],legs=[],knees=[];
 for(const s of [-1,1]){
  const arm=joint(body,s<0?'Bras_gauche':'Bras_droit',s*.187,.580,0);arm.rotation.z=s*.075;arms.push(arm);
  loft(arm,'Haut_du_bras',type==='mara'?p.cloth:p.skin,[[-.28,.034,.036],[-.22,.040,.041],[-.12,.052,.048],[-.045,.058,.053],[.012,.057,.051],[.044,.035,.035],[.055,.006,.006]],{n:20,outline:true});
  const elbow=joint(arm,'Coude',0,-.275);elbow.rotation.x=-.12;
  loft(elbow,'Avant_bras',type==='mara'?p.cloth:p.trim,[[-.252,.025,.026],[-.19,.029,.030],[-.095,.039,.038],[-.025,.035,.036],[.009,.034,.035]],{n:20});
  loft(elbow,'Poignet',type==='mara'?p.trim:p.metal,[[-.239,.036,.034],[-.214,.037,.034]],{n:20});
  const hand=joint(elbow,'Main',0,-.272,.003);
  oval(hand,'Paume',p.skin,0,-.027,0,.029,.046,.018);
  for(let f=0;f<4;f++)strand(hand,'Doigt_'+f,p.skin,[[(f-1.5)*.017,-.055,.005],[(f-1.5)*.017,-.087+(f===0?.006:0),.008],[(f-1.5)*.016,-.103+Math.abs(f-1.5)*.01,.018]],[.008,.007,.004]);
  strand(hand,'Pouce',p.skin,[[s*.029,-.011,.005],[s*.046,-.039,.017],[s*.039,-.056,.025]],[.012,.011,.007]);
  if(type==='scarlett'){
   oval(arm,'Epauliere',p.trim,0,0,0,.065,.043,.058,true);
   seam(arm,'Liseré_epauliere',p.metal,[[-.052,-.01,.035],[0,-.032,.055],[.052,-.01,.035]],.006);
  }
  const leg=joint(body,s<0?'Cuisse_gauche':'Cuisse_droite',s*.108,.012);legs.push(leg);
  const legColor=type==='lyra'?p.cloth:p.skin;
  loft(leg,'Cuisse',legColor,[[-.458,.047,.052],[-.395,.057,.062],[-.28,.078,.081],[-.13,.097,.098],[-.025,.102,.103],[.038,.083,.087]],{n:24,outline:true});
  const knee=joint(leg,'Genou',0,-.455);knees.push(knee);
  loft(knee,'Mollet',type==='mara'?p.trim:legColor,[[-.39,.025,.032],[-.32,.031,.037],[-.22,.046,.048],[-.12,.054,.053],[-.035,.047,.052],[.008,.047,.052]],{n:24});
  if(type!=='mara')loft(knee,'Botte',p.trim,[[-.40,.030,.037,.005],[-.32,.036,.043],[-.19,.054,.055],[-.10,.057,.056]],{n:24,outline:true});
  oval(knee,'Chaussure',p.trim,0,-.427,.036,.040,.047,.09,true);
  oval(knee,'Semelle',0x24242d,0,-.47,.038,.042,.009,.092);
  loft(knee,'Revers',type==='mara'?p.cloth:p.metal,[[type==='mara'?-.03:-.11,.061,.062],[type==='mara'?.005:-.085,.06,.063]],{n:24});
  if(type==='lyra')seam(leg,'Filet_or',p.metal,[[s*.058,-.03,.077],[s*.065,-.17,.064],[s*.04,-.36,.037]],.005);
 }
 const tool=joint(arms[1].children.find(o=>o.name==='Coude'),'Outil',0,-.30,.035);
 if(type==='scarlett'){
  seam(tool,'Manche_marteau',0x76503a,[[0,.14,0],[0,-.19,0]],.015);
  const hammer=mesh(tool,new T.CylinderGeometry(.061,.061,.19,6),0x727f89,'Marteau_de_forgeronne');hammer.rotation.z=Math.PI/2;hammer.position.y=-.19;
  for(const s of [-1,1])oval(tool,'Face_marteau',0xb1b8b3,s*.10,-.19,0,.015,.06,.059);
 }else if(type==='lyra'){
  const gem=mesh(tool,new T.OctahedronGeometry(.053),0x92e4d2,'Fiole_cristal');gem.position.y=-.035;
  loft(tool,'Bouchon',p.metal,[[.015,.015,.015],[.048,.014,.014]],{n:12});
 }else{
  loft(tool,'Arrosoir',0x608c87,[[-.09,.037,.037],[-.075,.052,.052],[.015,.052,.052],[.027,.032,.032]],{n:20});
  seam(tool,'Anse',p.metal,[[0,0,-.04],[0,.05,-.057],[0,.066,.01],[0,.012,.04]],.006);
  seam(tool,'Bec',0x608c87,[[0,-.052,.04],[0,-.01,.10],[0,.008,.115]],.011);
 }
 // Movement is derived from actual displacement, not distance to the leader,
 // so companions stop stepping when their follow offset has been reached.
 let previous=null,phase=0,blend=0;
 function animate(dt,time,{working=false}={}){
  const pos=root.position;
  if(!previous)previous=pos.clone();
  const distance=Math.hypot(pos.x-previous.x,pos.z-previous.z);previous.copy(pos);
  const speed=dt>0?distance/dt:0;blend=T.MathUtils.lerp(blend,Math.min(1,speed/1.8),1-Math.exp(-dt*10));phase+=Math.min(distance,.25)*7;
  legs.forEach((leg,i)=>{const a=phase+i*Math.PI;leg.rotation.x=Math.sin(a)*.43*blend;knees[i].rotation.x=-Math.max(0,Math.sin(a+.65))*.66*blend});
  body.position.y=.93+Math.abs(Math.sin(phase*2))*.014*blend;
  const idle=1-blend;
  arms[0].rotation.x=-Math.sin(phase)*.35*blend+idle*.10;
  arms[1].rotation.x=Math.sin(phase)*.35*blend+idle*(working?(type==='scarlett'?.18+.16*Math.sin(time*1.7):.13):.08);
  arms[0].rotation.z=-.075;arms[1].rotation.z=.075;
  body.rotation.z=idle*.018*Math.sin(time*.8);
  head.rotation.y=idle*.08*Math.sin(time*.55);head.rotation.x=-.025;
  portrait.blink(time);
  sways.forEach((g,i)=>{g.rotation.x=Math.sin(time*1.6+i)*.027+Math.sin(phase)*.065*blend;g.rotation.z=Math.sin(time*1.3+i)*.022});
 }
 root.userData.modelVersion='humanoid-portrait-2';
 return {g:root,body,head,leftArm:arms[0],rightArm:arms[1],tool,animate};
}

import * as T from 'three';

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
 function mesh(parent,geo,c,name,outline=false){const m=new T.Mesh(geo,mat(c));m.name=name;m.castShadow=true;m.receiveShadow=true;parent.add(m);if(outline){const edge=new T.Mesh(geo,ink);edge.name='Contour';edge.scale.setScalar(1.022);edge.castShadow=false;m.add(edge)}return m}
 function joint(parent,name,x=0,y=0,z=0){const g=new T.Group();g.name=name;g.position.set(x,y,z);parent.add(g);return g}
 const sphere=new T.SphereGeometry(1,20,14);
 function oval(g,name,c,x,y,z,rx,ry,rz,outline=false){const m=mesh(g,sphere,c,name,outline);m.position.set(x,y,z);m.scale.set(rx,ry,rz);return m}
 // Rings: [height, half width, half depth, centre Z]. Elliptical sections
 // establish clavicles, ribcage, waist, pelvis, knees and ankles continuously.
 function loft(g,name,c,rings,{n=32,from=0,to=Math.PI*2,pleat=0,outline=false}={}){
  const v=[],uv=[],ix=[];
  rings.forEach(([y,rx,rz,z=0],k)=>{for(let j=0;j<=n;j++){const a=from+(to-from)*j/n,f=1+pleat*Math.cos(a*12);v.push(Math.sin(a)*rx*f,y,z+Math.cos(a)*rz*f);uv.push(j/n,k/(rings.length-1))}});
  for(let k=0;k<rings.length-1;k++)for(let j=0;j<n;j++){const a=k*(n+1)+j,b=a+1,c=a+n+1,d=c+1;ix.push(a,b,c,b,d,c)}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(v,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ix);geo.computeVertexNormals();return mesh(g,geo,c,name,outline)
 }
 function strand(g,name,c,points,widths,depth=.55){
  const curve=new T.CatmullRomCurve3(points.map(a=>new T.Vector3(...a))),steps=Math.max(14,points.length*5),sides=8,v=[],ix=[];
  for(let i=0;i<=steps;i++){const t=i/steps,pt=curve.getPoint(t),tan=curve.getTangent(t),axis=new T.Vector3(0,0,1);if(Math.abs(tan.z)>.94)axis.set(1,0,0);const u=new T.Vector3().crossVectors(tan,axis).normalize(),w=new T.Vector3().crossVectors(u,tan).normalize(),f=t*(widths.length-1),a=Math.min(widths.length-2,Math.floor(f)),r=T.MathUtils.lerp(widths[a],widths[a+1],f-a);for(let j=0;j<=sides;j++){const q=j/sides*Math.PI*2,off=u.clone().multiplyScalar(Math.cos(q)*r).addScaledVector(w,Math.sin(q)*r*depth);v.push(pt.x+off.x,pt.y+off.y,pt.z+off.z)}}
  for(let i=0;i<steps;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+1,c=a+sides+1,d=c+1;ix.push(a,c,b,b,c,d)}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(v,3));geo.setIndex(ix);geo.computeVertexNormals();return mesh(g,geo,c,name)
 }
 function seam(g,name,c,points,r=.007){return mesh(g,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(a=>new T.Vector3(...a))),24,r,5,false),c,name)}
 const body=joint(root,'Pelvis',0,.82),head=joint(body,'Cabeza',0,.85),hair=joint(head,'Cabello');
 loft(body,'Silueta_corporal',p.skin,[[.005,.04,.07],[.035,.18,.115],[.10,.19,.12],[.20,.132,.09],[.28,.137,.098],[.38,.182,.125,.008],[.46,.194,.139,.015],[.53,.189,.113],[.60,.22,.093],[.63,.155,.083],[.66,.061,.064],[.72,.057,.058]],{outline:true});
 // Tailored bodice: continuous chest / waist shape, with a closed top.
 loft(body,'Corpiño',p.cloth,[[.105,.183,.122],[.20,.139,.098],[.28,.144,.104],[.38,.19,.137,.009],[.46,.201,.147,.013],[.53,.197,.12],[.60,.216,.101],[.628,.149,.09],[.65,.063,.068]],{outline:true});
 loft(body,'Cinturon',p.trim,[[.175,.147,.106],[.212,.142,.105]]);
 oval(body,'Hebilla',p.metal,0,.192,.111,.033,.025,.009);
 // Defined jaw, cheeks and forehead rather than a cuboid head.
 loft(head,'Rostro',p.skin,[[-.17,.023,.04,.018],[-.145,.072,.073,.012],[-.11,.104,.091],[-.058,.131,.111],[.008,.142,.116],[.077,.14,.107],[.13,.112,.087],[.163,.065,.052],[.178,.001,.001]],{n:40,outline:true});
 for(const s of [-1,1]){
  oval(head,'Oreja',p.skin,s*.142,-.025,-.008,.026,.045,.022);
  oval(head,'Interior_oreja',p.blush,s*.16,-.023,.006,.009,.025,.009);
  oval(head,'Mejilla',p.blush,s*.097,-.071,.099,.021,.008,.003);
  const eye=joint(head,s<0?'Ojo_izquierdo':'Ojo_derecho',s*.062,-.014,.104);eye.rotation.y=s*.23;
  oval(eye,'Blanco_del_ojo',0xfff6e8,0,0,0,.041,.023,.009);
  oval(eye,'Iris',p.eyes,0,0,.009,.017,.021,.004);
  oval(eye,'Pupila',0x182738,0,.001,.013,.007,.016,.002);
  oval(eye,'Reflejo',0xffffff,-.006,.009,.016,.005,.006,.002);
  seam(eye,'Pestaña',p.dark,[[-.041,.004,.003],[-.022,.021,.008],[.006,.023,.009],[.035,.011,.004],[.046,.016,0]],.0045);
  seam(head,'Ceja',p.dark,[[s*.029,.034,.111],[s*.06,.044,.112],[s*.097,.034,.099]],.004);
 }
 const eyes=head.children.filter(o=>o.name.startsWith('Ojo_'));
 oval(head,'Nariz',p.skin,0,-.053,.118,.015,.023,.022);
 seam(head,'Boca',0x9b5c65,[[-.02,-.103,.092],[0,-.107,.103],[.02,-.103,.092]],.003);
 oval(head,'Labio_inferior',0xe6a09c,0,-.112,.098,.015,.004,.002);
 // Fitted scalp leaves the entire face exposed; individual overlapping locks
 // make an asymmetric fringe and a readable hairstyle from all camera angles.
 mesh(hair,new T.SphereGeometry(1,28,16,0,Math.PI*2,0,1.45),p.hair,'Corona').scale.set(.151,.187,.13);
 for(let i=0;i<9;i++){
  const x=(i-4)*.032;
  strand(hair,'Flequillo_'+i,i%3===0?p.shine:p.hair,[[x*.55,.176,.06],[x,.118,.123],[x+.022,.048+(i%3)*.024,.126],[x+.034,.016+(i%3)*.025,.119]],[.023,.029,.018,.001],.35);
 }
 const sways=[];
 if(type==='mara'){
  // Rose double braids, cream blouse, dark pleated skirt (reference 3).
  for(const s of [-1,1]){
   const braid=joint(hair,'Trenza_'+s,s*.139,-.015,-.025);sways.push(braid);
   for(let i=0;i<9;i++){
    const yy=-i*.054,xx=s*(.006+Math.sin(i*.45)*.018),zz=.055+i*.009;
    const lock=oval(braid,'Trenzado_'+i,i%2?p.hair:p.shine,xx,yy,zz,.049-i*.002,.045,.031);lock.rotation.z=s*(i%2?.48:-.48);
    seam(braid,'Separacion_trenza',p.dark,[[xx-.027,yy+.013,zz+.022],[xx,yy,zz+.033],[xx+.027,yy-.02,zz+.023]],.0025);
   }
   strand(braid,'Punta',p.hair,[[0,-.45,.135],[s*.02,-.49,.14],[s*.028,-.53,.12]],[.032,.025,.001]);
   oval(braid,'Lazo',p.trim,0,-.442,.16,.019,.014,.012);
   for(const side of [-1,1])oval(braid,'Cinta',p.trim,side*.025,-.443,.152,.027,.014,.006).rotation.z=side*.4;
  }
  for(let i=0;i<8;i++){const a=Math.PI*.5+i/7*Math.PI;strand(hair,'Nuca',p.hair,[[Math.sin(a)*.12,.10,Math.cos(a)*.105],[Math.sin(a)*.14,-.03,Math.cos(a)*.13],[Math.sin(a)*.11,-.18,Math.cos(a)*.11]],[.038,.035,.006]);}
  loft(body,'Falda_plisada',p.skirt,[[-.19,.282,.174],[-.16,.278,.172],[-.02,.235,.151],[.12,.184,.126]],{pleat:.065,outline:true});
  for(const s of [-1,1])strand(body,'Cuello_blusa',0xffffff,[[s*.055,.642,.049],[s*.095,.58,.112],[s*.052,.527,.157]],[.031,.03,.001],.16);
  seam(body,'Botonadura',p.trim,[[0,.53,.157],[0,.40,.152],[0,.22,.108]],.003);
  for(const y of [.25,.32,.39,.46])oval(body,'Boton',p.metal,0,y,y>.35?.161:.124,.006,.006,.004);
 }else if(type==='scarlett'){
  // Blonde, swept long hair and a red leather / dark metal smith outfit.
  const pony=joint(hair,'Cola_alta',0,.115,-.09);sways.push(pony);
  oval(pony,'Atadura',p.trim,0,.01,0,.06,.034,.044);
  for(let i=0;i<10;i++){const x=(i-4.5)*.018;strand(pony,'Mechon_largo',i%3?p.hair:p.shine,[[x,.05,-.035],[x*2,-.12,-.10],[x*2.5+.025,-.36,-.13],[x*2+.07,-.56,-.04],[x+.12,-.61,.025]],[.032,.045,.036,.022,.001],.4)}
  for(const s of [-1,1])strand(hair,'Rizo_lateral',p.hair,[[s*.13,.09,.025],[s*.17,-.04,.07],[s*.14,-.21,.10],[s*.20,-.30,.07],[s*.22,-.27,.03]],[.033,.044,.038,.021,.001],.4);
  loft(body,'Short_cuir',p.trim,[[-.12,.19,.12],[-.03,.199,.137],[.12,.19,.13]],{outline:true});
  loft(body,'Tabardo_forja',p.skirt,[[-.31,.166,.171],[-.21,.18,.164],[0,.194,.145],[.17,.153,.114]],{from:-.76,to:.76,n:16});
  for(const s of [-1,1]){
   seam(body,'Costura_corpiño',p.metal,[[s*.12,.20,.06],[s*.137,.36,.103],[s*.17,.51,.095],[s*.18,.59,.061]],.007);
   for(let i=0;i<5;i++)seam(body,'Cordones',p.metal,[[-.027,.26+i*.039,.127+i*.007],[.027,.29+i*.039,.132+i*.007]],.003);
  }
  oval(body,'Medallon',p.metal,0,.573,.106,.033,.04,.009);
 }else{
  // Short white bob, pointed ears and a navy / gold mage suit (reference 7).
  for(let i=0;i<13;i++){const a=.9+i/12*(Math.PI*2-1.8),sx=Math.sin(a),cz=Math.cos(a);strand(hair,'Carre_argente',i%4?p.hair:p.shine,[[sx*.095,.13,cz*.09],[sx*.153,.01,cz*.132],[sx*.147,-.15,cz*.12],[sx*.13,-.205+(i%3)*.02,cz*.10]],[.028,.035,.027,.001],.42)}
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
  const arm=joint(body,s<0?'Bras_gauche':'Bras_droit',s*.218,.594,0);arm.rotation.z=s*.10;arms.push(arm);
  loft(arm,'Haut_du_bras',type==='mara'?p.cloth:p.skin,[[-.27,.042,.041],[-.22,.047,.046],[-.12,.061,.058],[-.03,.072,.066],[.025,.05,.049]],{n:20,outline:true});
  const elbow=joint(arm,'Coude',0,-.265);elbow.rotation.x=-.12;
  loft(elbow,'Avant_bras',type==='mara'?p.cloth:p.trim,[[-.242,.032,.031],[-.19,.036,.033],[-.08,.047,.044],[0,.044,.043]],{n:20});
  loft(elbow,'Poignet',type==='mara'?p.trim:p.metal,[[-.239,.036,.034],[-.214,.037,.034]],{n:20});
  const hand=joint(elbow,'Main',0,-.263,.003);
  oval(hand,'Paume',p.skin,0,-.027,0,.035,.055,.023);
  for(let f=0;f<4;f++)strand(hand,'Doigt_'+f,p.skin,[[(f-1.5)*.017,-.055,.005],[(f-1.5)*.017,-.087+(f===0?.006:0),.008],[(f-1.5)*.016,-.103+Math.abs(f-1.5)*.01,.018]],[.008,.007,.004]);
  strand(hand,'Pouce',p.skin,[[s*.029,-.011,.005],[s*.046,-.039,.017],[s*.039,-.056,.025]],[.012,.011,.007]);
  if(type==='scarlett'){
   oval(arm,'Epauliere',p.trim,0,0,0,.087,.07,.085,true);
   seam(arm,'Liseré_epauliere',p.metal,[[-.07,-.02,.047],[0,-.05,.083],[.07,-.02,.047]],.006);
  }
  const leg=joint(body,s<0?'Cuisse_gauche':'Cuisse_droite',s*.103,.015);legs.push(leg);
  const legColor=type==='lyra'?p.cloth:p.skin;
  loft(leg,'Cuisse',legColor,[[-.405,.052,.053],[-.34,.066,.068],[-.17,.091,.088],[-.035,.098,.095],[.03,.067,.063]],{n:24,outline:true});
  const knee=joint(leg,'Genou',0,-.401);knees.push(knee);
  loft(knee,'Mollet',type==='mara'?p.trim:legColor,[[-.337,.029,.038],[-.28,.037,.043],[-.16,.058,.058],[-.07,.057,.057],[0,.053,.055]],{n:24});
  if(type!=='mara')loft(knee,'Botte',p.trim,[[-.35,.037,.046,.005],[-.25,.045,.052],[-.11,.064,.065],[-.07,.063,.064]],{n:24,outline:true});
  oval(knee,'Chaussure',p.trim,0,-.367,.032,.045,.054,.09,true);
  oval(knee,'Semelle',0x24242d,0,-.406,.035,.047,.012,.092);
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
 function animate(dt,time){
  const pos=root.position;
  if(!previous)previous=pos.clone();
  const distance=Math.hypot(pos.x-previous.x,pos.z-previous.z);previous.copy(pos);
  const speed=dt>0?distance/dt:0;blend=T.MathUtils.lerp(blend,Math.min(1,speed/1.8),1-Math.exp(-dt*10));phase+=Math.min(distance,.25)*7;
  legs.forEach((leg,i)=>{const a=phase+i*Math.PI;leg.rotation.x=Math.sin(a)*.43*blend;knees[i].rotation.x=-Math.max(0,Math.sin(a+.65))*.66*blend});
  body.position.y=.82+Math.abs(Math.sin(phase*2))*.014*blend;
  if(blend>.05){arms[0].rotation.x=-Math.sin(phase)*.35*blend;arms[1].rotation.x=Math.sin(phase)*.35*blend;}
  const blink=time%4.7;const open=blink<.12?Math.max(.04,Math.abs(blink-.06)/.06):1;
  eyes.forEach(e=>e.scale.y=open);
  sways.forEach((g,i)=>{g.rotation.x=Math.sin(time*1.6+i)*.027+Math.sin(phase)*.065*blend;g.rotation.z=Math.sin(time*1.3+i)*.022});
 }
 root.userData.modelVersion='humanoid-sculpted-1';
 return {g:root,body,head,leftArm:arms[0],rightArm:arms[1],tool,animate};
}

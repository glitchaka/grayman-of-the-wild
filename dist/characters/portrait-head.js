import * as T from 'three';

// Facial drawing wraps the actual sculpted head, including profile and nose.
// It is a material on a volume, not a camera-facing character image.
export function createPortraitHead(parent,p,gradient,type){
 const hex=n=>'#'+n.toString(16).padStart(6,'0');
 function texture(closed){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;
  const c=canvas.getContext('2d');c.fillStyle=hex(p.skin);c.fillRect(0,0,1024,1024);
  const path=(color,draw,stroke=false,width=2)=>{c.beginPath();draw();c[stroke?'strokeStyle':'fillStyle']=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';stroke?c.stroke():c.fill()};
  // Restrained cheek tint; no raised discs, spherical eyeballs or tube lips.
  for(const side of [-1,1]){
   c.save();c.translate(512+side*72,548);c.scale(side,1);
   const blush=c.createRadialGradient(15,113,1,15,113,41);blush.addColorStop(0,'#cf7f8730');blush.addColorStop(1,'#cf7f8700');c.fillStyle=blush;c.fillRect(-28,72,86,85);
   if(closed){path('#513941',()=>{c.moveTo(-39,6);c.quadraticCurveTo(0,29,40,0)},true,5)}else{
    const eye=()=>{c.moveTo(-38,2);c.bezierCurveTo(-22,-28,12,-35,43,-11);c.bezierCurveTo(29,23,-6,31,-38,2)};
    path('#fff5e6',eye);c.save();c.beginPath();eye();c.clip();
    const iris=c.createLinearGradient(0,-30,0,29);iris.addColorStop(0,'#243e43');iris.addColorStop(.48,hex(p.eyes));iris.addColorStop(1,type==='mara'?'#c3e8a1':'#99e6e3');
    c.fillStyle=iris;c.beginPath();c.ellipse(3,0,18,28,0,0,Math.PI*2);c.fill();
    c.fillStyle='#183138';c.beginPath();c.ellipse(3,-3,6.5,16,0,0,Math.PI*2);c.fill();
    c.fillStyle='#ffffff';c.beginPath();c.ellipse(-3,-12,6,7,0,0,Math.PI*2);c.fill();c.beginPath();c.arc(11,10,2.5,0,Math.PI*2);c.fill();c.restore();
    path('#352e3b',()=>{c.moveTo(-39,2);c.bezierCurveTo(-22,-28,12,-35,43,-11);c.lineTo(53,-21);c.lineTo(45,-3);c.bezierCurveTo(20,-22,-10,-25,-39,6);c.closePath()});
    path('#84626c',()=>{c.moveTo(-28,16);c.quadraticCurveTo(0,31,29,18)},true,2);
    path('#352e3b',()=>{c.moveTo(37,-15);c.lineTo(42,-27);c.moveTo(43,-10);c.lineTo(51,-16)},true,3);
   }
   path(hex(p.dark),()=>{c.moveTo(-35,-81);c.quadraticCurveTo(-1,-102,35,-89);c.quadraticCurveTo(2,-98,-35,-77);c.closePath()});
   c.restore();
  }
  path('#c18d85',()=>{c.moveTo(517,686);c.quadraticCurveTo(521,701,510,705)},true,2.5);
  path('#9e626b',()=>{c.moveTo(497,803);c.quadraticCurveTo(511,797,527,804)},true,2.7);
  path('#efb3aa',()=>{c.moveTo(502,811);c.quadraticCurveTo(512,816,522,811)},true,3);
  const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.name='Portrait_'+type+(closed?'_blink':'');return t;
 }
 const open=texture(false),closed=texture(true);
 const profile=[[-.165,.005,.018],[-.15,.042,.052],[-.12,.078,.077],[-.08,.108,.093],[-.03,.125,.103],[.025,.13,.108],[.09,.124,.105],[.14,.095,.08],[.167,.045,.04],[.176,.001,.001]];
 const points=profile.map(([y,x,z])=>new T.Vector3(x,y,z)),curve=new T.CatmullRomCurve3(points,false,'centripetal'),v=[],uv=[],ix=[],rows=64,n=64;
 for(let k=0;k<=rows;k++){
  const r=curve.getPoint(k/rows);
  for(let j=0;j<=n;j++){
   const a=(j/n-.5)*Math.PI*2,x=Math.sin(a)*r.x,front=Math.max(0,Math.cos(a));let z=Math.cos(a)*r.z;
   // Integrated shallow nose and cheeks share vertices with the whole face.
   z+=front**14*.009*Math.exp(-Math.pow((r.y+.025)/.08,2));
   z+=front**24*.014*Math.exp(-Math.pow((r.y+.06)/.024,2));
   v.push(x,r.y,z);uv.push(j/n,(r.y+.165)/.341);
  }
 }
 for(let k=0;k<rows;k++)for(let j=0;j<n;j++){const a=k*(n+1)+j,b=a+1,d=a+n+1;ix.push(a,b,d,b,d+1,d)}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(v,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ix);geo.computeVertexNormals();
 const material=new T.MeshToonMaterial({map:open,gradientMap:gradient});const mesh=new T.Mesh(geo,material);mesh.name='Rostro_esculpido';mesh.castShadow=true;mesh.receiveShadow=false;parent.add(mesh);
 return{blink(time){const t=time%5.3;material.map=t>.03&&t<.16?closed:open}};
}

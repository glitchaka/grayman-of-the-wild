export function setupPlayUI({act,returnHome}){
 const axis={x:0,y:0},stick=document.getElementById('joystick'),knob=document.getElementById('stickKnob');let pointer=null;
 function update(e){const r=stick.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,radius=r.width*.33,len=Math.hypot(dx,dy),factor=len>radius?radius/len:1;axis.x=dx*factor/radius;axis.y=-dy*factor/radius;knob.style.transform=`translate(${dx*factor}px,${dy*factor}px)`;}
 stick.onpointerdown=e=>{e.preventDefault();pointer=e.pointerId;stick.setPointerCapture(pointer);update(e)};stick.onpointermove=e=>{if(e.pointerId===pointer)update(e)};function release(){pointer=null;axis.x=axis.y=0;knob.style.transform='translate(0,0)'}stick.onpointerup=stick.onpointercancel=release;window.addEventListener('blur',release);
 document.getElementById('contextAction').onclick=act;document.getElementById('homeButton').onclick=returnHome;
 document.getElementById('mapToggle').onclick=()=>document.getElementById('mapPanel').classList.toggle('expanded');
 document.getElementById('menuToggle').onclick=()=>document.body.classList.toggle('menu-open');
 return {axis,release,get running(){return Math.hypot(axis.x,axis.y)>.9}};
}

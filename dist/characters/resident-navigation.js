import * as T from 'three';

// NPC movement uses the same terrain, water, gates and live wall/door colliders
// as the player. All moves are swept; route planning never moves the actor.
export function createResidentNavigation(world,unlocked){
 const radius=.36,step=.5;
 function clear(x,z,oldY=world.elevation(x,z)){
  if(!world.canMove(x,z,oldY,unlocked))return false;
  const y=world.elevation(x,z),seen=new Set();
  for(let gx=Math.floor((x-radius)/5);gx<=Math.floor((x+radius)/5);gx++)for(let gz=Math.floor((z-radius)/5);gz<=Math.floor((z+radius)/5);gz++)for(const c of world.hash.get(gx+','+gz)||[]){
   if(seen.has(c)||c.removed)continue;seen.add(c);
   if(y+1.86<=c.y-c.h/2||y>=c.y+c.h/2-.15)continue;
   if(Math.abs(x-c.x)<c.w/2+radius&&Math.abs(z-c.z)<c.d/2+radius)return false;
  }return true;
 }
 function sweep(a,b){let y=a.y;const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.12));for(let i=1;i<=n;i++){const x=T.MathUtils.lerp(a.x,b.x,i/n),z=T.MathUtils.lerp(a.z,b.z,i/n);if(!clear(x,z,y))return false;y=world.elevation(x,z)}return true}
 function nearest(x,z,limit=4,outside=false){
  for(let r=0;r<=limit;r+=.25)for(let i=0;i<(r?32:1);i++){
   const a=i*Math.PI/16,xx=x+Math.cos(a)*r,zz=z+Math.sin(a)*r;
   if(outside&&world.buildings.some(h=>Math.abs(xx-h.x)<h.w/2+.75&&Math.abs(zz-h.z)<h.d/2+.75))continue;
   if(clear(xx,zz))return{x:xx,z:zz,y:world.elevation(xx,zz)};
  }return null;
 }
 function route(start,goal){
  if(sweep(start,goal))return[goal];
  const origin={x:start.x,z:start.z},key=(x,z)=>x+','+z;
  const h=(x,z)=>Math.hypot(origin.x+x*step-goal.x,origin.z+z*step-goal.z);
  const first={x:0,z:0,y:start.y,g:0,f:h(0,0),parent:null},open=[first],best=new Map([[key(0,0),first]]),closed=new Set();
  const range=Math.min(70,Math.hypot(goal.x-start.x,goal.z-start.z)+18);
  for(let count=0;open.length&&count<5000;count++){
   let low=0;for(let i=1;i<open.length;i++)if(open[i].f<open[low].f)low=i;
   const cur=open.splice(low,1)[0],id=key(cur.x,cur.z);if(closed.has(id))continue;closed.add(id);
   const pos={x:origin.x+cur.x*step,z:origin.z+cur.z*step,y:cur.y};
   if(h(cur.x,cur.z)<.8&&sweep(pos,goal)){
    const path=[goal];for(let n=cur;n.parent;n=n.parent)path.unshift({x:origin.x+n.x*step,z:origin.z+n.z*step,y:n.y});return path;
   }
   for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
    const x=cur.x+dx,z=cur.z+dz,k=key(x,z);if(closed.has(k)||Math.hypot(x*step,z*step)>range)continue;
    const next={x:origin.x+x*step,z:origin.z+z*step};if(!sweep(pos,next))continue;
    const g=cur.g+Math.hypot(dx,dz)*step;if(best.has(k)&&best.get(k).g<=g)continue;
    const node={x,z,y:world.elevation(next.x,next.z),g,f:g+h(x,z),parent:cur};best.set(k,node);open.push(node);
   }
  }return[];
 }
 function update(npc,target,dt){
  const pos=npc.g.position,nav=npc.navigation||(npc.navigation={path:[],wait:0,lastSafe:null,target:null});
  if(!clear(pos.x,pos.z,pos.y)){
   const safe=nav.lastSafe&&clear(nav.lastSafe.x,nav.lastSafe.z)?nav.lastSafe:nearest(pos.x,pos.z,6);
   if(safe){pos.set(safe.x,safe.y,safe.z);nav.path=[]}else return;
  }
  nav.wait-=dt;
  if(nav.wait<=0&&(!nav.target||Math.hypot(target.x-nav.target.x,target.z-nav.target.z)>.65||!nav.path.length)){
   const goal=nearest(target.x,target.z,2.5);nav.path=goal?route(pos,goal):[];nav.target={...target};nav.wait=1.1;
  }
  let remaining=Math.min(dt,.06)*3.6;
  while(remaining>0&&nav.path.length){
   const next=nav.path[0],dx=next.x-pos.x,dz=next.z-pos.z,d=Math.hypot(dx,dz);
   if(d<.055){nav.path.shift();continue}
   const amount=Math.min(d,remaining,.10),destination={x:pos.x+dx/d*amount,z:pos.z+dz/d*amount};
   if(!sweep(pos,destination)){nav.path=[];nav.wait=0;break}
   pos.set(destination.x,world.elevation(destination.x,destination.z),destination.z);remaining-=amount;
   const yaw=Math.atan2(dx,dz),delta=Math.atan2(Math.sin(yaw-npc.g.rotation.y),Math.cos(yaw-npc.g.rotation.y));npc.g.rotation.y+=delta*(1-Math.exp(-dt*12));
  }
  nav.lastSafe={x:pos.x,y:pos.y,z:pos.z};npc.x=pos.x;npc.y=pos.y;npc.z=pos.z;
 }
 return{nearest,update};
}

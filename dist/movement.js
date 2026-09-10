import * as T from 'three';
// Acceleration is time-based; releasing input brakes without a long slide.
export function createMovement({world,character,camera,controls,keys,playUI,unlocked,isFree,getLife}){
 const forward=new T.Vector3(),right=new T.Vector3(),direction=new T.Vector3(),velocity=new T.Vector3(),old=new T.Vector3();let held=0,lastDirection=new T.Vector3();
 function reset(){held=0;velocity.set(0,0,0);lastDirection.set(0,0,0)}
 window.addEventListener('construction-relocated',reset);window.addEventListener('blur',reset);
 function update(dt,enabled){if(!enabled){reset();return 0}
  const life=getLife(),mx=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'))+playUI.axis.x,mz=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'))+playUI.axis.y;
  const amount=Math.min(1,Math.hypot(mx,mz));forward.subVectors(controls.target,camera.position).setY(0).normalize();right.crossVectors(forward,camera.up).normalize();direction.copy(forward).multiplyScalar(mz).addScaledVector(right,mx);
  if(amount>.08){direction.normalize();if(lastDirection.lengthSq()&&lastDirection.dot(direction)<.3){held=Math.min(held,.8);velocity.multiplyScalar(.35)}held+=dt;lastDirection.copy(direction);
   const sprint=keys.has('ShiftLeft')||keys.has('ShiftRight');const ramp=T.MathUtils.smoothstep(held,sprint?.15:.6,sprint?1.3:3.2),max=life?.maxSpeed()??6;
   let speed=T.MathUtils.lerp(2.1,max,ramp);if(playUI.axis.x||playUI.axis.y)speed*=Math.max(.3,amount);if(keys.has('ControlLeft')||keys.has('ControlRight'))speed=Math.min(speed,2.1);
   direction.multiplyScalar(speed);velocity.lerp(direction,1-Math.exp(-10*dt));
  }else{held=0;velocity.multiplyScalar(Math.exp(-24*dt));if(velocity.length()<.08)velocity.set(0,0,0)}
  old.copy(character.position);const dx=velocity.x*dt,dz=velocity.z*dt;
  const valid=(x,z)=>world.canMove(x,z,character.position.y,unlocked,isFree())&&!(life?.blocks(x,z));
  if(valid(old.x+dx,old.z))character.position.x+=dx;else velocity.x=0;
  if(valid(character.position.x,old.z+dz))character.position.z+=dz;else velocity.z=0;
  character.position.y=world.elevation(character.position.x,character.position.z);const delta=character.position.clone().sub(old);camera.position.add(delta);controls.target.add(delta);
  const speed=Math.hypot(delta.x,delta.z)/Math.max(dt,.001);if(speed>.05){const angle=Math.atan2(velocity.x,velocity.z);character.rotation.y+=Math.atan2(Math.sin(angle-character.rotation.y),Math.cos(angle-character.rotation.y))*(1-Math.exp(-18*dt))}else if(amount>.08)held=Math.min(held,.5);
  return speed;
 }
 return {update,reset};
}

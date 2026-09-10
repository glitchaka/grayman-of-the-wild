// Construction transactions must leave a reachable, unoccupied exterior position.
const padding=.08;
export function overlapsCollider(position,c,radius=.48){
 return !c.removed&&position.y+1.65>=c.y-c.h/2&&position.y<=c.y+c.h/2-.15&&Math.abs(position.x-c.x)<c.w/2+radius&&Math.abs(position.z-c.z)<c.d/2+radius;
}
export function safeConstructionPosition(world,house,position){
 const radius=world.characterRadius??.48;
 const outside=(x,z)=>Math.abs(x-house.x)>house.w/2+radius+padding||Math.abs(z-house.z)>house.d/2+radius+padding;
 const valid=(x,z)=>{if(!outside(x,z))return null;const y=world.elevation(x,z);return world.canMove(x,z,y,new Set(),true)?{x,y,z}:null};
 const current=valid(position.x,position.z);if(current)return current;
 // Prefer the repair sign and the porch, then search the perimeter in half-metre steps.
 const candidates=[[house.x+2.7,house.z+house.d/2+1.8],[house.x,house.z+house.d/2+2]];
 for(let ring=1;ring<=6;ring+=.5){const hx=house.w/2+radius+ring,hz=house.d/2+radius+ring;for(let x=-hx;x<=hx;x+=.5){candidates.push([house.x+x,house.z+hz],[house.x+x,house.z-hz]);}for(let z=-hz;z<=hz;z+=.5){candidates.push([house.x-hx,house.z+z],[house.x+hx,house.z+z]);}}
 for(const [x,z]of candidates){const result=valid(x,z);if(result)return result}return null;
}
export function prepareConstruction(world,house,nextStage,position){
 const previous=house.stage;house.applyStage(nextStage);
 const destination=safeConstructionPosition(world,house,position);
 if(!destination)house.applyStage(previous);
 return destination;
}

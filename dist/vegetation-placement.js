import * as T from 'three';

// One generation-time pass, before instance buffers are allocated. No runtime
// collision or draw-loop work is added. The original random sequence is kept.
export function cleanVegetation(world){
 const unit=new T.Box3(new T.Vector3(-.5,-.5,-.5),new T.Vector3(.5,.5,.5)),grid=new Map(),removed=new Set();
 const key=(name,i)=>name+':'+i,nameOf=b=>b.layer+'_'+b.geo+'_'+b.color.toString(16);
 const cellKeys=function*(box){for(let x=Math.floor(box.min.x/8);x<=Math.floor(box.max.x/8);x++)for(let z=Math.floor(box.min.z/8);z<=Math.floor(box.max.z/8);z++)yield x+','+z};
 for(const batch of world.batches.values())if(batch.layer==='Ruinas'&&batch.geo==='box')for(const matrix of batch.items){
  const box=unit.clone().applyMatrix4(matrix),entry={box,matrix,inverse:matrix.clone().invert()};for(const k of cellKeys(box)){if(!grid.has(k))grid.set(k,[]);grid.get(k).push(entry)}
 }
 const neighbours=box=>{const result=new Set();for(const k of cellKeys(box))for(const e of grid.get(k)||[])result.add(e);return result};
 const batchByName=new Map([...world.batches.values()].map(b=>[nameOf(b),b]));
 for(const resource of world.resources||[]){
  if(resource.type!=='tree')continue;
  const parts=resource.parts.map(part=>{const b=batchByName.get(part.name);const geometry=world.geometries[b.geo];if(!geometry.boundingBox)geometry.computeBoundingBox();return{part,b,box:geometry.boundingBox.clone().applyMatrix4(part.matrix)}});
  let conflict=false;
  for(const {box}of parts){
   // Reserve the full building envelope, including an unfinished building.
   if((world.buildings||[]).some(h=>box.min.x<h.x+h.w/2+.3&&box.max.x>h.x-h.w/2-.3&&box.min.z<h.z+h.d/2+.3&&box.max.z>h.z-h.d/2-.3&&box.min.y<12&&box.max.y>2)){conflict=true;break}
   for(const stone of neighbours(box))if(box.intersectsBox(stone.box)){conflict=true;break}if(conflict)break;
  }
  if(conflict){for(const p of resource.parts)removed.add(key(p.name,p.index));for(const {c}of resource.colliders)c.removed=true;resource.excludedByArchitecture=true;continue}
  // Remove wholly enclosed leaf boxes, without changing the outer silhouette.
  const leaves=parts.filter(e=>e.b.geo==='box'&&e.b.color!==0x0&&e.box.min.y>resource.y+resource.size*3);
  for(let i=0;i<leaves.length;i++)for(let j=0;j<leaves.length;j++){
   if(i===j)continue;const a=leaves[i],b=leaves[j];
   if(b.box.containsBox(a.box)&&(!a.box.equals(b.box)||j<i)){removed.add(key(a.part.name,a.part.index));break}
  }
 }
 // Attach each ivy leaf just outside the actual rotated masonry surface.
 const ray=new T.Ray(),hit=new T.Vector3(),position=new T.Vector3();
 for(const batch of world.batches.values())if(batch.geo==='ivy'){
  const name=nameOf(batch);
  for(let i=0;i<batch.items.length;i++){
   const matrix=batch.items[i];position.setFromMatrixPosition(matrix);
   const search=new T.Box3(new T.Vector3(position.x-.35,position.y-.2,position.z-2),new T.Vector3(position.x+.35,position.y+.2,position.z+2));let face=-Infinity;
   for(const stone of neighbours(search)){
    if(!stone.box.intersectsBox(search))continue;
    for(const dx of [-.5,0,.5])for(const dy of [-.5,0,.5]){
     ray.origin.set(position.x+dx*Math.abs(matrix.elements[0]),position.y+dy*Math.abs(matrix.elements[5]),position.z+3);ray.direction.set(0,0,-1);ray.applyMatrix4(stone.inverse);
     if(ray.intersectBox(unit,hit)){hit.applyMatrix4(stone.matrix);if(Math.abs(hit.z-position.z)<2)face=Math.max(face,hit.z)}
    }
   }
   if(face!==-Infinity)matrix.elements[14]=face+.065;
   // Ivy tips may hang into an arch opening, but duplicate leaves are omitted.
   for(let j=0;j<i;j++){const e=batch.items[j].elements;if(Math.abs(e[12]-matrix.elements[12])<.18&&Math.abs(e[13]-matrix.elements[13])<.17&&Math.abs(e[14]-matrix.elements[14])<.07){removed.add(key(name,i));break}}
  }
 }
 const remap=new Map();
 for(const b of world.batches.values()){
  const name=nameOf(b),items=[];b.items.forEach((matrix,i)=>{if(removed.has(key(name,i)))return;remap.set(key(name,i),items.length);items.push(matrix)});b.items=items;
 }
 world.resources=(world.resources||[]).filter(r=>!r.excludedByArchitecture);
 for(const r of world.resources)r.parts=r.parts.filter(p=>!removed.has(key(p.name,p.index))).map(p=>({...p,index:remap.get(key(p.name,p.index))}));
}

export function pineCrownGeometry(){
 // Exposed profile of seven tiers. Internal cone bases and buried tips do not
 // exist in this geometry; the profile is revolved only once.
 const profile=[new T.Vector2(0,1.55),new T.Vector2(3.2,1.55)];
 for(let j=0;j<7;j++){
  const radius=3.2-j*.4,base=1.55+j;
  if(j<6){profile.push(new T.Vector2(radius*(1-1/1.9),base+1));profile.push(new T.Vector2(radius-.4,base+1))}
  else profile.push(new T.Vector2(0,base+1.9));
 }
 return new T.LatheGeometry(profile,8);
}

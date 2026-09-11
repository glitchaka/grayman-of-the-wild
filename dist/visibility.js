import * as T from 'three';
export function createVisibility({world,scene,camera,character,isWalking}){
 const cells=new Map(),ghosts=new Map(),hidden=[],owners=new Map();let faded=[],chosen=[],normalHits=[],next=0;
 const zero=new T.Matrix4().makeScale(0,0,0),m=new T.Matrix4(),pos=new T.Vector3(),scale=new T.Vector3(),quat=new T.Quaternion(),ray=new T.Ray(),target=new T.Vector3(),direction=new T.Vector3(),closest=new T.Vector3(),caster=new T.Raycaster();
 for(const r of world.resources)for(const p of r.parts)owners.set(p.name+':'+p.index,r);
 world.root.updateMatrixWorld(true);
 world.root.traverse(mesh=>{
  if(!mesh.isInstancedMesh||mesh.name==='Colliders_AABB')return;
  let parent=mesh;while(parent){if(parent===world.layers.Agua||parent===world.layers.Techo_cueva)return;parent=parent.parent}
  if(!mesh.geometry.boundingSphere)mesh.geometry.computeBoundingSphere();const gr=mesh.geometry.boundingSphere.radius;
  for(let i=0;i<mesh.count;i++){
   mesh.getMatrixAt(i,m);m.decompose(pos,quat,scale);if(scale.lengthSq()<.0001||pos.y+Math.abs(scale.y)/2<2.7)continue;
   const e={mesh,index:i,position:pos.clone(),radius:Math.min(14,Math.max(scale.x,scale.y,scale.z)*gr),owner:owners.get(mesh.name+':'+i)},key=Math.floor(pos.x/8)+','+Math.floor(pos.z/8);
   if(!cells.has(key))cells.set(key,[]);cells.get(key).push(e);
  }
 });
 const visible=mesh=>{for(let p=mesh;p;p=p.parent)if(!p.visible)return false;return true};
 const dirty=(mesh,index)=>{mesh.instanceMatrix.addUpdateRange(index*16,16);mesh.instanceMatrix.needsUpdate=true};
 function restore(){
  for(const e of hidden)if(e.owner?.hp!==0){e.mesh.setMatrixAt(e.index,e.saved);dirty(e.mesh,e.index)}hidden.length=0;
  for(const g of ghosts.values()){g.count=0;g.visible=false}
  for(const e of faded){e.mesh.material.opacity=e.opacity;e.mesh.material.transparent=e.transparent;e.mesh.material.depthWrite=e.depthWrite}faded=[];
 }
 function ghostFor(mesh,count){let g=ghosts.get(mesh);if(!g||g.instanceMatrix.count<count){if(g){scene.remove(g);g.material.dispose();g.dispose()}const material=mesh.material.clone();Object.assign(material,{transparent:true,opacity:.18,depthWrite:false});g=new T.InstancedMesh(mesh.geometry,material,Math.max(32,count*2));g.name='Translucido_'+mesh.name;g.frustumCulled=false;g.renderOrder=4;g.userData.visibilityGhost=true;scene.add(g);ghosts.set(mesh,g)}return g}
 function refresh(){
  const candidates=new Set(),distance=Math.min(camera.position.distanceTo(target),85),trees=new Set(),selected=new Map();ray.set(target,direction);
  for(let t=0;t<distance;t+=6){const x=target.x+direction.x*t,z=target.z+direction.z*t,cx=Math.floor(x/8),cz=Math.floor(z/8);for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++)for(const e of cells.get((cx+a)+','+(cz+b))||[])candidates.add(e)}
  const add=e=>selected.set(e.mesh.id+':'+e.index,e);
  for(const e of candidates){if(e.owner?.hp===0||!visible(e.mesh))continue;const p=e.position,t=(p.x-target.x)*direction.x+(p.y-target.y)*direction.y+(p.z-target.z)*direction.z;if(t<.4||t>distance)continue;ray.at(t,closest);if(closest.distanceToSquared(p)<(e.radius+.3)**2){add(e);if(e.owner?.type==='tree')trees.add(e.owner)}}
  for(const r of trees)for(const p of r.parts)if(p.mesh)add({mesh:p.mesh,index:p.index,owner:r});chosen=[...selected.values()];
  const meshes=[];
  function collect(node){if(!node.visible||node.userData.ignoreOcclusion||node===world.layers.Colisiones||node===world.layers.Agua)return;if(node.isMesh&&!node.isInstancedMesh&&!node.material?.isShaderMaterial)meshes.push(node);for(const child of node.children)collect(child)}
  collect(world.root);caster.set(target,direction);caster.near=.4;caster.far=distance;normalHits=[...new Set(caster.intersectObjects(meshes,false).map(h=>h.object))];
 }
 function apply(){
  if(!isWalking()){next=0;return}
  target.copy(character.position);target.y+=.95;direction.copy(camera.position).sub(target).normalize();const now=performance.now();
  if(now>=next){refresh();next=now+120}
  const batches=new Map();
  for(const e of chosen){if(e.owner?.hp===0||!visible(e.mesh))continue;e.mesh.getMatrixAt(e.index,m);if(m.elements[0]===0&&m.elements[5]===0&&m.elements[10]===0)continue;e.saved=m.clone();hidden.push(e);if(!batches.has(e.mesh))batches.set(e.mesh,[]);batches.get(e.mesh).push(e)}
  for(const [mesh,list]of batches){const g=ghostFor(mesh,list.length);g.visible=true;g.count=list.length;g.matrixAutoUpdate=false;g.matrix.copy(mesh.matrixWorld);list.forEach((e,i)=>{g.setMatrixAt(i,e.saved);mesh.setMatrixAt(e.index,zero);dirty(mesh,e.index)});g.instanceMatrix.needsUpdate=true}
  for(const mesh of normalHits){if(!visible(mesh)||!mesh.material?.isMaterial)continue;if(!mesh.userData.ownFadeMaterial){mesh.material=mesh.material.clone();mesh.userData.ownFadeMaterial=true}const material=mesh.material;faded.push({mesh,opacity:material.opacity,transparent:material.transparent,depthWrite:material.depthWrite});Object.assign(material,{transparent:true,opacity:.18,depthWrite:false})}
 }
 for(const name of ['world-physics-changed','construction-relocated'])window.addEventListener(name,()=>{next=0});
 return{restore,apply};
}

import * as T from 'three';
// The solid mesh of an occluding instance is replaced with a translucent instance.
// Physics is never changed. Restore happens before gameplay mutates world geometry.
export function createVisibility({world,scene,camera,character,isWalking}){
 const cells=new Map(),entries=[],meshEntries=new Map(),ghosts=new Map(),hidden=[];let faded=[],elapsed=1;const zero=new T.Matrix4().makeScale(0,0,0),m=new T.Matrix4(),pos=new T.Vector3(),scale=new T.Vector3(),quat=new T.Quaternion();const resourceOwners=new Map();
 for(const r of world.resources)for(const p of r.parts)resourceOwners.set(p.name+':'+p.index,r);
 world.root.updateMatrixWorld(true);
 world.root.traverse(mesh=>{if(!mesh.isInstancedMesh||mesh.name==='Colliders_AABB'||mesh.parent===world.layers.Agua||mesh.parent===world.layers.Techo_cueva)return;const list=[];mesh.geometry.computeBoundingSphere();const gr=mesh.geometry.boundingSphere.radius;
  for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,m);m.decompose(pos,quat,scale);if(scale.lengthSq()<.0001)continue;const radius=Math.max(scale.x,scale.y,scale.z)*gr;
   // Ground slabs below the character are not visual obstructions.
   if(pos.y+Math.abs(scale.y)/2<2.7)continue;
   const e={mesh,index:i,position:pos.clone(),radius:Math.min(radius,14),owner:resourceOwners.get(mesh.name+':'+i)};entries.push(e);list.push(e);const cx=Math.floor(pos.x/8),cz=Math.floor(pos.z/8),k=cx+','+cz;if(!cells.has(k))cells.set(k,[]);cells.get(k).push(e);
  }meshEntries.set(mesh,list);
 });
 function restore(){for(const e of hidden){if(e.owner?.hp===0)continue;e.mesh.setMatrixAt(e.index,e.saved);e.mesh.instanceMatrix.needsUpdate=true;}hidden.length=0;for(const ghost of ghosts.values()){ghost.count=0;ghost.visible=false;}for(const e of faded){e.mesh.material.opacity=e.opacity;e.mesh.material.transparent=e.transparent;e.mesh.material.depthWrite=e.depthWrite;}faded=[];}
 function ghostFor(mesh,count){let g=ghosts.get(mesh);if(!g||g.instanceMatrix.count<count){if(g){scene.remove(g);g.material.dispose();g.dispose();}const material=mesh.material.clone();material.transparent=true;material.opacity=.18;material.depthWrite=false;const capacity=Math.max(64,count*2);g=new T.InstancedMesh(mesh.geometry,material,capacity);g.name='Translucido_'+mesh.name;g.frustumCulled=false;g.renderOrder=4;g.count=0;g.userData.visibilityGhost=true;scene.add(g);ghosts.set(mesh,g);}return g;}
 const ray=new T.Ray(),closest=new T.Vector3();
 function apply(){if(!isWalking())return;const target=character.position.clone().add(new T.Vector3(0,.95,0));const direction=camera.position.clone().sub(target).normalize();ray.set(target,direction);const distance=Math.min(camera.position.distanceTo(target),85),candidates=new Set();
  for(let t=0;t<distance;t+=4){const x=target.x+direction.x*t,z=target.z+direction.z*t,cx=Math.floor(x/8),cz=Math.floor(z/8);for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++)for(const e of cells.get((cx+a)+','+(cz+b))||[])candidates.add(e);}
  const selected=[],wholeTrees=new Set();for(const e of candidates){if(e.owner?.hp===0||!e.mesh.parent.visible)continue;const delta=e.position.clone().sub(target),t=delta.dot(direction);if(t<.4||t>distance)continue;ray.at(t,closest);if(closest.distanceToSquared(e.position)<(e.radius+.3)**2){selected.push(e);if(e.owner?.type==='tree')wholeTrees.add(e.owner);}}
  const chosen=new Map();function add(mesh,index,owner){const k=mesh.id+':'+index;if(!chosen.has(k))chosen.set(k,{mesh,index,owner})}for(const e of selected)add(e.mesh,e.index,e.owner);for(const r of wholeTrees)for(const p of r.parts)if(p.mesh)add(p.mesh,p.index,r);
  const batches=new Map();for(const e of chosen.values()){e.mesh.getMatrixAt(e.index,m);if(m.elements[0]===0&&m.elements[5]===0&&m.elements[10]===0)continue;e.saved=m.clone();hidden.push(e);if(!batches.has(e.mesh))batches.set(e.mesh,[]);batches.get(e.mesh).push(e);}
  for(const [mesh,list]of batches){const ghost=ghostFor(mesh,list.length);ghost.visible=true;ghost.count=list.length;ghost.matrixAutoUpdate=false;ghost.matrix.copy(mesh.matrixWorld);list.forEach((e,i)=>{ghost.setMatrixAt(i,e.saved);mesh.setMatrixAt(e.index,zero)});ghost.instanceMatrix.needsUpdate=true;mesh.instanceMatrix.needsUpdate=true;}
  // Independent architecture, cliffs and crystals retain their original colliders.
  const raycaster=new T.Raycaster(target,direction,.4,distance);const normalMeshes=[];world.root.traverse(n=>{if(!n.isMesh||n.isInstancedMesh||n.userData.visibilityGhost||n===world.layers.Colisiones||n.material?.isShaderMaterial)return;let p=n;while(p&&p!==world.root){if(!p.visible)return;p=p.parent}normalMeshes.push(n)});const hits=raycaster.intersectObjects(normalMeshes,false);const done=new Set();for(const hit of hits){const mesh=hit.object;if(done.has(mesh)||!mesh.material?.isMaterial)continue;done.add(mesh);if(!mesh.userData.ownFadeMaterial){mesh.material=mesh.material.clone();mesh.userData.ownFadeMaterial=true;}const material=mesh.material;faded.push({mesh,opacity:material.opacity,transparent:material.transparent,depthWrite:material.depthWrite});material.transparent=true;material.opacity=.18;material.depthWrite=false;}
 }
 return {restore,apply};
}

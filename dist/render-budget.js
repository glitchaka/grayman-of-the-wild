import * as T from 'three';
export function createRenderBudget({world,camera,renderer,sun,scene}){
 const frustum=new T.Frustum(),matrix=new T.Matrix4(),box=new T.Box3(),offset=sun.position.clone(),focus=new T.Vector3();let nextCull=0,nextShadow=0;
 const mobile=matchMedia('(pointer:coarse)').matches;
 sun.shadow.mapSize.set(mobile?1024:2048,mobile?1024:2048);renderer.shadowMap.autoUpdate=false;scene.add(sun.target);
 function update(time,walking,target,atmosphereChanged){
  if(atmosphereChanged)offset.copy(sun.position);
  if(walking)focus.copy(target);else focus.set(0,0,0);focus.y=0;
  sun.position.copy(offset).add(focus);sun.target.position.copy(focus);sun.target.updateMatrixWorld();
  if(time>=nextCull){
   camera.updateMatrixWorld();matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(matrix);
   for(const group of world.renderSectors||[]){box.copy(group.userData.sectorBounds).expandByScalar(18);group.visible=frustum.intersectsBox(box)}
   nextCull=time+.12;
  }
  if(time>=nextShadow){
   const extent=walking?Math.max(24,Math.min(150,(camera.top-camera.bottom)/camera.zoom)):150;
   Object.assign(sun.shadow.camera,{left:-extent,right:extent,top:extent,bottom:-extent});sun.shadow.camera.updateProjectionMatrix();renderer.shadowMap.needsUpdate=true;nextShadow=time+(mobile?.10:.0667);
  }
 }
 return{update};
}

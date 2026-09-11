import * as T from 'three';
import {createHeroineModel} from './heroines.js';

// Allocate characters only when their restored building is in view. The low
// detail version retains the same silhouette, clothes and portrait texture.
export function createResidentModel(type,gradient){
 const g=new T.Group();g.userData.ignoreOcclusion=true;const models=new Map();let current=null;
 function detail(projectedPixels){
  const quality=projectedPixels>(current?.quality==='high'?85:115)?'high':'low';
  if(current?.quality===quality)return;
  if(!models.has(quality)){
   const model=createHeroineModel(type,gradient,quality);model.quality=quality;model.g.visible=false;g.add(model.g);models.set(quality,model);
  }
  if(current)current.g.visible=false;current=models.get(quality);current.g.visible=true;
 }
 function animate(dt,time,options){if(current){current.animate(dt,time,options);}}
 return{g,detail,animate};
}

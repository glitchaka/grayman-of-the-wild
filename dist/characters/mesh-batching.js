import * as T from 'three';
import {mergeGeometries} from '../vendor/BufferGeometryUtils.js';

// Combine only rigid pieces belonging to the same animated joint. Vertex
// colours replace the per-piece colour materials; the portrait keeps its map.
export function batchCharacter(root,gradient){
 const groups=[];root.traverse(n=>{if(n.isGroup)groups.push(n)});
 const materials=new Map(),discarded=new Set();
 for(const group of groups){
  const buckets=new Map();
  for(const m of group.children){
   if(!m.isMesh||m.isInstancedMesh||m.material.map||m.material.transparent||m.children.length)continue;
   const key=m.material.side;let list=buckets.get(key);if(!list)buckets.set(key,list=[]);list.push(m);
  }
  for(const [side,list]of buckets){
   if(list.length<2)continue;const geometries=[];
   for(const m of list){m.updateMatrix();let geo=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();geo.applyMatrix4(m.matrix);for(const name of Object.keys(geo.attributes))if(name!=='position'&&name!=='normal')geo.deleteAttribute(name);
    const count=geo.attributes.position.count,colors=new Float32Array(count*3),color=m.material.color;
    for(let i=0;i<count;i++)color.toArray(colors,i*3);geo.setAttribute('color',new T.BufferAttribute(colors,3));geometries.push(geo);
   }
   const geometry=mergeGeometries(geometries,false);for(const geo of geometries)geo.dispose();if(!geometry)continue;
   if(!materials.has(side))materials.set(side,new T.MeshToonMaterial({color:0xffffff,vertexColors:true,side,gradientMap:gradient}));
   const combined=new T.Mesh(geometry,materials.get(side));combined.name='Joint_surface_'+group.name;combined.castShadow=true;combined.receiveShadow=true;
   for(const m of list){group.remove(m);discarded.add(m.geometry)}group.add(combined);
  }
 }
 const retained=new Set();root.traverse(n=>{if(n.isMesh)retained.add(n.geometry)});for(const geo of discarded)if(!retained.has(geo))geo.dispose();
 root.userData.ignoreOcclusion=true;
}

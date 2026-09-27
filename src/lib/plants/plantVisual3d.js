import {plantVisualGeometry} from './plantVisualGeometry.js';
// THREE supplied by the application so its single version remains authoritative.
export function addPlantVisual3d(THREE,group,spec,placement,unit,{ghost=false}={}) {
 const parts=plantVisualGeometry(spec,placement?.id),batches=new Map();
 for(const p of parts){const key=p.kind+':'+p.color;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(p);}
 const root=new THREE.Group();root.rotation.y=-(Number(placement?.rotation)||0);root.userData.archetype=spec.id;group.add(root);
 for(const items of batches.values()){
  const p=items[0],geometry=p.kind==='cone'?new THREE.ConeGeometry(.5,1,10):['cylinder','branch'].includes(p.kind)?new THREE.CylinderGeometry(.5,.5,1,6):new THREE.SphereGeometry(.5,8,6);
  const material=new THREE.MeshStandardMaterial({color:p.color,roughness:.9,transparent:ghost,opacity:ghost?.35:1});
  const mesh=new THREE.InstancedMesh(geometry,material,items.length),transform=new THREE.Object3D();
  items.forEach((part,i)=>{
   if(part.kind==='branch'){
    const a=new THREE.Vector3(part.start[0]*spec.widthIn*unit,part.start[1]*spec.heightIn*unit,part.start[2]*spec.widthIn*unit),b=new THREE.Vector3(part.end[0]*spec.widthIn*unit,part.end[1]*spec.heightIn*unit,part.end[2]*spec.widthIn*unit),delta=b.clone().sub(a);
    transform.position.copy(a).add(b).multiplyScalar(.5);transform.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize());transform.scale.set(spec.widthIn*unit*(part.thickness||.006),delta.length(),spec.widthIn*unit*(part.thickness||.006));transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix);return;
   }
   transform.position.set(part.x*spec.widthIn*unit,part.y*spec.heightIn*unit,part.z*spec.widthIn*unit);transform.rotation.set(0,-part.yaw,0);transform.scale.set(part.sx*spec.widthIn*unit,part.sy*spec.heightIn*unit,part.sz*spec.widthIn*unit);transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix);});
  mesh.castShadow=!ghost;mesh.receiveShadow=!ghost;root.add(mesh);
 }
 return root;
}

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
const source=fs.readFileSync(new URL('../src/components/gardenPlanner.js',import.meta.url),'utf8');
const body=source.slice(source.indexOf('function fitProceduralPlantHeight('),source.indexOf('\nfunction openPlantGallery('));
const fit=new Function('THREE',body+';return fitProceduralPlantHeight;')(THREE);
test('procedural dimensions stay physical under rotated beds and bounded maturity scaling',()=>{
 for(const unit of [.022,.055])for(const maturity of [.05,.5,1]){
  const bed=new THREE.Group();bed.rotation.y=.7;bed.position.set(30,0,50);
  const plant=new THREE.Group();plant.scale.setScalar(maturity);bed.add(plant);
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(2,4,2));mesh.position.y=2;plant.add(mesh);
  fit(plant,{height:48,matureDiameter:24},unit);
  const local=mesh.geometry.boundingBox.clone().applyMatrix4(new THREE.Matrix4().makeScale(...plant.scale.toArray()));
  const dimensions=local.getSize(new THREE.Vector3());
  assert.ok(Math.abs(dimensions.y-48*unit*maturity)<1e-8);
  assert.ok(Math.abs(dimensions.x-24*unit*maturity)<1e-8);
  assert.ok(Math.abs(plant.userData.heightInches-48)<1e-8);
 }
});
const imported=source.slice(source.indexOf('function addGardenModel3d('),source.indexOf('\nfunction updateThreeModelStatus('));
const addModel=new Function('THREE',imported+';return addGardenModel3d;')(THREE);
test('imported geometry uses recorded height and crown width without changing its template',()=>{
 const template=new THREE.Group();template.scale.setScalar(2);
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(2,3,1),new THREE.MeshStandardMaterial());template.add(mesh);
 for(const unit of [.022,.055]){
  const group=new THREE.Group();addModel(group,{template},{height:120,matureDiameter:60},unit);
  const box=new THREE.Box3().setFromObject(group),size=box.getSize(new THREE.Vector3());
  assert.ok(Math.abs(size.y-120*unit)<1e-8);assert.ok(Math.abs(size.x-60*unit)<1e-8);assert.ok(box.min.y>=0);
 }
 assert.equal(template.scale.x,2);assert.equal(template.children.length,1);
});

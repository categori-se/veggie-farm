import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
import {plantVisualSpec} from '../src/lib/plants/plantVisualSpec.js';
import {plantVisualGeometry} from '../src/lib/plants/plantVisualGeometry.js';
import {addPlantVisual3d} from '../src/lib/plants/plantVisual3d.js';
import {plannedSize} from '../src/lib/garden/plannedSize.js';
const plants=[['tomato',28,56],['lettuce',12,8],['carrot',5,12],['basil',18,24],['blueberry',42,60],['eastern-white-pine',480,900]].map(([id,matureDiameter,height])=>({id,matureDiameter,height,spacing:matureDiameter+2}));
test('six plant archetypes are deterministic, varied, bounded, and preserve records',()=>{
 const fingerprints=new Set();
 for(const plant of plants){const before=JSON.stringify(plant),spec=plantVisualSpec(plant),parts=plantVisualGeometry(spec,'one');fingerprints.add(JSON.stringify(parts));
 assert.deepEqual(parts,plantVisualGeometry(spec,'one'));assert.equal(JSON.stringify(plant),before);
 assert.ok(parts.length<150);for(const p of parts){if(p.kind==='branch'){assert.ok(p.end.every(Number.isFinite));continue;}assert.ok(p.y-p.sy/2>=-1e-10);assert.ok(p.y+p.sy/2<=1+1e-10);assert.ok(Math.hypot(p.x,p.z)+Math.max(p.sx,p.sz)/2<=.5+1e-10);}
 if(plant.id!=='eastern-white-pine')assert.notDeepEqual(parts,plantVisualGeometry(spec,'two'));
 }
 assert.equal(fingerprints.size,6);assert.equal(plantVisualSpec({id:'unmapped',height:12,matureDiameter:12}),null);assert.equal(plantVisualSpec({...plants[0],height:NaN}),null);
});
test('instanced plants honor dimensions, rotation, date scales and identity without mutating plans',()=>{
 for(const plant of plants){const placement={id:'instance',plantId:plant.id,rotation:.7,sizeScenario:{startDate:'2027-04-01',fullSizeDate:'2027-07-01',startPercent:20,plantId:plant.id,reference:'Illustrative design scenario'}},before=JSON.stringify(placement);
 for(const date of ['2027-04-01','2027-07-01']){const scale=plannedSize(placement,date).scale,spec=plantVisualSpec(plant),group=new THREE.Group();group.scale.setScalar(scale);const root=addPlantVisual3d(THREE,group,spec,placement,.055);group.updateMatrixWorld(true);
 const box=new THREE.Box3().setFromObject(group),size=box.getSize(new THREE.Vector3());assert.ok(Math.abs(size.y-plant.height*.055*scale)<1e-4);for(const mesh of root.children){const matrix=new THREE.Matrix4(),point=new THREE.Vector3(),positions=mesh.geometry.attributes.position;for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);matrix.premultiply(mesh.matrixWorld);for(let j=0;j<positions.count;j++){point.fromBufferAttribute(positions,j).applyMatrix4(matrix);assert.ok(Math.hypot(point.x,point.z)<=plant.matureDiameter*.055*scale/2+1e-4);}}}assert.equal(root.rotation.y,-.7);assert.ok(root.children.length<=5);assert.ok(root.children.every(m=>m.isInstancedMesh));
 root.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
 assert.equal(JSON.stringify(placement),before);
 }
});

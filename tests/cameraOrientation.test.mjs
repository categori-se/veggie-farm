import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
const source=fs.readFileSync(new URL('../src/components/gardenPlanner.js',import.meta.url),'utf8');
const body=source.slice(source.indexOf('function syncThreeCamera('),source.indexOf('\nfunction addVegetationCover3d('));
// Execute the production camera transform with an asymmetric plan and actual
// Three.js projection; stubs supply only surrounding application state.
const make=new Function('THREE','threeViewUnit','parcelViewportBounds','planViewBounds','activeBed','normalizeViewBearing','planningBearing','normalizeViewPitch','planningPitch','clamp','round','parcelZoomLevel',body+';return syncThreeCamera;');
const sync=make(THREE,()=>1,s=>s.bounds,s=>s.bounds,()=>({width:40,height:30}),x=>x,s=>s.bearing,x=>x,s=>s.pitch,(v,a,b)=>Math.max(a,Math.min(b,v)),x=>x,()=>1);
test('2D and 3D preserve handedness and matching headings around the full compass',()=>{
 for(const bearing of [0,30,90,135,180,-45,-90]){
  const camera=new THREE.PerspectiveCamera(45,1,0.1,1000),target=new THREE.Vector3(),orbit={};
  const controls={target,orbit,update(){camera.position.set(target.x+orbit.radius*Math.sin(orbit.phi)*Math.sin(orbit.theta),target.y+orbit.radius*Math.cos(orbit.phi),target.z+orbit.radius*Math.sin(orbit.phi)*Math.cos(orbit.theta));camera.lookAt(target);camera.updateMatrixWorld();}};
  sync({camera,controls},{viewMode:'garden',bounds:{x:-50,y:-50,width:100,height:100},bearing,pitch:0});
  const center=target.clone().project(camera),angle=bearing*Math.PI/180;
  for(const [x,y] of [[13,7],[-8,19],[16,-4]]){
   const projected=new THREE.Vector3(x,target.y,y).project(camera);
   const svgX=x*Math.cos(angle)+y*Math.sin(angle),svgY=-x*Math.sin(angle)+y*Math.cos(angle);
   assert.equal(Math.sign(projected.x-center.x),Math.sign(svgX),`horizontal bearing ${bearing}`);
   assert.equal(Math.sign(-(projected.y-center.y)),Math.sign(svgY),`vertical bearing ${bearing}`);
  }
 }
});

const walkBody=source.slice(source.indexOf('function moveWalkCamera('),source.indexOf('\nfunction createOrbitCamera('));
const move=new Function('planningBearing','planningPitch','setPlanningOrientation','parcelViewBounds','clamp',walkBody+';return moveWalkCamera;')(s=>s.bearing,s=>s.pitch,(s,b,p)=>{s.bearing=b;s.pitch=p;},s=>s.bounds,(v,a,b)=>Math.max(a,Math.min(b,v)));
test('walking steps respect heading and extent without changing garden geometry',()=>{
 const state={walkCamera:{x:50,y:50,look:0},bounds:{x:0,y:0,width:100,height:100},bearing:0,pitch:60,beds:[{x:10,y:20}]};
 move(state,'forward');assert.deepEqual(state.walkCamera,{x:50,y:38,look:0});for(let i=0;i<4;i++)move(state,'forward');assert.equal(state.walkCamera.y,0);
 for(let i=0;i<18;i++)move(state,'right');assert.equal(state.bearing,90);move(state,'forward');assert.equal(state.walkCamera.x,62);for(let i=0;i<4;i++)move(state,'forward');assert.equal(state.walkCamera.x,100);assert.deepEqual(state.beds,[{x:10,y:20}]);
});

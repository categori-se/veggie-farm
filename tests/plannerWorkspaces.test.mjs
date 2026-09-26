import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../src/components/gardenPlanner.js',import.meta.url),'utf8');
const sessions=new WeakMap();
const body=source.slice(source.indexOf('function openPlantingWorkspace('),source.indexOf('\nfunction selectGardenFeature('));
const open=new Function('walkingReturns','planningBearing','explicitEditSessions','normalizeBedCamera','syncSelectedPlacementToActiveBed',body+';return openPlantingWorkspace;')(new WeakMap(),()=>0,sessions,()=>({viewport:{x:0,y:0,width:48,height:96}}),()=>{});
test('opening a bed preserves records and saved camera, revokes editing, and opens only the library',()=>{
 const state={activeBedId:'b',beds:[{id:'b',width:48,height:96}],placements:[{bedId:'b',plantId:'tomato',x:12,y:12}],bedCameras:{b:{bearing:30}},viewPresentation:'split',viewMode:'garden',activeTool:'beds',walkCamera:{x:20,y:30},inspectorOpen:true};
 const records=JSON.stringify([state.beds,state.placements]),camera=state.bedCameras.b;sessions.set(state,{layer:'beds'});
 assert.equal(open(state),true);assert.equal(state.viewMode,'bed');assert.equal(state.viewPresentation,'split');assert.equal(state.activeTool,'plants');assert.equal(state.inspectorOpen,false);assert.equal(state.toolDrawerOpen,true);assert.equal(state.walkCamera,null);assert.equal(sessions.has(state),false);assert.equal(state.bedCameras.b,camera);assert.equal(JSON.stringify([state.beds,state.placements]),records);
});
test('missing bed is a no-op; a map opens a 2D planting workspace',()=>{
 const state={beds:[{id:'b'}],bedCameras:{},viewPresentation:'map'};const before=JSON.stringify(state);assert.equal(open(state,'missing'),false);assert.equal(JSON.stringify(state),before);assert.equal(open(state,'b'),true);assert.equal(state.viewPresentation,'2d');assert.ok(state.bedCameras.b);
});

import * as THREE from 'three';
const cameraBody=source.slice(source.indexOf('function createOrbitCamera('),source.indexOf('\nfunction tagThreeFeature('));
test('camera travel interpolates position and orientation and respects reduced motion',()=>{
 let time=0,reduced=false;
 const create=new Function('THREE','performance','window','clamp','threeViewUnit',cameraBody+';return createOrbitCamera;')(THREE,{now:()=>time},{matchMedia:()=>({matches:reduced})},(v,a,b)=>Math.max(a,Math.min(b,v)),()=>1);
 const camera=new THREE.PerspectiveCamera(),canvas={setAttribute(){},addEventListener(){}},control=create(camera,canvas,{});
 control.update();const start=camera.position.clone();control.target.set(100,0,100);time+=16;control.update();assert.ok(camera.position.x>start.x && camera.position.x<100);
 for(let i=0;i<80;i++){time+=16;control.update();}assert.ok(Math.abs(camera.position.x-100)<.01);
 reduced=true;control.target.set(200,0,200);time+=16;control.update();assert.equal(camera.position.x,200);
 reduced=false;control.snap();control.target.set(300,0,300);time+=16;control.update();assert.equal(camera.position.x,300);
});

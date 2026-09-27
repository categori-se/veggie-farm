import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {bedFillPositions} from '../src/lib/garden/bedFill.js';
const source=fs.readFileSync(new URL('../src/components/gardenPlanner.js',import.meta.url),'utf8');
const extract=(name,next)=>source.slice(source.indexOf(`function ${name}(`),source.indexOf(`\nfunction ${next}(`));
test('flat area overlays do not hide a bed hit, but buildings still occlude it',()=>{
 const raycast=new Function('threeFeatureRef','threeFeatureEntity',extract('threeRaycastFeature','threeGroundPoint')+';return threeRaycastFeature;')(o=>o.ref,(_s,r)=>({type:r.kind}));
 const hit=(type,kind)=>({object:{ref:{type,kind,id:kind}}});
 let hits=[hit('structure','garden-section'),hit('bed','b')];const three={renderer:{domElement:{getBoundingClientRect:()=>({width:100,height:100,left:0,top:0})}},pointer:{set(){}},raycaster:{setFromCamera(){},intersectObjects:()=>hits},group:{children:[]},state:{viewMode:'garden'}};
 assert.equal(raycast(three,{clientX:50,clientY:50}).ref.type,'bed');
 hits=[hit('structure','house'),hit('bed','b')];assert.equal(raycast(three,{clientX:50,clientY:50}).ref.kind,'house');
});
test('decorative light stays fixed when camera target and viewport move',()=>{
 const sync=new Function('THREE','solarSceneDirection','parcelViewBounds','planViewBounds','activeBed',extract('syncThreeSolar','threeViewUnit')+';return syncThreeSolar;')(THREE,()=>null,()=>({x:0,y:0,width:2000,height:3000}),()=>({width:48,height:96}),()=>({rotation:0}));
 const light=new THREE.DirectionalLight(),canvas={dataset:{}},three={renderer:{domElement:canvas,shadowMap:{}},sun:light,controls:{target:new THREE.Vector3()}};
 sync(three,{viewMode:'garden'},.022);const position=light.position.clone(),target=light.target.position.clone(),direction=canvas.dataset.solarDirection;
 three.controls.target.set(900,66,500);sync(three,{viewMode:'garden',parcelViewport:{x:900,y:500,width:50,height:100}},.022);
 assert.deepEqual(light.position,position);assert.deepEqual(light.target.position,target);assert.equal(canvas.dataset.solarDirection,direction);
});
test('proposed beds have varied seasonal crops and preserve occupied beds',()=>{
 const plants=['lettuce','carrot','kale','tomato','basil','nasturtium'].map(id=>({id,name:id,spacing:12,matureDiameter:12}));
 const body=source.slice(source.indexOf('function proposedBedPlantings('),source.indexOf('\nconst DEFAULT_STATE'));
 const fill=new Function('DEFAULT_PLANTS','normalizeBed','bedFillPositions','isInsideBed',body+';return proposedBedPlantings;')(plants,b=>({...b,crowding:1,safeMargin:0}),bedFillPositions,()=>true);
 const beds=Array.from({length:4},(_,i)=>({id:'bed'+i,name:'Vegetable bed',width:48,height:96})),old=[{id:'custom',bedId:'bed0',plantId:'tomato'}],before=JSON.stringify(old);
 const result=fill(beds,old);assert.equal(JSON.stringify(old),before);assert.ok(result.length>30);assert.ok(result.every(p=>p.bedId!=='bed0'&&p.planted<p.plannedUntil&&p.notes.includes('estimates')));assert.equal(new Set(result.map(p=>p.bedId)).size,3);assert.ok(new Set(result.map(p=>p.plantId)).size>=4);assert.deepEqual(fill(beds,[...old,...result]),[]);
});

test('bed shadow camera coverage stays fixed across pan and zoom',()=>{
 const bed={width:48,height:96,rotation:30};
 let viewport={width:48,height:96};
 const sync=new Function('THREE','solarSceneDirection','parcelViewBounds','planViewBounds','activeBed',extract('syncThreeSolar','threeViewUnit')+';return syncThreeSolar;')(THREE,()=>null,()=>null,()=>viewport,()=>bed);
 const light=new THREE.DirectionalLight(),three={renderer:{domElement:{dataset:{}},shadowMap:{}},sun:light};
 sync(three,{viewMode:'bed'},.055);
 const position=light.position.clone(),projection=light.shadow.camera.projectionMatrix.clone();
 viewport={x:900,y:500,width:800,height:1600};
 sync(three,{viewMode:'bed'},.055);
 assert.deepEqual(light.position,position);
 assert.deepEqual(light.shadow.camera.projectionMatrix,projection);
});
test('parcel scene keeps shadow casters outside the visible camera bounds',()=>{
 const parcel={x:0,y:0,width:9000,height:9000},viewport={x:400,y:300,width:100,height:100};
 const calls=[];
 const dependencies={
  activeBed:()=>({id:'bed'}),disposeGroup:()=>{},threeViewUnit:()=>.022,
  parcelViewportBounds:()=>viewport,planViewBounds:()=>viewport,parcelViewBounds:()=>parcel,
  gardenViewProfileForElement:()=>({id:'plant'}),gardenInformationContext:()=>({}),
  addPropertyGround3d:()=>{},addVegetationCover3d:(_g,_s,_u,p,b)=>calls.push({kind:'trees',p,b}),
  addGardenStructures3d:(_g,_s,_u,p,b)=>calls.push({kind:'buildings',p,b}),
  detailVisibleFeatures:()=>[],mapVisibleBeds:()=>[],syncThreeCamera:()=>{},updateThreeModelStatus:()=>{},syncThreeSolar:()=>{}
 };
 const sync=new Function(...Object.keys(dependencies),extract('syncThreeScene','syncThreeSolar')+';return syncThreeScene;')(...Object.values(dependencies));
 const three={controls:{snap(){}},group:{clear(){}},renderer:{domElement:{dataset:{}}}};
 const state={viewMode:'garden',mapSettings:{showVegetation:true,showStructures:true}};
 sync(three,state);
 state.walkCamera={x:2000,y:3000};sync(three,state);
 assert.equal(calls.length,4);
 for(const call of calls){assert.equal(call.b,parcel);assert.equal(call.p.id,'garden');}
});

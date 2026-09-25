import assert from "node:assert/strict";
import test from "node:test";
import {defaultBedViewport,normalizeBedCamera,normalizeBedCameras,zoomBedCamera} from "../src/lib/spatial/bedCamera.js";
const bed={id:"one",width:96,height:48};
test("bed cameras zoom around a chosen anchor without mutating geometry",()=>{
 const original=structuredClone(bed),camera=normalizeBedCamera(bed);
 const next=zoomBedCamera(bed,camera,.5,{x:12,y:24});
 assert.equal(next.viewport.width,camera.viewport.width/2);
 assert.equal((12-next.viewport.x)/next.viewport.width,(12-camera.viewport.x)/camera.viewport.width);
 assert.deepEqual(bed,original);assert.deepEqual(camera.viewport,defaultBedViewport(bed));
});
test("separate bed views normalize and discard orphan cameras",()=>{
 const saved={one:{viewport:{x:5,y:10,width:50,height:25},bearing:370,pitch:55},two:{bearing:80},deleted:{}};
 const cameras=normalizeBedCameras([bed,{id:"two",width:48,height:48}],saved);
 assert.equal(cameras.one.bearing,10);assert.equal(cameras.two.bearing,80);assert.ok(!cameras.deleted);
 cameras.one.viewport.x=30;assert.equal(saved.one.viewport.x,5);
});
test("invalid views reset and extreme zoom stays bounded",()=>{
 assert.deepEqual(normalizeBedCamera(bed,{viewport:{x:NaN}}).viewport,defaultBedViewport(bed));
 assert.ok(zoomBedCamera(bed,{},.000001).viewport.height>=3);
 assert.ok(zoomBedCamera(bed,{},1e6).viewport.width<=defaultBedViewport(bed).width*8);
});
test('off-bed saved cameras recover without changing valid views or garden geometry',()=>{
 const original=structuredClone(bed);
 for(const viewport of [{x:500,y:500,width:3,height:3},{x:-200,y:0,width:50,height:25},{x:0,y:100,width:50,height:25}])assert.deepEqual(normalizeBedCamera(bed,{viewport}).viewport,defaultBedViewport(bed));
 const viewport={x:5,y:10,width:50,height:25};assert.deepEqual(normalizeBedCamera(bed,{viewport}).viewport,viewport);assert.deepEqual(bed,original);
});

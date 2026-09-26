import test from 'node:test';
import assert from 'node:assert/strict';
import {estimateBedDaylight,bedLightSamplePoints} from '../src/lib/spatial/solarExposure.js';
const bed={id:'bed',name:'Kitchen',x:0,y:0,width:48,height:96,rotation:0};
const state={beds:[bed],vegetation:[],structures:[]};
test('seasonal unblocked daylight is longer in summer; unknown obstructions are never counted as shade',()=>{
 const summer=estimateBedDaylight(state,'2026-06-21',42.36,-71.07),winter=estimateBedDaylight(state,'2026-12-21',42.36,-71.07);
 assert.ok(summer.daylightHours>14&&summer.daylightHours<16);assert.ok(winter.daylightHours>8&&winter.daylightHours<10);assert.ok(summer.beds[0].sunHours>winter.beds[0].sunHours+4);assert.equal(summer.beds[0].shadeHours,0);assert.ok(summer.lowSunHours>0);
 const unknown=estimateBedDaylight({...state,vegetation:[{id:'tree',x:0,y:0,width:100,height:100}]},'2026-06-21',42.36,-71.07);assert.equal(unknown.omittedObstructions,1);assert.equal(unknown.modeledObstructions,0);assert.equal(unknown.beds[0].sunHours,summer.beds[0].sunHours);
});
test('opaque crown coverage yields bounded shade and overlapping shadows are not double counted',()=>{
 const tree={id:'tree',x:0,y:0,width:500,height:500,heightEstimateFeet:30};const input={...state,vegetation:[tree]},before=JSON.stringify(input);
 const value=estimateBedDaylight(input,'2026-06-21',42.36,-71.07),duplicate=estimateBedDaylight({...input,vegetation:[tree,{...tree,id:'second'}]},'2026-06-21',42.36,-71.07);
 assert.equal(value.beds[0].sunHours,0);assert.equal(value.beds[0].shadeHours,value.modeledHours);assert.deepEqual(value.beds,duplicate.beds);assert.equal(JSON.stringify(input),before);
});
test('sampling follows bed rotation and skips samples outside irregular boundaries',()=>{
 const points=bedLightSamplePoints({...bed,rotation:90});assert.equal(points.length,9);assert.ok(Math.abs(points[0][0]-32)<1e-9);assert.ok(Math.abs(points[0][1]+16)<1e-9);
 assert.equal(bedLightSamplePoints({...bed,polygon:[[200,200],[300,200],[300,300]]}).length,0);
 assert.throws(()=>estimateBedDaylight(state,'2026-02-30',42,-71));assert.throws(()=>estimateBedDaylight(state,'2026-06-21',0,0));assert.throws(()=>estimateBedDaylight({...state,beds:Array(201).fill(bed)},'2026-06-21',42,-71));
});

import {sunlightScenario} from '../src/lib/spatial/solarExposure.js';
import {bedShadowPolygons} from '../src/lib/spatial/solarScene.js';
test('illustrative heights are explicit, preserve entered heights, and never mutate the garden',()=>{
 const original={vegetation:[{id:'a',kind:'tree'},{id:'b',kind:'shrub',heightEstimateFeet:8}],structures:[{id:'house',type:'house'},{id:'path',type:'path'}]},before=JSON.stringify(original);
 assert.equal(sunlightScenario(original).assumedHeights,0);
 const scenario=sunlightScenario(original,true);assert.equal(scenario.assumedHeights,2);assert.equal(scenario.vegetation[0].heightEstimateFeet,20);assert.equal(scenario.vegetation[1].heightEstimateFeet,8);assert.equal(scenario.structures[0].heightEstimateFeet,12);assert.equal(scenario.structures[1].heightEstimateFeet,undefined);assert.equal(JSON.stringify(original),before);
});
test('site shade transforms into the rotated bed frame and clips at its edges',()=>{
 const preview={trees:[{shadow:{points:[[-100,-100],[100,-100],[100,100],[-100,100]]}}]},polygons=bedShadowPolygons(preview,{...bed,rotation:35});assert.ok(polygons.length);
 for(const ring of polygons)for(const [x,y]of ring){assert.ok(x>=-24-1e-9&&x<=24+1e-9);assert.ok(y>=-48-1e-9&&y<=48+1e-9);}
 assert.deepEqual(bedShadowPolygons(preview,{...bed,x:1000,y:1000}),[]);
});

import test from 'node:test';import assert from 'node:assert/strict';
import {firstPlanDimensions,firstPlanPositions} from '../src/lib/garden/firstPlan.js';
test('first plan uses reviewed dimensions and rejects malformed input',()=>{assert.deepEqual(firstPlanDimensions(8,4),{width:96,height:48});for(const n of [0,51,NaN,Infinity])assert.throws(()=>firstPlanDimensions(n,4));});
test('mixed starter arrangement fits inside the bed with conservative separation',()=>{
 const bed={width:96,height:48,safeMargin:6},plants=[{id:'tomato',name:'Tomato',spacing:30,matureDiameter:28},{id:'lettuce',name:'Lettuce',spacing:12,matureDiameter:12},{id:'carrot',name:'Carrot',spacing:4,matureDiameter:4}],before=JSON.stringify([bed,plants]);const points=firstPlanPositions(bed,plants);assert.equal(points.length,3);assert.equal(JSON.stringify([bed,plants]),before);
 for(const a of points){const radius=Math.max(plants.find(p=>p.id===a.plantId).spacing,plants.find(p=>p.id===a.plantId).matureDiameter)/2;assert.ok(a.x>=radius+6&&a.y>=radius+6&&a.x<=90-radius&&a.y<=42-radius);for(const b of points.filter(b=>b!==a)){const other=plants.find(p=>p.id===b.plantId);assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>=radius+Math.max(other.spacing,other.matureDiameter)/2);}}
 assert.throws(()=>firstPlanPositions({width:12,height:12,safeMargin:6},plants),/does not fit/);assert.throws(()=>firstPlanPositions(bed,[]),/Choose/);
});

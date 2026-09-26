import test from 'node:test';
import assert from 'node:assert/strict';
import {plannedSize} from '../src/lib/garden/plannedSize.js';
import {plantingSchedule} from '../src/lib/garden/plantingSchedule.js';
const scenario={plantId:'tomato',startDate:'2026-06-01',fullSizeDate:'2026-07-01',startPercent:20,reference:'Gardener sketch'};
const p={plantId:'tomato',sizeScenario:scenario};
test('explicit size dates interpolate dimensions and clamp both endpoints',()=>{
 assert.equal(plannedSize(p,'2026-05-01').scale,.2);
 assert.equal(plannedSize(p,'2026-06-01').scale,.2);
 assert.equal(plannedSize(p,'2026-06-16').scale,.6);
 assert.equal(plannedSize(p,'2026-07-01').scale,1);
 assert.equal(plannedSize(p,'2026-09-01').scale,1);
 assert.equal(plannedSize(p).scale,1);
 assert.equal(plannedSize({}).status,'missing');
 const leap={...p,sizeScenario:{...scenario,startDate:'2024-02-28',fullSizeDate:'2024-03-01'}};
 assert.equal(plannedSize(leap,'2024-02-29').scale,.6);
});
test('invalid or mismatched scenarios keep mature dimensions and preserve original record',()=>{
 for(const changes of [{plantId:'carrot'},{startDate:'2026-02-30'},{fullSizeDate:'2026-06-01'},{startPercent:0},{startPercent:101},{startPercent:'20'},{reference:''},{reference:'x'.repeat(301)}]){
  const value={...p,sizeScenario:{...scenario,...changes}},before=structuredClone(value);
  assert.deepEqual(plannedSize(value,'2026-06-16'),{status:'invalid',scale:1});assert.deepEqual(value,before);
 }
});
test('different size assumptions do not merge into a single schedule row',()=>{
 const rows=plantingSchedule([p,{...p,sizeScenario:{...scenario,startPercent:40}}],2026,'2026-06-16');
 assert.equal(rows.length,2);
});

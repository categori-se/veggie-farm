import test from 'node:test';import assert from 'node:assert/strict';
import {gardenAttention} from '../src/lib/garden/gardenAttention.js';
const p={id:'tomato-1',plantId:'tomato',bedId:'south',planted:'2027-05-20',plannedUntil:'2027-09-30'};
const garden=placements=>({id:'personal',beds:[{id:'south',name:'South bed'}],placements});
const event=(type,date,extra={})=>({plantingId:p.id,plantId:p.plantId,type,date,...extra});
test('planned starts route to exact planting without turning dates into actual events',()=>{
 const workspace=garden([p,{...p,id:'later',planted:'2027-06-20'}]);const before=structuredClone(workspace);
 const tasks=gardenAttention(workspace,'2027-05-18');assert.equal(tasks.length,1);assert.equal(tasks[0].kind,'start');assert.equal(tasks[0].plantingId,p.id);assert.equal(tasks[0].bedId,'south');assert.equal(tasks[0].observationType,'');assert.deepEqual(workspace,before);
 assert.equal(gardenAttention(garden([{...p,observations:[event('transplanted','2027-05-20')]}]),'2027-05-21').length,0);
});
test('harvest prompts require an explicitly valid estimate and preserve its reference',()=>{
 const harvestEstimate={startDate:'2027-05-20',minimumDays:50,maximumDays:60,basis:'transplanting',reference:'My packet'};
 const plant={...p,harvestEstimate,observations:[event('transplanted','2027-05-20')]};
 const task=gardenAttention(garden([plant]),'2027-07-10');assert.equal(task.length,1);assert.equal(task[0].kind,'harvest');assert.equal(task[0].observationType,'harvested');assert.match(task[0].explanation,/My packet/);
 const invalid={...plant,harvestEstimate:{...harvestEstimate,reference:''}};assert.ok(!gardenAttention(garden([invalid]),'2027-07-10').some(t=>t.kind==='harvest'));
});
test('observation reminders ignore foreign, future and changed-crop events',()=>{
 const observations=[event('transplanted','2027-05-20'),event('watering','2027-06-09',{plantingId:'another'}),event('watering','2027-06-09',{plantId:'lettuce'}),event('watering','2028-01-01'),null];
 const tasks=gardenAttention(garden([{...p,observations}]),'2027-06-10');assert.equal(tasks.length,1);assert.equal(tasks[0].kind,'record');assert.match(tasks[0].explanation,/21 days ago/);
 observations.push(event('watering','2027-06-10'));assert.equal(gardenAttention(garden([{...p,observations}]),'2027-06-10').length,0);
});
test('planned endings never assert that space is free; actual finish suppresses prompts',()=>{
 const ws=garden([{...p,observations:[event('transplanted','2027-05-20')]}]);
 assert.equal(gardenAttention(ws,'2027-09-26')[0].kind,'end');
 const later=gardenAttention(ws,'2027-10-01');assert.equal(later.length,1);assert.equal(later[0].kind,'finish');assert.match(later[0].explanation,/does not mean the bed is empty/);
 ws.placements[0].observations.push(event('ended','2027-09-29'));assert.deepEqual(gardenAttention(ws,'2027-10-01'),[]);
});
test('unknown dates stay unknown, invalid plans get review and reminders respect calendar boundaries',()=>{
 assert.deepEqual(gardenAttention(garden([{...p,planted:'',plannedUntil:''}]),'2027-06-01'),[]);
 assert.equal(gardenAttention(garden([{...p,plannedUntil:'2027-02-30'}]),'2027-06-01')[0].kind,'dates');
 assert.equal(gardenAttention(garden([{...p,planted:'2028-01-02',plannedUntil:''}]),'2027-12-29')[0].kind,'start');
 assert.throws(()=>gardenAttention(garden([]),'2027-02-30'));
 assert.deepEqual(gardenAttention(garden([]),'2027-06-01'),[]);
});

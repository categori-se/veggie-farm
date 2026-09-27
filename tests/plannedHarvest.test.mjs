import test from 'node:test';
import assert from 'node:assert/strict';
import {plannedHarvest, harvestBand} from '../src/lib/garden/plannedHarvest.js';
const estimate={startDate:'2024-02-28',basis:'sowing',minimumDays:1,maximumDays:3,reference:'Example cultivar packet'};
test('independent sowing clock crosses leap day with inclusive inspection endpoints',()=>{
 const p={planted:'2024-03-10',plannedUntil:'2024-03-20',health:'starting',harvestEstimate:estimate};
 const before=JSON.stringify(p);assert.equal(plannedHarvest(p,'2024-02-28').status,'before');
 for(const date of ['2024-02-29','2024-03-01','2024-03-02'])assert.equal(plannedHarvest(p,date).status,'check');
 assert.equal(plannedHarvest(p,'2024-03-03').status,'past');assert.equal(plannedHarvest(p).status,'estimated');
 assert.deepEqual(plannedHarvest(p).window,{earliest:'2024-02-29',latest:'2024-03-02'});assert.equal(JSON.stringify(p),before);
});
test('missing, invalid and partial estimates never become predicted dates',()=>{
 assert.equal(plannedHarvest({planted:'2026-05-01'}).status,'missing');
 for(const patch of [{startDate:'2024-02-30'},{basis:'planting'},{minimumDays:0},{minimumDays:'1'},{minimumDays:1.5},{minimumDays:null},{maximumDays:731},{maximumDays:0},{reference:''},{reference:' '.repeat(3)},{reference:'a'.repeat(301)},{startDate:'9999-12-31'}])assert.equal(plannedHarvest({harvestEstimate:{...estimate,...patch}}).window,null,JSON.stringify(patch));
});
test('check windows clip to year and do not disappear at an entered bed-clear date',()=>{
 const p={planted:'2026-12-01',plannedUntil:'2026-12-03',harvestEstimate:{...estimate,startDate:'2026-12-28',minimumDays:2,maximumDays:5}};
 const result=plannedHarvest(p,'2027-01-01');assert.equal(result.status,'check');
 assert.equal(harvestBand(result,2026).date,'2026-12-30');assert.equal(harvestBand(result,2027).date,'2027-01-01');assert.equal(harvestBand(result,2028),null);
 assert.ok(harvestBand(result,2026).width>0);assert.equal(harvestBand(result,NaN),null);
});

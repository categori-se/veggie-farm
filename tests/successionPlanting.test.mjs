import test from 'node:test';import assert from 'node:assert/strict';
import {successionPlanting,plannedOccupanciesOverlap,nextPlantingDate} from '../src/lib/garden/successionPlanting.js';
const bed={id:'b',width:48,height:96,safeMargin:2},plants=[{id:'lettuce',spacing:12,matureDiameter:12},{id:'tomato',spacing:30,matureDiameter:28}],source={id:'spring',bedId:'b',plantId:'lettuce',x:24,y:24,rotation:.4,planted:'2027-03-01',plannedUntil:'2027-04-30',health:'harvested',notes:'Slugs',observations:[{quantity:4}],sizeScenario:{startPercent:20},harvestEstimate:{days:35}};
const args={source,bed,plants,placements:[source],id:'summer',plantId:'tomato',start:'2027-05-01',end:'2027-09-01'};
test('next crop reuses free space with a separate identity and no copied history',()=>{
 const before=structuredClone(args),next=successionPlanting(args);assert.equal(next.x,24);assert.equal(next.y,24);assert.equal(next.plantId,'tomato');assert.equal(next.afterPlantingId,'spring');assert.equal(next.planted,'2027-05-01');assert.equal(next.planYear,2027);assert.equal(next.health,'planned');assert.equal(next.notes,'');for(const key of ['observations','sizeScenario','harvestEstimate'])assert.equal(next[key],undefined);assert.deepEqual(args,before);
 assert.equal(nextPlantingDate({plannedUntil:'2028-02-28'}),'2028-02-29');assert.equal(nextPlantingDate({plannedUntil:'2027-12-31'}),'2028-01-01');
});
test('concurrent or unknown occupants block space; separated dates release it',()=>{
 const blocker={...source,id:'other',plantId:'tomato',plannedUntil:'',planted:''};
 assert.throws(()=>successionPlanting({...args,bed:{...bed,height:48},placements:[source,blocker]}),/No clear space/);
 assert.ok(successionPlanting({...args,bed:{...bed,height:48},placements:[source,{...blocker,planted:'2028-01-01'}]}));
 assert.equal(plannedOccupanciesOverlap(source,{planted:'2027-04-30'}),true);
 assert.equal(plannedOccupanciesOverlap(source,{planted:'2027-05-01'}),false);
 assert.equal(plannedOccupanciesOverlap(source,{planted:'bad'}),true);
 assert.equal(plannedOccupanciesOverlap(source,{planted:'2027-06-01',plannedUntil:'2027-01-01'}),true);
});
test('invalid dates, unknown plants and reused IDs fail without mutation',()=>{
 const before=structuredClone(args);for(const patch of [{start:'2027-04-30'},{end:'2027-04-30'},{end:'bad'},{plantId:'unknown'},{id:'spring'},{source:{...source,plannedUntil:''}},{source:{...source,planted:'2028-01-01'}}])assert.throws(()=>successionPlanting({...args,...patch}));assert.deepEqual(args,before);
});

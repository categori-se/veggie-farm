import test from 'node:test';
import assert from 'node:assert/strict';
import {plantingSchedule} from '../src/lib/garden/plantingSchedule.js';
test('schedule groups identical bounds within beds without changing placements',()=>{
 const a={bedId:'a',plantId:'pea',planted:'2026-03-01',plannedUntil:'2026-05-01'};
 const placements=[a,{...a},{...a,bedId:'b'},{...a,planted:'2026-08-01',plannedUntil:'2026-09-01'}];
 const before=JSON.stringify(placements),rows=plantingSchedule(placements,2026);
 assert.equal(rows.length,3);assert.equal(rows[0].count,2);assert.equal(rows[0].band.date,'2026-03-01');assert.equal(JSON.stringify(placements),before);
});
test('schedule clips cross-year bounds, includes leap day and retains unplottable dates',()=>{
 const rows=plantingSchedule([
 {plantId:'all',planted:'2023-01-01',plannedUntil:'2025-01-01'},
 {plantId:'leap',planted:'2024-02-29',plannedUntil:'2024-02-29'},
 {plantId:'open',planted:'2024-06-01'},
 {plantId:'past',plannedUntil:'2023-12-31'},
 {plantId:'invalid',planted:'2024-07-01',plannedUntil:'2024-05-01'},
 {plantId:'undated'}],2024);
 const by=id=>rows.find(r=>r.plantId===id);
 assert.equal(by('all').band.width,100);assert.equal(by('all').band.date,'2024-01-01');
 assert.equal(by('leap').band.width,100/366);assert.equal(by('open').band.open,true);
 for(const id of ['past','invalid','undated'])assert.equal(by(id).band,null);
 assert.equal(by('invalid').status,'invalid');assert.equal(by('undated').status,'undated');
 assert.deepEqual(plantingSchedule([],NaN),[]);
});

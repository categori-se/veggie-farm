import test from 'node:test';
import assert from 'node:assert/strict';
import {sunDecision, harvestWindow, diseaseDecision} from '../src/lib/recommendations/gardenDecisions.js';
import {compareSeasonWeather} from '../src/lib/environment/seasonWeather.js';
test('sunlight boundaries distinguish unknown, low light, partial shade and sunny beds',()=>{
 for(const v of ['',null,undefined,NaN,-1,17])assert.equal(sunDecision(v).label,'Measure first');
 assert.equal(sunDecision(2.5).plants.length,0);
 assert.ok(sunDecision(3).plants.includes('Kale'));
 assert.ok(!sunDecision(5.5).plants.includes('Tomatoes'));
 assert.ok(sunDecision(6).plants.includes('Tomatoes'));
});
test('harvest arithmetic preserves dates across leap years and flags frost overlap',()=>{
 assert.deepEqual(harvestWindow({startDate:'2024-02-28',minimumDays:1,maximumDays:2,firstFrost:'2024-03-01'}),{earliest:'2024-02-29',latest:'2024-03-01',frostOverlap:true});
 assert.equal(harvestWindow({startDate:'2026-12-31',minimumDays:1,maximumDays:2}).earliest,'2027-01-01');
 for(const input of [{startDate:'2026-02-30',minimumDays:1,maximumDays:2},{startDate:'2026-01-01',minimumDays:'',maximumDays:2},{startDate:'2026-01-01',minimumDays:20,maximumDays:2},{startDate:'2026-01-01',minimumDays:1,maximumDays:3,firstFrost:'not a date'}])assert.ok(harvestWindow(input).error);
});
test('disease cues suggest observation without declaring a healthy plant or a diagnosis',()=>{
 assert.match(diseaseDecision().actions.join(' '),/does not establish/);
 assert.match(diseaseDecision({wet:true,symptoms:true}).actions.join(' '),/identification/);
 assert.match(diseaseDecision().note,/dry leaf/);
});
test('weather compares only matching valid days and preserves missing data',()=>{
 const days=[2023,2024,2025,2026].flatMap(year=>[{date:`${year}-04-01`,low:year===2026?40:30,high:year===2026?60:50},{date:`${year}-04-02`,low:year===2025?null:20,high:40}]);
 const d=compareSeasonWeather({days},2026,4);
 assert.equal(d.difference,10);assert.equal(d.matchedDays,1);assert.equal(d.observedDays,2);assert.equal(d.freezeDays,1);assert.equal(d.rows[1].baseline,null);assert.equal(d.rows[2].current,null);
 assert.equal(compareSeasonWeather({days:[]},2026,4).difference,null);
 assert.ok(compareSeasonWeather({days},2025,4).error);
});
test('leap days cannot silently match non-leap years; inverted ranges are missing',()=>{
 const d=compareSeasonWeather({days:[{date:'2024-02-29',low:20,high:40},{date:'2024-02-28',low:50,high:40}]},2024,2,[2021,2022,2023]);
 assert.equal(d.totalDays,29);assert.equal(d.observedDays,1);assert.equal(d.matchedDays,0);
});

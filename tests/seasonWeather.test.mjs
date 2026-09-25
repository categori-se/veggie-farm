import test from 'node:test';
import assert from 'node:assert/strict';
import {compareSeasonWeather} from '../src/lib/environment/seasonWeather.js';
test('normal departures compare the same statistic; missing rain breaks accumulation',()=>{
 const station={days:[{date:'2026-04-01',low:40,high:60,rain:0,rainTrace:true},{date:'2026-04-02',low:42,high:64,rain:null},{date:'2026-04-03',low:null,high:60,rain:0.4}],normals:[{monthDay:'04-01',low:30,high:50},{monthDay:'04-02',low:35,high:55}]};
 const d=compareSeasonWeather(station,2026,4);
 assert.equal(d.rows[0].departure,10);assert.equal(d.rows[1].departure,8);
 assert.equal(d.rows[0].rainAccumulated,0);assert.equal(d.rows[0].rainTrace,true);
 assert.equal(d.rows[1].rainAccumulated,null);assert.equal(d.rows[2].rainAccumulated,null);
 assert.equal(d.rainObservedTotal,0.4);assert.equal(d.rainDays,2);assert.equal(d.normalDays,2);
 assert.equal(d.rows[2].departure,null);
});
test('rain can be observed without valid temperature; unavailable normals stay missing',()=>{
 const d=compareSeasonWeather({days:[{date:'2026-09-01',low:null,high:null,rain:1.2}]},2026,9);
 assert.equal(d.observedDays,0);assert.equal(d.rainDays,1);assert.equal(d.rows[0].normal,null);assert.equal(d.rows[0].rainAccumulated,1.2);
});

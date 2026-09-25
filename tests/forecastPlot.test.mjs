import test from 'node:test';import assert from 'node:assert/strict';
import {forecastPlot} from '../src/lib/environment/forecastPlot.js';
const row=(hour,value)=>({startTime:new Date(Date.UTC(2026,8,25,hour)).toISOString(),temperatureF:value});
test('missing hourly readings break forecast lines without becoming zero',()=>{
 const p=forecastPlot([row(0,45),row(1,null),row(2,50),row(3,52)]);
 assert.equal(p.coverage,3);assert.equal(p.total,4);assert.deepEqual(p.segments.map(s=>s.length),[1,2]);
 assert.ok(Number.isFinite(p.freezeY));
});
test('time gaps break a line even if both endpoints have temperatures',()=>{
 const p=forecastPlot([row(0,40),row(3,45)]);assert.deepEqual(p.segments.map(s=>s.length),[1,1]);
});
test('missing temperatures produce no curve and no invented range',()=>{
 const p=forecastPlot([row(0,null),row(1,undefined)]);assert.equal(p.coverage,0);assert.deepEqual(p.segments,[]);assert.equal(p.low,undefined);
});

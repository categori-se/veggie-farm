import test from 'node:test';
import assert from 'node:assert/strict';
import {seasonForDate,seasonRoutes} from '../src/lib/garden/seasonContext.js';
test('Massachusetts calendar topics follow season boundaries, not frost eligibility',()=>{
 for(const [day,expected] of [['2026-02-28','winter'],['2026-03-01','spring'],['2026-05-31','spring'],['2026-06-01','summer'],['2026-08-31','summer'],['2026-09-01','autumn'],['2026-11-30','autumn'],['2026-12-01','winter']])assert.equal(seasonForDate(day),expected);
 assert.throws(()=>seasonForDate('2026-13-01'));
 assert.equal(seasonRoutes.autumn.href,'/seasons/autumn');
 for(const value of Object.values(seasonRoutes))assert.equal(value.tasks.length,4);
});

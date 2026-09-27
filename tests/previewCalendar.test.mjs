import test from 'node:test';import assert from 'node:assert/strict';
import {previewCalendarDate} from '../src/lib/garden/previewCalendar.js';
test('preview navigation clamps calendar days across years and months',()=>{
 assert.equal(previewCalendarDate('2028-02-29',{year:2027}),'2027-02-28');
 assert.equal(previewCalendarDate('2028-01-31',{month:2}),'2028-02-29');
 assert.equal(previewCalendarDate('2027-01-31',{month:4}),'2027-04-30');
 assert.equal(previewCalendarDate('2027-06-15',{year:2026}),'2026-06-15');
 for(const d of ['','2027-02-29','bad'])assert.equal(previewCalendarDate(d,{year:2028}),null);
 for(const year of [1899,2201,NaN,2027.5])assert.equal(previewCalendarDate('2027-06-15',{year}),null);
});

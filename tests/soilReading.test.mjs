import test from 'node:test';import assert from 'node:assert/strict';
import {soilReadingContext,measurementDate} from '../src/lib/garden/soilReading.js';
import {normalizeGardenProfile} from '../src/lib/garden/localGardenStore.js';
test('measurement dates survive profile normalization without inventing legacy dates',()=>{
 assert.equal(normalizeGardenProfile({soilTemperatureF:60,updatedAt:'2026-05-02T12:00:00Z'}).soilTemperatureMeasuredOn,null);
 assert.equal(normalizeGardenProfile({soilTemperatureF:60,soilTemperatureMeasuredOn:'2026-05-01'}).soilTemperatureMeasuredOn,'2026-05-01');
 assert.equal(normalizeGardenProfile({soilTemperatureF:'',soilTemperatureMeasuredOn:'2026-05-01'}).soilTemperatureMeasuredOn,null);
 assert.equal(measurementDate('2026-02-30'),null);
});
test('soil observations distinguish today, older, future, undated and missing',()=>{
 const read=date=>soilReadingContext({soilTemperatureF:60,soilTemperatureMeasuredOn:date},'2026-05-02');
 assert.equal(read('2026-05-02').status,'today');assert.equal(read('2026-05-01').status,'older');assert.equal(read('2026-05-03').status,'future');assert.equal(read(null).status,'undated');assert.equal(soilReadingContext({},'2026-05-02').status,'missing');
});

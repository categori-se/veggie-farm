import test from 'node:test';import assert from 'node:assert/strict';
import {sunMatch} from '../src/lib/recommendations/sunMatch.js';
import {plantingWindow} from '../src/lib/recommendations/plantingWindow.js';
const plant={name:'Tomato',sun:'full sun',season:'warm-season',idealSoilTemperatureF:{min:65}};
const summer={date:'2026-06-15',lastFrostDate:'2026-05-15',firstFrostDate:'2026-10-15'};
test('missing and invalid sunlight do not become eight hours; zero remains an observation',()=>{
 for(const sunHours of [null,undefined,'',' ',NaN,'unknown',25,-1])assert.equal(sunMatch(plant,{sunHours}).label,'unknown');
 assert.equal(sunMatch(plant,{sunHours:0}).label,'weak');assert.equal(sunMatch(plant,{sunHours:8}).label,'good');
});
test('missing temperature requests conditions while known frost constraints remain visible',()=>{
 for(const soilTemperatureF of [undefined,null,'',' ',NaN,'warm',200])assert.equal(plantingWindow(plant,{}, {...summer,soilTemperatureF}).status,'check_conditions');
 assert.equal(plantingWindow(plant,{}, {...summer,soilTemperatureF:60}).status,'wait');
 assert.equal(plantingWindow(plant,{}, {...summer,soilTemperatureF:70}).status,'plant_now');
 assert.equal(plantingWindow(plant,{}, {...summer,date:'2026-04-15'}).status,'wait');
});

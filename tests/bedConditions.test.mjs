import test from 'node:test';import assert from 'node:assert/strict';
import {saveBedConditions} from '../src/lib/garden/bedConditions.js';
import {savedGardenConditions} from '../src/lib/garden/savedGardenConditions.js';
import {accountGardenPayload} from '../src/lib/garden/accountGardens.js';
const date='2026-09-27',garden={id:'g',name:'Garden',beds:[{id:'b',name:'South'},{id:'other',name:'North'}],property:{gardenContext:{soilTemperatureF:80,soilTemperatureMeasuredOn:date,climate:{lastFrostMonthDay:'05-10',firstFrostMonthDay:'10-15'}}},placements:[]};
test('bed conditions preserve identities and unrelated data, reject invalid input, and keep blank values unknown',()=>{
 const next=saveBedConditions(garden,'b',{sunHours:'0',soilTemperatureF:'62',soilTemperatureMeasuredOn:date,drainage:'slow',texture:'loam'});
 assert.equal(garden.property.bedConditions,undefined);assert.deepEqual(next.beds,garden.beds);assert.deepEqual(next.property.gardenContext,garden.property.gardenContext);
 assert.equal(next.property.bedConditions.b.sunHours,0);
 const empty=saveBedConditions(next,'b',{});assert.equal(empty.property.bedConditions.b.soilTemperatureF,null);
 for(const [id,input]of [['missing',{}],['b',{sunHours:25}],['b',{soilTemperatureF:'oops'}],['b',{soilTemperatureMeasuredOn:'2026-02-30'}],['b',{drainage:'invented'}]])assert.throws(()=>saveBedConditions(garden,id,input));
});
test('Today never borrows a garden or sibling-bed measurement for the selected bed',()=>{
 const workspace=saveBedConditions(garden,'b',{sunHours:5,soilTemperatureF:62,soilTemperatureMeasuredOn:date});
 const r=savedGardenConditions({workspace},null,date,'b');assert.equal(r.soilTemperatureF,62);assert.equal(r.bedName,'South');assert.equal(r.sunHours,5);assert.equal(r.lastFrostDate,'2026-05-10');
 for(const id of ['other','deleted'])assert.equal(savedGardenConditions({workspace},null,date,id).soilTemperatureF,null);
 assert.equal(savedGardenConditions({workspace},null,'2026-09-28','b').soilTemperatureF,null);
 assert.equal(savedGardenConditions({workspace},null,date).soilTemperatureF,80);
 const payload=accountGardenPayload({...workspace,activeParcelId:'g',parcels:[workspace],plants:[],layouts:[]});assert.deepEqual(payload.parcels[0].property.bedConditions,workspace.property.bedConditions);
});

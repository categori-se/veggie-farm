import test from 'node:test';import assert from 'node:assert/strict';
import {recordPlantingObservation,plantingOutcome,gardenJourney} from '../src/lib/garden/plantingJournal.js';
const p={id:'p',plantId:'cherokee-purple',bedId:'b',planted:'2027-05-20',plannedUntil:'2027-09-30'};
test('logging actual transplant preserves plan and planting identity',()=>{const result=recordPlantingObservation(p,{type:'transplanted',date:'2027-05-27'});assert.equal(result.planted,p.planted);assert.equal(result.plantId,p.plantId);assert.equal(result.observations[0].plantingId,p.id);assert.equal(p.observations,undefined);assert.equal(plantingOutcome(result,2027).actualTransplant,'2027-05-27');});
test('harvest totals convert only weight units and retain counts and missing quantities separately',()=>{let value=p;for(const [quantity,unit] of [[1,'lb'],[16,'oz'],[3,'count'],['','kg']])value=recordPlantingObservation(value,{type:'harvested',date:'2027-08-01',quantity,unit,quality:'good'});const out=plantingOutcome(value,2027);assert.equal(out.grams,907.18474);assert.equal(out.count,3);assert.equal(out.unmeasuredHarvests,1);assert.equal(plantingOutcome(value,2026).grams,null);});
test('invalid events cannot write or mutate a planting',()=>{for(const input of [{type:'note',date:'2027-02-30',notes:'x'},{type:'note',date:'2027-05-01'},{type:'harvested',date:'2027-05-01',quantity:-2,unit:'kg'},{type:'harvested',date:'2027-05-01',quantity:1.5,unit:'count'}])assert.throws(()=>recordPlantingObservation(p,input));assert.equal(p.observations,undefined);});
test('garden projection isolates workspaces and ignores events for another planting',()=>{const planting={...p,observations:[{plantingId:'another',date:'2027-06-01',type:'harvested'}]};const a=gardenJourney({id:'a',beds:[{id:'b',name:'South'}],placements:[planting]},2027);assert.equal(a.events.length,0);assert.equal(a.gardenId,'a');assert.equal(gardenJourney({id:'other',beds:[],placements:[]},2027).plantings.length,0);});
import {parsePlannerBackup} from '../src/lib/garden/plannerBackup.js';
import {accountGardenPayload,mergeAccountGardens} from '../src/lib/garden/accountGardens.js';
test('journal survives planner backup parsing and personal-account projection without publishing demo history',()=>{
 const placement=recordPlantingObservation(p,{type:'harvested',date:'2027-08-01',quantity:2,unit:'lb'});
 const make=(id)=>({id,name:id,property:{id},beds:[{id:'b'}],structures:[],vegetation:[],placements:[placement]});
 const personal=make('personal'),demo=make('berkshire-botanical-garden');
 const backup={...personal,activeParcelId:'personal',plants:[{id:p.plantId}],parcels:[personal,demo],layouts:[]};
 const parsed=parsePlannerBackup(JSON.stringify(backup));const projected=accountGardenPayload(parsed);
 assert.equal(projected.parcels.length,1);assert.equal(projected.placements[0].observations[0].quantity,2);
 const merged=mergeAccountGardens(backup,projected);assert.equal(merged.parcels.find(g=>g.id==='personal').placements[0].observations[0].plantingId,'p');assert.equal(merged.parcels.find(g=>g.id===demo.id).placements[0].observations.length,1);
});
test('historical event keeps its recorded crop identity if the current placement is renamed',()=>{const recorded=recordPlantingObservation(p,{type:'watering',date:'2027-06-01'});const changed={...recorded,plantId:'different-crop'};const result=gardenJourney({id:'garden',beds:[{id:'b'}],placements:[changed]},2027);assert.equal(result.events[0].plantId,'cherokee-purple');});

import test from 'node:test';import assert from 'node:assert/strict';
import {accountGardenForPlanning} from '../src/lib/garden/accountGardenForPlanning.js';
import {gardenPlanHref,readGardenHandoff} from '../src/lib/garden/gardenHandoff.js';
const garden=id=>({id,name:id,property:{id},beds:[{id:id+'-bed'}],structures:[],vegetation:[],placements:[],activeBedId:id+'-bed'});
const a=garden('a'),b=garden('b'),payload={...a,activeParcelId:'a',parcels:[a,b],plants:[],layouts:[]};
test('planning handoff activates exact workspace without mutating saved data',()=>{const before=structuredClone(payload),next=accountGardenForPlanning(payload,'b');assert.equal(next.activeParcelId,'b');assert.deepEqual(next.beds,b.beds);assert.deepEqual(next.property,b.property);assert.equal(next.activeBedId,'b-bed');assert.deepEqual(payload,before);assert.equal(next.parcels.length,2);});
test('missing or public demo gardens cannot be opened as personal account gardens',()=>{assert.throws(()=>accountGardenForPlanning(payload,'missing'),{code:'missing_linked_garden'});const demo=garden('berkshire-botanical-garden');assert.throws(()=>accountGardenForPlanning({...payload,parcels:[a,demo]},demo.id),{code:'missing_linked_garden'});});
test('plan link retains selection in fragment with no garden data',()=>{const selection={saveId:'12345678-1234-1234-1234-123456789abc',gardenId:'b'};const url=new URL(gardenPlanHref(selection));assert.equal(url.origin,'https://studio.veggie.farm');assert.equal(url.search,'');assert.deepEqual(readGardenHandoff(url.hash),selection);});

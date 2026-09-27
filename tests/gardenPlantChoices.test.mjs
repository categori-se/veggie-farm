import test from 'node:test';import assert from 'node:assert/strict';
import {gardenPlantChoices} from '../src/lib/garden/gardenPlantChoices.js';
test('active garden choices prioritize exact identities without changing catalog or plans',()=>{
 const state={plants:[{id:'a',name:'Tomato'},{id:'b',name:'Lettuce'},{id:'c',name:'Tomato',catalogIdentity:{cultivar:'Amish Paste'}}],property:{planningTray:[{plantId:'c'},{plantId:'missing'}]},placements:[{plantId:'b'}]},before=structuredClone(state);
 assert.deepEqual(gardenPlantChoices(state).all.map(p=>p.id),['b','c','a']);assert.deepEqual(gardenPlantChoices(state,'amish').preferred.map(p=>p.id),['c']);assert.equal(gardenPlantChoices(state,'pine').hasChoices,true);assert.deepEqual(state,before);
 assert.deepEqual(gardenPlantChoices({...state,placements:[],property:{}}).preferred,[]);assert.equal(gardenPlantChoices({...state,placements:[],property:{}}).hasChoices,false);
});

import test from 'node:test';import assert from 'node:assert/strict';import {classifyPlantTypes} from '../src/lib/plants/plantTypes.js';import {matchesPlant} from '../src/lib/plants/explorer.js';
const type=(common,name=common,scientific='')=>classifyPlantTypes({id:'test',common,name,scientific});
test('types overlap and role filters do not erase growth form',()=>{
 const thyme=type('Thyme','Creeping Thyme');assert.ok(thyme.plantTypes.includes('subshrub'));assert.equal(matchesPlant(thyme,{form:'groundcover'}),true);assert.ok(thyme.plantTypeSources.length);
 assert.ok(type('Strawberry').plantTypes.includes('groundcover'));assert.ok(type('Bean','Pole bean').plantTypes.includes('vine'));assert.ok(!type('Bean','Bush bean').plantTypes.includes('vine'));
});
test('similarly named plants do not inherit unrelated groundcover claims',()=>{
 assert.ok(type('Clover','Crimson Clover').plantTypes.includes('cover-crop'));assert.ok(!type('Clover','Red Feathers Clover').plantTypes.includes('groundcover'));
 assert.ok(type('Clove','Clove','Syzygium aromaticum').plantTypes.includes('tree'));assert.ok(!type('Clove','Clove','Syzygium aromaticum').plantTypes.includes('groundcover'));
 assert.ok(!type('Vinca','Heatwave Vinca').plantTypes.includes('groundcover'));assert.ok(!type('Phlox','Annual phlox','Phlox drummondii').plantTypes.includes('groundcover'));
});
test('unknown groups remain explicitly unassessed and source records are not mutated',()=>{
 const p={common:'Unidentified ornamental',name:'Unknown',form:null};const before=JSON.stringify(p);assert.deepEqual(classifyPlantTypes(p).plantTypes,['unclassified']);assert.equal(JSON.stringify(p),before);
 const provided={name:'Test tree',form:'tree'};assert.ok(classifyPlantTypes(provided).plantTypes.includes('tree'));
});

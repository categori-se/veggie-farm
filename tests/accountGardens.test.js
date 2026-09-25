import test from 'node:test';
import assert from 'node:assert/strict';
import {accountGardenPayload, mergeAccountGardens, PUBLIC_DEMO_IDS} from '../src/lib/garden/accountGardens.js';
import {parsePlannerBackup} from '../src/lib/garden/plannerBackup.js';
const garden = id => ({id,name:id,property:{id},beds:[],structures:[],vegetation:[],placements:[]});
const demo = garden(PUBLIC_DEMO_IDS[0]), personal = garden('my-garden');
const local = {...demo,activeParcelId:demo.id,plants:[],parcels:[demo,personal],layouts:[
 {id:'demo-version',name:'Experiment',gardenId:demo.id,workspace:demo},
 {id:'mine',name:'Spring',gardenId:personal.id,workspace:personal,parcels:[demo,personal]}
],spatial:{datasets:[{gardenId:demo.id}]}};
test('account payload excludes demos, nested snapshots and derived spatial records even when a demo is active',()=>{
 const before=structuredClone(local), result=accountGardenPayload(local);
 assert.deepEqual(local,before);
 assert.equal(result.activeParcelId,personal.id);
 assert.deepEqual(result.property,personal.property);
 assert.deepEqual(result.parcels,[personal]);
 assert.equal(result.layouts.length,1);
 assert.deepEqual(result.layouts[0].parcels,[personal]);
 assert.equal(result.spatial,undefined);
 assert.ok(!JSON.stringify(result).includes(demo.id));
 assert.deepEqual(parsePlannerBackup(JSON.stringify(result)),result);
});
test('demo-only account save fails before upload; local experiments remain available',()=>{
 assert.throws(()=>accountGardenPayload({...local,parcels:[demo]}),{code:'no_personal_gardens'});
 assert.deepEqual(local.parcels[0],demo);
});
test('restoring personal work preserves local demos and their versions, ignoring old cloud demo edits',()=>{
 const editedLocal=structuredClone(local);editedLocal.parcels[0].name='Local experiment';
 const incoming=structuredClone(local);incoming.parcels[0].name='Stale cloud demo';incoming.parcels[1].name='Recovered own garden';
 const result=mergeAccountGardens(editedLocal,incoming);
 assert.equal(result.parcels[0].name,'Local experiment');
 assert.equal(result.parcels[1].name,'Recovered own garden');
 assert.equal(result.layouts.filter(l=>l.id==='demo-version').length,1);
 assert.equal(result.activeParcelId,personal.id);
});

test('legacy active-bed controls and stale camera selections do not leak from an active demo',()=>{
 const input=structuredClone(local);
 input.bed={width:777,height:999,notes:'demo-only edit'};
 input.bedCameras={demoBed:{viewport:{x:777,y:999}}};
 input.selectedStructureId='demo-feature';
 const result=accountGardenPayload(input);
 assert.equal(result.bed,undefined);
 assert.equal(result.bedCameras,undefined);
 assert.equal(result.selectedStructureId,undefined);
 assert.deepEqual(result.property,personal.property);
 assert.deepEqual(parsePlannerBackup(JSON.stringify(result)),result);
 assert.equal(input.bed.width,777);
});

test('personal saved versions use their own historical workspace, replacing stale demo mirrors',()=>{
 const input=structuredClone(local);
 const historical={...garden(personal.id),structures:[{id:'personal-old-path',notes:'Keep this version'}]};
 input.layouts=[{id:'old',name:'Earlier',gardenId:personal.id,activeParcelId:demo.id,
   property:demo.property,structures:[{id:'demo-path'}],bed:{width:777},workspace:historical}];
 const result=accountGardenPayload(input);
 assert.equal(result.layouts[0].activeParcelId,personal.id);
 assert.deepEqual(result.layouts[0].structures,historical.structures);
 assert.deepEqual(result.layouts[0].property,historical.property);
 assert.equal(result.layouts[0].bed,undefined);
 assert.ok(!JSON.stringify(result).includes('demo-path'));
 assert.deepEqual(parsePlannerBackup(JSON.stringify(result)),result);
});

test('legacy personal versions survive and ambiguous identities fail without mutating local work',()=>{
 const input=structuredClone(local);
 input.layouts=[{...personal,id:'old',name:'Earlier',gardenId:personal.id}];
 assert.equal(accountGardenPayload(input).layouts[0].property.id,personal.id);
 input.layouts[0].property=demo.property;
 const before=structuredClone(input);
 assert.throws(()=>accountGardenPayload(input),{code:'invalid_account_layout'});
 assert.deepEqual(input,before);
});

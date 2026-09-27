import test from 'node:test';import assert from 'node:assert/strict';import {duplicatePlanting} from '../src/lib/garden/duplicatePlanting.js';
const plant={id:'tomato',spacing:30,matureDiameter:28},bed={id:'bed',width:48,height:96,safeMargin:2},source={id:'original',bedId:'bed',plantId:'tomato',x:24,y:20,rotation:.5,planted:'2027-05-20',plannedUntil:'2027-09-20',planYear:2027,health:'harvested',observations:[{id:'harvest',quantity:3}],actualSowing:'2027-05-22',notes:'Observed pest',sizeScenario:{plantId:'tomato',reference:'Design',startPercent:20}};
test('duplicate keeps plan and rotation but never history or measured status',()=>{
 const before=JSON.stringify(source),copy=duplicatePlanting({source,bed,plants:[plant],placements:[source],id:'new'});
 assert.equal(copy.id,'new');assert.equal(copy.health,'planned');assert.equal(copy.rotation,.5);assert.equal(copy.planted,source.planted);assert.equal(copy.plannedUntil,source.plannedUntil);assert.equal(copy.planYear,2027);assert.equal(copy.observations,undefined);assert.equal(copy.actualSowing,undefined);assert.equal(copy.notes,'');assert.ok(Math.hypot(copy.x-source.x,copy.y-source.y)>=30);copy.sizeScenario.reference='Changed';assert.equal(JSON.stringify(source),before);
});
test('full, unknown, invalid and polygon beds fail without changing records',()=>{
 const placements=[source],before=JSON.stringify(placements),args={source,bed,plants:[plant],placements,id:'new'};
 assert.throws(()=>duplicatePlanting({...args,bed:{...bed,height:40}}),/No clear space/);
 assert.throws(()=>duplicatePlanting({...args,plants:[]}),/dimensions/);
 assert.throws(()=>duplicatePlanting({...args,id:source.id}),/Select/);
 assert.throws(()=>duplicatePlanting({...args,bed:{...bed,polygon:[[0,0],[48,0],[0,48]]}}),/No clear space/);
 assert.equal(JSON.stringify(placements),before);
});
test('all planned occupants count, including hidden dates, other beds do not',()=>{
 const blocker={...source,id:'later',x:24,y:50,planted:'2028-01-01'};
 const args={source,bed:{...bed,height:72},plants:[plant],id:'new'};
 assert.throws(()=>duplicatePlanting({...args,placements:[source,blocker]}),/No clear space/);
 assert.ok(duplicatePlanting({...args,placements:[source,{...blocker,bedId:'elsewhere'}]}));
});

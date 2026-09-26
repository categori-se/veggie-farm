import test from 'node:test';import assert from 'node:assert/strict';
import {matchesPlant,missingFilteredTraits,sortPlants,groupPlantListings} from '../src/lib/plants/explorer.js';
import {planPlanting,loadRecords} from '../src/lib/garden/gardenRecords.js';
const known={id:'a',name:'Carrot Nantes',common:'Carrot',category:'vegetable',light:'full sun',maturityMin:40,maturityMax:70,spacingMax:3,directSow:true,transplant:false,frost:true};
const unknown={id:'b',name:'Carrot Unrecorded',category:'vegetable',light:null,maturityMax:null,spacingMax:null,directSow:null,transplant:null,frost:null};
test('missing facts stay explicit and can be excluded; false is known, not missing',()=>{
 const filters={maturity:'60',method:'transplant',includeUnknown:true};assert.equal(matchesPlant(known,filters),false);assert.equal(matchesPlant(unknown,filters),true);assert.deepEqual(missingFilteredTraits(unknown,filters),['maturityMax','transplant']);assert.equal(matchesPlant(unknown,{...filters,includeUnknown:false}),false);assert.equal(matchesPlant({...known,maturityMax:50},{method:'transplant'}),false);assert.deepEqual(missingFilteredTraits(known,{method:'transplant'}),[]);
});
test('maturity uses the upper bound and filters compose without mutating records',()=>{
 assert.equal(matchesPlant(known,{search:'nantes carrot',category:'vegetable',maturity:60}),false);
 assert.equal(matchesPlant(known,{search:'nantes carrot',category:'vegetable',maturity:90,light:'full sun',spacing:6,method:'sow',frost:'hardy'}),true);
 const rows=[unknown,known];assert.deepEqual(sortPlants(rows,'maturity').map(r=>r.id),['a','b']);assert.equal(rows[0],unknown);
});
test('saved planting retains variety and source identity; non-HTTPS sources are rejected',()=>{
 const map=new Map(),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};
 const result=planPlanting({crop:'Carrot',date:'2026-09-24',variety:'Nantes',catalogPlantId:'plant:catalog:nantes',catalogSourceUrl:'https://example.org/nantes'},storage);assert.ok(result.saved);const p=loadRecords(storage).plantings[0];assert.equal(p.variety,'Nantes');assert.equal(p.catalogPlantId,'plant:catalog:nantes');assert.equal(p.catalogSourceUrl,'https://example.org/nantes');
 planPlanting({crop:'Carrot',date:'2026-09-24',catalogSourceUrl:'javascript:alert(1)'},storage);assert.equal(loadRecords(storage).plantings[1].catalogSourceUrl,'');
});
test('plant form and crop category are independent identity filters',()=>{
 const apple={...known,name:'Apple',category:'fruit',form:'tree'};
 assert.equal(matchesPlant(apple,{category:'fruit',form:'tree'}),true);
 assert.equal(matchesPlant(apple,{category:'fruit',form:'shrub'}),false);
 assert.equal(matchesPlant(unknown,{form:'tree',includeUnknown:true}),false);
});
test('garden-photo ordering retains staged images and name sorting remains available',()=>{
 const rows=[{id:'white',name:'A white background',photoPriority:2},{id:'garden',name:'Z on the branch',photoPriority:0},{id:'harvest',name:'B harvest',photoPriority:1}];
 assert.deepEqual(sortPlants(rows,'garden').map(p=>p.id),['garden','harvest','white']);
 assert.deepEqual(sortPlants(rows,'name').map(p=>p.id),['white','harvest','garden']);
 assert.equal(rows.length,3);
});

test('combination listings consolidate planning identity while retaining source records',()=>{
 const make=(n,extra={})=>({id:`v${n}`,name:`Combination Peach 'Example' (${n} Varieties)`,category:'fruit',scientific:'Prunus persica',source:`https://example.org/peach-${n}`,hardiness:`variant ${n}`,...extra});
 const rows=[make(4),make(5)],before=JSON.stringify(rows),group=groupPlantListings(rows)[0];
 assert.equal(groupPlantListings(rows).length,1);assert.equal(group.name,"Combination Peach 'Example'");assert.equal(group.common,group.name);assert.deepEqual(group.sourceListings.map(p=>p.id),['v4','v5']);assert.equal(group.hardiness,null);assert.equal(JSON.stringify(rows),before);
 for(const extra of [{scientific:'Prunus domestica'},{source:'https://another.example/peach'},{name:"Combination Peach 'Different' (5 Varieties)"}])assert.equal(groupPlantListings([rows[0],make(5,extra)]).length,2);
 assert.equal(groupPlantListings([make(4,{name:'Apple Red'}),make(5,{name:'Apple Red'})]).length,2);
});

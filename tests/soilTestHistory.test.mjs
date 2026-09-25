import test from 'node:test';import assert from 'node:assert/strict';
import {organicMatterPercent,soilHistoryRows,soilHistoryPoints,soilHistoryDomain} from '../src/lib/garden/soilTestHistory.js';
test('organic matter charts only exact percent values, preserving unknown units',()=>{
 assert.equal(organicMatterPercent('3.1 %'),3.1);assert.equal(organicMatterPercent('0%'),0);
 for(const v of ['3.1','31 g/kg','high','<3%','101%',null])assert.equal(organicMatterPercent(v),null);
});
test('soil history retains zero and missing values, orders dates and does not mutate records',()=>{
 const rows=[{date:'2026-02-30',ph:null,organicMatter:'high'},{date:'2026-01-01',ph:0,organicMatter:'0%'},{date:'2024-01-01',ph:6.2,organicMatter:'3.1%'}],before=JSON.stringify(rows),history=soilHistoryRows(rows);
 assert.equal(JSON.stringify(rows),before);assert.equal(history[0].date,null);assert.equal(history.at(-1).ph,0);
 assert.equal(soilHistoryPoints(history,'ph').length,2);assert.deepEqual(soilHistoryDomain(history,'ph'),[0,8]);
 assert.equal(soilHistoryPoints(history,'organicMatterPercent').length,2);
});
test('pH overlay expands chart domain without changing recorded values',()=>{
 const rows=soilHistoryRows([{date:'2026-01-01',ph:6.2}]),reference={min:4.5,max:5.2};
 assert.deepEqual(soilHistoryDomain(rows,'ph',reference),[3,8]);
 assert.equal(soilHistoryPoints(rows,'ph',reference)[0].value,6.2);
 assert.deepEqual(soilHistoryPoints(soilHistoryRows([{date:'2026-01-01',ph:null}]),'ph',reference),[]);
 assert.deepEqual(soilHistoryDomain(rows,'ph',{min:-10,max:40}),soilHistoryDomain(rows,'ph'));
});

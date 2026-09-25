import test from 'node:test';import assert from 'node:assert/strict';
import {recommendCrops} from '../src/lib/recommendations/recommendCrops.js';
test('displayed criteria exactly account for the existing weighted ranking',()=>{
 const plants=[{id:'a',name:'Tomato',sun:'full sun',season:'warm-season',sourceIds:[]},{id:'b',name:'Radish',sun:'full sun',season:'cool-season',sourceIds:[]}];
 for(const profile of [{},{date:'2026-06-15',soilTemperatureF:70,sunHours:8,soilTexture:'loam',goal:'quick harvest'}]){
  const rows=recommendCrops(plants,{},profile);
  for(const row of rows){assert.equal(row.criteria.length,7);assert.equal(row.criteria.reduce((n,c)=>n+c.maximum,0),100);assert.ok(Math.abs(row.criteria.reduce((n,c)=>n+c.points,0)-row.score*100)<1e-10);assert.equal(Math.round(row.score*100),row.percent);assert.ok(row.criteria.every(c=>c.reason&&c.status));}
 }
 const unknown=recommendCrops(plants,{},{});assert.equal(unknown[0].criteria.find(c=>c.key==='sun').status,'unknown');
});

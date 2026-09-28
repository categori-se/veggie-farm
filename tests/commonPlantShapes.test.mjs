import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {plantVisualGeometry} from '../src/lib/plants/plantVisualGeometry.js';
const pack=JSON.parse(fs.readFileSync(new URL('../src/data/common-plant-shapes.json',import.meta.url),'utf8'));
test('all 50 starter profiles produce deterministic finite geometry without media',()=>{
 assert.equal(pack.plants.length,50);assert.equal(new Set(pack.plants.map(p=>p.id)).size,50);
 assert.deepEqual(pack.plants.map(p=>p.priority),Array.from({length:50},(_,i)=>i+1));
 for(const plant of pack.plants){
  assert.ok(plant.spec.widthIn>0&&plant.spec.heightIn>0);
  assert.match(plant.reviewStatus,/pending/);
  for(const id of plant.sourceIds)assert.ok(pack.sources[id]);
  const parts=plantVisualGeometry(plant.spec,plant.id);
  assert.ok(parts.length>0);assert.deepEqual(parts,plantVisualGeometry(plant.spec,plant.id));
  const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
  finite(parts);
 }
});

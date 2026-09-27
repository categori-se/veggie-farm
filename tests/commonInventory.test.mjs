import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateCommonDataset, mergeCommonRecords, referencePlant, referenceExplorer, referenceStudio, mergeStudioReferences, COMMON_REVIEW} from '../src/lib/plants/commonInventory.js';
import {COMMON_PLANTS} from '../src/data/commonPlantCatalog.js';
import {FLOWER_CATALOG} from '../src/data/flowerCatalog.js';
import {plantVisualSpec} from '../src/lib/plants/plantVisualSpec.js';
import {plantVisualGeometry} from '../src/lib/plants/plantVisualGeometry.js';
import {parsePlannerBackup} from '../src/lib/garden/plannerBackup.js';
const dataset = JSON.parse(fs.readFileSync(new URL('../data/reference/common-plants.json',import.meta.url),'utf8'));
const bySlug = slug => dataset.plants.find(row=>row.slug===slug);

test('100 identities, citations, ranks and visual mappings resolve; corrupt inputs fail',()=>{
  assert.deepEqual(validateCommonDataset(dataset),{plants:100,mappings:100,archetypes:22,sources:67});
  assert.equal(referencePlant(bySlug('tomatoes'),dataset.sources).spacingInches.max,24);
  assert.equal(bySlug('tomatoes').suppliedSpacingInches.max,36);
  for (const mutate of [d=>d.plants[1].id=d.plants[0].id,d=>d.plants[0].sourceIds.push('missing'),d=>d.visualMappings[0].canonicalArchetype='unknown',d=>d.plants[0].matureSizeInches.height.max=-1,d=>d.sources[d.plants[0].sourceIds[0]].url='javascript:alert(1)']) {
    const bad=structuredClone(dataset);mutate(bad);assert.throws(()=>validateCommonDataset(bad));
  }
});
test('same-ID enrichment preserves existing facts, false values, review and cultivar identity; repeated merge is stable',()=>{
  const tomato=referencePlant(bySlug('tomatoes'),dataset.sources);
  const existing=[{id:tomato.id,name:'Existing tomato',spacingInches:{min:20,max:25,text:'Existing spacing'},scientificName:null,frostHardy:false,confidence:0.9,reviewStatus:'reviewed'},
    {id:'plant:vendor:tomatoes',name:'Tomatoes',cultivar:'Specific cultivar',spacingInches:{min:8,max:8}}];
  const before=structuredClone(existing),merged=mergeCommonRecords(existing,[tomato]);
  assert.deepEqual(existing,before);assert.equal(merged.length,2);assert.deepEqual(merged[1],before[1]);
  assert.deepEqual(merged[0].spacingInches,before[0].spacingInches);assert.equal(merged[0].frostHardy,false);
  assert.equal(merged[0].reviewStatus,'reviewed');assert.equal(merged[0].scientificName,'Solanum lycopersicum');
  assert.equal(merged[0].referenceEnrichment.reviewStatus,COMMON_REVIEW);
  assert.deepEqual(mergeCommonRecords(merged,[tomato]),merged);
  assert.throws(()=>mergeCommonRecords(existing,[tomato,tomato]));
});
test('reference records expose all citations without converting unknown maturity basis or text planting advice into computed facts',()=>{
  for(const raw of dataset.plants){
    const plant=referencePlant(raw,dataset.sources),explorer=referenceExplorer(raw,dataset.sources);
    assert.equal(plant.confidence,null);assert.equal(plant.reviewStatus,COMMON_REVIEW);
    assert.equal(plant.daysToMaturity.min,null);assert.equal(explorer.maturityMax,null);
    assert.equal(explorer.directSow,null);assert.equal(explorer.transplant,null);
    assert.equal(explorer.citations.length,raw.sourceIds.length);
    assert.equal(typeof explorer.light,'string');assert.ok(explorer.additionalFacts.every(f=>typeof f.text==='string'));
  }
});
test('all imported plants have deterministic supported geometry; existing Studio identities, dimensions and flower forms win',()=>{
  assert.deepEqual(COMMON_PLANTS,dataset.plants.map(p=>referenceStudio(p,dataset.sources)));
  for(const plant of COMMON_PLANTS){const spec=plantVisualSpec(plant);assert.ok(spec,plant.id);const parts=plantVisualGeometry(spec,plant.id);assert.ok(parts.length>0&&parts.length<150);assert.deepEqual(parts,plantVisualGeometry(spec,plant.id));}
  const existing=[{id:'tomato',name:'Tomato',height:56,matureDiameter:28,spacing:30,visual:{habit:'vine'}},...FLOWER_CATALOG];
  const merged=mergeStudioReferences(existing,COMMON_PLANTS);
  assert.equal(merged.length,100);assert.equal(merged.find(p=>p.id==='tomato').height,56);
  assert.equal(plantVisualSpec(merged.find(p=>p.id==='tomato')).id,'upright-fruiting');
  for(const flower of FLOWER_CATALOG)assert.deepEqual(plantVisualSpec(merged.find(p=>p.id===flower.id)),plantVisualSpec({...flower,dimensionBasis: flower.dimensionBasis || 'Existing Studio planning dimensions retained; supplied ranges are supplementary, not measurements.'}));
});
test('new inventory survives full backup round trip without changing user dimensions or placements',()=>{
  const backup=JSON.parse(fs.readFileSync(new URL('../data/demo/community-garden.json',import.meta.url),'utf8'));
  const originals=structuredClone(backup.plants),placements=structuredClone(backup.placements);
  const reference=referenceStudio(bySlug('broccoli'),dataset.sources);
  backup.plants=mergeStudioReferences(backup.plants,[reference]);
  const user=backup.plants.find(p=>p.id===reference.id);user.height=27;
  const loaded=parsePlannerBackup(JSON.stringify(backup));
  assert.equal(loaded.plants.find(p=>p.id===reference.id).height,27);
  assert.deepEqual(loaded.plants.find(p=>p.id===reference.id).sources,reference.sources);
  assert.deepEqual(loaded.placements,placements);
  for(const plant of originals)assert.deepEqual(loaded.plants.find(p=>p.id===plant.id),plant);
});

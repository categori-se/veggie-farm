// Source-only starter shapes: no downloaded meshes, photographs or network requests.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {referenceStudio, validateCommonDataset} from '../src/lib/plants/commonInventory.js';
import {plantVisualSpec} from '../src/lib/plants/plantVisualSpec.js';
const raw = await fs.readFile('data/reference/common-plants.json', 'utf8');
const dataset = JSON.parse(raw);
validateCommonDataset(dataset);
const plants = [...dataset.plants].sort((a,b) => a.rank-b.rank).slice(0,50).map(record => {
  const plant = referenceStudio(record, dataset.sources);
  const spec = plantVisualSpec(plant);
  if (!spec) throw Error(`Missing shape: ${plant.id}`);
  return {id:plant.id, name:plant.name, scientificName:plant.scientificName, priority:record.rank,
    reviewStatus:plant.reviewStatus, sourceIds:plant.sourceIds, spec};
});
const output = {schemaVersion:1, title:'50 common-garden plant shapes', license:'GPL-3.0-only',
  source:'data/reference/common-plants.json', sourceSha256:createHash('sha256').update(raw).digest('hex'),
  selectionBasis:'First 50 in the owner-supplied common-garden priority list; not measured popularity.',
  representation:'Plant-specific dimensions and colors using shared schematic archetypes, not 50 independently modeled species. Planning ranges remain subject to horticultural review.',
  units:'inches', sources:dataset.sources, plants};
const path='src/data/common-plant-shapes.json', text=JSON.stringify(output,null,2)+'\n';
if(process.argv.includes('--check')) {
  if(await fs.readFile(path,'utf8')!==text)throw Error('Starter shapes are stale; run node scripts/build-common-plant-shapes.mjs');
} else await fs.writeFile(path,text);
console.log(`50 plant-shape profiles; ${new Set(plants.map(p=>p.spec.id)).size} shared shape families; no external media.`);

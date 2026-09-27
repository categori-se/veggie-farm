import fs from 'node:fs/promises';
import {readOpenPlants} from './lib/open-plant-input.mjs';
import {referencePlant,validateCommonDataset} from '../src/lib/plants/commonInventory.js';
import {plantCoverage} from '../src/lib/plants/openPlantData.js';
const {plants,manifest}=await readOpenPlants();
const existing=JSON.parse(await fs.readFile('src/data/plants.json','utf8'));
// Only replace this exact dataset's projection; preserve every other record.
const owned=new Set(plants.map(p=>p.id));
if(existing.some(p=>owned.has(p.id)&&p.referenceDatasetId!=='openfarm-recovered-340'))throw Error('Open plant identity conflicts with another dataset');
const merged=[...existing.filter(p=>p.referenceDatasetId!=='openfarm-recovered-340'),...plants];
const common=JSON.parse(await fs.readFile('data/reference/common-plants.json','utf8'));
validateCommonDataset(common);
const publicPlants=[...common.plants.map(p=>referencePlant(p,common.sources)),...plants];
const publicCatalog=JSON.stringify({schemaVersion:1,sources:{...common.sources,'source:common-100-contribution':{publisher:'veggie.farm project owner',title:'Common 100 original compilation',url:'https://github.com/categori-se/veggie-farm/blob/main/data/reference/common-plants.json',license:'GPL-3.0-only'},'source:openfarm-recovery':manifest},records:publicPlants,coverage:plantCoverage(publicPlants),visualArchetypes:common.visualArchetypes,visualMappings:common.visualMappings},null,2)+'\n';
const output=JSON.stringify(merged,null,2)+'\n';
const coverage=JSON.stringify(plantCoverage(merged),null,2)+'\n';
if(process.argv.includes('--check')){
 if(await fs.readFile('src/data/plants.json','utf8')!==output || await fs.readFile('src/data/plant-data-coverage.json','utf8')!==coverage || await fs.readFile('src/data/open-plant-catalog.json','utf8')!==publicCatalog)throw Error('Open plant projection or coverage is stale');
}else{
 await fs.writeFile('src/data/plants.json',output);
 await fs.writeFile('src/data/plant-data-coverage.json',coverage);
 await fs.writeFile('src/data/open-plant-catalog.json',publicCatalog);
}
console.log(`Open plant data: ${plants.length} attributed CC0 records; ${merged.length} total source records.`);

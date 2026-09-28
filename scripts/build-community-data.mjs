import {readOpenPlants} from './lib/open-plant-input.mjs';
import {openPlantExplorer} from '../src/lib/plants/openPlantData.js';
// Build the independent community catalog without provider archives or credentials.
import fs from 'node:fs/promises';
import {validateCommonDataset, mergeCommonRecords, referenceExplorer, referencePlant} from '../src/lib/plants/commonInventory.js';
import {createHash} from 'node:crypto';
import {FLOWER_CATALOG} from '../src/data/flowerCatalog.js';
import {persistenceCopy} from '../src/lib/account/persistenceModel.js';

const read = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const write = async (file, data) => {await fs.mkdir(file.slice(0,file.lastIndexOf('/')), {recursive:true});await fs.writeFile(file, JSON.stringify(data,null,2)+'\n');};
const marker = await read('community-release.json');
if(marker.profile !== 'community') throw Error('Run this only in an exported community source tree.');
await fs.copyFile('data/demo/community-garden.json','src/data/community-garden.json');
// Keep source-level citations, not the harvested cultivar-by-cultivar inventory.
await write('src/data/source-citations.json',(await read('src/data/source-citations.json')).filter(row=>row.type==='source'));
const groups = await Promise.all(['vegetables','fruits','herbs'].map(async (file,i)=>(await read(`src/data/${file}.json`)).map(p=>({...p,category:['vegetable','fruit','herb'][i]}))));
let plants=groups.flat().map(p=>({
 id:`plant:community:${p.slug}`,name:p.name,common:p.name,cultivar:null,scientific:null,
 category:p.category,family:p.family??null,description:null,careNotes:[],additionalFacts:[],
 source:`https://veggie.farm${p.path}`,sourceKind:'project-guide',imageIds:[],
 spacing:p.spacing??null,spacingMin:null,spacingMax:null,maturity:p.daysToMaturity??null,
 maturityMin:null,maturityMax:null,light:null,frost:null,directSow:null,transplant:null,
 form:p.type==='Tree fruit'?'tree':null,reviewStatus:'project-guide; cultivar details unknown'
}));
for(const f of FLOWER_CATALOG) plants.push({id:`plant:community:${f.id}`,name:f.name,common:f.name,scientific:f.scientificName??null,category:'flower-or-ornamental',source:'https://massnrc.org/ppd/',sourceKind:'botanical-reference',imageIds:[],light:null,spacing:null,spacingMin:null,spacingMax:null,maturity:null,maturityMax:null,frost:null,directSow:null,transplant:null,careNotes:[],additionalFacts:[]});
const commonDataset=await read('data/reference/common-plants.json');
validateCommonDataset(commonDataset);
plants=mergeCommonRecords(plants,commonDataset.plants.map(p=>referenceExplorer(p,commonDataset.sources)));
const {plants:openPlants}=await readOpenPlants();
plants.push(...openPlants.map(openPlantExplorer));
plants.sort((a,b)=>a.name.localeCompare(b.name));
if(new Set(plants.map(p=>p.id)).size!==plants.length)throw Error('Duplicate community plant id');
await write('src/data/plant-explorer.json',plants);
await write('src/data/plants.json',mergeCommonRecords(plants.filter(p=>!p.id.startsWith('plant:openfarm:')).map(p=>({id:p.id,name:p.name,commonName:p.common,scientificName:p.scientific,primaryUse:p.category,family:p.family,sourceUrl:p.source,sourceIds:['source:community-guides'],reviewStatus:p.referenceDatasetId?'user-supplied-reference; horticultural verification pending':'community-reference',confidence:null,sun:null,spacingInches:{min:null,max:null,text:p.spacing??null},germinationDays:{min:null,max:null,text:null},daysToMaturity:{min:null,max:null,text:p.maturity??null}})),commonDataset.plants.map(p=>referencePlant(p,commonDataset.sources))));
await write('src/data/spacing.json',plants.map(p=>({plantId:p.id,name:p.name,plantSpacingText:p.spacing??'Not listed',plantSpacingInchesMin:p.spacingMin??null,plantSpacingInchesMax:p.spacingMax??null})));
// Missing horticultural facts stay unknown rather than inherited from a vendor cultivar.
for(const name of ['germination','planting-rules','soil-preferences'])await write(`src/data/${name}.json`,[]);
await write('src/data/nursery-catalog.json',[]);
await write('src/data/catalog-photo-preferences.json',{});
await fs.writeFile('src/components/catalog-images.js','// No privately licensed catalog photographs are bundled.\nexport const catalogImages = new Map();\n');
let reports='import {FileAttachment} from "observablehq:stdlib";\nexport const plantReports = new Map([\n';
for(const p of plants){const file=createHash('sha256').update(p.id).digest('hex').slice(0,20)+'.json';await write('src/data/plant-reports/'+file,{...p,sourceAttributes:[],sourceDescription:[]});reports+=`[${JSON.stringify(p.id)},FileAttachment(${JSON.stringify('../data/plant-reports/'+file)})],\n`;}
await fs.writeFile('src/components/plant-report-files.js',reports+']);\n');
async function walk(dir){const out=[];for(const e of await fs.readdir(dir,{withFileTypes:true})){const file=`${dir}/${e.name}`;if(e.isDirectory())out.push(...await walk(file));else if(file.endsWith('.md'))out.push(file);}return out;}
const guides=[];
for(const file of (await walk('src/content')).sort()){
 const body=await fs.readFile(file,'utf8'),title=body.match(/^title:\s*"?([^"\n]+)"?$/m)?.[1];if(!title)continue;
 const text=body.replace(/\{\{([a-z-]+)\}\}/g,(m,k)=>persistenceCopy[k]??m).replace(/^---[\s\S]*?---/,'').replace(/```[\s\S]*?```/g,'').replace(/<[^>]*>/g,' ').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/[#*|`]/g,' ').replace(/\s+/g,' ').trim();
 guides.push({title,description:body.match(/^description:\s*"?([^"\n]+)"?$/m)?.[1]||'',category:file.split('/')[2],url:'/'+file.slice(4).replace(/index\.md$/,'').replace(/\.md$/,''),text});
}
await write('src/data/gardening-library.json',guides);
console.log(`Community data: ${plants.length} plants, ${guides.length} guides; no private catalog input.`);

await import('./build-common-plants.mjs');
await import('./build-common-plant-shapes.mjs');

await import('./build-open-plants.mjs');

import {gardenPlanHref} from './gardenHandoff.js';
import {measurementDate} from './soilReading.js';
// Plant selection and optional planned date only; no garden contents or account credentials in the fragment.
const planningDate=value=>measurementDate(value)&&value>='1900-01-01'&&value<='2200-12-31'?value:null;
const text=(v,max=180)=>typeof v==='string'?v.trim().slice(0,max):'';
export function plantIntent(record){
 if(!record||typeof record!=='object'||!text(record.id)||!text(record.name))throw Error('This plant selection is incomplete.');
 const source=text(record.source,500);let sourceUrl='';try{const u=new URL(source);if(u.protocol==='https:'&&!u.username&&!u.password)sourceUrl=u.href;}catch{}
 const spacing=Number(record.spacingMax);return {...(planningDate(record.plannedDate)?{plannedDate:record.plannedDate}:{}),id:text(record.id),name:text(record.name),common:text(record.common),cultivar:text(record.cultivar),scientific:text(record.scientific),source:sourceUrl,spacingMax:record.spacingMax!=null&&Number.isFinite(spacing)&&spacing>0&&spacing<=1200?spacing:null};
}
export function plantPlanUrl(record,origin='https://studio.veggie.farm/'){
 const url=new URL(origin);url.hash=new URLSearchParams({plant:JSON.stringify(plantIntent(record))}).toString();return url.href;
}
export function cropPlanUrl(crop,date,origin='https://studio.veggie.farm/',destination=null){
 if(!crop||!/^[a-z0-9-]+$/.test(crop.slug)||!planningDate(date))throw Error('Choose a crop and a valid planning date.');
 const url=new URL(plantPlanUrl({id:`guide:${crop.slug}`,name:crop.name,common:crop.name,source:`https://veggie.farm/content/vegetables/${crop.slug}`,plannedDate:date},origin));
 if(destination){const linked=gardenPlanHref(destination);if(!linked)throw Error('Choose a saved garden before planning.');const params=new URLSearchParams(url.hash.slice(1));for(const [key,value]of new URLSearchParams(new URL(linked).hash.slice(1)))params.set(key,value);url.hash=params.toString();}
 return url.href;
}
export function readPlantIntent(hash){
 if(typeof hash!=='string'||hash.length>9000)throw Error('The plant selection link is too large.');
 const raw=new URLSearchParams(hash.replace(/^#/,'' )).get('plant');if(!raw)return null;if(raw.length>2000)throw Error('The plant selection link is too large.');return plantIntent(JSON.parse(raw));
}
export function plannedCatalogPlant(intent,{spacing,diameter,height},id){
 const source=plantIntent(intent);const sizes=[spacing,diameter,height].map(Number);if(sizes.some(n=>!Number.isFinite(n)||n<1||n>1200))throw Error('Enter dimensions between 1 and 1,200 inches.');
 return {id,name:source.cultivar&&!source.name.includes(source.cultivar)?`${source.name} — ${source.cultivar}`:source.name,group:'Catalog selection',spacing:sizes[0],matureDiameter:sizes[1],height:sizes[2],color:'#63884e',leafColor:'#63884e',seed:17,catalogIdentity:source,planningDate:source.plannedDate||null,dimensionBasis:'User-reviewed planning dimensions; illustrative model, not measured cultivar geometry',sun:'Not recorded',soil:'Not recorded',waterStyle:'Check growing guide',waterCadence:'Not recorded',emitter:'Not recorded',zone:'Plan',gauge:'Not recorded'};
}
export function addPlanningTrayEntry(state,{gardenId,bedId,year,plant,plannedDate=null},makeId=()=>crypto.randomUUID()){
 const garden=state.parcels.find(g=>g.id===gardenId);if(!garden||!garden.beds.some(b=>b.id===bedId))throw Error('Choose an existing garden and bed.');
 if(!Number.isInteger(year)||year<1900||year>2200)throw Error('Choose a planning year from 1900 to 2200.');
 if(plannedDate&&(!planningDate(plannedDate)||Number(plannedDate.slice(0,4))!==year))throw Error('The planting date must be in the selected planning year.');
 const tray=Array.isArray(garden.property.planningTray)?garden.property.planningTray:[];
 const prior=tray.find(e=>e.catalogPlantId===plant.catalogIdentity.id&&e.bedId===bedId&&e.year===year&&(e.plannedDate||null)===(plannedDate||null));if(prior)return prior;
 if(tray.length>=80)throw Error('This garden tray is full. Remove a choice before adding another.');
 if(state.plants.some(p=>p.id===plant.id))throw Error('This planning plant ID already exists.');
 const entry={id:makeId(),plantId:plant.id,catalogPlantId:plant.catalogIdentity.id,bedId,year,...(plannedDate?{plannedDate}: {})};
 state.plants.push({...structuredClone(plant),planningDate:plannedDate||null});garden.property.planningTray=[...tray,entry];return entry;
}

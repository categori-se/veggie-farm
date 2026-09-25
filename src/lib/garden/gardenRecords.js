import {notebookStorage,markNotebookChanged} from '../account/notebookStorage.js';
import {loadGardenJournal} from './localGardenStore.js';
export const RECORDS_KEY = 'veggie.farm:garden-records:v1';
export const STUDIO_KEY = 'veggie.farm:garden-studio:v8';
const clean = (x, n=160) => String(x ?? '').trim().slice(0,n);
export function localDay() {const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function storage(s) {try{return s ?? notebookStorage();}catch{return null;}}
function read(key, fallback, s) {try{return JSON.parse(storage(s)?.getItem(key) || 'null') ?? fallback;}catch{return fallback;}}
export function loadRecords(s) {const r=read(RECORDS_KEY,{},s);return {schemaVersion:1, bedConditions:r.bedConditions && typeof r.bedConditions === "object" ? r.bedConditions : {}, plantings:Array.isArray(r.plantings)?r.plantings:[],actions:Array.isArray(r.actions)?r.actions:[],soilTests:Array.isArray(r.soilTests)?r.soilTests:[]};}
export function saveRecords(records,s) {try{if(!storage(s))return false;storage(s).setItem(RECORDS_KEY,JSON.stringify(records));if(!s)markNotebookChanged();globalThis.dispatchEvent?.(new Event('garden-records-changed'));return true;}catch{return false;}}
function date(value) {if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||new Date(`${value}T12:00:00Z`).toISOString().slice(0,10)!==value)throw Error('Enter a valid date.');return value;}
export function planPlanting(input,s) {
 // Keep the gardener's intent and cultivar/source identity together. This record
 // is neither a measured outcome nor permission to replace published plant facts.
 const r=loadRecords(s);const crop=clean(input.crop);if(!crop)throw Error('Choose a crop.');
 const planting={id:globalThis.crypto.randomUUID(),crop,cropSlug:clean(input.cropSlug),bedId:clean(input.bedId),gardenId:clean(input.gardenId),bed:clean(input.bed)||'Bed to choose',date:date(input.date||localDay()),method:['sowing','transplanting','undecided'].includes(input.method)?input.method:'undecided',variety:clean(input.variety),catalogPlantId:clean(input.catalogPlantId),catalogSourceUrl:/^https:\/\//.test(input.catalogSourceUrl||'')?clean(input.catalogSourceUrl,1000):'',source:'gardener_plan',createdAt:new Date().toISOString()};
 r.plantings.push(planting);return {planting,saved:saveRecords(r,s)};
}
export function gardenSnapshot(s) {
 const records=loadRecords(s),journal=loadGardenJournal(s);
 const gardens=[],beds=[],plantings=records.plantings;
 return {gardens,beds,plantings:plantings.map(p=>({...p,observations:journal.filter(o=>o.plantingId===p.id||(!o.plantingId&&o.crop?.toLowerCase()===p.crop?.toLowerCase()&&o.bed===p.bed)),stage:plantingStage(p,journal)})),journal,actions:records.actions,soilTests:records.soilTests};
}
export function plantingStage(p,journal) {
 const stages={seeded:'Sown',germinated:'Seedlings emerged',transplanted:'Transplanted',flowered:'Flowering',fruit_set:'Fruit forming',harvested:'Harvest recorded',bolted:'Bolting'};
 const observations=journal.filter(o=>(o.plantingId===p.id||(!o.plantingId&&o.crop?.toLowerCase()===p.crop?.toLowerCase()&&o.bed===p.bed))&&stages[o.type]).sort((a,b)=>b.date.localeCompare(a.date)||String(b.createdAt).localeCompare(String(a.createdAt)));
 return observations.length?stages[observations[0].type]:'Planned · not yet observed';
}
export function recordAction(input,s) {const r=loadRecords(s);const action={id:crypto.randomUUID(),title:clean(input.title),bed:clean(input.bed),date:date(input.date||localDay()),reviewDate:input.reviewDate?date(input.reviewDate):null,status:['done','dismissed'].includes(input.status)?input.status:'recorded',taskId:clean(input.taskId),source:'gardener_action'};if(!action.title)throw Error('Describe your action.');r.actions.push(action);return {action,saved:saveRecords(r,s)};}
export function recordSoilTest(input,s) {const r=loadRecords(s);const ph=input.ph===''?null:Number(input.ph);if(ph!==null&&(!Number.isFinite(ph)||ph<0||ph>14))throw Error('pH must be between 0 and 14.');const row={id:crypto.randomUUID(),date:date(input.date),bed:clean(input.bed),laboratory:clean(input.laboratory),ph,organicMatter:clean(input.organicMatter),phosphorus:clean(input.phosphorus),potassium:clean(input.potassium),report:clean(input.report,10000),source:'user_transcribed_lab_report'};r.soilTests.push(row);return {row,saved:saveRecords(r,s)};}

import {measurementDate} from './soilReading.js';
const factors={g:1,kg:1000,oz:28.349523125,lb:453.59237};
const issues=new Set(['bolted','pest_seen','disease_seen','heat_damage','frost_damage']);
const eventsFor=(p,today)=>(Array.isArray(p.observations)?p.observations:[]).filter(e=>e&&e.plantingId===p.id&&(!e.plantId||e.plantId===p.plantId)&&measurementDate(e.date)&&e.date<=today);
function summarize(events){
 const harvests=events.filter(e=>e.type==='harvested'),dates=harvests.map(e=>e.date).sort();let grams=null,count=null,unmeasured=0;
 for(const e of harvests){if(Number.isFinite(e.quantity)&&e.quantity>0&&Object.hasOwn(factors,e.unit)){grams=(grams||0)+e.quantity*factors[e.unit];}else if(Number.isInteger(e.quantity)&&e.quantity>0&&e.unit==='count'){count=(count||0)+e.quantity;}else unmeasured++;}
 return {events,grams,count,unmeasured,harvestRecords:harvests.length,firstHarvest:dates[0]||null,lastHarvest:dates.at(-1)||null};
}
// Describes records only. It never labels unobserved plants successful or disease-free.
export function seasonLearning(workspace,year,today){
 if(!Number.isInteger(year)||year<1901||year>2200||!measurementDate(today))throw Error('Choose a valid review year and date.');
 const groups=new Map(),placements=workspace.placements||[],byId=new Map(placements.map(p=>[p.id,p]));
 for(const p of placements){
  if(!p.plantId||!p.bedId)continue;
  const events=eventsFor(p,today).filter(e=>[year-1,year].includes(Number(e.date.slice(0,4))));if(!events.length)continue;
  const key=JSON.stringify([p.bedId,p.plantId]);if(!groups.has(key))groups.set(key,{bedId:p.bedId,plantId:p.plantId,events:[],timings:[]});
  const group=groups.get(key);group.events.push(...events);
  const previous=byId.get(p.previousSeasonPlantingId);
  if(!previous||previous.plantId!==p.plantId||previous.bedId!==p.bedId)continue;
  const timing=(plant,y,basis)=>{const records=eventsFor(plant,today).filter(e=>e.date.startsWith(`${y}-`)).sort((a,b)=>a.date.localeCompare(b.date));const starts=records.filter(e=>e.type===basis),harvest=records.find(e=>e.type==='harvested');if(starts.length!==1||!harvest||harvest.date<starts[0].date)return null;return {start:starts[0].date,harvest:harvest.date,days:(Date.parse(harvest.date)-Date.parse(starts[0].date))/86400000};};
  for(const basis of ['transplanted','seeded']){const current=timing(p,year,basis),prior=timing(previous,year-1,basis);if(current&&prior){group.timings.push({basis,current,prior,plantingId:p.id,previousPlantingId:previous.id,differenceDays:current.days-prior.days});break;}}
 }
 return [...groups.values()].map(g=>{
  const current=summarize(g.events.filter(e=>e.date.startsWith(`${year}-`))),prior=summarize(g.events.filter(e=>e.date.startsWith(`${year-1}-`)));
  const recurring=[...issues].filter(type=>current.events.some(e=>e.type===type)&&prior.events.some(e=>e.type===type));
  return {bedId:g.bedId,plantId:g.plantId,current,prior,recurring,timings:g.timings};
 }).sort((a,b)=>b.recurring.length-a.recurring.length||a.bedId.localeCompare(b.bedId)||a.plantId.localeCompare(b.plantId));
}

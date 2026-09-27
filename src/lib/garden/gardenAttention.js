import {measurementDate} from './soilReading.js';
import {plannedHarvest} from './plannedHarvest.js';

const daysBetween=(a,b)=>(Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z'))/86400000;
// A reading of the gardener's records, not a weather, growth or irrigation model.
export function gardenAttention(workspace,today,{quietDays=14,horizonDays=7}={}) {
 if(!measurementDate(today))throw Error('Choose a valid date for garden attention.');
 if(!Number.isInteger(quietDays)||quietDays<1||!Number.isInteger(horizonDays)||horizonDays<0)throw Error('Choose whole-day reminder intervals.');
 const beds=new Map((workspace?.beds||[]).map(b=>[b.id,b]));const items=[];
 for(const planting of workspace?.placements||[]){
  if(!planting?.id)continue;
  const start=measurementDate(planting.planted),end=measurementDate(planting.plannedUntil);
  const events=(Array.isArray(planting.observations)?planting.observations:[]).filter(e=>e&&e.plantingId===planting.id&&(!e.plantId||e.plantId===planting.plantId)&&measurementDate(e.date)&&e.date<=today).sort((a,b)=>a.date.localeCompare(b.date));
  if(events.some(e=>e.type==='ended'))continue;
  const add=(kind,title,explanation,date,action='log',observationType='')=>items.push({id:`${kind}:${planting.id}`,kind,title,explanation,date,action,observationType,plantingId:planting.id,plantId:planting.plantId,bedId:beds.has(planting.bedId)?planting.bedId:null});
  if((planting.planted&&!start)||(planting.plannedUntil&&!end)||(start&&end&&end<start)){
   add('dates','Review planting dates','The planned date range is invalid. Correct it before relying on the seasonal preview.',today,'plan');continue;
  }
  if(end&&end<today){
   add('finish','Check whether this planting finished',`Its planned last day was ${end}. There is no finished-planting record; this does not mean the bed is empty.`,end);continue;
  }
  const hasEntry=events.some(e=>['seeded','transplanted'].includes(e.type));
  if(start&&!hasEntry&&daysBetween(today,start)<=horizonDays){
   add('start',start>today?'Prepare for a planned planting':'Review a planned planting',`Your planned start is ${start}. No sowing or transplanting event is recorded for this planting. Check conditions before acting.`,start);
  }
  if(start&&start>today)continue;
  const harvest=plannedHarvest(planting,today);
  if(harvest.status==='check'){
   add('harvest','Check for harvest readiness',`Your entered ${harvest.minimumDays}–${harvest.maximumDays} day estimate from ${harvest.basis} gives ${harvest.window.earliest} to ${harvest.window.latest}. Reference: ${harvest.reference}. Inspect the plant; this is not an observed harvest.`,harvest.window.earliest,'log','harvested');
  }
  if(end&&daysBetween(today,end)<=horizonDays){
   add('end','Plan what comes next',`This planting is planned to remain through ${end}. Confirm what is growing before reusing its space.`,end,'plan');
  }
  const last=events.at(-1)?.date;
  // Never infer an observation gap from a missing or future planting date.
  const since=last||start;
  if(since&&daysBetween(since,today)>=quietDays&&!items.some(item=>item.plantingId===planting.id)){
   add('record','Take a look and record what you notice',last?`The latest recorded observation is ${last} (${daysBetween(last,today)} days ago). The ${quietDays}-day interval is a journal reminder, not a plant-care requirement.`:`No observation is recorded since the planned start, ${start}. This is a journal reminder; it does not prove the planting happened.`,since);
  }
 }
 const priority={dates:0,finish:1,harvest:2,start:3,end:4,record:5};
 return items.sort((a,b)=>priority[a.kind]-priority[b.kind]||a.date.localeCompare(b.date)||a.plantingId.localeCompare(b.plantingId));
}

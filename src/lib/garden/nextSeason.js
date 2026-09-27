import {measurementDate} from './soilReading.js';
const clone=value=>JSON.parse(JSON.stringify(value));
export function shiftPlanYear(date,delta){
 if(!measurementDate(date))return '';
 const year=Number(date.slice(0,4))+delta;
 if(year<1900||year>2200)return '';
 const candidate=String(year)+date.slice(4);
 return measurementDate(candidate)|| (date.slice(5)==='02-29'?`${year}-02-28`:'');
}
export function seasonPlantings(workspace,year){
 const first=`${year}-01-01`,last=`${year}-12-31`;
 return (workspace.placements||[]).filter(p=>{
  const start=measurementDate(p.planted),end=measurementDate(p.plannedUntil);
  if(start&&start>last||end&&end<first)return false;
  return true;
 });
}
// Add a season to the same garden. Old planting identities and all observations survive.
export function planNextSeason(workspace,{fromYear,toYear,choices},newId=()=>crypto.randomUUID()){
 if(!Number.isInteger(fromYear)||!Number.isInteger(toYear)||fromYear<1900||toYear>2200||toYear!==fromYear+1)throw Error('Choose consecutive planning years from 1900 to 2200.');
 const plans=workspace.property?.seasonPlans||[];
 if(plans.some(p=>p.year===toYear))throw Error('This garden already has a plan for that year. Open its existing season instead.');
 const candidates=new Map(seasonPlantings(workspace,fromYear).map(p=>[p.id,p]));
 if(!Array.isArray(choices)||new Set(choices.map(c=>c.id)).size!==choices.length||choices.some(c=>!candidates.has(c.id)))throw Error('Review each planting once before continuing.');
 const result=clone(workspace),ids=new Set((workspace.placements||[]).map(p=>p.id)),added=[],retained=[];
 const fresh=()=>{const id=newId();if(!id||ids.has(id))throw Error('Could not create a unique planting identity. Retry.');ids.add(id);return id;};
 for(const choice of choices){
  if(!['skip','retain','repeat'].includes(choice.action))throw Error('Choose how each planting continues.');
  if(choice.action==='skip')continue;
  const original=candidates.get(choice.id),source=result.placements.find(p=>p.id===choice.id);
  const actualEnd=(original.observations||[]).some(e=>e?.plantingId===original.id&&e.type==='ended'&&measurementDate(e.date));
  if(choice.action==='retain'){
   if(actualEnd)throw Error('A finished planting cannot continue growing. Repeat it as a new planting instead.');
   source.plannedUntil='';retained.push(source.id);continue;
  }
  const start=measurementDate(choice.start),end=measurementDate(choice.end),sourceEnd=measurementDate(choice.sourceEnd),sourceStart=measurementDate(original.planted);
  if(!start||!end||start.slice(0,4)!==String(toYear)||end<start||Number(end.slice(0,4))>2200)throw Error('Each repeated planting needs a valid next-year start and last day.');
  if(!sourceEnd||sourceEnd>=start||sourceStart&&sourceEnd<sourceStart)throw Error('Set the original planting’s planned last day before its repeated planting starts.');
  if(!original.bedId||(workspace.beds||[]).every(b=>b.id!==original.bedId))throw Error('Place repeated plantings in a named bed first.');
  if(!Number.isFinite(original.x)||!Number.isFinite(original.y)||!original.plantId)throw Error('Resolve the original plant and position before repeating it.');
  source.plannedUntil=sourceEnd;
  const planting={id:fresh(),plantId:original.plantId,bedId:original.bedId,x:original.x,y:original.y,rotation:Number(original.rotation)||0,planted:start,plannedUntil:end,planYear:toYear,health:'planned',notes:'',previousSeasonPlantingId:original.id};
  result.placements.push(planting);added.push(planting.id);
 }
 result.property={...result.property,seasonPlans:[...plans,{year:toYear,fromYear,plantingIds:added,continuingPlantingIds:retained}]};
 return result;
}

export function seasonPreviewDate(workspace,year){
 if(!Number.isInteger(year)||year<1900||year>2200)throw Error('Choose a planning year from 1900 to 2200.');
 return (workspace.placements||[]).map(p=>measurementDate(p.planted)).filter(date=>date&&Number(date.slice(0,4))===year).sort()[0]||`${year}-01-01`;
}

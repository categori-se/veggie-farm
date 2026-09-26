// Observations belong to a stable planting ID within its existing garden workspace.
// Planned dates remain independent: logging an event never rewrites the plan.
export const JOURNAL_TYPES = Object.freeze({seeded:'Sowed seeds',germinated:'Germinated',transplanted:'Transplanted',flowered:'Flowered',fruit_set:'Fruit set',harvested:'Harvested',watering:'Watered',rain:'Rain',soil_test:'Soil test',heat_damage:'Heat damage',pest_seen:'Pest seen',disease_seen:'Possible disease',frost_damage:'Frost damage',bolted:'Bolted',ended:'Finished planting',note:'Note'});
const validDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T12:00:00Z'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;
export function recordPlantingObservation(planting,input,{id=()=>crypto.randomUUID(),now=()=>new Date().toISOString()}={}) {
 if(!planting?.id)throw Error('Choose a planting first.');
 if(!Object.hasOwn(JOURNAL_TYPES,input.type)||!validDate(input.date))throw Error('Choose an event and a valid date.');
 const notes=String(input.notes||'').trim();if(notes.length>2000)throw Error('Keep notes within 2,000 characters.');
 if(input.type==='note'&&!notes)throw Error('Write a short observation.');
 const events=Array.isArray(planting.observations)?planting.observations:[];
 if(events.length>=1000)throw Error('This planting has 1,000 observations. Export its history before starting a new planting.');
 const event={id:id(),plantingId:planting.id,plantId:planting.plantId||null,date:input.date,type:input.type,notes,recordedAt:now(),source:'gardener_observation'};
 if(input.type==='harvested'){
  const supplied=input.quantity!==''&&input.quantity!=null;
  if(supplied){const quantity=Number(input.quantity);if(!Number.isFinite(quantity)||quantity<=0||quantity>1000000||!['count','g','oz','lb','kg'].includes(input.unit))throw Error('Enter a positive harvest quantity and its unit.');if(input.unit==='count'&&!Number.isInteger(quantity))throw Error('A count must be a whole number.');event.quantity=quantity;event.unit=input.unit;}
  if(input.quality){if(!['poor','fair','good','excellent'].includes(input.quality))throw Error('Choose a listed quality.');event.quality=input.quality;}
 }
 return {...planting,observations:[...events,event]};
}
export function plantingOutcome(planting,year) {
 const events=(Array.isArray(planting.observations)?planting.observations:[]).filter(e=>e.plantingId===planting.id&&validDate(e.date)&&(!year||e.date.startsWith(String(year)+'-'))).sort((a,b)=>a.date.localeCompare(b.date)||String(a.recordedAt).localeCompare(String(b.recordedAt)));
 const first=type=>events.find(e=>e.type===type)?.date||null;
 const harvests=events.filter(e=>e.type==='harvested'),weightFactors={g:1,kg:1000,oz:28.349523125,lb:453.59237};let grams=0,count=0,weighed=0,counted=0;
 for(const event of harvests){if(!Number.isFinite(event.quantity)||event.quantity<=0)continue;if(event.unit==='count'){count+=event.quantity;counted++;}else if(weightFactors[event.unit]){grams+=event.quantity*weightFactors[event.unit];weighed++;}}
 return {events,plannedEntry:validDate(planting.planted)?planting.planted:null,plannedEnd:validDate(planting.plannedUntil)?planting.plannedUntil:null,actualSowing:first('seeded'),actualTransplant:first('transplanted'),firstHarvest:harvests[0]?.date||null,lastHarvest:harvests.at(-1)?.date||null,actualEnd:first('ended'),harvestEvents:harvests.length,grams:weighed?grams:null,count:counted?count:null,unmeasuredHarvests:harvests.length-weighed-counted};
}
export function gardenJourney(workspace,year) {
 const beds=new Map((workspace.beds||[]).map(b=>[b.id,b]));
 const plantings=(workspace.placements||[]).map(p=>({planting:p,bed:beds.get(p.bedId)||null,outcome:plantingOutcome(p,year)}));
 const events=plantings.flatMap(({planting,bed,outcome})=>outcome.events.map(event=>({...event,gardenId:workspace.id,plantId:event.plantId||planting.plantId,bedId:bed?.id||null,bedName:bed?.name||'Outside a named bed'}))).sort((a,b)=>b.date.localeCompare(a.date)||String(b.recordedAt).localeCompare(String(a.recordedAt)));
 return {gardenId:workspace.id,beds:[...beds.values()],plantings,events,year};
}

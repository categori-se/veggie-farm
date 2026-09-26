import {recordPlantingObservation} from './plantingJournal.js';
// Explicit association, not a guessed match or a destructive migration.
export function linkNotebookObservation(workspace,plantingId,observation,revision) {
 if(!observation||typeof observation.id!=='string'||!observation.id||observation.id.length>160)throw Error('Choose a saved notebook observation.');
 if((workspace.placements||[]).some(p=>(p.observations||[]).some(e=>e.notebookOrigin?.id===observation.id)))throw Error('This notebook observation is already linked in this garden. Unlink it before choosing another planting.');
 const index=workspace.placements.findIndex(p=>p.id===plantingId);if(index<0)throw Error('Choose a planting in this garden.');
 const source=workspace.placements[index];const next=recordPlantingObservation(source,{type:observation.type,date:observation.date,notes:observation.notes});
 const event=next.observations.at(-1);event.source='linked_notebook_observation';event.notebookOrigin={id:observation.id,revision:typeof revision==='string'?revision:null};
 for(const [key,max] of Object.entries({crop:100,variety:100,bed:80,plantingId:160,interpretation:2000,action:2000,createdAt:80}))event.notebookOrigin[key]=String(observation[key]||'').slice(0,max);
 return {...workspace,placements:workspace.placements.map((p,i)=>i===index?next:p)};
}
export function unlinkNotebookObservation(workspace,plantingId,observationId) {
 const placement=workspace.placements.find(p=>p.id===plantingId);if(!placement?.observations?.some(e=>e.notebookOrigin?.id===observationId))throw Error('This link is no longer present. Reload the garden.');
 return {...workspace,placements:workspace.placements.map(p=>p.id===plantingId?{...p,observations:p.observations.filter(e=>e.notebookOrigin?.id!==observationId)}:p)};
}
export function linkNotebookProfile(workspace,profile,revision) {
 if(!profile||typeof profile!=='object'||Array.isArray(profile))throw Error('No saved notebook profile is available.');
 if(workspace.property?.gardenContext)throw Error('This garden already has context. Remove its current Notebook association before replacing it.');
 const text=(value,max)=>typeof value==='string'?value.slice(0,max):'';
 const number=(value,min,max)=>typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max?value:null;
 const monthDay=value=>typeof value==='string'&&/^\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse('2000-'+value+'T12:00:00Z'))&&new Date('2000-'+value+'T12:00:00Z').toISOString().slice(5,10)===value?value:null;
 const context={source:'linked_notebook_profile',revision:typeof revision==='string'?revision:null,gardenName:text(profile.gardenName,80),locationLabel:text(profile.locationLabel,100),hardinessZone:text(profile.hardinessZone,4),sunHours:number(profile.sunHours,0,24),soilTemperatureF:number(profile.soilTemperatureF,20,110),soilTemperatureMeasuredOn:text(profile.soilTemperatureMeasuredOn,10),irrigation:text(profile.irrigation,80),microclimateNotes:text(profile.microclimateNotes,1000),climate:{lastFrostMonthDay:monthDay(profile.climate?.lastFrostMonthDay),firstFrostMonthDay:monthDay(profile.climate?.firstFrostMonthDay)},soil:{texture:text(profile.soil?.userOverride?.texture,60),drainage:text(profile.soil?.userOverride?.drainage,30)}};
 return {...workspace,property:{...workspace.property,gardenContext:context}};
}
export function unlinkNotebookProfile(workspace){if(workspace.property?.gardenContext?.source!=='linked_notebook_profile')throw Error('There is no linked Notebook profile to remove.');const property={...workspace.property};delete property.gardenContext;return {...workspace,property};}

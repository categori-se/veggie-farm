import {linkSoilReport,unlinkSoilReport} from './gardenSoilHistory.js';
import {saveSeasonReflection} from './seasonReflection.js';
import {linkNotebookObservation,unlinkNotebookObservation,linkNotebookProfile,unlinkNotebookProfile} from './notebookLink.js';
import {accountGardenPayload,isPublicDemo} from './accountGardens.js';
import {parsePlannerBackup} from './plannerBackup.js';
import {recordPlantingObservation} from './plantingJournal.js';
// One explicitly selected account save; never read anonymous or another owner's drafts.
export function accountGardenJournal({client,owner}) {
 let sessionOwner=null,record=null,gardenId=null,pending=false,generation=0,conflicted=false,notebook=null;
 const assertOwner=()=>{if(!sessionOwner||owner()!==sessionOwner){clear();throw Error('Your account changed. Reload your garden before continuing.');}};
 function clear(){generation++;sessionOwner=null;record=null;gardenId=null;conflicted=false;notebook=null;}
 async function load(id){const current=owner();if(!current)throw Error('Sign in to open a saved garden.');const request=++generation;record=null;gardenId=null;notebook=null;sessionOwner=current;const value=await client.load(id);if(request!==generation||owner()!==current)throw Error('Your account changed. Reload your garden before continuing.');const payload=accountGardenPayload(parsePlannerBackup(JSON.stringify(value.payload)));record={...value,payload};conflicted=false;return payload.parcels.map(g=>({id:g.id,name:g.name||g.property?.name||'Garden'}));}
 function select(id){assertOwner();if(pending)throw Error('Wait for the observation to finish saving.');if(!record?.payload.parcels.some(g=>g.id===id&&!isPublicDemo(g)))throw Error('Choose a garden from this account save.');gardenId=id;}
 function workspace(){assertOwner();const found=record?.payload.parcels.find(g=>g.id===gardenId);if(!found)throw Error('Choose a saved garden.');return structuredClone(found);}
 function plants(){assertOwner();return structuredClone(record?.payload.plants||[]);}
 function backup(){assertOwner();return structuredClone(record?.payload);}
 async function readNotebook(){
  assertOwner();const request=generation,current=sessionOwner,result=await client.loadNotebook();if(request!==generation||owner()!==current)throw Error('Your account changed. Reload before linking notes.');
  notebook={soilTests:structuredClone(Array.isArray(result.payload?.records?.soilTests)?result.payload.records.soilTests:[]),revision:result.revision,profile:structuredClone(result.payload?.profile||null),observations:Array.isArray(result.payload?.observations)?structuredClone(result.payload.observations):[]};return structuredClone(notebook);
 }
 async function change(mutate){
  assertOwner();if(pending)throw Error('An observation is already saving.');if(conflicted)throw Error('This save changed in another tab. Reload the account garden before retrying.');
  const source=workspace(),payload=structuredClone(record.payload),index=payload.parcels.findIndex(g=>g.id===gardenId);payload.parcels[index]=mutate(source);
  const next=accountGardenPayload(payload),currentOwner=sessionOwner,request=generation,save=record;pending=true;
  try{const response=await client.update(save.id,save.revision,save.name,next);if(generation!==request||owner()!==currentOwner)throw Error('Your account changed while saving. Reopen the correct account to check its history.');record={...save,payload:next,revision:response.revision,updatedAt:response.updatedAt};}
  catch(error){if(error.code==='revision_conflict'){conflicted=true;throw Error('This save changed in another tab. Your observation was not saved. Copy the note, reload the account garden and retry.');}throw error;}
  finally{pending=false;}
 }
 async function linkSoil(bedId,id){assertOwner();const report=notebook?.soilTests.find(r=>r.id===id);if(!report)throw Error('Load and choose a saved Notebook soil report.');return change(source=>linkSoilReport(source,bedId,report,notebook.revision));}
 async function unlinkSoil(id){return change(source=>unlinkSoilReport(source,id));}
 async function reflect(year,input){return change(source=>({...source,property:saveSeasonReflection(source.property,year,input)}));}
 async function log(plantingId,input){return change(source=>{const index=source.placements.findIndex(p=>p.id===plantingId);if(index<0)throw Error('Choose a planting in the selected garden.');source.placements[index]=recordPlantingObservation(source.placements[index],input);return source;});}
 async function link(plantingId,observationId){assertOwner();const observation=notebook?.observations.find(o=>o.id===observationId);if(!observation)throw Error('Load and choose a saved notebook observation first.');if(record.payload.parcels.some(g=>(g.placements||[]).some(p=>(p.observations||[]).some(e=>e.notebookOrigin?.id===observationId))))throw Error('This observation is already linked in this account save. Unlink the existing association before moving it.');return change(source=>linkNotebookObservation(source,plantingId,observation,notebook.revision));}
 async function unlink(plantingId,observationId){return change(source=>unlinkNotebookObservation(source,plantingId,observationId));}
 async function linkProfile(){assertOwner();return change(source=>linkNotebookProfile(source,notebook?.profile,notebook?.revision));}
 async function unlinkProfile(){return change(unlinkNotebookProfile);}
 return {load,select,workspace,plants,backup,log,linkSoil,unlinkSoil,reflect,readNotebook,link,unlink,linkProfile,unlinkProfile,clear};
}

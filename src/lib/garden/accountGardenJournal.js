import {accountGardenPayload,isPublicDemo} from './accountGardens.js';
import {parsePlannerBackup} from './plannerBackup.js';
import {recordPlantingObservation} from './plantingJournal.js';
// One explicitly selected account save; never read anonymous or another owner's drafts.
export function accountGardenJournal({client,owner}) {
 let sessionOwner=null,record=null,gardenId=null,pending=false,generation=0,conflicted=false;
 const assertOwner=()=>{if(!sessionOwner||owner()!==sessionOwner){clear();throw Error('Your account changed. Reload your garden before continuing.');}};
 function clear(){generation++;sessionOwner=null;record=null;gardenId=null;conflicted=false;}
 async function load(id){const current=owner();if(!current)throw Error('Sign in to open a saved garden.');const request=++generation;record=null;gardenId=null;sessionOwner=current;const value=await client.load(id);if(request!==generation||owner()!==current)throw Error('Your account changed. Reload your garden before continuing.');const payload=accountGardenPayload(parsePlannerBackup(JSON.stringify(value.payload)));record={...value,payload};conflicted=false;return payload.parcels.map(g=>({id:g.id,name:g.name||g.property?.name||'Garden'}));}
 function select(id){assertOwner();if(pending)throw Error('Wait for the observation to finish saving.');if(!record?.payload.parcels.some(g=>g.id===id&&!isPublicDemo(g)))throw Error('Choose a garden from this account save.');gardenId=id;}
 function workspace(){assertOwner();const found=record?.payload.parcels.find(g=>g.id===gardenId);if(!found)throw Error('Choose a saved garden.');return structuredClone(found);}
 function plants(){assertOwner();return structuredClone(record?.payload.plants||[]);}
 function backup(){assertOwner();return structuredClone(record?.payload);}
 async function log(plantingId,input){
  assertOwner();if(pending)throw Error('An observation is already saving.');if(conflicted)throw Error('This save changed in another tab. Reload the account garden before retrying.');
  const source=workspace(),index=source.placements.findIndex(p=>p.id===plantingId);if(index<0)throw Error('Choose a planting in the selected garden.');
  const payload=structuredClone(record.payload),target=payload.parcels.find(g=>g.id===gardenId);target.placements[index]=recordPlantingObservation(target.placements[index],input);
  const next=accountGardenPayload(payload),currentOwner=sessionOwner,request=generation,save=record;pending=true;
  try{const response=await client.update(save.id,save.revision,save.name,next);if(generation!==request||owner()!==currentOwner)throw Error('Your account changed while saving. Reopen the correct account to check its history.');record={...save,payload:next,revision:response.revision,updatedAt:response.updatedAt};}
  catch(error){if(error.code==='revision_conflict'){conflicted=true;throw Error('This save changed in another tab. Your observation was not saved. Copy the note, reload the account garden and retry.');}throw error;}
  finally{pending=false;}
 }
 return {load,select,workspace,plants,backup,log,clear};
}

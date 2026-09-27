import {parsePlannerBackup} from './plannerBackup.js';
import {accountGardenPayload,isPublicDemo} from './accountGardens.js';
// Activate the requested garden and its matching top-level workspace together.
export function accountGardenForPlanning(payload,gardenId,bedId=null) {
 const candidate=parsePlannerBackup(JSON.stringify(payload));
 if(!candidate.parcels.some(g=>g.id===gardenId&&!isPublicDemo(g)))throw Object.assign(new Error('The linked garden is not in this account copy.'),{code:'missing_linked_garden'});
 if(bedId){const garden=candidate.parcels.find(g=>g.id===gardenId);if(!garden.beds?.some(b=>b.id===bedId))throw Object.assign(new Error('The linked bed is no longer in this garden.'),{code:'missing_linked_bed'});garden.activeBedId=bedId;}
 return accountGardenPayload({...candidate,activeParcelId:gardenId});
}

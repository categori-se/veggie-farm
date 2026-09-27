import {parsePlannerBackup} from './plannerBackup.js';
import {accountGardenPayload,isPublicDemo} from './accountGardens.js';
// Activate the requested garden and its matching top-level workspace together.
export function accountGardenForPlanning(payload,gardenId) {
 const candidate=parsePlannerBackup(JSON.stringify(payload));
 if(!candidate.parcels.some(g=>g.id===gardenId&&!isPublicDemo(g)))throw Object.assign(new Error('The linked garden is not in this account copy.'),{code:'missing_linked_garden'});
 return accountGardenPayload({...candidate,activeParcelId:gardenId});
}

import {measurementDate} from './soilReading.js';
// These are gardener-entered plan bounds, never inferred harvest or growth dates.
export function plannedOccupancy(placement, date) {
 const start=measurementDate(placement?.planted),end=measurementDate(placement?.plannedUntil);
 if(!measurementDate(date))return {visible:true,status:'all',start,end};
 if((placement?.planted&&!start)||(placement?.plannedUntil&&!end)||(start&&end&&end<start))return {visible:true,status:'invalid',start,end};
 if(!start&&!end)return {visible:true,status:'undated',start,end};
 if(start&&date<start)return {visible:false,status:'before',start,end};
 if(end&&date>end)return {visible:false,status:'after',start,end};
 return {visible:true,status:start&&end?'planned':'open-ended',start,end};
}
export function visiblePlannedPlacements(placements,date){return (placements||[]).filter(p=>plannedOccupancy(p,date).visible);}

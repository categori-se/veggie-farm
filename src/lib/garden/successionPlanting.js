import {measurementDate} from './soilReading.js';
import {duplicatePlanting} from './duplicatePlanting.js';
// Inclusive plan intervals. Missing/invalid dates never prove a space is free.
export function plannedOccupanciesOverlap(a,b) {
  const bounds=p=>{const start=measurementDate(p?.planted),end=measurementDate(p?.plannedUntil);return (p?.planted&&!start)||(p?.plannedUntil&&!end)||(start&&end&&start>end)?null:{start,end};};
  const x=bounds(a),y=bounds(b);if(!x||!y)return true;
  return !(x.end&&y.start&&x.end<y.start || y.end&&x.start&&y.end<x.start);
}
export function nextPlantingDate(source) {
  const end=measurementDate(source?.plannedUntil);if(!end)return '';
  return new Date(Date.parse(end+'T12:00:00Z')+86400000).toISOString().slice(0,10);
}
export function successionPlanting({source,bed,plants,placements,id,plantId,start,end=''}) {
  const last=measurementDate(source?.plannedUntil),first=measurementDate(start),until=end?measurementDate(end):null;
  if(source?.planted&&(!measurementDate(source.planted)||source.planted>last))throw Error('Correct the original planting’s dates first.');
  if(!last)throw Error('Enter the original planting’s planned last day before adding its next crop.');
  if(!first||first<=last||end&&(!until||until<first))throw Error('Choose a start after the original planting’s last day and an end on or after the new start.');
  if(Number(first.slice(0,4))<1900||Number(first.slice(0,4))>2200||until&&Number(until.slice(0,4))>2200)throw Error('Choose planning dates from 1900 to 2200.');
  if(!plants.some(p=>p.id===plantId)||placements.some(p=>p.id===id))throw Error('Choose an available plant and a new planting identity.');
  const plan={bedId:source.bedId,plantId,x:source.x,y:source.y,rotation:source.rotation,planted:first,plannedUntil:until||'',planYear:Number(first.slice(0,4))};
  const occupied=placements.filter(p=>plannedOccupanciesOverlap(p,plan));
  const copy=duplicatePlanting({source:plan,bed,plants,placements:occupied,id,preferSourcePosition:true});
  return {...copy,afterPlantingId:source.id};
}

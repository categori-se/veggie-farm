import {measurementDate} from './soilReading.js';
// A gardener-authored geometric scenario, never an inferred biological growth curve.
export function plannedSize(placement, previewDate = null) {
 const value=placement?.sizeScenario;
 if(!value)return {status:'missing',scale:1};
 const start=measurementDate(value.startDate),full=measurementDate(value.fullSizeDate);
 if(!start||!full||full<=start||!Number.isFinite(value.startPercent)||value.startPercent<5||value.startPercent>100||typeof value.reference!=='string'||!value.reference.trim()||value.reference.length>300||value.plantId!==placement.plantId)return {status:'invalid',scale:1};
 if(!measurementDate(previewDate))return {status:'off',scale:1};
 const progress=Math.max(0,Math.min(1,(Date.parse(previewDate)-Date.parse(start))/(Date.parse(full)-Date.parse(start))));
 return {status:previewDate<start?'before':previewDate>=full?'full':'expanding',scale:(value.startPercent+(100-value.startPercent)*progress)/100,start,full,reference:value.reference.trim()};
}

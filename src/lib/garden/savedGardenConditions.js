import {measurementDate,soilReadingContext} from './soilReading.js';
// Prefer an explicitly selected garden; never borrow another garden's missing conditions.
export function savedGardenConditions(selection,notebook,today,bedId=''){
 if(!measurementDate(today))throw Error('Choose a valid context date.');
 const selected=selection?.workspace,profile=selected?selected.property?.gardenContext:selection?null:notebook;
 const year=today.slice(0,4),date=value=>typeof value==='string'?measurementDate(`${year}-${value}`):null;
 const bed=selected?.beds?.find(b=>b.id===bedId);
 const bedProfile=bed?selected.property?.bedConditions?.[bed.id]:null;
 const local=bedId?bedProfile:profile;
 const reading=soilReadingContext(local,today);
 const temperature=reading.status==='today'&&reading.value>=35&&reading.value<=90?reading.value:null;
 return {name:selected?.name||selected?.property?.name||profile?.gardenName||'',source:selected?'selected-garden':profile?'notebook':'starter',
  lastFrostDate:profile?date(profile.climate?.lastFrostMonthDay):selected?null:`${year}-05-10`,
  firstFrostDate:profile?date(profile.climate?.firstFrostMonthDay):selected?null:`${year}-10-15`,
  bedName:bed?.name||'',bedId:bed?.id||null,sunHours:typeof local?.sunHours==='number'&&Number.isFinite(local.sunHours)&&local.sunHours>=0&&local.sunHours<=24?local.sunHours:null,soil:local?.soil||null,
  soilTemperatureF:temperature,soilDate:temperature!==null?reading.date:null,soilStatus:reading.status};
}
export function validGuidanceDates(date,last,first){return Boolean(measurementDate(date)&&measurementDate(last)&&measurementDate(first)&&last<first);}

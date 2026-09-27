import {measurementDate,soilReadingContext} from './soilReading.js';
// Prefer an explicitly selected garden; never borrow another garden's missing conditions.
export function savedGardenConditions(selection,notebook,today){
 if(!measurementDate(today))throw Error('Choose a valid context date.');
 const selected=selection?.workspace,profile=selected?selected.property?.gardenContext:selection?null:notebook;
 const year=today.slice(0,4),date=value=>typeof value==='string'?measurementDate(`${year}-${value}`):null;
 const reading=soilReadingContext(profile,today);
 const temperature=reading.status==='today'&&reading.value>=35&&reading.value<=90?reading.value:null;
 return {name:selected?.name||selected?.property?.name||profile?.gardenName||'',source:selected?'selected-garden':profile?'notebook':'starter',
  lastFrostDate:profile?date(profile.climate?.lastFrostMonthDay):selected?null:`${year}-05-10`,
  firstFrostDate:profile?date(profile.climate?.firstFrostMonthDay):selected?null:`${year}-10-15`,
  soilTemperatureF:temperature,soilDate:temperature!==null?reading.date:null,soilStatus:reading.status};
}
export function validGuidanceDates(date,last,first){return Boolean(measurementDate(date)&&measurementDate(last)&&measurementDate(first)&&last<first);}

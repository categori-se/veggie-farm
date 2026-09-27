import {measurementDate} from './soilReading.js';
// Calendar navigation changes the preview only; it never rewrites plan dates.
export function previewCalendarDate(value, {year,month}={}) {
  if(!measurementDate(value))return null;
  const [oldYear,oldMonth,day]=value.split('-').map(Number);
  year=year??oldYear;month=month??oldMonth;
  if(!Number.isInteger(year)||year<1900||year>2200||!Number.isInteger(month)||month<1||month>12)return null;
  const last=new Date(Date.UTC(year,month,0)).getUTCDate();
  return `${year}-${String(month).padStart(2,'0')}-${String(Math.min(day,last)).padStart(2,'0')}`;
}

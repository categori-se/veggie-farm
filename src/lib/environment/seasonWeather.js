import {parseGardenDate} from '../recommendations/gardenDecisions.js';
const valid = d => Number.isFinite(d?.low) && Number.isFinite(d?.high) && d.low <= d.high;
const midpoint = d => (d.low+d.high)/2;
export function compareSeasonWeather(station, year, month, baselineYears = [2023,2024,2025]) {
  year = Number(year); month = Number(month);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12 || baselineYears.includes(year)) return {error:'Choose a comparison year outside the baseline and a valid month.'};
  const years = [...new Set(baselineYears)];
  const days = new Map((station?.days ?? []).filter(d => parseGardenDate(d.date)).map(d => [d.date,d]));
  const prefix = `${year}-${String(month).padStart(2,'0')}`;
  const totalDays = new Date(Date.UTC(year,month,0)).getUTCDate();
  const rows=[];
  const normals=new Map((station?.normals??[]).map(d=>[d.monthDay,d]));
  let rainSum=0,rainContinuous=true;
  for(let day=1;day<=totalDays;day++) {
    const suffix=`${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const current=days.get(`${year}-${suffix}`);
    const previous=years.map(y=>days.get(`${y}-${suffix}`));
    const complete=valid(current) && previous.length>0 && previous.every(valid);
    const normal=normals.get(suffix),normalMidpoint=valid(normal)?midpoint(normal):null;
    const rain=Number.isFinite(current?.rain)&&current.rain>=0?current.rain:null;
    if(rain===null)rainContinuous=false;else rainSum+=rain;
    rows.push({day,date:`${prefix}-${String(day).padStart(2,'0')}`,current:valid(current)?midpoint(current):null,baseline:previous.length && previous.every(valid)?previous.reduce((sum,d)=>sum+midpoint(d),0)/previous.length:null,low:valid(current)?current.low:null,matched:complete,
      normal:normalMidpoint,departure:valid(current)&&normalMidpoint!==null?midpoint(current)-normalMidpoint:null,
      rain,rainTrace:current?.rainTrace===true,rainAccumulated:rainContinuous?rainSum:null});
  }
  const matched=rows.filter(d=>d.matched);
  const difference=matched.length?matched.reduce((sum,d)=>sum+d.current-d.baseline,0)/matched.length:null;
  return {rows,year,month,baselineYears:years,totalDays,matchedDays:matched.length,observedDays:rows.filter(d=>d.current!==null).length,difference,freezeDays:rows.filter(d=>d.low!==null && d.low<=32).length,rainDays:rows.filter(d=>d.rain!==null).length,rainObservedTotal:rainSum,normalDays:rows.filter(d=>d.normal!==null).length,latestDate:(station?.days ?? []).filter(valid).map(d=>d.date).sort().at(-1)??null};
}

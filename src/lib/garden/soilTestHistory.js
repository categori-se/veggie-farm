import {measurementDate} from './soilReading.js';
// Only explicitly transcribed percentages are charted. Free-text nutrient
// results retain their units and laboratory interpretation without conversion.
export function organicMatterPercent(value) {
  const match=String(value??'').trim().match(/^(\d+(?:\.\d+)?)\s*%$/);
  if(!match)return null;
  const number=Number(match[1]);return number<=100?number:null;
}
export function soilHistoryRows(records=[]) {
 return records.filter(r=>r&&typeof r==='object').map(r=>({...r,
  date:measurementDate(r.date),bed:String(r.bed||'Area not recorded'),laboratory:String(r.laboratory||'Lab not recorded'),
  ph:typeof r.ph==='number'&&Number.isFinite(r.ph)&&r.ph>=0&&r.ph<=14?r.ph:null,
  organicMatterPercent:organicMatterPercent(r.organicMatter)
 })).sort((a,b)=>(a.date||'').localeCompare(b.date||''));
}
export function soilHistoryDomain(rows,trait,reference=null){
 const values=rows.map(r=>r[trait]).filter(v=>typeof v==='number'&&Number.isFinite(v));
 const ceiling=trait==='ph'?14:100;
 if(trait==='ph'&&reference&&Number.isFinite(reference.min)&&Number.isFinite(reference.max)&&reference.min>=0&&reference.max<=14&&reference.min<=reference.max)values.push(reference.min,reference.max);
 if(!values.length)return [0,ceiling];
 const low=Math.max(0,Math.floor(Math.min(...values)-1)),high=Math.min(ceiling,Math.ceil(Math.max(...values)+1));
 return [low,high];
}
export function soilHistoryPoints(rows,trait,reference=null){
 const values=rows.filter(r=>r.date&&r[trait]!==null&&Number.isFinite(r[trait]));
 if(!values.length)return [];
 const min=Date.parse(values[0].date+'T12:00:00Z'),max=Date.parse(values.at(-1).date+'T12:00:00Z');
 const [low,top]=soilHistoryDomain(values,trait,reference);
 return values.map(r=>({date:r.date,value:r[trait],x:max===min?270:45+450*(Date.parse(r.date+'T12:00:00Z')-min)/(max-min),y:150-125*(r[trait]-low)/(top-low)}));
}

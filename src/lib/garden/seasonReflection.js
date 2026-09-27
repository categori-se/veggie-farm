export const REFLECTION_FIELDS=Object.freeze({worked:'What worked?',change:'What would you change?',next:'What will you try next year?'});
const validYear=year=>Number.isInteger(Number(year))&&Number(year)>=1900&&Number(year)<=2200;
export function seasonReflection(property,year){
 if(!validYear(year))return null;
 const value=property?.seasonReflections?.[String(Number(year))];
 if(!value||value.year!==Number(year)||value.source!=='gardener_reflection')return null;
 const result={year:Number(year)};for(const field of Object.keys(REFLECTION_FIELDS))result[field]=typeof value[field]==='string'?value[field].slice(0,2000):'';
 return result;
}
export function saveSeasonReflection(property,year,input,{now=()=>new Date().toISOString()}={}){
 if(!validYear(year))throw Error('Choose a year from 1900 to 2200.');
 const entry={year:Number(year),source:'gardener_reflection',updatedAt:now()};
 for(const field of Object.keys(REFLECTION_FIELDS)){const text=String(input?.[field]??'').trim();if(text.length>2000)throw Error('Keep each reflection within 2,000 characters.');entry[field]=text;}
 const next={...structuredClone(property||{}),seasonReflections:{...structuredClone(property?.seasonReflections||{})}};
 if(Object.keys(REFLECTION_FIELDS).some(field=>entry[field]))next.seasonReflections[String(entry.year)]=entry;
 else delete next.seasonReflections[String(entry.year)];
 return next;
}

import {measurementDate} from './soilReading.js';
export function saveBedConditions(workspace,bedId,input,now=new Date().toISOString()) {
 if(!workspace?.beds?.some(b=>b.id===bedId))throw Error('Choose a bed in this garden.');
 const number=(value,min,max)=>{if(value==null||String(value).trim()==='')return null;const n=Number(value);if(!Number.isFinite(n)||n<min||n>max)throw Error(`Enter a number between ${min} and ${max}, or leave it blank.`);return n;};
 const sunHours=number(input.sunHours,0,24),soilTemperatureF=number(input.soilTemperatureF,20,110);
 const measuredOn=input.soilTemperatureMeasuredOn||'';
 if(measuredOn&&!measurementDate(measuredOn))throw Error('Enter a real soil measurement date.');
 const drainage=input.drainage||'';if(!['','slow','moderate','fast'].includes(drainage))throw Error('Choose a listed drainage rate.');
 const texture=String(input.texture||'').trim();if(texture.length>120)throw Error('Keep the soil description under 120 characters.');
 const conditions={source:'gardener_recorded',updatedAt:now,sunHours,soilTemperatureF,soilTemperatureMeasuredOn:soilTemperatureF===null?null:measuredOn||null,soil:{texture:texture||null,drainage:drainage||null}};
 return {...workspace,property:{...workspace.property,bedConditions:{...workspace.property?.bedConditions,[bedId]:conditions}}};
}

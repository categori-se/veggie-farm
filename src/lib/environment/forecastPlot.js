// Draw only supplied hourly values. Missing readings and time gaps break lines.
export function forecastPlot(periods) {
 const rows=(periods||[]).slice(0,48).map(p=>({time:Date.parse(p.startTime),value:p.temperatureF})).filter(p=>Number.isFinite(p.time));
 const values=rows.map(r=>r.value).filter(v=>typeof v==='number'&&Number.isFinite(v));
 if(!rows.length||!values.length)return {segments:[],coverage:0,total:rows.length};
 const start=Math.min(...rows.map(r=>r.time)),end=Math.max(...rows.map(r=>r.time));
 const low=Math.min(28,...values)-3,high=Math.max(36,...values)+3;
 const x=t=>40+(t-start)/Math.max(3600000,end-start)*510,y=v=>130-(v-low)/(high-low)*108;
 const segments=[];let line=[],last=null;
 for(const row of rows){
  if(typeof row.value!=='number'||!Number.isFinite(row.value)||last!=null&&row.time-last>5400000){if(line.length)segments.push(line);line=[];}
  if(typeof row.value==='number'&&Number.isFinite(row.value))line.push([x(row.time),y(row.value)]);
  last=row.time;
 }
 if(line.length)segments.push(line);
 return {segments,coverage:values.length,total:rows.length,freezeY:y(32),start,end,low,high};
}

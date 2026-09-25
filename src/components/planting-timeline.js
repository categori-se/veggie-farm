import {localDay} from '../lib/garden/gardenRecords.js';
const ns='http://www.w3.org/2000/svg';
const node=(tag,attrs={})=>{const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);return n;};

// These are dated source windows, not calculated forecasts or a user's plan.
// Keep each method and regional assertion separate, even when bands overlap.
export function plantingTimeline(crops,dataset,{compact=false}={}){
 const evidence=Array.isArray(dataset)?dataset:dataset?.evidence??[];
 const byCrop=new Map(crops.map(c=>[c.slug,c]));
 const windows=evidence.filter(e=>byCrop.has(e.cropSlug)&&e.trait==='planting_window'&&/^\d{2}-\d{2}$/.test(e.value?.startMonthDay??'')&&/^\d{2}-\d{2}$/.test(e.value?.endMonthDay??''));
 const root=document.createElement('section');root.className='regional-planting-timeline';root.setAttribute('aria-label','Regional planting windows');
 if(!windows.length){root.textContent='No dated regional planting window is recorded for this crop. Use the growing guide and your local conditions.';return root;}
 const title=document.createElement(compact?'h3':'h2');title.textContent='Regional planting windows';root.append(title);
 const note=document.createElement('p');note.textContent=`Source regions: ${[...new Set(windows.map(e=>e.geographicScope?.referenceLocation||'not recorded'))].join('; ')}. These are reference calendar dates, not a forecast for your garden. Check each row’s source and method, then use local frost and soil observations.`;root.append(note);
 const control=document.createElement('label');control.textContent='Show method ';const select=document.createElement('select');select.setAttribute('aria-label','Planting-window method');for(const [value,label] of [['all','All methods'],['direct_sow','Direct sow'],['transplant','Transplant']]){const o=document.createElement('option');o.value=value;o.textContent=label;select.append(o);}control.append(select);if(!compact)root.append(control);
 const output=document.createElement('div');root.append(output);
 const year=Number(localDay().slice(0,4)),start=Date.UTC(year,0,1),days=(Date.UTC(year+1,0,1)-start)/86400000;
 const day=md=>(Date.parse(`${year}-${md}T00:00:00Z`)-start)/86400000;
 const x=d=>205+d/days*680;
 function render(){
  const records=windows.filter(e=>select.value==='all'||e.method===select.value);output.replaceChildren();
  if(!records.length){output.textContent='No dated windows for this method in the source collection.';return;}
  const wrap=document.createElement('div');wrap.className='regional-planting-timeline-scroll';wrap.tabIndex=0;wrap.setAttribute('aria-label','Planting-window chart; scroll horizontally on small screens');
  const svg=node('svg',{viewBox:`0 0 900 ${50+records.length*34}`,role:'img','aria-label':`${records.length} regional planting windows. Exact dates, method, region and sources follow in the table.`});
  for(let m=0;m<12;m++){const pos=x((Date.UTC(year,m,1)-start)/86400000);svg.append(node('line',{x1:pos,x2:pos,y1:24,y2:40+records.length*34,stroke:'var(--line)'}));const t=node('text',{x:pos+4,y:17,fill:'currentColor','font-size':11});t.textContent=new Date(Date.UTC(year,m,1)).toLocaleString('en',{month:'short',timeZone:'UTC'});svg.append(t);}
  records.forEach((e,i)=>{const y=38+i*34,label=node('text',{x:4,y:y+11,fill:'currentColor','font-size':12});label.textContent=`${byCrop.get(e.cropSlug).name} · ${(e.method||'plant').replaceAll('_',' ')}`;svg.append(label);
   const a=day(e.value.startMonthDay),b=day(e.value.endMonthDay)+1,segments=b>=a?[[a,b]]:[[a,days],[0,b]];
   for(const [from,to] of segments){const bar=node('rect',{x:x(from),y,width:Math.max(2,(to-from)/days*680),height:16,rx:2,fill:e.method==='transplant'?'var(--soil)':'var(--green)'});const tooltip=node('title');tooltip.textContent=`${e.value.startMonthDay}–${e.value.endMonthDay} · ${e.geographicScope?.referenceLocation??'Region not recorded'}`;bar.append(tooltip);svg.append(bar);}
  });
  const today=x(day(localDay().slice(5)));svg.append(node('line',{x1:today,x2:today,y1:23,y2:40+records.length*34,stroke:'currentColor','stroke-width':1.5,'stroke-dasharray':'3 3'}));const mark=node('text',{x:Math.min(860,today+3),y:47+records.length*34,fill:'currentColor','font-size':11});mark.textContent='Today';svg.append(mark);wrap.append(svg);output.append(wrap);
  const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent='Exact dates, regions and sources';details.append(summary);const list=document.createElement('ul');for(const e of records){const li=document.createElement('li'),a=document.createElement('a');a.href=e.sourceUrl;a.textContent=`${byCrop.get(e.cropSlug).name}: ${e.value.startMonthDay}–${e.value.endMonthDay}, ${(e.method||'plant').replaceAll('_',' ')}`;li.append(a,document.createTextNode(` · ${e.geographicScope?.referenceLocation??'Region not recorded'} · retrieved ${e.retrievedAt}. ${e.geographicScope?.sourceNote??''}`));list.append(li);}details.append(list);output.append(details);
 }
 select.addEventListener('change',render);render();return root;
}

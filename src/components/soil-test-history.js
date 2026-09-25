import {gardenSnapshot} from '../lib/garden/gardenRecords.js';
import {notebookOwner} from '../lib/account/notebookStorage.js';
import {soilHistoryRows,soilHistoryPoints,soilHistoryDomain} from '../lib/garden/soilTestHistory.js';
const el=(tag,text)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;return n;};
const svg=(tag,attrs={})=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);return n;};
export function soilTestHistory({invalidation,phReferences=[]}={}){
 const root=el('section');root.className='soil-test-history';root.setAttribute('aria-label','Soil results over time');
 root.append(el('h2','Soil results over time'));
 const status=el('p');status.setAttribute('role','status');root.append(status);
 const label=el('label','Sample area and laboratory '),select=el('select');select.setAttribute('aria-label','Soil history sample group');label.append(select);root.append(label);
 const referenceLabel=el('label','Compare pH with a crop reference '),referenceSelect=el('select');referenceSelect.setAttribute('aria-label','Crop pH reference');referenceLabel.append(referenceSelect);root.append(referenceLabel);
 for(const [value,text] of [['','No crop overlay'],...phReferences.map(r=>[r.id,`${r.label} · ${r.region}`])]){const o=el('option',text);o.value=value;referenceSelect.append(o);}
 const body=el('div');root.append(body);let owner,group='';
 const selectedReference=()=>phReferences.find(r=>r.id===referenceSelect.value)||null;
 const key=r=>JSON.stringify([r.bed,r.laboratory]);
 function chart(rows,trait,title){
  const figure=el('figure'),caption=el('figcaption',title);figure.append(caption);
  const reference=trait==='ph'?selectedReference():null;
  const points=soilHistoryPoints(rows,trait,reference);
  if(!points.length){figure.append(el('p',trait==='ph'?'No dated numeric pH results.':'No dated organic-matter results entered as a percentage (for example, 3.1%).'));return figure;}
  const graph=svg('svg',{viewBox:'0 0 540 185',role:'img','aria-label':`${title}: ${points.length} recorded results. Exact values in the table below.`});
  const [low,high]=soilHistoryDomain(rows.filter(r=>r.date),trait,reference);
  if(reference){const y=150-125*(reference.max-low)/(high-low),height=125*(reference.max-reference.min)/(high-low);graph.append(svg('rect',{x:40,y,width:465,height,class:'soil-ph-reference-band'}));}
  for(const value of [low,(low+high)/2,high]){const y=150-125*(value-low)/(high-low);graph.append(svg('line',{x1:40,x2:505,y1:y,y2:y,class:'soil-history-grid'}));const t=svg('text',{x:32,y:y+4,'text-anchor':'end'});t.textContent=value;graph.append(t);}
  for(const point of points){const dot=svg('circle',{cx:point.x,cy:point.y,r:4,class:'soil-history-point'}),tip=svg('title');tip.textContent=`${point.date}: ${point.value}${trait==='ph'?'':'%'}`;dot.append(tip);graph.append(dot);}
  for(const [date,x,anchor] of [[points[0].date,45,'start'],[points.at(-1).date,495,'end']]){const text=svg('text',{x,y:177,'text-anchor':anchor});text.textContent=date;graph.append(text);}
  figure.append(graph);
  if(reference){
   const latest=points.at(-1),relation=latest.value<reference.min?'below':latest.value>reference.max?'above':'within';
   figure.append(el('p',`${reference.label}: ${reference.min}–${reference.max} pH reference band. Recorded ${latest.date}: ${latest.value}, ${relation} this range.`));
   const details=el('details');details.append(el('summary','Reference and applicability'));const a=el('a',reference.sourceTitle);a.href=reference.sourceUrl;details.append(a,el('p',`${reference.region} · ${reference.section} · retrieved ${reference.retrievedAt.slice(0,10)}. ${reference.applicability}`));figure.append(details);
  }
  return figure;
 }
 function render(){
  const current=notebookOwner();if(current!==owner){owner=current;group='';referenceSelect.value='';}body.replaceChildren();select.replaceChildren();
  if(!owner){status.textContent='Sign in to view your private soil reports.';label.hidden=true;referenceLabel.hidden=true;return;}
  const rows=soilHistoryRows(gardenSnapshot().soilTests);label.hidden=!rows.length;referenceLabel.hidden=!rows.length;
  if(!rows.length){status.textContent='No soil reports recorded yet.';const a=el('a','Record a laboratory report');a.href='/content/soil/soil-testing#record-soil-test';body.append(a);return;}
  const groups=[...new Set(rows.map(key))];if(!groups.includes(group))group=groups[0];
  for(const value of groups){const o=el('option',JSON.parse(value).join(' · '));o.value=value;select.append(o);}select.value=group;
  const all=rows.filter(r=>key(r)===group),shown=all.slice(-60);status.textContent=`${all.length} recorded reports${all.length>60?' · showing the latest 60':''}`;
  const plots=el('div');plots.className='soil-history-plots';plots.append(chart(shown,'ph','pH'),chart(shown,'organicMatterPercent','Organic matter (%)'));body.append(plots);
  body.append(el('p','Compare the same sampling area, depth and laboratory method. Points are recorded results; no fertilizer or amendment rate is inferred.'));
  const wrap=el('div');wrap.className='soil-history-table';wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label','Recorded soil results');
  const table=el('table'),head=el('thead'),header=el('tr');for(const title of ['Date','pH','Organic matter','Phosphorus','Potassium','Lab interpretation']){const th=el('th',title);th.scope='col';header.append(th);}head.append(header);table.append(head);const tbody=el('tbody');
  for(const row of [...shown].reverse()){const tr=el('tr');for(const value of [row.date||'Date unknown',row.ph??'—',row.organicMatter||'—',row.phosphorus||'—',row.potassium||'—'])tr.append(el('td',value));const td=el('td');if(row.report){const d=el('details');d.append(el('summary','Read report'),el('p',row.report));td.append(d);}else td.textContent='Not recorded';tr.append(td);tbody.append(tr);}table.append(tbody);wrap.append(table);body.append(wrap);
 }
 referenceSelect.onchange=render;select.onchange=()=>{group=select.value;render();};render();const events=['garden-records-changed','notebook-sync-status','focus','storage'];for(const e of events)globalThis.addEventListener(e,render);invalidation?.then(()=>{for(const e of events)globalThis.removeEventListener(e,render);});return root;
}

import {gardenSnapshot,localDay} from '../lib/garden/gardenRecords.js';
import {notebookEvents,notebookSignals} from '../lib/garden/notebookEvents.js';
import {notebookOwner} from '../lib/account/notebookStorage.js';
const el=(tag,text)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;return n;};
export function notebookTimeline({invalidation}={}){
 const root=el('section');root.className='notebook-timeline';root.setAttribute('aria-label','Your garden event history');
 const heading=el('div');heading.className='notebook-timeline-heading';heading.append(el('h2','Your garden history'));const add=el('a','+ Add an observation');add.href='#field-notes';heading.append(add);root.append(heading,el('p','Plans, observations, actions and laboratory reports retain their own meaning. These are your private notebook records, not shared Studio plans.'));
 const filters=el('details');filters.className='notebook-history-filters';filters.open=globalThis.matchMedia('(min-width: 601px)').matches;filters.append(el('summary','Filter history'));const controls=el('div');controls.className='notebook-timeline-controls';filters.append(controls);root.append(filters);
 function field(label,tag='select'){const wrap=el('label',label),input=el(tag);input.setAttribute('aria-label',label);wrap.append(input);controls.append(wrap);return input;}
 const search=field('Search garden history','input');search.type='search';const kind=field('Record type');for(const [v,t]of [['','All records'],['observation','Observations'],['plan','Planting plans'],['action','Actions'],['soil','Soil reports']]){const o=el('option',t);o.value=v;kind.append(o);}const crop=field('Crop in history'),bed=field('Bed in history');const from=field('From date','input'),to=field('Through date','input');from.type=to.type='date';
 const summary=el('p');summary.setAttribute('role','status');root.append(summary);const signals=el('details');signals.append(el('summary','Patterns and follow-up dates'));const signalBody=el('div');signals.append(signalBody);root.append(signals);const output=el('div');root.append(output);const more=el('button','Show more records');more.type='button';root.append(more);
 let owner=null,limit=30;
 function options(select,values,label){const previous=select.value;select.replaceChildren();for(const [v,t]of [['',label],...[...new Set(values.filter(Boolean))].sort().map(v=>[v,v])]){const o=el('option',t);o.value=v;select.append(o);}select.value=[...select.options].some(o=>o.value===previous)?previous:'';}
 function render(){
  const current=notebookOwner();if(current!==owner){owner=current;for(const input of [search,kind,crop,bed,from,to])input.value='';limit=30;}
  const events=owner?notebookEvents(gardenSnapshot()):[];options(crop,events.map(e=>e.crop),'All crops');options(bed,events.map(e=>e.bed),'All beds');output.replaceChildren();signalBody.replaceChildren();
  if(!owner){summary.textContent='Sign in to open your private garden history.';filters.hidden=true;signals.hidden=true;more.hidden=true;return;}filters.hidden=false;
  const patterns=notebookSignals(events,localDay());signals.hidden=!patterns.length;for(const signal of patterns){const p=el('p');p.append(el('strong',signal.label+' '),document.createTextNode(signal.detail));signalBody.append(p);}
  if(from.value&&to.value&&from.value>to.value){summary.textContent='The from date must come before the through date.';more.hidden=true;return;}
  const query=search.value.toLowerCase().trim();const rows=events.filter(e=>(!kind.value||e.kind===kind.value)&&(!crop.value||e.crop===crop.value)&&(!bed.value||e.bed===bed.value)&&(!from.value||(e.date&&e.date>=from.value))&&(!to.value||(e.date&&e.date<=to.value))&&(!query||[e.title,e.detail,e.interpretation,e.action,e.crop,e.bed,e.label].join(' ').toLowerCase().includes(query)));
  summary.textContent=`${rows.length} of ${events.length} records · newest first${rows.length>limit?` · showing ${limit}`:''}`;more.hidden=rows.length<=limit;
  if(!rows.length){output.append(el('p',events.length?'No records match these filters.':'Your first observation starts this history. Use “Add an observation” above.'));return;}
  const list=el('ol');list.className='notebook-event-stream';let previousDate;
  for(const e of rows.slice(0,limit)){
   const item=el('li');if(e.date!==previousDate){item.append(el('h3',e.date||'Date not recorded'));previousDate=e.date;}
   const row=el('article');row.dataset.kind=e.kind;const tag=el('span',e.label);tag.className='notebook-event-kind';row.append(tag,el('strong',e.title||'Garden record'));if(e.bed)row.append(el('small',e.bed));if(e.detail)row.append(el('p',e.detail));
   if(e.interpretation||e.action||e.catalogSourceUrl){const details=el('details');details.append(el('summary','Interpretation, action & source'));if(e.interpretation)details.append(el('p',`Recorded interpretation: ${e.interpretation}`));if(e.action)details.append(el('p',`Recorded action: ${e.action}`));if(/^https:\/\//.test(e.catalogSourceUrl)){const a=el('a','Catalog source for this planting plan');a.href=e.catalogSourceUrl;details.append(a);}details.append(el('small',e.source));row.append(details);}item.append(row);list.append(item);
  }output.append(list);
 }
 controls.addEventListener('input',()=>{limit=30;render();});more.onclick=()=>{limit+=30;render();};const events=['garden-records-changed','notebook-sync-status','storage','focus'];events.forEach(e=>globalThis.addEventListener(e,render));const timer=setInterval(render,30000);invalidation?.then(()=>{clearInterval(timer);events.forEach(e=>globalThis.removeEventListener(e,render));});render();return root;
}

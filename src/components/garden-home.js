import {gardenJourney,JOURNAL_TYPES} from '../lib/garden/plantingJournal.js';
const el=(tag,text)=>{const node=document.createElement(tag);if(text!=null)node.textContent=text;return node;};
const action=(label,fn)=>{const b=el('button',label);b.type='button';b.onclick=fn;return b;};
const localDate=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
export function gardenHome({getWorkspace,getPlants,selectedPlantingId,onLog,onPlan,onBackup,planLabel="Open bed",savedMessage="Observation recorded in this garden draft. Use account save or export to keep a separate copy."}) {
 const dialog=el('dialog');dialog.setAttribute('aria-label','My garden');dialog.style.cssText='width:min(960px,94vw);max-height:90svh;overflow:auto;padding:16px;background:var(--theme-background,#18231b);color:var(--theme-foreground,#eef2e8);border:1px solid #71846d';
 const header=el('header');header.style.cssText='display:flex;justify-content:space-between;gap:12px;align-items:center;position:sticky;top:-16px;background:inherit;z-index:1';const title=el('h2');header.append(title,action('Close',()=>dialog.close()));dialog.append(header);
 const intro=el('p','Plan and observations for this garden. Logging does not change planned dates or unlock the map.');dialog.append(intro);
 const controls=el('div');controls.style.cssText='display:flex;flex-wrap:wrap;gap:12px';const year=el('input');year.type='number';year.min='1900';year.max='9999';year.value=String(new Date().getFullYear());year.style.width='6em';const label=el('label','Season ');label.append(year);controls.append(label);const bedFilter=el('select');bedFilter.setAttribute('aria-label','Filter garden bed');controls.append(bedFilter,action('Export backup',onBackup));dialog.append(controls);
 const summary=el('p'),log=el('section'),plans=el('section'),history=el('section');dialog.append(summary,log,plans,history);
 let choice=selectedPlantingId||'',historyLimit=30;
 const plants=()=>new Map(getPlants().map(p=>[p.id,p]));
 function render(){
  const workspace=getWorkspace(),catalog=plants(),season=Number(year.value);if(!Number.isInteger(season)||season<1900||season>9999)return;
  const data=gardenJourney(workspace,season);title.textContent=workspace.name||workspace.property?.name||'My garden';
  const selectedBed=bedFilter.value;bedFilter.replaceChildren(new Option('All beds',''),...data.beds.map(b=>new Option(b.name,b.id)));if(data.beds.some(b=>b.id===selectedBed))bedFilter.value=selectedBed;
  const rows=data.plantings.filter(row=>!bedFilter.value||row.bed?.id===bedFilter.value);summary.textContent=`${data.beds.length} beds · ${rows.length} planned plantings · ${data.events.filter(e=>!bedFilter.value||e.bedId===bedFilter.value).length} observations in ${season}. Existing storage and account-save controls apply; export a backup for safekeeping.`;
  log.replaceChildren(el('h3','Quick log'));if(!rows.length){log.append(el('p','Add a planting to a bed to begin its history.'));}else{
   const form=el('form');form.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,160px),1fr));gap:10px;align-items:end';
   const field=(text,node)=>{const l=el('label',text);l.style.cssText='display:flex;flex-direction:column;gap:4px;min-width:0';node.style.cssText='box-sizing:border-box;width:100%;min-width:0;padding:8px;background:inherit;color:inherit;border:1px solid #71846d;border-radius:5px';l.append(node);form.append(l);return node;};
   const planting=field('Planting',el('select'));planting.name='planting';for(const row of rows)planting.append(new Option(`${catalog.get(row.planting.plantId)?.name||row.planting.name} · ${row.bed?.name||'Outside bed'} · ${row.planting.id.slice(-6)}`,row.planting.id));if(rows.some(r=>r.planting.id===choice))planting.value=choice;planting.onchange=()=>{choice=planting.value;};
   const type=field('What happened?',el('select'));type.name='type';for(const [id,name] of Object.entries(JOURNAL_TYPES))type.append(new Option(name,id));type.value='watering';
   const date=field('Date',el('input'));date.name='date';date.type='date';date.value=localDate();date.required=true;
   const notes=field('Note (optional)',el('input'));notes.name='notes';notes.maxLength=2000;
   const quantity=field('Harvest quantity (optional)',el('input'));quantity.name='quantity';quantity.type='number';quantity.min='0.001';quantity.step='any';
   const unit=field('Unit',el('select'));unit.name='unit';for(const u of ['count','g','oz','lb','kg'])unit.append(new Option(u,u));
   const quality=field('Quality (optional)',el('select'));quality.name='quality';for(const u of ['','poor','fair','good','excellent'])quality.append(new Option(u||'Not recorded',u));
   const sync=()=>{for(const node of [quantity,unit,quality]){node.parentElement.style.display=type.value==='harvested'?'flex':'none';node.disabled=type.value!=='harvested';}notes.required=type.value==='note';};type.onchange=sync;sync();
   const save=el('button','Save observation');save.type='submit';form.append(save);const status=el('p');status.setAttribute('role','status');
   form.onsubmit=async event=>{event.preventDefault();save.disabled=true;try{choice=planting.value;await onLog(choice,{type:type.value,date:date.value,notes:notes.value,quantity:quantity.value,unit:unit.value,quality:quality.value});year.value=date.value.slice(0,4);render();const message=el('p',savedMessage);message.setAttribute('role','status');log.prepend(message);}catch(error){status.textContent=error.message;}finally{save.disabled=false;}};log.append(form,status);
  }
  plans.replaceChildren(el('h3','Plan → actual'));
  const wrap=el('div');wrap.style.overflowX='auto';const table=el('table');table.style.width='100%';table.innerHTML='<thead><tr><th>Planting / bed</th><th>Planned entry</th><th>Actual sow / transplant</th><th>Harvest records this year</th><th>Plan</th></tr></thead>';const body=el('tbody');table.append(body);
  for(const {planting,bed,outcome:o} of rows.slice(0,100)){const tr=el('tr');tr.append(el('td',`${catalog.get(planting.plantId)?.name||planting.name} · ${bed?.name||'Outside bed'}`),el('td',o.plannedEntry||'Not set'),el('td',[o.actualSowing&&`Sown ${o.actualSowing}`,o.actualTransplant&&`Transplanted ${o.actualTransplant}`].filter(Boolean).join(' · ')||'Not recorded'));const harvest=[o.grams!==null?`${(o.grams/1000).toFixed(3)} kg`:null,o.count!==null?`${o.count} count`:null,o.unmeasuredHarvests?`${o.unmeasuredHarvests} without quantity`:null].filter(Boolean).join(' + ');tr.append(el('td',harvest||'Not recorded'));const cell=el('td');if(bed)cell.append(action(planLabel,()=>{onPlan(bed.id);dialog.close();}));tr.append(cell);body.append(tr);}wrap.append(table);plans.append(wrap);if(rows.length>100)plans.append(el('p','Showing the first 100 plantings. Select a bed to narrow the list.'));
  history.replaceChildren(el('h3',`Garden history · ${season}`));const events=data.events.filter(e=>!bedFilter.value||e.bedId===bedFilter.value);if(!events.length)history.append(el('p','No observations recorded for this season.'));
  const list=el('ol');for(const event of events.slice(0,historyLimit)){const li=el('li');li.append(el('strong',`${event.date} · ${catalog.get(event.plantId)?.name||'Planting'} · ${JOURNAL_TYPES[event.type]||event.type}`),el('p',[event.bedName,event.quantity?`${event.quantity} ${event.unit}`:null,event.quality,event.notes].filter(Boolean).join(' · ')));list.append(li);}history.append(list);if(events.length>historyLimit)history.append(action('Show more history',()=>{historyLimit+=30;render();}));
 }
 year.onchange=render;bedFilter.onchange=()=>{historyLimit=30;render();};dialog.addEventListener('close',()=>dialog.remove(),{once:true});render();return dialog;
}

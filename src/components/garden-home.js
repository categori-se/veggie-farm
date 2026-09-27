import {gardenAttention} from '../lib/garden/gardenAttention.js';
import {gardenJourney,JOURNAL_TYPES} from '../lib/garden/plantingJournal.js';
const el=(tag,text)=>{const node=document.createElement(tag);if(text!=null)node.textContent=text;return node;};
const action=(label,fn)=>{const b=el('button',label);b.type='button';b.style.cssText='min-height:44px;padding:8px 12px;font:inherit';b.onclick=fn;return b;};
const localDate=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
export function gardenHome({getWorkspace,getPlants,selectedPlantingId,today=localDate(),onLog,onPlan,onBackup,onNextSeason,onOpenSeason,initialYear,planLabel="Open bed",savedMessage="Observation recorded in this garden draft. Use account save or export to keep a separate copy."}) {
 const dialog=el('dialog');dialog.setAttribute('aria-label','My garden');dialog.style.cssText='box-sizing:border-box;font:14px/1.5 system-ui,sans-serif;width:min(960px,94vw);max-height:90svh;overflow:auto;padding:16px;background:var(--theme-background,#18231b);color:var(--theme-foreground,#eef2e8);border:1px solid #71846d';
 const header=el('header');header.style.cssText='display:flex;justify-content:space-between;gap:12px;align-items:center;position:sticky;top:-16px;background:inherit;z-index:1';const title=el('h2');header.append(title,action('Close',()=>dialog.close()));dialog.append(header);
 const intro=el('p','Choose a planting to record what happened, or open a bed to continue planning.');dialog.append(intro);
 const controls=el('div');controls.style.cssText='display:flex;flex-wrap:wrap;gap:12px';const year=el('input');year.type='number';year.min='1900';year.max='9999';year.value=String(initialYear||today.slice(0,4));year.style.width='6em';const label=el('label','Season ');label.append(year);controls.append(label);const bedFilter=el('select');bedFilter.setAttribute('aria-label','Filter garden bed');controls.append(bedFilter,action('Export backup',onBackup));if(onOpenSeason)controls.append(action('View season in plan',()=>{const y=Number(year.value);if(Number.isInteger(y)&&y>=1900&&y<=2200){onOpenSeason(y);dialog.close();}}));if(onNextSeason)controls.append(action('Plan next year',()=>{const y=Number(year.value);if(Number.isInteger(y)&&y>=1900&&y<2200){onNextSeason(y);dialog.close();}}));dialog.append(controls);
 const conditions=el('p'),contextDetails=el('details');contextDetails.append(el('summary','Garden context & storage'),conditions,el('p','Logging does not change planned dates or unlock the map. Use the existing account-save controls or export a backup for safekeeping.'));dialog.append(contextDetails);
 const attention=el('section');attention.setAttribute('aria-label','Garden attention');
 const summary=el('p'),log=el('section'),plans=el('section'),history=el('section');dialog.append(summary,attention,log,plans,history);
 let choice=selectedPlantingId||'',historyLimit=30,attentionLimit=6,logType='';
 const plants=()=>new Map(getPlants().map(p=>[p.id,p]));
 function render(){
  const workspace=getWorkspace(),catalog=plants(),season=Number(year.value);if(!Number.isInteger(season)||season<1900||season>9999)return;
  const context=workspace.property?.gardenContext;conditions.textContent=context?[`Notebook context: ${context.locationLabel||context.gardenName||'garden profile'}`,context.sunHours!=null?`${context.sunHours} sun hours`:null,context.climate?.lastFrostMonthDay?`last frost setting ${context.climate.lastFrostMonthDay}`:null,context.climate?.firstFrostMonthDay?`first frost setting ${context.climate.firstFrostMonthDay}`:null,context.soil?.texture,context.irrigation,'Profile settings, not newly measured conditions.'].filter(Boolean).join(' · '):'Garden conditions have not been associated yet.';
  const data=gardenJourney(workspace,season);title.textContent=workspace.name||workspace.property?.name||'My garden';
  const selectedBed=bedFilter.value;bedFilter.replaceChildren(new Option('All beds',''),...data.beds.map(b=>new Option(b.name,b.id)));if(data.beds.some(b=>b.id===selectedBed))bedFilter.value=selectedBed;
  const rows=data.plantings.filter(row=>!bedFilter.value||row.bed?.id===bedFilter.value);summary.textContent=`${data.beds.length} beds · ${rows.length} planned plantings · ${data.events.filter(e=>!bedFilter.value||e.bedId===bedFilter.value).length} observations in ${season}.`;
  attention.replaceChildren();
  if(season===Number(today.slice(0,4))){
   attention.append(el('h3',`Today · ${today}`));
   const tasks=gardenAttention(workspace,today).filter(task=>!bedFilter.value||task.bedId===bedFilter.value);
   attention.append(el('p','From your planting plans and observations. These prompts do not check weather or prove what is growing.'));
   if(!tasks.length)attention.append(el('p','No date-based prompts in these records today. You can still log what you notice.'));
   const list=el('ul');list.style.cssText='list-style:none;padding:0;display:grid;gap:12px';
   for(const task of tasks.slice(0,attentionLimit)){
    const item=el('li');item.style.cssText='border:1px solid #71846d;border-radius:6px;padding:12px';
    const bed=workspace.beds?.find(b=>b.id===task.bedId);
    item.append(el('strong',task.title),el('p',`${catalog.get(task.plantId)?.name||'Planting'} · ${bed?.name||'Outside a named bed'}`));
    const why=el('details');why.append(el('summary','Why this appears'),el('p',task.explanation));item.append(why);
    if(task.action==='plan'&&task.bedId)item.append(action(planLabel,()=>{onPlan(task.bedId);dialog.close();}));
    else item.append(action(task.observationType==='harvested'?'Record a harvest':'Log what happened',()=>{choice=task.plantingId;logType=task.observationType;render();log.scrollIntoView({block:'nearest'});log.querySelector('[name="type"]')?.focus();}));
    list.append(item);
   }
   attention.append(list);
   if(tasks.length>attentionLimit)attention.append(action(`Show ${tasks.length-attentionLimit} more prompts`,()=>{attentionLimit=tasks.length;render();}));
  }
  log.replaceChildren(el('h3','Quick log'));if(!rows.length){log.append(el('p','Add a planting to a bed to begin its history.'));}else{
   const form=el('form');form.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,160px),1fr));gap:10px;align-items:end';
   const field=(text,node)=>{const l=el('label',text);l.style.cssText='display:flex;flex-direction:column;gap:4px;min-width:0';node.style.cssText='box-sizing:border-box;width:100%;min-width:0;padding:8px;min-height:44px;font:inherit;background:inherit;color:inherit;border:1px solid #71846d;border-radius:5px';l.append(node);form.append(l);return node;};
   const planting=field('Planting',el('select'));planting.name='planting';for(const row of rows)planting.append(new Option(`${catalog.get(row.planting.plantId)?.name||row.planting.name} · ${row.bed?.name||'Outside bed'} · ${row.planting.id.slice(-6)}`,row.planting.id));if(rows.some(r=>r.planting.id===choice))planting.value=choice;planting.onchange=()=>{choice=planting.value;};
   const type=field('What happened?',el('select'));type.name='type';type.required=true;type.append(new Option('Choose what happened',''));for(const [id,name] of Object.entries(JOURNAL_TYPES))type.append(new Option(name,id));type.value=logType;
   const date=field('Date',el('input'));date.name='date';date.type='date';date.value=today;date.required=true;
   const notes=field('Note (optional)',el('input'));notes.name='notes';notes.maxLength=2000;
   const quantity=field('Harvest quantity (optional)',el('input'));quantity.name='quantity';quantity.type='number';quantity.min='0.001';quantity.step='any';
   const unit=field('Unit',el('select'));unit.name='unit';for(const u of ['count','g','oz','lb','kg'])unit.append(new Option(u,u));
   const quality=field('Quality (optional)',el('select'));quality.name='quality';for(const u of ['','poor','fair','good','excellent'])quality.append(new Option(u||'Not recorded',u));
   const sync=()=>{for(const node of [quantity,unit,quality]){node.parentElement.style.display=type.value==='harvested'?'flex':'none';node.disabled=type.value!=='harvested';}notes.required=type.value==='note';};type.onchange=sync;sync();
   const save=el('button','Save observation');save.type='submit';save.style.cssText='min-height:44px;padding:8px 12px;font:inherit';form.append(save);const status=el('p');status.setAttribute('role','status');
   form.onsubmit=async event=>{event.preventDefault();save.disabled=true;try{choice=planting.value;await onLog(choice,{type:type.value,date:date.value,notes:notes.value,quantity:quantity.value,unit:unit.value,quality:quality.value});year.value=date.value.slice(0,4);logType='';render();const message=el('p',savedMessage);message.setAttribute('role','status');log.prepend(message);}catch(error){status.textContent=error.message;}finally{save.disabled=false;}};log.append(form,status);
  }
  plans.replaceChildren(el('h3','Plan → actual'));
  const wrap=el('div');wrap.style.overflowX='auto';const table=el('table');table.style.width='100%';table.innerHTML='<thead><tr><th>Planting / bed</th><th>Planned entry</th><th>Actual sow / transplant</th><th>Harvest records this year</th><th>Plan</th></tr></thead>';const body=el('tbody');table.append(body);
  for(const {planting,bed,outcome:o} of rows.slice(0,100)){const tr=el('tr');tr.append(el('td',`${catalog.get(planting.plantId)?.name||planting.name} · ${bed?.name||'Outside bed'}`),el('td',o.plannedEntry||'Not set'),el('td',[o.actualSowing&&`Sown ${o.actualSowing}`,o.actualTransplant&&`Transplanted ${o.actualTransplant}`].filter(Boolean).join(' · ')||'Not recorded'));const harvest=[o.grams!==null?`${(o.grams/1000).toFixed(3)} kg`:null,o.count!==null?`${o.count} count`:null,o.unmeasuredHarvests?`${o.unmeasuredHarvests} without quantity`:null].filter(Boolean).join(' + ');tr.append(el('td',harvest||'Not recorded'));const cell=el('td');if(bed)cell.append(action(planLabel,()=>{onPlan(bed.id);dialog.close();}));tr.append(cell);body.append(tr);}wrap.append(table);plans.append(wrap);if(rows.length>100)plans.append(el('p','Showing the first 100 plantings. Select a bed to narrow the list.'));
  history.replaceChildren(el('h3',`Garden history · ${season}`));const events=data.events.filter(e=>!bedFilter.value||e.bedId===bedFilter.value);if(!events.length)history.append(el('p','No observations recorded for this season.'));
  const list=el('ol');for(const event of events.slice(0,historyLimit)){const li=el('li');li.append(el('strong',`${event.date} · ${catalog.get(event.plantId)?.name||'Planting'} · ${JOURNAL_TYPES[event.type]||event.type}`),el('p',[event.bedName,event.quantity?`${event.quantity} ${event.unit}`:null,event.quality,event.notes].filter(Boolean).join(' · ')));if(event.notebookOrigin){const origin=event.notebookOrigin;li.append(el('small',`Linked Notebook observation · original crop: ${origin.crop||'not recorded'} ${origin.variety||''} · original bed: ${origin.bed||'not recorded'}`));if(origin.interpretation)li.append(el('p',`Interpretation: ${origin.interpretation}`));if(origin.action)li.append(el('p',`Action: ${origin.action}`));}list.append(li);}history.append(list);if(events.length>historyLimit)history.append(action('Show more history',()=>{historyLimit+=30;render();}));
 }
 year.onchange=render;bedFilter.onchange=()=>{historyLimit=30;render();};dialog.addEventListener('close',()=>dialog.remove(),{once:true});render();return dialog;
}

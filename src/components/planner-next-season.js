import {planNextSeason,seasonPlantings,shiftPlanYear} from '../lib/garden/nextSeason.js';
const el=(tag,text)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;return n;};
export function plannerNextSeason({getWorkspace,plants,fromYear,onSave}){
 const dialog=el('dialog');dialog.setAttribute('aria-label','Plan next year');dialog.className='planner-next-season';dialog.style.cssText='box-sizing:border-box;width:min(760px,94vw);max-height:90svh;overflow:auto;padding:20px;font:14px/1.5 system-ui';
 const close=el('button','Back to garden');close.type='button';close.onclick=()=>dialog.close();dialog.append(close,el('h2',`Start ${fromYear+1} from ${fromYear}`),el('p','Keep this garden’s beds, paths, structures and conditions. Choose which plantings continue growing and which to repeat as new plantings. Existing observations stay with their original plants.'));
 const form=el('form'),catalog=new Map(plants.map(p=>[p.id,p])),workspace=getWorkspace(),rows=[];
 for(const p of seasonPlantings(workspace,fromYear)){
  const fieldset=el('fieldset'),plant=catalog.get(p.plantId),bed=workspace.beds?.find(b=>b.id===p.bedId);fieldset.style.cssText='margin:14px 0;padding:12px;min-width:0';fieldset.append(el('legend',`${plant?.name||p.name||'Planting'} · ${bed?.name||'Outside bed'}`));
  const label=(text,input)=>{input.setAttribute('aria-label',text);const l=el('label',text);l.style.cssText='display:grid;gap:4px;margin:8px 0';input.style.cssText='box-sizing:border-box;min-width:0;width:100%;min-height:44px;font:inherit';l.append(input);fieldset.append(l);return input;};
  const action=label('Next season',el('select'));action.append(new Option('Leave this planting as it is','skip'),new Option('Keep growing — same plant','retain'),new Option('Repeat — new planting','repeat'));
  // Lifecycle is a suggestion to review, never a rule inferred from the crop name.
  action.value=plant?.lifeCycle==='perennial'?'retain':'skip';
  fieldset.append(el('p',plant?.lifeCycle?`Catalog life cycle: ${plant.lifeCycle}. Review for your climate and how you grow it.`:'Life cycle not recorded. Choose how you want to grow this plant.'));
  const sourceEnd=label('Original planting: planned last day',el('input')),start=label(`${fromYear+1}: planned start`,el('input')),end=label(`${fromYear+1}: planned last day`,el('input'));
  for(const input of [sourceEnd,start,end]){input.type='date';input.min='1900-01-01';input.max='2200-12-31';}sourceEnd.value=p.plannedUntil||'';start.value=shiftPlanYear(p.planted,1);end.value=shiftPlanYear(p.plannedUntil,1);
  const detail=el('p');fieldset.append(detail);
  const update=()=>{for(const input of [sourceEnd,start,end]){input.parentElement.hidden=action.value!=='repeat';input.disabled=action.value!=='repeat';input.required=action.value==='repeat';}detail.textContent=action.value==='retain'?'Keeps the existing planting and its history, and clears its planned end so it continues into next year.':action.value==='repeat'?'Copies the plant and position, with a new identity and no observations, harvest totals or size scenarios. These are proposed dates; review spacing and seasonal conditions.':'Does not change this planting or its dates.';};action.onchange=update;update();rows.push({id:p.id,action,sourceEnd,start,end});form.append(fieldset);
 }
 if(!rows.length)form.append(el('p','No plantings overlap this year. You can still start next year with the existing beds and garden structure.'));
 const status=el('p');status.setAttribute('role','status');const save=el('button',`Create ${fromYear+1} plan`);save.type='submit';save.style.cssText='min-height:44px;font:inherit';form.append(status,save);
 form.onsubmit=async event=>{event.preventDefault();save.disabled=true;try{const next=planNextSeason(getWorkspace(),{fromYear,toYear:fromYear+1,choices:rows.map(r=>({id:r.id,action:r.action.value,sourceEnd:r.sourceEnd.value,start:r.start.value,end:r.end.value}))});await onSave(next,fromYear+1);dialog.close();}catch(error){status.textContent=error.message;}finally{save.disabled=false;}};
 dialog.append(form);dialog.addEventListener('close',()=>dialog.remove(),{once:true});return dialog;
}

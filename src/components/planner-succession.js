import {nextPlantingDate} from '../lib/garden/successionPlanting.js';
const el=(tag,text)=>{const node=document.createElement(tag);if(text!=null)node.textContent=text;return node;};
export function plannerSuccession({source,plants,onSave}) {
  const dialog=el('dialog');dialog.className='planner-succession';dialog.setAttribute('aria-label','Plan the next crop');dialog.style.cssText='width:min(560px,calc(100vw - 32px));max-height:85svh;overflow:auto;box-sizing:border-box';
  const title=el('h2','Plan the next crop'),close=el('button','Back to planting');close.type='button';close.onclick=()=>dialog.close();dialog.append(close,title);
  const startDate=nextPlantingDate(source);
  if(!startDate){dialog.append(el('p','First enter this planting’s planned last day in the inspector. Its history and original plan will stay intact.'));}
  else {
    dialog.append(el('p',`The original planting ends ${source.plannedUntil}. Create a separate planting after it, using the same position when there is enough space. Review season, light and soil suitability before planting.`));
    const form=el('form'),plant=el('select'),start=el('input'),end=el('input'),status=el('p');status.setAttribute('role','status');plant.required=true;plant.append(new Option('Choose the next plant',''));for(const p of plants)plant.append(new Option(p.name,p.id));
    function label(text,input){input.setAttribute('aria-label',text);const node=el('label',text);node.style.cssText='display:grid;gap:4px;margin:10px 0';node.append(input);return node;}
    start.type=end.type='date';start.required=true;start.min=startDate;start.max=end.max='2200-12-31';start.value=startDate;end.min=startDate;start.onchange=()=>end.min=start.value||startDate;
    const submit=el('button','Add next crop');submit.type='submit';form.append(label('Next plant',plant),label('Planned start',start),label('Planned last day (optional)',end),status,submit);
    form.onsubmit=event=>{event.preventDefault();try{onSave({plantId:plant.value,start:start.value,end:end.value});dialog.close();}catch(error){status.textContent=error.message;}};dialog.append(form);
  }
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});return dialog;
}

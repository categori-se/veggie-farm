import {plannedSize} from '../lib/garden/plannedSize.js';
export function plannerSizeScenario({placement,onChange,canEdit=()=>true}){
 const root=document.createElement('details');root.className='planner-size-scenario';
 root.innerHTML='<summary>Size through the season</summary><form><p>Sketch a size scenario for Date preview. Symbols scale evenly between two dates; this is not a biological growth forecast.</p><label>Starting date<input name="startDate" type="date" required></label><label>Starting size (% of mature dimensions)<input name="startPercent" type="number" min="5" max="100" step="1" required></label><label>Full-size date<input name="fullSizeDate" type="date" required></label><label>Reference or assumption<input name="reference" maxlength="300" required placeholder="Your observation, cultivar guide or planning assumption"></label><p>Mature spacing checks stay unchanged. Overview dots stay readable; zoom in to see size.</p><button type="submit">Save size scenario</button> <button type="button" data-clear>Remove size scenario</button><p role="status"></p></form>';
 const form=root.querySelector('form'),status=root.querySelector('[role=status]');
 for(const name of ['startDate','startPercent','fullSizeDate','reference'])if(placement.sizeScenario?.[name]!=null)form.elements[name].value=placement.sizeScenario[name];
 function sync(){const result=plannedSize(placement);status.textContent=result.status==='invalid'?'Review the saved size scenario.':placement.sizeScenario?'Scenario saved. Enable Date preview to see the changing size.':'No size scenario; mature symbols stay visible.';root.querySelector('[data-clear]').disabled=!placement.sizeScenario;}
 form.onsubmit=event=>{event.preventDefault();if(!canEdit()||!form.reportValidity())return;
  const value={plantId:placement.plantId,startDate:form.elements.startDate.value,fullSizeDate:form.elements.fullSizeDate.value,startPercent:Number(form.elements.startPercent.value),reference:form.elements.reference.value.trim()};
  if(plannedSize({...placement,sizeScenario:value}).status==='invalid'){status.textContent='Use a full-size date after the starting date, a size from 5–100%, and a reference or assumption.';return;}
  placement.sizeScenario=value;sync();onChange();
 };
 root.querySelector('[data-clear]').onclick=()=>{if(!canEdit())return;delete placement.sizeScenario;sync();onChange();};sync();if(!canEdit())for(const control of form.elements)control.disabled=true;return root;
}

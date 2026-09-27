const el=(tag,text)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;return n;};
export function bedConditionsForm({getWorkspace,onSave}) {
 const root=el('section');root.setAttribute('aria-label','Bed conditions');root.append(el('h3','Conditions in this bed'),el('p','Record what you know about each bed. Blank values stay unknown. These records do not change the map or replace soil reports.'));
 const choose=el('select');choose.setAttribute('aria-label','Bed for conditions');choose.style.cssText='min-height:44px;max-width:100%';choose.append(new Option('Choose a bed',''),...(getWorkspace().beds||[]).map(b=>new Option(b.name||b.id,b.id)));root.append(choose);
 const form=el('form'),fields=el('fieldset'),status=el('p');status.setAttribute('role','status');fields.style.cssText='display:grid;gap:12px;border:0;padding:12px 0';const inputs={};
 for(const [name,label,type,min,max] of [['sunHours','Direct sun hours (optional)','number',0,24],['soilTemperatureF','Measured soil temperature °F (optional)','number',20,110],['soilTemperatureMeasuredOn','Soil measurement date (optional)','date'],['texture','Soil description (optional)','text'],['drainage','Drainage (optional)','select']]){
  const wrap=el('label',label),input=el(type==='select'?'select':'input');if(type==='select')for(const [value,text]of [['','Unknown'],['slow','Slow'],['moderate','Moderate'],['fast','Fast']])input.append(new Option(text,value));else{input.type=type;if(min!==undefined){input.min=min;input.max=max;input.step='any';}if(type==='text')input.maxLength=120;}
  input.name=name;input.style.cssText='display:block;box-sizing:border-box;width:100%;min-height:44px;font:inherit';wrap.append(input);fields.append(wrap);inputs[name]=input;
 }
 const save=el('button','Save bed conditions');save.type='submit';save.style.minHeight='44px';fields.append(save);form.append(fields,status);root.append(form);form.hidden=true;
 const drafts=new Map();let active='',busy=false;
 const read=()=>Object.fromEntries(Object.entries(inputs).map(([k,n])=>[k,n.value]));
 form.oninput=()=>{if(active)drafts.set(active,read());};
 choose.onchange=()=>{active=choose.value;form.hidden=!active;status.textContent='';if(!active)return;const stored=getWorkspace().property?.bedConditions?.[active]||{},value=drafts.get(active)||{...stored,...stored.soil};for(const [key,node]of Object.entries(inputs))node.value=value[key]??'';};
 form.onsubmit=async event=>{event.preventDefault();if(busy||!active)return;const id=active,value=read();drafts.set(id,value);busy=true;fields.disabled=true;choose.disabled=true;status.textContent='Saving…';try{await onSave(id,value);drafts.delete(id);status.textContent='Bed conditions saved.';}catch(error){status.textContent=error.message||'Could not save. Your entries remain here.';}finally{busy=false;fields.disabled=false;choose.disabled=false;}};
 return root;
}

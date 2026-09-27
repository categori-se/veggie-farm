import {REFLECTION_FIELDS,seasonReflection} from '../lib/garden/seasonReflection.js';
const el=(tag,text)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;return n;};
export function seasonReflectionForm({property,year,onSave,drafts=new Map()}){
 const root=el('section');root.setAttribute('aria-label',`Season reflection ${year}`);root.append(el('h3',`Your reflections · ${year}`));
 const previous=seasonReflection(property,year-1);
 if(previous){const details=el('details');details.append(el('summary',`Your notes from ${year-1}`));for(const [field,label] of Object.entries(REFLECTION_FIELDS))if(previous[field])details.append(el('strong',label),el('p',previous[field]));root.append(details);}
 const current=drafts.get(year)||seasonReflection(property,year)||{};
 if(!onSave){for(const [field,label] of Object.entries(REFLECTION_FIELDS))if(current[field])root.append(el('strong',label),el('p',current[field]));return root;}
 const form=el('form'),fields=el('fieldset');fields.style.cssText='border:0;padding:0;min-width:0';const inputs={};
 for(const [field,label] of Object.entries(REFLECTION_FIELDS)){const l=el('label',label),input=el('textarea');input.name=field;input.value=current[field]||'';input.maxLength=2000;input.rows=2;input.style.cssText='box-sizing:border-box;width:100%;min-height:64px;font:inherit';l.style.cssText='display:block;margin:12px 0';l.append(input);fields.append(l);inputs[field]=input;}
 const values=()=>Object.fromEntries(Object.entries(inputs).map(([field,input])=>[field,input.value]));form.oninput=()=>drafts.set(year,values());
 const save=el('button','Save reflection');save.type='submit';save.style.cssText='min-height:44px;font:inherit;padding:8px 12px';const status=el('p');status.setAttribute('role','status');fields.append(save);form.append(fields,status);form.onsubmit=async event=>{event.preventDefault();fields.disabled=true;const submitted=values();drafts.set(year,submitted);try{await onSave(year,submitted);if(drafts.get(year)===submitted)drafts.delete(year);status.textContent='Reflection saved for this season.';}catch(error){status.textContent=error.message;}finally{fields.disabled=false;}};root.append(form);return root;
}

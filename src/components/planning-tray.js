import {readGardenHandoff} from '../lib/garden/gardenHandoff.js';
import {readPlantIntent,plannedCatalogPlant} from '../lib/garden/plantIntent.js';
const el=(tag,text)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;return e;};
export function planningTray({getState,commit,createGarden,createBed,openBed,remove,invalidation}){
 const root=el('div'),launch=el('button','Planning tray');launch.type='button';root.append(launch);
 let waitingForGarden=!!readGardenHandoff(location.hash),cancelled=false,recovery=null,chooseDestination=false;
 let pending=null,error='';try{pending=readPlantIntent(location.hash);}catch(e){error=e.message;}
 const dialog=el('dialog');dialog.className='planning-tray-dialog';dialog.style.cssText='width:min(600px,calc(100vw - 32px));max-height:85svh;overflow:auto;box-sizing:border-box;border:1px solid var(--line);border-radius:12px;background:var(--panel);color:inherit;padding:16px';
 const label=(name,field)=>{field.setAttribute('aria-label',name);const l=el('label',name);l.style.cssText='display:grid;gap:4px;margin:8px 0';l.append(field);return l;};
 function draw(){
  dialog.replaceChildren(el('style','.planning-tray-dialog input,.planning-tray-dialog select{min-height:44px;width:100%;box-sizing:border-box;font:inherit}.planning-tray-dialog button{min-height:44px;font:inherit}.planning-tray-dialog summary{min-height:44px;box-sizing:border-box;padding:12px 0;cursor:pointer}.planning-tray-dialog fieldset{min-width:0;margin:0;padding:12px;border:1px solid var(--line);border-radius:8px}'));const close=el('button','Back to garden');close.type='button';close.onclick=()=>dialog.close();dialog.append(close,el('h2','Planning tray'));
  const status=el('p',error);status.setAttribute('role','status');dialog.append(status);
  if(pending&&waitingForGarden){
   dialog.append(el('h3',pending.name),el('p',recovery?`${recovery.reason} Your crop choice is still here. Retry in Account saves or choose another garden.`:cancelled?'Opening the saved garden was cancelled. Your crop choice is still here.':'Open the linked account garden before choosing where to plant. Sign in or retry in Account saves; your crop choice is retained.'));
   const account=el('button','Return to account saves');account.type='button';account.onclick=()=>dialog.close();dialog.append(account);
   if(cancelled||recovery){const other=el('button','Choose another garden');other.type='button';other.onclick=()=>{recovery?.chooseAnother();recovery=null;waitingForGarden=false;chooseDestination=true;draw();};dialog.append(other);}
   return;
  }
  if(pending){
   dialog.append(el('h3',pending.name),el('p',[pending.cultivar,pending.scientific].filter(Boolean).join(' · ')),el('p','Choose a destination and review dimensions. This saves a choice; it does not plant it automatically.'));
   if(pending.source){const a=el('a','Plant source');a.href=pending.source;a.target='_blank';a.rel='noopener noreferrer';dialog.append(a);}
   const form=el('form'),garden=el('select'),bed=el('select'),year=el('input');garden.required=true;bed.required=true;year.type='number';year.min='1900';year.max='2200';year.value=pending.plannedDate?.slice(0,4)||String(new Date().getFullYear()+1);year.required=true;
   garden.append(new Option('Choose a garden',''));for(const g of getState().parcels)garden.append(new Option(g.name,g.id));
   const refreshBeds=()=>{bed.replaceChildren(new Option('Choose a bed',''));const g=getState().parcels.find(g=>g.id===garden.value);for(const b of g?.beds||[])bed.append(new Option(`${b.name} · ${Math.round(b.width*b.height/144)} sq ft total`,b.id));};garden.onchange=refreshBeds;refreshBeds();
   const create=el('button','Start a new 4 × 8 garden');create.type='button';create.onclick=()=>{try{createGarden();draw();}catch(e){status.textContent=e.message;}};
   const active=getState().parcels.find(g=>g.id===getState().activeParcelId);if(active&&!chooseDestination&&!/^berkshire-botanical|^the-mount|^naumkeag|^ashintully/.test(active.id)){garden.value=active.id;refreshBeds();bed.value=active.activeBedId||'';}
   const newBed=el('details'),newFields=el('fieldset');newBed.append(el('summary','Create a bed in this garden'),newFields);newFields.disabled=!garden.value||!newBed.open;
   const bedName=el('input'),bedWidth=el('input'),bedDepth=el('input');bedName.maxLength=100;bedName.placeholder='e.g. Kitchen bed';
   for(const [input,value]of [[bedWidth,'4'],[bedDepth,'8']]){input.type='number';input.min=input===bedWidth?'2':'1.5';input.max='50';input.step='0.25';input.value=value;}
   const addBed=el('button','Create and select bed');addBed.type='button';
   newFields.append(label('New bed name',bedName),label('Bed width (feet)',bedWidth),label('Bed depth (feet)',bedDepth),el('p','The bed is added beside existing beds. Adjust its position in Plan.'),addBed);
   const updateNewBed=()=>{newFields.disabled=!garden.value||!newBed.open;};garden.addEventListener('change',updateNewBed);newBed.addEventListener('toggle',updateNewBed);
   addBed.onclick=()=>{try{if(!bedWidth.reportValidity()||!bedDepth.reportValidity())return;const id=createBed({gardenId:garden.value,name:bedName.value,width:bedWidth.value,depth:bedDepth.value});refreshBeds();bed.value=id;newBed.open=false;status.textContent='Bed created and selected. Review your plant dimensions, then add the crop to its tray.';}catch(e){status.textContent=e.message;}};
   form.append(label('Garden',garden),label('Bed',bed),newBed,create,label('Planning year',year));
   const plannedDate=el('input');plannedDate.type='date';plannedDate.min='1900-01-01';plannedDate.max='2200-12-31';plannedDate.value=pending.plannedDate||'';plannedDate.onchange=()=>{if(plannedDate.value)year.value=plannedDate.value.slice(0,4);};form.append(label('Planned planting date (optional)',plannedDate));
   const dimensions={};for(const [key,name,value]of [['spacing','Plant spacing (inches)',pending.spacingMax],['diameter','Planned width (inches)',null],['height','Planned height (inches)',null]]){const input=el('input');input.type='number';input.min='1';input.max='1200';input.step='0.5';input.required=true;input.value=value==null?'':String(value);dimensions[key]=input;form.append(label(name,input));}
   form.append(el('p',pending.spacingMax?'Spacing starts at the catalog’s recorded upper bound. Confirm it for your plan. Width and height are your design estimates.':'Dimensions are not established here. Enter design estimates before placing this plant.'));
   const submit=el('button','Add to this bed’s tray');submit.type='submit';form.append(submit);form.onsubmit=e=>{e.preventDefault();try{const plant=plannedCatalogPlant({...pending,plannedDate:plannedDate.value},Object.fromEntries(Object.entries(dimensions).map(([k,v])=>[k,v.value])),`catalog-${crypto.randomUUID()}`);commit({gardenId:garden.value,bedId:bed.value,year:Number(year.value),plannedDate:plannedDate.value||null,plant});pending=null;const remaining=new URLSearchParams(location.hash.slice(1));remaining.delete('plant');history.replaceState(history.state,'',location.pathname+location.search+(remaining.size?'#'+remaining.toString():''));draw();}catch(e){status.textContent=e.message;}};dialog.append(form);
  }
  const state=getState(),tray=state.property.planningTray||[];dialog.append(el('h3',`${state.property.name} · saved choices`));if(!tray.length)dialog.append(el('p','No choices yet. Use Add to plan in Find Plants. Load an account garden first to add choices to that saved workspace.'));
  for(const item of tray){const plant=state.plants.find(p=>p.id===item.plantId),bed=state.beds.find(b=>b.id===item.bedId),row=el('div');row.style.cssText='border-top:1px solid var(--line);padding:8px 0';row.append(el('strong',plant?.name||'Plant unavailable'),el('p',`${item.plannedDate||item.year} · ${bed?.name||'Bed removed'}`));const use=el('button','Arrange in this bed');use.type='button';use.disabled=!bed||!plant;use.onclick=()=>{try{openBed(item);dialog.close();}catch(e){status.textContent=e.message;}};const drop=el('button','Remove choice');drop.type='button';drop.onclick=()=>{try{remove(item.id);draw();}catch(e){status.textContent=e.message;}};row.append(use,drop);dialog.append(row);}
 }
 function open(){draw();dialog.showModal();}launch.onclick=open;
 function update(){launch.textContent=`Planning tray · ${(getState().property.planningTray||[]).length}`;}
 if((pending||error)&&!waitingForGarden)requestAnimationFrame(()=>{if(root.isConnected)open();});invalidation?.then(()=>dialog.remove());return {root,dialog,update,linkedGardenResult(result,options=null){waitingForGarden=result!=='opened';cancelled=result==='cancelled';recovery=result==='unavailable'?options:null;if(result==='opened')chooseDestination=false;if(pending){draw();if(!dialog.open)dialog.showModal();}}};
}

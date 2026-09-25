import {PERSISTENCE} from "../lib/account/persistenceModel.js";
import {ensureNotebook,notebookSyncState} from '../lib/account/notebookCloud.js';
import {gardenSnapshot,planPlanting,localDay,recordAction,recordSoilTest} from '../lib/garden/gardenRecords.js';
import {addGardenObservation,OBSERVATION_TYPES} from '../lib/garden/localGardenStore.js';
const labels={seeded:'Sowed seeds',germinated:'Seedlings emerged',transplanted:'Transplanted',flowered:'Flowers opened',fruit_set:'Fruit forming',harvested:'Harvested',bolted:'Bolting',frost_damage:'Frost damage',heat_damage:'Heat damage',pest_seen:'Pest seen',disease_seen:'Possible disease',watering:'Watered',rain:'Rain',soil_test:'Soil test',note:'Observation'};
function el(tag,text,cls){const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;}
function input(form,label,value='',type='text'){const wrap=el('label',null,'decision-input'),n=el(type==='textarea'?'textarea':'input');if(n.tagName==='INPUT')n.type=type;n.value=value;wrap.append(el('span',label),n);form.append(wrap);return n;}
function select(form,label,rows){const wrap=el('label',null,'decision-input'),n=el('select');for(const [value,text] of rows){const o=el('option',text);o.value=value;n.append(o);}wrap.append(el('span',label),n);form.append(wrap);return n;}
function button(text){const b=el('button',text);b.type='button';return b;}
export function gardenActions({crop='',cropSlug='',date=localDay(),planting=null,observeOnly=false,variety='',catalogPlantId='',catalogSourceUrl=''}={}){
 const root=el('section',null,'garden-actions');root.setAttribute('aria-label',crop?`Plan or observe ${crop}`:'Record a garden observation');
 const bar=el('div',null,'garden-action-bar'),panel=el('div'),status=el('p',null,'save-status');status.setAttribute('role','status');
 const plan=button('Save a planting'),observe=button('Observe');if(!observeOnly)bar.append(plan);bar.append(observe);root.append(bar,panel,status);
 async function open(mode){panel.replaceChildren();status.textContent='Checking your account notebook…';const connection=await ensureNotebook();if(!connection.ready){status.textContent='';const login=el('a','Sign in to record this in your notebook');login.href='/login?returnTo='+encodeURIComponent(location.pathname+location.search);panel.append(login);return;}status.textContent='';const form=el('form',null,'garden-action-form'),snapshot=gardenSnapshot();panel.append(form);
 const cropInput=input(form,'Crop',crop);cropInput.required=mode==='plan';
 const varietyInput=mode==='plan'&&catalogPlantId?input(form,'Variety',variety):null;
 const beds=input(form,'Bed or area (optional)',planting?.bed||'');

 const when=input(form,'Date',date,'date');when.required=true;
 let method,type,notes,interpretation,action;
 if(mode==='plan'){method=select(form,'How will you start?',[['undecided','Decide later'],['sowing','Sow seed'],['transplanting','Transplant']]);}
 else {type=select(form,'What happened?',OBSERVATION_TYPES.map(t=>[t,labels[t]]));type.value='note';notes=input(form,'What did you observe?','','textarea');notes.required=true;const more=el('details');more.append(el('summary','Interpretation and action (optional)'));form.append(more);interpretation=input(more,'What might explain it?','','textarea');action=input(more,'What did you change?','','textarea');}
 const save=el('button',mode==='plan'?'Save planting':'Save observation');save.type='submit';form.append(save);
 form.addEventListener('submit',event=>{event.preventDefault();try{const bed=snapshot.beds.find(b=>`${b.gardenId}|${b.id}`===beds.value);const fields={crop:cropInput.value,cropSlug,date:when.value,bed:bed?.name||beds.value||planting?.bed||'',bedId:bed?.id||'',gardenId:bed?.gardenId||''};const result=mode==='plan'?planPlanting({...fields,method:method.value,variety:varietyInput?.value||variety,catalogPlantId:cropInput.value===crop&&(!varietyInput||varietyInput.value===variety)?catalogPlantId:'',catalogSourceUrl:cropInput.value===crop&&(!varietyInput||varietyInput.value===variety)?catalogSourceUrl:''}):addGardenObservation({...fields,type:type.value,notes:notes.value,interpretation:interpretation.value,action:action.value,plantingId:planting?.id});if(!result.saved)throw Error('Storage is unavailable. Keep this form open and copy your note.');status.replaceChildren(el('span',mode==='plan'?'Planting saved. ':'Observation saved. '));const link=el('a','View notebook');link.href='https://veggie.farm/tools/my-garden';status.append(link);panel.replaceChildren();globalThis.dispatchEvent(new Event('garden-records-changed'));}catch(e){status.textContent=e.message;}});
 cropInput.focus();
 }
 const syncStatus=el('p');syncStatus.setAttribute('role','status');root.append(syncStatus);const updateSync=()=>{if(root.isConnected){const state=notebookSyncState();syncStatus.textContent=['saving','conflict','error'].includes(state.status)?state.message:'';}};globalThis.addEventListener('notebook-sync-status',updateSync);plan.onclick=()=>open('plan');observe.onclick=()=>open('observe');return root;
}
export function gardenDashboard({compact=false,invalidation,crops=[]}={}){
 const root=el('section',null,'garden-dashboard');root.setAttribute('aria-label','Your garden at a glance');
 function render(){const snapshot=gardenSnapshot();root.hidden=compact&&!snapshot.plantings.length;root.replaceChildren(el('p','Plan → do → observe → learn','kicker'),el('h2',snapshot.plantings.length?'Your growing season':'Start with one planting'));
 if(!snapshot.plantings.length){root.append(el('p',PERSISTENCE.notebook.summary));const a=el('a','Find a crop to grow →');a.href='/content/vegetables/';root.append(a);return;}
 root.append(el('p',`${snapshot.plantings.length} saved plantings · ${snapshot.journal.length} observations in your notebook draft`));
 const list=el('div',null,'garden-record-grid');root.append(list);
 for(const p of snapshot.plantings.slice(0,compact?3:60)){const card=el('article',null,'garden-record-card');card.append(el('h3',p.variety?`${p.crop} · ${p.variety}`:p.crop),el('p',`${p.bed} · ${p.date||'Date not recorded'}`),el('strong',p.stage));
 const timeline=el('ol',null,'planting-timeline');for(const text of ['Plan', 'Sow / transplant','Emergence / growth','Flower / fruit','Harvest'])timeline.append(el('li',text));card.append(timeline,el('p','Stages are confirmed by your observations, not inferred from days elapsed.'));
 if(p.observations.length)card.append(el('p',`Latest: ${p.observations[0].notes||labels[p.observations[0].type]}`));const crop=crops.find(c=>c.slug===p.cropSlug||c.name.toLowerCase()===p.crop.toLowerCase());
 const care={
 'Planned · not yet observed':'Before planting, check the starting method and mature spacing in the growing guide.',
 'Sown':'Inspect emergence and seedbed moisture. Record what you see; elapsed time does not confirm growth.',
 'Seedlings emerged':'Compare spacing and thinning guidance for this crop before it becomes crowded.',
 'Transplanted':'Inspect moisture around the root zone and record new growth or stress.',
 'Flowering':crop?.cropGroup==='Leafy'?'Check the crop’s bolting and harvest guidance; flowers change the goal for a leaf crop.':'Record flowering and any weather or water stress. Flowers alone do not establish fruit set.',
 'Fruit forming':'Compare moisture consistency and support needs with the crop guide.',
 'Harvest recorded':'Record harvest stage and quality, then compare actual dates with the plan.',
 'Bolting':'Record heat and harvest quality; review whether to keep the plant for flowers or seed.'
 }[p.stage];
 if(care){card.append(el('h4','Next useful check'),el('p',care),el('small','Guidance follows your recorded stage; inspect the plant before acting.'));if(crop){const guide=el('a',`Read the ${crop.name.toLowerCase()} guide and sources →`);guide.href=crop.path;card.append(guide);}}
 card.append(gardenActions({crop:p.crop,planting:p,observeOnly:true}));list.append(card);}
 const a=el('a',compact?'Open notebook →':'Read the garden planning guide →');a.href=compact?'/tools/my-garden':'/content/garden/planning-your-vegetable-garden';root.append(a);
 if(!compact&&snapshot.actions.length){root.append(el('h3','Changes to follow up'));for(const a of snapshot.actions.slice(-8).reverse())root.append(el('p',`${a.date} · ${a.bed||'Garden'}: ${a.title}${a.reviewDate?` · check again ${a.reviewDate}`:''}`));}
 }
 render();const refresh=()=>render();globalThis.addEventListener('garden-records-changed',refresh);globalThis.addEventListener('storage',refresh);invalidation?.then(()=>{globalThis.removeEventListener('garden-records-changed',refresh);globalThis.removeEventListener('storage',refresh);});return root;
}
export function actionRecorder({title='Record one change',suggestion=''}={}){const root=el('section',null,'decision-workbench');root.append(el('h3',title));const form=el('form',null,'garden-action-form');root.append(form);const bed=input(form,'Bed or area'),when=input(form,'Date',localDay(),'date'),what=input(form,'What did you do?',suggestion,'textarea'),review=input(form,'Check again on (optional)','','date');what.required=true;const b=el('button','Save action');b.type='submit';const status=el('p');status.setAttribute('role','status');form.append(b,status);form.onsubmit=async e=>{e.preventDefault();if(!(await ensureNotebook()).ready){status.textContent='Sign in through Garden Notebook to save this record.';return;}try{const r=recordAction({bed:bed.value,date:when.value,title:what.value,reviewDate:review.value});status.textContent=r.saved?'Draft recorded; check Garden Notebook for account save status.':'Could not save. Keep a copy of this note.';}catch(e){status.textContent=e.message;}};return root;}
export function soilTestRecorder(){const root=el('section',null,'decision-workbench');root.append(el('h3','Keep your laboratory results'),el('p','Copy the report exactly. Values and laboratory recommendations remain your record; this tool does not calculate fertilizer rates.'));const f=el('form',null,'garden-action-form');root.append(f);const fields={date:input(f,'Sample date',localDay(),'date'),bed:input(f,'Bed or area'),laboratory:input(f,'Laboratory'),ph:input(f,'pH','','number'),organicMatter:input(f,'Organic matter (include units)'),phosphorus:input(f,'Phosphorus (include units)'),potassium:input(f,'Potassium (include units)'),report:input(f,'Laboratory interpretation and recommendations','','textarea')};fields.ph.step='.1';fields.ph.min=0;fields.ph.max=14;fields.date.required=true;const b=el('button','Save soil test');b.type='submit';const status=el('p');status.setAttribute('role','status');f.append(b,status);f.onsubmit=async e=>{e.preventDefault();if(!(await ensureNotebook()).ready){status.textContent='Sign in through Garden Notebook to save this report.';return;}try{const r=recordSoilTest(Object.fromEntries(Object.entries(fields).map(([k,n])=>[k,n.value])));status.textContent=r.saved?'Soil test recorded; account save in progress.':'Could not save this report.';}catch(e){status.textContent=e.message;}};return root;}

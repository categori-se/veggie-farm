import {gardenSelection} from '../lib/garden/gardenSelection.js';
import {gardenAttention} from '../lib/garden/gardenAttention.js';
import {notebookGardenLinks} from './notebook-garden-links.js';
import {createPlannerCloudClient} from '../lib/account/plannerCloudClient.js';
import {notebookOwner} from '../lib/account/notebookStorage.js';
import {accountGardenJournal} from '../lib/garden/accountGardenJournal.js';
import {gardenHome} from './garden-home.js';
import {NOTEBOOK_STORAGE} from '../data/runtime-capabilities.js';
export function accountGardenHome({client=createPlannerCloudClient(),owner=notebookOwner,invalidation,local=NOTEBOOK_STORAGE==='local',showToday=false,resume=true,onGardenChange=()=>{}}={}) {
 const root=document.createElement('section');root.className='decision-workbench';root.setAttribute('aria-label','Saved garden home');
 root.innerHTML='<h2>My saved gardens</h2><p>Open the same account garden you saved in Plan. Its beds, plantings and observations stay together.</p><button type="button" data-refresh>Load saved gardens</button><label>Account save <select data-save><option value="">Choose an account save</option></select></label><label>Garden <select data-garden disabled></select></label><button type="button" data-open disabled>Open garden home</button><p data-status role="status"></p><p>Older notebook entries remain below. They are not automatically assigned to a garden.</p>';
 const select=root.querySelector('[data-save]'),gardens=root.querySelector('[data-garden]'),open=root.querySelector('[data-open]'),status=root.querySelector('[data-status]'),refresh=root.querySelector('[data-refresh]');
 const overview=document.createElement('section');overview.setAttribute('aria-label','Your garden today');const links=document.createElement('section');root.append(overview,links);const remembered=gardenSelection({owner});let selectedPlantingId=null;
 const forget=document.createElement('button');forget.type='button';forget.textContent='Forget garden selection';forget.onclick=()=>{remembered.clear();reset();status.textContent='Garden selection forgotten on this browser. Saved garden data was not deleted.';};root.append(forget);
 const session=accountGardenJournal({client,owner});let current=owner(),version=0,disposed=false,dialog=null;
 const reset=()=>{onGardenChange(null);overview.replaceChildren();selectedPlantingId=null;links.replaceChildren();version++;session.clear();select.replaceChildren(new Option('Choose an account save',''));gardens.replaceChildren();gardens.disabled=true;open.disabled=true;dialog?.close();dialog=null;};
 const check=()=>{if(owner()!==current){current=owner();reset();status.textContent='Account changed. Reload your saved gardens.';if(resume&&!local)restoreSelection();}};
 refresh.onclick=async()=>{check();if(!current){status.textContent='Sign in to open your account gardens.';return;}reset();const request=version;refresh.disabled=true;status.textContent='Loading saved gardens…';try{let cursor=null,items=[];do{const result=await client.list(cursor);if(disposed||request!==version||owner()!==current)return;items.push(...result.plans);cursor=result.nextCursor;if(items.length>=200)break;}while(cursor);for(const item of items)select.append(new Option(`${item.updatedAt?.slice(0,10)||'Saved plan'} · ${item.id.slice(-8)}`,item.id));status.textContent=items.length?`Choose a save, then a garden.${cursor?' Showing the first 200 saves.':''}`:'No account gardens yet. Create a garden in Plan and save an account copy.';}catch{status.textContent='Could not load gardens. Retry when connected.';}finally{refresh.disabled=false;}};
 select.onchange=async()=>{onGardenChange(null);overview.replaceChildren();links.replaceChildren();gardens.replaceChildren();gardens.disabled=true;open.disabled=true;dialog?.close();if(!select.value)return;const request=++version;status.textContent='Opening account save…';try{const rows=await session.load(select.value);if(disposed||request!==version||owner()!==current)return;gardens.append(new Option('Choose a garden',''),...rows.map(g=>new Option(g.name,g.id)));gardens.disabled=false;status.textContent='Choose the garden to review or log.';}catch(error){status.textContent=error.message;}};
 gardens.onchange=()=>{onGardenChange(null);overview.replaceChildren();selectedPlantingId=null;try{session.select(gardens.value);onGardenChange(session.workspace());remembered.write({saveId:select.value,gardenId:gardens.value});renderOverview();links.replaceChildren(notebookGardenLinks({session}));open.disabled=false;status.textContent='Ready. Observations save to this account garden.';}catch(error){open.disabled=true;status.textContent=error.message;}};
 open.onclick=()=>{try{check();session.workspace();dialog=gardenHome({getWorkspace:session.workspace,getPlants:session.plants,selectedPlantingId,onLog:async(id,input)=>{await session.log(id,input);renderOverview();},savedMessage:'Observation saved to your account garden.',planLabel:'Open saved plans',onPlan:()=>{globalThis.location.href='https://studio.veggie.farm/#my-gardens';},onBackup:()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(session.backup(),null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='account-garden-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}});root.append(dialog);dialog.showModal();}catch(error){status.textContent=error.message;}};
 function renderOverview(){
  overview.replaceChildren();if(!showToday)return;
  const w=session.workspace(),catalog=new Map(session.plants().map(p=>[p.id,p])),d=new Date(),today=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const text=(tag,value)=>{const n=document.createElement(tag);n.textContent=value;return n;};overview.append(text('h3',`${w.name||w.property?.name||'Your garden'} · ${today}`),text('p',`${w.beds?.length||0} beds · ${w.placements?.length||0} plantings in this saved garden. Open your garden to continue planning or record what happened.`));
  const tasks=gardenAttention(w,today);
  if(!tasks.length)overview.append(text('p','No date-based prompts in these records today. Open your garden to log what you notice.'));
  for(const task of tasks.slice(0,3)){
   const item=text('article','');item.style.cssText='border:1px solid var(--theme-foreground-fainter,#71846d);padding:12px;margin:12px 0;border-radius:6px';const bed=w.beds?.find(b=>b.id===task.bedId);item.append(text('h4',task.title),text('p',`${catalog.get(task.plantId)?.name||'Planting'} · ${bed?.name||'Outside a named bed'}`));const why=text('details','');why.append(text('summary','Why this appears'),text('p',task.explanation));item.append(why);const log=text('button','Open planting & log');log.type='button';log.onclick=()=>{selectedPlantingId=task.plantingId;open.click();};item.append(log);overview.append(item);
  }
  if(tasks.length>3)overview.append(text('p',`${tasks.length-3} more prompts in your garden home.`));
 }
 async function restoreSelection(){
  const chosen=remembered.read();if(!chosen||!current||local)return;
  const request=++version;status.textContent='Opening your selected garden…';
  try{const rows=await session.load(chosen.saveId);if(disposed||request!==version||owner()!==current)return;
   select.replaceChildren(new Option('Choose an account save',''),new Option('Previously selected account save',chosen.saveId));select.value=chosen.saveId;gardens.replaceChildren(new Option('Choose a garden',''),...rows.map(g=>new Option(g.name,g.id)));gardens.disabled=false;
   if(!rows.some(g=>g.id===chosen.gardenId)){status.textContent='Your previous garden is no longer in this save. Choose another garden.';return;}
   gardens.value=chosen.gardenId;gardens.onchange();
  }catch{if(!disposed&&request===version&&owner()===current){session.clear();status.textContent='Could not reopen your selected garden. Load saved gardens to retry.';}}
 }
 if(resume&&!local)restoreSelection();
 if(local){root.replaceChildren();const link=document.createElement('a');link.href='/studio';link.textContent='Open your garden plan and history';root.append(link);}
 globalThis.addEventListener('storage',check);globalThis.addEventListener('focus',check);const timer=setInterval(check,2000);invalidation?.then(()=>{disposed=true;reset();clearInterval(timer);globalThis.removeEventListener('storage',check);globalThis.removeEventListener('focus',check);});return root;
}

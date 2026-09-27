import {accountGardenForPlanning} from '../lib/garden/accountGardenForPlanning.js';
import {gardenTodayHref,readGardenHandoff,withoutGardenHandoff} from '../lib/garden/gardenHandoff.js';
import {getAccessToken} from '../lib/account/auth.js';
import {createPlannerCloudClient} from '../lib/account/plannerCloudClient.js';
import {parsePlannerBackup} from '../lib/garden/plannerBackup.js';

export function plannerAccount({exportPlanner,restorePlanner,client:providedClient,session:getSession=getAccessToken,demo=false,onLinkedGarden=()=>{},linkedGarden=readGardenHandoff(globalThis.location?.hash)}) {
  const root=document.createElement('details');
  root.className='planner-account';
  root.innerHTML=`<summary>Account saves</summary>
    <p>Save your own gardens and their named versions privately to your account. Public demo experiments stay in this browser and are excluded from account saves.</p>
    <a href="/login?returnTo=%2Fstudio">Sign in / account</a>
    <div><button type="button" data-cloud="create">Save new account copy</button>
    <button type="button" data-cloud="list">Load my account saves</button></div>
    <label>Account copy <select data-cloud-list><option value="">Choose a saved copy</option></select></label>
    <button type="button" data-cloud="more" hidden>More saved copies</button>
    <button type="button" data-cloud="restore">Restore selected copy</button>
    <button type="button" data-cloud="update" disabled>Update open account copy</button>
    <button type="button" data-cloud="history">Show selected copy’s history</button>
    <label>Earlier version <select data-cloud-history><option value="">Choose a version</option></select></label>
    <button type="button" data-cloud="restore-version">Restore earlier version locally</button>
    <button type="button" data-cloud="delete">Delete selected account copy</button>
    <p data-cloud-status role="status" aria-live="polite">Cloud saves require sign-in. Nothing uploads automatically.</p>`;
  const client=providedClient||createPlannerCloudClient(), status=root.querySelector('[data-cloud-status]'), select=root.querySelector('[data-cloud-list]'), history=root.querySelector('[data-cloud-history]');
  if(demo){root.querySelector('a').remove();root.querySelector('summary').textContent='Demo account saves';root.querySelector('p').textContent='Simulated account: save, update, restore and inspect versions. Nothing is uploaded. All data expires or disappears when this page closes.';}
  if(demo)status.textContent='Demo saves stay in memory and disappear on reset or expiry.';
  const today=document.createElement('a');today.hidden=true;today.textContent='Continue with this saved garden in Today →';root.append(today);
  const handoff=(saved,payload)=>{const href=!demo&&gardenTodayHref({saveId:saved.id,gardenId:payload.activeParcelId});today.hidden=!href;if(href)today.href=href;else today.removeAttribute('href');};
  const buttons=[...root.querySelectorAll('button')];
  const update=root.querySelector('[data-cloud="update"]'),more=root.querySelector('[data-cloud="more"]');
  let session=getSession(), active=null, cursor=null, historyId=null, busy=false;
  const clearHistory=()=>{historyId=null;history.replaceChildren(new Option('Choose a version',''));};
  select.addEventListener('change',()=>{
    clearHistory();
    status.textContent='Account copy selected. Load its history to choose an earlier version.';
  });
  const clear=()=>{today.hidden=true;today.removeAttribute('href');active=null;cursor=null;clearHistory();select.replaceChildren(new Option('Choose a saved copy',''));update.disabled=true;more.hidden=true;};
  const check=()=>{const next=getSession();if(next!==session){session=next;clear();status.textContent='Account session changed. Reload your account saves. Local work is unchanged.';}};
  root.addEventListener('focusin',check);
  const messages={missing_linked_bed:'The linked bed is no longer in this garden. Your local work is unchanged.',missing_linked_garden:'The linked garden is not in this account copy. Your local work is unchanged.',demo_expired:'Demo expired. Reset to begin a new sandbox.',demo_limit:'Demo operation or saved-copy limit reached. Reset to begin again.',demo_rate_limit:'Please wait a moment between demo operations.',invalid_account_layout:'A saved version has conflicting garden identities. Download a local backup and review that version before saving to your account.',no_personal_gardens:'Create your own garden first. Public demo edits stay in this browser.',sign_in_required:'Sign in first. Your local work is unchanged.',session_changed:'Account session changed. Reload your account saves.',revision_conflict:'This account copy has newer changes. Save a new copy to keep your edits, or reload it before updating.',save_too_large:'This planner exceeds the current 2 MiB cloud-save limit. Download a JSON backup; your local work is unchanged.'};
  const run=async task=>{
    if(busy)return;check();busy=true;buttons.forEach(b=>b.disabled=true);select.disabled=true;history.disabled=true;
    try {await task();} catch(error){check();status.textContent=(demo&&error.code==='save_too_large'?'Demo storage limit reached (512 KiB including drafts and versions). Reset to start again.':messages[error.code]) || 'Account save service is unavailable. Your local work is unchanged; download a JSON backup before leaving.';}
    finally{busy=false;buttons.forEach(b=>b.disabled=false);select.disabled=false;history.disabled=false;update.disabled=!active;}
  };
  const loadList=async append=>{
    const result=await client.list(append?cursor:undefined);
    if(!Array.isArray(result.plans)) throw Error('invalid list');
    if(!append){select.replaceChildren(new Option('Choose a saved copy',''));clearHistory();}
    for(const item of result.plans)select.add(new Option(`${item.updatedAt || 'Saved copy'} · ${item.id}`,item.id));
    cursor=result.nextCursor;more.hidden=!cursor;
    status.textContent='Account copies loaded. Restoring replaces personal gardens after confirmation; local demo edits are preserved.';
  };
  root.querySelector('[data-cloud="list"]').onclick=()=>run(()=>loadList(false));
  more.onclick=()=>run(()=>loadList(true));
  root.querySelector('[data-cloud="create"]').onclick=()=>run(async()=>{
    if(!getSession())throw Object.assign(Error(),{code:'sign_in_required'});
    const payload=exportPlanner();
    const name=window.prompt('Name for this private planner copy','My garden plans');if(!name?.trim())return;
    const saved=await client.create(name.trim(),payload);
    active={...saved,name:name.trim()};handoff(saved,payload);status.textContent=demo?'Demo copy saved in memory. Further edits need an explicit update.':'Private account copy saved. Further edits still need an explicit account update.';
  });
  root.querySelector('[data-cloud="restore"]').onclick=()=>run(async()=>{
    if(!select.value){status.textContent='Choose an account copy first.';return;}
    const saved=await client.load(select.value),candidate=parsePlannerBackup(JSON.stringify(saved.payload));
    if(!window.confirm(`Restore “${saved.name}”? This replaces your personal gardens. Public demo edits stay in this browser. Download a JSON backup first if you want to keep your local edits.`)){status.textContent='Restore cancelled. Local work is unchanged.';return;}
    restorePlanner(candidate);active=saved;handoff(saved,candidate);status.textContent='Account copy restored. Check browser-save status before leaving; further cloud updates are explicit.';
  });
  update.onclick=()=>run(async()=>{
    if(!active)return;
    const payload=exportPlanner();
    const saved=await client.update(active.id,active.revision,active.name,payload);
    active={...active,...saved};handoff(active,payload);status.textContent='Account copy updated.';
  });
  root.querySelector('[data-cloud="history"]').onclick=()=>run(async()=>{
    if(!select.value){status.textContent='Choose an account copy first.';return;}
    const id=select.value,result=await client.history(id);
    history.replaceChildren(new Option('Choose a version',''));historyId=id;
    for(const item of result.versions || [])history.add(new Option(`${item.updatedAt || 'Saved version'}${item.current?' (current)':''}`,item.version));
    status.textContent=result.truncated?'Showing the most recent 20 history entries. Older retained versions need archive recovery.':'Version history loaded.';
  });
  root.querySelector('[data-cloud="restore-version"]').onclick=()=>run(async()=>{
    if(!historyId || historyId!==select.value || !history.value){status.textContent='Choose an earlier version first.';return;}
    const saved=await client.load(historyId,history.value),candidate=parsePlannerBackup(JSON.stringify(saved.payload));
    if(!window.confirm('Restore this earlier version locally? Download a JSON backup first to keep your current edits. The cloud copy will not be overwritten.'))return;
    restorePlanner(candidate);active=null;today.hidden=true;today.removeAttribute('href');
    status.textContent='Earlier version restored locally. Save a new account copy to keep it in the cloud.';
  });
  root.querySelector('[data-cloud="delete"]').onclick=()=>run(async()=>{
    if(!select.value){status.textContent='Choose an account copy first.';return;}
    const id=select.value,saved=await client.load(id);
    if(!window.confirm(demo?`Delete “${saved.name}” and its demo versions? The open planner stays unchanged.`:`Delete “${saved.name}” from your account list? Your open local planner stays unchanged. Backup versions are retained in storage; this is not permanent erasure.`))return;
    if(demo)await new Promise(resolve=>setTimeout(resolve,250));
    await client.remove(id,saved.revision);
    if(active?.id===id){active=null;today.hidden=true;today.removeAttribute('href');}
    clearHistory();
    [...select.options].filter(option=>option.value===id).forEach(option=>option.remove());
    status.textContent=demo?'Demo copy and its versions deleted. Your open planner is unchanged.':'Account copy deleted from the list. Your local planner is unchanged. Backup versions are retained.';
  });
  const consumeLinked=()=>{const url=new URL(globalThis.location.href);url.hash=withoutGardenHandoff(url.hash);globalThis.history.replaceState(globalThis.history.state,'',url);linkedGarden=null;};
  const openLinked=async()=>{
    if(!linkedGarden){status.textContent='The linked garden request is finished.';return;}
    if(!getSession()){status.textContent='Sign in to open this linked garden. Your local work is unchanged.';return;}
    const started=getSession(),chosen=linkedGarden;
    const saved=await client.load(chosen.saveId);
    if(getSession()!==started)throw Object.assign(Error(),{code:'session_changed'});
    const candidate=accountGardenForPlanning(saved.payload,chosen.gardenId,chosen.bedId),garden=candidate.parcels.find(g=>g.id===chosen.gardenId);
    if(!window.confirm(`Open “${garden.name||garden.property?.name||'Garden'}” in Plan? This restores the account copy (${candidate.parcels.length} personal gardens) and replaces your local personal gardens. Local demo edits stay. Cancel to download a backup or save local edits first.`)){consumeLinked();onLinkedGarden('cancelled');status.textContent='Opening cancelled. Your local work is unchanged.';return;}
    if(getSession()!==started)throw Object.assign(Error(),{code:'session_changed'});
    restorePlanner(candidate);active=saved;handoff(saved,candidate);consumeLinked();onLinkedGarden('opened');status.textContent='Selected garden opened. Further account updates are explicit.';
  };
  if(linkedGarden&&!demo){
    root.open=true;const retry=document.createElement('button');retry.type='button';retry.textContent='Open linked garden';retry.onclick=()=>run(openLinked);root.append(retry);buttons.push(retry);
    const login=root.querySelector('a');login.href='/login?returnTo='+encodeURIComponent(globalThis.location.pathname+globalThis.location.search+globalThis.location.hash);
    queueMicrotask(()=>{root.scrollIntoView({block:'start'});run(openLinked);});
  }else if (session) queueMicrotask(() => run(() => loadList(false)));
  return root;
}

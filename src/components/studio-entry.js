import {notebookOwner} from '../lib/account/notebookStorage.js';

// Only read the active owner's planner key. Opening a welcome screen must not
// create a demo save or inspect another account's browser workspace.
export function hasStudioDraft(owner,storage){
 try{return Boolean(storage.getItem(owner?`veggie.farm:account-planner:${encodeURIComponent(owner)}:v8`:'veggie.farm:garden-studio:v8'));}catch{return false;}
}
export function studioEntry(createPlanner,{invalidation,owner=notebookOwner,storage=()=>globalThis.localStorage}={}){
 const root=document.createElement('div');root.className='studio-entry';let planner=null;
 function mount(){if(planner)return planner;const next=createPlanner();planner=next;root.replaceChildren(planner);return planner;}
 const open=()=>mount();document.addEventListener('veggie-farm:open-planner',open);
 invalidation?.then(()=>document.removeEventListener('veggie-farm:open-planner',open));
 let returning=false;try{returning=hasStudioDraft(owner(),storage());}catch{}
 if(returning||location.hash){mount();return root;}
 const welcome=document.createElement('section');welcome.className='studio-welcome';welcome.style.cssText='max-width:720px;margin:2rem auto;padding:clamp(1rem,4vw,2rem);border:1px solid var(--line);border-radius:12px;background:var(--panel);font-family:var(--sans)';
 welcome.innerHTML='<h1>Plan your garden</h1><p>Start with a bed. Add a few plants. See how much space they need.</p><p>No account or home address needed.</p><div data-primary></div><p>1 · Your bed &nbsp; 2 · Plants &nbsp; 3 · Arrange &nbsp; 4 · Save</p><nav aria-label="Other ways to start" style="display:flex;flex-wrap:wrap;gap:12px;margin-top:1.5rem"></nav><p data-status role="status"></p>';
 const status=welcome.querySelector('[data-status]');
 const button=(label,action)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.style.cssText='min-height:44px;padding:10px 16px;font:inherit';b.onclick=()=>{try{action();}catch{status.textContent='Could not open the planner. Reload to retry; existing browser gardens have not been replaced.';}};return b;};
 welcome.querySelector('[data-primary]').append(button('Start with a 4 × 8 bed',()=>mount().querySelector('[data-role="start-practice-garden"]').click()));
 const nav=welcome.querySelector('nav');nav.append(button('Use a map',()=>{const p=mount(),mode=p.querySelector('[data-role="studio-mode"]');mode.value='advanced';mode.dispatchEvent(new Event('change'));p.querySelector('[data-tool="parcel"]').click();}),button('Restore a backup',()=>mount().querySelector('[data-role="restore-backup"]').click()),button('Open account gardens',()=>{const panel=mount().querySelector('.planner-account');panel.open=true;panel.scrollIntoView({block:'start'});}));
 const examples=document.createElement('a');examples.textContent='Explore examples';examples.href='#garden-examples';nav.append(examples);root.append(welcome);return root;
}

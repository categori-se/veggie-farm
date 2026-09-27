import {gardenSelection} from '../lib/garden/gardenSelection.js';
import {gardenPlanHref} from '../lib/garden/gardenHandoff.js';
import {notebookOwner} from '../lib/account/notebookStorage.js';

// Carry only owner-scoped saved identifiers. Plan still validates and confirms
// the account restore before replacing local personal work.
export function mountJourneyLinks({owner=notebookOwner,local=false,invalidation,root=globalThis.document,events=globalThis,selection=gardenSelection({owner})}={}) {
  if(local)return;
  const links=[...root.querySelectorAll('[data-journey="plan"]')];
  const original=new Map(links.map(link=>[link,link.getAttribute('href')]));
  const update=()=>{
    const href=gardenPlanHref(selection.read());
    for(const link of links) {
      // Within Plan, retain the current workspace instead of triggering a restore.
      link.setAttribute('href',link.getAttribute('aria-current')==='page' ? original.get(link) : href||original.get(link));
    }
  };
  links.forEach(link=>link.addEventListener('click',update));
  const signals=['focus','storage','pageshow','notebook-sync-status'];
  signals.forEach(name=>events.addEventListener(name,update));
  update();
  invalidation?.then(()=>{
    links.forEach(link=>{link.removeEventListener('click',update);link.setAttribute('href',original.get(link));});
    signals.forEach(name=>events.removeEventListener(name,update));
  });
}

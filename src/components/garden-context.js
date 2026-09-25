// Use only in decision tools and the notebook; general reference pages link to timing in context.
import {loadGardenProfile, profileDatesForYear} from '../lib/garden/localGardenStore.js';
import {notebookSyncState} from '../lib/account/notebookCloud.js';
import {localDay} from '../lib/garden/gardenRecords.js';
const element=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;};
export function gardenContext({invalidation}={}) {
 const root=document.createElement('aside');root.className='garden-context';root.setAttribute('aria-label','Garden context');
 const render=()=>{
  const profile=loadGardenProfile(),today=localDay();root.replaceChildren();
  root.append(element('strong',profile?.gardenName||'Massachusetts gardening'),element('time',today));root.querySelector('time').dateTime=today;
  if(profile){
   if(profile.locationLabel)root.append(element('span',profile.locationLabel));
   const dates=profileDatesForYear(profile,Number(today.slice(0,4)));
   root.append(element('span',`Frost assumptions: ${dates.lastFrostDate.slice(5)} / ${dates.firstFrostDate.slice(5)}`));
   if(profile.sunHours!==null)root.append(element('span',`Entered sun: ${profile.sunHours} h`));
   if(profile.soilTemperatureF!==null)root.append(element('span',`Entered soil: ${profile.soilTemperatureF}°F · ${profile.soilTemperatureMeasuredOn ? `measured ${profile.soilTemperatureMeasuredOn}` : "measurement date not recorded"}`));
   const state=notebookSyncState();root.append(element('small',['saving','conflict','error'].includes(state.status)?state.message:'Notebook context · browser draft; open Notebook to refresh'));
  }else root.append(element('span','Choose local frost dates and measured conditions'));
  const a=element('a',profile?'Edit notebook context':'Set planting assumptions');a.href=profile?'/tools/my-garden':'/tools/today';root.append(a);
 };
 render();for(const event of ['garden-records-changed','notebook-sync-status','storage'])globalThis.addEventListener(event,render);
 const timer=setInterval(render,60000);
 invalidation?.then(()=>{clearInterval(timer);for(const event of ['garden-records-changed','notebook-sync-status','storage'])globalThis.removeEventListener(event,render);});return root;
}

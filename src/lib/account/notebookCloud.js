import {NOTEBOOK_STORAGE} from '../../data/runtime-capabilities.js';
const localNotebook = NOTEBOOK_STORAGE === 'local';
const localMessage = 'Saved in this browser only. Export a backup before clearing browser data.';
import {createPlannerCloudClient} from './plannerCloudClient.js';
import {notebookOwner,notebookStorage} from './notebookStorage.js';
const keys={profile:'veggie.farm:garden-profile:v1',observations:'veggie.farm:garden-journal:v1',records:'veggie.farm:garden-records:v1'};
let client,owner,ready=false,loading,timer,chain=Promise.resolve();
let state={status:'signed_out',message:'Sign in to keep a private notebook in your account.'};
export function notebookSyncState(){if(localNotebook)return {status:'local',message:localMessage};return notebookOwner()===owner?state:{status:'signed_out',message:'Sign in to keep a private notebook in your account.'};}
function notify(status,message){state={status,message};globalThis.dispatchEvent?.(new Event('notebook-sync-status'));}
function meta(s){try{return JSON.parse(s.getItem('sync')||'{}');}catch{return {};}}
export function notebookPayload(){const s=notebookStorage();const read=(k,f)=>{try{return JSON.parse(s?.getItem(k)||'null')??f;}catch{return f;}};return {schemaVersion:1,profile:read(keys.profile,null),observations:read(keys.observations,[]),records:read(keys.records,{schemaVersion:1,plantings:[],actions:[],soilTests:[]})};}
function apply(payload,s){if(!payload||payload.schemaVersion!==1||!Array.isArray(payload.observations)||!payload.records)throw Error('Invalid notebook');const prior=Object.values(keys).map(k=>[k,s.getItem(k)]);try{for(const [field,key]of Object.entries(keys))s.setItem(key,JSON.stringify(payload[field]));}catch(e){for(const [key,value]of prior){try{value===null?s.removeItem(key):s.setItem(key,value);}catch{}}throw e;}}
export async function ensureNotebook({replaceDraft=false}={}){
 if(localNotebook){const storage=notebookStorage();try{if(!storage)throw Error();const probe='veggie.farm:storage-probe';storage.setItem(probe,'1');storage.removeItem(probe);notify('local',localMessage);return {ready:true};}catch{notify('error','Browser storage is unavailable. Export or copy your work before leaving.');return {ready:false};}}
 const current=notebookOwner();if(!current){ready=false;owner=null;notify('signed_out','Sign in to keep a private notebook in your account.');return {ready:false};}
 if(current===owner&&ready&&!replaceDraft)return {ready:true};if(current===owner&&loading)return loading;
 owner=current;ready=false;client=createPlannerCloudClient();const s=notebookStorage();if(!s){notify('error','Browser storage is unavailable.');return {ready:false};}
 notify('loading','Loading your private notebook…');
 loading=(async()=>{try{const result=await client.loadNotebook();if(notebookOwner()!==current)return {ready:false};const m=meta(s);if(m.dirty&&m.revision!==result.revision&&!replaceDraft){notify('conflict','Your account has newer notes. Export this browser draft before loading the account copy.');return {ready:false};}
 if(!m.dirty||replaceDraft){apply(result.payload||{schemaVersion:1,profile:null,observations:[],records:{schemaVersion:1,plantings:[],actions:[],soilTests:[]}},s);s.setItem('sync',JSON.stringify({revision:result.revision,dirty:false}));}
 ready=true;notify('saved',result.payload?'Private notebook loaded from your account.':'Your notebook is ready. New entries save privately to your account.');globalThis.dispatchEvent?.(new Event('garden-records-changed'));if(m.dirty&&!replaceDraft)schedule();return {ready:true};
 }catch{notify('error','Account storage is unavailable. Existing browser drafts are preserved; try loading again before editing.');return {ready:false};}finally{loading=null;}})();return loading;
}
async function flush(){const current=notebookOwner();if(!ready||!current||current!==owner)return;const s=notebookStorage(),m=meta(s);if(!m.dirty)return;const payload=notebookPayload(),sent=JSON.stringify(payload);notify('saving','Saving your private notebook…');try{const result=await client.saveNotebook(m.revision??null,payload);if(notebookOwner()!==current)return;const changed=JSON.stringify(notebookPayload())!==sent;s.setItem('sync',JSON.stringify({revision:result.revision,dirty:changed}));notify(changed?'saving':'saved',changed?'Saving your latest changes…':'Saved to your private account.');if(changed)schedule();}catch(e){ready=false;notify(e.code==='revision_conflict'?'conflict':'error',e.code==='revision_conflict'?'Another browser saved newer notes. Your draft is preserved. Export it before loading the account copy.':'Could not save to your account. Your draft remains in this browser; retry before leaving.');}}
function schedule(){if(localNotebook){notify('local',localMessage);return;}if(ready)notify('saving','Changes recorded; saving to your account…');clearTimeout(timer);timer=setTimeout(()=>{chain=chain.then(flush);},500);}
if(typeof window!=='undefined')window.addEventListener('notebook-draft-changed',schedule);
export async function retryNotebook(){ready=false;return ensureNotebook();}

export async function importNotebookDraft(input){
function inspect(value,depth=0){if(depth>20)throw Error('Notebook structure is too deeply nested.');if(value&&typeof value==='object')for(const [key,child]of Object.entries(value)){if(['__proto__','prototype','constructor'].includes(key))throw Error('Unsupported notebook property.');inspect(child,depth+1);}}
inspect(input);
const validDate=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(new Date(d+'T12:00:00Z').getTime())&&new Date(d+'T12:00:00Z').toISOString().slice(0,10)===d;
const types=['seeded','germinated','transplanted','flowered','fruit_set','harvested','bolted','frost_damage','heat_damage','pest_seen','disease_seen','watering','rain','soil_test','note'];
if(input?.observations?.some(r=>!validDate(r.date)||!types.includes(r.type)||typeof r.createdAt!=='string'))throw Error('An observation has an invalid date or type.');
if(input?.records?.plantings?.some(r=>typeof r.crop!=='string'||!validDate(r.date)))throw Error('A planting record is invalid.');
if(!(await ensureNotebook()).ready)throw Error('Open your notebook before importing.');if(!input||!Array.isArray(input.observations)||input.observations.some(r=>!r||typeof r.id!=='string'))throw Error('Choose a notebook export with valid observation records.');const current=notebookPayload();const merge=(a=[],b=[])=>[...new Map([...b,...a].map(r=>[r.id,r])).values()];const next={schemaVersion:1,profile:current.profile||input.profile||null,observations:merge(current.observations,input.observations),records:{...current.records}};for(const key of ['plantings','actions','soilTests']){const rows=input.records?.[key]||[];if(!Array.isArray(rows)||rows.some(r=>!r||typeof r.id!=='string'))throw Error('Invalid notebook records.');next.records[key]=merge(current.records[key],rows);}if(new TextEncoder().encode(JSON.stringify(next)).length>1900000)throw Error('This notebook is too large to merge. Keep the file as a separate backup.');const s=notebookStorage();apply(next,s);s.setItem('sync',JSON.stringify({...meta(s),dirty:true}));schedule();globalThis.dispatchEvent(new Event('garden-records-changed'));return next;}

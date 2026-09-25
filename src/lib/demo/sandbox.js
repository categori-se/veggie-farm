import {parsePlannerBackup} from '../garden/plannerBackup.js';
export const DEMO_LIMITS=Object.freeze({lifetimeMs:15*60*1000,maxBytes:512*1024,maxPlans:3,maxVersions:4,maxOperations:60,minIntervalMs:250});
const fail=code=>Object.assign(new Error(code),{code});
// Deliberately has no fetch, token, identity-provider or persistent-storage dependency.
export function createAccountSandbox({now=Date.now,id=()=>crypto.randomUUID(),limits=DEMO_LIMITS}={}){
 const started=now(),plans=new Map(),drafts=new Map();let operations=0,last=-Infinity,closed=false;
 const active=()=>!closed&&now()-started<limits.lifetimeMs;
 function expire(){if(!active()){plans.clear();drafts.clear();closed=true;throw fail('demo_expired');}}
 function bytes(){return new TextEncoder().encode(JSON.stringify([...plans])).length+new TextEncoder().encode(JSON.stringify([...drafts])).length;}
 function operation(){expire();if(operations>=limits.maxOperations)throw fail('demo_limit');if(now()-last<limits.minIntervalMs)throw fail('demo_rate_limit');last=now();operations++;}
 const copy=x=>structuredClone(x);
 const current=id=>{const plan=plans.get(id);if(!plan)throw fail('unavailable');return plan;};
 const payload=value=>parsePlannerBackup(JSON.stringify(value));
 function transaction(fn){const old=copy([...plans]);try{const result=fn();if(bytes()>limits.maxBytes)throw fail('save_too_large');return copy(result);}catch(e){plans.clear();for(const [k,v]of old)plans.set(k,v);throw e;}}
 function save(key,revision,name,value,create){operation();return transaction(()=>{
  if(typeof name!=='string'||!name.trim()||name.length>160)throw fail('invalid_response');
  const prior=create?null:current(key);if(prior&&prior.revision!==revision)throw fail('revision_conflict');
  if(create&&plans.size>=limits.maxPlans)throw fail('demo_limit');
  const record={id:key,name,payload:payload(value),revision:id(),updatedAt:new Date(now()).toISOString()};
  const versions=[...(prior?.versions||[]),{...record,version:record.revision}].slice(-limits.maxVersions);
  plans.set(key,{...record,versions});return record;
 });}
 const client={
  list:async()=>{operation();return {plans:[...plans.values()].map(({id,name,revision,updatedAt})=>({id,name,revision,updatedAt}))};},
  create:async(name,value)=>save(id(),null,name,value,true),
  update:async(key,revision,name,value)=>save(key,revision,name,value,false),
  load:async(key,version)=>{operation();const p=current(key);const value=version?p.versions.find(v=>v.version===version):p;if(!value)throw fail('unavailable');return copy(value);},
  history:async key=>{operation();const p=current(key);return {versions:p.versions.map(v=>({version:v.version,updatedAt:v.updatedAt,current:v.revision===p.revision})),truncated:false};},
  remove:async(key,revision)=>{operation();if(current(key).revision!==revision)throw fail('revision_conflict');plans.delete(key);return {};}
 };
 const storage={getItem:key=>{expire();return drafts.get(key)??null;},removeItem:key=>{expire();drafts.delete(key);},setItem:(key,value)=>{expire();const old=drafts.get(key);drafts.set(key,String(value));if(bytes()>limits.maxBytes){old===undefined?drafts.delete(key):drafts.set(key,old);throw fail('save_too_large');}}};
 return {client,storage,session:()=>active()?'local-demo-session':null,expiresAt:started+limits.lifetimeMs,close:()=>{closed=true;plans.clear();drafts.clear();},stats:()=>({operations,plans:plans.size,bytes:bytes(),active:active()})};
}

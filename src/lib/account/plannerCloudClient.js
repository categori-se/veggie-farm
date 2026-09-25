import {getAccessToken} from './auth.js';
export const MAX_CLOUD_REQUEST_BYTES = 2 * 1024 * 1024;
const fail = (code) => Object.assign(new Error(code),{code});
export function createPlannerCloudClient({fetchImpl=globalThis.fetch.bind(globalThis),token=getAccessToken,origin=globalThis.location.origin}={}) {
  let basePromise;
  const base = () => basePromise ||= (async()=>{
    const response=await fetchImpl(new URL('/account-config.json',origin),{credentials:'omit',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(15000)});
    const text=await response.text();
    if(!response.ok || text.length>16384) throw fail('unavailable');
    const config=JSON.parse(text),url=new URL(config.apiBaseUrl);
    if(config.version!==1 || url.protocol!=='https:' || url.username || url.password || url.search || url.hash) throw fail('unavailable');
    return url.href.replace(/\/$/,'');
  })().catch(error=>{basePromise=null;throw error;});
  const request=async(method,path,input,extraHeaders={})=>{
    const session=token(); if(!session) throw fail('sign_in_required');
    const body=input===undefined?undefined:JSON.stringify(input);
    if(body && new TextEncoder().encode(body).length>MAX_CLOUD_REQUEST_BYTES) throw fail('save_too_large');
    const endpoint=await base();
    if(token()!==session) throw fail('session_changed');
    const response=await fetchImpl(endpoint+path,{method,headers:{...extraHeaders,authorization:`Bearer ${session}`,accept:'application/json',...(body?{'content-type':'application/json'}:{})},body,credentials:'omit',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(15000)});
    const text=await response.text();
    if(token()!==session) throw fail('session_changed');
    if(text.length>MAX_CLOUD_REQUEST_BYTES+65536) throw fail('invalid_response');
    let value;try{value=JSON.parse(text);}catch{throw fail('invalid_response');}
    if(!response.ok) throw fail(response.status===409?'revision_conflict':response.status===401?'sign_in_required':response.status===413?'save_too_large':'unavailable');
    return value;
  };
  const idPath=id=>{if(!/^[a-f0-9-]{36}$/.test(id)) throw fail('invalid_response');return `/plans/${id}`;};
  return {
    loadNotebook:version=>request('GET','/plans/notebook'+(version?'?version='+encodeURIComponent(version):'')),
    saveNotebook:(revision,payload)=>request('PUT','/plans/notebook',{revision,payload}),
    notebookHistory:()=>request('GET','/plans/notebook?history=1'),
    removeNotebook:revision=>request('DELETE','/plans/notebook',undefined,{'if-match':revision}),
    list:cursor=>request('GET',`/plans${cursor?'?cursor='+encodeURIComponent(cursor):''}`),
    load:(id,version)=>request('GET',idPath(id)+(version?'?version='+encodeURIComponent(version):'')),
    history:id=>request('GET',idPath(id)+'?history=1'),
    remove:(id,revision)=>request('DELETE',idPath(id),undefined,{'if-match':revision}),
    create:(name,payload)=>request('POST','/plans',{name,payload}),
    update:(id,revision,name,payload)=>request('PUT',idPath(id),{name,payload,revision})
  };
}

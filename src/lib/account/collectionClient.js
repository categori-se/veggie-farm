import {getAccessToken} from './auth.js';
const fail = code => Object.assign(Error(code),{code});
export function createCollectionClient({fetchImpl=globalThis.fetch.bind(globalThis),token=getAccessToken,origin=globalThis.location.origin}={}) {
  let basePromise;
  const base = () => basePromise ||= (async()=>{
    const response=await fetchImpl(new URL('/account-config.json',origin),{credentials:'omit',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(15000)});
    const text=await response.text();if(!response.ok || text.length>16384)throw fail('unavailable');
    const config=JSON.parse(text),url=new URL(config.apiBaseUrl);
    if(config.version!==1 || url.protocol!=='https:' || url.username || url.password || url.search || url.hash)throw fail('unavailable');
    return url.href.replace(/\/$/,'');
  })().catch(error=>{basePromise=null;throw error;});
  return {async request(method,path,input,revision,{publicRead=false}={}) {
    if(!/^\/(?:workspaces|public\/collections)(?:[/?]|$)/.test(path) || path.includes('..'))throw fail('invalid_request');
    if(publicRead && (method!=='GET' || !path.startsWith('/public/collections/')))throw fail('invalid_request');
    const session=token();if(!publicRead && !session)throw fail('sign_in_required');
    const body=input===undefined?undefined:JSON.stringify(input);
    if(body && new TextEncoder().encode(body).length>2*1024*1024)throw fail('request_too_large');
    const endpoint=await base();if(!publicRead && token()!==session)throw fail('session_changed');
    const response=await fetchImpl(endpoint+path,{method,body,headers:{accept:'application/json',...(!publicRead?{authorization:`Bearer ${session}`} : {}),...(body?{'content-type':'application/json'}:{}),...(revision?{'if-match':revision}:{})},credentials:'omit',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(20000)});
    const text=await response.text();if(!publicRead && token()!==session)throw fail('session_changed');
    if(text.length>2*1024*1024+65536)throw fail('invalid_response');
    let value;try{value=JSON.parse(text);}catch{throw fail('invalid_response');}
    if(!response.ok)throw fail(typeof value.error==='string'?value.error:'unavailable');
    return value;
  }};
}

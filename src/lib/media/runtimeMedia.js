// Media is optional deployment data. No publisher URLs, tokens or binaries are bundled.
export function parseMediaManifest(value){
 if(value?.version!==1||!value.assets||typeof value.assets!=='object'||Array.isArray(value.assets))throw Error('Invalid media manifest');
 const result={};const entries=Object.entries(value.assets);if(entries.length>5000)throw Error('Media manifest too large');
 for(const [id,record]of entries){
  if(!/^[a-zA-Z0-9][a-zA-Z0-9:._/-]{0,199}$/.test(id)||id.split('/').some(p=>p==='..')||['__proto__','constructor','prototype'].includes(id))throw Error('Invalid media identity');
  const url=new URL(record.url);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)throw Error('Expected credential-free HTTPS media URL');
  result[id]=Object.freeze({url:url.href,alt:typeof record.alt==='string'?record.alt.slice(0,1000):'',caption:typeof record.caption==='string'?record.caption.slice(0,4000):''});
 }
 return Object.freeze(result);
}
export async function loadMediaManifest({fetchImpl=globalThis.fetch,origin=globalThis.location?.origin}={}){
 try{const response=await fetchImpl(new URL('/media-config.json',origin),{credentials:'omit',redirect:'error',cache:'no-cache',signal:AbortSignal.timeout(5000)});
  if(!response.ok||Number(response.headers.get('content-length'))>1_000_000)return Object.freeze({});
  const text=await response.text();if(new TextEncoder().encode(text).length>1_000_000)return Object.freeze({});return parseMediaManifest(JSON.parse(text));
 }catch{return Object.freeze({});}
}
export async function mountOptionalMedia(){
 const assets=await loadMediaManifest();
 for(const container of document.querySelectorAll('[data-optional-media]')){
  const item=assets[container.dataset.optionalMedia];if(!item)continue;
  const image=document.createElement('img');image.src=item.url;image.alt=item.alt||container.dataset.mediaAlt||'';image.loading='lazy';image.referrerPolicy='no-referrer';
  image.onerror=()=>{container.textContent='Image unavailable.';};container.replaceChildren(image);
  if(item.caption){const caption=document.createElement('figcaption');caption.textContent=item.caption;container.append(caption);}
 }
}

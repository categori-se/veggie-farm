import {photoCropType} from '../lib/plants/photoTypes.js';
let manifestPromise;
const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
export async function appendPlantTypeGallery(target,plant,limit){
 if(limit<=0)return;
 const type=plant.scientific==='Echinacea purpurea'?'echinacea-purpurea':photoCropType(plant);
 if(!type)return;
 try{
  manifestPromise??=fetch('/media/plant-types.json',{signal:AbortSignal.timeout(3000),credentials:'omit'}).then(async r=>{if(!r.ok||!r.headers.get('content-type')?.includes('application/json'))return {};const text=await r.text();return text.length<=96000?JSON.parse(text):{};}).catch(()=>({}));
  const manifest=await manifestPromise,photos=manifest.types?.[type];if(!Array.isArray(photos))return;
  const seen=new Set();const selected=photos.filter(p=>{if(!p||typeof p.url!=='string'||!/^\/media\/plant-types\/[a-z0-9.-]+$/.test(p.url)||seen.has(p.url))return false;for(const k of ['alt','credit','license','source','licenseUrl'])if(typeof p[k]!=='string'||!p[k].trim())return false;for(const k of ['source','licenseUrl']){try{if(new URL(p[k]).protocol!=='https:')return false;}catch{return false;}}seen.add(p.url);return true;}).slice(0,Math.min(5,limit));
  if(!selected.length)return;
  const group=el('section');group.className='plant-type-photos';group.append(el('h3','Plant type in the garden'),el('p','Reference photographs of this crop or species; not verified photographs of the named cultivar.'));
  for(const photo of selected){const figure=el('figure'),image=el('img');image.src=photo.url;image.alt=photo.alt;image.loading='lazy';image.style.cssText='width:100%;height:auto;max-height:360px;object-fit:contain';image.onerror=()=>figure.remove();const caption=el('figcaption',photo.credit+' · '),source=el('a','Photo source'),license=el('a',photo.license);source.href=photo.source;license.href=photo.licenseUrl;caption.append(source,document.createTextNode(' · '),license);figure.append(image,caption);group.append(figure);}target.append(group);
 }catch{/* Optional external media must not block the plant report. */}
}

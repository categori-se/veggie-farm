import {REGIONAL_SOURCES,lookupLidarCatalog} from '../lib/spatial/regionalSources.js';
import {mappedSoil} from './mapped-soil.js';
const el=(tag,text)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;return n;};
export function regionalGardenData({invalidation}={}){
 const root=el('section'),form=el('form'),state=el('select'),sources=el('div'),output=el('div'),status=el('p');status.setAttribute('role','status');
 function field(name,input){const label=el('label',name+' ');input.setAttribute('aria-label',name);input.style.maxWidth='100%';label.style.cssText='display:grid;gap:.25rem;min-width:0;max-width:100%';label.append(input);form.append(label);return input;}
 for(const r of REGIONAL_SOURCES){const o=el('option',r.name);o.value=r.id;state.append(o);}field('Map data state',state);
 form.style.cssText='display:flex;flex-wrap:wrap;gap:.6rem;align-items:end';
 const lon=field('Map longitude',el('input')),lat=field('Map latitude',el('input'));for(const i of [lon,lat]){i.type='number';i.step='any';i.required=true;}
 const kind=field('Elevation product',el('select'));for(const [value,label] of [['point-cloud','LiDAR points · canopy and structures'],['terrain','Bare-earth terrain · ground heights']]){const o=el('option',label);o.value=value;kind.append(o);}
 const load=el('button','Find nearby elevation data');load.type='submit';form.append(load);root.append(sources,form,el('p','Searches a 500 m wide area around your point. Only Search sends these coordinates to USGS. No point clouds download automatically.'),status,output);
 let controller,url,disposed=false;
 function clear(){controller?.abort();controller=null;output.replaceChildren();status.textContent='';load.disabled=false;if(url)URL.revokeObjectURL(url);url=null;}
 function renderSource(){const r=REGIONAL_SOURCES.find(r=>r.id===state.value),a=el('a',`Open ${r.name} GIS catalog ↗`);a.href=r.portal;a.target='_blank';a.rel='noopener noreferrer';sources.replaceChildren(a,el('p',r.note));}
 state.onchange=()=>{clear();renderSource();};for(const input of [lon,lat,kind])input.addEventListener('input',clear);renderSource();
 form.onsubmit=async event=>{event.preventDefault();clear();controller=new AbortController();const active=controller;load.disabled=true;status.textContent='Searching USGS catalog…';try{
  const record=await lookupLidarCatalog(state.value,lon.value,lat.value,{kind:kind.value,signal:active.signal});if(disposed||controller!==active)return;
  status.textContent=record.total?`${record.total} catalog matches${record.truncated?' · showing first 20; use the source catalog for more':''}`:'No catalog matches. Check the state portal for other collections.';
  const list=el('ul');for(const item of record.items){const li=el('li');li.append(el('strong',item.title),el('p',`Published: ${item.publicationDate||'unknown'} · ${item.sizeBytes==null?'size unknown':(item.sizeBytes/1000000).toFixed(1)+' MB'}. Check metadata for flight date.`));for(const [href,label] of [[item.metadataUrl,'Source metadata'],[item.downloadUrl,'Download source file']])if(href){const a=el('a',label);a.href=href;a.target='_blank';a.rel='noopener noreferrer';li.append(a,document.createTextNode(' · '));}list.append(li);}output.append(list,el('p',record.note));
  url=URL.createObjectURL(new Blob([JSON.stringify(record,null,2)],{type:'application/json'}));const download=el('a','Save discovery record');download.href=url;download.download='garden-elevation-discovery.json';output.append(download);
 }catch(e){if(controller===active)status.textContent=e.message;}finally{if(controller===active)load.disabled=false;}};
 root.append(mappedSoil({invalidation}));
 invalidation?.then(()=>{disposed=true;clear();});return root;
}

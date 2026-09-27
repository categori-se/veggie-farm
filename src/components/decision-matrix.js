import {gardenActions} from './garden-actions.js';
const el=(tag,text)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;return n;};
const labels={recommended:'Timing fits',caution:'Check conditions',possible_with_protection:'Protection may help',too_early:'Wait',too_late:'Short season'};

// Show the actual rule output alongside input/reference values. A reference
// temperature or maturity range is not an independent passing suitability test.
export function decisionMatrix(results,rules,sources,{limit=results.length}={}) {
 const root=el('section');root.className='decision-matrix';
 const sourceById=new Map(sources.map(s=>[s.id,s]));
 const controls=el('div');controls.className='decision-matrix-controls';
 const filter=el('select');filter.setAttribute('aria-label','Filter planting results');
 for(const [value,label] of [['all','All results'],['recommended','Timing fits'],['watch','Check / protect'],['wait','Wait / short season']]){const o=el('option',label);o.value=value;filter.append(o);}
 controls.append(filter);const count=el('span');count.setAttribute('role','status');controls.append(count);root.append(controls);
 const note=el('p','Maturity is the catalog duration; confirm whether it starts at sowing or transplanting. Open “Why?” for reasoning, sources and garden actions.');note.className='decision-reading-note';root.append(note);
 const scroll=el('div');scroll.className='decision-table-scroll';scroll.tabIndex=0;scroll.setAttribute('role','region');scroll.setAttribute('aria-label','Crop evidence comparison; scroll for more crops and columns');root.append(scroll);
 let showAll=false;
 function render(){
  const filtered=results.filter(r=>filter.value==='all'||(filter.value==='watch'?['caution','possible_with_protection'].includes(r.status):filter.value==='wait'?['too_early','too_late'].includes(r.status):r.status===filter.value));
  count.textContent=`${filtered.length} crops · rule estimates, not success probabilities`;
  const table=el('table');table.className='decision-table';const caption=el('caption','Compare planting timing and the evidence behind it');table.append(caption);
  const head=el('thead'),hr=el('tr');for(const title of ['Crop / result','Season / frost','Light','Soil','Runway','Forecast','Details']){const th=el('th',title);th.scope='col';hr.append(th);}head.append(hr);table.append(head);const body=el('tbody');table.append(body);
  for(const item of filtered.slice(0,showAll?Infinity:limit)){
   const row=el('tr'),heading=el('th');heading.scope='row';const a=el('a',item.crop.name);a.href=item.crop.path;heading.append(a,el('small',labels[item.status]));row.append(heading);
   for(const key of ['timing','light','soil','runway','forecast']){const value=item.comparisons?.[key];const cell=el('td');cell.append(el('span',value?.label||'Not evaluated'));if(value?.detail)cell.append(el('small',value.detail));row.append(cell);}
   const reason=el('td');const details=el('details'),summary=el('summary','Why?');summary.setAttribute('aria-label',`Why ${item.crop.name}: ${labels[item.status]}`);details.append(summary);
   for(const text of new Set([...item.explanation,item.action,item.risk,item.evidenceNote].filter(Boolean)))details.append(el('p',text));
   const light=item.comparisons?.light;if(light){const source=el('a','Light guidance — University of Maryland Extension');source.href=light.source;details.append(source);}
   const list=el('ul');for(const id of item.sources){const source=sourceById.get(id);if(!source)continue;const li=el('li');if(/^https?:\/\//.test(source.url||'')){const link=el('a',source.name);link.href=source.url;li.append(link);}else li.textContent=source.name;if(source.geographicScope)li.append(el('small',source.geographicScope));list.append(li);}details.append(list);const variety=el('a','Compare varieties →');variety.href='/content/reference/plant-database?search='+encodeURIComponent(item.crop.name);details.append(variety);details.append(el('p',`Growing method: ${item.crop.directSow} ${item.crop.transplant||''}`));
   let actions;details.addEventListener('toggle',()=>{if(details.open&&!actions){actions=gardenActions({crop:item.crop.name,cropSlug:item.crop.slug,date:item.inputs.date});details.append(actions);}});
   reason.append(details);row.append(reason);body.append(row);
  }
  scroll.replaceChildren(table);
  if(!filtered.length)scroll.append(el('p','No crops in this group with these inputs.'));
  more.hidden=showAll||filtered.length<=limit;
 }
 const more=el('button','Show all crops');more.type='button';more.addEventListener('click',()=>{showAll=true;render();});root.append(more);filter.addEventListener('change',render);render();return root;
}

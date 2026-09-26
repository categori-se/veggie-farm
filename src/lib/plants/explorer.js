// Catalog matching is not garden suitability. Preserve unknowns for explicit UI
// treatment; never coerce missing data to a favorable trait or merge a Trefle
// habitat-light class into this catalog's recorded cultivation-light label.
// See docs/plant-data-interoperability.md for identity and timing boundaries.
export const plantLabel = p => (p.browseLabel||p.name).replace(/ Seeds, /, ' — ').replace(/ Seeds$/, '');
export function matchesPlant(p, filters={}) {
 const terms=(filters.search||'').toLowerCase().trim().split(/\s+/).filter(Boolean);
 const haystack=[p.name,p.common,p.cultivar,p.scientific,p.family].join(' ').toLowerCase();
 if(!terms.every(term=>haystack.includes(term)))return false;
 if(filters.category && p.category!==filters.category)return false;
 if(filters.form && !(p.plantTypes||[p.form]).includes(filters.form))return false;
 const unknown=filters.includeUnknown!==false;
 const match=(value,predicate)=>value===null||value===undefined||value===''?unknown:predicate(value);
 if(filters.light&&!match(p.light,v=>String(v).toLowerCase()===filters.light))return false;
 if(filters.frost&&!match(p.frost,v=>v===(filters.frost==='hardy')))return false;
 if(filters.maturity&&!match(p.maturityMax,v=>v<=Number(filters.maturity)))return false;
 if(filters.spacing&&!match(p.spacingMax,v=>v<=Number(filters.spacing)))return false;
 if(filters.method&&!match(filters.method==='sow'?p.directSow:p.transplant,v=>v===true))return false;
 return true;
}
export function missingFilteredTraits(p, filters={}) {
 const fields=[filters.light&&'light',filters.frost&&'frost',filters.maturity&&'maturityMax',filters.spacing&&'spacingMax',filters.method&&(filters.method==='sow'?'directSow':'transplant')].filter(Boolean);
 return fields.filter(key=>p[key]===null||p[key]===undefined||p[key]==='');
}
export function sortPlants(rows,sort='name') {
 if(sort==='garden')return [...rows].sort((a,b)=>(a.photoPriority??1)-(b.photoPriority??1)||a.name.localeCompare(b.name));
 const key={maturity:'maturityMax',spacing:'spacingMax'}[sort];
 return [...rows].sort((a,b)=>key?(a[key]??Infinity)-(b[key]??Infinity)||a.name.localeCompare(b.name):a.name.localeCompare(b.name));
}

// Consolidate explicitly counted combination-tree products for browsing only.
// Original IDs, facts, source records and backups remain independent.
export function groupPlantListings(records) {
 const groups=new Map(),output=[];
 for(const record of records){
  const match=record.name?.match(/^(Combination\s+.+?)\s*\((\d+)\s+Varieties\)\s*$/i);
  let host='';try{const url=new URL(record.source);if(url.protocol==='https:')host=url.host;}catch{}
  if(!match||record.category!=='fruit'||!record.scientific||!host){output.push(record);continue;}
  const key=JSON.stringify([host,record.category,record.scientific.toLowerCase().trim(),match[1].toLowerCase().trim()]);
  let group=groups.get(key);if(!group){group={key,label:match[1],rows:[]};groups.set(key,group);output.push(group);}
  group.rows.push(record);
 }
 return output.map(item=>{
  if(!item.rows)return item;if(item.rows.length===1)return item.rows[0];
  const chosen=item.rows[0],merged={...chosen,name:item.label,common:item.label,browseLabel:item.label,sourceListings:item.rows};
  for(const key of ['light','maturity','maturityMin','maturityMax','spacing','spacingMin','spacingMax','frost','hardiness','matureSize','pollination','ripening','depth','germination','temperature','sunHours']){
   if(item.rows.some(p=>p[key]!==chosen[key]))merged[key]=null;
  }
  return merged;
 });
}

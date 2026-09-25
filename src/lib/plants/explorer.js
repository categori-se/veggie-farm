// Catalog matching is not garden suitability. Preserve unknowns for explicit UI
// treatment; never coerce missing data to a favorable trait or merge a Trefle
// habitat-light class into this catalog's recorded cultivation-light label.
// See docs/plant-data-interoperability.md for identity and timing boundaries.
export const plantLabel = p => p.name.replace(/ Seeds, /, ' — ').replace(/ Seeds$/, '');
export function matchesPlant(p, filters={}) {
 const terms=(filters.search||'').toLowerCase().trim().split(/\s+/).filter(Boolean);
 const haystack=[p.name,p.common,p.cultivar,p.scientific,p.family].join(' ').toLowerCase();
 if(!terms.every(term=>haystack.includes(term)))return false;
 if(filters.category && p.category!==filters.category)return false;
 if(filters.form && p.form!==filters.form)return false;
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

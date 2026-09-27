import {gardenSoilGroups} from '../lib/garden/gardenSoilHistory.js';
const el=(tag,text)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;return n;};
export function gardenSoilHistory({workspace,year,today,bedId=''}){
 const root=el('section');root.setAttribute('aria-label','Garden soil history');root.append(el('h3',`Soil records through ${year}`));
 const groups=gardenSoilGroups(workspace,year,today).filter(g=>!bedId||g.bedId===bedId);
 if(!groups.length){root.append(el('p','No dated soil reports linked to these beds for this period. Link saved Notebook reports to a bed from your account garden.'));return root;}
 for(const group of groups){const card=el('article'),bed=workspace.beds.find(b=>b.id===group.bedId);card.append(el('h4',`${bed.name||'Bed'} · ${group.laboratory}`));if(group.phSequence)card.append(el('p',`Recorded pH: ${group.phSequence.join(' → ')}`));const details=el('details');details.append(el('summary',`${group.rows.length} reports · dates and source details`),el('p','Sampling depth and laboratory method are not recorded in these fields. Review the original reports when comparing results.'));
 for(const row of group.rows){const record=el('section');record.append(el('strong',row.date),el('p',`pH: ${row.ph??'not recorded'} · Organic matter: ${row.organicMatter||'not recorded'}`));if(row.report)record.append(el('p',row.report));record.append(el('small',`Linked Notebook report · original area: ${row.notebookOrigin.bed||'not recorded'}`));details.append(record);}card.append(details);root.append(card);}
 return root;
}

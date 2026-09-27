import {seasonLearning} from '../lib/garden/seasonLearning.js';
const names={bolted:'Bolting',pest_seen:'Pest sightings',disease_seen:'Possible disease',heat_damage:'Heat damage',frost_damage:'Frost damage'};
const el=(tag,text)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;return n;};
const harvest=s=>!s.harvestRecords?'No harvest recorded':[s.grams!==null?`${Number((s.grams/1000).toFixed(3))} kg`:null,s.count!==null?`${s.count} count`:null,s.unmeasured?`${s.unmeasured} harvest records without a usable quantity`:null].filter(Boolean).join(' + ');
export function gardenSeasonLearning({workspace,plants,year,today,bedId='',onNextSeason}){
 const section=el('section');section.setAttribute('aria-label','Season review');section.append(el('h3',`What changed in ${year}?`),el('p',`Your observations for ${year-1} and ${year}, grouped by plant and bed.`));
 if(year<1901||year>2200){section.append(el('p','Choose a review year from 1901 to 2200.'));return section;}
 const rows=seasonLearning(workspace,year,today).filter(r=>!bedId||r.bedId===bedId),catalog=new Map(plants.map(p=>[p.id,p])),beds=new Map((workspace.beds||[]).map(b=>[b.id,b]));
 if(!rows.length)section.append(el('p','No dated planting observations for these two years. Record what happens this season to build a comparison.'));
 const list=el('div');let limit=4;
 const render=()=>{list.replaceChildren();for(const row of rows.slice(0,limit)){
  const card=el('article');card.style.cssText='border:1px solid #71846d;border-radius:6px;padding:12px;margin:12px 0';card.append(el('h4',`${catalog.get(row.plantId)?.name||row.plantId} · ${beds.get(row.bedId)?.name||'Former bed'}`));
  for(const [y,s] of [[year-1,row.prior],[year,row.current]])card.append(el('p',`${y}: ${harvest(s)}${s.firstHarvest?` · first recorded harvest ${s.firstHarvest} · last ${s.lastHarvest}`:''}`));
  if(row.recurring.length)card.append(el('p',`${row.recurring.map(type=>names[type]).join(', ')} recorded in both years. Review timing, location and your notes before repeating this planting.`));
  for(const t of row.timings)card.append(el('p',`Linked plantings: ${t.current.days} days from recorded ${t.basis==='seeded'?'sowing':'transplanting'} to first recorded harvest in ${year}, compared with ${t.prior.days} in ${year-1}.`));
  const evidence=el('details');evidence.append(el('summary','See the observations behind this review'));const events=el('ol');for(const e of [...row.prior.events,...row.current.events].sort((a,b)=>a.date.localeCompare(b.date))){events.append(el('li',`${e.date} · ${names[e.type]||e.type.replaceAll('_',' ')}${e.quantity!=null?` · ${e.quantity} ${e.unit||''}`:''}${e.notes?` · ${e.notes}`:''}`));}evidence.append(events);card.append(evidence);list.append(card);
 }if(rows.length>limit){const more=el('button',`Show ${rows.length-limit} more comparisons`);more.type='button';more.onclick=()=>{limit=rows.length;render();};list.append(more);}};render();section.append(list);const explanation=el('details');explanation.append(el('summary','How to read these comparisons'),el('p','Recorded harvest totals are not total yield. Plant counts, growing conditions and logging habits can differ. A missing record does not mean a plant failed or stayed healthy. Timing compares recorded events, not proven maturity; recurring issues do not establish a cause.'));section.append(explanation);
 if(onNextSeason&&year<2200){const next=el('button',`Use this review to plan ${year+1}`);next.type='button';next.style.cssText='min-height:44px;font:inherit';next.onclick=()=>onNextSeason(year);section.append(next);}
 return section;
}

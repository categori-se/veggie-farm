// Keep only public catalog choices across reactive input updates, never profiles.
let selections = [];
const el = (tag, text) => {const node=document.createElement(tag);if(text!=null)node.textContent=text;return node;};
export function bedFitComparison(recommendations) {
  const root=el('section');root.className='bed-fit-comparison';root.setAttribute('aria-label','Compare crop fit');
  if(!recommendations.length){root.append(el('p','No crops match this group.'));return root;}
  const byId=new Map(recommendations.map(row=>[row.plant.id,row]));
  const controls=el('div');controls.className='bed-fit-compare-controls';
  const selects=['Crop to investigate','Compare with'].map((title,index)=>{
    const label=el('label',title),select=el('select');select.setAttribute('aria-label',title);
    for(const row of recommendations){const option=el('option',row.plant.name);option.value=row.plant.id;select.append(option);}
    select.value=byId.has(selections[index])?selections[index]:recommendations[index===0?Math.min(1,recommendations.length-1):0].plant.id;
    label.append(select);controls.append(label);return select;
  });
  const summary=el('p');summary.setAttribute('aria-live','polite');summary.dataset.comparisonSummary='';
  const scroll=el('div');scroll.className='bed-fit-compare-scroll';scroll.tabIndex=0;scroll.setAttribute('role','region');scroll.setAttribute('aria-label','Score contributions');
  root.append(controls,summary,scroll,el('p','Points explain this ranking model, not a probability of success. Unknown checks still contribute; expand a status to see why.'));
  function render(){
    selections=selects.map(select=>select.value);
    const [a,b]=selections.map(id=>byId.get(id));
    const difference=(a.score-b.score)*100;
    const largest=a.criteria.map((c,i)=>({label:c.label,delta:c.points-b.criteria[i].points})).sort((x,y)=>Math.abs(y.delta)-Math.abs(x.delta))[0];
    summary.textContent=Math.abs(difference)<1e-8?`${a.plant.name} and ${b.plant.name} have the same model score.`:`${a.plant.name} scores ${Math.abs(difference).toFixed(1)} points ${difference<0?'below':'above'} ${b.plant.name}. Largest difference: ${largest.label} (${Math.abs(largest.delta).toFixed(1)} points).`;
    const table=el('table'),head=el('thead'),header=el('tr'),body=el('tbody');
    for(const title of ['Criterion',a.plant.name,b.plant.name]){const th=el('th',title);th.scope='col';header.append(th);}head.append(header);table.append(head,body);
    for(let i=0;i<a.criteria.length;i++){
      const tr=el('tr'),criterion=a.criteria[i],label=el('th',`${criterion.label} · ${criterion.maximum} max`);label.scope='row';tr.append(label);
      for(const row of [a,b]){const c=row.criteria[i],td=el('td'),details=el('details');td.append(el('strong',c.points.toFixed(1)));details.append(el('summary',String(c.status||'not assessed').replaceAll('_',' ')),el('p',c.reason));td.append(details);tr.append(td);}body.append(tr);
    }
    const total=el('tr');total.append(el('th','Total / 100'),el('td',(a.score*100).toFixed(1)),el('td',(b.score*100).toFixed(1)));body.append(total);scroll.replaceChildren(table);
  }
  selects.forEach(select=>select.addEventListener('change',render));render();return root;
}

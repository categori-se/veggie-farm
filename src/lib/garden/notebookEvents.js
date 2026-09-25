const text=value=>typeof value==='string'?value:'';
const date=value=>/^\d{4}-\d{2}-\d{2}$/.test(text(value))&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value?value:null;
const observationLabels={seeded:'Sowing observed',germinated:'Emergence observed',transplanted:'Transplanting observed',flowered:'Flowering observed',fruit_set:'Fruit observed',harvested:'Harvest observed',bolted:'Bolting observed',frost_damage:'Frost damage noted',heat_damage:'Heat damage noted',pest_seen:'Pest noted',disease_seen:'Possible disease noted',watering:'Watering noted',rain:'Rain noted',soil_test:'Soil note',note:'Observation'};

// A plan date never proves that a planting happened. Keep record classes and
// gardener interpretations separate while presenting one chronological history.
export function notebookEvents(snapshot={}){
 const rows=[];
 const add=(kind,r,fields)=>rows.push({id:`${kind}:${text(r.id)}`,kind,date:date(r.date),createdAt:text(r.createdAt),crop:text(r.crop),bed:text(r.bed),...fields});
 for(const p of snapshot.plantings??[])add('plan',p,{label:'Planned planting',title:[p.crop,p.variety].filter(Boolean).join(' · '),detail:p.method?`Starting method: ${p.method}`:'Starting method not recorded',source:'Gardener plan',catalogSourceUrl:text(p.catalogSourceUrl)});
 for(const o of snapshot.journal??[])add('observation',o,{label:observationLabels[o.type]||'Observation',title:text(o.crop)||text(o.bed)||'Garden',detail:text(o.notes),interpretation:text(o.interpretation),action:text(o.action),source:'Gardener observation',type:text(o.type)});
 for(const a of snapshot.actions??[])add('action',a,{label:a.status==='dismissed'?'Prompt dismissed':a.status==='done'?'Action marked done':'Action recorded',title:text(a.title),detail:date(a.reviewDate)?`Review date: ${a.reviewDate}`:'',source:'Gardener action',reviewDate:date(a.reviewDate),status:text(a.status)});
 for(const s of snapshot.soilTests??[])add('soil',s,{label:'Soil report',title:text(s.laboratory)||'Laboratory not recorded',detail:[Number.isFinite(s.ph)?`pH ${s.ph}`:null,text(s.phosphorus)?`Phosphorus: ${s.phosphorus}`:null,text(s.potassium)?`Potassium: ${s.potassium}`:null,text(s.organicMatter)?`Organic matter: ${s.organicMatter}`:null].filter(Boolean).join(' · '),interpretation:text(s.report),source:'Transcribed laboratory report'});
 return rows.sort((a,b)=>(b.date??'').localeCompare(a.date??'')||b.createdAt.localeCompare(a.createdAt)||a.id.localeCompare(b.id));
}

export function notebookSignals(events,today){
 if(!date(today))return [];
 const since=new Date(Date.parse(today)-29*86400000).toISOString().slice(0,10),signals=[];
 const repeated=new Map();
 for(const e of events){
  if(e.kind==='action'&&e.reviewDate&&e.reviewDate<=today&&e.status!=='dismissed')signals.push({label:`Review date reached: ${e.title}`,detail:`You entered ${e.reviewDate}. No follow-up completion is inferred.`});
  if(e.kind==='observation'&&e.date>=since&&e.date<=today&&['pest_seen','disease_seen','frost_damage','heat_damage'].includes(e.type)){
   const key=JSON.stringify([e.type,e.crop,e.bed]);const group=repeated.get(key)??[];group.push(e);repeated.set(key,group);
  }
 }
 for(const rows of repeated.values())if(rows.length>=2){const e=rows[0];signals.push({label:`${rows.length} ${e.label.toLowerCase()} entries in 30 days`,detail:`${[e.crop,e.bed].filter(Boolean).join(' · ')||'Garden'} — compare the notes; repeated entries do not establish a cause or diagnosis.`});}
 return signals;
}

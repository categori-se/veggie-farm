import {harvestTimeline} from "./harvest-timeline.js";
import {gardenActions} from "./garden-actions.js";
import {sunDecision, harvestWindow, companionOptions, pruningOptions, diseaseDecision} from '../lib/recommendations/gardenDecisions.js';
function el(tag, text, className) {const node=document.createElement(tag); if(text!=null)node.textContent=text;if(className)node.className=className;return node;}
function control(parent,label,type,value){const wrapper=el('label',null,'decision-input');wrapper.append(el('span',label));const input=el('input');input.type=type;input.value=value;wrapper.append(input);parent.append(wrapper);return input;}
function select(parent,label,options,value){const wrapper=el('label',null,'decision-input');wrapper.append(el('span',label));const input=el('select');input.setAttribute('aria-label',label);for(const [id,name] of Object.entries(options)){const opt=el('option',name);opt.value=id;input.append(opt);}input.value=value;wrapper.append(input);parent.append(wrapper);return input;}
function paragraph(parent,label,text){const p=el('p');p.append(el('strong',`${label} `),document.createTextNode(text));parent.append(p);}
export function decisionWorkbench(topic,{sources=[],crop=null}={}) {
 const titles={sun:'What fits this light?',harvest:'When should I start checking?',companions:'Give companion planting a purpose',disease:'What conditions should I investigate?',pruning:'What am I about to remove?'};
 const section=el('section',null,'decision-workbench');section.setAttribute('aria-label',titles[topic]??'Garden decision');section.append(el('p','Observe → compare → act → record','kicker'),el('h3',titles[topic]));
 const form=el('div',null,'decision-controls');const result=el('div',null,'decision-result');result.setAttribute('aria-live','polite');section.append(form,result);
 let render;
 if(topic==='sun') {
  const hours=control(form,'Direct sun hours','number','6');hours.min=0;hours.max=16;hours.step=.5;
  render=()=>{const d=sunDecision(hours.value);result.replaceChildren(el('h4',d.label),el('p',d.plants.join(' · ')),el('p',d.note));};
 } else if(topic==='harvest') {
  const today=new Date();const local=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const start=control(form,'Start date','date',local);
  const basis=select(form,'Packet counts days from',{sowing:'Sowing',transplant:'Transplanting',unknown:'Not sure — check the packet'},'unknown');
  const range=String(crop?.daysToMaturity??'').match(/^(\d+)-(\d+)$/);
  const min=control(form,'Earliest maturity (days)','number',range?.[1]??'');min.min=1;min.max=730;
  const max=control(form,'Latest maturity (days)','number',range?.[2]??'');max.min=1;max.max=730;
  const frost=control(form,'First fall frost date (optional)','date','');
  section.insertBefore(el('p',crop?`${crop.name}: the existing guide supplies a broad range. Replace it with your cultivar’s packet and harvest stage.`:'Enter the cultivar’s maturity range. Baby leaves and mature storage crops use different targets.'),form);
  render=()=>{result.replaceChildren();if(basis.value==='unknown'){result.append(el('p','Check whether the packet counts from sowing or transplanting before calculating. These start dates are not interchangeable.'));return;}
   const d=harvestWindow({startDate:start.value,minimumDays:min.value,maximumDays:max.value,firstFrost:frost.value});if(d.error){result.append(el('p',d.error));return;}
   result.append(el('h4',`${d.earliest} to ${d.latest}`),el('p',`Calendar estimate from ${basis.value}. Inspect the crop’s size, texture and maturity cues; cool weather, short days and stress can delay harvest.`));
   result.append(harvestTimeline(start.value,d.earliest,d.latest,frost.value));
   if(d.frostOverlap!==null)result.append(el('p',d.frostOverlap?'The estimate reaches or passes your frost date. Tender crops may need an earlier start; hardy crops still slow in autumn.':'The estimate ends before your entered frost date. That date remains uncertain and is not a guarantee.'));
  };
 } else if(topic==='companions') {
  const goal=select(form,'What do you want the pairing to do?',{space:'Share space over time',habitat:'Support beneficial insects',succession:'Keep a bed productive'},'space');
  render=()=>{const d=companionOptions[goal.value];result.replaceChildren(el('h4',d.title),el('p',d.action));paragraph(result,'Measure:',d.measure);paragraph(result,'Limit:',d.limit);};
 } else if(topic==='pruning') {
  const kind=select(form,'Plant and flowering habit',{unknown:'Unknown / another plant',apple:'Apple tree',spring:'Spring-flowering shrub (old wood)',newwood:'Confirmed new-wood flowering shrub',cane:'Raspberry canes'},crop?.slug==='apples'?'apple':crop?.slug==='raspberries'?'cane':'unknown');
  render=()=>{const d=pruningOptions[kind.value];result.replaceChildren(el('h4',d.title),el('p',d.action));paragraph(result,'Record:','Photograph the plant before and after; note which wood flowered or fruited. Local disease guidance can change the timing.');if(kind.value==='cane'){const a=el('a','Read the raspberry pruning systems');a.href='/content/fruits/raspberries';result.append(a);}};
 } else if(topic==='disease') {
  const wet=control(form,'Leaves stay wet after rain or watering','checkbox','');const crowded=control(form,'Crowded canopy / poor air movement','checkbox','');const symptoms=control(form,'Visible spots, wilt or decay','checkbox','');
  render=()=>{const d=diseaseDecision({wet:wet.checked,crowded:crowded.checked,symptoms:symptoms.checked});result.replaceChildren(el('h4',d.title));const list=el('ul');d.actions.forEach(a=>list.append(el('li',a)));result.append(list,el('p',d.note));};
 } else {return el('p','Choose a supported gardening decision.');}
 form.addEventListener('input',render);form.addEventListener('change',render);render();
 const ids={sun:['sun'],harvest:['harvest'],companions:['companions'],disease:['disease','mildew'],pruning:['pruning']}[topic];
 const footer=el('p',null,'decision-citations');footer.append(document.createTextNode('Evidence: '));ids.forEach((id,i)=>{const source=sources.find(s=>s.id===id);if(!source)return;if(i)footer.append(document.createTextNode(' · '));const a=el('a',source.name);a.href=source.url;footer.append(a);});footer.append(document.createTextNode(' · Reviewed September 24, 2026. General guidance; adapt to your Massachusetts garden.'));const evidence=el('details');evidence.append(el('summary','Sources and assumptions'),footer);section.append(evidence);
 return section;
}
export function articleDecision({question,observe,topic='harvest',cropName='',toolPath=null,toolLabel='Compare your options →'}) {
 const section=el('aside',null,'article-decision');section.setAttribute('aria-label','Put this guide to work');section.append(el('p','Put this guide to work','kicker'),el('h3',question));paragraph(section,'Observe:',observe);
 const links=el('p',null,'decision-links');const a=el('a',toolLabel);a.href=toolPath??`/tools/garden-decisions#${topic}`;const b=el('a','Record what happened →');b.href=`/tools/my-garden?type=note${cropName?`&crop=${encodeURIComponent(cropName)}`:''}`;links.append(a,b);section.append(links,gardenActions({crop:cropName,observeOnly:!cropName || /\/(vegetables|fruits|herbs)\//.test(location.pathname)}));return section;
}

// Keep each question's inputs when readers explore another question in this visit.
export function decisionExplorer({sources = [], invalidation} = {}) {
  const questions = {
    sun: ['What fits my light?', 'Measure direct sunlight where the leaves will grow, after nearby trees leaf out. Recheck as the season changes.', '/tools/what-grows-in-this-bed', 'Compare plants for this bed'],
    companions: ['What should grow together?', 'Choose a purpose: share space over time, support beneficial insects or plan the next crop.', '/studio', 'Try the arrangement in a practice garden'],
    disease: ['Why is my plant struggling?', 'Record the plant, symptoms and recent changes. Start with an investigation, then choose a response.', '/content/garden/watering-wisely', 'Inspect watering and the root zone'],
    pruning: ['Should I prune now?', 'Identify the plant and the wood that flowers or fruits. The calendar alone cannot choose the pruning system.', '/content/fruits/', 'Find the matching fruit guide'],
    harvest: ['When should I harvest?', 'Use a calendar range to plan an inspection, then check the crop itself. Cultivar and intended harvest stage matter.', '/content/vegetables/', 'Find the crop’s physical harvest cues']
  };
  const root = el('div', null, 'decision-explorer');
  const nav = el('nav', null, 'decision-question-nav');
  nav.setAttribute('aria-label', 'Choose your gardening question');
  const panel = el('div');
  const widgets = new Map();
  const links = new Map();
  for (const [key, [label]] of Object.entries(questions)) {
    const link = el('a', label);
    link.href = `#${key}`;
    nav.append(link);
    links.set(key, link);
  }
  root.append(nav, panel);
  function render() {
    const key = Object.hasOwn(questions, location.hash.slice(1)) ? location.hash.slice(1) : 'sun';
    const [label, intro, href, next] = questions[key];
    for (const [id, link] of links) {
      if (id === key) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    }
    if (!widgets.has(key)) widgets.set(key, decisionWorkbench(key, {sources}));
    panel.replaceChildren(el('h2', label), el('p', intro), widgets.get(key));
    const route = el('p', null, 'decision-links');
    const deeper = el('a', `${next} →`);
    deeper.href = href;
    const record = el('a', 'Record what you observed →');
    record.href = '/tools/my-garden?type=note';
    route.append(deeper, record);
    panel.append(route);
  }
  window.addEventListener('hashchange', render);
  invalidation?.then(() => window.removeEventListener('hashchange', render));
  render();
  return root;
}

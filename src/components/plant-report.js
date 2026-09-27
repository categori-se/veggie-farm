import {plantDataNotice,plantDataEvidence} from './plant-data-evidence.js';
import {catalogIdentity} from '../lib/plants/catalogIdentity.js';
import {catalogProductLinks} from './catalog-product-links.js';
import {appendPlantTypeGallery} from './plant-type-gallery.js';
import {plantReports} from './plant-report-files.js';
import {catalogImages} from './catalog-images.js';
import {gardenActions} from './garden-actions.js';
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
export async function plantReport(id){
 const root=el('article',null,'plant-report');
 const back=el('a','← Find plants');back.href='/content/reference/plant-database';root.append(back);
 const file=plantReports.get(catalogIdentity(id));
 if(!file){root.append(el('h1','Choose a plant'),el('p','Open a plant from Find Plants to see its photographs and growing report.'));return root;}
 const p=await file.json();document.title=`${p.name} · veggie.farm`;
 root.append(el('h1',p.name));if(plantDataNotice(p))root.append(el('p',plantDataNotice(p)));if(p.scientific)root.append(el('p',p.scientific,'library-botanical'));
 const header=el('div',null,'plant-report-header'),gallery=el('section',null,'plant-report-gallery');gallery.setAttribute('aria-label','Plant photographs');
 const imageIds=[...new Set(p.imageIds||[p.id])].filter(key=>catalogImages.has(key)).slice(0,5);
 if(imageIds.length){
  const image=el('img');image.className='plant-report-photo';image.src=catalogImages.get(imageIds[0]).href;image.alt=`${p.name}, catalog photograph`;image.width=960;image.height=960;gallery.append(image);
  if(imageIds.length>1){const choices=el('div',null,'plant-report-thumbnails');imageIds.forEach((key,i)=>{const button=el('button');button.type='button';button.setAttribute('aria-label',`Show photograph ${i+1} of ${p.name}`);button.setAttribute('aria-pressed',String(i===0));const thumb=el('img');thumb.src=catalogImages.get(key).href;thumb.alt='';thumb.loading='lazy';thumb.width=100;thumb.height=100;button.append(thumb);button.onclick=()=>{image.src=catalogImages.get(key).href;image.alt=`${p.name}, catalog photograph ${i+1}`;for(const b of choices.children)b.setAttribute('aria-pressed',String(b===button));};choices.append(button);});gallery.append(choices);}
 }
 appendPlantTypeGallery(gallery,p,5-imageIds.length);
 const summary=el('section');if(p.description)summary.append(el('p',p.description));
 const facts=[['Life cycle',p.lifeCycle],['Hardiness',p.hardiness],['Mature size',p.matureSize],['Sun',p.sunHours||p.light],['Spacing',p.spacing],['Germination',p.germination],['Ideal temperature',p.temperature],['Seed depth',p.depth],['Frost hardy',p.frost===true?'Yes':p.frost===false?'No':null],['Maturity',p.maturity],['Pollination',p.pollination],['Ripening',p.ripening],['Bloom',p.bloom],['Years to bear',p.yearsToBear]].filter(([,v])=>v!=null&&v!=='');
 const dl=el('dl',null,'crop-quick-facts');for(const [label,value] of facts)dl.append(el('dt',label),el('dd',value));summary.append(dl);
 const purchase=catalogProductLinks(p);summary.append(purchase);
 summary.append(gardenActions({crop:p.common||p.name,variety:p.cultivar||'',catalogPlantId:p.id,catalogSourceUrl:p.source}));header.append(gallery,summary);root.append(header);
 if(p.additionalFacts?.length||p.sourceAttributes?.length){const section=el('section');section.append(el('h2','Growing details'));const list=el('ul');for(const fact of p.additionalFacts?.length?p.additionalFacts:p.sourceAttributes)list.append(el('li',fact.text||`${fact.label}: ${fact.value}`));section.append(list);root.append(section);}
 if(p.careNotes?.length){const section=el('details');section.append(el('summary','Growing and care notes'));for(const note of [...new Set(p.careNotes)])section.append(el('p',note));root.append(section);}
 if(p.sourceDescription?.length){const section=el('details');section.append(el('summary','More about this plant'));for(const paragraph of [...new Set(p.sourceDescription)])section.append(el('p',paragraph));root.append(section);}
 if(p.citations?.length)root.append(plantDataEvidence(p));
 const evidence=el('details');evidence.append(el('summary','Record details'));const source=el('a','View reference');source.href=p.source;evidence.append(source,el('p',`Catalog facts collected ${p.collectedAt?.slice(0,10)||'date unavailable'}${p.detailCollectedAt&&p.detailCollectedAt!==p.collectedAt?`; additional details ${p.detailCollectedAt.slice(0,10)}`:''}.`));root.append(evidence);
 return root;
}

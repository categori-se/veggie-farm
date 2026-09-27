const element=(tag,text)=>{const node=document.createElement(tag);if(text!=null)node.textContent=text;return node;};
export function plantDataNotice(record) {
  if(record.referenceDatasetId==='openfarm-recovered-340')return 'Historical OpenFarm community record (CC0), recovered from an archive. Horticultural claims have not been independently verified. Not a plant identification or safety reference.';
  if(record.referenceDatasetId==='veggie-farm-common-100-unified')return 'General Common 100 planning reference contributed by veggie.farm. Horticultural claims and cited pages have not been independently verified; cultivar and local conditions take precedence.';
  return null;
}
export function plantDataEvidence(record) {
  const section=element('details');section.append(element('summary','Reference sources'));
  for(const citation of record.citations||[]){const line=element('p'),link=element('a',`${citation.publisher}: ${citation.title}`);link.href=citation.url;link.rel='noopener noreferrer';line.append(link);section.append(line);}
  if(record.rights)section.append(element('p',`${record.rights.attribution}. Data terms: ${record.rights.license}.`));
  if(record.fieldEvidence){const fields=element('details');fields.append(element('summary','Field provenance'));const list=element('dl');for(const [field,evidence] of Object.entries(record.fieldEvidence)){list.append(element('dt',field),element('dd',`${evidence.classification.replaceAll('_',' ')} — ${evidence.sourceField||evidence.reason||evidence.reviewStatus}.`));}fields.append(list);section.append(fields);}
  return section;
}

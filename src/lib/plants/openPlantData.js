// Source records keep their own identities; a shared name is not a species match.
export const OPEN_REVIEW = 'recovered community data; horticultural verification pending';
const present = value => typeof value === 'string' && value.trim() && !/^(add this information|no specific|unknown|n\/?a)$/i.test(value.trim()) ? value.trim() : null;
const dimension = value => Number.isFinite(value) && value > 0 ? value : null;
const emptyRange = () => ({min:null,max:null,text:null});
export function openPlantRecord(row, manifest) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.slug) || !present(row.name)) throw Error('Invalid open plant identity');
  if (manifest.license !== 'CC0-1.0' || row.source?.license !== manifest.license) throw Error('Missing or inconsistent data license');
  const archive = new URL(row.source.waybackUrl);
  if (archive.protocol !== 'https:' || archive.hostname !== 'web.archive.org' || !/^\/web\/\d+\/https?:\/\/(?:www\.)?openfarm\.cc\/en\/crops\//.test(archive.pathname)) throw Error('Invalid record archive URL');
  const evidence = {};
  const read = (field, sourceField, value, derived = false) => {
    evidence[field] = {classification:value == null?'unknown':derived?'derived':'direct_source',
      sourceId:'source:openfarm-recovery',sourceField,sourceUrl:archive.href,datasetId:manifest.datasetId,
      retrievedOn:manifest.retrievedOn,captured:row.source.captured,scope:'source-record; taxonomic scope unverified',
      reviewStatus:OPEN_REVIEW,license:manifest.license};
    return value;
  };
  const sunText=present(row.sun),light={'full sun':'full sun','partial sun':'partial shade','full shade':'full shade'}[sunText?.toLowerCase()]||null;
  const plant={id:`plant:openfarm:${row.slug}`,name:row.name,commonName:row.name,cultivar:null,
    scientificName:read('scientificName','binomialName',present(row.binomialName)),family:null,primaryUse:'open-reference',
    description:read('description','description',present(row.description)),sun:read('sun','sun',light,true),
    sunlightReference:{labels:light?[light]:[],minimumDirectSunHours:null},
    sowingMethod:read('sowingMethod','sowingMethod',present(row.sowingMethod)),
    rowSpacingCm:read('rowSpacingCm','rowSpacingCm',dimension(row.rowSpacingCm)),
    morphology:{archetype:null,growthHabit:[],
      heightCm:{reported:read('morphology.heightCm.reported','heightCm',dimension(row.heightCm)),min:null,max:null},
      spreadCm:{reported:read('morphology.spreadCm.reported','spreadCm',dimension(row.spreadCm)),min:null,max:null},
      canopy:null,stem:null,leaf:null,flower:null,fruit:null},
    spacingInches:emptyRange(),germinationDays:emptyRange(),daysToMaturity:emptyRange(),renderStages:[],
    sourceUrl:archive.href,sourceIds:['source:openfarm-recovery'],sourceRecordId:row.slug,
    referenceDatasetId:manifest.datasetId,reviewStatus:OPEN_REVIEW,confidence:null,
    rights:{license:manifest.license,licenseUrl:manifest.licenseUrl,attribution:`${manifest.publisher}; recovered by ${manifest.recoveryPublisher}`,changes:manifest.transformations},
    citations:[{id:'source:openfarm-recovery',publisher:manifest.publisher,title:`${row.name} — archived crop record`,url:archive.href},
      {id:'source:openfarm-recovery-project',publisher:manifest.recoveryPublisher,title:'Recovery dataset and provenance',url:manifest.sourceUrl}],
    fieldEvidence:evidence};
  for(const field of ['family','cultivar','spacingInches','germinationDays','daysToMaturity','renderStages','morphology.archetype'])evidence[field]={classification:'unknown',reason:'Not established by the imported fields; no automatic inference.'};
  return plant;
}
export function openPlantExplorer(plant) {
  const size = [['Height',plant.morphology.heightCm.reported],['spread',plant.morphology.spreadCm.reported]].filter(([,v])=>v!=null).map(([label,value])=>`${label} ${value} cm`).join('; ');
  return {...plant,common:plant.commonName,scientific:plant.scientificName,category:plant.primaryUse,
    source:plant.sourceUrl,light:plant.sun,spacing:null,spacingMin:null,spacingMax:null,maturity:null,maturityMin:null,maturityMax:null,
    matureSize:size?`${size} (historical reported values, not a validated range)`:null,
    germination:null,directSow:null,transplant:null,frost:null,imageIds:[],careNotes:[],
    additionalFacts:[['Sowing method',plant.sowingMethod],['Row spacing',plant.rowSpacingCm==null?null:`${plant.rowSpacingCm} cm; not plant spacing`]].filter(([,value])=>value!=null).map(([trait,value])=>({trait,text:`${trait}: ${value}`}))};
}

// Audit leaf values against the contributed compilation without pretending each
// cited webpage was checked for each assertion. Rendering choices are separate.
export function commonFieldEvidence(record) {
  const evidence={};
  const visit=(value,path)=>{
    if(value && typeof value==='object' && !Array.isArray(value))for(const [key,item] of Object.entries(value))visit(item,path?`${path}.${key}`:key);
    else evidence[path]={classification:value==null?'unknown':path.startsWith('studio.')?'visual_inference':'direct_source',
      sourceId:'source:common-100-contribution',sourceRecordId:record.id,sourceField:path,
      scope:'general crop planning reference',reviewStatus:'contributor-authored; horticultural verification pending',
      candidateSourceIds:record.sourceIds||[],citationVerification:'record-level references; field support not independently checked'};
  };
  for(const key of ['scientificName','family','lifecycle','sun','soil','water','frostTolerance','usdaHardinessZones','spacingInches','matureSizeInches','timeToHarvest','planting','studio'])visit(record[key]??null,key);
  for(const key of ['germinationDays','daysToMaturity','renderStages'])evidence[key]={classification:'unknown',reason:'Not established with a usable timing basis or stage model.'};
  for(const key of Object.keys(evidence).filter(key=>key.startsWith('sun.'))){evidence[key.replace('sun.','sunlightReference.')]=evidence[key];delete evidence[key];}
  evidence.sun={...evidence['sunlightReference.labels'],classification:record.sun?.labels?.length?'derived':'unknown',sourceField:'sun.labels'};
  return evidence;
}

export function plantCoverage(records) {
  const hasRange=value=>value?.min!=null||value?.max!=null;
  const metrics={scientificName:p=>!!p.scientificName,family:p=>!!p.family,sun:p=>!!p.sun,
    structuredSun:p=>!!p.sunlightReference?.labels?.length,plantSpacing:p=>hasRange(p.spacingInches),
    germination:p=>hasRange(p.germinationDays),maturity:p=>hasRange(p.daysToMaturity),
    morphology:p=>p.matureSizeInches?.height?.max!=null||p.morphology?.heightCm?.reported!=null,
    fieldEvidence:p=>!!Object.keys(p.fieldEvidence||{}).length};
  const count=rows=>({records:rows.length,fields:Object.fromEntries(Object.entries(metrics).map(([key,test])=>[key,{present:rows.filter(test).length,unknown:rows.filter(p=>!test(p)).length}]))});
  return {schemaVersion:1,...count(records),datasets:Object.fromEntries([...new Set(records.map(p=>p.referenceDatasetId||'existing'))].sort().map(id=>[id,count(records.filter(p=>(p.referenceDatasetId||'existing')===id))])),note:'Coverage measures available fields, not accuracy or independent verification. Separate source records are not unique species. Timing text without a numeric basis remains unknown.'};
}

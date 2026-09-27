import {commonFieldEvidence} from './openPlantData.js';
// Generic references keep their own identities. Never join a cultivar by name.
export const COMMON_REVIEW = 'user-supplied-reference; horticultural verification pending';
const copy = value => structuredClone(value);
const missing = value => value == null || value === '' || (Array.isArray(value) && !value.length);

export function mergeCommonRecords(existing, additions) {
  const records = new Map(existing.map(record => [record.id, copy(record)]));
  if (records.size !== existing.length) throw Error('Duplicate existing plant IDs');
  const seen = new Set();
  for (const incoming of additions) {
    if (!incoming.id || seen.has(incoming.id)) throw Error('Duplicate or missing reference plant ID');
    seen.add(incoming.id);
    const current = records.get(incoming.id);
    if (!current) { records.set(incoming.id, copy(incoming)); continue; }
    const filledFields = [];
    function fill(target, source, prefix = '') {
      for (const [key, value] of Object.entries(source)) {
        if (['__proto__', 'constructor', 'prototype'].includes(key)) throw Error('Unsupported field');
        if (!prefix && key === 'fieldEvidence') continue;
        const path = prefix + key;
        if (missing(target[key]) && !missing(value)) { target[key] = copy(value); filledFields.push(path); }
        else if (value && target[key] && typeof value === 'object' && typeof target[key] === 'object' && !Array.isArray(value) && !Array.isArray(target[key])) fill(target[key], value, path + '.');
      }
    }
    fill(current, incoming);
    const at=(value,path)=>path.split('.').reduce((v,key)=>v?.[key],value);
    for(const [field,evidence] of Object.entries(current.fieldEvidence||{})) {
      if(evidence.sourceId==='source:common-100-contribution' && (!incoming.fieldEvidence?.[field] || JSON.stringify(at(current,field))!==JSON.stringify(at(incoming,field)))) delete current.fieldEvidence[field];
    }
    for(const [field,evidence] of Object.entries(incoming.fieldEvidence||{})) {
      if(JSON.stringify(at(current,field))!==JSON.stringify(at(incoming,field)))continue;
      current.fieldEvidence ||= {};
      if(!current.fieldEvidence[field])current.fieldEvidence[field]=copy(evidence);
    }
    // Keep the imported evidence separate from any stronger existing review label.
    if (filledFields.length) current.referenceEnrichment = {datasetId: 'veggie-farm-common-100-unified', reviewStatus: COMMON_REVIEW, sourceIds: copy(incoming.sourceIds || []), filledFields};
  }
  return [...records.values()];
}

export function referencePlant(record, sources) {
  const citations = record.sourceIds.map(id => ({id, ...sources[id]}));
  return {...copy(record), lifeCycle: record.lifecycle,
    reviewStatus: COMMON_REVIEW, confidence: null,
    suppliedReview: {reviewStatus: record.reviewStatus, confidence: record.confidence},
    sun: record.sun?.labels?.join(' / ') || null,
    sunlightReference: copy(record.sun), hardinessZones: record.usdaHardinessZones ? Array.from({length:record.usdaHardinessZones[1]-record.usdaHardinessZones[0]+1},(_,i)=>String(record.usdaHardinessZones[0]+i)) : [],
    sourceUrl: citations[0]?.url, citations, fieldEvidence: commonFieldEvidence(record),
    rights: {license: 'GPL-3.0-only', attribution: 'veggie.farm project owner — Common 100 compilation', scope: 'Original contribution only; linked third-party pages retain their terms.'},
    // The input does not establish a sowing/transplant timing basis or unit for every harvest range.
    daysToMaturity: {min: null, max: null, text: record.timeToHarvest?.text || null},
    germinationDays: {min: null, max: null, text: null},
    referenceDatasetId: 'veggie-farm-common-100-unified'};
}

export function referenceExplorer(record, sources) {
  const plant = referencePlant(record, sources);
  const range = value => value?.text || (value?.min != null ? `${value.min}–${value.max} in` : null);
  return {id: plant.id, name: plant.name, common: plant.commonName, scientific: plant.scientificName,
    cultivar: null, family: plant.family, category: plant.primaryUse, lifeCycle: plant.lifeCycle,
    description: 'General planning reference; check the chosen cultivar and local conditions.',
    light: plant.sun, sunHours: plant.sunlightReference?.minimumDirectSunHours != null ? `At least ${plant.sunlightReference.minimumDirectSunHours} hours (supplied planning reference)` : null,
    spacing: range(plant.spacingInches), spacingMin: plant.spacingInches.min, spacingMax: plant.spacingInches.max,
    maturity: plant.timeToHarvest?.text || null, maturityMin: null, maturityMax: null,
    matureSize: `Height ${range(plant.matureSizeInches.height)}; spread ${range(plant.matureSizeInches.spread)}. ${plant.matureSizeInches.planningNote || ''}`,
    hardiness: plant.usdaHardinessZones ? `USDA zones ${plant.usdaHardinessZones.join('–')} (general reference)` : null,
    pollination: plant.pollination, frost: null, directSow: null, transplant: null,
    source: plant.sourceUrl, sourceIds: plant.sourceIds, citations: plant.citations,
    rights: plant.rights, fieldEvidence: plant.fieldEvidence, reviewStatus: plant.reviewStatus, referenceDatasetId: plant.referenceDatasetId, rank: plant.rank, priority: plant.priority,
    imageIds: [], additionalFacts: [
      ['Soil', plant.soil.text || [plant.soil.texture?.join(', '), plant.soil.drainage, plant.soil.fertility].filter(Boolean).join('; ')],
      ['Soil pH', `${plant.soil.phMin}–${plant.soil.phMax}`],
      ['Water', plant.water.need], ['Frost', plant.frostTolerance], ['Harvest', plant.harvest],
      ['Support', plant.support], ['Direct sowing', plant.planting.directSow], ['Transplanting', plant.planting.transplant],
      ['Safety', plant.toxicityNotes]
    ].filter(([,text]) => typeof text === 'string' && text).map(([trait,text]) => ({trait, text: `${trait}: ${text}`})),
    careNotes: [...(plant.notes || []), plant.regionalContext].filter(Boolean)};
}

// Renderer aliases describe schematic fallbacks, not 22 newly implemented botanical models.
export const RENDERER_ALIASES = Object.freeze({
  'upright-fruiting-plant': 'upright-fruiting', 'vine-trellis-crop': 'upright-fruiting', bush: 'paired-herb',
  rosette: 'low-rosette', 'root-crop': 'fine-tuft', 'sprawling-cucurbit': 'low-rosette',
  'bulb-allium': 'fine-tuft', 'leafy-mound': 'low-rosette', 'climbing-legume': 'upright-fruiting',
  herb: 'paired-herb', 'tuber-foliage': 'paired-herb', 'groundcover-stolon': 'low-rosette',
  'tall-grass': 'fine-tuft', 'woody-shrub': 'rounded-shrub', bramble: 'rounded-shrub', tree: 'broadleaf-tree',
  'brassica-head': 'low-rosette', 'enormous-vine-fruit': 'low-rosette', 'vertical-perennial': 'fine-tuft',
  'flower-stalk': 'flowering-perennial', 'broad-ornamental-shrub': 'rounded-shrub', conifer: 'layered-conifer'
});
const STUDIO_IDS = Object.freeze({tomatoes:'tomato', carrots:'carrot', blueberries:'blueberry'});
export function referenceStudio(record, sources) {
  const archetype = RENDERER_ALIASES[record.studio.canonicalArchetype];
  if (!archetype) throw Error(`Unsupported canonical archetype: ${record.studio.canonicalArchetype}`);
  return {id: STUDIO_IDS[record.slug] || record.slug, catalogPlantId: record.id,
    name: record.name, scientificName: record.scientificName,
    group: {vegetable:'Vegetable', herb:'Herb', fruit:'Fruit', 'flower-or-ornamental':'Ornamental'}[record.primaryUse] || 'Reference',
    // A maximum-range planning scenario, not a measured mature plant. Existing/saved dimensions win.
    height: record.matureSizeInches.height.max, matureDiameter: record.matureSizeInches.spread.max, spacing: record.spacingInches.max,
    dimensionBasis: `Supplied general planning ranges; upper bounds used for display. ${record.matureSizeInches.planningNote || 'Verify the cultivar.'}`,
    planningRanges: copy({height:record.matureSizeInches.height, spread:record.matureSizeInches.spread, spacing:record.spacingInches}),
    sun: record.sun.labels.join(' / '), soil: record.soil.text || record.soil.drainage,
    waterStyle: record.water.need, waterCadence: 'Check soil and local conditions',
    emitter: 'Choose for the site', zone: '', gauge: '', color:'#598653', leafColor:'#598653', seed:record.rank,
    visual:{archetype, habit:archetype==='broadleaf-tree'?'tree':archetype==='layered-conifer'?'conifer':'mounded'},
    studioReference: copy(record.studio), reviewStatus: COMMON_REVIEW,
    sourceIds: copy(record.sourceIds), sources: record.sourceIds.map(id => ({id,...sources[id]}))};
}

export function mergeStudioReferences(existing, references) {
  // Keep established visual choices as well as dimensions. Saved plans merge later.
  return mergeCommonRecords(existing, references.map(record => {
    const current = existing.find(plant => plant.id === record.id);
    return current ? {...record, dimensionBasis: current.dimensionBasis || 'Existing Studio planning dimensions retained; supplied ranges are supplementary, not measurements.', visual: copy(current.visual || record.visual)} : record;
  }));
}

export function validateCommonDataset(dataset) {
  if (dataset.schemaVersion !== '1.0.0' || dataset.plants?.length !== 100) throw Error('Expected Common 100 schema');
  const ids = new Set(), slugs = new Set(), ranks = new Set();
  const mappings = new Map(dataset.visualMappings.map(row => [row.plantId, row]));
  if (mappings.size !== 100 || dataset.visualMappings.length !== 100) throw Error('Duplicate or missing visual mappings');
  for (const source of Object.values(dataset.sources)) {
    const url = new URL(source.url);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || !source.title) throw Error('Invalid source reference');
  }
  for (const plant of dataset.plants) {
    if (!plant.id?.startsWith('plant:community:') || plant.id !== `plant:community:${plant.slug}` || !/^[a-z0-9-]+$/.test(plant.slug) || !plant.name || !plant.scientificName) throw Error('Invalid plant identity');
    if (ids.has(plant.id) || slugs.has(plant.slug)) throw Error('Duplicate plant identity');
    ids.add(plant.id); slugs.add(plant.slug);
    if (!Number.isInteger(plant.rank) || plant.rank < 1 || plant.rank > 100 || ranks.has(plant.rank)) throw Error('Invalid ranking');
    ranks.add(plant.rank);
    if (!plant.sourceIds?.length || plant.sourceIds.some(id => !dataset.sources[id])) throw Error('Missing source reference');
    for (const range of [plant.spacingInches, plant.matureSizeInches?.height, plant.matureSizeInches?.spread]) {
      if (!Number.isFinite(range?.min) || !Number.isFinite(range?.max) || range.min <= 0 || range.max < range.min) throw Error('Invalid planning range');
    }
    const mapping = mappings.get(plant.id), archetype = plant.studio?.canonicalArchetype;
    if (!dataset.visualArchetypes[archetype] || !RENDERER_ALIASES[archetype] || mapping?.canonicalArchetype !== archetype || mapping?.visualVariant !== plant.studio.visualVariant) throw Error('Inconsistent visual mapping');
  }
  return {plants: ids.size, mappings: mappings.size, archetypes: Object.keys(dataset.visualArchetypes).length, sources: Object.keys(dataset.sources).length};
}

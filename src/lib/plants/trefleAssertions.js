// Staging adapter: imported assertions never become recommendations automatically.
// Contract: docs.trefle.io/docs/advanced/data-provenance/ (archived September 2026).
// Normalize vocabulary; preserve evidence; localize decisions at the caller.
// This module implements staging, not the planned regional conflict resolver.
const fields = {
  light: ['observed_habitat_light', 'ellenberg_L', 'ecological_indicator'],
  soil_humidity: ['observed_habitat_soil_moisture', 'ellenberg_F', 'ecological_indicator'],
  soil_nutriments: ['observed_habitat_nutrients', 'ellenberg_N', 'ecological_indicator'],
  soil_salinity: ['observed_habitat_salinity', 'ellenberg_S', 'ecological_indicator'],
  atmospheric_humidity: ['observed_habitat_air_humidity', 'indicator_class', 'ecological_indicator'],
  days_to_harvest: ['days_to_harvest', 'day', 'planting_to_harvest_unspecified'],
  ph_minimum: ['soil_ph_minimum', 'pH', 'source_reported'],
  ph_maximum: ['soil_ph_maximum', 'pH', 'source_reported'],
  row_spacing_cm: ['row_spacing', 'cm', 'source_reported'],
  spread_cm: ['spread', 'cm', 'source_reported'],
  minimum_root_depth_cm: ['minimum_root_depth', 'cm', 'source_reported'],
  minimum_temperature_deg_c: ['minimum_temperature_unspecified', 'degC', 'source_reported'],
  maximum_temperature_deg_c: ['maximum_temperature_unspecified', 'degC', 'source_reported'],
  minimum_precipitation_mm: ['minimum_precipitation', 'mm', 'period_unspecified'],
  maximum_precipitation_mm: ['maximum_precipitation', 'mm', 'period_unspecified'],
  average_height_cm: ['average_height', 'cm', 'source_reported'],
  maximum_height_cm: ['maximum_height', 'cm', 'source_reported'],
  bloom_months: ['bloom_months', 'month', 'geography_unspecified'],
  fruit_months: ['fruit_months', 'month', 'geography_unspecified'],
  growth_months: ['growth_months', 'month', 'geography_unspecified']
};

export function safeSourceUrl(value) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    // API query strings can contain credentials; citations must never carry them.
    url.search = ''; url.hash = '';
    return url.href;
  } catch { return null; }
}

export function trefleAssertions(speciesResponse, factsResponse, {plantId, retrievedAt} = {}) {
  const species = speciesResponse?.data;
  if (!species || Array.isArray(species) || !species.id || !species.scientific_name) throw new Error('A full species detail response is required');
  if (!Array.isArray(factsResponse?.data)) throw new Error('A facts response is required, even when empty');
  if (!plantId || !retrievedAt || !Number.isFinite(Date.parse(retrievedAt))) throw new Error('Explicit plant identity and retrieval timestamp are required');
  const ids = new Set();
  const assertions = factsResponse.data.map(fact => {
    if (fact.id == null || !fact.attribute_name || !fact.source || ids.has(String(fact.id))) throw new Error('Missing or duplicate fact identity');
    ids.add(String(fact.id));
    const mapped = fields[fact.attribute_name];
    const sourceMatches = (species.sources ?? []).filter(source => String(source.name).toLowerCase() === String(fact.source).toLowerCase() && String(source.id) === String(fact.source_record_id));
    // Never borrow a licence from another record or choose between ambiguous matches.
    const source = sourceMatches.length === 1 ? sourceMatches[0] : null;
    return {
      id: `assertion:trefle:${species.id}:${fact.id}`,
      plant_id: plantId, cultivar_id: null,
      taxon: {provider: 'trefle', id: String(species.id), scientific_name: species.scientific_name, rank: species.rank ?? null},
      trait: mapped?.[0] ?? `trefle_unmapped:${fact.attribute_name}`,
      value: fact.value ?? null, unit: fact.unit ?? mapped?.[1] ?? null,
      basis: mapped?.[2] ?? 'unmapped', life_stage: null, start_stage: null, end_stage: null,
      geography: null, climate_context: null,
      source_id: fact.source, source_record_id: fact.source_record_id ?? null,
      source_url: safeSourceUrl(fact.source_url ?? source?.url),
      aggregator_url: `https://trefle.io/api/v1/species/${encodeURIComponent(species.id)}/facts`,
      retrieved_at: retrievedAt, published_at: null, source_updated_at: fact.updated_at ?? null,
      evidence_type: fact.evidence_type ?? 'unknown', source_status: fact.status ?? 'unknown',
      applicability: mapped ? 'species_context_requires_review' : 'unmapped_requires_review',
      license: source?.licence ?? null, license_url: safeSourceUrl(source?.licence_url),
      review_status: 'unreviewed', publication_status: 'held',
      source_attribute: fact.attribute_name, source_unit: fact.unit ?? null,
      source_observed_at: fact.observed_at ?? null, n_observations: fact.n_observations ?? null
    };
  });
  return {schemaVersion: '1.0.0', provider: 'trefle', plantId, retrievedAt,
    factsCoverage: assertions.length ? 'recorded_facts_only' : 'no_recorded_facts',
    assertions};
}

// No global winner: callers must request an exact semantic context. Other claims
// remain available in the archive, including rejected and superseded provider facts.
export function eligibleTraitAssertions(assertions, {plantId, cultivarId = null, trait, basis, geography = null}) {
  return assertions.filter(a => a.plant_id === plantId && a.cultivar_id === cultivarId && a.trait === trait && a.basis === basis && a.geography === geography && a.source_status === 'active' && a.review_status === 'approved' && a.publication_status === 'approved' && a.value != null);
}

import {measurementDate} from './soilReading.js';

const DAY = 86400000;
// A packet/cultivar planning estimate has its own clock. It is not the date the
// planting entered this bed, an observed growth stage, or an occupancy end date.
export function plannedHarvest(placement, previewDate = null) {
  const estimate = placement?.harvestEstimate;
  if (!estimate) return {status: 'missing', window: null};
  if (estimate.catalog && estimate.catalog.studioPlantId !== placement.plantId) return {status: 'invalid', window: null};
  const start = measurementDate(estimate.startDate);
  const minimum = estimate.minimumDays, maximum = estimate.maximumDays;
  if (!start || !['sowing', 'transplanting'].includes(estimate.basis)
      || !Number.isInteger(minimum) || !Number.isInteger(maximum)
      || minimum < 1 || maximum < minimum || maximum > 730
      || typeof estimate.reference !== 'string' || !estimate.reference.trim()
      || estimate.reference.length > 300) return {status: 'invalid', window: null};
  const add = days => new Date(Date.parse(start + 'T00:00:00Z') + days * DAY).toISOString().slice(0, 10);
  const earliest = add(minimum), latest = add(maximum);
  if (!measurementDate(earliest) || !measurementDate(latest)) return {status: 'invalid', window: null};
  const date = measurementDate(previewDate);
  return {status: !date ? 'estimated' : date < earliest ? 'before' : date > latest ? 'past' : 'check',
    window: {earliest, latest}, start, basis: estimate.basis, minimumDays: minimum,
    maximumDays: maximum, reference: estimate.reference.trim()};
}

export function harvestBand(result, year) {
  if (!result?.window || !Number.isInteger(year) || year < 1 || year > 9998) return null;
  const first = Date.parse(`${String(year).padStart(4, '0')}-01-01T00:00:00Z`);
  const next = Date.parse(`${String(year + 1).padStart(4, '0')}-01-01T00:00:00Z`);
  const left = Math.max(first, Date.parse(result.window.earliest + 'T00:00:00Z'));
  const right = Math.min(next, Date.parse(result.window.latest + 'T00:00:00Z') + DAY);
  return right > left ? {left: 100 * (left - first) / (next - first), width: 100 * (right - left) / (next - first), date: new Date(left).toISOString().slice(0, 10)} : null;
}

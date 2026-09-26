import {plannedOccupancy} from './plannedOccupancy.js';

const day = 86400000;
// Group identical entered bounds, never substitute catalog maturity for a last day.
export function plantingSchedule(placements, year) {
  if (!Number.isInteger(year) || year < 1 || year > 9998) return [];
  const first = `${String(year).padStart(4, '0')}-01-01`;
  const start = Date.parse(`${first}T00:00:00Z`);
  const end = Date.parse(`${String(year + 1).padStart(4, '0')}-01-01T00:00:00Z`);
  const groups = new Map();
  for (const placement of placements || []) {
    const key = JSON.stringify([placement.bedId ?? null, placement.plantId ?? null, placement.planted || '', placement.plannedUntil || '', placement.sizeScenario ?? null]);
    if (groups.has(key)) { groups.get(key).count++; continue; }
    const bounds = plannedOccupancy(placement, first);
    const row = {bedId: placement.bedId, plantId: placement.plantId, count: 1,
      start: bounds.start, end: bounds.end, status: bounds.status, band: null};
    if (!['invalid', 'undated'].includes(bounds.status)) {
      const left = Math.max(start, bounds.start ? Date.parse(bounds.start + 'T00:00:00Z') : start);
      const right = Math.min(end, bounds.end ? Date.parse(bounds.end + 'T00:00:00Z') + day : end);
      if (right > left) row.band = {left: 100 * (left - start) / (end - start), width: 100 * (right - left) / (end - start), date: new Date(left).toISOString().slice(0, 10), open: !bounds.start || !bounds.end};
    }
    groups.set(key, row);
  }
  return [...groups.values()].sort((a, b) => String(a.bedId || '').localeCompare(String(b.bedId || '')) || String(a.start || '9999').localeCompare(String(b.start || '9999')) || String(a.plantId || '').localeCompare(String(b.plantId || '')));
}

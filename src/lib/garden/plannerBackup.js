export const MAX_PLANNER_BACKUP_BYTES = 20 * 1024 * 1024;
export const PLANNER_BACKUP_FORMAT = 'veggie.farm/planner';

// Accept the previous unversioned full export as well as explicit v1 backups.
// Spatial review files are deliberately a different input format.
export function parsePlannerBackup(text) {
  if (new TextEncoder().encode(text).length > MAX_PLANNER_BACKUP_BYTES) throw Error('Planner backups are limited to 20 MB.');
  const data = JSON.parse(text);
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  if (!object(data)) throw Error('Choose a full planner JSON backup.');
  if (data.backupFormat !== undefined || data.backupVersion !== undefined) {
    if (data.backupFormat !== PLANNER_BACKUP_FORMAT || data.backupVersion !== 1) throw Error('This backup format or version is not supported.');
  }
  function inspect(value, depth = 0) {
    if (depth > 80) throw Error('Backup nesting is too deep.');
    if (typeof value === 'number' && !Number.isFinite(value)) throw Error('Backup contains an invalid number.');
    if (value && typeof value === 'object') {
      for (const [key, child] of Object.entries(value)) {
        if (['__proto__', 'prototype', 'constructor'].includes(key)) throw Error('Backup contains an unsupported property.');
        inspect(child, depth + 1);
      }
    }
  }
  inspect(data);
  function records(value, name) {
    if (!Array.isArray(value) || value.some(item => !object(item) || typeof item.id !== 'string' || !item.id)) throw Error(`Invalid ${name} records.`);
    if (new Set(value.map(item => item.id)).size !== value.length) throw Error(`Duplicate ${name} IDs.`);
  }
  function workspace(value) {
    if (!object(value.property)) throw Error('Missing garden property record.');
    for (const name of ['beds', 'structures', 'vegetation', 'placements']) records(value[name], name);
    const beds = new Set(value.beds.map(bed => bed.id));
    if (value.placements.some(item => item.bedId != null && !beds.has(item.bedId))) throw Error('A planting refers to a missing bed.');
  }
  workspace(data);
  for (const name of ['plants', 'parcels', 'layouts']) records(data[name], name);
  if (!data.parcels.some(item => item.id === data.activeParcelId)) throw Error('The active garden is missing.');
  for (const parcel of data.parcels) workspace(parcel);
  for (const layout of data.layouts) {
    if (typeof layout.name !== 'string' || !layout.name.trim()) throw Error('A saved version has no name.');
    if (layout.workspace) workspace(layout.workspace);
    if (layout.parcels) { records(layout.parcels, 'saved gardens'); layout.parcels.forEach(workspace); }
  }
  return data;
}

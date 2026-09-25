// A shared garden is an explicit selection, never a full planner/account backup.
// Keep the selected geometry and its provenance; leave versions, other gardens,
// notebook records and browser/account state in their original private store.
const fields = ['id','name','property','activeBedId','beds','structures','vegetation','placements','starterLayoutRevision'];
const forbidden = new Set(['__proto__','prototype','constructor','parcels','layouts','notebook','observations','records','profile','accessToken','idToken','refreshToken','credentials','authorization','password']);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const identifier = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,191}$/.test(value);

export function selectedSharedGarden(workspace) {
  const result = Object.fromEntries(fields.filter(key => Object.hasOwn(workspace, key)).map(key => [key, structuredClone(workspace[key])]));
  // Old empty-bed workspaces can retain a toolbar selection after deleting the
  // last bed. Selection is UI state; clear it without inventing or dropping beds.
  if (Array.isArray(result.beds) && !result.beds.some(bed => bed.id === result.activeBedId)) result.activeBedId = null;
  validateSharedGarden(result);
  return result;
}

export function validateSharedGarden(garden) {
  if (!object(garden) || Object.keys(garden).some(key => !fields.includes(key)) || !identifier(garden.id)
    || typeof garden.name !== 'string' || !garden.name.trim() || garden.name.length > 160
    || !object(garden.property) || garden.property.id !== garden.id) throw Error('Invalid selected garden');
  let count = 0;
  function inspect(value, depth = 0) {
    if (++count > 100000 || depth > 35) throw Error('Garden is too complex');
    if (typeof value === 'number' && !Number.isFinite(value)) throw Error('Invalid garden number');
    if (typeof value === 'string' && value.length > 16000) throw Error('Garden text is too long');
    if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) {
      if (forbidden.has(key)) throw Error('Private workspace data is not a shared garden');
      inspect(child, depth + 1);
    }
  }
  inspect(garden);
  for (const key of ['beds','structures','vegetation','placements']) {
    const rows = garden[key];
    if (!Array.isArray(rows) || rows.length > 5000 || rows.some(row => !object(row) || !identifier(row.id))
      || new Set(rows.map(row => row.id)).size !== rows.length) throw Error('Invalid garden features');
  }
  const beds = new Set(garden.beds.map(bed => bed.id));
  if (garden.activeBedId != null && !beds.has(garden.activeBedId)) throw Error('Active bed is missing');
  if (garden.placements.some(row => row.bedId != null && !beds.has(row.bedId))) throw Error('Planting bed is missing');
  return garden;
}

// Freeform working notes are not published. Source IDs, source URLs, geometry
// basis and confidence remain available. Location/geometry are intentionally
// included and must be visible in the owner's exact publication preview.
export function publicGarden(garden) {
  validateSharedGarden(garden);
  function project(value) {
    if (Array.isArray(value)) return value.map(project);
    if (object(value)) return Object.fromEntries(Object.entries(value).filter(([key]) => !['notes','attributes','referenceOverlays','importSources'].includes(key)).map(([key, child]) => [key, project(child)]));
    return value;
  }
  return project(garden);
}

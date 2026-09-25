// Stable public example identities; demo edits belong only to browser storage.
export const PUBLIC_DEMO_IDS = Object.freeze([
  'berkshire-botanical-garden', 'naumkeag-garden-rooms',
  'the-mount-kitchen-garden', 'ashintully-terrace-garden'
]);
export const isPublicDemo = garden => PUBLIC_DEMO_IDS.includes(garden?.id || garden?.property?.id);
const layoutGarden = layout => layout.gardenId || layout.activeParcelId || layout.workspace?.id || layout.property?.id;
const noGardens = () => Object.assign(new Error('Create your own garden before saving to your account.'), {code:'no_personal_gardens'});

// Backups duplicate the active workspace for compatibility with older planners.
// Copy these fields atomically; never leave an old demo mirror beside personal data.
const WORKSPACE_FIELDS = [
  'property', 'activeBedId', 'bedCameras', 'beds', 'structures', 'vegetation',
  'placements', 'selectedVegetationId', 'selectedStructureId', 'selectedPlacementId',
  'starterLayoutRevision', 'parcelBufferInches', 'parcelViewport', 'viewBearing', 'viewPitch'
];
function mirrorWorkspace(envelope, workspace) {
  for (const key of WORKSPACE_FIELDS) {
    delete envelope[key];
    if (Object.hasOwn(workspace, key)) envelope[key] = structuredClone(workspace[key]);
  }
  // The old active-bed control snapshot is derived from beds on restoration.
  delete envelope.bed;
  delete envelope.spatial;
  return envelope;
}

/** Project the browser backup onto personal workspaces only, including old snapshots. */
export function accountGardenPayload(input) {
  const source = structuredClone(input);
  const parcels = (source.parcels || []).filter(garden => !isPublicDemo(garden));
  if (!parcels.length) throw noGardens();
  const ids = new Set(parcels.map(garden => garden.id));
  const active = parcels.find(garden => garden.id === source.activeParcelId) || parcels[0];
  const layouts = (source.layouts || []).filter(layout => ids.has(layoutGarden(layout))).map(layout => {
    const gardenId = layoutGarden(layout);
    if (layout.parcels) layout.parcels = layout.parcels.filter(garden => !isPublicDemo(garden));
    const workspace = layout.workspace?.id === gardenId ? layout.workspace
      : layout.parcels?.find(garden => garden.id === gardenId);
    if (workspace) {
      mirrorWorkspace(layout, workspace);
      if (layout.workspace) layout.workspace = structuredClone(workspace);
    } else {
      // Older versions kept only top-level garden fields. A conflicting identity
      // is ambiguous: refuse the account export rather than lose personal work.
      if (layout.property?.id !== gardenId) {
        throw Object.assign(new Error('A saved version has conflicting garden identities.'), {code:'invalid_account_layout'});
      }
      if (layout.workspace) delete layout.workspace;
      delete layout.bed;
      delete layout.spatial;
    }
    layout.gardenId = gardenId;
    layout.activeParcelId = gardenId;
    return layout;
  });
  const {id, name} = active;
  const payload = mirrorWorkspace({...source, parcels, layouts, activeParcelId:id}, active);
  delete payload.id;
  delete payload.name;
  if (source.activeParcelId !== id) payload.layoutName = `${name || 'My garden'} · working`;
  return payload;
}

/** Restore personal gardens without replacing this browser's demo experiments. */
export function mergeAccountGardens(local, incoming) {
  const personal = accountGardenPayload(incoming);
  const demos = structuredClone((local.parcels || []).filter(isPublicDemo));
  const demoLayouts = structuredClone((local.layouts || []).filter(layout => PUBLIC_DEMO_IDS.includes(layoutGarden(layout))));
  return {...personal, parcels:[...demos, ...personal.parcels], layouts:[...demoLayouts, ...personal.layouts]};
}

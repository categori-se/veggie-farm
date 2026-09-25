import {upgradeStarterFeatures} from './starterLayoutMigration.js';

/** Replace untouched schematic starters; retain owner edits and occupied beds. */
export function migratePublicGardenSite(workspace, legacy, current, revision, viewport, additions = []) {
  if (Number(workspace.starterLayoutRevision) >= revision) return workspace;
  // Later additive surveys must not replay the original schematic retirement.
  // That would resurrect deleted site features and reset an owner's camera.
  if (Number(workspace.starterLayoutRevision) >= legacy.starterLayoutRevision + 1 && additions.length) {
    const result = {...workspace, starterLayoutRevision: revision};
    for (const [collection, idKey] of [['structures', 'structureIds'], ['vegetation', 'vegetationIds']]) {
      const existing = workspace[collection] || [];
      const ids = new Set(existing.map(feature => feature.id));
      const introduced = new Set(additions
        .filter(step => step.revision > workspace.starterLayoutRevision && step.revision <= revision)
        .flatMap(step => step[idKey] || []));
      result[collection] = [...existing, ...(current[collection] || [])
        .filter(feature => introduced.has(feature.id) && !ids.has(feature.id))
        .map(feature => structuredClone(feature))];
    }
    return result;
  }
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const userPlacements = (workspace.placements || []).filter(p =>
    !legacy.placements.some(old => old.id === p.id && same(old, p)));
  const protectedBeds = new Set(userPlacements.map(p => p.bedId));
  const beds = upgradeStarterFeatures(workspace.beds, legacy.beds, current.beds,
    {dropRetiredUntouched: true});
  for (const bed of workspace.beds || []) {
    if (protectedBeds.has(bed.id) && !beds.some(b => b.id === bed.id)) beds.push(structuredClone(bed));
  }
  const bedIds = new Set(beds.map(b => b.id));
  return {
    ...workspace,
    beds,
    structures: upgradeStarterFeatures(workspace.structures, legacy.structures, current.structures,
      {dropRetiredUntouched: true}),
    vegetation: upgradeStarterFeatures(workspace.vegetation, legacy.vegetation, current.vegetation,
      {dropRetiredUntouched: true}),
    placements: (workspace.placements || []).filter(p => bedIds.has(p.bedId)),
    activeBedId: bedIds.has(workspace.activeBedId) ? workspace.activeBedId : beds[0]?.id || null,
    starterLayoutRevision: revision,
    parcelViewport: structuredClone(viewport)
  };
}

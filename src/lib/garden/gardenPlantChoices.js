// Choices belong to the active garden. A demo or another garden is not a
// preference signal for this one, and catalog identity is never name-matched.
export function gardenPlantChoices({plants=[],placements=[],property={}},query='') {
  const chosen=new Set([...(property.planningTray||[]).map(p=>p.plantId),...placements.map(p=>p.plantId)]);
  const q=query.trim().toLocaleLowerCase();
  const matches=plants.filter(p=>[p.name,p.group,p.catalogIdentity?.cultivar,p.catalogIdentity?.scientific,p.waterStyle,p.soil].filter(Boolean).join(' ').toLocaleLowerCase().includes(q));
  const preferred=matches.filter(p=>chosen.has(p.id));
  const others=matches.filter(p=>!chosen.has(p.id));
  return {preferred,others,all:[...preferred,...others],hasChoices:plants.some(p=>chosen.has(p.id))};
}

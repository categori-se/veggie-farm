export function companionScore(plant, companionRelationships = [], profile = {}) {
  const planned = new Set(profile.nearbyPlantIds ?? []);
  if (!planned.size) return {score: 0.75, label: "neutral", reason: "No neighboring crops were supplied."};
  const plantId = plant.id;
  const matches = companionRelationships.filter((edge) => (
    edge.from === plantId && planned.has(edge.to)
  ) || (
    edge.to === plantId && planned.has(edge.from)
  ));
  if (!matches.length) return {score: 0.75, label: "neutral", reason: "No reviewed companion conflict is known."};
  const conflict = matches.find((edge) => /competes|avoid/.test(edge.relationship));
  if (conflict) return {score: 0.42, label: "conflict", reason: conflict.reason ?? "Potential companion or rotation conflict."};
  return {score: 0.88, label: "compatible", reason: matches[0].reason ?? "Known compatible pairing."};
}

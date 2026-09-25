export function rotationRisk(plant, rotationFamilies = [], profile = {}) {
  const family = plant.family;
  const previous = new Set(Array.isArray(profile.previousCropFamilies) ? profile.previousCropFamilies : []);
  const rotation = rotationFamilies.find((row) => row.family === family);
  if (!family || !rotation) {
    return {score: 0.78, label: "unknown", reason: "Rotation family is not reviewed yet."};
  }
  if (previous.has(family)) {
    return {
      score: rotation.avoidFollowingSameFamily ? 0.38 : 0.62,
      label: "risk",
      reason: `${rotation.label} followed ${rotation.label}; watch ${rotation.commonRisks.slice(0, 2).join(" and ")}.`
    };
  }
  if (profile.rotationHistoryReviewed !== true) {
    return {
      score: 0.78,
      label: "unknown",
      reason: "This bed’s recent crop history has not been reviewed; rotation fit is unknown."
    };
  }
  return {score: 0.95, label: "good", reason: `${rotation.label} is not listed in the history you reviewed; this does not rule out disease risk.`};
}

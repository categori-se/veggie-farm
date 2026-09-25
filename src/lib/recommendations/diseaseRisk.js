export function diseaseRisk(plant, diseases = [], profile = {}) {
  const wet = Boolean(profile.wetWeather);
  const dense = Boolean(profile.denseCanopy);
  const affected = diseases.filter((disease) => disease.affectedPlants?.includes(plant.id));
  if (!affected.length) return {score: 0.82, label: "unknown", reason: "No disease pattern is linked to this crop yet."};
  if ((wet || dense) && affected.some((disease) => /blight|mildew|damping/i.test(disease.commonName))) {
    return {score: 0.48, label: "watch", reason: `Monitor for ${affected.map((disease) => disease.commonName).slice(0, 2).join(" and ")} under wet or dense-canopy conditions.`};
  }
  return {score: 0.72, label: "monitor", reason: `Known diseases include ${affected.map((disease) => disease.commonName).slice(0, 2).join(" and ")}.`};
}

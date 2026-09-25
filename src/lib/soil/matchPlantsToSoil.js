import {soilMatch} from "../recommendations/soilMatch.js";

export function matchPlantsToSoil(plants, soilPreferences, profile = {}) {
  const preferenceByPlant = new Map((soilPreferences ?? []).map((row) => [row.plantId, row]));
  return plants
    .map((plant) => {
      const match = soilMatch(plant, preferenceByPlant.get(plant.id), profile);
      return {...plant, soilScore: match.score, soilLabel: match.label, soilReason: match.reason};
    })
    .sort((a, b) => b.soilScore - a.soilScore || a.name.localeCompare(b.name));
}

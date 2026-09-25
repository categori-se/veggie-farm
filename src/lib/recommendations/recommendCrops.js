import {companionScore} from "./companionScore.js";
import {diseaseRisk} from "./diseaseRisk.js";
import {plantingWindow} from "./plantingWindow.js";
import {rotationRisk} from "./rotationRisk.js";
import {soilMatch} from "./soilMatch.js";
import {sunMatch} from "./sunMatch.js";

function goalScore(plant, profile = {}) {
  const goal = profile.goal ?? "balanced";
  const name = plant.name.toLowerCase();
  if (goal === "quick harvest" && /radish|lettuce|arugula|mizuna|mustard|spinach|bok choy/.test(name)) return 1;
  if (goal === "salads" && /lettuce|arugula|spinach|mizuna|cucumber|tomato|radish|carrot/.test(name)) return 1;
  if (goal === "heat crops" && /tomato|pepper|eggplant|okra|melon|squash|cucumber|bean/.test(name)) return 1;
  if (goal === "pollinators" && (plant.pollinatorValue || plant.primaryUse === "flower-or-ornamental")) return 1;
  return 0.72;
}

export function recommendCrops(plants, datasets = {}, profile = {}) {
  const ruleByPlant = new Map((datasets.plantingRules ?? []).map((rule) => [rule.plantId, rule]));
  const soilByPlant = new Map((datasets.soilPreferences ?? []).map((soil) => [soil.plantId, soil]));
  return plants
    .filter((plant) => profile.primaryUse === "all" || !profile.primaryUse || plant.primaryUse === profile.primaryUse)
    .map((plant) => {
      const checks = {
        planting: plantingWindow(plant, ruleByPlant.get(plant.id), profile),
        sun: sunMatch(plant, profile),
        soil: soilMatch(plant, soilByPlant.get(plant.id), profile),
        rotation: rotationRisk(plant, datasets.rotationFamilies, profile),
        companion: companionScore(plant, datasets.companionRelationships, profile),
        disease: diseaseRisk(plant, datasets.diseases, profile)
      };
      const goal = goalScore(plant, profile);
      const criteria = [
        ['planting', 'Timing', 30, checks.planting],
        ['sun', 'Sunlight', 18, checks.sun],
        ['soil', 'Soil', 18, checks.soil],
        ['rotation', 'Rotation', 12, checks.rotation],
        ['companion', 'Companions', 7, checks.companion],
        ['disease', 'Disease conditions', 7, checks.disease],
        ['goal', 'Garden goal', 8, {score: goal, label: goal === 1 ? 'priority match' : 'baseline', reason: goal === 1 ? `Matches the selected ${profile.goal} preference.` : 'No additional crop preference for the selected garden goal.'}]
      ].map(([key, label, maximum, check]) => ({key, label, maximum, score: check.score, points: check.score * maximum, status: check.label || check.status, reason: check.reason}));
      const score = criteria.reduce((sum, criterion) => sum + criterion.score * (criterion.maximum / 100), 0);
      const status = checks.planting.status;
      return {
        plant,
        score,
        percent: Math.round(score * 100),
        criteria,
        status,
        reasons: [checks.planting.reason, checks.sun.reason, checks.soil.reason, checks.rotation.reason].filter(Boolean),
        warnings: [checks.disease.label !== "unknown" ? checks.disease.reason : null, checks.companion.label === "conflict" ? checks.companion.reason : null].filter(Boolean),
        sources: plant.sourceIds,
        confidence: plant.confidence,
        assumptions: [
          `Last frost: ${profile.lastFrostDate ?? "default spring estimate"}`,
          `First frost: ${profile.firstFrostDate ?? "default fall estimate"}`,
          `Soil temperature: ${profile.soilTemperatureF == null || String(profile.soilTemperatureF).trim() === "" ? "not entered" : `${profile.soilTemperatureF}°F`}`
        ],
        observe: ["soil temperature", "seedling emergence", "water stress", "pest pressure", "bolting or cold injury"]
      };
    })
    .sort((a, b) => b.score - a.score || a.plant.name.localeCompare(b.plant.name));
}

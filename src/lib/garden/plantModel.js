// These catalog assets depict harvested fruit, not growing plants. Keep their
// source records/assets available, but use the procedural canopy in the plan.
const PRODUCE_MODELS = new Set(["quaternius-tomato", "quaternius-pumpkin"]);

export function modelAppliesToPlant(feature, plant) {
  if (PRODUCE_MODELS.has(feature?.id)) return false;
  const ids = feature?.properties?.appliesToPlantIds;
  if (!Array.isArray(ids) || !plant) return false;
  return ids.includes(plant.id) || (plant.group === "Flower" && ids.includes("flower:*"));
}

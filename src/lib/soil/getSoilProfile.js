import {classifyGardenSoil} from "./classifyGardenSoil.js";

export function getSoilProfile(input = {}) {
  const classified = classifyGardenSoil(input);
  return {
    ...classified,
    pH: input.pH ?? null,
    nitrogen: input.nitrogen ?? null,
    phosphorus: input.phosphorus ?? null,
    potassium: input.potassium ?? null,
    source: input.soilTestDate ? "soil-test" : "gardener-estimate",
    assumptions: input.soilTestDate
      ? [`Soil test date: ${input.soilTestDate}`]
      : ["Soil profile is based on gardener-entered texture and drainage."]
  };
}

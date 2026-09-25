const DAY = 24 * 60 * 60 * 1000;

function daysBetween(a, b) {
  return Math.round((new Date(a).getTime() - new Date(b).getTime()) / DAY);
}

export function plantingWindow(plant, rule, profile = {}) {
  const date = profile.date ?? new Date().toISOString().slice(0, 10);
  const lastFrostDate = profile.lastFrostDate ?? `${date.slice(0, 4)}-04-20`;
  const firstFrostDate = profile.firstFrostDate ?? `${date.slice(0, 4)}-10-15`;
  const afterLastFrost = daysBetween(date, lastFrostDate);
  const beforeFirstFrost = daysBetween(firstFrostDate, date);
  const rawSoilTemp = profile.soilTemperatureF;
  const parsedSoilTemp = rawSoilTemp == null || String(rawSoilTemp).trim() === "" ? NaN : Number(rawSoilTemp);
  const soilTemp = Number.isFinite(parsedSoilTemp) && parsedSoilTemp >= 20 && parsedSoilTemp <= 110 ? parsedSoilTemp : null;
  const minTemp = plant.idealSoilTemperatureF?.min;
  const season = plant.season ?? rule?.season;
  const warm = season === "warm-season";

  if (warm && afterLastFrost < 0) {
    return {score: 0.22, status: "wait", reason: "Warm-season crop before last frost; start indoors or wait."};
  }
  if (warm && soilTemp !== null && minTemp != null && soilTemp < minTemp) {
    return {score: 0.35, status: "wait", reason: `Soil is ${soilTemp}F; target germination starts around ${minTemp}F.`};
  }
  if (season?.startsWith("cool") && beforeFirstFrost < 35) {
    return {score: 0.3, status: "avoid_this_season", reason: "Not enough fall runway for most cool-season crops."};
  }
  if (season?.startsWith("cool") && soilTemp > 78) {
    return {score: 0.46, status: "wait", reason: "Cool-season crop in hot soil; wait for cooler weather or use shade and irrigation."};
  }
  if (beforeFirstFrost < 45 && /melon|squash|tomato|pepper|eggplant|corn/i.test(plant.name)) {
    return {score: 0.34, status: "avoid_this_season", reason: "Likely too late for long warm-season crops without transplants or protection."};
  }
  if (soilTemp === null) return {score: 0.5, status: "check_conditions", reason: "Soil temperature is not entered; check current soil conditions before planting."};
  return {
    score: 0.9,
    status: warm && rule?.startIndoors ? "plant_now_or_transplant" : "plant_now",
    reason: "Current frost and soil-temperature assumptions fit this crop."
  };
}

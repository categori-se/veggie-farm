export function sunMatch(plant, profile = {}) {
  const raw = profile.sunHours;
  const sunHours = raw == null || String(raw).trim() === "" ? NaN : Number(raw);
  if (!Number.isFinite(sunHours) || sunHours < 0 || sunHours > 24) return {score: 0.5, label: "unknown", reason: "Direct sun hours are not recorded; light fit has not been assessed."};
  const text = String(plant.sun ?? "").toLowerCase();
  if (!text) {
    return {score: 0.55, label: "unknown", reason: "Sun requirement is not reviewed yet."};
  }
  if (text.includes("full sun") && sunHours >= 6) {
    return {score: 1, label: "good", reason: `${sunHours} hours fits a full-sun crop.`};
  }
  if (text.includes("partial") && sunHours >= 3 && sunHours < 7) {
    return {score: 0.95, label: "good", reason: `${sunHours} hours fits a crop that tolerates partial shade.`};
  }
  if (sunHours < 5 && text.includes("full sun")) {
    return {score: 0.35, label: "weak", reason: "This crop usually wants more direct sun than the bed receives."};
  }
  if (sunHours >= 7 && text.includes("shade")) {
    return {score: 0.72, label: "possible", reason: "Sun is adequate, but heat stress may matter for shade-tolerant cool crops."};
  }
  return {score: 0.7, label: "possible", reason: "Sun exposure is probably workable, but verify crop response."};
}

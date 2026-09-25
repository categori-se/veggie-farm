export function soilMatch(plant, soilPreference, profile = {}) {
  const texture = String(profile.soilTexture ?? "").toLowerCase();
  if (!texture.trim()) return {score: 0.5, label: "unknown", reason: "Soil texture is not recorded; soil fit has not been assessed."};
  const drainage = String(profile.drainage ?? "").toLowerCase();
  const preferred = (soilPreference?.preferredTexture ?? []).map((value) => value.toLowerCase());
  const tolerated = (soilPreference?.toleratedTexture ?? []).map((value) => value.toLowerCase());
  const rootCrop = /carrot|radish|beet|turnip|parsnip/i.test(plant.name);

  if (preferred.some((value) => texture.includes(value) || value.includes(texture))) {
    return {score: 1, label: "good", reason: `${plant.name} fits ${profile.soilTexture ?? "managed loam"}.`};
  }
  if (rootCrop && texture.includes("clay")) {
    return {score: 0.38, label: "risky", reason: "Root crops need loose, even soil; clay beds need preparation first."};
  }
  if (drainage === "slow" && /tomato|pepper|cucumber|squash|melon/i.test(plant.name)) {
    return {score: 0.52, label: "needs preparation", reason: "This crop dislikes waterlogged soil; improve drainage or use a raised bed."};
  }
  if (tolerated.some((value) => value.includes(texture) || texture.includes(value))) {
    return {score: 0.75, label: "possible", reason: "Soil can work if moisture and organic matter are managed."};
  }
  return {score: 0.65, label: "possible", reason: "No crop-specific soil conflict is known yet."};
}

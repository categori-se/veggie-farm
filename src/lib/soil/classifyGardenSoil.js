export function classifyGardenSoil(profile = {}) {
  const texture = String(profile.soilTexture ?? "managed raised-bed loam").toLowerCase();
  const drainage = String(profile.drainage ?? "moderate").toLowerCase();
  const organicMatter = Number(profile.organicMatterPercent ?? 4);
  const bedDepth = Number(profile.bedDepthInches ?? 10);

  const limitations = [];
  if (texture.includes("clay") && drainage === "slow") limitations.push("slow drainage");
  if (texture.includes("sand")) limitations.push("low water and nutrient holding");
  if (organicMatter < 3) limitations.push("low organic matter");
  if (bedDepth < 8) limitations.push("shallow rooting depth");

  return {
    texture,
    drainage,
    organicMatterPercent: organicMatter,
    bedDepthInches: bedDepth,
    className: texture.includes("clay")
      ? "clay-managed bed"
      : texture.includes("sand")
        ? "sandy-managed bed"
        : "loam-managed bed",
    limitations,
    confidence: profile.soilTestDate ? 0.82 : 0.55
  };
}

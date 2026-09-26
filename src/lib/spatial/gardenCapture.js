import {selectSourceFeaturesWithinParcels} from "./geoJsonPromotion.js";

// A review package is deliberately separate from saved garden state.
export function prepareGardenCapture({gardenId, parcels, buildings, capturedAt, sourceUrl}) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(gardenId || "")) throw new Error("A garden slug is required");
  if (!Number.isFinite(Date.parse(capturedAt))) throw new Error("A capture date is required");
  if (!sourceUrl || new URL(sourceUrl).protocol !== "https:") throw new Error("An HTTPS source URL is required");
  function validate(collection, name, maximum) {
    if (collection?.type !== "FeatureCollection" || !Array.isArray(collection.features) || collection.features.length > maximum) throw new Error(`${name}: invalid or oversized collection`);
    const ids = new Set();
    let count = 0;
    function positions(value) {
      if (!Array.isArray(value) || !value.length) throw new Error(`${name}: empty coordinates`);
      if (typeof value[0] === "number") {
        if (++count > 100000 || value.length < 2 || !value.every(Number.isFinite) || Math.abs(value[0]) > 180 || Math.abs(value[1]) > 90) throw new Error(`${name}: expected bounded CRS84 longitude/latitude coordinates`);
        return;
      }
      value.forEach(positions);
    }
    for (const f of collection.features) {
      if (f.type !== "Feature" || f.id == null || ids.has(String(f.id)) || !["Polygon", "MultiPolygon"].includes(f.geometry?.type)) throw new Error(`${name}: unique IDs and polygon geometry required`);
      ids.add(String(f.id)); positions(f.geometry.coordinates);
      const polygons = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
      for (const polygon of polygons) for (const ring of polygon) if (ring.length < 4 || ring[0][0] !== ring.at(-1)[0] || ring[0][1] !== ring.at(-1)[1]) throw new Error(`${name}: polygon rings must be closed`);
    }
  }
  validate(parcels, "parcels", 32);
  validate(buildings, "buildings", 2000);
  if (!parcels.features.length) throw new Error("Select at least one parcel");
  const site = selectSourceFeaturesWithinParcels(buildings, parcels, {sourceId: buildings.properties?.sourceId || sourceUrl});
  return {
    schemaVersion: "1.0.0", gardenId, capturedAt, status: "review-required", sourceUrl,
    layers: {parcels: structuredClone(parcels), site, beds: {type: "FeatureCollection", features: []}, plants: {type: "FeatureCollection", features: []}},
    analysis: {selectedParcels: parcels.features.length, candidateBuildings: buildings.features.length, selectedBuildings: site.features.length, excludedBuildings: buildings.features.length - site.features.length, selectionMethod: "representative-point membership; crossing footprints are not clipped"},
    review: ["Confirm parcel IDs and disconnected boundaries", "Compare roofs against dated orthophotography; roof displacement is possible", "Check at least three distributed landmarks and one independent check point", "Trace paths and beds only where visible; retain uncertainty and source date", "Assign species only from named collection or field records", "Import through Studio spatial review and save a separate browser copy"],
    limitations: ["Not a survey or verified occupancy inventory", "No plant identity, bed geometry, terrain elevation or building height inferred", "Raw provider properties may include sensitive information: keep this package private until reviewed"]
  };
}

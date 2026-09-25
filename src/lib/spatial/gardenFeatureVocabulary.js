/**
 * Stable spatial categories shared by the garden editor and interchange files.
 *
 * Canonical garden records predate this vocabulary and describe semantics in a
 * few different fields (`kind`, `classification`, `featureType`, and
 * `collection`). Keep that source detail intact; this module only derives a
 * predictable editing/export category from it. The broad categories are
 * intentionally durable enough to map to a future MapLibre/Mapbox GL Draw
 * toolbar without coupling the stored data to one renderer.
 */

const style = (stroke, fill, options = {}) => Object.freeze({
  stroke,
  fill,
  strokeWidth: options.strokeWidth ?? 2,
  strokeOpacity: options.strokeOpacity ?? 1,
  fillOpacity: options.fillOpacity ?? 0.28,
  pointColor: options.pointColor ?? stroke,
  pointScale: options.pointScale ?? 0.9,
  lineDash: options.lineDash ?? null
});

export const GARDEN_FEATURE_CATEGORIES = Object.freeze({
  parcel: Object.freeze({
    id: "parcel", label: "Parcel boundaries", layer: "parcels",
    geometries: Object.freeze(["Polygon", "MultiPolygon"]),
    style: style("#f4e8be", "#f4e8be", {strokeWidth: 3, fillOpacity: 0.04})
  }),
  road: Object.freeze({
    id: "road", label: "Roads and drives", layer: "site",
    geometries: Object.freeze(["LineString", "MultiLineString", "Polygon", "MultiPolygon"]),
    style: style("#5f6062", "#77787a", {strokeWidth: 4, fillOpacity: 0.52})
  }),
  path: Object.freeze({
    id: "path", label: "Paths and trails", layer: "site",
    geometries: Object.freeze(["LineString", "MultiLineString", "Polygon", "MultiPolygon"]),
    style: style("#a47c48", "#c9ad7c", {strokeWidth: 3, fillOpacity: 0.42, lineDash: [6, 3]})
  }),
  parking: Object.freeze({
    id: "parking", label: "Parking areas", layer: "site",
    geometries: Object.freeze(["Polygon", "MultiPolygon"]),
    style: style("#66686a", "#8b8d8f", {strokeWidth: 2, fillOpacity: 0.48})
  }),
  building: Object.freeze({
    id: "building", label: "Buildings and structures", layer: "site",
    geometries: Object.freeze(["Polygon", "MultiPolygon", "Point"]),
    style: style("#604f45", "#9d897b", {strokeWidth: 2, fillOpacity: 0.7, pointScale: 1})
  }),
  "garden-area": Object.freeze({
    id: "garden-area", label: "Garden areas", layer: "site",
    geometries: Object.freeze(["Point", "LineString", "MultiLineString", "Polygon", "MultiPolygon"]),
    style: style("#436b3e", "#8fba79", {strokeWidth: 2, fillOpacity: 0.2, lineDash: [5, 3]})
  }),
  plot: Object.freeze({
    id: "plot", label: "Plots", layer: "site",
    geometries: Object.freeze(["Polygon", "MultiPolygon"]),
    style: style("#6d652d", "#c2b75a", {strokeWidth: 2, fillOpacity: 0.24})
  }),
  subplot: Object.freeze({
    id: "subplot", label: "Subplots", layer: "site",
    geometries: Object.freeze(["Polygon", "MultiPolygon"]),
    style: style("#867a32", "#d2c76d", {strokeWidth: 1.5, fillOpacity: 0.2, lineDash: [4, 2]})
  }),
  bed: Object.freeze({
    id: "bed", label: "Garden beds", layer: "beds",
    geometries: Object.freeze(["Polygon", "MultiPolygon"]),
    style: style("#704f2e", "#9b7651", {strokeWidth: 2, fillOpacity: 0.58})
  }),
  tree: Object.freeze({
    id: "tree", label: "Tree observations", layer: "site",
    geometries: Object.freeze(["Point", "MultiPoint"]),
    style: style("#215d38", "#438c57", {strokeWidth: 2, fillOpacity: 0.25, pointScale: 1.05})
  }),
  vegetation: Object.freeze({
    id: "vegetation", label: "Vegetation and land cover", layer: "site",
    geometries: Object.freeze(["Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon"]),
    style: style("#3f7148", "#60966a", {strokeWidth: 1.5, fillOpacity: 0.24})
  }),
  utility: Object.freeze({
    id: "utility", label: "Utilities", layer: "site",
    geometries: Object.freeze(["Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon"]),
    style: style("#6f54a3", "#9b86c4", {strokeWidth: 2, fillOpacity: 0.2, pointScale: 0.85})
  }),
  barrier: Object.freeze({
    id: "barrier", label: "Fences and barriers", layer: "site",
    geometries: Object.freeze(["Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon"]),
    style: style("#7e3e31", "#a76558", {strokeWidth: 2.5, fillOpacity: 0.16, lineDash: [3, 2]})
  }),
  water: Object.freeze({
    id: "water", label: "Water features", layer: "site",
    geometries: Object.freeze(["Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon"]),
    style: style("#286785", "#5ca5c5", {strokeWidth: 2, fillOpacity: 0.45})
  }),
  plant: Object.freeze({
    id: "plant", label: "Plant placements and observations", layer: "plants",
    geometries: Object.freeze(["Point", "MultiPoint"]),
    style: style("#207447", "#51a96f", {strokeWidth: 1.5, fillOpacity: 0.4, pointScale: 0.72})
  }),
  "other-site": Object.freeze({
    id: "other-site", label: "Other site features", layer: "site",
    geometries: Object.freeze(["Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon"]),
    style: style("#68746c", "#91a096", {strokeWidth: 1.5, fillOpacity: 0.18, lineDash: [4, 3]})
  })
});

export const GARDEN_FEATURE_CATEGORY_IDS = Object.freeze(Object.keys(GARDEN_FEATURE_CATEGORIES));

const EXACT_ALIASES = Object.freeze({
  parcel: "parcel", "tax-parcel": "parcel", "parcel-boundary": "parcel",
  road: "road", driveway: "road", drive: "road", "access-road": "road", "service-road": "road",
  path: "path", trail: "path", walk: "path", walkway: "path", sidewalk: "path",
  parking: "parking", "parking-area": "parking", "parking-lot": "parking",
  building: "building", structure: "building", house: "building", greenhouse: "building",
  conservatory: "building", shed: "building", gazebo: "building", roofprint: "building",
  "garden-area": "garden-area", "garden-section": "garden-area", "garden-landmark": "garden-area",
  garden: "garden-area", arboretum: "garden-area", meadow: "garden-area", "rock-garden": "garden-area",
  "planted-border": "garden-area", border: "garden-area", amphitheater: "garden-area",
  plot: "plot", "garden-plot": "plot", subplot: "subplot", "sub-plot": "subplot",
  bed: "bed", "garden-bed": "bed", "raised-bed": "bed", "in-ground-bed": "bed",
  tree: "tree", "specimen-tree": "tree", "tree-observation": "tree",
  vegetation: "vegetation", canopy: "vegetation", forest: "vegetation", shrub: "vegetation",
  woodland: "vegetation", hedge: "barrier", "land-cover": "vegetation",
  utility: "utility", pole: "utility", "utility-pole": "utility", hydrant: "utility",
  irrigation: "utility", drain: "utility", power: "utility", telephone: "utility",
  barrier: "barrier", fence: "barrier", wall: "barrier", gate: "barrier",
  water: "water", pond: "water", stream: "water", brook: "water", river: "water",
  wetland: "water", swale: "water", ditch: "water",
  plant: "plant", "plant-observation": "plant", placement: "plant", planting: "plant"
});

function normalizedToken(value) {
  if (value && typeof value === "object") {
    value = value.id ?? value.value ?? value.name ?? "";
  }
  return String(value ?? "").trim().toLowerCase().replace(/[_\s]+/g, "-");
}

/** Return the stable vocabulary record for a category id. */
export function gardenFeatureCategory(category) {
  return GARDEN_FEATURE_CATEGORIES[normalizedToken(category)] ?? GARDEN_FEATURE_CATEGORIES["other-site"];
}

/**
 * Derive an interchange category without rewriting the canonical properties.
 * An explicit interchange category wins, then the canonical layer, then the
 * most-specific semantic fields. Layer hints are used only as a safe fallback.
 */
export function classifyGardenFeature(feature = {}, layerHint = null) {
  const properties = feature.properties || {};
  const explicit = normalizedToken(
    properties.vf_category
    ?? properties.interchange?.category
    ?? properties.interchangeCategory
    ?? properties.category
  );
  if (GARDEN_FEATURE_CATEGORIES[explicit]) return explicit;

  const layer = normalizedToken(properties.vf_layer ?? properties.layer ?? layerHint);
  if (layer === "parcels") return "parcel";
  if (layer === "beds") return "bed";
  if (layer === "plants") return "plant";

  const candidates = [
    properties.kind,
    properties.classification,
    properties.featureType,
    properties.objectType,
    properties.collection,
    properties.type
  ].map(normalizedToken).filter(Boolean);
  for (const candidate of candidates) {
    if (EXACT_ALIASES[candidate]) return EXACT_ALIASES[candidate];
    if (candidate.includes("subplot") || candidate.includes("sub-plot")) return "subplot";
    if (candidate.includes("plot")) return "plot";
    if (candidate.includes("bed")) return "bed";
    if (candidate.includes("tree")) return "tree";
    if (candidate.includes("building") || candidate.includes("greenhouse")) return "building";
    if (candidate.includes("garden") || candidate.includes("meadow") || candidate.includes("border")) return "garden-area";
    if (candidate.includes("road") || candidate.includes("drive")) return "road";
    if (candidate.includes("path") || candidate.includes("trail") || candidate.includes("walk")) return "path";
    if (candidate.includes("fence") || candidate.includes("barrier") || candidate.includes("wall")) return "barrier";
    if (candidate.includes("water") || candidate.includes("pond") || candidate.includes("stream")) return "water";
    if (candidate.includes("utility") || candidate.includes("pole")) return "utility";
    if (candidate.includes("plant")) return "plant";
    if (candidate.includes("vegetation") || candidate.includes("forest") || candidate.includes("canopy")) return "vegetation";
  }
  return "other-site";
}

/** Resolve the canonical layer implied by a classified feature. */
export function gardenFeatureLayer(feature = {}, layerHint = null) {
  return gardenFeatureCategory(classifyGardenFeature(feature, layerHint)).layer;
}

export function isGeometryAllowedForCategory(category, geometryType) {
  return gardenFeatureCategory(category).geometries.includes(geometryType);
}


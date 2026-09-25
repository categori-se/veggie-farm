import {GARDEN_ITEMS, SOURCE_ITEMS} from "./api/v1/generated/collections.js";

export const BERKSHIRE_GARDEN_FEATURES = Object.freeze(
  GARDEN_ITEMS.features.map((feature) => Object.freeze(feature))
);

export const GARDEN_REFERENCE_SOURCES = Object.freeze(
  SOURCE_ITEMS.features
    .filter((feature) => String(feature.id).startsWith("source:"))
    .map((feature) => Object.freeze({id: feature.id, ...feature.properties}))
);

// The planner consumes a compact view of the canonical GeoJSON collection. Keep
// geometry and mapping provenance attached so a saved browser workspace can be
// upgraded without replacing the user's beds, plantings, or named versions.
export const BERKSHIRE_GARDEN_REFERENCES = Object.freeze(
  BERKSHIRE_GARDEN_FEATURES.map((feature) => Object.freeze({
    id: feature.id,
    ...feature.properties,
    acreage: feature.properties.parcelAcreage ?? feature.properties.campusAcreage ?? null,
    status: feature.properties.mapping?.parcelStatus === "matched" ? "mapped" : "concept",
    bbox: feature.bbox,
    geometry: feature.geometry
  }))
);

export function gardenReferenceById(id) {
  return BERKSHIRE_GARDEN_REFERENCES.find((garden) => garden.id === id) || null;
}

export function gardenFeatureById(id) {
  return BERKSHIRE_GARDEN_FEATURES.find((feature) => feature.id === id) || null;
}

export function gardenReferenceSourceById(id) {
  return GARDEN_REFERENCE_SOURCES.find((source) => source.id === id) || null;
}

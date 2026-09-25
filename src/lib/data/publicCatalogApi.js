import {
  CATALOG,
  COLLECTIONS,
  FLOWER_ITEMS as FLOWERS,
  GARDEN_BED_ITEMS as GARDEN_BEDS,
  GARDEN_ITEMS as GARDENS,
  GARDEN_PARCEL_ITEMS as GARDEN_PARCELS,
  GARDEN_PLANT_ITEMS as GARDEN_PLANTS,
  GARDEN_SITE_ITEMS as GARDEN_SITE,
  MODEL_ITEMS as MODELS,
  SOURCE_ITEMS as SOURCES
} from "../../data/api/v1/generated/collections.js";

const collectionItems = Object.freeze({
  flowers: FLOWERS,
  gardens: GARDENS,
  "garden-parcels": GARDEN_PARCELS,
  "garden-site": GARDEN_SITE,
  "garden-beds": GARDEN_BEDS,
  "garden-plants": GARDEN_PLANTS,
  models: MODELS,
  sources: SOURCES
});

export const CANONICAL_GARDEN_COLLECTION_IDS = Object.freeze({
  parcels: "garden-parcels",
  site: "garden-site",
  beds: "garden-beds",
  plants: "garden-plants"
});

const CRS84_URI = "http://www.opengis.net/def/crs/OGC/1.3/CRS84";

function clone(value) {
  return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function list(value) {
  if (Array.isArray(value)) return value.map(String);
  return String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
}

function bbox(value) {
  const values = (Array.isArray(value) ? value : String(value || "").split(",")).map(Number);
  if (values.length !== 4 || values.some((number) => !Number.isFinite(number))) return null;
  const [minLon, minLat, maxLon, maxLat] = values;
  return minLon <= maxLon && minLat <= maxLat ? values : null;
}

function coordinateBounds(geometry) {
  if (!geometry?.coordinates) return null;
  const points = [];
  const visit = (coordinates) => {
    if (typeof coordinates?.[0] === "number" && typeof coordinates?.[1] === "number") {
      points.push(coordinates);
      return;
    }
    for (const child of coordinates || []) visit(child);
  };
  visit(geometry.coordinates);
  if (!points.length) return null;
  return points.reduce((bounds, [lon, lat]) => [
    Math.min(bounds[0], lon),
    Math.min(bounds[1], lat),
    Math.max(bounds[2], lon),
    Math.max(bounds[3], lat)
  ], [Infinity, Infinity, -Infinity, -Infinity]);
}

function featureCollectionBounds(features) {
  const bounds = features.map((feature) => feature.bbox || coordinateBounds(feature.geometry)).filter(Boolean);
  if (!bounds.length) return null;
  return bounds.reduce((result, candidate) => [
    Math.min(result[0], candidate[0]),
    Math.min(result[1], candidate[1]),
    Math.max(result[2], candidate[2]),
    Math.max(result[3], candidate[3])
  ], [Infinity, Infinity, -Infinity, -Infinity]);
}

function intersects(feature, requested) {
  if (!requested) return true;
  const candidate = feature.bbox || coordinateBounds(feature.geometry);
  return Boolean(candidate)
    && candidate[0] <= requested[2]
    && candidate[2] >= requested[0]
    && candidate[1] <= requested[3]
    && candidate[3] >= requested[1];
}

function propertyValue(properties, path) {
  return String(path).split(".").reduce((value, key) => value?.[key], properties);
}

function matchesProperties(feature, filters = {}) {
  return Object.entries(filters || {}).every(([key, expected]) => {
    const actual = propertyValue(feature.properties, key);
    if (Array.isArray(actual)) return actual.some((value) => String(value) === String(expected));
    return String(actual) === String(expected);
  });
}

export function getPublicCatalog() {
  return clone(CATALOG);
}

export function listCollections() {
  return clone(COLLECTIONS.collections);
}

export function getCollection(collectionId) {
  const metadata = COLLECTIONS.collections.find((collection) => collection.id === collectionId);
  return metadata ? clone(metadata) : null;
}

export function getCatalogItem(collectionId, itemId) {
  const collection = collectionItems[collectionId];
  const feature = collection?.features.find((item) => item.id === itemId);
  return feature ? clone(feature) : null;
}

export function queryCatalog(collectionId, options = {}) {
  const collection = collectionItems[collectionId];
  if (!collection) throw new RangeError(`Unknown public data collection: ${collectionId}`);
  const requestedIds = new Set(list(options.ids));
  const requestedGardenIds = new Set(list(options.gardenId ?? options.gardenIds));
  const requestedBbox = bbox(options.bbox);
  const query = String(options.q || "").trim().toLocaleLowerCase();
  const offset = Math.max(0, Math.trunc(Number(options.offset) || 0));
  const limit = Math.min(500, Math.max(1, Math.trunc(Number(options.limit) || 100)));
  const matches = collection.features.filter((feature) => {
    if (requestedIds.size && !requestedIds.has(String(feature.id))) return false;
    if (requestedGardenIds.size && !requestedGardenIds.has(String(feature.properties?.gardenId))) return false;
    if (!intersects(feature, requestedBbox)) return false;
    if (!matchesProperties(feature, options.property)) return false;
    return !query || `${feature.id} ${JSON.stringify(feature.properties)}`.toLocaleLowerCase().includes(query);
  });
  const features = matches.slice(offset, offset + limit);
  const response = {
    type: "FeatureCollection",
    timeStamp: collection.timeStamp,
    numberMatched: matches.length,
    numberReturned: features.length,
    features,
    links: [{
      rel: "self",
      type: "application/geo+json",
      href: `./data/api/v1/collections/${collectionId}/items.json`
    }]
  };
  const responseBbox = featureCollectionBounds(features);
  if (responseBbox) response.bbox = responseBbox;
  return clone(response);
}

function spatialFeatureSourceIds(feature) {
  const properties = feature.properties || {};
  return [
    properties.provenance?.sourceId,
    ...(properties.provenance?.sources || []).map((source) => typeof source === "string" ? source : source.id || source.sourceId),
    ...(properties.sourceReferences || []).map((source) => typeof source === "string" ? source : source.id || source.sourceId)
  ].filter(Boolean).map(String);
}

function completeGardenLayer(collectionId, gardenId) {
  const pageSize = 500;
  const first = queryCatalog(collectionId, {gardenId, limit: pageSize});
  const features = [...first.features];
  while (features.length < first.numberMatched) {
    features.push(...queryCatalog(collectionId, {
      gardenId,
      limit: pageSize,
      offset: features.length
    }).features);
  }
  const result = {...first, numberReturned: features.length, features};
  const resultBbox = featureCollectionBounds(features);
  if (resultBbox) result.bbox = resultBbox;
  return result;
}

/** Return the four canonical CRS84 layers in the planner's validated dataset shape. */
export function getGardenSpatialDataset(gardenId) {
  const id = String(gardenId || "").trim();
  if (!id) throw new TypeError("gardenId is required");
  const collections = Object.fromEntries(Object.entries(CANONICAL_GARDEN_COLLECTION_IDS).map(([layer, collectionId]) => {
    const result = completeGardenLayer(collectionId, id);
    return [layer, {
      ...result,
      id: `${id}:${layer}`,
      properties: {
        gardenId: id,
        layer,
        coordinateReferenceSystem: CRS84_URI,
        generatedFrom: collectionId
      }
    }];
  }));
  if (!collections.parcels.features.length) throw new RangeError(`No canonical spatial dataset for garden: ${id}`);
  const sourceIds = [...new Set(Object.values(collections).flatMap((items) => (
    items.features.flatMap(spatialFeatureSourceIds)
  )))].sort();
  const sources = sourceIds.map((sourceId) => {
    const source = getCatalogItem("sources", sourceId)?.properties;
    return source
      ? {id: sourceId, title: source.title, url: source.url, rights: source.rights || null}
      : {id: sourceId, title: sourceId, publicationStatus: "evidence record not published in the public source catalog"};
  });
  return clone({
    type: "GardenSpatialDataset",
    schemaVersion: "1.0.0",
    gardenId: id,
    coordinateReferenceSystem: CRS84_URI,
    sources,
    collections
  });
}

export function parseCatalogQuery(searchParams) {
  const params = searchParams instanceof URLSearchParams ? searchParams : new URLSearchParams(searchParams);
  const property = {};
  for (const [key, value] of params) {
    if (key.startsWith("prop.")) property[key.slice(5)] = value;
  }
  return {
    bbox: params.get("bbox") || undefined,
    ids: params.get("ids") || undefined,
    gardenId: params.get("gardenId") || undefined,
    q: params.get("q") || undefined,
    limit: params.get("limit") || undefined,
    offset: params.get("offset") || undefined,
    property
  };
}

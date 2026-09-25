import registry from "../../data/public-gis-sources.json" with {type: "json"};
import {fetchSpatialAsset, isInsideMassachusettsEnvelope} from "./maSpatialCache.js";

export const PUBLIC_GIS_CACHE_VERSION = `public-gis-${registry.schemaVersion}`;
export const PUBLIC_GIS_SOURCES = Object.freeze(registry.sources.map((source) => Object.freeze(source)));

const SOURCE_BY_ID = new Map(PUBLIC_GIS_SOURCES.map((source) => [source.id, source]));
const DEFAULT_MAX_BBOX_SPAN = 0.05;
const DEFAULT_MAX_BBOX_AREA = 0.0005;

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

/**
 * Validate a small WGS 84/CRS84 envelope before it reaches a public service.
 * The limit is deliberately parcel/neighborhood sized: a statewide archive or a
 * stitched series of broad requests belongs in an explicit ETL job, not this adapter.
 */
export function normalizePublicGisBbox(value, options = {}) {
  const bbox = Array.isArray(value) ? value.map(finite) : [];
  if (bbox.length !== 4 || bbox.some((coordinate) => coordinate === null)) {
    throw new TypeError("bbox must be [west, south, east, north] in CRS84 longitude/latitude.");
  }
  const [west, south, east, north] = bbox;
  if (!(west < east && south < north)) throw new RangeError("bbox west/south must be less than east/north.");
  if (!isInsideMassachusettsEnvelope(west, south) || !isInsideMassachusettsEnvelope(east, north)) {
    throw new RangeError("bbox must remain inside the Massachusetts delivery envelope.");
  }
  const width = east - west;
  const height = north - south;
  const maxSpan = finite(options.maxSpan) ?? DEFAULT_MAX_BBOX_SPAN;
  const maxArea = finite(options.maxArea) ?? DEFAULT_MAX_BBOX_AREA;
  if (width > maxSpan || height > maxSpan || width * height > maxArea) {
    throw new RangeError("bbox exceeds the bounded parcel-context query budget.");
  }
  return bbox;
}

export function publicGisSource(sourceId) {
  const source = SOURCE_BY_ID.get(String(sourceId));
  if (!source) throw new RangeError(`Unknown public GIS source: ${sourceId}`);
  return source;
}

function arcgisRequest(source, bbox, page = 0) {
  const url = new URL(`${source.endpoint}/query`);
  const pageSize = Math.max(1, Number(source.query?.pageSize) || 2000);
  url.searchParams.set("f", "geojson");
  url.searchParams.set("where", "1=1");
  url.searchParams.set("geometry", bbox.join(","));
  url.searchParams.set("geometryType", "esriGeometryEnvelope");
  url.searchParams.set("inSR", "4326");
  url.searchParams.set("spatialRel", "esriSpatialRelIntersects");
  url.searchParams.set("outFields", (source.query?.outFields || []).join(","));
  if (source.query?.idField) url.searchParams.set("orderByFields", source.query.idField);
  url.searchParams.set("returnGeometry", "true");
  url.searchParams.set("outSR", "4326");
  url.searchParams.set("resultOffset", String(page * pageSize));
  url.searchParams.set("resultRecordCount", String(pageSize));
  return {url: url.toString(), pageSize};
}

function overpassQuery(source, bbox) {
  const [west, south, east, north] = bbox;
  const overpassBbox = `${south},${west},${north},${east}`;
  const selectors = (source.query?.selectors || []).map((selector) => `${selector}(${overpassBbox});`).join("");
  return `[out:json][timeout:${Number(source.query?.timeoutSeconds) || 25}];(${selectors});out tags center geom qt;`;
}

function overpassRequest(source, bbox) {
  const url = new URL(source.endpoint);
  url.searchParams.set("data", overpassQuery(source, bbox));
  return {url: url.toString(), pageSize: null};
}

export function buildPublicGisRequest(sourceId, bboxValue, options = {}) {
  const source = publicGisSource(sourceId);
  const bbox = normalizePublicGisBbox(bboxValue, options);
  if (source.kind === "arcgis-feature-service") return {...arcgisRequest(source, bbox, options.page || 0), source, bbox};
  if (source.kind === "overpass-ql") return {...overpassRequest(source, bbox), source, bbox};
  throw new TypeError(`${source.id} is a ${source.kind} visual source, not a FeatureCollection endpoint.`);
}

function samePosition(a, b) {
  return Array.isArray(a) && Array.isArray(b) && a[0] === b[0] && a[1] === b[1];
}

function positions(geometry = []) {
  return geometry
    .map((point) => [finite(point?.lon), finite(point?.lat)])
    .filter((point) => point[0] !== null && point[1] !== null);
}

function isAreaWay(element, coordinates) {
  const tags = element.tags || {};
  if (tags.area === "no" || !samePosition(coordinates[0], coordinates.at(-1))) return false;
  if (tags.area === "yes") return true;
  return Boolean(tags.building || tags.landuse || tags.leisure || tags.amenity === "parking"
    || ["wood", "water", "scrub", "wetland"].includes(tags.natural));
}

function ringContainsPoint(ring, point) {
  let inside = false;
  for (let current = 0, previous = ring.length - 1; current < ring.length; previous = current++) {
    const [xi, yi] = ring[current];
    const [xj, yj] = ring[previous];
    if ((yi > point[1]) !== (yj > point[1])
      && point[0] < (xj - xi) * (point[1] - yi) / ((yj - yi) || Number.EPSILON) + xi) inside = !inside;
  }
  return inside;
}

function stitchedRings(memberGeometries) {
  const fragments = memberGeometries.map(positions).filter((line) => line.length > 1);
  const rings = [];
  while (fragments.length) {
    let line = fragments.shift();
    let joined = true;
    while (!samePosition(line[0], line.at(-1)) && joined) {
      joined = false;
      for (let index = 0; index < fragments.length; index += 1) {
        let candidate = fragments[index];
        if (samePosition(line.at(-1), candidate[0])) {
          line = [...line, ...candidate.slice(1)];
        } else if (samePosition(line.at(-1), candidate.at(-1))) {
          candidate = [...candidate].reverse();
          line = [...line, ...candidate.slice(1)];
        } else if (samePosition(line[0], candidate.at(-1))) {
          line = [...candidate.slice(0, -1), ...line];
        } else if (samePosition(line[0], candidate[0])) {
          candidate = [...candidate].reverse();
          line = [...candidate.slice(0, -1), ...line];
        } else {
          continue;
        }
        fragments.splice(index, 1);
        joined = true;
        break;
      }
    }
    if (line.length >= 4 && samePosition(line[0], line.at(-1))) rings.push(line);
  }
  return rings;
}

function relationGeometry(element) {
  if (element.tags?.type !== "multipolygon" || !Array.isArray(element.members)) return null;
  const outers = stitchedRings(element.members.filter((member) => member.role === "outer").map((member) => member.geometry));
  const inners = stitchedRings(element.members.filter((member) => member.role === "inner").map((member) => member.geometry));
  if (!outers.length) return null;
  const polygons = outers.map((outer) => [outer]);
  for (const inner of inners) {
    const outerIndex = outers.findIndex((outer) => ringContainsPoint(outer, inner[0]));
    if (outerIndex >= 0) polygons[outerIndex].push(inner);
  }
  return polygons.length === 1
    ? {type: "Polygon", coordinates: polygons[0]}
    : {type: "MultiPolygon", coordinates: polygons};
}

function overpassElementGeometry(element) {
  if (element.type === "node" && finite(element.lon) !== null && finite(element.lat) !== null) {
    return {type: "Point", coordinates: [Number(element.lon), Number(element.lat)]};
  }
  if (element.type === "way") {
    const coordinates = positions(element.geometry);
    if (coordinates.length < 2) return null;
    return isAreaWay(element, coordinates)
      ? {type: "Polygon", coordinates: [coordinates]}
      : {type: "LineString", coordinates};
  }
  return relationGeometry(element);
}

export function overpassJsonToFeatureCollection(payload, sourceId = "osm-overpass-site-context") {
  const source = publicGisSource(sourceId);
  if (source.kind !== "overpass-ql") throw new TypeError(`${sourceId} is not an Overpass source.`);
  const features = [];
  let droppedGeometryCount = 0;
  for (const element of Array.isArray(payload?.elements) ? payload.elements : []) {
    const geometry = overpassElementGeometry(element);
    if (!geometry) {
      droppedGeometryCount += 1;
      continue;
    }
    features.push({
      type: "Feature",
      id: `osm:${element.type}:${element.id}`,
      geometry,
      properties: {
        ...(element.tags || {}),
        sourceId: source.id,
        sourceFeatureId: `${element.type}/${element.id}`,
        sourceTimestamp: payload?.osm3s?.timestamp_osm_base || null
      }
    });
  }
  return {
    type: "FeatureCollection",
    properties: {
      sourceId: source.id,
      attribution: source.rights.attribution,
      license: source.rights.license,
      licenseUrl: source.rights.licenseUrl,
      sourceTimestamp: payload?.osm3s?.timestamp_osm_base || null,
      droppedGeometryCount
    },
    features
  };
}

function sanitizedArcgisCollection(payload, source) {
  if (payload?.error) throw new Error(payload.error.message || `ArcGIS query failed for ${source.id}.`);
  if (payload?.type !== "FeatureCollection" || !Array.isArray(payload.features)) {
    throw new TypeError(`${source.id} did not return a GeoJSON FeatureCollection.`);
  }
  const allowed = new Set(source.query?.outFields || []);
  const idField = source.query?.idField;
  return payload.features.map((feature, index) => {
    const sourceProperties = feature?.properties || {};
    const properties = Object.fromEntries(Object.entries(sourceProperties).filter(([key]) => allowed.has(key)));
    const identifier = properties[idField] ?? feature.id ?? index;
    return {
      type: "Feature",
      id: `${source.id}:${identifier}`,
      geometry: feature.geometry ?? null,
      properties: {...properties, sourceId: source.id, sourceFeatureId: String(identifier)}
    };
  });
}

function sourceCollection(source, bbox, features, properties = {}) {
  return {
    type: "FeatureCollection",
    bbox: [...bbox],
    properties: {
      schemaVersion: registry.schemaVersion,
      coordinateReferenceSystem: registry.coordinateReferenceSystem,
      sourceId: source.id,
      sourceName: source.name,
      sourceEndpoint: source.endpoint,
      attribution: source.rights.attribution,
      license: source.rights.license,
      licenseUrl: source.rights.licenseUrl,
      queryBbox: [...bbox],
      parcelClipped: false,
      ...properties
    },
    features
  };
}

async function responseJson(response, sourceId) {
  if (!response?.ok) throw new Error(`${sourceId} request failed with HTTP ${response?.status ?? "unknown"}.`);
  return response.json();
}

/**
 * Fetch a bounded provider extract and normalize it to a source-specific RFC
 * 7946 FeatureCollection. This is intended for an explicit import/build step.
 * The shipped application should read the saved snapshot instead of making a
 * public Overpass service its live backend.
 */
export async function fetchPublicGisFeatureCollection(sourceId, bboxValue, options = {}) {
  const first = buildPublicGisRequest(sourceId, bboxValue, options);
  const {source, bbox} = first;
  const fetchOptions = {
    mode: "cors",
    credentials: "omit",
    headers: {accept: source.kind === "overpass-ql" ? "application/json" : "application/geo+json"}
  };
  if (options.userAgent) fetchOptions.headers["user-agent"] = String(options.userAgent);
  const shared = {
    fetchImpl: options.fetchImpl,
    cacheStorage: options.cacheStorage,
    cacheName: options.cacheName || PUBLIC_GIS_CACHE_VERSION,
    version: options.version || PUBLIC_GIS_CACHE_VERSION,
    fetchOptions
  };

  if (source.kind === "overpass-ql") {
    const response = await fetchSpatialAsset(first.url, shared);
    const payload = await responseJson(response, source.id);
    const normalized = overpassJsonToFeatureCollection(payload, source.id);
    return sourceCollection(source, bbox, normalized.features, {
      sourceTimestamp: normalized.properties.sourceTimestamp,
      droppedGeometryCount: normalized.properties.droppedGeometryCount,
      retrievedAt: response.headers?.get?.("date") || null
    });
  }

  const features = [];
  const seen = new Set();
  const maxPages = Math.max(1, Number(source.query?.maxPages) || 1);
  let retrievedAt = null;
  let complete = false;
  let pages = 0;
  for (let page = 0; page < maxPages; page += 1) {
    const request = buildPublicGisRequest(source.id, bbox, {...options, page});
    const response = await fetchSpatialAsset(request.url, shared);
    retrievedAt ||= response.headers?.get?.("date") || null;
    const payload = await responseJson(response, source.id);
    const batch = sanitizedArcgisCollection(payload, source);
    for (const feature of batch) {
      if (!seen.has(feature.id)) {
        seen.add(feature.id);
        features.push(feature);
      }
    }
    pages += 1;
    if (batch.length < request.pageSize) {
      complete = true;
      break;
    }
  }
  if (!complete) throw new RangeError(`${source.id} exceeded its ${maxPages}-page bounded query budget.`);
  return sourceCollection(source, bbox, features, {retrievedAt, pages});
}

export function publicGisRegistry() {
  return structuredClone(registry);
}

import {kmlToFeatureCollection} from "./kmlToGeoJson.js";
import {CRS84_URI} from "./gardenSpatial.js";
import {
  GARDEN_FEATURE_CATEGORIES,
  classifyGardenFeature,
  gardenFeatureCategory,
  isGeometryAllowedForCategory
} from "./gardenFeatureVocabulary.js";

export const SPATIAL_INTERCHANGE_VERSION = "1.0.0";
export const SPATIAL_INTERCHANGE_CRS = CRS84_URI;

function clone(value) {
  if (value === undefined) return undefined;
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function featureId(feature, fallback) {
  return String(feature?.id ?? feature?.properties?.id ?? feature?.properties?.featureId ?? fallback).trim();
}

function normalizedLayer(value) {
  const layer = String(value ?? "").trim().toLowerCase();
  return ["parcels", "site", "beds", "plants"].includes(layer) ? layer : null;
}

function collectInputFeatures(input, context = {}, result = []) {
  if (!input) return result;
  if (Array.isArray(input)) {
    input.forEach((item) => collectInputFeatures(item, context, result));
    return result;
  }
  if (input.type === "Feature") {
    result.push({feature: input, ...context});
    return result;
  }
  if (input.type === "FeatureCollection") {
    const layer = normalizedLayer(input.properties?.layer) ?? context.layer ?? null;
    const gardenId = input.properties?.gardenId ?? context.gardenId ?? null;
    (input.features || []).forEach((feature) => result.push({feature, layer, gardenId}));
    return result;
  }
  if (input.type === "GardenSpatialDataset" || input.collections) {
    const gardenId = input.gardenId ?? input.id ?? context.gardenId ?? null;
    for (const layer of ["parcels", "site", "beds", "plants"]) {
      if (input.collections?.[layer]) collectInputFeatures(input.collections[layer], {gardenId, layer}, result);
    }
    return result;
  }
  if (Array.isArray(input.datasets)) {
    input.datasets.forEach((dataset) => collectInputFeatures(dataset, context, result));
    return result;
  }
  if (Array.isArray(input.gardens)) {
    input.gardens.forEach((garden) => collectInputFeatures(garden, context, result));
  }
  return result;
}

function allPositions(geometry, result = []) {
  if (!geometry) return result;
  if (geometry.type === "GeometryCollection") {
    (geometry.geometries || []).forEach((part) => allPositions(part, result));
    return result;
  }
  const visit = (coordinates) => {
    if (!Array.isArray(coordinates)) return;
    if (coordinates.length >= 2 && Number.isFinite(coordinates[0]) && Number.isFinite(coordinates[1])) {
      result.push(coordinates);
    } else coordinates.forEach(visit);
  };
  visit(geometry.coordinates);
  return result;
}

function allCoordinateCandidates(geometry, result = []) {
  if (!geometry) return result;
  if (geometry.type === "GeometryCollection") {
    (geometry.geometries || []).forEach((part) => allCoordinateCandidates(part, result));
    return result;
  }
  const visit = (coordinates) => {
    if (!Array.isArray(coordinates)) return;
    if (coordinates.length >= 2 && !Array.isArray(coordinates[0]) && !Array.isArray(coordinates[1])) {
      result.push(coordinates);
    } else coordinates.forEach(visit);
  };
  visit(geometry.coordinates);
  return result;
}

function featureCollectionBbox(features) {
  const positions = features.flatMap((feature) => allPositions(feature.geometry));
  if (!positions.length) return undefined;
  return [
    Math.min(...positions.map((point) => point[0])),
    Math.min(...positions.map((point) => point[1])),
    Math.max(...positions.map((point) => point[0])),
    Math.max(...positions.map((point) => point[1]))
  ];
}

function flatStyleFields(category) {
  const value = gardenFeatureCategory(category);
  return {
    vf_style_id: `vf-${value.id}`,
    vf_category_label: value.label,
    vf_stroke: value.style.stroke,
    vf_fill: value.style.fill,
    vf_stroke_width: value.style.strokeWidth,
    vf_stroke_opacity: value.style.strokeOpacity,
    vf_fill_opacity: value.style.fillOpacity,
    vf_point_color: value.style.pointColor,
    vf_point_scale: value.style.pointScale,
    vf_line_dash: value.style.lineDash ? value.style.lineDash.join(" ") : null
  };
}

function normalizedExportFeature(entry, index) {
  const feature = clone(entry.feature);
  const category = classifyGardenFeature(feature, entry.layer);
  const definition = gardenFeatureCategory(category);
  const sourceProperties = feature.properties || {};
  const derived = sourceProperties.derived === true || sourceProperties.vf_derived === true;
  const canonical = sourceProperties.vf_canonical !== false
    && sourceProperties.canonical !== false
    && !derived;
  const id = featureId(feature, `garden-feature-${String(index + 1).padStart(4, "0")}`);
  return {
    ...feature,
    id,
    properties: {
      ...sourceProperties,
      ...(entry.gardenId && !sourceProperties.gardenId ? {gardenId: entry.gardenId} : {}),
      vf_schema: SPATIAL_INTERCHANGE_VERSION,
      vf_category: category,
      vf_layer: definition.layer,
      vf_canonical: canonical,
      vf_derived: derived,
      ...flatStyleFields(category)
    }
  };
}

/**
 * Flatten a canonical GardenSpatialDataset (or ordinary FeatureCollection) to
 * one RFC 7946 collection. Flat `vf_*` fields are deliberately QGIS-friendly;
 * all original properties, including provenance, remain untouched.
 */
export function gardenToInterchangeFeatureCollection(input, options = {}) {
  const entries = collectInputFeatures(input);
  const features = entries.map(normalizedExportFeature);
  const gardenIds = [...new Set(features.map((feature) => feature.properties?.gardenId).filter(Boolean))];
  const collection = {
    type: "FeatureCollection",
    properties: {
      name: options.name ?? input?.properties?.name ?? input?.name ?? (gardenIds.length === 1 ? gardenIds[0] : "Garden spatial export"),
      schemaVersion: SPATIAL_INTERCHANGE_VERSION,
      coordinateReferenceSystem: SPATIAL_INTERCHANGE_CRS,
      interchangeProfile: "veggie.farm/garden-spatial-interchange",
      gardenIds,
      canonicalFeatureCount: features.filter((feature) => feature.properties.vf_canonical).length,
      note: "RFC 7946 longitude/latitude; vf_* fields provide stable categories and display hints."
    },
    features
  };
  const bbox = featureCollectionBbox(features);
  if (bbox) collection.bbox = bbox;
  return collection;
}

export function gardenToGeoJsonText(input, options = {}) {
  const spacing = options.pretty === false ? 0 : 2;
  return `${JSON.stringify(gardenToInterchangeFeatureCollection(input, options), null, spacing)}\n`;
}

function xmlEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function kmlColor(hex, opacity = 1) {
  const match = String(hex || "").match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
  if (!match) return "ffffffff";
  const alpha = Math.round(Math.max(0, Math.min(1, Number(opacity))) * 255).toString(16).padStart(2, "0");
  return `${alpha}${match[3]}${match[2]}${match[1]}`.toLowerCase();
}

function kmlStyle(id, category, overrides = {}) {
  const definition = gardenFeatureCategory(category);
  const value = {...definition.style, ...overrides};
  return `  <Style id="${xmlEscape(id)}">
    <IconStyle><color>${kmlColor(value.pointColor, 1)}</color><scale>${Number(value.pointScale)}</scale></IconStyle>
    <LineStyle><color>${kmlColor(value.stroke, value.strokeOpacity)}</color><width>${Number(value.strokeWidth)}</width></LineStyle>
    <PolyStyle><color>${kmlColor(value.fill, value.fillOpacity)}</color><fill>1</fill><outline>1</outline></PolyStyle>
  </Style>`;
}

function coordinateText(position) {
  return position.slice(0, 3).map((value) => Number(value)).join(",");
}

function lineCoordinates(coordinates) {
  return coordinates.map(coordinateText).join(" ");
}

function polygonKml(coordinates = []) {
  if (!coordinates.length) return "";
  const [outer, ...holes] = coordinates;
  const holeXml = holes.map((ring) => `<innerBoundaryIs><LinearRing><coordinates>${lineCoordinates(ring)}</coordinates></LinearRing></innerBoundaryIs>`).join("");
  return `<Polygon><tessellate>1</tessellate><outerBoundaryIs><LinearRing><coordinates>${lineCoordinates(outer)}</coordinates></LinearRing></outerBoundaryIs>${holeXml}</Polygon>`;
}

function geometryKml(geometry) {
  if (!geometry) return "";
  if (geometry.type === "Point") return `<Point><coordinates>${coordinateText(geometry.coordinates)}</coordinates></Point>`;
  if (geometry.type === "LineString") return `<LineString><tessellate>1</tessellate><coordinates>${lineCoordinates(geometry.coordinates)}</coordinates></LineString>`;
  if (geometry.type === "Polygon") return polygonKml(geometry.coordinates);
  if (geometry.type === "MultiPoint") {
    return `<MultiGeometry>${geometry.coordinates.map((point) => geometryKml({type: "Point", coordinates: point})).join("")}</MultiGeometry>`;
  }
  if (geometry.type === "MultiLineString") {
    return `<MultiGeometry>${geometry.coordinates.map((line) => geometryKml({type: "LineString", coordinates: line})).join("")}</MultiGeometry>`;
  }
  if (geometry.type === "MultiPolygon") {
    return `<MultiGeometry>${geometry.coordinates.map((polygon) => polygonKml(polygon)).join("")}</MultiGeometry>`;
  }
  if (geometry.type === "GeometryCollection") {
    return `<MultiGeometry>${(geometry.geometries || []).map(geometryKml).join("")}</MultiGeometry>`;
  }
  return "";
}

function extendedDataValue(properties, name) {
  if (name === "veggieFarm.properties") return JSON.stringify(properties);
  if (name === "veggieFarm.provenance") return JSON.stringify(properties.provenance ?? null);
  return null;
}

function extendedDataKml(feature) {
  const properties = feature.properties || {};
  const values = {
    "veggieFarm.schemaVersion": SPATIAL_INTERCHANGE_VERSION,
    "veggieFarm.id": feature.id,
    "veggieFarm.category": properties.vf_category,
    "veggieFarm.layer": properties.vf_layer,
    "veggieFarm.canonical": properties.vf_canonical ? "true" : "false",
    "veggieFarm.derived": properties.vf_derived ? "true" : "false",
    "veggieFarm.derivedFrom": properties.vf_derived_from ?? properties.derivedFrom ?? "",
    "veggieFarm.sourceId": properties.provenance?.sourceId ?? "",
    "veggieFarm.sourceFeatureId": properties.provenance?.sourceFeatureId ?? "",
    "veggieFarm.confidence": properties.confidence ?? properties.provenance?.confidence ?? "",
    "veggieFarm.surveyStatus": properties.surveyStatus ?? properties.provenance?.surveyStatus ?? "",
    "veggieFarm.provenance": extendedDataValue(properties, "veggieFarm.provenance"),
    "veggieFarm.properties": extendedDataValue(properties, "veggieFarm.properties")
  };
  return `<ExtendedData>${Object.entries(values).map(([name, value]) => (
    `<Data name="${xmlEscape(name)}"><value>${xmlEscape(value)}</value></Data>`
  )).join("")}</ExtendedData>`;
}

function xmlId(value) {
  const sanitized = String(value).replace(/[^A-Za-z0-9_.-]+/g, "-").replace(/^-+/, "");
  return /^[A-Za-z_]/.test(sanitized) ? sanitized : `f-${sanitized || "feature"}`;
}

function placemarkKml(feature, styleId = `vf-${feature.properties.vf_category}`) {
  const properties = feature.properties || {};
  const description = `${gardenFeatureCategory(properties.vf_category).label}${properties.vf_derived ? " · derived visualization (not canonical)" : ""}`;
  return `    <Placemark id="${xmlEscape(xmlId(feature.id))}">
      <name>${xmlEscape(properties.name ?? feature.id)}</name>
      <description>${xmlEscape(description)}</description>
      <styleUrl>#${xmlEscape(styleId)}</styleUrl>
      ${extendedDataKml(feature)}
      ${geometryKml(feature.geometry)}
    </Placemark>`;
}

function crownDiameterFeet(properties = {}) {
  const candidate = properties.crownDiameterFeet
    ?? properties.crownDiameterFt
    ?? properties.crown_diameter_ft
    ?? properties.canopyDiameterFeet
    ?? properties.canopy_diameter_ft;
  const value = Number(candidate);
  if (Number.isFinite(value) && value > 0) return value;
  const metres = Number(properties.crownDiameterMetres ?? properties.crownDiameterMeters ?? properties.crown_diameter_m);
  if (Number.isFinite(metres) && metres > 0) return metres / 0.3048;
  const radiusFeet = Number(properties.crownRadiusFeet ?? properties.crownRadiusFt);
  return Number.isFinite(radiusFeet) && radiusFeet > 0 ? radiusFeet * 2 : null;
}

function pointCircle(point, radiusMetres, segments = 48) {
  const [longitude, latitude] = point;
  const latitudeDegrees = radiusMetres / 111_320;
  const longitudeDegrees = radiusMetres / (111_320 * Math.max(0.01, Math.cos(latitude * Math.PI / 180)));
  const ring = [];
  for (let index = 0; index < segments; index += 1) {
    const angle = index / segments * Math.PI * 2;
    ring.push([
      longitude + Math.cos(angle) * longitudeDegrees,
      latitude + Math.sin(angle) * latitudeDegrees
    ]);
  }
  ring.push([...ring[0]]);
  return ring;
}

/**
 * Calculate display-only crown polygons from tree center points. These records
 * are always marked non-canonical and retain a pointer to the source point.
 */
export function derivedTreeCrownFeatures(input) {
  const collection = input?.type === "FeatureCollection"
    ? input
    : gardenToInterchangeFeatureCollection(input);
  const derived = [];
  for (const feature of collection.features || []) {
    if (feature.properties?.vf_category !== "tree" || feature.geometry?.type !== "Point") continue;
    const diameterFeet = crownDiameterFeet(feature.properties);
    if (!diameterFeet) continue;
    const id = `${feature.id}:derived-crown`;
    derived.push({
      type: "Feature",
      id,
      geometry: {type: "Polygon", coordinates: [pointCircle(feature.geometry.coordinates, diameterFeet * 0.3048 / 2)]},
      properties: {
        gardenId: feature.properties.gardenId ?? null,
        name: `${feature.properties.name ?? feature.id} · calculated crown`,
        crownDiameterFeet: diameterFeet,
        calculation: "local-tangent-circle-from-tree-center-and-crown-diameter-v1",
        vf_schema: SPATIAL_INTERCHANGE_VERSION,
        vf_category: "tree",
        vf_layer: "site",
        vf_style_id: "vf-tree-crown",
        vf_canonical: false,
        vf_derived: true,
        vf_derived_from: feature.id,
        derivedFrom: feature.id,
        provenance: {
          sourceFeatureId: feature.id,
          geometryMethod: "calculated from geographic tree center and crownDiameterFeet",
          surveyStatus: "derived visualization; not canonical geometry"
        },
        ...flatStyleFields("tree")
      }
    });
    derived.at(-1).properties.vf_style_id = "vf-tree-crown";
  }
  return derived;
}

/** Export styled KML 2.2 that Google Earth can open without a conversion step. */
export function gardenToKml(input, options = {}) {
  const collection = gardenToInterchangeFeatureCollection(input, options);
  const grouped = new Map();
  for (const feature of collection.features) {
    const category = feature.properties.vf_category;
    if (!grouped.has(category)) grouped.set(category, []);
    grouped.get(category).push(feature);
  }
  const crowns = options.includeDerivedTreeCrowns === false ? [] : derivedTreeCrownFeatures(collection);
  const styles = Object.values(GARDEN_FEATURE_CATEGORIES).map((category) => kmlStyle(`vf-${category.id}`, category.id));
  if (crowns.length) {
    styles.push(kmlStyle("vf-tree-crown", "tree", {fillOpacity: 0.18, strokeOpacity: 0.75, strokeWidth: 1.5}));
  }
  const folders = [...grouped.entries()].map(([category, features]) => `  <Folder>
    <name>${xmlEscape(gardenFeatureCategory(category).label)}</name>
${features.map((feature) => placemarkKml(feature)).join("\n")}
  </Folder>`);
  if (crowns.length) {
    folders.push(`  <Folder>
    <name>Derived visualization · tree crowns (not canonical)</name>
${crowns.map((feature) => placemarkKml(feature, "vf-tree-crown")).join("\n")}
  </Folder>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
  <name>${xmlEscape(options.name ?? collection.properties.name)}</name>
  <description>veggie.farm garden spatial interchange ${SPATIAL_INTERCHANGE_VERSION}. Derived visualization geometry is explicitly non-canonical.</description>
${styles.join("\n")}
${folders.join("\n")}
</Document>
</kml>
`;
}

function issue(severity, code, message, featureIdValue = null) {
  return {severity, code, message, ...(featureIdValue ? {featureId: featureIdValue} : {})};
}

function geometryIssues(geometry, id) {
  const issues = [];
  if (!geometry) return [issue("warning", "NULL_GEOMETRY", "Feature has no geometry and cannot be promoted spatially.", id)];
  const supported = new Set(["Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon", "GeometryCollection"]);
  if (!supported.has(geometry.type)) return [issue("error", "UNSUPPORTED_GEOMETRY", `Unsupported geometry type ${geometry.type || "(missing)"}.`, id)];
  const positions = allCoordinateCandidates(geometry);
  if (!positions.length) issues.push(issue("error", "EMPTY_GEOMETRY", "Geometry has no valid coordinate positions.", id));
  for (const position of positions) {
    if (!Number.isFinite(position[0]) || !Number.isFinite(position[1])) {
      issues.push(issue("error", "NON_FINITE_COORDINATE", "Coordinates must be finite numbers.", id));
      break;
    }
    if (position[0] < -180 || position[0] > 180 || position[1] < -90 || position[1] > 90) {
      issues.push(issue("error", "COORDINATE_OUT_OF_RANGE", "GeoJSON coordinates must use CRS84 longitude/latitude ranges.", id));
      break;
    }
  }
  if (geometry.type === "LineString" && (!Array.isArray(geometry.coordinates) || geometry.coordinates.length < 2)) {
    issues.push(issue("error", "INVALID_LINE", "LineString geometry needs at least two positions.", id));
  }
  if (geometry.type === "MultiLineString" && (!Array.isArray(geometry.coordinates)
    || !geometry.coordinates.length
    || geometry.coordinates.some((line) => !Array.isArray(line) || line.length < 2))) {
    issues.push(issue("error", "INVALID_LINE", "Every MultiLineString part needs at least two positions.", id));
  }
  const polygons = geometry.type === "Polygon"
    ? [geometry.coordinates]
    : geometry.type === "MultiPolygon" ? geometry.coordinates : [];
  for (const polygon of polygons) {
    for (const ring of polygon || []) {
      const first = ring?.[0];
      const last = ring?.at?.(-1);
      if (!first || ring.length < 4) issues.push(issue("error", "INVALID_RING", "Polygon rings need at least four positions.", id));
      else if (first[0] !== last[0] || first[1] !== last[1]) issues.push(issue("error", "OPEN_RING", "Polygon rings must be closed.", id));
    }
  }
  if (geometry.type === "GeometryCollection") {
    issues.push(issue("warning", "GEOMETRY_COLLECTION_REVIEW", "GeometryCollection requires manual category review before promotion.", id));
    for (const part of geometry.geometries || []) issues.push(...geometryIssues(part, id));
  }
  return issues;
}

function emptyStage(sourceFormat, errors = [], warnings = [], source = {}) {
  return {
    type: "GardenSpatialImportStage",
    schemaVersion: SPATIAL_INTERCHANGE_VERSION,
    reviewOnly: true,
    sourceFormat,
    source: clone(source),
    promotion: {eligible: false, reason: "Imports enter review staging; canonical promotion requires an explicit curation action."},
    summary: {featureCount: 0, errorCount: errors.length, warningCount: warnings.length, categories: {}},
    errors,
    warnings,
    collection: {
      type: "FeatureCollection",
      properties: {reviewOnly: true, sourceFormat, schemaVersion: SPATIAL_INTERCHANGE_VERSION},
      features: []
    }
  };
}

function parseGeoJsonInput(input) {
  if (typeof input !== "string") return input;
  return JSON.parse(input);
}

function declaredGeoJsonCrs(collection) {
  return collection?.properties?.coordinateReferenceSystem
    ?? collection?.properties?.spatialReference?.id
    ?? collection?.crs?.properties?.name
    ?? null;
}

function isCrs84Identifier(value) {
  if (!value) return true;
  const normalized = String(value).trim().toUpperCase();
  return normalized.includes("CRS84")
    || normalized === "EPSG:4326"
    || normalized.endsWith("/4326")
    || normalized.endsWith("::4326");
}

/**
 * Parse and validate GeoJSON into a review-only collection. Even an
 * app-produced export is never silently promoted back to the canonical core.
 */
export function stageGeoJsonImport(input, options = {}) {
  let parsed;
  try {
    parsed = parseGeoJsonInput(input);
  } catch (error) {
    return emptyStage("GeoJSON", [issue("error", "INVALID_JSON", error.message)], [], options.source);
  }
  if (parsed?.type !== "FeatureCollection") {
    return emptyStage("GeoJSON", [issue("error", "NOT_FEATURE_COLLECTION", "Import must be a GeoJSON FeatureCollection.")], [], options.source);
  }

  const errors = [];
  const warnings = [];
  const declaredCrs = declaredGeoJsonCrs(parsed);
  if (declaredCrs && !isCrs84Identifier(declaredCrs)) {
    errors.push(issue("error", "UNSUPPORTED_CRS", `Declared CRS ${declaredCrs} is not CRS84/WGS 84 longitude-latitude; reproject before import.`));
  }
  if (parsed.crs) {
    warnings.push(issue("warning", "LEGACY_CRS_MEMBER", "The deprecated GeoJSON crs member was read for validation but is not copied into staged RFC 7946 output."));
  }
  const seenIds = new Set();
  const features = (parsed.features || []).map((sourceFeature, index) => {
    if (sourceFeature?.type !== "Feature") {
      errors.push(issue("error", "NOT_FEATURE", `Collection member ${index + 1} is not a GeoJSON Feature.`));
      return null;
    }
    const originalId = featureId(sourceFeature, `review-import-${String(index + 1).padStart(4, "0")}`);
    let id = originalId;
    if (!sourceFeature.id && !sourceFeature.properties?.id && !sourceFeature.properties?.featureId) {
      warnings.push(issue("warning", "GENERATED_ID", `Generated review id ${id} for an unnamed feature.`, id));
    }
    if (seenIds.has(id)) {
      const replacement = `${id}~review-${index + 1}`;
      warnings.push(issue("warning", "DUPLICATE_ID", `Duplicate id ${id} was staged as ${replacement}.`, id));
      id = replacement;
    }
    seenIds.add(id);

    const rawProperties = clone(sourceFeature.properties || {});
    const explicitCategory = String(rawProperties.vf_category ?? rawProperties.interchange?.category ?? rawProperties.category ?? "")
      .trim().toLowerCase().replace(/[_\s]+/g, "-");
    const category = classifyGardenFeature(sourceFeature, rawProperties.layer ?? parsed.properties?.layer);
    const definition = gardenFeatureCategory(category);
    const sourceLayer = normalizedLayer(rawProperties.vf_layer ?? rawProperties.layer ?? parsed.properties?.layer);
    const featureIssues = geometryIssues(sourceFeature.geometry, id);
    if (explicitCategory && !GARDEN_FEATURE_CATEGORIES[explicitCategory]) {
      featureIssues.push(issue("warning", "UNKNOWN_CATEGORY", `Unknown category ${explicitCategory}; staged through layer/semantic fallback as ${category}.`, id));
    }
    if (sourceFeature.geometry && !isGeometryAllowedForCategory(category, sourceFeature.geometry.type)) {
      featureIssues.push(issue("warning", "CATEGORY_GEOMETRY_MISMATCH", `${sourceFeature.geometry.type} is not a normal ${category} geometry.`, id));
    }
    if (sourceLayer && sourceLayer !== definition.layer) {
      featureIssues.push(issue("warning", "CATEGORY_LAYER_MISMATCH", `Category ${category} belongs to ${definition.layer}, not ${sourceLayer}.`, id));
    }
    if (rawProperties.vf_derived === true || rawProperties.derived === true || rawProperties.vf_canonical === false) {
      featureIssues.push(issue("warning", "DERIVED_OR_NONCANONICAL", "Derived or non-canonical geometry remains review-only.", id));
    }
    errors.push(...featureIssues.filter((item) => item.severity === "error"));
    warnings.push(...featureIssues.filter((item) => item.severity === "warning"));
    const sourceCanonical = rawProperties.vf_canonical ?? rawProperties.canonical ?? null;
    return {
      ...clone(sourceFeature),
      id,
      properties: {
        ...rawProperties,
        ...(id !== originalId ? {vf_source_id: originalId} : {}),
        ...(sourceLayer && sourceLayer !== definition.layer ? {vf_source_layer: sourceLayer} : {}),
        vf_schema: SPATIAL_INTERCHANGE_VERSION,
        vf_category: category,
        vf_layer: definition.layer,
        vf_source_canonical: sourceCanonical,
        vf_canonical: false,
        vf_review_only: true,
        ...flatStyleFields(category),
        interchangeReview: {
          reviewOnly: true,
          issueCodes: featureIssues.map((item) => item.code),
          promotionRequired: true
        }
      }
    };
  }).filter(Boolean);

  const categories = {};
  for (const feature of features) categories[feature.properties.vf_category] = (categories[feature.properties.vf_category] || 0) + 1;
  const collection = {
    type: "FeatureCollection",
    properties: {
      ...(clone(parsed.properties || {})),
      schemaVersion: SPATIAL_INTERCHANGE_VERSION,
      coordinateReferenceSystem: SPATIAL_INTERCHANGE_CRS,
      reviewOnly: true,
      sourceFormat: "GeoJSON",
      promotionRequired: true
    },
    features
  };
  const bbox = featureCollectionBbox(features);
  if (bbox) collection.bbox = bbox;
  return {
    type: "GardenSpatialImportStage",
    schemaVersion: SPATIAL_INTERCHANGE_VERSION,
    reviewOnly: true,
    sourceFormat: "GeoJSON",
    source: clone(options.source || {}),
    promotion: {eligible: false, reason: "Imports enter review staging; canonical promotion requires an explicit curation action."},
    summary: {featureCount: features.length, errorCount: errors.length, warningCount: warnings.length, categories},
    errors,
    warnings,
    collection
  };
}

function extendedValue(extended, name) {
  return extended?.[name]?.value ?? null;
}

function booleanText(value) {
  return String(value).toLowerCase() === "true" || String(value) === "1";
}

/** Parse KML (including this app's ExtendedData) into review staging. */
export function stageKmlImport(kmlText, options = {}) {
  let parsed;
  try {
    parsed = kmlToFeatureCollection(kmlText, {
      id: options.source?.id ?? options.id ?? "kml-review-import",
      fileName: options.source?.fileName ?? options.fileName,
      title: options.source?.title ?? options.title
    });
  } catch (error) {
    return emptyStage("KML", [issue("error", "INVALID_KML", error.message)], [], options.source);
  }
  const recoveryWarnings = [];
  const features = parsed.features.map((feature) => {
    const extended = feature.properties?.source?.extendedData;
    let restoredProperties = null;
    const serialized = extendedValue(extended, "veggieFarm.properties");
    if (serialized) {
      try {
        restoredProperties = JSON.parse(serialized);
      } catch (error) {
        recoveryWarnings.push(issue("warning", "INVALID_EXTENDED_PROPERTIES", `Could not restore app properties: ${error.message}`, feature.id));
      }
    }
    const restoredId = extendedValue(extended, "veggieFarm.id") || feature.id;
    const explicitCategory = extendedValue(extended, "veggieFarm.category");
    const explicitLayer = extendedValue(extended, "veggieFarm.layer");
    const derived = booleanText(extendedValue(extended, "veggieFarm.derived"));
    const canonical = booleanText(extendedValue(extended, "veggieFarm.canonical"));
    const derivedFrom = extendedValue(extended, "veggieFarm.derivedFrom");
    return {
      ...feature,
      id: restoredId,
      properties: {
        ...feature.properties,
        ...(restoredProperties || {}),
        ...(explicitCategory ? {vf_category: explicitCategory} : {}),
        ...(explicitLayer ? {vf_layer: explicitLayer} : {}),
        ...(extendedValue(extended, "veggieFarm.canonical") !== null ? {vf_canonical: canonical} : {}),
        ...(extendedValue(extended, "veggieFarm.derived") !== null ? {vf_derived: derived} : {}),
        ...(derivedFrom ? {vf_derived_from: derivedFrom, derivedFrom} : {})
      }
    };
  });
  const staged = stageGeoJsonImport({
    type: "FeatureCollection",
    properties: {
      name: parsed.properties?.name,
      sourceFormat: "KML",
      source: parsed.properties?.source
    },
    features
  }, {source: options.source});
  staged.sourceFormat = "KML";
  staged.collection.properties.sourceFormat = "KML";
  staged.warnings.unshift(...recoveryWarnings);
  staged.summary.warningCount = staged.warnings.length;
  return staged;
}

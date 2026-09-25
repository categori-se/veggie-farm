import {CRS84_URI, lonLatToLocalPoint} from "./gardenSpatial.js";

export const GARDEN_SPATIAL_DATASET_VERSION = "1.0.0";
export const GARDEN_SPATIAL_LAYERS = Object.freeze(["parcels", "site", "beds", "plants"]);

const ALLOWED_GEOMETRIES = Object.freeze({
  parcels: new Set(["Polygon", "MultiPolygon"]),
  site: new Set(["Point", "LineString", "Polygon", "MultiLineString", "MultiPolygon"]),
  beds: new Set(["Polygon", "MultiPolygon"]),
  plants: new Set(["Point", "MultiPoint"])
});

function clone(value) {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function featureId(feature) {
  return String(feature?.id || feature?.properties?.id || "").trim();
}

function visitPositions(coordinates, callback) {
  if (!Array.isArray(coordinates)) return;
  if (coordinates.length >= 2 && Number.isFinite(coordinates[0]) && Number.isFinite(coordinates[1])) {
    callback(coordinates);
    return;
  }
  coordinates.forEach((child) => visitPositions(child, callback));
}

function geometryBounds(geometry) {
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];
  visitPositions(geometry?.coordinates, ([x, y]) => {
    bounds[0] = Math.min(bounds[0], x);
    bounds[1] = Math.min(bounds[1], y);
    bounds[2] = Math.max(bounds[2], x);
    bounds[3] = Math.max(bounds[3], y);
  });
  return bounds.every(Number.isFinite) ? bounds : null;
}

function localGeometry(geometry, property) {
  if (!geometry?.type || !Array.isArray(geometry.coordinates)) return null;
  const convert = (coordinates) => {
    if (coordinates.length >= 2 && Number.isFinite(coordinates[0]) && Number.isFinite(coordinates[1])) {
      return lonLatToLocalPoint(coordinates, property);
    }
    return coordinates.map(convert);
  };
  return {type: geometry.type, coordinates: convert(geometry.coordinates)};
}

function localBounds(geometry) {
  return geometryBounds(geometry) || [0, 0, 0, 0];
}

function geometryControl(geometry) {
  const [minX, minY, maxX, maxY] = localBounds(geometry);
  return {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY)
  };
}

function positiveNumber(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function sourceFields(feature) {
  const properties = feature.properties || {};
  const provenance = clone(properties.provenance || {});
  return {
    source: properties.source || provenance.sourceTitle || provenance.sourceId || null,
    sourceFeatureId: provenance.sourceFeatureId || properties.sourceFeatureId || null,
    sourceReferences: Array.isArray(properties.sourceReferences)
      ? clone(properties.sourceReferences)
      : provenance.sourceId
      ? [{id: provenance.sourceId, role: provenance.geometryMethod || "source geometry"}]
      : [],
    confidence: properties.confidence || provenance.confidence || "unknown",
    geometryBasis: properties.geometryBasis || provenance.geometryMethod || "source geometry",
    ...(properties.geometryEdit ? {geometryEdit: clone(properties.geometryEdit)} : {}),
    surveyStatus: properties.surveyStatus || provenance.surveyStatus || "not-surveyed",
    provenance,
    canonicalGeometry: clone(feature.geometry)
  };
}

function plannerSiteFeature(feature, property) {
  const properties = feature.properties || {};
  const geometry = localGeometry(feature.geometry, property);
  if (!geometry) return null;
  const control = geometryControl(geometry);
  const importedKind = properties.kind || properties.classification || "site-feature";
  const isTreePoint = geometry.type === "Point"
    && properties.collection === "vegetation"
    && ["tree", "specimen-tree"].includes(importedKind);
  const crownDiameterFeet = positiveNumber(properties.crownDiameterFeet);
  const crownWidthFeet = positiveNumber(properties.crownWidthFeet, crownDiameterFeet);
  const crownDepthFeet = positiveNumber(properties.crownDepthFeet, crownDiameterFeet);
  const displayControl = isTreePoint
    ? {
        ...control,
        width: positiveNumber(crownWidthFeet && crownWidthFeet * 12, positiveNumber(properties.widthInches, 180)),
        height: positiveNumber(crownDepthFeet && crownDepthFeet * 12, positiveNumber(properties.depthInches, 180))
      }
    : control;
  return {
    id: featureId(feature),
    name: properties.name || featureId(feature),
    type: importedKind,
    // Vegetation is normalized by a separate planner path. Preserve the
    // source's broad type without inventing a species: a KML point named
    // "tree" is evidence of a tree, not evidence of a red maple.
    ...(properties.collection === "vegetation"
      ? {
          kind: ["tree", "canopy", "forest", "shrub"].includes(importedKind) ? importedKind : "canopy",
          importedKind,
          plantId: properties.plantId || properties.taxonId || null,
          identificationStatus: properties.identificationStatus || "unidentified",
          taxonStatus: properties.taxonStatus || properties.identificationStatus || "unidentified",
          canopyClass: properties.canopyClass || "unknown",
          observationType: properties.observationType || (isTreePoint ? "mature-tree" : null),
          geometryRepresentation: properties.geometryRepresentation || (isTreePoint ? "point" : feature.geometry.type),
          crownWidthFeet,
          crownDepthFeet,
          crownDiameterFeet: crownDiameterFeet || (crownWidthFeet && crownDepthFeet ? Math.sqrt(crownWidthFeet * crownDepthFeet) : null),
          crownRadiusEastWestFeet: positiveNumber(properties.crownRadiusEastWestFeet, crownWidthFeet && crownWidthFeet / 2),
          crownRadiusNorthSouthFeet: positiveNumber(properties.crownRadiusNorthSouthFeet, crownDepthFeet && crownDepthFeet / 2),
          crownMeasurementMethod: properties.crownMeasurementMethod || null,
          crownConfidence: properties.crownConfidence || properties.confidence || properties.provenance?.confidence || "unknown",
          heightEstimateFeet: positiveNumber(properties.heightEstimateFeet),
          heightEstimateRangeFeet: Array.isArray(properties.heightEstimateRangeFeet)
            ? clone(properties.heightEstimateRangeFeet)
            : null,
          heightEstimateMethod: properties.heightEstimateMethod || null,
          heightConfidence: properties.heightConfidence || "unknown",
          sourcePixel: Array.isArray(properties.sourcePixel) ? clone(properties.sourcePixel) : null,
          absoluteLocalPoint: geometry.type === "Point" ? clone(geometry.coordinates) : null
        }
      : {}),
    collection: properties.collection || "infrastructure",
    editableLayer: "site",
    parcelId: properties.parcelId || null,
    parentId: properties.parentId || null,
    ...displayControl,
    rotation: Number(properties.rotationDegrees) || 0,
    localGeometry: geometry,
    ...sourceFields(feature),
    notes: properties.notes || null
  };
}

function isPlannerVegetationFeature(feature) {
  const properties = feature?.properties || {};
  if (properties.collection !== "vegetation") return false;
  // Land-cover polygons describe an area classification and remain contextual
  // site features. They are not individual tree objects and never acquire a
  // manufactured trunk point, crown diameter, or height estimate here.
  if (["land-cover", "forest-cover", "tree-canopy-cover"].includes(properties.kind)) return false;
  if (["land-cover", "context-area"].includes(properties.geometryRepresentation)) return false;
  return true;
}

function outerPolygonRing(geometry) {
  if (geometry?.type === "Polygon") return geometry.coordinates?.[0] || null;
  if (geometry?.type === "MultiPolygon") return geometry.coordinates?.[0]?.[0] || null;
  return null;
}

function plannerBedFeature(feature, property) {
  const properties = feature.properties || {};
  const geometry = localGeometry(feature.geometry, property);
  const polygon = outerPolygonRing(geometry);
  if (!polygon?.length) return null;
  const control = geometryControl({type: "Polygon", coordinates: [polygon]});
  return {
    id: featureId(feature),
    name: properties.name || featureId(feature),
    zone: properties.zone || properties.parentName || "Mapped bed",
    collection: "beds",
    editableLayer: "beds",
    parcelId: properties.parcelId || null,
    parentId: properties.parentId || null,
    sectionId: properties.sectionId || properties.parentId || null,
    subplotId: properties.subplotId || null,
    gridCellId: properties.gridCellId || null,
    centerControlId: properties.centerControlId || null,
    boundaryConfidence: properties.boundaryConfidence || null,
    identificationStatus: properties.identificationStatus || null,
    featureStatus: properties.featureStatus || properties.status || null,
    plantingAssignment: properties.plantingAssignment || null,
    cropTaxon: properties.cropTaxon || null,
    ...control,
    width: Number(properties.widthInches) || control.width,
    height: Number(properties.depthInches) || control.height,
    rotation: Number(properties.rotationDegrees) || 0,
    polygon,
    safeMargin: Number(properties.safeMarginInches) || 6,
    grid: Number(properties.gridInches) || 6,
    crowding: Number(properties.crowding) || 1,
    showSpacing: properties.showSpacing !== false,
    ...sourceFields(feature),
    notes: properties.notes || null
  };
}

function plannerPlantFeature(feature, property, bedById) {
  if (feature.geometry?.type !== "Point") return null;
  const properties = feature.properties || {};
  const point = lonLatToLocalPoint(feature.geometry.coordinates, property);
  const bedId = properties.bedId || null;
  const bed = bedById.get(bedId);
  // Existing planner placements are expressed from a bed's unrotated top-left.
  // Imported points retain their absolute GIS coordinate as well so a later bed
  // edit cannot erase the source observation.
  const x = bed ? point[0] - bed.x + bed.width / 2 : point[0];
  const y = bed ? point[1] - bed.y + bed.height / 2 : point[1];
  return {
    id: featureId(feature),
    name: properties.name || featureId(feature),
    kind: properties.kind || "plant-observation",
    plantId: properties.plantId || properties.taxonId || null,
    bedId,
    x,
    y,
    absoluteLocalPoint: point,
    canonicalGeometry: clone(feature.geometry),
    parcelId: properties.parcelId || null,
    identificationStatus: properties.identificationStatus || (properties.plantId || properties.taxonId ? "identified" : "unidentified"),
    confidence: properties.confidence || properties.provenance?.confidence || "unknown",
    provenance: clone(properties.provenance || {}),
    notes: properties.notes || null
  };
}

/**
 * Validate the project-owned spatial core. RFC 7946 longitude/latitude stays
 * canonical; the planner's local-inch objects are a derived editing view.
 */
export function validateGardenSpatialDataset(dataset = {}) {
  const errors = [];
  const gardenId = String(dataset.gardenId || dataset.id || "").trim();
  if (!gardenId) errors.push("dataset.gardenId is required");
  if (dataset.type !== "GardenSpatialDataset") errors.push("dataset.type must be GardenSpatialDataset");
  if (dataset.schemaVersion !== GARDEN_SPATIAL_DATASET_VERSION) {
    errors.push(`dataset.schemaVersion must be ${GARDEN_SPATIAL_DATASET_VERSION}`);
  }
  if (dataset.coordinateReferenceSystem !== CRS84_URI) {
    errors.push(`dataset.coordinateReferenceSystem must be ${CRS84_URI}`);
  }

  const sourceIds = new Set((dataset.sources || []).map((source) => String(source.id || "")));
  const ids = new Set();
  const featuresById = new Map();
  for (const layer of GARDEN_SPATIAL_LAYERS) {
    const collection = dataset.collections?.[layer];
    if (collection?.type !== "FeatureCollection") {
      errors.push(`collections.${layer} must be a FeatureCollection`);
      continue;
    }
    for (const feature of collection.features || []) {
      const id = featureId(feature);
      if (!id) errors.push(`${layer} feature is missing id`);
      else if (ids.has(id)) errors.push(`duplicate feature id ${id}`);
      else {
        ids.add(id);
        featuresById.set(id, {layer, feature});
      }
      if (feature.type !== "Feature") errors.push(`${layer}/${id || "?"} must be a Feature`);
      if (!ALLOWED_GEOMETRIES[layer].has(feature.geometry?.type)) {
        errors.push(`${layer}/${id || "?"} has unsupported ${feature.geometry?.type || "null"} geometry`);
      }
      visitPositions(feature.geometry?.coordinates, ([lon, lat]) => {
        if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
          errors.push(`${layer}/${id || "?"} has a coordinate outside CRS84 bounds`);
        }
      });
      if (feature.properties?.gardenId !== gardenId) {
        errors.push(`${layer}/${id || "?"} gardenId must be ${gardenId}`);
      }
      if (feature.properties?.layer && feature.properties.layer !== layer) {
        errors.push(`${layer}/${id || "?"} declares layer ${feature.properties.layer}`);
      }
      const sourceId = feature.properties?.provenance?.sourceId;
      if (sourceId && !sourceIds.has(sourceId)) errors.push(`${layer}/${id || "?"} references unknown source ${sourceId}`);
    }
  }

  for (const [id, {layer, feature}] of featuresById) {
    const parentId = feature.properties?.parentId;
    if (parentId && !featuresById.has(parentId)) errors.push(`${layer}/${id} references missing parent ${parentId}`);
    const parcelId = feature.properties?.parcelId;
    if (parcelId && featuresById.get(parcelId)?.layer !== "parcels") {
      errors.push(`${layer}/${id} references missing parcel ${parcelId}`);
    }
    const bedId = feature.properties?.bedId;
    if (bedId && featuresById.get(bedId)?.layer !== "beds") {
      errors.push(`${layer}/${id} references missing bed ${bedId}`);
    }
  }
  return errors;
}

export function assertGardenSpatialDataset(dataset = {}) {
  const errors = validateGardenSpatialDataset(dataset);
  if (errors.length) throw new TypeError(`Invalid garden spatial dataset:\n- ${errors.join("\n- ")}`);
  return dataset;
}

/** Convert canonical FeatureCollections into the planner's editable view. */
export function gardenSpatialDatasetToWorkspace(dataset, property) {
  assertGardenSpatialDataset(dataset);
  const beds = dataset.collections.beds.features
    .map((feature) => plannerBedFeature(feature, property))
    .filter(Boolean);
  const bedById = new Map(beds.map((bed) => [bed.id, bed]));
  const structures = dataset.collections.site.features
    .filter((feature) => !isPlannerVegetationFeature(feature))
    .map((feature) => plannerSiteFeature(feature, property))
    .filter(Boolean);
  const vegetation = dataset.collections.site.features
    .filter(isPlannerVegetationFeature)
    .map((feature) => plannerSiteFeature(feature, property))
    .filter(Boolean);
  const placements = dataset.collections.plants.features
    .map((feature) => plannerPlantFeature(feature, property, bedById))
    .filter(Boolean);
  return {beds, structures, vegetation, placements};
}

export function gardenSpatialDatasetFeatureCount(dataset = {}) {
  return Object.fromEntries(GARDEN_SPATIAL_LAYERS.map((layer) => [
    layer,
    dataset.collections?.[layer]?.features?.length || 0
  ]));
}

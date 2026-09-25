export const GARDEN_SPATIAL_SCHEMA_VERSION = "1.0.0";
export const CRS84_URI = "http://www.opengis.net/def/crs/OGC/1.3/CRS84";
export const INCHES_PER_METER = 39.37007874015748;

const WGS84_SEMI_MAJOR_METERS = 6378137;
const WGS84_ECCENTRICITY_SQUARED = 6.69437999014e-3;

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function spatialOrigin(property = {}) {
  const reference = property.spatialReference || {};
  const candidate = reference.origin || property.localOrigin || {};
  const coordinates = Array.isArray(candidate)
    ? candidate
    : Array.isArray(candidate.coordinates)
    ? candidate.coordinates
    : [candidate.longitude ?? candidate.lon, candidate.latitude ?? candidate.lat];
  return {
    lon: finiteNumber(coordinates[0]),
    lat: finiteNumber(coordinates[1])
  };
}

function localScaleAtLatitude(latitude) {
  // This evaluates WGS 84 scale at one latitude and then treats it as constant.
  // That is sufficiently stable across a garden parcel, but intentionally is not
  // a replacement for a projected CRS when aligning a town- or state-scale plan.
  const radians = latitude * Math.PI / 180;
  const sinLatitude = Math.sin(radians);
  const denominator = Math.sqrt(1 - WGS84_ECCENTRICITY_SQUARED * sinLatitude * sinLatitude);
  const primeVerticalRadius = WGS84_SEMI_MAJOR_METERS / denominator;
  const meridionalRadius = WGS84_SEMI_MAJOR_METERS * (1 - WGS84_ECCENTRICITY_SQUARED)
    / denominator ** 3;
  return {
    metersPerDegreeLongitude: Math.PI / 180 * primeVerticalRadius * Math.cos(radians),
    metersPerDegreeLatitude: Math.PI / 180 * meridionalRadius
  };
}

export function gardenSpatialReference(property = {}) {
  const origin = spatialOrigin(property);
  return {
    schemaVersion: GARDEN_SPATIAL_SCHEMA_VERSION,
    type: "LocalTangentPlane",
    horizontalCRS: CRS84_URI,
    origin: {
      type: "Point",
      coordinates: [origin.lon, origin.lat]
    },
    localAxes: {
      x: "east",
      y: "south"
    },
    localUnit: "inch",
    inchesPerMeter: INCHES_PER_METER,
    method: "WGS 84 ellipsoid local tangent-plane, first-order",
    accuracy: property?.reference?.mapping?.layoutStatus === "diagrammatic"
      ? "Coordinates are deterministic; diagrammatic feature placement is approximate and not survey-grade."
      : "Coordinates preserve the editable local plan; interpreted features are not survey-grade unless their source says otherwise."
  };
}

export function localPointToLonLat(point, property = {}) {
  const origin = spatialOrigin(property);
  const scale = localScaleAtLatitude(origin.lat);
  const xMeters = finiteNumber(point?.[0]) / INCHES_PER_METER;
  const yMeters = finiteNumber(point?.[1]) / INCHES_PER_METER;
  // CRS84 is explicitly longitude, latitude. The minus sign converts the
  // application's screen-friendly south-positive local y axis to north-positive
  // geographic latitude.
  return [
    origin.lon + xMeters / scale.metersPerDegreeLongitude,
    origin.lat - yMeters / scale.metersPerDegreeLatitude
  ];
}

export function lonLatToLocalPoint(point, property = {}) {
  const origin = spatialOrigin(property);
  const scale = localScaleAtLatitude(origin.lat);
  return [
    (finiteNumber(point?.[0]) - origin.lon) * scale.metersPerDegreeLongitude * INCHES_PER_METER,
    -(finiteNumber(point?.[1]) - origin.lat) * scale.metersPerDegreeLatitude * INCHES_PER_METER
  ];
}

function rotatePoint(point, degrees = 0) {
  const radians = finiteNumber(degrees) * Math.PI / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  return [
    point[0] * cosine - point[1] * sine,
    point[0] * sine + point[1] * cosine
  ];
}

function closeRing(points) {
  if (!points.length) return [];
  const first = points[0];
  const last = points[points.length - 1];
  return first[0] === last[0] && first[1] === last[1]
    ? points
    : [...points, [...first]];
}

function rectangleRing(feature = {}) {
  const halfWidth = Math.max(0, finiteNumber(feature.width)) / 2;
  const halfHeight = Math.max(0, finiteNumber(feature.height)) / 2;
  const center = [finiteNumber(feature.x), finiteNumber(feature.y)];
  return closeRing([
    [-halfWidth, -halfHeight],
    [halfWidth, -halfHeight],
    [halfWidth, halfHeight],
    [-halfWidth, halfHeight]
  ].map((point) => {
    const rotated = rotatePoint(point, feature.rotation);
    return [center[0] + rotated[0], center[1] + rotated[1]];
  }));
}

function bedRing(bed = {}) {
  return Array.isArray(bed.polygon) && bed.polygon.length >= 3
    ? closeRing(bed.polygon.map((point) => [finiteNumber(point[0]), finiteNumber(point[1])]))
    : rectangleRing(bed);
}

function ellipseRing(feature = {}, segments = 32) {
  const halfWidth = Math.max(0, finiteNumber(feature.width)) / 2;
  const halfHeight = Math.max(0, finiteNumber(feature.height)) / 2;
  const center = [finiteNumber(feature.x), finiteNumber(feature.y)];
  const points = [];
  for (let index = 0; index < segments; index += 1) {
    const angle = index / segments * Math.PI * 2;
    const rotated = rotatePoint([
      Math.cos(angle) * halfWidth,
      Math.sin(angle) * halfHeight
    ], feature.rotation);
    points.push([center[0] + rotated[0], center[1] + rotated[1]]);
  }
  return closeRing(points);
}

function placementLocalPoint(placement, bed) {
  if (!bed) return [finiteNumber(placement.x), finiteNumber(placement.y)];
  // Placement x/y is measured from the unrotated bed's top-left corner, unlike
  // bed/structure x/y, which is an absolute center in the property local plane.
  // Apply bed rotation exactly once before geographic export.
  const relative = [
    finiteNumber(placement.x) - finiteNumber(bed.width) / 2,
    finiteNumber(placement.y) - finiteNumber(bed.height) / 2
  ];
  const rotated = rotatePoint(relative, bed.rotation);
  return [finiteNumber(bed.x) + rotated[0], finiteNumber(bed.y) + rotated[1]];
}

function localPosition(position) {
  return Array.isArray(position)
    && position.length >= 2
    && Number.isFinite(position[0])
    && Number.isFinite(position[1])
    ? [...position]
    : null;
}

function normalizedLocalGeometry(localGeometry) {
  if (!localGeometry || typeof localGeometry !== "object") return null;
  if (localGeometry.type === "Point") {
    const coordinates = localPosition(localGeometry.coordinates);
    return coordinates ? {...localGeometry, type: "Point", coordinates} : null;
  }
  if (localGeometry.type === "LineString") {
    if (!Array.isArray(localGeometry.coordinates) || localGeometry.coordinates.length < 2) return null;
    const coordinates = localGeometry.coordinates.map(localPosition);
    return coordinates.every(Boolean) ? {...localGeometry, type: "LineString", coordinates} : null;
  }
  if (localGeometry.type === "Polygon") {
    if (!Array.isArray(localGeometry.coordinates) || !localGeometry.coordinates.length) return null;
    const coordinates = localGeometry.coordinates.map((ring) => {
      if (!Array.isArray(ring) || ring.length < 4) return null;
      const positions = ring.map(localPosition);
      if (!positions.every(Boolean)) return null;
      const first = positions[0];
      const last = positions.at(-1);
      return first[0] === last[0] && first[1] === last[1] ? positions : null;
    });
    return coordinates.every(Boolean) ? {...localGeometry, type: "Polygon", coordinates} : null;
  }
  return null;
}

function geographicGeometry(localGeometry, property) {
  if (localGeometry.type === "Point") {
    return {type: "Point", coordinates: localPointToLonLat(localGeometry.coordinates, property)};
  }
  if (localGeometry.type === "LineString") {
    return {
      type: "LineString",
      coordinates: localGeometry.coordinates.map((point) => localPointToLonLat(point, property))
    };
  }
  return {
    type: "Polygon",
    coordinates: localGeometry.coordinates.map((ring) => (
      ring.map((point) => localPointToLonLat(point, property))
    ))
  };
}

function localGeometryFeature(workspace, type, item, candidateGeometry) {
  const localGeometry = normalizedLocalGeometry(candidateGeometry);
  if (!localGeometry) return null;
  const property = workspace.property || {};
  return {
    type: "Feature",
    id: `${workspace.id}:${type}:${item.id}`,
    geometry: geographicGeometry(localGeometry, property),
    properties: {
      gardenId: workspace.id,
      featureType: type,
      featureId: item.id,
      name: item.name || item.id,
      localGeometry,
      localUnit: "inch",
      rotationDegrees: finiteNumber(item.rotation),
      source: item.source || null,
      confidence: item.confidence || null,
      featureStatus: item.featureStatus || null,
      geometryBasis: item.geometryBasis || null,
      geometryEdit: item.geometryEdit ? structuredClone(item.geometryEdit) : null,
      surveyStatus: item.surveyStatus || null,
      boundaryPolicy: item.boundaryPolicy || null,
      taxonStatus: item.taxonStatus || null,
      identificationStatus: item.identificationStatus || null,
      collection: item.collection || null,
      kind: item.kind || null,
      plantId: item.plantId || null,
      observationType: item.observationType || null,
      geometryRepresentation: item.geometryRepresentation || null,
      canopyClass: item.canopyClass || null,
      crownWidthFeet: Number.isFinite(Number(item.crownWidthFeet)) ? Number(item.crownWidthFeet) : null,
      crownDepthFeet: Number.isFinite(Number(item.crownDepthFeet)) ? Number(item.crownDepthFeet) : null,
      crownDiameterFeet: Number.isFinite(Number(item.crownDiameterFeet)) ? Number(item.crownDiameterFeet) : null,
      crownRadiusEastWestFeet: Number.isFinite(Number(item.crownRadiusEastWestFeet)) ? Number(item.crownRadiusEastWestFeet) : null,
      crownRadiusNorthSouthFeet: Number.isFinite(Number(item.crownRadiusNorthSouthFeet)) ? Number(item.crownRadiusNorthSouthFeet) : null,
      crownMeasurementMethod: item.crownMeasurementMethod || null,
      crownConfidence: item.crownConfidence || null,
      heightEstimateFeet: Number.isFinite(Number(item.heightEstimateFeet)) ? Number(item.heightEstimateFeet) : null,
      heightEstimateRangeFeet: Array.isArray(item.heightEstimateRangeFeet)
        ? structuredClone(item.heightEstimateRangeFeet)
        : null,
      heightEstimateMethod: item.heightEstimateMethod || null,
      heightConfidence: item.heightConfidence || null,
      sourcePixel: Array.isArray(item.sourcePixel) ? structuredClone(item.sourcePixel) : null,
      sourceMapNumber: Number.isFinite(Number(item.sourceMapNumber)) ? Number(item.sourceMapNumber) : null,
      digitizationRasterId: item.digitizationRasterId || null,
      imageryId: item.imageryId || null,
      imageryZoom: Number.isFinite(Number(item.imageryZoom)) ? Number(item.imageryZoom) : null,
      imageryTileOrigin: Array.isArray(item.imageryTileOrigin) ? structuredClone(item.imageryTileOrigin) : null,
      networkId: item.networkId || null,
      parcelId: item.parcelId || null,
      topologyNodeIds: Array.isArray(item.topologyNodeIds) ? structuredClone(item.topologyNodeIds) : [],
      corridorWidthFeet: item.corridorWidthFeet || null,
      parentId: item.parentId || null,
      sectionId: item.sectionId || null,
      subplotId: item.subplotId || null,
      // Grid cells are intentionally weaker evidence than independently
      // digitized bed footprints. Preserve the stable cell/control identities
      // so QGIS and Google Earth round-trips cannot silently promote an
      // interpolated rectangle into an observed boundary.
      gridCellId: item.gridCellId || null,
      centerControlId: item.centerControlId || null,
      boundaryConfidence: item.boundaryConfidence || null,
      // Retained only for older user workspaces. Revision-3 canonical BBG beds
      // no longer populate this legacy field.
      observedFootprintId: item.observedFootprintId || null,
      snappedToFeatureId: item.snappedToFeatureId || null,
      plantingAssignment: item.plantingAssignment || null,
      cropTaxon: item.cropTaxon || null,
      // Structured source locators keep a feature tied to the exact map number
      // or dataset observation that informed it. They intentionally accompany,
      // rather than replace, the per-feature confidence and survey disclaimer.
      sourceReferences: Array.isArray(item.sourceReferences)
        ? structuredClone(item.sourceReferences)
        : [],
      provenance: item.provenance && typeof item.provenance === "object"
        ? structuredClone(item.provenance)
        : null,
      notes: item.notes || null,
      ...(type === "bed" ? {zone: item.zone || null} : {classification: item.type || null})
    }
  };
}

function localPolygonFeature(workspace, type, item, localRing) {
  return localGeometryFeature(workspace, type, item, {
    type: "Polygon",
    coordinates: [localRing]
  });
}

function coordinateBbox(features) {
  const coordinates = [];
  const visit = (value) => {
    if (!Array.isArray(value)) return;
    if (value.length >= 2 && Number.isFinite(value[0]) && Number.isFinite(value[1])) {
      coordinates.push(value);
      return;
    }
    value.forEach(visit);
  };
  features.forEach((feature) => visit(feature?.geometry?.coordinates));
  if (!coordinates.length) return undefined;
  return [
    Math.min(...coordinates.map((point) => point[0])),
    Math.min(...coordinates.map((point) => point[1])),
    Math.max(...coordinates.map((point) => point[0])),
    Math.max(...coordinates.map((point) => point[1]))
  ];
}

/**
 * Build the portable geographic representation of one editable workspace.
 * GeoJSON geometry is RFC 7946 longitude/latitude. The local geometry foreign
 * members make import round-trippable without treating diagrammatic features
 * as survey observations.
 */
export function gardenWorkspaceFeatureCollection(workspace = {}) {
  const property = workspace.property || {};
  const features = [];
  const parcelMembers = Array.isArray(property.parcel?.members) && property.parcel.members.length
    ? property.parcel.members
    : property.parcel?.geometry?.type && Array.isArray(property.parcel.geometry.coordinates)
    ? [{
        id: property.parcel?.attributes?.MAP_PAR_ID || property.id || workspace.id,
        geometry: property.parcel.geometry,
        acreage: property.parcel?.attributes?.LOT_SIZE || null
      }]
    : [];
  for (const member of parcelMembers) {
    if (!member?.geometry?.type || !Array.isArray(member.geometry.coordinates)) continue;
    features.push({
      type: "Feature",
      id: `${workspace.id}:parcel:${member.id}`,
      geometry: structuredClone(member.geometry),
      properties: {
        gardenId: workspace.id,
        featureType: "parcel",
        featureId: member.id,
        parcelId: member.id,
        name: property.name || workspace.name || workspace.id,
        source: property.parcel?.service || property.source || null,
        fiscalYear: property.parcel?.attributes?.FY || null,
        acreage: member.acreage || null,
        confidence: property.reference?.mapping?.confidence || null
      }
    });
  }

  for (const bed of workspace.beds || []) {
    features.push(localPolygonFeature(workspace, "bed", bed, bedRing(bed)));
  }
  for (const structure of workspace.structures || []) {
    // New site features may carry their own local GeoJSON geometry. Keeping the
    // rectangle fallback means layouts saved before localGeometry was introduced
    // retain their established envelope and continue to export as polygons.
    features.push(
      localGeometryFeature(workspace, "structure", structure, structure.localGeometry)
      || localPolygonFeature(workspace, "structure", structure, rectangleRing(structure))
    );
  }
  for (const vegetation of workspace.vegetation || []) {
    // An observed tree is canonically a geographic center Point. Crown width,
    // depth, and height remain attributes from which the planner derives a
    // canopy or sun-position-dependent shadow. True land-cover / management
    // polygons may still carry explicit localGeometry and remain polygons;
    // they must not be synthesized from a tree's display ellipse.
    const pointGeometry = vegetation.geometryRepresentation === "point" || vegetation.kind === "tree"
      ? {type: "Point", coordinates: [finiteNumber(vegetation.x), finiteNumber(vegetation.y)]}
      : null;
    features.push(
      localGeometryFeature(workspace, "vegetation", vegetation, vegetation.localGeometry)
      || (pointGeometry ? localGeometryFeature(workspace, "vegetation", vegetation, pointGeometry) : null)
      || localPolygonFeature(workspace, "vegetation", vegetation, ellipseRing(vegetation))
    );
  }

  const bedsById = new Map((workspace.beds || []).map((bed) => [bed.id, bed]));
  for (const placement of workspace.placements || []) {
    const localPoint = placementLocalPoint(placement, bedsById.get(placement.bedId));
    features.push({
      type: "Feature",
      id: `${workspace.id}:plant:${placement.id}`,
      geometry: {
        type: "Point",
        coordinates: localPointToLonLat(localPoint, property)
      },
      properties: {
        gardenId: workspace.id,
        featureType: "plant",
        featureId: placement.id,
        name: placement.name || null,
        plantId: placement.plantId || null,
        bedId: placement.bedId || null,
        localPoint,
        bedLocalPoint: [finiteNumber(placement.x), finiteNumber(placement.y)],
        localUnit: "inch",
        parcelId: placement.parcelId || null,
        notes: placement.notes || null
      }
    });
  }

  const collection = {
    type: "FeatureCollection",
    id: workspace.id,
    properties: {
      name: workspace.name || property.name || workspace.id,
      schemaVersion: GARDEN_SPATIAL_SCHEMA_VERSION,
      coordinateReferenceSystem: CRS84_URI,
      spatialReference: gardenSpatialReference(property),
      spatialStatus: property.spatialStatus || "unknown",
      layoutStatus: property.reference?.mapping?.layoutStatus || "user-edited",
      generatedAt: new Date().toISOString()
    },
    features
  };
  const bbox = coordinateBbox(features);
  if (bbox) collection.bbox = bbox;
  return collection;
}

function featureCollectionForLayer(workspace, layer, features, sourceCollection) {
  const normalized = features.map((feature) => ({
    ...structuredClone(feature),
    properties: {...structuredClone(feature.properties || {}), layer}
  }));
  const collection = {
    type: "FeatureCollection",
    id: `${workspace.id}:${layer}`,
    properties: {
      gardenId: workspace.id,
      layer,
      schemaVersion: GARDEN_SPATIAL_SCHEMA_VERSION,
      coordinateReferenceSystem: CRS84_URI,
      generatedFrom: sourceCollection.id
    },
    features: normalized
  };
  const bbox = coordinateBbox(normalized);
  if (bbox) collection.bbox = bbox;
  return collection;
}

/**
 * Split a planner workspace into the four canonical GIS layers. Vegetation is
 * part of the site inventory and remains distinguishable by featureType and
 * collection. This is the storage/API shape; the flattened collection above is
 * retained for backwards-compatible downloads.
 */
export function gardenWorkspaceLayerFeatureCollections(workspace = {}) {
  const combined = gardenWorkspaceFeatureCollection(workspace);
  const byLayer = {
    parcels: combined.features.filter((feature) => feature.properties?.featureType === "parcel"),
    site: combined.features.filter((feature) => ["structure", "vegetation"].includes(feature.properties?.featureType)),
    beds: combined.features.filter((feature) => feature.properties?.featureType === "bed"),
    plants: combined.features.filter((feature) => feature.properties?.featureType === "plant")
  };
  return Object.fromEntries(Object.entries(byLayer).map(([layer, features]) => [
    layer,
    featureCollectionForLayer(workspace, layer, features, combined)
  ]));
}

export function gardenStateSpatialExport(state = {}) {
  const workspaces = state.parcels || [];
  return {
    schemaVersion: GARDEN_SPATIAL_SCHEMA_VERSION,
    format: "GeoJSON FeatureCollection per garden",
    coordinateReferenceSystem: CRS84_URI,
    activeGardenId: state.activeParcelId || null,
    gardens: workspaces.map(gardenWorkspaceFeatureCollection),
    datasets: workspaces.map((workspace) => ({
      type: "GardenSpatialDataset",
      schemaVersion: GARDEN_SPATIAL_SCHEMA_VERSION,
      gardenId: workspace.id,
      coordinateReferenceSystem: CRS84_URI,
      collections: gardenWorkspaceLayerFeatureCollections(workspace)
    }))
  };
}

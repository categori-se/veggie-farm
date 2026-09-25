import {localPointToLonLat, lonLatToLocalPoint} from "./gardenSpatial.js";

export const GIS_ALIGNMENT_SCHEMA_VERSION = "1.0.0";

const MIN_WEB_MERCATOR_LATITUDE = -85.05112878;
const MAX_WEB_MERCATOR_LATITUDE = 85.05112878;

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function finitePoint(value, label) {
  if (!Array.isArray(value) || value.length < 2 || !value.slice(0, 2).every(Number.isFinite)) {
    throw new TypeError(`${label} must be a two-number coordinate.`);
  }
  return [Number(value[0]), Number(value[1])];
}

/**
 * Visit positions in Polygon, MultiPolygon, and other GeoJSON coordinate trees.
 * Do not assume coordinates[0] is the whole parcel: multipart and holed parcels
 * are common enough that an imagery coverage calculation must traverse all of it.
 */
export function collectGeoJsonPositions(geometry = {}) {
  const positions = [];
  const visit = (value) => {
    if (!Array.isArray(value)) return;
    if (value.length >= 2 && Number.isFinite(value[0]) && Number.isFinite(value[1])) {
      positions.push([Number(value[0]), Number(value[1])]);
      return;
    }
    value.forEach(visit);
  };
  visit(geometry.coordinates);
  return positions;
}

export function lonLatBounds(points, paddingDegrees = 0) {
  if (!Array.isArray(points) || !points.length) return null;
  const positions = points.map((point, index) => finitePoint(point, `points[${index}]`));
  const padding = Math.max(0, finiteNumber(paddingDegrees));
  return {
    minLon: Math.min(...positions.map((point) => point[0])) - padding,
    maxLon: Math.max(...positions.map((point) => point[0])) + padding,
    minLat: Math.min(...positions.map((point) => point[1])) - padding,
    maxLat: Math.max(...positions.map((point) => point[1])) + padding
  };
}

export function lonToTileX(longitude, zoom) {
  return (finiteNumber(longitude) + 180) / 360 * 2 ** zoom;
}

export function latToTileY(latitude, zoom) {
  // XYZ basemaps use Web Mercator, whose finite latitude range must be honored
  // even though the garden data itself is portable CRS84 longitude/latitude.
  const boundedLatitude = clamp(finiteNumber(latitude), MIN_WEB_MERCATOR_LATITUDE, MAX_WEB_MERCATOR_LATITUDE);
  const phi = boundedLatitude * Math.PI / 180;
  return (1 - Math.log(Math.tan(phi) + 1 / Math.cos(phi)) / Math.PI) / 2 * 2 ** zoom;
}

export function tileXToLon(x, zoom) {
  return finiteNumber(x) / 2 ** zoom * 360 - 180;
}

export function tileYToLat(y, zoom) {
  const value = Math.PI * (1 - 2 * finiteNumber(y) / 2 ** zoom);
  return Math.atan(Math.sinh(value)) * 180 / Math.PI;
}

/**
 * Convert a point measured in a stitched XYZ raster back to CRS84.
 *
 * `tileOrigin` is the XYZ coordinate of the raster's upper-left tile and the
 * pixel point is measured from that tile's upper-left corner. Keeping this
 * small piece of registration metadata beside a digitization makes a traced
 * path or polygon reproducible without storing an unexplained local offset.
 */
export function xyzRasterPixelToLonLat(point, {
  tileOrigin,
  zoom,
  tileSize = 256
} = {}) {
  const [pixelX, pixelY] = finitePoint(point, "point");
  const [tileX, tileY] = finitePoint(tileOrigin, "tileOrigin");
  const size = finiteNumber(tileSize, 256);
  if (size <= 0) throw new RangeError("tileSize must be greater than zero.");
  const level = Math.round(finiteNumber(zoom));
  return [
    tileXToLon(tileX + pixelX / size, level),
    tileYToLat(tileY + pixelY / size, level)
  ];
}

/** Reverse `xyzRasterPixelToLonLat` for alignment review overlays. */
export function lonLatToXyzRasterPixel(point, {
  tileOrigin,
  zoom,
  tileSize = 256
} = {}) {
  const [longitude, latitude] = finitePoint(point, "point");
  const [tileX, tileY] = finitePoint(tileOrigin, "tileOrigin");
  const size = finiteNumber(tileSize, 256);
  if (size <= 0) throw new RangeError("tileSize must be greater than zero.");
  const level = Math.round(finiteNumber(zoom));
  return [
    (lonToTileX(longitude, level) - tileX) * size,
    (latToTileY(latitude, level) - tileY) * size
  ];
}

export function xyzRasterPixelToLocalPoint(point, registration, property) {
  return lonLatToLocalPoint(xyzRasterPixelToLonLat(point, registration), property);
}

/**
 * Project canonical garden-local coordinates back into a registered XYZ
 * tracing mosaic. This is intentionally the inverse review path: operators can
 * reopen the exact raster named by a control point and confirm that an edited
 * feature still lands on the source pixel that was originally digitized.
 */
export function localPointToXyzRasterPixel(point, registration, property) {
  return lonLatToXyzRasterPixel(localPointToLonLat(point, property), registration);
}

export function tileBoundsLonLat(x, y, zoom) {
  return {
    west: tileXToLon(x, zoom),
    east: tileXToLon(x + 1, zoom),
    north: tileYToLat(y, zoom),
    south: tileYToLat(y + 1, zoom)
  };
}

export function imageryTileRange(bounds, zoom, paddingTiles = 0) {
  if (!bounds) return null;
  const limit = 2 ** zoom - 1;
  const padding = Math.max(0, Math.round(finiteNumber(paddingTiles)));
  const xMin = clamp(Math.floor(lonToTileX(bounds.minLon, zoom)) - padding, 0, limit);
  const xMax = clamp(Math.floor(lonToTileX(bounds.maxLon, zoom)) + padding, 0, limit);
  const yMin = clamp(Math.floor(latToTileY(bounds.maxLat, zoom)) - padding, 0, limit);
  const yMax = clamp(Math.floor(latToTileY(bounds.minLat, zoom)) + padding, 0, limit);
  return {xMin, xMax, yMin, yMax, count: (xMax - xMin + 1) * (yMax - yMin + 1)};
}

export function xyzTileUrl(template, x, y, z) {
  return String(template)
    .replaceAll("{x}", String(x))
    .replaceAll("{y}", String(y))
    .replaceAll("{z}", String(z));
}

export function rotatedViewportLonLat(viewport, bearingDegrees, property) {
  if (!viewport) return [];
  const width = Math.max(0, finiteNumber(viewport.width));
  const height = Math.max(0, finiteNumber(viewport.height));
  const x = finiteNumber(viewport.x);
  const y = finiteNumber(viewport.y);
  const center = [x + width / 2, y + height / 2];
  const angle = finiteNumber(bearingDegrees) * Math.PI / 180;
  return [
    [x, y],
    [x + width, y],
    [x + width, y + height],
    [x, y + height]
  ].map((point) => {
    const dx = point[0] - center[0];
    const dy = point[1] - center[1];
    return localPointToLonLat([
      center[0] + dx * Math.cos(angle) - dy * Math.sin(angle),
      center[1] + dx * Math.sin(angle) + dy * Math.cos(angle)
    ], property);
  });
}

/**
 * Resolve the bounded XYZ mosaics needed by the application.
 *
 * The first mosaic always covers the complete parcel and has priority over
 * viewport detail. This ordering is important: fitting a single high-resolution
 * range around both the parcel and viewport can spend the whole budget on empty
 * space between them, or make part of the parcel disappear while inspecting a
 * bed. After the parcel fits, any remaining budget may fund a second, higher-
 * resolution mosaic over the rotated viewport.
 *
 * `zoom` and `range` remain aliases for the parcel mosaic for older renderers.
 * New renderers should paint `mosaics` in array order so viewport detail is laid
 * over the complete, lower-resolution parcel context. A detail mosaic is only
 * useful when its zoom is strictly greater than the parcel zoom.
 */
export function parcelImageryCoverage({property, imagery, viewport, bearing = 0} = {}) {
  const parcelPositions = collectGeoJsonPositions(property?.parcel?.geometry);
  if (!parcelPositions.length || !imagery?.tileUrl) return null;

  const coveragePolicy = imagery.coverage ?? property?.imagery?.coverage ?? "parcel-and-viewport";
  const viewportPositions = coveragePolicy === "parcel"
    ? []
    : rotatedViewportLonLat(viewport, bearing, property);
  const parcelBounds = lonLatBounds(parcelPositions);
  const detailBounds = lonLatBounds(viewportPositions);
  const bounds = lonLatBounds([...parcelPositions, ...viewportPositions]);
  const maxZoom = Math.round(clamp(finiteNumber(imagery.maxZoom, 23), 0, 23));
  const minZoom = Math.round(clamp(finiteNumber(imagery.minZoom), 0, maxZoom));
  const requestedZoom = Math.round(clamp(finiteNumber(imagery.zoom, 19), minZoom, maxZoom));
  const tilePadding = Math.max(0, Math.round(finiteNumber(imagery.tilePadding ?? property?.imagery?.tilePadding)));
  const maxTileCount = Math.max(1, Math.round(finiteNumber(
    imagery.maxTileCount ?? property?.imagery?.maxTileCount,
    192
  )));

  let zoom = requestedZoom;
  let range = imageryTileRange(parcelBounds, zoom, tilePadding);
  while (range.count > maxTileCount && zoom > minZoom) {
    zoom -= 1;
    range = imageryTileRange(parcelBounds, zoom, tilePadding);
  }

  const parcelMosaic = {
    role: "parcel",
    bounds: parcelBounds,
    zoom,
    range,
    tileCount: range.count
  };
  const mosaics = [parcelMosaic];
  let totalTileCount = range.count;
  let detailZoom = null;

  // Never trade parcel completeness for detail. When even the source's minimum
  // zoom cannot satisfy the cap, preserve the diagnostic oversized parcel range
  // and let callers fail closed via budgetSatisfied, as previous callers did.
  if (totalTileCount <= maxTileCount && detailBounds && requestedZoom > zoom) {
    const remainingTileCount = maxTileCount - totalTileCount;
    for (let candidateZoom = requestedZoom; candidateZoom > zoom; candidateZoom -= 1) {
      const detailRange = imageryTileRange(detailBounds, candidateZoom, tilePadding);
      if (detailRange.count > remainingTileCount) continue;
      detailZoom = candidateZoom;
      mosaics.push({
        role: "detail",
        bounds: detailBounds,
        zoom: candidateZoom,
        range: detailRange,
        tileCount: detailRange.count
      });
      totalTileCount += detailRange.count;
      break;
    }
  }

  return {
    coveragePolicy,
    bounds,
    parcelBounds,
    detailBounds,
    requestedZoom,
    zoom,
    tilePadding,
    maxTileCount,
    range,
    mosaics,
    totalTileCount,
    detailZoom,
    budgetSatisfied: totalTileCount <= maxTileCount
  };
}

function normalizedControlPoints(controlPoints, property) {
  if (!Array.isArray(controlPoints) || controlPoints.length < 2) {
    throw new RangeError("A similarity registration needs at least two control points.");
  }
  return controlPoints.map((point, index) => {
    const source = finitePoint(point.sourceLocal ?? point.source, `controlPoints[${index}].sourceLocal`);
    const targetLonLat = finitePoint(point.targetLonLat ?? point.target, `controlPoints[${index}].targetLonLat`);
    return {
      id: point.id || `control-${index + 1}`,
      source,
      targetLonLat,
      target: lonLatToLocalPoint(targetLonLat, property),
      weight: Math.max(0.000001, finiteNumber(point.weight, 1)),
      role: point.role || null
    };
  });
}

/**
 * Fit a weighted 2-D similarity transform (translation + uniform scale +
 * rotation) from a draft plan to aerial-observed CRS84 control points. Uniform
 * scale is intentional: a free affine fit can make residuals look smaller by
 * shearing beds and masking a bad control point or a distorted source diagram.
 */
export function fitSimilarityTransform(controlPoints, property) {
  const points = normalizedControlPoints(controlPoints, property);
  const totalWeight = points.reduce((sum, point) => sum + point.weight, 0);
  const centroid = (key, axis) => points.reduce(
    (sum, point) => sum + point[key][axis] * point.weight,
    0
  ) / totalWeight;
  const sourceCenter = [centroid("source", 0), centroid("source", 1)];
  const targetCenter = [centroid("target", 0), centroid("target", 1)];
  let denominator = 0;
  let real = 0;
  let imaginary = 0;

  for (const point of points) {
    const sx = point.source[0] - sourceCenter[0];
    const sy = point.source[1] - sourceCenter[1];
    const tx = point.target[0] - targetCenter[0];
    const ty = point.target[1] - targetCenter[1];
    denominator += point.weight * (sx * sx + sy * sy);
    real += point.weight * (sx * tx + sy * ty);
    imaginary += point.weight * (sx * ty - sy * tx);
  }
  if (denominator <= 1e-12) throw new RangeError("Control points must contain at least two distinct source positions.");

  const a = real / denominator;
  const b = imaginary / denominator;
  const translation = [
    targetCenter[0] - a * sourceCenter[0] + b * sourceCenter[1],
    targetCenter[1] - b * sourceCenter[0] - a * sourceCenter[1]
  ];
  const transform = {
    model: "similarity",
    a,
    b,
    scale: Math.hypot(a, b),
    rotationDegrees: Math.atan2(b, a) * 180 / Math.PI,
    translation,
    sourceCenter,
    targetCenter
  };
  const residuals = points.map((point) => {
    const fitted = applySimilarityTransform(point.source, transform);
    const delta = [fitted[0] - point.target[0], fitted[1] - point.target[1]];
    const errorInches = Math.hypot(...delta);
    return {
      id: point.id,
      role: point.role,
      sourceLocal: point.source,
      observedLonLat: point.targetLonLat,
      observedLocal: point.target,
      fittedLocal: fitted,
      fittedLonLat: localPointToLonLat(fitted, property),
      errorInches,
      errorFeet: errorInches / 12
    };
  });
  const weightedSquaredError = residuals.reduce(
    (sum, residual, index) => sum + residual.errorInches ** 2 * points[index].weight,
    0
  );
  return {
    ...transform,
    controlPointCount: points.length,
    residuals,
    rmseInches: Math.sqrt(weightedSquaredError / totalWeight),
    rmseFeet: Math.sqrt(weightedSquaredError / totalWeight) / 12,
    maxErrorFeet: Math.max(...residuals.map((residual) => residual.errorFeet))
  };
}

export function applySimilarityTransform(point, transform = {}) {
  const [x, y] = finitePoint(point, "point");
  const a = finiteNumber(transform.a, 1);
  const b = finiteNumber(transform.b);
  const translation = transform.translation || [0, 0];
  return [
    a * x - b * y + finiteNumber(translation[0]),
    b * x + a * y + finiteNumber(translation[1])
  ];
}

function transformLocalCoordinateTree(value, transform) {
  if (!Array.isArray(value)) return value;
  if (value.length >= 2 && Number.isFinite(value[0]) && Number.isFinite(value[1])) {
    const [x, y] = applySimilarityTransform(value, transform);
    return [x, y, ...value.slice(2)];
  }
  return value.map((child) => transformLocalCoordinateTree(child, transform));
}

export function transformGardenFeature(feature = {}, transform = {}) {
  const transformed = {...feature};
  if (Number.isFinite(feature.x) && Number.isFinite(feature.y)) {
    [transformed.x, transformed.y] = applySimilarityTransform([feature.x, feature.y], transform);
  }
  if (Array.isArray(feature.polygon)) {
    transformed.polygon = feature.polygon.map((point) => applySimilarityTransform(point, transform));
  }
  if (
    feature.localGeometry
    && ["Point", "LineString", "Polygon"].includes(feature.localGeometry.type)
    && Array.isArray(feature.localGeometry.coordinates)
  ) {
    // Geometry type and coordinate nesting are deliberately left intact. This
    // preserves line connectivity and every polygon ring (including holes) while
    // applying the same calibration as legacy center/envelope fields.
    transformed.localGeometry = {
      ...feature.localGeometry,
      coordinates: transformLocalCoordinateTree(feature.localGeometry.coordinates, transform)
    };
  }
  const scale = Math.abs(finiteNumber(transform.scale, Math.hypot(
    finiteNumber(transform.a, 1),
    finiteNumber(transform.b)
  )));
  if (Number.isFinite(feature.width)) transformed.width = feature.width * scale;
  if (Number.isFinite(feature.height)) transformed.height = feature.height * scale;
  if (Number.isFinite(feature.rotation)) {
    transformed.rotation = feature.rotation + finiteNumber(transform.rotationDegrees);
  }
  return transformed;
}

export function transformGardenLayout(layout = {}, transform = {}) {
  const featureCollections = ["beds", "structures", "vegetation"];
  const result = {...layout};
  for (const key of featureCollections) {
    if (Array.isArray(layout[key])) result[key] = layout[key].map((feature) => transformGardenFeature(feature, transform));
  }
  // Plant placements are bed-relative coordinates, so they move with their bed
  // and must not be transformed a second time. Unattached point annotations
  // should be modeled as a feature collection before running this utility.
  if (Array.isArray(layout.placements)) result.placements = layout.placements.map((placement) => ({...placement}));
  return result;
}

export function directObservationDiagnostics(controlPoints, property) {
  if (!Array.isArray(controlPoints) || !controlPoints.length) {
    throw new RangeError("At least one direct observation is required.");
  }
  const observations = controlPoints.map((point, index) => {
    const expectedLocal = finitePoint(
      point.expectedLocal ?? point.sourceLocal,
      `controlPoints[${index}].expectedLocal`
    );
    const observedLonLat = finitePoint(
      point.targetLonLat ?? point.target,
      `controlPoints[${index}].targetLonLat`
    );
    const observedLocal = lonLatToLocalPoint(observedLonLat, property);
    const delta = [observedLocal[0] - expectedLocal[0], observedLocal[1] - expectedLocal[1]];
    const errorInches = Math.hypot(...delta);
    return {
      id: point.id || `observation-${index + 1}`,
      featureId: point.featureId || null,
      role: point.role || null,
      expectedLocal,
      observedLonLat,
      observedLocal,
      errorInches,
      errorFeet: errorInches / 12
    };
  });
  return {
    model: "direct-observation",
    controlPointCount: observations.length,
    observations,
    rmseFeet: Math.sqrt(observations.reduce((sum, point) => sum + point.errorFeet ** 2, 0) / observations.length),
    maxErrorFeet: Math.max(...observations.map((point) => point.errorFeet))
  };
}

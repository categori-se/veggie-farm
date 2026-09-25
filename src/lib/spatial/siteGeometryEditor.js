/**
 * Renderer-neutral geometry editing helpers for the garden site layer.
 *
 * The planner currently renders with SVG/D3, while a future map surface may
 * use MapLibre plus Mapbox GL Draw. Keeping vertex identity, topology, and
 * measurements here prevents either renderer from becoming the data model.
 * Coordinates are garden-local inches; CRS84 conversion remains the job of
 * gardenSpatial.js when a workspace is saved or exported.
 */

function clone(value) {
  if (value === undefined) return undefined;
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function point(value) {
  if (!Array.isArray(value) || value.length < 2) return null;
  const x = Number(value[0]);
  const y = Number(value[1]);
  return Number.isFinite(x) && Number.isFinite(y) ? [x, y] : null;
}

export function dedupeDraftVertices(points, toleranceInches = 0.01) {
  const result = [];
  for (const candidate of points || []) {
    const next = point(candidate);
    if (!next) continue;
    const previous = result.at(-1);
    if (previous && Math.hypot(previous[0] - next[0], previous[1] - next[1]) <= toleranceInches) continue;
    result.push(next);
  }
  return result;
}

/** Convert an editor draft to valid local GeoJSON without inventing vertices. */
export function completeLocalSiteGeometry(geometryType, draftPoints) {
  const points = dedupeDraftVertices(draftPoints);
  if (geometryType === "Point") {
    return points.length ? {type: "Point", coordinates: points[0]} : null;
  }
  if (geometryType === "LineString") {
    return points.length >= 2 ? {type: "LineString", coordinates: points} : null;
  }
  if (geometryType === "Polygon") {
    if (points.length < 3) return null;
    return {type: "Polygon", coordinates: [[...points, [...points[0]]]]};
  }
  return null;
}

/**
 * Return unique editable vertices with stable coordinate paths. The repeated
 * closing coordinate of a polygon ring is represented by its first vertex and
 * updated together with it.
 */
export function localSiteGeometryVertices(geometry, topologyNodeIds = []) {
  if (geometry?.type === "Point") {
    const coordinate = point(geometry.coordinates);
    return coordinate ? [{path: [], coordinate, nodeId: topologyNodeIds[0] || null}] : [];
  }
  if (geometry?.type === "LineString") {
    return (geometry.coordinates || []).map((coordinate, index) => ({
      path: [index],
      coordinate: point(coordinate),
      nodeId: topologyNodeIds[index] || null
    })).filter(({coordinate}) => coordinate);
  }
  if (geometry?.type === "Polygon") {
    return (geometry.coordinates || []).flatMap((ring, ringIndex) => {
      const positions = Array.isArray(ring) ? ring : [];
      const closed = positions.length > 1
        && point(positions[0])
        && point(positions.at(-1))
        && positions[0][0] === positions.at(-1)[0]
        && positions[0][1] === positions.at(-1)[1];
      return positions.slice(0, closed ? -1 : undefined).map((coordinate, index) => ({
        path: [ringIndex, index],
        coordinate: point(coordinate),
        nodeId: null
      })).filter(({coordinate}) => coordinate);
    });
  }
  return [];
}

function coordinateAtPath(geometry, path) {
  if (geometry.type === "Point") return geometry.coordinates;
  if (geometry.type === "LineString") return geometry.coordinates[path[0]];
  if (geometry.type === "Polygon") return geometry.coordinates[path[0]][path[1]];
  return null;
}

/** Return a cloned geometry with one vertex moved. */
export function updateLocalSiteGeometryVertex(geometry, path, nextPoint) {
  const next = point(nextPoint);
  if (!geometry || !next || !coordinateAtPath(geometry, path || [])) return clone(geometry);
  const updated = clone(geometry);
  if (updated.type === "Point") {
    updated.coordinates = next;
  } else if (updated.type === "LineString") {
    updated.coordinates[path[0]] = next;
  } else if (updated.type === "Polygon") {
    const ring = updated.coordinates[path[0]];
    const closesRing = ring.length > 1
      && ring[0][0] === ring.at(-1)[0]
      && ring[0][1] === ring.at(-1)[1];
    ring[path[1]] = next;
    if (closesRing && path[1] === 0) ring[ring.length - 1] = [...next];
  }
  return updated;
}

/**
 * Move a vertex and every endpoint sharing its explicit topology-node ID.
 * Proximity alone never joins two paths: continuity is a deliberate GIS
 * relationship, not a screen-space snapping side effect.
 */
export function updateConnectedSiteVertices(features, featureId, vertexPath, nextPoint) {
  const source = (features || []).find((feature) => feature?.id === featureId);
  const sourceVertex = localSiteGeometryVertices(source?.localGeometry, source?.topologyNodeIds)
    .find((vertex) => JSON.stringify(vertex.path) === JSON.stringify(vertexPath || []));
  const nodeId = sourceVertex?.nodeId;
  return (features || []).map((feature) => {
    let geometry = feature.localGeometry;
    let changed = false;
    for (const vertex of localSiteGeometryVertices(geometry, feature.topologyNodeIds)) {
      const selected = feature.id === featureId
        && JSON.stringify(vertex.path) === JSON.stringify(vertexPath || []);
      if (!selected && (!nodeId || vertex.nodeId !== nodeId)) continue;
      geometry = updateLocalSiteGeometryVertex(geometry, vertex.path, nextPoint);
      changed = true;
    }
    return changed ? {...feature, localGeometry: geometry} : feature;
  });
}

function lineLength(points) {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += Math.hypot(points[index][0] - points[index - 1][0], points[index][1] - points[index - 1][1]);
  }
  return total;
}

function ringArea(points) {
  let twiceArea = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    twiceArea += current[0] * next[1] - next[0] * current[1];
  }
  return Math.abs(twiceArea) / 2;
}

export function localGeometryMeasurements(geometryType, draftPoints) {
  const points = dedupeDraftVertices(draftPoints);
  const lengthInches = geometryType === "LineString" ? lineLength(points) : null;
  const areaSquareInches = geometryType === "Polygon" && points.length >= 3 ? ringArea(points) : null;
  return {
    vertexCount: points.length,
    lengthInches,
    lengthFeet: lengthInches == null ? null : lengthInches / 12,
    areaSquareInches,
    areaSquareFeet: areaSquareInches == null ? null : areaSquareInches / 144
  };
}

/** Validate editable local geometry before committing any connected features. */
export function localSiteGeometryError(geometry) {
  const finite = (p) => Array.isArray(p) && p.length >= 2 && p.every(Number.isFinite);
  const same = (a, b) => a[0] === b[0] && a[1] === b[1];
  if (geometry?.type === "Point") return finite(geometry.coordinates) ? null : "Use finite coordinates.";
  if (geometry?.type === "LineString") {
    const points = geometry.coordinates;
    if (!Array.isArray(points) || points.length < 2 || !points.every(finite)) return "A path needs at least two finite points.";
    return points.some((p, i) => i && same(p, points[i - 1])) ? "Separate overlapping path vertices." : null;
  }
  if (geometry?.type !== "Polygon") return "This geometry type cannot be edited.";
  const rings = geometry.coordinates;
  if (!Array.isArray(rings) || !rings.length) return "An area needs a closed boundary.";
  const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const onSegment = (a, b, p) => cross(a, b, p) === 0
    && p[0] >= Math.min(a[0], b[0]) && p[0] <= Math.max(a[0], b[0])
    && p[1] >= Math.min(a[1], b[1]) && p[1] <= Math.max(a[1], b[1]);
  const intersects = (a, b, c, d) => {
    const abC = cross(a, b, c), abD = cross(a, b, d), cdA = cross(c, d, a), cdB = cross(c, d, b);
    return (Math.sign(abC) * Math.sign(abD) < 0 && Math.sign(cdA) * Math.sign(cdB) < 0)
      || onSegment(a, b, c) || onSegment(a, b, d) || onSegment(c, d, a) || onSegment(c, d, b);
  };
  for (const ring of rings) {
    if (!Array.isArray(ring) || ring.length < 4 || !ring.every(finite) || !same(ring[0], ring.at(-1))) return "An area needs at least three vertices and a closed boundary.";
    const n = ring.length - 1;
    for (let i = 0; i < n; i++) {
      if (same(ring[i], ring[i + 1])) return "Separate overlapping area vertices.";
      // Adjacent edges may share their endpoint, but may not double back.
      const previous = ring[(i + n - 1) % n], next = ring[i + 1];
      if (onSegment(previous, ring[i], next) || onSegment(ring[i], next, previous)) return "Area edges must not double back.";
      for (let j = i + 2; j < n; j++) {
        if (i === 0 && j === n - 1) continue;
        if (intersects(ring[i], ring[i + 1], ring[j], ring[j + 1])) return "Area edges must not cross or touch each other.";
      }
    }
    if (ringArea(ring) === 0) return "An area must enclose some space.";
  }
  const inside = (p, ring) => {
    let result = false;
    for (let i = 0; i < ring.length - 1; i++) {
      const a = ring[i], b = ring[i + 1];
      if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) result = !result;
    }
    return result;
  };
  for (let i = 1; i < rings.length; i++) {
    for (let j = 0; j < i; j++) {
      for (let a = 0; a < rings[i].length - 1; a++) {
        for (let b = 0; b < rings[j].length - 1; b++) {
          if (intersects(rings[i][a], rings[i][a + 1], rings[j][b], rings[j][b + 1])) return "Area holes must not touch or cross another boundary.";
        }
      }
      if (j > 0 && (inside(rings[i][0], rings[j]) || inside(rings[j][0], rings[i]))) return "Area holes must not overlap.";
    }
    if (!inside(rings[i][0], rings[0])) return "Keep area holes inside the outer boundary.";
  }
  return null;
}

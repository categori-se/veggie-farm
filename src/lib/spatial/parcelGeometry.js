function cloneCoordinates(value) {
  return Array.isArray(value) ? value.map(cloneCoordinates) : value;
}

function validPosition(position) {
  return Array.isArray(position)
    && position.length >= 2
    && Number.isFinite(position[0])
    && Number.isFinite(position[1]);
}

function validLinearRing(ring) {
  if (!Array.isArray(ring) || ring.length < 4 || !ring.every(validPosition)) return false;
  const first = ring[0];
  const last = ring.at(-1);
  return first[0] === last[0] && first[1] === last[1];
}

function validPolygonCoordinates(coordinates) {
  return Array.isArray(coordinates)
    && coordinates.length > 0
    && coordinates.every(validLinearRing);
}

/**
 * Normalize the two parcel encodings accepted by the studio.
 *
 * GeoJSON Polygon and MultiPolygon values are retained as their original type.
 * ArcGIS query responses expose Polygon rings as `{rings: [...]}` and continue
 * to receive the legacy conversion to GeoJSON Polygon. Unsupported types and
 * invalid MultiPolygon coordinate trees return null so callers can apply their
 * existing fallback policy explicitly.
 */
export function normalizeParcelGeometry(geometry) {
  if (!geometry || typeof geometry !== "object") return null;
  // Preserve the established Polygon/ArcGIS acceptance policy. Some search
  // services return open rings and the SVG renderer closes them at paint time.
  // MultiPolygon is new here and is accepted only when it is valid GeoJSON.
  if (geometry.type === "Polygon" && Array.isArray(geometry.coordinates)) {
    return {...geometry, coordinates: cloneCoordinates(geometry.coordinates)};
  }
  if (geometry.type === "MultiPolygon"
    && Array.isArray(geometry.coordinates)
    && geometry.coordinates.length > 0
    && geometry.coordinates.every(validPolygonCoordinates)) {
    return {...geometry, coordinates: cloneCoordinates(geometry.coordinates)};
  }
  if (Array.isArray(geometry.rings)) {
    return {type: "Polygon", coordinates: cloneCoordinates(geometry.rings)};
  }
  return null;
}

/**
 * Return one exterior ring per parcel part. Interior rings are deliberately
 * omitted: the planner's parcel outline and clipping contract is based on the
 * union of parcel exteriors, matching the previous Polygon `coordinates[0]`
 * behavior while extending it to every MultiPolygon part.
 */
export function parcelExteriorRings(geometry) {
  const normalized = normalizeParcelGeometry(geometry);
  if (!normalized) return [];
  if (normalized.type === "Polygon") {
    return Array.isArray(normalized.coordinates[0]) && normalized.coordinates[0].length
      ? [normalized.coordinates[0]]
      : [];
  }
  return normalized.coordinates.map((polygon) => polygon[0]);
}

export function flattenExteriorRings(rings = []) {
  return Array.isArray(rings)
    ? rings.flatMap((ring) => Array.isArray(ring) ? ring : [])
    : [];
}

function signedRingArea(ring) {
  if (!Array.isArray(ring) || ring.length < 3) return 0;
  let twiceArea = 0;
  for (let index = 0; index < ring.length; index += 1) {
    const current = ring[index];
    const next = ring[(index + 1) % ring.length];
    if (!validPosition(current) || !validPosition(next)) return 0;
    twiceArea += current[0] * next[1] - next[0] * current[1];
  }
  return twiceArea / 2;
}

/** Sum absolute planar areas so opposite ring winding cannot cancel parts. */
export function exteriorRingsArea(rings = []) {
  return (Array.isArray(rings) ? rings : [])
    .reduce((total, ring) => total + Math.abs(signedRingArea(ring)), 0);
}

const DEFAULT_CRS84 = "http://www.opengis.net/def/crs/OGC/1.3/CRS84";

function clone(value) {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function featureId(feature) {
  return String(feature?.id || feature?.properties?.id || "").trim();
}

function validPoint(point) {
  return Array.isArray(point)
    && point.length >= 2
    && Number.isFinite(point[0])
    && Number.isFinite(point[1]);
}

function pointOnSegment([x, y], [x1, y1], [x2, y2], epsilon = 1e-12) {
  const cross = (x - x1) * (y2 - y1) - (y - y1) * (x2 - x1);
  if (Math.abs(cross) > epsilon) return false;
  return x >= Math.min(x1, x2) - epsilon
    && x <= Math.max(x1, x2) + epsilon
    && y >= Math.min(y1, y2) - epsilon
    && y <= Math.max(y1, y2) + epsilon;
}

function ringLocation(point, ring) {
  if (!validPoint(point) || !Array.isArray(ring) || ring.length < 3) return "outside";
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const a = ring[previous];
    const b = ring[index];
    if (!validPoint(a) || !validPoint(b)) continue;
    if (pointOnSegment(point, a, b)) return "boundary";
    const crosses = (a[1] > point[1]) !== (b[1] > point[1]);
    if (crosses) {
      const crossingX = a[0] + ((point[1] - a[1]) * (b[0] - a[0])) / (b[1] - a[1]);
      if (point[0] < crossingX) inside = !inside;
    }
  }
  return inside ? "inside" : "outside";
}

/**
 * True when a CRS84 point is covered by a Polygon or MultiPolygon. Boundary
 * points count as covered so a source footprint centered on an assessor edge
 * is not made nondeterministic by floating-point rounding.
 */
export function geometryCoversPoint(geometry, point) {
  if (!geometry || !validPoint(point)) return false;
  if (geometry.type === "MultiPolygon") {
    return (geometry.coordinates || []).some((coordinates) => geometryCoversPoint({type: "Polygon", coordinates}, point));
  }
  if (geometry.type !== "Polygon") return false;
  const [outer, ...holes] = geometry.coordinates || [];
  const outerLocation = ringLocation(point, outer);
  if (outerLocation === "outside") return false;
  if (outerLocation === "boundary") return true;
  for (const hole of holes) {
    const holeLocation = ringLocation(point, hole);
    if (holeLocation === "inside") return false;
    if (holeLocation === "boundary") return true;
  }
  return true;
}

function ringArea(ring = []) {
  let twiceArea = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const a = ring[index];
    const b = ring[index + 1];
    if (validPoint(a) && validPoint(b)) twiceArea += a[0] * b[1] - b[0] * a[1];
  }
  return twiceArea / 2;
}

function ringCentroid(ring = []) {
  let twiceArea = 0;
  let x = 0;
  let y = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const a = ring[index];
    const b = ring[index + 1];
    if (!validPoint(a) || !validPoint(b)) continue;
    const cross = a[0] * b[1] - b[0] * a[1];
    twiceArea += cross;
    x += (a[0] + b[0]) * cross;
    y += (a[1] + b[1]) * cross;
  }
  if (Math.abs(twiceArea) < 1e-18) return null;
  return [x / (3 * twiceArea), y / (3 * twiceArea)];
}

function coordinateBounds(coordinates = []) {
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];
  const visit = (value) => {
    if (validPoint(value)) {
      bounds[0] = Math.min(bounds[0], value[0]);
      bounds[1] = Math.min(bounds[1], value[1]);
      bounds[2] = Math.max(bounds[2], value[0]);
      bounds[3] = Math.max(bounds[3], value[1]);
      return;
    }
    if (Array.isArray(value)) value.forEach(visit);
  };
  visit(coordinates);
  return bounds.every(Number.isFinite) ? bounds : null;
}

function polygonScanlinePoint(coordinates) {
  const bounds = coordinateBounds(coordinates);
  if (!bounds) return null;
  const [minX, minY, maxX, maxY] = bounds;
  const height = maxY - minY;
  const rings = coordinates || [];
  const candidateYs = [
    (minY + maxY) / 2,
    minY + height * 0.25,
    minY + height * 0.75,
    ...rings.flatMap((ring) => (ring || []).map((point) => point?.[1]).filter(Number.isFinite))
  ];
  const epsilon = Math.max(1e-12, height * 1e-9);
  let best = null;
  for (const rawY of candidateYs) {
    for (const y of [rawY, rawY - epsilon, rawY + epsilon]) {
      const intersections = [];
      for (const ring of rings) {
        for (let index = 0; index < (ring?.length || 0) - 1; index += 1) {
          const a = ring[index];
          const b = ring[index + 1];
          if (!validPoint(a) || !validPoint(b) || a[1] === b[1]) continue;
          if (y < Math.min(a[1], b[1]) || y >= Math.max(a[1], b[1])) continue;
          intersections.push(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
        }
      }
      intersections.sort((a, b) => a - b);
      for (let index = 0; index < intersections.length - 1; index += 1) {
        const x1 = intersections[index];
        const x2 = intersections[index + 1];
        const point = [(x1 + x2) / 2, y];
        const width = x2 - x1;
        if (width > (best?.width || -Infinity) && geometryCoversPoint({type: "Polygon", coordinates}, point)) {
          best = {point, width};
        }
      }
    }
  }
  return best?.point || [(minX + maxX) / 2, (minY + maxY) / 2];
}

function polygonRepresentativePoint(coordinates) {
  const geometry = {type: "Polygon", coordinates};
  const centroid = ringCentroid(coordinates?.[0]);
  if (centroid && geometryCoversPoint(geometry, centroid)) return centroid;
  const point = polygonScanlinePoint(coordinates);
  if (point && geometryCoversPoint(geometry, point)) return point;
  return coordinates?.[0]?.find(validPoint) || null;
}

function lineRepresentativePoint(coordinates = []) {
  const segments = [];
  let total = 0;
  for (let index = 0; index < coordinates.length - 1; index += 1) {
    const a = coordinates[index];
    const b = coordinates[index + 1];
    if (!validPoint(a) || !validPoint(b)) continue;
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    segments.push({a, b, length});
    total += length;
  }
  if (!segments.length) return coordinates.find(validPoint) || null;
  let remaining = total / 2;
  for (const {a, b, length} of segments) {
    if (remaining <= length) {
      const ratio = length ? remaining / length : 0;
      return [a[0] + (b[0] - a[0]) * ratio, a[1] + (b[1] - a[1]) * ratio];
    }
    remaining -= length;
  }
  return segments.at(-1).b.slice(0, 2);
}

/** Return a deterministic point on or within a supported GeoJSON geometry. */
export function representativePoint(geometry) {
  if (!geometry) return null;
  if (geometry.type === "Point") return validPoint(geometry.coordinates) ? geometry.coordinates.slice(0, 2) : null;
  if (geometry.type === "MultiPoint") return (geometry.coordinates || []).find(validPoint)?.slice(0, 2) || null;
  if (geometry.type === "LineString") return lineRepresentativePoint(geometry.coordinates);
  if (geometry.type === "MultiLineString") {
    const line = [...(geometry.coordinates || [])].sort((a, b) => {
      const length = (value) => value.slice(1).reduce((sum, point, index) => sum + Math.hypot(point[0] - value[index][0], point[1] - value[index][1]), 0);
      return length(b) - length(a);
    })[0];
    return line ? lineRepresentativePoint(line) : null;
  }
  if (geometry.type === "Polygon") return polygonRepresentativePoint(geometry.coordinates);
  if (geometry.type === "MultiPolygon") {
    const polygon = [...(geometry.coordinates || [])].sort((a, b) => Math.abs(ringArea(b?.[0])) - Math.abs(ringArea(a?.[0])))[0];
    return polygon ? polygonRepresentativePoint(polygon) : null;
  }
  return null;
}

function sourceSnapshot(collection, options) {
  const properties = collection.properties || {};
  const value = {
    file: options.snapshotFile || null,
    savedAt: properties.savedAt || null,
    retrievedAt: properties.retrievedAt || null,
    queryFingerprint: properties.queryFingerprint || null,
    queryBbox: properties.queryBbox || collection.bbox || null
  };
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item != null));
}

/**
 * Select provider features by representative-point membership in canonical
 * parcel polygons. The returned collection remains provider geometry: this is
 * a reviewable promotion boundary, not a geometric clip or union operation.
 */
export function selectSourceFeaturesWithinParcels(sourceCollection, parcelCollection, options = {}) {
  if (sourceCollection?.type !== "FeatureCollection") throw new TypeError("sourceCollection must be a FeatureCollection");
  if (parcelCollection?.type !== "FeatureCollection") throw new TypeError("parcelCollection must be a FeatureCollection");
  const parcels = (parcelCollection.features || []).filter((feature) => ["Polygon", "MultiPolygon"].includes(feature.geometry?.type));
  const sourceId = String(options.sourceId || sourceCollection.properties?.sourceId || "").trim();
  if (!sourceId) throw new TypeError("sourceCollection.properties.sourceId or options.sourceId is required");
  const snapshot = sourceSnapshot(sourceCollection, options);
  const features = [];
  for (const original of sourceCollection.features || []) {
    const point = representativePoint(original.geometry);
    if (!point) continue;
    const matches = parcels.filter((parcel) => geometryCoversPoint(parcel.geometry, point));
    if (!matches.length) continue;
    matches.sort((a, b) => featureId(a).localeCompare(featureId(b)));
    const parcel = matches[0];
    const originalProperties = original.properties || {};
    const sourceFeatureId = String(originalProperties.sourceFeatureId || featureId(original)).trim();
    features.push({
      ...clone(original),
      properties: {
        ...clone(originalProperties),
        parcelId: featureId(parcel),
        sourceFeatureId,
        provenance: {
          ...clone(originalProperties.provenance || {}),
          sourceId,
          sourceFeatureId,
          sourceEndpoint: sourceCollection.properties?.sourceEndpoint || null,
          sourceSnapshot: snapshot,
          selectionMethod: "representative point within canonical parcel polygon",
          representativePoint: point,
          parcelFeatureId: featureId(parcel)
        }
      }
    });
  }
  return {
    type: "FeatureCollection",
    properties: {
      ...clone(sourceCollection.properties || {}),
      coordinateReferenceSystem: sourceCollection.properties?.coordinateReferenceSystem || DEFAULT_CRS84,
      parcelClipped: false,
      selectionMethod: "representative point within canonical parcel polygon",
      selectedFromCount: (sourceCollection.features || []).length,
      selectedFeatureCount: features.length,
      parcelFeatureIds: parcels.map(featureId).sort()
    },
    features
  };
}

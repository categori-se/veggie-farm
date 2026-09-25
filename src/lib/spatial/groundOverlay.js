import {lonLatToLocalPoint} from "./gardenSpatial.js";

function finite(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new TypeError(`${label} must be a finite number`);
  return number;
}

/** Normalize the KML 2.2 LatLonBox representation retained by our KMZ import. */
export function normalizeGroundOverlay(overlay = {}) {
  const box = overlay.latLonBox || overlay.LatLonBox || overlay;
  const north = finite(box.north, "north");
  const south = finite(box.south, "south");
  const east = finite(box.east, "east");
  const west = finite(box.west, "west");
  if (north <= south) throw new RangeError("north must be greater than south");
  if (east <= west) throw new RangeError("east must be greater than west");
  if ([north, south].some((latitude) => latitude < -90 || latitude > 90)) {
    throw new RangeError("overlay latitude is outside CRS84 bounds");
  }
  if ([east, west].some((longitude) => longitude < -180 || longitude > 180)) {
    throw new RangeError("overlay longitude is outside CRS84 bounds");
  }
  return {
    id: String(overlay.id || "ground-overlay"),
    name: String(overlay.name || "Reference overlay"),
    href: overlay.href || overlay.localHref || null,
    north,
    south,
    east,
    west,
    rotation: Number(box.rotation) || 0,
    opacity: Math.max(0, Math.min(1, Number(overlay.opacity) || 0.45)),
    provenance: overlay.provenance && typeof overlay.provenance === "object"
      ? structuredClone(overlay.provenance)
      : null
  };
}

/**
 * Return an SVG-local frame for a KML GroundOverlay. KML rotation is positive
 * counter-clockwise in geographic space; SVG's south-positive y axis reverses
 * that sign. Geometry remains north-up CRS84—the rotation is presentation only.
 */
export function groundOverlayLocalFrame(overlay, property) {
  const normalized = normalizeGroundOverlay(overlay);
  const northwest = lonLatToLocalPoint([normalized.west, normalized.north], property);
  const southeast = lonLatToLocalPoint([normalized.east, normalized.south], property);
  const center = lonLatToLocalPoint([
    (normalized.west + normalized.east) / 2,
    (normalized.north + normalized.south) / 2
  ], property);
  return {
    ...normalized,
    x: northwest[0],
    y: northwest[1],
    width: southeast[0] - northwest[0],
    height: southeast[1] - northwest[1],
    center,
    svgRotation: -normalized.rotation
  };
}

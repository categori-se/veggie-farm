const INCHES_PER_FOOT = 12;

function positiveNumber(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function normalizedDegrees(value) {
  const degrees = Number(value) || 0;
  return ((degrees % 360) + 360) % 360;
}

/**
 * Return the derived local rendering axes for a canonical tree-center Point.
 * The Point is the stored geometry; crown axes are measured attributes and may
 * be revised independently after field or lidar work.
 */
export function treeCrownAxesInches(tree = {}) {
  const diameterFeet = positiveNumber(tree.crownDiameterFeet);
  const widthFeet = positiveNumber(
    tree.crownWidthFeet,
    positiveNumber(tree.crownRadiusEastWestFeet) != null
      ? tree.crownRadiusEastWestFeet * 2
      : diameterFeet
  );
  const depthFeet = positiveNumber(
    tree.crownDepthFeet,
    positiveNumber(tree.crownRadiusNorthSouthFeet) != null
      ? tree.crownRadiusNorthSouthFeet * 2
      : diameterFeet
  );
  return {
    width: positiveNumber(widthFeet && widthFeet * INCHES_PER_FOOT, positiveNumber(tree.width, 36)),
    height: positiveNumber(depthFeet && depthFeet * INCHES_PER_FOOT, positiveNumber(tree.height, 36))
  };
}

export function derivedTreeCanopyEllipse(tree = {}) {
  const axes = treeCrownAxesInches(tree);
  return {
    cx: Number(tree.x) || 0,
    cy: Number(tree.y) || 0,
    rx: axes.width / 2,
    ry: axes.height / 2,
    rotationDegrees: Number(tree.rotation ?? tree.crownAxisRotationDegrees) || 0,
    derivedFrom: "tree-center point and crown-axis attributes"
  };
}

/**
 * Estimate the ground shadow vector in the planner's east-positive,
 * south-positive local plane. Solar azimuth is clockwise from north. This is a
 * planning estimate only: terrain, crown porosity, seasonal foliage, and local
 * obstructions are deliberately outside this small deterministic model.
 */
export function deriveTreeShadowVector(tree = {}, {
  solarAzimuthDegrees,
  solarAltitudeDegrees
} = {}) {
  const heightFeet = positiveNumber(tree.heightEstimateFeet);
  const altitude = Number(solarAltitudeDegrees);
  const azimuth = Number(solarAzimuthDegrees);
  if (heightFeet == null || !Number.isFinite(altitude) || !Number.isFinite(azimuth) || altitude <= 0 || altitude > 90) {
    return null;
  }
  const lengthFeet = heightFeet / Math.tan(altitude * Math.PI / 180);
  const bearingDegrees = normalizedDegrees(azimuth + 180);
  const radians = bearingDegrees * Math.PI / 180;
  return {
    estimatedHeightFeet: heightFeet,
    heightConfidence: tree.heightConfidence || "unknown",
    solarAzimuthDegrees: normalizedDegrees(azimuth),
    solarAltitudeDegrees: altitude,
    bearingDegrees,
    lengthFeet,
    dxInches: Math.sin(radians) * lengthFeet * INCHES_PER_FOOT,
    dyInches: -Math.cos(radians) * lengthFeet * INCHES_PER_FOOT,
    method: "flat-ground height / tan(solar altitude) planning estimate"
  };
}

/** Legacy visual ellipse; not a containment bound. Use derivedTreeShadowPolygon for shade overlays. */
export function derivedTreeShadowEllipse(tree = {}, solar = {}) {
  const vector = deriveTreeShadowVector(tree, solar);
  if (!vector) return null;
  const canopy = derivedTreeCanopyEllipse(tree);
  const lengthInches = vector.lengthFeet * INCHES_PER_FOOT;
  return {
    cx: canopy.cx + vector.dxInches / 2,
    cy: canopy.cy + vector.dyInches / 2,
    rx: Math.max(canopy.rx, canopy.ry) + lengthInches / 2,
    ry: Math.min(canopy.rx, canopy.ry),
    // SVG/local-plan rotation is clockwise from the east-positive x axis.
    rotationDegrees: vector.bearingDegrees - 90,
    vector,
    derivedFrom: "tree-center point, crown axes, estimated height, and supplied sun position"
  };
}


/** Apply an optional user height estimate; a blank field restores unknown. */
export function updateTreeHeightEstimate(tree, input) {
  const blank = input == null || String(input).trim() === "";
  const value = blank ? null : Number(input);
  if (!blank && (!Number.isFinite(value) || value <= 0)) return false;
  tree.heightEstimateFeet = value;
  tree.heightEstimateRangeFeet = null;
  tree.heightEstimateMethod = blank ? null : "User-entered estimate; not independently measured";
  tree.heightConfidence = blank ? "unknown" : "low";
  return true;
}

/**
 * Flat-ground shadow of an opaque column with the entered elliptical crown.
 * The hull sweeps that crown from ground to entered top height. This is a
 * deliberately full column, not a model of branches, crown base or leaf gaps.
 * A circumscribed 48-gon covers the analytic ellipse (radial excess <0.22%);
 * applying the crown's rotation before projection preserves its actual axes.
 */
export function derivedTreeShadowPolygon(tree = {}, solar = {}) {
  const vector = deriveTreeShadowVector(tree, solar);
  if (!vector) return null;
  const crown = derivedTreeCanopyEllipse(tree);
  const segments = 48, scale = 1 / Math.cos(Math.PI / segments);
  const angle = crown.rotationDegrees * Math.PI / 180;
  const points = [];
  for (let i = 0; i < segments; i++) {
    const t = 2 * Math.PI * i / segments;
    const x = crown.rx * scale * Math.cos(t), y = crown.ry * scale * Math.sin(t);
    const p = [crown.cx + x * Math.cos(angle) - y * Math.sin(angle), crown.cy + x * Math.sin(angle) + y * Math.cos(angle)];
    points.push(p, [p[0] + vector.dxInches, p[1] + vector.dyInches]);
  }
  if (!points.every(p => p.every(Number.isFinite))) return null;
  points.sort((a,b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o,a,b) => (a[0]-o[0])*(b[1]-o[1]) - (a[1]-o[1])*(b[0]-o[0]);
  const half = rows => {const out=[]; for (const p of rows) {while(out.length>1 && cross(out.at(-2),out.at(-1),p)<=0) out.pop(); out.push(p);}return out;};
  const lower=half(points),upper=half([...points].reverse());lower.pop();upper.pop();
  return {points:lower.concat(upper),vector,derivedFrom:'rotated elliptical crown swept through an opaque column to entered height'};
}

export const MIN_GARDEN_VIEW_SPAN_INCHES = 24;

const DEFAULT_MIDDLE_TIER_BOUNDARY_INCHES_PER_PIXEL = 12;
const MIN_MIDDLE_TIER_BOUNDARY_INCHES_PER_PIXEL = 8;
const MAX_MIDDLE_TIER_BOUNDARY_INCHES_PER_PIXEL = 16;

export const GARDEN_DETAIL_LEVELS = Object.freeze([
  Object.freeze({
    id: "estate",
    label: "Estate",
    minimumInchesPerPixel: 48,
    plantMode: "point",
    threePlantMode: "point",
    showBedGrid: false,
    showLabels: "selected"
  }),
  Object.freeze({
    id: "parcel",
    label: "Parcel",
    minimumInchesPerPixel: 12,
    plantMode: "point",
    threePlantMode: "point",
    showBedGrid: false,
    showLabels: "sparse"
  }),
  Object.freeze({
    id: "garden",
    label: "Garden",
    minimumInchesPerPixel: 3,
    plantMode: "swatch",
    threePlantMode: "swatch",
    showBedGrid: false,
    showLabels: "named"
  }),
  Object.freeze({
    id: "bed",
    label: "Bed",
    minimumInchesPerPixel: 0.75,
    plantMode: "silhouette",
    threePlantMode: "model",
    showBedGrid: true,
    showLabels: "all"
  }),
  Object.freeze({
    id: "plant",
    label: "Plant",
    minimumInchesPerPixel: 0,
    plantMode: "botanical",
    threePlantMode: "model",
    showBedGrid: true,
    showLabels: "all"
  })
]);

function finitePositive(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function finiteCount(value) {
  if (Array.isArray(value)) return value.length;
  if (value instanceof Set || value instanceof Map) return value.size;
  return Math.max(0, finiteNumber(value));
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

export function groundResolutionInches(viewport = {}, screen = {}) {
  const width = finitePositive(viewport.width, MIN_GARDEN_VIEW_SPAN_INCHES);
  const height = finitePositive(viewport.height, MIN_GARDEN_VIEW_SPAN_INCHES);
  const pixelsWide = finitePositive(screen.width, 960);
  const pixelsHigh = finitePositive(screen.height, 640);
  // The limiting dimension controls SVG meet-scaling and the Three camera fit.
  // Using it keeps the LOD tier consistent across panels with different aspect.
  return Math.max(width / pixelsWide, height / pixelsHigh);
}

/**
 * Move only the parcel/garden boundary when the visible information strongly
 * favors one of those readings. The outer estate, bed, and plant thresholds
 * stay fixed, so a changing feature count cannot make the view jump several
 * semantic levels while panning.
 *
 * Callers may provide:
 * - `informationFocus`: plant, bed, garden, site, parcel, estate, or forest;
 * - `featureCounts`: visible counts keyed by plants, beds, structures, paths,
 *   roads, barriers, utilities, water, landscape, vegetation, and forests.
 *
 * Logarithmic counts are intentional. A filled bed may contain hundreds of
 * placements, but that should not erase the informational value of a handful
 * of roads, structures, or woodland compartments.
 */
export function middleTierBoundaryInchesPerPixel(context = {}) {
  const focus = String(context.informationFocus || context.information || context.focus || "").toLowerCase();
  const detailedFocus = ["plant", "plants", "bed", "beds", "garden", "flowers", "vegetables"].includes(focus);
  const broadFocus = ["site", "parcel", "estate", "forest", "forestry", "utilities"].includes(focus);
  let adjustment = detailedFocus ? 3 : broadFocus ? -3 : 0;

  // Accept either an explicit counts bag or the context object itself. Arrays,
  // Sets, and Maps are treated as their sizes so a renderer can pass its already
  // filtered visible collections without first reducing them to numbers.
  const counts = context.featureCounts || context.counts || context;
  const gardenInformation = Math.log1p(finiteCount(counts.plants ?? counts.plant))
    + 1.35 * Math.log1p(finiteCount(counts.beds ?? counts.bed));
  const siteInformation = Math.log1p(finiteCount(counts.structures ?? counts.structure))
    + Math.log1p(finiteCount(counts.paths ?? counts.path) + finiteCount(counts.roads ?? counts.road))
    + Math.log1p(finiteCount(counts.barriers ?? counts.barrier))
    + Math.log1p(finiteCount(counts.utilities ?? counts.utility))
    + Math.log1p(finiteCount(counts.water))
    + Math.log1p(finiteCount(counts.landscape))
    + Math.log1p(finiteCount(counts.vegetation))
    + 1.35 * Math.log1p(finiteCount(counts.forests ?? counts.forest));
  const informationTotal = gardenInformation + siteInformation;
  if (informationTotal > 0) {
    adjustment += 2 * (gardenInformation - siteInformation) / informationTotal;
  }

  return clamp(
    DEFAULT_MIDDLE_TIER_BOUNDARY_INCHES_PER_PIXEL + adjustment,
    MIN_MIDDLE_TIER_BOUNDARY_INCHES_PER_PIXEL,
    MAX_MIDDLE_TIER_BOUNDARY_INCHES_PER_PIXEL
  );
}

export function gardenViewProfile(viewport = {}, screen = {}, context = {}) {
  const inchesPerPixel = groundResolutionInches(viewport, screen);
  const middleTierBoundary = middleTierBoundaryInchesPerPixel(context);
  const level = GARDEN_DETAIL_LEVELS.find((candidate) => {
    const threshold = candidate.id === "parcel" ? middleTierBoundary : candidate.minimumInchesPerPixel;
    return inchesPerPixel >= threshold;
  })
    || GARDEN_DETAIL_LEVELS.at(-1);
  return {
    ...level,
    inchesPerPixel,
    visibleWidthFeet: finiteCount(viewport.width) / 12,
    visibleHeightFeet: finiteCount(viewport.height) / 12,
    middleTierBoundaryInchesPerPixel: middleTierBoundary,
    contextAdapted: middleTierBoundary !== DEFAULT_MIDDLE_TIER_BOUNDARY_INCHES_PER_PIXEL
  };
}

export function gardenViewProfileForElement(viewport, element, context = {}) {
  const rect = element?.getBoundingClientRect?.() || {};
  return gardenViewProfile(viewport, {width: rect.width, height: rect.height}, context);
}

export function clampViewportToExtent(viewport = {}, extent = {}, options = {}) {
  const minimumSpan = finitePositive(options.minimumSpan, MIN_GARDEN_VIEW_SPAN_INCHES);
  const extentWidth = finitePositive(extent.width, minimumSpan);
  const extentHeight = finitePositive(extent.height, minimumSpan);
  const requestedWidth = finitePositive(viewport.width, extentWidth);
  const requestedHeight = finitePositive(viewport.height, extentHeight);

  // Clamp with one scale so zoom never changes the view aspect. This matters to
  // synchronization: independent width/height floors produce different Map,
  // 2D, and perspective-camera extents at home-garden detail.
  const minimumScale = Math.max(minimumSpan / requestedWidth, minimumSpan / requestedHeight);
  const maximumScale = Math.min(extentWidth / requestedWidth, extentHeight / requestedHeight);
  // A very narrow extent may make the absolute floor impossible at the
  // requested aspect. In that case fitting inside the extent takes priority;
  // otherwise both dimensions honor the 24-inch floor.
  const scale = minimumScale <= maximumScale
    ? clamp(1, minimumScale, maximumScale)
    : maximumScale;
  const width = requestedWidth * scale;
  const height = requestedHeight * scale;

  const extentX = finiteNumber(extent.x);
  const extentY = finiteNumber(extent.y);
  const requestedX = finiteNumber(viewport.x, extentX);
  const requestedY = finiteNumber(viewport.y, extentY);
  // Optional navigation margin lets a fitted parcel move under the pointer,
  // while retaining at least half a viewport of overlap with the garden extent.
  const margin = clamp(finiteNumber(options.panPaddingRatio), 0, 0.5);
  const x = clamp(requestedX, extentX - width * margin, extentX + extentWidth - width + width * margin);
  const y = clamp(requestedY, extentY - height * margin, extentY + extentHeight - height + height * margin);
  return {x, y, width, height};
}

export function fitViewportToBounds(target = {}, aspect = 1, options = {}) {
  const padding = Math.max(0, Number(options.paddingRatio ?? 0.16));
  const minimumSpan = finitePositive(options.minimumSpan, MIN_GARDEN_VIEW_SPAN_INCHES);
  const targetWidth = finitePositive(target.width, minimumSpan) * (1 + padding * 2);
  const targetHeight = finitePositive(target.height, minimumSpan) * (1 + padding * 2);
  const viewAspect = finitePositive(aspect, targetWidth / targetHeight);
  // Apply the absolute floor to both axes. `minimumSpan * viewAspect` alone is
  // insufficient for portrait views, where it can leave the width below 24 in.
  let width = Math.max(targetWidth, targetHeight * viewAspect, minimumSpan, minimumSpan * viewAspect);
  let height = width / viewAspect;
  if (height < targetHeight) {
    height = targetHeight;
    width = height * viewAspect;
  }
  const centerX = finiteNumber(target.x) + finiteCount(target.width) / 2;
  const centerY = finiteNumber(target.y) + finiteCount(target.height) / 2;
  return {x: centerX - width / 2, y: centerY - height / 2, width, height};
}

function niceNumberAtOrBelow(value) {
  if (!(value > 0)) return 1;
  const exponent = Math.floor(Math.log10(value));
  const magnitude = 10 ** exponent;
  const normalized = value / magnitude;
  const step = normalized >= 5 ? 5 : normalized >= 2 ? 2 : 1;
  return step * magnitude;
}

export function formatGroundDistance(inches) {
  if (inches < 12) return `${Math.max(1, Math.round(inches))} in`;
  const feet = inches / 12;
  if (feet < 5280) return `${feet >= 10 ? Math.round(feet) : Math.round(feet * 10) / 10} ft`;
  const miles = feet / 5280;
  return `${miles >= 10 ? Math.round(miles) : Math.round(miles * 10) / 10} mi`;
}

export function scaleBarForView(viewport, screen = {}, targetPixels = 110) {
  const resolution = groundResolutionInches(viewport, screen);
  const distanceInches = niceNumberAtOrBelow(resolution * finitePositive(targetPixels, 110));
  return {
    distanceInches,
    pixels: distanceInches / resolution,
    label: formatGroundDistance(distanceInches)
  };
}

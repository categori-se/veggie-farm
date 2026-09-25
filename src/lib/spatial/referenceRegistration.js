import {
  applySimilarityTransform,
  fitSimilarityTransform,
  localPointToXyzRasterPixel,
  xyzRasterPixelToLonLat
} from "./gisAlignment.js";
import {lonLatToLocalPoint} from "./gardenSpatial.js";

const validPixel = (p) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite);

/** Register an illustrated reference without treating its drawing as surveyed geometry.
 * Fit controls and withheld checks are intentionally separate. Source units are
 * pixels; the fitted transform outputs garden-local inches (east/south).
 */
export function registerReferenceLandmarks(controls, property) {
  if (!Array.isArray(controls) || controls.some(c => !c.id || !validPixel(c.sourcePixel)
    || !validPixel(c.targetLonLat) || !["fit", "check"].includes(c.role))) {
    throw new TypeError("Each control needs an ID, finite source pixels/target longitude-latitude pairs and a fit/check role.");
  }
  if (new Set(controls.map(c => c.id)).size !== controls.length) throw new Error("Control IDs must be unique.");
  const fitted = controls.filter(c => c.role === "fit");
  if (fitted.length < 3) throw new RangeError("Use at least three fit landmarks spread across the reference.");
  if (!controls.some(c => c.role === "check")) throw new RangeError("Reserve at least one landmark as a separate check.");
  // Collinear anchors cannot establish that a two-dimensional illustration fits.
  const [a, b] = fitted.map(c => c.sourcePixel);
  if (!fitted.some(({sourcePixel: c}) => Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])) > 1e-6)) {
    throw new RangeError("Fit landmarks must include three non-collinear source positions.");
  }
  const transform = fitSimilarityTransform(fitted.map(c => ({
    id: c.id, sourceLocal: c.sourcePixel,
    targetLonLat: c.targetLonLat
  })), property);
  if (!(transform.scale > 1e-9)) throw new RangeError("Target landmarks must span a real area.");
  const landmarks = controls.map(c => {
    const observedLocal = lonLatToLocalPoint(c.targetLonLat, property);
    const fittedLocal = applySimilarityTransform(c.sourcePixel, transform);
    return {...structuredClone(c), observedLocal, fittedLocal,
      errorFeet: Math.hypot(observedLocal[0]-fittedLocal[0], observedLocal[1]-fittedLocal[1])/12};
  });
  return {model: "similarity", sourceUnit: "pixel", targetUnit: "garden-local-inch",
    transform, landmarks,
    checkMaxErrorFeet: Math.max(...landmarks.filter(c => c.role === "check").map(c => c.errorFeet)),
    status: "Reference interpretation only; residuals do not establish survey accuracy"};
}

export function registerGardenReference(observations, raster, property) {
  if (!Array.isArray(observations?.controls) || observations.controls.some(c => !validPixel(c.targetPixel))) {
    throw new TypeError("Each control needs finite target raster pixels.");
  }
  const result = registerReferenceLandmarks(observations.controls.map(c => ({...c,
    targetLonLat: xyzRasterPixelToLonLat(c.targetPixel, raster)
  })), property);
  const {transform} = result;
  // A local affine approximation is only for drawing a small-campus review image.
  // Residuals above use the geographic conversion directly.
  const pixel = point => localPointToXyzRasterPixel(applySimilarityTransform(point, transform), raster, property);
  const origin = pixel([0, 0]), east = pixel([1, 0]), south = pixel([0, 1]);
  return {...result,
    landmarks: result.landmarks.map(c => ({...c, fittedPixel: localPointToXyzRasterPixel(c.fittedLocal, raster, property)})),
    previewMatrix: [east[0]-origin[0], east[1]-origin[1], south[0]-origin[0], south[1]-origin[1], ...origin]};
}

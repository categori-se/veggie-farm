#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import {fileURLToPath} from "node:url";

import {
  GIS_ALIGNMENT_SCHEMA_VERSION,
  directObservationDiagnostics,
  fitSimilarityTransform,
  localPointToXyzRasterPixel,
  parcelImageryCoverage,
  transformGardenLayout
} from "../src/lib/spatial/gisAlignment.js";
import {
  DEFAULT_BEDS,
  DEFAULT_VEGETATION,
  PROPERTY_CONTEXT,
  PROPERTY_STRUCTURES
} from "../src/data/propertyContext.js";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultCalibrationDirectory = path.join(repositoryRoot, "data/spatial/calibrations");
const gardenItemsPath = path.join(repositoryRoot, "src/data/api/v1/collections/gardens/items.json");
const canonicalGardenFeatures = JSON.parse(fs.readFileSync(gardenItemsPath, "utf8")).features;

function canonicalGardenReference(id) {
  const feature = canonicalGardenFeatures.find((candidate) => candidate.id === id);
  return feature ? {id: feature.id, ...feature.properties, geometry: feature.geometry, bbox: feature.bbox} : null;
}

function usage() {
  console.log(`Usage:
  npm run spatial:align
  npm run spatial:align -- --input data/spatial/calibrations/garden.json --check
  npm run spatial:align -- --input calibration.json --apply-layout draft-layout.json --output aligned-layout.json

Without --input, every JSON manifest in data/spatial/calibrations is checked.
--check makes any provenance, residual, revision, feature, or imagery-budget issue fail the command.
--report writes a machine-readable diagnostics file; ordinary validation does not modify files.`);
}

function parseArguments(argv) {
  const options = {inputs: [], check: false, report: null, applyLayout: null, output: null};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") options.help = true;
    else if (argument === "--check") options.check = true;
    else if (argument === "--input") options.inputs.push(argv[++index]);
    else if (argument === "--report") options.report = argv[++index];
    else if (argument === "--apply-layout") options.applyLayout = argv[++index];
    else if (argument === "--output") options.output = argv[++index];
    else throw new Error(`Unknown argument: ${argument}`);
  }
  if (options.applyLayout && (!options.output || options.inputs.length !== 1)) {
    throw new Error("--apply-layout needs exactly one --input and one --output path.");
  }
  return options;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function resolveInput(filePath) {
  return path.resolve(repositoryRoot, filePath);
}

function defaultInputs() {
  if (!fs.existsSync(defaultCalibrationDirectory)) return [];
  return fs.readdirSync(defaultCalibrationDirectory)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => path.join(defaultCalibrationDirectory, name));
}

function pointsEqual(first, second, epsilon = 1e-10) {
  return Array.isArray(first) && Array.isArray(second)
    && Math.abs(Number(first[0]) - Number(second[0])) <= epsilon
    && Math.abs(Number(first[1]) - Number(second[1])) <= epsilon;
}

function pointInRing(point, ring) {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const [xi, yi] = ring[index];
    const [xj, yj] = ring[previous];
    const crosses = (yi > point[1]) !== (yj > point[1])
      && point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

function pointInGeometry(point, geometry) {
  const polygons = geometry?.type === "Polygon"
    ? [geometry.coordinates]
    : geometry?.type === "MultiPolygon"
    ? geometry.coordinates
    : [];
  return polygons.some((rings) => pointInRing(point, rings[0])
    && !rings.slice(1).some((hole) => pointInRing(point, hole)));
}

function canonicalLayout(reference) {
  if (reference.id === PROPERTY_CONTEXT.id) {
    return {
      beds: DEFAULT_BEDS,
      structures: PROPERTY_STRUCTURES,
      vegetation: DEFAULT_VEGETATION,
      placements: []
    };
  }
  return reference.starterLayout || {beds: [], structures: [], vegetation: [], placements: []};
}

function featureIndex(layout) {
  return new Map(["beds", "structures", "vegetation"]
    .flatMap((collection) => (layout[collection] || []).map((feature) => [feature.id, feature])));
}

function basicManifestIssues(manifest) {
  const issues = [];
  if (manifest.schemaVersion !== GIS_ALIGNMENT_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${GIS_ALIGNMENT_SCHEMA_VERSION}`);
  }
  if (!manifest.gardenId) issues.push("gardenId is required");
  if (!Number.isInteger(manifest.calibrationRevision) || manifest.calibrationRevision < 1) {
    issues.push("calibrationRevision must be a positive integer");
  }
  if (!["direct-observation", "similarity"].includes(manifest.method)) {
    issues.push("method must be direct-observation or similarity");
  }
  if (!Array.isArray(manifest.origin) || manifest.origin.length !== 2 || !manifest.origin.every(Number.isFinite)) {
    issues.push("origin must be CRS84 [longitude, latitude]");
  }
  if (manifest.localCoordinateSystem?.unit !== "inch"
    || manifest.localCoordinateSystem?.xAxis !== "east"
    || manifest.localCoordinateSystem?.yAxis !== "south") {
    issues.push("localCoordinateSystem must be inch / east / south");
  }
  const minimumPoints = manifest.method === "similarity" ? 2 : 1;
  if (!Array.isArray(manifest.controlPoints) || manifest.controlPoints.length < minimumPoints) {
    issues.push(`${manifest.method} needs at least ${minimumPoints} control point(s)`);
  }
  if (!Array.isArray(manifest.sources) || !manifest.sources.length) issues.push("at least one source is required");
  for (const source of manifest.sources || []) {
    if (!source.id || !source.role || !/^https:\/\//.test(source.url || "")) {
      issues.push("every source needs an id, role, and HTTPS URL");
      break;
    }
  }
  const sourceIds = new Set((manifest.sources || []).map(({id}) => id));
  const rasterIds = (manifest.digitizationRasters || []).map(({id}) => id);
  const rasterIdSet = new Set(rasterIds);
  if (new Set(rasterIds).size !== rasterIds.length || rasterIds.some((id) => !id)) {
    issues.push("digitization raster IDs must be present and unique");
  }
  for (const raster of manifest.digitizationRasters || []) {
    const twoFiniteNumbers = (value) => Array.isArray(value)
      && value.length === 2
      && value.every(Number.isFinite);
    if (!sourceIds.has(raster.sourceId)) issues.push(`digitization raster ${raster.id} references an unknown source`);
    if (!Number.isInteger(raster.zoom) || raster.zoom < 0 || raster.zoom > 23) {
      issues.push(`digitization raster ${raster.id} has an invalid XYZ zoom`);
    }
    if (!twoFiniteNumbers(raster.tileOrigin)) issues.push(`digitization raster ${raster.id} needs a two-number tileOrigin`);
    if (!twoFiniteNumbers(raster.pixelSize) || raster.pixelSize.some((value) => value <= 0)) {
      issues.push(`digitization raster ${raster.id} needs a positive pixelSize`);
    }
    if (!Number.isInteger(raster.tileSize) || raster.tileSize <= 0) {
      issues.push(`digitization raster ${raster.id} needs a positive integer tileSize`);
    }
    // Geographic tracing stays north-up. A temporary operator/browser bearing
    // belongs to view state and must never be baked into canonical geometry.
    if (Number(raster.rotationDegrees) !== 0) {
      issues.push(`digitization raster ${raster.id} must be north-up (rotationDegrees 0)`);
    }
  }
  if (!Array.isArray(manifest.assumptions) || !manifest.assumptions.length) issues.push("alignment assumptions are required");
  const pointIds = (manifest.controlPoints || []).map((point) => point.id);
  if (new Set(pointIds).size !== pointIds.length || pointIds.some((id) => !id)) {
    issues.push("control point IDs must be present and unique");
  }
  for (const point of manifest.controlPoints || []) {
    const hasRaster = Boolean(point.digitizationRasterId);
    const hasPixel = Array.isArray(point.sourcePixel);
    if (hasRaster !== hasPixel) {
      issues.push(`control point ${point.id} must provide digitizationRasterId and sourcePixel together`);
    } else if (hasRaster && !rasterIdSet.has(point.digitizationRasterId)) {
      issues.push(`control point ${point.id} references unknown digitization raster ${point.digitizationRasterId}`);
    }
  }
  return issues;
}

function evaluateManifest(filePath) {
  const manifest = readJson(filePath);
  const issues = basicManifestIssues(manifest);
  // Read the maintained GeoJSON directly rather than its generated browser
  // module, so a calibration check cannot accidentally validate stale build
  // output after the canonical garden record has changed.
  const reference = canonicalGardenReference(manifest.gardenId);
  if (!reference) {
    issues.push("gardenId does not exist in the canonical garden API collection");
    return {file: path.relative(repositoryRoot, filePath), gardenId: manifest.gardenId, issues};
  }

  const referenceOrigin = reference.mapping?.layoutAnchor?.coordinates;
  if (!pointsEqual(manifest.origin, referenceOrigin)) {
    issues.push("manifest origin differs from the canonical garden layoutAnchor");
  }
  const referenceRevision = reference.mapping?.layoutCalibration?.revision;
  if (manifest.calibrationRevision !== referenceRevision) {
    issues.push(`manifest revision ${manifest.calibrationRevision} differs from garden API revision ${referenceRevision}`);
  }
  const historicalFrame = reference.siteReconstructionRevision && manifest.originRole === "historical-coordinate-frame";
  if (!historicalFrame && !pointInGeometry(manifest.origin, reference.geometry)) {
    issues.push("layout origin is outside the canonical parcel geometry");
  }

  const property = {
    id: reference.id,
    localOrigin: {lon: manifest.origin[0], lat: manifest.origin[1]},
    parcel: {geometry: reference.geometry},
    imagery: manifest.imageryCoverageCheck?.imagery || {}
  };
  let diagnostics = null;
  try {
    diagnostics = manifest.method === "similarity"
      ? fitSimilarityTransform(manifest.controlPoints, property)
      : directObservationDiagnostics(manifest.controlPoints, property);
  } catch (error) {
    issues.push(error.message);
  }

  const allowedResidual = Number(manifest.maximumResidualFeet ?? 6);
  if (diagnostics && diagnostics.maxErrorFeet > allowedResidual) {
    issues.push(`maximum residual ${diagnostics.maxErrorFeet.toFixed(3)} ft exceeds ${allowedResidual} ft`);
  }

  // Feature IDs couple an aerial observation to the canonical starter data.
  // This catches the common failure where someone adjusts a bed in source data
  // but forgets to update the calibration record (or vice versa).
  const features = featureIndex(canonicalLayout(reference));
  const rasterById = new Map((manifest.digitizationRasters || []).map((raster) => [raster.id, raster]));
  const rasterResiduals = [];
  for (const feature of features.values()) {
    if (!feature.digitizationRasterId) {
      if (rasterById.size && feature.confidence === "high" && /aerial|orthophoto/i.test(feature.geometryBasis || "")) {
        issues.push(`high-confidence aerial feature ${feature.id} does not name its digitization raster`);
      }
      continue;
    }
    const raster = rasterById.get(feature.digitizationRasterId);
    if (!raster) {
      issues.push(`feature ${feature.id} references unknown digitization raster ${feature.digitizationRasterId}`);
      continue;
    }
    if (Number(feature.imageryZoom) !== Number(raster.zoom)) {
      issues.push(`feature ${feature.id} imagery zoom differs from ${raster.id}`);
    }
    if (!pointsEqual(feature.imageryTileOrigin, raster.tileOrigin)) {
      issues.push(`feature ${feature.id} imagery tile origin differs from ${raster.id}`);
    }
  }
  for (const controlPoint of manifest.controlPoints || []) {
    if (!(historicalFrame && controlPoint.role === "coordinate-frame" && pointsEqual(controlPoint.targetLonLat, manifest.origin)) && !pointInGeometry(controlPoint.targetLonLat, reference.geometry)) {
      issues.push(`control point ${controlPoint.id} is outside the parcel`);
    }
    if (!controlPoint.featureId) continue;
    const feature = features.get(controlPoint.featureId);
    if (!feature) {
      issues.push(`control point ${controlPoint.id} references missing feature ${controlPoint.featureId}`);
      continue;
    }
    const recorded = controlPoint.expectedLocal ?? controlPoint.sourceLocal;
    if (recorded && !pointsEqual(recorded, [feature.x, feature.y], 1e-6)) {
      issues.push(`control point ${controlPoint.id} no longer matches ${controlPoint.featureId}'s canonical center`);
    }
    if (recorded && controlPoint.digitizationRasterId && controlPoint.sourcePixel) {
      const raster = rasterById.get(controlPoint.digitizationRasterId);
      if (!raster) continue;
      const projectedPixel = localPointToXyzRasterPixel(recorded, raster, property);
      const residualPixels = Math.hypot(
        projectedPixel[0] - controlPoint.sourcePixel[0],
        projectedPixel[1] - controlPoint.sourcePixel[1]
      );
      rasterResiduals.push({
        controlPointId: controlPoint.id,
        digitizationRasterId: raster.id,
        sourcePixel: controlPoint.sourcePixel,
        projectedPixel,
        residualPixels
      });
      const pixelLimit = Number(manifest.maximumRasterPixelResidual ?? 1);
      if (residualPixels > pixelLimit) {
        issues.push(`control point ${controlPoint.id} raster residual ${residualPixels.toFixed(3)} px exceeds ${pixelLimit} px`);
      }
      const [pixelWidth, pixelHeight] = raster.pixelSize || [];
      if (controlPoint.sourcePixel[0] < 0 || controlPoint.sourcePixel[0] > pixelWidth
        || controlPoint.sourcePixel[1] < 0 || controlPoint.sourcePixel[1] > pixelHeight) {
        issues.push(`control point ${controlPoint.id} falls outside digitization raster ${raster.id}`);
      }
    }
  }

  let imageryCoverage = null;
  if (manifest.imageryCoverageCheck) {
    imageryCoverage = parcelImageryCoverage({
      property,
      imagery: manifest.imageryCoverageCheck.imagery,
      viewport: manifest.imageryCoverageCheck.viewport,
      bearing: manifest.imageryCoverageCheck.bearing
    });
    if (!imageryCoverage?.budgetSatisfied) {
      issues.push("parcel imagery cannot fit within maxTileCount even at minZoom");
    }
    if (imageryCoverage?.coveragePolicy !== "parcel-and-viewport") {
      issues.push("featured-garden imagery must cover both parcel and viewport");
    }
  } else {
    issues.push("imageryCoverageCheck is required for mapped featured gardens");
  }

  return {
    file: path.relative(repositoryRoot, filePath),
    gardenId: manifest.gardenId,
    calibrationRevision: manifest.calibrationRevision,
    method: manifest.method,
    diagnostics,
    rasterDiagnostics: {
      count: rasterResiduals.length,
      maximumResidualPixels: rasterResiduals.length
        ? Math.max(...rasterResiduals.map(({residualPixels}) => residualPixels))
        : null,
      controls: rasterResiduals
    },
    imageryCoverage,
    issues,
    transform: diagnostics?.model === "similarity" ? {
      model: diagnostics.model,
      a: diagnostics.a,
      b: diagnostics.b,
      scale: diagnostics.scale,
      rotationDegrees: diagnostics.rotationDegrees,
      translation: diagnostics.translation
    } : null
  };
}

function printReport(report) {
  const residual = report.diagnostics
    ? `${report.diagnostics.rmseFeet.toFixed(3)} ft RMSE / ${report.diagnostics.maxErrorFeet.toFixed(3)} ft max`
    : "no residual report";
  const coverage = report.imageryCoverage
    ? `${report.imageryCoverage.range.count} tiles at z${report.imageryCoverage.zoom}`
    : "no imagery coverage report";
  const raster = report.rasterDiagnostics?.count
    ? `${report.rasterDiagnostics.count} raster controls / ${report.rasterDiagnostics.maximumResidualPixels.toFixed(3)} px max`
    : "no raster controls";
  console.log(`${report.issues.length ? "FAIL" : "OK  "} ${report.gardenId}: ${residual}; ${raster}; ${coverage}`);
  report.issues.forEach((issue) => console.error(`  - ${issue}`));
}

const options = parseArguments(process.argv.slice(2));
if (options.help) {
  usage();
  process.exit(0);
}
const inputPaths = options.inputs.length ? options.inputs.map(resolveInput) : defaultInputs();
if (!inputPaths.length) throw new Error("No calibration manifests found.");
const reports = inputPaths.map(evaluateManifest);
reports.forEach(printReport);

if (options.report) {
  fs.writeFileSync(resolveInput(options.report), `${JSON.stringify({
    schemaVersion: GIS_ALIGNMENT_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    reports
  }, null, 2)}\n`);
}

if (options.applyLayout) {
  const report = reports[0];
  if (report.issues.length) throw new Error("Refusing to apply a calibration with validation issues.");
  if (!report.transform) throw new Error("Only a similarity calibration can transform a draft layout.");
  const draftLayout = readJson(resolveInput(options.applyLayout));
  const aligned = transformGardenLayout(draftLayout, report.transform);
  fs.writeFileSync(resolveInput(options.output), `${JSON.stringify(aligned, null, 2)}\n`);
  console.log(`Wrote aligned layout to ${path.relative(repositoryRoot, resolveInput(options.output))}`);
}

if (options.check && reports.some((report) => report.issues.length)) process.exitCode = 1;

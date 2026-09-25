import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import calibration from "../data/spatial/calibrations/berkshire-botanical-garden.json" with {type: "json"};
import {
  GIS_ALIGNMENT_SCHEMA_VERSION,
  applySimilarityTransform,
  collectGeoJsonPositions,
  directObservationDiagnostics,
  fitSimilarityTransform,
  imageryTileRange,
  localPointToXyzRasterPixel,
  lonLatBounds,
  lonLatToXyzRasterPixel,
  parcelImageryCoverage,
  transformGardenLayout,
  xyzRasterPixelToLocalPoint,
  xyzRasterPixelToLonLat
} from "../src/lib/spatial/gisAlignment.js";
import {localPointToLonLat} from "../src/lib/spatial/gardenSpatial.js";
import {PROPERTY_CONTEXT} from "../src/data/propertyContext.js";
import {BERKSHIRE_GARDEN_REFERENCES} from "../src/data/gardenCatalog.js";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("parcel imagery coverage retains every parcel coordinate within the tile budget", () => {
  const imagery = calibration.imageryCoverageCheck.imagery;
  const coverage = parcelImageryCoverage({
    property: PROPERTY_CONTEXT,
    imagery,
    viewport: calibration.imageryCoverageCheck.viewport,
    bearing: calibration.imageryCoverageCheck.bearing
  });

  assert.equal(coverage.coveragePolicy, "parcel-and-viewport");
  assert.equal(coverage.zoom, imagery.zoom);
  assert.ok(coverage.range.count <= imagery.maxTileCount);
  assert.ok(coverage.range.count > 1);
  assert.equal(coverage.mosaics[0].role, "parcel");
  assert.equal(coverage.mosaics[0].zoom, coverage.zoom);
  assert.equal(coverage.mosaics[0].range, coverage.range);
  assert.equal(coverage.detailZoom, null);
  assert.equal(coverage.mosaics.length, 1);
  assert.equal(coverage.totalTileCount, coverage.mosaics.reduce((sum, mosaic) => sum + mosaic.range.count, 0));
  assert.ok(coverage.totalTileCount <= imagery.maxTileCount);

  const parcelBounds = lonLatBounds(collectGeoJsonPositions(PROPERTY_CONTEXT.parcel.geometry));
  const parcelRange = imageryTileRange(parcelBounds, coverage.zoom, imagery.tilePadding);
  assert.ok(coverage.range.xMin <= parcelRange.xMin);
  assert.ok(coverage.range.xMax >= parcelRange.xMax);
  assert.ok(coverage.range.yMin <= parcelRange.yMin);
  assert.ok(coverage.range.yMax >= parcelRange.yMax);
});

test("parcel imagery spends only the remaining budget on higher-resolution viewport detail", () => {
  const viewport = {x: 1500, y: -2600, width: 800, height: 600};
  const imagery = {
    tileUrl: "https://example.test/{z}/{y}/{x}.png",
    zoom: 22,
    minZoom: 18,
    maxZoom: 22,
    coverage: "parcel-and-viewport",
    tilePadding: 1,
    maxTileCount: 400
  };
  const coverage = parcelImageryCoverage({
    property: PROPERTY_CONTEXT,
    imagery,
    viewport,
    bearing: 17
  });

  // The complete four-parcel campus consumes 294 z20 tiles (including
  // padding), so the parcel mosaic steps down to z20 while retaining a z22
  // detail mosaic for the compact editing viewport.
  assert.equal(coverage.zoom, 20);
  assert.equal(coverage.detailZoom, 22);
  assert.equal(coverage.mosaics.length, 2);
  assert.equal(coverage.mosaics[0].role, "parcel");
  assert.equal(coverage.mosaics[1].role, "detail");
  assert.equal(coverage.mosaics[1].zoom, coverage.detailZoom);
  assert.ok(coverage.mosaics[1].range.count > 0);
  assert.equal(coverage.totalTileCount, coverage.mosaics[0].range.count + coverage.mosaics[1].range.count);
  assert.ok(coverage.totalTileCount <= imagery.maxTileCount);
  assert.equal(coverage.budgetSatisfied, true);

  const parcelBounds = lonLatBounds(collectGeoJsonPositions(PROPERTY_CONTEXT.parcel.geometry));
  const parcelRange = imageryTileRange(parcelBounds, coverage.zoom, imagery.tilePadding);
  assert.deepEqual(coverage.range, parcelRange);

  const detailRange = imageryTileRange(coverage.detailBounds, coverage.detailZoom, imagery.tilePadding);
  assert.deepEqual(coverage.mosaics[1].range, detailRange);
});

test("imagery coverage traverses all parts of a multipart parcel", () => {
  const property = {
    localOrigin: {lon: -73.3, lat: 42.3},
    parcel: {
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [[[ -73.31, 42.29], [-73.30, 42.29], [-73.30, 42.30], [-73.31, 42.29]]],
          [[[ -73.20, 42.40], [-73.19, 42.40], [-73.19, 42.41], [-73.20, 42.40]]]
        ]
      }
    }
  };
  const imagery = {
    tileUrl: "https://example.test/{z}/{y}/{x}.png",
    zoom: 18,
    minZoom: 7,
    maxZoom: 18,
    coverage: "parcel",
    tilePadding: 1,
    maxTileCount: 384
  };
  const positions = collectGeoJsonPositions(property.parcel.geometry);
  const coverage = parcelImageryCoverage({property, imagery});
  const allPartsRange = imageryTileRange(lonLatBounds(positions), coverage.zoom, imagery.tilePadding);
  assert.equal(positions.length, 8);
  assert.deepEqual(coverage.range, allPartsRange);
});

test("XYZ mosaic pixels round-trip through CRS84 and the garden local plane", () => {
  const registration = {tileOrigin: [310678, 388067], zoom: 20, tileSize: 256};
  const pixel = [430.5893604122102, 1449.1497353976592];
  const lonLat = xyzRasterPixelToLonLat(pixel, registration);

  assert.ok(Math.abs(lonLat[0] - PROPERTY_CONTEXT.localOrigin.lon) < 1e-10);
  assert.ok(Math.abs(lonLat[1] - PROPERTY_CONTEXT.localOrigin.lat) < 1e-10);
  const roundTrip = lonLatToXyzRasterPixel(lonLat, registration);
  assert.ok(Math.abs(roundTrip[0] - pixel[0]) < 1e-6);
  assert.ok(Math.abs(roundTrip[1] - pixel[1]) < 1e-6);
  const local = xyzRasterPixelToLocalPoint(pixel, registration, PROPERTY_CONTEXT);
  assert.ok(Math.abs(local[0]) < 0.001);
  assert.ok(Math.abs(local[1]) < 0.001);
});

test("BBG revision-3 controls remain pinned to their registered source pixels", () => {
  const rasterById = new Map(calibration.digitizationRasters.map((raster) => [raster.id, raster]));
  const controls = calibration.controlPoints.filter((point) => point.digitizationRasterId && point.sourcePixel);

  assert.equal(controls.length, calibration.controlPoints.length);
  for (const control of controls) {
    const raster = rasterById.get(control.digitizationRasterId);
    assert.ok(raster, `${control.id} should name a registered raster`);
    assert.equal(raster.rotationDegrees, 0, `${control.id} must be traced against north-up GIS pixels`);
    const projected = localPointToXyzRasterPixel(control.expectedLocal, raster, PROPERTY_CONTEXT);
    const residual = Math.hypot(
      projected[0] - control.sourcePixel[0],
      projected[1] - control.sourcePixel[1]
    );
    assert.ok(
      residual <= calibration.maximumRasterPixelResidual,
      `${control.id} drifted ${residual.toFixed(3)} pixels from ${control.digitizationRasterId}`
    );
  }
});

test("similarity fitting recovers scale, rotation, and translation", () => {
  const property = {localOrigin: {lon: -73.25, lat: 42.3}};
  const angle = 17 * Math.PI / 180;
  const expected = {
    a: 1.35 * Math.cos(angle),
    b: 1.35 * Math.sin(angle),
    scale: 1.35,
    rotationDegrees: 17,
    translation: [420, -175]
  };
  const sourcePoints = [[0, 0], [600, 0], [0, 360], [550, 320]];
  const controlPoints = sourcePoints.map((source, index) => {
    const targetLocal = applySimilarityTransform(source, expected);
    return {
      id: `control-${index + 1}`,
      sourceLocal: source,
      targetLonLat: localPointToLonLat(targetLocal, property)
    };
  });
  const fitted = fitSimilarityTransform(controlPoints, property);

  assert.ok(Math.abs(fitted.scale - expected.scale) < 1e-8);
  assert.ok(Math.abs(fitted.rotationDegrees - expected.rotationDegrees) < 1e-8);
  assert.ok(Math.abs(fitted.translation[0] - expected.translation[0]) < 1e-6);
  assert.ok(Math.abs(fitted.translation[1] - expected.translation[1]) < 1e-6);
  assert.ok(fitted.maxErrorFeet < 1e-7);
});

test("layout transformation moves site features but leaves bed-relative plants alone", () => {
  const transform = {a: 0, b: 2, scale: 2, rotationDegrees: 90, translation: [100, 200]};
  const layout = {
    beds: [{id: "bed", x: 10, y: 20, width: 48, height: 96, rotation: 5}],
    structures: [{id: "path", polygon: [[0, 0], [10, 0], [10, 10]]}],
    vegetation: [],
    placements: [{id: "plant", bedId: "bed", x: 12, y: 18}]
  };
  const transformed = transformGardenLayout(layout, transform);

  assert.deepEqual(transformed.beds[0], {
    id: "bed",
    x: 60,
    y: 220,
    width: 96,
    height: 192,
    rotation: 95
  });
  assert.deepEqual(transformed.structures[0].polygon, [[100, 200], [100, 220], [80, 220]]);
  assert.deepEqual(transformed.placements, layout.placements);
  assert.notEqual(transformed.placements[0], layout.placements[0]);
});

test("layout transformation preserves local GeoJSON types, rings, and holes", () => {
  const transform = {a: 0, b: 2, scale: 2, rotationDegrees: 90, translation: [100, 200]};
  const layout = {
    beds: [],
    structures: [
      {id: "pole", localGeometry: {type: "Point", coordinates: [3, 4]}},
      {id: "fence", localGeometry: {type: "LineString", coordinates: [[0, 0], [5, 0], [5, 2]]}},
      {
        id: "water",
        localGeometry: {
          type: "Polygon",
          coordinates: [
            [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
            [[2, 2], [4, 2], [4, 4], [2, 4], [2, 2]]
          ]
        }
      }
    ],
    vegetation: [],
    placements: []
  };
  const original = structuredClone(layout);
  const transformed = transformGardenLayout(layout, transform);

  assert.deepEqual(transformed.structures[0].localGeometry, {
    type: "Point",
    coordinates: [92, 206]
  });
  assert.deepEqual(transformed.structures[1].localGeometry, {
    type: "LineString",
    coordinates: [[100, 200], [100, 210], [96, 210]]
  });
  assert.deepEqual(transformed.structures[2].localGeometry, {
    type: "Polygon",
    coordinates: [
      [[100, 200], [100, 220], [80, 220], [80, 200], [100, 200]],
      [[96, 204], [96, 208], [92, 208], [92, 204], [96, 204]]
    ]
  });
  assert.equal(transformed.structures[2].localGeometry.coordinates.length, 2);
  assert.deepEqual(layout, original);
});

test("the preserved BBG observations round-trip through its canonical local origin", () => {
  assert.equal(calibration.schemaVersion, GIS_ALIGNMENT_SCHEMA_VERSION);
  assert.equal(calibration.gardenId, PROPERTY_CONTEXT.id);
  assert.deepEqual(calibration.origin, [PROPERTY_CONTEXT.localOrigin.lon, PROPERTY_CONTEXT.localOrigin.lat]);
  const diagnostics = directObservationDiagnostics(calibration.controlPoints, PROPERTY_CONTEXT);
  assert.ok(diagnostics.maxErrorFeet <= calibration.maximumResidualFeet);
  assert.equal(diagnostics.controlPointCount, 11);
  assert.deepEqual(new Set(calibration.controlPoints.map(({role}) => role)), new Set([
    "bed-center",
    "building-center",
    "named-landscape-center",
    "named-garden-area-center"
  ]));
});

test("every featured garden has a version-matched alignment manifest", () => {
  const manifestDirectory = path.join(repositoryRoot, "data/spatial/calibrations");
  const manifests = fs.readdirSync(manifestDirectory)
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(fs.readFileSync(path.join(manifestDirectory, name), "utf8")));
  assert.deepEqual(
    manifests.map((manifest) => manifest.gardenId).sort(),
    BERKSHIRE_GARDEN_REFERENCES.map((garden) => garden.id).sort()
  );
  for (const manifest of manifests) {
    const garden = BERKSHIRE_GARDEN_REFERENCES.find((candidate) => candidate.id === manifest.gardenId);
    assert.equal(manifest.schemaVersion, GIS_ALIGNMENT_SCHEMA_VERSION);
    assert.equal(manifest.calibrationRevision, garden.mapping.layoutCalibration.revision);
    assert.deepEqual(manifest.origin, garden.mapping.layoutAnchor.coordinates);
    assert.ok(manifest.sources.length >= 1);
    assert.ok(manifest.assumptions.length >= 1);
  }
});

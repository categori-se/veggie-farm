import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  exteriorRingsArea,
  flattenExteriorRings,
  normalizeParcelGeometry,
  parcelExteriorRings
} from "../src/lib/spatial/parcelGeometry.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const firstExterior = [
  [0, 0],
  [10, 0],
  [10, 10],
  [0, 10],
  [0, 0]
];
const firstHole = [
  [2, 2],
  [2, 4],
  [4, 4],
  [4, 2],
  [2, 2]
];
const secondExterior = [
  [20, 0],
  [20, 4],
  [23, 4],
  [23, 0],
  [20, 0]
];

test("parcel geometry normalization preserves Polygon and accepts valid MultiPolygon", () => {
  const polygon = {type: "Polygon", coordinates: [firstExterior, firstHole]};
  const normalizedPolygon = normalizeParcelGeometry(polygon);
  assert.deepEqual(normalizedPolygon, polygon);
  assert.notStrictEqual(normalizedPolygon, polygon);
  assert.notStrictEqual(normalizedPolygon.coordinates, polygon.coordinates);

  const multiPolygon = {
    type: "MultiPolygon",
    coordinates: [[firstExterior, firstHole], [secondExterior]],
    source: "canonical multipart parcel"
  };
  assert.deepEqual(normalizeParcelGeometry(multiPolygon), multiPolygon);

  assert.deepEqual(normalizeParcelGeometry({rings: [firstExterior]}), {
    type: "Polygon",
    coordinates: [firstExterior]
  });
  const legacyOpenRing = [[0, 0], [2, 0], [0, 2]];
  assert.deepEqual(normalizeParcelGeometry({type: "Polygon", coordinates: [legacyOpenRing]}), {
    type: "Polygon",
    coordinates: [legacyOpenRing]
  });
  assert.deepEqual(normalizeParcelGeometry({rings: [legacyOpenRing]}), {
    type: "Polygon",
    coordinates: [legacyOpenRing]
  });
  assert.equal(normalizeParcelGeometry({type: "MultiPolygon", coordinates: [[[[0, 0], [1, 0]]]]}), null);
});

test("exterior-ring helpers keep parcel parts separate and omit interior holes", () => {
  const geometry = {
    type: "MultiPolygon",
    coordinates: [[firstExterior, firstHole], [secondExterior]]
  };
  const rings = parcelExteriorRings(geometry);
  assert.deepEqual(rings, [firstExterior, secondExterior]);
  assert.equal(rings.length, 2);
  assert.deepEqual(flattenExteriorRings(rings), [...firstExterior, ...secondExterior]);
});

test("multipart parcel area sums absolute exterior-ring areas", () => {
  assert.equal(exteriorRingsArea([firstExterior, secondExterior]), 112);
  assert.equal(exteriorRingsArea([firstExterior, [...secondExterior].reverse()]), 112);
  assert.equal(exteriorRingsArea([]), 0);
});

test("planner parcel consumers use all exterior rings without joining parts", () => {
  const source = fs.readFileSync(path.join(root, "src/components/gardenPlanner.js"), "utf8");
  const between = (start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start) + start.length));

  const mapRenderer = between("function renderParcelMap", "function render2dPlan");
  assert.match(mapRenderer, /const boundaries = propertyBoundaryRings\(state\)/);
  assert.ok((mapRenderer.match(/polygonRingsPath\(boundaries\)/g) || []).length >= 2, "map clip and outline should share the multipart path");

  const planContext = between("function renderPlotContext", "function renderNorthArrow");
  assert.match(planContext, /propertyBoundaryRings\(state\)/);
  assert.match(planContext, /polygonRingsPath\(boundaries\)/);

  const threeGround = between("function addPropertyGround3d", "function addBed3d");
  assert.match(threeGround, /propertyBoundaryRings\(state\)/);
  assert.match(threeGround, /for \(const \[index, boundary\] of boundaries\.entries\(\)\)/);

  const parcelBounds = between("function parcelViewBounds", "function parcelViewportBounds");
  assert.match(parcelBounds, /propertyBoundaryPoints\(state\)/);
  assert.match(source, /polygonRingsAreaSqFt\(propertyBoundaryRings\(state\)\)/);

  const origin = between("function localOriginFromGeometry", "function normalizeViewPresentation");
  assert.match(origin, /flattenExteriorRings\(parcelExteriorRings\(geometry\)\)/);

  const parcelSearch = between("async function searchMassgisParcels", "function massgisParcelWhereClause");
  assert.match(parcelSearch, /parcelExteriorRings\(normalizeParcelGeometry\(feature\.geometry\)\)/);
  assert.match(parcelSearch, /\.some\(\(ring\) => ring\.length >= 3\)/);
});

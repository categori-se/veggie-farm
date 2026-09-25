import assert from "node:assert/strict";
import test from "node:test";

import {
  GARDEN_FEATURE_CATEGORIES,
  classifyGardenFeature,
  isGeometryAllowedForCategory
} from "../src/lib/spatial/gardenFeatureVocabulary.js";
import {
  SPATIAL_INTERCHANGE_CRS,
  derivedTreeCrownFeatures,
  gardenToGeoJsonText,
  gardenToInterchangeFeatureCollection,
  gardenToKml,
  stageGeoJsonImport,
  stageKmlImport
} from "../src/lib/spatial/spatialInterchange.js";

function feature(id, geometry, properties = {}) {
  return {type: "Feature", id, geometry, properties};
}

function fixture() {
  const provenance = {
    sourceId: "massgis-aerial-2025",
    sourceFeatureId: "source-tree-7",
    confidence: "medium",
    surveyStatus: "not-surveyed"
  };
  return {
    type: "GardenSpatialDataset",
    schemaVersion: "1.0.0",
    gardenId: "example-garden",
    coordinateReferenceSystem: SPATIAL_INTERCHANGE_CRS,
    collections: {
      parcels: {
        type: "FeatureCollection", properties: {layer: "parcels"}, features: [
          feature("parcel-1", {type: "Polygon", coordinates: [[
            [-73.1, 42.1], [-73.09, 42.1], [-73.09, 42.11], [-73.1, 42.11], [-73.1, 42.1]
          ]]}, {kind: "tax-parcel"})
        ]
      },
      site: {
        type: "FeatureCollection", properties: {layer: "site"}, features: [
          feature("path-1", {type: "LineString", coordinates: [[-73.099, 42.101], [-73.095, 42.105]]}, {kind: "trail", name: "Garden walk"}),
          feature("tree-1", {type: "Point", coordinates: [-73.096, 42.104]}, {
            kind: "specimen-tree",
            name: "Aerial-observed mature tree",
            crownDiameterFeet: 34,
            provenance
          })
        ]
      },
      beds: {
        type: "FeatureCollection", properties: {layer: "beds"}, features: [
          feature("bed-1", {type: "Polygon", coordinates: [[
            [-73.097, 42.103], [-73.0969, 42.103], [-73.0969, 42.1031], [-73.097, 42.1031], [-73.097, 42.103]
          ]]}, {kind: "bed", name: "Kitchen bed", provenance: {sourceId: "field-sketch"}})
        ]
      },
      plants: {type: "FeatureCollection", properties: {layer: "plants"}, features: []}
    }
  };
}

test("feature vocabulary maps legacy canonical semantics to stable edit categories", () => {
  assert.equal(classifyGardenFeature(feature("a", {type: "LineString"}, {kind: "driveway"}), "site"), "road");
  assert.equal(classifyGardenFeature(feature("b", {type: "Polygon"}, {classification: "greenhouse"}), "site"), "building");
  assert.equal(classifyGardenFeature(feature("c", {type: "Polygon"}, {kind: "garden-section"}), "site"), "garden-area");
  assert.equal(classifyGardenFeature(feature("d", {type: "Point"}, {kind: "specimen-tree"}), "site"), "tree");
  assert.equal(classifyGardenFeature(feature("e", {type: "Point"}), "plants"), "plant");
  assert.equal(GARDEN_FEATURE_CATEGORIES.bed.layer, "beds");
  assert.ok(isGeometryAllowedForCategory("path", "LineString"));
  assert.ok(!isGeometryAllowedForCategory("tree", "Polygon"));
});

test("GeoJSON export is flat, CRS84, styled, and preserves canonical provenance", () => {
  const collection = gardenToInterchangeFeatureCollection(fixture(), {name: "Example export"});
  assert.equal(collection.type, "FeatureCollection");
  assert.equal(collection.properties.coordinateReferenceSystem, SPATIAL_INTERCHANGE_CRS);
  assert.deepEqual(collection.properties.gardenIds, ["example-garden"]);
  assert.equal(collection.features.length, 4);
  const tree = collection.features.find(({id}) => id === "tree-1");
  assert.equal(tree.properties.vf_category, "tree");
  assert.equal(tree.properties.vf_layer, "site");
  assert.equal(tree.properties.vf_style_id, "vf-tree");
  assert.match(tree.properties.vf_stroke, /^#[0-9a-f]{6}$/i);
  assert.equal(tree.properties.provenance.sourceFeatureId, "source-tree-7");
  assert.equal(JSON.parse(gardenToGeoJsonText(fixture())).features.length, 4);

  const evidence = gardenToInterchangeFeatureCollection({
    type: "FeatureCollection",
    properties: {layer: "site"},
    features: [feature("evidence-1", {type: "Point", coordinates: [-73.1, 42.1]}, {
      kind: "garden-landmark", canonical: false
    })]
  }).features[0];
  assert.equal(evidence.properties.vf_canonical, false);
  assert.equal(evidence.properties.vf_derived, false, "review evidence is not automatically derived geometry");
});

test("styled KML round-trips IDs and provenance while keeping calculated crowns non-canonical", () => {
  const collection = gardenToInterchangeFeatureCollection(fixture());
  const crowns = derivedTreeCrownFeatures(collection);
  assert.equal(crowns.length, 1);
  assert.equal(crowns[0].properties.vf_canonical, false);
  assert.equal(crowns[0].properties.vf_derived_from, "tree-1");
  assert.equal(crowns[0].geometry.type, "Polygon");
  assert.equal(crowns[0].geometry.coordinates[0].length, 49);

  const kml = gardenToKml(fixture(), {name: "Example Google Earth export"});
  assert.match(kml, /<Style id="vf-road">/);
  assert.match(kml, /Derived visualization · tree crowns \(not canonical\)/);
  assert.match(kml, /<Data name="veggieFarm\.provenance">/);
  assert.match(kml, /<Data name="veggieFarm\.category"><value>tree<\/value><\/Data>/);

  const staged = stageKmlImport(kml, {source: {id: "round-trip", fileName: "garden.kml"}});
  assert.equal(staged.reviewOnly, true);
  assert.equal(staged.promotion.eligible, false);
  assert.equal(staged.errors.length, 0);
  assert.equal(staged.summary.featureCount, 5);
  const tree = staged.collection.features.find(({id}) => id === "tree-1");
  const crown = staged.collection.features.find(({id}) => id === "tree-1:derived-crown");
  assert.equal(tree.properties.provenance.sourceId, "massgis-aerial-2025");
  assert.equal(tree.properties.vf_source_canonical, true);
  assert.equal(tree.properties.vf_canonical, false);
  assert.equal(crown.properties.vf_derived, true);
  assert.equal(crown.properties.vf_derived_from, "tree-1");
  assert.ok(staged.warnings.some(({code, featureId}) => code === "DERIVED_OR_NONCANONICAL" && featureId === crown.id));
});

test("GeoJSON imports are staged with explicit category and geometry diagnostics", () => {
  const staged = stageGeoJsonImport({
    type: "FeatureCollection",
    properties: {layer: "site"},
    features: [
      feature("tree-polygon", {type: "Polygon", coordinates: [[
        [-73.1, 42.1], [-73.09, 42.1], [-73.09, 42.11], [-73.1, 42.11], [-73.1, 42.1]
      ]]}, {vf_category: "tree", vf_layer: "plants", vf_canonical: true}),
      feature("open-bed", {type: "Polygon", coordinates: [[
        [-73.1, 42.1], [-73.09, 42.1], [-73.09, 42.11], [-73.1, 42.11]
      ]]}, {kind: "bed"}),
      feature("mystery", {type: "Point", coordinates: [-73.095, 42.105]}, {vf_category: "made-up-category"})
    ]
  });
  assert.equal(staged.reviewOnly, true);
  assert.equal(staged.collection.properties.promotionRequired, true);
  assert.ok(staged.warnings.some(({code}) => code === "CATEGORY_GEOMETRY_MISMATCH"));
  assert.ok(staged.warnings.some(({code}) => code === "CATEGORY_LAYER_MISMATCH"));
  assert.ok(staged.warnings.some(({code}) => code === "UNKNOWN_CATEGORY"));
  assert.ok(staged.errors.some(({code}) => code === "OPEN_RING"));
  assert.ok(staged.collection.features.every((item) => item.properties.vf_review_only && item.properties.vf_canonical === false));
});

test("malformed interchange input returns a review result instead of mutating application state", () => {
  const json = stageGeoJsonImport("{not json");
  const kml = stageKmlImport("<kml><Document>");
  assert.equal(json.summary.featureCount, 0);
  assert.equal(json.errors[0].code, "INVALID_JSON");
  assert.equal(kml.summary.featureCount, 0);
  assert.equal(kml.errors[0].code, "INVALID_KML");
  assert.equal(json.promotion.eligible, false);
  assert.equal(kml.promotion.eligible, false);
});

test("projected and structurally invalid GeoJSON receives actionable review errors", () => {
  const staged = stageGeoJsonImport({
    type: "FeatureCollection",
    crs: {type: "name", properties: {name: "EPSG:3857"}},
    features: [
      feature("short-line", {type: "LineString", coordinates: [[-73.1, 42.1]]}, {kind: "path"}),
      feature("bad-point", {type: "Point", coordinates: [Number.NaN, 42.1]}, {kind: "tree"})
    ]
  });
  assert.ok(staged.errors.some(({code}) => code === "UNSUPPORTED_CRS"));
  assert.ok(staged.errors.some(({code}) => code === "INVALID_LINE"));
  assert.ok(staged.errors.some(({code}) => code === "NON_FINITE_COORDINATE"));
  assert.ok(staged.warnings.some(({code}) => code === "LEGACY_CRS_MEMBER"));
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  CRS84_URI,
  GARDEN_SPATIAL_SCHEMA_VERSION,
  gardenSpatialReference,
  gardenStateSpatialExport,
  gardenWorkspaceFeatureCollection,
  gardenWorkspaceLayerFeatureCollections,
  localPointToLonLat,
  lonLatToLocalPoint
} from "../src/lib/spatial/gardenSpatial.js";

const property = {
  id: "test-garden",
  name: "Test garden",
  spatialStatus: "mapped",
  localOrigin: {lon: -73.25, lat: 42.3},
  parcel: {
    service: "https://example.test/parcels",
    attributes: {MAP_PAR_ID: "test-1", FY: 2026},
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-73.251, 42.299], [-73.249, 42.299], [-73.249, 42.301],
        [-73.251, 42.301], [-73.251, 42.299]
      ]]
    }
  }
};

const workspace = {
  id: "test-garden",
  name: "Test garden",
  property,
  beds: [{id: "bed-1", name: "Bed 1", x: 120, y: -48, width: 96, height: 48, rotation: 30}],
  structures: [{id: "shed-1", name: "Shed", type: "shed", x: -180, y: 60, width: 120, height: 96, rotation: -12}],
  vegetation: [{
    id: "tree-1",
    name: "Unidentified mature tree",
    kind: "tree",
    collection: "vegetation",
    geometryRepresentation: "point",
    observationType: "mature-tree",
    plantId: null,
    x: 240,
    y: 180,
    width: 360,
    height: 288,
    crownWidthFeet: 30,
    crownDepthFeet: 24,
    heightEstimateFeet: 38,
    heightConfidence: "low",
    localGeometry: {type: "Point", coordinates: [240, 180]},
    rotation: 0
  }],
  placements: [{id: "plant-1", plantId: "tomato", bedId: "bed-1", x: 24, y: 24}]
};

test("local garden coordinates round-trip through WGS 84", () => {
  const local = [1234.567, -987.654];
  const geographic = localPointToLonLat(local, property);
  const restored = lonLatToLocalPoint(geographic, property);
  assert.ok(Math.abs(restored[0] - local[0]) < 1e-6);
  assert.ok(Math.abs(restored[1] - local[1]) < 1e-6);

  const reference = gardenSpatialReference(property);
  assert.equal(reference.schemaVersion, GARDEN_SPATIAL_SCHEMA_VERSION);
  assert.equal(reference.horizontalCRS, CRS84_URI);
  assert.deepEqual(reference.localAxes, {x: "east", y: "south"});

  const serializedProperty = {...property, spatialReference: reference};
  assert.deepEqual(localPointToLonLat([0, 0], serializedProperty), [-73.25, 42.3]);
  const serializedRoundTrip = lonLatToLocalPoint(localPointToLonLat(local, serializedProperty), serializedProperty);
  assert.ok(Math.abs(serializedRoundTrip[0] - local[0]) < 1e-6);
  assert.ok(Math.abs(serializedRoundTrip[1] - local[1]) < 1e-6);
});

test("a workspace exports parcel, beds, structures, vegetation, and plants as GeoJSON", () => {
  const collection = gardenWorkspaceFeatureCollection(workspace);
  assert.equal(collection.type, "FeatureCollection");
  assert.equal(collection.properties.coordinateReferenceSystem, CRS84_URI);
  assert.equal(collection.features.length, 5);
  assert.deepEqual(new Set(collection.features.map((feature) => feature.properties.featureType)), new Set([
    "parcel", "bed", "structure", "vegetation", "plant"
  ]));
  assert.ok(collection.features.every((feature) => feature.properties.gardenId === workspace.id));
  assert.ok(collection.features.filter((feature) => feature.geometry.type === "Polygon")
    .every((feature) => feature.geometry.coordinates[0].at(0).length === 2));
  assert.equal(collection.features.find((feature) => feature.properties.featureType === "bed").properties.localUnit, "inch");
  const tree = collection.features.find((feature) => feature.properties.featureType === "vegetation");
  assert.equal(tree.geometry.type, "Point", "the tree center, not its display crown, is canonical");
  assert.equal(tree.properties.kind, "tree");
  assert.equal(tree.properties.plantId, null);
  assert.equal(tree.properties.crownWidthFeet, 30);
  assert.equal(tree.properties.crownDepthFeet, 24);
  assert.equal(tree.properties.heightEstimateFeet, 38);
  assert.equal(collection.bbox.length, 4);
});

test("explicit contextual land cover stays polygonal and separate from tree-center Points", () => {
  const contextual = structuredClone(workspace);
  contextual.vegetation.push({
    id: "woodland-cover-1",
    name: "Woodland contextual cover",
    kind: "land-cover",
    collection: "vegetation",
    geometryRepresentation: "land-cover",
    localGeometry: {
      type: "Polygon",
      coordinates: [[[360, -240], [720, -240], [720, 120], [360, 120], [360, -240]]]
    },
    source: "Mapped land-cover classification"
  });
  const vegetation = gardenWorkspaceFeatureCollection(contextual).features
    .filter((feature) => feature.properties.featureType === "vegetation");
  assert.deepEqual(vegetation.map((feature) => feature.geometry.type), ["Point", "Polygon"]);
  assert.deepEqual(vegetation.map((feature) => feature.properties.kind), ["tree", "land-cover"]);
  assert.equal(vegetation[1].properties.crownWidthFeet, null);
  assert.equal(vegetation[1].properties.heightEstimateFeet, null);
});

test("site-feature local geometries round-trip as matching CRS84 GeoJSON", () => {
  const localGeometries = [
    {id: "pole", type: "utility-pole", localGeometry: {type: "Point", coordinates: [36, -24]}},
    {id: "fence", type: "fence", localGeometry: {type: "LineString", coordinates: [[0, 0], [120, 0], [120, 48]]}},
    {
      id: "pond",
      type: "pond",
      localGeometry: {
        type: "Polygon",
        coordinates: [
          [[0, 0], [240, 0], [240, 180], [0, 180], [0, 0]],
          [[60, 60], [120, 60], [120, 120], [60, 120], [60, 60]]
        ]
      }
    },
    {id: "legacy", type: "shed", x: 400, y: 300, width: 96, height: 72},
    {
      id: "invalid-line",
      type: "path",
      x: -100,
      y: -50,
      width: 120,
      height: 24,
      localGeometry: {type: "LineString", coordinates: [[0, 0]]}
    }
  ];
  const collection = gardenWorkspaceFeatureCollection({
    ...workspace,
    beds: [],
    vegetation: [],
    placements: [],
    structures: localGeometries
  });
  const byId = new Map(collection.features.map((feature) => [feature.properties.featureId, feature]));

  for (const source of localGeometries.slice(0, 3)) {
    const exported = byId.get(source.id);
    assert.equal(exported.geometry.type, source.localGeometry.type);
    assert.deepEqual(exported.properties.localGeometry, source.localGeometry);
    assert.notEqual(exported.properties.localGeometry, source.localGeometry);
  }
  assert.deepEqual(
    lonLatToLocalPoint(byId.get("pole").geometry.coordinates, property).map((value) => Math.round(value) || 0),
    [36, -24]
  );
  assert.deepEqual(
    byId.get("fence").geometry.coordinates.map((point) => (
      lonLatToLocalPoint(point, property).map((value) => Math.round(value) || 0)
    )),
    [[0, 0], [120, 0], [120, 48]]
  );
  const restoredPond = byId.get("pond").geometry.coordinates.map((ring) => (
    ring.map((point) => lonLatToLocalPoint(point, property).map((value) => Math.round(value) || 0))
  ));
  assert.deepEqual(restoredPond, localGeometries[2].localGeometry.coordinates);
  assert.equal(restoredPond.length, 2);
  assert.equal(byId.get("legacy").geometry.type, "Polygon");
  assert.equal(byId.get("invalid-line").geometry.type, "Polygon");
});

test("the state spatial export retains a separate GeoJSON collection for every garden", () => {
  const second = structuredClone(workspace);
  second.id = "second-garden";
  second.name = "Second garden";
  second.property.id = second.id;
  const exported = gardenStateSpatialExport({activeParcelId: workspace.id, parcels: [workspace, second]});
  assert.equal(exported.gardens.length, 2);
  assert.deepEqual(exported.gardens.map((garden) => garden.id), ["test-garden", "second-garden"]);
  assert.equal(exported.datasets.length, 2);
  assert.deepEqual(Object.keys(exported.datasets[0].collections), ["parcels", "site", "beds", "plants"]);
  assert.equal(exported.activeGardenId, workspace.id);
});

test("workspace export separates canonical parcel, site, bed, and plant layers", () => {
  const layers = gardenWorkspaceLayerFeatureCollections(workspace);
  assert.equal(layers.parcels.features.length, 1);
  assert.equal(layers.site.features.length, 2);
  assert.equal(layers.beds.features.length, 1);
  assert.equal(layers.plants.features.length, 1);
  for (const [layer, collection] of Object.entries(layers)) {
    assert.equal(collection.type, "FeatureCollection");
    assert.equal(collection.properties.layer, layer);
    assert.ok(collection.features.every((feature) => feature.properties.layer === layer));
  }
});

test("member parcels remain independent GIS features", () => {
  const memberWorkspace = structuredClone(workspace);
  memberWorkspace.property.parcel.members = [
    {id: "member-a", acreage: 1, geometry: property.parcel.geometry},
    {id: "member-b", acreage: 2, geometry: {
      type: "Polygon",
      coordinates: [[
        [-73.249, 42.299], [-73.248, 42.299], [-73.248, 42.301],
        [-73.249, 42.301], [-73.249, 42.299]
      ]]
    }}
  ];
  const parcels = gardenWorkspaceLayerFeatureCollections(memberWorkspace).parcels.features;
  assert.deepEqual(parcels.map((feature) => feature.properties.parcelId), ["member-a", "member-b"]);
  assert.deepEqual(parcels.map((feature) => feature.properties.acreage), [1, 2]);
});

test("spatial export distinguishes edited geometry from its prior source interpretation", () => {
  const geometryEdit = {coordinateSpace: "garden-local-inches", previousGeometry: {type: "LineString", coordinates: [[0, 0], [120, 0]]}, method: "User-adjusted map vertices; not independently surveyed"};
  const collection = gardenWorkspaceFeatureCollection({...workspace, structures: [{
    id: "path-edit", type: "path", x: 60, y: 6, width: 120, height: 12,
    localGeometry: {type: "LineString", coordinates: [[0, 12], [120, 0]]},
    corridorWidthFeet: 4, source: "Original source", geometryEdit
  }]});
  const feature = collection.features.find(f => f.properties.featureId === "path-edit");
  assert.equal(feature.geometry.type, "LineString");
  assert.deepEqual(feature.properties.geometryEdit, geometryEdit);
  assert.equal(feature.properties.source, "Original source");
  assert.equal(feature.properties.corridorWidthFeet, 4);
  feature.properties.geometryEdit.previousGeometry.coordinates[0][0] = 99;
  assert.equal(geometryEdit.previousGeometry.coordinates[0][0], 0);
});

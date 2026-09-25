import assert from "node:assert/strict";
import test from "node:test";

import {
  GARDEN_SPATIAL_DATASET_VERSION,
  assertGardenSpatialDataset,
  gardenSpatialDatasetFeatureCount,
  gardenSpatialDatasetToWorkspace,
  validateGardenSpatialDataset
} from "../src/lib/spatial/gardenFeatureCollections.js";
import {CRS84_URI, localPointToLonLat} from "../src/lib/spatial/gardenSpatial.js";

const property = {
  id: "garden-a",
  name: "Garden A",
  localOrigin: {lon: -73.336, lat: 42.3}
};

function feature(id, layer, geometry, properties = {}) {
  return {
    type: "Feature",
    id,
    geometry,
    properties: {
      gardenId: property.id,
      layer,
      ...properties
    }
  };
}

function collection(layer, features) {
  return {type: "FeatureCollection", properties: {gardenId: property.id, layer}, features};
}

function dataset() {
  const parcel = feature("parcel-1", "parcels", {
    type: "Polygon",
    coordinates: [[
      [-73.337, 42.299], [-73.335, 42.299], [-73.335, 42.301],
      [-73.337, 42.301], [-73.337, 42.299]
    ]]
  }, {kind: "tax-parcel", provenance: {sourceId: "massgis-parcels"}});
  const garden = feature("garden-1", "site", {
    type: "Polygon",
    coordinates: [[
      localPointToLonLat([-120, -120], property),
      localPointToLonLat([120, -120], property),
      localPointToLonLat([120, 120], property),
      localPointToLonLat([-120, 120], property),
      localPointToLonLat([-120, -120], property)
    ]]
  }, {
    parcelId: "parcel-1",
    kind: "garden-section",
    provenance: {sourceId: "example-kmz", confidence: "high", geometryMethod: "KML import"}
  });
  const bed = feature("bed-1", "beds", {
    type: "Polygon",
    coordinates: [[
      localPointToLonLat([-48, -24], property),
      localPointToLonLat([48, -24], property),
      localPointToLonLat([48, 24], property),
      localPointToLonLat([-48, 24], property),
      localPointToLonLat([-48, -24], property)
    ]]
  }, {
    parcelId: "parcel-1",
    parentId: "garden-1",
    name: "Bed 1",
    provenance: {sourceId: "example-kmz", confidence: "high", geometryMethod: "KML import"}
  });
  const plant = feature("plant-1", "plants", {
    type: "Point",
    coordinates: localPointToLonLat([0, 0], property)
  }, {
    parcelId: "parcel-1",
    parentId: "bed-1",
    bedId: "bed-1",
    provenance: {sourceId: "example-kmz", confidence: "medium", geometryMethod: "KML import"}
  });
  return {
    type: "GardenSpatialDataset",
    schemaVersion: GARDEN_SPATIAL_DATASET_VERSION,
    gardenId: property.id,
    coordinateReferenceSystem: CRS84_URI,
    sources: [
      {id: "massgis-parcels", title: "MassGIS parcels"},
      {id: "example-kmz", title: "Example KMZ"}
    ],
    collections: {
      parcels: collection("parcels", [parcel]),
      site: collection("site", [garden]),
      beds: collection("beds", [bed]),
      plants: collection("plants", [plant])
    }
  };
}

test("canonical garden data is validated as four linked GeoJSON layers", () => {
  const value = dataset();
  assert.deepEqual(validateGardenSpatialDataset(value), []);
  assert.equal(assertGardenSpatialDataset(value), value);
  assert.deepEqual(gardenSpatialDatasetFeatureCount(value), {
    parcels: 1,
    site: 1,
    beds: 1,
    plants: 1
  });
});

test("an empty canonical plant collection stays empty instead of inferring placements", () => {
  const value = dataset();
  value.collections.plants.features = [];

  assert.deepEqual(validateGardenSpatialDataset(value), []);
  assert.equal(gardenSpatialDatasetFeatureCount(value).plants, 0);
  assert.deepEqual(gardenSpatialDatasetToWorkspace(value, property).placements, []);
});

test("canonical CRS84 geometry derives a local planner workspace without losing provenance", () => {
  const workspace = gardenSpatialDatasetToWorkspace(dataset(), property);
  assert.equal(workspace.beds.length, 1);
  assert.equal(workspace.structures.length, 1);
  assert.equal(workspace.placements.length, 1);
  assert.ok(Math.abs(workspace.beds[0].x) < 1e-6);
  assert.ok(Math.abs(workspace.beds[0].y) < 1e-6);
  assert.equal(workspace.beds[0].parentId, "garden-1");
  assert.equal(workspace.beds[0].provenance.sourceId, "example-kmz");
  assert.equal(workspace.structures[0].type, "garden-section");
  assert.equal(workspace.placements[0].bedId, "bed-1");
  assert.ok(Math.abs(workspace.placements[0].x - workspace.beds[0].width / 2) < 1e-6);
  assert.ok(Math.abs(workspace.placements[0].y - workspace.beds[0].height / 2) < 1e-6);
});

test("unidentified source observations remain absolute and taxonomically unassigned", () => {
  const value = dataset();
  value.collections.site.features.push(feature("tree-1", "site", {
    type: "Point",
    coordinates: localPointToLonLat([360, -240], property)
  }, {
    parcelId: "parcel-1",
    parentId: "parcel-1",
    name: "Unidentified tree observation",
    kind: "tree",
    collection: "vegetation",
    geometryRepresentation: "point",
    observationType: "mature-tree",
    crownWidthFeet: 30,
    crownDepthFeet: 24,
    heightEstimateFeet: 38,
    heightConfidence: "low",
    identificationStatus: "type only; taxon unidentified",
    provenance: {sourceId: "example-kmz", confidence: "low", geometryMethod: "KML import"}
  }));
  value.collections.site.features.push(feature("woodland-cover-1", "site", {
    type: "Polygon",
    coordinates: [[
      localPointToLonLat([480, -360], property),
      localPointToLonLat([720, -360], property),
      localPointToLonLat([720, -120], property),
      localPointToLonLat([480, -120], property),
      localPointToLonLat([480, -360], property)
    ]]
  }, {
    parcelId: "parcel-1",
    parentId: "parcel-1",
    name: "Woodland contextual cover",
    kind: "land-cover",
    collection: "vegetation",
    geometryRepresentation: "land-cover",
    provenance: {sourceId: "massgis-parcels", confidence: "medium", geometryMethod: "context classification"}
  }));
  value.collections.plants.features.push(feature("plant-unassigned", "plants", {
    type: "Point",
    coordinates: localPointToLonLat([420, -180], property)
  }, {
    parcelId: "parcel-1",
    parentId: "parcel-1",
    name: "Unidentified plant observation",
    kind: "plant-observation",
    bedId: null,
    taxonId: null,
    identificationStatus: "unidentified and not yet associated with a mapped bed",
    provenance: {sourceId: "example-kmz", confidence: "low", geometryMethod: "KML import"}
  }));

  const workspace = gardenSpatialDatasetToWorkspace(value, property);
  const tree = workspace.vegetation.find(({id}) => id === "tree-1");
  const woodland = workspace.structures.find(({id}) => id === "woodland-cover-1");
  const observation = workspace.placements.find(({id}) => id === "plant-unassigned");
  assert.equal(tree.kind, "tree");
  assert.equal(tree.importedKind, "tree");
  assert.equal(tree.plantId, null);
  assert.equal(tree.geometryRepresentation, "point");
  assert.equal(tree.width, 360);
  assert.equal(tree.height, 288);
  assert.equal(tree.crownWidthFeet, 30);
  assert.equal(tree.heightEstimateFeet, 38);
  assert.deepEqual(tree.absoluteLocalPoint.map((value) => Math.round(value)), [360, -240]);
  assert.equal(woodland.type, "land-cover");
  assert.equal(workspace.vegetation.some(({id}) => id === woodland.id), false, "land cover is contextual site data, not an individual tree");
  assert.equal(observation.bedId, null);
  assert.equal(observation.plantId, null);
  assert.equal(observation.identificationStatus, "unidentified and not yet associated with a mapped bed");
  assert.ok(Math.abs(observation.absoluteLocalPoint[0] - 420) < 1e-6);
  assert.ok(Math.abs(observation.absoluteLocalPoint[1] + 180) < 1e-6);
  assert.equal(observation.x, observation.absoluteLocalPoint[0]);
  assert.equal(observation.y, observation.absoluteLocalPoint[1]);
});

test("broken hierarchy and source references fail validation", () => {
  const value = dataset();
  value.collections.beds.features[0].properties.parentId = "missing-garden";
  value.collections.plants.features[0].properties.provenance.sourceId = "missing-source";
  const errors = validateGardenSpatialDataset(value);
  assert.ok(errors.some((message) => message.includes("missing parent missing-garden")));
  assert.ok(errors.some((message) => message.includes("unknown source missing-source")));
});

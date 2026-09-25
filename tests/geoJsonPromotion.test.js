import assert from "node:assert/strict";
import test from "node:test";

import {
  geometryCoversPoint,
  representativePoint,
  selectSourceFeaturesWithinParcels
} from "../src/lib/spatial/geoJsonPromotion.js";

const parcelCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "parcel-b",
      geometry: {type: "Polygon", coordinates: [[[10, 0], [20, 0], [20, 10], [10, 10], [10, 0]]]},
      properties: {}
    },
    {
      type: "Feature",
      id: "parcel-a",
      geometry: {type: "Polygon", coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]]},
      properties: {}
    }
  ]
};

test("representative points stay in concave polygons and outside their holes", () => {
  const concave = {
    type: "Polygon",
    coordinates: [
      [[0, 0], [8, 0], [8, 2], [2, 2], [2, 8], [0, 8], [0, 0]],
      [[0.5, 0.5], [1.5, 0.5], [1.5, 1.5], [0.5, 1.5], [0.5, 0.5]]
    ]
  };
  const point = representativePoint(concave);
  assert.equal(geometryCoversPoint(concave, point), true);
  assert.equal(geometryCoversPoint(concave, [1, 1]), false);
  assert.equal(geometryCoversPoint(concave, [0, 4]), true, "parcel boundaries count as covered");
});

test("source promotion is deterministic and preserves source/snapshot provenance", () => {
  const source = {
    type: "FeatureCollection",
    properties: {
      sourceId: "massgis-example",
      sourceEndpoint: "https://example.test/FeatureServer/0",
      savedAt: "2026-08-24T00:00:00Z",
      retrievedAt: "Mon, 24 Aug 2026 00:00:00 GMT",
      queryFingerprint: "abc123"
    },
    features: [
      {
        type: "Feature",
        id: "massgis-example:inside",
        geometry: {type: "Polygon", coordinates: [[[2, 2], [4, 2], [4, 4], [2, 4], [2, 2]]]},
        properties: {sourceFeatureId: "inside", SOURCEDATE: 20250400}
      },
      {
        type: "Feature",
        id: "massgis-example:outside",
        geometry: {type: "Point", coordinates: [25, 5]},
        properties: {sourceFeatureId: "outside"}
      },
      {
        type: "Feature",
        id: "massgis-example:boundary",
        geometry: {type: "Point", coordinates: [10, 5]},
        properties: {sourceFeatureId: "boundary"}
      }
    ]
  };
  const selected = selectSourceFeaturesWithinParcels(source, parcelCollection, {snapshotFile: "data/source.geojson"});
  assert.deepEqual(selected.features.map((feature) => feature.properties.sourceFeatureId), ["inside", "boundary"]);
  assert.equal(selected.features[0].properties.SOURCEDATE, 20250400);
  assert.equal(selected.features[0].properties.parcelId, "parcel-a");
  assert.equal(selected.features[0].properties.provenance.sourceId, "massgis-example");
  assert.equal(selected.features[0].properties.provenance.sourceSnapshot.file, "data/source.geojson");
  assert.equal(selected.features[1].properties.parcelId, "parcel-a", "shared boundaries resolve to the stable sorted parcel id");
  assert.equal(selected.properties.selectedFromCount, 3);
  assert.equal(selected.properties.selectedFeatureCount, 2);
  assert.equal(selected.properties.parcelClipped, false);
});

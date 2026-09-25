import assert from "node:assert/strict";
import test from "node:test";

import {
  completeLocalSiteGeometry,
  localSiteGeometryError,
  localGeometryMeasurements,
  localSiteGeometryVertices,
  updateConnectedSiteVertices,
  updateLocalSiteGeometryVertex
} from "../src/lib/spatial/siteGeometryEditor.js";

test("draft point, line, and polygon geometry has ordinary GeoJSON structure", () => {
  assert.deepEqual(completeLocalSiteGeometry("Point", [[1, 2]]), {type: "Point", coordinates: [1, 2]});
  assert.deepEqual(completeLocalSiteGeometry("LineString", [[0, 0], [12, 0]]), {
    type: "LineString", coordinates: [[0, 0], [12, 0]]
  });
  assert.deepEqual(completeLocalSiteGeometry("Polygon", [[0, 0], [12, 0], [12, 12]]), {
    type: "Polygon", coordinates: [[[0, 0], [12, 0], [12, 12], [0, 0]]]
  });
  assert.equal(completeLocalSiteGeometry("Polygon", [[0, 0], [12, 0]]), null);
});

test("polygon closing vertices stay coincident during vertex edits", () => {
  const geometry = {type: "Polygon", coordinates: [[[0, 0], [12, 0], [12, 12], [0, 0]]]};
  assert.equal(localSiteGeometryVertices(geometry).length, 3);
  const moved = updateLocalSiteGeometryVertex(geometry, [0, 0], [-6, -6]);
  assert.deepEqual(moved.coordinates[0][0], [-6, -6]);
  assert.deepEqual(moved.coordinates[0].at(-1), [-6, -6]);
  assert.deepEqual(geometry.coordinates[0][0], [0, 0], "source geometry is not mutated");
});

test("shared topology node IDs keep independently stored path endpoints continuous", () => {
  const features = [
    {id: "spine", topologyNodeIds: ["A", "J"], localGeometry: {type: "LineString", coordinates: [[0, 0], [12, 12]]}},
    {id: "branch", topologyNodeIds: ["J", "B"], localGeometry: {type: "LineString", coordinates: [[12, 12], [24, 0]]}},
    {id: "nearby", topologyNodeIds: ["C", "D"], localGeometry: {type: "LineString", coordinates: [[12, 12], [30, 30]]}}
  ];
  const updated = updateConnectedSiteVertices(features, "spine", [1], [15, 10]);
  assert.deepEqual(updated[0].localGeometry.coordinates[1], [15, 10]);
  assert.deepEqual(updated[1].localGeometry.coordinates[0], [15, 10]);
  assert.deepEqual(updated[2].localGeometry.coordinates[0], [12, 12], "coincidence without a node ID does not create topology");
});

test("draw measurements report local feet and square feet", () => {
  assert.equal(localGeometryMeasurements("LineString", [[0, 0], [36, 48]]).lengthFeet, 5);
  assert.equal(localGeometryMeasurements("Polygon", [[0, 0], [24, 0], [24, 12], [0, 12]]).areaSquareFeet, 2);
});

test("area validation rejects crossing, touching and collapsed boundaries", () => {
  const polygon = (points) => ({type: "Polygon", coordinates: [points]});
  for (const ring of [
    [[0,0],[10,10],[0,10],[10,0],[0,0]],
    [[0,0],[10,0],[5,0],[10,10],[0,10],[0,0]],
    [[0,0],[10,0],[10,10],[5,0],[0,10],[0,0]],
    [[0,0],[10,0],[10,0],[0,10],[0,0]],
    [[0,0],[10,0],[20,0],[0,0]],
    [[0,0],[10,0],[10,10]],
    [[0,0],[Infinity,0],[10,10],[0,0]]
  ]) assert.ok(localSiteGeometryError(polygon(ring)), JSON.stringify(ring));
  const concave = [[0,0],[5,0],[10,0],[10,10],[5,5],[0,10],[0,0]];
  assert.equal(localSiteGeometryError(polygon(concave)), null);
  assert.equal(localSiteGeometryError(polygon([...concave].reverse())), null);
});

test("area holes stay inside and separate from other boundaries", () => {
  const square = (x,y,size) => [[x,y],[x+size,y],[x+size,y+size],[x,y+size],[x,y]];
  const validate = (...holes) => localSiteGeometryError({type: "Polygon", coordinates: [square(0,0,100), ...holes]});
  assert.equal(validate(square(10,10,20), square(60,60,20)), null);
  for (const holes of [
    [square(110,10,20)], [square(90,10,20)], [square(0,10,20)],
    [square(10,10,20), square(20,20,20)],
    [square(10,10,40), square(20,20,10)]
  ]) assert.ok(validate(...holes));
});

test("path validation allows crossings but rejects collapsed segments", () => {
  assert.equal(localSiteGeometryError({type:"LineString", coordinates:[[0,0],[10,10],[0,10],[10,0]]}), null);
  assert.ok(localSiteGeometryError({type:"LineString", coordinates:[[0,0],[0,0]]}));
  assert.equal(localSiteGeometryError({type:"Point", coordinates:[0,0]}), null);
  assert.ok(localSiteGeometryError({type:"Point", coordinates:[NaN,0]}));
});

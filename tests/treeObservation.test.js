import assert from "node:assert/strict";
import test from "node:test";

import {
  deriveTreeShadowVector,
  derivedTreeCanopyEllipse,
  derivedTreeShadowEllipse,
  treeCrownAxesInches
} from "../src/lib/spatial/treeObservation.js";

const tree = {
  x: 120,
  y: -240,
  crownWidthFeet: 30,
  crownDepthFeet: 24,
  heightEstimateFeet: 40,
  heightConfidence: "low"
};

test("tree-center points derive crown display axes without changing geometry", () => {
  assert.deepEqual(treeCrownAxesInches(tree), {width: 360, height: 288});
  assert.deepEqual(derivedTreeCanopyEllipse(tree), {
    cx: 120,
    cy: -240,
    rx: 180,
    ry: 144,
    rotationDegrees: 0,
    derivedFrom: "tree-center point and crown-axis attributes"
  });
  assert.deepEqual(tree, {
    x: 120,
    y: -240,
    crownWidthFeet: 30,
    crownDepthFeet: 24,
    heightEstimateFeet: 40,
    heightConfidence: "low"
  });
});

test("shadow vectors use the local east/south axes and explicit sun position", () => {
  const noon = deriveTreeShadowVector(tree, {solarAzimuthDegrees: 180, solarAltitudeDegrees: 45});
  assert.ok(Math.abs(noon.lengthFeet - 40) < 1e-9);
  assert.ok(Math.abs(noon.dxInches) < 1e-9);
  assert.ok(Math.abs(noon.dyInches + 480) < 1e-9, "southern sun casts a northward (negative local y) shadow");
  assert.equal(noon.heightConfidence, "low");

  const envelope = derivedTreeShadowEllipse(tree, {solarAzimuthDegrees: 180, solarAltitudeDegrees: 45});
  assert.equal(envelope.cx, 120);
  assert.ok(Math.abs(envelope.cy + 480) < 1e-9);
  assert.equal(envelope.derivedFrom.includes("supplied sun position"), true);
});

test("shadow calculation declines when height or daylight geometry is absent", () => {
  assert.equal(deriveTreeShadowVector({}, {solarAzimuthDegrees: 180, solarAltitudeDegrees: 45}), null);
  assert.equal(deriveTreeShadowVector(tree, {solarAzimuthDegrees: 180, solarAltitudeDegrees: -2}), null);
});


test('clearing a height restores unknown and removes obsolete evidence without changing crown geometry', async () => {
  const {updateTreeHeightEstimate} = await import('../src/lib/spatial/treeObservation.js');
  const observation={...tree,heightEstimateRangeFeet:[35,45],heightEstimateMethod:'Earlier estimate',localGeometry:{type:'Point',coordinates:[120,-240]}};
  const crown=derivedTreeCanopyEllipse(observation);
  assert.equal(updateTreeHeightEstimate(observation,'25'),true);
  assert.equal(observation.heightEstimateFeet,25);
  assert.equal(observation.heightEstimateRangeFeet,null);
  assert.equal(observation.heightConfidence,'low');
  assert.ok(deriveTreeShadowVector(observation,{solarAltitudeDegrees:45,solarAzimuthDegrees:180}));
  const before=structuredClone(observation);
  for(const invalid of ['bad',-2,0,Infinity,'10 feet'])assert.equal(updateTreeHeightEstimate(observation,invalid),false);
  assert.deepEqual(observation,before);
  assert.equal(updateTreeHeightEstimate(observation,''),true);
  assert.equal(observation.heightEstimateFeet,null);
  assert.equal(observation.heightEstimateMethod,null);
  assert.equal(observation.heightConfidence,'unknown');
  assert.equal(deriveTreeShadowVector(observation,{solarAltitudeDegrees:45,solarAzimuthDegrees:180}),null);
  assert.deepEqual(derivedTreeCanopyEllipse(observation),crown);
  assert.deepEqual(observation.localGeometry,{type:'Point',coordinates:[120,-240]});
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  GARDEN_DETAIL_LEVELS,
  MIN_GARDEN_VIEW_SPAN_INCHES,
  clampViewportToExtent,
  fitViewportToBounds,
  formatGroundDistance,
  gardenViewProfile,
  gardenViewProfileForElement,
  groundResolutionInches,
  middleTierBoundaryInchesPerPixel,
  scaleBarForView
} from "../src/lib/spatial/gardenViewScale.js";

test("ground resolution follows the limiting meet-scaled screen dimension", () => {
  assert.equal(
    groundResolutionInches({width: 9600, height: 3200}, {width: 960, height: 640}),
    10
  );
  assert.equal(
    groundResolutionInches({width: 2400, height: 4800}, {width: 1200, height: 400}),
    12
  );
});

test("semantic levels cover estate through individual-plant detail", () => {
  const screen = {width: 100, height: 100};
  const profileAt = (inchesPerPixel) => gardenViewProfile({
    width: inchesPerPixel * screen.width,
    height: inchesPerPixel * screen.height
  }, screen);

  assert.deepEqual(GARDEN_DETAIL_LEVELS.map((level) => level.id), ["estate", "parcel", "garden", "bed", "plant"]);
  assert.equal(profileAt(48).id, "estate");
  assert.equal(profileAt(12).id, "parcel");
  assert.equal(profileAt(3).id, "garden");
  assert.equal(profileAt(0.75).id, "bed");
  assert.equal(profileAt(0.5).id, "plant");
});

test("the middle semantic boundary can follow visible information without moving outer tiers", () => {
  const screen = {width: 100, height: 100};
  const viewportAt = (inchesPerPixel) => ({
    width: inchesPerPixel * screen.width,
    height: inchesPerPixel * screen.height
  });

  assert.equal(middleTierBoundaryInchesPerPixel(), 12);
  assert.equal(gardenViewProfile(viewportAt(13), screen).id, "parcel");

  const gardenRich = gardenViewProfile(viewportAt(13), screen, {
    featureCounts: {plants: new Array(120), beds: new Set(new Array(8).fill(0).map((_, index) => index))}
  });
  assert.equal(gardenRich.id, "garden");
  assert.equal(gardenRich.middleTierBoundaryInchesPerPixel, 14);
  assert.equal(gardenRich.contextAdapted, true);

  const siteRich = gardenViewProfile(viewportAt(10), screen, {
    informationFocus: "site",
    featureCounts: {structures: 12, paths: 8, utilities: 4, forests: 3}
  });
  assert.equal(siteRich.id, "parcel");
  assert.equal(siteRich.middleTierBoundaryInchesPerPixel, 8);

  const infrastructureRich = gardenViewProfile(viewportAt(10), screen, {
    featureCounts: {barriers: 8, water: 4, landscape: 3}
  });
  assert.equal(infrastructureRich.id, "parcel");
  assert.ok(infrastructureRich.middleTierBoundaryInchesPerPixel < 12);

  assert.equal(gardenViewProfile(viewportAt(49), screen, {informationFocus: "plant"}).id, "estate");
  assert.equal(gardenViewProfile(viewportAt(2), screen, {informationFocus: "forest"}).id, "bed");
});

test("element profiles accept the same optional information context", () => {
  const element = {getBoundingClientRect: () => ({width: 100, height: 100})};
  const profile = gardenViewProfileForElement(
    {width: 1300, height: 1300},
    element,
    {informationFocus: "garden"}
  );
  assert.equal(profile.id, "garden");
  assert.ok(profile.middleTierBoundaryInchesPerPixel > 13);
});

test("viewport clamping honors the absolute floor and preserves aspect", () => {
  const extent = {x: -120, y: -80, width: 1000, height: 800};
  const clamped = clampViewportToExtent(
    {x: -500, y: 900, width: 8, height: 4},
    extent
  );

  assert.equal(MIN_GARDEN_VIEW_SPAN_INCHES, 24);
  assert.deepEqual(clamped, {x: -120, y: 696, width: 48, height: 24});
  assert.equal(clamped.width / clamped.height, 2);
});

test("viewport clamping fits oversize views without distorting them", () => {
  const extent = {x: -120, y: -80, width: 1000, height: 800};
  const clamped = clampViewportToExtent(
    {x: -500, y: 0, width: 2000, height: 1000},
    extent
  );

  assert.deepEqual(clamped, {x: -120, y: 0, width: 1000, height: 500});
  assert.equal(clamped.width / clamped.height, 2);
});

test("viewport clamping retains negative extent origins for missing coordinates", () => {
  const clamped = clampViewportToExtent(
    {width: 100, height: 100},
    {x: -120, y: -80, width: 1000, height: 800}
  );
  assert.deepEqual(clamped, {x: -120, y: -80, width: 100, height: 100});
});

test("an infeasible minimum yields to extent containment while retaining aspect", () => {
  const clamped = clampViewportToExtent(
    {x: 0, y: 0, width: 10, height: 1},
    {x: 0, y: 0, width: 30, height: 100}
  );
  assert.deepEqual(clamped, {x: 0, y: 0, width: 30, height: 3});
  assert.equal(clamped.width / clamped.height, 10);
});

test("fit bounds preserve center and aspect while flooring both dimensions", () => {
  const portrait = fitViewportToBounds(
    {x: -50, y: 25, width: 10, height: 12},
    0.5,
    {paddingRatio: 0}
  );
  assert.deepEqual(portrait, {x: -57, y: 7, width: 24, height: 48});
  assert.equal(portrait.width / portrait.height, 0.5);

  const landscape = fitViewportToBounds(
    {x: 10, y: 20, width: 12, height: 10},
    2,
    {paddingRatio: 0}
  );
  assert.deepEqual(landscape, {x: -8, y: 13, width: 48, height: 24});
});

test("scale bars choose a compact nice distance and human-readable unit", () => {
  const scale = scaleBarForView(
    {width: 1200, height: 800},
    {width: 1000, height: 800},
    100
  );
  assert.deepEqual(scale, {
    distanceInches: 100,
    pixels: 100 / 1.2,
    label: "8.3 ft"
  });
  assert.equal(formatGroundDistance(6), "6 in");
  assert.equal(formatGroundDistance(120), "10 ft");
  assert.equal(formatGroundDistance(63360), "1 mi");
});


test("navigation margin allows panning at full extent without losing the garden", () => {
  const extent = {x: 10, y: 20, width: 100, height: 80};
  const options = {panPaddingRatio: 0.5};
  assert.deepEqual(clampViewportToExtent({...extent, x: 30, y: 40}, extent, options), {x: 30, y: 40, width: 100, height: 80});
  assert.deepEqual(clampViewportToExtent({...extent, x: 10000, y: -10000}, extent, options), {x: 60, y: -20, width: 100, height: 80});
  assert.deepEqual(clampViewportToExtent({...extent, x: 30, y: 40}, extent), extent);
});

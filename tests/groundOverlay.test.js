import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";


import {groundOverlayLocalFrame, normalizeGroundOverlay} from "../src/lib/spatial/groundOverlay.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const overlay = {
  id: "bbg-map-reference",
  name: "Map reference",
  href: "./map.png",
  latLonBox: {
    north: 42.303,
    south: 42.299,
    east: -73.333,
    west: -73.338,
    rotation: -40
  }
};
const property = {localOrigin: {lon: -73.33659599658195, lat: 42.29949110795708}};

test("a synthetic rotated GroundOverlay retains its registration", () => {
  const normalized = normalizeGroundOverlay(overlay);
  assert.equal(normalized.north, overlay.latLonBox.north);
  assert.equal(normalized.rotation, -40);
  const frame = groundOverlayLocalFrame(overlay, property);
  assert.ok(frame.width > 14000);
  assert.ok(frame.height > 11000);
  assert.equal(frame.svgRotation, 40);
  assert.ok(frame.center.every(Number.isFinite));
});

test("invalid overlay bounds fail closed", () => {
  assert.throws(() => normalizeGroundOverlay({...overlay, latLonBox: {...overlay.latLonBox, north: 42.2}}), /north must be greater/);
});


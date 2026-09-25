import assert from "node:assert/strict";
import {readdir, readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  GARDEN_BED_ITEMS,
  GARDEN_PARCEL_ITEMS,
  GARDEN_PLANT_ITEMS,
  GARDEN_SITE_ITEMS
} from "../src/data/api/v1/generated/collections.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const canonicalRoot = path.join(root, "data/spatial/gardens");
const layers = {
  parcels: GARDEN_PARCEL_ITEMS,
  site: GARDEN_SITE_ITEMS,
  beds: GARDEN_BED_ITEMS,
  plants: GARDEN_PLANT_ITEMS
};

test("public spatial collections are exact aggregates of the reviewed per-garden layers", async () => {
  const gardens = (await readdir(canonicalRoot, {withFileTypes: true}))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert.ok(gardens.length > 0, "at least one canonical garden spatial dataset is required");

  for (const [layer, publicItems] of Object.entries(layers)) {
    const canonicalFeatures = [];
    for (const gardenId of gardens) {
      const file = path.join(canonicalRoot, gardenId, `${layer}.geojson`);
      const source = JSON.parse(await readFile(file, "utf8"));
      assert.equal(source.type, "FeatureCollection");
      canonicalFeatures.push(...source.features);
    }
    const expectedById = new Map(canonicalFeatures.map((feature) => [feature.id, feature]));
    const actualById = new Map(publicItems.features.map((feature) => [feature.id, feature]));
    assert.equal(actualById.size, publicItems.features.length, `${layer} API ids must be unique`);
    assert.deepEqual(actualById, expectedById, `${layer} API must preserve canonical features without reinterpretation`);
    assert.equal(publicItems.numberMatched, canonicalFeatures.length);
    assert.equal(publicItems.numberReturned, canonicalFeatures.length);
  }
});


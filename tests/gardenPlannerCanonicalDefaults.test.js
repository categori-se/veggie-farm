import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {PROPERTY_CONTEXT} from "../src/data/propertyContext.js";
import {getGardenSpatialDataset} from "../src/lib/data/publicCatalogApi.js";
import {gardenSpatialDatasetToWorkspace} from "../src/lib/spatial/gardenFeatureCollections.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const plannerSource = fs.readFileSync(path.join(root, "src/components/gardenPlanner.js"), "utf8");

test("the BBG planner starter is projected from the canonical public GIS collections", () => {
  const dataset = getGardenSpatialDataset("berkshire-botanical-garden");
  const workspace = gardenSpatialDatasetToWorkspace(dataset, PROPERTY_CONTEXT);

  assert.equal(workspace.beds.length, dataset.collections.beds.features.length);
  assert.equal(
    workspace.structures.length + workspace.vegetation.length,
    dataset.collections.site.features.length
  );
  assert.equal(
    workspace.placements.length,
    dataset.collections.plants.features.filter((feature) => feature.geometry?.type === "Point").length
  );
  assert.equal(workspace.placements.length, 0, "unsupported KMZ points are not starter plantings");
  assert.ok(workspace.beds.every((bed) => bed.canonicalGeometry?.type === "Polygon"));
  assert.ok(workspace.placements.every((placement) => placement.absoluteLocalPoint?.length === 2));
  for (const sourceFeature of dataset.collections.plants.features.filter((feature) => !feature.properties?.bedId)) {
    const placement = workspace.placements.find(({id}) => id === sourceFeature.id);
    assert.equal(placement?.bedId, null);
    if (!sourceFeature.properties?.plantId && !sourceFeature.properties?.taxonId) {
      assert.equal(placement?.plantId, null);
    }
  }

  assert.match(plannerSource, /getGardenSpatialDataset\(PROPERTY_CONTEXT\.id\)/);
  assert.match(plannerSource, /gardenSpatialDatasetToWorkspace\(/);
  assert.match(plannerSource, /placements:\s*DEFAULT_PLACEMENTS/);
  assert.doesNotMatch(plannerSource, /id:\s*"p1"[\s\S]*plantId:\s*"tomato"/);
});

test("planner normalization does not coerce bedless observations or unknown trees", () => {
  assert.match(plannerSource, /plantId:\s*item\.plantId \|\| null/);
  assert.doesNotMatch(plannerSource, /placement\.bedId\s*=\s*state\.activeBedId/);
  assert.match(plannerSource, /Bedless source observations are absolute GIS points/);
  assert.match(plannerSource, /class", "unassigned-observation-layer"/);
});

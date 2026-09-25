import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import {modelAppliesToPlant} from "../src/lib/garden/plantModel.js";

const {features} = JSON.parse(await readFile(new URL("../src/data/api/v1/collections/models/items.json", import.meta.url)));
const model = id => features.find(feature => feature.id === id);

test("harvested produce cannot replace growing-plant geometry", () => {
  assert.equal(modelAppliesToPlant(model("quaternius-tomato"), {id: "tomato"}), false);
  assert.equal(modelAppliesToPlant(model("quaternius-pumpkin"), {id: "pumpkin"}), false);
  assert.equal(modelAppliesToPlant(model("quaternius-pumpkin"), {id: "winter-squash"}), false);
});

test("mapped growing plants and flower references remain available", () => {
  assert.equal(modelAppliesToPlant(model("quaternius-corn"), {id: "corn"}), true);
  assert.equal(modelAppliesToPlant(model("quaternius-flowering-plant"), {id: "aster", group: "Flower"}), true);
  assert.equal(modelAppliesToPlant(model("quaternius-corn"), {id: "tomato"}), false);
  assert.equal(modelAppliesToPlant(null, {id: "tomato"}), false);
});

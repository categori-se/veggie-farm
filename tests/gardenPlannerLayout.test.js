import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const plannerPath = path.join(root, "src/components/gardenPlanner.js");

test("the active garden visual stays between its controls and reference information", () => {
  const source = fs.readFileSync(plannerPath, "utf8");
  const markers = [
    '<section class="planner-commandbar" aria-label="Planner command bar">',
    '<section class="planner-view parcel-map-view">',
    '<div class="garden-views">',
    '<footer class="garden-statusbar" data-role="metrics" aria-label="Garden plan status"></footer>',
    '<details class="garden-information-card" data-role="garden-information-card">'
  ];
  const positions = markers.map((marker) => source.indexOf(marker));

  for (const [index, position] of positions.entries()) {
    assert.notEqual(position, -1, `planner markup is missing ${markers[index]}`);
  }
  for (let index = 1; index < positions.length; index += 1) {
    assert.ok(positions[index - 1] < positions[index], `${markers[index]} should follow ${markers[index - 1]}`);
  }
});

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "src/components/gardenPlanner.js"), "utf8");

function between(start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  assert.notEqual(startIndex, -1, `missing ${start}`);
  assert.notEqual(endIndex, -1, `missing ${end}`);
  return source.slice(startIndex, endIndex);
}

test("planner tools act as mutually exclusive GIS write locks", () => {
  assert.match(source, /const PLANNER_EDIT_LAYER_BY_TOOL = Object\.freeze\(\{[\s\S]*beds: "beds"[\s\S]*structures: "site"[\s\S]*vegetation: "vegetation"/);
  assert.match(source, /export function plannerCanEditFeature\(state, featureType\)/);

  const selection = between("function selectGardenFeature", "function featureInteractionHint");
  assert.doesNotMatch(selection, /state\.activeTool\s*=/, "inspecting a feature must not silently unlock its layer");
  assert.match(source, /state\.activeTool = "select";/, "the Canvas tool should provide an inspect-only mode");
  assert.match(source, /site: "Select or move whole site features"/, "the canvas heading should describe whole-feature infrastructure editing");
});

test("Map and 2D drag handlers are gated independently by feature family", () => {
  const parcelMap = between("function renderParcelMap", "function render2dPlan");
  assert.match(parcelMap, /plannerCanEditFeature\(state, "vegetation"\)/);
  assert.match(parcelMap, /plannerCanEditFeature\(state, "structure"\)/);
  assert.match(parcelMap, /plannerCanEditFeature\(state, "bed"\)/);
  assert.match(parcelMap, /plantsEditable:[\s\S]*plannerCanEditFeature\(state, "placement"\)/);

  const propertyPlan = between("function renderPropertyPlan", "function renderPropertyStructures2d");
  for (const type of ["vegetation", "structure", "bed", "placement"]) {
    assert.match(propertyPlan, new RegExp(`plannerCanEditFeature\\(state, "${type}"\\)`));
  }

  const beds = between("function renderPropertyBeds2d", "function planViewBounds");
  assert.match(beds, /if \(options\.plantsEditable\) plantNodes\.call\(plantDrag\)/);
  assert.match(beds, /if \(options\.editable\) beds\.call\(bedDrag\)/);
  assert.match(beds, /beds\.on\("click"/, "locked beds must remain selectable");
});

test("3D uses the same write lock and continuous site geometry moves as one feature", () => {
  const interactions = between("function setupThreeFeatureInteractions", "function createThreeScene");
  assert.match(interactions, /const featureEditable = plannerCanEditFeature\(three\.state, hit\.ref\.type\)/);
  assert.match(interactions, /if \(!featureEditable\)/);
  assert.match(interactions, /plannerCanEditFeature\(three\.state, "placement"\)/);

  const drag = between("function applyThreeFeatureDrag", "function setupThreeFeatureInteractions");
  assert.match(drag, /if \(drag\.ref\.type === "structure"\) moveStructureTo\(feature, worldX, worldY\)/);
  const move = between("function moveStructureTo", "function resizeStructureTo");
  assert.match(move, /transformStructureLocalGeometry\(structure/);
  assert.match(move, /\[pointX \+ dx, pointY \+ dy\]/, "every LineString vertex should move with its parent site feature");
});

test("the inspector explains and enforces cross-layer locks", () => {
  const guard = between("function inspectorEditGuardMarkup", "function renderInspector");
  assert.match(guard, /data-action="edit-selected-layer"/);
  assert.match(guard, /container\.querySelectorAll\("input, select, textarea, \.danger-action"\)/);
  assert.match(guard, /control\.disabled = true/);
  assert.match(source, /class="edit-mode-status" data-role="edit-mode-status" role="status"/);
});

test("wide transparent LineString hit targets never fill across path vertices", () => {
  assert.match(source, /\.site-line-hit\s*\{[\s\S]*?fill:\s*none;[\s\S]*?stroke:\s*transparent;/);
});

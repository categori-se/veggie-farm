import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const planner = fs.readFileSync(path.join(root, "src/components/gardenPlanner.js"), "utf8");
const studio = fs.readFileSync(path.join(root, "src/studio.md"), "utf8");
test("review evidence visibility and geometry stay outside serializable planner state", () => {
  const defaultSettings = planner.slice(
    planner.indexOf("const DEFAULT_MAP_SETTINGS"),
    planner.indexOf("const DEFAULT_VIEW_BEARING")
  );
  const normalizedSettings = planner.slice(
    planner.indexOf("function normalizeMapSettings"),
    planner.indexOf("function mapVisibleBeds")
  );

  assert.doesNotMatch(defaultSettings, /showSourceEvidence/);
  assert.doesNotMatch(normalizedSettings, /showSourceEvidence/);
  assert.match(planner, /const SOURCE_EVIDENCE_RUNTIME = new WeakMap\(\)/);
  assert.match(planner, /showReferenceOverlay:\s*false/);
  assert.match(planner, /configureGardenSourceEvidence\(state, options\.sourceEvidenceByGardenId, options\.showSourceEvidence === true\)/);
  assert.match(planner, /function configureGardenSourceEvidence\(state, collections, visible = false\)/);
  assert.match(planner, /visible:\s*visible === true/);
  assert.match(planner, /setGardenSourceEvidenceVisibility\(state, input\.checked\)/);
});

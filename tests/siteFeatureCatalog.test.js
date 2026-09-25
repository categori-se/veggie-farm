import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_SITE_FEATURE_VISIBILITY,
  SITE_FEATURE_CATEGORIES,
  SITE_FEATURE_DEFINITIONS,
  filterVisibleSiteFeatures,
  isSiteFeatureVisible,
  normalizeSiteFeatureType,
  normalizeSiteFeatureVisibility,
  siteFeatureCategory,
  siteFeatureDefinition,
  siteFeatureLegendDescriptor,
  siteFeatureLegendItems,
  siteFeatureVisibilityKey
} from "../src/data/siteFeatureCatalog.js";
import {PROPERTY_STRUCTURES} from "../src/data/propertyContext.js";

test("the catalog classifies every currently bundled structure type", () => {
  const currentTypes = new Set(PROPERTY_STRUCTURES.map((feature) => feature.type));
  for (const type of currentTypes) {
    const definition = siteFeatureDefinition(type);
    assert.equal(definition.type, type);
    assert.equal(definition.known, true, `${type} should have an explicit definition`);
    assert.ok(SITE_FEATURE_CATEGORIES[definition.category]);
    assert.ok(definition.geometryKinds.length >= 1);
    assert.ok(["area", "line", "symbol"].includes(definition.legend.swatch));
  }

  assert.equal(siteFeatureDefinition("path").category, "circulation");
  assert.equal(siteFeatureDefinition("road").defaultGeometryKind, "LineString");
  assert.equal(siteFeatureDefinition("parking").defaultGeometryKind, "Polygon");
  assert.equal(siteFeatureDefinition("water").category, "water");
  assert.equal(siteFeatureDefinition("orchard").category, "landscape");
});

test("barriers, utilities, and water infrastructure have geometry-aware definitions", () => {
  for (const type of ["fence", "wall", "retaining-wall", "gate"]) {
    assert.equal(siteFeatureDefinition(type).category, "barriers");
  }
  for (const type of [
    "utility-pole", "telephone-pole", "electric-pole", "joint-use-pole",
    "utility-line", "telephone-line", "electric-line"
  ]) {
    assert.equal(siteFeatureDefinition(type).category, "utilities");
  }
  for (const type of ["water", "well", "spigot", "hydrant", "drain", "culvert"]) {
    assert.equal(siteFeatureDefinition(type).category, "water");
  }

  assert.deepEqual(siteFeatureDefinition("utility-pole").geometryKinds, ["Point"]);
  assert.equal(siteFeatureDefinition("fence").defaultGeometryKind, "LineString");
  assert.equal(siteFeatureDefinition("gate").defaultGeometryKind, "Point");
  assert.equal(siteFeatureDefinition("well").defaultGeometryKind, "Point");
  assert.equal(siteFeatureDefinition("culvert").defaultGeometryKind, "LineString");
});

test("unknown feature type slugs are preserved with a safe fallback definition", () => {
  assert.equal(normalizeSiteFeatureType("  Custom Pergola  "), "custom-pergola");
  assert.equal(normalizeSiteFeatureType("pergola"), "pergola");

  const unknown = siteFeatureDefinition("pergola");
  assert.equal(unknown.type, "pergola");
  assert.equal(unknown.label, "Pergola");
  assert.equal(unknown.known, false);
  assert.equal(unknown.category, "buildings");
  assert.equal(unknown.legacyEnvelope, true);
  assert.equal(SITE_FEATURE_DEFINITIONS.pergola, undefined);
  assert.strictEqual(siteFeatureDefinition({type: "pergola"}), unknown);
});

test("visibility helpers migrate the legacy structure switch and honor categories", () => {
  assert.deepEqual(normalizeSiteFeatureVisibility({showStructures: false}), {
    showStructures: false,
    showBuildings: false,
    showCirculation: false,
    showBarriers: false,
    showUtilities: false,
    showWater: false,
    showLandscapeFeatures: false
  });

  const utilitiesHidden = normalizeSiteFeatureVisibility({showUtilities: false});
  assert.equal(utilitiesHidden.showStructures, true);
  assert.equal(isSiteFeatureVisible("house", utilitiesHidden), true);
  assert.equal(isSiteFeatureVisible("utility-pole", utilitiesHidden), false);
  assert.equal(siteFeatureVisibilityKey("utility-pole"), "showUtilities");
  assert.equal(siteFeatureCategory("path").id, "circulation");

  const features = [{type: "house"}, {type: "road"}, {type: "utility-pole"}, {type: "well"}];
  assert.deepEqual(
    filterVisibleSiteFeatures(features, {...DEFAULT_SITE_FEATURE_VISIBILITY, showCirculation: false, showUtilities: false}),
    [features[0], features[3]]
  );

  // The legacy master remains authoritative even if a category value happens to
  // be true in an older or hand-edited payload.
  assert.equal(isSiteFeatureVisible("house", {showStructures: false, showBuildings: true}), false);
});

test("legend descriptors are map-folio-ready, de-duplicated, visible, and ordered", () => {
  const pole = siteFeatureLegendDescriptor("utility-pole");
  assert.deepEqual(
    {swatch: pole.swatch, symbol: pole.symbol, fill: pole.fill, stroke: pole.stroke, active: pole.active},
    {swatch: "symbol", symbol: "cross", fill: "#f4f1df", stroke: "#4d554f", active: true}
  );

  const legend = siteFeatureLegendItems([
    {type: "utility-pole"},
    {type: "path"},
    {type: "house"},
    {type: "path"},
    {type: "well"}
  ], {showUtilities: false});
  assert.deepEqual(legend.map((item) => item.type), ["house", "path", "well"]);
  assert.ok(legend.every((item) => item.active));
  assert.ok(legend.every((item) => item.label && item.category && item.geometryKind));

  const withHidden = siteFeatureLegendItems(["utility-pole", "house"], {showUtilities: false}, {includeHidden: true});
  assert.equal(withHidden.find((item) => item.type === "utility-pole").active, false);
});


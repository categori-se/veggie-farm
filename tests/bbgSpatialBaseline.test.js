import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

import {DEFAULT_VEGETATION, PROPERTY_STRUCTURES} from "../src/data/propertyContext.js";
import {lonLatToXyzRasterPixel} from "../src/lib/spatial/gisAlignment.js";
import {
  geometryCoversPoint,
  representativePoint
} from "../src/lib/spatial/geoJsonPromotion.js";

const gardenDirectory = new URL("../data/spatial/gardens/berkshire-botanical-garden/", import.meta.url);

async function json(url) {
  return JSON.parse(await fs.readFile(url, "utf8"));
}

test("BBG curation makes the supplied KMZ an unambiguous non-canonical sidecar", async () => {
  const curation = await json(new URL("curation.json", gardenDirectory));
  assert.deepEqual(Object.keys(curation).sort(), [
    "gardenId",
    "policy",
    "reviewEvidence",
    "schemaVersion",
    "structurePromotion"
  ]);
  assert.equal(curation.reviewEvidence.length, 1);
  assert.equal(curation.reviewEvidence[0].sourceId, "bbg-google-earth-example-2026-08-23");
  assert.equal(curation.reviewEvidence[0].canonicalPromotion, "none");
});

test("one MassGIS footprint replaces its overlapping maintained aerial roof trace", async () => {
  const site = await json(new URL("site.geojson", gardenDirectory));
  const ids = new Set(site.features.map((feature) => feature.id));
  assert.equal(ids.has("bbg-site-greenhouse-01"), false);
  assert.equal(ids.has("bbg-site-building-01"), false);

  const structure = site.features.find((feature) => feature.id === "bbg-center-house");
  assert.ok(structure);
  assert.deepEqual(structure.properties.aliases, []);
  assert.ok(structure.properties.provenance.semanticEvidence.some((evidence) => evidence.canonicalFeatureId));
  assert.equal(structure.properties.provenance.semanticEvidence.every((evidence) => evidence.geometryRole.includes("superseded")), true);
  assert.equal(JSON.stringify(structure).includes("bbg-google-earth-example-2026-08-23"), false);

  const canonicalGeometries = site.features.map((feature) => JSON.stringify(feature.geometry));
  assert.equal(new Set(canonicalGeometries).size, canonicalGeometries.length, "site output must not contain duplicate geometries");
});

test("reviewed roof corrections retain pixel observations and superseded provider geometry", async () => {
  const site = await json(new URL("site.geojson", gardenDirectory));
  const corrections = site.features.filter(feature => feature.properties.provenance.previousProviderFeature);
  assert.deepEqual(corrections.map(feature => feature.id).sort(), [
    "bbg-fitzpatrick-conservatory", "bbg-lexan-greenhouse", "bbg-passive-solar-greenhouse"
  ]);
  const raster = {zoom: 20, tileOrigin: [310677, 388066], tileSize: 256};
  for (const feature of corrections) {
    const provenance = feature.properties.provenance;
    assert.equal(provenance.previousProviderFeature.sourceVintage, "2012");
    assert.equal(provenance.previousProviderFeature.geometry.type, "Polygon");
    assert.notDeepEqual(feature.geometry, provenance.previousProviderFeature.geometry);
    assert.equal(provenance.confidence, "medium");
    assert.equal(provenance.digitizationUncertaintyPixels, 10);
    assert.equal(feature.geometry.coordinates[0].length, provenance.observedRasterPixels.length);
    feature.geometry.coordinates[0].forEach((point, index) => {
      const actual = lonLatToXyzRasterPixel(point, raster);
      const expected = provenance.observedRasterPixels[index];
      assert.ok(Math.hypot(actual[0] - expected[0], actual[1] - expected[1]) < 0.01,
        `${feature.id} canonical geometry must remain on its recorded image pixels`);
    });
  }
});

test("the full revision-3 site hierarchy and neutral physical-bed inventory remain canonical", async () => {
  const [parcels, site, beds, plants] = await Promise.all([
    json(new URL("parcels.geojson", gardenDirectory)),
    json(new URL("site.geojson", gardenDirectory)),
    json(new URL("beds.geojson", gardenDirectory)),
    json(new URL("plants.geojson", gardenDirectory))
  ]);
  const parcelIds = new Set(parcels.features.map((feature) => feature.id));
  const siteIds = new Set(site.features.map((feature) => feature.id));

  assert.equal(site.features.length, 71, "55 maintained site features, with 7 roofs superseded by 18 MassGIS roofprints, plus 5 mature-tree Points");
  assert.equal(beds.features.length, 48, "47 aerial-grid estimates plus one explicit planning study");
  assert.equal(plants.features.length, 0, "plant inventory remains empty until supported observations exist");
  assert.equal(siteIds.has("bbg-edible-gardens-section"), true);
  assert.equal(siteIds.has("bbg-childrens-vegetable-garden-section"), true);
  assert.deepEqual(
    new Set(site.features
      .filter((feature) => feature.properties.kind === "garden-subplot")
      .map((feature) => feature.id)),
    new Set(["bbg-edible-north-subplot", "bbg-edible-south-subplot", "bbg-childrens-main-grid"])
  );
  assert.equal(siteIds.has("bbg-main-garden-walk"), true);
  assert.equal(siteIds.has("bbg-wildflower-meadow-main-trail"), true);
  assert.equal(siteIds.has("bbg-site-garden-01"), false, "rough KML site polygons remain evidence rather than canonical duplicates");
  assert.equal(beds.features.some((feature) => feature.id.startsWith("bbg-bed-source-")), false, "rough KML beds remain evidence rather than replacing the full trace");
  assert.equal(
    JSON.stringify([...site.features, ...beds.features, ...plants.features]).includes("bbg-google-earth-example-2026-08-23"),
    false,
    "indicative KMZ records must contribute no canonical geometry or semantics"
  );
  const treeObservations = site.features.filter((feature) => feature.properties.collection === "vegetation");
  assert.equal(treeObservations.length, 5);
  assert.ok(treeObservations.every((feature) => feature.geometry.type === "Point"));
  assert.ok(treeObservations.every((feature) => feature.properties.kind === "tree"));
  assert.ok(treeObservations.every((feature) => feature.properties.geometryRepresentation === "point"));
  assert.ok(treeObservations.every((feature) => feature.properties.plantId == null));
  assert.ok(treeObservations.every((feature) => feature.properties.crownWidthFeet > 0 && feature.properties.crownDepthFeet > 0));
  assert.ok(treeObservations.every((feature) => feature.properties.heightEstimateFeet > 0));
  assert.ok(treeObservations.every((feature) => feature.properties.sourcePixel?.length === 2));
  assert.ok(treeObservations.every((feature) => feature.properties.provenance?.sourceId === "massgis-aerial-2025"));
  assert.equal(siteIds.has("bbg-west-roadside-canopy"), false);
  assert.equal(siteIds.has("bbg-southwest-forest-band"), false);
  for (const item of [...PROPERTY_STRUCTURES, ...DEFAULT_VEGETATION]) {
    assert.equal(siteIds.has(item.id), true, `${item.id} from the maintained revision-3 trace must not be dropped`);
  }

  for (const feature of [...site.features, ...beds.features, ...plants.features]) {
    assert.equal(parcelIds.has(feature.properties.parcelId), true, `${feature.id} must reference a canonical parcel id`);
  }
  for (const bed of beds.features) {
    assert.equal(siteIds.has(bed.properties.parentId), true, `${bed.id} must reference an existing garden-section feature`);
    const parent = site.features.find((feature) => feature.id === bed.properties.parentId);
    assert.equal(
      geometryCoversPoint(parent.geometry, representativePoint(bed.geometry)),
      true,
      `${bed.id} must be spatially contained by its canonical parent feature`
    );
  }

  const topologyCoordinates = new Map();
  for (const feature of site.features.filter((feature) => feature.geometry.type === "LineString")) {
    const nodeIds = feature.properties.topologyNodeIds || [];
    if (!nodeIds.length) continue;
    assert.equal(nodeIds.length, feature.geometry.coordinates.length, `${feature.id} topology nodes must match its vertices`);
    nodeIds.forEach((nodeId, index) => {
      const coordinate = feature.geometry.coordinates[index];
      if (topologyCoordinates.has(nodeId)) {
        assert.deepEqual(coordinate, topologyCoordinates.get(nodeId), `${nodeId} must reuse one exact CRS84 junction`);
      } else {
        topologyCoordinates.set(nodeId, coordinate);
      }
    });
  }
  assert.ok(topologyCoordinates.size >= 60, "the maintained continuous circulation networks must retain their shared topology nodes");

  const planned = beds.features.filter((feature) => feature.properties.status === "planned-study");
  const gridEstimates = beds.features.filter((feature) => feature.properties.status === "aerial-grid-estimate");
  assert.deepEqual(planned.map((feature) => feature.id), ["bbg-discovery-food-flowers"]);
  assert.equal(gridEstimates.length, 47);
  assert.equal(gridEstimates.filter((feature) => feature.properties.sectionId === "bbg-edible-gardens-section").length, 35);
  assert.equal(gridEstimates.filter((feature) => feature.properties.sectionId === "bbg-childrens-vegetable-garden-section").length, 12);
  assert.equal(gridEstimates.filter((feature) => feature.properties.centerControlId).length, 6);
  assert.ok(gridEstimates.filter((feature) => feature.properties.centerControlId)
    .every((feature) => feature.properties.snappedToFeatureId === feature.properties.gridCellId));
  for (const bed of gridEstimates) {
    assert.equal(bed.properties.parentId, bed.properties.subplotId);
    assert.equal(site.features.find((feature) => feature.id === bed.properties.parentId)?.properties.kind, "garden-subplot");
    assert.equal(bed.properties.observedFootprintId, null);
    assert.equal(bed.properties.plantingAssignment, null);
    assert.equal(bed.properties.cropTaxon, null);
    assert.equal(bed.properties.taxonStatus, "unassigned; no crop observation");
    assert.match(bed.properties.identificationStatus, /boundary unverified/i);
    assert.match(bed.properties.geometryBasis, /regular-grid interpolation from six raster center controls/i);
    assert.match(bed.properties.name, /row \d+, bed \d+$/);
  }
});

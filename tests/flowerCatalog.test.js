import assert from "node:assert/strict";
import test from "node:test";
import {FLOWER_CATALOG, FLOWER_DATA_SOURCES, flowerSourceById} from "../src/data/flowerCatalog.js";

test("flower catalog has unique, source-backed planning records", () => {
  assert.ok(FLOWER_CATALOG.length >= 12);
  assert.equal(new Set(FLOWER_CATALOG.map((plant) => plant.id)).size, FLOWER_CATALOG.length);

  for (const plant of FLOWER_CATALOG) {
    assert.equal(plant.group, "Flower");
    assert.ok(plant.name);
    assert.ok(plant.scientificName);
    assert.ok(plant.spacing > 0);
    assert.ok(plant.matureDiameter > 0);
    assert.ok(plant.height > 0);
    assert.ok(plant.light.length > 0);
    assert.ok(plant.moisture.length > 0);
    assert.ok(plant.bloomSeasons.length > 0);
    assert.ok(plant.flowerColors.length > 0);
    assert.ok(plant.naumkeagUse);
    assert.match(plant.interpretation, /not a documented Naumkeag planting inventory/i);
    assert.ok(plant.sourceIds.length > 0);
    for (const sourceId of plant.sourceIds) assert.ok(flowerSourceById(sourceId), `${plant.id} references ${sourceId}`);
  }
});

test("flower sources expose public URLs and condition fields", () => {
  const sources = Object.values(FLOWER_DATA_SOURCES);
  assert.ok(sources.length >= 5);
  assert.ok(sources.some((source) => source.id === "mdar-pollinator"));
  assert.ok(sources.some((source) => source.id === "csnap-native-plants"));
  assert.ok(sources.some((source) => source.id === "usda-plants"));

  for (const source of sources) {
    assert.match(source.url, /^https:\/\//);
    assert.ok(source.publisher);
    assert.ok(source.access);
    assert.ok(source.fields.length > 0);
  }
});

test("Naumkeag palette spans spring through fall and common site gradients", () => {
  const seasons = new Set(FLOWER_CATALOG.flatMap((plant) => plant.bloomSeasons));
  const light = new Set(FLOWER_CATALOG.flatMap((plant) => plant.light));
  const moisture = new Set(FLOWER_CATALOG.flatMap((plant) => plant.moisture));

  for (const season of ["spring", "summer", "fall"]) assert.ok(seasons.has(season));
  for (const exposure of ["Full sun", "Part shade", "Shade"]) assert.ok(light.has(exposure));
  for (const condition of ["Dry", "Average", "Moist", "Wet"]) assert.ok(moisture.has(condition));
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  getCatalogItem,
  getCollection,
  getGardenSpatialDataset,
  getPublicCatalog,
  listCollections,
  parseCatalogQuery,
  queryCatalog
} from "../src/lib/data/publicCatalogApi.js";
import {validateGardenSpatialDataset} from "../src/lib/spatial/gardenFeatureCollections.js";

test("the versioned public catalog exposes reference and canonical garden spatial collections", () => {
  assert.equal(getPublicCatalog().version, "1.0.0");
  assert.deepEqual(listCollections().map(({id}) => id), [
    "gardens",
    "garden-parcels",
    "garden-site",
    "garden-beds",
    "garden-plants",
    "flowers",
    "sources",
    "models"
  ]);
  assert.equal(getCollection("gardens").itemType, "feature");
  assert.deepEqual(getCollection("garden-site").crs, ["http://www.opengis.net/def/crs/OGC/1.3/CRS84"]);
});

test("all bundled garden references have matched parcel geometry", () => {
  const result = queryCatalog("gardens");
  assert.equal(result.numberMatched, 4);
  assert.ok(result.features.every((feature) => ["Polygon", "MultiPolygon"].includes(feature.geometry?.type)));
  assert.ok(result.features.every((feature) => feature.properties.mapping.parcelStatus === "matched"));

  const bbg = result.features.find((feature) => feature.id === "berkshire-botanical-garden");
  assert.equal(bbg.geometry.type, "MultiPolygon");
  assert.equal(bbg.geometry.coordinates.length, 4);
  assert.equal(bbg.properties.parcelAcreage, 23.86);
  assert.deepEqual(new Set(bbg.properties.mapping.parcelIds), new Set(["215_1", "215_29", "215_31", "215_32"]));
});

test("catalog queries support bbox, ids, text, property filters, and paging", () => {
  const naumkeag = queryCatalog("gardens", {q: "Naumkeag", limit: 1});
  assert.equal(naumkeag.features[0].id, "naumkeag-garden-rooms");
  assert.equal(naumkeag.features[0].properties.starterLayout.revision, 6);
  assert.ok(naumkeag.features[0].properties.starterLayout.beds.every((bed) => Number.isFinite(bed.x) && Number.isFinite(bed.y)));

  const stockbridge = queryCatalog("gardens", {bbox: [-73.34, 42.28, -73.31, 42.31]});
  assert.deepEqual(new Set(stockbridge.features.map(({id}) => id)), new Set([
    "berkshire-botanical-garden",
    "naumkeag-garden-rooms"
  ]));

  const flowers = queryCatalog("flowers", {
    property: {"bloomSeasons": "fall"},
    offset: 1,
    limit: 2
  });
  assert.ok(flowers.numberMatched >= 3);
  assert.equal(flowers.numberReturned, 2);
  assert.ok(queryCatalog("sources", {ids: "source:massgis-parcels"}).numberMatched === 1);
  assert.equal(queryCatalog("sources", {ids: "massgis-building-structures"}).features[0].properties.role, "building-roofprints");
  assert.equal(queryCatalog("sources", {ids: "osm-overpass-site-context"}).features[0].properties.rights.redistribution, "open-public-data");
  assert.equal(queryCatalog("sources", {ids: "source:naumkeag-landscape-tour"}).features[0].properties.publisher, "The Trustees of Reservations / UMass Amherst");
  assert.equal(queryCatalog("models", {property: {license: "CC0-1.0"}}).numberMatched, 9);
  assert.equal(queryCatalog("models", {q: "berry-bearing shrub"}).features[0].id, "quaternius-berry-shrub");
});

test("canonical spatial collections are queryable by garden, bbox, and feature properties", () => {
  const parcels = queryCatalog("garden-parcels", {gardenId: "berkshire-botanical-garden"});
  const site = queryCatalog("garden-site", {
    gardenId: "berkshire-botanical-garden",
    bbox: [-73.34, 42.29, -73.33, 42.31]
  });
  const beds = queryCatalog("garden-beds", {property: {gardenId: "berkshire-botanical-garden"}});
  const plants = queryCatalog("garden-plants", {gardenIds: ["berkshire-botanical-garden"]});

  for (const result of [parcels, site, beds]) {
    assert.equal(result.type, "FeatureCollection");
    assert.ok(result.numberMatched > 0);
    assert.ok(result.features.every((feature) => feature.properties.gardenId === "berkshire-botanical-garden"));
    assert.equal(result.bbox.length, 4);
  }
  assert.equal(plants.type, "FeatureCollection");
  assert.equal(plants.numberMatched, 0);
  assert.deepEqual(plants.features, []);
  assert.equal("bbox" in plants, false);
  assert.ok(parcels.features.every((feature) => ["Polygon", "MultiPolygon"].includes(feature.geometry.type)));
  assert.ok(beds.features.every((feature) => ["Polygon", "MultiPolygon"].includes(feature.geometry.type)));
  assert.ok(plants.features.every((feature) => ["Point", "MultiPoint"].includes(feature.geometry.type)));

  const dataset = getGardenSpatialDataset("berkshire-botanical-garden");
  assert.equal(dataset.type, "GardenSpatialDataset");
  assert.deepEqual(Object.fromEntries(Object.entries(dataset.collections).map(([layer, items]) => [layer, items.features.length])), {
    parcels: 4,
    site: 71,
    beds: 48,
    plants: 0
  });
  assert.ok(dataset.sources.some((source) => source.id === "massgis-l3-parcels" && source.url));
  assert.equal(dataset.sources.some((source) => source.id === "bbg-google-earth-example-2026-08-23"), false);
  assert.deepEqual(validateGardenSpatialDataset(dataset), []);
  assert.throws(() => getGardenSpatialDataset("not-a-garden"), /No canonical spatial dataset/);
});

test("item lookup and URL query parsing return detached data", () => {
  const item = getCatalogItem("gardens", "the-mount-kitchen-garden");
  item.properties.name = "changed";
  assert.notEqual(getCatalogItem("gardens", "the-mount-kitchen-garden").properties.name, "changed");

  assert.deepEqual(parseCatalogQuery("q=aster&limit=5&gardenId=berkshire-botanical-garden&prop.mapping.confidence=high"), {
    bbox: undefined,
    ids: undefined,
    gardenId: "berkshire-botanical-garden",
    q: "aster",
    limit: "5",
    offset: undefined,
    property: {"mapping.confidence": "high"}
  });
});

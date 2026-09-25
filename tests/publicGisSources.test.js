import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPublicGisRequest,
  fetchPublicGisFeatureCollection,
  normalizePublicGisBbox,
  overpassJsonToFeatureCollection,
  publicGisRegistry,
  publicGisSource
} from "../src/lib/spatial/publicGisSources.js";
import {parsePublicGisArguments} from "../scripts/fetch-public-gis.mjs";

const BBG_BBOX = [-73.34, 42.296, -73.331, 42.304];

test("registry separates queryable feature sources from visual tile sources", () => {
  const registry = publicGisRegistry();
  assert.equal(registry.outputContract.format, "RFC 7946 GeoJSON FeatureCollection");
  assert.equal(publicGisSource("massgis-l3-parcels").kind, "arcgis-feature-service");
  assert.equal(publicGisSource("osm-overpass-site-context").kind, "overpass-ql");
  assert.throws(() => buildPublicGisRequest("massgis-aerial-2025", BBG_BBOX), /visual source/);
  assert.throws(() => buildPublicGisRequest("missing", BBG_BBOX), /Unknown public GIS source/);
});

test("bounded query guard rejects invalid, out-of-state, and broad requests", () => {
  assert.deepEqual(normalizePublicGisBbox(BBG_BBOX), BBG_BBOX);
  assert.throws(() => normalizePublicGisBbox([-73.34, 42.3, -73.35, 42.31]), /less than/);
  assert.throws(() => normalizePublicGisBbox([-74, 42.2, -73.9, 42.3]), /Massachusetts/);
  assert.throws(() => normalizePublicGisBbox([-73.5, 42.2, -73.3, 42.4]), /query budget/);
});

test("ArcGIS requests ask for RFC 7946 coordinates and only allowlisted fields", () => {
  const request = buildPublicGisRequest("massgis-building-structures", BBG_BBOX, {page: 2});
  const url = new URL(request.url);
  assert.equal(url.pathname.endsWith("/FeatureServer/0/query"), true);
  assert.equal(url.searchParams.get("f"), "geojson");
  assert.equal(url.searchParams.get("inSR"), "4326");
  assert.equal(url.searchParams.get("outSR"), "4326");
  assert.equal(url.searchParams.get("geometry"), BBG_BBOX.join(","));
  assert.equal(url.searchParams.get("outFields").includes("OWNER"), false);
  assert.equal(url.searchParams.get("orderByFields"), "STRUCT_ID");
  assert.equal(url.searchParams.get("resultOffset"), "4000");
});

test("snapshot CLI requires an explicit garden, bbox, and source", () => {
  const options = parsePublicGisArguments([
    "--garden", "berkshire-botanical-garden",
    `--bbox=${BBG_BBOX.join(",")}`,
    "--source", "massgis-l3-parcels",
    "--source", "massgis-l3-parcels",
    "--dry-run"
  ]);
  assert.deepEqual(options.sources, ["massgis-l3-parcels"]);
  assert.deepEqual(options.bbox, BBG_BBOX);
  assert.equal(options.dryRun, true);
  assert.throws(() => parsePublicGisArguments(["--garden", "../unsafe"]), /garden/);
});

test("Overpass requests are bounded and target site-context tags", () => {
  const request = buildPublicGisRequest("osm-overpass-site-context", BBG_BBOX);
  const query = new URL(request.url).searchParams.get("data");
  assert.match(query, /^\[out:json\]\[timeout:25\]/);
  assert.match(query, /nwr\["building"\]\(42\.296,-73\.34,42\.304,-73\.331\)/);
  assert.match(query, /nwr\["power"/);
  assert.match(query, /out tags center geom qt/);
});

test("Overpass JSON becomes GeoJSON without mapper personal metadata", () => {
  const collection = overpassJsonToFeatureCollection({
    osm3s: {timestamp_osm_base: "2026-08-24T00:00:00Z"},
    elements: [
      {type: "node", id: 1, lon: -73.3364, lat: 42.3, user: "not-exported", tags: {power: "pole"}},
      {type: "way", id: 2, user: "not-exported", tags: {highway: "path"}, geometry: [
        {lon: -73.3365, lat: 42.3}, {lon: -73.3364, lat: 42.3001}
      ]},
      {type: "way", id: 3, tags: {building: "greenhouse"}, geometry: [
        {lon: -73.3363, lat: 42.3}, {lon: -73.3362, lat: 42.3},
        {lon: -73.3362, lat: 42.3001}, {lon: -73.3363, lat: 42.3}
      ]}
    ]
  });
  assert.deepEqual(collection.features.map((feature) => feature.geometry.type), ["Point", "LineString", "Polygon"]);
  assert.equal(collection.features[0].properties.user, undefined);
  assert.equal(collection.properties.license.includes("ODbL"), true);
});

test("ArcGIS fetch adapter paginates, deduplicates, strips extra fields, and caches pages", async () => {
  const calls = [];
  const stores = new Map();
  const cacheStorage = {
    async open(name) {
      const store = stores.get(name) || new Map();
      stores.set(name, store);
      return {
        async match(key) { return store.get(String(key))?.clone(); },
        async put(key, value) { store.set(String(key), value.clone()); }
      };
    }
  };
  const fetchImpl = async (url) => {
    calls.push(url);
    const offset = Number(new URL(url).searchParams.get("resultOffset"));
    const features = offset === 0 ? [
      {type: "Feature", geometry: {type: "Polygon", coordinates: []}, properties: {OBJECTID: 1, MAP_PAR_ID: "215_1", OWNER: "discard"}}
    ] : [];
    return new Response(JSON.stringify({type: "FeatureCollection", features}), {
      headers: {"content-type": "application/geo+json", date: "Mon, 24 Aug 2026 00:00:00 GMT"}
    });
  };

  const first = await fetchPublicGisFeatureCollection("massgis-l3-parcels", BBG_BBOX, {fetchImpl, cacheStorage});
  const second = await fetchPublicGisFeatureCollection("massgis-l3-parcels", BBG_BBOX, {fetchImpl, cacheStorage});
  assert.equal(calls.length, 1);
  assert.equal(first.type, "FeatureCollection");
  assert.equal(first.properties.parcelClipped, false);
  assert.equal(first.features[0].properties.MAP_PAR_ID, "215_1");
  assert.equal(first.features[0].properties.OWNER, undefined);
  assert.deepEqual(second, first);
});

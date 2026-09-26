import test from "node:test";
import assert from "node:assert/strict";
import {prepareGardenCapture} from "../src/lib/spatial/gardenCapture.js";
import {gardenResearch, GARDEN_RESEARCH} from "../src/data/gardenResearch.js";
const polygon = (id, x) => ({type:"Feature", id, properties:{}, geometry:{type:"Polygon",coordinates:[[[x,42],[x+.001,42],[x+.001,42.001],[x,42.001],[x,42]]]}});
const collection = features => ({type:"FeatureCollection",features});
const input = () => ({gardenId:"example",parcels:collection([polygon("parcel",-73)]),buildings:collection([polygon("inside",-73),polygon("outside",-74)]),capturedAt:"2026-09-26T12:00:00Z",sourceUrl:"https://example.org/buildings"});
test("capture preserves source polygons and stages selected structures without fabricated planting geometry",()=>{
 const data=input(), before=structuredClone(data), result=prepareGardenCapture(data);
 assert.deepEqual(data,before); assert.equal(result.status,"review-required");
 assert.equal(result.analysis.selectedBuildings,1); assert.equal(result.analysis.excludedBuildings,1);
 assert.deepEqual(result.layers.site.features[0].geometry,data.buildings.features[0].geometry);
 assert.equal(result.layers.beds.features.length,0); assert.equal(result.layers.plants.features.length,0);
 result.layers.parcels.features[0].properties.changed=true;assert.deepEqual(data,before);
});
test("capture rejects unclosed rings, ambiguous identifiers and projected coordinates",()=>{
 let data=input();data.parcels.features[0].geometry.coordinates[0].pop();assert.throws(()=>prepareGardenCapture(data),/closed/);
 data=input();data.parcels.features.push(data.parcels.features[0]);assert.throws(()=>prepareGardenCapture(data),/unique/);
 data=input();data.parcels.features[0].geometry.coordinates[0][0]=[200000,400000];assert.throws(()=>prepareGardenCapture(data),/CRS84/);
});
test("all four garden research inventories retain source identity and do not imply specimen coordinates",()=>{
 assert.equal(new Set(GARDEN_RESEARCH.map(r=>r.gardenId)).size,4);
 for(const id of new Set(GARDEN_RESEARCH.map(r=>r.gardenId))) for(const r of gardenResearch(id)) {assert.match(r.source.url,/^https:/);assert.equal(r.geometry,null);assert.ok(r.locationPrecision);}
 const records=gardenResearch("berkshire-botanical-garden");assert.equal(records.find(r=>r.sourceId==="bbg-glass").status,"proposed");
 records[0].plants.push("not evidence");assert.ok(!gardenResearch("berkshire-botanical-garden")[0].plants.includes("not evidence"));
});

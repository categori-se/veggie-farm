import test from "node:test";
import assert from "node:assert/strict";
import crops from "../src/data/vegetables.json" with {type: "json"};
import rules from "../src/data/crop-decision-rules.json" with {type: "json"};
import {recommendGardenToday} from "../src/lib/recommendations/gardenToday.js";
import seasonalTasks from "../src/data/seasonal-tasks.json" with {type: "json"};
import evidence from "../src/data/horticultural-evidence.json" with {type: "json"};
import {getSeasonalTasks} from "../src/lib/recommendations/seasonalNotebook.js";

function find(slug, context) {
  return recommendGardenToday(crops, rules, context).find((item) => item.crop.slug === slug);
}

const summerContext={date:'2026-06-15',lastFrostDate:'2026-05-10',firstFrostDate:'2026-10-15',soilTemperatureF:76,riskPreference:'typical'};
test('missing soil stays unknown and cannot earn a soil-fit recommendation',()=>{
 const item=find('tomatoes',{...summerContext,soilTemperatureF:null});
 assert.equal(item.inputs.soilTemperatureF,null);assert.equal(item.status,'caution');
 assert.equal(item.comparisons.soil.label,'Not entered');assert.ok(item.reasonCodes.includes('SOIL_NOT_RECORDED'));
});
test('past fall frost does not turn short runway into a new planting recommendation',()=>{
 const item=find('spinach',{...summerContext,date:'2026-11-15',soilTemperatureF:55});
 assert.equal(item.status,'caution');assert.ok(item.reasonCodes.includes('PAST_ASSUMED_FALL_FROST'));
 assert.equal(item.comparisons.runway.label,'Past assumed frost');
});
test('comparisons show soil limits even when an earlier timing rule determines the result',()=>{
 const item=find('tomatoes',{...summerContext,date:'2026-03-15',soilTemperatureF:40});
 assert.equal(item.status,'too_early');assert.equal(item.comparisons.soil.label,'Below starting estimate');
 assert.equal(item.comparisons.forecast.label,'Not loaded');
});
test('a loaded forecast is not applied outside its dated window',()=>{
 const item=find('tomatoes',{...summerContext,forecast:{provider:'nws',generatedAt:'2026-06-01T12:00:00Z',next48Hours:{startsAt:'2026-06-01T08:00:00-04:00',endsAt:'2026-06-03T08:00:00-04:00',freezeRisk:true,freezeHours:3,minimumTemperatureF:29}}});
 assert.equal(item.status,'recommended');assert.equal(item.inputs.forecast,null);
 assert.equal(item.comparisons.forecast.label,'Outside forecast dates');
});

test("late-summer spinach is recommended with enough fall runway", () => {
  const result = find("spinach", {
    date: "2026-08-20",
    lastFrostDate: "2026-05-10",
    firstFrostDate: "2026-10-15",
    soilTemperatureF: 61,
    riskPreference: "typical"
  });
  assert.equal(result.status, "recommended");
  assert.ok(result.reasonCodes.includes("SEASONAL_WINDOW_FITS"));
});

test("all editorial crops have a decision rule", () => {
  const results = recommendGardenToday(crops, rules, {
    date: "2026-08-20",
    lastFrostDate: "2026-05-10",
    firstFrostDate: "2026-10-15",
    soilTemperatureF: 61,
    riskPreference: "typical"
  });
  assert.equal(results.length, 23);
  assert.deepEqual(new Set(results.map((item) => item.crop.slug)).size, 23);
});

test("a spring tomato is not recommended outdoors before frost", () => {
  const result = find("tomatoes", {
    date: "2026-03-15",
    lastFrostDate: "2026-05-10",
    firstFrostDate: "2026-10-15",
    soilTemperatureF: 50,
    riskPreference: "typical"
  });
  assert.equal(result.status, "too_early");
  assert.ok(result.reasonCodes.includes("FROST_RISK"));
});

test("a cucumber is too late when frost arrives before maturity", () => {
  const result = find("cucumbers", {
    date: "2026-08-20",
    lastFrostDate: "2026-05-10",
    firstFrostDate: "2026-09-15",
    soilTemperatureF: 72,
    riskPreference: "typical"
  });
  assert.equal(result.status, "too_late");
  assert.ok(result.reasonCodes.includes("INSUFFICIENT_FROST_FREE_DAYS"));
});

test("garlic enters its fall planting window before first frost", () => {
  const result = find("garlic", {
    date: "2026-09-20",
    lastFrostDate: "2026-05-10",
    firstFrostDate: "2026-10-15",
    soilTemperatureF: 58,
    riskPreference: "typical"
  });
  assert.equal(result.status, "recommended");
  assert.ok(result.reasonCodes.includes("FALL_GARLIC_WINDOW"));
});

test("invalid soil temperatures are rejected", () => {
  assert.throws(() => find("spinach", {
    date: "2026-08-20",
    lastFrostDate: "2026-05-10",
    firstFrostDate: "2026-10-15",
    soilTemperatureF: 150
  }), /between 20 and 110/);
});

test("a live NWS freeze forecast downgrades an otherwise suitable tender crop", () => {
  const result = recommendGardenToday(crops, rules, {
    date: "2026-05-20",
    lastFrostDate: "2026-05-10",
    firstFrostDate: "2026-10-15",
    soilTemperatureF: 76,
    riskPreference: "typical",
    forecast: {
      provider: "nws",
      sourceId: "source:nws-api",
      generatedAt: "2026-05-20T12:00:00Z",
      next48Hours: {freezeRisk: true, frostRisk: true, freezeHours: 2, minimumTemperatureF: 31}
    }
  }, evidence).find((item) => item.crop.slug === "tomatoes");
  assert.equal(result.status, "possible_with_protection");
  assert.ok(result.reasonCodes.includes("NWS_FREEZE_FORECAST"));
  assert.ok(result.sources.includes("source:nws-api"));
  assert.ok(result.evidenceIds.length > 0);
  assert.equal(result.ruleVersion, "garden-today/1.3.0");
});

test("the late-August notebook connects planting, harvest, and observation", () => {
  const tasks = getSeasonalTasks(seasonalTasks, "2026-08-20");
  assert.deepEqual(tasks.map((task) => task.id), [
    "task:fall-sowing",
    "task:cucumber-harvest",
    "task:peony-summer-spotting",
    "task:apple-id-notebook"
  ]);
});

test("October surfaces peony cleanup and garlic preparation", () => {
  const ids = getSeasonalTasks(seasonalTasks, "2026-10-10").map((task) => task.id);
  assert.ok(ids.includes("task:peony-fall-cleanup"));
  assert.ok(ids.includes("task:garlic-bed-prep"));
});

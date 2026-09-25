import test from "node:test";
import assert from "node:assert/strict";
import {
  clearNwsForecastCache,
  fetchNwsGardenForecast,
  normalizeNwsForecast,
  parseWindSpeedMph
} from "../src/lib/environment/nwsForecast.js";

const pointPayload = {
  properties: {
    gridId: "BOX",
    gridX: 71,
    gridY: 101,
    forecastHourly: "https://api.weather.gov/gridpoints/BOX/71,101/forecast/hourly",
    timeZone: "America/New_York",
    relativeLocation: {properties: {city: "Boston", state: "MA"}}
  }
};

function hourlyPeriod(hour, temperature, precipitation = 20, windSpeed = "6 mph") {
  return {
    startTime: `2026-04-02T${String(hour % 24).padStart(2, "0")}:00:00-04:00`,
    endTime: `2026-04-02T${String((hour + 1) % 24).padStart(2, "0")}:00:00-04:00`,
    temperature,
    temperatureUnit: "F",
    probabilityOfPrecipitation: {value: precipitation},
    relativeHumidity: {value: 70},
    windSpeed,
    windDirection: "NW",
    shortForecast: "Partly Cloudy",
    isDaytime: hour >= 6 && hour < 18
  };
}

test('missing forecast measurements remain null, not zero or freezing',()=>{
 const period={...hourlyPeriod(0,null,null,null),relativeHumidity:{value:null}};
 const forecast=normalizeNwsForecast(pointPayload,{properties:{periods:[period]}});
 assert.equal(forecast.currentHour.temperatureF,null);
 assert.equal(forecast.currentHour.precipitationProbabilityPct,null);
 assert.equal(forecast.currentHour.relativeHumidityPct,null);
 assert.equal(forecast.next48Hours.minimumTemperatureF,null);
 assert.equal(forecast.next48Hours.maxPrecipitationProbabilityPct,null);
 assert.equal(forecast.next48Hours.freezeRisk,false);
 assert.equal(forecast.next48Hours.temperatureHours,0);
});

test("normalizes NWS hourly data into garden-scale forecast windows", () => {
  const hourlyPayload = {
    properties: {
      generatedAt: "2026-04-02T10:00:00Z",
      updateTime: "2026-04-02T09:00:00Z",
      periods: Array.from({length: 48}, (_, hour) => hourlyPeriod(hour, hour === 4 ? 31 : 45 + (hour % 8), hour === 5 ? 80 : 20, hour === 8 ? "18 to 28 mph" : "6 mph"))
    }
  };
  const forecast = normalizeNwsForecast(pointPayload, hourlyPayload, {fetchedAt: "2026-04-02T10:05:00Z"});
  assert.equal(forecast.location.city, "Boston");
  assert.equal(forecast.next24Hours.minimumTemperatureF, 31);
  assert.equal(forecast.next24Hours.freezeHours, 1);
  assert.equal(forecast.next24Hours.rainLikely, true);
  assert.equal(forecast.next24Hours.maximumWindMph, 28);
  assert.equal("latitude" in forecast.location, false);
});

test("fetch adapter rounds coordinates, follows NWS linked data, and caches in memory", async () => {
  clearNwsForecastCache();
  const calls = [];
  const responses = [
    pointPayload,
    {properties: {generatedAt: "2026-04-02T10:00:00Z", periods: Array.from({length: 48}, (_, hour) => hourlyPeriod(hour, 55))}}
  ];
  const fetchImpl = async (url) => {
    calls.push(String(url));
    return {ok: true, json: async () => responses.shift()};
  };
  const options = {latitude: 42.36012, longitude: -71.05891, fetchImpl, now: () => Date.parse("2026-04-02T10:05:00Z")};
  const first = await fetchNwsGardenForecast(options);
  const second = await fetchNwsGardenForecast(options);
  assert.equal(calls[0], "https://api.weather.gov/points/42.360,-71.059");
  assert.equal(calls.length, 2);
  assert.strictEqual(second, first);
});

test("parses NWS wind ranges conservatively", () => {
  assert.equal(parseWindSpeedMph("10 to 20 mph"), 20);
  assert.equal(parseWindSpeedMph("Calm"), null);
});

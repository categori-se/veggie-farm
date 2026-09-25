const API_ORIGIN = "https://api.weather.gov";
const CACHE_TTL_MS = 20 * 60 * 1000;
const memoryCache = new Map();

function finiteCoordinate(value, name, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new RangeError(`${name} must be between ${min} and ${max}`);
  }
  return number;
}

function roundForProvider(value) {
  return Number(value).toFixed(3);
}

function maxNumber(values) {
  const finite = values.filter(Number.isFinite);
  return finite.length ? Math.max(...finite) : null;
}

function minNumber(values) {
  const finite = values.filter(Number.isFinite);
  return finite.length ? Math.min(...finite) : null;
}

function fahrenheit(value, unit) {
  if (value == null || value === "" || !Number.isFinite(Number(value))) return null;
  return unit === "C" ? Number(value) * 9 / 5 + 32 : Number(value);
}

export function parseWindSpeedMph(value) {
  const values = String(value ?? "").match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  return maxNumber(values);
}

function normalizePeriod(period) {
  return {
    startTime: period.startTime,
    endTime: period.endTime,
    temperatureF: fahrenheit(period.temperature, period.temperatureUnit),
    precipitationProbabilityPct: period.probabilityOfPrecipitation?.value != null && Number.isFinite(Number(period.probabilityOfPrecipitation.value))
      ? Number(period.probabilityOfPrecipitation.value)
      : null,
    relativeHumidityPct: period.relativeHumidity?.value != null && Number.isFinite(Number(period.relativeHumidity.value))
      ? Number(period.relativeHumidity.value)
      : null,
    windMph: parseWindSpeedMph(period.windSpeed),
    windDirection: period.windDirection ?? null,
    shortForecast: period.shortForecast ?? null,
    isDaytime: Boolean(period.isDaytime)
  };
}

function summarizeWindow(periods, hours) {
  const window = periods.slice(0, hours);
  const temperatures = window.map((period) => period.temperatureF);
  const precipitation = window.map((period) => period.precipitationProbabilityPct);
  const winds = window.map((period) => period.windMph);
  const freezeHours = window.filter((period) => period.temperatureF != null && period.temperatureF <= 32).length;
  const frostRiskHours = window.filter((period) => period.temperatureF != null && period.temperatureF > 32 && period.temperatureF <= 36).length;
  const maxPrecipitationProbabilityPct = maxNumber(precipitation);
  const maximumWindMph = maxNumber(winds);

  return {
    hoursRequested: hours,
    hoursAvailable: window.length,
    temperatureHours: temperatures.filter(Number.isFinite).length,
    startsAt: window[0]?.startTime ?? null,
    endsAt: window.at(-1)?.endTime ?? null,
    minimumTemperatureF: minNumber(temperatures),
    maximumTemperatureF: maxNumber(temperatures),
    maxPrecipitationProbabilityPct,
    maximumWindMph,
    freezeHours,
    frostRiskHours,
    freezeRisk: freezeHours > 0,
    frostRisk: freezeHours > 0 || frostRiskHours > 0,
    rainLikely: maxPrecipitationProbabilityPct != null && maxPrecipitationProbabilityPct >= 70,
    highWindRisk: maximumWindMph != null && maximumWindMph >= 25
  };
}

export function normalizeNwsForecast(pointPayload, hourlyPayload, {fetchedAt = new Date().toISOString()} = {}) {
  const point = pointPayload?.properties;
  const hourly = hourlyPayload?.properties;
  if (!point?.gridId || !point?.forecastHourly) throw new TypeError("Invalid NWS point response");
  if (!Array.isArray(hourly?.periods) || !hourly.periods.length) throw new TypeError("Invalid NWS hourly forecast response");

  const periods = hourly.periods.map(normalizePeriod);
  return {
    schemaVersion: "1.0.0",
    provider: "nws",
    sourceId: "source:nws-api",
    sourceUrls: {hourly: point.forecastHourly, documentation: "https://www.weather.gov/documentation/services-web-api"},
    fetchedAt,
    generatedAt: hourly.generatedAt ?? null,
    updatedAt: hourly.updateTime ?? null,
    location: {
      city: point.relativeLocation?.properties?.city ?? null,
      state: point.relativeLocation?.properties?.state ?? null,
      timeZone: point.timeZone ?? null,
      grid: {office: point.gridId, x: point.gridX, y: point.gridY},
      coordinateHandling: "rounded_to_0.001_degree_for_request_not_retained"
    },
    currentHour: periods[0],
    next24Hours: summarizeWindow(periods, 24),
    next48Hours: summarizeWindow(periods, 48),
    periods: periods.slice(0, 48)
  };
}

async function fetchJson(fetchImpl, url) {
  const response = await fetchImpl(url, {headers: {Accept: "application/geo+json"}});
  if (!response?.ok) throw new Error(`NWS request failed (${response?.status ?? "network error"})`);
  return response.json();
}

export async function fetchNwsGardenForecast({
  latitude,
  longitude,
  fetchImpl = globalThis.fetch,
  now = () => Date.now(),
  useCache = true
}) {
  if (typeof fetchImpl !== "function") throw new TypeError("A fetch implementation is required");
  const lat = finiteCoordinate(latitude, "latitude", -90, 90);
  const lon = finiteCoordinate(longitude, "longitude", -180, 180);
  const roundedLat = roundForProvider(lat);
  const roundedLon = roundForProvider(lon);
  const cacheKey = `${roundedLat},${roundedLon}`;
  const cached = memoryCache.get(cacheKey);
  if (useCache && cached && now() - cached.cachedAt < CACHE_TTL_MS) return cached.forecast;

  const pointUrl = `${API_ORIGIN}/points/${roundedLat},${roundedLon}`;
  const pointPayload = await fetchJson(fetchImpl, pointUrl);
  const hourlyUrl = new URL(pointPayload?.properties?.forecastHourly);
  if (hourlyUrl.origin !== API_ORIGIN) throw new Error("NWS point response returned an unexpected forecast host");
  const hourlyPayload = await fetchJson(fetchImpl, hourlyUrl.href);
  const forecast = normalizeNwsForecast(pointPayload, hourlyPayload, {fetchedAt: new Date(now()).toISOString()});
  memoryCache.set(cacheKey, {cachedAt: now(), forecast});
  return forecast;
}

export function clearNwsForecastCache() {
  memoryCache.clear();
}

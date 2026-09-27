---
title: "Garden Today"
description: "Turn your frost dates and soil temperature into clear, explainable planting decisions for 23 vegetable crops."
toc: false
---

```js
import {gardenContext} from "../components/garden-context.js";
display(gardenContext({invalidation}));
```

```js
import {gardenActions} from "../components/garden-actions.js";
import {recommendGardenToday, summarizeGardenContext} from "../lib/recommendations/gardenToday.js";
import {getSeasonalTasks} from "../lib/recommendations/seasonalNotebook.js";
import {loadGardenProfile, profileDatesForYear} from "../lib/garden/localGardenStore.js";
import {fetchNwsGardenForecast} from "../lib/environment/nwsForecast.js";
```

```js
const crops = await FileAttachment("../data/vegetables.json").json();
const rules = await FileAttachment("../data/crop-decision-rules.json").json();
const seasonalTasks = await FileAttachment("../data/seasonal-tasks.json").json();
const sourceRows = await FileAttachment("../data/source-citations.json").json();
const evidenceDataset = await FileAttachment("../data/horticultural-evidence.json").json();
const evidenceSources = await FileAttachment("../data/evidence-sources.json").json();
const sourceById = new Map([...sourceRows.filter((row) => row.type === "source"), ...evidenceSources].map((row) => [row.id, row]));
const savedGarden = loadGardenProfile();
```

<section class="today-hero">
  <div>
    <p class="kicker">A useful answer, with its assumptions</p>
    <h1>What can I do in my garden today?</h1>
    <p class="deck">Compare 23 familiar crops against your season, regional Extension evidence, and an optional live forecast—then see exactly why each result changed.</p>
  </div>
  <div class="today-hero-note">
    <span>How it works</span>
    <p><strong>Your garden context</strong> is evaluated against crop timing, frost tolerance, maturity, and a broad soil-temperature range.</p>
    <p>No exact coordinates are stored. Soil temperature remains your measurement; a live NWS forecast is optional.</p>
  </div>
</section>

```js
import {accountGardenHome} from "../components/account-garden-home.js";
import {savedGardenConditions, validGuidanceDates} from "../lib/garden/savedGardenConditions.js";
const selectedGardenState = Inputs.input(null);
const selectedGarden = Generators.input(selectedGardenState);
display(accountGardenHome({invalidation, showToday: true, onGardenChange: (workspace, selection) => {selectedGardenState.value = workspace ? {workspace, selection} : {cleared: true}; selectedGardenState.dispatchEvent(new Event("input"));}}));
```

## Explore planting conditions

Choose a saved garden above to use its linked conditions. You can adjust the settings below for a planning scenario; these edits do not change your saved garden.

```js
const conditionBeds = selectedGarden?.workspace?.beds || [];
const conditionBed = view(Inputs.select(["", ...conditionBeds.map(b => b.id)], {
  label: "Conditions for", value: "",
  format: id => id ? conditionBeds.find(b => b.id === id)?.name || id : "Garden profile"
}));
```

```js
const now = new Date();
const currentYear = now.getFullYear();
const localDate = `${currentYear}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const appliedConditions = savedGardenConditions(selectedGarden, savedGarden, localDate, conditionBed);
const date = view(Inputs.text({label: "Planting date", value: localDate, placeholder: "YYYY-MM-DD"}));
const lastFrostDate = view(Inputs.text({label: "Typical last spring frost", value: appliedConditions.lastFrostDate || "", placeholder: "YYYY-MM-DD"}));
const firstFrostDate = view(Inputs.text({label: "Typical first fall frost", value: appliedConditions.firstFrostDate || "", placeholder: "YYYY-MM-DD"}));
const soilTemperatureFInput = Inputs.range([35, 90], {label: "Soil temperature °F", value: appliedConditions.soilTemperatureF ?? 61, step: 1});
soilTemperatureFInput.elements.range.setAttribute("aria-label", "Soil temperature °F");
const soilReading = view(soilTemperatureFInput);
const useSoilReading = view(Inputs.toggle({label: "Use an entered soil temperature", value: appliedConditions.soilTemperatureF !== null}));
const riskLabels = {
  conservative: "Conservative — more buffer",
  typical: "Typical — balanced timing",
  experimental: "Experimental — accept more risk"
};
const riskPreference = view(Inputs.select(Object.keys(riskLabels), {
  label: "Risk preference",
  value: "typical",
  format: (value) => riskLabels[value]
}));
```

```js
const soilTemperatureF = useSoilReading && (!appliedConditions.soilDate || date === appliedConditions.soilDate) ? soilReading : null;
```

```js
html`<div class="today-input-note">
  <strong>${appliedConditions.source === "selected-garden" ? `Selected garden: ${appliedConditions.name}` : appliedConditions.source === "notebook" ? `Notebook: ${appliedConditions.name}` : "Starter assumptions:"}</strong>
  ${appliedConditions.source === "starter" ? "May 10 and October 15 are editable examples, not a location lookup." : "Frost dates come from the saved profile. Missing dates remain blank; enter both before comparing crops."}
  ${conditionBed ? `Bed: ${appliedConditions.bedName || "unavailable"}. Soil readings come only from this bed; frost dates remain garden-wide.` : "Soil readings use the garden profile."}
  ${appliedConditions.sunHours === null ? "Direct sun: not recorded." : `Recorded direct sun: ${appliedConditions.sunHours} hours. The comparison uses a general vegetable-site light benchmark; open Why? for its limits.`}
  Saved soil temperature is enabled only when measured today and used for that same date. Older, undated or future readings stay excluded.
  <a href="/tools/my-garden">Review garden conditions →</a>
</div>`
```

```js
import {gardenDashboard} from "../components/garden-actions.js";
display(gardenDashboard({compact: true, invalidation, crops}));
```

<section class="forecast-connector-heading">
  <div>
    <p class="kicker">Optional live input</p>
    <h2>Check the next 48 hours</h2>
  </div>
  <p>Your browser rounds its location to 0.001° and sends it directly to the National Weather Service only when you press the button. veggie.farm does not retain the coordinates.</p>
</section>

```js
function browserPosition() {
  return new Promise((resolve, reject) => {
    if (!globalThis.navigator?.geolocation) return reject(new Error("Location is not available in this browser."));
    globalThis.navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 12000,
      maximumAge: 15 * 60 * 1000
    });
  });
}

// Changing gardens resets this explicit request; it never fetches automatically.
selectedGarden;
const forecastRequest = view(Inputs.button("Use my location for an NWS forecast", {
  reduce: (clicks = 0) => clicks + 1
}));
```

```js
const forecastLookup = forecastRequest ? await (async () => {
  try {
    const position = await browserPosition();
    const forecast = await fetchNwsGardenForecast({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    });
    return {forecast, error: null};
  } catch (error) {
    return {forecast: null, error: error?.message ?? "The forecast could not be loaded."};
  }
})() : null;
const liveForecast = forecastLookup?.forecast ?? null;
```

```js
liveForecast ? html`<section class="live-forecast" data-state="ready">
  <div class="live-forecast-title">
    <div><span>NWS forecast</span><strong>${[liveForecast.location.city, liveForecast.location.state].filter(Boolean).join(", ") || liveForecast.location.grid.office}</strong></div>
    <small>Generated ${new Date(liveForecast.generatedAt ?? liveForecast.fetchedAt).toLocaleString("en-US", {month: "short", day: "numeric", hour: "numeric", minute: "2-digit"})}</small>
  </div>
  <div class="live-forecast-grid">
    <div><span>48-hour low</span><strong>${liveForecast.next48Hours.minimumTemperatureF == null ? "Unknown" : Math.round(liveForecast.next48Hours.minimumTemperatureF)+"°F"}</strong></div>
    <div><span>48-hour high</span><strong>${liveForecast.next48Hours.maximumTemperatureF == null ? "Unknown" : Math.round(liveForecast.next48Hours.maximumTemperatureF)+"°F"}</strong></div>
    <div><span>Rain chance</span><strong>${liveForecast.next48Hours.maxPrecipitationProbabilityPct == null ? "Unknown" : Math.round(liveForecast.next48Hours.maxPrecipitationProbabilityPct)+"%"}</strong></div>
    <div><span>Peak wind</span><strong>${liveForecast.next48Hours.maximumWindMph == null ? "Unknown" : Math.round(liveForecast.next48Hours.maximumWindMph)+" mph"}</strong></div>
  </div>
  <p>${liveForecast.next48Hours.freezeRisk
    ? `Freeze signal: ${liveForecast.next48Hours.freezeHours} forecast hour${liveForecast.next48Hours.freezeHours === 1 ? "" : "s"} at or below 32°F. See the comparison for its effect on your planting date.`
    : liveForecast.next48Hours.frostRisk
      ? `Near-frost signal: the forecast reaches ${liveForecast.next48Hours.minimumTemperatureF == null ? "Unknown" : Math.round(liveForecast.next48Hours.minimumTemperatureF)+"°F"}. See the comparison for its effect on your planting date.`
      : liveForecast.next48Hours.minimumTemperatureF == null ? "Temperature coverage is missing; a frost assessment is unavailable." : "No near-freezing hour appears in the available forecast. The forecast does not replace a garden thermometer or account for frost pockets."}</p>
  <p>${liveForecast.next48Hours.temperatureHours} temperature hours available of ${liveForecast.next48Hours.hoursRequested} requested.</p>
  <a href="https://www.weather.gov/documentation/services-web-api">National Weather Service data and documentation →</a>
</section>` : forecastLookup?.error ? html`<section class="live-forecast" data-state="error">
  <strong>Forecast unavailable</strong>
  <p>${forecastLookup.error} You can still use the manual frost dates and soil-temperature input.</p>
</section>` : html`<p class="forecast-empty">No forecast loaded. Recommendations below use the manual season inputs only.</p>`
```

```js
const context = {date, lastFrostDate, firstFrostDate, soilTemperatureF, sunHours: appliedConditions.sunHours, riskPreference, forecast: liveForecast};
const inputDatesValid = validGuidanceDates(date, lastFrostDate, firstFrostDate);
const results = inputDatesValid ? recommendGardenToday(crops, rules, context, evidenceDataset) : [];
const summary = inputDatesValid ? summarizeGardenContext(context) : {frostRunway: null};
const ready = results.filter((item) => item.status === "recommended");
const watch = results.filter((item) => ["caution", "possible_with_protection"].includes(item.status));
const wait = results.filter((item) => ["too_early", "too_late"].includes(item.status));
const seasonalAdvice = getSeasonalTasks(seasonalTasks, date);
```

## Compare crops and their evidence

Compare inputs and model limits across crops. Open “Why?” for the reasons that determined a result, its sources and garden actions.

```js
import {decisionMatrix} from "../components/decision-matrix.js";
if (inputDatesValid) display(decisionMatrix(results, rules, [...sourceById.values()], {destination: selectedGarden?.selection ? {...selectedGarden.selection, ...(conditionBed ? {bedId: conditionBed} : {})} : null}));
else display(html`<p role="status">Enter a valid planting date and spring/fall frost dates, with spring before fall, to compare crops.</p>`);
```

```js
import {plantingScenarios} from "../components/planting-scenarios.js";
if (inputDatesValid) display(plantingScenarios(crops, rules, context, evidenceDataset));
```

```js
const formatDate = (value) => new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {month: "short", day: "numeric"});
const formatRunway = (days) => days >= 0 ? `${days} days` : `${Math.abs(days)} days past`;
const formatMonthDay = (value) => new Date(`2026-${value}T12:00:00`).toLocaleDateString("en-US", {month: "short", day: "numeric"});
const methodLabel = {direct_sow: "sow", transplant: "transplant", plant_sets: "sets", plant_seed_potatoes: "seed potatoes"};
```

```js
html`<section class="today-context" aria-label="Garden context summary">
  <article>
    <span>Season runway</span>
    <strong>${inputDatesValid ? formatRunway(summary.frostRunway) : "Frost dates needed"}</strong>
    <p>${!inputDatesValid ? "Enter both frost dates above." : summary.frostRunway >= 0 ? `until the entered first frost (${formatDate(firstFrostDate)})` : `the entered first frost (${formatDate(firstFrostDate)})`}</p>
  </article>
  <article>
    <span>Seedbed</span>
    <strong>${soilTemperatureF == null ? "Not entered" : `${soilTemperatureF}°F`}</strong>
    <p>enable the soil reading after entering a measurement</p>
  </article>
  <article>
    <span>Plant now</span>
    <strong>${inputDatesValid ? `${ready.length} crops` : "Not evaluated"}</strong>
    <p>fit the checked timing, temperature and general light guidance</p>
  </article>
  <article>
    <span>Watch closely</span>
    <strong>${inputDatesValid ? `${watch.length} crops` : "Not evaluated"}</strong>
    <p>need better conditions or added protection</p>
  </article>
</section>`
```

```js
html`<section class="seasonal-notebook-panel">
  <div class="seasonal-notebook-heading">
    <div>
      <p class="kicker">Seasonal notebook</p>
      <h2>What else deserves attention?</h2>
    </div>
    <p>These are timely New England prompts, not claims about what is growing in your garden. Keep the ones that match.</p>
  </div>
  ${seasonalAdvice.length
    ? html`<div class="seasonal-task-grid">${seasonalAdvice.map((task) => html`<a href=${task.path} class="seasonal-task-card">
        <span>${task.category}</span>
        <strong>${task.action}</strong>
        <p>${task.why}</p>
        <em>What to notice: ${task.observe}</em>
        <b>Open field note →</b>
      </a>`)}</div>`
    : html`<div class="empty-result">No field-note prompt is assigned to this date yet. The crop recommendations below still use your entered season.</div>`}
  <p class="seasonal-notebook-link"><a href="/content/seasonal/">Explore the April–October seasonal series →</a></p>
</section>`
```

<section class="today-method">
  <p class="kicker">Read the result honestly</p>
  <h2>What this tool knows—and what it does not</h2>
  <div class="method-grid">
    <div>
      <strong>Reference guidance</strong>
      <p>Season, frost tolerance, maturity range, and growing method come from the existing veggie.farm crop guides.</p>
    </div>
    <div>
      <strong>Seedbed temperature</strong>
      <p>Soil-temperature ranges are starting points, not a forecast. Measure your seedbed and follow your seed packet.</p>
    </div>
    <div>
      <strong>Your observations</strong>
      <p>The date, frost dates, risk preference, and soil temperature are the values you entered above.</p>
    </div>
    <div>
      <strong>Live forecast</strong>
      <p>The optional NWS lookup supplies timestamped hourly temperature, rain probability, and wind. Use your own soil measurement; an air-temperature forecast cannot supply it.</p>
    </div>
  </div>
  <p><a href="/about/data-sources">Read the sources and methods →</a></p>
</section>

## Look beyond today

[Compare this season with previous years](/tools/season-weather) for regional temperature context. [Try the Garden Decision Lab](/tools/garden-decisions) for light, companions, disease conditions, pruning and harvest. Historical warmth does not replace the forecast or a soil reading.

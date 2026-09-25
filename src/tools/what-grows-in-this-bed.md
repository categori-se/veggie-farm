---
title: "What Grows in This Bed"
description: "Rank crops for a garden bed using sun, soil, frost dates, soil temperature, rotation history, and goals."
toc: true
---

```js
import {gardenContext} from "../components/garden-context.js";
display(gardenContext({invalidation}));
```

```js
import {gardenActions} from "../components/garden-actions.js";
import {recommendCrops} from "../lib/recommendations/recommendCrops.js";
import {loadGardenProfile, profileDatesForYear} from "../lib/garden/localGardenStore.js";
```

# What grows in this bed?

Use this as a decision aid, not a command. The tool ranks crops from the plant database against the assumptions you enter, then shows why each crop was favored or held back.

```js
const plants = await FileAttachment("../data/plants.json").json();
const plantingRules = await FileAttachment("../data/planting-rules.json").json();
const soilPreferences = await FileAttachment("../data/soil-preferences.json").json();
const companionRelationships = await FileAttachment("../data/companion-relationships.json").json();
const rotationFamilies = await FileAttachment("../data/rotation-families.json").json();
const diseases = await FileAttachment("../data/diseases.json").json();
const sources = await FileAttachment("../data/source-citations.json").json();
const savedGardenProfile = loadGardenProfile();
```

```js
const now = new Date();
const currentYear = now.getFullYear();
const localDate = `${currentYear}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const savedFrostDates = savedGardenProfile ? profileDatesForYear(savedGardenProfile, currentYear) : null;
const date = view(Inputs.text({label: "Date", value: localDate}));
const lastFrostDate = view(Inputs.text({label: "Last spring frost date", value: savedFrostDates?.lastFrostDate ?? `${currentYear}-04-20`}));
const firstFrostDate = view(Inputs.text({label: "First fall frost date", value: savedFrostDates?.firstFrostDate ?? `${currentYear}-10-15`}));
const soilTemperatureF = view(Inputs.text({label: "Soil temperature °F for this check (optional)", value: "", placeholder: "Enter a current reading or a scenario value"}));
const sunHours = view(Inputs.text({label: "Direct sun hours (optional)", value: savedGardenProfile?.sunHours?.toString() ?? "", placeholder: "e.g. 6"}));
const soilTexture = view(Inputs.select(new Map([
  ["Not recorded", ""], ...["managed raised-bed loam", "loam", "sandy loam", "sand", "clay", "silty clay"].map(value => [value, value])
]), {label: "Soil texture", value: savedGardenProfile?.soil.effective.texture ?? ""}));
const drainage = view(Inputs.select(new Map([["Not recorded", ""], ...["moderate", "slow", "fast"].map(value => [value, value])]), {label: "Drainage", value: savedGardenProfile?.soil.effective.drainage ?? ""}));
const primaryUse = view(Inputs.select(new Map([
  ["Vegetables", "vegetable"],
  ["Herbs", "herb"],
  ["Flowers and pollinator plants", "flower-or-ornamental"],
  ["Grains and cover crops", "grain-or-cover-crop"],
  ["All plants", "all"]
]), {label: "Plant group", value: "vegetable"}));
const goal = view(Inputs.select(["balanced", "quick harvest", "salads", "heat crops", "pollinators"], {label: "Goal", value: "balanced"}));
const previousCropFamilies = view(Inputs.checkbox(rotationFamilies.map((row) => row.family), {label: "Families recently grown in this bed"}));
const rotationHistoryReviewed = view(Inputs.toggle({label: "I have reviewed this bed’s recent crop history", value: false}));
const wetWeather = view(Inputs.toggle({label: "Wet or humid pattern", value: false}));
const denseCanopy = view(Inputs.toggle({label: "Dense planting or poor airflow", value: false}));
```

```js
html`<p class="today-input-note"><strong>${savedGardenProfile ? `Using ${savedGardenProfile.gardenName}:` : "No saved garden profile:"}</strong> ${savedGardenProfile ? "Frost dates, sun, soil texture and drainage come from your account-scoped notebook draft. Open Notebook to refresh it from your account." : "These are editable starter assumptions."} <a href="/tools/my-garden">${savedGardenProfile ? "Edit Garden Notebook" : "Create Garden Notebook"} →</a></p>`
```

```js
const profile = {
  date,
  lastFrostDate,
  firstFrostDate,
  soilTemperatureF,
  sunHours,
  soilTexture,
  drainage,
  primaryUse,
  goal,
  previousCropFamilies,
  rotationHistoryReviewed,
  wetWeather,
  denseCanopy
};

const recommendations = recommendCrops(plants, {
  plantingRules,
  soilPreferences,
  companionRelationships,
  rotationFamilies,
  diseases
}, profile);

const sourceById = new Map(sources.filter((source) => source.type === "source").map((source) => [source.id, source]));
```

## Best fits

These are the strongest current matches for the bed assumptions above. The score ranks those matches; it is not a probability of success or a yield prediction. Missing crop history is unknown, not a favorable rotation. Select known recent crop families; confirm the history review only when the list reflects what you know about this bed.

<div class="table-wrap">

```js
Inputs.table(recommendations.slice(0, 35).map((row) => ({
  score: `${row.percent}/100`,
  crop: row.plant.name,
  group: row.plant.primaryUse.replaceAll("-", " "),
  family: row.plant.family ?? "",
  season: row.plant.season,
  status: row.status.replaceAll("_", " "),
  sun: row.plant.sun ?? "",
  spacing: row.plant.spacingInches?.text ?? "",
  germination: row.plant.germinationDays?.text ?? "",
  idealTemp: row.plant.idealSoilTemperatureF?.text ?? "",
  why: row.reasons.join(" "),
  warnings: row.warnings.join(" ")
})), {
  columns: ["score", "crop", "season", "spacing", "why", "warnings"],
  header: {
    score: "Fit",
    crop: "Crop",
    group: "Group",
    family: "Family",
    season: "Season",
    status: "Window",
    sun: "Sun",
    spacing: "Spacing",
    germination: "Sprouts",
    idealTemp: "Ideal temp",
    why: "Why",
    warnings: "Watch"
  }
})
```

</div>

## Why isn’t this crop higher?

```js
import {bedFitComparison} from "../components/bed-fit-comparison.js";
display(bedFitComparison(recommendations));
```

## Recommendation notes

```js
const top = recommendations[0];
```

```js
top ? html`<div class="decision-summary">
  <h2>${top.plant.name}</h2>
  ${gardenActions({crop: top.plant.name})}
  <p><strong>Comparison score: ${top.percent}/100.</strong> ${top.reasons[0]}</p>
  <ul>
    ${top.reasons.map((reason) => html`<li>${reason}</li>`)}
  </ul>
  ${top.warnings.length ? html`<p><strong>Watch:</strong> ${top.warnings.join(" ")}</p>` : ""}
  <p><strong>Observe:</strong> ${top.observe.join(", ")}.</p>
  <p><strong>Assumptions:</strong> ${top.assumptions.join("; ")}.</p>
  <p><strong>Sources:</strong> ${top.sources.map((sourceId) => sourceById.get(sourceId)?.name ?? sourceId).join(", ")}.</p>
</div>` : html`<p>No matches for this filter.</p>`
```

## Before you plant

Use these results as a shortlist. Check your seed packet, measured soil conditions and local frost outlook before planting; a good score does not guarantee a suitable crop or a successful harvest.

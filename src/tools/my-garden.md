---
title: "Your Garden Notebook"
description: "Keep a private garden profile and field observations that can improve veggie.farm recommendations."
toc: false
---

```js
import {gardenContext} from "../components/garden-context.js";
display(gardenContext({invalidation}));
```

```js
import {NOTEBOOK_STORAGE} from "../data/runtime-capabilities.js";
const localNotebook = NOTEBOOK_STORAGE === "local";
import {ensureNotebook} from "../lib/account/notebookCloud.js";
import {notebookAccount} from "../components/notebook-account.js";
import {
  OBSERVATION_TYPES,
  addGardenObservation,
  createGardenExport,
  loadGardenProfile,
  saveGardenProfile
} from "../lib/garden/localGardenStore.js";
```

```js
const crops = [
  ...await FileAttachment("../data/vegetables.json").json(),
  ...await FileAttachment("../data/fruits.json").json(),
  ...await FileAttachment("../data/herbs.json").json()
];
const notebookSession = await ensureNotebook();
const savedProfile = notebookSession.ready ? loadGardenProfile() : null;
const now = new Date();
const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const params = new URLSearchParams(globalThis.location?.search ?? "");
```

<section class="my-garden-hero">
  <div>
    <h1>Garden Notebook</h1>
    <p class="deck">Your private record of what you planned, tried and observed.</p>
  </div>
</section>

```js
display(notebookAccount({invalidation}));
```

```js
import {accountGardenHome} from "../components/account-garden-home.js";
display(accountGardenHome({invalidation}));
```

```js
import {notebookTimeline} from "../components/notebook-timeline.js";
notebookSession;
display(notebookTimeline({invalidation}));
```

<details class="notebook-soil-details"><summary>Soil results over time</summary>

```js
import {soilTestHistory} from "../components/soil-test-history.js";
notebookSession;
const soilPhReferences = await FileAttachment("../data/soil-ph-references.json").json();
display(soilTestHistory({invalidation,phReferences:soilPhReferences}));
```

</details>

<details class="notebook-plan-details"><summary>Planting plans and recorded growth stages</summary>

```js
import {gardenDashboard} from "../components/garden-actions.js";
display(gardenDashboard({compact: false, invalidation, crops}));
```

</details>

<details class="notebook-profile"><summary>Garden context and frost dates (optional)</summary>

```js
savedProfile ? html`<div class="saved-garden-banner">
  <span>Using saved profile</span>
  <strong>${savedProfile.gardenName}</strong>
  <p>${[savedProfile.locationLabel, savedProfile.hardinessZone ? `Zone ${savedProfile.hardinessZone}` : null].filter(Boolean).join(" · ") || "No location label stored"}</p>
</div>` : html`<div class="saved-garden-banner" data-empty="true">
  <span>Start small</span>
  <strong>No garden profile is saved yet</strong>
  <p>Start with a name for the garden, your frost dates and what you know about the soil.</p>
</div>`
```

<div class="my-garden-controls">
  <div>
    <p class="kicker">Profile</p>
    <h2>What is stable about this garden?</h2>
  </div>
  <p>Store recurring context once. Frost dates are kept as month and day so they can be reused next year.</p>
</div>

```js
const gardenName = view(Inputs.text({label: "Garden name", value: savedProfile?.gardenName ?? "My garden"}));
const locationLabel = view(Inputs.text({label: "Town or region (optional)", value: savedProfile?.locationLabel ?? "", placeholder: "e.g. Pioneer Valley"}));
const hardinessZone = view(Inputs.text({label: "Hardiness zone (optional)", value: savedProfile?.hardinessZone ?? "", placeholder: "e.g. 6a"}));
const lastFrostMonthDay = view(Inputs.text({label: "Typical last frost (MM-DD)", value: savedProfile?.climate.lastFrostMonthDay ?? "05-10"}));
const firstFrostMonthDay = view(Inputs.text({label: "Typical first frost (MM-DD)", value: savedProfile?.climate.firstFrostMonthDay ?? "10-15"}));
const soilTexture = view(Inputs.select(new Map([
  ["Not recorded", ""], ...["managed raised-bed loam", "loam", "sandy loam", "sand", "clay", "silty clay"].map(value => [value, value])
]), {label: "Soil texture in your bed", value: savedProfile?.soil.effective.texture ?? ""}));
const drainage = view(Inputs.select(new Map([["Not recorded", ""], ...["slow", "moderate", "fast"].map(value => [value, value])]), {label: "How quickly the bed drains", value: savedProfile?.soil.effective.drainage ?? ""}));
const sunHours = view(Inputs.text({label: "Direct sun hours (optional)", value: savedProfile?.sunHours?.toString() ?? "", placeholder: "e.g. 6"}));
const measuredSoilTemperature = view(Inputs.text({label: "Measured soil temperature °F (optional; recheck before planting)", value: savedProfile?.soilTemperatureF?.toString() ?? ""}));
display(html`<label>Soil temperature measurement date (optional; leave blank if unknown)</label>`);
const soilTemperatureMeasuredOnValue = view(html`<input type="date" aria-label="Soil temperature measurement date" value=${savedProfile?.soilTemperatureMeasuredOn ?? ""} title="Date you measured this soil temperature">`);
const bedCount = view(Inputs.text({label: "Bed count (optional)", value: savedProfile?.bedCount?.toString() ?? "", placeholder: "e.g. 4"}));
const irrigation = view(Inputs.select(["hand watering", "hose", "soaker hose", "drip", "mixed", "none"], {label: "Usual irrigation", value: savedProfile?.irrigation || "hand watering"}));
const microclimateNotes = view(Inputs.textarea({label: "Microclimate notes", value: savedProfile?.microclimateNotes ?? "", placeholder: "Frost pocket, warm wall, afternoon shade, raised-bed soil…", rows: 3}));
```

```js
const soilTemperatureMeasuredOn = soilTemperatureMeasuredOnValue instanceof Date ? (Number.isFinite(soilTemperatureMeasuredOnValue.getTime()) ? soilTemperatureMeasuredOnValue.toISOString().slice(0, 10) : "") : soilTemperatureMeasuredOnValue || "";
```

```js
const profileSave = view(Inputs.button("Save garden profile", {
  reduce: () => notebookSession.ready ? saveGardenProfile({
    gardenName,
    locationLabel,
    hardinessZone,
    lastFrostDate: lastFrostMonthDay,
    firstFrostDate: firstFrostMonthDay,
    soilTexture,
    soilTemperatureF: measuredSoilTemperature,
    soilTemperatureMeasuredOn,
    drainage,
    sunHours,
    bedCount,
    irrigation,
    microclimateNotes
  }) : {saved:false}
}));
```

```js
profileSave ? html`<p class="save-status" data-saved=${profileSave.saved}>${profileSave.saved ? (localNotebook ? "Profile saved in this browser." : "Profile draft recorded. Check the account save status above.") : (localNotebook ? "Browser storage is unavailable. Export a backup before leaving." : "Sign in and load your account notebook before saving.")} <a href="/tools/today">Use it in Garden Today →</a></p>` : html`<p class="save-status">Describe your actual bed soil, which may differ from regional soil maps.</p>`
```

</details>

<div class="journal-controls" id="field-notes">
  <div>
    <p class="kicker">Field notes</p>
    <h2>What happened?</h2>
  </div>
  <p>A short dated observation is more useful than a perfect journal you stop keeping.</p>
</div>

```js
const typeLabels = {
  seeded: "Seeded", germinated: "Germinated", transplanted: "Transplanted", flowered: "Flowered",
  fruit_set: "Fruit set", harvested: "Harvested", bolted: "Bolted", frost_damage: "Frost damage",
  heat_damage: "Heat damage", pest_seen: "Pest seen", disease_seen: "Disease seen", watering: "Watered",
  rain: "Rain", soil_test: "Soil test", note: "General note"
};
const queryType = params.get("type");
const observationType = view(Inputs.select(OBSERVATION_TYPES, {
  label: "Observation type",
  value: OBSERVATION_TYPES.includes(queryType) ? queryType : "note",
  format: (value) => typeLabels[value]
}));
const observationDate = view(Inputs.text({label: "Date", value: localDate, placeholder: "YYYY-MM-DD"}));
const bed = view(Inputs.text({label: "Bed or area", value: params.get("bed") ?? "", placeholder: "e.g. Bed 2"}));
const cropNames = ["", ...crops.map((crop) => crop.name).sort()];
const queryCrop = params.get("crop") ?? "";
const crop = view(Inputs.select(cropNames, {label: "Crop", value: cropNames.includes(queryCrop) ? queryCrop : "", format: (value) => value || "No crop selected"}));
const variety = view(Inputs.text({label: "Variety (optional)", value: ""}));
const notes = view(Inputs.textarea({label: "Plain observation", value: "", placeholder: "What did you see, measure, do, or harvest?", rows: 4}));
```

```js
const observationSave = view(Inputs.button("Save field note", {
  reduce: () => {
    try {
      if (!notebookSession.ready) return {saved: false, error: localNotebook ? "Browser storage is unavailable." : "Sign in and load your account notebook first."};
      return addGardenObservation({type: observationType, date: observationDate, bed, crop, variety, notes});
    } catch (error) {
      return {saved: false, error: "Enter a real calendar date in YYYY-MM-DD format. Your existing notes have not changed."};
    }
  }
}));
```

```js
const notebookRevision = Generators.observe(notify => {
  let revision = 0; notify(revision);
  const changed = () => notify(++revision);
  window.addEventListener("garden-records-changed", changed);
  return () => window.removeEventListener("garden-records-changed", changed);
});
```

```js
observationSave ? html`<p class="save-status" data-saved=${observationSave.saved}>${observationSave.saved ? (localNotebook ? "Note saved in this browser." : "Note draft recorded. Check the account save status above.") : observationSave.error || "This browser did not allow the note to be saved."}</p>` : html``
```

```js
const exportRevision = [profileSave?.profile?.updatedAt, observationSave?.observation?.id];
const exportJson = JSON.stringify((exportRevision, notebookRevision, notebookSession.ready ? createGardenExport() : {}), null, 2);
const exportHref = `data:application/json;charset=utf-8,${encodeURIComponent(exportJson)}`;
```

```js
html`<section class="garden-data-footer">
  <div>
    <p class="kicker">Your data</p>
    <h2>Keep a copy outside the browser</h2>
    <p>Your account holds the saved notebook; this browser may also hold an unsent draft. Keep an export before resolving a conflict or clearing browser data.</p>
  </div>
  <a class="button-secondary" href=${exportHref} download="veggie-farm-garden.json">Export garden data</a>
</section>`
```

```js
import {gardenSeasonReview} from "../components/garden-season-review.js";
display(gardenSeasonReview({invalidation}));
```

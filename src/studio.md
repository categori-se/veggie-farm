---
title: "Garden Planning Studio"
description: "Map a Massachusetts property, sketch garden beds, and plan crops in synchronized 2D and 3D views."
toc: false
---

```js
import {gardenPlanner} from "./components/gardenPlanner.js";
```

```js
const spatialCatalog = await FileAttachment("./data/ma-spatial-catalog.json").json();
const publishedDemoCollection = await FileAttachment("./data/studio-public-collection.json").json();
const publicDataCatalog = await FileAttachment("./data/api/v1/catalog.json").json();
const publicDataCollections = await FileAttachment("./data/api/v1/collections.json").json();
const publicGardenItems = await FileAttachment("./data/api/v1/collections/gardens/items.json").json();
// Keep direct API assets deployable without eagerly downloading a second copy;
// the planner consumes the generated JavaScript collections instead.
const publicGardenSpatialApiAssets = {
  parcels: await FileAttachment("./data/api/v1/collections/garden-parcels/items.json").url(),
  site: await FileAttachment("./data/api/v1/collections/garden-site/items.json").url(),
  beds: await FileAttachment("./data/api/v1/collections/garden-beds/items.json").url(),
  plants: await FileAttachment("./data/api/v1/collections/garden-plants/items.json").url(),
  schema: await FileAttachment("./data/api/v1/schemas/garden-spatial-feature.schema.json").url()
};
const publicFlowerItems = await FileAttachment("./data/api/v1/collections/flowers/items.json").json();
const publicSourceItems = await FileAttachment("./data/api/v1/collections/sources/items.json").json();
const publicModelItems = await FileAttachment("./data/api/v1/collections/models/items.json").json();
const gardenReferenceAssets = {
  "garden-reference-index": await FileAttachment("./assets/garden-references/reference-archive.html").url()
};
// Research raster is retained privately; source evidence and garden geometry remain available.
const gardenReferenceOverlayAssets = {};
// Optional source-comparison layers can be supplied by an operator.
const gardenSourceEvidenceByGardenId = {};
import {loadMediaManifest} from "./lib/media/runtimeMedia.js";
const optionalMedia = await loadMediaManifest();
const studioModelAssets = Object.fromEntries(Object.entries(optionalMedia).filter(([id])=>id.startsWith("model:")).map(([id,value])=>[id.slice(6),value.url]));
```

```js
display(gardenPlanner({
  publicCollection: publishedDemoCollection,
  modelAssets: studioModelAssets,
  modelCatalog: publicModelItems.features,
  referenceAssets: gardenReferenceAssets,
  referenceOverlayAssets: gardenReferenceOverlayAssets,
  sourceEvidenceByGardenId: gardenSourceEvidenceByGardenId
}));
```

```js
const studioHome = document.createElement("div");
studioHome.className = "studio-transfer-note";
if (location.hostname === "studio.veggie.farm") {
  studioHome.innerHTML = '<details><summary>Find your earlier gardens</summary><p><a href="https://veggie.farm/studio.html">Open the previous planner</a>, export your JSON backup, then use Restore backup here. Browser-saved plans stay on their original site. If you uploaded an account copy, sign in here and choose it to restore. Earlier browser drafts can also be downloaded with the recovery button below.</p></details>';
} else {
  studioHome.textContent = 'Your plan stays in this browser. Download a JSON backup to keep a copy, or explicitly save a private account copy to return to on another device.';
}
const recover = document.createElement("button");
recover.type = "button";
recover.textContent = "Download earlier browser gardens";
try {
  const earlier = localStorage.getItem("veggie.farm:garden-studio:v8");
  if (earlier) {
    recover.onclick = () => {
      const url = URL.createObjectURL(new Blob([earlier], {type: "application/json"}));
      const link = document.createElement("a"); link.href = url; link.download = "earlier-browser-gardens.json"; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    studioHome.append(recover);
  }
} catch { /* Browser storage may be unavailable. */ }
display(studioHome);
```

<section class="studio-context-bar" aria-labelledby="studio-title">
  <div class="studio-context-title">
    <p class="kicker">Garden layout tool · Massachusetts</p>
    <h1 id="studio-title">Garden Planning Studio</h1>
    <p>Design your own collection of gardens, spaces and beds. Arrange plants in 2D or 3D, keep named versions, and save private account copies to return from another browser. Try the editable practice bed without an account.</p>
    <p>For Massachusetts and New England home gardeners: turn growing guidance into a plan for your own space. The practice garden needs no account or home address.</p>
    <p><a href="https://veggie.farm/tools">Gardening guidance</a> · <a href="https://veggie.farm/about/build-evidence">How it was built: AWS and Codex evidence</a> · <a href="https://github.com/categori-se/veggie-farm">Open-source code</a></p>
    <details class="studio-first-visit"><summary>First visit? Try a plan in two minutes</summary><ol><li>Select <strong>Start a practice garden</strong> for an editable 4 × 8 ft bed.</li><li>Name or resize the bed. Open <strong>Plants</strong>, add a supported plant and inspect its spacing.</li><li>Compare 2D and 3D if available. Save, reload and download a JSON backup to keep outside this browser.</li></ol><p>Public-garden studies are incomplete references. The preview shows layout and plant representations; it does not simulate sunlight or predict yield. Account uploads are optional and explicit.</p></details>
  </div>
  <details class="studio-study-details" id="public-garden-examples">
    <summary>Public examples &amp; sources</summary>
    <div>
      <p><a href="#garden-examples">Choose a demo garden and open its plan ↓</a></p>
      <p>Explore four Massachusetts gardens: Berkshire Botanical Garden, The Mount, Naumkeag and Ashintully. Compare the arrangement of beds, paths and larger garden spaces. Drawn boundaries are interpretations of maps and imagery, not surveyed measurements; planting inventories remain incomplete.</p>
      <p>Public-garden studies are starting points for exploration, not surveyed plans or complete planting inventories. Open a garden’s information card to see its sources and uncertainties. Your edits stay in this browser unless you export a backup or explicitly save an account copy.</p>
      <p>The 3D preview helps you compare layout and plant shapes. A generic berry or flower model represents a planting; it is not a botanical identification or a prediction of growth.</p>
      <div class="studio-source-links">
        <a href="https://quaternius.com/packs/ultimatecrops.html" target="_blank" rel="noopener noreferrer">Quaternius crops ↗</a>
        <a href="https://poly.pizza/m/Ro6K0Yg7mx" target="_blank" rel="noopener noreferrer">Model source record ↗</a>
        <a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noopener noreferrer">CC0 1.0 ↗</a>
      </div>
    </div>
  </details>
</section>



<section id="garden-examples" class="studio-shortlist" aria-labelledby="studio-shortlist-title">
  <div>
    <p class="kicker">Parcel-mapped garden library</p>
    <h2 id="studio-shortlist-title">Open a demo garden</h2><p>Select a garden to view its full layout above. All four are also in the canvas’s Garden menu. These studies have incomplete planting records and interpreted boundaries.</p>
  </div>
  <div class="studio-shortlist-grid">
    <button class="studio-shortlist-card is-selected" type="button" data-garden-reference="berkshire-botanical-garden" aria-pressed="true" aria-label="Open Berkshire Botanical Garden in the planning canvas">
      <span>Parcel matched · aerial interpreted</span>
      <h3>Berkshire Botanical Garden</h3>
      <p>Explore the rhythm of repeated beds and connecting paths. Bed outlines are estimates for comparison; the study does not document a complete planting plan.</p>
    </button>
    <button class="studio-shortlist-card" type="button" data-garden-reference="the-mount-kitchen-garden" aria-pressed="false" aria-label="Open The Mount kitchen garden concept in the planning canvas">
      <span>Parcel matched · aerial interpretation</span>
      <h3>The Mount</h3>
      <p>Aerial-traced formal garden rooms, pools, walks and the main house replace the schematic kitchen-garden layout. Boundaries beneath canopy remain uncertain; planting design is separate.</p>
    </button>
    <button class="studio-shortlist-card" type="button" data-garden-reference="naumkeag-garden-rooms" aria-pressed="false" aria-label="Open the Naumkeag garden rooms concept in the planning canvas">
      <span>Parcel matched · aerial interpretation</span>
      <h3>Naumkeag</h3>
      <p>Garden rooms, arrival paths, buildings and pools are traced from 2025 aerial imagery, with the visitor map informing their identity. Obscured areas and the wider estate remain incomplete.</p>
    </button>
    <button class="studio-shortlist-card" type="button" data-garden-reference="ashintully-terrace-garden" aria-pressed="false" aria-label="Open the Ashintully terrace garden concept in the planning canvas">
      <span>Parcel corrected · mixed confidence</span>
      <h3>Ashintully</h3>
      <p>The corrected campus east of Main Road includes the Music Barn, interpreted garden terraces, visible meadow paths and Marble Palace ruins. Woodland routes obscured by canopy are omitted.</p>
    </button>
  </div>
</section>

```js
const gardenShortlistCards = [...document.querySelectorAll("[data-garden-reference]")];

const syncGardenShortlist = (gardenId) => {
  if (!gardenId) return;
  for (const card of gardenShortlistCards) {
    const selected = card.dataset.gardenReference === gardenId;
    card.classList.toggle("is-selected", selected);
    card.setAttribute("aria-pressed", selected ? "true" : "false");
  }
};

const selectGardenFromShortlist = (event) => {
  const gardenId = event.currentTarget.dataset.gardenReference;
  const plannerRoot = document.querySelector(".garden-planner-app");
  plannerRoot?.dispatchEvent(new CustomEvent("veggie-farm:select-garden", {
    detail: {id: gardenId}
  }));
  plannerRoot?.scrollIntoView({behavior: "smooth", block: "start"});
};

const syncGardenFromPlanner = (event) => syncGardenShortlist(event.detail?.id);
const syncGardenAfterMount = () => syncGardenShortlist(
  document.querySelector('.garden-planner-app [data-control="activeGarden"]')?.value
);

for (const card of gardenShortlistCards) card.addEventListener("click", selectGardenFromShortlist);
document.addEventListener("veggie-farm:active-garden", syncGardenFromPlanner);
const gardenShortlistSyncFrame = requestAnimationFrame(syncGardenAfterMount);

invalidation.then(() => {
  cancelAnimationFrame(gardenShortlistSyncFrame);
  for (const card of gardenShortlistCards) card.removeEventListener("click", selectGardenFromShortlist);
  document.removeEventListener("veggie-farm:active-garden", syncGardenFromPlanner);
});
```

<section class="studio-data-section">
  <div class="studio-data-heading"><div><p class="kicker">Make the plan useful</p><h2>Leave room to grow—and room to garden</h2></div><p>Try one bed first. Compare the space plants need, the path you will use to reach them, and the view from the places where you spend time.</p></div>
  <div class="studio-data-flow">
    <article><span>1 · Observe</span><strong>Start with the real space</strong><p>Check sunlight, water access and the measurements that matter. A map is a starting point; measure your bed and paths before buying materials.</p></article>
    <article><span>2 · Arrange</span><strong>Picture the mature garden</strong><p>Give crops room to grow. Switch between the overhead plan and 3D preview to explore spacing and access.</p></article>
    <article><span>3 · Keep</span><strong>Save an idea worth returning to</strong><p>Name a layout before trying an alternative. Download a backup, or explicitly save a private account copy to recover in another browser.</p></article>
  </div>
  <p><a href="https://veggie.farm/content/vegetables/">Read the crop guides</a> · <a href="https://veggie.farm/tools/garden-decisions">Work through a gardening question</a> · <a href="https://veggie.farm/about/data-sources">Sources and map limitations</a></p>
</section>

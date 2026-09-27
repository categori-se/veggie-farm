---
title: "Herbs"
description: "Culinary herbs for a useful, fragrant, insect-friendly garden, organized by season and care pattern."
section: "herbs"
status: "ready"
date: "2026-07-02"
tags:
  - "index"
  - "herbs"
  - "pollinators"
---

<section class="section-hero">
  <div class="section-hero-copy">
    <p class="kicker">Kitchen and ecology</p>
    <h1>Herbs</h1>
    <p class="deck">Herbs are small plants with an outsized effect: cooking, fragrance, beneficial insects, and better daily use of the garden.</p>
    <p>Many herbs also teach timing. Basil wants warmth. Cilantro wants cool weather. Rosemary wants drainage. Mint wants boundaries.</p>
  </div>

</section>

<figure data-optional-media="images/plants/basil.webp" data-media-alt="Fresh basil leaves on a green herb plant."><p>Fresh basil leaves on a green herb plant. — optional image not configured.</p></figure>

## Herb guide index

<div class="table-wrap">

```js
const herbs = await FileAttachment("../../data/herbs.json").json();
html`<table><thead><tr><th scope="col">Herb</th><th scope="col">Season</th><th scope="col">Care focus</th></tr></thead><tbody>${herbs.map(d => html`<tr><th scope="row"><a href=${d.path}>${d.name}</a></th><td>${d.season}</td><td>${d.mainCare}</td></tr>`)}</tbody></table>`
```

</div>

## Let some herbs flower

Herbs are not only kitchen plants. Flowering dill, cilantro, parsley, thyme, mint, basil, and sage can support pollinators, hoverflies, tiny wasps, and other beneficial insects.

Harvest what you need, but consider letting some plants complete their cycle.

<div class="field-notes">
  <h2>Field notes</h2>
  <p>Record which herbs you actually use. A small planting of a useful herb is more valuable than a large planting that only looks good in June.</p>
</div>


## Choose herbs for your garden

Start with herbs you use in the kitchen. Use the comparison below to read their recorded season and care needs, then open a guide for more detail. Check the light, moisture and space in the place you want to plant.

[Find herb varieties](https://veggie.farm/content/reference/plant-database?category=herb) · [Plan a bed in Studio](https://studio.veggie.farm/) · [Record an herb observation](https://veggie.farm/tools/my-garden?type=note)

```js
import {cropCompare} from "../../components/crop-compare.js";
const comparisonCrops = await FileAttachment("../../data/herbs.json").json();
display(cropCompare(comparisonCrops, {title: "Compare two herbs", description: "Compare their recorded season, care and uses. Open a growing guide for the full context.", itemLabel: "Herb", showActions: false}));
```


```js
import {mountOptionalMedia} from "/lib/media/runtimeMedia.js";
mountOptionalMedia();
```

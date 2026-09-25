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


## Compare the light available

```js
import {decisionWorkbench} from "../../components/garden-decisions.js";
const decisionSources = await FileAttachment("../../data/decision-sources.json").json();
display(decisionWorkbench("sun", {sources: decisionSources, crop: {slug: "index"}}));
```

## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "Which herbs match your kitchen and your conditions?", "observe": "Compare light, moisture and containment needs; reserve a few flowers if insect habitat is part of your goal.", "topic": "companions", "cropName": ""}));
```

```js
import {cropCompare} from "../../components/crop-compare.js";
const comparisonCrops = await FileAttachment("../../data/herbs.json").json();
display(cropCompare(comparisonCrops));
```


```js
import {mountOptionalMedia} from "/lib/media/runtimeMedia.js";
mountOptionalMedia();
```

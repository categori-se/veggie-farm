---
title: "veggie.farm"
description: "Plant data, weather, soil and space to help you make better garden decisions."
toc: false
---

<section class="home-proposition">
<h1>Make better garden decisions.</h1>
<p>Plant data, weather, soil, space and your observations—decide what to grow, where it fits, when to plant and what to do next.</p>
<nav class="home-primary-actions" aria-label="Start gardening"><a href="#plant-now">What can I plant now?</a><a href="https://studio.veggie.farm/">Plan my garden ↗</a><a href="/content/reference/plant-database">Find plants</a><a href="#in-season">Explore the season</a></nav>
</section>

```js
import {homeDecisions} from "./components/home-decisions.js";
const crops = await FileAttachment("./data/vegetables.json").json();
const rules = await FileAttachment("./data/crop-decision-rules.json").json();
const evidence = await FileAttachment("./data/horticultural-evidence.json").json();
const sources = await FileAttachment("./data/source-citations.json").json();
const extensionSources = await FileAttachment("./data/evidence-sources.json").json();
display(homeDecisions(crops, rules, evidence, [...sources, ...extensionSources], {invalidation}));
```


```js
import {seasonSummary} from "./components/season-summary.js";
display(seasonSummary());
```

<section class="home-routing">
<h2>Plan with data</h2>
<dl class="home-tool-list">
<div><dt><a href="/content/reference/plant-database">Find Plants</a></dt><dd>Photos, growing facts and side-by-side variety comparisons.</dd></div>
<div><dt><a href="/tools/what-grows-in-this-bed">What fits this bed?</a></dt><dd>Compare crops against your space, light and soil assumptions.</dd></div>
<div><dt><a href="https://studio.veggie.farm/">Garden Planning Studio ↗</a></dt><dd>Arrange gardens and beds in 2D and 3D. Start with a practice garden.</dd></div>
<div><dt><a href="/tools/my-garden">Garden Notebook</a></dt><dd>Keep private planting records and observations in your account.</dd></div>
</dl>
</section>

<section class="home-routing">
<h2>Explore plant and garden knowledge</h2>
<nav class="home-knowledge-links" aria-label="Gardening knowledge"><a href="/content/vegetables/">Vegetables</a><a href="/content/fruits/">Fruits</a><a href="/content/herbs/">Herbs</a><a href="/content/soil/">Soil</a><a href="/content/seasonal/">Field notes</a><a href="/content/reference/garden-knowledge-base">Search all guides →</a></nav>
</section>

<section class="home-routing">
<h2>Why these answers?</h2>
<p>Plant catalogs describe varieties. Extension guidance adds growing context. Weather and your observations help check whether that guidance fits today. Open the evidence behind a result to see its sources and assumptions.</p>
<a href="/about/data-sources">Explore data and evidence →</a>
</section>

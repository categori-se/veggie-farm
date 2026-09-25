---
title: "Fruits"
description: "Perennial and annual fruit guides organized around establishment, pruning, harvest timing, and long-term care."
section: "fruits"
status: "ready"
date: "2026-07-02"
tags:
  - "index"
  - "fruits"
  - "perennials"
---

<section class="section-hero">
  <div class="section-hero-copy">
    <p class="kicker">Perennial food</p>
    <h1>Fruits</h1>
    <p class="deck">Fruit changes the time horizon of a garden. Annual vegetables teach in months. Fruit teaches in years.</p>
    <p>Planting, pruning, mulching, and patience matter. A fruit planting can be one of the most productive parts of a home garden, but it asks for decisions that last longer than a season.</p>
  </div>
  <figure data-optional-media="images/illustrations/sun-path-microclimate.webp" data-media-alt="Illustrated sun path and microclimate diagram over a garden shed with windbreak trees."><p>Illustrated sun path and microclimate diagram over a garden shed with windbreak trees. — optional image not configured.</p></figure>
</section>

## Start with establishment

The first job is not harvest. The first job is establishment.

Young fruit plants need water, mulch, root development, protection from competition, and enough pruning or training to create a useful structure. A weak first year often shows up later as slow bearing, poor growth, or a plant that never becomes easy to manage.

## Before choosing currants or gooseberries

Massachusetts prohibits black currants and their hybrids. Gooseberries require a permit and are restricted in some towns. [Check MDAR’s current rules before ordering plants](https://www.mass.gov/how-to/apply-for-a-permit-to-grow-red-currants-or-gooseberries). These reference pages are not planting approval.

## Fruit guide index

<div class="table-wrap">

| Fruit | Type | Main care focus |
|---|---|---|
| [Apples](/content/fruits/apples) | Tree fruit | Pruning, thinning, pest monitoring, and young-tree watering |
| [Pears](/content/fruits/pears) | Tree fruit | Training, pruning, fire blight awareness, and harvest timing |
| [Plums](/content/fruits/plums) | Tree fruit | Pruning, thinning, brown rot prevention, and wildlife protection |
| [Sour Cherries](/content/fruits/sour-cherries) | Tree fruit | Open structure, harvest timing, and bird protection |
| [Blueberries](/content/fruits/blueberries) | Small fruit | Acid soil, mulch, steady moisture, and patient establishment |
| [Raspberries](/content/fruits/raspberries) | Cane fruit | Cane renewal, trellising, pruning type, and harvest discipline |
| [Black Currants](/content/fruits/black-currants) | Shrub fruit | Renewal pruning, mulch, and summer moisture |
| [Gooseberries](/content/fruits/gooseberries) | Shrub fruit | Airflow, pruning, and harvest access around thorny canes |
| [Strawberries](/content/fruits/strawberries) | Small fruit | Runner management, mulch, renovation, and clean harvest |
| [Ground Cherries](/content/fruits/ground-cherries) | Annual fruiting crop | Warm soil, spacing, fallen-husk harvest, and volunteer management |

</div>

## Plan for the long term

<div class="section-grid">
  <a class="section-card" href="/content/fruits/apples">
    <span>Tree fruit</span>
    <strong>Train structure early</strong>
    <p>Apples, pears, plums, and cherries need thoughtful pruning before they become difficult to manage.</p>
  </a>
  <a class="section-card" href="/content/fruits/blueberries">
    <span>Small fruit</span>
    <strong>Match soil to crop</strong>
    <p>Blueberries, currants, gooseberries, and strawberries succeed when soil pH, mulch, and moisture fit the plant.</p>
  </a>
  <a class="section-card" href="/content/fruits/raspberries">
    <span>Cane fruit</span>
    <strong>Renew bearing wood</strong>
    <p>Raspberries and similar cane crops depend on knowing which canes fruit and which canes should be removed.</p>
  </a>
  <a class="section-card" href="/content/garden/understanding-your-climate">
    <span>Site</span>
    <strong>Read microclimates</strong>
    <p>Cold pockets, reflected heat, wind, shade, and water access determine whether a planting thrives for years.</p>
  </a>
</div>

<div class="field-notes">
  <h2>Field notes</h2>
  <p>For fruit, record years, not just dates. Note planting year, rootstock if known, pruning decisions, first bloom, first real harvest, pest timing, and winter injury. Perennial records become more valuable every season.</p>
</div>


## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "Which fruit fits the site and your maintenance time?", "observe": "Compare mature size, sunlight, soil results, pollination needs and harvest access before choosing a plant.", "topic": "sun", "cropName": ""}));
```

```js
import {cropCompare} from "../../components/crop-compare.js";
const comparisonCrops = await FileAttachment("../../data/fruits.json").json();
display(cropCompare(comparisonCrops));
```


```js
import {mountOptionalMedia} from "/lib/media/runtimeMedia.js";
mountOptionalMedia();
```

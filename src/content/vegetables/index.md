---
title: "Vegetables"
description: "Crop guides for annual vegetables organized by season, family, spacing, planting window, and practical garden use."
section: "vegetables"
status: "ready"
date: "2026-07-02"
tags:
  - "index"
  - "vegetables"
  - "crop planning"
---

<section class="section-hero">
  <div class="section-hero-copy">
    <p class="kicker">Crop guides</p>
    <h1>Vegetables</h1>
    <p class="deck">Vegetables are the fast-moving part of the garden. They ask for timely planting, consistent care, and regular harvest, then give feedback quickly.</p>
    <p>Use these guides as practical references, then adapt them to your own climate, soil, water, and time.</p>
  </div>
  <figure data-optional-media="images/illustrations/garden-plan-rotation.webp" data-media-alt="Illustrated four-year crop rotation plan with leafy greens, fruiting crops, legumes, and root crops."><p>Illustrated four-year crop rotation plan with leafy greens, fruiting crops, legumes, and root crops. — optional image not configured.</p></figure>
</section>

## How to use these crop guides

Start with season. Warm-season crops such as tomatoes, peppers, beans, cucumbers, squash, and corn need warm soil and protection from frost. Cool-season crops such as lettuce, peas, spinach, kale, radishes, carrots, and beets can use the shoulder seasons when heat-loving crops are not ready or are already finished.

Then look at plant family. Family matters for rotation, disease carryover, nutrient demand, and pest patterns. A small garden cannot always rotate perfectly, but it can avoid putting the same crop family in the same bed repeatedly when problems are building.

Finally, look at spacing and harvest habit. A bed of greens behaves differently from a bed of trellised tomatoes. A root crop needs loose soil and even moisture. A fruiting crop needs support, airflow, pollination, and harvest access.

## Find a variety

Compare spacing, seed depth and germination across vegetable varieties. Use the crop guides below for care through the season, and check your seed packet for variety-specific instructions.

```js
import {plantExplorer} from "../../components/garden-library.js";
const plants = await FileAttachment("../../data/plant-explorer.json").json();
display(plantExplorer(plants.filter(plant => plant.category === "vegetable"), {invalidation}));
```

## Choose a crop guide

<div class="table-wrap">

| Crop | Family | Season | Planting window | Typical spacing |
|---|---|---|---|---|
| [Tomatoes](/content/vegetables/tomatoes) | Nightshade | Warm season | Start indoors 6-8 weeks before last frost; transplant after soil warms | 18-24 in |
| [Peppers](/content/vegetables/peppers) | Nightshade | Warm season | Start indoors 8-10 weeks before last frost; transplant into warm soil | 18-24 in |
| [Lettuce](/content/vegetables/lettuce) | Aster | Cool season | Direct sow or transplant in spring and fall | 6-12 in |
| [Beans](/content/vegetables/beans) | Legume | Warm season | Direct sow after soil warms | 4-8 in |
| [Cucumbers](/content/vegetables/cucumbers) | Cucurbit | Warm season | Direct sow or transplant after frost | 12-18 in trellised |
| [Carrots](/content/vegetables/carrots) | Umbellifer | Cool season | Direct sow in cool weather | 1-3 in after thinning |
| [Potatoes](/content/vegetables/potatoes) | Nightshade | Cool to warm season | Plant seed potatoes in spring | 10-12 in |
| [Peas](/content/vegetables/peas) | Legume | Cool season | Direct sow early spring | 2-3 in |
| [Beets](/content/vegetables/beets) | Amaranth | Cool season | Direct sow spring and late summer | 3-4 in |
| [Onions](/content/vegetables/onions) | Allium | Cool to warm season | Start from seed, sets, or transplants | 4-6 in |
| [Kale](/content/vegetables/kale) | Brassica | Cool season | Spring and late summer | 12-18 in |
| [Radishes](/content/vegetables/radishes) | Brassica | Cool season | Short spring and fall successions | 1-2 in |
| [Arugula](/content/vegetables/arugula) | Brassica | Cool season | Short spring and fall successions | 2-6 in |
| [Turnips](/content/vegetables/turnips) | Brassica | Cool season | Direct sow spring and late summer | 2-4 in |
| [Collards](/content/vegetables/collards) | Brassica | Cool season | Spring and late summer | 12-18 in |
| [Bok Choy](/content/vegetables/bok-choy) | Brassica | Cool season | Spring or late summer | 6-12 in |
| [Mizuna](/content/vegetables/mizuna) | Brassica | Cool season | Spring and fall | 4-8 in |
| [Swiss Chard](/content/vegetables/swiss-chard) | Amaranth | Cool to warm season | Spring through midsummer | 8-12 in |
| [Zucchini](/content/vegetables/zucchini) | Cucurbit | Warm season | Direct sow or transplant after frost | 24-36 in |
| [Winter Squash](/content/vegetables/winter-squash) | Cucurbit | Warm season | Direct sow or transplant after frost | 36-72 in |
| [Corn](/content/vegetables/corn) | Grass | Warm season | Direct sow after soil warms, in blocks | 8-12 in |
| [Spinach](/content/vegetables/spinach) | Amaranth | Cool season | Early spring, late summer, or fall | 4-6 in |
| [Garlic](/content/vegetables/garlic) | Allium | Fall-planted cycle | Plant cloves in fall | 4-6 in |

</div>

## Explore by growing habit

<div class="section-grid">
  <a class="section-card" href="/content/vegetables/tomatoes">
    <span>Warm season</span>
    <strong>Fruiting crops</strong>
    <p>Tomatoes, peppers, cucumbers, squash, and corn need warm soil, frost protection, airflow, and steady harvest attention.</p>
  </a>
  <a class="section-card" href="/content/vegetables/lettuce">
    <span>Cool season</span>
    <strong>Leaves and stems</strong>
    <p>Lettuce, kale, spinach, chard, bok choy, mizuna, arugula, and collards use the shoulder seasons and reward succession planting.</p>
  </a>
  <a class="section-card" href="/content/vegetables/carrots">
    <span>Roots</span>
    <strong>Below-ground crops</strong>
    <p>Carrots, beets, radishes, turnips, onions, garlic, and potatoes depend on soil texture, even moisture, and patient thinning.</p>
  </a>
  <a class="section-card" href="/content/vegetables/beans">
    <span>Legumes</span>
    <strong>Beans and peas</strong>
    <p>Legumes help structure rotations, but they still need good timing, support when climbing, and regular picking.</p>
  </a>
</div>

## Crop families

Crop families are not just botanical trivia. They help explain why some problems repeat.

| Family | Crops here | Planning note |
|---|---|---|
| Nightshade | Tomatoes, peppers, potatoes | Watch disease carryover and avoid repeated planting in the same bed |
| Brassica | Kale, collards, radishes, turnips, arugula, bok choy, mizuna | Flea beetles, cabbage worms, and clubroot risk can build |
| Legume | Beans, peas | Useful in rotations, but still need healthy soil and good timing |
| Cucurbit | Cucumbers, zucchini, winter squash | Needs warm soil, space, pollination, and mildew awareness |
| Allium | Onions, garlic | Long season; avoid repeating where allium pests or disease appear |
| Amaranth | Beets, spinach, Swiss chard | Cool-season greens and roots with different heat tolerance |

## Read the numbers in context

Each crop guide shows its curated growing profile and the available transcribed Extension facts. Open the source details to see the crop form, region and retrieval date. A spacing value for a supported plant can differ from a sprawling one; a maturity estimate may begin at sowing or transplanting. Check your variety before using either as a deadline.

[Garden Today](/tools/today) applies your frost dates and soil-temperature input to timing. [What Grows in This Bed](/tools/what-grows-in-this-bed) helps compare a particular space. Neither can recover a planting history you have not recorded.

<div class="field-notes">
  <h2>Field notes</h2>
  <p>The best crop plan is revised during the season. Record what germinated quickly, what stalled, what bolted, what needed more space, and what you actually wanted to eat. Yield matters, but usefulness matters too.</p>
</div>


## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "Which crop fits both the space and the season?", "observe": "Compare mature spacing, crop family, light and the time needed for your intended harvest.", "topic": "sun", "cropName": ""}));
```

## Related pages

- [Plant Spacing](/content/reference/plant-spacing)
- [Planning Your Vegetable Garden](/content/garden/planning-your-vegetable-garden)
- [Seasonal Garden Calendar](/content/calendar/seasonal-garden-calendar)

```js
import {cropCompare} from "../../components/crop-compare.js";
const comparisonCrops = await FileAttachment("../../data/vegetables.json").json();
display(cropCompare(comparisonCrops));
```


```js
import {mountOptionalMedia} from "/lib/media/runtimeMedia.js";
mountOptionalMedia();
```

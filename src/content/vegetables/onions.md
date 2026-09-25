---
title: "Growing Onions"
description: "A practical field guide to growing onions with careful timing, soil, water, and harvest practices."
section: "vegetables"
status: "ready"
date: "2026-07-02"
tags:
  - "onions"
  - "allium"
  - "cool to warm season"
---

# Growing Onions

```js
import {cropGuide} from "../../components/crop-guide.js";
const crop = (await FileAttachment("../../data/vegetables.json").json()).find(d => d.slug === "onions");
const evidence = await FileAttachment("../../data/horticultural-evidence.json").json();
const sources = await FileAttachment("../../data/evidence-sources.json").json();
const decisionSources = await FileAttachment("../../data/decision-sources.json").json();
const cropRules = await FileAttachment("../../data/crop-decision-rules.json").json();
display(cropGuide(crop, evidence, sources, decisionSources, cropRules, {invalidation}));
```

<figure data-optional-media="images/plants/onions.webp" data-media-alt="Onions with green tops growing in soil."><p>Onions with green tops growing in soil. — optional image not configured.</p></figure>

Onions are day-length sensitive and reward careful variety selection.


## When to plant

Choose the starting material and intended harvest: seedlings, sets and scallions are not interchangeable plans. Set out seedlings or sets in early spring according to local conditions, keeping the variety name with the planting record.

## Make room for the crop

Bulb onions need space to enlarge; scallions can be harvested before that stage. Mark the part of the bed intended for each use. Keep weeds from hiding the row, and avoid judging bulb progress only by the amount of leaf growth.

## Water

Look along the row for differences in growth and moisture rather than judging one plant. Keep irrigation notes as bulbs size up and foliage changes. When tops fall, use the harvest guidance to decide whether this is a crop to eat soon or prepare for storage.

## Harvest

Look for tight necks and dry outer scales. [Harvest reference: University of Minnesota Extension](https://extension.umn.edu/planting-and-growing-guides/harvesting-and-storing-home-garden-vegetables).

Use the maturity estimate to schedule a first inspection. Let the plant’s condition and the harvest you want decide the picking date.

## Common problems

Record whether plants made a large bulb or stayed thin, along with variety and planting date. Check soft or discolored bulbs separately before choosing what to store.

Use the [disease-condition checklist](/tools/garden-decisions#disease) to decide what to inspect and which cultural conditions to improve. It does not identify a pathogen from these observations.



## Field notes

Because alliums are not tolerated by everyone, treat onions as optional rather than essential in garden planning. Many dishes can be built around herbs instead.


## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "Is this crop ready for the harvest you want?", "observe": "Record cultivar day-length type, neck condition and curing dates before storing bulbs.", "topic": "harvest", "cropName": "Onions"}));
```

## Related pages

- [Building Healthy Soil](/content/soil/building-healthy-soil)
- [Watering Wisely](/content/garden/watering-wisely)
- [Seasonal Garden Calendar](/content/calendar/seasonal-garden-calendar)


```js
import {mountOptionalMedia} from "/lib/media/runtimeMedia.js";
mountOptionalMedia();
```

---
title: "Growing Potatoes"
description: "A practical field guide to growing potatoes with careful timing, soil, water, and harvest practices."
section: "vegetables"
status: "ready"
date: "2026-07-02"
tags:
  - "potatoes"
  - "nightshade"
  - "cool to warm season"
---

# Growing Potatoes

```js
import {cropGuide} from "../../components/crop-guide.js";
const crop = (await FileAttachment("../../data/vegetables.json").json()).find(d => d.slug === "potatoes");
const evidence = await FileAttachment("../../data/horticultural-evidence.json").json();
const sources = await FileAttachment("../../data/evidence-sources.json").json();
const decisionSources = await FileAttachment("../../data/decision-sources.json").json();
const cropRules = await FileAttachment("../../data/crop-decision-rules.json").json();
display(cropGuide(crop, evidence, sources, decisionSources, cropRules, {invalidation}));
```

<figure data-optional-media="images/plants/potatoes.webp" data-media-alt="Potato plants and harvested tubers."><p>Potato plants and harvested tubers. — optional image not configured.</p></figure>

Potatoes are a practical crop for gardeners who enjoy visible results and hidden surprises.


## When to plant

Start with seed potatoes and a bed you can dig at harvest. Plant in cool spring soil according to the profile and your local conditions. Record the variety and intended use so a new-potato sample is not confused with the storage harvest.

## Make room for the crop

Leave room for the method you will use to cover developing tubers—hilling or mulch—and for your own feet at harvest. Review where other nightshade crops have grown and whether they had disease problems before choosing the bed.

## Water

Check below the covering material rather than watering by its surface appearance. Keep notes on foliage growth and dieback. When harvest approaches, examine a small sample carefully so you can judge skin condition without disturbing the whole planting.

## Harvest

For mature potatoes, watch for vine dieback. [Harvest reference: University of Minnesota Extension](https://extension.umn.edu/planting-and-growing-guides/harvesting-and-storing-home-garden-vegetables).

Use the maturity estimate to schedule a first inspection. Let the plant’s condition and the harvest you want decide the picking date.

## Common problems

Compare affected foliage with a healthy plant of the same variety. Photograph both leaf surfaces and record how quickly the pattern spreads before selecting a response.

Use the [disease-condition checklist](/tools/garden-decisions#disease) to decide what to inspect and which cultural conditions to improve. It does not identify a pathogen from these observations.



## Field notes

Use certified seed potatoes. Hill or mulch as plants grow. Cure harvested tubers before storage.


## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "Is this crop ready for the harvest you want?", "observe": "Record vine condition and skin firmness from a sample plant; distinguish new potatoes from a storage crop.", "topic": "harvest", "cropName": "Potatoes"}));
```

## Related pages

- [Building Healthy Soil](/content/soil/building-healthy-soil)
- [Watering Wisely](/content/garden/watering-wisely)
- [Seasonal Garden Calendar](/content/calendar/seasonal-garden-calendar)


```js
import {mountOptionalMedia} from "/lib/media/runtimeMedia.js";
mountOptionalMedia();
```

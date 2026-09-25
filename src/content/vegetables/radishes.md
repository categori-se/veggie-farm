---
title: "Growing Radishes"
description: "A practical field guide to growing radishes with careful timing, soil, water, and harvest practices."
section: "vegetables"
status: "ready"
date: "2026-07-02"
tags:
  - "radishes"
  - "brassica"
  - "cool season"
---

# Growing Radishes

```js
import {cropGuide} from "../../components/crop-guide.js";
const crop = (await FileAttachment("../../data/vegetables.json").json()).find(d => d.slug === "radishes");
const evidence = await FileAttachment("../../data/horticultural-evidence.json").json();
const sources = await FileAttachment("../../data/evidence-sources.json").json();
const decisionSources = await FileAttachment("../../data/decision-sources.json").json();
const cropRules = await FileAttachment("../../data/crop-decision-rules.json").json();
display(cropGuide(crop, evidence, sources, decisionSources, cropRules, {invalidation}));
```

<figure data-optional-media="images/plants/radishes.webp" data-media-alt="Fresh radishes with red roots and green leaves."><p>Fresh radishes with red roots and green leaves. — optional image not configured.</p></figure>

Radishes are fast, direct, and useful as a timing crop. They show whether soil and watering are working.


## When to plant

Sow a short row in cool weather and plan to inspect it soon. Small salad radishes and large-rooted types have different spacing and harvest expectations; the variety name is more useful than the word “radish” alone.

## Make room for the crop

Thin for the root you intend to eat. A row can look full and healthy above ground while roots remain crowded. Pull an early sample from different parts of the row and compare size and texture before leaving all the others longer.

## Water

Keep moisture reasonably even through the short growing period. If a sample is woody or harsh, record its size, age and recent weather. The next sowing gives you a practical comparison; the remaining roots will not necessarily improve by getting larger.

## Harvest

Sample small roots before they become oversized. [Harvest reference: University of Minnesota Extension](https://extension.umn.edu/planting-and-growing-guides/harvesting-and-storing-home-garden-vegetables).

Use the maturity estimate to schedule a first inspection. Let the plant’s condition and the harvest you want decide the picking date.

## Common problems

Compare a pulled sample with the plants left in the ground. Record holes, texture and size separately; large tops alone do not explain what happened below ground.

Use the [disease-condition checklist](/tools/garden-decisions#disease) to decide what to inspect and which cultural conditions to improve. It does not identify a pathogen from these observations.



## Field notes

If radishes become woody or harsh, they were likely stressed or left too long.


## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "Is this crop ready for the harvest you want?", "observe": "Pull a sample at the packet’s early maturity date and record texture before leaving the remainder longer.", "topic": "harvest", "cropName": "Radishes"}));
```

## Related pages

- [Building Healthy Soil](/content/soil/building-healthy-soil)
- [Watering Wisely](/content/garden/watering-wisely)
- [Seasonal Garden Calendar](/content/calendar/seasonal-garden-calendar)


```js
import {mountOptionalMedia} from "/lib/media/runtimeMedia.js";
mountOptionalMedia();
```

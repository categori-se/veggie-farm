---
title: "Growing Lettuce"
description: "A practical field guide to growing lettuce with careful timing, soil, water, and harvest practices."
section: "vegetables"
status: "ready"
date: "2026-07-02"
tags:
  - "lettuce"
  - "aster"
  - "cool season"
---

# Growing Lettuce

```js
import {cropGuide} from "../../components/crop-guide.js";
const crop = (await FileAttachment("../../data/vegetables.json").json()).find(d => d.slug === "lettuce");
const evidence = await FileAttachment("../../data/horticultural-evidence.json").json();
const sources = await FileAttachment("../../data/evidence-sources.json").json();
const decisionSources = await FileAttachment("../../data/decision-sources.json").json();
const cropRules = await FileAttachment("../../data/crop-decision-rules.json").json();
display(cropGuide(crop, evidence, sources, decisionSources, cropRules, {invalidation}));
```

<figure data-optional-media="images/plants/lettuce.webp" data-media-alt="A head of lettuce with layered green leaves."><p>A head of lettuce with layered green leaves. — optional image not configured.</p></figure>

Lettuce is a cool-season crop that rewards succession planting. It is easy to grow until heat arrives.


## When to plant

Choose a head harvest or repeated leaf picking, then sow a manageable amount. Spring and late-summer plantings suit the cool-season pattern; several small batches make it easier to compare quality than one large bed that matures at once.

## Make room for the crop

Allow space according to the harvest stage. Close young plants can be picked early, while a full head needs room to form. Mark a few plants to keep and remove neighboring ones for the kitchen rather than letting the entire bed remain crowded.

## Water

Check small seedlings at the soil surface and established plants around their roots. Track leaf quality as conditions warm. If a planting is stretching into a flower stalk, record its sowing date and plan the next batch rather than assuming more fertilizer will prolong it.

## Harvest

Pick while leaves remain tender. [Harvest reference: University of Minnesota Extension](https://extension.umn.edu/planting-and-growing-guides/harvesting-and-storing-home-garden-vegetables).

Use the maturity estimate to schedule a first inspection. Let the plant’s condition and the harvest you want decide the picking date.

## Common problems

Compare midday wilt with the same plants later in the day. Record root-zone moisture and stem elongation separately from leaf spots.

Use the [disease-condition checklist](/tools/garden-decisions#disease) to decide what to inspect and which cultural conditions to improve. It does not identify a pathogen from these observations.



## Field notes

Small repeated sowings are better than one dramatic planting. Shade and water can extend the season, but lettuce has limits.


## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "Is this crop ready for the harvest you want?", "observe": "Record tender-leaf harvests and the first stem elongation; compare shaded and sunnier rows.", "topic": "harvest", "cropName": "Lettuce"}));
```

## Related pages

- [Building Healthy Soil](/content/soil/building-healthy-soil)
- [Watering Wisely](/content/garden/watering-wisely)
- [Seasonal Garden Calendar](/content/calendar/seasonal-garden-calendar)


```js
import {mountOptionalMedia} from "/lib/media/runtimeMedia.js";
mountOptionalMedia();
```

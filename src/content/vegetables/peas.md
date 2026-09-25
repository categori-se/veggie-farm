---
title: "Growing Peas"
description: "A practical field guide to growing peas with careful timing, soil, water, and harvest practices."
section: "vegetables"
status: "ready"
date: "2026-07-02"
tags:
  - "peas"
  - "legume"
  - "cool season"
---

# Growing Peas

```js
import {cropGuide} from "../../components/crop-guide.js";
const crop = (await FileAttachment("../../data/vegetables.json").json()).find(d => d.slug === "peas");
const evidence = await FileAttachment("../../data/horticultural-evidence.json").json();
const sources = await FileAttachment("../../data/evidence-sources.json").json();
const decisionSources = await FileAttachment("../../data/decision-sources.json").json();
const cropRules = await FileAttachment("../../data/crop-decision-rules.json").json();
display(cropGuide(crop, evidence, sources, decisionSources, cropRules, {invalidation}));
```

<figure data-optional-media="images/plants/peas.webp" data-media-alt="Green pea pods on climbing vines."><p>Green pea pods on climbing vines. — optional image not configured.</p></figure>

Peas belong to the beginning of the season. They like cool soil, cool air, and early attention.


## When to plant

Sow early in spring when the soil can be worked, and have support ready for a climbing variety. Peas occupy a different seasonal window from warm-soil beans; use the profile to compare them rather than treating all pod crops alike.

## Make room for the crop

Put support where you can reach both sides to pick. Choose the variety by the part you want to eat—whole pod or shelled peas—and leave that information on the row label. The right harvest stage depends on it.

## Water

Check moisture near the row as flowering and pod growth begin. Record when warm weather arrives and when production slows. A fading spring planting may have reached the end of its useful season; compare dates before changing the soil for the next crop.

## Harvest

Pick while pods are tender. [Harvest reference: University of Minnesota Extension](https://extension.umn.edu/planting-and-growing-guides/harvesting-and-storing-home-garden-vegetables).

Use the maturity estimate to schedule a first inspection. Let the plant’s condition and the harvest you want decide the picking date.

## Common problems

Compare lower and upper leaves, flowers and developing pods. Record when the pattern started and what changed in weather or watering.

Use the [disease-condition checklist](/tools/garden-decisions#disease) to decide what to inspect and which cultural conditions to improve. It does not identify a pathogen from these observations.



## Field notes

Plant early, provide support, and accept that heat will eventually end the crop.


## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "Is this crop ready for the harvest you want?", "observe": "Compare pod tenderness and seed filling with the intended snow, snap or shell-pea harvest.", "topic": "harvest", "cropName": "Peas"}));
```

## Related pages

- [Building Healthy Soil](/content/soil/building-healthy-soil)
- [Watering Wisely](/content/garden/watering-wisely)
- [Seasonal Garden Calendar](/content/calendar/seasonal-garden-calendar)


```js
import {mountOptionalMedia} from "/lib/media/runtimeMedia.js";
mountOptionalMedia();
```

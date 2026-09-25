---
title: "Growing Mizuna"
description: "A practical field guide to growing mizuna with careful timing, soil, water, and harvest practices."
section: "vegetables"
status: "ready"
date: "2026-07-02"
tags:
  - "mizuna"
  - "brassica"
  - "cool season"
---

# Growing Mizuna

```js
import {cropGuide} from "../../components/crop-guide.js";
const crop = (await FileAttachment("../../data/vegetables.json").json()).find(d => d.slug === "mizuna");
const evidence = await FileAttachment("../../data/horticultural-evidence.json").json();
const sources = await FileAttachment("../../data/evidence-sources.json").json();
const decisionSources = await FileAttachment("../../data/decision-sources.json").json();
const cropRules = await FileAttachment("../../data/crop-decision-rules.json").json();
display(cropGuide(crop, evidence, sources, decisionSources, cropRules, {invalidation}));
```

<figure data-optional-media="images/plants/mizuna.webp" data-media-alt="Mizuna mustard greens with deeply cut leaves."><p>Mizuna mustard greens with deeply cut leaves. — optional image not configured.</p></figure>

Mizuna is a graceful, productive green for salads and quick cooking.


## When to plant

Mizuna is useful when you want a small, flexible greens harvest. Sow in spring or fall and choose whether to cut young leaves or grow larger plants. A short trial row helps you find the leaf size and flavor you prefer.

## Make room for the crop

The spacing range reflects different harvest styles. Leave more room for whole plants; for cut greens, keep the patch small enough to inspect and harvest evenly. Include mizuna with the other brassicas when reviewing the bed’s planting history.

## Water

Check the seedbed while the fine seedlings establish. After cutting, observe whether new leaves are returning evenly across the patch. Record dry spots, crowding and insect holes separately before deciding what to change.

## Harvest

Choose tender leaves for a salad cutting or let selected plants grow larger. Leave the growing center when taking individual leaves, then observe the quality and speed of the next flush before planning another cutting.

## Common problems

Track holes in new leaves and the quality of each cutting. Record whether the protected and exposed parts of a row differ before repeating a protection method.

Use the [disease-condition checklist](/tools/garden-decisions#disease) to decide what to inspect and which cultural conditions to improve. It does not identify a pathogen from these observations.



## Field notes

Cut-and-come-again harvests keep the plant useful longer.


## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "Is this crop ready for the harvest you want?", "observe": "Compare young leaf cuttings and regrowth with plants allowed to mature.", "topic": "harvest", "cropName": "Mizuna"}));
```

## Related pages

- [Building Healthy Soil](/content/soil/building-healthy-soil)
- [Watering Wisely](/content/garden/watering-wisely)
- [Seasonal Garden Calendar](/content/calendar/seasonal-garden-calendar)


```js
import {mountOptionalMedia} from "/lib/media/runtimeMedia.js";
mountOptionalMedia();
```

---
title: "Growing Bok Choy"
description: "A practical field guide to growing bok choy with careful timing, soil, water, and harvest practices."
section: "vegetables"
status: "ready"
date: "2026-07-02"
tags:
  - "bok choy"
  - "brassica"
  - "cool season"
---

# Growing Bok Choy

```js
import {cropGuide} from "../../components/crop-guide.js";
const crop = (await FileAttachment("../../data/vegetables.json").json()).find(d => d.slug === "bok-choy");
const evidence = await FileAttachment("../../data/horticultural-evidence.json").json();
const sources = await FileAttachment("../../data/evidence-sources.json").json();
const decisionSources = await FileAttachment("../../data/decision-sources.json").json();
const cropRules = await FileAttachment("../../data/crop-decision-rules.json").json();
display(cropGuide(crop, evidence, sources, decisionSources, cropRules, {invalidation}));
```

<figure data-optional-media="images/plants/bok-choy.webp" data-media-alt="Bok choy plants with pale stems and green leaves."><p>Bok choy plants with pale stems and green leaves. — optional image not configured.</p></figure>

Bok choy grows quickly and works well in spring and fall gardens.


## When to plant

Think of bok choy as a crop for a cool-weather meal, not a plant to hold indefinitely. Sow or set out young plants in spring or late summer, and choose a baby or full-size harvest before deciding how much space to allow.

## Make room for the crop

Leave room for the leaves and stalks to fill out without trapping every plant against its neighbor. The profile gives a range because a baby plant and a full head occupy different spaces. Mark a few plants for a later harvest and pick the rest young.

## Water

Inspect the root zone while the plant is building its leafy head. Keep a note of drying soil and the first sign of stem elongation. Once a flower stalk rises, extra water is not a way to turn the plant back into the head you intended to grow.

## Harvest

Pick a baby plant for a small head or leave selected plants to fill out. Check the stalks and leaves while the head is still compact; once the center stretches toward flowering, the harvest you planned is changing.

## Common problems

Record the first flower stalk and the weather around it. Inspect small holes separately from yellowing or wilt; these observations may have different causes.

Use the [disease-condition checklist](/tools/garden-decisions#disease) to decide what to inspect and which cultural conditions to improve. It does not identify a pathogen from these observations.



## Field notes

Heat and long days can trigger bolting. Grow it in cool windows and harvest before it stretches.


## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "Is this crop ready for the harvest you want?", "observe": "Record head size and the first sign of a flower stalk; compare sowings made in different weather.", "topic": "harvest", "cropName": "Bok Choy"}));
```

## Related pages

- [Building Healthy Soil](/content/soil/building-healthy-soil)
- [Watering Wisely](/content/garden/watering-wisely)
- [Seasonal Garden Calendar](/content/calendar/seasonal-garden-calendar)


```js
import {mountOptionalMedia} from "/lib/media/runtimeMedia.js";
mountOptionalMedia();
```

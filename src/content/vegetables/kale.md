---
title: "Growing Kale"
description: "A practical field guide to growing kale with careful timing, soil, water, and harvest practices."
section: "vegetables"
status: "ready"
date: "2026-07-02"
tags:
  - "kale"
  - "brassica"
  - "cool season"
---

# Growing Kale

```js
import {cropGuide} from "../../components/crop-guide.js";
const crop = (await FileAttachment("../../data/vegetables.json").json()).find(d => d.slug === "kale");
const evidence = await FileAttachment("../../data/horticultural-evidence.json").json();
const sources = await FileAttachment("../../data/evidence-sources.json").json();
const decisionSources = await FileAttachment("../../data/decision-sources.json").json();
const cropRules = await FileAttachment("../../data/crop-decision-rules.json").json();
display(cropGuide(crop, evidence, sources, decisionSources, cropRules, {invalidation}));
```

<figure data-optional-media="images/plants/kale.webp" data-media-alt="Curled kale leaves in the garden."><p>Curled kale leaves in the garden. — optional image not configured.</p></figure>

Kale is durable, useful, and often sweeter after cold weather.


## When to plant

Choose between a spring planting and a late-summer planting for cool-weather picking. Direct sow or transplant young plants, then leave space for repeated visits: a kale plant is often harvested many times rather than cleared in one meal.

## Make room for the crop

Plan for an expanding plant and access to its lower leaves. Baby-leaf picking uses space differently from keeping full plants, so match your spacing to your intended harvest. If brassicas struggled here previously, consult the bed history before reusing the space.

## Water

Check soil moisture and the growing center when outer leaves look tired. Inspect leaf undersides while picking. Recording which leaves were affected helps distinguish a whole-plant problem from damage limited to an older part of the crop.

## Harvest

Pick sound outer leaves while preserving the growing center. Compare the size and tenderness you prefer for salads with the leaves you use for cooking; there is no need to wait for every leaf to reach its maximum size.

## Common problems

Check leaf undersides and the growing center. Record holes, insects actually seen and the amount of usable foliage left before deciding whether action is needed.

Use the [disease-condition checklist](/tools/garden-decisions#disease) to decide what to inspect and which cultural conditions to improve. It does not identify a pathogen from these observations.



## Field notes

Protect young plants from flea beetles and cabbage worms. Mature plants are much tougher than seedlings.


## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "Is this crop ready for the harvest you want?", "observe": "Record leaf size and useful cuttings; compare quality as temperatures change.", "topic": "harvest", "cropName": "Kale"}));
```

## Related pages

- [Building Healthy Soil](/content/soil/building-healthy-soil)
- [Watering Wisely](/content/garden/watering-wisely)
- [Seasonal Garden Calendar](/content/calendar/seasonal-garden-calendar)


```js
import {mountOptionalMedia} from "/lib/media/runtimeMedia.js";
mountOptionalMedia();
```

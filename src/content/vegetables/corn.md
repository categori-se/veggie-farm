---
title: "Growing Corn"
description: "A practical field guide to growing corn with careful timing, soil, water, and harvest practices."
section: "vegetables"
status: "ready"
date: "2026-07-02"
tags:
  - "corn"
  - "grass"
  - "warm season"
---

# Growing Corn

```js
import {cropGuide} from "../../components/crop-guide.js";
const crop = (await FileAttachment("../../data/vegetables.json").json()).find(d => d.slug === "corn");
const evidence = await FileAttachment("../../data/horticultural-evidence.json").json();
const sources = await FileAttachment("../../data/evidence-sources.json").json();
const decisionSources = await FileAttachment("../../data/decision-sources.json").json();
const cropRules = await FileAttachment("../../data/crop-decision-rules.json").json();
display(cropGuide(crop, evidence, sources, decisionSources, cropRules, {invalidation}));
```

<figure data-optional-media="images/plants/corn.webp" data-media-alt="Ears of sweet corn with fresh green husks."><p>Ears of sweet corn with fresh green husks. — optional image not configured.</p></figure>

Sweet corn is space-hungry but satisfying when grown in blocks rather than rows.


## When to plant

Lay out a block before sowing. A few plants along a fence can look impressive without providing the pollination pattern of several neighboring rows. Sow when soil is warm, with enough season left for the variety you selected.

## Make room for the crop

Corn earns its place with a group of plants, not a single specimen. Check the block dimensions against both plant and row spacing, and leave access to inspect ears. Keep the variety and sowing date together so uneven results can be compared within the same planting.

## Water

Check moisture inside the block as well as at its edge. Once the canopy closes, dry surface soil seen from the path may not represent the whole bed. Record stress around flowering and compare ear filling at the edge and center when you harvest.

## Harvest

Check for dried silks and milky kernels. [Harvest reference: University of Minnesota Extension](https://extension.umn.edu/planting-and-growing-guides/harvesting-and-storing-home-garden-vegetables).

Use the maturity estimate to schedule a first inspection. Let the plant’s condition and the harvest you want decide the picking date.

## Common problems

Compare ears from edge plants and the center of the block. Record gaps in kernel filling, planting layout and flowering dates before choosing a different layout next year.

Use the [disease-condition checklist](/tools/garden-decisions#disease) to decide what to inspect and which cultural conditions to improve. It does not identify a pathogen from these observations.



## Field notes

Plant in blocks for pollination. A few isolated plants rarely perform well.


## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "Is this crop ready for the harvest you want?", "observe": "Record silk emergence and inspect a sample ear as it matures; keep variety and planting block together.", "topic": "harvest", "cropName": "Corn"}));
```

## Related pages

- [Building Healthy Soil](/content/soil/building-healthy-soil)
- [Watering Wisely](/content/garden/watering-wisely)
- [Seasonal Garden Calendar](/content/calendar/seasonal-garden-calendar)


```js
import {mountOptionalMedia} from "/lib/media/runtimeMedia.js";
mountOptionalMedia();
```

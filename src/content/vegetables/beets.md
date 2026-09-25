---
title: "Growing Beets"
description: "A practical field guide to growing beets with careful timing, soil, water, and harvest practices."
section: "vegetables"
status: "ready"
date: "2026-07-02"
tags:
  - "beets"
  - "amaranth"
  - "cool season"
---

# Growing Beets

```js
import {cropGuide} from "../../components/crop-guide.js";
const crop = (await FileAttachment("../../data/vegetables.json").json()).find(d => d.slug === "beets");
const evidence = await FileAttachment("../../data/horticultural-evidence.json").json();
const sources = await FileAttachment("../../data/evidence-sources.json").json();
const decisionSources = await FileAttachment("../../data/decision-sources.json").json();
const cropRules = await FileAttachment("../../data/crop-decision-rules.json").json();
display(cropGuide(crop, evidence, sources, decisionSources, cropRules, {invalidation}));
```

<figure data-optional-media="images/plants/beets.webp" data-media-alt="Fresh beet roots with leafy tops."><p>Fresh beet roots with leafy tops. — optional image not configured.</p></figure>

Beets are useful because both the roots and greens can be eaten. They are forgiving when thinned properly.


## When to plant

Decide whether you want tender greens, roots or both. Spring and late-summer sowings offer different growing conditions; a small sowing in each can be more useful than a large row that all reaches harvest together.

## Make room for the crop

Thin for the harvest you want. A crowded patch may give useful greens but little room for roots to swell. Beet seed can produce clusters of seedlings: compare the actual spaces between plants with the mature-root spacing in the profile.

## Water

Keep the seedbed evenly moist while seedlings establish. As roots develop, inspect both a crowded patch and a well-spaced patch before blaming small roots on fertility. Note rainfall and irrigation alongside the size of a pulled sample.

## Harvest

Sample roots around 1¼–3 inches across. [Harvest reference: University of Minnesota Extension](https://extension.umn.edu/planting-and-growing-guides/harvesting-and-storing-home-garden-vegetables).

Use the maturity estimate to schedule a first inspection. Let the plant’s condition and the harvest you want decide the picking date.

## Common problems

Compare roots from the crowded and thinned parts of the row. Record leaf color, root size and the actual distance between plants before changing fertility.

Use the [disease-condition checklist](/tools/garden-decisions#disease) to decide what to inspect and which cultural conditions to improve. It does not identify a pathogen from these observations.



## Field notes

Each beet seed is often a cluster. Thinning is not optional if good roots are the goal.


## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "Is this crop ready for the harvest you want?", "observe": "Measure a sample root shoulder and check tenderness; record thinning and the intended harvest size.", "topic": "harvest", "cropName": "Beets"}));
```

## Related pages

- [Building Healthy Soil](/content/soil/building-healthy-soil)
- [Watering Wisely](/content/garden/watering-wisely)
- [Seasonal Garden Calendar](/content/calendar/seasonal-garden-calendar)


```js
import {mountOptionalMedia} from "/lib/media/runtimeMedia.js";
mountOptionalMedia();
```

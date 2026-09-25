---
title: "Growing Turnips"
description: "A practical guide to growing turnips for quick greens, tender roots, and fall harvest."
section: "vegetables"
status: "ready"
date: "2026-08-20"
tags: ["turnips", "brassica", "cool season", "root crop"]
---

# Growing Turnips

<figure data-optional-media="images/plants/turnips.webp" data-media-alt="Harvested purple-and-white turnip roots with leafy stems attached."><p>Harvested purple-and-white turnip roots with leafy stems attached. — optional image not configured.</p></figure>


```js
import {cropGuide} from "../../components/crop-guide.js";
const crop = (await FileAttachment("../../data/vegetables.json").json()).find(d => d.slug === "turnips");
const evidence = await FileAttachment("../../data/horticultural-evidence.json").json();
const sources = await FileAttachment("../../data/evidence-sources.json").json();
const decisionSources = await FileAttachment("../../data/decision-sources.json").json();
const cropRules = await FileAttachment("../../data/crop-decision-rules.json").json();
display(cropGuide(crop, evidence, sources, decisionSources, cropRules, {invalidation}));
```

Turnips offer two harvests from one sowing: leaves early and roots later. That flexibility makes them useful when the fall window is real but not generous.


## Sowing and thinning

Direct sow into a fine, evenly moist seedbed. Thin promptly: crowded seedlings can supply a small greens harvest, but roots need individual space to swell. Cut extras at soil level when pulling would disturb neighboring roots.

## Water and quality

Steady moisture supports tender roots. Drought, heat, and delayed harvest can make roots woody or strongly flavored. Small roots are often the best roots; do not wait for maximum size simply because the crop can keep growing.

## Use the whole crop

Harvest a few leaves without stripping a plant completely, or grow a dense section specifically for greens. Protect young foliage from flea beetles and cabbage-family caterpillars where those pests are active.

<div class="field-notes">
  <p>Record whether the sowing was intended for greens, roots, or both. Note thinning date, root size at best texture, and how the first hard frost changed flavor.</p>
</div>


## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "Is this crop ready for the harvest you want?", "observe": "Compare sample root size and texture; record whether leaves, roots or both are your intended crop.", "topic": "harvest", "cropName": "Turnips"}));
```

## Related pages

- [Mid-August Fall Planting in Massachusetts](/content/seasonal/august-fall-planting-massachusetts)
- [Growing Radishes](/content/vegetables/radishes)
- [Garden Today](/tools/today)


```js
import {mountOptionalMedia} from "/lib/media/runtimeMedia.js";
mountOptionalMedia();
```

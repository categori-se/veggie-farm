---
title: "Growing Arugula"
description: "A practical guide to sowing, harvesting, and succession-growing arugula in cool weather."
section: "vegetables"
status: "ready"
date: "2026-08-20"
tags: ["arugula", "brassica", "cool season", "leaf crop"]
---

# Growing Arugula

<figure data-optional-media="images/plants/arugula.webp" data-media-alt="An arugula plant spreading its lobed leaves close to the soil."><p>An arugula plant spreading its lobed leaves close to the soil. — optional image not configured.</p></figure>


```js
import {cropGuide} from "../../components/crop-guide.js";
const crop = (await FileAttachment("../../data/vegetables.json").json()).find(d => d.slug === "arugula");
const evidence = await FileAttachment("../../data/horticultural-evidence.json").json();
const sources = await FileAttachment("../../data/evidence-sources.json").json();
const decisionSources = await FileAttachment("../../data/decision-sources.json").json();
const cropRules = await FileAttachment("../../data/crop-decision-rules.json").json();
display(cropGuide(crop, evidence, sources, decisionSources, cropRules, {invalidation}));
```

Arugula is a quick cool-season green with a peppery flavor and a forgiving harvest window. It can be cut young for salad, allowed to size up for cooking, or left to flower for pollinators and seed.


## Sow small successions

Direct sow shallowly in a prepared seedbed. A short row every two or three weeks produces a steadier harvest than one large sowing. Keep the surface moist until emergence; small seed in an August bed can dry quickly.

Arugula becomes sharper and bolts faster as heat and day length increase. Fall sowings often produce more tender leaves with less urgency.

## Harvest

Cut individual outer leaves or shear a patch above the growing point for regrowth. Harvest before leaves become coarse if salad is the goal. Flower buds and flowers are also edible, though their flavor is strong.

## Common problems

Tiny holes in young leaves usually point to flea beetles. Light row cover placed immediately after sowing can reduce damage; rotate the bed with the rest of the brassica family in mind.

<div class="field-notes">
  <p>Record sowing date, days to emergence, first flea-beetle damage, flavor, and the number of useful cuttings. Arugula is quick enough to compare several sowing windows in one season.</p>
</div>


## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "Is this crop ready for the harvest you want?", "observe": "Record leaf quality, first flower and useful regrowth after each cutting.", "topic": "harvest", "cropName": "Arugula"}));
```

## Related pages

- [Mid-August Fall Planting in Massachusetts](/content/seasonal/august-fall-planting-massachusetts)
- [September Succession Gardening](/content/seasonal/september-succession-gardening)
- [Garden Today](/tools/today)


```js
import {mountOptionalMedia} from "/lib/media/runtimeMedia.js";
mountOptionalMedia();
```

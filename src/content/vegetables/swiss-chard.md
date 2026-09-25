---
title: "Growing Swiss Chard"
description: "A practical field guide to growing swiss chard with careful timing, soil, water, and harvest practices."
section: "vegetables"
status: "ready"
date: "2026-07-02"
tags:
  - "swiss chard"
  - "amaranth"
  - "cool to warm season"
---

# Growing Swiss Chard

```js
import {cropGuide} from "../../components/crop-guide.js";
const crop = (await FileAttachment("../../data/vegetables.json").json()).find(d => d.slug === "swiss-chard");
const evidence = await FileAttachment("../../data/horticultural-evidence.json").json();
const sources = await FileAttachment("../../data/evidence-sources.json").json();
const decisionSources = await FileAttachment("../../data/decision-sources.json").json();
const cropRules = await FileAttachment("../../data/crop-decision-rules.json").json();
display(cropGuide(crop, evidence, sources, decisionSources, cropRules, {invalidation}));
```

<figure data-optional-media="images/plants/swiss-chard.webp" data-media-alt="Swiss chard leaves with colorful stems."><p>Swiss chard leaves with colorful stems. — optional image not configured.</p></figure>

Swiss chard bridges seasons better than many greens and tolerates summer better than spinach.


## When to plant

Chard can supply leaves over a longer stretch than a single head crop. Sow or transplant from spring into summer according to local conditions, then choose a place you can return to repeatedly for picking.

## Make room for the crop

Leave enough space to reach outer leaves without trampling neighboring plants. Keep the center growing while you harvest around it. A few well-placed plants can be easier to use than a crowded patch that hides damaged leaves.

## Water

Check moisture below the broad leaf canopy, including after rain that may not wet the bed evenly. Compare new leaves with old ones when you notice damage. Record the usable harvest as well as appearance so a few imperfect outer leaves do not obscure continued growth.

## Harvest

Cut outer leaves and their stalks while leaving the center intact for continued growth. Young leaves suit a tender harvest; larger leaves and stems may be more useful cooked. [Harvest guidance: University of Delaware Extension](https://www.udel.edu/academics/colleges/canr/cooperative-extension/fact-sheets/swiss-chard/).

## Common problems

Check whether damage affects new leaves, old leaves or both. Record the usable harvest after removing damaged material rather than judging only appearance.

Use the [disease-condition checklist](/tools/garden-decisions#disease) to decide what to inspect and which cultural conditions to improve. It does not identify a pathogen from these observations.



## Field notes

Harvest outer leaves and let the center continue growing.


## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "Is this crop ready for the harvest you want?", "observe": "Count useful outer-leaf harvests and inspect the center’s regrowth before comparing yield.", "topic": "harvest", "cropName": "Swiss Chard"}));
```

## Related pages

- [Building Healthy Soil](/content/soil/building-healthy-soil)
- [Watering Wisely](/content/garden/watering-wisely)
- [Seasonal Garden Calendar](/content/calendar/seasonal-garden-calendar)


```js
import {mountOptionalMedia} from "/lib/media/runtimeMedia.js";
mountOptionalMedia();
```

---
title: "Growing Basil"
description: "A practical guide to growing basil in the home garden."
section: "herbs"
status: "ready"
date: "2026-07-02"
tags:
  - "basil"
  - "herbs"
---

# Growing Basil

```js
import {gardenActions} from "../../components/garden-actions.js";
display(gardenActions({"crop": "Basil", "cropSlug": "basil"}));
```



<figure data-optional-media="images/plants/basil.webp" data-media-alt="Fresh basil leaves on a green herb plant."><p>Fresh basil leaves on a green herb plant. — optional image not configured.</p></figure>

```js
const herb = (await FileAttachment("../../data/herbs.json").json()).find(d => d.slug === "basil");
```

```js
html`<aside class="note" aria-label="Herb growing profile"><strong>${herb.name}: ${herb.season}</strong><p>${herb.mainCare}.</p></aside>`
```

## Warmth first, then regular picking

Basil earns its space when it is close enough to pick while cooking. The first decision is timing: a bright spring day does not make cold nights suitable for this tender annual.

## Establish a leafy plant

Wait until frost danger has passed. Choose at least six hours of direct sun and soil that stays moist without remaining waterlogged. Maryland Extension gives 12 inches between plants as a starting point; cultivar size and airflow still matter. Pinch growing tips to encourage branching rather than letting one stem run upward.

## Harvest and watch

Pick leafy tips as the plant grows. If leaves yellow or decline during humid weather, inspect them before adding fertilizer: basil downy mildew can be involved. Resistant cultivars and uncrowded planting help reduce risk, but do not guarantee a disease-free season.

## Learn from this planting

Record planting date, cultivar, first useful harvest and any leaf symptoms. Compare the harvest with the date cold nights returned. That record is more useful next year than assuming every basil variety behaved alike.

## Sources and next steps

[University of Maryland Extension: Basil](https://www.extension.umd.edu/resource/growing-basil-home-garden) supports the growing guidance. Regional timing and cultivar behavior vary; the profile above comes from our curated herb data. Reviewed September 23, 2026.

- [Record a basil observation](/tools/my-garden) and include the herb name in your note.
- [Compare the herb guides](/content/herbs/) before grouping plants by care needs.
- [Understand soil drainage](/content/soil/building-healthy-soil).


## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "Did pinching increase useful leaf harvest?", "observe": "Record first pinch, flowering and usable cuttings from the same cultivar. Compare plant size rather than assuming every pinch helps.", "topic": "harvest", "cropName": "Basil"}));
```


```js
import {mountOptionalMedia} from "/lib/media/runtimeMedia.js";
mountOptionalMedia();
```

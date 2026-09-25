---
title: "Growing Dill"
description: "A practical guide to growing dill in the home garden."
section: "herbs"
status: "ready"
date: "2026-07-02"
tags:
  - "dill"
  - "herbs"
---

# Growing Dill

```js
import {gardenActions} from "../../components/garden-actions.js";
display(gardenActions({"crop": "Dill", "cropSlug": "dill"}));
```



<figure data-optional-media="images/plants/dill.webp" data-media-alt="Feathery dill foliage growing in a pot."><p>Feathery dill foliage growing in a pot. — optional image not configured.</p></figure>

```js
const herb = (await FileAttachment("../../data/herbs.json").json()).find(d => d.slug === "dill");
```

```js
html`<aside class="note" aria-label="Herb growing profile"><strong>${herb.name}: ${herb.season}</strong><p>${herb.mainCare}.</p></aside>`
```

## Leave room for the flower stems

Dill can be a handful of leaves for dinner or a tall flowering plant supplying seed. Those are different uses of the same space. Place it where the mature stems can remain without blocking your route through the bed.

## Start where it will grow

Direct sowing avoids disturbing a plant that is difficult to transplant. Maryland Extension recommends sowing after frost danger has passed. Dill commonly reaches two to three feet; exposed plants may need support. Decide whether you want self-sown seedlings next year before letting all the seed fall.

## Pick the harvest you need

Leaves and seed have different harvest stages. Gather foliage for use while it is available; the Extension guide highlights the beginning of flowering for leaf harvest. Let seed become flat and brown before collecting it.

## Make next season easier

Record variety, sowing date, flowering date and whether stems leaned or fell. Note where volunteers appear. Use those observations to choose a better location or support arrangement rather than crowding more plants into the same corner.

## Sources and next steps

[University of Maryland Extension: Dill](https://www.extension.umd.edu/resource/dill) supports the growing guidance. Regional timing and cultivar behavior vary; the profile above comes from our curated herb data. Reviewed September 23, 2026.

- [Record a dill observation](/tools/my-garden) and include the herb name in your note.
- [Compare the herb guides](/content/herbs/) before grouping plants by care needs.
- [Understand soil drainage](/content/soil/building-healthy-soil).


## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "Are you growing leaves, seed or insect habitat?", "observe": "Label the intended harvest and record flowering before deciding which stems to cut.", "topic": "companions", "cropName": "Dill"}));
```


```js
import {mountOptionalMedia} from "/lib/media/runtimeMedia.js";
mountOptionalMedia();
```

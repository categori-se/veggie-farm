---
title: "Growing Rosemary"
description: "A practical guide to growing rosemary in the home garden."
section: "herbs"
status: "ready"
date: "2026-07-02"
tags:
  - "rosemary"
  - "herbs"
---

# Growing Rosemary

```js
import {gardenActions} from "../../components/garden-actions.js";
display(gardenActions({"crop": "Rosemary", "cropSlug": "rosemary"}));
```



<figure data-optional-media="images/plants/rosemary.webp" data-media-alt="Rosemary stems with narrow aromatic leaves."><p>Rosemary stems with narrow aromatic leaves. — optional image not configured.</p></figure>

```js
const herb = (await FileAttachment("../../data/herbs.json").json()).find(d => d.slug === "rosemary");
```

```js
html`<aside class="note" aria-label="Herb growing profile"><strong>${herb.name}: ${herb.season}</strong><p>${herb.mainCare}.</p></aside>`
```

## Choose a winter plan at planting time

Rosemary asks a different question from a summer annual: where will this plant live when the growing season ends? In Massachusetts, plan for a container you can move or treat the plant as seasonal; do not assume an outdoor shrub will survive.

## Sun and drainage

Maryland Extension recommends full sun and well-drained soil, with a soil pH range of 6.5–7.0. Use a soil test before trying to adjust pH. A container's size and drainage matter as the plant grows; planting it beside moisture-loving herbs makes care harder to judge.

## Keep growth useful

Pinch young growth to guide the plant's shape and take fresh leaves as needed. Choose a position that lets you inspect the plant, harvest easily and move the pot when protection is needed.

## Record the winter transition

Write down where the plant spent winter, how much light it received and any decline. These are observations to compare, not a claim that indoor survival is automatic. Revisit the winter plan before buying a larger plant.

## Sources and next steps

[University of Maryland Extension: Rosemary](https://www.extension.umd.edu/resource/rosemary) supports the growing guidance. Regional timing and cultivar behavior vary; the profile above comes from our curated herb data. Reviewed September 23, 2026.

- [Record a rosemary observation](/tools/my-garden) and include the herb name in your note.
- [Compare the herb guides](/content/herbs/) before grouping plants by care needs.
- [Understand soil drainage](/content/soil/building-healthy-soil).


## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "What is your winter plan for this plant?", "observe": "Record cultivar, container drainage, indoor light and the date of the move; compare leaf loss after the transition.", "topic": "sun", "cropName": "Rosemary"}));
```


```js
import {mountOptionalMedia} from "/lib/media/runtimeMedia.js";
mountOptionalMedia();
```

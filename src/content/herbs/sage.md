---
title: "Growing Sage"
description: "A practical guide to growing sage in the home garden."
section: "herbs"
status: "ready"
date: "2026-07-02"
tags:
  - "sage"
  - "herbs"
---

# Growing Sage

```js
import {gardenActions} from "../../components/garden-actions.js";
display(gardenActions({"crop": "Sage", "cropSlug": "sage"}));
```



<figure data-optional-media="images/plants/sage.webp" data-media-alt="Soft gray-green sage leaves."><p>Soft gray-green sage leaves. — optional image not configured.</p></figure>

```js
const herb = (await FileAttachment("../../data/herbs.json").json()).find(d => d.slug === "sage");
```

```js
html`<aside class="note" aria-label="Herb growing profile"><strong>${herb.name}: ${herb.season}</strong><p>${herb.mainCare}.</p></aside>`
```

## A perennial place in the kitchen garden

Culinary sage belongs in a place you can keep observing across seasons. Think about access for a few leaves at dinner as well as the space the plant occupies when mature.

## Choose the plant and site

Use culinary sage, with the plant label retained so that its identity is clear. Favor a sunny position with good drainage. Avoid treating an established woody herb like a fast-growing leafy annual that needs constant feeding and wet soil.

## Harvest and renew deliberately

Pick leaves for the meals you make. Watch where new leafy growth forms before deciding how to trim the plant. If the center becomes sparse, record its condition and compare the following season rather than cutting heavily without a reason.

## Keep a perennial record

Note winter survival, flowering, harvest frequency and whether the crown remains wet after rain. A recurring problem in the same location is a reason to reassess drainage and placement. The useful result is a healthy, accessible plant, not the largest possible bush.

## Sources and next steps

[University of Maryland Extension: Sage](https://www.extension.umd.edu/resource/sage) supports the growing guidance. Regional timing and cultivar behavior vary; the profile above comes from our curated herb data. Reviewed September 23, 2026.

- [Record a sage observation](/tools/my-garden) and include the herb name in your note.
- [Compare the herb guides](/content/herbs/) before grouping plants by care needs.
- [Understand soil drainage](/content/soil/building-healthy-soil).


## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "Where is healthy new growth appearing?", "observe": "Photograph living shoots and bare wood before trimming, then record regrowth and harvest.", "topic": "pruning", "cropName": "Sage"}));
```


```js
import {mountOptionalMedia} from "/lib/media/runtimeMedia.js";
mountOptionalMedia();
```

---
title: "Growing Parsley"
description: "A practical guide to growing parsley in the home garden."
section: "herbs"
status: "ready"
date: "2026-07-02"
tags:
  - "parsley"
  - "herbs"
---

# Growing Parsley

```js
import {gardenActions} from "../../components/garden-actions.js";
display(gardenActions({"crop": "Parsley", "cropSlug": "parsley"}));
```



<figure data-optional-media="images/plants/parsley.webp" data-media-alt="A parsley stem with leaves and a branching flower head."><p>A parsley stem with leaves and a branching flower head. — optional image not configured.</p></figure>

```js
const herb = (await FileAttachment("../../data/herbs.json").json()).find(d => d.slug === "parsley");
```

```js
html`<aside class="note" aria-label="Herb growing profile"><strong>${herb.name}: ${herb.season}</strong><p>${herb.mainCare}.</p></aside>`
```

## Give a slow start time to become useful

Parsley rewards a little patience at the start of the season. Mark the sowing location and date so a slow emergence is not mistaken for an empty patch ready to disturb.

## Establish the planting

Parsley is a biennial commonly grown as an annual for leaves. Maryland Extension notes slow germination and suggests about six inches between plants. Use the variety's instructions when they differ, and distinguish seed-starting time from the date an established transplant enters the bed.

## Harvest leaves, observe the life cycle

Cut leaves once they are large enough to use. Keep notes on the amount you actually harvest: a few frequently visited plants can be more useful than a long neglected row. A plant retained into its second season may shift toward flowering; plan a new leafy planting rather than assuming the old one will stay unchanged.

## Keep a useful comparison

Record seed or transplant, emergence date, first harvest and flowering. That gives you a basis for choosing between starting seed and buying plants next spring.

## Sources and next steps

[University of Maryland Extension: Parsley](https://www.extension.umd.edu/resource/parsley) supports the growing guidance. Regional timing and cultivar behavior vary; the profile above comes from our curated herb data. Reviewed September 23, 2026.

- [Record a parsley observation](/tools/my-garden) and include the herb name in your note.
- [Compare the herb guides](/content/herbs/) before grouping plants by care needs.
- [Understand soil drainage](/content/soil/building-healthy-soil).


## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "How long did this seed lot take to establish?", "observe": "Record sowing, emergence and first cutting. Keep seed age and moisture notes with the dates.", "topic": "harvest", "cropName": "Parsley"}));
```


```js
import {mountOptionalMedia} from "/lib/media/runtimeMedia.js";
mountOptionalMedia();
```

---
title: "Growing Mint"
description: "A practical guide to growing mint in the home garden."
section: "herbs"
status: "ready"
date: "2026-07-02"
tags:
  - "mint"
  - "herbs"
---

# Growing Mint

```js
import {gardenActions} from "../../components/garden-actions.js";
display(gardenActions({"crop": "Mint", "cropSlug": "mint"}));
```



<figure data-optional-media="images/plants/mint.webp" data-media-alt="Fresh mint leaves on spreading stems."><p>Fresh mint leaves on spreading stems. — optional image not configured.</p></figure>

```js
const herb = (await FileAttachment("../../data/herbs.json").json()).find(d => d.slug === "mint");
```

```js
html`<aside class="note" aria-label="Herb growing profile"><strong>${herb.name}: ${herb.season}</strong><p>${herb.mainCare}.</p></aside>`
```

## Contain the plant before enjoying the abundance

Mint is an easy herb to use and an easy herb to give too much room. Its spreading growth is the first design decision: choose containment before placing it beside smaller herbs.

## Give runners a boundary

A separate container makes inspection simpler. Maryland Extension suggests a pot about 12–16 inches across. Check escaping runners and cut them before they root elsewhere. A pot is a management tool, not a promise that the plant cannot spread.

Mint generally prefers moisture and grows in sun or partial shade. Keep its watering needs separate from herbs that need a drier root zone.

## Harvest what you use

Regular picking encourages bushier growth. Choose a mint whose flavor suits your cooking; peppermint and spearmint are not interchangeable experiences. Harvest fresh leaves and leafy tips as needed.

## Record the maintenance cost

Note how often you watered the container, how much you harvested and whether runners escaped. If the plant is abundant but unused, grow less next year rather than making the container larger.

## Sources and next steps

[University of Maryland Extension: Mint](https://www.extension.umd.edu/resource/growing-mint-home-garden) supports the growing guidance. Regional timing and cultivar behavior vary; the profile above comes from our curated herb data. Reviewed September 23, 2026.

- [Record a mint observation](/tools/my-garden) and include the herb name in your note.
- [Compare the herb guides](/content/herbs/) before grouping plants by care needs.
- [Understand soil drainage](/content/soil/building-healthy-soil).


## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "Is the container still containing the plant?", "observe": "Inspect runners and drainage holes; record harvest alongside time spent keeping the plant within its boundary.", "topic": "harvest", "cropName": "Mint"}));
```


```js
import {mountOptionalMedia} from "/lib/media/runtimeMedia.js";
mountOptionalMedia();
```

---
title: "Growing Cilantro"
description: "A practical guide to growing cilantro in the home garden."
section: "herbs"
status: "ready"
date: "2026-07-02"
tags:
  - "cilantro"
  - "herbs"
---

# Growing Cilantro

```js
import {gardenActions} from "../../components/garden-actions.js";
display(gardenActions({"crop": "Cilantro", "cropSlug": "cilantro"}));
```



<figure data-optional-media="images/plants/cilantro.webp" data-media-alt="Fresh cilantro leaves growing as a leafy herb."><p>Fresh cilantro leaves growing as a leafy herb. — optional image not configured.</p></figure>

```js
const herb = (await FileAttachment("../../data/herbs.json").json()).find(d => d.slug === "cilantro");
```

```js
html`<aside class="note" aria-label="Herb growing profile"><strong>${herb.name}: ${herb.season}</strong><p>${herb.mainCare}.</p></aside>`
```

## Plan for leaves, flowers or coriander seed

A cilantro planting changes character quickly. Tender leaves give way to tall flower stems; later, the same plant supplies coriander seed. Decide which harvest you want before judging the planting a success.

## Sow for more than one harvest window

Heat encourages bolting. Light afternoon shade can help, but it does not stop the plant's life cycle. Maryland Extension suggests sowing small batches every two to three weeks and thinning to 7–10 inches. Treat that interval as a starting experiment, then adjust it to your weather and kitchen use.

## Let some plants finish

Pick leaves while plants are leafy. If you want coriander, leave a separate group to flower and mature; gather seed when the heads brown. Do not expect one plant to supply unlimited leaves and a full seed harvest simultaneously.

## Compare successive sowings

Record each sowing date, the first usable leaves and the start of flowering. A short leaf-harvest window in hot weather is a timing observation, not proof that you need more fertilizer.

## Sources and next steps

[University of Maryland Extension: Cilantro](https://www.extension.umd.edu/resource/cilantrocoriander) supports the growing guidance. Regional timing and cultivar behavior vary; the profile above comes from our curated herb data. Reviewed September 23, 2026.

- [Record a cilantro observation](/tools/my-garden) and include the herb name in your note.
- [Compare the herb guides](/content/herbs/) before grouping plants by care needs.
- [Understand soil drainage](/content/soil/building-healthy-soil).


## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "Which sowing gave the longest leaf harvest?", "observe": "Record sowing, first useful leaves and first flower; compare sunlight and warm spells between batches.", "topic": "sun", "cropName": "Cilantro"}));
```


```js
import {mountOptionalMedia} from "/lib/media/runtimeMedia.js";
mountOptionalMedia();
```

---
title: "Growing Thyme"
description: "A practical guide to growing thyme in the home garden."
section: "herbs"
status: "ready"
date: "2026-07-02"
tags:
  - "thyme"
  - "herbs"
---

# Growing Thyme

```js
import {gardenActions} from "../../components/garden-actions.js";
display(gardenActions({"crop": "Thyme", "cropSlug": "thyme"}));
```



<figure data-optional-media="images/plants/thyme.webp" data-media-alt="Tiny thyme leaves on woody stems."><p>Tiny thyme leaves on woody stems. — optional image not configured.</p></figure>

```js
const herb = (await FileAttachment("../../data/herbs.json").json()).find(d => d.slug === "thyme");
```

```js
html`<aside class="note" aria-label="Herb growing profile"><strong>${herb.name}: ${herb.season}</strong><p>${herb.mainCare}.</p></aside>`
```

## A small plant needs an intentional space

Thyme can disappear in the shade of larger neighbors. Give it a visible edge of the planting where you can reach it, see its growth and avoid trampling it during harvest.

## Start with the right habit

Choose a culinary thyme for kitchen use and keep its label: plants sold as thyme have different habits. A sunny, well-drained position suits this perennial herb. Do not group it automatically with thirsty container companions just because all are herbs.

## Trim for use and observe regrowth

Harvest small leafy stems as needed. Watch how the plant fills its space and where fresh growth appears. Flowers can be part of the planting; decide whether you are managing primarily for leaves, appearance or insect visits.

## Learn from the edge of the bed

Record shade from neighboring crops, winter survival and bare patches. If thyme declines where water lingers, investigate the site before adding more fertilizer. Repeat observations from the same position to distinguish seasonal change from continuing loss.

## Sources and next steps

[University of Maryland Extension: Thyme](https://www.extension.umd.edu/resource/thyme) supports the growing guidance. Regional timing and cultivar behavior vary; the profile above comes from our curated herb data. Reviewed September 23, 2026.

- [Record a thyme observation](/tools/my-garden) and include the herb name in your note.
- [Compare the herb guides](/content/herbs/) before grouping plants by care needs.
- [Understand soil drainage](/content/soil/building-healthy-soil).


## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "Does this edge stay dry enough for the plant?", "observe": "Check the crown after rain, competition from neighbors and regrowth after a light harvest.", "topic": "sun", "cropName": "Thyme"}));
```


```js
import {mountOptionalMedia} from "/lib/media/runtimeMedia.js";
mountOptionalMedia();
```

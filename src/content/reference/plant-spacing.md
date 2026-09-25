---
title: "Plant Spacing"
description: "A practical guide to spacing vegetables by mature size, airflow, root room, harvest access, and bed design."
section: "reference"
status: "ready"
date: "2026-07-02"
tags:
  - "spacing"
  - "reference"
  - "bed planning"
---

# Plant Spacing

Spacing is not just about fitting plants into a bed.

It affects light, airflow, water demand, root competition, disease pressure, harvest access, and how quickly a bed becomes difficult to manage. Crowding can look efficient in spring and become a problem by midsummer.

<figure data-optional-media="images/illustrations/plant-spacing-grid.webp" data-media-alt="Top-down vegetable bed spacing grid with mature lettuce, carrots, trellised beans, tomatoes, spacing marks, and an overcrowded comparison area."><p>Top-down vegetable bed spacing grid with mature lettuce, carrots, trellised beans, tomatoes, spacing marks, and an overcrowded comparison area. — optional image not configured.</p></figure>

## Start with the mature plant

Seedlings make every plan look generous.

A tomato transplant may occupy a few inches in May and a full cage in August. A squash seedling may look harmless at planting and then cover a path. A row of lettuce may seem sparse until each head begins to touch its neighbor.

Spacing should imagine the plant at harvest size.

## Try the spacing before planting

```js
import {spacingExplorer} from "../../components/spacing-explorer.js";
display(spacingExplorer());
```

## Practical spacing table

These numbers are starting points, not rules. Variety, soil fertility, climate, trellising, and harvest stage all matter.

<div class="table-wrap">

| Crop | In-row spacing | Between rows or bed bands | Notes |
|---|---:|---:|---|
| Lettuce | 6-12 in | 12-18 in | Closer for baby leaf, wider for heads |
| Carrots | 1-3 in | 12-18 in | Thin early; roots need loose soil |
| Beets | 3-4 in | 12-18 in | Each seed cluster may produce several seedlings |
| Radishes | 1-2 in | 8-12 in | Fast crop; crowding causes poor roots |
| Beans, bush | 4-6 in | 18-24 in | Good airflow reduces disease |
| Beans, pole | 6-8 in | 24-36 in | Provide support before vines need it |
| Tomatoes | 18-24 in | 30-36 in | Depends on pruning and support method |
| Peppers | 18-24 in | 24-36 in | Plants can touch lightly but need airflow |
| Cucumbers, trellised | 12-18 in | 24-36 in | Trellising saves space and improves harvest |
| Zucchini | 24-36 in | 36-48 in | Large leaves need room and access |
| Kale | 12-18 in | 18-24 in | Wider spacing gives longer harvest |
| Garlic | 4-6 in | 8-12 in | Consistent spacing helps bulb size |

</div>

## Dense planting can work

Dense planting is useful when the harvest is young.

Baby greens, radishes, scallions, cilantro, and cut-and-come-again crops can be planted closer than full-size crops because they are harvested before they occupy mature space.

Dense planting works poorly when crops need:

- deep root systems;
- strong airflow;
- easy picking access;
- trellising or pruning;
- long harvest windows.

## Paths are part of spacing

Bed spacing is not complete without path spacing.

Narrow paths may seem efficient until harvest baskets, hoses, wheelbarrows, kneeling, and plant overhang enter the garden. If paths are too tight, gardeners step into beds, compacting the soil they are trying to protect.

For many home gardens, the best layout is not the one with the most plants on paper. It is the one that remains easy to work in July.

## Trellising changes the calculation

Vertical support changes how much ground a crop occupies, but it does not remove the plant's needs.

Trellised cucumbers still need water. Pole beans still need airflow. Indeterminate tomatoes still need pruning, tying, and harvest access. Trellising saves ground space by moving growth upward; it does not make plants smaller.

## Field notes

Record the spacing you actually used, not the spacing you intended. At the end of the season, note which beds were hard to harvest, where disease appeared first, and where paths disappeared. Those observations are more useful than a generic spacing chart.


## Share space without forgetting mature size

```js
import {decisionWorkbench} from "../../components/garden-decisions.js";
const decisionSources = await FileAttachment("../../data/decision-sources.json").json();
display(decisionWorkbench("companions", {sources: decisionSources, crop: {slug: "plant-spacing"}}));
```

## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "Will the mature plants leave room to work?", "observe": "Measure plant centers, row gaps and paths separately. Record crowding and drying after rain as the canopy fills.", "topic": "companions", "cropName": ""}));
```

## Related pages

- [Planning Your Vegetable Garden](/content/garden/planning-your-vegetable-garden)
- [Watering Wisely](/content/garden/watering-wisely)
- [Seasonal Garden Calendar](/content/calendar/seasonal-garden-calendar)


```js
import {mountOptionalMedia} from "/lib/media/runtimeMedia.js";
mountOptionalMedia();
```

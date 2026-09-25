---
title: "Planning Your Vegetable Garden"
description: "A practical approach to beds, paths, water, sun, and records."
section: "garden"
status: "ready"
date: "2026-07-02"
tags:
  - "planning"
  - "beds"
  - "layout"
---

# Planning Your Vegetable Garden

A garden plan is not a decoration.

It is a working document that helps you decide what to grow, where to grow it, and how to avoid repeating mistakes.

The best plan is simple enough to use.

<figure data-optional-media="images/illustrations/garden-plan-rotation.webp" data-media-alt="Top-down vegetable garden plan with four raised beds, paths, irrigation lines, water access, pollinator borders, and rotation arrows."><p>Top-down vegetable garden plan with four raised beds, paths, irrigation lines, water access, pollinator borders, and rotation arrows. — optional image not configured.</p></figure>

## Start with constraints

Begin with sun, water, soil, access, and time.

Most vegetables need full sun. Water should be close enough that irrigation is not a burden. Paths should be wide enough to work comfortably. Beds should be narrow enough that you can reach the center without stepping on the soil.

The shape of the garden should reduce friction.

## Bed size

A common raised bed width is four feet. That allows most people to reach the middle from either side.

Length is more flexible. Eight, ten, or twelve feet can all work. Longer beds are efficient but may force long walks around the ends.

Choose dimensions that make the garden easier to use, not dimensions that look best in a photograph.

## Rotation

Crop rotation helps reduce disease and manage soil fertility, but it does not need to be elaborate in a small garden.

A practical rotation separates broad plant families:

- tomatoes, peppers, eggplants, and potatoes;
- cucumbers, squash, melons, and pumpkins;
- beans and peas;
- cabbage-family crops;
- beets, spinach and chard (amaranth family);
- carrots and related carrot-family crops;
- onions and garlic (alliums).

“Roots” and “greens” describe harvest use, not botanical families. Radishes and turnips belong with brassicas, while potatoes belong with nightshades.

Do the best you can.

## Water

Water planning should happen before planting.

Drip irrigation, soaker hoses, or careful hand watering are all possible. What matters is consistency.

Many garden failures are water failures disguised as nutrient problems.

## Records

Create a simple map each year.

Label beds by number. Record what was planted, when it was planted, and how it performed. The map becomes the foundation for next year's decisions.

## Field notes

A garden plan should make the garden calmer.

If the plan creates anxiety, simplify it.

## Put the plan to work

[Start a practice layout in Studio](https://studio.veggie.farm/), [compare crops for a bed](/tools/what-grows-in-this-bed), and [record bed names and planting dates](/tools/my-garden). Keep site features such as paths and established trees separate from the beds you replant.


## Test the light before choosing the crop

```js
import {decisionWorkbench} from "../../components/garden-decisions.js";
const decisionSources = await FileAttachment("../../data/decision-sources.json").json();
display(decisionWorkbench("sun", {sources: decisionSources, crop: {slug: "planning-your-vegetable-garden"}}));
```

## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "Will the plan still fit at midsummer?", "observe": "Measure direct sun after trees leaf out, draw mature footprints and mark paths you can reach while carrying a harvest basket.", "topic": "sun", "cropName": ""}));
```


```js
import {mountOptionalMedia} from "/lib/media/runtimeMedia.js";
mountOptionalMedia();
```

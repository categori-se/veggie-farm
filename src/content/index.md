---
title: "Welcome to veggie.farm"
description: "A quiet, practical field guide for growing food through observation, soil, and seasonal practice."
section: "garden"
status: "ready"
date: "2026-07-02"
tags:
  - "garden"
  - "field notes"
  - "soil"
  - "vegetables"
---

# A useful place to start growing

A garden becomes easier to understand when the next question is small enough to answer. Will this bed get enough light? Is the soil ready? What should you pick today?

<figure data-optional-media="images/illustrations/garden-plan-rotation.webp" data-media-alt="Illustrated vegetable beds, paths and a crop-rotation plan."><p>Illustrated vegetable beds, paths and a crop-rotation plan. — optional image not configured.</p></figure>

## Start with what is in front of you

| In your garden | A useful next step |
|---|---|
| An empty patch | [Compare light and space](/content/garden/planning-your-vegetable-garden) before choosing crops |
| A packet of seeds | [Find the crop guide](/content/vegetables/) and [check planting timing](/tools/today) |
| A plant that is struggling | [Inspect symptoms and growing conditions](/tools/garden-decisions#disease) |
| A harvest nearly ready | Read the crop’s harvest cues and check the plant, not just the calendar |
| A lesson you want to remember | [Write a short field note](/tools/my-garden) with the date and place |

## Learn one bed at a time

For example, a row of lettuce may emerge evenly at one end and poorly at the other. Before sowing again, check moisture and shade along the row. Label the next sowing, keep the packet, and compare what happens. This is a small garden experiment you can repeat; it does not require a perfect digital record.

## Follow your curiosity

[Search the gardening library](/content/reference/garden-knowledge-base) for a crop, a problem or a technique. [Compare plant varieties](/content/reference/plant-database) when you are ready to shortlist choices. [Open Studio](https://studio.veggie.farm/) when seeing the layout would help.

The guides bring together growing advice, sources and practical observations. Your garden adds the local part: its weather, soil, harvests and the time you have to care for it.

## Try it in your garden

```js
import {articleDecision} from "../components/garden-decisions.js";
display(articleDecision({"question": "What question can your garden answer this week?", "observe": "Choose one observation and one next action. Return after a week to record whether the result supported your expectation.", "topic": "sun", "cropName": ""}));
```


```js
import {mountOptionalMedia} from "/lib/media/runtimeMedia.js";
mountOptionalMedia();
```

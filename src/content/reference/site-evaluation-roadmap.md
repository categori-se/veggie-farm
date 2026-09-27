---
title: "Using veggie.farm"
description: "A practical route through the growing guides, data, seasonal tools and garden planner."
section: "reference"
status: "ready"
date: "2026-07-02"
tags:
  - "roadmap"
  - "content strategy"
  - "reference"
---

# Using veggie.farm

[Follow the visual user guide](https://veggie.farm/guide) for screenshots and a walkthrough from your first bed to seasonal plans and garden history.

Begin with the question in your garden, rather than a tour of every tool. You can use the guides without an account and add records or a layout when those help your decision.

## Find the right starting point

| Your question | Start here | Bring this information |
|---|---|---|
| What should I grow? | [Vegetables](/content/vegetables/), [fruits](/content/fruits/) or [herbs](/content/herbs/) | What you eat, sunlight and available space |
| Is there time to plant? | [Garden Today](/tools/today) | Local frost dates, soil temperature and the variety's maturity information |
| Why is this bed difficult? | [Soil guides](/content/soil/) | Observations after rain and a soil report if available |
| How will the layout fit? | [Studio](https://studio.veggie.farm/) | A practice garden or a Massachusetts site to investigate |
| What did I learn this season? | [Garden Notebook](/tools/my-garden) | Dated observations with consistent bed names |

## Follow a decision through the site

Suppose a bed becomes free after harvest. Read a crop guide, check its timing against your frost dates, then compare its space needs with the bed. Record what you planted and when it emerged. At harvest, compare what happened with the original assumptions. You do not need a complete digital garden to benefit from that loop.

## Understand the evidence

A variety listing helps you compare plants; an Extension guide explains growing practices; your own notes show what happened here. Use all three. A missing value in the plant finder means you still need that detail before relying on it.

Use [Plant Data](/content/reference/plant-database) to explore coverage and [Data Sources](/about/data-sources) to understand provenance. Images explain concepts; they are not measurements of your site.

## Keep your work

{{notebook-persistence}} {{studio-persistence}} Check save status and export an independent backup before clearing browser data.

## Using public-garden examples

Public-garden studies are incomplete references, useful for exploring scale and layout. Check their source notes before treating a drawn feature as a measured or documented planting.


## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "Can you follow a recommendation back to its inputs?", "observe": "Choose one result, inspect its assumptions and source, and record what your garden did differently.", "topic": "harvest", "cropName": ""}));
```

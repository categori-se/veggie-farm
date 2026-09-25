---
title: "Gardening Library"
description: "Search gardening guides by crop, question or topic, and find a practical next step."
section: "reference"
status: "ready"
date: "2026-07-03"
tags:
  - "knowledge base"
  - "data architecture"
  - "normalized data"
---

# Find the answer, then try it in your garden

Perhaps the seedlings are struggling, a bed has opened up, or the tomatoes are finally changing color. Start with the question in front of you. Search the guides below, then use a tool to compare choices or record what happens next.

## Search the gardening library

Search article text as well as titles. Try **watering**, **compost**, **pruning** or a crop name, or browse one topic at a time.

```js
import {guideExplorer} from "../../components/garden-library.js";
const guides = await FileAttachment("../../data/gardening-library.json").json();
display(guideExplorer(guides));
```

## When reading turns into a decision

[Find a plant](/content/reference/plant-database) · [Choose a planting date](/tools/today) · [Investigate a struggling plant](/tools/garden-decisions#disease) · [Keep a field note](/tools/my-garden)

A useful garden record is small: what you saw, where, when, and what you will check next. Advice becomes more valuable when you can compare it with your own garden.

## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "How strong is the evidence behind a recommendation?", "observe": "Check the source, review status, region and missing values. A filled field does not establish a validated recommendation.", "topic": "companions", "cropName": ""}));
```

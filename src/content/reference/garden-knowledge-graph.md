---
title: "Garden Connections"
description: "Plan plant pairings around space, season and the result you want to observe."
section: "reference"
status: "ready"
date: "2026-07-03"
tags:
  - "knowledge graph"
  - "data"
  - "planning"
---

# Garden Connections

A good pairing starts with a purpose. Are you making room for two harvests, bringing flowers near vegetables, or trying to keep a path open? Plant names alone cannot answer those questions: mature size, timing and access matter too.

<figure data-optional-media="images/illustrations/garden-plan-rotation.webp" data-media-alt="Illustrated garden beds grouping crops through a rotation."><p>Illustrated garden beds grouping crops through a rotation. — optional image not configured.</p></figure>

```js
import {evidencePaths} from "../../components/evidence-paths.js";
const evidence = await FileAttachment("../../data/horticultural-evidence.json").json();
const sources = await FileAttachment("../../data/evidence-sources.json").json();
display(evidencePaths(evidence, sources));
```

## Choose what you want the pairing to do

[Compare companion-planting purposes](/tools/garden-decisions#companions) to distinguish use of space, flower habitat and claims that need stronger evidence.

## Read the garden, not a pairing chart

**Picture both plants at full size.** A small transplant can become the plant that shades its neighbor or blocks the harvest path. Compare mature spacing in the [plant finder](/content/reference/plant-database), then lay out the bed in [Studio](https://studio.veggie.farm/).

**Keep a record of the result.** Note what you planted together, the dates and the outcome you were watching. One successful season is useful experience, but it does not prove that one plant protected another.

**Think beyond this season.** [Crop rotation](/content/garden/planning-your-vegetable-garden) considers what occupied the bed before. Use your [garden notes](/tools/my-garden) to keep that history.

## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "Does a relationship describe evidence or a hypothesis?", "observe": "Open the source behind the edge. Do not treat an unreviewed companion relationship as demonstrated pest control.", "topic": "companions", "cropName": ""}));
```


```js
import {mountOptionalMedia} from "/lib/media/runtimeMedia.js";
mountOptionalMedia();
```

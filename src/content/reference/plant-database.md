---
title: "Find & Compare Plants"
description: "A growing structured database of plant facts used by veggie.farm for crop guides, planning tables, and future garden tools."
section: "reference"
toc: false
status: "ready"
date: "2026-07-02"
tags:
  - "plants"
  - "database"
  - "planning"
---

# Find & compare plants

Explore plant photos and growing facts, compare varieties, and save a choice to your notebook. [Check planting timing](/tools/today).

```js
import {plantExplorer} from "../../components/garden-library.js";
const plants = await FileAttachment("../../data/plant-explorer.json").json();
display(plantExplorer(plants, {invalidation}));
```

## Turn a shortlist into a plan

- **Start with your light.** [Explore what fits your sun hours](/tools/garden-decisions#sun).
- **Check the season.** [Compare crops with your frost dates and soil temperature](/tools/today).
- **Make room for growth.** [Read crop guides](/content/vegetables/) before [arranging your bed in Studio](https://studio.veggie.farm/).

Choose Grid for photo cards, Table for a compact overview, or select 2–4 plants for Compare. Selections stay in your shortlist when filters change. Each plant’s source is available under its growing details. [How we use gardening sources](/about/data-sources).

## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "Which records are fit for your decision?", "observe": "Compare cultivar, source and review status. Missing sun or spacing data is unknown, not a favorable match.", "topic": "sun", "cropName": ""}));
```

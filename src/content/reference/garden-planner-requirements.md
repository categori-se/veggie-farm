---
title: "Garden Planning: What Works Today"
description: "Choose a planning task, understand where your work is saved, and see the limits of the current tools."
section: "reference"
status: "ready"
date: "2026-07-02"
tags:
  - "planner"
  - "garden design"
  - "data"
  - "tools"
---

# Garden Planning: What Works Today

A useful plan connects a place, a crop and a decision. Start with the task you need to finish, then choose the tool that holds the right information.

## Choose your workflow

| Task | Open | What to expect |
|---|---|---|
| Compare planting timing | [Garden Today](/tools/today) | Your frost dates and soil-temperature input with explicit assumptions |
| Compare crops for a bed | [What Grows in This Bed](/tools/what-grows-in-this-bed) | Filters and recommendations, including uncertainty in rotation history |
| Draw a layout | [Planning Studio](https://studio.veggie.farm/) | Practice gardens, bed geometry, crop placement and 2D/3D views |
| Describe the site | [Planning Studio](https://studio.veggie.farm/) | Site points, paths, polygons and established tree observations, separate from planted beds |
| Keep field observations | [Garden Notebook](/tools/my-garden) | A private account profile and dated notes, with draft recovery and JSON export |

## Know which save you are using

Studio keeps local work in this browser. Its account controls explicitly save personal gardens and named versions to a private account copy. Public-demo edits stay local and do not change the shared examples or enter account saves. Studio JSON backups can include those local experiments.

Garden Notebook keeps your profile and field notes in your individual account. Studio plans are separate account records. Export the notebook and Studio plan separately when you want independent backups.

## Read the preview as a plan

The 3D view helps compare layout and canopy assumptions. It is not a sunlight, yield or growth forecast. Site geometry and public examples are provisional rather than surveyed boundaries or complete plant inventories. If 3D is unavailable, use 2D.

## What remains outside the current tools

Automatic multi-year planting ledgers, organization collaboration and automatic links between journal entries and Studio objects are not implemented. Use consistent bed names in your own records while those systems remain separate.

[Start a practice garden](https://studio.veggie.farm/) or [learn how sources are handled](/about/data-sources).


## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "Which part of the plan can you test outdoors?", "observe": "Compare one mature footprint with measured bed space, then verify the save and backup workflow you use.", "topic": "sun", "cropName": ""}));
```

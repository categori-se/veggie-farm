---
title: "Field Notes Template"
description: "A reusable structure for garden observations."
section: "field-notes"
status: "ready"
date: "2026-07-02"
tags:
  - "notes"
  - "template"
---

# Field Notes Template

Start with what you saw. An explanation can wait.

```js
import {gardenActions} from "../../components/garden-actions.js";
display(gardenActions({observeOnly: true}));
```

<div class="article-summary">
  <p>Save a note here, then find it in <a href="/tools/my-garden">Garden Notebook</a>. Sign in to save records privately to your account; export a backup whenever you need one.</p>
</div>

## Date

Record the date and weather.

## Bed or area

Identify the exact location.

## Crop and variety

Include the variety name when known.

## Observation

Write what happened plainly.

## Interpretation

What might explain it?

## Next action

What will you try next?

## End-of-season lesson

What should be easier next year?

## A one-minute example

This is an invented example, not a result from a veggie.farm user:

| Field | Entry |
|---|---|
| Date / place | September 10, Bed A, west end |
| Crop | Lettuce; variety label missing |
| Observation | Four seedlings emerged in the marked row; surface dry before watering |
| Interpretation | Moisture may differ along the row; germination is still underway |
| Action | Check the same row tomorrow and retain the seed packet next time |

A count without a sowing date is hard to interpret. A diagnosis without an observation is hard to revisit. Record what is missing rather than filling it in from memory.

## Review after harvest

Pick one question: did emergence improve with a different sowing date, did the bed need more access, or did you grow more than you used? Compare notes from the same crop and location, allowing for changed weather and varieties. One season suggests a next experiment; it does not establish a universal rule.

## Keep a copy

{{notebook-persistence}} {{storage-boundary}} Check the notebook’s save status before clearing browser data.


## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "What would make this observation useful next year?", "observe": "Keep the date, place, variety, action and result together. Separate what you saw from what you think caused it.", "topic": "harvest", "cropName": "", "toolPath": "/tools/my-garden", "toolLabel": "Open the garden journal →"}));
```

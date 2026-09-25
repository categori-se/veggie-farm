---
title: "Garden Records: From Observation to Decision"
description: "Keep a small, useful garden record and understand what Garden Notebook currently stores."
section: "reference"
status: "ready"
date: "2026-07-02"
tags:
  - "journal"
  - "field notes"
  - "data"
---

# Garden Records: From Observation to Decision

A garden record is useful when you can return to it and understand what changed. Start with a dated fact; keep your explanation separate so you can revise it later.

## A record you can make today

[Garden Notebook](/tools/my-garden) saves an observation type, date, bed or area, supported crop, optional variety and a plain-language note. If your plant is absent from the crop selector, include its name in the note. No exact coordinates are required.

| Part | Example — invented to illustrate the format |
|---|---|
| Observation | Bed A: three seedlings emerged; the shaded end is still bare |
| Context | Sown on the same date, same packet; checked before watering |
| Interpretation | Shade or moisture may differ; cause not established |
| Next check | Inspect the same positions in two days and note soil moisture |

## Keep dates that answer a question

For timing, record sowing, emergence and first harvest. For water, record what you applied and what you observed afterward. For a suspected pest or disease, describe the visible symptom and its location before naming a cause. A missing note should remain missing rather than becoming a guessed event.

## Where the record lives

{{notebook-persistence-detail}} {{storage-boundary}}

[Use the field-note template](/content/field-notes/field-notes-template) or [open Garden Notebook](/tools/my-garden).


## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "Could another season’s record answer this question?", "observe": "Keep units and crop names consistent; check the account save status and keep an independent export.", "topic": "harvest", "cropName": "", "toolPath": "/tools/my-garden", "toolLabel": "Open the garden journal →"}));
```

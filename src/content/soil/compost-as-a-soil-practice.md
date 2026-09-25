---
title: "Compost as a Soil Practice"
description: "Compost is not a miracle product. It is a slow improvement strategy."
section: "soil"
status: "ready"
date: "2026-07-02"
tags:
  - "soil"
  - "compost"
  - "organic matter"
---

# Compost as a Soil Practice

Compost is an input you can measure. Before ordering a load, decide what problem you are trying to solve and how much material the bed actually needs.

## Start with the soil report

Compost changes soil structure and supplies nutrients, but products differ. Plant-based and manure-based composts are not equivalent fertilizers. Keep the soil test and the material's analysis together; a blanket annual dose is not a substitute for understanding an already enriched bed.

[Maryland Extension's soil-amendment guide](https://extension.umd.edu/resource/organic-matter-and-soil-amendments) explains these differences and gives application examples. Use its regional guidance alongside your own soil report, not as a universal prescription.

## Calculate the volume before buying

Choose a depth based on your soil needs. The calculator converts dimensions only; it does not recommend a dose. A 4 × 8 ft bed covered one inch deep needs about 2.67 cubic feet, before allowing for settling or uneven ground.

```js
const bedLength = view(Inputs.number({label: "Bed length (feet)", value: 8, min: 0.1, max: 1000, step: 0.1}));
const bedWidth = view(Inputs.number({label: "Bed width (feet)", value: 4, min: 0.1, max: 1000, step: 0.1}));
const compostDepth = view(Inputs.number({label: "Chosen compost depth (inches)", value: 1, min: 0, max: 12, step: 0.25}));
```

```js
const validDimensions = [bedLength, bedWidth, compostDepth].every(Number.isFinite) && bedLength > 0 && bedWidth > 0 && compostDepth >= 0;
const compostCubicFeet = bedLength * bedWidth * compostDepth / 12;
display(validDimensions ? html`<p role="status"><strong>${compostCubicFeet.toFixed(2)} cubic feet</strong> (${(compostCubicFeet / 27).toFixed(2)} cubic yards). Formula: length × width × depth ÷ 12; divide cubic feet by 27 for cubic yards.</p>` : html`<p role="status">Enter positive bed dimensions and a nonnegative depth.</p>`);
```

## Keep the application traceable

Record the date, bed, material supplier, volume and report used to choose it. Next season, compare results before repeating the application. A darker-looking bed alone does not tell you its nutrient balance.

- [Read a soil test](/content/soil/soil-testing).
- [Make compost at home](/content/compost/composting-at-home).
- [Record an application](/tools/my-garden).

Guidance reviewed September 23, 2026. Local observations do not replace a laboratory test or site assessment.


## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "How much did you actually apply?", "observe": "Keep bed area, application depth, product and soil-test results together so the next application is an informed choice.", "topic": "harvest", "cropName": "", "toolPath": "/tools/my-garden", "toolLabel": "Record soil conditions →"}));
```

```js
import {actionRecorder} from "../../components/garden-actions.js";
display(actionRecorder({title: "Record your compost application", suggestion: "Applied … cubic feet of compost to …"}));
```

---
title: "Composting at Home"
description: "A calm, practical guide to turning garden and kitchen waste into soil-building material."
section: "compost"
status: "ready"
date: "2026-07-02"
tags:
  - "compost"
  - "soil"
---

# Composting at Home

Compost is organized decay.

It takes what the garden no longer needs and returns it as a material the garden can use again.

<figure data-optional-media="images/illustrations/home-compost-cycle.webp" data-media-alt="Three-step compost illustration showing garden greens and browns entering a bin, active decomposition, and finished compost added around vegetables."><p>Three-step compost illustration showing garden greens and browns entering a bin, active decomposition, and finished compost added around vegetables. — optional image not configured.</p></figure>

## Greens and browns

Fresh grass, vegetable scraps, and green plant material provide nitrogen.

Dry leaves, straw, shredded paper, and woody stems provide carbon.

A good pile contains both.

## Moisture

Compost should feel like a wrung-out sponge.

Too dry and the process slows. Too wet and the pile turns anaerobic.

## Time

Compost does not need to be perfect.

Finished compost should be dark, crumbly, and earthy. If recognizable materials remain, sift them out or let them continue breaking down.

## Field notes

Compost is less about waste disposal than garden memory. The remains of one season become the soil of the next.

## Troubleshoot the process

| Observation | First thing to inspect |
|---|---|
| Dry, unchanged material | Moisture inside the pile, not just the surface |
| Soggy or unpleasant-smelling pile | Drainage, air space and the balance of dry and wet material |
| A few coarse pieces remain | Whether they need a separate round of composting |

Keep a small record of material added, moisture checks and turning. A home pile's appearance does not establish that it reached a temperature sufficient to destroy pathogens or weed seeds. For input choices and process guidance, use [University of Maryland Extension's home composting guide](https://www.extension.umd.edu/resource/how-make-compost-home).

## Decide where the finished material goes

Measure the bed before spreading. [Compost as a soil practice](/content/soil/compost-as-a-soil-practice) includes a volume calculator and explains why an application should reflect the soil report. Record the batch and quantity in [Garden Notebook](/tools/my-garden) so you can compare future results.


## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "Which change helped this compost batch?", "observe": "Record the material added, moisture, turning date and smell before changing the mixture again.", "topic": "disease", "cropName": "", "toolPath": "/tools/my-garden", "toolLabel": "Open the garden journal →"}));
```

```js
import {actionRecorder} from "../../components/garden-actions.js";
display(actionRecorder({title: "Keep a compost-pile note", suggestion: "Materials added: …; moisture: …; temperature if measured: …; turned: …; smell and structure: …"}));
```


```js
import {mountOptionalMedia} from "/lib/media/runtimeMedia.js";
mountOptionalMedia();
```

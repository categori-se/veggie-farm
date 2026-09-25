---
title: "April: Preventing Recurring Peony Leaf Spot"
description: "Early-season peony sanitation and observation for reducing recurring Botrytis, leaf blotch, and red-spot pressure."
section: "seasonal"
status: "ready"
date: "2026-08-20"
tags: ["peonies", "disease prevention", "April", "New England"]
---

# April: prevent peony disease before the spots

Recurring dark marks on peony foliage often begin as a disease cycle, not a shortage of fertilizer. Botrytis and peony leaf blotch or red spot can persist in infected stems and leaves, then return when spring growth meets wet conditions.

The useful April question is not “What can I spray on a damaged leaf?” It is “How much infected material and leaf wetness can I remove from the cycle?”

<figure data-optional-media="images/illustrations/peony-season-cycle.svg" data-media-alt="Peony care through spring inspection, summer observation, autumn cleanup and comparison the following spring."><p>Peony care through spring inspection, summer observation, autumn cleanup and comparison the following spring. — optional image not configured.</p></figure>

## Start at the crown

Before shoots stretch:

- remove dead stems and matted foliage left from last year;
- keep mulch and debris from burying the crown;
- notice whether neighboring plants crowd the new growth;
- direct irrigation toward soil rather than emerging foliage;
- clean cutting tools after working in visibly diseased material.

Do not cultivate aggressively around the crown. Peony eyes and shallow roots are easy to injure.

## Watch the shoots

Botrytis may appear as blackened, soft, collapsed young shoots. Mark when symptoms appear and whether they follow a run of cold, wet weather. Remove badly affected tissue carefully rather than leaving it against healthy stems.

| Observation | What it suggests |
|---|---|
| Soft, dark young shoots | Possible early Botrytis injury |
| Spots beginning low on the plant | Splash and infected debris may be involved |
| Dense, slow-drying foliage | Airflow and leaf wetness may raise pressure |
| Lush, weak growth | Excess nitrogen may be contributing |

## What prevention can and cannot do

Sanitation and airflow reduce pressure; they do not guarantee spotless foliage in a wet year. If damage is severe every season, confirm the problem with a local diagnostic or Extension resource before considering a fungicide. Product choice and timing depend on the diagnosis and label.

<div class="field-notes">
  <p>Record shoot height, first symptom date, recent rain, where damage begins, and whether the same clump was affected last year. Photograph the whole plant and a close view.</p>
</div>

## Continue the cycle

- [October: Break the Peony Disease Cycle](/content/seasonal/october-peony-cleanup)
- [Watering Wisely](/content/garden/watering-wisely)
- [Seasonal series](/content/seasonal/)


## Inspect the conditions around the plant

```js
import {decisionWorkbench} from "../../components/garden-decisions.js";
const decisionSources = await FileAttachment("../../data/decision-sources.json").json();
display(decisionWorkbench("disease", {sources: decisionSources, crop: {slug: "april-peony-disease-prevention"}}));
```

## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "Which shoots need closer inspection?", "observe": "Photograph emerging shoots and symptoms after wet weather; keep plant identity, drainage and last year’s disease history together.", "topic": "disease", "cropName": ""}));
```


```js
import {mountOptionalMedia} from "/lib/media/runtimeMedia.js";
mountOptionalMedia();
```

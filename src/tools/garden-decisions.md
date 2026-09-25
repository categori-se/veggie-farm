---
title: "Garden Decision Lab"
description: "Compare sunlight, companion planting, disease conditions, pruning habits and harvest windows with visible sources."
---

# Garden Decision Lab

Choose the question in front of you. Compare what you observe, decide on a next step, and keep a record to learn from.

For Massachusetts gardeners, with conditions and sources visible. [Planting timing](/tools/today) · [Weather comparisons](/tools/season-weather) · [Try a practice garden](https://studio.veggie.farm/)

<div class="decision-fragment-targets" aria-hidden="true"><span id="sun"></span><span id="companions"></span><span id="disease"></span><span id="pruning"></span><span id="harvest"></span></div>

```js
import {decisionExplorer} from "../components/garden-decisions.js";
const sources = await FileAttachment("../data/decision-sources.json").json();
display(decisionExplorer({sources, invalidation}));
```

## A small experiment worth repeating

**Illustrative scenario, not a reported gardener outcome:** a leafy bed receives four hours of sun. Instead of filling it with tomatoes, the gardener trials one short row of lettuce and puts tomatoes in a sunnier spot. They record sowing dates, first harvest and usable harvest weight. Next season, those observations help decide whether the shaded row earned its space. Weather, variety and watering still complicate the comparison; one season does not prove a cause.

[Record an observation](/tools/my-garden) · [Use the field-note template](/content/field-notes/field-notes-template) · [Read the source and archive policy](/about/data-sources#decision-aid-sources)

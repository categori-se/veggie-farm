---
title: "Soil Testing"
description: "A practical guide to using soil tests to understand pH, nutrients, organic matter, and amendment decisions before guessing."
section: "soil"
status: "ready"
date: "2026-07-02"
tags:
  - "soil"
  - "testing"
  - "pH"
  - "nutrients"
---

# Soil Testing

A soil test is not a gardening ritual. It is a way to stop guessing.

Many garden problems look similar from above ground. Pale leaves may suggest low nitrogen, cold soil, poor roots, waterlogged conditions, high pH, compacted soil, or a plant that has simply outgrown a container. Adding amendments without a test can make the problem harder to understand and harder to correct.

Testing does not replace observation. It gives observation a baseline.

<div class="article-summary">
  <p><strong>Use a soil test when:</strong> starting a new garden, changing beds, applying large amendments, growing fruit, or seeing persistent problems.</p>
  <p><strong>Do not use it for:</strong> diagnosing every yellow leaf, measuring daily fertility, or replacing soil structure observations.</p>
</div>

## What a soil test can tell you

Most basic garden soil tests report pH and major nutrients. Some also report organic matter, cation exchange capacity, soluble salts, micronutrients, and texture estimates. The exact report depends on the lab.

| Measurement | Why it matters | How to use it |
|---|---|---|
| pH | Controls nutrient availability and crop suitability | Adjust slowly; do not chase perfection |
| Phosphorus | Often over-applied in gardens | Avoid adding more when levels are already high |
| Potassium | Supports water regulation, roots, and fruit quality | Add when low, especially for fruiting crops |
| Calcium and magnesium | Affect nutrient balance and soil chemistry | Interpret with pH and base saturation where reported |
| Organic matter | Indicates long-term soil-building progress | Improve gradually with compost, mulch, roots, and cover |
| Soluble salts | Can damage seedlings and roots | Avoid over-fertilizing and improve drainage |

The most useful number for many gardeners is pH. A soil can contain nutrients but still make them difficult for plants to access if pH is far outside the crop's preferred range.

## Sampling matters

A soil test is only as good as the sample.

Do not send one scoop from the worst corner of the bed and expect the result to describe the whole garden. Instead, collect several small cores or slices from the same management area, mix them in a clean bucket, and send a representative subsample.

Sample separate areas separately:

- vegetable beds;
- lawn or future garden areas;
- blueberry or acid-loving fruit beds;
- high tunnels or containers;
- problem areas that behave differently from the rest of the garden.

Avoid sampling immediately after adding compost, lime, fertilizer, ash, or other amendments. The test should describe the soil, not a fresh pile of material sitting in it.

## Interpreting results

The goal is not to make every number high.

High phosphorus, for example, is not better than adequate phosphorus. Excess nutrients can increase runoff risk, interfere with other nutrients, or encourage lush growth that does not improve harvest quality.

Use the report as a decision tool:

| If the report shows | Practical response |
|---|---|
| Low pH | Consider lime, but follow rate guidance and retest later |
| High pH | Avoid routine liming; use compost and crop choice before drastic correction |
| High phosphorus | Stop adding balanced fertilizers with phosphorus unless needed |
| Low potassium | Consider a potassium amendment matched to your soil and crop needs |
| Low organic matter | Build with compost, mulch, roots, and reduced disturbance |
| High soluble salts | Pause fertilizing, improve drainage, and leach only where appropriate |

## Soil test versus soil observation

A lab test does not tell you everything.

It does not show how water moves after a thunderstorm. It does not tell you whether the bed crusts after watering, whether earthworms are active, whether roots can move through the profile, or whether paths are compacting the edges of beds.

Pair the test with field observations:

- Does water infiltrate or run off?
- Does the soil form stable crumbs?
- Does it smell earthy or sour?
- Are roots branching freely?
- Does mulch disappear over the season?
- Do the same crops fail in the same spot each year?

These observations give context to the lab report.

## How often to test

For a new garden, test before major amendment decisions. After that, every two or three years is often enough for stable beds unless you are correcting a known problem.

Test more often when growing sensitive perennial crops, changing pH, managing high tunnels, or using significant fertilizer inputs.

## Common mistakes

The most common mistake is treating the recommendation as a shopping list without asking whether the crop, soil, and garden history support it.

The second mistake is adding compost as though it has no nutrient value. Compost is soil-building material, but it is also an amendment. Repeated heavy applications can raise phosphorus and salts.

The third mistake is trying to fix soil immediately. Soil chemistry changes slowly. Soil structure changes even more slowly. A good plan may take several seasons.

## Field notes

Write down the sample date, lab, bed names, recent amendments, and crop problems you were trying to understand. A soil test without notes is just a number sheet. A soil test with observations becomes a record of how the garden is changing.


## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "Does the amendment follow the actual report?", "observe": "Retain the sample area, date, laboratory units and crop recommendation. Keep the next application traceable to that evidence.", "topic": "harvest", "cropName": "", "toolPath": "/tools/my-garden", "toolLabel": "Record soil conditions →"}));
```

## Related pages

- [Building Healthy Soil](/content/soil/building-healthy-soil)
- [Compost as a Soil Practice](/content/soil/compost-as-a-soil-practice)
- [Mulch and Soil Cover](/content/soil/mulch-and-soil-cover)

<div id="record-soil-test"></div>

```js
import {soilTestRecorder} from "../../components/garden-actions.js";
display(soilTestRecorder());
```

```js
import {soilTestHistory} from "../../components/soil-test-history.js";
const soilPhReferences = await FileAttachment("../../data/soil-ph-references.json").json();
display(soilTestHistory({invalidation,phReferences:soilPhReferences}));
```

## Mapped landscape context

A soil survey helps explain the wider landscape. It cannot replace a sample from your own growing bed.

```js
import {mappedSoil} from "../../components/mapped-soil.js";
display(mappedSoil({invalidation}));
```


---
title: "Seasonal Garden Calendar"
description: "A practical seasonal calendar for planning garden work by observation, frost risk, soil conditions, planting windows, and harvest rhythm."
section: "calendar"
toc: false
status: "ready"
date: "2026-07-02"
tags:
  - "seasonal"
  - "planning"
  - "calendar"
---

# Seasonal Garden Calendar

Compare the regional planting bands, then use your own frost dates and observations before acting.

```js
import {plantingTimeline} from "../../components/planting-timeline.js";
const crops = await FileAttachment("../../data/vegetables.json").json();
const plantingEvidence = await FileAttachment("../../data/horticultural-evidence.json").json();
display(plantingTimeline(crops, plantingEvidence));
```

```js
import {seasonCalendar} from "../../components/season-calendar.js";
const seasonalTasks = await FileAttachment("../../data/seasonal-tasks.json").json();
display(seasonCalendar(seasonalTasks));
```

## Late winter

Late winter is for decisions that are easier before the season becomes urgent.

Review last year's notes. Decide which crops earned their space and which crops created more work than value. Order seeds while there is still time to compare varieties, maturity dates, disease resistance, storage quality, and days to harvest.

Useful work:

- clean and sharpen tools;
- inventory seed packets;
- sketch bed rotations;
- order compost, mulch, or soil amendments;
- start slow warm-season crops indoors if your climate requires it;
- repair trellises, row cover, irrigation parts, and labels.

Do not rush outdoor soil work. Wet soil is easy to damage.

## Early spring

Early spring is a season of restraint.

Cool-season crops can tolerate cold better than tomatoes or peppers, but even hardy crops need workable soil. A bed that is saturated, sticky, or compacted underfoot should be left alone until it can be prepared without smearing.

| Garden signal | Practical response |
|---|---|
| Soil crumbles rather than smears | Prepare beds gently |
| Soil is cold but workable | Sow hardy crops cautiously |
| Nights remain below freezing | Protect seedlings and transplants |
| Paths are muddy | Wait before heavy work |

Direct sow peas, spinach, radishes, and some greens when conditions allow. Start hardening off transplants gradually rather than moving them from indoor comfort directly into wind and cold.

## Late spring

Late spring is the transition from frost management to growth management.

Tender crops should wait until the risk of frost is low and the soil has warmed. Warm-season crops planted too early often stall. A tomato that sits in cold soil for two weeks is not necessarily ahead of a tomato planted later into better conditions.

This is the time to:

- transplant tomatoes, peppers, basil, cucumbers, squash, and other tender crops;
- install supports before plants need them;
- mulch once soil has warmed;
- check irrigation before heat arrives;
- thin direct-sown crops before they compete heavily.

## Summer

Summer is maintenance, harvest, and observation.

The garden may look abundant, but stress can accumulate quickly. Water deeply. Harvest often. Keep paths open. Watch for pests before damage becomes widespread. Start fall crops while the summer garden is still full, because fall harvest depends on summer planning.

| Summer task | Why it matters |
|---|---|
| Deep watering | Builds resilience during heat |
| Mulch maintenance | Reduces evaporation and protects soil |
| Frequent harvest | Keeps plants productive and quality high |
| Pest scouting | Finds problems before they become bed-wide |
| Fall sowing | Uses declining heat for cool-season crops |

## Autumn

[Open the Autumn gardening hub →](/seasons/autumn)

Autumn is both harvest and setup.

Plant garlic where appropriate. Sow cover crops if they fit your climate and schedule. Collect leaves. Mulch perennials. Remove diseased plant material where it would increase next year's pressure. Leave some habitat where it will not interfere with disease management.

Most importantly, record the season while memory is fresh.

Write down:

- first and last frost;
- crops that overperformed;
- crops that failed and why you think they failed;
- pest timing;
- irrigation problems;
- beds that dried fastest;
- varieties worth repeating.

## Winter

Winter is not empty time.

It is when the garden becomes legible again. Without the pressure of harvest, you can see structural problems: awkward paths, difficult hose routes, beds too wide to reach, trees that cast more shade than expected, and crops that repeatedly land in the wrong place.

Read, plan, repair, and simplify.

## Calendar by crop type

| Crop type | Best planning habit |
|---|---|
| Cool-season greens | Sow in spring and again for fall; avoid peak heat |
| Warm-season fruiting crops | Start or buy transplants; plant after soil warms |
| Roots | Direct sow into prepared soil; keep seedbed moist |
| Legumes | Direct sow when soil temperature fits the crop |
| Perennial fruit | Plant and prune on a multi-year schedule |
| Herbs | Match herb to season; basil and cilantro do not want the same weather |

## Field notes

The best calendar is the one you update after each season. Printed dates are a starting point. Your garden's records are the real calendar.


## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "What is ready in your garden, rather than on the calendar?", "observe": "Note plant stage, soil condition and the next forecast before selecting this week’s task.", "topic": "harvest", "cropName": ""}));
```

## Related pages

- [The New England Garden, in Season](/content/seasonal/)
- [Garden Today](/tools/today)
- [Understanding Your Climate](/content/garden/understanding-your-climate)
- [Planning Your Vegetable Garden](/content/garden/planning-your-vegetable-garden)
- [Plant Spacing](/content/reference/plant-spacing)

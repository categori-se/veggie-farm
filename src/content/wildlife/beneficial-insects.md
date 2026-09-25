---
title: "Beneficial Insects"
description: "A practical guide to pollinators, predators, parasitoids, decomposers, and the garden habitat that supports them."
section: "wildlife"
status: "ready"
date: "2026-07-02"
tags:
  - "insects"
  - "ecology"
  - "pollinators"
  - "pest management"
---

# Beneficial Insects

Not every insect in the garden is a problem.

Some pollinate. Some hunt. Some parasitize pests. Some break down plant material. Some simply belong. A productive garden is not an insect-free garden. It is a garden where pest pressure, plant health, habitat, and observation stay in balance.

## The main roles

Beneficial insects are useful because they do different work.

| Role | Examples | Garden value |
|---|---|---|
| Pollinators | Bees, flies, moths, butterflies, beetles | Move pollen between flowers and improve fruit set |
| Predators | Lady beetles, lacewings, hoverfly larvae, ground beetles | Eat aphids, mites, eggs, larvae, and soft-bodied pests |
| Parasitoids | Small wasps and flies | Lay eggs in or on host insects, reducing pest populations |
| Decomposers | Beetles, springtails, flies, and many soil organisms | Break down residues and support nutrient cycling |

The most useful garden habitat supports more than one role.

## Pollinators

Pollination is not only about honey bees.

Native bees, hoverflies, moths, butterflies, beetles, and other insects all contribute. Different flower shapes support different insects. Small open flowers serve tiny wasps and hoverflies. Tubular flowers serve long-tongued bees and some butterflies. Night-blooming or evening-fragrant plants may support moths.

The practical goal is continuous bloom.

If the garden has flowers in spring but nothing in late summer, insect support drops when pest pressure and crop flowering may still be important.

## Predators and parasitoids

Predators are easy to appreciate when you see them eating pests. Parasitoids are quieter. They may be tiny wasps that depend on small flowers as adults and pest insects as hosts for their young.

Avoid judging the garden only by the number of pests present. A few aphids can support hoverfly larvae, lacewings, lady beetles, and parasitoids. The question is whether pest numbers are increasing faster than the beneficial community can respond.

## Habitat

Insect habitat does not need to be elaborate.

Useful habitat includes:

- flowers with different shapes and bloom times;
- perennial edges;
- mulch and low-disturbance areas;
- some leaf litter where it does not increase disease risk;
- water sources that do not breed mosquitoes;
- reduced broad-spectrum pesticide use.

Herbs are especially useful when allowed to flower. Dill, cilantro, parsley, thyme, mint, and basil can all support insects at different points in the season.

## Pest management without panic

The first response to an insect should be identification, not treatment.

Ask:

1. What insect is present?
2. What life stage is it in?
3. Is there actual damage?
4. Is the plant otherwise healthy?
5. Are predators or parasitoids already present?
6. Is the damage tolerable?

Many interventions kill the helpful insects along with the pest insects. That does not mean gardeners should never intervene. It means the intervention should match the problem.

## Useful insect relationships

| Beneficial insect | Helps with | Support it with |
|---|---|---|
| Lady beetles | Aphids and soft-bodied insects | Diverse plantings and pesticide restraint |
| Lacewings | Aphids, mites, eggs, small caterpillars | Flowers, shelter, and reduced disruption |
| Hoverflies | Aphids as larvae, pollination as adults | Small flowers such as dill, cilantro, alyssum, and parsley |
| Parasitic wasps | Caterpillars, aphids, and other hosts | Tiny flowers and continuous bloom |
| Ground beetles | Slugs, cutworms, and soil-surface pests | Mulched paths, stones, and low-disturbance edges |

## Field notes

When you scout for pests, also scout for helpers. Record the first hoverfly, the first lacewing egg, the first lady beetle larvae, and the first parasitized aphid. A garden with beneficial insects may still have damage, but it has relationships working in its favor.


## Choose what the planting should do

```js
import {decisionWorkbench} from "../../components/garden-decisions.js";
const decisionSources = await FileAttachment("../../data/decision-sources.json").json();
display(decisionWorkbench("companions", {sources: decisionSources, crop: {slug: "beneficial-insects"}}));
```

## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "Are you observing a visitor or a useful interaction?", "observe": "Record flowers visited, predator or prey behavior and crop damage in the same area over time.", "topic": "companions", "cropName": ""}));
```

## Related pages

- [Composting at Home](/content/compost/composting-at-home)
- [Building Healthy Soil](/content/soil/building-healthy-soil)
- [Seasonal Garden Calendar](/content/calendar/seasonal-garden-calendar)

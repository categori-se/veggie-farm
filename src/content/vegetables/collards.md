---
title: "Growing Collards"
description: "A practical cool-season guide to establishing, spacing, and repeatedly harvesting collard greens."
section: "vegetables"
status: "ready"
date: "2026-08-20"
tags: ["collards", "brassica", "cool season", "leaf crop"]
---

# Growing Collards

<figure data-optional-media="images/plants/collards.webp" data-media-alt="A harvested bundle of broad collard leaves with pale green stems."><p>A harvested bundle of broad collard leaves with pale green stems. — optional image not configured.</p></figure>

<section class="plant-stage-gallery" aria-label="Collards in pictures">
<p class="plant-stage-heading"><strong>Collards in pictures</strong> · Select a photo to look closer</p>
<div class="plant-stage-strip">
<figure data-optional-media="images/plants/collards-young.webp" data-media-alt="Young collard plants with upright green leaves, photographed in Kashmir."><p>Young collard plants with upright green leaves, photographed in Kashmir. — optional image not configured.</p></figure>
<figure data-optional-media="images/plants/collards-container.webp" data-media-alt="Broad veined leaves spreading from three young collard plants in a container."><p>Broad veined leaves spreading from three young collard plants in a container. — optional image not configured.</p></figure>
<figure data-optional-media="images/plants/collards-growing.webp" data-media-alt="A collard plant viewed from above, with large outer leaves and smaller central leaves."><p>A collard plant viewed from above, with large outer leaves and smaller central leaves. — optional image not configured.</p></figure>
</div>
</section>

```js
import {enhancePlantGallery} from "../../components/plant-gallery.js";
enhancePlantGallery({invalidation});
```



```js
import {cropGuide} from "../../components/crop-guide.js";
const crop = (await FileAttachment("../../data/vegetables.json").json()).find(d => d.slug === "collards");
const evidence = await FileAttachment("../../data/horticultural-evidence.json").json();
const sources = await FileAttachment("../../data/evidence-sources.json").json();
const decisionSources = await FileAttachment("../../data/decision-sources.json").json();
const cropRules = await FileAttachment("../../data/crop-decision-rules.json").json();
display(cropGuide(crop, evidence, sources, decisionSources, cropRules, {invalidation}));
```

Collards are sturdy brassica greens that reward a longer fall runway than baby salad crops. Once established, a plant can supply outer leaves repeatedly through cool weather.


## Establishment

For a late-summer crop, direct sow into moist soil or transplant young, unstressed seedlings. Keep water consistent during establishment; heat at planting can matter even though the mature crop prefers cool weather.

Give plants airflow and harvest access. Close spacing can work for young leaves, but a full plant needs room and can shade its neighbors.

## Harvest from the bottom up

Take the largest sound outer leaves and leave the growing center intact. Frequent harvest keeps leaves useful and makes caterpillars, aphids, and disease symptoms easier to see.

Like other brassicas, collards can benefit from early row cover where flea beetles or cabbage worms are persistent. Rotate with kale, cabbage, bok choy, radishes, arugula, and turnips in mind.

<div class="field-notes">
  <p>Record transplant or sowing date, first harvest, frost exposure, leaf tenderness, and pest timing. Compare flavor before and after cool nights.</p>
</div>


## Try it in your garden

```js
import {articleDecision} from "../../components/garden-decisions.js";
display(articleDecision({"question": "Is this crop ready for the harvest you want?", "observe": "Record the number and quality of outer leaves harvested while the growing center continues.", "topic": "harvest", "cropName": "Collards"}));
```

## Related pages

- [Mid-August Fall Planting in Massachusetts](/content/seasonal/august-fall-planting-massachusetts)
- [Growing Kale](/content/vegetables/kale)
- [Garden Today](/tools/today)


```js
import {mountOptionalMedia} from "/lib/media/runtimeMedia.js";
mountOptionalMedia();
```

---
title: "Data sources"
description: "How veggie.farm separates reference data, horticultural guidance, environmental estimates, and gardener observations."
toc: true
---

# Data sources

veggie.farm is moving from a library of gardening information toward explainable garden decisions. That means every recommendation should show what came from a source, what was modeled, what the gardener entered, and what veggie.farm calculated.

## A starting point for your own project

Part of the purpose of veggie.farm is to make useful public knowledge easier to discover and connect. Cooperative Extension guidance, geographic data and weather records can become building blocks for an application around a place or question you care about. Open-source web tools and AI assistance help with the assembly; the source still supplies the evidence. Publicly accessible data has its own reuse terms, and availability alone does not make it open-licensed.

Start with one question and a small, permitted dataset. Keep its source, date, units, geographic coverage and unknowns attached as you transform it. Connect it to an observation or a decision, then check the result. That is the learning opportunity here, whether the subject is a garden or another practical problem.

## Four evidence layers

<div class="method-grid">
  <div>
    <strong>Reference data</strong>
    <p>Taxonomy, plant characteristics, hardiness, soil maps, and climate normals. These change slowly and can be versioned.</p>
  </div>
  <div>
    <strong>Horticultural guidance</strong>
    <p>Germination, planting, spacing, maturity, tolerance, and care facts, ideally supported by Cooperative Extension evidence.</p>
  </div>
  <div>
    <strong>Environmental conditions</strong>
    <p>Forecasts, recent rain, estimated soil temperature, soil moisture, and evapotranspiration. These need timestamps and caching.</p>
  </div>
  <div>
    <strong>Garden observations</strong>
    <p>The gardener's beds, amendments, microclimates, planting dates, harvests, problems, and notes. These should never be overwritten by public estimates.</p>
  </div>
</div>

## Where the guidance comes from

The current site now uses four deliberately different collections:

- Twenty-three hand-written crop guides provide the core editorial layer.
- Cultivar listings provide variety names and growing details for comparison. Vendor language is not treated as authoritative horticultural guidance.
- One hundred sixty-five atomic facts from seven Cooperative Extension snapshots provide reviewed planting, spacing, depth, yield, germination, transplant, site, and care benchmarks for all 23 core crops.
- An opt-in National Weather Service adapter provides a timestamped 48-hour temperature, precipitation-probability, and wind forecast for U.S. gardens.

The [Garden Today tool](/tools/today) keeps those roles visible. Regional Extension dates are presented as regional benchmarks, not universal cutoffs. Soil-temperature estimates still come from the cultivar catalog and should be checked against the seed packet. If a user requests a forecast, an NWS near-freeze signal can reduce tender-crop recommendations.

The location lookup is explicit. The browser rounds coordinates to 0.001°, sends them directly to NWS, and does not retain them in the forecast record or browser storage. NWS forecast data is cached only in page memory for 20 minutes.

{{notebook-persistence}} Frost dates, soil overrides and observations are private notebook records. These user observations remain a distinct evidence class; they do not overwrite public or modeled source values.

## Decision aid sources

The [Garden Decision Lab](/tools/garden-decisions) connects observations with a next action. Its sunlight, companion, disease and pruning scenarios use a separate reviewed source registry. A possible relationship is not proof of pest protection, and a symptom checklist is not a disease diagnosis.

```js
const decisionSources = await FileAttachment("../data/decision-sources.json").json();
display(html`<ul>${decisionSources.map(source => html`<li><a href=${source.url}>${source.name}</a> — reviewed ${source.reviewedAt}.</li>`)}</ul>`);
```

The [weather comparison](/tools/season-weather) uses a **fixed NOAA NCEI GHCN-Daily snapshot**, retrieved September 24, 2026: 4,080 station-day records from Boston Logan, Worcester Regional and Pittsfield Municipal airports, requested from January 2023 through September 23, 2026. Returned coverage varies by station. The interface exposes missing values and the latest valid date rather than implying every requested day exists.

Air temperatures are in Fahrenheit. The displayed daily midpoint is `(TMAX + TMIN) / 2`; it is not a measured daily mean. Nonblank NOAA quality flags exclude a value. The comparison averages matching dates from 2023–2025 and computes the overall difference only where all four years have valid readings. This short comparison is not a climate normal, a forecast, or a site-specific planting threshold.

Source references and weather observations are retained so the comparisons can be checked. Use the download in the weather tool to inspect its station values and method. Publisher rights remain with the sources.

Gardening scenarios and illustrative stories are editorial teaching examples, not measured gardener outcomes. Actual observations belong in [Garden Notebook](/tools/my-garden). {{notebook-persistence-detail}}

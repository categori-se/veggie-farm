---
title: "Reusable plant data"
description: "Download attributed plant references, inspect field coverage and trace growing and visualization assumptions."
---

# Reusable plant data

This collection brings together 100 project-contributed planning profiles and 340 recovered OpenFarm records. They are 440 source records, not 440 distinct species: crop, cultivar and species concepts can overlap. Stable source identities let you compare them without silently merging unlike plants.

```js
const catalogFile = FileAttachment("/data/open-plant-catalog.json");
const catalog = await catalogFile.json();
```

```js
const download = document.createElement("a");
download.href = await catalogFile.url();
download.download = "veggie-farm-open-plant-catalog.json";
download.textContent = "Download the complete reusable collection (JSON)";
display(download);
```

[Browse plants](/content/reference/plant-database)

```js
const rows = Object.entries(catalog.coverage.fields).map(([field,value])=>({field,available:value.present,unknown:value.unknown}));
display(Inputs.table(rows, {columns:["field","available","unknown"],height:340}));
```

Coverage means a field is present, not that it has been independently verified. Missing germination windows, numeric maturity timing and rendering stages remain unknown. Plant spacing, row spacing and canopy spread are different measurements. Historical point dimensions are not mature-size ranges.

The Common 100 contribution includes taxonomy, light, soil, water, planting and mature-size ranges, citations, 22 visual archetype definitions and 100 mappings. Its original compilation is under the project's GPL-3.0-only terms; cited third-party pages retain their own terms and are not bundled. Visual mappings use eight schematic renderer forms; they do not establish botanical accuracy or validated seasonal growth.

The [OpenFarm database was released under CC0](https://github.com/openfarmcc/OpenFarm#data-license). Credit goes to OpenFarm's contributors and [thefullnacho's recovery project](https://github.com/thefullnacho/openfarm-crops-rescue). Each record retains the archived source, capture date and data terms. These historical community contributions need review before local gardening decisions. Companion-planting claims are not used as recommendation rules, and the collection is not an identification, edibility or safety reference.

Field evidence distinguishes a directly supplied value, a derived normalization, an illustrative rendering choice and an unknown. General crop profiles do not automatically override cultivar facts. Future reviewed species-to-cultivar inheritance needs explicit identity mappings, value-level sources and recorded overrides; matching a name alone is insufficient.

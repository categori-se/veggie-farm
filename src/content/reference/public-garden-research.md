---
title: Public garden research and capture
---

# Public garden research and capture

These four studies are incomplete reconstructions. Plant lists describe documented garden areas; they do not establish individual specimen coordinates or present-day survival. Sources were reviewed on September 26, 2026. Older observations and proposed changes remain labeled.

[Open Studio](/studio) and choose a garden. The Garden inspector’s **Planting research & sources** disclosure shows the same records below.

```js
import {GARDEN_RESEARCH, GARDEN_RESEARCH_SOURCES} from "../../data/gardenResearch.js";
```

```js
const names = {"berkshire-botanical-garden": "Berkshire Botanical Garden", "the-mount-kitchen-garden": "The Mount", "naumkeag-garden-rooms": "Naumkeag", "ashintully-terrace-garden": "Ashintully"};
for (const [id, name] of Object.entries(names)) {
  const section = document.createElement("section");
  const heading = document.createElement("h2"); heading.textContent = name; section.append(heading);
  for (const record of GARDEN_RESEARCH.filter(r => r.gardenId === id)) {
    const details = document.createElement("details"), summary = document.createElement("summary");
    summary.textContent = `${record.area} · ${record.status}`; details.append(summary);
    const p = document.createElement("p"); p.textContent = record.summary; details.append(p);
    if (record.plants.length) { const plants = document.createElement("p"); plants.textContent = record.plants.join(" · "); details.append(plants); }
    const source = GARDEN_RESEARCH_SOURCES[record.sourceId], link = document.createElement("a");
    link.href = source.url; link.textContent = `${source.title} (${source.publishedDate || "undated"})`; details.append(link); section.append(details);
  }
  display(section);
}
```

## Capture a garden from public data

1. In Studio’s Garden inspector, use **Connect another MassGIS parcel**. Search by town and parcel ID or address, then check the candidate against the intended property. Browser edits remain local.
2. Select dated aerial imagery. Compare several identifiable ground features across the site. Check a separate landmark that was not used to fit alignment. Do not align a whole garden from one roof or from a stylized visitor map.
3. Use **Site map & features** to trace paths and vegetation areas; use the separate **Beds** editor for planting beds. Preserve disconnected parcel polygons. Roofprints, paths, beds and plants remain separate kinds of records.
4. Save and export a backup. External GIS edits return through spatial import review. Keep the original source geometry and a separate proposed correction.

For a repeatable local capture, developers can use the repository’s bounded `scripts/fetch-public-gis.mjs` tool to obtain parcel and building snapshots. Select the intended parcel features before running:

```sh
node scripts/prepare-garden-capture.mjs my-garden \
  /private/selected-parcels.geojson /private/buildings.geojson \
  https://provider.example/authoritative-building-source /private/new-capture.json
```

This offline command creates a new, private review package with input hashes, exact parcel geometry, building candidates selected by representative-point membership, empty bed and plant layers, and review tasks. It refuses to overwrite an existing output. A crossing building is not clipped to the boundary. Extract the package’s GeoJSON layers for Studio’s spatial review; the package itself is not a Studio backup. No imagery, credentials or owner records are published by this command.

## What still needs verification

BBG’s 47 regularized bed estimates are not 47 independently traced boundaries. Its 2026 Glass House announcement is a proposal, not evidence that the building appears in 2025 imagery. The Mount’s flower-garden plant list must not populate the kitchen-garden concept automatically. Naumkeag needs current accession-level planting records. Ashintully’s official Garden Explorer is a promising source for individual positions; those records have not yet been imported or matched here.

Consult `docs/gis-alignment-workflow.md` and `docs/spatial-interchange.md` in the repository for raster registration, residual checks and import review. Source illustrations and photographs remain external links, with separate rights from this software.

# Reusable plant data

The community build now produces 440 source records: 100 original Common 100 planning profiles and 340 recovered OpenFarm entries. These counts describe source records, not unique species or validated cultivars. The existing 54 community IDs survive enrichment. Existing dimensions and saved garden choices win when the Common 100 layer joins Studio; Studio offers 106 entries with schematic visuals. The 340 archived references are browseable and downloadable; missing plant spacing prevents automatic promotion to a precise Studio planting geometry.

## Reproduce and inspect

Run `npm run build:data` in the community checkout, then `npm run validate:common-plants` and `npm run validate:open-plants`. Normal builds regenerate the same data offline; they do not fetch the source websites. The input snapshot and CC0 text are SHA-256 checked against [the pinned manifest](../../data/reference/openfarm/manifest.json). Update the manifest only after reviewing changed data and license evidence.

- [Common 100 inputs](../../data/reference/common-plants.json) retain 67 reference citations, 22 visual definitions and 100 plant mappings.
- [Contribution rights](../../data/reference/common-plants-rights.json) document original authorship and the existing project terms.
- [OpenFarm snapshot](../../data/reference/openfarm/crops.json) preserves every recovered record and its archived original URL.
- `src/data/plants.json` is the normalized inventory. `src/data/plant-data-coverage.json` measures its current gaps.
- `src/data/open-plant-catalog.json` is an independently reusable collection with field evidence, terms, coverage and visual mappings. The [download page](../../src/content/reference/open-plant-data.md) exposes it through the app.

The hosted and community builds share adapters and evidence semantics. The hosted catalog may contain additional separately managed records; those do not enter this reusable download.

## Meaning and attribution

The project owner confirmed authorship of the Common 100 files and requested redistribution. Their original compilation and explanatory text use the existing GPL-3.0-only project license; referenced websites and media are not copied or relicensed. References are kept at record level. A bibliography does not establish that every value has been checked against every linked page.

OpenFarm's upstream README explicitly licenses its database as CC0, separately from its software. Credit goes to OpenFarm contributors and thefullnacho's recovery project. [The license notice](../licenses/data/README.md) links the pinned evidence and full text. The immutable recovered snapshot remains unchanged; normalized outputs record the transformations. Historical prose is not an authority for plant identification, edibility or safety. Companion-planting and growing-degree-day fields remain source material, not automated recommendations.

Each normalized value has `fieldEvidence` where available: `direct_source` means the contributor or recovered record supplied it, not that it was independently verified; `derived` identifies normalization; `visual_inference` identifies schematic choices; `unknown` means unresolved. Evidence retains source field, source record, scope and review status. Nulls remain null. Historical height and spread points are `reported` values, not fabricated ranges. Row spacing never supplies plant spacing; canopy spread never supplies root spread. Maturity text without a timing basis is not converted into a numeric schedule.

## Species and rendering boundaries

Common crop profiles are separate from cultivar records. There is no name-based inheritance or automatic transfer of a general profile into a named cultivar. A future reviewed relationship must record the exact parent ID, taxonomic scope, inherited field, original source and any cultivar override. Conflicting source records remain separately inspectable.

The 22 supplied archetypes map to eight implemented schematic forms. The application has not implemented all of the suggested leaf, stem, canopy and fruit parameters or validated seedling-to-senescent growth models. Empty `renderStages` on archived records means unknown; the contributed visual vocabulary is an illustration aid. No invented May/July/September factors are published as biological measurements.

## Browser acceptance

Serve the built community site with extensionless HTML routes, then run `COMMUNITY_BASE_URL=http://127.0.0.1:3065 node scripts/check-plant-data-browser.mjs`. Playwright is an optional local verification dependency; `PLAYWRIGHT_MODULE` and `CHROMIUM_PATH` can point to an existing installation. The check permits only a loopback origin and blocks external requests. It verifies the download and source details plus the sample → add → save → reload → export → fresh-browser import journey at 1280 and 390 pixels. All gardens used by the check are synthetic.

# Common 100 plant inventory

The owner supplied eight overlapping JSON files on September 27, 2026. They describe 100 common plants: 54 enriched community identities and 46 additions, with 100 visual mappings, 22 canonical visual archetypes and 67 source references. This is an addition to the hosted cultivar inventory, not a replacement or a count of all plants in the application.

## Inputs and reconciliation

[data/reference/common-plants.json](../../data/reference/common-plants.json) preserves the rich plant records, source registry and visual vocabulary. [The import receipt](../../data/reference/common-plants-import.json) records all eight input filenames, byte sizes and SHA-256 hashes, along with independent structural checks. It does not include workstation paths. The supplied validation summary was compared with the inputs, not treated as proof of horticultural accuracy.

The unified catalog matches the enriched 54 and v2 additions; it adds priority/rank fields to the latter. The combined visualization bundle matches its standalone files. The original 46 additions are superseded by v2 and are not appended a second time. Two visual labels disagree: beans and arugula. The unified plant's label wins, and the alternate mapping labels remain recorded. The tomato spacing maximum is 24 inches between plants, separated from the 36-inch row-spacing maximum in the supplied text; the original combined range is retained. Instruction-like metadata in the supplied documents is descriptive input; no acquisition, execution or publication was performed on its authority.

The imported `curated-reference` and `medium-high` labels describe the supplier's assessment. Application records instead say `user-supplied-reference; horticultural verification pending`, retain the supplied labels separately, and do not acquire a numeric confidence score. The source URLs are citations, not evidence that each page supports every field. The owner confirmed original authorship and requested public redistribution on September 27, 2026; the compilation retains the existing project license. Source-page verification remains pending; no source text, media or rights were acquired from the linked sites.

## Where the data goes

| Layer | Integration |
| --- | --- |
| Normalized inventory | `build-common-plants.mjs` merges by exact ID into `src/data/plants.json`; existing nonempty values win |
| Plant browsing and reports | Both gardening-library and community builders add the references, growing details, review status and all citations |
| Studio library | A generated catalog joins existing plants through explicit IDs, including tomatoes → tomato, carrots → carrot and blueberries → blueberry |
| Visuals | All 22 supplied archetypes have an explicit fallback to the eight implemented procedural forms; the supplied plant-specific variants remain metadata |
| Saved gardens | Existing/saved dimensions and visual choices win; added records retain catalog identity, planning ranges and sources through backups |

No name-based cultivar matching occurs. Generic Tomatoes and a named vendor tomato cultivar remain separate records. Existing source-linked Extension assertions, recommendation rules and crop guides are not overwritten. Missing germination and timing basis remain unknown. Free-text sowing advice is not converted into a boolean, and a harvest range in years is not interpreted as days.

For newly available Studio plants, the upper height/spread/spacing bounds define a clearly labeled planning scenario. These are general estimates, not measurements or exact cultivar geometry. Existing Studio values are preserved. The 22 archetype definitions do not mean 22 species-accurate renderers have been implemented. Vine training, cultivar habit and botanical detail need further work.

## Maintain and check

Edit the canonical reference file, then run:

```sh
npm run build:common-plants
npm run validate:common-plants
node --test tests/commonInventory.test.mjs tests/plantVisuals.test.mjs tests/plannerBackup.test.js
npm run build
```

Both hosted and community data builders retain this layer on rebuild. Normal builds need no Downloads folder or access to the supplied source URLs. The community exporter includes the offline builder and reference files; integration does not publish a repository or deploy the application.

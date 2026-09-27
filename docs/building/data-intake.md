# Bringing in data without losing its meaning

A useful gardening record is more than a number. “75 days” needs a start stage, an end stage, crop/cultivar identity and context. A spacing recommendation is not a crown diameter. A habitat indicator is not automatically a cultivation rule. The [staging adapter](../../src/lib/plants/trefleAssertions.js) illustrates that separation; it is an offline normalization component, not a deployed universal plant importer or a source-ranking engine.

## The intake path

| Step | Retain or decide | Review before proceeding |
| --- | --- | --- |
| Identify | Provider, record ID, source URL, version/retrieval date | Is this the intended plant, cultivar and geographic context? |
| Check reuse | Terms/license URL, attribution, redistribution scope | Public access alone does not establish redistribution rights |
| Capture | An allowed small sample or external snapshot reference and checksum | Keep credentials, private properties and restricted media out of Git |
| Normalize | Trait, original value/unit, converted value/unit, timing basis | Keep unknowns; do not make a conversion into a stronger claim |
| Stage | Review status, source identity, competing assertions | Importing a record is not approving a recommendation |
| Connect | Explicit application use and an explanation visible to readers | Can the user distinguish a source claim from a model or observation? |
| Verify | Small fixture, invalid input, missing context, round trip | Does export retain identity and meaning? |

For a new source, propose an entry in the [dataset register](../../data/reference/datasets.json) and a reviewed sample. Name the processing code and expected output. Record its actual terms rather than copying the license of a neighboring dataset. The public repository intentionally excludes acquisition/harvesting implementations, raw source archives and media; place only reviewed, permitted normalized records or synthetic fixtures here. Source links may point outside the repository. They are citations, not permission to bundle the linked material.

## Attribution has several layers

- **Horticultural facts:** the [evidence records](../../src/data/horticultural-evidence.json) identify Extension sources from Maine, Minnesota, Utah State, Maryland and Penn State, together with scope and review metadata. Preserve those references when interpreting a fact. Snapshot paths in the records describe lineage; private raw archives are not included in this public checkout.
- **Geography and weather:** consult the [regional data guide](../architecture/regional-garden-data.md) and [GIS source registry](../../src/lib/spatial/publicGisSources.js). Preserve provider attribution and CRS/units. Interpreted public gardens are incomplete; a property parcel is not a surveyed garden boundary. A regional forecast is not a soil measurement.
- **Community software:** Observable Framework, D3 and Three.js supply major foundations. [Software acknowledgments](../licenses/README.md) and the notice inventories retain authorship and exact-version license evidence. Project code does not replace their rights or credit.
- **Visual assets:** the community core can render procedural shapes. Optional photographs and model files have separate terms and are excluded from Git. Follow [media boundaries](../architecture/media.md); a hosted image is not a reusable asset merely because its URL is visible.
- **AI assistance:** describe the assistance actually used. An assistant's output is not a citation for horticultural advice and does not establish rights to an upstream asset. Retain attributable source evidence and review generated code.

## Checks to run

For the worked example, run the two Node commands in [the walkthrough](README.md). For proposed dataset changes, run `npm run validate:data` and the relevant adapter tests. Before contributing, follow [CONTRIBUTING](../../CONTRIBUTING.md) and `npm run verify:community`. This includes public-source boundaries and the repository's documented source-notice scope; it is not a statement that every possible third-party use has been licensed.

Keep changes small enough that a reviewer can follow one input through its transformation to its use. If two sources disagree, retain both assertions and the disagreement instead of choosing whichever makes a cleaner visualization.

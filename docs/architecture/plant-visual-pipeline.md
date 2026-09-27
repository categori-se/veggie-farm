# Shared plant visuals: six-plant prototype

The full requested scope is preserved in [Plant planning workspace](../product/plant-planning-workspace.md). This prototype is an architectural foundation, not completion of the workspace or its acceptance journey.

## Existing pipeline

`gardenPlanner.js` owns garden/bed/placement records, selection, explicit editing, camera controls, SVG rendering, Three.js scene rebuilding, and the plant library. Catalog plants carry planning height, mature diameter, spacing, colors and a `visual` object (habit, leaf shape/count, density, layers and dimensions). `normalizePlant` supplies visual defaults. `leafInstances` previously supplied both SVG paths and procedural Three.js leaf meshes; height fitting and GLB normalization happen separately. Distant views already select point/swatch representations.

`visiblePlannedPlacements` filters by explicit occupancy dates. `plannedSize` interpolates a gardener-authored size scenario; it deliberately does not infer biological maturity from the planting date. Both main renderers apply the same scenario scale. Sun geometry, camera position, visual detail and rendering are derived state. Optional media is resolved through `gardenModelForPlant`, `modelAppliesToPlant` and the existing approved model catalog; harvested produce models are excluded from growing-plant representations.

The old rendering path has limitations: a conifer can inherit generic broad-leaf geometry, flattened leaf patterns do not communicate woody branching, and several 3D organ dimensions use arbitrary scene units before fitting height. Catalog/model identity and measurement provenance must remain independent of appearance.

## Minimum change implemented

Four modules keep data, interpretation and rendering separate:

- `plantVisualSpec`: explicit catalog-to-archetype association for six core identities, planning width/height/spacing and provenance. Custom plants can opt into a supported `visual.archetype`. Invalid dimensions or unmapped plants retain the existing fallback.
- `plantVisualGeometry`: deterministic normalized organ descriptors, shared by both renderers. Six reusable forms: upright fruiting, low rosette, fine tuft, paired herb, rounded shrub and layered conifer. Organ descriptors have no garden writes or Three.js dependency.
- `plantVisual2d`: top-down projection of those organs, with mature canopy independent from spacing.
- `plantVisual3d`: instanced procedural parts, scaled in inches through the application's unit conversion. A plant needs at most five organ/material batches rather than dozens of separate leaf meshes. This is per-plant instancing, not yet cross-plant batching.

Approved loaded models retain precedence. Without models, the six core plants use the new procedural forms; other plants retain the old renderer. Garden records, dimensions and taxonomic identity are never rewritten. Placement identity seeds stable variation; rotation is applied once in each coordinate system. Existing occupancy/date and authored size scenarios stay authoritative. The same mature footprint remains visible when a size scenario is smaller.

## Evidence and limits

Unit regressions check deterministic variation, immutable records, bounded crown extent, actual transformed vertices, physical height, rotation, two size-scenario dates, and bounded draw batches. Private visual fixtures cover six plants, 2D/overhead/oblique, desktop/narrow layouts, and April/July authored scenarios. The gallery explicitly labels per-card dimensions; cards use different framing and are not a shared-scale comparison.

Browser integration checks must distinguish fixture-driven state setup from user journey acceptance. A scripted fixture can prove synchronized rendering without proving that a novice can find, place, move, duplicate or schedule plants. No such broader claim follows from these fixtures.

## Remaining before six-plant milestone acceptance

- Finish plant inspection and movement/rotation/duplication journeys; introduce duplication and multi-selection where missing.
- Improve near-view silhouettes and review them at real garden scale. Validate spacing, ghost placement, capacity and conflicts interactively.
- Add explicitly labeled illustrative growth stages and a prominent seasonal timeline; present stage assumptions and retain manual scenarios. Current April/July fixtures are authored size interpolation, not automatic growth stages.
- Check placement and save/reload/export behavior with the six-plant fixture; test actual date controls, not only derived rendering.
- Measure responsiveness with 500 placements, trees, structures and imagery on desktop/mobile; add cross-plant batching and LOD as needed.
- Run the requested new-user tomato/lettuce/succession journey before expanding to milestone two.

The broader specification also retains lightweight layers, structural hedges as one record, archetype model resolution, catalog filters, capacity preview, snapping options, and coherent human-scale cameras. No proprietary Esri assets, styles or code were copied or downloaded.

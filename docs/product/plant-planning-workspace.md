# veggie.farm Studio: 2D/3D Plant Planning Workspace

## Objective

Continue developing `studio.veggie.farm` into an intuitive garden-planning workspace in which gardeners can place, arrange, inspect, duplicate, schedule, and compare plants and structural vegetation in synchronized 2D and 3D views.

Use the Esri vegetation examples supplied with this task as **conceptual and interaction references**, particularly the idea that a simple spatial plant record can be rendered as an attractive, recognizable 2D or 3D object whose dimensions and appearance are driven by attributes.

Do **not** copy Esri code, proprietary models, styles, textures, or assets.

The goal is not to reproduce ArcGIS. The goal is to adopt the useful underlying concept:

**plant data → spatial object → attribute-driven visual representation**

The Studio should feel like a garden-design application, not like GIS software.

---

# 1. Preserve the existing data/rendering separation

Keep the current architecture in which the garden record is authoritative and visualization is derived from it.

A plant placement should remain a spatial/data record such as:

* placement ID
* plant/crop ID
* cultivar if known
* garden ID
* bed ID or parcel-space location
* X/Y position
* rotation
* planting date
* optional removal/end date
* planned or actual status
* maturity/growth state
* measured or assumed dimensions
* notes/provenance

The renderer may turn this into:

* an SVG symbol in 2D;
* procedural geometry in 3D;
* an optional GLB model in 3D;
* a seasonal or maturity-state representation.

Changing the 3D model must **never change the botanical or planning record**.

Likewise, camera position, symbol style, model LOD, shadows, textures, or visibility must never alter the underlying planting geometry.

---

# 2. Create a proper Plant Visual Specification

Extend the plant catalog so that every supported plant can declare a reusable visual specification.

Do not hard-code rendering logic individually for tomato, kale, carrot, etc.

Create something conceptually like:

```js
visual: {
  archetype: "upright-fruiting",
  form: "herbaceous",
  crownShape: "irregular",
  leafShape: "compound",
  matureWidthIn: 28,
  matureHeightIn: 56,
  groundFootprintIn: 30,

  colors: {
    foliage: "...",
    stem: "...",
    flower: "...",
    fruit: "..."
  },

  growth: {
    seedling: {...},
    juvenile: {...},
    mature: {...},
    flowering: {...},
    fruiting: {...},
    senescent: {...}
  },

  render: {
    procedural3d: true,
    modelId: null,
    fallbackArchetype: "upright-herb",
    lod: {...}
  }
}
```

Do not treat this exact schema as mandatory if the existing architecture suggests a better design.

The important principle is that the **same plant attributes drive both the 2D and 3D representations.**

---

# 3. Build a reusable vegetation archetype library

Rather than requiring one unique 3D model for every species, create approximately 12–20 reusable plant archetypes.

Initial archetypes should include:

### Annual crops

* upright fruiting plant
* bushy fruiting plant
* climbing/vining plant
* low rosette
* leafy upright
* leafy mound
* root-crop foliage tuft
* fine/frond foliage
* trailing/spreading plant
* compact herb
* tall herb
* flowering companion plant

### Structural/perennial vegetation

* rounded deciduous tree
* spreading deciduous tree
* conical evergreen
* layered conifer
* fruit tree
* rounded shrub
* upright shrub
* hedge
* groundcover
* ornamental grass/perennial mass

The plant catalog can map individual plants onto these archetypes and alter them using attributes.

For example:

**Tomato**

* archetype: upright fruiting
* height: 56"
* width: 28"
* fruit color: red
* irregular foliage density

**Blueberry**

* archetype: rounded woody shrub
* height: 60"
* width: 42"
* multiple stems
* berry accents

**Kale**

* archetype: upright rosette
* height: 24"
* width: 24"
* large lobed leaves

**Carrot**

* archetype: fine foliage tuft
* height: 12"
* width: 5"

**Eastern white pine**

* archetype: layered conifer
* height and crown width derived from plant/tree attributes

This provides visual variety without requiring hundreds of individual model files.

---

# 4. Make 2D plant objects genuinely useful

Do not treat the 2D view as a generic circle-marker map.

Plant symbols should communicate information.

For each plant placement, render:

### Footprint

Show the mature expected canopy/spacing footprint at real-world garden scale.

This is the most important element.

For example, a tomato with a mature 30-inch planning diameter should visibly occupy approximately 30 inches of plan space.

### Botanical silhouette

Inside or over that footprint, display a recognizable simplified top-down plant representation.

Examples:

* tomato → irregular lobed crown
* lettuce → layered rosette
* carrot → fine radial foliage
* blueberry → woody shrub crown
* basil → paired-leaf mound
* conifer → radial/whorled crown
* tree → trunk point plus crown extent

Do not aim for botanical illustration.

Aim for:

**recognizable + attractive + spatially informative**

### Selected-state information

When selected, show:

* plant name;
* variety;
* spacing;
* mature dimensions;
* planting date;
* expected maturity;
* status.

Also show resize/rotate/move handles only where appropriate.

---

# 5. Separate three different spatial concepts visually

Do not collapse these concepts into one circle.

For each plant distinguish:

### Placement point

Where the plant is physically anchored.

### Recommended spacing

Minimum planning distance from neighboring plants.

### Mature canopy/footprint

Approximate physical space occupied at maturity.

These may sometimes be identical, but they are conceptually different.

Use restrained visual treatments such as:

* solid plant silhouette = visible plant;
* light footprint = mature canopy;
* dashed ring = spacing requirement.

Allow spacing overlays to be toggled globally.

This should make overcrowding immediately understandable.

---

# 6. Develop richer procedural 3D plants

Improve the existing procedural vegetation rather than replacing it entirely with downloaded models.

Procedural plants are important because they:

* load quickly;
* work offline;
* scale correctly;
* can respond to plant attributes;
* allow many variations;
* provide a fallback when no GLB model exists.

Create reusable geometry generators for:

* stems;
* branches;
* leaves;
* rosettes;
* conifer tiers;
* shrub masses;
* flowers;
* fruit;
* vines;
* groundcover clusters.

Use deterministic seeds so that the same plant placement retains the same appearance between renders.

Variation should come from controlled parameters such as:

* leaf orientation;
* branch angle;
* crown irregularity;
* foliage density;
* stem count;
* fruit distribution;
* flower distribution;
* height variation.

A bed containing ten tomatoes should therefore look like ten related but non-identical tomato plants.

Avoid excessive randomness.

The scene should remain visually coherent.

---

# 7. Introduce attribute-driven scaling

This is one of the most important requirements.

All vegetation should render using **real-world dimensions**.

Do not allow a lettuce plant, maple tree and tomato to use arbitrary screen-space sizes.

For each object use, where available:

* height;
* mature width;
* crown diameter;
* hedge length;
* hedge width;
* trunk diameter;
* plant spacing.

For plants without measured dimensions use catalog planning dimensions and clearly treat them as planning estimates.

For structural trees, distinguish:

* observed/measured;
* user-entered;
* inferred;
* catalog/default.

Do not silently convert an illustrative default into an observed measurement.

---

# 8. Allow optional high-quality GLB models

Maintain the existing optional model/media architecture.

A plant should resolve its 3D representation in approximately this order:

1. approved plant-specific model;
2. approved archetype model;
3. procedural vegetation archetype;
4. basic fallback geometry.

Studio must therefore remain fully usable even when no external model assets are loaded.

Do not make successful Studio rendering dependent upon a third-party model provider.

---

# 9. Create a Plant Model Catalog

Implement a normalized catalog that maps optional models to plant/archetype requirements.

For example:

```js
{
  id: "crop-tomato-01",
  appliesTo: {
    plantIds: ["tomato"],
    archetypes: ["upright-fruiting"]
  },

  dimensions: {
    nativeHeight: ...,
    nativeWidth: ...
  },

  capabilities: {
    alphaTextures: true,
    seasonalVariants: false,
    animations: false
  },

  license: {...},

  asset: {...}
}
```

Important:

Do not imply that a generic vegetation model is botanically exact.

A generic model may say:

**Illustrative deciduous tree**

It must not become:

**Red maple**

solely because it looks vaguely like one.

Plant identity comes from data, not visual resemblance.

---

# 10. Add growth-stage representations

A major Studio capability should be viewing the garden through time.

Create visual states corresponding approximately to:

* seed / planted location;
* seedling;
* juvenile;
* mature vegetative;
* flowering;
* fruiting;
* harvest;
* senescent/finished.

Not every crop needs every state.

Use plant dates plus plant metadata to derive an **illustrative planning state**.

Do not present these as predictions of exact biological growth.

Label the feature appropriately:

**Season preview**

or:

**Illustrative growth preview**

rather than “plant simulation.”

---

# 11. Connect this directly to the existing time preview

The existing date-preview functionality should become one of Studio's central features.

Provide a clearly visible seasonal timeline:

```text
MAR   APR   MAY   JUN   JUL   AUG   SEP   OCT
```

The user should be able to drag the date.

As the date changes:

* plants not yet planted disappear or appear as planned markers;
* seedlings appear small;
* plants increase toward mature planning size;
* flowering/fruiting accents may appear;
* completed plantings disappear or become faded;
* succession crops appear later in the same space.

The 2D and 3D views must remain synchronized.

This is much more valuable than simply creating a static garden rendering.

---

# 12. Make succession planting visually obvious

Support multiple plantings occupying the same physical space at different times.

Example:

```text
Bed 2

Spinach
Mar 20 ━━━━━ May 18

Tomatoes
            May 20 ━━━━━━━━━ Sep 20

Fall spinach
                            Aug 28 ━━━━━ Oct
```

Selecting a timeline date changes the visible garden.

Also provide:

**Show full-season occupancy**

which can expose conflicts.

Example:

> Tomato planting overlaps the spring spinach plan by 9 days.

This should eventually become one of Studio's strongest planning features.

---

# 13. Build a better Plant Library tray

The plant tool should feel like a design-object library.

Use:

* thumbnail/symbol;
* plant name;
* small mature-size indicator;
* sun requirement;
* plant type;
* planning status.

Allow search and useful filters:

* vegetables
* fruits
* herbs
* flowers
* native plants
* shrubs
* trees
* perennial
* annual
* full sun
* part shade
* planting window
* plant height
* plant footprint

Dragging or clicking a plant should create a ghost preview before placement.

Show its footprint before the user commits the placement.

---

# 14. Improve drag-and-drop planning

A user should be able to:

1. open Plants;
2. select Tomato;
3. see a translucent tomato footprint following the pointer;
4. click/drag into a bed;
5. immediately see spacing relationships;
6. move it again without entering a complex editing mode.

Use snapping carefully.

Potential options:

* free placement;
* spacing snap;
* row snap;
* grid snap;
* bed-edge alignment.

Do not force snapping.

---

# 15. Add multi-select and duplication

Garden planning frequently involves repeated plants.

Allow:

* Shift-select / multi-select;
* box selection where practical;
* duplicate;
* copy;
* delete;
* distribute;
* arrange in row;
* arrange in grid;
* fill bed using spacing recommendation.

For example:

Select Tomato → **Fill row**

or:

Select Lettuce → **Fill bed**

Preview the resulting plant count before applying.

---

# 16. Make beds display plant capacity

When a plant is selected, calculate approximately how many could fit in the active bed under the current spacing method.

Example:

**4 × 8 ft bed**

Tomato
Recommended spacing: 30"

**Approx. capacity: 6 plants**

[Preview arrangement]

Do not imply agronomic precision where layout method changes the answer.

Explain assumptions when necessary.

---

# 17. Add a lightweight layer panel

Borrow the useful GIS concept of layers without exposing GIS complexity.

Possible user-facing layers:

### Garden

* boundary
* imagery

### Structure

* buildings
* paths
* fences
* water

### Growing spaces

* beds
* containers

### Plants

* annual crops
* perennial plants
* canopy

### Planning overlays

* spacing
* shade
* irrigation
* seasonal occupancy

Each gets:

* visibility;
* optionally opacity;
* selection state.

Editing permission and visibility must remain separate.

Do not create a complex ArcGIS-style table of contents.

Keep this compact.

---

# 18. Improve structural vegetation

Trees, shrubs and hedges should visually communicate their planning consequences.

For trees include:

### 2D

* trunk point;
* crown outline;
* optional root-zone planning radius;
* estimated shadow/canopy overlay when that feature is active.

### 3D

* trunk;
* crown;
* height;
* canopy width;
* appropriate archetype.

For hedges:

* allow line or polygon placement;
* generate repeated procedural vegetation along the feature;
* avoid creating hundreds of independent user records merely for rendering.

The hedge remains one planning object.

The renderer creates the repeated vegetation.

---

# 19. Use instancing and LOD for performance

Performance matters.

Do not render hundreds of repeated vegetables as hundreds of expensive independent GLTF scenes if an instanced or procedural approach is possible.

Implement sensible LOD.

Example:

### Far

* simplified crown/object;
* minimal geometry;
* no individual leaves.

### Medium

* recognizable plant form.

### Near

* leaves/fruit/flowers if available.

2D should similarly simplify symbols when zoomed far out.

The garden must remain responsive with approximately:

* 500 crop placements;
* dozens of trees/shrubs;
* several structures;
* imagery enabled.

Test desktop and mobile.

---

# 20. Avoid photorealism as the goal

The goal is **legible garden planning**, not architectural visualization.

Prefer a cohesive stylized-realistic visual language.

Objects should:

* look like plants;
* be pleasant;
* reveal size;
* reveal form;
* remain distinguishable;
* render efficiently.

Do not mix wildly different photorealistic, cartoon and low-poly asset styles.

Procedural vegetation and external models should look reasonably coherent together.

---

# 21. Make 2D and 3D equally legitimate

Do not treat 3D as the “real” mode and 2D as a secondary preview.

2D is likely better for:

* precise placement;
* bed layout;
* spacing;
* rows;
* succession;
* quantity.

3D is better for:

* height;
* canopy;
* massing;
* shade context;
* spatial feel;
* mature appearance.

Changes made in either view should affect the same records and immediately update the other.

---

# 22. Add meaningful view presets

Retain and improve the current camera system.

Provide simple gardener-facing presets:

* Plan
* Overhead 3D
* Garden view
* Eye level

Potential future preset:

* Sun view

Avoid making users manipulate camera pitch and bearing unless they choose advanced controls.

---

# 23. Add useful object inspection

Clicking any plant should show a compact inspector.

### Tomato

Cherokee Purple

**Plan**
Planted May 23
Bed 2
30" spacing

**Size**
30" wide
5 ft mature planning height

**Conditions**
Full sun
Regular water

**Season**
Expected planning window …

Actions:

[Move]
[Duplicate]
[Log observation]
[Remove from plan]

Then optional sections:

**Growing guidance**

**Evidence & sources**

Keep basic editing separate from scientific documentation.

---

# 24. Preserve provenance and horticultural uncertainty

Do not turn visualization into false precision.

Use terminology consistently:

* “mature planning size”
* “illustrative growth state”
* “estimated canopy”
* “catalog spacing”
* “user measurement”

Do not say:

* exact mature size;
* predicted yield;
* simulated growth;

unless the underlying model genuinely supports those claims.

---

# 25. Licensing and external assets

Do not automatically download, redistribute, or commit third-party 3D assets.

For any optional model:

* record creator;
* source URL;
* license;
* license version;
* attribution requirement;
* modification status;
* asset hash;
* date reviewed.

Keep third-party binaries out of the public repository unless redistribution rights are explicitly verified.

The public/community version must continue to work with procedural plant geometry alone.

---

# 26. Architecture

Do not turn `gardenPlanner.js` into an even larger monolith.

As this work proceeds, split functionality into clear modules.

Suggested conceptual modules:

```text
plantVisualCatalog
plantArchetypes
plantGrowthState
plant2DRenderer
plant3DRenderer
plantModelResolver
plantLOD
plantPlacementTools
plantSpacingOverlay
plantSeasonRenderer
vegetationRenderer
```

Adapt names to existing conventions.

Keep:

**data → interpretation → renderer**

separate.

---

# 27. First implementation milestone

Before adding dozens of assets, prove the architecture with six highly differentiated plants:

1. tomato
2. lettuce
3. carrot
4. basil
5. blueberry
6. eastern white pine

They should look recognizably different in BOTH 2D and 3D.

Test:

* placement;
* mature footprint;
* movement;
* rotation where relevant;
* duplication;
* timeline changes;
* 2D/3D synchronization;
* selection;
* mobile performance.

Do not expand the catalog until this feels good.

---

# 28. Second milestone

Add archetype coverage for:

* kale;
* bean/pea vine;
* squash;
* cucumber;
* strawberry;
* onion/allium;
* potato;
* corn;
* flowering companion;
* fruit tree;
* deciduous shade tree;
* evergreen;
* shrub;
* hedge;
* perennial mass.

Reuse archetypes rather than developing every plant independently.

---

# 29. UX acceptance test

A completely new user should be able to do the following without instructions:

1. Create a 4 × 8 bed.
2. Search for tomato.
3. Add six tomato plants.
4. Understand whether they fit.
5. Move them.
6. Add lettuce between/around them.
7. Switch to 3D.
8. Recognize the tomatoes and lettuce.
9. Understand their relative mature sizes.
10. Change the date to early spring.
11. See the seasonal composition change.
12. Add a later crop to the same bed.
13. Save the plan.

If this flow is confusing, simplify the interface before adding more functionality.

---

# 30. Visual quality acceptance test

The finished garden should no longer look like:

> GIS points rendered as generic markers.

Nor should it look like:

> unrelated 3D models scattered on a map.

It should look like:

> **a coherent, data-driven garden plan.**

A gardener viewing the screen should immediately perceive:

* where plants are;
* how large they become;
* what kind of vegetation they represent;
* which plants compete for space;
* how tall the garden becomes;
* how the garden changes over the season.

---

# 31. Product principle

Keep this principle at the center of all implementation decisions:

**The plant object is not decoration. It is a visual expression of the garden data.**

A tomato object is useful because it communicates:

* location;
* spacing;
* width;
* height;
* season;
* growth state;
* botanical form.

The more faithfully 2D and 3D turn that information into an intuitive visual workspace, the more valuable Studio becomes.

---

## Begin by

1. Inspecting the existing `gardenPlanner`, spatial layer model, plant visual properties, optional-media/model resolver, timeline/date-preview code, and navigation architecture.
2. Documenting the current rendering pipeline.
3. Proposing the minimum architectural changes necessary to support the system above.
4. Implementing the six-plant proof of concept before broadening the catalog.
5. Preserving all existing tests and adding rendering/state regression tests.
6. Testing desktop and narrow/mobile layouts.
7. Showing before/after screenshots or automated visual fixtures for the six representative plants in:

   * 2D;
   * overhead 3D;
   * oblique 3D;
   * at least two seasonal dates.

Do not redesign unrelated parts of veggie.farm during this work.

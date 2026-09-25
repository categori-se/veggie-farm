# Garden spatial interchange

Last reviewed: 2026-08-24

The garden planner's portable spatial core is RFC 7946 GeoJSON in CRS84
(longitude, latitude). Spatial interchange is deliberately separate from
canonical promotion: files can move through QGIS, Google Earth, or another
editor without becoming trusted application data merely because they parse.

Implementation:

- `src/lib/spatial/gardenFeatureVocabulary.js` — stable categories, canonical
  layer assignment, allowed geometry, and renderer-neutral style tokens.
- `src/lib/spatial/spatialInterchange.js` — flattened GeoJSON, styled KML,
  derived tree crowns, and review-only GeoJSON/KML import staging.
- `tests/spatialInterchange.test.js` — category, format, provenance, derived
  geometry, and failure-path coverage.

## Category vocabulary

| Category | Canonical layer | Normal geometry | Intended editor group |
| --- | --- | --- | --- |
| `parcel` | `parcels` | polygon | Parcel/reference boundaries |
| `road` | `site` | line or polygon | Roads, drives, and access surfaces |
| `path` | `site` | line or polygon | Walks and trails; maintain connected linework |
| `parking` | `site` | polygon | Parking surfaces |
| `building` | `site` | polygon, provisional point | Buildings, greenhouses, and structures |
| `garden-area` | `site` | point, line, or polygon | Named/semantic garden areas and borders |
| `plot` / `subplot` | `site` | polygon | Spatial hierarchy above individual beds |
| `bed` | `beds` | polygon | Physical or explicitly planned beds |
| `tree` | `site` | point | Observed tree center with crown attributes |
| `vegetation` | `site` | point, line, or polygon | Forest, shrub, and land-cover context |
| `utility` | `site` | point, line, or polygon | Poles, irrigation, drains, and service features |
| `barrier` | `site` | point, line, or polygon | Fences, walls, and gates |
| `water` | `site` | point, line, or polygon | Ponds, streams, wetlands, swales, and ditches |
| `plant` | `plants` | point | Identified placements or qualified observations |
| `other-site` | `site` | any ordinary vector geometry | Unclassified review fallback |

Existing records are not rewritten to adopt this vocabulary. Classification
derives from `kind`, `classification`, `featureType`, `objectType`, and
`collection`, in that order after an explicit `vf_category`. This preserves the
source and provenance fields while giving editor and export code one stable
switch.

## QGIS / GeoJSON export

```js
import {
  gardenToInterchangeFeatureCollection,
  gardenToGeoJsonText
} from "./src/lib/spatial/spatialInterchange.js";

const collection = gardenToInterchangeFeatureCollection(gardenDataset, {
  name: "My garden"
});
const downloadText = gardenToGeoJsonText(gardenDataset);
```

The output is one ordinary FeatureCollection so QGIS can open it directly. It
retains feature IDs and every original property (including `provenance`) and
adds flat fields that are convenient for filtering and categorized symbology:

- `vf_category`, `vf_layer`, and `vf_style_id`
- `vf_canonical` and `vf_derived`
- `vf_stroke`, `vf_fill`, opacity, width, and point-scale hints

The style fields are hints, not substitutes for geometry or provenance. QGIS
project styling can categorize on `vf_category`; saving a GeoJSON copy retains
the fields for re-import.

## Google Earth / KML export

```js
import {gardenToKml} from "./src/lib/spatial/spatialInterchange.js";

const kmlText = gardenToKml(gardenDataset, {
  name: "My garden",
  includeDerivedTreeCrowns: true
});
```

The KML contains native `Style`, `Folder`, `Placemark`, and `ExtendedData`
elements. Google Earth can open the `.kml` file directly. Extended data stores
the original ID, category, layer, canonical/derived flags, provenance JSON, and
the complete property object, allowing an app-produced KML to round-trip
without using placemark names as identity.

Tree centers remain the canonical observations. When a tree point has a
positive `crownDiameterFeet` (or supported alias), the exporter can calculate a
48-segment geographic crown polygon. It is placed in a folder named **Derived
visualization · tree crowns (not canonical)** and is marked:

```text
vf_canonical = false
vf_derived = true
vf_derived_from = <tree point id>
```

The calculation is a local-tangent geographic approximation from the point and diameter.
It is not a surveyed drip line. Shadows are not exported because a defensible
shadow also needs tree height/form, terrain, location, date, and time.

## Review-only import

```js
import {
  stageGeoJsonImport,
  stageKmlImport
} from "./src/lib/spatial/spatialInterchange.js";

const geojsonReview = stageGeoJsonImport(uploadedGeoJsonText, {
  source: {fileName: "edited-in-qgis.geojson"}
});
const kmlReview = stageKmlImport(uploadedKmlText, {
  source: {fileName: "edited-in-google-earth.kml"}
});
```

Both helpers return a `GardenSpatialImportStage` with:

- `reviewOnly: true`
- `promotion.eligible: false`
- a normalized review FeatureCollection
- structured `errors` and `warnings`
- feature/category counts

Staged features set `vf_canonical=false` and `vf_review_only=true`, while
retaining the source file's canonical claim in `vf_source_canonical`. Checks
cover IDs, duplicate IDs, coordinate ranges, closed polygon rings, category ↔
geometry fit, category ↔ layer fit, unknown categories, GeometryCollections,
projected/unsupported CRS declarations, and derived/non-canonical records. A
later curation workflow must let a person
compare staged geometry with current registered imagery and explicitly choose
what to promote, replace, merge, or reject.

KML support is intentionally for `.kml` text at the interchange boundary. The
existing KMZ reader in `kmlToGeoJson.js` can extract `doc.kml` first when a user
uploads a `.kmz` archive.

## Generic map editor integration

The category module is renderer-neutral. A MapLibre/Mapbox GL Draw adapter can
load the staged or canonical FeatureCollection and use `vf_category` to choose
tools and styles. Keep one active edit category at a time, with other layers
visible/selectable but not mutable; roads/paths and other infrastructure should
remain a separate editing operation from bed or plant editing.

The standard Draw event boundary is sufficient for persistence:

1. `draw.create` stages new geometry with the active `vf_category`.
2. `draw.update` stages geometry changes while retaining feature ID and
   provenance.
3. `draw.delete` records an explicit deletion candidate.
4. `draw.selectionchange` drives the matching inspector/card selection.
5. Save/export operates on reviewed application state, never directly on Draw's
   transient hot/cold sources.

Mapbox GL Draw's documented `userProperties: true` option exposes custom
properties to style expressions with a `user_` prefix, so a future style adapter
can categorize on `user_vf_category`. Standard callbacks are not enough for
live per-vertex measurements during drawing; that interaction should be a
focused custom mode rather than part of the persistence contract.

References:

- [Mapbox GL Draw repository](https://github.com/mapbox/mapbox-gl-draw)
- [Mapbox GL Draw API and events](https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/API.md)
- [Custom Draw modes](https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/MODES.md)
- [Live measurement/custom-mode discussion](https://github.com/mapbox/mapbox-gl-draw/issues/808#issuecomment-458337963)

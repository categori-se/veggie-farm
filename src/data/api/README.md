# veggie.farm public data catalog

The versioned `v1` directory is the project-owned, deployable data layer. It is
compiled from cited public sources and checked into the repository so a static
deployment can serve it cheaply through ordinary HTTP and CDN caching.

## Contract

- Garden records and the four canonical spatial layers are RFC 7946 GeoJSON
  features in OGC CRS84 longitude/latitude.
- Non-spatial flower and source records use GeoJSON features with `null`
  geometry, giving every collection one response shape.
- JSON Schema Draft 2020-12 schemas document maintained record shapes; the
  Node test suite enforces cross-record, provenance, and archive invariants.
- Collection paths and `bbox`, `ids`, `limit`, and `offset` semantics follow the
  useful subset of OGC API - Features. This static client adapter does not claim
  full OGC HTTP conformance.
- `src/lib/data/publicCatalogApi.js` supplies collection, item, text, property,
  garden identifier, bbox, and paging queries now. A future server can preserve
  the same function and response contract.

## Canonical garden spatial core

Each mapped garden owns four checked-in FeatureCollections under
`data/spatial/gardens/<garden-id>/`:

- `parcels.geojson` — property/tax-parcel containers (`Polygon` or
  `MultiPolygon`);
- `site.geojson` — the outdoor-space evidence around which a plan is made:
  buildings, continuous paths and roads, parking, utilities, fences, water,
  vegetation, garden sections, and similar context;
- `beds.geojson` — bed, plot, and subplot footprints; and
- `plants.geojson` — observed or planned plant points with a taxon only when the
  evidence supports one.

The files are canonical geographic data. The planner's local-inch geometry,
2D view, and 3D scene are derived editing/rendering views. Every feature has a
stable `id`, `properties.gardenId`, and `properties.layer`; hierarchy is carried
by `parcelId`, `parentId`, and `bedId` where applicable. Provenance and
confidence travel with each feature so a field-observed plant point, an OpenStreetMap
building, a MassGIS parcel, an aerial interpretation, and a user planning proposal are
not presented as equivalent observations.

`npm run build:public-api` validates and aggregates those files into the
queryable `garden-parcels`, `garden-site`, `garden-beds`, and `garden-plants`
collections. A garden directory is published only when all four files are
present, including valid empty FeatureCollections where a layer has no known
features. This prevents a partial import from looking like a complete spatial
inventory. The source FeatureCollections under `data/spatial/sources/` remain
immutable evidence and are never silently promoted into this canonical core.
The supplied Berkshire Botanical Garden KMZ is stricter still: its curation
entry is `canonicalPromotion: "none"`, all comparison layers start hidden, and
none of its vectors or labels are present in the four canonical collections.

## Data ownership boundaries

The checked-in catalog is shared reference data: parcel matches, public source
lineage, curated plant conditions, and redistributable model provenance. Local browser storage contains only a
user's mutable garden workspaces and saved layout versions. Saving or editing a
workspace never silently rewrites the shared catalog.

`npm run build:public-api` compiles the flower and source collection files from
the maintained source modules and aggregates the reviewed per-garden spatial
FeatureCollections. Canonical spatial files are maintained as GeoJSON because
their geometry, semantics, hierarchy, and match confidence require human review.

Garden source metadata is maintained in
`src/data/garden-reference-sources.json`. Garden and GIS calibration records
cite its stable IDs and authoritative URLs; the build fails when a garden uses
an unregistered source or changes its URL independently. Generated source
features retain the registry's summaries, supported fields, rights statement,
and archive policy, and add the gardens that use each source.

Queryable provider metadata for MassGIS and OpenStreetMap is maintained in
`src/data/public-gis-sources.json` and is compiled into the same `sources`
collection. Provider endpoints, bounded-query policy, cache strategy, license,
fitness, and explicit limitations stay in that registry rather than being
copied into each spatial feature. `usedBy` is derived from canonical feature
provenance when a published provider ID is referenced. User-supplied or private
evidence may retain a source ID on geometry without inventing a public URL or
redistribution statement for it.

The `usedBy` relationship contains unique garden IDs; array order is not part of
the API contract. Consumers should compare membership or apply their own display order.

Reference preservation has two boundaries. Publisher files and their SHA-256
manifest live under `data/raw/garden-references/`, outside the deployable site
root. The application uses the project-authored, fragment-addressable fallback
at `src/assets/garden-references/reference-archive.html`, loaded through a
literal `FileAttachment` so Observable copies and fingerprints it. Raw
restricted or unclear publisher files are never linked from the public
fallback. A source may opt into a locally generated WebP preview with explicit
page, dimensions, accessible text, publisher attribution, and rights metadata;
the preview is embedded into the self-contained HTML while the authoritative
upstream URL remains a provenance link. Run `npm run
archive:garden-references` only for an intentional network refresh, or `npm run
archive:garden-references:previews` to regenerate declared previews from the
already preserved source files;
`npm run archive:garden-references:check` and `npm run validate:data` verify the
checked-in archive offline. See `docs/garden-reference-archive.md` for the full
rights, refresh, and runtime contract.

Garden alignment observations and transformation assumptions are maintained in
`data/spatial/calibrations/`. `npm run spatial:align:check` verifies that every
featured garden has a manifest whose origin and revision match this canonical
collection. The procedure and coordinate conventions are documented in
`docs/gis-alignment-workflow.md`.

An alignment revision may also publish a structured `featureInventory`,
`provenance`, and `referenceMapPresentation` inside
`properties.mapping.layoutCalibration`. These fields let clients distinguish
orthophoto-observed footprints from planning proposals, understand which
source supplied semantics versus geometry, and reproduce a source-map display
bearing without rotating canonical CRS84 geometry. The inventory describes
the maintained starter reference; it is not a count of a user's mutable
workspace.

The same build also emits `v1/generated/collections.js`, a browser-bundler view
of the canonical JSON. It is generated, not a second source of truth.

Non-bed site classifications are maintained in
`src/data/siteFeatureCatalog.js`. Its stable types, visibility categories,
GeoJSON geometry capabilities, and map-folio-style legend descriptors are the
shared contract used by Map, 2D, and 3D renderers. Project-owned reference
features live in the canonical per-garden CRS84 files and are aggregated into
the static API collections. User-created or edited workspace features remain
in browser storage until explicitly saved/exported; optional local Point,
LineString, and Polygon geometry is converted to CRS84 on export.

`npm run import:3d-models` refreshes the explicitly allowlisted CC0 GLBs,
verifies their binary glTF headers and compatibility with the studio's local
geometry/material/texture loader, records SHA-256 checksums and model counts,
and rebuilds the catalog. The studio fetches only models used by visible plant
placements and retains procedural plants as its loading and error fallback.
Models remain visual references rather than botanical evidence.

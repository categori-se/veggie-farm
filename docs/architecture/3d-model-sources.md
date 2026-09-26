# 3D model sources and hosting boundary

Reviewed 2026-09-26. These are candidates and integration notes, not imported assets. Model binaries, textures, downloads and acquisition scripts stay outside the source repository. An operator supplies their own licensed media. Community procedural geometry remains available when media is absent.

| Suggested source | What it supplies | Decision |
| --- | --- | --- |
| [Esri Vegetation](https://hub.arcgis.com/content/46512894542b4857b338b95bf1a1b7b6/about) | ArcGIS Style of 63 realistic tree types. Official item metadata has no licenseInfo value. | Useful visual/species reference; not established as a freely redistributable GLB library. Do not assume an ArcGIS style is directly loadable by Studio. |
| [Plants, vegetation and flora collection](https://sketchfab.com/william.sayin/collections/plants-vegetation-and-flora-b957b3c8d829477ebbc63aa73450a314) | A collection with mixed per-model licenses and download availability. | Best candidate here for individual GLB evaluation. Review each author/model, not the collection title. |
| [OpenStreetMap 3D Trees (Thematic)](https://www.arcgis.com/home/item.html?id=f75fef56b2d944fe92ef9f7737b4f953) | Esri-hosted Scene Service with geographic tree features, not a drop-in GLB pack. Item lists Esri Master License Agreement and credits OSM and other contributors. Mature support since December 2024. | Optional future geographic-context adapter, not our core plant-model dependency. The item points to a replacement; assess its own terms and coverage separately. |

Official metadata: [Vegetation item](https://www.arcgis.com/sharing/rest/content/items/46512894542b4857b338b95bf1a1b7b6?f=pjson), [tree service item](https://www.arcgis.com/sharing/rest/content/items/f75fef56b2d944fe92ef9f7737b4f953?f=pjson), [Sketchfab collection API](https://api.sketchfab.com/v3/collections/b957b3c8d829477ebbc63aa73450a314/models). The browser collection page returned 403 during review; its public API supplied model metadata. Only the returned first page was reviewed.

## Shortlist for an operator's asset review

Prioritize structural planting: trees, shrubs, hedges, canopy masses and planted boundaries. Furniture is outside this scope. Tree candidates below take priority; flower packs are secondary references.

The collection API marked these downloadable and CC BY 4.0 at review time. None has been downloaded, converted, performance-tested or deployed by this change.

- [Tree GN — Node_λrt](https://sketchfab.com/3d-models/tree-gn-40da979cb23f492583ec89c4196cff4e): 22,577 faces; generic tree candidate, not verified species identification.
- [Daisy models — LOLIPOP](https://sketchfab.com/3d-models/daisy-models-pack-realistic-optimized-0748471f99f2416a8b66b522c293720f): 17,814 faces for the listed pack.
- [Snowdrop pack — LOLIPOP](https://sketchfab.com/3d-models/snowdrop-pack-lowpoly-gameready-lod-14890248c9374b569a7bc0d497ccdbe0): 8,008 faces for the listed pack.
- [Pine trees — LOLIPOP](https://sketchfab.com/3d-models/pine-trees-pack-lowpoly-game-ready-lods-e1e9c07b8e2e445c943fec660beefba2): 127,813 faces for the pack; select and simplify individual variants before mobile use.

Retain creator, model URL, exact license/version, modifications and asset hash. Display required credits in the operator's media notices; the owner's unrelated private-media agreements do not remove these requirements. Recheck the asset itself before download/deployment.

## Integration path

Use the existing optional model/media catalog rather than putting a vendor SDK into the core. Convert only authorized files to glTF 2.0 binary, validate scale and ground origin, verify texture/alpha support against Studio's loader, and test one model on a mobile scene before adding a pack. Sparse accessors, compression extensions, skins and animation need explicit compatibility review; “GLB” alone does not establish compatibility. Retain a procedural fallback and a small set of reusable variants. A generic mesh is illustrative, not a measurement of plant maturity or sunlight.

Current 3D uses entered tree/building height estimates where available, otherwise illustrative vertical sizes (4 ft shrubs; 20 ft other vegetation; 12 ft buildings). It does not write these defaults into the garden record. Mapped footprints and crown widths remain the spatial basis. Oblique, overhead and low-angle camera presets provide different viewpoints; this is not yet a first-person walkthrough or a photorealistic landscape renderer.

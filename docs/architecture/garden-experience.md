# Illustrative garden planning

Public garden examples combine sourced area-level research with explicitly proposed plantings. Fresh examples include populated beds; saved plans are preserved. In Beds → Seasonal examples & snapshots, **Populate empty example beds** adds proposals without replacing existing plantings. **Add seasonal example beds** creates three new, month-specific design beds. Winter examples may rest unplanted. These are Massachusetts planning prompts, not guaranteed planting dates or records of institutional crops.

Select a bed on the map, then **Plan this bed** in its inspector. All views use the same bed and placement records. Opening an editor panel does not unlock geometry; use **Edit layer** or the inspector’s explicit edit button. Pan, garden changes and tool navigation revoke edit permission.

**Save selected bed snapshot** stores a dated full-plan version with selected-bed metadata, and compares its planting count with the previous snapshot for that bed. Existing saved-version tools load or export the preserved plans. The existing limit is 48 versions: download backups for long-term history. This is not yet a side-by-side historical chart or a photographic record.

The optional illustrative 3D planting is a bounded, deterministic display of plant masses inside mapped vegetation polygons. It avoids known paths and beds, adds no measured specimens to exports, and can be disabled in Garden → Planting research & sources. Species, heights and arrangements are illustrative unless explicitly sourced. Walking remains a camera experience rather than collision-aware terrain simulation.

See `src/content/reference/public-garden-research.md` for all four gardens’ source links and the public-data capture workflow. The offline capture utility preserves source geometry and input hashes in a private review package; it does not automatically publish data or claim survey accuracy.

Plant browsing now uses a fixed-height scrolling result area. Growth forms and overlapping uses are derived in `src/lib/plants/plantTypes.js`; inference is shown with source details and unknown future records stay unclassified. Run `node scripts/audit-plant-types.mjs` to review coverage. Repeated retail combination-plant pack counts are consolidated for planning while original source records remain available.

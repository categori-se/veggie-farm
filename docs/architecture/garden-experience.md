# Illustrative garden planning

Public garden examples combine sourced area-level research with explicitly proposed plantings. Fresh examples include populated beds; saved plans are preserved. In Beds → Seasonal examples & snapshots, **Populate empty example beds** adds proposals without replacing existing plantings. **Add seasonal example beds** creates three new, month-specific design beds. Winter examples may rest unplanted. These are Massachusetts planning prompts, not guaranteed planting dates or records of institutional crops.

While browsing, click a bed on the map or 3D garden to open its planting workspace. When editing bed geometry, selection stays in the layout workspace; **Plan this bed** remains available in the inspector. All views use the same bed and placement records. Opening an editor panel does not unlock geometry; use **Edit layer** or the inspector’s explicit edit button. Pan, garden changes and tool navigation revoke edit permission.

**Save selected bed snapshot** stores a dated full-plan version with selected-bed metadata, and compares its planting count with the previous snapshot for that bed. Existing saved-version tools load or export the preserved plans. The existing limit is 48 versions: download backups for long-term history. This is not yet a side-by-side historical chart or a photographic record.

The optional illustrative 3D planting is a bounded, deterministic display of plant masses inside mapped vegetation polygons. It avoids known paths and beds, adds no measured specimens to exports, and can be disabled in Garden → Planting research & sources. Species, heights and arrangements are illustrative unless explicitly sourced. Walking remains a camera experience rather than collision-aware terrain simulation.

See `src/content/reference/public-garden-research.md` for all four gardens’ source links and the public-data capture workflow. The offline capture utility preserves source geometry and input hashes in a private review package; it does not automatically publish data or claim survey accuracy.

Plant browsing now uses a fixed-height scrolling result area. Growth forms and overlapping uses are derived in `src/lib/plants/plantTypes.js`; inference is shown with source details and unknown future records stay unclassified. Run `node scripts/audit-plant-types.mjs` to review coverage. Repeated retail combination-plant pack counts are consolidated for planning while original source records remain available.


## Workspace journey

**Explore garden** closes tool and inspector panels and keeps navigation locked. **Walk through** lowers the 3D camera to eye level; when leaving a bed it starts beside that bed. W/S or arrow keys move, A/D turn, and the Camera panel provides touch controls. **Plan selected bed** opens a focused planting library and keeps the chosen 2D, 3D or split presentation. Saved bed camera settings are retained. These are views of the same records, not copies of the garden.

Choose a plant and **Add selected** to place it in available space, or drag a library item onto the 2D or 3D bed. Add and drop are explicit creation actions; they do not unlock dragging or removal of existing objects. Use **Edit plants** for those operations. Selecting a library item keeps the library open rather than opening a second inspector. Touch and keyboard users can use Add selected without dragging.

Camera position and orientation ease toward their new vantage point. Switching between world and bed coordinates transforms the camera into the new coordinate frame before movement, avoiding a reversed or unrelated flyover. Reduced-motion preferences disable easing. Initial load and changing gardens fit immediately. The walking surface is flat and has no collision detection; this is a design preview, not a realistic terrain simulator.

This workflow draws on [Sweet Home 3D’s guide](https://www.sweethome3d.com/users-guide/): separate plan/catalog work from aerial and visitor viewpoints. It is an independent implementation, not an embedded Sweet Home 3D application. Further work should prioritize a visible visitor marker on the site plan, reliable landing-point selection, and species-specific model previews before adding more persistent panels.

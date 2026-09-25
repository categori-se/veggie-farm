# Using Garden Planning Studio

Start at [Studio](https://veggie.farm/studio). Choose **Start a practice garden**
for an editable 4 × 8 ft bed without providing an address. Public-garden examples
are incomplete interpretations; their outlines and plant records need checking.

## Choose what you are editing

| Task | Control | What changes |
| --- | --- | --- |
| Inspect parcels, paths, trees or garden areas | **Site attributes** → **Feature collection** | Select a spatial record; source attributes remain visible |
| Rename a feature or add notes | **Apply attributes** | Name and notes only; geometry and camera stay unchanged |
| Find a record on the map | **Locate on garden map** | Garden camera |
| Work inside a planting bed | **Planning beds** → select bed → **Plan this bed** | Active bed and its remembered camera |
| Return to site context | **Garden overview** | Garden view; the bed camera is retained |

Parcel source attributes are read-only. A garden-area polygon belongs to the site
context; it does not automatically become a planting bed. Apply attribute edits
before switching records, or use **Discard attribute edits**.

## Move the view

Use drag to pan and the wheel or zoom buttons to zoom. In 3D, Ctrl-drag or
right-drag adjusts bearing and pitch. Each bed remembers its own camera separately
from the garden. Moving the camera does not move beds or plants. If 3D is unavailable,
use the offered 2D fallback.

## Inspect and refine the site

In the map's **Map settings**, lower **Feature overlay opacity** to inspect the
aerial image beneath the features. At zero opacity, hidden features cannot be
selected. Compare identifiable corners and path junctions; image appearance alone
does not establish surveyed positions.

Select a site feature and choose **Edit map vertices**. Drag a numbered vertex,
or focus it and use arrow keys for one-foot steps (Shift for one-inch steps).
**Apply geometry** saves the edit and retains its previous geometry as provenance.
**Cancel geometry edit** or Escape discards the preview. Shared endpoints move
together only when an explicit connection is recorded. A path's estimated corridor
width changes its displayed width without replacing its centerline.

In **Canopy**, use **Mark existing tree on map** and click the observed center.
The crown ring is calculated from editable axes; the initial size is an unmeasured
estimate. Keep species and height unknown unless you have supporting observations.

## Align a reference image

Open **Align a reference map** and choose a local PNG, JPEG or WebP. Pair at least
three spread-out, non-collinear landmarks between the reference image and aerial
map. Reserve another landmark as a **Separate check (excluded from fit)**.
Numeric source pixels and aerial longitude/latitude are available as alternatives
to clicking. Inspect the fit and check residuals before **Save reference alignment**.
A stylized visitor map can distort different areas even when chosen points fit.

The image stays in the tab. Saved plans retain its identity and alignment controls,
not the image bytes. After reloading, choose the same image to restore the overlay.

## Keep a recoverable copy

Browser-local saves stay in that browser. Use **Backup and restore** →
**Download full planner JSON** before clearing browser data or changing devices.
Full backups preserve garden workspaces, feature edits and cameras, including
local public-demo experiments. Keep these files private if they contain personal
garden locations or notes.

Account saves are separate and explicit. They include your personal gardens and
named versions; public-demo experiments stay in this browser. Restoring an account
copy replaces personal gardens after confirmation while preserving local demos.
Use **Copy to my gardens** when you want a separate personal copy of an example;
renaming or editing the demo alone does not make it eligible for account upload.
A local **Save** does not update an account copy automatically.

**Download collection GeoJSON** exports the selected spatial collection in
longitude/latitude coordinates. It is useful for GIS exchange, but does not replace
a full planner backup. Keep your original reference images separately.

For implementation details, see [data and view boundaries](studio-data-model.md).
Verify these workflows against the version you deploy; contributor browser
checks are described in [CONTRIBUTING](../CONTRIBUTING.md).

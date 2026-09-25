# Studio data and view boundaries

This describes the current implementation, not a stable plugin API. Deployment
acceptance must be checked against the specific released artifact. Keep local planning and full
backup recovery usable independently of the optional account service.

## Garden workspaces and spatial collections

A **garden workspace** is an editable plan, its site context and its view state.
The legacy storage name `state.parcels` holds these workspaces; it does **not**
mean an array of assessor parcel features. `activeParcelId` selects a workspace.
A workspace can contain multiple physical parcel members in
`property.parcel.members`. Preserve this distinction when adding interfaces or
migrations; renaming saved fields requires compatibility handling.

| Collection | Workspace records | Meaning |
| --- | --- | --- |
| `parcels` | `property.parcel.geometry` and `.members` | Geographic site boundaries and provider attributes |
| `site` | `structures` and `vegetation` | Buildings, paths, garden areas and tree observations |
| `beds` | `beds` | Editable planting beds used by the planning views |
| `plants` | `placements`, linked by `bedId` and `plantId` | Individual planned placements |

A garden-area polygon provides site context; it does not automatically become a
planting bed. Likewise, a tree-center Point is distinct from the crown ellipse
calculated from its attributes. Preserve unknown taxon, height and measurement
status rather than assigning defaults the interface would present as observed.

[Spatial conversion](../src/lib/spatial/gardenSpatial.js) derives four GeoJSON
FeatureCollections from the current workspace. Geographic exports use CRS84
longitude/latitude. Garden-local geometry uses inches, with east/south axes;
plant positions belong to their bed's local frame and require its transform.
Use the conversion functions rather than copying local coordinates into GeoJSON.

## Attributes, geometry and navigation

[The collection inspector](../src/components/spatialCollectionInspector.js)
reads the active workspace and delegates changes to the planner. Apply edits
only names and notes; source parcel attributes remain read-only. Geometry editing
uses its own preview and Apply/Cancel flow. Search and selection are inspector
state, not additional copies of the feature data.

“Locate on garden map” fits the garden camera to the record. “Plan this bed”
selects a bed and enters its planning view, switching from map to 2D if needed.
These actions are explicit: changing an attribute must not silently move geometry
or enter another planning scope.

| Camera state | Scope and units | Persistence |
| --- | --- | --- |
| `parcelViewport`, `viewBearing`, `viewPitch` | Garden-local viewport and garden orientation | Per garden workspace |
| `bedCameras[bedId]` | Bed-local viewport, bearing and pitch | Per bed within its garden workspace |

[Bed camera helpers](../src/lib/spatial/bedCamera.js) normalize view state without
changing a bed or its plants. The planner routes 2D pan/zoom and 3D camera controls
to the active scope. Returning to the garden retains the bed camera. Camera
normalization follows bed IDs so a deleted bed cannot leave an active orphan view.

## Saved state and temporary work

The planner captures, normalizes and reapplies workspaces when switching gardens.
Full planner backups preserve those workspaces, including cameras. Spatial
collection export is for geometry and attributes; it is not a replacement for a
full planner backup. The [backup validator](../src/lib/garden/plannerBackup.js)
checks the versioned planner envelope before restoration; workspace normalization
then handles individual records. Local autosave stores workspace state without
regenerating all derived spatial exports after every edit.

Vertex previews live outside saved state until Apply. Reference-map landmark
picks also remain draft until saved. A saved registration contains image identity,
landmarks and fit diagnostics in `property.referenceRegistration`; it contains
no image bytes or blob URL. Reload requires selecting the same image to restore
its overlay. See [registration controls](../src/components/referenceMapInspector.js)
and [the alignment workflow](gis-alignment-workflow.md).

## Updating bundled examples

Canonical spatial collections feed new public-garden workspaces. Historical
migration defaults must remain recognizable so existing user edits survive.
The three BBG roof corrections are explicit canonical-data exceptions with
retained provider geometry; they do not rewrite the old migration defaults.
Source imagery, illustrated-map identity, interpreted geometry and view state
must remain distinguishable in provenance and code.

For changes spanning these boundaries, verify attribute-only edits, geometry
preview/cancel, garden-to-bed navigation, independent cameras, full backup
recovery and preservation of an owner-edited feature. Rendering and a passing
coordinate round trip do not establish surveyed accuracy.

## Public demos and personal gardens

The September 23 local candidate separates the two persistence scopes. The four
stable public demo IDs identify browser-only experiments. They remain editable,
reload locally and appear in full downloadable backups, but account exports
exclude them, their named versions and derived spatial datasets. Duplicate legacy
workspace fields are rebuilt from the personal workspace; obsolete active-bed
controls are omitted. Conflicting named-version identities stop the export and
leave local work intact. The account
service repeats that projection before storage. A demo-only account write is
refused. Restoring personal gardens retains the browser's demo edits and ignores
demo workspaces from older cloud copies. Existing stored revisions are not deleted.
An explicit **Copy to my gardens** creates a separate personal workspace; simply
editing, renaming or saving a version of a demo does not change its scope.

Canonical demo updates come from reviewed repository data and an owner-approved
site release, never from the account-save endpoint. Account ownership comes from
validated sign-in claims; it is not a feature attribute. See
[the shared projection](../src/lib/garden/accountGardens.js).

## Site editing versus planting design

**Site map & features** opens the site editor on the map. Point/line/polygon
geometry, source attributes and reference-map alignment belong here. Established
trees belong to this layer even though they are plants: their observed center,
measured/estimated crown and dated condition describe the site's architecture.
Moving a seasonal crop must not move a tree, path or boundary. Crown and shadow
shapes are derived views, not replacements for the recorded tree point.

**Garden & beds** arranges maintained planting areas; **Plan selected bed** uses
that bed's independent camera. A site-area polygon is not converted to a planting
bed implicitly. Future promotion should be an explicit copy with a source link,
so refining an interpreted garden outline cannot overwrite a user's bed design.
Both layers can be rendered in 3D; 3D representation does not decide ownership,
feature semantics or which editor can mutate a record.

## Seasonal and multi-year planning: next data contract

The current Studio saves named layouts, not a structured multi-year crop ledger.
Do not present those snapshots as planting history. The next bounded extension
should attach a **planting cycle** to a stable bed ID: year, seasonal window,
planned/actual sowing and transplant dates, crop/cultivar references, status,
harvest observations and source-linked condition measurements. Reuse beds across
cycles; retain completed cycles instead of replacing last year's placements.
A perennial planting can span cycles without becoming an architectural site tree.

Recommendations should consume the selected cycle and explicit dated evidence:
bed size, observed light and drainage, reviewed crop spacing and timing, local
climate assumptions, and previous crop families for that bed. Existing
`recommendations/rotationRisk.js`, `seasonalNotebook.js` and horticultural evidence
records provide starting rules. Return the reason, source, applicable date range,
missing inputs and uncertainty with each suggestion. Missing history means
unknown rotation risk, not evidence of a healthy rotation. Canopy geometry alone
does not establish measured hours of sunlight or a yield prediction.

Keep decisions inspectable: gardeners can compare proposed placements, record
what they actually planted and review outcomes next season. No automatic crop
replacement, inferred successful harvests or opaque recommendation score should
rewrite the user's plan. Implement the cycle model and migration tests before
adding a seasonal timeline UI; no new service or plugin framework is needed now.
